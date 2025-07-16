import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Settings, Target, LogOut } from "lucide-react";
import { useLocation } from "wouter";

const profileSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(13).max(120),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  activityLevel: z.string(),
  fitnessGoal: z.string(),
});

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("fitai-user") || "{}");
  const userId = user.id;

  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile", userId],
    enabled: !!userId,
  });

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      age: profileData?.profile?.age || 25,
      weight: Number(profileData?.profile?.weight) || 70,
      height: Number(profileData?.profile?.height) || 170,
      activityLevel: profileData?.profile?.activityLevel || "moderately_active",
      fitnessGoal: profileData?.profile?.fitnessGoal || "muscle_gain",
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/user/profile/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: t("profile.profile_updated"),
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t("error.failed_submit"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (data: any) => {
    updateProfile.mutate(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("fitai-user");
    setLocation("/auth");
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "ja", name: "日本語" },
    { code: "zh-CN", name: "简体中文" },
    { code: "de", name: "Deutsch" },
    { code: "zh-TW", name: "繁體中文" },
  ];

  const activityLevels = [
    { value: "sedentary", label: t("profile.sedentary") },
    { value: "lightly_active", label: t("profile.lightly_active") },
    { value: "moderately_active", label: t("profile.moderately_active") },
    { value: "very_active", label: t("profile.very_active") },
  ];

  const fitnessGoals = [
    { value: "fat_loss", label: t("profile.fat_loss") },
    { value: "muscle_gain", label: t("profile.muscle_gain") },
    { value: "maintenance", label: t("profile.maintenance") },
  ];

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 safe-area-top">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{user.name || "User"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Personal Information */}
        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{t("profile.personal_info")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t("profile.age")}</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register("age", { valueAsNumber: true })}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t("profile.weight")} (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...form.register("weight", { valueAsNumber: true })}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">{t("profile.height")} (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  {...form.register("height", { valueAsNumber: true })}
                  placeholder="170"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("profile.activity_level")}</Label>
                <Select
                  value={form.watch("activityLevel")}
                  onValueChange={(value) => form.setValue("activityLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("profile.fitness_goal")}</Label>
                <Select
                  value={form.watch("fitnessGoal")}
                  onValueChange={(value) => form.setValue("fitnessGoal", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fitnessGoals.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="w-full"
              >
                {updateProfile.isPending ? t("common.submitting") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>{t("profile.preferences")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("profile.language")}</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t("profile.theme")}</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? t("profile.dark_mode") : t("profile.light_mode")}
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="card-surface">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>{t("profile.goals")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-400">2,100</div>
                <div className="text-sm text-muted-foreground">Daily Calories</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-400">150g</div>
                <div className="text-sm text-muted-foreground">Daily Protein</div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Implement macro goal calculation
                toast({
                  title: "Coming Soon",
                  description: "Macro calculation will be available soon",
                });
              }}
            >
              Recalculate Macros
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="card-surface">
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
