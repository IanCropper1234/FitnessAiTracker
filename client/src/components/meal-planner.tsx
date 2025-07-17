import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Clock, Target, Plus, Search, Calendar } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

interface FoodCategory {
  id: number;
  name: string;
  macroType: string;
  description: string;
}

interface FoodItem {
  id: number;
  name: string;
  categoryId: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingUnit: string;
}

interface MealPlan {
  id: number;
  userId: number;
  date: string;
  mealNumber: number;
  scheduledTime: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  isPreWorkout: boolean;
  isPostWorkout: boolean;
}

interface WeeklyNutritionGoal {
  id: number;
  userId: number;
  weekStartDate: string;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  adjustmentReason?: string;
}

interface MealTimingPreference {
  id: number;
  userId: number;
  wakeTime: string;
  sleepTime: string;
  workoutTime?: string;
  workoutDays: string[];
  mealsPerDay: number;
  preWorkoutMeals: number;
  postWorkoutMeals: number;
}

interface MealPlannerProps {
  userId: number;
}

export function MealPlanner({ userId }: MealPlannerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch food categories
  const { data: categories = [] } = useQuery<FoodCategory[]>({
    queryKey: ["/api/food/categories"],
  });

  // Fetch food items based on search/category
  const { data: foodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food/items", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      const response = await fetch(`/api/food/items?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch current day's meal plans
  const { data: mealPlans = [], isError: mealPlansError } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans", userId, selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans/${userId}?date=${selectedDate.toISOString()}`);
      if (!response.ok) {
        console.error('Meal plans API error:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch current week's nutrition goal
  const { data: weeklyGoal } = useQuery<WeeklyNutritionGoal>({
    queryKey: ["/api/weekly-nutrition-goal", userId],
    queryFn: async () => {
      const response = await fetch(`/api/weekly-nutrition-goal/${userId}`);
      return response.json();
    },
  });

  // Fetch meal timing preferences
  const { data: mealTiming } = useQuery<MealTimingPreference>({
    queryKey: ["/api/meal-timing", userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing/${userId}`);
      return response.json();
    },
  });

  // Create meal plan mutation
  const createMealPlan = useMutation({
    mutationFn: (mealPlan: Partial<MealPlan>) => 
      apiRequest("/api/meal-plans", { method: "POST", body: mealPlan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: t("Meal plan created successfully") });
    },
    onError: () => {
      toast({ title: t("Failed to create meal plan"), variant: "destructive" });
    },
  });

  // Auto-generate meal timing based on preferences
  const generateMealTiming = () => {
    if (!mealTiming) return [];
    
    const meals = [];
    const mealsPerDay = mealTiming.mealsPerDay;
    const wakeHour = parseInt(mealTiming.wakeTime.split(':')[0]);
    const sleepHour = parseInt(mealTiming.sleepTime.split(':')[0]);
    
    // Calculate meal intervals
    const awakeHours = sleepHour > wakeHour ? sleepHour - wakeHour : (24 - wakeHour) + sleepHour;
    const mealInterval = Math.floor(awakeHours / mealsPerDay);
    
    for (let i = 0; i < mealsPerDay; i++) {
      const mealHour = (wakeHour + (i * mealInterval)) % 24;
      const scheduledTime = `${mealHour.toString().padStart(2, '0')}:00`;
      
      meals.push({
        mealNumber: i + 1,
        scheduledTime,
        isPreWorkout: false,
        isPostWorkout: false,
      });
    }
    
    // Mark pre/post workout meals if workout time is set
    if (mealTiming.workoutTime) {
      const workoutHour = parseInt(mealTiming.workoutTime.split(':')[0]);
      meals.forEach((meal, index) => {
        const mealHour = parseInt(meal.scheduledTime.split(':')[0]);
        
        // Pre-workout meal (within 2 hours before workout)
        if (mealHour >= workoutHour - 2 && mealHour < workoutHour) {
          meal.isPreWorkout = true;
        }
        
        // Post-workout meal (within 2 hours after workout)
        if (mealHour >= workoutHour && mealHour <= workoutHour + 2) {
          meal.isPostWorkout = true;
        }
      });
    }
    
    return meals;
  };

  // Calculate macro distribution per meal
  const calculateMealMacros = (mealNumber: number, totalMeals: number) => {
    if (!weeklyGoal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const baseCalories = Math.floor(weeklyGoal.dailyCalories / totalMeals);
    const baseProtein = Math.floor(weeklyGoal.protein / totalMeals);
    
    // Distribute carbs based on workout timing
    let carbMultiplier = 1;
    const mealTiming = generateMealTiming();
    const currentMeal = mealTiming[mealNumber - 1];
    
    if (currentMeal?.isPreWorkout) carbMultiplier = 1.3;
    if (currentMeal?.isPostWorkout) carbMultiplier = 1.5;
    
    return {
      calories: baseCalories,
      protein: baseProtein,
      carbs: Math.floor((weeklyGoal.carbs / totalMeals) * carbMultiplier),
      fat: Math.floor(weeklyGoal.fat / totalMeals),
    };
  };

  // Generate daily meal plan
  const generateDailyMealPlan = () => {
    if (!mealTiming || !weeklyGoal) {
      toast({ title: t("Please set up meal timing preferences first"), variant: "destructive" });
      return;
    }
    
    const meals = generateMealTiming();
    
    meals.forEach((meal) => {
      const macros = calculateMealMacros(meal.mealNumber, meals.length);
      
      createMealPlan.mutate({
        userId,
        date: selectedDate.toISOString(),
        mealNumber: meal.mealNumber,
        scheduledTime: `${selectedDate.toISOString().split('T')[0]}T${meal.scheduledTime}:00`,
        targetCalories: macros.calories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        isPreWorkout: meal.isPreWorkout,
        isPostWorkout: meal.isPostWorkout,
      });
    });
  };

  const getMacroTypeColor = (macroType: string) => {
    switch (macroType) {
      case "protein": return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "carbs": return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "fat": return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "vegetables": return "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("RP Diet Coach")}</h2>
          <p className="text-muted-foreground">{t("Intelligent meal planning with macro timing")}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-auto"
          />
        </div>
      </div>

      {/* Weekly Nutrition Goal Summary */}
      {weeklyGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("Weekly Nutrition Goals")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{weeklyGoal.dailyCalories}</div>
                <div className="text-sm text-muted-foreground">{t("Calories")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weeklyGoal.protein}g</div>
                <div className="text-sm text-muted-foreground">{t("Protein")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{weeklyGoal.carbs}g</div>
                <div className="text-sm text-muted-foreground">{t("Carbs")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{weeklyGoal.fat}g</div>
                <div className="text-sm text-muted-foreground">{t("Fat")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Plans */}
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t("Daily Meal Plan")}</h3>
          <Button onClick={generateDailyMealPlan} disabled={!mealTiming || !weeklyGoal}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Generate Meal Plan")}
          </Button>
        </div>

        {!Array.isArray(mealPlans) || mealPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{t("No meal plan for this date")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("Generate a meal plan based on your nutrition goals and timing preferences")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {Array.isArray(mealPlans) && mealPlans.map((meal) => (
              <Card key={meal.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedMeal(meal.mealNumber)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {t("Meal")} {meal.mealNumber} - {format(new Date(meal.scheduledTime), "HH:mm")}
                        </span>
                        {meal.isPreWorkout && (
                          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                            {t("Pre-Workout")}
                          </Badge>
                        )}
                        {meal.isPostWorkout && (
                          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            {t("Post-Workout")}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("Calories")}: </span>
                          <span className="font-medium">{meal.targetCalories}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("Protein")}: </span>
                          <span className="font-medium text-blue-600">{meal.targetProtein}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("Carbs")}: </span>
                          <span className="font-medium text-green-600">{meal.targetCarbs}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("Fat")}: </span>
                          <span className="font-medium text-yellow-600">{meal.targetFat}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Food Database Browser */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Food Database")}</CardTitle>
          <CardDescription>
            {t("Browse foods by category and add them to your meal plan")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("Search foods...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("All categories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All categories")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Food Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                className={`cursor-pointer ${getMacroTypeColor(category.macroType)}`}
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Food Items */}
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {foodItems.map((item) => (
              <div key={item.id} 
                   className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.servingSize}{item.servingUnit} - {item.calories} cal, {item.protein}g protein
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}