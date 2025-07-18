import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MacroChart } from "@/components/macro-chart";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search } from "lucide-react";
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
            <Calendar className="w-5 h-5" />
            Macro Overview
          </CardTitle>
          <CardDescription>Daily macronutrient tracking and breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label htmlFor="date" className="text-sm font-medium">
              Select Date:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {nutritionSummary?.totalCalories || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              of {dietGoals?.targetCalories || nutritionSummary?.goalCalories || 2000}
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
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
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Protein (g)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {(nutritionSummary?.totalProtein || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              of {Number(dietGoals?.targetProtein || nutritionSummary?.goalProtein || 150).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
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
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Carbs (g)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {(nutritionSummary?.totalCarbs || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              of {Number(dietGoals?.targetCarbs || nutritionSummary?.goalCarbs || 200).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
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
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Fat (g)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black dark:text-white">
              {(nutritionSummary?.totalFat || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              of {Number(dietGoals?.targetFat || nutritionSummary?.goalFat || 60).toFixed(1)}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
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
              className="mt-2"
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