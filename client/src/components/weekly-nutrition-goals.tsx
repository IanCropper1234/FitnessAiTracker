import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";
import { format, startOfWeek, addWeeks } from "date-fns";


interface WeeklyNutritionGoal {
  id: number;
  userId: number;
  weekStartDate: string;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  adjustmentReason?: string;
  previousWeight?: number;
  currentWeight?: number;
}

interface UserProfile {
  id: number;
  userId: number;
  height?: number;
  age?: number;
  weight?: number;
  activityLevel?: string;
  fitnessGoal?: string;
}

interface DietPhase {
  id: number;
  userId: number;
  phase: string;
  startDate: string;
  endDate?: string;
  targetWeightChange?: number;
  weeklyWeightChangeTarget?: number;
  isActive: boolean;
}

interface WeeklyNutritionGoalsProps {
  userId: number;
}

export function WeeklyNutritionGoals({ userId }: WeeklyNutritionGoalsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local unit conversion helper
  const convertValue = (value: number, type: 'weight' | 'measurement', fromUnit: 'metric' | 'imperial', toUnit: 'metric' | 'imperial'): number => {
    if (fromUnit === toUnit || !value) return value;
    
    if (type === 'weight') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 2.20462 * 10) / 10; // kg to lbs
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 0.453592 * 10) / 10; // lbs to kg
      }
    }
    return value;
  };
  
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dailyCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    adjustmentReason: "on_track",
    currentWeight: 0,
  });

  // Fetch current week's goal
  const { data: weeklyGoal, isLoading } = useQuery<WeeklyNutritionGoal>({
    queryKey: ["/api/weekly-nutrition-goal", currentWeek.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/weekly-nutrition-goal?weekStartDate=${currentWeek.toISOString()}`);
      return response.json();
    },
  });

  // Fetch user profile for calculations
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`);
      return response.json();
    },
  });

  // Fetch active diet phase
  const { data: activeDietPhase } = useQuery<DietPhase>({
    queryKey: ["/api/diet-phases", "active"],
    queryFn: async () => {
      const response = await fetch(`/api/diet-phases?activeOnly=true`);
      return response.json();
    },
  });

  // Create/update weekly goal mutation
  const saveGoalMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const goalData = {
        userId,
        weekStartDate: currentWeek.toISOString(),
        ...data,
      };
      
      if (weeklyGoal) {
        return apiRequest(`/api/weekly-nutrition-goal/${weeklyGoal.id}`, {
          method: "PUT",
          body: goalData
        });
      } else {
        return apiRequest("/api/weekly-nutrition-goal", {
          method: "POST",
          body: goalData
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-nutrition-goal"] });
      toast({ title: t("Weekly nutrition goals updated successfully") });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: t("Failed to update weekly nutrition goals"), variant: "destructive" });
    },
  });

  // Calculate BMR and TDEE
  const calculateCalories = () => {
    if (!userProfile?.weight || !userProfile?.height || !userProfile?.age) {
      toast({ title: t("Please complete your profile first"), variant: "destructive" });
      return;
    }

    // Mifflin-St Jeor Equation
    const bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5; // Male formula

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    const activityLevel = userProfile.activityLevel as keyof typeof activityMultipliers || "moderately_active";
    const tdee = bmr * activityMultipliers[activityLevel];

    // Adjust based on diet phase
    let adjustedCalories = tdee;
    if (activeDietPhase) {
      switch (activeDietPhase.phase) {
        case "cutting":
          adjustedCalories = tdee - 500; // 1 lb/week deficit
          break;
        case "bulking":
          adjustedCalories = tdee + 300; // Lean bulk surplus
          break;
        case "maintenance":
          adjustedCalories = tdee;
          break;
      }
    }

    // Calculate macros
    const protein = userProfile.weight * 2.2; // 1g per lb
    const fat = (adjustedCalories * 0.25) / 9; // 25% of calories from fat
    const carbs = (adjustedCalories - (protein * 4) - (fat * 9)) / 4;

    setFormData({
      dailyCalories: Math.round(adjustedCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      adjustmentReason: `auto_calculated_${activeDietPhase?.phase || "maintenance"}`,
      currentWeight: userProfile.weight,
    });

    toast({ title: t("Calories calculated based on your profile and goals") });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoalMutation.mutate(formData);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const getAdjustmentBadge = (reason?: string) => {
    if (!reason) return null;
    
    const adjustmentMap = {
      weight_loss_slow: { color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200", icon: TrendingDown, text: "Weight Loss Slow" },
      weight_gain_fast: { color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200", icon: TrendingUp, text: "Weight Gain Fast" },
      on_track: { color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200", icon: Target, text: "On Track" },
      auto_calculated_cutting: { color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200", icon: Calculator, text: "Auto: Cutting" },
      auto_calculated_bulking: { color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200", icon: Calculator, text: "Auto: Bulking" },
      auto_calculated_maintenance: { color: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200", icon: Calculator, text: "Auto: Maintenance" },
    };
    
    const adjustment = adjustmentMap[reason as keyof typeof adjustmentMap];
    if (!adjustment) return null;
    
    const Icon = adjustment.icon;
    return (
      <Badge className={adjustment.color}>
        <Icon className="h-3 w-3 mr-1" />
        {t(adjustment.text)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("Weekly Nutrition Goals")}
        </CardTitle>
        <CardDescription>
          {t("Adaptive macro targets based on progress and diet phase")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            ←
          </Button>
          <div className="text-center">
            <div className="font-medium">
              {format(currentWeek, "MMM d")} - {format(addWeeks(currentWeek, 1), "MMM d, yyyy")}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentWeek, "'Week of' MMM d")}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            →
          </Button>
        </div>

        {/* Current Goals Display */}
        {weeklyGoal && !isEditing ? (
          <div className="space-y-4">
            {/* Goals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{weeklyGoal.dailyCalories}</div>
                <div className="text-sm text-muted-foreground">{t("Calories")}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{weeklyGoal.protein}g</div>
                <div className="text-sm text-muted-foreground">{t("Protein")}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{weeklyGoal.carbs}g</div>
                <div className="text-sm text-muted-foreground">{t("Carbs")}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{weeklyGoal.fat}g</div>
                <div className="text-sm text-muted-foreground">{t("Fat")}</div>
              </div>
            </div>

            {/* Adjustment Reason */}
            {weeklyGoal.adjustmentReason && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("Adjustment reason")}:</span>
                {getAdjustmentBadge(weeklyGoal.adjustmentReason)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                {t("Edit Goals")}
              </Button>
              <Button onClick={calculateCalories} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                {t("Auto Calculate")}
              </Button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyCalories">{t("Daily Calories")}</Label>
                <Input
                  id="dailyCalories"
                  type="number"
                  value={formData.dailyCalories}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyCalories: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeight">{t("Current Weight")} (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: parseFloat(e.target.value) }))}
                  placeholder="kg"
                />
                <p className="text-xs text-gray-500">
                  {formData.currentWeight > 0 && `≈${convertValue(formData.currentWeight, 'weight', 'metric', 'imperial')} lbs`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">{t("Protein (g)")}</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">{t("Carbs (g)")}</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">{t("Fat (g)")}</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.fat}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentReason">{t("Adjustment Reason")}</Label>
              <Select 
                value={formData.adjustmentReason || "on_track"} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, adjustmentReason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select reason for adjustment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_track">{t("On Track")}</SelectItem>
                  <SelectItem value="weight_loss_slow">{t("Weight Loss Too Slow")}</SelectItem>
                  <SelectItem value="weight_gain_fast">{t("Weight Gain Too Fast")}</SelectItem>
                  <SelectItem value="plateau_break">{t("Break Plateau")}</SelectItem>
                  <SelectItem value="lifestyle_change">{t("Lifestyle Change")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saveGoalMutation.isPending}>
                {saveGoalMutation.isPending ? t("Saving...") : t("Save Goals")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                {t("Cancel")}
              </Button>
              <Button type="button" variant="outline" onClick={calculateCalories}>
                <Calculator className="h-4 w-4 mr-2" />
                {t("Auto Calculate")}
              </Button>
            </div>
          </form>
        )}

        {/* No Goals State */}
        {!weeklyGoal && !isEditing && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("No goals set for this week")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("Set up your weekly nutrition goals to enable meal planning")}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsEditing(true)}>
                {t("Set Goals")}
              </Button>
              <Button variant="outline" onClick={calculateCalories}>
                <Calculator className="h-4 w-4 mr-2" />
                {t("Auto Calculate")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}