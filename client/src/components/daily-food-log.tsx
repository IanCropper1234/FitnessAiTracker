import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimezoneUtils } from "@shared/utils/timezone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
import { NutritionLogger } from "@/components/nutrition-logger";
import { Plus, Trash2, Calendar, Zap, Copy, Check, ChevronLeft, ChevronRight, ChevronDown, Sunrise, Sun, Moon, Apple, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IOSDatePicker } from "@/components/ui/ios-date-picker";
import { useMobileDragDrop } from "@/hooks/useMobileDragDrop";

interface DailyFoodLogProps {
  userId: number;
  copyFromDate?: string;
  setCopyFromDate?: (date: string) => void;
  showCopyFromDatePicker?: boolean;
  setShowCopyFromDatePicker?: (show: boolean) => void;
  copyToDate?: string;
  setCopyToDate?: (date: string) => void;
  showCopyToDatePicker?: boolean;
  setShowCopyToDatePicker?: (show: boolean) => void;
}

interface FoodLog {
  id: number;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  date: string;
}

interface DraggableFoodColumnsProps {
  nutritionLogs: FoodLog[];
  selectedLogs: number[];
  bulkMode: boolean;
  onToggleLogSelection: (logId: number) => void;
  onDeleteLog: (logId: number) => void;
  onUpdateMealType: (logId: number, newMealType: string) => void;
  isDeletePending: boolean;
  isUpdatePending: boolean;
}

