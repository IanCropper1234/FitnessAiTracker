import { useState } from "react";
import { useLanguage } from "./language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
import { TimezoneUtils } from "@shared/utils/timezone";
import { X, Search, Loader2, Utensils, Brain, Sunrise, Sun, Moon, Apple, Scan, Pill, Save } from "lucide-react";
import { BarcodeScanner } from "./barcode-scanner";

interface NutritionLoggerProps {
  userId: number;
  selectedDate?: string;
  onComplete?: () => void;
}

interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  category?: string;
  mealSuitability?: string[];
}

export function NutritionLogger({ userId, selectedDate, onComplete }: NutritionLoggerProps) {
  const { t } = useLanguage();
  const { showSuccess, showError } = useIOSNotifications();
  
  const [searchMode, setSearchMode] = useState<'search' | 'ai' | 'saved'>('ai');
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState('breakfast');

  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedMealSuitability, setSelectedMealSuitability] = useState<string>();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedSavedMeal, setSelectedSavedMeal] = useState<any>(null);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      // Enhanced search with RP categorization
      let url = `/api/food/search?q=${encodeURIComponent(query)}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedMealSuitability) url += `&mealType=${selectedMealSuitability}`;
      
      const response = await fetch(url);
      return response.json();
    }
  });

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/nutrition/analyze", {
        foodDescription: description,
        quantity: parseFloat(quantity),
        unit: unit
      });
      return response.json();
    }
  });

  const queryClient = useQueryClient();

  // Query for saved meals
  const savedMealsQuery = useQuery({
    queryKey: ['/api/saved-meals', userId],
    enabled: searchMode === 'saved'
  });
  
  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nutrition/log", data);
    },
    onSuccess: (response, variables) => {
      // Invalidate specific date queries to refresh the food log
      const loggedDate = variables.date ? new Date(variables.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      console.log('Food logged successfully, invalidating cache for date:', loggedDate, 'originalDate:', variables.date);
      
      // Invalidate all possible query variations
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Force a complete cache refresh for nutrition data
      queryClient.refetchQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.refetchQueries({ queryKey: ['/api/nutrition/summary'] });
      
      showSuccess("Food logged successfully!");
      onComplete?.();
    },
    onError: (error: any) => {
      showError("Failed to log food", error.message);
    }
  });

  const handleSearch = () => {
    if (!foodQuery.trim()) return;
    searchMutation.mutate(foodQuery);
  };

  const handleAIAnalysis = () => {
    if (!foodQuery.trim()) return;
    aiAnalyzeMutation.mutate(foodQuery);
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
    setFoodQuery(foodData.name);
    setSearchMode('search'); // Switch to search mode to show the found food
  };

  const handleLogFood = () => {
    if (!mealType.trim()) {
      showError("Meal Type Required", "Please select a meal type before logging food.");
      return;
    }

    let nutritionData;
    let foodName;
    
    if (searchMode === 'saved' && selectedSavedMeal) {
      // Handle saved meal logging - log as single entry with enhanced micronutrient data
      nutritionData = {
        calories: parseFloat(selectedSavedMeal.totalCalories || '0'),
        protein: parseFloat(selectedSavedMeal.totalProtein || '0'),
        carbs: parseFloat(selectedSavedMeal.totalCarbs || '0'),
        fat: parseFloat(selectedSavedMeal.totalFat || '0'),
        micronutrients: selectedSavedMeal.totalMicronutrients || null
      };
      foodName = selectedSavedMeal.name;
    } else if (searchMode === 'ai' && aiAnalyzeMutation.data) {
      nutritionData = aiAnalyzeMutation.data;
      foodName = foodQuery;
    } else if (selectedFood) {
      const multiplier = parseFloat(quantity);
      nutritionData = {
        calories: selectedFood.calories * multiplier,
        protein: selectedFood.protein * multiplier,
        carbs: selectedFood.carbs * multiplier,
        fat: selectedFood.fat * multiplier
      };
      foodName = selectedFood.name;
    } else {
      toast({
        title: "Error",
        description: "Please search for food first",
        variant: "destructive"
      });
      return;
    }

    const finalDate = selectedDate || TimezoneUtils.getCurrentDate();
    console.log('Logging food with selectedDate:', selectedDate, 'finalDate:', finalDate, 'using timezone-aware date');
    
    const logData = {
      userId,
      date: finalDate,
      foodName: foodName,
      quantity: quantity,
      unit: unit,
      calories: nutritionData.calories.toString(),
      protein: nutritionData.protein.toString(),
      carbs: nutritionData.carbs.toString(),
      fat: nutritionData.fat.toString(),
      mealType: mealType,
      micronutrients: nutritionData.micronutrients || null
    };

    logMutation.mutate(logData);
  };

  const isLoading = searchMutation.isPending || aiAnalyzeMutation.isPending || logMutation.isPending;
  const canLog = ((searchMode === 'ai' && aiAnalyzeMutation.data) || selectedFood || (searchMode === 'saved' && selectedSavedMeal)) && mealType.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-lg sm:max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 my-2 sm:my-4 min-h-[calc(100vh-16px)] sm:min-h-0 sm:max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-3">
            <CardTitle className="text-black dark:text-white text-lg sm:text-xl font-semibold truncate">{t("log_food")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Search for food or describe what you ate
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onComplete}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Search Mode Toggle */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={searchMode === 'ai' ? 'default' : 'outline'}
                onClick={() => setSearchMode('ai')}
                className={`text-xs ${searchMode === 'ai' 
                  ? "bg-black dark:bg-white text-white dark:text-black" 
                  : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Brain className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">AI Analysis</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button
                variant={searchMode === 'search' ? 'default' : 'outline'}
                onClick={() => setSearchMode('search')}
                className={`text-xs ${searchMode === 'search' 
                  ? "bg-black dark:bg-white text-white dark:text-black" 
                  : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Search className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Database</span>
                <span className="sm:hidden">DB</span>
              </Button>
              <Button
                variant={searchMode === 'saved' ? 'default' : 'outline'}
                onClick={() => setSearchMode('saved')}
                className={`text-xs ${searchMode === 'saved' 
                  ? "bg-black dark:bg-white text-white dark:text-black" 
                  : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Save className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Saved Meals</span>
                <span className="sm:hidden">Saved</span>
              </Button>
            </div>

            {/* Food Input */}
            {searchMode !== 'saved' && (
              <div className="space-y-2">
                <Label htmlFor="food-input" className="text-black dark:text-white text-sm font-medium">
                  {searchMode === 'ai' ? 'Describe your food (e.g., "grilled chicken breast 150g")' : 'Search for food'}
                </Label>
              <div className="flex gap-2">
                <Input
                  id="food-input"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder={searchMode === 'ai' 
                    ? "2 slices whole wheat bread" 
                    : "Chicken breast, apple..."
                  }
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (searchMode === 'ai' ? handleAIAnalysis() : handleSearch())}
                />
                <Button
                  onClick={searchMode === 'ai' ? handleAIAnalysis : handleSearch}
                  disabled={isLoading || !foodQuery.trim()}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-3 flex-shrink-0"
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : searchMode === 'ai' ? (
                    <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 flex-shrink-0"
                  size="sm"
                  title="Scan Barcode"
                >
                  <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
              </div>
            )}

            {/* Saved Meals Display */}
            {searchMode === 'saved' && (
              <div className="space-y-2">
                <Label className="text-black dark:text-white text-sm font-medium">Your Saved Meals</Label>
                {savedMealsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : savedMealsQuery.data && Array.isArray(savedMealsQuery.data) && savedMealsQuery.data.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {savedMealsQuery.data.map((meal: any) => (
                      <div
                        key={meal.id}
                        onClick={() => setSelectedSavedMeal(meal)}
                        className={`p-3 cursor-pointer border transition-colors ${
                          selectedSavedMeal?.id === meal.id
                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm truncate flex-1 mr-2">{meal.name}</div>
                          <Save className="w-4 h-4 opacity-50" />
                        </div>
                        {meal.description && (
                          <div className="text-xs opacity-75 mb-2">{meal.description}</div>
                        )}
                        <div className="text-xs opacity-75 mb-1">
                          {Math.round(parseFloat(meal.totalCalories || '0'))} cal • 
                          P: {Math.round(parseFloat(meal.totalProtein || '0'))}g • 
                          C: {Math.round(parseFloat(meal.totalCarbs || '0'))}g • 
                          F: {Math.round(parseFloat(meal.totalFat || '0'))}g
                        </div>
                        {meal.totalMicronutrients && 
                         typeof meal.totalMicronutrients === 'object' && 
                         Object.keys(meal.totalMicronutrients).length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Pill className="w-3 h-3 opacity-50" />
                            <span className="text-xs opacity-60">Contains vitamins & minerals</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Save className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No saved meals found</p>
                    <p className="text-xs mt-1">Save meals from your diary to see them here</p>
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Unit (for search mode) */}
            {searchMode === 'search' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity" className="text-black dark:text-white text-sm font-medium">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0.1"
                    step="0.1"
                    inputMode="decimal"
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-black dark:text-white text-sm font-medium">Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 z-[10000]">
                      <SelectItem value="serving">serving</SelectItem>
                      <SelectItem value="g">grams (g)</SelectItem>
                      <SelectItem value="oz">ounces (oz)</SelectItem>
                      <SelectItem value="cup">cup</SelectItem>
                      <SelectItem value="tbsp">tablespoon</SelectItem>
                      <SelectItem value="tsp">teaspoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Meal Type */}
            <div>
              <Label htmlFor="meal-type" className="text-black dark:text-white text-sm font-medium">
                Meal Type <span className="text-red-500">*</span>
              </Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className={`bg-white dark:bg-gray-800 text-black dark:text-white text-sm mt-1 ${
                  !mealType.trim() ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <SelectValue placeholder="Select meal type (required)" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 z-[10000]">
                  <SelectItem value="breakfast">
                    <div className="flex items-center gap-2">
                      <Sunrise className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-sm">Breakfast</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lunch">
                    <div className="flex items-center gap-2">
                      <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-sm">Lunch</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dinner">
                    <div className="flex items-center gap-2">
                      <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-sm">Dinner</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="snack">
                    <div className="flex items-center gap-2">
                      <Apple className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-sm">Snack</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="supplementation">
                    <div className="flex items-center gap-2">
                      <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-sm">Supplementation</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Results */}
            {searchMutation.data && searchMode === 'search' && (
              <div className="space-y-2">
                <Label className="text-black dark:text-white text-sm font-medium">Search Results</Label>
                <div className="max-h-40 sm:max-h-48 overflow-y-auto space-y-2">
                  {searchMutation.data.map((food: FoodSearchResult, index: number) => (
                    <div
                      key={index}
                      onClick={() => setSelectedFood(food)}
                      className={`p-2 sm:p-3  cursor-pointer border transition-colors ${
                        selectedFood === food
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm truncate flex-1 mr-2">{food.name}</div>
                        <div className="flex gap-1 flex-shrink-0">
                          {food.category && (
                            <span className={`text-xs px-1.5 py-0.5  ${
                              food.category === 'protein' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              food.category === 'carb' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              food.category === 'fat' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {food.category.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm opacity-75 mb-1">
                        {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs opacity-60 truncate flex-1">{food.servingSize}</div>
                        {food.mealSuitability && food.mealSuitability.length > 0 && (
                          <div className="flex gap-1 ml-2">
                            {food.mealSuitability.slice(0, 1).map((timing, idx) => (
                              <span key={idx} className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ">
                                {timing}
                              </span>
                            ))}
                            {food.mealSuitability.length > 1 && (
                              <span className="text-xs text-gray-500">+{food.mealSuitability.length - 1}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalyzeMutation.data && searchMode === 'ai' && (
            <div className="space-y-2">
              <Label className="text-black dark:text-white">Nutrition Analysis</Label>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 ">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-black dark:text-white">
                      {aiAnalyzeMutation.data.calories ? Math.round(aiAnalyzeMutation.data.calories) : 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-black dark:text-white">
                      {aiAnalyzeMutation.data.protein ? Math.round(aiAnalyzeMutation.data.protein) : 0}g
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-black dark:text-white">
                      {aiAnalyzeMutation.data.carbs ? Math.round(aiAnalyzeMutation.data.carbs) : 0}g
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-black dark:text-white">
                      {aiAnalyzeMutation.data.fat ? Math.round(aiAnalyzeMutation.data.fat) : 0}g
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4">
                  {aiAnalyzeMutation.data.confidence && aiAnalyzeMutation.data.confidence > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Confidence: {Math.round(aiAnalyzeMutation.data.confidence * 100)}%
                    </div>
                  )}
                  {aiAnalyzeMutation.data.category && (
                    <span className={`text-xs px-2 py-1  font-medium ${
                      aiAnalyzeMutation.data.category === 'protein' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      aiAnalyzeMutation.data.category === 'carb' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      aiAnalyzeMutation.data.category === 'fat' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {aiAnalyzeMutation.data.category.toUpperCase()} SOURCE
                    </span>
                  )}
                </div>
                {aiAnalyzeMutation.data.mealSuitability && aiAnalyzeMutation.data.mealSuitability.length > 0 && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">RP Meal Timing:</div>
                    <div className="flex justify-center gap-1 flex-wrap">
                      {aiAnalyzeMutation.data.mealSuitability.map((timing: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300  border border-blue-200 dark:border-blue-800">
                          {timing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button
                variant="outline"
                onClick={onComplete}
                className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 text-sm px-4 py-2"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={!canLog || isLoading}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-sm px-4 py-2"
                size="sm"
              >
                {logMutation.isPending ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Utensils className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden xs:inline">Log Food</span>
                <span className="xs:hidden">Log</span>
              </Button>
            </div>
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
  );
}