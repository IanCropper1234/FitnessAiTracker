import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LogOut, User as UserIcon, Globe, Sun, Moon, Settings, Code, Target, Info, ArrowLeft, Home, Activity, Loader2, Save, Camera, Trash2, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";

interface User {
  id: number;
  email: string;
  name: string;
  showDeveloperFeatures?: boolean;
  profileImageUrl?: string;
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
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  
  // Auto-reset language to English if ZH-TW is selected (since it's not complete)
  useEffect(() => {
    if (language === 'zh-TW') {
      setLanguage('en');
    }
  }, [language, setLanguage]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch latest user data from server (instead of using prop)
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    }
  });

  // Use fetched user data or fallback to prop
  const currentUser = userResponse?.user || user;

  // Reset image loading state when profile image URL changes
  useEffect(() => {
    if (currentUser?.profileImageUrl) {
      setIsImageLoading(true);
    }
  }, [currentUser?.profileImageUrl]);

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (profileImageURL: string) => {
      return apiRequest('PUT', '/api/user/profile-picture', {
        profileImageURL
      });
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.refetchQueries({ queryKey: ['/api/user/profile'] });
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Profile picture delete mutation
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/user/profile-picture');
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.refetchQueries({ queryKey: ['/api/user/profile'] });
      
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Profile picture upload handlers
  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (file: File, uploadURL?: string) => {
    try {
      if (uploadURL) {
        // Use the actual upload URL that was used for the upload
        uploadProfilePictureMutation.mutate(uploadURL);
      } else {
        throw new Error('No upload URL provided');
      }
    } catch (error) {
      console.error('Error handling upload completion:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to complete profile picture update. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfilePicture = () => {
    deleteProfilePictureMutation.mutate();
  };

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
    // Use the secure signout mutation instead of just client-side navigation
    signoutMutation.mutate();
  };
  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container pl-[0px] pr-[0px] ml-[0px] mr-[0px]">
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
              {/* User Info Section - Redesigned Layout */}
              <div className="space-y-3">
                {/* Profile Picture and Basic Info */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {currentUser.profileImageUrl ? (
                      <button
                        onClick={() => setShowImagePreview(true)}
                        className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg cursor-pointer group relative"
                        data-testid="button-preview-profile-image"
                      >
                        {isImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                        <img 
                          src={currentUser.profileImageUrl} 
                          alt="Profile"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          data-testid="profile-image"
                          onLoad={() => setIsImageLoading(false)}
                          onError={() => setIsImageLoading(false)}
                          style={{ display: isImageLoading ? 'none' : 'block' }}
                        />
                      </button>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                        <UserIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-black dark:text-white truncate">{currentUser.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{currentUser.email}</p>
                    {uploadProfilePictureMutation.isPending && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Uploading profile picture...</p>
                    )}
                    {deleteProfilePictureMutation.isPending && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Removing profile picture...</p>
                    )}
                  </div>
                </div>
                
                {/* Profile Picture Actions - Separate Row */}
                <div className="flex gap-2">
                  {currentUser.profileImageUrl ? (
                    <>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                        buttonClassName="flex-1 justify-center text-xs h-8"
                      >
                        <Camera className="w-3 h-3 mr-2" />
                        Update Picture
                      </ObjectUploader>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteProfilePicture}
                        disabled={deleteProfilePictureMutation.isPending}
                        className="px-3 h-8 text-xs border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        data-testid="button-delete-profile-picture"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </>
                  ) : (
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full justify-center text-xs h-8"
                    >
                      <Camera className="w-3 h-3 mr-2" />
                      Add Profile Picture
                    </ObjectUploader>
                  )}
                </div>
              </div>
              
              {/* Sign Out Button - Full Width on Mobile */}
              <Button
                onClick={handleSignOut}
                disabled={signoutMutation.isPending}
                variant="outline"
                className="w-full border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ios-button touch-target"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signoutMutation.isPending ? "Signing Out..." : "Sign Out"}
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

        {/* Legal & Compliance - Enhanced Smooth Collapsible Section */}
        <Card className="ios-smooth-transform overflow-hidden">
          <CardContent className="p-0">
            <Collapsible open={isLegalOpen} onOpenChange={setIsLegalOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-between h-12 px-4 ios-button touch-target transition-all duration-300 ease-out ${
                    isLegalOpen 
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950/40' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-out ${
                      isLegalOpen ? 'scale-110 bg-blue-200 dark:bg-blue-800' : ''
                    }`}>
                      <Info className={`w-3 h-3 text-blue-600 dark:text-blue-400 transition-all duration-300 ease-out ${
                        isLegalOpen ? 'scale-110' : ''
                      }`} />
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white transition-colors duration-300">Legal</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-all duration-300 ease-out ${
                      isLegalOpen ? 'rotate-180 text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400'
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 overflow-hidden">
                <div className="space-y-2 pt-3 animate-in fade-in-0 slide-in-from-top-1 duration-500 ease-out">
                  <Button
                    onClick={() => setLocation('/privacy-policy')}
                    variant="ghost"
                    className="w-full justify-start h-9 text-sm ios-button touch-target transition-all duration-200 ease-out hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:translate-x-1 hover:shadow-sm group"
                  >
                    <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Privacy Policy
                    </span>
                  </Button>
                  <Button
                    onClick={() => setLocation('/terms-of-service')}
                    variant="ghost"
                    className="w-full justify-start h-9 text-sm ios-button touch-target transition-all duration-200 ease-out hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:translate-x-1 hover:shadow-sm group"
                  >
                    <span className="transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Terms of Service
                    </span>
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>
      {/* Profile Picture Preview Modal */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-md mx-auto p-0">
          <div className="relative">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-200"
              data-testid="button-close-preview"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {currentUser.profileImageUrl && (
              <img 
                src={currentUser.profileImageUrl} 
                alt="Profile Preview"
                className="w-full max-h-[80vh] object-contain rounded-lg"
                data-testid="profile-image-preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}