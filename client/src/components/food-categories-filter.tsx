import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Zap, Target, Coffee } from "lucide-react";

interface FoodCategoriesFilterProps {
  selectedCategory?: string;
  selectedMealType?: string;
  onCategoryChange: (category: string | undefined) => void;
  onMealTypeChange: (mealType: string | undefined) => void;
}

export function FoodCategoriesFilter({
  selectedCategory,
  selectedMealType,
  onCategoryChange,
  onMealTypeChange
}: FoodCategoriesFilterProps) {
  const macroCategories = [
    { id: "protein", name: "Protein", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", description: "High protein foods for muscle building" },
    { id: "carb", name: "Carbs", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", description: "Energy-providing carbohydrate sources" },
    { id: "fat", name: "Fats", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", description: "Healthy fat sources for hormones" },
    { id: "mixed", name: "Mixed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", description: "Balanced macro foods" }
  ];

  const mealTypes = [
    { id: "pre-workout", name: "Pre-Workout", icon: Zap, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", description: "Fast energy for training" },
    { id: "post-workout", name: "Post-Workout", icon: Target, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", description: "Recovery and muscle repair" },
    { id: "regular", name: "Regular Meals", icon: Utensils, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", description: "Main meals and balanced nutrition" },
    { id: "snack", name: "Snacks", icon: Coffee, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", description: "Between-meal options" }
  ];

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-black dark:text-white">
          RP Diet Coach Filters
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Filter foods by Renaissance Periodization methodology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Macro Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Macro Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(undefined)}
              className="text-xs"
            >
              All Categories
            </Button>
            {macroCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className="text-xs"
              >
                <Badge variant="secondary" className={`mr-2 ${category.color}`}>
                  {category.name}
                </Badge>
                <span className="hidden sm:inline">{category.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Meal Timing */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Meal Timing & Suitability
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedMealType ? "default" : "outline"}
              size="sm"
              onClick={() => onMealTypeChange(undefined)}
              className="text-xs"
            >
              All Meals
            </Button>
            {mealTypes.map((mealType) => {
              const Icon = mealType.icon;
              return (
                <Button
                  key={mealType.id}
                  variant={selectedMealType === mealType.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onMealTypeChange(mealType.id)}
                  className="text-xs"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  <Badge variant="secondary" className={`mr-2 ${mealType.color}`}>
                    {mealType.name}
                  </Badge>
                  <span className="hidden sm:inline">{mealType.description}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || selectedMealType) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20  border border-blue-200 dark:border-blue-800">
            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Active Filters:
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Category: {macroCategories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {selectedMealType && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Timing: {mealTypes.find(m => m.id === selectedMealType)?.name}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}