import { db } from "../db";
import { 
  mesocycles, 
  workoutSessions, 
  workoutExercises,
  trainingTemplates
} from "@shared/schema";
import { eq, and, gte, sql, isNull } from "drizzle-orm";
import { TemplateEngine } from "./template-engine";
import { SpecialMethodDistributionEngine } from "./special-method-distribution-engine";
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
      .where(eq(workoutSessions.userId, mesocycle.userId))
      .where(eq(workoutSessions.mesocycleId, null));
    
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
        phase: 'accumulation',
        updatedAt: new Date()
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
        isActive: true,
        updatedAt: new Date()
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
    console.log(`🧬 Creating enhanced mesocycle with special method distribution: ${config.specialMethodStrategy}`);
    
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
    
    // Step 3: Generate special method distribution
    const constraints: DistributionConstraints = {
      maxSpecialMethodsPerSession: 40, // Max 40% per session
      maxSpecialMethodsPerWeek: 50,    // Max 50% per week
      minimumRegularSetsPercentage: 50, // At least 50% regular training
      fatigueThreshold: 7,
      experienceLevel: 'intermediate' // Default to intermediate
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
    for (const [day, templateId] of Object.entries(config.dayTemplates)) {
      if (templateId) {
        const dayNumber = parseInt(day);
        const daySession = await TemplateEngine.generateFullProgramFromTemplate(
          userId,
          templateId,
          mesocycle.id,
          new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000), // Offset by day
          1, // Week 1
          config.totalWeeks
        );
        
        // Apply special method distribution to session
        await this.applySpecialMethodDistribution(
          daySession.sessions[0]?.sessionId,
          distribution.weeklyDistribution[0] // Week 1 distribution
        );
        
        sessions.push(...daySession.sessions);
      }
    }
    
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
   * Apply special method distribution to workout session
   */
  private static async applySpecialMethodDistribution(
    sessionId: number | undefined,
    weeklyDistribution: any
  ) {
    if (!sessionId || !weeklyDistribution) return;
    
    console.log(`🎯 Applying special method distribution to session ${sessionId}`);
    
    // Get session exercises
    const exercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.sessionId, sessionId));
    
    // Apply distribution logic based on allocations
    for (const allocation of weeklyDistribution.allocations) {
      const targetCount = Math.ceil((exercises.length * allocation.percentage) / 100);
      let appliedCount = 0;
      
      for (const exercise of exercises) {
        if (appliedCount >= targetCount) break;
        
        // Simple distribution logic - can be enhanced based on muscle groups
        if (!exercise.specialMethod) {
          await db
            .update(workoutExercises)
            .set({
              specialMethod: allocation.method,
              specialConfig: this.getDefaultSpecialMethodConfig(allocation.method)
            })
            .where(eq(workoutExercises.id, exercise.id));
          
          appliedCount++;
        }
      }
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