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
import { User, Save, Settings, Activity, Target, Utensils, Clock, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MealTimingPreference, InsertMealTimingPreference } from "@shared/schema";

interface UserProfileData {
  userId: number;
  age?: number;
  weight?: string;
  height?: string;
  weightUnit?: string;
  heightUnit?: string;
  bodyFatPercentage?: string;
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

interface UserProfileProps {}

export function UserProfile({}: UserProfileProps) {
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
    } else if (type === 'measurement') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 0.393701 * 10) / 10; // cm to inches
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 2.54 * 10) / 10; // inches to cm
      }
    }
    return value;
  };

  const [profileData, setProfileData] = useState<UserProfileData>({
    userId: 0, // Will be populated from session
    age: undefined,
    weight: '',
    height: '',
    weightUnit: 'metric',
    heightUnit: 'metric',
    bodyFatPercentage: '',
    activityLevel: '',
    fitnessGoal: '',
    dietaryRestrictions: []
  });

  const [mealTimingData, setMealTimingData] = useState<MealTimingData>({
    userId: 0, // Will be populated from session
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
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      return response.json();
    }
  });

  // Fetch meal timing preferences
  const { data: mealTimingResponse } = useQuery({
    queryKey: ['/api/meal-timing'],
    queryFn: async () => {
      const response = await fetch('/api/meal-timing');
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch latest body metrics for body fat percentage
  const { data: bodyMetricsResponse } = useQuery({
    queryKey: ['/api/body-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/body-metrics');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Update profile data when user profile loads
  useEffect(() => {
    if (userProfileResponse?.profile || userProfileResponse?.user) {
      const profile = userProfileResponse.profile || userProfileResponse.user;
      
      // Get latest body fat percentage from body metrics
      let latestBodyFat = '';
      if (bodyMetricsResponse && Array.isArray(bodyMetricsResponse) && bodyMetricsResponse.length > 0) {
        const sortedMetrics = bodyMetricsResponse
          .filter(metric => metric.bodyFatPercentage && metric.bodyFatPercentage > 0)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (sortedMetrics.length > 0) {
          latestBodyFat = String(sortedMetrics[0].bodyFatPercentage);
        }
      }
      
      setProfileData({
        userId: userProfileResponse.user?.id || 0,
        age: profile.age || undefined,
        weight: profile.weight ? String(profile.weight) : '',
        height: profile.height ? String(profile.height) : '',
        weightUnit: profile.weightUnit || 'metric',
        heightUnit: profile.heightUnit || 'metric',
        bodyFatPercentage: latestBodyFat,
        activityLevel: profile.activityLevel || '',
        fitnessGoal: profile.fitnessGoal || '',
        dietaryRestrictions: profile.dietaryRestrictions || []
      });
    }
  }, [userProfileResponse, bodyMetricsResponse]);

  // Update meal timing data when preferences load
  useEffect(() => {
    if (mealTimingResponse) {
      setMealTimingData({
        userId: userProfileResponse?.user?.id || 0,
        wakeTime: mealTimingResponse.wakeTime || '07:00',
        sleepTime: mealTimingResponse.sleepTime || '23:00',
        workoutTime: mealTimingResponse.workoutTime || '',
        workoutDays: mealTimingResponse.workoutDays || [],
        mealsPerDay: mealTimingResponse.mealsPerDay || 4,
        preWorkoutMeals: mealTimingResponse.preWorkoutMeals || 1,
        postWorkoutMeals: mealTimingResponse.postWorkoutMeals || 1
      });
    }
  }, [mealTimingResponse, userProfileResponse]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: UserProfileData) => {
      return await apiRequest("PUT", "/api/user/profile", updatedProfile);
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
    const userWeightUnit = profileData.weightUnit === 'imperial' ? 'imperial' : 'metric';
    
    // Check if there's already a body metric entry for today
    const existingMetrics = await fetch('/api/body-metrics').then(res => res.json());
    const todayMetric = existingMetrics?.find((metric: any) => 
      new Date(metric.date).toISOString().split('T')[0] === today
    );
    
    if (todayMetric) {
      // Update existing metric with new weight and user's unit preference
      await apiRequest("PUT", `/api/body-metrics/${todayMetric.id}`, {
        ...todayMetric,
        weight: weightValue.toString(),
        unit: userWeightUnit
      });
    } else {
      // Create new body metric entry for today with user's unit preference
      await apiRequest("POST", "/api/body-metrics", {
        date: new Date(),
        weight: weightValue.toString(),
        unit: userWeightUnit
      });
    }
  };

  // Update meal timing preferences mutation
  const updateMealTimingMutation = useMutation({
    mutationFn: async (data: MealTimingData) => {
      // Check if preferences exist
      const exists = mealTimingResponse;
      
      if (exists) {
        return await apiRequest("PUT", "/api/meal-timing", data);
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

  // Calculate Enhanced Fitness Health Index (FHI) - Better for athletes and bodybuilders
  const calculateFitnessHealthIndex = () => {
    if (!profileData.height || !profileData.weight || 
        parseFloat(profileData.height) <= 0 || parseFloat(profileData.weight) <= 0) {
      return null;
    }
    
    // Convert to standard units (cm and kg)
    let heightInCm = parseFloat(profileData.height);
    let weightInKg = parseFloat(profileData.weight);
    
    // Convert to metric if needed
    if (profileData.heightUnit === 'imperial') {
      heightInCm = convertValue(heightInCm, 'measurement', 'imperial', 'metric');
    }
    if (profileData.weightUnit === 'imperial') {
      weightInKg = convertValue(weightInKg, 'weight', 'imperial', 'metric');
    }
    
    // Enhanced calculation considering muscle mass and fitness goals
    const heightInM = heightInCm / 100;
    let baseIndex = weightInKg / (heightInM * heightInM);
    
    // Body fat percentage enhancement (if available)
    let bodyFatAdjustment = 1.0;
    if (profileData.bodyFatPercentage && parseFloat(profileData.bodyFatPercentage) > 0) {
      const bodyFat = parseFloat(profileData.bodyFatPercentage);
      // Adjust index based on body fat percentage for more accurate assessment
      if (bodyFat <= 12) bodyFatAdjustment = 0.75; // Very lean athletes
      else if (bodyFat <= 18) bodyFatAdjustment = 0.85; // Athletic build
      else if (bodyFat <= 25) bodyFatAdjustment = 0.95; // Moderate body fat
      else bodyFatAdjustment = 1.05; // Higher body fat
      
      baseIndex *= bodyFatAdjustment;
    }
    
    // Activity level adjustments (higher activity = higher healthy weight range)
    let adjustmentFactor = 1.0;
    switch (profileData.activityLevel) {
      case 'very_active': adjustmentFactor = 0.85; break;
      case 'extremely_active': adjustmentFactor = 0.80; break;
      case 'active': adjustmentFactor = 0.90; break;
      case 'lightly_active': adjustmentFactor = 0.95; break;
      default: adjustmentFactor = 1.0;
    }
    
    // Fitness goal adjustments
    if (profileData.fitnessGoal === 'muscle_gain') {
      adjustmentFactor *= 0.85; // Allow for higher weight with muscle gain goals
    }
    
    const adjustedIndex = baseIndex * adjustmentFactor;
    return Math.round(adjustedIndex * 10) / 10;
  };

  const getFitnessHealthInfo = (fhi: number) => {
    const hasBodyFat = profileData.bodyFatPercentage && parseFloat(profileData.bodyFatPercentage) > 0;
    
    // Enhanced ranges considering body composition when available
    if (fhi < 17) return { 
      category: "Below healthy range", 
      color: "text-blue-600 dark:text-blue-400",
      description: hasBodyFat ? "Consider increasing caloric intake for lean mass" : "Consider increasing caloric intake and strength training"
    };
    if (fhi < 23) return { 
      category: "Healthy athletic range", 
      color: "text-green-600 dark:text-green-400",
      description: hasBodyFat ? "Excellent body composition for athletes" : "Excellent range for active individuals with good muscle mass"
    };
    if (fhi < 27) return { 
      category: "Athletic/muscular build", 
      color: "text-green-500 dark:text-green-300",
      description: hasBodyFat ? "Strong athletic build with good muscle mass" : "Common for bodybuilders and strength athletes"
    };
    if (fhi < 30) return { 
      category: "Monitor body composition", 
      color: "text-yellow-600 dark:text-yellow-400",
      description: hasBodyFat ? "Good range but monitor fat vs muscle ratio" : "Consider body fat % measurement for better assessment"
    };
    return { 
      category: "Health assessment recommended", 
      color: "text-orange-600 dark:text-orange-400",
      description: hasBodyFat ? "Consider body composition optimization" : "Consult with a fitness professional for personalized evaluation"
    };
  };

  const isProfileComplete = () => {
    return profileData.age && profileData.height && profileData.activityLevel && profileData.fitnessGoal;
  };

  const fitnessHealthIndex = calculateFitnessHealthIndex();
  const fhiInfo = fitnessHealthIndex ? getFitnessHealthInfo(fitnessHealthIndex) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="ios-loading-dots flex items-center gap-1">
          <div className="dot w-2 h-2 bg-black dark:bg-white rounded-full"></div>
          <div className="dot w-2 h-2 bg-black dark:bg-white rounded-full"></div>
          <div className="dot w-2 h-2 bg-black dark:bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full">

        <div className="space-y-6 mt-6">
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
              <Label className="text-black dark:text-white">Height *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="175"
                  value={profileData.height || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                  className="border-gray-300 dark:border-gray-600 flex-1"
                />
                <Select 
                  value={profileData.heightUnit || 'metric'} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, heightUnit: value }))}
                >
                  <SelectTrigger className="w-20 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">cm</SelectItem>
                    <SelectItem value="imperial">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {profileData.height && (
                  profileData.heightUnit === 'metric' 
                    ? `≈${convertValue(parseFloat(profileData.height), 'measurement', 'metric', 'imperial')} in`
                    : `≈${convertValue(parseFloat(profileData.height), 'measurement', 'imperial', 'metric')} cm`
                )}
              </p>
            </div>

            <div>
              <Label className="text-black dark:text-white">Weight</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70.0"
                  value={profileData.weight || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, weight: e.target.value }))}
                  className="border-gray-300 dark:border-gray-600 flex-1"
                />
                <Select 
                  value={profileData.weightUnit || 'metric'} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, weightUnit: value }))}
                >
                  <SelectTrigger className="w-20 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">kg</SelectItem>
                    <SelectItem value="imperial">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {profileData.weight && (
                  profileData.weightUnit === 'metric' 
                    ? `≈${convertValue(parseFloat(profileData.weight), 'weight', 'metric', 'imperial')} lbs`
                    : `≈${convertValue(parseFloat(profileData.weight), 'weight', 'imperial', 'metric')} kg`
                )} · Weight tracking is done in Body Tracking tab for progress monitoring
              </p>
            </div>

            <div>
              <Label className="text-black dark:text-white">Body Fat Percentage (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="15.0"
                  value={profileData.bodyFatPercentage || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bodyFatPercentage: e.target.value }))}
                  className="border-gray-300 dark:border-gray-600 flex-1"
                />
                <div className="w-12 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  %
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {bodyMetricsResponse && Array.isArray(bodyMetricsResponse) && bodyMetricsResponse.length > 0 
                  ? "Latest from Body Tracking · Improves Fitness Health Index accuracy"
                  : "Add body fat % for more accurate health assessment · Track in Body Tracking tab"
                }
              </p>
            </div>

            {/* Fitness Health Index Display */}
            {fitnessHealthIndex && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800  border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-black dark:text-white">Fitness Health Index</span>
                  <span className="text-lg font-bold text-black dark:text-white">{fitnessHealthIndex}</span>
                </div>
                {fhiInfo && (
                  <>
                    <p className={`text-sm mt-1 ${fhiInfo.color}`}>{fhiInfo.category}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{fhiInfo.description}</p>
                  </>
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {profileData.bodyFatPercentage && parseFloat(profileData.bodyFatPercentage) > 0 
                    ? `Enhanced with body composition (${profileData.bodyFatPercentage}% body fat) · Better than BMI for athletes`
                    : "Better suited for athletes and bodybuilders than traditional BMI"
                  }
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div key={restriction} className="flex items-center space-x-2">
                <Checkbox
                  id={restriction}
                  checked={profileData.dietaryRestrictions?.includes(restriction) || false}
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
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
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
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 whitespace-nowrap flex-shrink-0"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="ios-loading-dots flex items-center gap-1 mr-2">
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
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
        </div>
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
                <div className="bg-gray-50 dark:bg-gray-800 p-4  space-y-2 text-sm">
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
                      <div className="ios-loading-dots flex items-center gap-1 mr-2">
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
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