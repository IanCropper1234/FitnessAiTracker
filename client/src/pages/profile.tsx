import { UserProfile } from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, User as UserIcon, Globe, Sun, Moon, Settings, Code, Target, Info, ArrowLeft, Home, Activity, Loader2, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  name: string;
  showDeveloperFeatures?: boolean;
}

interface ProfilePageProps {
  user: User;
  onSignOut?: () => void;
}

interface DietGoals {
  goal: string;
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFat: string;
  weeklyWeightTarget: string;
}

// Activity & Goals Card Component
function ActivityGoalsCard({ userId }: { userId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  const [profileData, setProfileData] = useState({
    activityLevel: '',
    fitnessGoal: ''
  });

  // Initialize profile data from fetched data
  useEffect(() => {
    if (userData?.profile) {
      setProfileData({
        activityLevel: userData.profile.activityLevel || '',
        fitnessGoal: userData.profile.fitnessGoal || ''
      });
    }
  }, [userData]);

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/user/profile/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile', userId] });
      toast({
        title: "Profile Updated",
        description: "Your activity level and fitness goals have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error?.message || "Failed to save profile changes. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    // Send complete profile data including existing fields
    const completeProfileData = {
      ...userData?.profile,
      activityLevel: profileData.activityLevel,
      fitnessGoal: profileData.fitnessGoal
    };
    updateProfileMutation.mutate(completeProfileData);
  };

  if (isLoading) return null;

  return (
    <Card className="ios-smooth-transform">
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

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            size="sm"
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
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DietGoalsCard({ userId }: { userId: number }) {
  const { data: dietGoals, isLoading } = useQuery<DietGoals>({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      return response.json();
    }
  });

  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  if (isLoading) return null;

  const getGoalDescription = (goal: string) => {
    switch (goal) {
      case "bulk": return "Muscle Gain (Calorie Surplus)";
      case "cut": return "Weight Loss (Calorie Deficit)";
      case "maintain": return "Weight Maintenance";
      default: return "Maintenance";
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case "bulk": return "text-green-600 dark:text-green-400";
      case "cut": return "text-red-600 dark:text-red-400";
      case "maintain": return "text-blue-600 dark:text-blue-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const fitnessGoal = userProfile?.profile?.fitnessGoal || "Not Set";
  const weeklyTarget = parseFloat(dietGoals?.weeklyWeightTarget || "0");

  return (
    <Card className="ios-smooth-transform">
      <CardContent className="p-4 space-y-3">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-black dark:text-white">Diet Goals</h3>
        </div>

        {/* Compact Info Banner */}
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Auto-set for <strong>{fitnessGoal}</strong> goal
          </p>
        </div>

        {dietGoals && (
          <div className="space-y-3">
            {/* Goal Summary - Compact Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Goal</label>
                <p className={`text-sm font-semibold ${getGoalColor(dietGoals.goal)}`}>
                  {getGoalDescription(dietGoals.goal)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Weekly Target</label>
                <p className="text-sm font-semibold text-black dark:text-white">
                  {weeklyTarget > 0 ? `+${weeklyTarget}kg` : weeklyTarget < 0 ? `${weeklyTarget}kg` : '0kg'}
                </p>
              </div>
            </div>
            
            {/* Macro Grid - Compact Design */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 text-center">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Calories</p>
                <p className="text-sm font-bold text-black dark:text-white">{Math.round(Number(dietGoals.targetCalories))}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Protein</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(Number(dietGoals.targetProtein))}g</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5 text-center">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Carbs</p>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{Math.round(Number(dietGoals.targetCarbs))}g</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 text-center">
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Fat</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{Math.round(Number(dietGoals.targetFat))}g</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch complete user data including developer settings
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user/${user.id}`);
      return response.json();
    }
  });

  // Mutation to update developer settings
  const updateDeveloperSettingsMutation = useMutation({
    mutationFn: async (showDeveloperFeatures: boolean) => {
      return apiRequest('PUT', `/api/auth/user/${user.id}/developer-settings`, {
        showDeveloperFeatures
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user', user.id] });
    }
  });

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setLocation("/auth");
  };
  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container">
      <div className="container mx-auto p-4 space-y-6">
        {/* Ultra-Compact Header - Consistent with Training/Nutrition */}
        <div className="h-11 flex items-center justify-between px-1 ios-smooth-transform">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target return-button-animation"
          >
            <ArrowLeft className="w-4 h-4 return-icon-animation" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <UserIcon className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground truncate">Profile</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target return-button-animation"
          >
            <Home className="w-4 h-4 return-icon-animation" />
          </Button>
        </div>

        {/* User Info Card - Mobile-Optimized Layout */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* User Info Row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-black dark:text-white truncate">{user.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              
              {/* Sign Out Button - Full Width on Mobile */}
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ios-button touch-target"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Settings Card - Optimized Mobile Layout */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-black dark:text-white">App Settings</h3>
                </div>
              </div>

              {/* Settings Grid - Stack on mobile, side-by-side on larger screens */}
              <div className="space-y-4">
                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-black dark:text-white flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full h-9 ios-touch-feedback touch-target">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh-CN">中文 (简体)</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh-TW">中文 (繁體)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-black dark:text-white flex items-center gap-2">
                    {theme === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    Theme
                  </label>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    className="w-full justify-start h-9 ios-button touch-target"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="w-3.5 h-3.5 mr-2" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 mr-2" />
                        Light Mode
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Developer Settings - Compact Design */}
              {userData?.email === 'c0109009@gmail.com' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Code className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-black dark:text-white">Developer</h3>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Label htmlFor="developer-features" className="text-xs font-medium text-black dark:text-white">
                          Show V2 Features
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Display V2 buttons in training
                        </p>
                      </div>
                      <Switch
                        id="developer-features"
                        checked={userData?.showDeveloperFeatures || false}
                        onCheckedChange={(checked) => {
                          updateDeveloperSettingsMutation.mutate(checked);
                        }}
                        disabled={updateDeveloperSettingsMutation.isPending}
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity & Goals Card - Moved Above Diet Goals */}
        <ActivityGoalsCard userId={user.id} />

        {/* Diet Goals Card */}
        <DietGoalsCard userId={user.id} />

        {/* Profile Component */}
        <UserProfile userId={user.id} />
      </div>
    </div>
  );
}