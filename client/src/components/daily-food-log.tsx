import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NutritionLogger } from "@/components/nutrition-logger";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DailyFoodLogProps {
  userId: number;
}

export function DailyFoodLog({ userId }: DailyFoodLogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: nutritionLogs, isLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${userId}?date=${selectedDate}`);
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("DELETE", `/api/nutrition/log/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Food Log
            </div>
            <Button 
              onClick={() => setShowLogger(true)}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </CardTitle>
          <CardDescription>Track your daily meals and snacks</CardDescription>
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

      {/* Food Log */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">
            Food Entries for {new Date(selectedDate).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nutritionLogs && nutritionLogs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nutritionLogs.map((log: any) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getMealTypeIcon(log.mealType)}</span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {formatMealType(log.mealType)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-medium text-black dark:text-white mb-1">
                      {log.foodName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {log.quantity} {log.unit} • <span className="font-medium">{Math.round(log.calories)} cal</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-4">
                      <span>Protein: {Math.round(log.protein)}g</span>
                      <span>Carbs: {Math.round(log.carbs)}g</span>
                      <span>Fat: {Math.round(log.fat)}g</span>
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
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-lg font-medium mb-2">No food logged for this date</p>
              <p className="text-sm mb-4">Start tracking your nutrition to see your daily intake</p>
              <Button 
                onClick={() => setShowLogger(true)}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Meal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrition Logger Modal */}
      {showLogger && (
        <NutritionLogger 
          userId={userId}
          onComplete={() => {
            setShowLogger(false);
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
          }}
        />
      )}
    </div>
  );
}