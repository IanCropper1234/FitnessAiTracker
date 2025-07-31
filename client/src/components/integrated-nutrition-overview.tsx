import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  CheckSquare,
  Edit,
  Save
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
  const { toast } = useToast();
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


  // Effect to handle copy operations when external date pickers close with a date
  useEffect(() => {
    if (copyOperation) {
      if (copyOperation.type === 'section') {
        if (externalCopyFromDate && copyOperation.sourceSection) {
          // Handle "copy from" date operation - need to fetch logs from externalCopyFromDate and copy to current date
          // This requires a different approach - we need to copy FROM a different date
          handleCopyFromDate(copyOperation.data, externalCopyFromDate, selectedDate);
          setCopyOperation(null);
        } else if (externalCopyToDate && !copyOperation.sourceSection) {
          // Handle "copy to" date operation - copy FROM current date TO the selected date
          handleCopySection(copyOperation.data, externalCopyToDate);
          setCopyOperation(null);
        }
      } else if (copyOperation.type === 'item' && externalCopyToDate) {
        // Handle individual food item copy to date
        handleCopyFoodToDate(copyOperation.data, externalCopyToDate);
        setCopyOperation(null);
      } else if (copyOperation.type === 'bulk' && externalCopyToDate) {
        // Handle bulk copy to date
        handleBulkCopyToDate(copyOperation.data, externalCopyToDate);
        setCopyOperation(null);
      }
    }
  }, [externalCopyFromDate, externalCopyToDate, copyOperation, selectedDate]);
  
  // Nutrition facts dialog state
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [selectedNutritionItem, setSelectedNutritionItem] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  
  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  
  // Save as meal dialog state
  const [showSaveMealDialog, setShowSaveMealDialog] = useState(false);
  const [saveMealName, setSaveMealName] = useState('');
  const [saveMealDescription, setSaveMealDescription] = useState('');
  const [saveMealSection, setSaveMealSection] = useState('');

  // Fetch nutrition summary for the selected date
  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch nutrition summary');
      return response.json();
    }
  });

  // Fetch diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals'],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`, {
        credentials: 'include'
      });
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

  // Fetch nutrition logs for the selected date
  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch nutrition logs');
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("DELETE", `/api/nutrition/log/${logId}`);
    },
    onSuccess: () => {
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
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
      return await apiRequest("PUT", `/api/nutrition/logs/${logId}/meal-type`, { mealType: newMealType });
    },
    onSuccess: () => {
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move food item",
        variant: "destructive"
      });
    }
  });

  const copyFoodMutation = useMutation({
    mutationFn: async (foodData: any) => {
      return await apiRequest("POST", "/api/nutrition/log", foodData);
    },
    onSuccess: () => {
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
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
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
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
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
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

  const editQuantityMutation = useMutation({
    mutationFn: async ({ logId, quantity, unit }: { logId: number; quantity: number; unit: string }) => {
      return await apiRequest("PUT", `/api/nutrition/log/${logId}`, { quantity, unit });
    },
    onSuccess: () => {
      // Invalidate with correct query keys to match the component's queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      setShowEditDialog(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Food quantity and unit updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update food item",
        variant: "destructive"
      });
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
      toast({
        title: "Success",
        description: "Meal saved successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal",
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
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive"
      });
      return;
    }

    editQuantityMutation.mutate({
      logId: editingItem.id,
      quantity,
      unit: editUnit
    });
  };

  const handleSaveAsMeal = (mealSection: string) => {
    const sectionLogs = nutritionLogs?.filter((log: any) => log.mealType === mealSection) || [];
    
    if (sectionLogs.length === 0) {
      toast({
        title: "No Foods Found",
        description: "This meal section is empty. Add some foods first.",
        variant: "destructive"
      });
      return;
    }

    setSaveMealSection(mealSection);
    setSaveMealName(`${formatMealType(mealSection)} - ${new Date().toLocaleDateString()}`);
    setSaveMealDescription(`Saved from ${formatMealType(mealSection)} on ${new Date(selectedDate).toLocaleDateString()}`);
    setShowSaveMealDialog(true);
  };

  const handleConfirmSaveMeal = () => {
    if (!saveMealName.trim()) {
      toast({
        title: "Meal Name Required",
        description: "Please enter a name for this meal",
        variant: "destructive"
      });
      return;
    }

    const sectionLogs = nutritionLogs?.filter((log: any) => log.mealType === saveMealSection) || [];
    
    if (sectionLogs.length === 0) {
      toast({
        title: "No Foods Found",
        description: "This meal section is empty",
        variant: "destructive"
      });
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
      mealSuitability: log.mealSuitability || []
    }));

    saveMealMutation.mutate({
      name: saveMealName.trim(),
      description: saveMealDescription.trim(),
      foodItems
    });
  };

  const handleDragStart = (e: React.DragEvent, log: any) => {
    console.log('Drag start triggered for:', log.foodName, 'from meal type:', log.mealType);
    if (!e.dataTransfer || !log || bulkMode) return;
    
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
    console.log('Calling updateMealTypeMutation with:', { logId: draggedItem.id, newMealType: targetMealType });
    updateMealTypeMutation.mutate({
      logId: draggedItem.id,
      newMealType: targetMealType
    }, {
      onSuccess: () => {
        console.log('Move successful');
        toast({
          title: "Food Moved",
          description: `${draggedItem.foodName} moved to ${formatMealType(targetMealType)}`,
        });
      },
      onError: (error: any) => {
        console.error('Move failed:', error);
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
    if (bulkMode) return;
    
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
      if (timeDiff >= 300 && !touchDragState.hasMovedThreshold) {
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
    if (bulkMode) return;
    
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
    
    if (touchDragState.isDragging && draggedItem) {
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
    if (bulkMode) return;
    
    if (touchDragState.isDragging && draggedItem && dragOverTarget) {
      // Perform the drop operation
      console.log('Touch drop - moving', draggedItem.foodName, 'to', dragOverTarget);
      
      if (draggedItem.mealType !== dragOverTarget) {
        updateMealTypeMutation.mutate({
          logId: draggedItem.id,
          newMealType: dragOverTarget
        }, {
          onSuccess: () => {
            toast({
              title: "Food Moved",
              description: `${draggedItem.foodName} moved to ${formatMealType(dragOverTarget)}`,
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
      }
    }
    
    // Reset all drag state
    handleDragEnd();
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

  const handleCopyFoodToDate = (log: any, targetDate: string) => {
    const { id, createdAt, ...foodData } = log;
    const newFoodData = {
      ...foodData,
      userId,
      date: targetDate,
      mealType: log.mealType // Keep same meal type when copying to date
    };
    copyFoodMutation.mutate(newFoodData);
    
    toast({
      title: "Food Copied",
      description: `${log.foodName} copied to ${new Date(targetDate).toLocaleDateString()}`,
    });
  };

  const handleBulkCopyToDate = (selectedLogIds: number[], targetDate: string) => {
    const logsToCreate = nutritionLogs?.filter((log: any) => selectedLogIds.includes(log.id)) || [];
    
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
    
    toast({
      title: "Foods Copied",
      description: `${logsToCreate.length} food items copied to ${new Date(targetDate).toLocaleDateString()}`,
    });
    
    // Clear bulk selection after copy
    setSelectedLogs([]);
    setBulkMode(false);
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
      
      toast({
        title: "Meal Copied",
        description: `${formatMealType(mealType)} copied from ${new Date(sourceDate).toLocaleDateString()}`,
      });
    } catch (error) {
      console.error('Copy from date failed:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy meal from selected date",
        variant: "destructive"
      });
    }
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
    <div className="space-y-3">
      
      {/* Macro Summary Cards - iOS Optimized Dark Style */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Calories Card */}
        <Card className="bg-gray-900 dark:bg-gray-800 border-blue-500 border-2 shadow-lg nutrition-card-ios">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-blue-400 mb-1">
                Calories
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(nutritionSummary?.totalCalories || 0)}
              </div>
              <div className="text-xs text-gray-300 mb-2">
                of {Math.round(getCurrentTargetCalories())}
              </div>
              {dietGoals && (
                <div className="text-xs font-medium text-blue-300 mb-2">
                  Left: {Math.max(0, Math.round(getCurrentTargetCalories()) - (nutritionSummary?.totalCalories || 0))}
                </div>
              )}
              <div className="nutrition-progress-bar">
                <div 
                  className="nutrition-progress-fill bg-blue-500"
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary?.totalCalories || 0) / getCurrentTargetCalories() * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protein Card */}
        <Card className="bg-gray-900 dark:bg-gray-800 border-green-500 border-2 shadow-lg nutrition-card-ios">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-green-400 mb-1">
                Protein (g)
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(nutritionSummary?.totalProtein || 0)}
              </div>
              <div className="text-xs text-gray-300 mb-2">
                of {Math.round(getCurrentTargetProtein())}g
              </div>
              {dietGoals && (
                <div className="text-xs font-medium text-green-300 mb-2">
                  Left: {Math.round(Math.max(0, getCurrentTargetProtein() - (nutritionSummary?.totalProtein || 0)))}g
                </div>
              )}
              <div className="nutrition-progress-bar">
                <div 
                  className="nutrition-progress-fill bg-green-500"
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary?.totalProtein || 0) / getCurrentTargetProtein() * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carbs Card */}
        <Card className="bg-gray-900 dark:bg-gray-800 border-orange-500 border-2 shadow-lg nutrition-card-ios">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-orange-400 mb-1">
                Carbs (g)
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(nutritionSummary?.totalCarbs || 0)}
              </div>
              <div className="text-xs text-gray-300 mb-2">
                of {Math.round(getCurrentTargetCarbs())}g
              </div>
              {dietGoals && (
                <div className="text-xs font-medium text-orange-300 mb-2">
                  Left: {Math.round(Math.max(0, getCurrentTargetCarbs() - (nutritionSummary?.totalCarbs || 0)))}g
                </div>
              )}
              <div className="nutrition-progress-bar">
                <div 
                  className="nutrition-progress-fill bg-orange-500"
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary?.totalCarbs || 0) / getCurrentTargetCarbs() * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fat Card */}
        <Card className="bg-gray-900 dark:bg-gray-800 border-purple-500 border-2 shadow-lg nutrition-card-ios">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-purple-400 mb-1">
                Fat (g)
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(nutritionSummary?.totalFat || 0)}
              </div>
              <div className="text-xs text-gray-300 mb-2">
                of {Math.round(getCurrentTargetFat())}g
              </div>
              {dietGoals && (
                <div className="text-xs font-medium text-purple-300 mb-2">
                  Left: {Math.round(Math.max(0, getCurrentTargetFat() - (nutritionSummary?.totalFat || 0)))}g
                </div>
              )}
              <div className="nutrition-progress-bar">
                <div 
                  className="nutrition-progress-fill bg-purple-500"
                  style={{ 
                    width: `${Math.min(100, (nutritionSummary?.totalFat || 0) / getCurrentTargetFat() * 100)}%` 
                  }}
                />
              </div>
            </div>
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
                  <CheckSquare className="w-3 h-3" />
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('Add Food button clicked - navigating to add-food page with date:', selectedDate);
                  setLocation(`/add-food?date=${selectedDate}`);
                }}
                className="text-xs h-6 px-1.5"
                style={{ backgroundColor: '#479bf5', color: '#030303' }}
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
                  <Button 
                    variant="outline" 
                    className="flex-1 h-6 text-[10px]"
                    onClick={() => {
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
              const mealLogs = nutritionLogs?.filter((log: any) => log.mealType === mealType.key) || [];
              
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
                  <div className="pb-3">
                    {mealLogs.map((log: any, index: number) => {
                      const rpCategory = getRPCategory(log.category);
                      const isCurrentlyDragged = draggedItem && draggedItem.id === log.id;
                      const isDragTarget = dragOverTarget === mealType.key && dragOverIndex === index;
                      const shouldShift = isDraggingActive && dragOverTarget === mealType.key && !isCurrentlyDragged;
                      
                      return (
                        <div 
                          key={log.id}
                          draggable={!bulkMode}
                          onDragStart={(e) => !bulkMode && handleDragStart(e, log)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => !bulkMode && handleDragOver(e, mealType.key, index)}
                          onTouchStart={(e) => handleTouchStart(e, log)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{
                            transform: shouldShift ? 'translateY(4px)' : 'translateY(0)',
                            transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            touchAction: 'none',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                          className={`
                            flex items-center gap-3 py-2 px-0 w-full max-w-full
                            ios-touch-feedback ios-button touch-target
                            ${isCurrentlyDragged
                              ? 'opacity-30 scale-95 bg-blue-50 dark:bg-blue-900/20 shadow-lg z-10' 
                              : isDragTarget
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-400 border-2 border-dashed transform translate-y-1'
                              : bulkMode 
                              ? selectedLogs.includes(log.id) 
                                ? 'ring-2 ring-blue-500 bg-white dark:bg-gray-900 transform scale-[1.02]' 
                                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' 
                              : 'cursor-move hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98]'
                            }
                          `}
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
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {log.quantity} {log.unit}, {log.calories} calories
                              </div>
                            </div>
                          </div>
                          
                          {/* Three-dot menu */}
                          <div className="flex-shrink-0 w-6 flex justify-center">
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
                            </DropdownMenu>
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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
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