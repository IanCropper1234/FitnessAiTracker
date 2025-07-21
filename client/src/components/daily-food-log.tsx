import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimezoneUtils } from "@shared/utils/timezone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NutritionLogger } from "@/components/nutrition-logger";
import { Plus, Trash2, Calendar, Zap, Copy, Check, ChevronLeft, ChevronRight, ChevronDown, Sunrise, Sun, Moon, Apple, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DailyFoodLogProps {
  userId: number;
}

export function DailyFoodLog({ userId }: DailyFoodLogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCopyMeal, setShowCopyMeal] = useState(false);
  const [copyFromDate, setCopyFromDate] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [copyToDate, setCopyToDate] = useState("");

  const { data: nutritionLogs, isLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${userId}?date=${selectedDate}`);
      return response.json();
    }
  });

  // Fetch diet goals to show remaining targets
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch nutrition summary for the selected date
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${userId}?date=${selectedDate}`);
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (logIds: number[]) => {
      const deletePromises = logIds.map(id => 
        apiRequest("DELETE", `/api/nutrition/log/${id}`)
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      setSelectedLogs([]);
      setBulkMode(false);
      toast({
        title: "Success",
        description: `Deleted ${selectedLogs.length} food entries`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete selected entries",
        variant: "destructive"
      });
    }
  });

  // Bulk copy to date mutation
  const bulkCopyToDateMutation = useMutation({
    mutationFn: async (data: { logIds: number[]; targetDate: string }) => {
      return await apiRequest("POST", "/api/nutrition/bulk-copy", {
        userId,
        logIds: data.logIds,
        targetDate: data.targetDate
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      setSelectedLogs([]);
      setBulkMode(false);
      setCopyToDate("");
      toast({
        title: "Success",
        description: `Copied ${data.copiedCount} entries to ${copyToDate}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to copy selected entries",
        variant: "destructive"
      });
    }
  });

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Sunrise className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
      case 'snack': return <Apple className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const formatMealType = (mealType: string) => {
    return mealType?.charAt(0).toUpperCase() + mealType?.slice(1) || 'Meal';
  };

  // Text truncation utility based on device/container width
  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Responsive max length based on screen size
  const getMaxFoodNameLength = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 480) return 25; // Mobile
      if (width < 768) return 35; // Small tablet
      if (width < 1024) return 45; // Tablet
      return 60; // Desktop
    }
    return 30; // Default fallback
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

  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === nutritionLogs?.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(nutritionLogs?.map((log: any) => log.id) || []);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLogs.length === 0) return;
    bulkDeleteMutation.mutate(selectedLogs);
  };

  const handleBulkCopyToDate = () => {
    if (selectedLogs.length === 0 || !copyToDate) {
      toast({
        title: "Error",
        description: "Please select entries and a target date",
        variant: "destructive"
      });
      return;
    }
    bulkCopyToDateMutation.mutate({ logIds: selectedLogs, targetDate: copyToDate });
  };

  const toggleMealTypeSelection = (mealType: string) => {
    setSelectedMealTypes(prev => 
      prev.includes(mealType) 
        ? prev.filter(m => m !== mealType)
        : [...prev, mealType]
    );
  };

  const getUniqueMealTypes = (logs: any[]) => {
    const mealTypesSet = new Set(logs?.map(log => log.mealType).filter(Boolean));
    return Array.from(mealTypesSet);
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
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <CardTitle>Daily Food Log</CardTitle>
              </div>
            </div>
            
            {/* Responsive Button Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickAddSuggestions && quickAddSuggestions.length > 0 && (
                <Button 
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs sm:text-sm"
                >
                  <Zap className="w-4 h-4 mr-1 sm:mr-2" />
                  Quick Add
                </Button>
              )}
              <Button 
                onClick={() => setShowCopyMeal(!showCopyMeal)}
                variant="outline"
                size="sm"
                className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
              >
                <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                Copy Meals
              </Button>
              <Button 
                onClick={() => setBulkMode(!bulkMode)}
                variant={bulkMode ? "destructive" : "outline"}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
                {bulkMode ? "Exit Bulk" : "Bulk Edit"}
              </Button>
              <Button 
                onClick={() => setShowLogger(true)}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                Add Food
              </Button>
            </div>
            
            <CardDescription>Track your daily meals and snacks</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDate(TimezoneUtils.addDays(selectedDate, -1));
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-md min-w-[120px] justify-center">
              <span className="text-sm font-medium">
                {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                 TimezoneUtils.formatForDisplay(selectedDate, 'en-GB')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={TimezoneUtils.parseUserDate(selectedDate)}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(TimezoneUtils.formatDateForStorage(date));
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
                setSelectedDate(TimezoneUtils.addDays(selectedDate, 1));
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Macros Summary */}
      {dietGoals && nutritionSummary && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Daily Targets & Remaining
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-400">
              Your remaining calories and macros for {new Date(selectedDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calories</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.max(0, Number(dietGoals.targetCalories) - (nutritionSummary?.totalCalories || 0))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {dietGoals.targetCalories} remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protein</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {Math.max(0, Number(dietGoals.targetProtein) - (nutritionSummary?.totalProtein || 0)).toFixed(1)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {Number(dietGoals.targetProtein).toFixed(1)}g remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.max(0, Number(dietGoals.targetCarbs) - (nutritionSummary?.totalCarbs || 0)).toFixed(1)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {Number(dietGoals.targetCarbs).toFixed(1)}g remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fat</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.max(0, Number(dietGoals.targetFat) - (nutritionSummary?.totalFat || 0)).toFixed(1)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {Number(dietGoals.targetFat).toFixed(1)}g remaining
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-black dark:text-white">
              Food Entries for {new Date(selectedDate).toLocaleDateString()}
            </CardTitle>
            {nutritionLogs && nutritionLogs.length > 0 && (
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedLogs([]);
                }}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {bulkMode ? 'Exit Selection' : 'Select Items'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Operations Controls */}
          {bulkMode && nutritionLogs && nutritionLogs.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedLogs.length === nutritionLogs.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Select All ({selectedLogs.length} of {nutritionLogs.length} selected)
                  </label>
                </div>
                {selectedLogs.length > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                    disabled={bulkDeleteMutation.isPending}
                    className="w-fit"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedLogs.length})
                  </Button>
                )}
              </div>
              
              {selectedLogs.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-blue-200 dark:border-blue-600">
                  <Label htmlFor="copy-to-date" className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    Copy to date:
                  </Label>
                  <input
                    id="copy-to-date"
                    type="date"
                    value={copyToDate}
                    onChange={(e) => setCopyToDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white flex-1 sm:flex-initial"
                  />
                  <Button
                    onClick={handleBulkCopyToDate}
                    variant="outline"
                    size="sm"
                    disabled={!copyToDate || bulkCopyToDateMutation.isPending}
                    className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Selected ({selectedLogs.length})
                  </Button>
                </div>
              )}
            </div>
          )}

          {nutritionLogs && nutritionLogs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nutritionLogs.map((log: any) => (
                <div 
                  key={log.id} 
                  className={`flex items-start gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                    bulkMode && selectedLogs.includes(log.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {bulkMode && (
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedLogs.includes(log.id)}
                        onCheckedChange={() => toggleLogSelection(log.id)}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg flex-shrink-0">{getMealTypeIcon(log.mealType)}</span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatMealType(log.mealType)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className="font-medium text-black dark:text-white mb-1 break-words" 
                      title={log.foodName}
                    >
                      <span className="block sm:hidden">
                        {truncateText(log.foodName, 25)}
                      </span>
                      <span className="hidden sm:block md:hidden">
                        {truncateText(log.foodName, 35)}
                      </span>
                      <span className="hidden md:block lg:hidden">
                        {truncateText(log.foodName, 45)}
                      </span>
                      <span className="hidden lg:block">
                        {truncateText(log.foodName, 60)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {log.quantity} {log.unit} • <span className="font-medium">{Math.round(log.calories)} cal</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 sm:gap-4">
                      <span className="whitespace-nowrap">P: {Number(log.protein).toFixed(1)}g</span>
                      <span className="whitespace-nowrap">C: {Number(log.carbs).toFixed(1)}g</span>
                      <span className="whitespace-nowrap">F: {Number(log.fat).toFixed(1)}g</span>
                    </div>
                  </div>
                  {!bulkMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(log.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 mt-1"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <div className="mb-4">
                <Utensils className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
              </div>
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
          selectedDate={selectedDate}
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