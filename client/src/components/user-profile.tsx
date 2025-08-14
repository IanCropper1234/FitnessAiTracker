import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Save, 
  Utensils
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  weight?: string;
  height?: string;
  weightUnit?: string;
  heightUnit?: string;
  activityLevel?: string;
  fitnessGoal?: string;
  bodyFatPercentage?: string;
  dietaryRestrictions?: string[];
}

interface BodyMetric {
  id: number;
  userId: number;
  date: string;
  weight?: string;
  bodyFatPercentage?: string;
  muscleMass?: string;
  bodyWater?: string;
}

// Helper function to convert weight between units
const convertValue = (value: number, type: 'weight' | 'measurement', fromUnit: string, toUnit: string): number => {
  if (type === 'weight') {
    if (fromUnit === 'metric' && toUnit === 'imperial') {
      return Math.round(value * 2.20462 * 10) / 10; // kg to lbs
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
      return Math.round(value / 2.20462 * 10) / 10; // lbs to kg
    }
  } else if (type === 'measurement') {
    if (fromUnit === 'metric' && toUnit === 'imperial') {
      return Math.round(value / 2.54 * 10) / 10; // cm to inches
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
      return Math.round(value * 2.54 * 10) / 10; // inches to cm
    }
  }
  return value;
};

// Helper function to calculate Fitness Health Index
const calculateFitnessHealthIndex = (profile: UserProfile): number | null => {
  const { age, weight, height, heightUnit, weightUnit, bodyFatPercentage } = profile;
  
  if (!age || !weight || !height) return null;
  
  const ageNum = age;
  let weightKg = parseFloat(weight);
  let heightCm = parseFloat(height);
  
  // Convert to metric if needed
  if (weightUnit === 'imperial') {
    weightKg = weightKg / 2.20462;
  }
  if (heightUnit === 'imperial') {
    heightCm = heightCm * 2.54;
  }
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let baseScore = 100 - (Math.abs(bmi - 22) * 2);
  
  // Age adjustment
  if (ageNum < 25) baseScore += 5;
  else if (ageNum > 35) baseScore -= (ageNum - 35) * 0.5;
  
  // Body fat adjustment if available
  if (bodyFatPercentage && parseFloat(bodyFatPercentage) > 0) {
    const bf = parseFloat(bodyFatPercentage);
    const idealBF = profile.gender === 'male' ? 15 : 25;
    const bfDiff = Math.abs(bf - idealBF);
    baseScore -= bfDiff * 0.8;
  }
  
  return Math.max(0, Math.min(100, Math.round(baseScore)));
};

const getFitnessHealthIndexInfo = (fhi: number) => {
  if (fhi >= 85) return { category: 'Excellent', color: 'text-green-600 dark:text-green-400', description: 'Outstanding fitness health profile' };
  if (fhi >= 70) return { category: 'Good', color: 'text-blue-600 dark:text-blue-400', description: 'Above average fitness health' };
  if (fhi >= 50) return { category: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', description: 'Room for improvement' };
  return { category: 'Needs Improvement', color: 'text-red-600 dark:text-red-400', description: 'Consider focusing on health improvements' };
};

export default function UserProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    dietaryRestrictions: []
  });

  // Fetch user profile
  const { data: userResponse, isLoading: userLoading } = useQuery<{ user: UserProfile }>({
    queryKey: ['/api/user/profile'],
  });

  // Fetch body metrics for body fat percentage
  const { data: bodyMetricsResponse } = useQuery<BodyMetric[]>({
    queryKey: ['/api/body-metrics'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Update profile data when user data is loaded
  useEffect(() => {
    if (userResponse?.user) {
      setProfileData({
        ...userResponse.user,
        dietaryRestrictions: userResponse.user.dietaryRestrictions || []
      });
    }
  }, [userResponse]);

  // Update body fat percentage from latest body metrics
  useEffect(() => {
    if (bodyMetricsResponse && Array.isArray(bodyMetricsResponse) && bodyMetricsResponse.length > 0) {
      const latestMetric = bodyMetricsResponse[0];
      if (latestMetric.bodyFatPercentage && parseFloat(latestMetric.bodyFatPercentage) > 0) {
        setProfileData(prev => ({
          ...prev,
          bodyFatPercentage: latestMetric.bodyFatPercentage
        }));
      }
    }
  }, [bodyMetricsResponse]);

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: checked 
        ? [...(prev.dietaryRestrictions || []), restriction]
        : (prev.dietaryRestrictions || []).filter(r => r !== restriction)
    }));
  };

  const handleSaveProfile = async () => {
    const requiredFields = ['age', 'height'];
    const missingFields = requiredFields.filter(field => !profileData[field as keyof UserProfile]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(profileData);
  };

  const isProfileComplete = () => {
    return profileData.age && profileData.height;
  };

  // Calculate Fitness Health Index
  const fitnessHealthIndex = useMemo(() => {
    return calculateFitnessHealthIndex(profileData as UserProfile);
  }, [profileData]);

  const fhiInfo = fitnessHealthIndex ? getFitnessHealthIndexInfo(fitnessHealthIndex) : null;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="ios-loading-dots flex items-center gap-1">
          <div className="dot w-2 h-2 bg-primary rounded-full"></div>
          <div className="dot w-2 h-2 bg-primary rounded-full"></div>
          <div className="dot w-2 h-2 bg-primary rounded-full"></div>
        </div>
        <span className="ml-2 text-sm text-muted-foreground">Loading profile...</span>
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
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
      </div>
    </div>
  );
}