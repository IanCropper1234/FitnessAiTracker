import { db } from "../db";
import { 
  mesocycles, 
  workoutSessions, 
  workoutExercises,
  trainingTemplates,
  exercises
} from "@shared/schema";
import { eq, and, gte, sql, isNull } from "drizzle-orm";
import { TemplateEngine } from "./template-engine";
import { SpecialMethodDistributionEngine } from "./special-method-distribution-engine";
import { RPConfigurationEngine } from "./rp-configuration-engine";
import type { 
  DistributionConstraints 
} from "@shared/types/special-method-distribution";
import { DISTRIBUTION_STRATEGIES } from "@shared/types/special-method-distribution";

export class UnifiedMesocycleTemplate {
  
  /**
   * Create mesocycle from template with proper integration
   * This is the CORRECT way to create template-based mesocycles
   */
  static async createMesocycleFromTemplate(
    userId: number,
    templateId: number,
    startDate: Date,
    totalWeeks: number = 6
  ) {
    console.log(`🔄 Creating unified mesocycle from template ${templateId}`);
    
    // 1. Create mesocycle record
    const [mesocycle] = await db
      .insert(mesocycles)
      .values({
        userId,
        templateId, // Store template reference
        name: `Training Mesocycle`,
        startDate,
        endDate: new Date(startDate.getTime() + (totalWeeks * 7 * 24 * 60 * 60 * 1000)),
        currentWeek: 1,
        totalWeeks,
        phase: 'accumulation',
        isActive: true,
        createdAt: new Date()
      })
      .returning();
    
    console.log(`✅ Mesocycle created: ID ${mesocycle.id}`);
    
    // 2. Generate Week 1 sessions using TemplateEngine
    const templateSessions = await TemplateEngine.generateFullProgramFromTemplate(
      userId,
      templateId,
      mesocycle.id, // Link to mesocycle
      startDate
    );
    
    console.log(`✅ Week 1 sessions created: ${templateSessions.totalWorkouts} sessions`);
    
    return {
      mesocycle,
      initialSessions: templateSessions,
      message: `Mesocycle created with ${templateSessions.totalWorkouts} initial sessions`
    };
  }
  
