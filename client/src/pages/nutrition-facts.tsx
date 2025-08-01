import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NutritionFactsPageProps {}

const NutritionFactsPage: React.FC<NutritionFactsPageProps> = () => {
  const [, setLocation] = useLocation();
  
  // Get nutrition item data from URL params or localStorage
  const getSelectedNutritionItem = () => {
    try {
      const storedItem = localStorage.getItem('selectedNutritionItem');
      return storedItem ? JSON.parse(storedItem) : null;
    } catch {
      return null;
    }
  };

  const selectedNutritionItem = getSelectedNutritionItem();

  const getRPCategory = (category: string) => {
    const categories = {
      protein: { label: "Protein Source", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
      carb: { label: "Carb Source", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
      fat: { label: "Fat Source", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
      mixed: { label: "Mixed Macros", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
      other: { label: "Other", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" }
    };
    return categories[category as keyof typeof categories] || categories.other;
  };

  // Format numeric values for display
  const formatNutrientValue = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '0';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0';
    
    // For very small values (< 0.1), show 2 decimal places
    if (numValue < 0.1 && numValue > 0) {
      return numValue.toFixed(2);
    }
    // For small values (< 1), show 1 decimal place
    else if (numValue < 1) {
      return numValue.toFixed(1);
    }
    // For larger values, round to whole numbers
    else {
      return Math.round(numValue).toString();
    }
  };

  const handleGoBack = () => {
    // Clear stored item and go back to nutrition page
    localStorage.removeItem('selectedNutritionItem');
    setLocation('/nutrition');
  };

  if (!selectedNutritionItem) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleGoBack}
              className="ios-button touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-black dark:text-white">Nutrition Facts</h1>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No nutrition item selected</p>
            <Button 
              onClick={handleGoBack}
              className="mt-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Back to Nutrition
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-md mx-auto p-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleGoBack}
            className="ios-button touch-target"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-black dark:text-white">Nutrition Facts</h1>
        </div>

        {/* Nutrition Facts Content */}
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
          <div className="bg-gray-50 dark:bg-gray-800  p-4 space-y-3">
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
              <div className="w-full bg-gray-200 dark:bg-gray-700  h-2">
                <div 
                  className="bg-blue-500 h-2 " 
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
              <div className="w-full bg-gray-200 dark:bg-gray-700  h-2">
                <div 
                  className="bg-green-500 h-2 " 
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
              <div className="w-full bg-gray-200 dark:bg-gray-700  h-2">
                <div 
                  className="bg-yellow-500 h-2 " 
                  style={{ 
                    width: `${Math.min(100, (selectedNutritionItem.fat * 9 / selectedNutritionItem.calories) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Calorie Breakdown */}
            <div className="bg-white dark:bg-gray-900  p-3 mt-4">
              <h4 className="font-medium text-black dark:text-white mb-2 text-sm">Calorie Breakdown</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-blue-600 dark:text-blue-400 font-semibold">
                    {Math.round(selectedNutritionItem.protein * 4)} Cal
                  </div>
                  <div className="text-gray-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 dark:text-green-400 font-semibold">
                    {Math.round(selectedNutritionItem.carbs * 4)} Cal
                  </div>
                  <div className="text-gray-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                    {Math.round(selectedNutritionItem.fat * 9)} Cal
                  </div>
                  <div className="text-gray-500">Fat</div>
                </div>
              </div>
            </div>

            {/* Micronutrients Section - Only show if data exists */}
            {selectedNutritionItem.micronutrients && (
              <div className="bg-white dark:bg-gray-900  p-3 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-black dark:text-white text-sm">Micronutrients</h4>
                  <Badge variant="outline" className="text-xs">
                    AI Analysis
                  </Badge>
                </div>
                
                {/* Fat-Soluble Vitamins */}
                {selectedNutritionItem.micronutrients.vitaminA || 
                 selectedNutritionItem.micronutrients.vitaminD || 
                 selectedNutritionItem.micronutrients.vitaminE || 
                 selectedNutritionItem.micronutrients.vitaminK ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">Fat-Soluble Vitamins</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedNutritionItem.micronutrients.vitaminA && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin A</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminA)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminD && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin D</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminD)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminE && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin E</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminE)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminK && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin K</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminK)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Water-Soluble Vitamins */}
                {selectedNutritionItem.micronutrients.vitaminC || 
                 selectedNutritionItem.micronutrients.vitaminB1 || 
                 selectedNutritionItem.micronutrients.vitaminB2 ||
                 selectedNutritionItem.micronutrients.vitaminB3 ||
                 selectedNutritionItem.micronutrients.vitaminB6 ||
                 selectedNutritionItem.micronutrients.vitaminB12 ||
                 selectedNutritionItem.micronutrients.folate ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Water-Soluble Vitamins</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedNutritionItem.micronutrients.vitaminC && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin C</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminC)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminB1 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B1 (Thiamine)</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminB1)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminB2 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B2 (Riboflavin)</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminB2)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminB3 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B3 (Niacin)</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminB3)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminB6 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B6 (Pyridoxine)</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminB6)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.vitaminB12 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B12 (Cobalamin)</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.vitaminB12)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.folate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Folate</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.folate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Major Minerals */}
                {selectedNutritionItem.micronutrients.calcium || 
                 selectedNutritionItem.micronutrients.magnesium || 
                 selectedNutritionItem.micronutrients.phosphorus ||
                 selectedNutritionItem.micronutrients.potassium ||
                 selectedNutritionItem.micronutrients.sodium ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Major Minerals</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedNutritionItem.micronutrients.calcium && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Calcium</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.calcium)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.magnesium && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Magnesium</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.magnesium)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.phosphorus && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phosphorus</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.phosphorus)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.potassium && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Potassium</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.potassium)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.sodium && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Sodium</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.sodium)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Trace Minerals */}
                {selectedNutritionItem.micronutrients.iron || 
                 selectedNutritionItem.micronutrients.zinc || 
                 selectedNutritionItem.micronutrients.copper ||
                 selectedNutritionItem.micronutrients.manganese ||
                 selectedNutritionItem.micronutrients.iodine ||
                 selectedNutritionItem.micronutrients.selenium ? (
                  <div>
                    <h5 className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">Trace Minerals</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedNutritionItem.micronutrients.iron && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Iron</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.iron)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.zinc && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Zinc</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.zinc)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.copper && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Copper</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.copper)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.manganese && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Manganese</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.manganese)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.iodine && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Iodine</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.iodine)}</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.selenium && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Selenium</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.selenium)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Macronutrient Components */}
                {(selectedNutritionItem.micronutrients.sugar !== null && selectedNutritionItem.micronutrients.sugar !== undefined) || 
                 (selectedNutritionItem.micronutrients.fiber !== null && selectedNutritionItem.micronutrients.fiber !== undefined) || 
                 (selectedNutritionItem.micronutrients.saturatedFat !== null && selectedNutritionItem.micronutrients.saturatedFat !== undefined) ||
                 (selectedNutritionItem.micronutrients.cholesterol !== null && selectedNutritionItem.micronutrients.cholesterol !== undefined) ||
                 (selectedNutritionItem.micronutrients.monounsaturatedFat !== null && selectedNutritionItem.micronutrients.monounsaturatedFat !== undefined) ||
                 (selectedNutritionItem.micronutrients.polyunsaturatedFat !== null && selectedNutritionItem.micronutrients.polyunsaturatedFat !== undefined) ? (
                  <div className="mt-[10px] mb-[10px]">
                    <h5 className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-2">Macronutrient Components</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedNutritionItem.micronutrients.sugar !== null && selectedNutritionItem.micronutrients.sugar !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Sugar</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.sugar)}g</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.fiber !== null && selectedNutritionItem.micronutrients.fiber !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Dietary Fiber</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.fiber)}g</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.saturatedFat !== null && selectedNutritionItem.micronutrients.saturatedFat !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Saturated Fat</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.saturatedFat)}g</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.cholesterol !== null && selectedNutritionItem.micronutrients.cholesterol !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Cholesterol</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.cholesterol)}mg</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.monounsaturatedFat !== null && selectedNutritionItem.micronutrients.monounsaturatedFat !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Monounsat. Fat</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.monounsaturatedFat)}g</span>
                        </div>
                      )}
                      {selectedNutritionItem.micronutrients.polyunsaturatedFat !== null && selectedNutritionItem.micronutrients.polyunsaturatedFat !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Polyunsat. Fat</span>
                          <span className="font-medium">{formatNutrientValue(selectedNutritionItem.micronutrients.polyunsaturatedFat)}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

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
      </div>
    </div>
  );
};

export default NutritionFactsPage;