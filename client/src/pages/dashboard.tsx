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
import { NutritionLogger } from "@/components/nutrition-logger";
import { RecentActivity } from "@/components/recent-activity";
import { Calendar, Activity, Target, TrendingUp, Plus, Dumbbell, Utensils, ChevronDown, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { TimezoneUtils } from "@shared/utils/timezone";

interface User {
  id: number;
  email: string;
  name: string;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showNutritionLogger, setShowNutritionLogger] = useState(false);
  const [showTrainingOverview, setShowTrainingOverview] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentDate = TimezoneUtils.parseUserDate(selectedDate);
  const dateQueryParam = selectedDate;

  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${user.id}?date=${dateQueryParam}`);
      return response.json();
    }
  });

  const { data: trainingStats } = useQuery({
    queryKey: ['/api/training/stats', user.id, dateQueryParam],
    queryFn: async () => {
      const response = await fetch(`/api/training/stats/${user.id}?date=${dateQueryParam}`);
      return response.json();
    }
  });

  // Get active workout sessions for smart Start Workout behavior
  const { data: workoutSessions } = useQuery({
    queryKey: ['/api/training/sessions', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/training/sessions/${user.id}`);
      return response.json();
    }
  });

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
    <div className="min-h-screen bg-background text-foreground w-full">
      <div className="w-full px-2 py-4 space-y-4">
        {/* Compact Date Selector */}
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedDate(TimezoneUtils.addDays(selectedDate, -1));
              }}
              className="ios-touch-feedback p-1.5 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowDatePicker(true)}
              className="ios-touch-feedback flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <span className="text-lg font-medium text-foreground">
                {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                 TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                   day: '2-digit', 
                   month: '2-digit'
                 })}
              </span>
              <ChevronDown className="h-4 w-4 text-foreground/50" />
            </button>
            
            <button
              onClick={() => {
                setSelectedDate(TimezoneUtils.addDays(selectedDate, 1));
              }}
              className="ios-touch-feedback p-1.5 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Overview Section with Toggle */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
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

        {/* Quick Stats - Single Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
              <Target className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                Calories
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-sm sm:text-lg font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.totalCalories || 0)}
              </div>
              <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                /{Math.round(nutritionSummary?.goalCalories || 2000)}
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 : 0} 
                className="mt-1 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
              <TrendingUp className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                Protein
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-sm sm:text-lg font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.totalProtein || 0)}g
              </div>
              <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                /{Math.round(nutritionSummary?.goalProtein || 150)}g
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalProtein / nutritionSummary.goalProtein) * 100 : 0} 
                className="mt-1 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
              <Activity className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-sm sm:text-lg font-bold text-black dark:text-white text-center">
                {trainingStats?.totalSessions || 0}
              </div>
              <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1 sm:px-2">
              <Target className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-[10px] sm:text-caption text-gray-600 dark:text-gray-400 text-center leading-tight">
                Adherence
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-sm sm:text-lg font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.adherence || 0)}%
              </div>
              <p className="text-[10px] sm:text-caption-sm text-gray-600 dark:text-gray-400 text-center">
                Overall
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Insights - Single Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 ml-[15px] mr-[15px]">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-xs text-center">Most Active</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              {trainingStats && trainingStats.totalSessions > 10 ? "High frequency trainer" : "Building consistency"}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mt-[0px] mb-[0px] ml-[15px] mr-[15px]">
            <h4 className="text-green-900 dark:text-green-100 mb-1 text-xs font-medium text-center">Volume Progress</h4>
            <p className="text-xs text-green-700 dark:text-green-300 text-center">
              {trainingStats && trainingStats.totalVolume > 1000 ? "Strong progression" : "Steady improvement"}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 mt-[0px] mb-[0px] ml-[15px] mr-[15px]">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1 text-xs text-center">Session Length</h4>
            <p className="text-xs text-purple-700 dark:text-purple-300 text-center">
              {trainingStats && trainingStats.averageSessionLength > 60 ? "Thorough workouts" : "Efficient training"}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                onClick={() => setShowNutritionLogger(true)}
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
                onClick={() => window.location.hash = '#/profile'}
              >
                View {t("profile")}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <RecentActivity userId={user.id} />
        </div>

        {/* Nutrition Logger Modal */}
        {showNutritionLogger && (
          <NutritionLogger 
            userId={user.id}
            onComplete={() => {
              setShowNutritionLogger(false);
              // Refresh nutrition data and recent activities on dashboard
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
              queryClient.invalidateQueries({ queryKey: ['/api/activities', user.id] });
            }}
          />
        )}

        {/* iOS-Style Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center touch-target">
            <div 
              className="bg-background w-full max-w-md mx-4 mb-4 rounded-t-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="ios-touch-feedback touch-target p-2 text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-foreground">Change Date</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="ios-touch-feedback touch-target p-2 text-blue-500 hover:text-blue-600"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>

              {/* Today Button */}
              <div className="p-4 text-center border-b border-border">
                <button
                  onClick={() => {
                    setSelectedDate(TimezoneUtils.getCurrentDate());
                    setShowDatePicker(false);
                  }}
                  className="ios-touch-feedback touch-target text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors py-2 px-4 rounded-lg"
                >
                  Today
                </button>
              </div>

              {/* Quick Date Selection */}
              <div className="p-4 max-h-80 overflow-y-auto ios-scroll">
                <div className="space-y-3">
                  {/* Recent Dates */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground/60 mb-3">Quick Select</h4>
                    
                    {/* Yesterday */}
                    <button
                      onClick={() => {
                        const yesterday = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), -1);
                        setSelectedDate(yesterday);
                        setShowDatePicker(false);
                      }}
                      className="ios-touch-feedback touch-target w-full text-left py-3 px-4 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">Yesterday</span>
                        <span className="text-foreground/60 text-sm">
                          {TimezoneUtils.parseUserDate(TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), -1))
                            .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>

                    {/* Tomorrow */}
                    <button
                      onClick={() => {
                        const tomorrow = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), 1);
                        setSelectedDate(tomorrow);
                        setShowDatePicker(false);
                      }}
                      className="ios-touch-feedback touch-target w-full text-left py-3 px-4 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">Tomorrow</span>
                        <span className="text-foreground/60 text-sm">
                          {TimezoneUtils.parseUserDate(TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), 1))
                            .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>

                    {/* This Week */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-foreground/60 mb-3">This Week</h4>
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), i - 3);
                        const isSelected = date === selectedDate;
                        const isToday = TimezoneUtils.isToday(date);
                        
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedDate(date);
                              setShowDatePicker(false);
                            }}
                            className={`ios-touch-feedback touch-target w-full text-left py-3 px-4 rounded-lg transition-colors ${
                              isSelected ? 'bg-blue-500/20 border-blue-500/50 border' : 'hover:bg-accent/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>
                                {isToday ? 'Today' : TimezoneUtils.parseUserDate(date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </span>
                              <span className={`text-sm ${isSelected ? 'text-blue-500' : 'text-foreground/60'}`}>
                                {TimezoneUtils.parseUserDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Fallback */}
              <div className="border-t border-border p-4">
                <CalendarComponent
                  mode="single"
                  selected={TimezoneUtils.parseUserDate(selectedDate)}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(TimezoneUtils.formatDateForStorage(date));
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* Home Indicator */}
              <div className="flex justify-center pb-2">
                <div className="w-16 h-1 bg-foreground/20 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}