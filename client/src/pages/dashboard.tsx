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
import { Calendar, Activity, Target, TrendingUp, Plus, Dumbbell, Utensils, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const currentDate = new Date(selectedDate);
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

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pt-safe">
      <div className="container mx-auto p-4 space-y-6 pb-24">
        {/* iOS-style Header with Date Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("welcome")}, {user.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-base mt-1">
              <Calendar className="w-5 h-5" />
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          {/* iOS-style Date Navigation Controls */}
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() - 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="h-9 w-9 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg min-w-[140px] justify-center shadow-sm">
              <span className="text-sm font-medium">
                {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 
                 new Date(selectedDate).toLocaleDateString('en-GB', { 
                   day: '2-digit', 
                   month: '2-digit', 
                   year: 'numeric' 
                 })}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date.toISOString().split('T')[0]);
                      }
                    }}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() + 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="h-9 w-9 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* iOS-style Overview Section with Toggle */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black dark:text-white flex items-center gap-3 text-xl">
                  {showTrainingOverview ? (
                    <>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      Training Overview
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Utensils className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      {t("nutrition")} Overview
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                  {showTrainingOverview ? "Training progress and analytics" : "Today's macro breakdown"}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
                <Label htmlFor="overview-toggle" className={`text-sm font-medium transition-colors ${!showTrainingOverview ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  Nutrition
                </Label>
                <Switch
                  id="overview-toggle"
                  checked={showTrainingOverview}
                  onCheckedChange={setShowTrainingOverview}
                />
                <Label htmlFor="overview-toggle" className={`text-sm font-medium transition-colors ${showTrainingOverview ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  Training
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                />
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  No nutrition data yet. Start logging your meals!
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* iOS-style Quick Stats - Single Row */}
        <div className="grid grid-cols-4 gap-3 w-full">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-3">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg mb-2">
                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                Calories
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.totalCalories || 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                /{Math.round(nutritionSummary?.goalCalories || 2000)}
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 : 0} 
                className="mt-2 h-2 bg-gray-200 dark:bg-gray-700"
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
              <TrendingUp className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                Protein
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-lg font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.totalProtein || 0)}g
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                /{Math.round(nutritionSummary?.goalProtein || 150)}g
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalProtein / nutritionSummary.goalProtein) * 100 : 0} 
                className="mt-1 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
              <Activity className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-lg font-bold text-black dark:text-white text-center">
                {trainingStats?.totalSessions || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
              <Target className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                Adherence
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-lg font-bold text-black dark:text-white text-center">
                {Math.round(nutritionSummary?.adherence || 0)}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Overall
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* iOS-style Quick Actions */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white text-xl">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Common tasks and shortcuts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="ios"
                size="ios"
                className="w-full"
                onClick={() => setShowNutritionLogger(true)}
              >
                <Plus className="w-5 h-5 mr-3" />
                {t("log_food")}
              </Button>
              <Button 
                variant="iosSecondary"
                size="ios"
                className="w-full"
                onClick={handleStartWorkout}
              >
                <Dumbbell className="w-5 h-5 mr-3" />
                {workoutSessions && workoutSessions.filter((session: any) => !session.isCompleted).length > 0 
                  ? "Continue Workout"
                  : t("start_workout")}
              </Button>
              <Button 
                variant="iosSecondary"
                size="ios"
                className="w-full"
                onClick={() => window.location.hash = '#/profile'}
              >
                <User className="w-5 h-5 mr-3" />
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
      </div>
    </div>
  );
}