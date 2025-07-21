import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MacroChart } from "@/components/macro-chart";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MacroOverviewProps {
  userId: number;
}

export function MacroOverview({ userId }: MacroOverviewProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: nutritionSummary, isLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${userId}?date=${selectedDate}`);
      return response.json();
    }
  });

  // Fetch diet goals to show targets and remaining
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Macro Overview
          </CardTitle>
          <CardDescription>Daily macronutrient tracking and breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() - 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-md min-w-[120px] justify-center">
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date.toISOString().split('T')[0]);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() + 1);
                setSelectedDate(currentDate.toISOString().split('T')[0]);
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Targets & Remaining Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-black dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Daily Targets & Remaining
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your remaining calories and macros for {selectedDate === new Date().toISOString().split('T')[0] 
              ? new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Calories */}
            <Card className="border-blue-300 dark:border-blue-600 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Calories</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.max(0, Number(dietGoals?.targetCalories || 2000) - (nutritionSummary?.totalCalories || 0))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  of {dietGoals?.targetCalories || 2000} remaining
                </div>
              </CardContent>
            </Card>

            {/* Protein */}
            <Card className="border-green-300 dark:border-green-600 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Protein</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Math.max(0, Number(dietGoals?.targetProtein || 150) - (nutritionSummary?.totalProtein || 0)).toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  of {Number(dietGoals?.targetProtein || 150).toFixed(1)}g remaining
                </div>
              </CardContent>
            </Card>

            {/* Carbs */}
            <Card className="border-orange-300 dark:border-orange-600 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Carbs</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.max(0, Number(dietGoals?.targetCarbs || 200) - (nutritionSummary?.totalCarbs || 0)).toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  of {Number(dietGoals?.targetCarbs || 200).toFixed(1)}g remaining
                </div>
              </CardContent>
            </Card>

            {/* Fat */}
            <Card className="border-purple-300 dark:border-purple-600 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Fat</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.max(0, Number(dietGoals?.targetFat || 60) - (nutritionSummary?.totalFat || 0)).toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  of {Number(dietGoals?.targetFat || 60).toFixed(1)}g remaining
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Consumption Row */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {/* Calories Consumed */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white">
                {nutritionSummary?.totalCalories || 0}
              </div>
              <div className="text-xs text-blue-400 dark:text-blue-400">
                of {dietGoals?.targetCalories || 2000}
              </div>
              <div className="text-xs text-blue-400 dark:text-blue-400">
                Remaining: {Math.max(0, Number(dietGoals?.targetCalories || 2000) - (nutritionSummary?.totalCalories || 0))}
              </div>
            </div>

            {/* Protein Consumed */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white">
                {(nutritionSummary?.totalProtein || 0).toFixed(1)}
              </div>
              <div className="text-xs text-green-400 dark:text-green-400">
                of {Number(dietGoals?.targetProtein || 150).toFixed(1)}g
              </div>
              <div className="text-xs text-green-400 dark:text-green-400">
                Remaining: {Math.max(0, Number(dietGoals?.targetProtein || 150) - (nutritionSummary?.totalProtein || 0)).toFixed(1)}g
              </div>
            </div>

            {/* Carbs Consumed */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white">
                {(nutritionSummary?.totalCarbs || 0).toFixed(1)}
              </div>
              <div className="text-xs text-orange-400 dark:text-orange-400">
                of {Number(dietGoals?.targetCarbs || 200).toFixed(1)}g
              </div>
              <div className="text-xs text-orange-400 dark:text-orange-400">
                Remaining: {Math.max(0, Number(dietGoals?.targetCarbs || 200) - (nutritionSummary?.totalCarbs || 0)).toFixed(1)}g
              </div>
            </div>

            {/* Fat Consumed */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white">
                {(nutritionSummary?.totalFat || 0).toFixed(1)}
              </div>
              <div className="text-xs text-purple-400 dark:text-purple-400">
                of {Number(dietGoals?.targetFat || 60).toFixed(1)}g
              </div>
              <div className="text-xs text-purple-400 dark:text-purple-400">
                Remaining: {Math.max(0, Number(dietGoals?.targetFat || 60) - (nutritionSummary?.totalFat || 0)).toFixed(1)}g
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-4 gap-2 w-full">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {nutritionSummary?.totalCalories || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {dietGoals?.targetCalories || nutritionSummary?.goalCalories || 2000}
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 text-center">
                Remaining: {Math.max(0, Number(dietGoals.targetCalories) - (nutritionSummary?.totalCalories || 0))}
              </p>
            )}
            <Progress 
              value={dietGoals 
                ? (nutritionSummary?.totalCalories || 0) / Number(dietGoals.targetCalories) * 100 
                : nutritionSummary 
                  ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 
                  : 0
              } 
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Protein (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {(nutritionSummary?.totalProtein || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Number(dietGoals?.targetProtein || nutritionSummary?.goalProtein || 150).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400 text-center">
                Remaining: {Math.max(0, Number(dietGoals.targetProtein) - (nutritionSummary?.totalProtein || 0)).toFixed(1)}g
              </p>
            )}
            <Progress 
              value={dietGoals 
                ? (nutritionSummary?.totalProtein || 0) / Number(dietGoals.targetProtein) * 100 
                : nutritionSummary 
                  ? (nutritionSummary.totalProtein / nutritionSummary.goalProtein) * 100 
                  : 0
              } 
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Carbs (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {(nutritionSummary?.totalCarbs || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Number(dietGoals?.targetCarbs || nutritionSummary?.goalCarbs || 200).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 text-center">
                Remaining: {Math.max(0, Number(dietGoals.targetCarbs) - (nutritionSummary?.totalCarbs || 0)).toFixed(1)}g
              </p>
            )}
            <Progress 
              value={dietGoals 
                ? (nutritionSummary?.totalCarbs || 0) / Number(dietGoals.targetCarbs) * 100 
                : nutritionSummary 
                  ? (nutritionSummary.totalCarbs / nutritionSummary.goalCarbs) * 100 
                  : 0
              } 
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Fat (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {(nutritionSummary?.totalFat || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Number(dietGoals?.targetFat || nutritionSummary?.goalFat || 60).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 text-center">
                Remaining: {Math.max(0, Number(dietGoals.targetFat) - (nutritionSummary?.totalFat || 0)).toFixed(1)}g
              </p>
            )}
            <Progress 
              value={dietGoals 
                ? (nutritionSummary?.totalFat || 0) / Number(dietGoals.targetFat) * 100 
                : nutritionSummary 
                  ? (nutritionSummary.totalFat / nutritionSummary.goalFat) * 100 
                  : 0
              } 
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>
      </div>

      {/* Macro Breakdown Chart */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">Macro Breakdown</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Macronutrient distribution for {new Date(selectedDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nutritionSummary && (nutritionSummary.totalCalories > 0) ? (
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
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No nutrition data for this date</p>
              <p className="text-sm">Start logging your meals to see macro breakdown</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}