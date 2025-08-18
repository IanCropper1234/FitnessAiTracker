import { db } from '../db';
import { weeklyNutritionGoals, dailyWellnessCheckins, weeklyWellnessSummaries, mealMacroDistribution, macroFlexibilityRules, dietGoals, nutritionLogs, bodyMetrics } from '../../shared/schema';
import { eq, and, gte, lte, lt, desc } from 'drizzle-orm';
import { UnitConverter } from '../../shared/utils/unit-conversion';
import { DailyWellnessService } from './daily-wellness-service';

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
      const dailyTotals = AdvancedMacroManagementService.calculateDailyTotals(weeklyLogs);
      const adherencePercentage = AdvancedMacroManagementService.calculateAdherence(dailyTotals, currentGoal);

      // Get wellness data using the new daily wellness service
      const { DailyWellnessService } = await import('./daily-wellness-service');
      const wellnessData = await DailyWellnessService.getWellnessDataForMacroAdjustment(userId, weekStart);

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
      const adjustment = AdvancedMacroManagementService.calculateRPAdjustment({
        currentGoals: currentGoal,
        adherencePercentage,
        weeklyLogs,
        previousWeekGoals: previousWeekGoals[0] || null,
        wellnessData: wellnessData
      });

      return {
        adherencePercentage,
        adjustment: adjustment,
        currentGoals: currentGoal,
        weeklyLogs: weeklyLogs.length
      };

    } catch (error) {
      console.error('Error calculating weekly adjustment:', error);
      throw error;
    }
  }

  // Apply weekly adjustment to diet goals
  static async applyWeeklyAdjustment(userId: number, weekStartDate: string, adjustmentPercentage: number) {
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
      const targetCalories = parseFloat(currentGoal.targetCalories);

      // Calculate new macros with adjustment
      const newCalories = Math.round(targetCalories * (1 + adjustmentPercentage / 100));
      const newProtein = parseFloat(currentGoal.targetProtein);
      const newCarbs = Math.round(parseFloat(currentGoal.targetCarbs) * (1 + adjustmentPercentage / 100));
      const newFat = Math.round(parseFloat(currentGoal.targetFat) * (1 + adjustmentPercentage / 100));

      // Update diet goals
      await db.update(dietGoals)
        .set({
          targetCalories: newCalories.toString(),
          targetCarbs: newCarbs.toString(),
          targetFat: newFat.toString(),
          updatedAt: new Date()
        })
        .where(eq(dietGoals.userId, userId));

      console.log(`✅ Applied ${adjustmentPercentage}% adjustment - New calories: ${newCalories}`);
      
      return {
        newCalories,
        newProtein,
        newCarbs,
        newFat,
        adjustmentPercentage
      };
    } catch (error) {
      console.error('Error applying weekly adjustment:', error);
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
      
      const calories = parseFloat(log.calories) || 0;
      const protein = parseFloat(log.protein) || 0;
      const carbs = parseFloat(log.carbs) || 0;
      const fat = parseFloat(log.fat) || 0;
      
      dailyTotals[date].calories += calories;
      dailyTotals[date].protein += protein;
      dailyTotals[date].carbs += carbs;
      dailyTotals[date].fat += fat;
    });

    return dailyTotals;
  }

  // Calculate adherence percentage using intelligent target detection - only for past days
  private static calculateAdherence(dailyTotals: any, targetGoals: any) {
    const allDays = Object.keys(dailyTotals);
    if (allDays.length === 0) return 0;

    // Filter to include completed days (past days + today if it has food logs, exclude future days)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for accurate comparison
    
    const completedDays = allDays.filter(date => {
      const dayDate = new Date(date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate <= today; // Include days up to and including today
    });

    // If no completed days, return 0
    if (completedDays.length === 0) return 0;

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

    completedDays.forEach(date => {
      const actualCalories = dailyTotals[date].calories;
      const deviation = Math.abs((actualCalories - targetCalories) / targetCalories * 100);
      const adherence = Math.max(0, 100 - deviation);
      adherenceSum += adherence;
    });

    return Math.round(adherenceSum / completedDays.length);
  }

  // Calculate RP-based macro adjustment using intelligent target detection and wellness data
  private static calculateRPAdjustment(data: any) {
    const { currentGoals, adherencePercentage, wellnessData } = data;
    
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

    // Get wellness metrics from user check-in (authentic RP Diet Coach methodology)
    const energyLevel = wellnessData?.energyLevel || 7; // 1-10 scale from weekly wellness check-in
    const hungerLevel = wellnessData?.hungerLevel || 5; // 1-10 scale from weekly wellness check-in
    const sleepQuality = wellnessData?.sleepQuality || 7; // 1-10 scale
    const stressLevel = wellnessData?.stressLevel || 5; // 1-10 scale
    const adherencePerception = wellnessData?.adherencePerception || 8; // 1-10 scale

    // Debug logging for adjustment calculation
    console.log('🔧 RP Adjustment Debug:', {
      adherencePercentage,
      goal: currentGoals.goal,
      energyLevel,
      hungerLevel,
      sleepQuality,
      stressLevel,
      adherencePerception,
      targetCalories
    });

    // Only adjust if adherence is good (>80%)
    if (adherencePercentage < 80) {
      console.log('🔧 No adjustment - low adherence:', adherencePercentage);
      return {
        adjustmentPercentage: 0,
        adjustmentReason: 'low_adherence',
        adjustmentRecommendation: 'improve_adherence', // Add recommendation for low adherence
        newCalories: targetCalories,
        newProtein: parseFloat(currentGoals.targetProtein),
        newCarbs: parseFloat(currentGoals.targetCarbs),
        newFat: parseFloat(currentGoals.targetFat),
        wellnessFactors: {
          energyLevel,
          hungerLevel,
          sleepQuality,
          stressLevel,
          adherencePerception
        }
      };
    }

    // RP-based adjustment logic with wellness integration
    let baseAdjustment = 0;
    if (currentGoals.goal === 'cut') {
      baseAdjustment = -3; // Base 3% reduction for cutting
      adjustmentReason = 'progress_optimization';
    } else if (currentGoals.goal === 'bulk') {
      baseAdjustment = 3; // Base 3% increase for bulking  
      adjustmentReason = 'growth_optimization';
    } else if (currentGoals.goal === 'maintain') {
      // For maintenance, still allow small adjustments based on wellness
      baseAdjustment = 0;
      adjustmentReason = 'maintenance_optimization';
    }
    
    console.log('🔧 Base adjustment for goal', currentGoals.goal, ':', baseAdjustment);

    // Adjust based on wellness factors (RP Diet Coach methodology)
    let wellnessAdjustment = 0;
    
    // Energy level adjustments
    if (energyLevel <= 4) {
      // Low energy - reduce deficit or increase surplus
      wellnessAdjustment += currentGoals.goal === 'cut' ? 1 : 1; // Less aggressive
      adjustmentReason = 'low_energy_adjustment';
    } else if (energyLevel >= 8) {
      // High energy - can be more aggressive
      wellnessAdjustment += currentGoals.goal === 'cut' ? -1 : 1; // More aggressive
    }

    // Hunger level adjustments
    if (hungerLevel >= 8) {
      // High hunger - reduce deficit or increase surplus
      wellnessAdjustment += currentGoals.goal === 'cut' ? 2 : 1; // Less aggressive deficit
      adjustmentReason = 'high_hunger_adjustment';
    } else if (hungerLevel <= 3) {
      // Low hunger - can be more aggressive with deficit
      wellnessAdjustment += currentGoals.goal === 'cut' ? -1 : 0;
    }

    // Sleep quality adjustments
    if (sleepQuality <= 4) {
      // Poor sleep - be more conservative
      wellnessAdjustment += 1; // Less aggressive
      adjustmentReason = 'poor_sleep_adjustment';
    }

    // Stress level adjustments
    if (stressLevel >= 8) {
      // High stress - be more conservative
      wellnessAdjustment += 1; // Less aggressive
      adjustmentReason = 'high_stress_adjustment';
    }

    // Calculate final adjustment percentage
    adjustmentPercentage = baseAdjustment + wellnessAdjustment;
    
    console.log('🔧 Pre-cap adjustment:', {
      baseAdjustment,
      wellnessAdjustment,
      total: adjustmentPercentage
    });
    
    // Cap adjustments to reasonable ranges
    if (currentGoals.goal === 'cut') {
      adjustmentPercentage = Math.max(-8, Math.min(0, adjustmentPercentage)); // -8% to 0%
    } else if (currentGoals.goal === 'bulk') {
      adjustmentPercentage = Math.max(0, Math.min(8, adjustmentPercentage)); // 0% to 8%
    } else if (currentGoals.goal === 'maintain') {
      adjustmentPercentage = Math.max(-3, Math.min(3, adjustmentPercentage)); // -3% to 3% for maintenance
    }
    
    console.log('🔧 Final adjustment percentage:', adjustmentPercentage);

    // Determine recommendation based on final adjustment percentage
    let recommendationType = 'maintain';
    if (adjustmentPercentage > 0) {
      recommendationType = 'increase_calories';
    } else if (adjustmentPercentage < 0) {
      recommendationType = 'decrease_calories';
    } else if (adherencePercentage < 80) {
      recommendationType = 'improve_adherence';
    }

    const newCalories = Math.round(targetCalories * (1 + adjustmentPercentage / 100));
    const proteinPerCalorie = parseFloat(currentGoals.targetProtein) / targetCalories;
    const carbPerCalorie = parseFloat(currentGoals.targetCarbs) / targetCalories;
    const fatPerCalorie = parseFloat(currentGoals.targetFat) / targetCalories;

    const result = {
      adjustmentPercentage,
      adjustmentReason,
      adjustmentRecommendation: recommendationType, // Add this field for consistency
      newCalories,
      newProtein: Math.round(newCalories * proteinPerCalorie),
      newCarbs: Math.round(newCalories * carbPerCalorie),
      newFat: Math.round(newCalories * fatPerCalorie),
      wellnessFactors: {
        energyLevel,
        hungerLevel,
        sleepQuality,
        stressLevel,
        adherencePerception
      }
    };
    
    console.log('calculateRPAdjustment returning:', {
      adjustmentRecommendation: result.adjustmentRecommendation,
      adjustmentPercentage: result.adjustmentPercentage,
      adjustmentReason: result.adjustmentReason
    });
    
    return result;
  }

  // Create weekly nutrition goal entry
  static async createWeeklyGoal(data: any) {
    try {
      console.log('createWeeklyGoal received data:', {
        adjustmentRecommendation: data.adjustmentRecommendation,
        adjustmentReason: data.adjustmentReason,
        adjustmentPercentage: data.adjustmentPercentage
      });
      
      const weeklyGoal = await db.insert(weeklyNutritionGoals).values({
        userId: data.userId,
        weekStartDate: new Date(data.weekStartDate),
        dailyCalories: data.dailyCalories,
        protein: data.protein.toString(),
        carbs: data.carbs.toString(),
        fat: data.fat.toString(),
        adjustmentReason: data.adjustmentReason,
        adjustmentRecommendation: data.adjustmentRecommendation, // Add the recommendation
        previousWeight: data.previousWeight?.toString(),
        currentWeight: data.currentWeight?.toString(),
        adherencePercentage: data.adherencePercentage?.toString(),
        energyLevels: data.wellnessFactors?.energyLevel || data.energyLevels || 7,
        hungerLevels: data.wellnessFactors?.hungerLevel || data.hungerLevels || 5,
        adjustmentPercentage: data.adjustmentPercentage?.toString()
      }).returning();

      console.log('Created weekly goal with adjustmentRecommendation:', weeklyGoal[0].adjustmentRecommendation);
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

      // Previous week for weight comparison
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

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

      // Get user's diet goals for adherence calculation - FIXED TO USE LATEST RECORD
      const dietGoalsData = await db.select()
        .from(dietGoals)
        .where(eq(dietGoals.userId, userId))
        .orderBy(desc(dietGoals.updatedAt))
        .limit(1);
      
      console.log('💾 getDietGoal query result in RP calculation:', dietGoalsData[0]);
      
      let adherencePercentage = 0;
      let currentDietGoal = null;

      if (dietGoalsData.length > 0) {
        currentDietGoal = dietGoalsData[0];
        
        // Calculate daily totals for smart adherence calculation
        const dailyTotals = AdvancedMacroManagementService.calculateDailyTotals(logs);
        adherencePercentage = AdvancedMacroManagementService.calculateAdherence(dailyTotals, currentDietGoal);
      }

      // Get weight data for RP analysis (14-day lookback for more accurate weight trend)
      
      console.log('🏋️ Weight Query Debug - Date ranges:', {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        previousWeekStart: previousWeekStart.toISOString(),
        fourteenDaysAgo: new Date(weekStart.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      });

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
        
        // Previous 14 days weight for better trend analysis (excluding current week)
        db.select()
          .from(bodyMetrics)
          .where(and(
            eq(bodyMetrics.userId, userId),
            gte(bodyMetrics.date, new Date(weekStart.getTime() - 14 * 24 * 60 * 60 * 1000)),
            lt(bodyMetrics.date, weekStart)
          ))
          .orderBy(desc(bodyMetrics.date))
          .limit(1)
      ]);

      console.log('🏋️ Weight Data Found:', {
        currentWeekWeight: currentWeekWeight[0],
        previousWeekWeight: previousWeekWeight[0]
      });

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
        
        console.log('⚖️ Weight Conversion Debug:', {
          currentWeight,
          currentWeightUnit,
          previousWeight,
          previousWeightUnit,
          currentConverted,
          previousConverted
        });
        
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

        // DEBUG: Log all relevant variables for RP analysis
        console.log('🔍 RP Algorithm Debug - All Variables:', {
          hasCurrentDietGoal: !!currentDietGoal,
          hasCurrentWeight: !!currentWeight,
          hasPreviousWeight: !!previousWeight,
          goalType,
          goalTypeString: typeof goalType,
          targetWeightChangePerWeek,
          weightChange,
          adherencePercentage,
          currentDietGoalFull: currentDietGoal
        });

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
        } else if (goalType === 'bulking' || goalType === 'bulk' || 
                   targetWeightChangePerWeek > 0 || 
                   (currentDietGoal?.goal && ['gain', 'muscle_gain', 'bulking'].includes(currentDietGoal.goal.toLowerCase()))) {
          // Bulking phase: RP methodology - adjust for suboptimal weight changes
          console.log('🏋️ RP Analysis - Bulking/Muscle Gain detected:', { 
            goalType, 
            dietGoal: currentDietGoal?.goal,
            targetWeightChangePerWeek, 
            weightChange, 
            adherencePercentage 
          });
          
          if (adherencePercentage >= 80 && weightChange <= 0) {
            // Weight loss or no gain during bulking = increase calories
            adjustmentRecommendation = 'increase_calories';
            adjustmentReason = 'weight_loss_during_bulk';
            console.log('🚀 RP Recommendation: INCREASE CALORIES - Weight loss/no gain during muscle gain phase');
          } else if (adherencePercentage >= 80 && weightChange < targetWeightChangePerWeek * 0.5) {
            // Weight gain too slow for bulking - increase calories  
            adjustmentRecommendation = 'increase_calories';
            adjustmentReason = 'insufficient_weight_gain';
            console.log('🚀 RP Recommendation: INCREASE CALORIES - Weight gain too slow for muscle gain');
          } else if (adherencePercentage >= 90 && weightChange > targetWeightChangePerWeek * 2.5) {
            // Only decrease if gaining significantly more than target (very conservative)
            adjustmentRecommendation = 'decrease_calories';
            adjustmentReason = 'excessive_weight_gain';
            console.log('⬇️ RP Recommendation: DECREASE CALORIES - Excessive weight gain');
          } else if (adherencePercentage < 70) {
            adjustmentRecommendation = 'improve_adherence';
            adjustmentReason = 'poor_adherence_bulking';
            console.log('📈 RP Recommendation: IMPROVE ADHERENCE - Low adherence during bulk');
          } else if (adherencePercentage >= 80 && weightChange > 0 && weightChange <= targetWeightChangePerWeek * 2.0) {
            // Optimal progress: maintain calories
            adjustmentRecommendation = 'maintain';
            adjustmentReason = 'optimal_bulk_progress';
            console.log('✅ RP Recommendation: MAINTAIN - Optimal weight gain progress');
          } else {
            // Default case for edge scenarios
            adjustmentRecommendation = 'increase_calories';
            adjustmentReason = 'default_bulk_adjustment';
            console.log('🔧 RP Recommendation: DEFAULT INCREASE - Edge case during bulk');
          }
        } else {
          // Maintenance phase
          if (Math.abs(weightChange) > 0.5) {
            adjustmentRecommendation = weightChange > 0 ? 'decrease_calories' : 'increase_calories';
            adjustmentReason = 'weight_drift_maintenance';
          }
        }
      }

      // Calculate adjustment percentage based on RP methodology
      let adjustmentPercentage = '0.00';
      if (adjustmentRecommendation === 'increase_calories') {
        adjustmentPercentage = '5.00'; // 5% increase for bulking/cutting adjustments
      } else if (adjustmentRecommendation === 'decrease_calories') {
        adjustmentPercentage = '-5.00'; // 5% decrease for excessive gain/stalled progress
      } else if (adjustmentRecommendation === 'maintain') {
        adjustmentPercentage = '0.00'; // No adjustment needed - maintain current calories
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
        adjustmentPercentage, // RP-based calorie adjustment percentage
        // RP-specific fields with unit conversion - always store in kg for consistency
        currentWeight: currentWeight ? UnitConverter.convertWeight(currentWeight, currentWeightUnit).kg.toString() : null,
        previousWeight: previousWeight ? UnitConverter.convertWeight(previousWeight, previousWeightUnit).kg.toString() : null,
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
        
        // First, try to get existing weekly goals for the exact week
        const existingGoals = await db.select()
          .from(weeklyNutritionGoals)
          .where(and(
            eq(weeklyNutritionGoals.userId, userId),
            eq(weeklyNutritionGoals.weekStartDate, weekStart)
          ))
          .orderBy(desc(weeklyNutritionGoals.weekStartDate))
          .limit(10);

        // If no existing goals, try to calculate from food logs
        if (existingGoals.length === 0) {
          const calculatedData = await AdvancedMacroManagementService.calculateWeeklyNutritionFromLogs(userId, weekStartDate);
          if (calculatedData) {
            // Enhance with real daily wellness data
            const wellnessAverages = await DailyWellnessService.calculateWeeklyAverages(userId, weekStart);
            if (wellnessAverages) {
              calculatedData.energyLevels = Math.round(parseFloat(wellnessAverages.avgEnergyLevel));
              calculatedData.hungerLevels = Math.round(parseFloat(wellnessAverages.avgHungerLevel));
            }
            // Return calculated data as if it were from the database
            return [calculatedData];
          }
          
          // Return empty array if no data can be calculated
          return [];
        } else {
          // Enhance existing goals with real daily wellness data and weight data
          const enhancedGoals = await Promise.all(existingGoals.map(async (goal) => {
            // Always get fresh wellness data for this week
            const wellnessAverages = await DailyWellnessService.calculateWeeklyAverages(userId, weekStart);
            
            let updatedGoal = { ...goal };
            
            // Update wellness data with real daily check-in averages
            if (wellnessAverages) {
              updatedGoal.energyLevels = Math.round(parseFloat(wellnessAverages.avgEnergyLevel));
              updatedGoal.hungerLevels = Math.round(parseFloat(wellnessAverages.avgHungerLevel));
            }
            
            // ALWAYS recalculate adherence percentage from fresh food logs
            const calculatedData = await AdvancedMacroManagementService.calculateWeeklyNutritionFromLogs(userId, goal.weekStartDate.toISOString().split('T')[0]);
            if (calculatedData) {
              // Update adherence with fresh calculation
              updatedGoal.adherencePercentage = calculatedData.adherencePercentage;
              
              // Only update weight data if it doesn't exist
              if (!updatedGoal.currentWeight || !updatedGoal.previousWeight) {
                if (calculatedData.currentWeight !== null || calculatedData.previousWeight !== null) {
                  // Only update missing weight data, preserve all other stored values
                  if (!updatedGoal.currentWeight) updatedGoal.currentWeight = calculatedData.currentWeight;
                  if (!updatedGoal.previousWeight) updatedGoal.previousWeight = calculatedData.previousWeight;
                  // Update recommendation if weight data changed or for fresh analysis
              if (calculatedData.adjustmentRecommendation && 
                  (calculatedData.currentWeight !== null || calculatedData.previousWeight !== null)) {
                updatedGoal.adjustmentRecommendation = calculatedData.adjustmentRecommendation;
                updatedGoal.adjustmentReason = calculatedData.adjustmentReason;
                updatedGoal.adjustmentPercentage = calculatedData.adjustmentPercentage;
              }
                }
              }
            }
            
            return updatedGoal;
          }));
          return enhancedGoals;
        }
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