import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimezoneUtils } from "@shared/utils/timezone";
import NutrientDetailsModal from "@/components/NutrientDetailsModal";
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
  const [foodName, setFoodName] = useState(''); // New: Food name input
  const [foodQuery, setFoodQuery] = useState(''); // Description input
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  // Smart meal type detection based on current time if no parameter provided
  const getSmartMealType = () => {
    if (mealTypeParam) return mealTypeParam;
    
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack'; // Late night or early morning
  };
  
  const [mealType, setMealType] = useState(() => {
    // Try to get from localStorage for persistence, fallback to smart detection
    return localStorage.getItem('lastSelectedMealType') || getSmartMealType();
  });
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedMealSuitability, setSelectedMealSuitability] = useState<string>();
  
  // State for dynamic AI recalculation
  const [baseAIResult, setBaseAIResult] = useState<any>(null);
  const [dynamicMacros, setDynamicMacros] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [savedMealsSearchQuery, setSavedMealsSearchQuery] = useState('');
  const [historyDisplayLimit, setHistoryDisplayLimit] = useState(10);
  const [savedMealsDisplayLimit, setSavedMealsDisplayLimit] = useState(10);
  
  // Image recognition states - Enhanced for multiple images
  const [capturedImages, setCapturedImages] = useState<string[]>([]); // Multiple images
  const [imageAnalysisType, setImageAnalysisType] = useState<'nutrition_label' | 'actual_food' | ''>('');
  const [showImageCapture, setShowImageCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced portion input states
  const [portionWeight, setPortionWeight] = useState('');
  const [portionUnit, setPortionUnit] = useState('g');
  
  // Nutrient details modal states
  const [showNutrientModal, setShowNutrientModal] = useState(false);
  const [selectedItemForNutrients, setSelectedItemForNutrients] = useState<any>(null);

  // Reset history display limit when search query changes
  useEffect(() => {
    setHistoryDisplayLimit(10);
  }, [historySearchQuery]);

  // Database search functionality removed - AI-only mode

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (data: { foodName?: string; description?: string; images?: string[]; portionWeight?: string; portionUnit?: string }) => {
      console.log("AI Analysis starting with data:", data);
      
      const payload: any = {
        quantity: parseFloat(quantity),
        unit: unit,
        analysisType: imageAnalysisType // Pass the analysis type to backend
      };
      
      if (data.foodName) {
        payload.foodName = data.foodName;
      }

      if (data.description) {
        payload.description = data.description;
      }
      
      if (data.images && data.images.length > 0) {
        payload.images = data.images;
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
      console.log("AI serving details:", data.servingDetails);
      
      // Store the base AI result for volume calculations
      setBaseAIResult(data);
      setDynamicMacros(data);
      
      // Use AI's standardized portion information instead of hardcoded values
      if (data.portionWeight && data.portionUnit) {
        console.log("Using AI standardized portion:", data.portionWeight, data.portionUnit);
        setPortionWeight(data.portionWeight.toString());
        setPortionUnit(data.portionUnit);
        setQuantity(data.portionWeight.toString());
        setUnit(data.portionUnit);
      } else {
        // If AI didn't provide specific portion info, keep 1 serving as baseline
        setQuantity('1');
        setUnit('serving');
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
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/history', user.id] });
      
      toast({
        title: "Success",
        description: "Food logged successfully!"
      });
      
      // Clear form after successful logging
      setSelectedFood(null);
      setFoodQuery('');
      setQuantity('1');
      setUnit('g');
      setMealType('');
      clearCapturedImages();
      setBaseAIResult(null);
      setDynamicMacros(null);
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
    queryKey: ['/api/nutrition/history', user.id],
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
    console.log("Captured images:", capturedImages.length > 0 ? `${capturedImages.length} images present` : "No images");
    console.log("Portion weight:", portionWeight);
    console.log("Portion unit:", portionUnit);
    
    // Clear previous analysis results
    setBaseAIResult(null);
    setDynamicMacros(null);
    setPortionWeight('');
    setPortionUnit('g');
    
    const hasFoodName = foodName.trim();
    const hasDescription = foodQuery.trim();
    const hasImage = capturedImages.length > 0;
    const hasPortion = portionWeight && portionUnit;
    
    if (!hasFoodName) {
      console.log("No food name provided");
      toast({
        title: "Food Name Required",  
        description: "Please enter a food name to continue with AI analysis",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Calling AI mutation...");
    aiAnalyzeMutation.mutate({
      foodName: hasFoodName ? foodName : undefined,
      description: hasDescription ? foodQuery : undefined,
      images: hasImage ? capturedImages : undefined,
      portionWeight: hasPortion ? portionWeight : undefined,
      portionUnit: hasPortion ? portionUnit : undefined
    });
  };

  // Reset pagination when search queries change
  React.useEffect(() => {
    setHistoryDisplayLimit(10);
  }, [historySearchQuery]);

  React.useEffect(() => {
    setSavedMealsDisplayLimit(10);
  }, [savedMealsSearchQuery]);

  // Auto-expand Load More functionality for Recent Foods
  const handleLoadMoreHistory = () => {
    setHistoryDisplayLimit(prev => {
      const currentLimit = prev;
      const totalItems = filteredFoodHistory.length;
      const nextIncrement = currentLimit + 10;
      
      // If this would show most items (80% or more), show all remaining
      if (nextIncrement >= totalItems * 0.8) {
        return totalItems; // Show all remaining items
      }
      
      return nextIncrement; // Otherwise, increment by 10
    });
  };

  // Dynamic volume-based macro recalculation function
  const recalculateMacrosFromVolume = React.useCallback(() => {
    if (!baseAIResult) return;

    // Check if we have user-adjusted portion information from the green section
    const userPortionWeight = portionWeight ? parseFloat(portionWeight) : null;
    const hasUserPortion = userPortionWeight && portionUnit;
    
    // Check if AI provided standardized portion information  
    const hasStandardizedPortion = baseAIResult.portionWeight && baseAIResult.portionUnit;
    
    if (hasUserPortion && hasStandardizedPortion) {
      // User has adjusted the portion size - calculate multiplier based on AI's base portion
      const aiBaseWeight = parseFloat(baseAIResult.portionWeight);
      const multiplier = userPortionWeight / aiBaseWeight;
      
      console.log(`User portion adjustment: ${userPortionWeight}${portionUnit} vs AI base: ${aiBaseWeight}${baseAIResult.portionUnit}, multiplier: ${multiplier}`);
      
      const recalculatedMacros = {
        ...baseAIResult,
        calories: Math.round((baseAIResult.calories * multiplier) * 100) / 100,
        protein: Math.round((baseAIResult.protein * multiplier) * 100) / 100,
        carbs: Math.round((baseAIResult.carbs * multiplier) * 100) / 100,
        fat: Math.round((baseAIResult.fat * multiplier) * 100) / 100,
        servingDetails: `${userPortionWeight}${portionUnit} (adjusted from AI base: ${baseAIResult.portionWeight}${baseAIResult.portionUnit})`,
        assumptions: baseAIResult.assumptions ? 
          `${baseAIResult.assumptions} • Portion adjusted to ${userPortionWeight}${portionUnit}` :
          `Portion adjusted to ${userPortionWeight}${portionUnit}`,
        // Scale micronutrients proportionally if they exist
        ...(baseAIResult.micronutrients && {
          micronutrients: Object.fromEntries(
            Object.entries(baseAIResult.micronutrients).map(([categoryKey, categoryValue]: [string, any]) => {
              if (typeof categoryValue === 'object' && categoryValue !== null) {
                // This is a category object (e.g., "Major Minerals", "Vitamins")
                const scaledCategory = Object.fromEntries(
                  Object.entries(categoryValue).map(([nutrientKey, nutrientValue]: [string, any]) => [
                    nutrientKey,
                    typeof nutrientValue === 'number' ? Math.round((nutrientValue * multiplier) * 100) / 100 : nutrientValue
                  ])
                );
                return [categoryKey, scaledCategory];
              } else if (typeof categoryValue === 'number') {
                // This is a direct nutrient value
                return [categoryKey, Math.round((categoryValue * multiplier) * 100) / 100];
              } else {
                // This is a non-numeric value, keep as is
                return [categoryKey, categoryValue];
              }
            })
          )
        })
      };

      console.log(`Recalculated with portion adjustment - calories:`, recalculatedMacros.calories);
      setDynamicMacros(recalculatedMacros);
    } else if (hasStandardizedPortion) {
      // AI already calculated nutrition for the standardized portion, no user adjustment
      console.log(`Using AI standardized portion: ${baseAIResult.portionWeight}${baseAIResult.portionUnit}`);
      setDynamicMacros({
        ...baseAIResult,
        servingDetails: `${baseAIResult.portionWeight}${baseAIResult.portionUnit} (AI standardized portion)`,
        assumptions: baseAIResult.assumptions || 'AI-analyzed standardized portion'
      });
    } else {
      // Legacy behavior for non-standardized portions - apply quantity multiplier
      const currentQuantity = parseFloat(quantity);
      const multiplier = isNaN(currentQuantity) ? 1 : currentQuantity;

      console.log(`Recalculating macros: quantity=${quantity}, multiplier=${multiplier}`);
      console.log(`Base AI calories:`, baseAIResult.calories);

      const recalculatedMacros = {
        ...baseAIResult,
        calories: Math.round((baseAIResult.calories * multiplier) * 100) / 100,
        protein: Math.round((baseAIResult.protein * multiplier) * 100) / 100,
        carbs: Math.round((baseAIResult.carbs * multiplier) * 100) / 100,
        fat: Math.round((baseAIResult.fat * multiplier) * 100) / 100,
        servingDetails: baseAIResult.servingDetails ? 
          `${quantity} ${unit} (adjusted from AI estimate: ${baseAIResult.servingDetails})` :
          `${quantity} ${unit}`,
        assumptions: baseAIResult.assumptions ? 
          `${baseAIResult.assumptions} • Volume adjusted to ${quantity} ${unit}` :
          `Volume adjusted to ${quantity} ${unit}`,
        // Scale micronutrients proportionally if they exist
        ...(baseAIResult.micronutrients && {
          micronutrients: Object.fromEntries(
            Object.entries(baseAIResult.micronutrients).map(([categoryKey, categoryValue]: [string, any]) => {
              if (typeof categoryValue === 'object' && categoryValue !== null) {
                // This is a category object (e.g., "Major Minerals", "Vitamins")
                const scaledCategory = Object.fromEntries(
                  Object.entries(categoryValue).map(([nutrientKey, nutrientValue]: [string, any]) => [
                    nutrientKey,
                    typeof nutrientValue === 'number' ? Math.round((nutrientValue * multiplier) * 100) / 100 : nutrientValue
                  ])
                );
                return [categoryKey, scaledCategory];
              } else if (typeof categoryValue === 'number') {
                // This is a direct nutrient value
                return [categoryKey, Math.round((categoryValue * multiplier) * 100) / 100];
              } else {
                // This is a non-numeric value, keep as is
                return [categoryKey, categoryValue];
              }
            })
          )
        })
      };

      console.log(`Recalculated calories:`, recalculatedMacros.calories);
      setDynamicMacros(recalculatedMacros);
    }
  }, [baseAIResult, quantity, unit, portionWeight, portionUnit]);

  // Auto-sync portion values to quantity/unit after AI analysis
  React.useEffect(() => {
    if (aiAnalyzeMutation.data) {
      // AI provides nutrition for the analyzed quantity, set form to match AI result
      console.log("AI analysis complete, using AI standardized portion");
      
      // Set base AI result for calculations
      setBaseAIResult(aiAnalyzeMutation.data);
      setDynamicMacros(aiAnalyzeMutation.data);
      
      // Use AI-provided standardized portion if available
      if (aiAnalyzeMutation.data.portionWeight && aiAnalyzeMutation.data.portionUnit) {
        // Set both portion fields AND quantity/unit from AI data
        setPortionWeight(aiAnalyzeMutation.data.portionWeight.toString());
        setPortionUnit(aiAnalyzeMutation.data.portionUnit);
        setQuantity(aiAnalyzeMutation.data.portionWeight.toString());
        setUnit(aiAnalyzeMutation.data.portionUnit);
        console.log(`Setting initial portion: ${aiAnalyzeMutation.data.portionWeight} ${aiAnalyzeMutation.data.portionUnit}`);
      } else {
        // Fallback to AI serving details or default
        setQuantity('1');
        setUnit('serving');
      }
    }
  }, [aiAnalyzeMutation.data]);

  // Recalculate macros when quantity, unit, or portion data changes
  React.useEffect(() => {
    if (baseAIResult) {
      console.log(`Triggering recalculation due to changes: quantity=${quantity} ${unit}, portion=${portionWeight} ${portionUnit}`);
      recalculateMacrosFromVolume();
    }
  }, [quantity, unit, portionWeight, portionUnit, recalculateMacrosFromVolume]);

  // Effect to handle portion weight/unit changes for AI analysis
  React.useEffect(() => {
    if (dynamicMacros && portionWeight && portionUnit) {
      // Auto-sync the portion data to quantity/unit fields for AI mode
      setQuantity(portionWeight);
      setUnit(portionUnit);
      console.log(`Syncing portion data: ${portionWeight} ${portionUnit} -> quantity/unit`);
    }
  }, [portionWeight, portionUnit]);

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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the 5 image limit
    if (capturedImages.length + files.length > 5) {
      toast({
        title: "Too Many Images",
        description: "Maximum 5 images allowed. Please remove some existing images first.",
        variant: "destructive"
      });
      return;
    }

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file, index) => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `Image ${index + 1} is larger than 5MB`,
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `File ${index + 1} is not an image`,
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        newImages.push(base64);
        processedCount++;
        
        // Update state when all files are processed
        if (processedCount === files.length) {
          setCapturedImages(prev => [...prev, ...newImages]);
          setShowImageCapture(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const clearCapturedImages = () => {
    setCapturedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeCapturedImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
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
    // Note: Removed searchMode as interface is now AI-only
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
      mealSuitability: historyItem.mealSuitability,
      micronutrients: historyItem.micronutrients // Include micronutrient data from history
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
          mealSuitability: item.mealSuitability || [],
          micronutrients: item.micronutrients // Include micronutrient data from saved meal item
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
      foodName: foodName || selectedFood?.name || "Unknown Food",
      quantity: quantity,
      unit: unit,
      calories: nutritionData.calories.toString(),
      protein: nutritionData.protein.toString(),
      carbs: nutritionData.carbs.toString(),
      fat: nutritionData.fat.toString(),
      mealType: mealType,
      // Include micronutrients from AI analysis if available
      ...(nutritionData.micronutrients && { micronutrients: nutritionData.micronutrients })
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

  // Filter saved meals based on search query with pagination
  const filteredSavedMeals = Array.isArray(savedMeals) ? savedMeals.filter((meal: any) => 
    meal.name.toLowerCase().includes(savedMealsSearchQuery.toLowerCase())
  ) : [];
  
  // Apply display limit for saved meals pagination
  const displayedSavedMeals = filteredSavedMeals.slice(0, savedMealsDisplayLimit);
  const hasMoreSavedMeals = filteredSavedMeals.length > savedMealsDisplayLimit;
  
  // Only show Load More for saved meals if there are 5+ total records
  const shouldShowSavedMealsLoadMore = Array.isArray(savedMeals) && 
    savedMeals.length >= 5 && 
    hasMoreSavedMeals && 
    !savedMealsSearchQuery;

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
            className="h-8 w-8  bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
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
            className="h-8 w-8  bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content Card with Tabs */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4 pt-[16px] pb-[16px] pl-[2px] pr-[2px] ml-[0px] mr-[0px]">
            <Tabs defaultValue="ai-analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="recent-foods">Recent Foods</TabsTrigger>
                <TabsTrigger value="saved-meals">Saved Meals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai-analysis" className="space-y-4 mt-4">
                {/* AI Analysis Mode - Database Search Hidden */}
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20  border border-blue-200 dark:border-blue-700">
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

                {/* Food Name Input - Required */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Food Name (required) *
              </Label>
              <Input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Enter food name (e.g., Chicken Breast, Apple, Greek Yogurt)"
                className="h-9 text-sm ios-touch-feedback"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAIAnalysis();
                  }
                }}
                onPaste={(e) => {
                  // Allow default paste behavior
                  e.stopPropagation();
                }}
                onCopy={(e) => {
                  // Allow default copy behavior
                  e.stopPropagation();
                }}
                onCut={(e) => {
                  // Allow default cut behavior
                  e.stopPropagation();
                }}
              />
            </div>

                {/* Food Description Input with Action Buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Describe your food (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="Add details (e.g., grilled, with olive oil, 200g portion)"
                  className="flex-1 h-9 text-sm ios-touch-feedback"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAIAnalysis();
                    }
                  }}
                  onPaste={(e) => {
                    // Allow default paste behavior
                    e.stopPropagation();
                  }}
                  onCopy={(e) => {
                    // Allow default copy behavior
                    e.stopPropagation();
                  }}
                  onCut={(e) => {
                    // Allow default cut behavior
                    e.stopPropagation();
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

            {/* Image Analysis Type Selection - Only show when images are uploaded */}
            {capturedImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  Photo Analysis Type *
                </Label>
                <Select value={imageAnalysisType} onValueChange={(value: 'nutrition_label' | 'actual_food' | '') => setImageAnalysisType(value)}>
                  <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                    <SelectValue placeholder="Please select type of image" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nutrition_label">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Nutrition Label
                      </div>
                    </SelectItem>
                    <SelectItem value="actual_food">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-3 h-3" />
                        Actual Food
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {imageAnalysisType === 'nutrition_label' 
                    ? 'Analyze nutrition facts from product labels for precise macro data'
                    : imageAnalysisType === 'actual_food'
                    ? 'Analyze actual food portions to estimate nutrition content'
                    : 'Select how to analyze your uploaded images'
                  }
                </p>
              </div>
            )}

            {/* Hidden file input for image capture/upload - supports multiple files */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Captured Images Preview */}
            {capturedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                    <ImageIcon className="w-3 h-3 inline mr-1" />
                    {capturedImages.length} {imageAnalysisType === 'nutrition_label' ? 'Nutrition Label' : 'Food Photo'}{capturedImages.length > 1 ? 's' : ''} Captured
                  </Label>
                  <Button
                    onClick={clearCapturedImages}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ios-button"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {capturedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${imageAnalysisType === 'nutrition_label' ? 'Captured nutrition label' : 'Captured food photo'} ${index + 1}`}
                        className="w-full h-24 object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={() => removeCapturedImage(index)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 touch-target group"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3 text-white group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {5 - capturedImages.length} more image{5 - capturedImages.length !== 1 ? 's' : ''} can be added (max 5 total)
                </p>
              </div>
            )}



                {/* Action Button */}
                <Button
                  onClick={handleAIAnalysis}
                  disabled={!foodName.trim() || isLoading || (capturedImages.length > 0 && !imageAnalysisType)}
                  className="w-full h-9 ios-button touch-target"
                >
                  {isLoading ? (
                    <div className="ios-loading-dots flex items-center gap-1 mr-2">
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Analyze with AI
                </Button>

                {/* AI Analysis Results - Dynamic Volume-Based Display */}
                {dynamicMacros && (
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20  border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <Label className="text-xs font-medium text-blue-800 dark:text-blue-200">
                        AI Analysis Result {quantity !== (portionWeight || '1') && '(Volume Adjusted)'}
                      </Label>
                      {dynamicMacros.micronutrients && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0.5 h-auto bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                          onClick={() => {
                            // Show micronutrient details in a toast or modal
                            toast({
                              title: "Micronutrients Available",
                              description: "This food contains vitamin and mineral data. Log it to see detailed nutritional breakdown.",
                            });
                          }}
                        >
                          Vitamins
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white dark:bg-gray-800 ">
                        <p className="text-gray-600 dark:text-gray-400">Calories</p>
                        <p className="font-bold">{Math.round(dynamicMacros.calories)}</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 ">
                        <p className="text-gray-600 dark:text-gray-400">Protein</p>
                        <p className="font-bold text-blue-600">{Math.round(dynamicMacros.protein)}g</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 ">
                        <p className="text-gray-600 dark:text-gray-400">Carbs</p>
                        <p className="font-bold text-orange-600">{Math.round(dynamicMacros.carbs)}g</p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 ">
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
                      <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 ">
                        <p className="font-medium">✓ Dynamic Calculation Applied</p>
                        <p>Macros automatically updated based on your volume adjustment</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Portion Input - Show after AI analysis */}
                {dynamicMacros && (
                  <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <Label className="text-xs font-medium text-green-800 dark:text-green-200">
                      Portion Information - Adjust Serving Size
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-green-700 dark:text-green-300">Weight/Volume</Label>
                        <Input
                          value={portionWeight}
                          onChange={(e) => setPortionWeight(e.target.value)}
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="100"
                          className="h-8 text-sm ios-touch-feedback"
                          onPaste={(e) => {
                            // Allow default paste behavior
                            e.stopPropagation();
                          }}
                          onCopy={(e) => {
                            // Allow default copy behavior
                            e.stopPropagation();
                          }}
                          onCut={(e) => {
                            // Allow default cut behavior
                            e.stopPropagation();
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-green-700 dark:text-green-300">Unit</Label>
                        <Input
                          value={portionUnit}
                          onChange={(e) => setPortionUnit(e.target.value)}
                          type="text"
                          placeholder="g, ml, oz, cups, etc."
                          className="h-8 text-sm ios-touch-feedback"
                          onPaste={(e) => {
                            // Allow default paste behavior
                            e.stopPropagation();
                          }}
                          onCopy={(e) => {
                            // Allow default copy behavior
                            e.stopPropagation();
                          }}
                          onCut={(e) => {
                            // Allow default cut behavior
                            e.stopPropagation();
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Adjust portion size to recalculate macros automatically. Supports all unit types (g, kg, ml, L, oz, cups, pieces, etc.)
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recent-foods" className="space-y-4 mt-4">
                {/* Recent Foods Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Recent Foods</Label>
                  </div>
                  
                  {/* Meal Type Selection for Recent Foods */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Add to Meal Type</Label>
                    <Select value={mealType} onValueChange={(value) => {
                      console.log('AddFood Recent Foods: Meal type changed to:', value);
                      setMealType(value);
                      localStorage.setItem('lastSelectedMealType', value);
                    }}>
                      <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                        <SelectItem value="supplementation">Supplementation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {Array.isArray(foodHistory) && foodHistory.length > 0 ? (
                <>
                  {/* History Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search your food history..."
                      className="h-8 pl-7 text-xs ios-touch-feedback"
                      onPaste={(e) => {
                        // Allow default paste behavior
                        e.stopPropagation();
                      }}
                      onCopy={(e) => {
                        // Allow default copy behavior
                        e.stopPropagation();
                      }}
                      onCut={(e) => {
                        // Allow default cut behavior
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  {/* History Items */}
                  <div className="space-y-2">
                    {displayedFoodHistory.map((item: any, index: number) => (
                      <div
                        key={`${item.foodName}-${index}`}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800  transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
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
                                {item.micronutrients && (
                                  <span 
                                    className="ml-1 text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItemForNutrients(item);
                                      setShowNutrientModal(true);
                                    }}
                                  >
                                    • Vitamins
                                  </span>
                                )}
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
                        onClick={handleLoadMoreHistory}
                        className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors touch-target"
                      >
                        Load More
                      </span>
                    </div>
                  )}
                </>
              ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-xs">No food history yet. Foods you log will appear here for quick access.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="saved-meals" className="space-y-4 mt-4">
                {/* Saved Meals Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Saved Meals</Label>
                  </div>
                  
                  {/* Meal Type Selection for Saved Meals */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Add to Meal Type</Label>
                    <Select value={mealType} onValueChange={(value) => {
                      console.log('AddFood Saved Meals: Meal type changed to:', value);
                      setMealType(value);
                      localStorage.setItem('lastSelectedMealType', value);
                    }}>
                      <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                        <SelectItem value="supplementation">Supplementation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {Array.isArray(savedMeals) && savedMeals.length > 0 ? (
                <>
                  {/* Saved Meals Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input
                      value={savedMealsSearchQuery}
                      onChange={(e) => setSavedMealsSearchQuery(e.target.value)}
                      placeholder="Search your saved meals..."
                      className="h-8 pl-7 text-xs ios-touch-feedback"
                      onPaste={(e) => {
                        // Allow default paste behavior
                        e.stopPropagation();
                      }}
                      onCopy={(e) => {
                        // Allow default copy behavior
                        e.stopPropagation();
                      }}
                      onCut={(e) => {
                        // Allow default cut behavior
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  {/* Saved Meals Items */}
                  <div className="space-y-2">
                    {displayedSavedMeals.map((meal: any) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800  transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
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
                                {meal.totalMicronutrients && (
                                  <span 
                                    className="ml-1 text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItemForNutrients(meal);
                                      setShowNutrientModal(true);
                                    }}
                                  >
                                    • Vitamins
                                  </span>
                                )}
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
                  
                  {/* Load More Link for Saved Meals - Only if 5+ total records */}
                  {shouldShowSavedMealsLoadMore && (
                    <div className="text-center">
                      <span
                        onClick={() => setSavedMealsDisplayLimit(prev => prev + 10)}
                        className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors touch-target"
                      >
                        Load More
                      </span>
                    </div>
                  )}
                </>
              ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-xs">No saved meals yet. Create meal templates for quick access.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>


            {/* Quantity and Meal Selection */}
            {(selectedFood || aiAnalyzeMutation.data) && (
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Only show quantity/unit inputs for non-AI mode or when AI analysis is not active */}
                {!dynamicMacros && (
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
                        onPaste={(e) => {
                          // Allow default paste behavior
                          e.stopPropagation();
                        }}
                        onCopy={(e) => {
                          // Allow default copy behavior
                          e.stopPropagation();
                        }}
                        onCut={(e) => {
                          // Allow default cut behavior
                          e.stopPropagation();
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Unit</Label>
                      <Input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="g, ml, oz, cups, pieces, etc."
                        className="h-8 text-sm ios-touch-feedback"
                        onPaste={(e) => {
                          // Allow default paste behavior
                          e.stopPropagation();
                        }}
                        onCopy={(e) => {
                          // Allow default copy behavior
                          e.stopPropagation();
                        }}
                        onCut={(e) => {
                          // Allow default cut behavior
                          e.stopPropagation();
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* For AI mode, show read-only quantity/unit info */}
                {dynamicMacros && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Current Portion</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{quantity} {unit}</p>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">Auto-synced from portion adjustment</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Meal Type</Label>
                  <Select value={mealType} onValueChange={(value) => {
                    console.log('AddFood Main Form: Meal type changed to:', value);
                    setMealType(value);
                    localStorage.setItem('lastSelectedMealType', value);
                  }}>
                    <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                      <SelectItem value="supplementation">Supplementation</SelectItem>
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
                  <div className="ios-loading-dots flex items-center gap-1 mr-2">
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
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

        {/* Nutrient Details Modal */}
        <NutrientDetailsModal
          isOpen={showNutrientModal}
          onClose={() => {
            setShowNutrientModal(false);
            setSelectedItemForNutrients(null);
          }}
          foodName={selectedItemForNutrients?.foodName || selectedItemForNutrients?.name || "Unknown Food"}
          micronutrients={selectedItemForNutrients?.micronutrients || selectedItemForNutrients?.totalMicronutrients}
        />
      </div>
    </div>
  );
}