import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ShoppingCart, Database } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);

  // Search Open Food Facts database
  const { data: searchResults, isLoading } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length > 2
  });

  // Get custom food database
  const { data: customFoods } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/items'],
    queryFn: async () => {
      const response = await fetch('/api/food/items');
      return response.json();
    }
  });

  const addToMealPlan = (food: FoodItem) => {
    setSelectedFoods([...selectedFoods, food]);
  };

  const removeFromMealPlan = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
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
              <Search className="w-5 h-5" />
              Food Database Search
            </CardTitle>
            <CardDescription>
              Search from millions of foods in the Open Food Facts database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search for foods (e.g., 'chicken breast', 'oatmeal')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Searching food database...</p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
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
                      className="ml-4"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length > 2 && !isLoading && (!searchResults || searchResults.length === 0) && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No foods found matching "{searchQuery}"</p>
                <p className="text-sm">Try a different search term or add a custom food</p>
              </div>
            )}

            {searchQuery.length <= 2 && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search the food database</p>
                <p className="text-sm">Search from millions of foods worldwide</p>
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

                <Button className="w-full" disabled={selectedFoods.length === 0}>
                  Save Meal to Log
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