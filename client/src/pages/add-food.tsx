import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimezoneUtils } from "@shared/utils/timezone";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  ArrowLeft, 
  Home, 
  Search, 
  Brain, 
  ScanLine, 
  Utensils, 
  Loader2,
  Plus,
  Sparkles,
  History,
  Clock,
  Camera,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileText,
  UtensilsCrossed
} from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AddFoodProps {
  user: User;
}

interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  category?: string;
  mealSuitability?: string[];
}

export function AddFood({ user }: AddFoodProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Get the date from URL params or use current date
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const mealTypeParam = urlParams.get('mealType');
  
  const [selectedDate] = useState(dateParam || TimezoneUtils.getCurrentDate());
  // Simplified to AI-only mode - database search hidden
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState(mealTypeParam || 'breakfast');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedMealSuitability, setSelectedMealSuitability] = useState<string>();
  
  // State for dynamic AI recalculation
  const [baseAIResult, setBaseAIResult] = useState<any>(null);
  const [dynamicMacros, setDynamicMacros] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [savedMealsSearchQuery, setSavedMealsSearchQuery] = useState('');
  const [historyDisplayLimit, setHistoryDisplayLimit] = useState(10);
  
  // Image recognition states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageAnalysisType, setImageAnalysisType] = useState<'nutrition_label' | 'actual_food'>('nutrition_label');
  const [showImageCapture, setShowImageCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced portion input states
  const [portionWeight, setPortionWeight] = useState('');
  const [portionUnit, setPortionUnit] = useState('g');

  // Reset history display limit when search query changes
  useEffect(() => {
    setHistoryDisplayLimit(10);
  }, [historySearchQuery]);

  // Database search functionality removed - AI-only mode

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (data: { description?: string; image?: string; portionWeight?: string; portionUnit?: string }) => {
      console.log("AI Analysis starting with data:", data);
      
      const payload: any = {
        quantity: parseFloat(quantity),
        unit: unit,
        analysisType: imageAnalysisType // Pass the analysis type to backend
      };
      
      if (data.description) {
        payload.description = data.description;
      }
      
      if (data.image) {
        payload.image = data.image;
      }
      
      if (data.portionWeight && data.portionUnit) {
        payload.portionWeight = data.portionWeight;
        payload.portionUnit = data.portionUnit;
      }
      
      console.log("Sending payload to AI analysis:", payload);
      
      const response = await apiRequest("POST", "/api/nutrition/analyze", payload);
      const result = await response.json();
      
      console.log("AI Analysis result:", result);
      return result;
    },
    onError: (error: any) => {
      console.error("AI Analysis error:", error);
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Failed to analyze food with AI",
        variant: "destructive"
      });
    },
    onSuccess: (data: any) => {
      console.log("AI Analysis successful:", data);
      
      // Store the base AI result for volume calculations
      setBaseAIResult(data);
      setDynamicMacros(data);
      
      // Auto-fill unit from portion information if available
      if (portionUnit && portionUnit.trim()) {
        setUnit(portionUnit);
      }
      
      toast({
        title: "Success",
        description: "Food analyzed successfully with AI!"
      });
    }
  });

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nutrition/log", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/history'] });
      
      toast({
        title: "Success",
        description: "Food logged successfully!"
      });
      
      // Navigate back to nutrition page
      setLocation('/nutrition');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log food",
        variant: "destructive"
      });
    }
  });

  // Fetch user's food history (unique foods they've logged before)
  const { data: foodHistory = [] } = useQuery({
    queryKey: ['/api/nutrition/history'],
    queryFn: async () => {
      const response = await fetch('/api/nutrition/history', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch food history');
      return response.json();
    }
  });

  // Fetch user's saved meals
  const { data: savedMeals = [] } = useQuery({
    queryKey: ['/api/saved-meals'],
    queryFn: async () => {
      const response = await fetch('/api/saved-meals', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch saved meals');
      return response.json();
    }
  });

  // Database search handler removed - AI-only mode

  const handleAIAnalysis = () => {
    console.log("AI Analysis button clicked!");
    console.log("Food query:", foodQuery);
    console.log("Captured image:", capturedImage ? "Image present" : "No image");
    console.log("Portion weight:", portionWeight);
    console.log("Portion unit:", portionUnit);
    
    // Clear previous analysis results
    setBaseAIResult(null);
    setDynamicMacros(null);
    
    const hasDescription = foodQuery.trim();
    const hasImage = capturedImage;
    const hasPortion = portionWeight && portionUnit;
    
    if (!hasDescription && !hasImage) {
      console.log("No description or image provided");
      toast({
        title: "Missing Information",  
        description: `Please provide a food description or capture ${imageAnalysisType === 'nutrition_label' ? 'a nutrition label image' : 'a food photo'}`,
        variant: "destructive"
      });
      return;
    }
    
    console.log("Calling AI mutation...");
    aiAnalyzeMutation.mutate({
      description: hasDescription ? foodQuery : undefined,
      image: hasImage ? capturedImage : undefined,
      portionWeight: hasPortion ? portionWeight : undefined,
      portionUnit: hasPortion ? portionUnit : undefined
    });
  };

  // Dynamic volume-based macro recalculation function
  const recalculateMacrosFromVolume = React.useCallback(() => {
    if (!baseAIResult || !quantity || parseFloat(quantity) <= 0) {
      setDynamicMacros(baseAIResult);
      return;
    }

    const newQuantity = parseFloat(quantity);
    const baseQuantity = parseFloat(portionWeight) || 1;
    const multiplier = newQuantity / baseQuantity;

    const recalculatedMacros = {
      ...baseAIResult,
      calories: baseAIResult.calories * multiplier,
      protein: baseAIResult.protein * multiplier,
      carbs: baseAIResult.carbs * multiplier,
      fat: baseAIResult.fat * multiplier,
      servingDetails: `${quantity} ${unit} (adjusted from original analysis)`,
      assumptions: baseAIResult.assumptions ? 
        `${baseAIResult.assumptions} • Volume adjusted from ${portionWeight || '1'} to ${quantity} ${unit}` :
        `Volume adjusted from original analysis to ${quantity} ${unit}`
    };

    setDynamicMacros(recalculatedMacros);
  }, [baseAIResult, quantity, unit, portionWeight]);

  // Auto-sync portion values to quantity/unit after AI analysis
  React.useEffect(() => {
    if (aiAnalyzeMutation.data && portionWeight && portionUnit) {
      setQuantity(portionWeight);
      setUnit(portionUnit === 'g' ? 'gram' : 
            portionUnit === 'ml' ? 'milliliter' :
            portionUnit === 'oz' ? 'ounce' :
            portionUnit === 'cup' || portionUnit === 'cups' ? 'cup' :
            portionUnit === 'piece' || portionUnit === 'pieces' ? 'piece' :
            portionUnit); // Use custom unit as-is for non-standard units
    }
  }, [aiAnalyzeMutation.data, portionWeight, portionUnit]);

  // Recalculate macros when quantity or unit changes
  React.useEffect(() => {
    if (baseAIResult) {
      recalculateMacrosFromVolume();
    }
  }, [quantity, unit, recalculateMacrosFromVolume]);

  // Dynamic calculations managed for AI-only mode

  // Image capture functions
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCapturedImage(base64);
      setShowImageCapture(false);
    };
    reader.readAsDataURL(file);
  };

  const clearCapturedImage = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBarcodeSuccess = (foodData: any) => {
    setSelectedFood({
      name: foodData.name,
      calories: foodData.calories,
      protein: foodData.protein,
      carbs: foodData.carbs,
      fat: foodData.fat,
      servingSize: foodData.serving_size,
      category: foodData.category,
      mealSuitability: foodData.mealSuitability
    });
    setShowBarcodeScanner(false);
    setSearchMode('search');
  };

  const handleQuickAddFromHistory = (historyItem: any) => {
    const nutritionData = {
      date: selectedDate,
      foodName: historyItem.foodName,
      quantity: historyItem.quantity || 1,
      unit: historyItem.unit || 'serving',
      calories: historyItem.calories,
      protein: historyItem.protein,
      carbs: historyItem.carbs,
      fat: historyItem.fat,
      mealType: mealType,
      category: historyItem.category,
      mealSuitability: historyItem.mealSuitability
    };

    logMutation.mutate(nutritionData);
  };

  // Add saved meal mutation
  const addSavedMealMutation = useMutation({
    mutationFn: async (meal: any) => {
      const foodItems = typeof meal.foodItems === 'string' ? JSON.parse(meal.foodItems) : meal.foodItems;
      const promises = foodItems.map((item: any) => {
        const logData = {
          date: selectedDate,
          foodName: item.foodName,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          calories: parseFloat(item.calories),
          protein: parseFloat(item.protein),
          carbs: parseFloat(item.carbs),
          fat: parseFloat(item.fat),
          mealType: mealType,
          category: item.category || null,
          mealSuitability: item.mealSuitability || []
        };
        return apiRequest("POST", "/api/nutrition/log", logData);
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Success",
        description: "Saved meal added to your food log"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add saved meal",
        variant: "destructive"
      });
    }
  });

  // Delete saved meal mutation
  const deleteSavedMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      return apiRequest("DELETE", `/api/saved-meals/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-meals'] });
      toast({
        title: "Success",
        description: "Saved meal deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete saved meal",
        variant: "destructive"
      });
    }
  });

  const handleLogFood = () => {
    let nutritionData;
    
    if (dynamicMacros || aiAnalyzeMutation.data) {
      // Use dynamic macros if available (already volume-adjusted), otherwise fall back to original AI result
      nutritionData = dynamicMacros || aiAnalyzeMutation.data;
    } else if (selectedFood) {
      const multiplier = parseFloat(quantity);
      nutritionData = {
        calories: selectedFood.calories * multiplier,
        protein: selectedFood.protein * multiplier,
        carbs: selectedFood.carbs * multiplier,
        fat: selectedFood.fat * multiplier
      };
    } else {
      return;
    }

    const logData = {
      date: selectedDate,
      foodName: foodQuery || selectedFood?.name || foodQuery,
      quantity: quantity,
      unit: unit,
      calories: nutritionData.calories.toString(),
      protein: nutritionData.protein.toString(),
      carbs: nutritionData.carbs.toString(),
      fat: nutritionData.fat.toString(),
      mealType: mealType
    };

    logMutation.mutate(logData);
  };

  const isLoading = aiAnalyzeMutation.isPending || logMutation.isPending || addSavedMealMutation.isPending || deleteSavedMealMutation.isPending;
  const canLog = (aiAnalyzeMutation.data || selectedFood) && mealType.trim() !== '';
  
  // Filter food history based on search query with pagination
  const filteredFoodHistory = Array.isArray(foodHistory) ? foodHistory.filter((item: any) => 
    item.foodName.toLowerCase().includes(historySearchQuery.toLowerCase())
  ) : [];
  
  // Apply display limit for pagination
  const displayedFoodHistory = filteredFoodHistory.slice(0, historyDisplayLimit);
  const hasMoreFoodHistory = filteredFoodHistory.length > historyDisplayLimit;

  // Filter saved meals based on search query
  const filteredSavedMeals = Array.isArray(savedMeals) ? savedMeals.filter((meal: any) => 
    meal.name.toLowerCase().includes(savedMealsSearchQuery.toLowerCase())
  ).slice(0, 10) : []; // Limit to 10 items for better performance

  const categories = [
    { value: "protein", label: "Protein Sources", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    { value: "carbs", label: "Carb Sources", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    { value: "fat", label: "Fat Sources", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    { value: "mixed", label: "Mixed Sources", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" }
  ];

  const mealSuitabilityOptions = [
    { value: "pre_workout", label: "Pre-workout", icon: "🏋️" },
    { value: "post_workout", label: "Post-workout", icon: "💪" },
    { value: "regular", label: "Regular meal", icon: "🍽️" },
    { value: "snack", label: "Snack", icon: "🥨" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container">
      <div className="container mx-auto p-2 space-y-3 max-w-2xl pl-[0px] pr-[0px]">
        {/* Ultra-Compact Header - Consistent with other pages */}
        <div className="h-11 flex items-center justify-between px-1 ios-smooth-transform">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/nutrition')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Plus className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground truncate">Add Food</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content Card */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4 space-y-4 pt-[16px] pb-[16px] pl-[2px] pr-[2px] ml-[0px] mr-[0px]">
            {/* AI Analysis Mode - Database Search Hidden */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  AI-Powered Food Analysis
                </Label>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Analyze nutrition labels or food photos with advanced AI
              </p>
            </div>

            {/* Search Input with Action Buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Describe your food (required) *
              </Label>
              <div className="flex gap-2">
                <Input
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="Enter food name (e.g., Large chicken breast with vegetables)"
                  className="flex-1 h-9 text-sm ios-touch-feedback"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAIAnalysis();
                    }
                  }}
                />
                <Button
                  onClick={handleTakePhoto}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 ios-button touch-target"
                  title={`Take photo of ${imageAnalysisType === 'nutrition_label' ? 'nutrition label' : 'actual food'}`}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleUploadImage}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 ios-button touch-target"
                  title={`Upload image of ${imageAnalysisType === 'nutrition_label' ? 'nutrition label' : 'actual food'}`}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Analysis Type Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Photo Analysis Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setImageAnalysisType('nutrition_label')}
                  variant={imageAnalysisType === 'nutrition_label' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs ios-button touch-target"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Nutrition Label
                </Button>
                <Button
                  onClick={() => setImageAnalysisType('actual_food')}
                  variant={imageAnalysisType === 'actual_food' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs ios-button touch-target"
                >
                  <UtensilsCrossed className="w-3 h-3 mr-1" />
                  Actual Food
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {imageAnalysisType === 'nutrition_label' 
                  ? 'Analyze nutrition facts from product labels for precise macro data'
                  : 'Analyze actual food portions to estimate nutrition content'
                }
              </p>
            </div>

            {/* Hidden file input for image capture/upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                    <ImageIcon className="w-3 h-3 inline mr-1" />
                    {imageAnalysisType === 'nutrition_label' ? 'Nutrition Label Captured' : 'Food Photo Captured'}
                  </Label>
                  <Button
                    onClick={clearCapturedImage}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ios-button"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="relative w-full max-w-xs mx-auto">
                  <img
                    src={capturedImage}
                    alt={imageAnalysisType === 'nutrition_label' ? 'Captured nutrition label' : 'Captured food photo'}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            )}

            {/* Enhanced Portion Input */}
            <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Label className="text-xs font-medium text-blue-800 dark:text-blue-200">
                Portion Information (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-blue-700 dark:text-blue-300">Weight/Volume</Label>
                  <Input
                    value={portionWeight}
                    onChange={(e) => setPortionWeight(e.target.value)}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="100"
                    className="h-8 text-sm ios-touch-feedback"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-700 dark:text-blue-300">Unit</Label>
                  <Input
                    value={portionUnit}
                    onChange={(e) => setPortionUnit(e.target.value)}
                    type="text"
                    placeholder="g, ml, oz, cups, etc."
                    className="h-8 text-sm ios-touch-feedback"
                  />
                </div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Enter any weight/volume unit (e.g., g, kg, ml, L, oz, cups, tbsp, tsp, pieces, slices)
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleAIAnalysis}
              disabled={!foodQuery.trim() || isLoading}
              className="w-full h-9 ios-button touch-target"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Analyze with AI
            </Button>

            {/* Recent Foods Section - Moved to replace Database Search */}
            {Array.isArray(foodHistory) && foodHistory.length > 0 && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Recent Foods</Label>
                </div>
                
                {/* History Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <Input
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search your food history..."
                    className="h-8 pl-7 text-xs ios-touch-feedback"
                  />
                </div>

                {/* History Items */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {displayedFoodHistory.map((item: any, index: number) => (
                    <div
                      key={`${item.foodName}-${index}`}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.foodName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(item.calories)}cal • {Math.round(item.protein)}g protein • {item.quantity} {item.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleQuickAddFromHistory(item)}
                        disabled={isLoading}
                        size="sm"
                        className="h-7 w-7 p-0 ml-2 ios-button touch-target flex-shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {filteredFoodHistory.length === 0 && historySearchQuery && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-xs">No matching foods found in your history</p>
                    </div>
                  )}
                </div>
                
                {/* Load More Link */}
                {hasMoreFoodHistory && !historySearchQuery && (
                  <div className="text-center">
                    <span
                      onClick={() => setHistoryDisplayLimit(prev => prev + 10)}
                      className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors touch-target"
                    >
                      Load More
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Saved Meals Section - Moved to replace Database Search */}
            {Array.isArray(savedMeals) && savedMeals.length > 0 && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Saved Meals</Label>
                </div>
                
                {/* Saved Meals Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <Input
                    value={savedMealsSearchQuery}
                    onChange={(e) => setSavedMealsSearchQuery(e.target.value)}
                    placeholder="Search your saved meals..."
                    className="h-8 pl-7 text-xs ios-touch-feedback"
                  />
                </div>

                {/* Saved Meals Items */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredSavedMeals.map((meal: any) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {meal.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(parseFloat(meal.totalCalories))}cal • {Math.round(parseFloat(meal.totalProtein))}g protein
                              {meal.description && ` • ${meal.description}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          onClick={() => addSavedMealMutation.mutate(meal)}
                          disabled={addSavedMealMutation.isPending}
                          size="sm"
                          className="h-7 w-7 p-0 ios-button touch-target flex-shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteSavedMealMutation.mutate(meal.id)}
                          disabled={deleteSavedMealMutation.isPending}
                          size="sm"
                          variant="destructive"
                          className="h-7 w-7 p-0 ios-button touch-target flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredSavedMeals.length === 0 && savedMealsSearchQuery && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-xs">No matching saved meals found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Analysis Results - Dynamic Volume-Based Display */}
            {dynamicMacros && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    AI Analysis Result {quantity !== (portionWeight || '1') && '(Volume Adjusted)'}
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Calories</p>
                    <p className="font-bold">{Math.round(dynamicMacros.calories)}</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Protein</p>
                    <p className="font-bold text-blue-600">{Math.round(dynamicMacros.protein)}g</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Carbs</p>
                    <p className="font-bold text-orange-600">{Math.round(dynamicMacros.carbs)}g</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Fat</p>
                    <p className="font-bold text-green-600">{Math.round(dynamicMacros.fat)}g</p>
                  </div>
                </div>
                {dynamicMacros.servingDetails && (
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Serving Details:</p>
                    <p>{dynamicMacros.servingDetails}</p>
                  </div>
                )}
                {dynamicMacros.assumptions && (
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Assumptions:</p>
                    <p>{dynamicMacros.assumptions}</p>
                  </div>
                )}
                {quantity !== (portionWeight || '1') && (
                  <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 rounded">
                    <p className="font-medium">✓ Dynamic Calculation Applied</p>
                    <p>Macros automatically updated based on your volume adjustment</p>
                  </div>
                )}
              </div>
            )}





            {/* Quantity and Meal Selection */}
            {(selectedFood || aiAnalyzeMutation.data) && (
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quantity</Label>
                    <Input
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="h-8 text-sm ios-touch-feedback"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Unit</Label>
                    <Input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="g, ml, oz, cups, pieces, etc."
                      className="h-8 text-sm ios-touch-feedback"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Meal Type</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setLocation('/nutrition')}
                className="flex-1 h-9 ios-button touch-target"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={!canLog || isLoading}
                className="flex-1 h-9 ios-button touch-target"
              >
                {logMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Utensils className="w-4 h-4 mr-2" />
                )}
                Log Food
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Scanner */}
        <BarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScanSuccess={handleBarcodeSuccess}
        />
      </div>
    </div>
  );
}