import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Calendar, Settings, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdvancedMacroManagementProps {
  userId: number;
}

export function AdvancedMacroManagement({ userId }: AdvancedMacroManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  // Get current diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get available weeks with food log data
  const { data: availableWeeks } = useQuery({
    queryKey: ['/api/nutrition/available-weeks', userId],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/available-weeks/${userId}`);
      return response.json();
    }
  });

  // Set default selected week to the most recent week with data
  useEffect(() => {
    if (availableWeeks && availableWeeks.length > 0 && !selectedWeek) {
      setSelectedWeek(availableWeeks[0].weekStart);
    }
  }, [availableWeeks, selectedWeek]);

  // Get weekly nutrition goals
  const { data: weeklyGoals } = useQuery({
    queryKey: ['/api/weekly-goals', userId, selectedWeek],
    queryFn: async () => {
      if (!selectedWeek) return [];
      const response = await fetch(`/api/weekly-goals/${userId}?week=${selectedWeek}`);
      return response.json();
    },
    enabled: !!selectedWeek
  });

  // Get meal macro distribution
  const { data: mealDistribution } = useQuery({
    queryKey: ['/api/meal-distribution', userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-distribution/${userId}`);
      return response.json();
    }
  });

  // Get macro flexibility rules
  const { data: flexibilityRules } = useQuery({
    queryKey: ['/api/flexibility-rules', userId],
    queryFn: async () => {
      const response = await fetch(`/api/flexibility-rules/${userId}`);
      return response.json();
    }
  });

  // Generate weekly adjustment mutation
  const weeklyAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/weekly-adjustment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
      toast({
        title: "Weekly Adjustment Applied",
        description: "Your macros have been updated based on your progress!"
      });
    }
  });

  // Create meal distribution mutation
  const mealDistributionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/meal-distribution", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-distribution'] });
      toast({
        title: "Meal Distribution Updated",
        description: "Your macro distribution across meals has been saved!"
      });
    }
  });

  const handleWeeklyAdjustment = () => {
    if (!dietGoals) return;

    const adjustmentData = {
      userId,
      weekStartDate: selectedWeek,
      currentGoals: dietGoals,
      adjustmentReason: "progress_check",
      energyLevels: 7, // Default values - could be from user input
      hungerLevels: 5,
      adherencePercentage: 85
    };

    weeklyAdjustmentMutation.mutate(adjustmentData);
  };

  const calculateAdjustmentRecommendation = () => {
    if (!weeklyGoals || weeklyGoals.length === 0) return null;

    const latestWeek = weeklyGoals[0];
    const weightChange = parseFloat(latestWeek.currentWeight || "0") - parseFloat(latestWeek.previousWeight || "0");
    const adherence = parseFloat(latestWeek.adherencePercentage || "0");

    let recommendation = {
      type: "maintain",
      message: "Continue with current macros",
      calorieChange: 0,
      reason: "Good progress"
    };

    if (dietGoals?.goal === "cut") {
      if (weightChange > -0.2) { // Less than 0.2kg loss per week
        recommendation = {
          type: "decrease",
          message: "Reduce calories for better fat loss",
          calorieChange: -100,
          reason: "Weight loss too slow"
        };
      } else if (weightChange < -0.8) { // More than 0.8kg loss per week
        recommendation = {
          type: "increase",
          message: "Increase calories to prevent muscle loss",
          calorieChange: 50,
          reason: "Weight loss too fast"
        };
      }
    } else if (dietGoals?.goal === "bulk") {
      if (weightChange < 0.2) { // Less than 0.2kg gain per week
        recommendation = {
          type: "increase",
          message: "Increase calories for muscle growth",
          calorieChange: 100,
          reason: "Weight gain too slow"
        };
      } else if (weightChange > 0.5) { // More than 0.5kg gain per week
        recommendation = {
          type: "decrease",
          message: "Reduce calories to minimize fat gain",
          calorieChange: -75,
          reason: "Weight gain too fast"
        };
      }
    }

    if (adherence < 80) {
      recommendation.message += " (Focus on adherence first)";
    }

    return recommendation;
  };

  const recommendation = calculateAdjustmentRecommendation();

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Advanced Macro Management
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            RP-based weekly adjustments and meal-by-meal macro distribution
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="weekly-adjustment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly-adjustment">Weekly Adjustment</TabsTrigger>
          <TabsTrigger value="meal-distribution">Meal Distribution</TabsTrigger>
          <TabsTrigger value="macro-flexibility">Macro Flexibility</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly-adjustment" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Progress Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="week-select" className="text-black dark:text-white">Week:</Label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a week with food logs" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWeeks?.map((week: any) => (
                      <SelectItem key={week.weekStart} value={week.weekStart}>
                        {week.weekLabel} ({week.logCount} logs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {recommendation && (
                <div className={`p-4 rounded-lg border ${
                  recommendation.type === 'increase' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  recommendation.type === 'decrease' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {recommendation.type === 'increase' ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                     recommendation.type === 'decrease' ? <TrendingDown className="w-5 h-5 text-red-600" /> :
                     <Target className="w-5 h-5 text-blue-600" />}
                    <h3 className="font-semibold text-black dark:text-white">
                      Adjustment Recommendation
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{recommendation.message}</p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-sm">
                      {recommendation.calorieChange > 0 ? '+' : ''}{recommendation.calorieChange} calories
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{recommendation.reason}</span>
                  </div>
                </div>
              )}

              {weeklyGoals && weeklyGoals.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-black dark:text-white">Progress Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Adherence</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {weeklyGoals[0].adherencePercentage || 0}%
                        </span>
                      </div>
                      <Progress value={parseFloat(weeklyGoals[0].adherencePercentage || "0")} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Energy Level</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {weeklyGoals[0].energyLevels || 0}/10
                        </span>
                      </div>
                      <Progress value={(parseFloat(weeklyGoals[0].energyLevels || "0") / 10) * 100} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-black dark:text-white">Weekly Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Weight Change</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {((parseFloat(weeklyGoals[0].currentWeight || "0") - parseFloat(weeklyGoals[0].previousWeight || "0")) || 0).toFixed(1)}kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Calorie Adjustment</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {weeklyGoals[0].adjustmentPercentage || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleWeeklyAdjustment}
                disabled={weeklyAdjustmentMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Apply Weekly Adjustment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meal-distribution" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white">
                Meal-by-Meal Macro Distribution
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Customize macro percentages for each meal based on RP principles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                Meal distribution configuration coming soon...
                <br />
                <span className="text-sm">This will allow you to set different macro ratios for each meal</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macro-flexibility" className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white">
                Macro Flexibility Rules
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Set up flexible macro ranges for social eating and special occasions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                Macro flexibility system coming soon...
                <br />
                <span className="text-sm">This will allow you to set flexible macro ranges for weekends and social events</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}