import { db } from '../db';
import { weeklyNutritionGoals, mealMacroDistribution, macroFlexibilityRules, dietGoals, nutritionLogs, bodyMetrics } from '../../shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { UnitConverter } from '../../shared/utils/unit-conversion';

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

  // Calculate adherence percentage using intelligent target detection
  private static calculateAdherence(dailyTotals: any, targetGoals: any) {
    const days = Object.keys(dailyTotals);
    if (days.length === 0) return 0;

    // Intelligently detect custom vs suggested target calories
    const getCurrentTargetCalories = () => {
      if (!targetGoals) return 2000;
      
      // When custom calories toggle is enabled, use custom values
      if (targetGoals.useCustomCalories && targetGoals.customTargetCalories) {
        return parseFloat(targetGoals.customTargetCalories);
      }
      
      // Otherwise use suggested values
      return parseFloat(targetGoals.targetCalories) || 2000;
    };

    const targetCalories = getCurrentTargetCalories();
    let adherenceSum = 0;

    days.forEach(date => {
      const actualCalories = dailyTotals[date].calories;
      const adherence = Math.max(0, 100 - Math.abs((actualCalories - targetCalories) / targetCalories * 100));
      adherenceSum += adherence;
    });

    return Math.round(adherenceSum / days.length);
  }

  // Calculate RP-based macro adjustment using intelligent target detection
  private static calculateRPAdjustment(data: any) {
    const { currentGoals, adherencePercentage } = data;
    
    // Intelligently detect current target calories (custom or suggested)
    const getCurrentTargetCalories = () => {
      if (!currentGoals) return 2000;
      
      // When custom calories toggle is enabled, use custom values
      if (currentGoals.useCustomCalories && currentGoals.customTargetCalories) {
        return parseFloat(currentGoals.customTargetCalories);
      }
      
      // Otherwise use suggested values
      return parseFloat(currentGoals.targetCalories) || 2000;
    };

    const targetCalories = getCurrentTargetCalories();
    
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

  // Calculate weekly nutrition summary from food logs with RP methodology
  static async calculateWeeklyNutritionFromLogs(userId: number, weekStartDate: string) {
    try {
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Get nutrition logs for the week
      const logs = await db.select()
        .from(nutritionLogs)
        .where(and(
          eq(nutritionLogs.userId, userId),
          gte(nutritionLogs.date, weekStart),
          lte(nutritionLogs.date, weekEnd)
        ));

      if (logs.length === 0) {
        return null;
      }

      // Calculate weekly totals and averages
      const totalCalories = logs.reduce((sum, log) => sum + (parseFloat(log.calories) || 0), 0);
      const totalProtein = logs.reduce((sum, log) => sum + (parseFloat(log.protein) || 0), 0);
      const totalCarbs = logs.reduce((sum, log) => sum + (parseFloat(log.carbs) || 0), 0);
      const totalFat = logs.reduce((sum, log) => sum + (parseFloat(log.fat) || 0), 0);

      const daysWithLogs = new Set(logs.map(log => log.date.toDateString())).size;
      const avgCalories = totalCalories / Math.max(daysWithLogs, 1);
      const avgProtein = totalProtein / Math.max(daysWithLogs, 1);

      // Get user's diet goals for adherence calculation
      const dietGoalsData = await db.select().from(dietGoals).where(eq(dietGoals.userId, userId)).limit(1);
      let adherencePercentage = 0;
      let currentDietGoal = null;

      if (dietGoalsData.length > 0) {
        currentDietGoal = dietGoalsData[0];
        const targetCalories = parseFloat(currentDietGoal.targetCalories);
        adherencePercentage = targetCalories > 0 ? Math.min((avgCalories / targetCalories) * 100, 200) : 0;
      }

      // Get weight data for RP analysis (current week and previous week)
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      const [currentWeekWeight, previousWeekWeight] = await Promise.all([
        // Current week weight (latest entry in the week)
        db.select()
          .from(bodyMetrics)
          .where(and(
            eq(bodyMetrics.userId, userId),
            gte(bodyMetrics.date, weekStart),
            lte(bodyMetrics.date, weekEnd)
          ))
          .orderBy(desc(bodyMetrics.date))
          .limit(1),
        
        // Previous week weight (latest entry from previous week)
        db.select()
          .from(bodyMetrics)
          .where(and(
            eq(bodyMetrics.userId, userId),
            gte(bodyMetrics.date, previousWeekStart),
            lte(bodyMetrics.date, weekStart)
          ))
          .orderBy(desc(bodyMetrics.date))
          .limit(1)
      ]);

      // Calculate weight change and trend analysis with unit conversion
      let weightChange = 0;
      let weightTrend = 'stable';
      let currentWeight = null;
      let previousWeight = null;
      let currentWeightUnit = 'metric';
      let previousWeightUnit = 'metric';

      if (currentWeekWeight.length > 0 && currentWeekWeight[0].weight) {
        currentWeight = parseFloat(currentWeekWeight[0].weight);
        currentWeightUnit = currentWeekWeight[0].unit || 'metric';
      }

      if (previousWeekWeight.length > 0 && previousWeekWeight[0].weight) {
        previousWeight = parseFloat(previousWeekWeight[0].weight);
        previousWeightUnit = previousWeekWeight[0].unit || 'metric';
      }

      if (currentWeight && previousWeight) {
        // Convert weights to common unit for accurate comparison
        const currentConverted = UnitConverter.convertWeight(currentWeight, currentWeightUnit);
        const previousConverted = UnitConverter.convertWeight(previousWeight, previousWeightUnit);
        
        // Calculate weight change in kg for consistent RP analysis
        weightChange = currentConverted.kg - previousConverted.kg;
        
        // RP weight change classification (using kg thresholds)
        if (Math.abs(weightChange) < 0.1) { // ~0.2 lbs
          weightTrend = 'stable';
        } else if (weightChange > 0.1) {
          weightTrend = 'gaining';
        } else {
          weightTrend = 'losing';
        }
      }

      // RP-based adjustment recommendation calculation
      let adjustmentRecommendation = 'maintain';
      let adjustmentReason = 'calculated_from_logs';

      if (currentDietGoal && currentWeight && previousWeight) {
        const goalType = currentDietGoal.goal; // 'cutting', 'bulking', 'maintenance'
        const targetWeightChangePerWeek = parseFloat(currentDietGoal.weeklyWeightTarget || '0');

        // RP methodology: Adjust based on adherence + weight change vs target
        if (goalType === 'cutting') {
          // Cutting phase: target weight loss
          if (adherencePercentage >= 90 && weightChange >= 0) {
            adjustmentRecommendation = 'decrease_calories';
            adjustmentReason = 'high_adherence_no_weight_loss';
          } else if (adherencePercentage >= 90 && Math.abs(weightChange) > Math.abs(targetWeightChangePerWeek) * 1.5) {
            adjustmentRecommendation = 'increase_calories';
            adjustmentReason = 'excessive_weight_loss';
          } else if (adherencePercentage < 80) {
            adjustmentRecommendation = 'improve_adherence';
            adjustmentReason = 'poor_adherence_cutting';
          }
        } else if (goalType === 'bulking') {
          // Bulking phase: target weight gain
          if (adherencePercentage >= 90 && weightChange <= 0) {
            adjustmentRecommendation = 'increase_calories';
            adjustmentReason = 'high_adherence_no_weight_gain';
          } else if (adherencePercentage >= 90 && weightChange > targetWeightChangePerWeek * 1.5) {
            adjustmentRecommendation = 'decrease_calories';
            adjustmentReason = 'excessive_weight_gain';
          } else if (adherencePercentage < 80) {
            adjustmentRecommendation = 'improve_adherence';
            adjustmentReason = 'poor_adherence_bulking';
          }
        } else {
          // Maintenance phase
          if (Math.abs(weightChange) > 0.5) {
            adjustmentRecommendation = weightChange > 0 ? 'decrease_calories' : 'increase_calories';
            adjustmentReason = 'weight_drift_maintenance';
          }
        }
      }

      // Create calculated weekly summary with RP analysis and unit information
      const weeklyData = {
        userId,
        weekStartDate: weekStart,
        dailyCalories: Math.round(avgCalories),
        protein: Math.round(avgProtein).toString(),
        carbs: Math.round(totalCarbs / Math.max(daysWithLogs, 1)).toString(),
        fat: Math.round(totalFat / Math.max(daysWithLogs, 1)).toString(),
        adherencePercentage: Math.round(adherencePercentage).toString(),
        energyLevels: 7, // Default value - could be enhanced with user feedback
        hungerLevels: 5, // Default value
        adjustmentReason,
        // RP-specific fields with unit information
        currentWeight: currentWeight?.toString() || null,
        previousWeight: previousWeight?.toString() || null,
        weightChange: weightChange.toFixed(2),
        weightTrend,
        adjustmentRecommendation,
        goalType: currentDietGoal?.goal || 'maintenance',
        targetWeightChangePerWeek: currentDietGoal?.weeklyWeightTarget || '0',
        // Unit information for frontend conversion
        currentWeightUnit,
        previousWeightUnit,
        weightUnit: 'kg' // Weight change is always calculated in kg for consistency
      };

      return weeklyData;
    } catch (error) {
      console.error('Error calculating weekly nutrition from logs:', error);
      return null;
    }
  }

  // Get weekly goals for a user
  static async getWeeklyGoals(userId: number, weekStartDate?: string) {
    try {
      if (weekStartDate) {
        // Convert weekStartDate to proper date format
        const weekStart = new Date(weekStartDate);
        if (isNaN(weekStart.getTime())) {
          console.error('Invalid weekStartDate:', weekStartDate);
          return [];
        }
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Week should be 7 days, so +6 from start
        
        // First, try to get existing weekly goals
        const existingGoals = await db.select()
          .from(weeklyNutritionGoals)
          .where(and(
            eq(weeklyNutritionGoals.userId, userId),
            gte(weeklyNutritionGoals.weekStartDate, weekStart),
            lte(weeklyNutritionGoals.weekStartDate, weekEnd)
          ))
          .orderBy(desc(weeklyNutritionGoals.weekStartDate))
          .limit(10);

        // If no existing goals, try to calculate from food logs
        if (existingGoals.length === 0) {
          const calculatedData = await this.calculateWeeklyNutritionFromLogs(userId, weekStartDate);
          if (calculatedData) {
            // Return calculated data as if it were from the database
            return [calculatedData];
          }
        } else {
          // If we have existing goals but they lack weight data, enhance them with calculated weight data
          const enhancedGoals = await Promise.all(existingGoals.map(async (goal) => {
            if (!goal.currentWeight || !goal.previousWeight) {
              const calculatedData = await this.calculateWeeklyNutritionFromLogs(userId, goal.weekStartDate.toISOString().split('T')[0]);
              if (calculatedData && (calculatedData.currentWeight || calculatedData.previousWeight)) {
                // Add calculated weight data to existing goal
                return {
                  ...goal,
                  currentWeight: calculatedData.currentWeight || goal.currentWeight,
                  previousWeight: calculatedData.previousWeight || goal.previousWeight,
                  weightChange: calculatedData.weightChange || '0.0',
                  weightTrend: calculatedData.weightTrend || 'stable',
                  adjustmentRecommendation: calculatedData.adjustmentRecommendation || 'maintain',
                  goalType: calculatedData.goalType || 'maintenance',
                  targetWeightChangePerWeek: calculatedData.targetWeightChangePerWeek || '0',
                  currentWeightUnit: calculatedData.currentWeightUnit || 'metric',
                  previousWeightUnit: calculatedData.previousWeightUnit || 'metric',
                  weightUnit: 'kg'
                };
              }
            }
            return goal;
          }));
          return enhancedGoals;
        }

        return existingGoals;
      }

      return await db.select()
        .from(weeklyNutritionGoals)
        .where(eq(weeklyNutritionGoals.userId, userId))
        .orderBy(desc(weeklyNutritionGoals.weekStartDate))
        .limit(10);
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