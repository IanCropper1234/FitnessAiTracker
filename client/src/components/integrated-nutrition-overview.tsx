import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
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
  Brain,
  CheckSquare,
  Edit,
  Save,
  Pill
} from "lucide-react";
import { IOSDatePicker } from "@/components/ui/ios-date-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IntegratedNutritionOverviewProps {
  userId: number;
  onShowLogger?: (selectedDate?: string) => void;
  onDatePickerOpen?: () => void;
  selectedDate?: string;
  bulkMode?: boolean;
  onBulkModeChange?: (enabled: boolean) => void;
  copyFromDate?: string;
  setCopyFromDate?: (date: string) => void;
  showCopyFromDatePicker?: boolean;
  setShowCopyFromDatePicker?: (show: boolean) => void;
  copyToDate?: string;
  setCopyToDate?: (date: string) => void;
  showCopyToDatePicker?: boolean;
  setShowCopyToDatePicker?: (show: boolean) => void;
  onCopyDateSelected?: (date: string, operation: { type: 'section' | 'item', data: any, sourceSection?: string }) => void;
}

export function IntegratedNutritionOverview({ 
  userId, 
  onShowLogger, 
  onDatePickerOpen, 
  selectedDate: externalSelectedDate,
  bulkMode: externalBulkMode,
  onBulkModeChange,
  copyFromDate: externalCopyFromDate,
  setCopyFromDate: externalSetCopyFromDate,
  showCopyFromDatePicker,
  setShowCopyFromDatePicker,
  copyToDate: externalCopyToDate,
  setCopyToDate: externalSetCopyToDate,
  showCopyToDatePicker,
  setShowCopyToDatePicker,
  onCopyDateSelected
}: IntegratedNutritionOverviewProps) {
  const { showSuccess, showError, showWarning, showInfo } = useIOSNotifications();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [internalSelectedDate, setInternalSelectedDate] = useState(TimezoneUtils.getCurrentDate());
  
  // Use external selectedDate if provided, otherwise use internal state
  const selectedDate = externalSelectedDate || internalSelectedDate;

  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  
  // Touch drag state for mobile devices
  const [touchDragState, setTouchDragState] = useState({
    startY: 0,
    startX: 0,
    currentY: 0,
    currentX: 0,
    startTime: 0,
    isDragging: false,
    hasMovedThreshold: false
  });

  const [copyOperation, setCopyOperation] = useState<{
    type: 'item' | 'section' | 'bulk';
    data: any;
    sourceSection?: string;
  } | null>(null);

  // Bulk selection state - use external bulk mode if provided, otherwise internal state
  const [internalBulkMode, setInternalBulkMode] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  
  const bulkMode = externalBulkMode !== undefined ? externalBulkMode : internalBulkMode;
  const setBulkMode = (enabled: boolean) => {
    if (onBulkModeChange) {
      onBulkModeChange(enabled);
    } else {
      setInternalBulkMode(enabled);
    }
  };

  // Effect to clear drag state when bulk mode is toggled off
  useEffect(() => {
    if (!bulkMode) {
      // Immediately clear all drag state when bulk mode is turned off
      setDraggedItem(null);
      setDragOverTarget(null);
      setDragPreview(null);
      setDragOverIndex(null);
      setIsDraggingActive(false);
      setDragStartY(0);
      setTouchDragState({
        startY: 0,
        startX: 0,
        currentY: 0,
        currentX: 0,
        startTime: 0,
        isDragging: false,
        hasMovedThreshold: false
      });
      setSelectedLogs([]);
    }
  }, [bulkMode]);

  // Effect to handle copy operations when external date pickers close with a date
  useEffect(() => {
    // Only proceed if we have a copyOperation AND a NEWLY CHANGED external date
    if (copyOperation) {
      console.log('Copy operation effect triggered:', {
        copyOperation,
        externalCopyFromDate,
        externalCopyToDate,
        selectedDate
      });
      
      if (copyOperation.type === 'section') {
        if (externalCopyFromDate && copyOperation.sourceSection && externalCopyFromDate !== selectedDate) {
          console.log('Executing section copy FROM date:', externalCopyFromDate, 'TO current date:', selectedDate);
          handleCopyFromDate(copyOperation.data, externalCopyFromDate, selectedDate);
          setCopyOperation(null);
          // Clear the external date states to prevent auto-reuse
          if (externalSetCopyFromDate) {
            externalSetCopyFromDate("");
          }
        } else if (externalCopyToDate && !copyOperation.sourceSection && externalCopyToDate !== selectedDate) {
          console.log('Executing section copy FROM current date:', selectedDate, 'TO date:', externalCopyToDate);
          handleCopySection(copyOperation.data, externalCopyToDate);
          setCopyOperation(null);
          // Clear the external date states to prevent auto-reuse
          if (externalSetCopyToDate) {
            externalSetCopyToDate("");
          }
        }
      } else if (copyOperation.type === 'item' && externalCopyToDate && externalCopyToDate !== selectedDate) {
        console.log('Executing individual item copy FROM current date:', selectedDate, 'TO date:', externalCopyToDate);
        handleCopyFoodToDate(copyOperation.data, externalCopyToDate);
        setCopyOperation(null);
        // Clear the external date states to prevent auto-reuse
        if (externalSetCopyToDate) {
          externalSetCopyToDate("");
        }
      } else if (copyOperation.type === 'bulk' && externalCopyToDate && externalCopyToDate !== selectedDate) {
        console.log('Executing bulk copy FROM current date:', selectedDate, 'TO date:', externalCopyToDate, 'selectedLogIds:', copyOperation.data);
        handleBulkCopyToDate(copyOperation.data, externalCopyToDate);
        setCopyOperation(null);
        // Clear the external date states to prevent auto-reuse
        if (externalSetCopyToDate) {
          externalSetCopyToDate("");
        }
      }
    }
  }, [externalCopyFromDate, externalCopyToDate, copyOperation, selectedDate]);
  
  // Nutrition facts dialog state - removed, now using standalone page
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  
  // Save as meal dialog state
  const [showSaveMealDialog, setShowSaveMealDialog] = useState(false);
  const [saveMealName, setSaveMealName] = useState('');
  const [saveMealDescription, setSaveMealDescription] = useState('');
  const [saveMealSection, setSaveMealSection] = useState('');

  // Fetch nutrition summary for the selected date
  const { data: nutritionSummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['/api/nutrition/summary', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition summary');
      }
      return response.json();
    },
    retry: 3
  });

  // Fetch diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      
      // Convert string values to numbers for consistent frontend usage
      if (data) {
        return {
          ...data,
          tdee: Number(data.tdee),
          targetCalories: Number(data.targetCalories),
          customTargetCalories: Number(data.customTargetCalories),
          targetProtein: Number(data.targetProtein),
          targetCarbs: Number(data.targetCarbs),
          targetFat: Number(data.targetFat),
          weeklyWeightTarget: Number(data.weeklyWeightTarget)
        };
      }
      return data;
    }
  });

  // Fetch user profile data for RDA calculations
  const { data: profileData } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Helper function to intelligently get current target calories (custom or suggested)
  const getCurrentTargetCalories = () => {
    if (!dietGoals) return nutritionSummary?.goalCalories || 2000;
    
    // Always use the current active target calories from the diet goal
    // The diet builder manages which value is active based on user selection
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

  // Fetch nutrition logs for the selected date
  const { data: nutritionLogs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['/api/nutrition/logs', userId, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition logs');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 3
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("DELETE", `/api/nutrition/log/${logId}`);
    },
    onSuccess: () => {
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      showSuccess("Success", "Food log deleted successfully");
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to delete food log");
    }
  });

  const updateMealTypeMutation = useMutation({
    mutationFn: async ({ logId, newMealType }: { logId: number; newMealType: string }) => {
      return await apiRequest("PUT", `/api/nutrition/logs/${logId}/meal-type`, { mealType: newMealType });
    },
    onSuccess: () => {
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to move food item");
    }
  });

  const copyFoodMutation = useMutation({
    mutationFn: async (foodData: any) => {
      return await apiRequest("POST", "/api/nutrition/log", foodData);
    },
    onSuccess: () => {
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      showSuccess("Success", "Food copied successfully");
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to copy food");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (logIds: number[]) => {
      const promises = logIds.map(id => apiRequest("DELETE", `/api/nutrition/log/${id}`));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      setBulkMode(false);
      setSelectedLogs([]);
      showSuccess("Success", `${selectedLogs.length} food logs deleted successfully`);
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to delete food logs");
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
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      setBulkMode(false);
      setSelectedLogs([]);
      
      const formattedDate = TimezoneUtils.formatForDisplay(variables.targetDate);
      
      showSuccess("Success", `${selectedLogs.length} food logs copied to ${formattedDate}`);
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to copy food logs");
    }
  });

  const editQuantityMutation = useMutation({
    mutationFn: async ({ logId, quantity, unit }: { logId: number; quantity: number; unit: string }) => {
      return await apiRequest("PUT", `/api/nutrition/log/${logId}`, { quantity, unit });
    },
    onSuccess: () => {
      // Invalidate with user-specific query keys to prevent cache sharing between users
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
      setShowEditDialog(false);
      setEditingItem(null);
      showSuccess("Success", "Food quantity and unit updated successfully");
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to update food item");
    }
  });

  const saveMealMutation = useMutation({
    mutationFn: async (mealData: { name: string; description: string; foodItems: any[] }) => {
      return await apiRequest("POST", "/api/saved-meals", {
        userId,
        name: mealData.name,
        description: mealData.description,
        foodItems: mealData.foodItems
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-meals', userId] });
      setShowSaveMealDialog(false);
      setSaveMealName('');
      setSaveMealDescription('');
      setSaveMealSection('');
      showSuccess("Success", "Meal saved successfully");
    },
    onError: (error: any) => {
      showError("Error", error.message || "Failed to save meal");
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
      setSelectedLogs(Array.isArray(nutritionLogs) ? nutritionLogs.map((log: any) => log.id) : []);
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

  const handleEditFood = (log: any) => {
    setEditingItem(log);
    setEditQuantity(log.quantity.toString());
    setEditUnit(log.unit);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editQuantity || !editUnit) return;
    
    const quantity = parseFloat(editQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      showError("Invalid Quantity", "Please enter a valid quantity greater than 0");
      return;
    }

    editQuantityMutation.mutate({
      logId: editingItem.id,
      quantity,
      unit: editUnit
    });
  };

  const handleSaveAsMeal = (mealSection: string) => {
    const sectionLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => log.mealType === mealSection) : [];
    
    if (sectionLogs.length === 0) {
      showError("No Foods Found", "This meal section is empty. Add some foods first.");
      return;
    }

    setSaveMealSection(mealSection);
    setSaveMealName(`${formatMealType(mealSection)} - ${new Date().toLocaleDateString()}`);
    setSaveMealDescription(`Saved from ${formatMealType(mealSection)} on ${new Date(selectedDate).toLocaleDateString()}`);
    setShowSaveMealDialog(true);
  };

  const handleConfirmSaveMeal = () => {
    if (!saveMealName.trim()) {
      showError("Meal Name Required", "Please enter a name for this meal");
      return;
    }

    const sectionLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => log.mealType === saveMealSection) : [];
    
    if (sectionLogs.length === 0) {
      showError("No Foods Found", "This meal section is empty");
      return;
    }

    const foodItems = sectionLogs.map((log: any) => ({
      foodName: log.foodName,
      quantity: log.quantity,
      unit: log.unit,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      category: log.category,
      mealSuitability: log.mealSuitability || [],
      micronutrients: log.micronutrients || null // Include complete micronutrient data
    }));

    // Calculate totals including micronutrients
    const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
    const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
    const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

    // Calculate total micronutrients by aggregating from all food items
    const totalMicronutrients = foodItems.reduce((aggregated: any, item: any) => {
      // Safely check for micronutrients data
      if (item.micronutrients && 
          typeof item.micronutrients === 'object' && 
          item.micronutrients !== null &&
          !Array.isArray(item.micronutrients)) {
        
        try {
          // Iterate through each micronutrient category
          Object.keys(item.micronutrients).forEach(category => {
            const categoryData = item.micronutrients[category];
            if (categoryData && typeof categoryData === 'object') {
              if (!aggregated[category]) aggregated[category] = {};
              
              // Aggregate individual nutrient amounts
              Object.keys(categoryData).forEach(nutrient => {
                const nutrientData = categoryData[nutrient];
                if (nutrientData && typeof nutrientData === 'object') {
                  const amount = parseFloat(nutrientData.amount || 0);
                  const unit = nutrientData.unit || 'mg';
                  
                  if (!aggregated[category][nutrient]) {
                    aggregated[category][nutrient] = { amount: 0, unit };
                  }
                  aggregated[category][nutrient].amount += amount;
                }
              });
            }
          });
        } catch (error) {
          console.warn('Error processing micronutrients for item:', item.foodName, error);
        }
      }
      return aggregated;
    }, {});

    saveMealMutation.mutate({
      name: saveMealName.trim(),
      description: saveMealDescription.trim(),
      foodItems
    });
  };

  const handleDragStart = (e: React.DragEvent, log: any) => {
    console.log('Drag start triggered for:', log.foodName, 'from meal type:', log.mealType);
    if (!e.dataTransfer || !log || !bulkMode) return;
    
    setDraggedItem(log);
    setIsDraggingActive(true);
    setDragStartY(e.clientY);
    
    // iOS-specific optimizations
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: log.id,
      foodName: log.foodName,
      mealType: log.mealType
    }));
    
    // Create a custom drag image for better iOS experience
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: #2563eb; 
        color: white; 
        padding: 8px 12px; 
        border-radius: 8px; 
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span style="width: 12px; height: 12px; background: rgba(255,255,255,0.3); border-radius: 2px;"></span>
        ${log.foodName}
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after a short delay
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

  const handleDragOver = (e: React.DragEvent, targetMealType: string, index?: number) => {
    e.preventDefault();
    
    if (!draggedItem || targetMealType === draggedItem.mealType) return;
    
    setDragOverTarget(targetMealType);
    if (typeof index !== 'undefined') {
      setDragOverIndex(index);
    }
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    // Add haptic feedback for iOS (if supported)
    if (navigator.vibrate && Math.abs(e.clientY - dragStartY) > 10) {
      navigator.vibrate(10);
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
    console.log('Drop triggered - moving', draggedItem?.foodName, 'to', targetMealType);
    e.preventDefault();
    setDragOverTarget(null);
    setDragPreview(null);
    
    if (!draggedItem || !targetMealType) {
      console.log('Early return - missing data:', { draggedItem: !!draggedItem, targetMealType });
      setDraggedItem(null);
      return;
    }
    
    // Prevent dropping on same meal type
    if (draggedItem.mealType === targetMealType) {
      console.log('Same meal type drop prevented');
      showInfo("No Change Needed", `${draggedItem.foodName} is already in ${formatMealType(targetMealType)}`);
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
      showError("Drag Error", "Failed to move food item. Please try again.");
      setDraggedItem(null);
      return;
    }
    
    // Perform the move with success feedback
    console.log('Calling updateMealTypeMutation with:', { logId: draggedItem.id, newMealType: targetMealType });
    updateMealTypeMutation.mutate({
      logId: draggedItem.id,
      newMealType: targetMealType
    }, {
      onSuccess: () => {
        console.log('Move successful');
        showSuccess("Food Moved", `${draggedItem.foodName} moved to ${formatMealType(targetMealType)}`);
      },
      onError: (error: any) => {
        console.error('Move failed:', error);
        showError("Move Failed", error.message || `Failed to move ${draggedItem.foodName}`);
      }
    });
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setDragPreview(null);
    setDragOverIndex(null);
    setIsDraggingActive(false);
    setDragStartY(0);
    setTouchDragState({
      startY: 0,
      startX: 0,
      currentY: 0,
      currentX: 0,
      startTime: 0,
      isDragging: false,
      hasMovedThreshold: false
    });
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, log: any) => {
    if (!bulkMode) {
      // Clear any existing drag state when not in bulk mode
      handleDragEnd();
      return;
    }
    
    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchDragState({
      startY: touch.clientY,
      startX: touch.clientX,
      currentY: touch.clientY,
      currentX: touch.clientX,
      startTime: now,
      isDragging: false,
      hasMovedThreshold: false
    });
    
    // Start long press timer for mobile drag
    setTimeout(() => {
      const timeDiff = Date.now() - now;
      if (timeDiff >= 300 && !touchDragState.hasMovedThreshold && bulkMode) {
        // Long press detected - start drag
        setDraggedItem(log);
        setIsDraggingActive(true);
        setTouchDragState(prev => ({ ...prev, isDragging: true }));
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 300);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!bulkMode) {
      // Clear any existing drag state when not in bulk mode
      handleDragEnd();
      return;
    }
    
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchDragState.startY);
    const deltaX = Math.abs(touch.clientX - touchDragState.startX);
    
    // Check if moved enough to be considered intentional movement
    if ((deltaY > 10 || deltaX > 10) && !touchDragState.hasMovedThreshold) {
      setTouchDragState(prev => ({ ...prev, hasMovedThreshold: true }));
      
      // If we haven't started dragging yet, this is likely a scroll
      if (!touchDragState.isDragging) {
        return;
      }
    }
    
    if (touchDragState.isDragging && draggedItem && bulkMode) {
      // Prevent scrolling when dragging
      e.preventDefault();
      
      setTouchDragState(prev => ({
        ...prev,
        currentY: touch.clientY,
        currentX: touch.clientX
      }));
      
      // Find target meal section under touch point
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const mealSection = element?.closest('[data-meal-type]');
      if (mealSection) {
        const targetMealType = mealSection.getAttribute('data-meal-type');
        if (targetMealType && targetMealType !== draggedItem.mealType) {
          setDragOverTarget(targetMealType);
        }
      } else {
        setDragOverTarget(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!bulkMode) {
      // Clear any existing drag state when not in bulk mode
      handleDragEnd();
      return;
    }
    
    if (touchDragState.isDragging && draggedItem && dragOverTarget && bulkMode) {
      // Perform the drop operation
      console.log('Touch drop - moving', draggedItem.foodName, 'to', dragOverTarget);
      
      if (draggedItem.mealType !== dragOverTarget) {
        updateMealTypeMutation.mutate({
          logId: draggedItem.id,
          newMealType: dragOverTarget
        }, {
          onSuccess: () => {
            showSuccess("Food Moved", `${draggedItem.foodName} moved to ${formatMealType(dragOverTarget)}`);
          },
          onError: (error: any) => {
            showError("Move Failed", error.message || `Failed to move ${draggedItem.foodName}`);
          }
        });
      }
    }
    
    // Reset all drag state
    handleDragEnd();
  };

  // Handle opening nutrition facts page
  const handleShowNutritionFacts = (log: any) => {
    // Store the selected item in localStorage and navigate to nutrition facts page
    localStorage.setItem('selectedNutritionItem', JSON.stringify(log));
    setLocation('/nutrition-facts');
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

  const handleCopyFoodToDate = (log: any, targetDate: string) => {
    const { id, createdAt, ...foodData } = log;
    const newFoodData = {
      ...foodData,
      userId,
      date: targetDate,
      mealType: log.mealType // Keep same meal type when copying to date
    };
    copyFoodMutation.mutate(newFoodData);
    
    showSuccess("Food Copied", `${log.foodName} copied to ${new Date(targetDate).toLocaleDateString()}`);
  };

  const handleBulkCopyToDate = (selectedLogIds: number[], targetDate: string) => {
    const logsToCreate = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => selectedLogIds.includes(log.id)) : [];
    
    logsToCreate.forEach((log: any) => {
      const { id, createdAt, ...foodData } = log;
      const newFoodData = {
        ...foodData,
        userId,
        date: targetDate,
        mealType: log.mealType // Keep same meal type when copying to date
      };
      copyFoodMutation.mutate(newFoodData);
    });
    
    showSuccess("Foods Copied", `${logsToCreate.length} food items copied to ${new Date(targetDate).toLocaleDateString()}`);
    
    // Clear bulk selection after copy
    setSelectedLogs([]);
    setBulkMode(false);
  };

  const handleCopySection = (mealType: string, targetDate: string) => {
    const mealLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => log.mealType === mealType) : [];
    
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

  const handleCopyFromDate = async (mealType: string, sourceDate: string, targetDate: string) => {
    try {
      // Fetch nutrition logs from the source date
      const response = await fetch(`/api/nutrition/logs?date=${sourceDate}`);
      const sourceLogs = await response.json();
      
      // Filter logs for the specific meal type
      const mealLogs = sourceLogs?.filter((log: any) => log.mealType === mealType) || [];
      
      // Copy each log to the target date
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
      
      showSuccess("Meal Copied", `${formatMealType(mealType)} copied from ${new Date(sourceDate).toLocaleDateString()}`);
    } catch (error) {
      console.error('Copy from date failed:', error);
      showError("Copy Failed", "Failed to copy meal from selected date");
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: <Sunrise className="h-4 w-4" /> },
    { key: 'lunch', label: 'Lunch', icon: <Sun className="h-4 w-4" /> },
    { key: 'dinner', label: 'Dinner', icon: <Moon className="h-4 w-4" /> },
    { key: 'snack', label: 'Snack', icon: <Apple className="h-4 w-4" /> },
    { key: 'supplementation', label: 'Supplementation', icon: <Pill className="h-4 w-4" /> }
  ];

  // Calculate meal totals for each section
  const calculateMealTotals = (mealType: string) => {
    const mealLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => log.mealType === mealType) : [];
    return mealLogs.reduce((totals: { calories: number; protein: number; carbs: number; fat: number; count: number }, log: any) => ({
      calories: totals.calories + (parseFloat(log.calories) || 0),
      protein: totals.protein + (parseFloat(log.protein) || 0),
      carbs: totals.carbs + (parseFloat(log.carbs) || 0),
      fat: totals.fat + (parseFloat(log.fat) || 0),
      count: totals.count + 1
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
  };

  if (summaryLoading || logsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Macro Summary - Condensed List View */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border shadow-lg nutrition-card-ios">
        <CardContent className="p-3">
          <div className="space-y-3">
            {/* Calories Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-blue-600 dark:text-blue-400">
                Calories
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="text-sm font-bold text-black dark:text-white min-w-[3rem]">
                  {Math.round(nutritionSummary?.totalCalories || 0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">/</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
                  {Math.round(getCurrentTargetCalories())}
                </div>
                <div className="flex-1 relative">
                  <div className="nutrition-progress-bar h-2">
                    <div 
                      className="nutrition-progress-fill bg-blue-500 h-2"
                      style={{ 
                        width: `${Math.min(100, (nutritionSummary?.totalCalories || 0) / getCurrentTargetCalories() * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 min-w-[2.5rem] text-right">
                  {Math.round(((nutritionSummary?.totalCalories || 0) / getCurrentTargetCalories() * 100))}%
                </div>
              </div>
            </div>

            {/* Protein Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-green-600 dark:text-green-400">
                Protein
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="text-sm font-bold text-black dark:text-white min-w-[3rem]">
                  {Math.round(nutritionSummary?.totalProtein || 0)}g
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">/</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
                  {Math.round(getCurrentTargetProtein())}g
                </div>
                <div className="flex-1 relative">
                  <div className="nutrition-progress-bar h-2">
                    <div 
                      className="nutrition-progress-fill bg-green-500 h-2"
                      style={{ 
                        width: `${Math.min(100, (nutritionSummary?.totalProtein || 0) / getCurrentTargetProtein() * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-medium text-green-700 dark:text-green-300 min-w-[2.5rem] text-right">
                  {Math.round(((nutritionSummary?.totalProtein || 0) / getCurrentTargetProtein() * 100))}%
                </div>
              </div>
            </div>

            {/* Carbs Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-orange-600 dark:text-orange-400">
                Carbs
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="text-sm font-bold text-black dark:text-white min-w-[3rem]">
                  {Math.round(nutritionSummary?.totalCarbs || 0)}g
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">/</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
                  {Math.round(getCurrentTargetCarbs())}g
                </div>
                <div className="flex-1 relative">
                  <div className="nutrition-progress-bar h-2">
                    <div 
                      className="nutrition-progress-fill bg-orange-500 h-2"
                      style={{ 
                        width: `${Math.min(100, (nutritionSummary?.totalCarbs || 0) / getCurrentTargetCarbs() * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-medium text-orange-700 dark:text-orange-300 min-w-[2.5rem] text-right">
                  {Math.round(((nutritionSummary?.totalCarbs || 0) / getCurrentTargetCarbs() * 100))}%
                </div>
              </div>
            </div>

            {/* Fat Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-purple-600 dark:text-purple-400">
                Fat
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="text-sm font-bold text-black dark:text-white min-w-[3rem]">
                  {Math.round(nutritionSummary?.totalFat || 0)}g
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">/</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 min-w-[2.5rem]">
                  {Math.round(getCurrentTargetFat())}g
                </div>
                <div className="flex-1 relative">
                  <div className="nutrition-progress-bar h-2">
                    <div 
                      className="nutrition-progress-fill bg-purple-500 h-2"
                      style={{ 
                        width: `${Math.min(100, (nutritionSummary?.totalFat || 0) / getCurrentTargetFat() * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 min-w-[2.5rem] text-right">
                  {Math.round(((nutritionSummary?.totalFat || 0) / getCurrentTargetFat() * 100))}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* AI Nutrition Analysis - Compact Integration */}
      <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 border shadow-lg mb-2">
        <CardContent className="p-3 pt-[8px] pb-[8px] text-[17px] pl-[10px] pr-[10px] mt-[0px] mb-[0px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Enhanced Nutrition AI</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setLocation('/enhanced-nutrition-ai')}
              className="h-7 text-xs px-3 border-purple-400 dark:border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20"
            >
              Analyze Nutrition
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Expandable Micronutrients Section with RDA Comparison */}
      {(() => {
        const todayLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => {
          const logDate = new Date(log.date).toLocaleDateString();
          const today = new Date(selectedDate).toLocaleDateString();
          return logDate === today;
        }) : [];
        
        const micronutrientLogs = todayLogs.filter((log: any) => log.micronutrients && Object.keys(log.micronutrients).length > 0);
        
        if (micronutrientLogs.length === 0) return null;
        
        // Helper function to map nested nutrient names to flat names
        const getNutrientFlatName = (nutrientName: string): string => {
          // First, handle special cases with suffixes and alternative names
          const cleanNutrientName = nutrientName
            .toLowerCase()
            .replace(/^vitamin\s+/, 'vitamin') // Normalize "Vitamin " to "vitamin"
            .replace(/_.*$/, '') // Remove suffixes like "_niacin", "_biotin", "_thiamine", etc.
            .replace(/\s.*$/, '') // Remove space-separated suffixes
            .trim();
            
          const mapping: { [key: string]: string } = {
            // Fat-Soluble Vitamins
            'vitamina': 'vitaminA',
            'vitamind': 'vitaminD', 
            'vitamine': 'vitaminE',
            'vitamink': 'vitaminK',
            'vitaminA': 'vitaminA',
            'vitaminD': 'vitaminD', 
            'vitaminE': 'vitaminE',
            'vitaminK': 'vitaminK',
            // Water-Soluble Vitamins
            'vitaminc': 'vitaminC',
            'vitaminb1': 'vitaminB1',
            'vitaminb2': 'vitaminB2', 
            'vitaminb3': 'vitaminB3',
            'vitaminb5': 'vitaminB5',
            'vitaminb6': 'vitaminB6',
            'vitaminb7': 'vitaminB7',
            'vitaminb9': 'vitaminB9',
            'vitaminb12': 'vitaminB12',
            'vitaminC': 'vitaminC',
            'vitaminB1': 'vitaminB1',
            'vitaminB2': 'vitaminB2', 
            'vitaminB3': 'vitaminB3',
            'vitaminB5': 'vitaminB5',
            'vitaminB6': 'vitaminB6',
            'vitaminB7': 'vitaminB7',
            'vitaminB9': 'vitaminB9',
            'vitaminB12': 'vitaminB12',
            'folate': 'folate',
            'thiamine': 'vitaminB1',
            'riboflavin': 'vitaminB2',
            'niacin': 'vitaminB3',
            'pantothenicacid': 'vitaminB5',
            'pyridoxine': 'vitaminB6',
            'biotin': 'vitaminB7',
            'cobalamin': 'vitaminB12',
            'choline': 'choline',
            // Major Minerals
            'sodium': 'sodium',
            'calcium': 'calcium',
            'chloride': 'chloride',
            'magnesium': 'magnesium',
            'potassium': 'potassium',
            'phosphorus': 'phosphorus',
            'sulfur': 'sulfur',
            // Trace Minerals
            'iron': 'iron',
            'zinc': 'zinc',
            'copper': 'copper',
            'iodine': 'iodine',
            'chromium': 'chromium',
            'fluoride': 'fluoride',
            'selenium': 'selenium',
            'manganese': 'manganese',
            'molybdenum': 'molybdenum',
            'boron': 'boron',
            // Macronutrient Components
            'fiber': 'fiber',
            'sugar': 'sugar',
            'omega3': 'omega3',
            'omega6': 'omega6',
            'omega9': 'omega9',
            'starch': 'starch',
            'alcohol': 'alcohol',
            'transfat': 'transFat',
            'addedsugar': 'addedSugar',
            'cholesterol': 'cholesterol',
            'saturatedfat': 'saturatedFat',
            'solublefiber': 'solubleFiber',
            'insolublefiber': 'insolubleFiber',
            'monounsaturatedfat': 'monounsaturatedFat',
            'polyunsaturatedfat': 'polyunsaturatedFat',
            'transFat': 'transFat',
            'addedSugar': 'addedSugar',
            'saturatedFat': 'saturatedFat',
            'solubleFiber': 'solubleFiber',
            'insolubleFiber': 'insolubleFiber',
            'monounsaturatedFat': 'monounsaturatedFat',
            'polyunsaturatedFat': 'polyunsaturatedFat',
            // Supplement Compounds
            'bcaa': 'bcaa',
            'collagen': 'collagen',
            'glutamine': 'glutamine',
            'wheyprotein': 'wheyProtein',
            'caseinprotein': 'caseinProtein'
          };
          
          return mapping[cleanNutrientName] || mapping[nutrientName] || nutrientName;
        };
        
        // Calculate daily micronutrient totals with support for both flat and nested structures
        const dailyTotals = micronutrientLogs.reduce((totals: any, log: any) => {
          const micronutrients = log.micronutrients;
          if (micronutrients && typeof micronutrients === 'object') {
            
            // Check if this is a nested structure (has categories like 'Major Minerals', 'Fat-Soluble Vitamins', etc.)
            const hasNestedStructure = Object.keys(micronutrients).some(key => 
              typeof micronutrients[key] === 'object' && 
              micronutrients[key] !== null &&
              !Array.isArray(micronutrients[key]) &&
              ['Major Minerals', 'Trace Minerals', 'Fat-Soluble Vitamins', 'Water-Soluble Vitamins', 'Macronutrient Components'].includes(key)
            );
            
            if (hasNestedStructure) {
              // Handle nested structure (supplements and some advanced foods)
              Object.keys(micronutrients).forEach(category => {
                const categoryData = micronutrients[category];
                if (categoryData && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
                  Object.keys(categoryData).forEach(nutrient => {
                    let value: number;
                    const rawValue = categoryData[nutrient];
                    
                    // Handle dynamic unit format {value: number, unit: string}
                    if (typeof rawValue === 'object' && rawValue !== null && typeof rawValue.value === 'number') {
                      value = rawValue.value;
                    } else {
                      value = parseFloat(rawValue);
                    }
                    
                    if (typeof value === 'number' && !isNaN(value) && value > 0) {
                      // Map nested nutrient names to flat names for consistency
                      const flatNutrientName = getNutrientFlatName(nutrient);
                      totals[flatNutrientName] = (totals[flatNutrientName] || 0) + value;
                    }
                  });
                }
              });
            } else {
              // Handle flat structure (regular foods)
              Object.keys(micronutrients).forEach(nutrient => {
                let value: number;
                const rawValue = micronutrients[nutrient];
                
                // Handle dynamic unit format {value: number, unit: string}
                if (typeof rawValue === 'object' && rawValue !== null && typeof rawValue.value === 'number') {
                  value = rawValue.value;
                } else {
                  value = parseFloat(rawValue);
                }
                
                if (typeof value === 'number' && !isNaN(value) && value > 0) {
                  totals[nutrient] = (totals[nutrient] || 0) + value;
                }
              });
            }
          }
          return totals;
        }, {});


        
        // Calculate RDA recommendations based on user profile
        const userProfile = profileData?.user || {};
        const bodyMetrics = profileData?.bodyMetrics?.[0] || {};
        
        // Use actual gender from user profile or default to male for RDA calculations
        const estimatedGender: 'male' | 'female' = userProfile.gender === 'female' ? 'female' : 'male';
        const age = userProfile.age || 30;
        const weight = bodyMetrics.weight ? parseFloat(bodyMetrics.weight) : (userProfile.weight ? parseFloat(userProfile.weight) : 70);
        const activityLevel = userProfile.activityLevel || 'moderately_active';
        
        // Base RDA calculations (simplified inline version)
        const calculateRDA = () => {
          const isHighlyActive = activityLevel === 'very_active' || activityLevel === 'extremely_active';
          const activityMultiplier = isHighlyActive ? 1.2 : 1.0;
          
          return {
            vitaminA: estimatedGender === 'male' ? 900 : 700, // μg RAE
            vitaminD: age > 70 ? 20 : 15, // μg
            vitaminE: 15 * activityMultiplier, // mg
            vitaminK: estimatedGender === 'male' ? 120 : 90, // μg
            vitaminC: (estimatedGender === 'male' ? 90 : 75) * activityMultiplier, // mg
            vitaminB1: (estimatedGender === 'male' ? 1.2 : 1.1) * activityMultiplier, // mg
            vitaminB2: (estimatedGender === 'male' ? 1.3 : 1.1) * activityMultiplier, // mg
            vitaminB3: (estimatedGender === 'male' ? 16 : 14) * (isHighlyActive ? 1.1 : 1.0), // mg
            vitaminB6: (age > 50 ? (estimatedGender === 'male' ? 1.7 : 1.5) : 1.3) * (isHighlyActive ? 1.1 : 1.0), // mg
            vitaminB12: 2.4, // μg
            calcium: age > 50 ? 1200 : 1000, // mg
            magnesium: (estimatedGender === 'male' ? (age <= 30 ? 400 : 420) : (age <= 30 ? 310 : 320)) * (isHighlyActive ? 1.15 : 1.0), // mg
            phosphorus: 700, // mg
            potassium: 3500 * (isHighlyActive ? 1.2 : 1.0), // mg
            sodium: 2300, // mg (upper limit)
            iron: (estimatedGender === 'female' && age <= 50 ? 18 : 8) * (isHighlyActive ? 1.1 : 1.0), // mg
            zinc: (estimatedGender === 'male' ? 11 : 8) * (isHighlyActive ? 1.1 : 1.0), // mg
            selenium: 55, // μg
            copper: 0.9, // mg
            manganese: estimatedGender === 'male' ? 2.3 : 1.8, // mg
            iodine: 150, // μg
            chromium: estimatedGender === 'male' ? 35 : 25, // μg
            molybdenum: 45, // μg
            // Macronutrient Components
            sugar: null, // No specific RDA, monitoring only
            fiber: (estimatedGender === 'male' ? 38 : 25) * (age > 50 ? 0.8 : 1.0), // g (adjusted for age)
            saturatedFat: null, // No RDA, limit is <10% of calories
            cholesterol: 300, // mg (upper limit)
          };
        };
        
        const rda = calculateRDA();
        
        // Helper function to calculate adequacy percentage and status
        const getAdequacy = (actual: number, recommended: number) => {
          if (!actual || !recommended) return { percentage: 0, status: 'unknown', color: 'text-gray-500', description: 'No data' };
          
          const percentage = Math.round((actual / recommended) * 100);
          
          if (percentage < 50) {
            return { percentage, status: 'deficient', color: 'text-red-600 dark:text-red-400', description: 'Low' };
          } else if (percentage < 80) {
            return { percentage, status: 'low', color: 'text-orange-600 dark:text-orange-400', description: 'Below' };
          } else if (percentage <= 120) {
            return { percentage, status: 'adequate', color: 'text-green-600 dark:text-green-400', description: 'Good' };
          } else if (percentage <= 200) {
            return { percentage, status: 'high', color: 'text-blue-600 dark:text-blue-400', description: 'High' };
          } else {
            return { percentage, status: 'excessive', color: 'text-purple-600 dark:text-purple-400', description: 'Excess' };
          }
        };
        
        const formatDate = new Date(selectedDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });

        // Helper function to render complete nutrient with progress bar
        const renderNutrientWithProgress = (name: string, value: number, unit: string, adequacy: any) => {
          const progressPercent = Math.min(adequacy.percentage || 0, 100);
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>{name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{value}{unit}</span>
                  <span className={`text-xs px-1.5 py-0.5 ${adequacy.color} bg-gray-100 dark:bg-gray-700`}>
                    {adequacy.percentage > 0 ? `${adequacy.percentage}%` : adequacy.description}
                  </span>
                </div>
              </div>
              {adequacy.percentage > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
                  <div 
                    className={`h-1 transition-all duration-300 ${
                      adequacy.percentage < 50 ? 'bg-red-500' :
                      adequacy.percentage < 80 ? 'bg-orange-500' :
                      adequacy.percentage <= 120 ? 'bg-green-500' :
                      adequacy.percentage <= 200 ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        };
        
        return (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-1">
            <CardContent className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto hover:bg-accent/50 transition-colors collapsible-trigger"
                onClick={() => setShowMicronutrients(!showMicronutrients)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Daily Micronutrients ({formatDate})
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 chevron-rotate" data-state={showMicronutrients ? 'open' : 'closed'} />
              </Button>
              
              <div 
                className={`collapsible-content overflow-hidden transition-all duration-300 ease-in-out ${
                  showMicronutrients 
                    ? 'max-h-[2000px] opacity-100 animate-collapsible-down' 
                    : 'max-h-0 opacity-0 animate-collapsible-up'
                }`}
              >
                <div className="mt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                      Total from {micronutrientLogs.length} foods with vitamin data
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      {/* Fat-Soluble Vitamins */}
                      {(dailyTotals.vitaminA > 0 || dailyTotals.vitaminD > 0 || dailyTotals.vitaminE > 0 || dailyTotals.vitaminK > 0) && (
                        <div>
                          <h5 className="font-medium text-purple-600 dark:text-purple-400 mb-1.5">Fat-Soluble Vitamins</h5>
                          <div className="space-y-2">
                            {dailyTotals.vitaminA > 0 && renderNutrientWithProgress(
                              "Vitamin A", 
                              Math.round(dailyTotals.vitaminA * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.vitaminA, rda.vitaminA)
                            )}
                            {dailyTotals.vitaminD > 0 && renderNutrientWithProgress(
                              "Vitamin D", 
                              Math.round(dailyTotals.vitaminD * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.vitaminD, rda.vitaminD)
                            )}
                            {dailyTotals.vitaminE > 0 && renderNutrientWithProgress(
                              "Vitamin E", 
                              Math.round(dailyTotals.vitaminE * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminE, rda.vitaminE)
                            )}
                            {dailyTotals.vitaminK > 0 && renderNutrientWithProgress(
                              "Vitamin K", 
                              Math.round(dailyTotals.vitaminK * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.vitaminK, rda.vitaminK)
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Water-Soluble Vitamins */}
                      {(dailyTotals.vitaminC > 0 || dailyTotals.vitaminB1 > 0 || dailyTotals.vitaminB2 > 0 || dailyTotals.vitaminB3 > 0 || dailyTotals.vitaminB6 > 0 || dailyTotals.vitaminB12 > 0) && (
                        <div>
                          <h5 className="font-medium text-blue-600 dark:text-blue-400 mb-1.5">Water-Soluble Vitamins</h5>
                          <div className="space-y-2">
                            {dailyTotals.vitaminC > 0 && renderNutrientWithProgress(
                              "Vitamin C", 
                              Math.round(dailyTotals.vitaminC * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminC, rda.vitaminC)
                            )}
                            {dailyTotals.vitaminB1 > 0 && renderNutrientWithProgress(
                              "B1 (Thiamine)", 
                              Math.round(dailyTotals.vitaminB1 * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminB1, rda.vitaminB1)
                            )}
                            {dailyTotals.vitaminB2 > 0 && renderNutrientWithProgress(
                              "B2 (Riboflavin)", 
                              Math.round(dailyTotals.vitaminB2 * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminB2, rda.vitaminB2)
                            )}
                            {dailyTotals.vitaminB3 > 0 && renderNutrientWithProgress(
                              "B3 (Niacin)", 
                              Math.round(dailyTotals.vitaminB3 * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminB3, rda.vitaminB3)
                            )}
                            {dailyTotals.vitaminB6 > 0 && renderNutrientWithProgress(
                              "B6 (Pyridoxine)", 
                              Math.round(dailyTotals.vitaminB6 * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.vitaminB6, rda.vitaminB6)
                            )}
                            {dailyTotals.vitaminB12 > 0 && renderNutrientWithProgress(
                              "B12 (Cobalamin)", 
                              Math.round(dailyTotals.vitaminB12 * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.vitaminB12, rda.vitaminB12)
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Major Minerals */}
                      {(dailyTotals.calcium > 0 || dailyTotals.magnesium > 0 || dailyTotals.phosphorus > 0 || dailyTotals.potassium > 0 || dailyTotals.sodium > 0) && (
                        <div>
                          <h5 className="font-medium text-green-600 dark:text-green-400 mb-1.5">Major Minerals</h5>
                          <div className="space-y-2">
                            {dailyTotals.calcium > 0 && renderNutrientWithProgress(
                              "Calcium", 
                              Math.round(dailyTotals.calcium), 
                              "mg", 
                              getAdequacy(dailyTotals.calcium, rda.calcium)
                            )}
                            {dailyTotals.magnesium > 0 && renderNutrientWithProgress(
                              "Magnesium", 
                              Math.round(dailyTotals.magnesium), 
                              "mg", 
                              getAdequacy(dailyTotals.magnesium, rda.magnesium)
                            )}
                            {dailyTotals.phosphorus > 0 && renderNutrientWithProgress(
                              "Phosphorus", 
                              Math.round(dailyTotals.phosphorus), 
                              "mg", 
                              getAdequacy(dailyTotals.phosphorus, rda.phosphorus)
                            )}
                            {dailyTotals.potassium > 0 && renderNutrientWithProgress(
                              "Potassium", 
                              Math.round(dailyTotals.potassium), 
                              "mg", 
                              getAdequacy(dailyTotals.potassium, rda.potassium)
                            )}
                            {dailyTotals.sodium > 0 && (() => {
                              // For sodium, lower is better (it's an upper limit)
                              const percentage = Math.round((dailyTotals.sodium / rda.sodium) * 100);
                              const adequacy = percentage <= 100 ? 
                                { percentage, color: 'text-green-600 dark:text-green-400', description: 'Good' } :
                                percentage <= 150 ?
                                { percentage, color: 'text-orange-600 dark:text-orange-400', description: 'High' } :
                                { percentage, color: 'text-red-600 dark:text-red-400', description: 'Excess' };
                              return renderNutrientWithProgress("Sodium", Math.round(dailyTotals.sodium), "mg", adequacy);
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Trace Minerals */}
                      {(dailyTotals.iron > 0 || dailyTotals.zinc > 0 || dailyTotals.selenium > 0 || dailyTotals.copper > 0 || dailyTotals.manganese > 0 || dailyTotals.iodine > 0 || dailyTotals.chromium > 0 || dailyTotals.molybdenum > 0) && (
                        <div>
                          <h5 className="font-medium text-orange-600 dark:text-orange-400 mb-1.5">Trace Minerals</h5>
                          <div className="space-y-2">
                            {dailyTotals.iron > 0 && renderNutrientWithProgress(
                              "Iron", 
                              Math.round(dailyTotals.iron * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.iron, rda.iron)
                            )}
                            {dailyTotals.zinc > 0 && renderNutrientWithProgress(
                              "Zinc", 
                              Math.round(dailyTotals.zinc * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.zinc, rda.zinc)
                            )}
                            {dailyTotals.selenium > 0 && renderNutrientWithProgress(
                              "Selenium", 
                              Math.round(dailyTotals.selenium * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.selenium, rda.selenium)
                            )}
                            {dailyTotals.copper > 0 && renderNutrientWithProgress(
                              "Copper", 
                              Math.round(dailyTotals.copper * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.copper, rda.copper)
                            )}
                            {dailyTotals.manganese > 0 && renderNutrientWithProgress(
                              "Manganese", 
                              Math.round(dailyTotals.manganese * 10) / 10, 
                              "mg", 
                              getAdequacy(dailyTotals.manganese, rda.manganese)
                            )}
                            {dailyTotals.iodine > 0 && renderNutrientWithProgress(
                              "Iodine", 
                              Math.round(dailyTotals.iodine * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.iodine, rda.iodine)
                            )}
                            {dailyTotals.chromium > 0 && renderNutrientWithProgress(
                              "Chromium", 
                              Math.round(dailyTotals.chromium * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.chromium, rda.chromium)
                            )}
                            {dailyTotals.molybdenum > 0 && renderNutrientWithProgress(
                              "Molybdenum", 
                              Math.round(dailyTotals.molybdenum * 10) / 10, 
                              "μg", 
                              getAdequacy(dailyTotals.molybdenum, rda.molybdenum)
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Macronutrient Components */}
                      {(dailyTotals.sugar > 0 || dailyTotals.fiber > 0 || dailyTotals.saturatedFat > 0 || dailyTotals.cholesterol > 0) && (
                        <div>
                          <h5 className="font-medium text-green-600 dark:text-green-400 mb-1.5">Macronutrient Components</h5>
                          <div className="space-y-2">
                            {dailyTotals.sugar > 0 && renderNutrientWithProgress(
                              "Total Sugar", 
                              Math.round(dailyTotals.sugar * 10) / 10, 
                              "g", 
                              { percentage: 0, color: 'text-gray-600 dark:text-gray-400', description: 'Monitor' }
                            )}
                            {dailyTotals.fiber > 0 && renderNutrientWithProgress(
                              "Dietary Fiber", 
                              Math.round(dailyTotals.fiber * 10) / 10, 
                              "g", 
                              getAdequacy(dailyTotals.fiber, rda.fiber)
                            )}
                            {dailyTotals.saturatedFat > 0 && renderNutrientWithProgress(
                              "Saturated Fat", 
                              Math.round(dailyTotals.saturatedFat * 10) / 10, 
                              "g", 
                              { percentage: 0, color: 'text-gray-600 dark:text-gray-400', description: '<10% cals' }
                            )}
                            {dailyTotals.cholesterol > 0 && (() => {
                              // For cholesterol, lower is better (it's an upper limit)
                              const percentage = Math.round((dailyTotals.cholesterol / rda.cholesterol) * 100);
                              const adequacy = percentage <= 100 ? 
                                { percentage, color: 'text-green-600 dark:text-green-400', description: 'Good' } :
                                percentage <= 150 ?
                                { percentage, color: 'text-orange-600 dark:text-orange-400', description: 'High' } :
                                { percentage, color: 'text-red-600 dark:text-red-400', description: 'Excess' };
                              return renderNutrientWithProgress("Cholesterol", Math.round(dailyTotals.cholesterol), "mg", adequacy);
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* RDA Legend */}
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                        RDA Adequacy Guide
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-xs">
                        <div className="text-center">
                          <div className="w-3 h-3 bg-red-100 dark:bg-red-900 mx-auto mb-1"></div>
                          <span className="text-red-600 dark:text-red-400">Low</span>
                        </div>
                        <div className="text-center">
                          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900 mx-auto mb-1"></div>
                          <span className="text-orange-600 dark:text-orange-400">Below</span>
                        </div>
                        <div className="text-center">
                          <div className="w-3 h-3 bg-green-100 dark:bg-green-900 mx-auto mb-1"></div>
                          <span className="text-green-600 dark:text-green-400">Good</span>
                        </div>
                        <div className="text-center">
                          <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 mx-auto mb-1"></div>
                          <span className="text-blue-600 dark:text-blue-400">High</span>
                        </div>
                        <div className="text-center">
                          <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900 mx-auto mb-1"></div>
                          <span className="text-purple-600 dark:text-purple-400">Excess</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
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
                  className="text-xs h-6 px-2"
                >
                  {bulkMode ? "Done" : "Edit"}
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('Add Food button clicked - navigating to add-food page with date:', selectedDate);
                  setLocation(`/add-food?date=${selectedDate}`);
                }}
                className="text-xs h-6 px-2"
                style={{ backgroundColor: '#479bf5', color: '#030303' }}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          {/* Bulk Operations Controls */}
          {bulkMode && nutritionLogs && nutritionLogs.length > 0 && (
            <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
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
                  <Button 
                    variant="outline" 
                    className="flex-1 h-6 text-[10px]"
                    onClick={() => {
                      console.log('Bulk copy button clicked - setting operation but NOT executing until date is selected');
                      console.log('Selected logs:', selectedLogs);
                      setCopyOperation({
                        type: 'bulk',
                        data: selectedLogs,
                        sourceSection: undefined
                      });
                      // Trigger iOS date picker for bulk copy
                      if (setShowCopyToDatePicker) {
                        setShowCopyToDatePicker(true);
                      }
                    }}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    Copy to date
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-0">
            {mealTypes.map((mealType) => {
              const mealLogs = Array.isArray(nutritionLogs) ? nutritionLogs.filter((log: any) => log.mealType === mealType.key) : [];
              
              return (
                <div 
                  key={mealType.key}
                  data-meal-type={mealType.key}
                  className={`
                    border-b border-gray-200 dark:border-gray-700 last:border-b-0 overflow-hidden 
                    transition-all duration-300 ios-drag-item
                    ${dragOverTarget === mealType.key 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-2 ring-blue-300 ios-drag-active' 
                      : draggedItem && draggedItem.mealType !== mealType.key
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-300 opacity-90'
                      : 'bg-transparent'
                    }
                    ${isDraggingActive && dragOverTarget !== mealType.key 
                      ? 'opacity-80 scale-[0.99]' 
                      : ''
                    }
                  `}
                  style={{
                    transform: `translateZ(${dragOverTarget === mealType.key ? '5px' : '0'}) ${
                      dragOverTarget === mealType.key ? 'scale(1.01)' : 'scale(1)'
                    }`,
                    boxShadow: dragOverTarget === mealType.key 
                      ? '0 4px 15px rgba(37, 99, 235, 0.1)' 
                      : undefined
                  }}
                  onDragOver={(e) => handleDragOver(e, mealType.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mealType.key)}
                >
                  {/* Meal Header */}
                  <div className="flex items-center justify-between py-3 px-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-black dark:text-white text-[16px]">
                          {mealType.label}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({mealLogs.length})
                        </span>
                      </div>
                      {/* Colored Macro Totals */}
                      {mealLogs.length > 0 && (() => {
                        const totals = calculateMealTotals(mealType.key);
                        return (
                          <div className="text-xs font-medium flex items-center gap-3">
                            <span className="text-blue-500">
                              Cals: {Math.round(totals.calories)}
                            </span>
                            <span className="text-blue-600">
                              P: {Math.round(totals.protein)}
                            </span>
                            <span className="text-green-600">
                              C: {Math.round(totals.carbs)}
                            </span>
                            <span className="text-yellow-600">
                              F: {Math.round(totals.fat)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          onTouchStart={(e) => {
                            // Track touch start position for scroll detection
                            e.currentTarget.dataset.touchY = e.touches[0].clientY.toString();
                            e.currentTarget.dataset.scrollDetected = 'false';
                          }}
                          onTouchMove={(e) => {
                            // Detect scrolling movement
                            const startY = parseInt(e.currentTarget.dataset.touchY || '0');
                            const currentY = e.touches[0].clientY;
                            const deltaY = Math.abs(currentY - startY);
                            if (deltaY > 10) {
                              e.currentTarget.dataset.scrollDetected = 'true';
                            }
                          }}
                        >
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              // Prevent menu opening if scroll was detected
                              const scrollDetected = e.currentTarget.parentElement?.dataset.scrollDetected === 'true';
                              if (scrollDetected) {
                                e.preventDefault();
                                e.stopPropagation();
                                // Reset for next interaction
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.dataset.scrollDetected = 'false';
                                }
                              }
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setCopyOperation({
                              type: 'section',
                              data: mealType.key,
                              sourceSection: mealType.key
                            });
                            // Directly trigger iOS date picker for "copy from" date
                            if (setShowCopyFromDatePicker) {
                              setShowCopyFromDatePicker(true);
                            }
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
                              sourceSection: undefined // This is "copy to" operation
                            });
                            // Directly trigger iOS date picker for "copy to" date
                            if (setShowCopyToDatePicker) {
                              setShowCopyToDatePicker(true);
                            }
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Copy to date
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSaveAsMeal(mealType.key)}
                          disabled={mealLogs.length === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save as Meal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Food Items */}
                  <div className="pt-[0px] pb-[0px]">
                    {mealLogs.map((log: any, index: number) => {
                      const rpCategory = getRPCategory(log.category);
                      const isCurrentlyDragged = draggedItem && draggedItem.id === log.id;
                      const isDragTarget = dragOverTarget === mealType.key && dragOverIndex === index;
                      const shouldShift = isDraggingActive && dragOverTarget === mealType.key && !isCurrentlyDragged;
                      
                      return (
                        <div 
                          key={log.id}
                          draggable={bulkMode} // Enable drag only in edit mode
                          onDragStart={(e) => handleDragStart(e, log)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, mealType.key, index)}
                          onTouchStart={(e) => handleTouchStart(e, log)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{
                            transform: shouldShift ? 'translateY(4px)' : 'translateY(0)',
                            transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            touchAction: bulkMode ? 'none' : 'manipulation',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                          className="flex items-center gap-3 py-3 px-3 w-full max-w-full ios-touch-feedback ios-button touch-target hover:bg-gray-100 dark:hover:bg-gray-700 bg-gray-50 dark:bg-gray-800 mb-2 border border-gray-200 dark:border-gray-700"
                          onClick={() => bulkMode && toggleLogSelection(log.id)}
                        >
                          {/* Selection Checkbox (always shown in bulk mode) */}
                          <div className="flex-shrink-0">
                            {bulkMode && (
                              <Checkbox
                                checked={selectedLogs.includes(log.id)}
                                onCheckedChange={() => toggleLogSelection(log.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>
                          {/* Food Content */}
                          <div className="flex-1 min-w-0 pr-2">
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
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {log.quantity} {log.unit}, {log.calories} calories
                                </div>
                                {(() => {
                                  if (!log.micronutrients) return false;
                                  
                                  // Check for legacy flat structure micronutrients
                                  const hasLegacyMicronutrients = (
                                    log.micronutrients.vitaminA || log.micronutrients.vitaminD || log.micronutrients.vitaminE || log.micronutrients.vitaminK ||
                                    log.micronutrients.vitaminC || log.micronutrients.vitaminB1 || log.micronutrients.vitaminB2 || log.micronutrients.vitaminB3 ||
                                    log.micronutrients.vitaminB6 || log.micronutrients.vitaminB12 || log.micronutrients.calcium || log.micronutrients.magnesium ||
                                    log.micronutrients.phosphorus || log.micronutrients.potassium || log.micronutrients.sodium || log.micronutrients.iron ||
                                    log.micronutrients.zinc || log.micronutrients.selenium || log.micronutrients.copper || log.micronutrients.manganese ||
                                    log.micronutrients.iodine || log.micronutrients.chromium || log.micronutrients.molybdenum ||
                                    (log.micronutrients.sugar !== null && log.micronutrients.sugar !== undefined) || 
                                    (log.micronutrients.fiber !== null && log.micronutrients.fiber !== undefined) || 
                                    (log.micronutrients.saturatedFat !== null && log.micronutrients.saturatedFat !== undefined) || 
                                    (log.micronutrients.cholesterol !== null && log.micronutrients.cholesterol !== undefined) ||
                                    (log.micronutrients.monounsaturatedFat !== null && log.micronutrients.monounsaturatedFat !== undefined) ||
                                    (log.micronutrients.polyunsaturatedFat !== null && log.micronutrients.polyunsaturatedFat !== undefined)
                                  );
                                  
                                  // Check for new nested structure micronutrients
                                  const hasNestedMicronutrients = Object.values(log.micronutrients).some((category: any) => {
                                    if (typeof category === 'object' && category !== null) {
                                      return Object.values(category).some((value: any) => 
                                        value !== null && value !== undefined && value !== 0
                                      );
                                    }
                                    return false;
                                  });
                                  
                                  return hasLegacyMicronutrients || hasNestedMicronutrients;
                                })() && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                    Nutrients
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Conditional Right Side: Drag Handle (bulk mode) or Three-dots Menu (default) */}
                          <div className="flex-shrink-0 w-6 flex justify-center">
                            {bulkMode ? (
                              // Drag Handle (shown in edit/bulk mode)
                              (<div className="cursor-move">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>)
                            ) : (
                              // Three-dots Menu (shown in default mode)
                              (<DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div
                                    onTouchStart={(e) => {
                                      // Track touch start position for scroll detection
                                      e.currentTarget.dataset.touchY = e.touches[0].clientY.toString();
                                      e.currentTarget.dataset.scrollDetected = 'false';
                                    }}
                                    onTouchMove={(e) => {
                                      // Detect scrolling movement
                                      const startY = parseInt(e.currentTarget.dataset.touchY || '0');
                                      const currentY = e.touches[0].clientY;
                                      const deltaY = Math.abs(currentY - startY);
                                      if (deltaY > 10) {
                                        e.currentTarget.dataset.scrollDetected = 'true';
                                      }
                                    }}
                                  >
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 hover:bg-transparent"
                                      onClick={(e) => {
                                        // Prevent menu opening if scroll was detected
                                        const scrollDetected = e.currentTarget.parentElement?.dataset.scrollDetected === 'true';
                                        if (scrollDetected) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Reset for next interaction
                                          if (e.currentTarget.parentElement) {
                                            e.currentTarget.parentElement.dataset.scrollDetected = 'false';
                                          }
                                        }
                                      }}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log('Setting copy operation for individual item:', log.id, log.foodName);
                                      setCopyOperation({
                                        type: 'item',
                                        data: log,
                                        sourceSection: undefined
                                      });
                                      // Trigger iOS date picker for "copy to" date
                                      if (setShowCopyToDatePicker) {
                                        setShowCopyToDatePicker(true);
                                      }
                                    }}
                                  >
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Copy to date
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleEditFood(log)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Quantity
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteMutation.mutate(log.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>)
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Always show Add Food button */}
                    <div className="py-4">
                      <button 
                        onClick={() => {
                          setLocation(`/add-food?date=${selectedDate}&mealType=${mealType.key}`);
                        }}
                        className="w-full text-left py-3 px-0 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 pl-[10px] pr-[10px] pt-[5px] pb-[5px]"
                      >
                        {dragOverTarget === mealType.key ? (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-500  flex items-center justify-center">
                              <ArrowRight className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Drop here!</div>
                              <div className="text-xs opacity-75">Move to {mealType.label}</div>
                            </div>
                          </div>
                        ) : draggedItem && draggedItem.mealType !== mealType.key ? (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-500  flex items-center justify-center">
                              <Plus className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Drop zone</div>
                              <div className="text-xs opacity-75">Move {draggedItem.foodName} here</div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-blue-500 font-medium text-[16px]">ADD FOOD</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {mealLogs.length === 0 ? 'Swipe right to add meal' : 'Add more foods'}
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
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
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2  shadow-lg flex items-center gap-2 animate-pulse">
              <GripVertical className="w-4 h-4" />
              <span className="text-sm font-medium">
                Moving: {draggedItem.foodName}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
      {/* Nutrition Facts Dialog removed - now using standalone page */}
      {/* Edit Food Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Food Quantity</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              {/* Food Name */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {editingItem.foodName}
                </h3>
                <Badge className={`${getRPCategory(editingItem.category).color} text-xs mt-2`}>
                  {getRPCategory(editingItem.category).label}
                </Badge>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="edit-quantity" className="text-sm font-medium">
                  Quantity
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full"
                />
              </div>

              {/* Unit Input with Search */}
              <div className="space-y-2">
                <Label htmlFor="edit-unit" className="text-sm font-medium">
                  Unit
                </Label>
                <Input
                  id="edit-unit"
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  placeholder="Type unit (g, ml, oz, cups, pieces, etc.)"
                  className="w-full"
                  list="unit-suggestions"
                />
                <datalist id="unit-suggestions">
                  <option value="g" />
                  <option value="kg" />
                  <option value="ml" />
                  <option value="L" />
                  <option value="oz" />
                  <option value="lb" />
                  <option value="cups" />
                  <option value="tbsp" />
                  <option value="tsp" />
                  <option value="pieces" />
                  <option value="slices" />
                  <option value="serving" />
                  <option value="portion" />
                  <option value="container" />
                  <option value="packet" />
                  <option value="gummies" />
                  <option value="tablets" />
                  <option value="scoops" />
                </datalist>
                <div className="text-xs text-gray-500 mt-1">
                  Common units: g, ml, oz, cups, pieces, slices, serving
                </div>
              </div>

              {/* Current vs New Info */}
              <div className="bg-gray-50 dark:bg-gray-800  p-3 space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Current: {editingItem.quantity} {editingItem.unit}</div>
                  <div>New: {editQuantity} {editUnit}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  disabled={editQuantityMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={editQuantityMutation.isPending || !editQuantity || !editUnit}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  {editQuantityMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Save as Meal Dialog */}
      <Dialog open={showSaveMealDialog} onOpenChange={setShowSaveMealDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Meal Preview */}
            {saveMealSection && (
              <div className="bg-gray-50 dark:bg-gray-800  p-3">
                <div className="flex items-center gap-2 mb-2">
                  {getMealTypeIcon(saveMealSection)}
                  <span className="font-medium text-sm">{formatMealType(saveMealSection)} Section</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {nutritionLogs?.filter((log: any) => log.mealType === saveMealSection).length || 0} food items
                </div>
              </div>
            )}

            {/* Meal Name Input */}
            <div className="space-y-2">
              <Label htmlFor="meal-name" className="text-sm font-medium">
                Meal Name *
              </Label>
              <Input
                id="meal-name"
                value={saveMealName}
                onChange={(e) => setSaveMealName(e.target.value)}
                placeholder="Enter meal name"
                className="w-full"
              />
            </div>

            {/* Meal Description Input */}
            <div className="space-y-2">
              <Label htmlFor="meal-description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="meal-description" 
                value={saveMealDescription}
                onChange={(e) => setSaveMealDescription(e.target.value)}
                placeholder="Enter meal description"
                className="w-full"
              />
            </div>

            {/* Nutritional Summary */}
            {saveMealSection && nutritionLogs && (
              <div className="bg-gray-50 dark:bg-gray-800  p-3">
                <h4 className="font-medium text-black dark:text-white mb-2 text-sm">Nutritional Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-black dark:text-white">
                      {Math.round(nutritionLogs.filter((log: any) => log.mealType === saveMealSection)
                        .reduce((sum: number, log: any) => sum + parseFloat(log.calories || 0), 0))}
                    </div>
                    <div className="text-gray-500">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round(nutritionLogs.filter((log: any) => log.mealType === saveMealSection)
                        .reduce((sum: number, log: any) => sum + parseFloat(log.protein || 0), 0))}g
                    </div>
                    <div className="text-gray-500">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {Math.round(nutritionLogs.filter((log: any) => log.mealType === saveMealSection)
                        .reduce((sum: number, log: any) => sum + parseFloat(log.carbs || 0), 0))}g
                    </div>
                    <div className="text-gray-500">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {Math.round(nutritionLogs.filter((log: any) => log.mealType === saveMealSection)
                        .reduce((sum: number, log: any) => sum + parseFloat(log.fat || 0), 0))}g
                    </div>
                    <div className="text-gray-500">Fat</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSaveMealDialog(false)}
                disabled={saveMealMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSaveMeal}
                disabled={saveMealMutation.isPending || !saveMealName.trim()}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {saveMealMutation.isPending ? "Saving..." : "Save Meal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}