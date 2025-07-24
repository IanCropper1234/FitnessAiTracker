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
  Check
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
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyOperation, setCopyOperation] = useState<{
    type: 'item' | 'section';
    data: any;
    sourceSection?: string;
  } | null>(null);
  const [copyDate, setCopyDate] = useState('');
  
  // Nutrition facts dialog state
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [selectedNutritionItem, setSelectedNutritionItem] = useState<any>(null);
  
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
    if (!e.dataTransfer || !log || bulkMode) return;
    
    setDraggedItem(log);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: log.id,
      foodName: log.foodName,
      mealType: log.mealType
    }));
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg p-2 shadow-lg';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span class="text-sm font-medium">${log.foodName}</span>
      </div>
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after drag operation
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    // Track cursor position for visual feedback
    const handleMouseMove = (e: MouseEvent) => {
      setDragPreview({ x: e.clientX, y: e.clientY });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    setTimeout(() => {
      document.removeEventListener('mousemove', handleMouseMove);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent, targetMealType?: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    if (e.dataTransfer) {
      // Provide visual feedback based on validity of drop
      if (targetMealType && draggedItem.mealType !== targetMealType) {
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(targetMealType);
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear drag over target if we're leaving the container, not a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetMealType: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    setDragPreview(null);
    
    if (!draggedItem || !targetMealType) {
      setDraggedItem(null);
      return;
    }
    
    // Prevent dropping on same meal type
    if (draggedItem.mealType === targetMealType) {
      toast({
        title: "No Change Needed",
        description: `${draggedItem.foodName} is already in ${formatMealType(targetMealType)}`,
        variant: "default"
      });
      setDraggedItem(null);
      return;
    }
    
    // Verify data transfer
    try {
      const transferData = e.dataTransfer.getData('text/plain');
      const parsedData = transferData ? JSON.parse(transferData) : null;
      
      if (!parsedData || parsedData.id !== draggedItem.id) {
        throw new Error('Invalid drag data');
      }
    } catch (error) {
      toast({
        title: "Drag Error",
        description: "Failed to move food item. Please try again.",
        variant: "destructive"
      });
      setDraggedItem(null);
      return;
    }
    
    // Perform the move with success feedback
    updateMealTypeMutation.mutate({
      logId: draggedItem.id,
      newMealType: targetMealType
    }, {
      onSuccess: () => {
        toast({
          title: "Food Moved",
          description: `${draggedItem.foodName} moved to ${formatMealType(targetMealType)}`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Move Failed",
          description: error.message || `Failed to move ${draggedItem.foodName}`,
          variant: "destructive"
        });
      }
    });
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setDragPreview(null);
  };

  // Handle opening nutrition facts dialog
  const handleShowNutritionFacts = (log: any) => {
    setSelectedNutritionItem(log);
    setShowNutritionDialog(true);
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
        <CardHeader className="flex flex-col space-y-1.5 p-6 pl-[10px] pr-[10px] pt-[5px] pb-[5px] mt-[0px] mb-[0px] ml-[0px] mr-[0px]">
          <CardTitle className="text-black dark:text-white flex items-center gap-2 pt-[5px] pb-[5px] pl-[85px] pr-[85px]">
            <CalendarIcon className="w-5 h-5" />
            Nutrition Overview
          </CardTitle>
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
                  <Button variant="ghost" size="sm" className="h-6 w-4 p-0">
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
      {/* Macro Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-1.5">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1.5 pb-2">
            <div className="text-base md:text-lg font-bold text-black dark:text-white text-center">
              {nutritionSummary?.totalCalories || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">
              of {dietGoals?.targetCalories || nutritionSummary?.goalCalories || 2000}
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
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-black dark:text-white flex items-center gap-1.5 text-sm">
              <Utensils className="w-3 h-3 flex-shrink-0" />
              <span>Daily Food Log</span>
            </CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {nutritionLogs && nutritionLogs.length > 0 && (
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedLogs([]);
                  }}
                  className="text-xs h-6 px-1.5"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('Add Food button clicked in IntegratedNutritionOverview, calling onShowLogger with date:', selectedDate);
                  if (onShowLogger) {
                    onShowLogger(selectedDate);
                  }
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-6 px-1.5"
                size="sm"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          {/* Bulk Operations Controls */}
          {bulkMode && nutritionLogs && nutritionLogs.length > 0 && (
            <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="select-all"
                    checked={selectedLogs.length === nutritionLogs.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-[10px] font-medium text-blue-800 dark:text-blue-200">
                    All ({selectedLogs.length}/{nutritionLogs.length})
                  </label>
                </div>
                {selectedLogs.length > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                    disabled={bulkDeleteMutation.isPending}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {selectedLogs.length > 0 && (
                <div className="flex items-center gap-1 pt-1 border-t border-blue-200 dark:border-blue-600">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-6 text-[10px]"
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        Copy to date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex items-center justify-between p-2 border-b">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const dateStr = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), -1);
                            handleBulkCopy(dateStr);
                          }}
                          className="text-xs h-6"
                        >
                          <ChevronLeft className="h-3 w-3 mr-1" />
                          Yesterday
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const dateStr = TimezoneUtils.addDays(TimezoneUtils.getCurrentDate(), 1);
                            handleBulkCopy(dateStr);
                          }}
                          className="text-xs h-6"
                        >
                          Tomorrow
                          <ChevronRight className="h-3 w-3 ml-1" />
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
              )}
            </div>
          )}
          
          <div className="space-y-0">
            {mealTypes.map((mealType) => {
              const mealLogs = nutritionLogs?.filter((log: any) => log.mealType === mealType.key) || [];
              
              return (
                <div 
                  key={mealType.key}
                  className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 overflow-hidden transition-all duration-200 ${
                    dragOverTarget === mealType.key 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' 
                      : draggedItem && draggedItem.mealType !== mealType.key
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-300'
                      : 'bg-transparent'
                  }`}
                  onDragOver={(e) => handleDragOver(e, mealType.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mealType.key)}
                >
                  {/* Meal Header */}
                  <div className="flex items-center justify-between py-3 px-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-black dark:text-white text-lg">
                        {mealType.label}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
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
                  {/* Food Items */}
                  <div className="pb-3">
                    {mealLogs.map((log: any) => {
                      const rpCategory = getRPCategory(log.category);
                      return (
                        <div 
                          key={log.id}
                          draggable={!bulkMode}
                          onDragStart={(e) => !bulkMode && handleDragStart(e, log)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 py-2 px-0 transition-all duration-200 ${
                            draggedItem && draggedItem.id === log.id
                              ? 'opacity-50 scale-95 bg-blue-50 dark:bg-blue-900/20'
                              : bulkMode 
                              ? selectedLogs.includes(log.id) 
                                ? 'ring-2 ring-blue-500 bg-white dark:bg-gray-900' 
                                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' 
                              : 'cursor-move hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => bulkMode && toggleLogSelection(log.id)}
                        >
                          {/* Selection/Drag Handle */}
                          <div className="flex-shrink-0">
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
                            <div 
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowNutritionFacts(log);
                              }}
                            >
                              <div className="font-medium text-black dark:text-white text-sm mb-1 truncate">
                                {log.foodName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {log.quantity} {log.unit}, {log.calories} calories
                              </div>
                            </div>
                          </div>
                          
                          {/* Three-dot menu */}
                          <div className="flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-4 w-4" />
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
                      );
                    })}
                    
                    {mealLogs.length === 0 && (
                      <div className="py-4">
                        <button 
                          onClick={() => {
                            if (onShowLogger) {
                              onShowLogger(selectedDate);
                            }
                          }}
                          className="w-full text-left py-3 px-0 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 pl-[10px] pr-[10px]"
                        >
                          {dragOverTarget === mealType.key ? (
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <ArrowRight className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">Drop here!</div>
                                <div className="text-xs opacity-75">Move to {mealType.label}</div>
                              </div>
                            </div>
                          ) : draggedItem && draggedItem.mealType !== mealType.key ? (
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">Drop zone</div>
                                <div className="text-xs opacity-75">Move {draggedItem.foodName} here</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-blue-500 text-lg font-medium">ADD FOOD</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Swipe right to add meal
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Drag Overlay Indicator */}
      {draggedItem && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="relative w-full h-full">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
              <GripVertical className="w-4 h-4" />
              <span className="text-sm font-medium">
                Moving: {draggedItem.foodName}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
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
      {/* Nutrition Facts Dialog */}
      <Dialog open={showNutritionDialog} onOpenChange={setShowNutritionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Nutrition Facts</span>
            </DialogTitle>
          </DialogHeader>
          {selectedNutritionItem && (
            <div className="space-y-4">
              {/* Food Name and Category */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {selectedNutritionItem.foodName}
                </h3>
                <div className="flex justify-center gap-2">
                  <Badge className={`${getRPCategory(selectedNutritionItem.category).color} text-xs`}>
                    {getRPCategory(selectedNutritionItem.category).label}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNutritionItem.quantity} {selectedNutritionItem.unit}
                  </span>
                </div>
              </div>

              {/* Main Nutrition Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-3">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {Math.round(selectedNutritionItem.calories)} <span className="text-base font-normal">calories</span>
                  </div>
                </div>
                
                {/* Macronutrients */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black dark:text-white">Protein</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {Math.round(selectedNutritionItem.protein)}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (selectedNutritionItem.protein * 4 / selectedNutritionItem.calories) * 100)}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black dark:text-white">Carbohydrates</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {Math.round(selectedNutritionItem.carbs)}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (selectedNutritionItem.carbs * 4 / selectedNutritionItem.calories) * 100)}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black dark:text-white">Fat</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      {Math.round(selectedNutritionItem.fat)}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (selectedNutritionItem.fat * 9 / selectedNutritionItem.calories) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Calorie Breakdown */}
                <div className="bg-white dark:bg-gray-900 rounded p-3 mt-4">
                  <h4 className="font-medium text-black dark:text-white mb-2 text-sm">Calorie Breakdown</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        {Math.round(selectedNutritionItem.protein * 4)}
                      </div>
                      <div className="text-gray-500">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 dark:text-green-400 font-semibold">
                        {Math.round(selectedNutritionItem.carbs * 4)}
                      </div>
                      <div className="text-gray-500">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                        {Math.round(selectedNutritionItem.fat * 9)}
                      </div>
                      <div className="text-gray-500">Fat</div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {selectedNutritionItem.scheduledTime && (
                  <div className="text-center text-sm text-blue-600 dark:text-blue-400">
                    Scheduled: {new Date(`2000-01-01T${selectedNutritionItem.scheduledTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {/* Meal Type */}
                <div className="text-center text-xs text-gray-500">
                  Logged as: {selectedNutritionItem.mealType.charAt(0).toUpperCase() + selectedNutritionItem.mealType.slice(1)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}