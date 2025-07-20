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
import { Calendar, Activity, Target, TrendingUp, Plus, Dumbbell, Utensils, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');

  // Helper function to get date based on filter
  const getFilteredDate = () => {
    switch (dateFilter) {
      case 'today':
        return new Date();
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      case 'custom':
        return selectedDate;
      default:
        return new Date();
    }
  };

  const currentDate = getFilteredDate();
  const dateQueryParam = currentDate.toISOString().split('T')[0];

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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header with Date Selection */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("welcome")}, {user.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          {/* Date Filter Controls */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateFilter === 'today' ? 'Today' : 
                   dateFilter === 'yesterday' ? 'Yesterday' : 
                   'Custom'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDateFilter('today')}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('yesterday')}>
                  Yesterday
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('custom')}>
                  Custom Date
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {dateFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {format(selectedDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Overview Section with Toggle */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black dark:text-white flex items-center gap-2">
                  {showTrainingOverview ? (
                    <>
                      <Dumbbell className="h-5 w-5" />
                      Training Overview
                    </>
                  ) : (
                    <>
                      <Utensils className="h-5 w-5" />
                      {t("nutrition")} Overview
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {showTrainingOverview ? "Training progress and analytics" : "Today's macro breakdown"}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="overview-toggle" className="text-sm text-gray-600 dark:text-gray-400">
                  Nutrition
                </Label>
                <Switch
                  id="overview-toggle"
                  checked={showTrainingOverview}
                  onCheckedChange={setShowTrainingOverview}
                />
                <Label htmlFor="overview-toggle" className="text-sm text-gray-600 dark:text-gray-400">
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

        {/* Quick Stats - Single Row */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
              <Target className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
                Calories
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="text-lg font-bold text-black dark:text-white text-center">
                {nutritionSummary?.totalCalories || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                /{nutritionSummary?.goalCalories || 2000}
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 : 0} 
                className="mt-1 h-1"
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
                {nutritionSummary?.totalProtein || 0}g
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                /{nutritionSummary?.goalProtein || 150}g
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
                {nutritionSummary?.adherence || 0}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Overall
              </p>
            </CardContent>
          </Card>
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

          {/* Recent Activity Placeholder */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your latest updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Recent activity will appear here
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Logger Modal */}
        {showNutritionLogger && (
          <NutritionLogger 
            userId={user.id}
            onComplete={() => {
              setShowNutritionLogger(false);
              // Refresh nutrition data on dashboard
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
            }}
          />
        )}
      </div>
    </div>
  );
}