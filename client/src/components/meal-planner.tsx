import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, Clock, Plus, Edit, Trash2, Save, Target, 
  Utensils, Timer, Activity, Moon, Sun, ChefHat,
  CalendarDays, Settings, Zap, Play, Pause
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
  mealName?: string;
  foods?: FoodItem[];
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

interface MealTimingPreference {
  id?: number;
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
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'daily-plan' | 'meal-timing' | 'templates'>('daily-plan');
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [isEditingTiming, setIsEditingTiming] = useState(false);
  
  // Meal timing preferences state
  const [mealTiming, setMealTiming] = useState<MealTimingPreference>({
    userId,
    wakeTime: "07:00",
    sleepTime: "23:00",
    workoutTime: "18:00",
    workoutDays: ["monday", "wednesday", "friday"],
    mealsPerDay: 4,
    preWorkoutMeals: 1,
    postWorkoutMeals: 1
  });

  // Fetch meal plans for selected date
  const { data: mealPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/meal-plans', userId, selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/meal-plans/${userId}?date=${selectedDate}`);
      return response || [];
    }
  });

  // Fetch meal timing preferences
  const { data: timingPrefs } = useQuery({
    queryKey: ['/api/meal-timing', userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/meal-timing/${userId}`);
      return response;
    }
  });

  // Fetch diet goals for template generation
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/diet-goals/${userId}`);
      return response;
    }
  });

  // Update meal timing preferences
  const updateTimingMutation = useMutation({
    mutationFn: async (preferences: Partial<MealTimingPreference>) => {
      return await apiRequest("PUT", `/api/meal-timing/${userId}`, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-timing', userId] });
      toast({
        title: "Success",
        description: "Meal timing preferences updated successfully"
      });
      setIsEditingTiming(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal timing preferences",
        variant: "destructive"
      });
    }
  });

  // Generate meal plan template
  const generateTemplateMutation = useMutation({
    mutationFn: async (data: { userId: number; date: string; isWorkoutDay: boolean }) => {
      return await apiRequest("POST", "/api/meal-plans/generate-template", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', userId] });
      toast({
        title: "Success",
        description: "Meal plan template generated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan template",
        variant: "destructive"
      });
    }
  });

  // Update meal plan
  const updateMealMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<MealPlan> }) => {
      return await apiRequest("PUT", `/api/meal-plans/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', userId] });
      toast({
        title: "Success",
        description: "Meal plan updated successfully"
      });
      setEditingMeal(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal plan",
        variant: "destructive"
      });
    }
  });

  // Delete meal plan
  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/meal-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', userId] });
      toast({
        title: "Success",
        description: "Meal plan deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan",
        variant: "destructive"
      });
    }
  });

  // Initialize meal timing from fetched data
  useEffect(() => {
    if (timingPrefs) {
      setMealTiming(timingPrefs);
    }
  }, [timingPrefs]);

  const handleGenerateTemplate = () => {
    const isWorkoutDay = mealTiming.workoutDays.includes(
      new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    );
    
    generateTemplateMutation.mutate({
      userId,
      date: selectedDate,
      isWorkoutDay
    });
  };

  const handleUpdateMeal = (updates: Partial<MealPlan>) => {
    if (editingMeal) {
      updateMealMutation.mutate({
        id: editingMeal.id,
        updates
      });
    }
  };

  const handleSaveTiming = () => {
    updateTimingMutation.mutate(mealTiming);
  };

  const getMealIcon = (mealNumber: number, isPreWorkout: boolean, isPostWorkout: boolean) => {
    if (isPreWorkout) return <Zap className="w-4 h-4 text-yellow-500" />;
    if (isPostWorkout) return <Activity className="w-4 h-4 text-green-500" />;
    
    switch (mealNumber) {
      case 1: return <Sun className="w-4 h-4" />;
      case 2: return <ChefHat className="w-4 h-4" />;
      case 3: return <Utensils className="w-4 h-4" />;
      case 4: return <Moon className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const getMealTime = (scheduledTime: string) => {
    return new Date(scheduledTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMacros = (calories: number, protein: number, carbs: number, fat: number) => {
    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    };
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meal Planner</h2>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button 
            onClick={handleGenerateTemplate}
            disabled={generateTemplateMutation.isPending}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {generateTemplateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-black mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Generate Template
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily-plan">Daily Plan</TabsTrigger>
          <TabsTrigger value="meal-timing">Meal Timing</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-plan" className="space-y-4">
          <div className="grid gap-4">
            {mealPlans && mealPlans.length > 0 ? (
              mealPlans.map((meal: MealPlan) => (
                <Card key={meal.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMealIcon(meal.mealNumber, meal.isPreWorkout, meal.isPostWorkout)}
                        <CardTitle className="text-lg">
                          Meal {meal.mealNumber}
                          {meal.isPreWorkout && <Badge variant="secondary" className="ml-2">Pre-Workout</Badge>}
                          {meal.isPostWorkout && <Badge variant="secondary" className="ml-2">Post-Workout</Badge>}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getMealTime(meal.scheduledTime)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMeal(meal)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMealMutation.mutate(meal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatMacros(meal.targetCalories, meal.targetProtein, meal.targetCarbs, meal.targetFat).calories}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatMacros(meal.targetCalories, meal.targetProtein, meal.targetCarbs, meal.targetFat).protein}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {formatMacros(meal.targetCalories, meal.targetProtein, meal.targetCarbs, meal.targetFat).carbs}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatMacros(meal.targetCalories, meal.targetProtein, meal.targetCarbs, meal.targetFat).fat}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <ChefHat className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Meal Plan for This Date</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Generate a meal plan template based on your timing preferences and diet goals.
                  </p>
                  <Button 
                    onClick={handleGenerateTemplate}
                    disabled={generateTemplateMutation.isPending}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="meal-timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meal Timing Preferences</CardTitle>
              <CardDescription>
                Set your daily schedule and workout timing to optimize meal distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wake-time">Wake Time</Label>
                  <Input
                    id="wake-time"
                    type="time"
                    value={mealTiming.wakeTime}
                    onChange={(e) => setMealTiming({ ...mealTiming, wakeTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sleep-time">Sleep Time</Label>
                  <Input
                    id="sleep-time"
                    type="time"
                    value={mealTiming.sleepTime}
                    onChange={(e) => setMealTiming({ ...mealTiming, sleepTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workout-time">Workout Time</Label>
                  <Input
                    id="workout-time"
                    type="time"
                    value={mealTiming.workoutTime || "18:00"}
                    onChange={(e) => setMealTiming({ ...mealTiming, workoutTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="meals-per-day">Meals Per Day</Label>
                  <Select 
                    value={mealTiming.mealsPerDay.toString()} 
                    onValueChange={(value) => setMealTiming({ ...mealTiming, mealsPerDay: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meals</SelectItem>
                      <SelectItem value="4">4 meals</SelectItem>
                      <SelectItem value="5">5 meals</SelectItem>
                      <SelectItem value="6">6 meals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Workout Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Switch
                        id={day}
                        checked={mealTiming.workoutDays.includes(day)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMealTiming({
                              ...mealTiming,
                              workoutDays: [...mealTiming.workoutDays, day]
                            });
                          } else {
                            setMealTiming({
                              ...mealTiming,
                              workoutDays: mealTiming.workoutDays.filter(d => d !== day)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={day} className="text-sm capitalize">{day.slice(0, 3)}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSaveTiming}
                disabled={updateTimingMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {updateTimingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-black mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meal Plan Templates</CardTitle>
              <CardDescription>
                Pre-configured meal plans for different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Standard Day Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Even macro distribution across all meals
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Workout Day Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optimized for training days with pre/post workout meals
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Rest Day Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lower carb distribution for non-training days
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Meal {editingMeal.mealNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scheduled-time">Scheduled Time</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={new Date(editingMeal.scheduledTime).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  onChange={(e) => {
                    const newTime = new Date(editingMeal.scheduledTime);
                    const [hours, minutes] = e.target.value.split(':');
                    newTime.setHours(parseInt(hours), parseInt(minutes));
                    setEditingMeal({ ...editingMeal, scheduledTime: newTime.toISOString() });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-calories">Target Calories</Label>
                  <Input
                    id="target-calories"
                    type="number"
                    value={editingMeal.targetCalories}
                    onChange={(e) => setEditingMeal({ ...editingMeal, targetCalories: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="target-protein">Target Protein (g)</Label>
                  <Input
                    id="target-protein"
                    type="number"
                    step="0.1"
                    value={editingMeal.targetProtein}
                    onChange={(e) => setEditingMeal({ ...editingMeal, targetProtein: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-carbs">Target Carbs (g)</Label>
                  <Input
                    id="target-carbs"
                    type="number"
                    step="0.1"
                    value={editingMeal.targetCarbs}
                    onChange={(e) => setEditingMeal({ ...editingMeal, targetCarbs: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="target-fat">Target Fat (g)</Label>
                  <Input
                    id="target-fat"
                    type="number"
                    step="0.1"
                    value={editingMeal.targetFat}
                    onChange={(e) => setEditingMeal({ ...editingMeal, targetFat: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingMeal(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateMeal(editingMeal)}
                  disabled={updateMealMutation.isPending}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {updateMealMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-black mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}