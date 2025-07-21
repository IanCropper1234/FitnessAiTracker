import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimezoneUtils } from "@shared/utils/timezone";

import { 
  Plus, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Search,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Utensils,
  CalendarIcon,
  MoreVertical,
  Copy,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Check,
  Target
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface IntegratedNutritionOverviewProps {
  userId: number;
  onShowLogger?: (selectedDate?: string) => void;
}

export function IntegratedNutritionOverview({ userId, onShowLogger }: IntegratedNutritionOverviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());

  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyOperation, setCopyOperation] = useState<{
    type: 'item' | 'section';
    data: any;
    sourceSection?: string;
  } | null>(null);
  const [copyDate, setCopyDate] = useState('');
  
  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);

  // Fetch nutrition summary for the selected date
  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${userId}?date=${selectedDate}`);
      return response.json();
    }
  });

  // Fetch diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch nutrition logs for the selected date
  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
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

  const updateMealTypeMutation = useMutation({
    mutationFn: async ({ logId, newMealType }: { logId: number; newMealType: string }) => {
      return await apiRequest("PUT", `/api/nutrition/log/${logId}`, { mealType: newMealType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
    }
  });

  const copyFoodMutation = useMutation({
    mutationFn: async (foodData: any) => {
      return await apiRequest("POST", "/api/nutrition/log", foodData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      toast({
        title: "Success",
        description: "Food copied successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy food",
        variant: "destructive"
      });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (logIds: number[]) => {
      const promises = logIds.map(id => apiRequest("DELETE", `/api/nutrition/log/${id}`));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      setBulkMode(false);
      setSelectedLogs([]);
      toast({
        title: "Success",
        description: `${selectedLogs.length} food logs deleted successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete food logs",
        variant: "destructive"
      });
    }
  });

  const bulkCopyMutation = useMutation({
    mutationFn: async ({ logIds, targetDate }: { logIds: number[], targetDate: string }) => {
      const logsToCreate = nutritionLogs?.filter((log: any) => logIds.includes(log.id));
      
      if (!logsToCreate || logsToCreate.length === 0) {
        throw new Error('No logs found to copy');
      }
      
      const promises = logsToCreate.map((log: any) => 
        apiRequest("POST", "/api/nutrition/log", {
          userId: log.userId,
          date: targetDate,
          foodName: log.foodName,
          quantity: log.quantity,
          unit: log.unit,
          calories: log.calories,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
          mealType: log.mealType,
          category: log.category,
          mealSuitability: log.mealSuitability
        })
      );
      
      return await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      setBulkMode(false);
      setSelectedLogs([]);
      
      const formattedDate = TimezoneUtils.formatForDisplay(variables.targetDate);
      
      toast({
        title: "Success",
        description: `${selectedLogs.length} food logs copied to ${formattedDate}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy food logs",
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

  const getRPCategory = (category: string) => {
    switch (category) {
      case 'protein_source': return { label: 'Protein', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case 'carb_source': return { label: 'Carb', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      case 'fat_source': return { label: 'Fat', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      case 'mixed_source': return { label: 'Mixed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      default: return { label: 'Food', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  // Bulk selection functions
  const toggleSelectAll = () => {
    if (selectedLogs.length === nutritionLogs?.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(nutritionLogs?.map((log: any) => log.id) || []);
    }
  };

  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedLogs.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedLogs.length} selected food logs?`)) {
      bulkDeleteMutation.mutate(selectedLogs);
    }
  };

  const handleBulkCopy = (targetDate: string) => {
    if (selectedLogs.length === 0 || !targetDate) return;
    
    bulkCopyMutation.mutate({ logIds: selectedLogs, targetDate });
  };

  const handleDragStart = (e: React.DragEvent, log: any) => {
    try {
      if (!e.dataTransfer || !log) return;
      setDraggedItem(log);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(log));
      
      // iOS-specific drag feedback
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.6';
        e.currentTarget.style.transform = 'scale(0.95)';
      }
    } catch (error) {
      console.warn('Drag start error:', error);
      // Fallback for iOS Safari
      setDraggedItem(log);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      
      // iOS-specific drop zone feedback
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      }
    } catch (error) {
      console.warn('Drag over error:', error);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Reset drop zone styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.backgroundColor = '';
      e.currentTarget.style.borderColor = '';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset drag source styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '';
      e.currentTarget.style.transform = '';
    }
    
    // Clean up in case drop didn't fire
    setTimeout(() => {
      setDraggedItem(null);
    }, 100);
  };

  const handleDrop = (e: React.DragEvent, targetMealType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Reset drop zone styling
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.borderColor = '';
      }
      
      let itemToMove = draggedItem;
      
      // Fallback: try to get data from dataTransfer for iOS
      if (!itemToMove && e.dataTransfer) {
        try {
          const transferData = e.dataTransfer.getData('text/plain');
          if (transferData) {
            itemToMove = JSON.parse(transferData);
          }
        } catch (parseError) {
          console.warn('Failed to parse drag data:', parseError);
        }
      }
      
      if (itemToMove && targetMealType && itemToMove.mealType && itemToMove.mealType !== targetMealType && itemToMove.id) {
        updateMealTypeMutation.mutate({
          logId: itemToMove.id,
          newMealType: targetMealType
        });
        
        toast({
          title: "Food Moved",
          description: `Moved "${itemToMove.foodName}" to ${targetMealType}`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.warn('Drop error:', error);
      toast({
        title: "Error",
        description: "Failed to move food item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDraggedItem(null);
    }
  };

  const handleCopyFood = (log: any, targetMealType?: string) => {
    const { id, createdAt, ...foodData } = log;
    const newFoodData = {
      ...foodData,
      userId,
      date: selectedDate,
      mealType: targetMealType || log.mealType
    };
    copyFoodMutation.mutate(newFoodData);
  };

  const handleCopySection = (mealType: string, targetDate: string) => {
    const mealLogs = nutritionLogs?.filter((log: any) => log.mealType === mealType) || [];
    
    mealLogs.forEach((log: any) => {
      const { id, createdAt, ...foodData } = log;
      const newFoodData = {
        ...foodData,
        userId,
        date: targetDate,
        mealType
      };
      copyFoodMutation.mutate(newFoodData);
    });
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: <Sunrise className="h-4 w-4" /> },
    { key: 'lunch', label: 'Lunch', icon: <Sun className="h-4 w-4" /> },
    { key: 'dinner', label: 'Dinner', icon: <Moon className="h-4 w-4" /> },
    { key: 'snack', label: 'Snack', icon: <Apple className="h-4 w-4" /> }
  ];

  if (summaryLoading || logsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-black dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Nutrition Overview
          </CardTitle>
          <CardDescription>Daily nutrition tracking and food log</CardDescription>
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

      

      {/* iOS-style Macro Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full overflow-hidden"
           style={{ maxWidth: '100%' }}>
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="flex flex-col items-center space-y-0 pb-2 pt-3 px-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg mb-2">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="text-lg md:text-xl font-bold text-black dark:text-white text-center">
              {Math.round(nutritionSummary?.totalCalories || 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center leading-tight">
              /{Math.round(dietGoals?.targetCalories || nutritionSummary?.goalCalories || 2000)}
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 text-center leading-tight">
                Left: {Math.max(0, Number(dietGoals.targetCalories) - (nutritionSummary?.totalCalories || 0))}
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
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1.5">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Protein (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1.5 pb-2">
            <div className="text-base md:text-lg font-bold text-black dark:text-white text-center">
              {Math.round(nutritionSummary?.totalProtein || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
              of {Math.round(Number(dietGoals?.targetProtein || nutritionSummary?.goalProtein || 150))}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400 text-center leading-tight">
                Left: {Math.round(Math.max(0, Number(dietGoals.targetProtein) - (nutritionSummary?.totalProtein || 0)))}g
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
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1.5">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Carbs (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1.5 pb-2">
            <div className="text-base md:text-lg font-bold text-black dark:text-white text-center">
              {Math.round(nutritionSummary?.totalCarbs || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
              of {Math.round(Number(dietGoals?.targetCarbs || nutritionSummary?.goalCarbs || 200))}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 text-center leading-tight">
                Left: {Math.round(Math.max(0, Number(dietGoals.targetCarbs) - (nutritionSummary?.totalCarbs || 0)))}g
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
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1.5">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Fat (g)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1.5 pb-2">
            <div className="text-base md:text-lg font-bold text-black dark:text-white text-center">
              {Math.round(nutritionSummary?.totalFat || 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
              of {Math.round(Number(dietGoals?.targetFat || nutritionSummary?.goalFat || 60))}g
            </p>
            {dietGoals && (
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 text-center leading-tight">
                Left: {Math.round(Math.max(0, Number(dietGoals.targetFat) - (nutritionSummary?.totalFat || 0)))}g
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

      {/* Daily Food Log Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="font-semibold tracking-tight text-black dark:text-white flex items-center gap-2 text-base sm:text-[18px]">
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Daily Food Log</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                Food entries for {selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'today'
                  : new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {nutritionLogs && nutritionLogs.length > 0 && (
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedLogs([]);
                  }}
                  className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{bulkMode ? 'Exit Selection' : 'Select Items'}</span>
                  <span className="sm:hidden">{bulkMode ? 'Exit' : 'Select'}</span>
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('Add Food button clicked in IntegratedNutritionOverview, calling onShowLogger with date:', selectedDate);
                  if (onShowLogger) {
                    onShowLogger(selectedDate);
                  }
                }}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs sm:text-sm px-2 sm:px-3"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Food
              </Button>
            </div>
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
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    Copy to date:
                  </Label>
                  <div className="flex items-center gap-2 flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left font-normal flex-1 bg-white dark:bg-gray-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex items-center justify-between p-3 border-b">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const dateStr = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), -1);
                              handleBulkCopy(dateStr);
                            }}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Yesterday
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const dateStr = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), 1);
                              handleBulkCopy(dateStr);
                            }}
                          >
                            Tomorrow
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={undefined}
                          onSelect={(date) => {
                            if (date) {
                              const dateStr = TimezoneUtils.formatDateForStorage(date);
                              handleBulkCopy(dateStr);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-safe"
               style={{ overflowX: 'hidden' }}>
            {mealTypes.map((mealType) => {
              const mealLogs = nutritionLogs?.filter((log: any) => log.mealType === mealType.key) || [];
              
              return (
                <div 
                  key={mealType.key}
                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 min-h-[160px] overflow-hidden transition-colors duration-200"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mealType.key)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {mealType.icon}
                      <h3 className="font-semibold text-black dark:text-white">
                        {mealType.label}
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({mealLogs.length})
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setCopyOperation({
                              type: 'section',
                              data: mealType.key,
                              sourceSection: mealType.key
                            });
                            setShowCopyDialog(true);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy from date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCopyOperation({
                              type: 'section',
                              data: mealType.key,
                              sourceSection: mealType.key
                            });
                            setCopyDate('');
                            setShowCopyDialog(true);
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Copy to date
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2">
                    {mealLogs.map((log: any) => {
                      const rpCategory = getRPCategory(log.category);
                      return (
                        <div 
                          key={log.id}
                          draggable={!bulkMode}
                          onDragStart={(e) => !bulkMode && handleDragStart(e, log)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200 ${
                            bulkMode 
                              ? selectedLogs.includes(log.id) 
                                ? 'ring-2 ring-blue-500 border-blue-500' 
                                : 'cursor-pointer' 
                              : 'cursor-move ios-button-style'
                          }`}
                          onClick={() => bulkMode && toggleLogSelection(log.id)}
                          style={{ touchAction: 'none' }}
                        >
                          {/* Selection/Drag Handle */}
                          <div className="flex-shrink-0 mt-0.5">
                            {bulkMode ? (
                              <Checkbox
                                checked={selectedLogs.includes(log.id)}
                                onCheckedChange={() => toggleLogSelection(log.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Food Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                                <span className="font-medium text-black dark:text-white text-sm truncate block w-full" 
                                      style={{ 
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%'
                                      }}>
                                  <span className="xs:hidden">
                                    {log.foodName.length > 14 ? `${log.foodName.substring(0, 14)}...` : log.foodName}
                                  </span>
                                  <span className="hidden xs:block sm:hidden">
                                    {log.foodName.length > 18 ? `${log.foodName.substring(0, 18)}...` : log.foodName}
                                  </span>
                                  <span className="hidden sm:block md:hidden">
                                    {log.foodName.length > 22 ? `${log.foodName.substring(0, 22)}...` : log.foodName}
                                  </span>
                                  <span className="hidden md:block">
                                    {log.foodName.length > 35 ? `${log.foodName.substring(0, 35)}...` : log.foodName}
                                  </span>
                                </span>
                                <Badge className={`${rpCategory.color} text-xs flex-shrink-0`}>
                                  {rpCategory.label}
                                </Badge>
                              </div>
                              
                              {/* Three-dot menu - aligned to top right */}
                              <div className="flex-shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {mealTypes
                                      .filter(mt => mt.key !== log.mealType)
                                      .map(mt => (
                                        <DropdownMenuItem
                                          key={mt.key}
                                          onClick={() => handleCopyFood(log, mt.key)}
                                        >
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy to {mt.label}
                                        </DropdownMenuItem>
                                      ))
                                    }
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteMutation.mutate(log.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {/* Nutrition details */}
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {log.quantity} {log.unit} • {log.calories}cal
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                            </div>
                            {log.scheduledTime && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {new Date(`2000-01-01T${log.scheduledTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {mealLogs.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No items</p>
                        <p className="text-xs">Drag items here or use Add Food</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Copy Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {copyOperation?.type === 'section' ? 'Copy Meal Section' : 'Copy Food Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {copyOperation?.sourceSection ? 'Copy from date' : 'Copy to date'}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentDate = copyDate ? new Date(copyDate) : new Date();
                    currentDate.setDate(currentDate.getDate() - 1);
                    setCopyDate(currentDate.toISOString().split('T')[0]);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-between h-8 px-3 py-1 text-sm"
                    >
                      {copyDate 
                        ? new Date(copyDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })
                        : 'Select date'
                      }
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={copyDate ? new Date(copyDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setCopyDate(date.toISOString().split('T')[0]);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentDate = copyDate ? new Date(copyDate) : new Date();
                    currentDate.setDate(currentDate.getDate() + 1);
                    setCopyDate(currentDate.toISOString().split('T')[0]);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (copyOperation && copyDate) {
                    if (copyOperation.type === 'section') {
                      handleCopySection(copyOperation.data, copyDate);
                    }
                    setShowCopyDialog(false);
                    setCopyOperation(null);
                    setCopyDate('');
                  }
                }}
                disabled={!copyDate}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}