import { db } from "../db";
import { nutritionLogs, mealPlans, foodItems } from "../../shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

interface ShoppingListItem {
  foodName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCost?: number;
  macroContribution: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
}

interface ShoppingListGroup {
  category: string;
  items: ShoppingListItem[];
  totalItems: number;
  estimatedCost: number;
}

export class ShoppingListGenerator {
  // Generate shopping list from meal plans
  static async generateFromMealPlans(userId: number, startDate: string, endDate: string): Promise<ShoppingListGroup[]> {
    try {
      // Get all nutrition logs for the date range to understand eating patterns
      const logs = await db.select()
        .from(nutritionLogs)
        .where(and(
          eq(nutritionLogs.userId, userId),
          gte(nutritionLogs.date, new Date(startDate)),
          lte(nutritionLogs.date, new Date(endDate))
        ));

      // Group foods by category and aggregate quantities
      const foodGroups: Record<string, Record<string, ShoppingListItem>> = {};

      for (const log of logs) {
        const category = log.category || 'Other';
        const foodName = log.foodName;
        const quantity = parseFloat(log.quantity);
        const unit = log.unit;

        if (!foodGroups[category]) {
          foodGroups[category] = {};
        }

        if (!foodGroups[category][foodName]) {
          foodGroups[category][foodName] = {
            foodName,
            category,
            totalQuantity: 0,
            unit,
            macroContribution: {
              protein: 0,
              carbs: 0,
              fat: 0,
              calories: 0
            }
          };
        }

        // Aggregate quantities and macros
        foodGroups[category][foodName].totalQuantity += quantity;
        foodGroups[category][foodName].macroContribution.protein += parseFloat(log.protein);
        foodGroups[category][foodName].macroContribution.carbs += parseFloat(log.carbs);
        foodGroups[category][foodName].macroContribution.fat += parseFloat(log.fat);
        foodGroups[category][foodName].macroContribution.calories += parseFloat(log.calories);
      }

      // Convert to shopping list groups with RP categorization
      const shoppingList: ShoppingListGroup[] = [];

      for (const [category, foods] of Object.entries(foodGroups)) {
        const items = Object.values(foods);
        
        const group: ShoppingListGroup = {
          category: this.getRPCategory(category),
          items: items.sort((a, b) => a.foodName.localeCompare(b.foodName)),
          totalItems: items.length,
          estimatedCost: this.estimateCategoryCost(items)
        };

        shoppingList.push(group);
      }

      return shoppingList.sort((a, b) => this.getCategoryPriority(a.category) - this.getCategoryPriority(b.category));
    } catch (error) {
      console.error('Error generating shopping list:', error);
      throw error;
    }
  }

  // Generate optimized shopping list with RP recommendations
  static async generateOptimizedList(userId: number, dietGoals: any): Promise<ShoppingListGroup[]> {
    try {
      // Get user's current diet goals to recommend optimal foods
      const { targetProtein, targetCarbs, targetFat } = dietGoals;

      // Calculate ideal food recommendations based on RP methodology
      const recommendations = this.getOptimalFoodRecommendations(
        parseFloat(targetProtein),
        parseFloat(targetCarbs), 
        parseFloat(targetFat)
      );

      // Group recommendations by category
      const optimizedList: ShoppingListGroup[] = [
        {
          category: "Protein Sources",
          items: recommendations.protein,
          totalItems: recommendations.protein.length,
          estimatedCost: this.estimateCategoryCost(recommendations.protein)
        },
        {
          category: "Carb Sources", 
          items: recommendations.carbs,
          totalItems: recommendations.carbs.length,
          estimatedCost: this.estimateCategoryCost(recommendations.carbs)
        },
        {
          category: "Fat Sources",
          items: recommendations.fats,
          totalItems: recommendations.fats.length,
          estimatedCost: this.estimateCategoryCost(recommendations.fats)
        },
        {
          category: "Vegetables & Micronutrients",
          items: recommendations.vegetables,
          totalItems: recommendations.vegetables.length,
          estimatedCost: this.estimateCategoryCost(recommendations.vegetables)
        }
      ];

      return optimizedList;
    } catch (error) {
      console.error('Error generating optimized shopping list:', error);
      throw error;
    }
  }

