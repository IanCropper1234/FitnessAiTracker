import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimezoneUtils } from "@shared/utils/timezone";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  ArrowLeft, 
  Home, 
  Search, 
  Scan, 
  Plus, 
  Clock,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Utensils,
  Star,
  Zap
} from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AddFoodProps {
  user: User;
}

export function AddFood({ user }: AddFoodProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState("g");
  const [mealType, setMealType] = useState("breakfast");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get current date for meal logging
  const currentDate = TimezoneUtils.getCurrentDate();

  // Get URL parameters for pre-selected meal type and date
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mealParam = urlParams.get('meal');
    const dateParam = urlParams.get('date');
    
    if (mealParam) {
      setMealType(mealParam);
    }
  }, []);

  // Food search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/food/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      return response.json();
    },
    enabled: searchQuery.trim().length > 2
  });

  // AI food analysis mutation
  const analyzeWithAIMutation = useMutation({
    mutationFn: async (description: string) => {
      setIsAnalyzing(true);
      const data = await apiRequest('POST', '/api/nutrition/ai-analysis', {
        description,
        quantity: parseFloat(quantity),
        unit
      });
      return data;
    },
    onSuccess: (data: any) => {
      setSelectedFood({
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        category: data.category || 'mixed',
        isAIAnalyzed: true,
        assumptions: data.assumptions,
        servingDetails: data.servingDetails
      });
      setIsAnalyzing(false);
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze food. Please try manual search.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
    }
  });

  // Add food mutation
  const addFoodMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFood) throw new Error("No food selected");
      
      return await apiRequest('POST', '/api/nutrition/log', {
        userId: user.id,
        date: currentDate,
        foodName: selectedFood.name,
        quantity: parseFloat(quantity),
        unit,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        mealType,
        category: selectedFood.category
      });
    },
    onSuccess: () => {
      // Invalidate nutrition queries
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      
      toast({
        title: "Food Added",
        description: `${selectedFood.name} added to ${mealType}`,
      });
      
      // Navigate back to nutrition page
      setLocation('/nutrition');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add food",
        variant: "destructive"
      });
    }
  });

  const handleFoodSelect = (food: any) => {
    setSelectedFood(food);
    setQuantity("100");
    setUnit("g");
  };

  const handleAIAnalyze = () => {
    if (searchQuery.trim()) {
      analyzeWithAIMutation.mutate(searchQuery);
    }
  };

  const handleAddFood = () => {
    if (selectedFood && quantity) {
      addFoodMutation.mutate();
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
      case 'snack': return <Apple className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const getRPCategory = (category: string) => {
    switch (category) {
      case 'protein':
        return { label: 'Protein Source', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
      case 'carb':
        return { label: 'Carb Source', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' };
      case 'fat':
        return { label: 'Fat Source', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
      case 'mixed':
        return { label: 'Mixed Source', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' };
      default:
        return { label: 'Food', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container">
      <div className="container mx-auto p-4 space-y-4">
        {/* Ultra-Compact Header */}
        <div className="h-11 flex items-center justify-between px-1 ios-smooth-transform">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/nutrition')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Plus className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground">Add Food</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {/* Meal Type Selection */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add to Meal</Label>
              <div className="grid grid-cols-2 gap-2">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <Button
                    key={type}
                    variant={mealType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMealType(type)}
                    className="justify-start h-9 ios-button touch-target"
                  >
                    {getMealTypeIcon(type)}
                    <span className="ml-2 capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="ios-smooth-transform">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Search or Describe Food</Label>
              
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="e.g., grilled chicken breast, large apple..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 ios-touch-feedback"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3 ios-button touch-target"
                  disabled
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Analysis Button */}
              {searchQuery.trim() && (
                <Button
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-9 ios-button touch-target"
                >
                  {isAnalyzing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Search Results</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((food: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleFoodSelect(food)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ios-button touch-target"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{food.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(food.calories)} cal • {Math.round(food.protein)}g protein
                          </div>
                        </div>
                        {food.category && (
                          <Badge className={`ml-2 text-xs ${getRPCategory(food.category).color}`}>
                            {getRPCategory(food.category).label}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Food Details */}
        {selectedFood && (
          <Card className="ios-smooth-transform">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Selected Food</Label>
                  {selectedFood.isAIAnalyzed && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      <Star className="w-3 h-3 mr-1" />
                      AI Analyzed
                    </Badge>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <h3 className="font-medium text-sm mb-2">{selectedFood.name}</h3>
                  
                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Quantity</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Unit</Label>
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">grams</SelectItem>
                          <SelectItem value="oz">ounces</SelectItem>
                          <SelectItem value="cup">cups</SelectItem>
                          <SelectItem value="piece">pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nutrition Preview */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                      <div className="font-semibold text-sm">{Math.round(selectedFood.calories * parseFloat(quantity || "1") / 100)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                      <div className="font-semibold text-sm text-blue-600">{Math.round(selectedFood.protein * parseFloat(quantity || "1") / 100)}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Carbs</div>
                      <div className="font-semibold text-sm text-orange-600">{Math.round(selectedFood.carbs * parseFloat(quantity || "1") / 100)}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Fat</div>
                      <div className="font-semibold text-sm text-green-600">{Math.round(selectedFood.fat * parseFloat(quantity || "1") / 100)}g</div>
                    </div>
                  </div>

                  {/* AI Analysis Details */}
                  {selectedFood.isAIAnalyzed && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                      {selectedFood.servingDetails && (
                        <div className="mb-1">
                          <span className="font-medium">Serving:</span> {selectedFood.servingDetails}
                        </div>
                      )}
                      {selectedFood.assumptions && (
                        <div>
                          <span className="font-medium">Assumptions:</span> {selectedFood.assumptions}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Button */}
        {selectedFood && (
          <Button
            onClick={handleAddFood}
            disabled={addFoodMutation.isPending || !quantity}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 ios-button touch-target"
          >
            {addFoodMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}