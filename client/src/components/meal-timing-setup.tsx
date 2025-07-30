import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Target, Settings } from "lucide-react";

interface MealTimingPreference {
  id: number;
  userId: number;
  wakeTime: string;
  sleepTime: string;
  workoutTime?: string;
  workoutDays: string[];
  mealsPerDay: number;
  preWorkoutMeals: number;
  postWorkoutMeals: number;
}

interface MealTimingSetupProps {
  userId: number;
}

const weekDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

export function MealTimingSetup({ userId }: MealTimingSetupProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    wakeTime: "07:00",
    sleepTime: "23:00",
    workoutTime: "",
    workoutDays: [] as string[],
    mealsPerDay: 4,
    preWorkoutMeals: 1,
    postWorkoutMeals: 1,
  });

  // Fetch existing preferences
  const { data: preferences, isLoading } = useQuery<MealTimingPreference>({
    queryKey: ["/api/meal-timing", userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Update form data when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setFormData({
        wakeTime: preferences.wakeTime,
        sleepTime: preferences.sleepTime,
        workoutTime: preferences.workoutTime || "",
        workoutDays: preferences.workoutDays || [],
        mealsPerDay: preferences.mealsPerDay,
        preWorkoutMeals: preferences.preWorkoutMeals,
        postWorkoutMeals: preferences.postWorkoutMeals,
      });
    }
  }, [preferences]);

  // Create/update preferences mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (preferences) {
        return apiRequest("PUT", `/api/meal-timing`, { ...data });
      } else {
        return apiRequest("POST", `/api/meal-timing`, { ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-timing"] });
      toast({ title: t("Meal timing preferences saved successfully") });
    },
    onError: () => {
      toast({ title: t("Failed to save meal timing preferences"), variant: "destructive" });
    },
  });

  const handleWorkoutDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workoutDays: checked 
        ? [...prev.workoutDays, day]
        : prev.workoutDays.filter(d => d !== day)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("Meal Timing Preferences")}
        </CardTitle>
        <CardDescription>
          {t("Set up your daily schedule to optimize meal timing around workouts and lifestyle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sleep Schedule */}
          <div className="space-y-4">
            <h4 className="font-medium">{t("Sleep Schedule")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wakeTime">{t("Wake Time")}</Label>
                <Input
                  id="wakeTime"
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, wakeTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleepTime">{t("Sleep Time")}</Label>
                <Input
                  id="sleepTime"
                  type="time"
                  value={formData.sleepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleepTime: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Workout Schedule */}
          <div className="space-y-4">
            <h4 className="font-medium">{t("Workout Schedule")}</h4>
            <div className="space-y-2">
              <Label htmlFor="workoutTime">{t("Typical Workout Time")} ({t("Optional")})</Label>
              <Input
                id="workoutTime"
                type="time"
                value={formData.workoutTime}
                onChange={(e) => setFormData(prev => ({ ...prev, workoutTime: e.target.value }))}
                placeholder={t("Leave empty if irregular")}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t("Workout Days")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weekDays.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={formData.workoutDays.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleWorkoutDayChange(day.value, checked as boolean)}
                    />
                    <Label htmlFor={day.value} className="text-sm">
                      {t(day.label)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meal Distribution */}
          <div className="space-y-4">
            <h4 className="font-medium">{t("Meal Distribution")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mealsPerDay">{t("Meals Per Day")}</Label>
                <Select 
                  value={formData.mealsPerDay.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mealsPerDay: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 {t("meals")}</SelectItem>
                    <SelectItem value="4">4 {t("meals")}</SelectItem>
                    <SelectItem value="5">5 {t("meals")}</SelectItem>
                    <SelectItem value="6">6 {t("meals")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preWorkoutMeals">{t("Pre-Workout Meals")}</Label>
                <Select 
                  value={formData.preWorkoutMeals.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preWorkoutMeals: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postWorkoutMeals">{t("Post-Workout Meals")}</Label>
                <Select 
                  value={formData.postWorkoutMeals.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, postWorkoutMeals: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h5 className="font-medium text-sm">{t("Preview")}</h5>
            <div className="text-sm text-muted-foreground">
              <p>{t("Daily eating window")}: {formData.wakeTime} - {formData.sleepTime}</p>
              <p>{t("Total meals")}: {formData.mealsPerDay}</p>
              {formData.workoutTime && (
                <p>{t("Workout timing optimization enabled for")} {formData.workoutTime}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              <Settings className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? t("Saving...") : t("Save Preferences")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}