function DraggableFoodColumns({
  nutritionLogs,
  selectedLogs,
  bulkMode,
  onToggleLogSelection,
  onDeleteLog,
  onUpdateMealType,
  isDeletePending,
  isUpdatePending,
}: DraggableFoodColumnsProps) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  const getMealTypeLogs = (mealType: string) => {
    return nutritionLogs.filter(log => log.mealType === mealType);
  };

  const { getDragHandleProps, getItemClassName } = useMobileDragDrop({
    items: nutritionLogs,
    onReorder: (newLogs) => {
      // Handle cross-meal-type drops
      const updatedLogs = [...newLogs];
      // The actual meal type updating will be handled by the drop zones
    },
    getItemId: (log) => log.id,
    isDisabled: bulkMode,
  });

  const handleMealTypeDrop = (logId: number, newMealType: string) => {
    const log = nutritionLogs.find(l => l.id === logId);
    if (log && log.mealType !== newMealType) {
      onUpdateMealType(logId, newMealType);
    }
  };

  const FoodItem = ({ log, index }: { log: FoodLog; index: number }) => (
    <div
      className={getItemClassName(
        index,
        `flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800  border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
          bulkMode && selectedLogs.includes(log.id) 
            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      )}
      {...(bulkMode ? {} : getDragHandleProps(index))}
      onDragStart={(e) => {
        if (!bulkMode) {
          e.dataTransfer.setData('text/plain', log.id.toString());
        }
      }}
    >
      {bulkMode && (
        <div className="pt-1">
          <Checkbox
            checked={selectedLogs.includes(log.id)}
            onCheckedChange={() => onToggleLogSelection(log.id)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div 
          className="font-medium text-black dark:text-white mb-1 break-words text-sm" 
          title={log.foodName}
        >
          <span className="block sm:hidden">
            {truncateText(log.foodName, 20)}
          </span>
          <span className="hidden sm:block">
            {truncateText(log.foodName, 30)}
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {log.quantity} {log.unit} • <span className="font-medium">{Math.round(log.calories)} cal</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
          <span>P: {Number(log.protein).toFixed(1)}g</span>
          <span>C: {Number(log.carbs).toFixed(1)}g</span>
          <span>F: {Number(log.fat).toFixed(1)}g</span>
        </div>
      </div>
      {!bulkMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteLog(log.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 mt-1 h-8 w-8 p-0"
          disabled={isDeletePending}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  const MealColumn = ({ mealType }: { mealType: string }) => {
    const logs = getMealTypeLogs(mealType);
    
    return (
      <div 
        className="flex-1 min-w-0 bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-3"
        onDrop={(e) => {
          e.preventDefault();
          const logId = parseInt(e.dataTransfer.getData('text/plain'));
          if (logId) {
            handleMealTypeDrop(logId, mealType);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg">{getMealTypeIcon(mealType)}</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatMealType(mealType)}
          </span>
          <Badge variant="outline" className="text-xs">
            {logs.length}
          </Badge>
        </div>
        
        <div className="space-y-2 min-h-[100px]">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <FoodItem key={log.id} log={log} index={nutritionLogs.indexOf(log)} />
            ))
          ) : (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
              {bulkMode ? "No items" : "Drop food items here or tap to add"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
      {mealTypes.map((mealType) => (
        <MealColumn key={mealType} mealType={mealType} />
      ))}
    </div>
  );
}



export function DailyFoodLog({ 
  userId,
  copyFromDate: externalCopyFromDate,
  setCopyFromDate: externalSetCopyFromDate,
  showCopyFromDatePicker,
  setShowCopyFromDatePicker,
  copyToDate: externalCopyToDate,
  setCopyToDate: externalSetCopyToDate,
  showCopyToDatePicker,
  setShowCopyToDatePicker 
}: DailyFoodLogProps) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useIOSNotifications();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCopyMeal, setShowCopyMeal] = useState(false);
  // Use external state for copy dates when provided, otherwise use local state
  const [localCopyFromDate, setLocalCopyFromDate] = useState("");
  const copyFromDate = externalCopyFromDate !== undefined ? externalCopyFromDate : localCopyFromDate;
  const setCopyFromDate = externalSetCopyFromDate || setLocalCopyFromDate;
  
  const [localCopyToDate, setLocalCopyToDate] = useState("");
  const copyToDate = externalCopyToDate !== undefined ? externalCopyToDate : localCopyToDate;
  const setCopyToDate = externalSetCopyToDate || setLocalCopyToDate;
  
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Mutation to update meal type for food logs
  const updateMealTypeMutation = useMutation({
    mutationFn: async ({ logId, newMealType }: { logId: number; newMealType: string }) => {
      return apiRequest("PUT", `/api/nutrition/logs/${logId}/meal-type`, {
        mealType: newMealType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      showSuccess("Meal moved successfully", "Food item has been moved to the new meal.");
    },
    onError: (error) => {
      showError("Failed to move food item", error.message);
    },
  });

  const { data: nutritionLogs, isLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs?date=${selectedDate}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Fetch diet goals to show remaining targets
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch nutrition summary for the selected date
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch nutrition summary');
      return response.json();
    }
  });

  // Quick add suggestions
  const { data: quickAddSuggestions } = useQuery({
    queryKey: ['/api/nutrition/quick-add', userId],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/quick-add`);
      return response.json();
    }
  });

  // Copy meals from another date
  const { data: copySourceLogs } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, copyFromDate],
    queryFn: async () => {
      if (!copyFromDate) return [];
      const response = await fetch(`/api/nutrition/logs?date=${copyFromDate}`, {
        credentials: 'include'
      });
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
      showSuccess("Food log deleted successfully");
    },
    onError: (error: any) => {
      showError("Failed to delete food log", error.message);
    }
  });

  // Quick add mutation
  const quickAddMutation = useMutation({
    mutationFn: async (logData: any) => {
      return await apiRequest("POST", "/api/nutrition/log", {
        ...logData,
        date: selectedDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      showSuccess("Food added successfully");
    },
    onError: (error: any) => {
      showError("Failed to add food", error?.message);
    }
  });

  // Copy meals mutation
  const copyMealsMutation = useMutation({
    mutationFn: async (data: { fromDate: string; toDate: string; mealTypes?: string[] }) => {
      return await apiRequest("POST", "/api/nutrition/copy-meals", {
        ...data
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      setShowCopyMeal(false);
      setCopyFromDate("");
      setSelectedMealTypes([]);
      showSuccess("Meals copied successfully", `Copied ${data.copiedCount} food entries`);
    },
    onError: (error: any) => {
      showError("Failed to copy meals", error?.message);
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
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      setSelectedLogs([]);
      setBulkMode(false);
      showSuccess("Entries deleted", `Deleted ${selectedLogs.length} food entries`);
    },
    onError: (error: any) => {
      showError("Failed to delete selected entries");
    }
  });

  // Bulk copy to date mutation
  const bulkCopyToDateMutation = useMutation({
    mutationFn: async (data: { logIds: number[]; targetDate: string }) => {
      return await apiRequest("POST", "/api/nutrition/bulk-copy", {
        logIds: data.logIds,
        targetDate: data.targetDate
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      setSelectedLogs([]);
      setBulkMode(false);
      setCopyToDate("");
      showSuccess("Entries copied", `Copied ${data.copiedCount} entries to ${copyToDate}`);
    },
    onError: (error: any) => {
      showError("Failed to copy selected entries");
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
          <div className="h-6 bg-gray-200 dark:bg-gray-700  w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 p-4 ">
                <div className="h-4 bg-gray-200 dark:bg-gray-700  w-20 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700  w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700  w-32"></div>
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
            
            {/* Button Layout with Add Food aligned right */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                {quickAddSuggestions && quickAddSuggestions.length > 0 && (
                  <Button 
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    variant="outline"
                    size="sm"
                    className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs flex-shrink-0"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Quick Add</span>
                    <span className="sm:hidden">Quick</span>
                  </Button>
                )}
                <Button 
                  onClick={() => setShowCopyMeal(!showCopyMeal)}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs flex-shrink-0"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Copy Meals</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
                <Button 
                  onClick={() => setBulkMode(!bulkMode)}
                  variant={bulkMode ? "destructive" : "outline"}
                  size="sm"
                  className="text-xs flex-shrink-0"
                >
                  <Check className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{bulkMode ? "Exit Bulk" : "Bulk Edit"}</span>
                  <span className="sm:hidden">{bulkMode ? "Exit" : "Select"}</span>
                </Button>
              </div>
              <Button 
                onClick={() => setShowLogger(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs flex-shrink-0"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span className="hidden xs:inline">Add Food</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </div>
            
            <CardDescription>Track your daily meals and snacks</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <IOSDatePicker 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            size="md"
          />
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
              <div className="text-center p-3 bg-white dark:bg-gray-800  border border-blue-200 dark:border-blue-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calories</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.max(0, Number(dietGoals.targetCalories) - (nutritionSummary?.totalCalories || 0))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {dietGoals.targetCalories} remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800  border border-green-200 dark:border-green-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Protein</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {Math.max(0, Number(dietGoals.targetProtein) - (nutritionSummary?.totalProtein || 0)).toFixed(1)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {Number(dietGoals.targetProtein).toFixed(1)}g remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800  border border-orange-200 dark:border-orange-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.max(0, Number(dietGoals.targetCarbs) - (nutritionSummary?.totalCarbs || 0)).toFixed(1)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {Number(dietGoals.targetCarbs).toFixed(1)}g remaining
                </div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800  border border-purple-200 dark:border-purple-700">
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
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800  border border-green-200 dark:border-green-700"
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
              <button
                onClick={() => setShowCopyFromDatePicker && setShowCopyFromDatePicker(true)}
                className="px-3 py-2 border border-blue-300 dark:border-blue-600  bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                {copyFromDate ? new Date(copyFromDate).toLocaleDateString() : 'Select Date'}
              </button>
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
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20  border border-blue-200 dark:border-blue-700">
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
                  <button
                    onClick={() => setShowCopyToDatePicker && setShowCopyToDatePicker(true)}
                    className="px-3 py-2 text-sm border border-blue-300 dark:border-blue-600  bg-white dark:bg-gray-800 text-black dark:text-white flex-1 sm:flex-initial hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {copyToDate ? new Date(copyToDate).toLocaleDateString() : 'Select Date'}
                  </button>
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
            <DraggableFoodColumns 
              nutritionLogs={nutritionLogs}
              selectedLogs={selectedLogs}
              bulkMode={bulkMode}
              onToggleLogSelection={toggleLogSelection}
              onDeleteLog={(logId) => deleteMutation.mutate(logId)}
              onUpdateMealType={(logId, newMealType) => 
                updateMealTypeMutation.mutate({ logId, newMealType })
              }
              isDeletePending={deleteMutation.isPending}
              isUpdatePending={updateMealTypeMutation.isPending}
            />
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
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
          }}
        />
      )}
    </div>
  );
}

// Helper functions
const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getMealTypeIcon = (mealType: string) => {
  const icons = {
    breakfast: <Sunrise className="w-4 h-4" />,
    lunch: <Sun className="w-4 h-4" />,
    dinner: <Moon className="w-4 h-4" />,
    snack: <Apple className="w-4 h-4" />,
  };
  return icons[mealType as keyof typeof icons] || <Utensils className="w-4 h-4" />;
};

const formatMealType = (mealType: string) => {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
};

const getUniqueMealTypes = (logs: any[]) => {
  return Array.from(new Set(logs.map(log => log.mealType)));
};