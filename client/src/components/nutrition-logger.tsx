import { useState } from "react";
import { useLanguage } from "./language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Search, Loader2, Utensils, Brain } from "lucide-react";

interface NutritionLoggerProps {
  userId: number;
  onComplete?: () => void;
}

interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export function NutritionLogger({ userId, onComplete }: NutritionLoggerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [searchMode, setSearchMode] = useState<'search' | 'ai'>('ai');
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState('');

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
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

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nutrition/log", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Food logged successfully!"
      });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log food",
        variant: "destructive"
      });
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

  const handleLogFood = () => {
    let nutritionData;
    
    if (searchMode === 'ai' && aiAnalyzeMutation.data) {
      nutritionData = aiAnalyzeMutation.data;
    } else if (selectedFood) {
      const multiplier = parseFloat(quantity);
      nutritionData = {
        calories: selectedFood.calories * multiplier,
        protein: selectedFood.protein * multiplier,
        carbs: selectedFood.carbs * multiplier,
        fat: selectedFood.fat * multiplier
      };
    } else {
      toast({
        title: "Error",
        description: "Please search for food first",
        variant: "destructive"
      });
      return;
    }

    const logData = {
      userId,
      date: new Date(),
      foodName: searchMode === 'ai' ? foodQuery : selectedFood?.name || foodQuery,
      quantity: quantity,
      unit: unit,
      calories: nutritionData.calories.toString(),
      protein: nutritionData.protein.toString(),
      carbs: nutritionData.carbs.toString(),
      fat: nutritionData.fat.toString(),
      mealType: mealType || null
    };

    logMutation.mutate(logData);
  };

  const isLoading = searchMutation.isPending || aiAnalyzeMutation.isPending || logMutation.isPending;
  const canLog = (searchMode === 'ai' && aiAnalyzeMutation.data) || selectedFood;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-black dark:text-white">{t("log_food")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Search for food or describe what you ate
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onComplete}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === 'ai' ? 'default' : 'outline'}
              onClick={() => setSearchMode('ai')}
              className={searchMode === 'ai' 
                ? "bg-black dark:bg-white text-white dark:text-black" 
                : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Analysis
            </Button>
            <Button
              variant={searchMode === 'search' ? 'default' : 'outline'}
              onClick={() => setSearchMode('search')}
              className={searchMode === 'search' 
                ? "bg-black dark:bg-white text-white dark:text-black" 
                : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            >
              <Search className="w-4 h-4 mr-2" />
              Food Database
            </Button>
          </div>

          {/* Food Input */}
          <div className="space-y-2">
            <Label htmlFor="food-input" className="text-black dark:text-white">
              {searchMode === 'ai' ? 'Describe your food (e.g., "grilled chicken breast 150g")' : 'Search for food'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="food-input"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                placeholder={searchMode === 'ai' 
                  ? "2 slices whole wheat bread with peanut butter" 
                  : "Chicken breast, apple, rice..."
                }
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && (searchMode === 'ai' ? handleAIAnalysis() : handleSearch())}
              />
              <Button
                onClick={searchMode === 'ai' ? handleAIAnalysis : handleSearch}
                disabled={isLoading || !foodQuery.trim()}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : searchMode === 'ai' ? (
                  <Brain className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quantity and Unit (for search mode) */}
          {searchMode === 'search' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-black dark:text-white">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-black dark:text-white">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
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
            <Label htmlFor="meal-type" className="text-black dark:text-white">Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                <SelectValue placeholder="Select meal type (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Results */}
          {searchMutation.data && searchMode === 'search' && (
            <div className="space-y-2">
              <Label className="text-black dark:text-white">Search Results</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchMutation.data.map((food: FoodSearchResult, index: number) => (
                  <div
                    key={index}
                    onClick={() => setSelectedFood(food)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedFood === food
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium">{food.name}</div>
                    <div className="text-sm opacity-75">
                      {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </div>
                    <div className="text-xs opacity-60">{food.servingSize}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalyzeMutation.data && searchMode === 'ai' && (
            <div className="space-y-2">
              <Label className="text-black dark:text-white">Nutrition Analysis</Label>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
                {aiAnalyzeMutation.data.confidence && aiAnalyzeMutation.data.confidence > 0 && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                    Confidence: {Math.round(aiAnalyzeMutation.data.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onComplete}
              className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogFood}
              disabled={!canLog || isLoading}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
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
    </div>
  );
}