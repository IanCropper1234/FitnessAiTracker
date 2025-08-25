import UserProfile from "@/components/user-profile";
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


// Activity & Goals Card Component
function ActivityGoalsCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user profile data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      return response.json();
    }
  });

  const [profileData, setProfileData] = useState({
    activityLevel: '',
    fitnessGoal: '',
    gender: ''
  });

  // Initialize profile data from fetched data
  useEffect(() => {
    if (userData?.profile) {
      setProfileData({
        activityLevel: userData.profile.activityLevel || '',
        fitnessGoal: userData.profile.fitnessGoal || '',
        gender: userData.profile.gender || ''
      });
    }
  }, [userData]);

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/user/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
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
      fitnessGoal: profileData.fitnessGoal,
      gender: profileData.gender
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
          <Label className="text-black dark:text-white">Gender *</Label>
          <Select 
            value={profileData.gender} 
            onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
          >
            <SelectTrigger className="border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
              <SelectItem value="fat_loss">Fat Loss</SelectItem>
              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Level Descriptions */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 ">
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
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // Auto-reset language to English if ZH-TW is selected (since it's not complete)
  useEffect(() => {
    if (language === 'zh-TW') {
      setLanguage('en');
    }
  }, [language, setLanguage]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch complete user data including developer settings
  const { data: userData } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      return response.json();
    }
  });

  // Enhanced signout mutation with complete session cleanup
  const signoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/signout', { 
        method: 'POST',
        credentials: 'include', // Include cookies for session cleanup
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to sign out');
      return response.json();
    },
    onSuccess: () => {
      // Clear all client-side data
      console.log('Starting client-side session cleanup...');
      
      // Clear React Query cache completely
      queryClient.clear();
      
      // Clear localStorage data
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('trainpro') ||
            key.includes('fitness') ||
            key.includes('workout') ||
            key.includes('nutrition') ||
            key.includes('auth')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Cleared localStorage keys:', keysToRemove);
      }
      
      // Clear sessionStorage data
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      
      // Call parent signout handler
      if (onSignOut) onSignOut();
      
      // Navigate to auth page
      setLocation('/auth');
      
      toast({
        title: "Signed Out Successfully",
        description: "All session data has been cleared. You have been securely logged out.",
      });
      
      console.log('Client-side session cleanup completed');
    },
    onError: (error: any) => {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: error?.message || "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update developer settings
  const updateDeveloperSettingsMutation = useMutation({
    mutationFn: async (showDeveloperFeatures: boolean) => {
      return apiRequest('PUT', '/api/auth/user/developer-settings', {
        showDeveloperFeatures
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    }
  });

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setLocation("/auth");
  };
  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container ml-[8px] mr-[8px] pl-[5px] pr-[5px]">
      <div className="container mx-auto p-4 space-y-6 pl-[0px] pr-[0px] pt-[0px] pb-[0px] mt-[0px] mb-[0px]">
        {/* Ultra-Compact Header - Consistent with Training/Nutrition */}
        <div className="h-11 flex items-center justify-between px-1 ios-smooth-transform">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="h-8 w-8  bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <UserIcon className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground truncate">Profile</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="h-8 w-8  bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info Card - Mobile-Optimized Layout */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* User Info Row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800  flex items-center justify-center flex-shrink-0">
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
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800  flex items-center justify-center flex-shrink-0">
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
                      <SelectItem value="zh-TW" disabled>
                        <div className="flex items-center justify-between w-full">
                          <span className="opacity-60">中文 (繁體)</span>
                          <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="es" disabled>
                        <div className="flex items-center justify-between w-full">
                          <span className="opacity-60">Español</span>
                          <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ja" disabled>
                        <div className="flex items-center justify-between w-full">
                          <span className="opacity-60">日本語</span>
                          <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="zh-CN" disabled>
                        <div className="flex items-center justify-between w-full">
                          <span className="opacity-60">中文 (简体)</span>
                          <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="de" disabled>
                        <div className="flex items-center justify-between w-full">
                          <span className="opacity-60">Deutsch</span>
                          <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
                        </div>
                      </SelectItem>
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
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900  flex items-center justify-center flex-shrink-0">
                      <Code className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-black dark:text-white">Developer</h3>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50  p-3">
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
        <ActivityGoalsCard />


        {/* Profile Component */}
        <UserProfile />
      </div>
    </div>
  );
}