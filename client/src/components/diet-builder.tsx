import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Settings, Clock, Activity, User } from "lucide-react";
import type { MealTimingPreference } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DietGoal {
  id?: number;
  userId: number;
  tdee: number;
  goal: 'cut' | 'bulk' | 'maintain';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  autoRegulation: boolean;
  weeklyWeightTarget?: number;
}

interface UserProfileResponse {
  user: {
    id: number;
    email: string;
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: string;
    fitnessGoal?: string;
  };
  profile?: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: string;
    fitnessGoal?: string;
  };
}

interface DietBuilderProps {
  userId: number;
}

export function DietBuilder({ userId }: DietBuilderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // UI State
  const [activeTab, setActiveTab] = useState<'diet-goal' | 'meal-timing'>('diet-goal');
  
  // Diet Goal State - Initialize with auto-regulation off until data is available
  const [dietGoal, setDietGoal] = useState<DietGoal>({
    userId,
    tdee: 2000,
    goal: 'maintain',
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFat: 65,
    autoRegulation: false,
    weeklyWeightTarget: 0
  });
  
  // Macro Adjustment State
  const [macroAdjustments, setMacroAdjustments] = useState({
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Fetch user profile for TDEE calculation
  const { data: userProfileResponse } = useQuery<UserProfileResponse>({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  // Get diet goal
  const { data: existingDietGoal } = useQuery<DietGoal>({
    queryKey: ['/api/nutrition/goal', userId],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/goal/${userId}`);
      if (!response.ok) {
        throw new Error('Diet goal not found');
      }
      return response.json();
    }
  });

  // Get meal timing preferences
  const { data: mealTimingPreferences } = useQuery<MealTimingPreference>({
    queryKey: ['/api/user/meal-timing', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/meal-timing/${userId}`);
      if (!response.ok) {
        throw new Error('Meal timing preferences not found');
      }
      return response.json();
    }
  });

  // Initialize diet goal from existing data
  useEffect(() => {
    if (existingDietGoal) {
      setDietGoal(existingDietGoal);
    }
  }, [existingDietGoal]);

  // Save diet goal mutation
  const saveDietGoalMutation = useMutation({
    mutationFn: async (goalData: DietGoal) => {
      const response = await apiRequest("POST", "/api/nutrition/goal", goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diet goal saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/goal'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save diet goal",
        variant: "destructive"
      });
    }
  });

  // Calculate TDEE based on user profile
  const calculateTDEE = () => {
    const profile = userProfileResponse?.profile || userProfileResponse?.user;
    if (!profile?.weight || !profile?.height || !profile?.age) {
      return 2000; // Default fallback
    }

    const weight = typeof profile.weight === 'string' ? parseFloat(profile.weight) : profile.weight;
    const height = typeof profile.height === 'string' ? parseFloat(profile.height) : profile.height;
    const age = typeof profile.age === 'string' ? parseFloat(profile.age) : profile.age;

    // Mifflin-St Jeor Equation (assuming male for now)
    let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    
    // Activity level multiplier
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    };
    
    const multiplier = activityMultipliers[profile.activityLevel || 'moderately_active'] || 1.55;
    return Math.round(bmr * multiplier);
  };

  // Update TDEE when profile changes
  useEffect(() => {
    if (userProfileResponse) {
      const calculatedTDEE = calculateTDEE();
      setDietGoal(prev => ({
        ...prev,
        tdee: calculatedTDEE,
        targetCalories: prev.goal === 'cut' ? calculatedTDEE - 500 :
                       prev.goal === 'bulk' ? calculatedTDEE + 500 :
                       calculatedTDEE
      }));
    }
  }, [userProfileResponse]);

  // Update calories when goal changes
  const handleGoalChange = (newGoal: 'cut' | 'bulk' | 'maintain') => {
    const baseCalories = dietGoal.tdee;
    let targetCalories = baseCalories;
    let weeklyWeightTarget = 0;

    if (newGoal === 'cut') {
      targetCalories = baseCalories - 500;
      weeklyWeightTarget = -0.5; // 0.5 kg per week
    } else if (newGoal === 'bulk') {
      targetCalories = baseCalories + 500;
      weeklyWeightTarget = 0.5; // 0.5 kg per week
    }

    setDietGoal(prev => ({
      ...prev,
      goal: newGoal,
      targetCalories,
      weeklyWeightTarget
    }));
  };

  // Update macros based on adjusted calories
  const handleMacroAdjustment = (macro: 'protein' | 'carbs' | 'fat', adjustment: number) => {
    setMacroAdjustments(prev => ({
      ...prev,
      [macro]: adjustment
    }));

    // Recalculate macros
    const adjustedCalories = dietGoal.targetCalories + (adjustment * (macro === 'protein' || macro === 'carbs' ? 4 : 9));
    const proteinCalories = (existingDietGoal?.targetProtein || 150) * 4;
    const fatCalories = (existingDietGoal?.targetFat || 65) * 9;
    const carbCalories = adjustedCalories - proteinCalories - fatCalories;

    setDietGoal(prev => ({
      ...prev,
      targetCalories: adjustedCalories,
      targetProtein: Math.round((proteinCalories + (macro === 'protein' ? adjustment * 4 : 0)) / 4),
      targetCarbs: Math.round((carbCalories + (macro === 'carbs' ? adjustment * 4 : 0)) / 4),
      targetFat: Math.round((fatCalories + (macro === 'fat' ? adjustment * 9 : 0)) / 9)
    }));
  };

  const handleSaveDietGoal = () => {
    saveDietGoalMutation.mutate(dietGoal);
  };

  return (
    <div className="space-y-6">
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diet-goal" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Diet Goal
          </TabsTrigger>
          <TabsTrigger value="meal-timing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Meal Timing
          </TabsTrigger>
        </TabsList>

        {/* Diet Goal Tab */}
        <TabsContent value="diet-goal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your current stats and activity level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black dark:text-white">Current TDEE</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-lg font-semibold text-black dark:text-white">
                        {Math.round(dietGoal.tdee)} cal
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-black dark:text-white">Weight Goal</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-lg font-semibold text-black dark:text-white capitalize">
                        {dietGoal.weeklyWeightTarget === 0 ? 'Maintain' :
                         dietGoal.weeklyWeightTarget > 0 ? 'Gain' : 'Lose'} Weight
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="goal" className="text-black dark:text-white">Diet Goal</Label>
                  <Select value={dietGoal.goal} onValueChange={handleGoalChange}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cut">Cut (Fat Loss)</SelectItem>
                      <SelectItem value="bulk">Bulk (Muscle Gain)</SelectItem>
                      <SelectItem value="maintain">Maintain Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-regulation" className="text-black dark:text-white">
                    Auto-Regulation
                  </Label>
                  <Switch
                    id="auto-regulation"
                    checked={dietGoal.autoRegulation}
                    onCheckedChange={(checked) => 
                      setDietGoal(prev => ({ ...prev, autoRegulation: checked }))
                    }
                  />
                </div>
                {dietGoal.autoRegulation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your calories will automatically adjust based on weekly progress and adherence.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Macro Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Macro Targets
                </CardTitle>
                <CardDescription>
                  Daily calorie and macronutrient targets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calories" className="text-black dark:text-white">Daily Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={dietGoal.targetCalories}
                    onChange={(e) => setDietGoal(prev => ({ 
                      ...prev, 
                      targetCalories: parseInt(e.target.value) || 0 
                    }))}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="protein" className="text-black dark:text-white">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={Math.round(dietGoal.targetProtein)}
                      onChange={(e) => setDietGoal(prev => ({ 
                        ...prev, 
                        targetProtein: parseInt(e.target.value) || 0 
                      }))}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs" className="text-black dark:text-white">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={Math.round(dietGoal.targetCarbs)}
                      onChange={(e) => setDietGoal(prev => ({ 
                        ...prev, 
                        targetCarbs: parseInt(e.target.value) || 0 
                      }))}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat" className="text-black dark:text-white">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={Math.round(dietGoal.targetFat)}
                      onChange={(e) => setDietGoal(prev => ({ 
                        ...prev, 
                        targetFat: parseInt(e.target.value) || 0 
                      }))}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleSaveDietGoal}
                    disabled={saveDietGoalMutation.isPending}
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    {saveDietGoalMutation.isPending ? "Saving..." : "Save Diet Goal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Meal Timing Tab */}
        <TabsContent value="meal-timing" className="space-y-6">
          {!mealTimingPreferences ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Set Up Meal Timing
                </CardTitle>
                <CardDescription>
                  Configure your meal schedule in Profile settings first
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setLocation('/profile')}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Profile Settings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Renaissance Periodization Meal Timing
                  </CardTitle>
                  <CardDescription>
                    Advanced meal timing optimization using Renaissance Periodization methodology
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nutrient Timing Principles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h4 className="font-medium text-orange-900 dark:text-orange-100">Pre-Workout</h4>
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        <div>• Higher carbs for energy</div>
                        <div>• Moderate protein</div>
                        <div>• Lower fat for digestion</div>
                        <div>• Timing: 1-2 hours before</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Post-Workout</h4>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <div>• High protein for recovery</div>
                        <div>• Moderate carbs for glycogen</div>
                        <div>• Lower fat initially</div>
                        <div>• Timing: Within 1-2 hours</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Regular Meals</h4>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <div>• Balanced macro distribution</div>
                        <div>• Higher fat for satiety</div>
                        <div>• Steady protein throughout</div>
                        <div>• Consistent timing</div>
                      </div>
                    </div>
                  </div>

                  {/* Timing Configuration Summary */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-black dark:text-white mb-3">Current Configuration</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.wakeTime}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Wake Time</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.sleepTime}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Sleep Time</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.mealsPerDay}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Meals/Day</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">
                          {mealTimingPreferences.workoutDays?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Workout Days</div>
                      </div>
                    </div>
                  </div>
                  
                  {mealTimingPreferences.workoutTime && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Activity className="w-4 h-4" />
                        <span className="font-medium">Workout: {mealTimingPreferences.workoutTime}</span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {mealTimingPreferences.preWorkoutMeals} pre-workout meal(s) • {mealTimingPreferences.postWorkoutMeals} post-workout meal(s)
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => setLocation('/profile')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Adjust Timing Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}