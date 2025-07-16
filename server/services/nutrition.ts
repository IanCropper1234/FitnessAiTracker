import { storage } from "../storage";
import { analyzeNutrition, calculateMacros } from "./openai";
import type { InsertNutritionLog, InsertNutritionGoal } from "@shared/schema";

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  adherence: number;
}

export async function getNutritionSummary(userId: number, date: Date): Promise<NutritionSummary> {
  const logs = await storage.getNutritionLogs(userId, date);
  const goal = await storage.getNutritionGoal(userId);

  const totals = logs.reduce((acc, log) => ({
    totalCalories: acc.totalCalories + Number(log.calories),
    totalProtein: acc.totalProtein + Number(log.protein),
    totalCarbs: acc.totalCarbs + Number(log.carbs),
    totalFat: acc.totalFat + Number(log.fat),
  }), {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });

  const goalCalories = goal?.dailyCalories || 2000;
  const goalProtein = Number(goal?.protein) || 150;
  const goalCarbs = Number(goal?.carbs) || 200;
  const goalFat = Number(goal?.fat) || 70;

  const adherence = Math.min(100, Math.round((totals.totalCalories / goalCalories) * 100));

  return {
    ...totals,
    goalCalories,
    goalProtein,
    goalCarbs,
    goalFat,
    adherence,
  };
}

export async function logFood(
  userId: number,
  foodName: string,
  quantity: number,
  unit: string,
  mealType?: string
): Promise<any> {
  try {
    const nutrition = await analyzeNutrition(foodName, quantity, unit);
    
    const logData: InsertNutritionLog = {
      userId,
      date: new Date(),
      foodName,
      quantity: quantity.toString(),
      unit,
      calories: nutrition.calories.toString(),
      protein: nutrition.protein.toString(),
      carbs: nutrition.carbs.toString(),
      fat: nutrition.fat.toString(),
      mealType,
    };

    return await storage.createNutritionLog(logData);
  } catch (error) {
    throw new Error(`Failed to log food: ${error.message}`);
  }
}

export async function generateNutritionGoal(
  userId: number,
  weight: number,
  height: number,
  age: number,
  activityLevel: string,
  goal: string
): Promise<any> {
  try {
    const macros = await calculateMacros(weight, height, age, activityLevel, goal);
    
    const goalData: InsertNutritionGoal = {
      userId,
      dailyCalories: macros.dailyCalories,
      protein: macros.protein.toString(),
      carbs: macros.carbs.toString(),
      fat: macros.fat.toString(),
    };

    return await storage.createNutritionGoal(goalData);
  } catch (error) {
    throw new Error(`Failed to generate nutrition goal: ${error.message}`);
  }
}

export async function searchFood(query: string): Promise<any[]> {
  // Mock food database search - in production this would search a real database
  const mockFoods = [
    { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: "Brown Rice", calories: 111, protein: 2.6, carbs: 22, fat: 0.9 },
    { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    { name: "Salmon", calories: 208, protein: 22, carbs: 0, fat: 12 },
    { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
    { name: "Almonds", calories: 576, protein: 21, carbs: 22, fat: 49 },
    { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    { name: "Oatmeal", calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
    { name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  ];

  return mockFoods.filter(food => 
    food.name.toLowerCase().includes(query.toLowerCase())
  );
}
