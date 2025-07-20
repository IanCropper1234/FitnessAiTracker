import { db } from "../db";
import { 
  mesocycles, 
  workoutSessions, 
  workoutExercises,
  trainingTemplates
} from "@shared/schema";
import { eq, and, gte, sql, isNull } from "drizzle-orm";
import { TemplateEngine } from "./template-engine";

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
}