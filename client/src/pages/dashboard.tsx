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
import { IOSDateSelector } from "@/components/ios-date-selector";
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
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}>
            <div 
              className="bg-background w-full max-w-md mx-4 mb-4 rounded-t-2xl shadow-2xl"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="ios-touch-feedback p-2 text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-foreground">Change Date</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="ios-touch-feedback p-2 text-blue-500 hover:text-blue-600"
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
                  className="text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors"
                >
                  Today
                </button>
              </div>

              {/* iOS-Style Scrollable Date Wheels */}
              <div className="p-4 space-y-4 relative">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Day Wheel */}
                  <div className="space-y-2">
                    <div className="text-foreground/60 text-xs font-medium">Day</div>
                    <div 
                      className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                      style={{
                        scrollSnapType: 'y mandatory',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onScroll={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <div className="py-16">
                        {(() => {
                          const currentDate = new Date(selectedDate);
                          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                          const days = [];
                          for (let i = 1; i <= daysInMonth; i++) {
                            days.push(i);
                          }
                          return days.map((day) => (
                            <div
                              key={day}
                              onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(day);
                                setSelectedDate(newDate.toISOString().split('T')[0]);
                              }}
                              className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                                day === currentDate.getDate()
                                  ? 'text-foreground font-semibold text-lg'
                                  : 'text-foreground/40 text-base hover:text-foreground/70'
                              }`}
                              style={{ scrollSnapAlign: 'center' }}
                            >
                              {day}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Month Wheel */}
                  <div className="space-y-2">
                    <div className="text-foreground/60 text-xs font-medium">Month</div>
                    <div 
                      className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                      style={{
                        scrollSnapType: 'y mandatory',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onScroll={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <div className="py-16">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(index);
                              setSelectedDate(newDate.toISOString().split('T')[0]);
                            }}
                            className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                              index === new Date(selectedDate).getMonth()
                                ? 'text-foreground font-semibold text-lg'
                                : 'text-foreground/40 text-base hover:text-foreground/70'
                            }`}
                            style={{ scrollSnapAlign: 'center' }}
                          >
                            {month}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Year Wheel */}
                  <div className="space-y-2">
                    <div className="text-foreground/60 text-xs font-medium">Year</div>
                    <div 
                      className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                      style={{
                        scrollSnapType: 'y mandatory',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onScroll={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <div className="py-16">
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                            years.push(i);
                          }
                          return years.map((year) => (
                            <div
                              key={year}
                              onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setFullYear(year);
                                setSelectedDate(newDate.toISOString().split('T')[0]);
                              }}
                              className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                                year === new Date(selectedDate).getFullYear()
                                  ? 'text-foreground font-semibold text-lg'
                                  : 'text-foreground/40 text-base hover:text-foreground/70'
                              }`}
                              style={{ scrollSnapAlign: 'center' }}
                            >
                              {year}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Center Selection Lines */}
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="h-10 border-t border-b border-foreground/10 bg-accent/5"></div>
                </div>
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