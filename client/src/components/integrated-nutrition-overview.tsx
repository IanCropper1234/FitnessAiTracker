import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  GripVertical
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface IntegratedNutritionOverviewProps {
  userId: number;
  onShowLogger?: (selectedDate?: string) => void;
}

export function IntegratedNutritionOverview({ userId, onShowLogger }: IntegratedNutritionOverviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyOperation, setCopyOperation] = useState<{
    type: 'item' | 'section';
    data: any;
    sourceSection?: string;
  } | null>(null);
  const [copyDate, setCopyDate] = useState('');

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

  const handleDragStart = (e: React.DragEvent, log: any) => {
    if (!e.dataTransfer || !log) return;
    setDraggedItem(log);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetMealType: string) => {
    e.preventDefault();
    if (draggedItem && targetMealType && draggedItem.mealType && draggedItem.mealType !== targetMealType && draggedItem.id) {
      updateMealTypeMutation.mutate({
        logId: draggedItem.id,
        newMealType: targetMealType
      });
    }
    setDraggedItem(null);
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
                  <CalendarComponent
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

      {/* Daily Food Log Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-semibold tracking-tight text-black dark:text-white flex items-center gap-2 text-[18px]">
                <Utensils className="w-5 h-5" />
                Daily Food Log
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Food entries for {selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'today'
                  : new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                console.log('Add Food button clicked in IntegratedNutritionOverview, calling onShowLogger with date:', selectedDate);
                if (onShowLogger) {
                  onShowLogger(selectedDate);
                }
              }}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mealTypes.map((mealType) => {
              const mealLogs = nutritionLogs?.filter((log: any) => log.mealType === mealType.key) || [];
              
              return (
                <div 
                  key={mealType.key}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[200px]"
                  onDragOver={handleDragOver}
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
                          draggable
                          onDragStart={(e) => handleDragStart(e, log)}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-black dark:text-white text-sm truncate">
                                  {log.foodName}
                                </span>
                                <Badge className={`${rpCategory.color} text-xs`}>
                                  {rpCategory.label}
                                </Badge>
                              </div>
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
                          
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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