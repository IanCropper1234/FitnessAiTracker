/**
 * Goal Synchronization Service
 * Ensures dietGoals serves as the single source of truth for all goal-related data
 * Synchronizes weightGoals, userProfile.fitnessGoal, and other goal settings with dietGoals
 */

import { db } from '../db';
import { dietGoals, weightGoals, userProfiles } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

export class GoalSynchronizationService {
  /**
   * Sync all goal-related data sources to match dietGoals
   * This is the master sync function that ensures data consistency
   */
  static async syncAllGoalsFromDietGoal(userId: number): Promise<void> {
    try {
      // Get current diet goal (single source of truth)
      const currentDietGoal = await db.select()
        .from(dietGoals)
        .where(eq(dietGoals.userId, userId))
        .orderBy(dietGoals.updatedAt)
        .limit(1);

      if (currentDietGoal.length === 0) {
        console.log(`No diet goal found for user ${userId} - skipping sync`);
        return;
      }

      const dietGoal = currentDietGoal[0];
      console.log(`🔄 Syncing all goals from dietGoal for user ${userId}:`, {
        goal: dietGoal.goal,
        weeklyWeightTarget: dietGoal.weeklyWeightTarget
      });

      // 1. Sync weightGoals to match dietGoal
      await this.syncWeightGoalFromDietGoal(userId, dietGoal);

      // 2. Sync userProfile.fitnessGoal to match dietGoal
      await this.syncUserProfileFromDietGoal(userId, dietGoal);

      console.log(`✅ Successfully synced all goals for user ${userId}`);
    } catch (error) {
      console.error('Error syncing goals from diet goal:', error);
      throw error;
    }
  }

  /**
   * Sync weightGoals table to match dietGoal values
   */
  private static async syncWeightGoalFromDietGoal(userId: number, dietGoal: any): Promise<void> {
    try {
      // Map dietGoal.goal to weightGoal.goalType
      const goalTypeMapping: Record<string, string> = {
        'cut': 'cutting',
        'bulk': 'bulking', 
        'maintain': 'maintenance'
      };

      const goalType = goalTypeMapping[dietGoal.goal] || 'maintenance';
      const targetWeightChangePerWeek = dietGoal.weeklyWeightTarget || '0';

      // Get existing weight goal
      const existingWeightGoals = await db.select()
        .from(weightGoals)
        .where(eq(weightGoals.userId, userId))
        .orderBy(weightGoals.updatedAt)
        .limit(1);

      if (existingWeightGoals.length > 0) {
        // Update existing weight goal
        await db.update(weightGoals)
          .set({
            goalType,
            targetWeightChangePerWeek,
            updatedAt: new Date()
          })
          .where(eq(weightGoals.id, existingWeightGoals[0].id));

        console.log(`📊 Updated weightGoal: ${goalType}, ${targetWeightChangePerWeek}kg/week`);
      } else {
        // Create new weight goal if none exists
        await db.insert(weightGoals).values({
          userId,
          targetWeight: '70', // Default target, will be updated by user
          goalType,
          targetWeightChangePerWeek,
          unit: 'metric'
        });

        console.log(`📊 Created new weightGoal: ${goalType}, ${targetWeightChangePerWeek}kg/week`);
      }
    } catch (error) {
      console.error('Error syncing weight goal from diet goal:', error);
      throw error;
    }
  }

  /**
   * Sync userProfile.fitnessGoal to match dietGoal values
   */
  private static async syncUserProfileFromDietGoal(userId: number, dietGoal: any): Promise<void> {
    try {
      // Map dietGoal.goal to userProfile.fitnessGoal (standardized mapping)
      const fitnessGoalMapping: Record<string, string> = {
        'cut': 'fat_loss',
        'bulk': 'muscle_gain',
        'maintain': 'maintenance'
      };

      const fitnessGoal = fitnessGoalMapping[dietGoal.goal] || 'maintenance';

      // Update user profile
      await db.update(userProfiles)
        .set({
          fitnessGoal,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));

      console.log(`👤 Updated userProfile.fitnessGoal: ${fitnessGoal}`);
    } catch (error) {
      console.error('Error syncing user profile from diet goal:', error);
      throw error;
    }
  }

