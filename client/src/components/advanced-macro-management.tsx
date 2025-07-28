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

  // Get comprehensive analytics for weight change data
  const { data: comprehensiveAnalytics } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId, 14], // 14 days to capture weight data from July 9-14
    queryFn: async () => {
      const response = await fetch(`/api/analytics/comprehensive/${userId}?days=14`);
      return response.json();
    }
  });

  // Mutations for creating distributions and flexibility rules
  const createDistributionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/meal-distribution", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-distribution', userId] });
      toast({
        title: "Success",
        description: "Meal distribution created successfully"
      });
    }
  });

  const createFlexibilityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/flexibility-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flexibility-rules', userId] });
      toast({
        title: "Success", 
        description: "Flexibility rule created successfully"
      });
    }
  });

  // Generate weekly adjustment mutation
  const weeklyAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/weekly-adjustment", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      
      const { adjustment, appliedToCurrentGoals } = response;
      toast({
        title: "Weekly Adjustment Applied",
        description: appliedToCurrentGoals 
          ? `Your target calories updated to ${adjustment.newCalories} (${adjustment.adjustmentPercentage > 0 ? '+' : ''}${adjustment.adjustmentPercentage}%)` 
          : "Weekly analysis recorded. Target macros maintained."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to apply weekly adjustment",
        variant: "destructive"
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
    if (!dietGoals || !selectedWeek) {
      toast({
        title: "Missing Data",
        description: "Please select a week and ensure diet goals are set",
        variant: "destructive"
      });
      return;
    }

    // Use actual data from weeklyGoals if available, otherwise defaults
    const adherence = weeklyGoals?.[0]?.adherencePercentage ? parseFloat(weeklyGoals[0].adherencePercentage) : 85;
    const energy = weeklyGoals?.[0]?.energyLevels || 7;
    const hunger = weeklyGoals?.[0]?.hungerLevels || 5;

    const adjustmentData = {
      userId,
      weekStartDate: selectedWeek,
      currentGoals: dietGoals,
      adjustmentReason: "progress_check",
      energyLevels: energy,
      hungerLevels: hunger,
      adherencePercentage: adherence
    };

    weeklyAdjustmentMutation.mutate(adjustmentData);
  };

  // Calculate adjustment recommendation based on current data
  const recommendation = (() => {
    if (!weeklyGoals || weeklyGoals.length === 0 || !comprehensiveAnalytics) return null;

    const latestWeek = weeklyGoals[0];
    const adherence = parseFloat(latestWeek.adherencePercentage || "0");
    // Use weight change from comprehensive analytics (actual weight data)
    const weightChange = comprehensiveAnalytics.overview.weightChange || 0;
    // Convert to weekly rate (analytics is 14-day period, so divide by 2)
    const weeklyWeightChange = weightChange / 2;

    let rec = {
      type: "maintain" as const,
      message: "Continue with current macros",
      calorieChange: 0,
      reason: "Good progress"
    };

    if (dietGoals?.goal === "cut") {
      if (weeklyWeightChange > -0.2) { // Less than 0.2kg loss per week
        rec = {
          type: "decrease" as const,
          message: "Reduce calories for better fat loss",
          calorieChange: -100,
          reason: "Weight loss too slow"
        };
      } else if (weeklyWeightChange < -0.8) { // More than 0.8kg loss per week
        rec = {
          type: "increase" as const,
          message: "Increase calories to prevent muscle loss",
          calorieChange: 50,
          reason: "Weight loss too fast"
        };
      }
    } else if (dietGoals?.goal === "bulk") {
      if (weeklyWeightChange < 0.2) { // Less than 0.2kg gain per week
        rec = {
          type: "increase" as const,
          message: "Increase calories for muscle growth",
          calorieChange: 100,
          reason: "Weight gain too slow"
        };
      } else if (weeklyWeightChange > 0.5) { // More than 0.5kg gain per week
        rec = {
          type: "decrease" as const,
          message: "Reduce calories to minimize fat gain",
          calorieChange: -75,
          reason: "Weight gain too fast"
        };
      }
    } else if (dietGoals?.goal === "maintain") {
      // For maintenance, slight adjustments based on weight trends
      if (weeklyWeightChange > 0.3) { // Gaining weight on maintenance
        rec = {
          type: "decrease" as const,
          message: "Slight calorie reduction to maintain weight",
          calorieChange: -50,
          reason: "Weight trending upward"
        };
      } else if (weeklyWeightChange < -0.3) { // Losing weight on maintenance
        rec = {
          type: "increase" as const,
          message: "Slight calorie increase to maintain weight",
          calorieChange: 50,
          reason: "Weight trending downward"
        };
      } else {
        // Good weight maintenance but check for muscle gain opportunity
        if (adherence >= 90 && weeklyWeightChange >= 0.2 && weeklyWeightChange <= 0.4) {
          rec = {
            type: "increase" as const,
            message: "Consider lean muscle gain phase",
            calorieChange: 150,
            reason: "Good adherence + controlled weight gain = muscle building opportunity"
          };
        }
      }
    }

    if (adherence < 80) {
      rec.message += " (Focus on adherence first)";
    }

    return rec;
  })();

  // Create default RP-based meal distribution
  const createDefaultMealDistribution = async () => {
    const defaultDistributions = [
      {
        userId,
        mealType: "breakfast",
        mealTiming: "regular",
        proteinPercentage: 25,
        carbPercentage: 30,
        fatPercentage: 20,
        caloriePercentage: 25
      },
      {
        userId,
        mealType: "pre_workout",
        mealTiming: "pre_workout", 
        proteinPercentage: 15,
        carbPercentage: 65,
        fatPercentage: 5,
        caloriePercentage: 15
      },
      {
        userId,
        mealType: "post_workout",
        mealTiming: "post_workout",
        proteinPercentage: 45,
        carbPercentage: 35,
        fatPercentage: 10,
        caloriePercentage: 25
      },
      {
        userId,
        mealType: "dinner",
        mealTiming: "regular",
        proteinPercentage: 30,
        carbPercentage: 20,
        fatPercentage: 35,
        caloriePercentage: 35
      }
    ];

    for (const distribution of defaultDistributions) {
      await createDistributionMutation.mutateAsync(distribution);
    }
  };

  // Create default flexibility rules for social eating
  const createDefaultFlexibilityRules = async () => {
    const defaultRules = [
      {
        userId,
        ruleName: "Weekend Social Eating",
        triggerDays: ["saturday", "sunday"],
        flexProtein: 10,
        flexCarbs: 25,
        flexFat: 20,
        compensationStrategy: "reduce_next_day",
        isActive: true
      },
      {
        userId,
        ruleName: "Business Lunch",
        triggerDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        flexProtein: 15,
        flexCarbs: 30,
        flexFat: 25,
        compensationStrategy: "reduce_next_meal",
        isActive: true
      }
    ];

    for (const rule of defaultRules) {
      await createFlexibilityMutation.mutateAsync(rule);
    }
  };



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
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <TabsTrigger value="weekly-adjustment" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Weekly Adjustment</TabsTrigger>
          <TabsTrigger value="meal-distribution" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Meal Distribution</TabsTrigger>
          <TabsTrigger value="macro-flexibility" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Macro Flexibility</TabsTrigger>
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
              {/* Show loading state when no data is available */}
              {!selectedWeek && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a week with food logs to view progress analysis
                  </p>
                </div>
              )}

              {/* Show recommendation if available */}
              {recommendation && selectedWeek && (
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
                          {weeklyGoals[0].energyLevels || 'N/A'}/10
                        </span>
                      </div>
                      <Progress value={(parseFloat(weeklyGoals[0].energyLevels?.toString() || "0") / 10) * 100} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-black dark:text-white">Weekly Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Weight Change</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {comprehensiveAnalytics?.overview?.weightChange 
                            ? `${comprehensiveAnalytics.overview.weightChange > 0 ? '+' : ''}${comprehensiveAnalytics.overview.weightChange.toFixed(1)}kg`
                            : '0.0kg'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Calorie Adjustment</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {(weeklyGoals && weeklyGoals[0] && weeklyGoals[0].adjustmentPercentage) 
                            ? `${weeklyGoals[0].adjustmentPercentage}%`
                            : '0.0%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Only show adjustment button when there's valid data */}
              {selectedWeek && weeklyGoals && weeklyGoals.length > 0 && (
                <Button
                  onClick={handleWeeklyAdjustment}
                  disabled={weeklyAdjustmentMutation.isPending || !dietGoals}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {weeklyAdjustmentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Applying Adjustment...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Weekly Adjustment
                    </>
                  )}
                </Button>
              )}

              {/* Show message when no adjustment data is available */}
              {selectedWeek && (!weeklyGoals || weeklyGoals.length === 0) && (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                  No weekly progress data available for this period. Complete some food logs first.
                </div>
              )}
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
              {mealDistribution && mealDistribution.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {mealDistribution.map((meal: any) => (
                      <div key={meal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium capitalize">{meal.mealType}</h3>
                            {meal.mealTiming && (
                              <Badge variant="outline" className="text-xs">
                                {meal.mealTiming.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {parseFloat(meal.caloriePercentage || 0).toFixed(0)}% calories
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-red-600 font-medium">
                              {parseFloat(meal.proteinPercentage || 0).toFixed(0)}%
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-medium">
                              {parseFloat(meal.carbPercentage || 0).toFixed(0)}%
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-600 font-medium">
                              {parseFloat(meal.fatPercentage || 0).toFixed(0)}%
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">Fat</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      RP Methodology Notes:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Pre-workout: Higher carbs (60-70%) for energy</li>
                      <li>• Post-workout: High protein (40-50%) + moderate carbs</li>
                      <li>• Regular meals: Balanced macros based on daily targets</li>
                      <li>• Evening meals: Lower carbs, higher fat for recovery</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No meal distributions configured yet
                  </p>
                  <Button 
                    onClick={() => createDefaultMealDistribution()}
                    disabled={createDistributionMutation.isPending}
                  >
                    {createDistributionMutation.isPending ? (
                      <>Creating...</>
                    ) : (
                      <>Create Default RP Distribution</>
                    )}
                  </Button>
                </div>
              )}
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
              {flexibilityRules && flexibilityRules.length > 0 ? (
                <div className="space-y-4">
                  {flexibilityRules.map((rule: any) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{rule.ruleName}</h3>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Trigger Days:</p>
                          <div className="flex gap-1 mt-1">
                            {rule.triggerDays?.map((day: string) => (
                              <Badge key={day} variant="outline" className="text-xs capitalize">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Compensation:</p>
                          <p className="text-sm font-medium capitalize">
                            {rule.compensationStrategy?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-red-600 font-medium">
                            ±{parseFloat(rule.flexProtein || 0).toFixed(0)}%
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">
                            ±{parseFloat(rule.flexCarbs || 0).toFixed(0)}%
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-600 font-medium">
                            ±{parseFloat(rule.flexFat || 0).toFixed(0)}%
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Fat</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Flexibility Tips:
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• Weekend rules allow higher fat/carb flexibility</li>
                      <li>• Business lunches can compensate with lighter dinner</li>
                      <li>• Social events: Bank calories earlier in the day</li>
                      <li>• Next-day compensation maintains weekly averages</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No flexibility rules configured yet
                  </p>
                  <Button 
                    onClick={() => createDefaultFlexibilityRules()}
                    disabled={createFlexibilityMutation.isPending}
                  >
                    {createFlexibilityMutation.isPending ? (
                      <>Creating...</>
                    ) : (
                      <>Create Default Flexibility Rules</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}