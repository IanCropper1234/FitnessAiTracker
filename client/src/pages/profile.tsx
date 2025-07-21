import { UserProfile } from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, User as UserIcon, Globe, Sun, Moon, Settings, Code } from "lucide-react";
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
      return apiRequest(`/api/auth/user/${user.id}/developer-settings`, {
        method: 'PUT',
        body: { showDeveloperFeatures }
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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 pl-[7px] pr-[7px] pt-[7px] pb-[7px] mt-[0px] mb-[0px] ml-[6px] mr-[6px]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Settings Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">App Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your app preferences</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
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
                  <label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                    {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    Theme
                  </label>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Switch to Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Switch to Light Mode
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Developer Settings - Only show for specific users */}
              {userData?.email === 'c0109009@gmail.com' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Code className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white">Developer Settings</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Advanced features for development</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="developer-features" className="text-sm font-medium">
                          Show V2 Feature Buttons
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Display Demo V2 and V2 Features buttons in the training tab
                        </p>
                      </div>
                      <Switch
                        id="developer-features"
                        checked={userData?.showDeveloperFeatures || false}
                        onCheckedChange={(checked) => {
                          updateDeveloperSettingsMutation.mutate(checked);
                        }}
                        disabled={updateDeveloperSettingsMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Component */}
        <UserProfile userId={user.id} />
      </div>
    </div>
  );
}