  // Get optimal food recommendations based on RP methodology
  private static getOptimalFoodRecommendations(targetProtein: number, targetCarbs: number, targetFat: number) {
    const proteinSources: ShoppingListItem[] = [
      {
        foodName: "Chicken Breast",
        category: "Protein Sources",
        totalQuantity: Math.ceil((targetProtein * 7) / 25), // 25g protein per 100g
        unit: "kg",
        estimatedCost: 12,
        macroContribution: { protein: targetProtein * 0.4, carbs: 0, fat: 2, calories: targetProtein * 4 * 0.4 }
      },
      {
        foodName: "Greek Yogurt (0% Fat)",
        category: "Protein Sources", 
        totalQuantity: Math.ceil((targetProtein * 3.5) / 10), // 10g protein per 100g
        unit: "kg",
        estimatedCost: 8,
        macroContribution: { protein: targetProtein * 0.3, carbs: 4, fat: 0, calories: targetProtein * 4 * 0.3 }
      },
      {
        foodName: "Whey Protein Powder",
        category: "Protein Sources",
        totalQuantity: 1,
        unit: "kg",
        estimatedCost: 45,
        macroContribution: { protein: targetProtein * 0.3, carbs: 2, fat: 1, calories: targetProtein * 4 * 0.3 }
      }
    ];

    const carbSources: ShoppingListItem[] = [
      {
        foodName: "Jasmine Rice",
        category: "Carb Sources",
        totalQuantity: Math.ceil((targetCarbs * 7) / 80), // 80g carbs per 100g dry
        unit: "kg", 
        estimatedCost: 3,
        macroContribution: { protein: 8, carbs: targetCarbs * 0.5, fat: 1, calories: targetCarbs * 4 * 0.5 }
      },
      {
        foodName: "Sweet Potatoes",
        category: "Carb Sources",
        totalQuantity: Math.ceil((targetCarbs * 3.5) / 20), // 20g carbs per 100g
        unit: "kg",
        estimatedCost: 4,
        macroContribution: { protein: 2, carbs: targetCarbs * 0.3, fat: 0, calories: targetCarbs * 4 * 0.3 }
      },
      {
        foodName: "Bananas",
        category: "Carb Sources",
        totalQuantity: Math.ceil((targetCarbs * 1.4) / 23), // 23g carbs per 100g
        unit: "kg",
        estimatedCost: 2,
        macroContribution: { protein: 1, carbs: targetCarbs * 0.2, fat: 0, calories: targetCarbs * 4 * 0.2 }
      }
    ];

    const fatSources: ShoppingListItem[] = [
      {
        foodName: "Extra Virgin Olive Oil",
        category: "Fat Sources",
        totalQuantity: Math.ceil((targetFat * 7) / 100) / 10, // 100g fat per 100ml, convert to liters
        unit: "L",
        estimatedCost: 15,
        macroContribution: { protein: 0, carbs: 0, fat: targetFat * 0.4, calories: targetFat * 9 * 0.4 }
      },
      {
        foodName: "Almonds",
        category: "Fat Sources",
        totalQuantity: Math.ceil((targetFat * 3.5) / 50), // 50g fat per 100g
        unit: "kg",
        estimatedCost: 20,
        macroContribution: { protein: 21, carbs: 9, fat: targetFat * 0.4, calories: targetFat * 9 * 0.4 }
      },
      {
        foodName: "Avocados",
        category: "Fat Sources", 
        totalQuantity: Math.ceil((targetFat * 1.4) / 15), // 15g fat per 100g
        unit: "pieces",
        estimatedCost: 8,
        macroContribution: { protein: 2, carbs: 2, fat: targetFat * 0.2, calories: targetFat * 9 * 0.2 }
      }
    ];

    const vegetables: ShoppingListItem[] = [
      {
        foodName: "Broccoli",
        category: "Vegetables & Micronutrients",
        totalQuantity: 1,
        unit: "kg",
        estimatedCost: 4,
        macroContribution: { protein: 3, carbs: 7, fat: 0, calories: 40 }
      },
      {
        foodName: "Spinach",
        category: "Vegetables & Micronutrients",
        totalQuantity: 0.5,
        unit: "kg",
        estimatedCost: 3,
        macroContribution: { protein: 3, carbs: 4, fat: 0, calories: 28 }
      },
      {
        foodName: "Bell Peppers (Mixed)",
        category: "Vegetables & Micronutrients",
        totalQuantity: 1,
        unit: "kg",
        estimatedCost: 6,
        macroContribution: { protein: 1, carbs: 6, fat: 0, calories: 28 }
      }
    ];

    return {
      protein: proteinSources,
      carbs: carbSources,
      fats: fatSources,
      vegetables
    };
  }

  // Map food categories to RP methodology categories
  private static getRPCategory(category: string): string {
    const rpMapping: Record<string, string> = {
      'protein': 'Protein Sources',
      'carb': 'Carb Sources', 
      'fat': 'Fat Sources',
      'mixed': 'Mixed Foods',
      'vegetable': 'Vegetables & Micronutrients',
      'fruit': 'Carb Sources',
      'dairy': 'Protein Sources',
      'grain': 'Carb Sources',
      'nut': 'Fat Sources',
      'oil': 'Fat Sources'
    };

    return rpMapping[category.toLowerCase()] || 'Other';
  }

  // Estimate category cost (placeholder implementation)
  private static estimateCategoryCost(items: ShoppingListItem[]): number {
    return items.reduce((total, item) => total + (item.estimatedCost || 5), 0);
  }

  // Get category priority for sorting (protein first, then carbs, fats, vegetables)
  private static getCategoryPriority(category: string): number {
    const priorities: Record<string, number> = {
      'Protein Sources': 1,
      'Carb Sources': 2,
      'Fat Sources': 3,
      'Vegetables & Micronutrients': 4,
      'Mixed Foods': 5,
      'Other': 6
    };

    return priorities[category] || 7;
  }
}