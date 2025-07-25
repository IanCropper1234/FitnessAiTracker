import { UserProfile } from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, User as UserIcon, Globe, Sun, Moon, Settings, Code, Target, Info, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Diet Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              Your diet goals are automatically set based on your fitness goal: <strong>{fitnessGoal}</strong>
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              When you change your fitness goal in the profile below, your diet goals will update automatically.
            </p>
          </div>
        </div>

        {dietGoals && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Goal</label>
                <p className={`text-lg font-semibold ${getGoalColor(dietGoals.goal)}`}>
                  {getGoalDescription(dietGoals.goal)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Weight Target</label>
                <p className="text-lg font-semibold text-black dark:text-white">
                  {weeklyTarget > 0 ? `+${weeklyTarget}kg` : weeklyTarget < 0 ? `${weeklyTarget}kg` : '0kg'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calories</p>
                <p className="text-lg font-bold text-black dark:text-white">{dietGoals.targetCalories}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Protein</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{dietGoals.targetProtein}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Carbs</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{dietGoals.targetCarbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fat</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{dietGoals.targetFat}g</p>
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
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
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
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
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

        {/* Diet Goals Card */}
        <DietGoalsCard userId={user.id} />

        {/* Profile Component */}
        <UserProfile userId={user.id} />
      </div>
    </div>
  );
}