  /**
   * Validate mesocycle-template integration
   * Checks for conflicts and fixes them
   */
  static async validateIntegration(mesocycleId: number) {
    console.log(`🔍 Validating mesocycle ${mesocycleId} integration`);
    
    // Get mesocycle details
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));
    
    if (!mesocycle) {
      return { valid: false, error: "Mesocycle not found" };
    }
    
    // Check for linked sessions
    const linkedSessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.mesocycleId, mesocycleId));
    
    // Check for orphaned sessions (should have mesocycleId)
    const orphanedSessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, mesocycle.userId),
          isNull(workoutSessions.mesocycleId)
        )
      );
    
    return {
      valid: linkedSessions.length > 0,
      mesocycleId,
      linkedSessions: linkedSessions.length,
      orphanedSessions: orphanedSessions.length,
      isActive: mesocycle.isActive,
      currentWeek: mesocycle.currentWeek,
      templateId: mesocycle.templateId
    };
  }
  
  /**
   * Fix orphaned sessions by linking them to mesocycle
   * Updated to handle all existing sessions and reset mesocycle properly
   */
  static async fixOrphanedSessions(userId: number, mesocycleId: number) {
    console.log(`🔧 Fixing orphaned sessions for user ${userId}`);
    
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));
    
    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }
    
    // Get all orphaned sessions for this user
    const orphanedSessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNull(workoutSessions.mesocycleId)
        )
      );
    
    console.log(`Found ${orphanedSessions.length} orphaned sessions to integrate`);
    
    // Update ALL orphaned sessions to link to mesocycle
    const result = await db
      .update(workoutSessions)
      .set({ 
        mesocycleId: mesocycleId
      })
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNull(workoutSessions.mesocycleId)
        )
      );
    
    console.log(`✅ Integrated ${orphanedSessions.length} sessions into mesocycle ${mesocycleId}`);
    return { 
      integratedSessions: orphanedSessions.length,
      result 
    };
  }
  
  /**
   * Reset mesocycle to Week 1 and reactivate
   */
  static async resetMesocycleToWeek1(mesocycleId: number) {
    console.log(`🔄 Resetting mesocycle ${mesocycleId} to Week 1`);
    
    const result = await db
      .update(mesocycles)
      .set({ 
        currentWeek: 1,
        isActive: true,
        phase: 'accumulation'
      })
      .where(eq(mesocycles.id, mesocycleId));
    
    console.log(`✅ Mesocycle ${mesocycleId} reset to Week 1 and reactivated`);
    return result;
  }
  
  /**
   * Comprehensive data repair for existing system
   */
  static async repairExistingData(userId: number, mesocycleId: number) {
    console.log(`🛠️ Starting comprehensive data repair for user ${userId}`);
    
    // Step 1: Reset mesocycle to Week 1
    await this.resetMesocycleToWeek1(mesocycleId);
    
    // Step 2: Integrate all orphaned sessions
    const integrationResult = await this.fixOrphanedSessions(userId, mesocycleId);
    
    // Step 3: Validate repair
    const validation = await this.validateIntegration(mesocycleId);
    
    console.log(`✅ Data repair completed: ${integrationResult.integratedSessions} sessions integrated`);
    
    return {
      mesocycleReset: true,
      integratedSessions: integrationResult.integratedSessions,
      validation,
      status: "Repair completed successfully"
    };
  }
  
  /**
   * Reactivate mesocycle if needed
   */
  static async reactivateMesocycle(mesocycleId: number) {
    console.log(`🔄 Reactivating mesocycle ${mesocycleId}`);
    
    const result = await db
      .update(mesocycles)
      .set({ 
        isActive: true
      })
      .where(eq(mesocycles.id, mesocycleId));
    
    console.log(`✅ Mesocycle reactivated`);
    return result;
  }
  
  /**
   * Create demonstration of proper workflow
   */
  static async demonstrateProperWorkflow(userId: number) {
    console.log(`🎯 Demonstrating proper template-mesocycle workflow`);
    
    // Create new mesocycle from template
    const result = await this.createMesocycleFromTemplate(
      userId,
      1024, // Full Body template
      new Date(), // Start today
      6 // 6 weeks
    );
    
    // Validate the result
    const validation = await this.validateIntegration(result.mesocycle.id);
    
    return {
      creation: result,
      validation,
      workflow: "Template → Mesocycle → Sessions → Advance Week"
    };
  }

  /**
   * Enhanced mesocycle creation with special method distribution
   * Based on Renaissance Periodization methodology and scientific research
   */
  static async createMesocycleWithSpecialDistribution(
    userId: number,
    config: {
      name: string;
      totalWeeks: number;
      trainingDaysPerWeek: number;
      dayTemplates: Record<number, number | null>;
      specialMethodStrategy: keyof typeof DISTRIBUTION_STRATEGIES;
      targetMuscleGroups: string[];
    }
  ) {
    console.log(`🧬 Creating enhanced mesocycle with RP-based configuration and special method distribution: ${config.specialMethodStrategy}`);
    
    // Step 0: Assess user experience and profile for RP configuration
    const userProfile = await RPConfigurationEngine.assessUserExperience(userId);
    console.log(`🔬 User profile assessed: ${userProfile.experienceLevel} level, ${userProfile.recoveryCap} recovery`);
    
    // Step 1: Create mesocycle record
    const [mesocycle] = await db
      .insert(mesocycles)
      .values({
        userId,
        templateId: null, // Multi-template approach
        name: config.name,
        startDate: new Date(),
        endDate: new Date(Date.now() + (config.totalWeeks * 7 * 24 * 60 * 60 * 1000)),
        currentWeek: 1,
        totalWeeks: config.totalWeeks,
        phase: 'accumulation',
        isActive: true,
        createdAt: new Date()
      })
      .returning();
    
    console.log(`✅ Mesocycle created: ID ${mesocycle.id}`);
    
    // Step 2: Get all exercise IDs from templates
    const allExerciseIds: number[] = [];
    for (const [day, templateId] of Object.entries(config.dayTemplates)) {
      if (templateId) {
        const templateData = await this.getTemplateExercises(templateId);
        allExerciseIds.push(...templateData);
      }
    }
    
    // Step 3: Generate special method distribution with user-specific constraints
    const constraints: DistributionConstraints = {
      maxSpecialMethodsPerSession: userProfile.experienceLevel === 'beginner' ? 20 : 40, // Conservative for beginners
      maxSpecialMethodsPerWeek: userProfile.experienceLevel === 'beginner' ? 30 : 50,    // Conservative for beginners
      minimumRegularSetsPercentage: 50, // At least 50% regular training
      fatigueThreshold: userProfile.recoveryCap === 'low' ? 5 : 7,
      experienceLevel: userProfile.experienceLevel
    };
    
    const distribution = await SpecialMethodDistributionEngine.generateDistribution(
      userId,
      allExerciseIds,
      config.totalWeeks,
      config.specialMethodStrategy,
      constraints,
      config.targetMuscleGroups.length > 0 ? config.targetMuscleGroups : undefined
    );
    
    console.log(`📊 Special method distribution generated: ${distribution.totalSpecialMethodPercentage}% special methods`);
    
    // Step 4: Generate sessions with special method distribution applied
    const sessions = [];
    let sessionCount = 0;
    
    for (const [day, templateId] of Object.entries(config.dayTemplates)) {
      if (templateId) {
        const dayNumber = parseInt(day);
        console.log(`🏋️ Generating session for day ${dayNumber} using template ${templateId}`);
        
        const daySession = await TemplateEngine.generateFullProgramFromTemplate(
          userId,
          templateId,
          mesocycle.id,
          new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000), // Offset by day
          1, // Week 1
          config.totalWeeks
        );
        
        // Apply special method distribution AND RP configuration to ALL sessions generated from this template
        for (const session of daySession.sessions) {
          console.log(`🎯 Applying RP configuration and special methods to session ${session.sessionId} (${session.name})`);
          
          // Step 1: Apply RP-based configuration to all exercises
          await this.applyRPConfiguration(session.sessionId, userProfile, mesocycle.phase as 'accumulation' | 'intensification' | 'realization' | 'deload', 1);
          
          // Step 2: Apply special method distribution
          const weeklyDist = distribution.weeklyDistribution.find(w => w.week === 1);
          if (weeklyDist) {
            await this.applySpecialMethodDistribution(session.sessionId, weeklyDist);
            sessionCount++;
          } else {
            console.log(`⚠️ No weekly distribution found for week 1`);
          }
        }
        
        sessions.push(...daySession.sessions);
      }
    }
    
    console.log(`✅ Applied special methods to ${sessionCount} sessions total`);
    
    console.log(`✅ ${sessions.length} sessions created with special method distribution applied`);
    
    return {
      mesocycle,
      sessions,
      distribution: {
        strategy: distribution.strategy.name,
        totalSpecialMethodPercentage: distribution.totalSpecialMethodPercentage,
        expectedFatigueImpact: distribution.expectedFatigueImpact,
        scientificJustification: distribution.scientificJustification,
        warnings: distribution.warnings
      },
      message: `Enhanced mesocycle created with ${distribution.totalSpecialMethodPercentage}% special method distribution`
    };
  }

  /**
   * Get exercise IDs from a template
   */
  private static async getTemplateExercises(templateId: number): Promise<number[]> {
    const [template] = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId));
    
    if (!template) return [];
    
    const templateData = template.templateData as any;
    const exerciseIds: number[] = [];
    
    if (templateData.workouts) {
      for (const workout of templateData.workouts) {
        if (workout.exercises) {
          exerciseIds.push(...workout.exercises.map((ex: any) => ex.exerciseId));
        }
      }
    }
    
    return exerciseIds;
  }

  /**
   * Apply RP-based configuration to all exercises in a session
   */
  private static async applyRPConfiguration(
    sessionId: number | undefined,
    userProfile: any,
    phase: 'accumulation' | 'intensification' | 'realization' | 'deload',
    weekNumber: number
  ) {
    if (!sessionId) {
      console.log(`⚠️ Skipping RP configuration - missing sessionId`);
      return;
    }

    console.log(`🧬 Applying RP configuration to session ${sessionId} (Phase: ${phase}, Week: ${weekNumber})`);

    // Get all exercises in this session with exercise details
    const sessionExercises = await db
      .select({
        id: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        sessionId: workoutExercises.sessionId,
        sets: workoutExercises.sets,
        targetReps: workoutExercises.targetReps,
        restPeriod: workoutExercises.restPeriod,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
        exerciseMuscleGroups: exercises.muscleGroups
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.sessionId, sessionId));

    console.log(`🔬 Applying RP configuration to ${sessionExercises.length} exercises`);

    // Apply RP configuration to each exercise
    for (const exercise of sessionExercises) {
      try {
        // Determine primary muscle group for this exercise
        const primaryMuscleGroup = this.determinePrimaryMuscleGroup(exercise.exerciseMuscleGroups || []);
        
        // Generate RP configuration for this exercise
        const rpConfig = await RPConfigurationEngine.generateExerciseConfiguration(
          exercise.exerciseId,
          phase,
          weekNumber,
          userProfile,
          primaryMuscleGroup
        );

        // Update exercise with RP configuration
        await db
          .update(workoutExercises)
          .set({
            sets: rpConfig.sets,
            targetReps: rpConfig.reps,
            restPeriod: rpConfig.restPeriod,
            notes: sql`COALESCE(notes, '') || ' [RP: ' || ${rpConfig.intensity}::text || '% 1RM]'`
          })
          .where(eq(workoutExercises.id, exercise.id));

        console.log(`✅ Applied RP config to ${exercise.exerciseName}: ${rpConfig.sets} sets x ${rpConfig.reps} @ ${rpConfig.intensity}%`);
      } catch (error) {
        console.error(`❌ Error applying RP config to exercise ${exercise.exerciseId}:`, error);
      }
    }

    console.log(`✅ RP configuration applied to all exercises in session ${sessionId}`);
  }

  /**
   * Determine primary muscle group from exercise muscle groups array
   */
  private static determinePrimaryMuscleGroup(muscleGroups: string[]): string {
    if (!muscleGroups || muscleGroups.length === 0) return 'chest';
    
    // Map common muscle group names to RP volume landmark categories
    const muscleGroupMap: Record<string, string> = {
      'chest': 'chest',
      'pectorals': 'chest',
      'back': 'back',
      'lats': 'back',
      'rhomboids': 'back',
      'rear_delts': 'shoulders',
      'shoulders': 'shoulders',
      'deltoids': 'shoulders',
      'biceps': 'biceps',
      'triceps': 'triceps',
      'forearms': 'forearms',
      'quadriceps': 'quads',
      'quads': 'quads',
      'hamstrings': 'hamstrings',
      'glutes': 'glutes',
      'calves': 'calves',
      'abs': 'abs',
      'abdominals': 'abs',
      'lower_back': 'lower_back'
    };

    // Find first matching muscle group
    for (const mg of muscleGroups) {
      const normalized = mg.toLowerCase().replace(/[^a-z]/g, '');
      for (const [key, value] of Object.entries(muscleGroupMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          return value;
        }
      }
    }

    // Default fallback
    return 'chest';
  }

  /**
   * Apply special method distribution to workout session
   */
  private static async applySpecialMethodDistribution(
    sessionId: number | undefined,
    weeklyDistribution: any
  ) {
    if (!sessionId || !weeklyDistribution || !weeklyDistribution.allocations) {
      console.log(`⚠️ Skipping special method application - missing data:`, { sessionId, hasAllocations: !!weeklyDistribution?.allocations });
      return;
    }
    
    console.log(`🎯 Applying special method distribution to session ${sessionId}`);
    console.log(`📋 Allocations to apply:`, weeklyDistribution.allocations);
    
    // Get session exercises with exercise details
    const sessionExercises = await db
      .select({
        id: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        sessionId: workoutExercises.sessionId,
        sets: workoutExercises.sets,
        specialMethod: workoutExercises.specialMethod,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
        exerciseMuscleGroups: exercises.muscleGroups
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.sessionId, sessionId));
    
    console.log(`💪 Found ${sessionExercises.length} exercises in session ${sessionId}`);
    
    if (sessionExercises.length === 0) {
      console.log(`⚠️ No exercises found in session ${sessionId}`);
      return;
    }
    
    // Apply distribution logic based on allocations
    for (const allocation of weeklyDistribution.allocations) {
      console.log(`🔧 Applying ${allocation.method} (${allocation.percentage}%) to session`);
      
      // Calculate target count for this special method
      const targetCount = Math.max(1, Math.ceil((sessionExercises.length * allocation.percentage) / 100));
      console.log(`🎯 Target count for ${allocation.method}: ${targetCount} out of ${sessionExercises.length} exercises`);
      
      // Filter exercises suitable for this method
      const suitableExercises = sessionExercises.filter((exercise: any) => {
        console.log(`🔍 Evaluating exercise for ${allocation.method}:`, {
          name: exercise.exerciseName,
          category: exercise.exerciseCategory,
          muscleGroups: exercise.exerciseMuscleGroups,
          currentMethod: exercise.specialMethod
        });
        
        // Skip if already has special method
        if (exercise.specialMethod && exercise.specialMethod !== 'standard') {
          console.log(`⚠️ Skipping ${exercise.exerciseName} - already has special method: ${exercise.specialMethod}`);
          return false;
        }
        
        // Check if exercise type matches allocation criteria
        const exerciseTypes = allocation.exerciseTypes || ['isolation', 'compound'];
        const isCompound = ['push', 'pull', 'legs', 'compound'].includes(exercise.exerciseCategory || '');
        const exerciseType = isCompound ? 'compound' : 'isolation';
        
        console.log(`🏋️ Exercise type check for ${exercise.exerciseName}:`, {
          category: exercise.exerciseCategory,
          isCompound,
          exerciseType,
          requiredTypes: exerciseTypes,
          passes: exerciseTypes.includes(exerciseType)
        });
        
        if (!exerciseTypes.includes(exerciseType)) {
          console.log(`❌ ${exercise.exerciseName} rejected - type mismatch`);
          return false;
        }
        
        // Check muscle group match if specified
        if (allocation.muscleGroups && allocation.muscleGroups.length > 0) {
          const exerciseMuscleGroups = exercise.exerciseMuscleGroups || [];
          const hasMatchingMuscleGroup = allocation.muscleGroups.some((mg: string) => 
            exerciseMuscleGroups.includes(mg) || 
            exerciseMuscleGroups.some((emg: string) => emg.includes(mg))
          );
          console.log(`🎯 Muscle group check for ${exercise.exerciseName}:`, {
            exerciseGroups: exerciseMuscleGroups,
            requiredGroups: allocation.muscleGroups,
            hasMatch: hasMatchingMuscleGroup
          });
          if (!hasMatchingMuscleGroup) {
            console.log(`❌ ${exercise.exerciseName} rejected - muscle group mismatch`);
            return false;
          }
        }
        
        console.log(`✅ ${exercise.exerciseName} is suitable for ${allocation.method}`);
        return true;
      });
      
      console.log(`🎯 Found ${suitableExercises.length} suitable exercises for ${allocation.method}`);
      
      // Apply special method to target exercises
      let appliedCount = 0;
      for (const exercise of suitableExercises.slice(0, targetCount)) {
        try {
          await db
            .update(workoutExercises)
            .set({
              specialMethod: allocation.method,
              specialConfig: this.getDefaultSpecialMethodConfig(allocation.method)
            })
            .where(eq(workoutExercises.id, exercise.id));
          
          console.log(`✅ Applied ${allocation.method} to exercise: ${exercise.exerciseName}`);
          appliedCount++;
        } catch (error) {
          console.error(`❌ Failed to apply ${allocation.method} to exercise ${exercise.exerciseName}:`, error);
        }
      }
      
      console.log(`✅ Applied ${allocation.method} to ${appliedCount}/${targetCount} target exercises`);
    }
    
    console.log(`✅ Special method distribution applied to session ${sessionId}`);
  }

  /**
   * Get default configuration for special training methods
   */
  private static getDefaultSpecialMethodConfig(method: string): any {
    switch (method) {
      case 'myorep_match':
        return { targetReps: 15, miniSets: 3, restSeconds: 20 };
      case 'myorep_no_match':
        return { targetReps: 12, miniSets: 3, restSeconds: 25 };
      case 'drop_set':
        return { dropSets: 2, weightReductions: [20, 20], dropRestSeconds: 10 };
      case 'superset':
        return { pairedExercises: 2, restBetweenExercises: 0, restBetweenSets: 90 };
      case 'giant_set':
        return { exercisesInSet: 3, restBetweenExercises: 0, restBetweenSets: 120 };
      default:
        return {};
    }
  }
}