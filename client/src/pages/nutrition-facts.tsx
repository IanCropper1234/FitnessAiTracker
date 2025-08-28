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
  const formatNutrientValue = (value: any): string | null => {
    if (value === null || value === undefined || value === '') return null;
    
    // Handle object format {value: number, unit?: string}
    let numValue: number;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      numValue = typeof value.value === 'string' ? parseFloat(value.value) : value.value;
    } else {
      numValue = typeof value === 'string' ? parseFloat(value) : value;
    }
    
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
    
    // Handle object format {value: number, unit?: string}
    let numValue: number;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      numValue = typeof value.value === 'string' ? parseFloat(value.value) : value.value;
    } else {
      numValue = typeof value === 'string' ? parseFloat(value) : value;
    }
    
    return !isNaN(numValue) && numValue > 0;
  };

  // Helper function to get nutrient value from grouped micronutrients structure
  const getNutrientValue = (nutrientName: string): any => {
    if (!selectedNutritionItem.micronutrients) return null;
    
    // Check if micronutrients is grouped by categories
    if (selectedNutritionItem.micronutrients['Fat-Soluble Vitamins'] || 
        selectedNutritionItem.micronutrients['Water-Soluble Vitamins'] || 
        selectedNutritionItem.micronutrients['Major Minerals']) {
      
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
          return selectedNutritionItem.micronutrients[category][nutrientName];
        }
      }
      return null;
    } else {
      // Flat structure - direct access
      return selectedNutritionItem.micronutrients[nutrientName];
    }
  };

  // Format nutrient names for display (remove _mg, _mcg, _g suffixes and format properly)
  const formatNutrientDisplayName = (nutrientName: string): string => {
    // Remove common suffixes
    let cleanName = nutrientName
      .replace(/_mg$|_mcg$|_g$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Handle special cases
    const nameMap: Record<string, string> = {
      'Vitamin A': 'Vitamin A',
      'Vitamin D': 'Vitamin D',
      'Vitamin E': 'Vitamin E',
      'Vitamin K': 'Vitamin K',
      'Vitamin C': 'Vitamin C',
      'Vitamin B1': 'Vitamin B1',
      'Vitamin B2': 'Vitamin B2',
      'Vitamin B3': 'Vitamin B3',
      'Vitamin B5': 'Vitamin B5',
      'Vitamin B6': 'Vitamin B6',
      'Vitamin B7': 'Vitamin B7',
      'Vitamin B9': 'Vitamin B9',
      'Vitamin B12': 'Vitamin B12',
      'Folate': 'Folate',
      'Potassium': 'Potassium',
      'Phosphorus': 'Phosphorus',
      'Magnesium': 'Magnesium',
      'Calcium': 'Calcium',
      'Sodium': 'Sodium',
      'Chloride': 'Chloride',
      'Iron': 'Iron',
      'Zinc': 'Zinc',
      'Copper': 'Copper',
      'Manganese': 'Manganese',
      'Iodine': 'Iodine',
      'Selenium': 'Selenium',
      'Chromium': 'Chromium',
      'Molybdenum': 'Molybdenum',
      'Fluoride': 'Fluoride',
      'Fiber': 'Fiber',
      'Sugar': 'Sugar',
      'Omega3': 'Omega-3',
      'Omega6': 'Omega-6'
    };
    
    return nameMap[cleanName] || cleanName;
  };

  // Get appropriate unit for nutrients based on their type
  const getNutrientUnit = (nutrientName: string, value: any): string => {
    // If value is an object with unit, use that (highest priority)
    if (typeof value === 'object' && value !== null && value.unit) {
      return value.unit;
    }
    
    // Clean the nutrient name for unit determination
    const cleanName = nutrientName.replace(/_mg$|_mcg$|_g$/, '').toLowerCase();
    
    // Nutrients that should be in grams
    const gramsNutrients = ['fiber', 'sugar', 'addedsugar', 'omega3', 'omega6', 'saturatedfat', 'monounsaturatedfat', 'polyunsaturatedfat', 'transfat', 'starch', 'alcohol'];
    
    // Nutrients that should be in micrograms
    const microgramNutrients = ['vitamina', 'vitamind', 'vitaminb7', 'vitaminb9', 'vitaminb12', 'vitaminK', 'folate', 'iodine', 'selenium', 'chromium', 'molybdenum', 'biotin'];
    
    // Special cases based on AI interface definitions
    if (cleanName === 'cholesterol') return 'mg'; // cholesterol is mg according to AI interface
    if (gramsNutrients.includes(cleanName)) {
      return 'g';
    } else if (microgramNutrients.includes(cleanName)) {
      return 'mcg';
    } else {
      return 'mg'; // Default for most minerals and vitamins
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
                
                {/* Debug: Show actual micronutrient data structure */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mb-3">
                    <summary className="text-xs text-gray-500 cursor-pointer">Debug: Show raw micronutrient data</summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 mt-2 overflow-auto max-h-40">
                      {JSON.stringify(selectedNutritionItem.micronutrients, null, 2)}
                    </pre>
                  </details>
                )}
                
                {/* Dynamic micronutrient rendering - handle any structure */}
                {selectedNutritionItem.micronutrients && Object.keys(selectedNutritionItem.micronutrients).length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(selectedNutritionItem.micronutrients).map(([category, nutrients]) => {
                      if (!nutrients || typeof nutrients !== 'object') return null;
                      
                      const validNutrients = Object.entries(nutrients as Record<string, any>)
                        .filter(([_, value]) => hasValidValue(value))
                        .slice(0, 20); // Limit to first 20 for readability
                      
                      if (validNutrients.length === 0) return null;
                      
                      return (
                        <div key={category} className="mb-3">
                          <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h5>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {validNutrients.map(([nutrientName, value]) => (
                              <div key={nutrientName} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatNutrientDisplayName(nutrientName)}
                                </span>
                                <span className="font-medium">
                                  {formatNutrientValue(value)}{getNutrientUnit(nutrientName, value)}
                                  {process.env.NODE_ENV === 'development' && nutrientName.toLowerCase().includes('vitamink') && (
                                    <span className="text-xs text-red-500 ml-1">
                                      (Debug: {JSON.stringify(value)})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Legacy static vitamin display - kept as fallback */}
                {!selectedNutritionItem.micronutrients || Object.keys(selectedNutritionItem.micronutrients).length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p className="text-xs">No micronutrient data available</p>
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