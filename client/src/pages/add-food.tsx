import { useState, useEffect } from "react";
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
  Sparkles
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
  const [searchMode, setSearchMode] = useState<'search' | 'ai'>('ai');
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState(mealTypeParam || 'breakfast');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedMealSuitability, setSelectedMealSuitability] = useState<string>();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      let url = `/api/food/search?q=${encodeURIComponent(query)}`;
      if (selectedCategory && selectedCategory !== 'any') url += `&category=${selectedCategory}`;
      if (selectedMealSuitability && selectedMealSuitability !== 'any') url += `&mealType=${selectedMealSuitability}`;
      
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

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/nutrition/log", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
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
    setShowBarcodeScanner(false);
    setSearchMode('search');
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
      return;
    }

    const logData = {
      userId: user.id,
      date: selectedDate,
      foodName: searchMode === 'ai' ? foodQuery : selectedFood?.name || foodQuery,
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

  const isLoading = searchMutation.isPending || aiAnalyzeMutation.isPending || logMutation.isPending;
  const canLog = ((searchMode === 'ai' && aiAnalyzeMutation.data) || selectedFood) && mealType.trim() !== '';

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
      <div className="container mx-auto p-4 space-y-4 max-w-2xl">
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
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content Card */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4 space-y-4">
            {/* Search Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant={searchMode === 'ai' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('ai')}
                className="h-8 text-xs ios-button touch-target"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Analysis
              </Button>
              <Button
                variant={searchMode === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('search')}
                className="h-8 text-xs ios-button touch-target"
              >
                <Search className="w-3 h-3 mr-1" />
                Database Search
              </Button>
            </div>

            {/* Search Input with Barcode Button */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {searchMode === 'ai' ? 'Describe your food (e.g., "2 slices pizza with pepperoni")' : 'Search food database'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder={searchMode === 'ai' ? "Large chicken breast with vegetables" : "Chicken breast"}
                  className="flex-1 h-9 text-sm ios-touch-feedback"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchMode === 'ai' ? handleAIAnalysis() : handleSearch();
                    }
                  }}
                />
                <Button
                  onClick={() => setShowBarcodeScanner(true)}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 ios-button touch-target"
                >
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={searchMode === 'ai' ? handleAIAnalysis : handleSearch}
              disabled={!foodQuery.trim() || isLoading}
              className="w-full h-9 ios-button touch-target"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : searchMode === 'ai' ? (
                <Brain className="w-4 h-4 mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {searchMode === 'ai' ? 'Analyze with AI' : 'Search Database'}
            </Button>

            {/* Filters for Database Search */}
            {searchMode === 'search' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any category</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Meal Type</Label>
                  <Select value={selectedMealSuitability} onValueChange={setSelectedMealSuitability}>
                    <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                      <SelectValue placeholder="Any meal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any meal</SelectItem>
                      {mealSuitabilityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchMutation.data && searchMode === 'search' && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Search Results</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchMutation.data.map((food: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => setSelectedFood(food)}
                      className={`p-2 border rounded-lg cursor-pointer transition-colors ios-touch-feedback touch-target ${
                        selectedFood?.name === food.name 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{food.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {Math.round(food.calories)}cal • {Math.round(food.protein)}g protein
                          </p>
                        </div>
                        {food.category && (
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {food.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Results */}
            {aiAnalyzeMutation.data && searchMode === 'ai' && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-xs font-medium text-blue-800 dark:text-blue-200">AI Analysis Result</Label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Calories</p>
                    <p className="font-bold">{Math.round(aiAnalyzeMutation.data.calories)}</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Protein</p>
                    <p className="font-bold text-blue-600">{Math.round(aiAnalyzeMutation.data.protein)}g</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Carbs</p>
                    <p className="font-bold text-orange-600">{Math.round(aiAnalyzeMutation.data.carbs)}g</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                    <p className="text-gray-600 dark:text-gray-400">Fat</p>
                    <p className="font-bold text-green-600">{Math.round(aiAnalyzeMutation.data.fat)}g</p>
                  </div>
                </div>
                {aiAnalyzeMutation.data.assumptions && (
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Assumptions:</p>
                    <p>{aiAnalyzeMutation.data.assumptions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Meal Selection */}
            {(selectedFood || (searchMode === 'ai' && aiAnalyzeMutation.data)) && (
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
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-8 text-xs ios-touch-feedback">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="serving">serving</SelectItem>
                        <SelectItem value="gram">gram</SelectItem>
                        <SelectItem value="ounce">ounce</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                      </SelectContent>
                    </Select>
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