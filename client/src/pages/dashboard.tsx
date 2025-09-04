import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MacroChart } from "@/components/macro-chart";
import { EnhancedTrainingOverview } from "@/components/enhanced-training-overview";
import { AnimatedPage } from "@/components/page-transition";
import { AnimatedDashboardCard, useStaggeredAnimation } from "@/components/ui/dashboard-animations";

import { RecentActivity } from "@/components/recent-activity";
import { DailyWellnessReminder } from "@/components/daily-wellness-reminder";
import { Calendar, Activity, Target, TrendingUp, Plus, Dumbbell, Utensils, ChevronLeft, ChevronRight, ChevronDown, Scale, Heart, Brain, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LoadingState, DashboardCardSkeleton } from "@/components/ui/loading";
import { TimezoneUtils } from "@shared/utils/timezone";

interface User {
  id: number;
  email: string;
  name: string;
}

interface DashboardProps {
  user: User;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

export function Dashboard({ user, selectedDate, setSelectedDate, showDatePicker, setShowDatePicker }: DashboardProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [showTrainingOverview, setShowTrainingOverview] = useState(false);
  
  // Animation refs for dashboard cards
  const cardsRef = useStaggeredAnimation('.dashboard-card', { delay: 100, stagger: 150 });

  // Clear React Query cache when user changes to prevent data leakage between users
  useEffect(() => {
    if (user?.id) {
      // Clear cache for all queries that don't include the current user ID
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // If queryKey is an array and includes an API path, check if user ID is included
          if (Array.isArray(queryKey) && queryKey.length > 0) {
            const hasApiPath = queryKey.some(key => typeof key === 'string' && key.startsWith('/api/'));
            const hasUserId = queryKey.includes(user.id);
            // Invalidate if it's an API query but doesn't include current user ID
            return hasApiPath && !hasUserId;
          }
          return false;
        }
      });
    }
  }, [user?.id, queryClient]);

  const currentDate = TimezoneUtils.parseUserDate(selectedDate);
  const dateQueryParam = selectedDate;

  const { data: nutritionSummary, isLoading: nutritionLoading, error: nutritionError, refetch: refetchNutrition } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${dateQueryParam}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch nutrition summary');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Only retry auth errors once, other errors retry normally
      if (error.message === 'Not authenticated' && failureCount < 1) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Fetch diet goals for accurate target values
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      
      // Convert string values to numbers for consistent frontend usage
      if (data) {
        return {
          ...data,
          tdee: Number(data.tdee),
          targetCalories: Number(data.targetCalories),
          customTargetCalories: Number(data.customTargetCalories),
          targetProtein: Number(data.targetProtein),
          targetCarbs: Number(data.targetCarbs),
          targetFat: Number(data.targetFat),
          weeklyWeightTarget: Number(data.weeklyWeightTarget)
        };
      }
      return data;
    }
  });

  const { data: trainingStats, isLoading: trainingLoading, error: trainingError, refetch: refetchTraining } = useQuery({
    queryKey: ['/api/training/stats', user.id, dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/training/stats?date=${dateQueryParam}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch training stats');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      if (error.message === 'Not authenticated' && failureCount < 1) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Get active workout sessions for smart Start Workout behavior
  const { data: workoutSessions } = useQuery({
    queryKey: ['/api/training/sessions', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/training/sessions`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch workout sessions');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Get body metrics for weight and body composition data
  const { data: bodyMetrics, isLoading: bodyMetricsLoading, error: bodyMetricsError, refetch: refetchBodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch body metrics');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      if (error.message === 'Not authenticated' && failureCount < 1) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Get user profile for additional metrics
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Calculate current weight with unit conversion
  const getCurrentWeight = () => {
    if (!bodyMetrics || bodyMetrics.length === 0) return null;
    const latestEntry = bodyMetrics[0];
    const weight = latestEntry.weight;
    const unit = latestEntry.unit;
    
    // Check if weight is a valid number
    if (weight === null || weight === undefined || isNaN(weight)) return null;
    
    // Convert imperial (lbs) to metric (kg) if needed
    if (unit === 'imperial') {
      return (Number(weight) / 2.20462).toFixed(1); // Convert lbs to kg
    }
    return Number(weight).toFixed(1);
  };
  
  const currentWeight = getCurrentWeight();
  
  // Enhanced weekly weight trend with data validation and stable calculation
  const getWeightTrend = () => {
    if (!bodyMetrics || bodyMetrics.length < 3) return null;
    
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    // Get recent weight data with validation (all units now standardized to metric)
    const validMetrics = bodyMetrics.filter((entry: any) => {
      const weight = parseFloat(entry.weight);
      const entryDate = new Date(entry.date);
      return !isNaN(weight) && weight > 0 && entryDate >= tenDaysAgo;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (validMetrics.length < 3) return null;
    
    // Filter out data entry errors (weight changes > 5kg between consecutive entries)
    const cleanMetrics = validMetrics.filter((entry: any, index: number) => {
      if (index === 0) return true;
      
      const currentWeight = parseFloat(entry.weight);
      const prevWeight = parseFloat(validMetrics[index - 1].weight);
      const daysDiff = Math.abs(new Date(validMetrics[index - 1].date).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24);
      
      const dailyChange = Math.abs(currentWeight - prevWeight) / Math.max(1, daysDiff);
      return dailyChange <= 5; // Reasonable threshold for daily weight change
    });
    
    if (cleanMetrics.length < 3) return null;
    
    // Use simple 7-day average comparison for dashboard (less complex than linear regression)
    const recentAvg = cleanMetrics.slice(0, Math.min(3, cleanMetrics.length))
      .reduce((sum: number, entry: any) => sum + parseFloat(entry.weight), 0) / Math.min(3, cleanMetrics.length);
    
    const olderAvg = cleanMetrics.slice(-Math.min(3, cleanMetrics.length))
      .reduce((sum: number, entry: any) => sum + parseFloat(entry.weight), 0) / Math.min(3, cleanMetrics.length);
    
    return recentAvg - olderAvg;
  };
  
  const weightTrend = getWeightTrend();

  const today = TimezoneUtils.formatForDisplay(selectedDate, 'en-US');

  // Enhanced loading logic to prevent infinite loading on iOS PWA reload
  // Only show loading when we truly have no data AND initial queries are loading
  const hasAnyData = nutritionSummary || trainingStats || bodyMetrics;
  const isInitialLoad = !hasAnyData && (nutritionLoading || trainingLoading || bodyMetricsLoading);
  
  // Add timeout failsafe: never show loading for more than 3 seconds on PWA reload
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        console.log('Loading timeout reached (3s) - displaying dashboard with available data');
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isInitialLoad]);
  
  const isDashboardLoading = isInitialLoad && !loadingTimeout;
  
  // Check for authentication errors
  const hasAuthError = nutritionError?.message === 'Not authenticated' || 
                       trainingError?.message === 'Not authenticated' || 
                       bodyMetricsError?.message === 'Not authenticated';
  
  // Add retry mechanism for failed queries
  const retryAllQueries = () => {
    if (nutritionError) refetchNutrition();
    if (trainingError) refetchTraining();
    if (bodyMetricsError) refetchBodyMetrics();
  };

  // Smart Start Workout function
  const handleStartWorkout = () => {
    if (workoutSessions && workoutSessions.length > 0) {
      // Find the most recent active (incomplete) workout session
      const activeSessions = workoutSessions
        .filter((session: any) => !session.isCompleted)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (activeSessions.length > 0) {
        // Navigate to training page with the session ID as a query parameter
        // This will allow the TrainingDashboard to automatically start the session
        setLocation(`/training?sessionId=${activeSessions[0].id}`);
        return;
      }
    }
    
    // No active sessions found, go to training page to create new workout
    setLocation('/training');
  };

  // Show loading state for dashboard on initial load - show loading if any core data is still loading
  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container pl-[5px] pr-[5px] ml-[-3px] mr-[-3px]">
        <div className="content-container section-spacing !px-0">
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="ios-loading-dots flex items-center gap-1 justify-center">
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Loading dashboard...</p>
              {hasAuthError && (
                <div className="mt-4">
                  <p className="text-sm text-red-500 mb-2">Connection issue detected</p>
                  <Button 
                    onClick={retryAllQueries}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Retry Loading
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container">
        <div className="content-container section-spacing !px-0 mt-[0px] mb-[0px]">
          {/* Enhanced Date Selector */}
          <div className="flex items-center justify-center py-1 mt-[-8px] mb-[-8px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const previousDay = TimezoneUtils.addDays(selectedDate, -1);
                setSelectedDate(previousDay);
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                queryClient.invalidateQueries({ queryKey: ['/api/training/stats', user.id] });
              }}
              className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200  min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 transition-transform duration-150" />
            </button>
            
            <button
              onClick={() => setShowDatePicker(true)}
              className="ios-touch-feedback ios-smooth-transform flex items-center gap-2 px-4 py-2  hover:bg-accent/50 transition-all duration-200 active:scale-98 min-h-[44px]"
            >
              <span className="text-sm font-medium text-foreground transition-colors duration-150">
                {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                 TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                   day: '2-digit', 
                   month: '2-digit'
                 })}
              </span>
              <ChevronDown className="h-4 w-4 text-foreground/50 transition-transform duration-150" />
            </button>
            
            <button
              onClick={() => {
                const nextDay = TimezoneUtils.addDays(selectedDate, 1);
                setSelectedDate(nextDay);
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                queryClient.invalidateQueries({ queryKey: ['/api/training/stats', user.id] });
              }}
              className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200  min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
            >
              <ChevronRight className="h-4 w-4 transition-transform duration-150" />
            </button>
          </div>
        </div>

          <div ref={cardsRef}>
            {/* Overview Section with Toggle */}
            <Card className="dashboard-card bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-[10px] mb-[10px]">
          <CardHeader>
            <div className="space-y-3">
              {/* First Row - Title with Icon */}
              <div className="flex items-center justify-center">
                <CardTitle className="text-black dark:text-white flex items-center gap-1.5">
                  {showTrainingOverview ? (
                    <>
                      <Dumbbell className="h-4 w-4 flex-shrink-0" />
                      <span>Training Overview</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="h-4 w-4 flex-shrink-0" />
                      <span>{t("nutrition")} Overview</span>
                    </>
                  )}
                </CardTitle>
              </div>
              
              {/* Second Row - Toggle Controls */}
              <div className="flex items-center justify-center space-x-1.5">
                <Label htmlFor="overview-toggle" className="text-caption text-gray-600 dark:text-gray-400">
                  Nutrition
                </Label>
                <div 
                  className="relative inline-flex h-6 w-11 scale-90 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: showTrainingOverview 
                      ? '#3B82F6'  // Blue for Training mode
                      : '#10B981', // Green for Nutrition mode
                  }}
                  onClick={() => setShowTrainingOverview(!showTrainingOverview)}
                >
                  <span
                    className={`${
                      showTrainingOverview ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out`}
                    style={{
                      transform: showTrainingOverview ? 'translateX(24px)' : 'translateX(0px)'
                    }}
                  />
                </div>
                <Label htmlFor="overview-toggle" className="text-caption text-gray-600 dark:text-gray-400">
                  Training
                </Label>
              </div>
              
              {/* Third Row - Description */}
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center">
                {showTrainingOverview ? "Training progress and analytics" : "Today's macro breakdown"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pl-[0px] pr-[0px] pt-[0px] pb-[0px] mt-[0px] mb-[0px] ml-[0px] mr-[0px]">
            {showTrainingOverview ? (
              trainingLoading ? (
                <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
                  <div className="ios-loading-dots flex items-center gap-1 justify-center">
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
              </div>
                </div>
              ) : (
                <EnhancedTrainingOverview userId={user.id} date={currentDate} />
              )
            ) : (
              nutritionLoading ? (
                <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
                  <div className="ios-loading-dots flex items-center gap-1 justify-center">
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
              </div>
                </div>
              ) : nutritionSummary ? (
                <MacroChart
                  protein={nutritionSummary.totalProtein}
                  carbs={nutritionSummary.totalCarbs}
                  fat={nutritionSummary.totalFat}
                  totalCalories={nutritionSummary.totalCalories}
                  goalProtein={dietGoals?.targetProtein || nutritionSummary.goalProtein}
                  goalCarbs={dietGoals?.targetCarbs || nutritionSummary.goalCarbs}
                  goalFat={dietGoals?.targetFat || nutritionSummary.goalFat}
                  goalCalories={dietGoals?.targetCalories || nutritionSummary.goalCalories}
                />
              ) : (
                <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
                  No nutrition data yet. Start logging your meals!
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Daily Wellness Check-in Reminder */}
        <div className="mb-4">
          <DailyWellnessReminder userId={user.id} />
        </div>

        {/* Enhanced Metrics - Non-Duplicate Data */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full card-spacing">
          {nutritionLoading || trainingLoading || bodyMetricsLoading ? (
            // Loading skeletons for quick stats
            (<>
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </>)
          ) : (
            <>
              {/* Steps/Activity */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200 mt-[-5px] mb-[-5px]">
                <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-2">
                  <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1.5 transition-colors duration-200" />
                  <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-tight font-medium">
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 px-2 pt-[0px] pb-[0px]">
                  <div className="text-base sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 text-center">
                    {userProfile?.user?.activityLevel || 'Moderate'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
                    Profile level
                  </p>
                </CardContent>
              </Card>

              {/* Current Body Weight */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200 mt-[-5px] mb-[-5px]">
                <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-2">
                  <Scale className="h-4 w-4 text-green-600 dark:text-green-400 mb-1.5" />
                  <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-tight font-medium">
                    Weight
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 px-2 pt-[0px] pb-[0px]">
                  <div className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400 text-center">
                    {currentWeight ? `${currentWeight}kg` : '--'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
                    {weightTrend !== null ? 
                      `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}kg this week` : 
                      'Latest entry'
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Training Volume */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200 mt-[-5px] mb-[-5px]">
                <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-2">
                  <Dumbbell className="h-4 w-4 text-orange-600 dark:text-orange-400 mb-1.5" />
                  <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-tight font-medium">
                    Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 px-2 pt-[0px] pb-[0px]">
                  <div className="text-base sm:text-xl font-bold text-orange-600 dark:text-orange-400 text-center">
                    {Math.round(trainingStats?.totalVolume || 0)}kg
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
                    This week
                  </p>
                </CardContent>
              </Card>

              {/* Body Fat Percentage */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200 mt-[-5px] mb-[-5px]">
                <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-2">
                  <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1.5" />
                  <CardTitle className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-tight font-medium">
                    Body Fat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 px-2 pt-[0px] pb-[0px]">
                  <div className="text-base sm:text-xl font-bold text-purple-600 dark:text-purple-400 text-center">
                    {bodyMetrics && bodyMetrics[0]?.bodyFatPercentage ? 
                      `${bodyMetrics[0].bodyFatPercentage}%` : '--'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
                    Latest entry
                  </p>
                </CardContent>
              </Card>
            </>
          )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="dashboard-card bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-[0px] mb-[0px]">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full text-black dark:text-black"
                style={{ backgroundColor: '#479bf5' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}
                onClick={() => setLocation('/nutrition')}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("log_food")}
              </Button>
              <Button 
                className="w-full text-black dark:text-black"
                style={{ backgroundColor: '#479bf5' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}
                onClick={handleStartWorkout}
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                {workoutSessions && workoutSessions.filter((session: any) => !session.isCompleted).length > 0 
                  ? "Continue Workout"
                  : t("start_workout")}
              </Button>
              <Button 
                className="w-full text-black dark:text-black"
                style={{ backgroundColor: '#479bf5' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}
                onClick={() => setLocation('/profile')}
              >
                View {t("profile")}
              </Button>
            </CardContent>
          </Card>

            {/* Recent Activity */}
            <RecentActivity userId={user.id} />
          </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}