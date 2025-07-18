import { db } from '../db';
import { weeklyNutritionGoals, mealMacroDistribution, macroFlexibilityRules, dietGoals, nutritionLogs } from '../../shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export class AdvancedMacroManagementService {
  
  // Calculate weekly progress and recommend adjustments
  static async calculateWeeklyAdjustment(userId: number, weekStartDate: string) {
    try {
      // Get current diet goals
      const currentGoals = await db.select()
        .from(dietGoals)
        .where(eq(dietGoals.userId, userId))
        .orderBy(desc(dietGoals.createdAt))
        .limit(1);

      if (currentGoals.length === 0) {
        throw new Error('No diet goals found');
      }

      const currentGoal = currentGoals[0];
      
      // Get nutrition logs for the past week
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weeklyLogs = await db.select()
        .from(nutritionLogs)
        .where(and(
          eq(nutritionLogs.userId, userId),
          gte(nutritionLogs.date, weekStart),
          lte(nutritionLogs.date, weekEnd)
        ));

      // Calculate adherence percentage
      const dailyTotals = this.calculateDailyTotals(weeklyLogs);
      const adherencePercentage = this.calculateAdherence(dailyTotals, currentGoal);

      // Get previous week's weight (if available)
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      
      const previousWeekGoals = await db.select()
        .from(weeklyNutritionGoals)
        .where(and(
          eq(weeklyNutritionGoals.userId, userId),
          gte(weeklyNutritionGoals.weekStartDate, previousWeekStart)
        ))
        .orderBy(desc(weeklyNutritionGoals.weekStartDate))
        .limit(1);

      // Determine adjustment based on RP methodology
      const adjustment = this.calculateRPAdjustment({
        currentGoals: currentGoal,
        adherencePercentage,
        weeklyLogs,
        previousWeekGoals: previousWeekGoals[0] || null
      });

      return {
        adherencePercentage,
        adjustment,
        currentGoals: currentGoal,
        weeklyLogs: weeklyLogs.length
      };

    } catch (error) {
      console.error('Error calculating weekly adjustment:', error);
      throw error;
    }
  }

  // Calculate daily totals from nutrition logs
  private static calculateDailyTotals(logs: any[]) {
    const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
    
    logs.forEach(log => {
      const date = log.date.toISOString().split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      dailyTotals[date].calories += parseFloat(log.calories);
      dailyTotals[date].protein += parseFloat(log.protein);
      dailyTotals[date].carbs += parseFloat(log.carbs);
      dailyTotals[date].fat += parseFloat(log.fat);
    });

    return dailyTotals;
  }

  // Calculate adherence percentage
  private static calculateAdherence(dailyTotals: any, targetGoals: any) {
    const days = Object.keys(dailyTotals);
    if (days.length === 0) return 0;

    const targetCalories = parseFloat(targetGoals.targetCalories);
    let adherenceSum = 0;

    days.forEach(date => {
      const actualCalories = dailyTotals[date].calories;
      const adherence = Math.max(0, 100 - Math.abs((actualCalories - targetCalories) / targetCalories * 100));
      adherenceSum += adherence;
    });

    return Math.round(adherenceSum / days.length);
  }

  // Calculate RP-based macro adjustment
  private static calculateRPAdjustment(data: any) {
    const { currentGoals, adherencePercentage } = data;
    const targetCalories = parseFloat(currentGoals.targetCalories);
    
    let adjustmentPercentage = 0;
    let adjustmentReason = 'maintain_current';

    // Only adjust if adherence is good (>80%)
    if (adherencePercentage < 80) {
      return {
        adjustmentPercentage: 0,
        adjustmentReason: 'low_adherence',
        newCalories: targetCalories,
        newProtein: parseFloat(currentGoals.targetProtein),
        newCarbs: parseFloat(currentGoals.targetCarbs),
        newFat: parseFloat(currentGoals.targetFat)
      };
    }

    // RP-based adjustment logic
    if (currentGoals.goal === 'cut') {
      // For cutting, reduce calories by 2-5% if progress stalls
      adjustmentPercentage = -3;
      adjustmentReason = 'progress_optimization';
    } else if (currentGoals.goal === 'bulk') {
      // For bulking, increase calories by 2-5% if weight gain is slow
      adjustmentPercentage = 3;
      adjustmentReason = 'growth_optimization';
    }

    const newCalories = Math.round(targetCalories * (1 + adjustmentPercentage / 100));
    const proteinPerCalorie = parseFloat(currentGoals.targetProtein) / targetCalories;
    const carbPerCalorie = parseFloat(currentGoals.targetCarbs) / targetCalories;
    const fatPerCalorie = parseFloat(currentGoals.targetFat) / targetCalories;

    return {
      adjustmentPercentage,
      adjustmentReason,
      newCalories,
      newProtein: Math.round(newCalories * proteinPerCalorie),
      newCarbs: Math.round(newCalories * carbPerCalorie),
      newFat: Math.round(newCalories * fatPerCalorie)
    };
  }

  // Create weekly nutrition goal entry
  static async createWeeklyGoal(data: any) {
    try {
      const weeklyGoal = await db.insert(weeklyNutritionGoals).values({
        userId: data.userId,
        weekStartDate: new Date(data.weekStartDate),
        dailyCalories: data.dailyCalories,
        protein: data.protein.toString(),
        carbs: data.carbs.toString(),
        fat: data.fat.toString(),
        adjustmentReason: data.adjustmentReason,
        previousWeight: data.previousWeight?.toString(),
        currentWeight: data.currentWeight?.toString(),
        adherencePercentage: data.adherencePercentage?.toString(),
        energyLevels: data.energyLevels,
        hungerLevels: data.hungerLevels,
        adjustmentPercentage: data.adjustmentPercentage?.toString()
      }).returning();

      return weeklyGoal[0];
    } catch (error) {
      console.error('Error creating weekly goal:', error);
      throw error;
    }
  }

  // Get weekly goals for a user
  static async getWeeklyGoals(userId: number, weekStartDate?: string) {
    try {
      let query = db.select()
        .from(weeklyNutritionGoals)
        .where(eq(weeklyNutritionGoals.userId, userId))
        .orderBy(desc(weeklyNutritionGoals.weekStartDate));

      if (weekStartDate) {
        // Convert weekStartDate to proper date format
        const weekStart = new Date(weekStartDate);
        if (isNaN(weekStart.getTime())) {
          console.error('Invalid weekStartDate:', weekStartDate);
          return [];
        }
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Week should be 7 days, so +6 from start
        
        query = query.where(and(
          eq(weeklyNutritionGoals.userId, userId),
          gte(weeklyNutritionGoals.weekStartDate, weekStart),
          lte(weeklyNutritionGoals.weekStartDate, weekEnd)
        ));
      }

      return await query.limit(10);
    } catch (error) {
      console.error('Error getting weekly goals:', error);
      return [];
    }
  }

  // Create meal macro distribution
  static async createMealDistribution(data: any) {
    try {
      const distribution = await db.insert(mealMacroDistribution).values({
        userId: data.userId,
        mealType: data.mealType,
        mealTiming: data.mealTiming,
        proteinPercentage: data.proteinPercentage?.toString(),
        carbPercentage: data.carbPercentage?.toString(),
        fatPercentage: data.fatPercentage?.toString(),
        caloriePercentage: data.caloriePercentage?.toString(),
        isActive: data.isActive ?? true
      }).returning();

      return distribution[0];
    } catch (error) {
      console.error('Error creating meal distribution:', error);
      throw error;
    }
  }

  // Get meal distributions for a user
  static async getMealDistributions(userId: number) {
    try {
      return await db.select()
        .from(mealMacroDistribution)
        .where(and(
          eq(mealMacroDistribution.userId, userId),
          eq(mealMacroDistribution.isActive, true)
        ));
    } catch (error) {
      console.error('Error getting meal distributions:', error);
      return [];
    }
  }

  // Create macro flexibility rule
  static async createFlexibilityRule(data: any) {
    try {
      const rule = await db.insert(macroFlexibilityRules).values({
        userId: data.userId,
        ruleName: data.ruleName,
        triggerDays: data.triggerDays,
        flexProtein: data.flexProtein?.toString(),
        flexCarbs: data.flexCarbs?.toString(),
        flexFat: data.flexFat?.toString(),
        compensationStrategy: data.compensationStrategy,
        isActive: data.isActive ?? true
      }).returning();

      return rule[0];
    } catch (error) {
      console.error('Error creating flexibility rule:', error);
      throw error;
    }
  }

  // Get flexibility rules for a user
  static async getFlexibilityRules(userId: number) {
    try {
      return await db.select()
        .from(macroFlexibilityRules)
        .where(and(
          eq(macroFlexibilityRules.userId, userId),
          eq(macroFlexibilityRules.isActive, true)
        ));
    } catch (error) {
      console.error('Error getting flexibility rules:', error);
      return [];
    }
  }
}