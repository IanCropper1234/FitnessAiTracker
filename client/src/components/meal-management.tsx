import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Utensils, 
  Save, 
  Loader2, 
  User,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Dumbbell
} from "lucide-react";

interface MealManagementProps {
  userId: number;
}

interface MealTimingPreference {
  id?: number;
  userId: number;
  wakeTime: string;
  sleepTime: string;
  workoutTime?: string;
  workoutDays?: string[];
  mealsPerDay: number;
  preWorkoutMeals: number;
  postWorkoutMeals: number;
}

interface UserProfile {
  dietaryRestrictions?: string[];
  [key: string]: any;
}

const weekDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

const dietaryOptions = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'halal',
  'kosher',
  'keto',
  'paleo',
  'low_carb',
  'low_fat',
  'mediterranean'
];

export function MealManagement({ userId }: MealManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [mealTimingData, setMealTimingData] = useState<MealTimingPreference>({
    userId,
    wakeTime: "07:00",
    sleepTime: "23:00",
    workoutTime: "",
    workoutDays: [],
    mealsPerDay: 4,
    preWorkoutMeals: 1,
    postWorkoutMeals: 1,
  });

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);

  // Fetch existing meal timing preferences
  const { data: mealTimingPreferences, isLoading: mealTimingLoading } = useQuery<MealTimingPreference>({
    queryKey: ["/api/meal-timing", userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch user profile for dietary restrictions
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.profile || data.user;
    },
  });

  // Update state when data loads
  useEffect(() => {
    if (mealTimingPreferences) {
      setMealTimingData({
        userId,
        wakeTime: mealTimingPreferences.wakeTime || '07:00',
        sleepTime: mealTimingPreferences.sleepTime || '23:00',
        workoutTime: mealTimingPreferences.workoutTime || '',
        workoutDays: mealTimingPreferences.workoutDays || [],
        mealsPerDay: mealTimingPreferences.mealsPerDay || 4,
        preWorkoutMeals: mealTimingPreferences.preWorkoutMeals || 1,
        postWorkoutMeals: mealTimingPreferences.postWorkoutMeals || 1
      });
    }
  }, [mealTimingPreferences, userId]);

  useEffect(() => {
    if (userProfile?.dietaryRestrictions) {
      setDietaryRestrictions(userProfile.dietaryRestrictions);
    }
  }, [userProfile]);

  // Meal timing mutation
  const updateMealTimingMutation = useMutation({
    mutationFn: async (data: MealTimingPreference) => {
      return await apiRequest("PUT", "/api/meal-timing", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal timing preferences saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-timing", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal timing preferences",
        variant: "destructive"
      });
    }
  });

  // Dietary restrictions mutation
  const updateDietaryMutation = useMutation({
    mutationFn: async (restrictions: string[]) => {
      return await apiRequest("PUT", "/api/user/profile", { dietaryRestrictions: restrictions });
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Dietary preferences saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save dietary preferences",
        variant: "destructive"
      });
    }
  });

  const handleSaveMealTiming = () => {
    updateMealTimingMutation.mutate(mealTimingData);
  };

  const handleSaveDietaryRestrictions = () => {
    updateDietaryMutation.mutate(dietaryRestrictions);
  };

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    if (checked) {
      setDietaryRestrictions(prev => [...prev, restriction]);
    } else {
      setDietaryRestrictions(prev => prev.filter(r => r !== restriction));
    }
  };

  const isLoading = mealTimingLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <CardTitle>Loading Meal Management...</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Meal Timing
          </TabsTrigger>
          <TabsTrigger value="dietary" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Dietary Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timing" className="space-y-6">
          {/* Basic Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Daily Schedule
              </CardTitle>
              <CardDescription>
                Set your wake time, sleep time, and meal frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wakeTime">Wake Time</Label>
                  <Input
                    id="wakeTime"
                    type="time"
                    value={mealTimingData.wakeTime}
                    onChange={(e) => setMealTimingData(prev => ({ ...prev, wakeTime: e.target.value }))}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepTime">Sleep Time</Label>
                  <Input
                    id="sleepTime"
                    type="time"
                    value={mealTimingData.sleepTime}
                    onChange={(e) => setMealTimingData(prev => ({ ...prev, sleepTime: e.target.value }))}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealsPerDay">Meals Per Day</Label>
                  <Select 
                    value={String(mealTimingData.mealsPerDay)} 
                    onValueChange={(value) => setMealTimingData(prev => ({ ...prev, mealsPerDay: Number(value) }))}
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
            </CardContent>
          </Card>

          {/* Workout Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Workout Schedule
              </CardTitle>
              <CardDescription>
                Optimize meal timing around your workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workoutTime">Workout Time (Optional)</Label>
                <Input
                  id="workoutTime"
                  type="time"
                  value={mealTimingData.workoutTime}
                  onChange={(e) => setMealTimingData(prev => ({ ...prev, workoutTime: e.target.value }))}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-3">
                <Label>Workout Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {weekDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={mealTimingData.workoutDays?.includes(day.value) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMealTimingData(prev => ({
                              ...prev,
                              workoutDays: [...(prev.workoutDays || []), day.value]
                            }));
                          } else {
                            setMealTimingData(prev => ({
                              ...prev,
                              workoutDays: (prev.workoutDays || []).filter(d => d !== day.value)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={day.value} className="text-sm cursor-pointer">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {mealTimingData.workoutTime && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preWorkoutMeals">Pre-Workout Meals</Label>
                    <Select 
                      value={String(mealTimingData.preWorkoutMeals)} 
                      onValueChange={(value) => setMealTimingData(prev => ({ ...prev, preWorkoutMeals: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 meals</SelectItem>
                        <SelectItem value="1">1 meal</SelectItem>
                        <SelectItem value="2">2 meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postWorkoutMeals">Post-Workout Meals</Label>
                    <Select 
                      value={String(mealTimingData.postWorkoutMeals)} 
                      onValueChange={(value) => setMealTimingData(prev => ({ ...prev, postWorkoutMeals: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 meals</SelectItem>
                        <SelectItem value="1">1 meal</SelectItem>
                        <SelectItem value="2">2 meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your meal timing preferences will optimize meal scheduling throughout the app
                  </p>
                </div>
                <Button
                  onClick={handleSaveMealTiming}
                  disabled={updateMealTimingMutation.isPending}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {updateMealTimingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Timing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dietary" className="space-y-6">
          {/* Dietary Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Dietary Restrictions & Preferences
              </CardTitle>
              <CardDescription>
                Select any dietary restrictions or preferences for meal recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dietaryOptions.map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction}
                      checked={dietaryRestrictions.includes(restriction)}
                      onCheckedChange={(checked) => handleDietaryRestrictionChange(restriction, checked as boolean)}
                    />
                    <Label
                      htmlFor={restriction}
                      className="text-sm font-medium text-black dark:text-white capitalize cursor-pointer"
                    >
                      {restriction.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              
              {dietaryRestrictions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Selected Restrictions</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dietaryRestrictions.map((restriction) => (
                      <span
                        key={restriction}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium capitalize"
                      >
                        {restriction.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    These preferences will filter food recommendations and meal suggestions
                  </p>
                </div>
                <Button
                  onClick={handleSaveDietaryRestrictions}
                  disabled={updateDietaryMutation.isPending}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {updateDietaryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}