import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Save, Loader2, Settings, Activity, Target, Utensils, Clock, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MealTimingPreference, InsertMealTimingPreference } from "@shared/schema";

interface UserProfileData {
  userId: number;
  age?: number;
  weight?: string;
  height?: string;
  activityLevel?: string;
  fitnessGoal?: string;
  dietaryRestrictions?: string[];
}

interface MealTimingData {
  userId: number;
  wakeTime: string;
  sleepTime: string;
  workoutTime?: string;
  workoutDays: string[];
  mealsPerDay: number;
  preWorkoutMeals: number;
  postWorkoutMeals: number;
}

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState<UserProfileData>({
    userId: userId,
    age: undefined,
    weight: '',
    height: '',
    activityLevel: '',
    fitnessGoal: '',
    dietaryRestrictions: []
  });

  const [mealTimingData, setMealTimingData] = useState<MealTimingData>({
    userId: userId,
    wakeTime: '07:00',
    sleepTime: '23:00',
    workoutTime: '',
    workoutDays: [],
    mealsPerDay: 4,
    preWorkoutMeals: 1,
    postWorkoutMeals: 1
  });

  // Fetch current user profile
  const { data: userProfileResponse, isLoading } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  // Fetch meal timing preferences
  const { data: mealTimingResponse } = useQuery({
    queryKey: ['/api/meal-timing', userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Update profile data when user profile loads
  useEffect(() => {
    if (userProfileResponse?.profile || userProfileResponse?.user) {
      const profile = userProfileResponse.profile || userProfileResponse.user;
      setProfileData({
        userId: userId,
        age: profile.age || undefined,
        weight: profile.weight ? String(profile.weight) : '',
        height: profile.height ? String(profile.height) : '',
        activityLevel: profile.activityLevel || '',
        fitnessGoal: profile.fitnessGoal || '',
        dietaryRestrictions: profile.dietaryRestrictions || []
      });
    }
  }, [userProfileResponse]);

  // Update meal timing data when preferences load
  useEffect(() => {
    if (mealTimingResponse) {
      setMealTimingData({
        userId: userId,
        wakeTime: mealTimingResponse.wakeTime || '07:00',
        sleepTime: mealTimingResponse.sleepTime || '23:00',
        workoutTime: mealTimingResponse.workoutTime || '',
        workoutDays: mealTimingResponse.workoutDays || [],
        mealsPerDay: mealTimingResponse.mealsPerDay || 4,
        preWorkoutMeals: mealTimingResponse.preWorkoutMeals || 1,
        postWorkoutMeals: mealTimingResponse.postWorkoutMeals || 1
      });
    }
  }, [mealTimingResponse]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: UserProfileData) => {
      return await apiRequest("PUT", `/api/user/profile/${userId}`, updatedProfile);
    },
    onSuccess: async (data) => {
      // If weight was updated, sync it to Body Tracking
      if (profileData.weight && parseFloat(profileData.weight) > 0) {
        try {
          await syncWeightToBodyTracking();
        } catch (error) {
          console.warn('Failed to sync weight to body tracking:', error);
          // Don't show error to user as profile save was successful
        }
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/body-metrics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  // Sync weight to body tracking
  const syncWeightToBodyTracking = async () => {
    if (!profileData.weight || parseFloat(profileData.weight) <= 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const weightValue = parseFloat(profileData.weight);
    
    // Check if there's already a body metric entry for today
    const existingMetrics = await fetch(`/api/body-metrics/${userId}`).then(res => res.json());
    const todayMetric = existingMetrics?.find((metric: any) => 
      new Date(metric.date).toISOString().split('T')[0] === today
    );
    
    if (todayMetric) {
      // Update existing metric with new weight
      await apiRequest("PUT", `/api/body-metrics/${todayMetric.id}`, {
        ...todayMetric,
        weight: weightValue.toString(),
        unit: 'metric'
      });
    } else {
      // Create new body metric entry for today
      await apiRequest("POST", "/api/body-metrics", {
        userId: userId,
        date: new Date(),
        weight: weightValue.toString(),
        unit: 'metric'
      });
    }
  };

  // Update meal timing preferences mutation
  const updateMealTimingMutation = useMutation({
    mutationFn: async (data: MealTimingData) => {
      // Check if preferences exist
      const exists = mealTimingResponse;
      
      if (exists) {
        return await apiRequest("PUT", `/api/meal-timing/${userId}`, data);
      } else {
        return await apiRequest("POST", "/api/meal-timing", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal timing preferences updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meal-timing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal timing preferences",
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSaveMealTiming = () => {
    updateMealTimingMutation.mutate(mealTimingData);
  };

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: checked
        ? [...(prev.dietaryRestrictions || []), restriction]
        : (prev.dietaryRestrictions || []).filter(r => r !== restriction)
    }));
  };

  const handleWorkoutDayChange = (day: string, checked: boolean) => {
    setMealTimingData(prev => ({
      ...prev,
      workoutDays: checked
        ? [...prev.workoutDays, day]
        : prev.workoutDays.filter(d => d !== day)
    }));
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (profileData.weight && profileData.height) {
      const weight = parseFloat(profileData.weight);
      const height = parseFloat(profileData.height);
      if (weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
      }
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600 dark:text-blue-400" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-600 dark:text-green-400" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600 dark:text-yellow-400" };
    return { category: "Obese", color: "text-red-600 dark:text-red-400" };
  };

  const isProfileComplete = () => {
    return profileData.age && profileData.height && profileData.activityLevel && profileData.fitnessGoal;
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(Number(bmi)) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic-info" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="meal-timing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Meal Timing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="space-y-6 mt-6">
          {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Complete your profile to unlock TDEE calculation and personalized recommendations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Completion Status */}
      {!isProfileComplete() && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-100 text-lg">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Missing profile data prevents TDEE calculation and auto-regulation features in Diet Builder.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential data for TDEE calculation and personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-black dark:text-white">Age *</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={profileData.age || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: Number(e.target.value) || undefined }))}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="text-black dark:text-white">Height (cm) *</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={profileData.height || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-black dark:text-white">Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="70.0"
                value={profileData.weight || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, weight: e.target.value }))}
                className="border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Weight tracking is done in Body Tracking tab for progress monitoring
              </p>
            </div>

            {/* BMI Display */}
            {bmi && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-black dark:text-white">BMI</span>
                  <span className="text-lg font-bold text-black dark:text-white">{bmi}</span>
                </div>
                {bmiInfo && (
                  <p className={`text-sm mt-1 ${bmiInfo.color}`}>{bmiInfo.category}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity & Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity & Goals
            </CardTitle>
            <CardDescription>
              Your activity level and fitness goals for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-black dark:text-white">Activity Level *</Label>
              <Select 
                value={profileData.activityLevel} 
                onValueChange={(value) => setProfileData(prev => ({ ...prev, activityLevel: value }))}
              >
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (Office job, little exercise)</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active (Light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active (Moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (Hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extremely_active">Extremely Active (Very hard exercise, physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black dark:text-white">Fitness Goal *</Label>
              <Select 
                value={profileData.fitnessGoal} 
                onValueChange={(value) => setProfileData(prev => ({ ...prev, fitnessGoal: value }))}
              >
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select fitness goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                  <SelectItem value="strength">Strength Gain</SelectItem>
                  <SelectItem value="endurance">Endurance Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Level Descriptions */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Activity Level Guide</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>Sedentary:</strong> Desk job, minimal physical activity</li>
                <li><strong>Lightly Active:</strong> Light exercise or sports 1-3 days/week</li>
                <li><strong>Moderately Active:</strong> Moderate exercise 3-5 days/week</li>
                <li><strong>Very Active:</strong> Hard exercise 6-7 days a week</li>
                <li><strong>Extremely Active:</strong> Very hard exercise, physical job, or training twice a day</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid grid-cols-2 gap-4">
            {[
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
            ].map((restriction) => (
              <div key={restriction} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="relative">
                  <Checkbox
                    id={restriction}
                    checked={profileData.dietaryRestrictions?.includes(restriction) || false}
                    onCheckedChange={(checked) => handleDietaryRestrictionChange(restriction, checked as boolean)}
                    className="h-5 w-5 rounded-sm border-2 border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white"
                  />
                </div>
                <Label
                  htmlFor={restriction}
                  className="text-sm font-medium text-black dark:text-white capitalize cursor-pointer flex-1 select-none"
                >
                  {restriction.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isProfileComplete() 
                  ? "✓ Profile complete! All Diet Builder features are now available."
                  : "Complete required fields (*) to unlock all features."
                }
              </p>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="meal-timing" className="space-y-6 mt-6">
          {/* Meal Timing Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Meal Timing & Schedule
              </CardTitle>
              <CardDescription>
                Personalize your meal timing for optimal nutrition and training support
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep & Wake Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Schedule
                </CardTitle>
                <CardDescription>
                  Set your wake and sleep times for optimal meal timing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black dark:text-white">Wake Time *</Label>
                    <Input
                      type="time"
                      value={mealTimingData.wakeTime}
                      onChange={(e) => setMealTimingData(prev => ({ ...prev, wakeTime: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label className="text-black dark:text-white">Sleep Time *</Label>
                    <Input
                      type="time"
                      value={mealTimingData.sleepTime}
                      onChange={(e) => setMealTimingData(prev => ({ ...prev, sleepTime: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-black dark:text-white">Workout Time (Optional)</Label>
                  <Input
                    type="time"
                    value={mealTimingData.workoutTime || ''}
                    onChange={(e) => setMealTimingData(prev => ({ ...prev, workoutTime: e.target.value }))}
                    className="border-gray-300 dark:border-gray-600"
                    placeholder="Select your usual workout time"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Workout Days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Workout Schedule
                </CardTitle>
                <CardDescription>
                  Select your typical workout days for meal timing optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={mealTimingData.workoutDays.includes(day)}
                        onCheckedChange={(checked) => handleWorkoutDayChange(day, checked as boolean)}
                      />
                      <Label
                        htmlFor={day}
                        className="text-sm font-medium text-black dark:text-white capitalize cursor-pointer"
                      >
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meal Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Meal Frequency
                </CardTitle>
                <CardDescription>
                  Configure your preferred meal schedule and workout nutrition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-black dark:text-white">Meals Per Day</Label>
                  <Select value={mealTimingData.mealsPerDay.toString()} onValueChange={(value) => setMealTimingData(prev => ({ ...prev, mealsPerDay: parseInt(value) }))}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black dark:text-white">Pre-Workout Meals</Label>
                    <Select value={mealTimingData.preWorkoutMeals.toString()} onValueChange={(value) => setMealTimingData(prev => ({ ...prev, preWorkoutMeals: parseInt(value) }))}>
                      <SelectTrigger className="border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1 meal</SelectItem>
                        <SelectItem value="2">2 meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-black dark:text-white">Post-Workout Meals</Label>
                    <Select value={mealTimingData.postWorkoutMeals.toString()} onValueChange={(value) => setMealTimingData(prev => ({ ...prev, postWorkoutMeals: parseInt(value) }))}>
                      <SelectTrigger className="border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1 meal</SelectItem>
                        <SelectItem value="2">2 meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Timing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Schedule Summary
                </CardTitle>
                <CardDescription>
                  Preview your personalized meal timing schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Wake Time:</span>
                    <span className="font-medium text-black dark:text-white">{mealTimingData.wakeTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sleep Time:</span>
                    <span className="font-medium text-black dark:text-white">{mealTimingData.sleepTime}</span>
                  </div>
                  {mealTimingData.workoutTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Workout Time:</span>
                      <span className="font-medium text-black dark:text-white">{mealTimingData.workoutTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Daily Meals:</span>
                    <span className="font-medium text-black dark:text-white">{mealTimingData.mealsPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Workout Days:</span>
                    <span className="font-medium text-black dark:text-white">
                      {mealTimingData.workoutDays.length > 0 
                        ? mealTimingData.workoutDays.map(d => d.slice(0, 3)).join(', ')
                        : 'None selected'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Meal Timing Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your meal timing preferences will optimize meal scheduling in Diet Builder
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
                      Save Meal Timing
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