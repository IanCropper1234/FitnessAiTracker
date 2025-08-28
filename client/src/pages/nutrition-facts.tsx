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

  // Format numeric values for display - returns null for zero values to prevent display
  const formatNutrientValue = (value: number | string | null | undefined): string | null => {
    if (value === null || value === undefined || value === '') return null;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return null;
    
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

  // Helper function to check if a nutrient value is meaningful (> 0)
  const hasValidValue = (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(numValue) && numValue > 0;
  };

  // Helper function to get nutrient value from grouped micronutrients structure
  const getNutrientValue = (nutrientName: string): any => {
    if (!selectedNutritionItem.micronutrients) {
      console.log('No micronutrients data available in selectedNutritionItem');
      return null;
    }
    
    // Debug: Log micronutrients structure
    console.log('Micronutrients data structure:', selectedNutritionItem.micronutrients);
    console.log('Looking for nutrient:', nutrientName);
    
    // Check if micronutrients is grouped by categories
    if (selectedNutritionItem.micronutrients['Fat-Soluble Vitamins'] || 
        selectedNutritionItem.micronutrients['Water-Soluble Vitamins'] || 
        selectedNutritionItem.micronutrients['Major Minerals']) {
      
      console.log('Using grouped structure for micronutrients');
      // Grouped structure - search in all categories
      const categories = [
        'Fat-Soluble Vitamins',
        'Water-Soluble Vitamins', 
        'Major Minerals',
        'Trace Minerals',
        'Macronutrient Components',
        'Supplement Compounds'
      ];
      
      for (const category of categories) {
        if (selectedNutritionItem.micronutrients[category] && 
            selectedNutritionItem.micronutrients[category][nutrientName] !== undefined) {
          const value = selectedNutritionItem.micronutrients[category][nutrientName];
          console.log(`Found ${nutrientName} in ${category}:`, value);
          return value;
        }
      }
      console.log(`Nutrient ${nutrientName} not found in any category`);
      return null;
    } else {
      console.log('Using flat structure for micronutrients');
      // Flat structure - direct access
      const value = selectedNutritionItem.micronutrients[nutrientName];
      console.log(`Direct access result for ${nutrientName}:`, value);
      return value;
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
                {hasValidValue(getNutrientValue('vitaminA')) || 
                 hasValidValue(getNutrientValue('vitaminD')) || 
                 hasValidValue(getNutrientValue('vitaminE')) || 
                 hasValidValue(getNutrientValue('vitaminK')) ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">Fat-Soluble Vitamins</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {hasValidValue(getNutrientValue('vitaminA')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin A</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminA'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminD')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin D</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminD'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminE')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin E</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminE'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminK')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin K</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminK'))}mcg</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Water-Soluble Vitamins */}
                {hasValidValue(getNutrientValue('vitaminC')) || 
                 hasValidValue(getNutrientValue('vitaminB1')) || 
                 hasValidValue(getNutrientValue('vitaminB2')) ||
                 hasValidValue(getNutrientValue('vitaminB3')) ||
                 hasValidValue(getNutrientValue('vitaminB5')) ||
                 hasValidValue(getNutrientValue('vitaminB6')) ||
                 hasValidValue(getNutrientValue('vitaminB7')) ||
                 hasValidValue(getNutrientValue('vitaminB12')) ||
                 hasValidValue(getNutrientValue('folate')) ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Water-Soluble Vitamins</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {hasValidValue(getNutrientValue('vitaminC')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vitamin C</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminC'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB1')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B1 (Thiamine)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB1'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB2')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B2 (Riboflavin)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB2'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB3')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B3 (Niacin)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB3'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB6')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B6 (Pyridoxine)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB6'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB12')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B12 (Cobalamin)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB12'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('folate')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Folate</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('folate'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB5')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B5 (Pantothenic Acid)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB5'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('vitaminB7')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">B7 (Biotin)</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('vitaminB7'))}mcg</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Major Minerals */}
                {hasValidValue(getNutrientValue('calcium')) || 
                 hasValidValue(getNutrientValue('magnesium')) || 
                 hasValidValue(getNutrientValue('phosphorus')) ||
                 hasValidValue(getNutrientValue('potassium')) ||
                 hasValidValue(getNutrientValue('sodium')) ||
                 hasValidValue(getNutrientValue('chloride')) ? (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Major Minerals</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {hasValidValue(getNutrientValue('calcium')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Calcium</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('calcium'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('magnesium')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Magnesium</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('magnesium'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('phosphorus')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phosphorus</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('phosphorus'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('potassium')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Potassium</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('potassium'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('sodium')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Sodium</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('sodium'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('chloride')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Chloride</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('chloride'))}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Trace Minerals */}
                {hasValidValue(getNutrientValue('iron')) || 
                 hasValidValue(getNutrientValue('zinc')) || 
                 hasValidValue(getNutrientValue('copper')) ||
                 hasValidValue(getNutrientValue('manganese')) ||
                 hasValidValue(getNutrientValue('iodine')) ||
                 hasValidValue(getNutrientValue('selenium')) ||
                 hasValidValue(getNutrientValue('fluoride')) ? (
                  <div>
                    <h5 className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">Trace Minerals</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {hasValidValue(getNutrientValue('iron')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Iron</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('iron'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('zinc')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Zinc</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('zinc'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('copper')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Copper</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('copper'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('manganese')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Manganese</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('manganese'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('iodine')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Iodine</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('iodine'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('selenium')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Selenium</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('selenium'))}mcg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('fluoride')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Fluoride</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('fluoride'))}mg</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Macronutrient Components */}
                {hasValidValue(getNutrientValue('sugar')) || 
                 hasValidValue(getNutrientValue('addedSugar')) || 
                 hasValidValue(getNutrientValue('fiber')) || 
                 hasValidValue(getNutrientValue('saturatedFat')) ||
                 hasValidValue(getNutrientValue('transFat')) ||
                 hasValidValue(getNutrientValue('cholesterol')) ||
                 hasValidValue(getNutrientValue('monounsaturatedFat')) ||
                 hasValidValue(getNutrientValue('polyunsaturatedFat')) ||
                 hasValidValue(getNutrientValue('omega3')) ||
                 hasValidValue(getNutrientValue('omega6')) ? (
                  <div className="mt-[10px] mb-[10px]">
                    <h5 className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-2">Macronutrient Components</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {hasValidValue(getNutrientValue('sugar')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Sugar</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('sugar'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('fiber')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Dietary Fiber</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('fiber'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('saturatedFat')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Saturated Fat</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('saturatedFat'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('cholesterol')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Cholesterol</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('cholesterol'))}mg</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('monounsaturatedFat')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Monounsat. Fat</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('monounsaturatedFat'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('polyunsaturatedFat')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Polyunsat. Fat</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('polyunsaturatedFat'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('transFat')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Trans Fat</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('transFat'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('addedSugar')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Added Sugar</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('addedSugar'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('omega3')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Omega-3 FA</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('omega3'))}g</span>
                        </div>
                      )}
                      {hasValidValue(getNutrientValue('omega6')) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Omega-6 FA</span>
                          <span className="font-medium">{formatNutrientValue(getNutrientValue('omega6'))}g</span>
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