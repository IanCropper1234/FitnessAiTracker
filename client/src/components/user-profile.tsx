import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Save, Loader2, Settings, Activity, Target, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfileData {
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  dietaryRestrictions?: string[];
}

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState<UserProfileData>({
    age: undefined,
    weight: undefined,
    height: undefined,
    activityLevel: '',
    fitnessGoal: '',
    dietaryRestrictions: []
  });

  // Fetch current user profile
  const { data: userProfileResponse, isLoading } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  // Update profile data when user profile loads
  useEffect(() => {
    if (userProfileResponse?.profile || userProfileResponse?.user) {
      const profile = userProfileResponse.profile || userProfileResponse.user;
      setProfileData({
        age: profile.age || undefined,
        weight: profile.weight || undefined,
        height: profile.height || undefined,
        activityLevel: profile.activityLevel || '',
        fitnessGoal: profile.fitnessGoal || '',
        dietaryRestrictions: profile.dietaryRestrictions || []
      });
    }
  }, [userProfileResponse]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: UserProfileData) => {
      return await apiRequest("PUT", `/api/user/profile/${userId}`, updatedProfile);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: checked
        ? [...(prev.dietaryRestrictions || []), restriction]
        : (prev.dietaryRestrictions || []).filter(r => r !== restriction)
    }));
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (profileData.weight && profileData.height) {
      const heightInMeters = profileData.height / 100;
      return (profileData.weight / (heightInMeters * heightInMeters)).toFixed(1);
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
                  onChange={(e) => setProfileData(prev => ({ ...prev, height: Number(e.target.value) || undefined }))}
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
                onChange={(e) => setProfileData(prev => ({ ...prev, weight: Number(e.target.value) || undefined }))}
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
    </div>
  );
}