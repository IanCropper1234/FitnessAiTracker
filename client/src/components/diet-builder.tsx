import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ShoppingCart, Database, Brain, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  barcode?: string;
  source: 'openfoodfacts' | 'custom';
}

interface DietBuilderProps {
  userId: number;
}

export function DietBuilder({ userId }: DietBuilderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [searchMode, setSearchMode] = useState<'database' | 'ai'>('database');
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");

  // Search Open Food Facts database
  const { data: searchResults, isLoading: isSearchLoading } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length > 2 && searchMode === 'database'
  });

  // Get custom food database
  const { data: customFoods } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/items'],
    queryFn: async () => {
      const response = await fetch('/api/food/items');
      return response.json();
    }
  });

  // AI analysis mutation
  const aiAnalyzeMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/nutrition/analyze", {
        foodDescription: description,
        quantity: 1,
        unit: "serving"
      });
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze food",
        variant: "destructive"
      });
    }
  });

  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async (mealData: { foods: FoodItem[], mealType: string }) => {
      const promises = mealData.foods.map(food => 
        apiRequest("POST", "/api/nutrition/log", {
          userId,
          foodName: food.name,
          quantity: 1,
          unit: "serving",
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          mealType: mealData.mealType,
          date: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Meal saved to ${selectedMealType} successfully!`
      });
      setSelectedFoods([]);
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal",
        variant: "destructive"
      });
    }
  });

  const addToMealPlan = (food: FoodItem) => {
    setSelectedFoods([...selectedFoods, food]);
  };

  const addAIAnalysisToMealPlan = () => {
    if (aiAnalyzeMutation.data) {
      const aiFood: FoodItem = {
        id: `ai-${Date.now()}`,
        name: searchQuery,
        calories: aiAnalyzeMutation.data.calories,
        protein: aiAnalyzeMutation.data.protein,
        carbs: aiAnalyzeMutation.data.carbs,
        fat: aiAnalyzeMutation.data.fat,
        source: 'custom'
      };
      setSelectedFoods([...selectedFoods, aiFood]);
      setSearchQuery("");
      aiAnalyzeMutation.reset();
    }
  };

  const removeFromMealPlan = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // The query will automatically trigger due to enabled condition
  };

  const handleAIAnalysis = () => {
    if (!searchQuery.trim()) return;
    aiAnalyzeMutation.mutate(searchQuery);
  };

  const handleSaveMeal = () => {
    if (selectedFoods.length === 0) return;
    saveMealMutation.mutate({ foods: selectedFoods, mealType: selectedMealType });
  };

  const calculateTotalMacros = () => {
    return selectedFoods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totals = calculateTotalMacros();
  const isLoading = isSearchLoading || aiAnalyzeMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Diet Builder
          </CardTitle>
          <CardDescription>
            Build meals using our comprehensive food database powered by Open Food Facts
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {searchMode === 'database' ? <Search className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
              {searchMode === 'database' ? 'Food Database Search' : 'AI Food Analysis'}
            </CardTitle>
            <CardDescription>
              {searchMode === 'database' 
                ? 'Search from millions of foods in the Open Food Facts database'
                : 'Describe your food and get instant nutrition analysis'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'database' ? 'default' : 'outline'}
                onClick={() => setSearchMode('database')}
                className={searchMode === 'database' 
                  ? "bg-black dark:bg-white text-white dark:text-black" 
                  : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              >
                <Database className="w-4 h-4 mr-2" />
                Food Database
              </Button>
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
            </div>

            {/* Food Input */}
            <div className="space-y-2">
              <Label className="text-black dark:text-white">
                {searchMode === 'ai' ? 'Describe your food (e.g., "grilled chicken breast 150g")' : 'Search for food'}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={searchMode === 'ai' 
                    ? "2 slices whole wheat bread with peanut butter" 
                    : "Search for foods (e.g., 'chicken breast', 'oatmeal')"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && (searchMode === 'ai' ? handleAIAnalysis() : handleSearch())}
                />
                <Button
                  onClick={searchMode === 'ai' ? handleAIAnalysis : handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
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
                  <Button
                    onClick={addAIAnalysisToMealPlan}
                    className="w-full mt-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Meal Plan
                  </Button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {searchMode === 'ai' ? 'Analyzing food...' : 'Searching food database...'}
                </p>
              </div>
            )}

            {/* Database Search Results */}
            {searchResults && searchResults.length > 0 && searchMode === 'database' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((food, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-black dark:text-white">
                        {food.name}
                      </div>
                      {food.brand && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {food.brand}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-4 mt-1">
                        <span>{food.calories} cal</span>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>F: {food.fat}g</span>
                      </div>
                      <Badge 
                        variant={food.source === 'openfoodfacts' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {food.source === 'openfoodfacts' ? 'Open Food Facts' : 'Custom'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToMealPlan(food)}
                      className="ml-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty States */}
            {searchMode === 'database' && searchQuery.length > 2 && !isLoading && (!searchResults || searchResults.length === 0) && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No foods found matching "{searchQuery}"</p>
                <p className="text-sm">Try a different search term or use AI analysis</p>
              </div>
            )}

            {searchMode === 'database' && searchQuery.length <= 2 && !isLoading && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search the food database</p>
                <p className="text-sm">Search from millions of foods worldwide</p>
              </div>
            )}

            {searchMode === 'ai' && !aiAnalyzeMutation.data && !isLoading && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Describe your food for instant analysis</p>
                <p className="text-sm">AI will analyze nutrition content automatically</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Meal Builder
            </CardTitle>
            <CardDescription>
              Build your meal and track macros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meal Type Selector */}
            <div className="space-y-2">
              <Label className="text-black dark:text-white">Meal Type</Label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedFoods.length > 0 ? (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedFoods.map((food, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-black dark:text-white text-sm">
                          {food.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-3">
                          <span>{food.calories} cal</span>
                          <span>P: {food.protein}g</span>
                          <span>C: {food.carbs}g</span>
                          <span>F: {food.fat}g</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromMealPlan(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-black dark:text-white mb-2">Meal Totals</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-blue-700 dark:text-blue-300 font-medium">Calories</div>
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {Math.round(totals.calories)}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-green-700 dark:text-green-300 font-medium">Protein</div>
                      <div className="text-xl font-bold text-green-900 dark:text-green-100">
                        {Math.round(totals.protein)}g
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <div className="text-yellow-700 dark:text-yellow-300 font-medium">Carbs</div>
                      <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                        {Math.round(totals.carbs)}g
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="text-purple-700 dark:text-purple-300 font-medium">Fat</div>
                      <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        {Math.round(totals.fat)}g
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" 
                  disabled={selectedFoods.length === 0 || saveMealMutation.isPending}
                  onClick={handleSaveMeal}
                >
                  {saveMealMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `Save to ${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}`
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No foods selected</p>
                <p className="text-sm">Search and add foods to build your meal</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}