import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NutritionLogger } from "@/components/nutrition-logger";
import { Plus, Trash2, Calendar, Zap, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface DailyFoodLogProps {
  userId: number;
}

export function DailyFoodLog({ userId }: DailyFoodLogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCopyMeal, setShowCopyMeal] = useState(false);
  const [copyFromDate, setCopyFromDate] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);

  const { data: nutritionLogs, isLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${userId}?date=${selectedDate}`);
      return response.json();
    }
  });

  // Quick add suggestions
  const { data: quickAddSuggestions } = useQuery({
    queryKey: ['/api/nutrition/quick-add', userId],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/quick-add/${userId}`);
      return response.json();
    }
  });

  // Copy meals from another date
  const { data: copySourceLogs } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, copyFromDate],
    queryFn: async () => {
      if (!copyFromDate) return [];
      const response = await fetch(`/api/nutrition/logs/${userId}?date=${copyFromDate}`);
      return response.json();
    },
    enabled: !!copyFromDate
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

  // Quick add mutation
  const quickAddMutation = useMutation({
    mutationFn: async (logData: any) => {
      return await apiRequest("POST", "/api/nutrition/log", {
        ...logData,
        userId,
        date: selectedDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      toast({
        title: "Success",
        description: "Food added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add food",
        variant: "destructive"
      });
    }
  });

  // Copy meals mutation
  const copyMealsMutation = useMutation({
    mutationFn: async (data: { fromDate: string; toDate: string; mealTypes?: string[] }) => {
      return await apiRequest("POST", "/api/nutrition/copy-meals", {
        userId,
        ...data
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      setShowCopyMeal(false);
      setCopyFromDate("");
      setSelectedMealTypes([]);
      toast({
        title: "Success",
        description: `Copied ${data.copiedCount} food entries`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to copy meals",
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

  const handleQuickAdd = (suggestion: any) => {
    quickAddMutation.mutate({
      foodName: suggestion.foodName,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      mealType: suggestion.mealType
    });
  };

  const handleCopyMeals = () => {
    if (!copyFromDate) {
      toast({
        title: "Error",
        description: "Please select a date to copy from",
        variant: "destructive"
      });
      return;
    }

    copyMealsMutation.mutate({
      fromDate: copyFromDate,
      toDate: selectedDate,
      mealTypes: selectedMealTypes.length > 0 ? selectedMealTypes : undefined
    });
  };

  const toggleMealTypeSelection = (mealType: string) => {
    setSelectedMealTypes(prev => 
      prev.includes(mealType) 
        ? prev.filter(m => m !== mealType)
        : [...prev, mealType]
    );
  };

  const getUniqueMealTypes = (logs: any[]) => {
    const mealTypes = [...new Set(logs?.map(log => log.mealType).filter(Boolean))];
    return mealTypes;
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
            <div className="flex gap-2">
              {quickAddSuggestions && quickAddSuggestions.length > 0 && (
                <Button 
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              )}
              <Button 
                onClick={() => setShowCopyMeal(!showCopyMeal)}
                variant="outline"
                size="sm"
                className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Meals
              </Button>
              <Button 
                onClick={() => setShowLogger(true)}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Food
              </Button>
            </div>
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

      {/* Quick Add Suggestions */}
      {showQuickAdd && quickAddSuggestions && quickAddSuggestions.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Add Suggestions
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Based on your eating patterns from the past 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickAddSuggestions.map((suggestion: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getMealTypeIcon(suggestion.mealType)}</span>
                      <span className="font-medium text-green-800 dark:text-green-200">
                        {suggestion.foodName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.frequency}x logged
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.quantity} {suggestion.unit} • {Math.round(suggestion.calories)} cal
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAdd(suggestion)}
                    disabled={quickAddMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy Meals */}
      {showCopyMeal && (
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Copy Meals from Another Date
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-400">
              Copy all or specific meals to {new Date(selectedDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Copy From:</label>
              <input
                type="date"
                value={copyFromDate}
                onChange={(e) => setCopyFromDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>

            {copySourceLogs && copySourceLogs.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Select meals to copy:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getUniqueMealTypes(copySourceLogs).map((mealType: string) => (
                    <div key={mealType} className="flex items-center space-x-2">
                      <Checkbox
                        id={mealType}
                        checked={selectedMealTypes.includes(mealType)}
                        onCheckedChange={() => toggleMealTypeSelection(mealType)}
                      />
                      <label htmlFor={mealType} className="text-sm">
                        {getMealTypeIcon(mealType)} {formatMealType(mealType)}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCopyMeals}
                    disabled={copyMealsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Copy {selectedMealTypes.length > 0 ? `${selectedMealTypes.length} meal types` : 'All Meals'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMealTypes(getUniqueMealTypes(copySourceLogs))}
                    className="border-blue-300 dark:border-blue-600"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMealTypes([])}
                    className="border-blue-300 dark:border-blue-600"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {copyFromDate && copySourceLogs && copySourceLogs.length === 0 && (
              <div className="text-center py-4 text-blue-600 dark:text-blue-400">
                No meals found for {new Date(copyFromDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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