  /**
   * Sync from Weight Goal to all other goals (reverse sync)
   * When user creates/updates weight goal, update dietGoal and userProfile accordingly
   */
  static async syncFromWeightGoal(userId: number, weightGoalType: string, targetWeightChangePerWeek: number): Promise<void> {
    try {
      console.log(`🔄 Syncing goals from weightGoal for user ${userId}:`, {
        goalType: weightGoalType,
        weeklyChange: targetWeightChangePerWeek
      });

      // Map weight goal type to diet goal and fitness goal
      let dietGoalType: string;
      let fitnessGoal: string;

      switch (weightGoalType) {
        case 'cutting':
          dietGoalType = 'cut';
          fitnessGoal = 'fat_loss';
          break;
        case 'bulking':
          dietGoalType = 'bulk';
          fitnessGoal = 'muscle_gain';
          break;
        case 'maintenance':
        default:
          dietGoalType = 'maintain';
          fitnessGoal = 'maintenance';
          break;
      }

      // Update userProfile.fitnessGoal
      const existingProfile = await db.select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        await db.update(userProfiles)
          .set({
            fitnessGoal,
            updatedAt: new Date()
          })
          .where(eq(userProfiles.id, existingProfile[0].id));

        console.log(`👤 Updated userProfile.fitnessGoal: ${fitnessGoal}`);
      }

      console.log(`✅ Successfully synced goals from weightGoal for user ${userId}`);
    } catch (error) {
      console.error('Error syncing from weight goal:', error);
      throw error;
    }
  }

  /**
   * Update dietGoal and sync all dependent goal data
   * Use this when dietGoal is the primary change source
   */
  static async updateDietGoalAndSync(userId: number, dietGoalUpdates: any): Promise<any> {
    try {
      // Update diet goal first
      const updatedDietGoal = await db.update(dietGoals)
        .set({
          ...dietGoalUpdates,
          updatedAt: new Date()
        })
        .where(eq(dietGoals.userId, userId))
        .returning();

      if (updatedDietGoal.length === 0) {
        throw new Error('Diet goal not found for update');
      }

      // Sync all dependent goals
      await this.syncAllGoalsFromDietGoal(userId);

      return updatedDietGoal[0];
    } catch (error) {
      console.error('Error updating diet goal and syncing:', error);
      throw error;
    }
  }

  /**
   * Get unified goal data from dietGoal (single source of truth)
   * Use this instead of fetching from multiple sources
   */
  static async getUnifiedGoalData(userId: number): Promise<any> {
    try {
      const dietGoal = await db.select()
        .from(dietGoals)
        .where(eq(dietGoals.userId, userId))
        .orderBy(dietGoals.updatedAt)
        .limit(1);

      if (dietGoal.length === 0) {
        return null;
      }

      const goal = dietGoal[0];

      // Map to unified format for RP components
      return {
        // Primary goal data from dietGoals
        goalType: goal.goal, // cut, bulk, maintain
        weeklyWeightTarget: parseFloat(goal.weeklyWeightTarget || '0'),
        targetCalories: parseFloat(goal.targetCalories),
        targetProtein: parseFloat(goal.targetProtein),
        targetCarbs: parseFloat(goal.targetCarbs),
        targetFat: parseFloat(goal.targetFat),
        useCustomCalories: goal.useCustomCalories,
        customTargetCalories: goal.customTargetCalories ? parseFloat(goal.customTargetCalories) : null,
        
        // Derived data for compatibility
        fitnessGoal: this.mapDietGoalToFitnessGoal(goal.goal),
        weightGoalType: this.mapDietGoalToWeightGoalType(goal.goal),
        
        // Metadata
        lastUpdated: goal.updatedAt,
        autoRegulation: goal.autoRegulation
      };
    } catch (error) {
      console.error('Error getting unified goal data:', error);
      throw error;
    }
  }

  /**
   * Helper mapping functions
   */
  private static mapDietGoalToFitnessGoal(dietGoal: string): string {
    const mapping: Record<string, string> = {
      'cut': 'Weight Loss',
      'bulk': 'Muscle Gain', 
      'maintain': 'Maintenance'
    };
    return mapping[dietGoal] || 'Maintenance';
  }

  private static mapDietGoalToWeightGoalType(dietGoal: string): string {
    const mapping: Record<string, string> = {
      'cut': 'cutting',
      'bulk': 'bulking',
      'maintain': 'maintenance'
    };
    return mapping[dietGoal] || 'maintenance';
  }
}