import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MacroChart } from "@/components/macro-chart";
import { Plus, Search, Trash2, Calendar } from "lucide-react";
import { NutritionLogger } from "@/components/nutrition-logger";

interface User {
  id: number;
  email: string;
  name: string;
}

interface NutritionProps {
  user: User;
}

export function Nutrition({ user }: NutritionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, today],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${user.id}?date=${today}`);
      return response.json();
    }
  });

  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', user.id, today],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${user.id}?date=${today}`);
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("DELETE", `/api/nutrition/log/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
      toast({
        title: "Success",
        description: "Food log deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete food log",
        variant: "destructive"
      });
    }
  });

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const formatMealType = (mealType: string) => {
    return mealType?.charAt(0).toUpperCase() + mealType?.slice(1) || 'Meal';
  };

  if (summaryLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p>Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("nutrition")} Tracking</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button 
            onClick={() => setShowLogger(true)}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("log_food")}
          </Button>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("calories")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {nutritionSummary?.totalCalories || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {nutritionSummary?.goalCalories || 2000}
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 : 0} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("protein")} (g)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {nutritionSummary?.totalProtein || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {nutritionSummary?.goalProtein || 150}g
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalProtein / nutritionSummary.goalProtein) * 100 : 0} 
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
                {nutritionSummary?.totalCarbs || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {nutritionSummary?.goalCarbs || 200}g
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalCarbs / nutritionSummary.goalCarbs) * 100 : 0} 
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
                {nutritionSummary?.totalFat || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {nutritionSummary?.goalFat || 60}g
              </p>
              <Progress 
                value={nutritionSummary ? (nutritionSummary.totalFat / nutritionSummary.goalFat) * 100 : 0} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Macro Chart */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Macro Breakdown</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Today's macronutrient distribution
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
                  <p>No nutrition data yet</p>
                  <p className="text-sm">Start logging your meals to see macro breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Log */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Today's Food Log</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your meals and snacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionLogs && nutritionLogs.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {nutritionLogs.map((log: any) => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getMealTypeIcon(log.mealType)}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatMealType(log.mealType)}
                          </span>
                        </div>
                        <div className="font-medium text-black dark:text-white">
                          {log.foodName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {log.quantity} {log.unit} • {Math.round(log.calories)} cal
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          P: {Math.round(log.protein)}g • C: {Math.round(log.carbs)}g • F: {Math.round(log.fat)}g
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(log.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p>No food logged today</p>
                  <p className="text-sm">Start tracking your nutrition</p>
                  <Button 
                    onClick={() => setShowLogger(true)}
                    variant="outline"
                    className="mt-4 border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Meal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Logger Modal */}
        {showLogger && (
          <NutritionLogger 
            userId={user.id}
            onComplete={() => {
              setShowLogger(false);
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
            }}
          />
        )}
      </div>
    </div>
  );
}