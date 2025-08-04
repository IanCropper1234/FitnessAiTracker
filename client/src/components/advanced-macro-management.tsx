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
import { TrendingUp, TrendingDown, Target, Calendar, Settings, Zap, ArrowRight, Heart, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnitConverter } from "@shared/utils/unit-conversion";
import { TimezoneUtils } from "@shared/utils/timezone";
import { useLocation } from "wouter";
import DailyWellnessCheckin from "./daily-wellness-checkin";
import { RPAnalysis } from "./rp-analysis";
import { RPRecommendations } from "./rp-recommendations";


interface AdvancedMacroManagementProps {
  userId: number;
}

export function AdvancedMacroManagement({ userId }: AdvancedMacroManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [showWellnessInfo, setShowWellnessInfo] = useState(false);

  // Get current diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals'],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get user's body metrics for unit preference detection
  const { data: bodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Get user profile for unit preferences
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get weight goals to show target in Progress Metrics
  const { data: weightGoals } = useQuery({
    queryKey: ['/api/weight-goals'],
    queryFn: async () => {
      const response = await fetch(`/api/weight-goals`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Get available weeks with food log data
  const { data: availableWeeks } = useQuery({
    queryKey: ['/api/nutrition/available-weeks'],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/available-weeks`, {
        credentials: 'include'
      });
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
  const { data: rawWeeklyGoals } = useQuery({
    queryKey: ['/api/weekly-goals', selectedWeek],
    queryFn: async () => {
      if (!selectedWeek) return [];
      const response = await fetch(`/api/weekly-goals?weekStartDate=${selectedWeek}`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!selectedWeek
  });

  // Use weekly goals data directly (unit conversion handled in backend)
  const weeklyGoals = rawWeeklyGoals || [];

  // Get user's preferred weight unit
  const getUserWeightUnit = () => {
    return UnitConverter.getUserWeightUnit(userProfile?.userProfile, bodyMetrics);
  };

  // Get current week's wellness check-ins count
  const { data: weeklyWellnessStatus } = useQuery({
    queryKey: ['/api/weekly-wellness-summary'],
    queryFn: async () => {
      // Get current week start date (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, otherwise go back (dayOfWeek - 1) days
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      const weekStartString = weekStart.toISOString().split('T')[0];
      
      const response = await fetch(`/api/weekly-wellness-summary?weekStartDate=${weekStartString}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get today's wellness check-in status with user timezone support
  const { data: todayWellnessCheckin } = useQuery({
    queryKey: ['/api/daily-wellness-checkins-advanced', TimezoneUtils.getCurrentDate()],
    queryFn: async () => {
      // Use user's local date from TimezoneUtils
      const today = TimezoneUtils.getCurrentDate();
      console.log('Advanced Macro Management - Checking wellness for user local date:', today);
      const response = await fetch(`/api/daily-wellness-checkins?date=${today}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) return null;
      const result = await response.json();
      console.log('Advanced Macro Management - Wellness result for local date:', result);
      return result;
    },
    staleTime: 0, // Always refetch to get the latest status
    gcTime: 0 // Don't cache this data
  });

  // Convert weight change to user's preferred unit
  const formatWeightChange = (weightChange: number) => {
    if (!weightChange) return '0.0kg';
    
    const preferredUnit = getUserWeightUnit();
    const convertedChange = UnitConverter.convertWeightChange(
      weightChange, 
      'kg', // Weight changes from analytics are typically in kg
      preferredUnit
    );
    
    const unitLabel = preferredUnit === 'lbs' ? 'lbs' : 'kg';
    const sign = convertedChange > 0 ? '+' : '';
    
    return `${sign}${convertedChange.toFixed(1)}${unitLabel}`;
  };

  // Get actual weekly weight change from weekly goals data with proper NULL handling
  const getWeeklyWeightChange = () => {
    if (weeklyGoals && weeklyGoals.length > 0) {
      // Try to get weight change from current and previous weights
      if (weeklyGoals[0].currentWeight && weeklyGoals[0].previousWeight) {
        const current = parseFloat(weeklyGoals[0].currentWeight);
        const previous = parseFloat(weeklyGoals[0].previousWeight);
        if (!isNaN(current) && !isNaN(previous)) {
          return current - previous;
        }
      }
      // Fallback to direct weight change field
      if (weeklyGoals[0].weightChange) {
        const weightChange = parseFloat(weeklyGoals[0].weightChange);
        return !isNaN(weightChange) ? weightChange : null;
      }
    }
    return null; // Return null when no valid weight data available
  };

  // Format weight change with user's preferred unit
  const formatWeightChangeWithUnit = (weightChange: number) => {
    // Handle NULL, undefined, or NaN values properly
    if (weightChange === null || weightChange === undefined || isNaN(weightChange)) {
      return 'No data';
    }
    
    const preferredUnit = getUserWeightUnit();
    const convertedChange = UnitConverter.convertWeightChange(
      weightChange, 
      'kg', // Weight changes are stored in kg
      preferredUnit
    );
    
    const unitLabel = preferredUnit === 'lbs' ? 'lbs' : 'kg';
    const sign = convertedChange > 0 ? '+' : '';
    
    return `${sign}${convertedChange.toFixed(1)}${unitLabel}`;
  };

  // Get meal macro distribution
  const { data: mealDistribution } = useQuery({
    queryKey: ['/api/meal-distribution'],
    queryFn: async () => {
      const response = await fetch(`/api/meal-distribution`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Get macro flexibility rules
  const { data: flexibilityRules } = useQuery({
    queryKey: ['/api/flexibility-rules'],
    queryFn: async () => {
      const response = await fetch(`/api/flexibility-rules`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Get comprehensive analytics for weight change data
  const { data: comprehensiveAnalytics } = useQuery({
    queryKey: ['/api/analytics/comprehensive', 14], // 14 days to capture weight data from July 9-14
    queryFn: async () => {
      const response = await fetch(`/api/analytics/comprehensive?days=14`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Mutations for creating distributions and flexibility rules
  const createDistributionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/meal-distribution", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-distribution'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/flexibility-rules'] });
      toast({
        title: "Success", 
        description: "Flexibility rule created successfully"
      });
    }
  });

  // Generate weekly adjustment mutation
  const weeklyAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Making weekly adjustment request with data:', data);
      const response = await fetch('/api/weekly-adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      console.log('Weekly adjustment response received:', jsonData);
      return jsonData;
    },
    onError: (error: any) => {
      console.error('Weekly adjustment mutation error:', error);
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
      weekStartDate: selectedWeek,
      currentGoals: dietGoals,
      adjustmentReason: "progress_check",
      energyLevels: energy,
      hungerLevels: hunger,
      adherencePercentage: adherence
    };

    weeklyAdjustmentMutation.mutate(adjustmentData, {
      onSuccess: (data) => {
        console.log('Weekly adjustment response in onSuccess callback:', data);
        
        if (!data) {
          console.error('Response data is undefined or null');
          toast({
            title: "Adjustment Failed",
            description: "No response data received from server",
            variant: "destructive"
          });
          return;
        }
        
        // Force refresh diet goals and other related data
        queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
        queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/weekly-goals'] });
        
        // Additional cache invalidation for diet builder components
        queryClient.refetchQueries({ queryKey: ['/api/diet-goals'] });
        
        console.log('Cache invalidated and refetch triggered');
        
        // Show success message with adjustment details
        console.log('appliedToCurrentGoals value:', data.appliedToCurrentGoals, 'type:', typeof data.appliedToCurrentGoals);
        
        // Ensure we're checking the exact boolean value
        if (data.appliedToCurrentGoals === true || data.appliedToCurrentGoals === "true") {
          toast({
            title: "✅ RP Adjustment Applied",
            description: data.message || `Diet goals updated. New target: ${Math.round(data.adjustment?.newCalories || 0)} calories`,
            variant: "default"
          });
        } else {
          console.log('Applied to current goals failed:', data.appliedToCurrentGoals);
          console.log('Full response data:', JSON.stringify(data, null, 2));
          toast({
            title: "Weekly Analysis Recorded", 
            description: data.message || "Unable to update diet goals automatically.",
            variant: "destructive"
          });
        }
      },
      onError: (error) => {
        console.error('Weekly adjustment onError callback:', error);
        toast({
          title: "Adjustment Failed",
          description: error.message || "Failed to apply weekly adjustment",
          variant: "destructive"
        });
      }
    });
  };

  // Calculate adjustment recommendation based on current data
  const recommendation = (() => {
    if (!weeklyGoals || weeklyGoals.length === 0 || !comprehensiveAnalytics) return null;

    const latestWeek = weeklyGoals[0];
    const adherence = parseFloat(latestWeek?.adherencePercentage || "0");
    // Use actual weekly weight change from weekly goals data
    const weeklyWeightChange = parseFloat(latestWeek?.weightChange || "0");

    let rec: {
      type: "maintain" | "increase" | "decrease";
      message: string;
      calorieChange: number;
      reason: string;
    } = {
      type: "maintain",
      message: "Continue with current macros",
      calorieChange: 0,
      reason: "Good progress"
    };

    if (dietGoals?.goal === "cut") {
      if (weeklyWeightChange > -0.2) { // Less than 0.2kg loss per week
        rec = {
          type: "decrease",
          message: "Reduce calories for better fat loss",
          calorieChange: -100,
          reason: "Weight loss too slow"
        };
      } else if (weeklyWeightChange < -0.8) { // More than 0.8kg loss per week
        rec = {
          type: "increase",
          message: "Increase calories to prevent muscle loss",
          calorieChange: 50,
          reason: "Weight loss too fast"
        };
      }
    } else if (dietGoals?.goal === "bulk") {
      if (weeklyWeightChange < 0.2) { // Less than 0.2kg gain per week
        rec = {
          type: "increase",
          message: "Increase calories for muscle growth",
          calorieChange: 100,
          reason: "Weight gain too slow"
        };
      } else if (weeklyWeightChange > 0.5) { // More than 0.5kg gain per week
        rec = {
          type: "decrease",
          message: "Reduce calories to minimize fat gain",
          calorieChange: -75,
          reason: "Weight gain too fast"
        };
      }
    } else if (dietGoals?.goal === "maintain") {
      // For maintenance, slight adjustments based on weight trends
      if (weeklyWeightChange > 0.3) { // Gaining weight on maintenance
        rec = {
          type: "decrease",
          message: "Slight calorie reduction to maintain weight",
          calorieChange: -50,
          reason: "Weight trending upward"
        };
      } else if (weeklyWeightChange < -0.3) { // Losing weight on maintenance
        rec = {
          type: "increase",
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
        mealType: "breakfast",
        mealTiming: "regular",
        proteinPercentage: 25,
        carbPercentage: 30,
        fatPercentage: 20,
        caloriePercentage: 25
      },
      {
        mealType: "pre_workout",
        mealTiming: "pre_workout", 
        proteinPercentage: 15,
        carbPercentage: 65,
        fatPercentage: 5,
        caloriePercentage: 15
      },
      {
        mealType: "post_workout",
        mealTiming: "post_workout",
        proteinPercentage: 45,
        carbPercentage: 35,
        fatPercentage: 10,
        caloriePercentage: 25
      },
      {
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
        ruleName: "Weekend Social Eating",
        triggerDays: ["saturday", "sunday"],
        flexProtein: 10,
        flexCarbs: 25,
        flexFat: 20,
        compensationStrategy: "reduce_next_day",
        isActive: true
      },
      {
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
      <Tabs defaultValue="weekly-adjustment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 h-10 border-0 shadow-none" role="tablist">
          <TabsTrigger 
            value="weekly-adjustment" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Weekly Adjustment
          </TabsTrigger>
          <TabsTrigger 
            value="rp-analysis" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            RP Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="rp-recommendations" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly-adjustment" className="space-y-4 tab-content-animated">
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
              {/* Mobile-Optimized Daily Wellness Check-in Section */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-[0px] pr-[0px] ml-[-15px] mr-[-15px]">
                <div className="p-3 sm:p-4">
                  {/* Header - Mobile stacked, Desktop inline */}
                  <div className="space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base truncate">Daily Wellness</h3>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Required</Badge>
                      <Badge 
                        variant={todayWellnessCheckin ? "default" : "outline"} 
                        className={`text-xs px-1.5 py-0.5 ${
                          todayWellnessCheckin 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" 
                            : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                        }`}
                      >
                        {todayWellnessCheckin ? "Complete" : "Incomplete"}
                      </Badge>
                    </div>
                    
                    {/* Buttons - Mobile full width, Desktop inline */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation('/rp-coach')}
                        className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20 text-xs sm:text-sm px-3 py-1.5"
                      >
                        Start Check-in
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWellnessInfo(!showWellnessInfo)}
                        className="w-full sm:w-auto justify-center sm:justify-start text-xs sm:text-sm px-3 py-1.5"
                      >
                        {showWellnessInfo ? 'Hide Info' : 'Show Info'}
                        {showWellnessInfo ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expandable information section */}
                  {showWellnessInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Daily wellness ratings are averaged weekly for macro adjustments using RP methodology.
                      </p>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 min-w-0">
                            <p className="font-medium mb-1">Status</p>
                            <p className="break-words">
                              {weeklyWellnessStatus ? 
                                'Weekly summary available! Data is being used for adjustments.' : 
                                'Need 3+ daily check-ins for automatic adjustments.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-xs">
                          Tracking:
                        </h4>
                        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                          <div>• Energy & hunger levels</div>
                          <div>• Sleep quality & stress</div>
                          <div>• Diet adherence</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show loading state when no data is available */}
              {!selectedWeek && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a week with food logs to view progress analysis
                  </p>
                </div>
              )}

              {/* Show enhanced RP methodology recommendation if available */}
              {weeklyGoals && weeklyGoals.length > 0 && weeklyGoals[0].adjustmentRecommendation && selectedWeek && (
                <div className="p-4 border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 pl-[16px] pr-[16px] ml-[-15px] mr-[-15px] mt-[10px] mb-[10px]">
                  <div className="flex items-center gap-2 mb-2">
                    {weeklyGoals[0].adjustmentRecommendation === 'increase_calories' && <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
                    {weeklyGoals[0].adjustmentRecommendation === 'decrease_calories' && <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    {weeklyGoals[0].adjustmentRecommendation === 'improve_adherence' && <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                    {weeklyGoals[0].adjustmentRecommendation === 'maintain' && <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    <h3 className="font-semibold text-black dark:text-white">
                      Renaissance Periodization Analysis
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {weeklyGoals[0].adjustmentRecommendation === 'increase_calories' && 'Weight progress slower than target despite good adherence. Increase calories to optimize results.'}
                    {weeklyGoals[0].adjustmentRecommendation === 'decrease_calories' && 'Weight progress significantly faster than target. Reduce calories to optimize muscle-to-fat ratio.'}
                    {weeklyGoals[0].adjustmentRecommendation === 'improve_adherence' && 'Focus on hitting nutrition targets consistently before making calorie adjustments.'}
                    {weeklyGoals[0].adjustmentRecommendation === 'maintain' && 'Weight progressing within optimal range. Maintain calories during optimal progress, only adjust when significantly outside target range or when plateaus occur after 2+ weeks.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Goal Type:</span>
                        <span className="font-medium text-black dark:text-white capitalize">{weeklyGoals[0].goalType}</span>
                      </div>
                      {weeklyGoals[0].currentWeight && weeklyGoals[0].previousWeight && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Weight Change:</span>
                          <span className="font-medium text-black dark:text-white">
                            {formatWeightChangeWithUnit(getWeeklyWeightChange() || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                        <span className="font-medium text-black dark:text-white">
                          {weeklyGoals[0].adjustmentReason === 'calculated_from_logs' ? 'Calculated' : 'Stored'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Recommendation:</span>
                        <span className="font-medium text-black dark:text-white capitalize pl-[7px] pr-[7px]">
                          {weeklyGoals[0].adjustmentRecommendation?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {weeklyGoals && weeklyGoals.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-black dark:text-white">Progress Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Adherence (Past Days)</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {weeklyGoals[0].adherencePercentage || 0}%
                        </span>
                      </div>
                      <Progress value={parseFloat(weeklyGoals[0].adherencePercentage || "0")} className="h-2" />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Only counts completed days, not future days
                      </div>
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

                    {/* Weight Change Analysis - Show when any weight data exists or provide helpful message */}
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Weight Change</span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-black dark:text-white">
                            {formatWeightChangeWithUnit(getWeeklyWeightChange() || 0)}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getWeeklyWeightChange() === null ? 'Add weight data in Body section' : 'Current week'}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          Target: {(() => {
                            if (!weightGoals || weightGoals.length === 0) return 'No target set';
                            const activeGoal = weightGoals.find((goal: any) => goal.isActive);
                            if (!activeGoal) return 'No target set';
                            
                            const preferredUnit = getUserWeightUnit();
                            const targetWeight = parseFloat(activeGoal.targetWeight);
                            const weeklyChange = parseFloat(activeGoal.targetWeightChangePerWeek || 0);
                            
                            // Convert units if needed using convertValue function
                            let displayWeight = targetWeight;
                            let displayWeeklyChange = weeklyChange;
                            if (activeGoal.unit !== preferredUnit) {
                              displayWeight = targetWeight * (preferredUnit === 'kg' ? 0.453592 : 2.20462);
                              displayWeeklyChange = weeklyChange * (preferredUnit === 'kg' ? 0.453592 : 2.20462);
                            }
                            
                            const unitLabel = preferredUnit === 'kg' ? 'kg' : 'lbs';
                            const goalType = activeGoal.goalType === 'cutting' ? '↓' : activeGoal.goalType === 'bulking' ? '↑' : '→';
                            
                            return `${goalType} ${displayWeight.toFixed(1)} ${unitLabel} (${Math.abs(displayWeeklyChange).toFixed(1)}/week)`;
                          })()}
                        </span>
                        <span className={`font-medium ${
                          weeklyGoals[0].weightTrend === 'stable' ? 'text-blue-600 dark:text-blue-400' :
                          weeklyGoals[0].weightTrend === 'gaining' ? 'text-green-600 dark:text-green-400' :
                          'text-orange-600 dark:text-orange-400'
                        }`}>
                          {weeklyGoals[0].weightTrend?.charAt(0).toUpperCase() + weeklyGoals[0].weightTrend?.slice(1) || 'Tracking'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-black dark:text-white">Weekly Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Weight Change</span>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {formatWeightChangeWithUnit(getWeeklyWeightChange() || 0)}
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
                      <div className="w-4 h-4 mr-2 animate-spin  border-2 border-white border-t-transparent" />
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

        <TabsContent value="rp-analysis" className="space-y-4 tab-content-animated">
          <RPAnalysis userId={userId} />
        </TabsContent>

        <TabsContent value="rp-recommendations" className="space-y-4 tab-content-animated">
          <RPRecommendations userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}