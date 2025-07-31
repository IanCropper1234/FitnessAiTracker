import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MacroChart } from "@/components/macro-chart";
import { TrainingOverview } from "@/components/training-overview";

import { RecentActivity } from "@/components/recent-activity";
import { Calendar, Activity, Target, TrendingUp, Plus, Dumbbell, Utensils, ChevronLeft, ChevronRight, ChevronDown, Scale, Heart } from "lucide-react";
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

  const currentDate = TimezoneUtils.parseUserDate(selectedDate);
  const dateQueryParam = selectedDate;

  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${dateQueryParam}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch nutrition summary');
      return response.json();
    }
  });

  const { data: trainingStats } = useQuery({
    queryKey: ['/api/training/stats', dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/training/stats?date=${dateQueryParam}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch training stats');
      return response.json();
    }
  });

  // Get active workout sessions for smart Start Workout behavior
  const { data: workoutSessions } = useQuery({
    queryKey: ['/api/training/sessions', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/training/sessions`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch workout sessions');
      return response.json();
    }
  });

  // Get body metrics for weight and body composition data
  const { data: bodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch body metrics');
      return response.json();
    }
  });

  // Get user profile for additional metrics
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    }
  });

  // Calculate current weight with unit conversion
  const getCurrentWeight = () => {
    if (!bodyMetrics || bodyMetrics.length === 0) return null;
    const latestEntry = bodyMetrics[0];
    const weight = latestEntry.weight;
    const unit = latestEntry.unit;
    
    // Convert imperial (lbs) to metric (kg) if needed
    if (unit === 'imperial') {
      return (weight / 2.20462).toFixed(1); // Convert lbs to kg
    }
    return weight.toFixed(1);
  };
  
  const currentWeight = getCurrentWeight();
  
  // Calculate weekly weight trend with unit conversion
  const getWeightTrend = () => {
    if (!bodyMetrics || bodyMetrics.length < 2) return null;
    
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get most recent weight (convert if imperial)
    const recentEntry = bodyMetrics[0];
    const recentWeight = recentEntry.unit === 'imperial' ? 
      recentEntry.weight / 2.20462 : recentEntry.weight;
    
    // Find weight from approximately 7 days ago
    const weekOldEntry = bodyMetrics.find((entry: any) => {
      const entryDate = new Date(entry.date);
      return entryDate <= sevenDaysAgo;
    });
    
    if (weekOldEntry) {
      const oldWeight = weekOldEntry.unit === 'imperial' ? 
        weekOldEntry.weight / 2.20462 : weekOldEntry.weight;
      return recentWeight - oldWeight;
    }
    
    // Fallback: compare with previous entry if no week-old data
    if (bodyMetrics.length > 1) {
      const prevEntry = bodyMetrics[1];
      const prevWeight = prevEntry.unit === 'imperial' ? 
        prevEntry.weight / 2.20462 : prevEntry.weight;
      return recentWeight - prevWeight;
    }
    
    return null;
  };
  
  const weightTrend = getWeightTrend();

  const today = TimezoneUtils.formatForDisplay(selectedDate, 'en-US');

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

  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container pl-[5px] pr-[5px] ml-[-3px] mr-[-3px]">
      <div className="content-container section-spacing !px-0">
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
              className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 transition-transform duration-150" />
            </button>
            
            <button
              onClick={() => setShowDatePicker(true)}
              className="ios-touch-feedback ios-smooth-transform flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 active:scale-98 min-h-[44px]"
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
              className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
            >
              <ChevronRight className="h-4 w-4 transition-transform duration-150" />
            </button>
          </div>
        </div>

        {/* Overview Section with Toggle */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-[10px] mb-[10px]">
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
                <Switch
                  id="overview-toggle"
                  checked={showTrainingOverview}
                  onCheckedChange={setShowTrainingOverview}
                  className="scale-90"
                />
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
              <TrainingOverview userId={user.id} date={currentDate} />
            ) : (
              nutritionSummary ? (
                <MacroChart
                  protein={nutritionSummary.totalProtein}
                  carbs={nutritionSummary.totalCarbs}
                  fat={nutritionSummary.totalFat}
                  goalProtein={nutritionSummary.goalProtein}
                  goalCarbs={nutritionSummary.goalCarbs}
                  goalFat={nutritionSummary.goalFat}
                  goalCalories={nutritionSummary.goalCalories}
                />
              ) : (
                <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
                  No nutrition data yet. Start logging your meals!
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Enhanced Metrics - Non-Duplicate Data */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full card-spacing">
          {!nutritionSummary ? (
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
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200">
                <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
                  <Activity className="h-3 w-3 text-indigo-600 dark:text-indigo-400 mb-1 transition-colors duration-200" />
                  <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="text-sm sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 text-center">
                    {userProfile?.user?.activityLevel || 'Moderate'}
                  </div>
                  <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                    Profile level
                  </p>
                </CardContent>
              </Card>

              {/* Current Body Weight */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ios-smooth-transform hover:scale-102 transition-all duration-200">
                <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
                  <Scale className="h-3 w-3 text-green-600 dark:text-green-400 mb-1" />
                  <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                    Weight
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400 text-center">
                    {currentWeight ? `${currentWeight}kg` : '--'}
                  </div>
                  <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                    {weightTrend !== null ? 
                      `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}kg this week` : 
                      'Latest entry'
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Training Volume */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
                  <Dumbbell className="h-3 w-3 text-orange-600 dark:text-orange-400 mb-1" />
                  <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                    Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="text-sm sm:text-lg font-bold text-orange-600 dark:text-orange-400 text-center">
                    {Math.round(trainingStats?.totalVolume || 0)}kg
                  </div>
                  <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                    This week
                  </p>
                </CardContent>
              </Card>

              {/* Body Fat Percentage */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
                  <Heart className="h-3 w-3 text-purple-600 dark:text-purple-400 mb-1" />
                  <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                    Body Fat
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="text-sm sm:text-lg font-bold text-purple-600 dark:text-purple-400 text-center">
                    {bodyMetrics && bodyMetrics[0]?.bodyFatPercentage ? 
                      `${bodyMetrics[0].bodyFatPercentage}%` : '--'}
                  </div>
                  <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
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
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-[15px] mb-[15px]">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onClick={() => setLocation('/nutrition')}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("log_food")}
              </Button>
              <Button 
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleStartWorkout}
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                {workoutSessions && workoutSessions.filter((session: any) => !session.isCompleted).length > 0 
                  ? "Continue Workout"
                  : t("start_workout")}
              </Button>
              <Button 
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
  );
}