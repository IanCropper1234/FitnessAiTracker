import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MacroChart } from "@/components/macro-chart";
import { IOSDatePicker } from "@/components/ui/ios-date-picker";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TimezoneUtils } from "@shared/utils/timezone";

interface MacroOverviewProps {
  userId: number;
}

export function MacroOverview({ userId }: MacroOverviewProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());

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

  // Helper function to intelligently get current target calories (custom or suggested)
  const getCurrentTargetCalories = () => {
    if (!dietGoals) return nutritionSummary?.goalCalories || 2000;
    
    // When custom calories toggle is enabled, use custom values
    if (dietGoals.useCustomCalories && dietGoals.customTargetCalories) {
      return dietGoals.customTargetCalories;
    }
    
    // Otherwise use suggested values (even when custom toggle is on but no custom value set)
    return dietGoals.targetCalories || nutritionSummary?.goalCalories || 2000;
  };

  // Helper functions to intelligently get current macro targets (custom or suggested)
  const getCurrentTargetProtein = () => {
    if (!dietGoals) return nutritionSummary?.goalProtein || 150;
    
    // When custom calories toggle is enabled and custom macros exist, use them
    // The diet builder always stores macros in the regular fields (targetProtein, targetCarbs, targetFat)
    // so we just use those regardless of custom toggle state
    return dietGoals.targetProtein || nutritionSummary?.goalProtein || 150;
  };

  const getCurrentTargetCarbs = () => {
    if (!dietGoals) return nutritionSummary?.goalCarbs || 200;
    return dietGoals.targetCarbs || nutritionSummary?.goalCarbs || 200;
  };

  const getCurrentTargetFat = () => {
    if (!dietGoals) return nutritionSummary?.goalFat || 60;
    return dietGoals.targetFat || nutritionSummary?.goalFat || 60;
  };

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
          <IOSDatePicker 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            size="md"
          />
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
              of {Math.round(getCurrentTargetCalories())}
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 text-center">
                Remaining: {Math.max(0, Math.round(getCurrentTargetCalories()) - (nutritionSummary?.totalCalories || 0))}
              </p>
            )}
            <Progress 
              value={(nutritionSummary?.totalCalories || 0) / getCurrentTargetCalories() * 100} 
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
              {Math.round(nutritionSummary?.totalProtein || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Math.round(getCurrentTargetProtein())}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400 text-center">
                Remaining: {Math.round(Math.max(0, getCurrentTargetProtein() - (nutritionSummary?.totalProtein || 0)))}g
              </p>
            )}
            <Progress 
              value={(nutritionSummary?.totalProtein || 0) / getCurrentTargetProtein() * 100} 
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
              {Math.round(nutritionSummary?.totalCarbs || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Math.round(getCurrentTargetCarbs())}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 text-center">
                Remaining: {Math.round(Math.max(0, getCurrentTargetCarbs() - (nutritionSummary?.totalCarbs || 0)))}g
              </p>
            )}
            <Progress 
              value={(nutritionSummary?.totalCarbs || 0) / getCurrentTargetCarbs() * 100} 
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
              {Math.round(nutritionSummary?.totalFat || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              of {Math.round(getCurrentTargetFat())}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 text-center">
                Remaining: {Math.round(Math.max(0, getCurrentTargetFat() - (nutritionSummary?.totalFat || 0)))}g
              </p>
            )}
            <Progress 
              value={(nutritionSummary?.totalFat || 0) / getCurrentTargetFat() * 100} 
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>
      </div>


    </div>
  );
}