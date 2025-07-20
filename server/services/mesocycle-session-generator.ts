import { db } from "../db";
import { 
  workoutSessions, 
  workoutExercises, 
  mesocycles
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { SessionCustomization } from "./session-customization";

export class MesocycleSessionGenerator {
  
  /**
   * Create additional workout session within active mesocycle
   * Maintains mesocycle structure and progression
   */
  static async createAdditionalSession(
    mesocycleId: number,
    sessionName: string,
    targetDate: Date,
    exerciseIds?: number[]
  ) {
    console.log(`➕ Creating additional session for mesocycle ${mesocycleId}`);
    
    // Get mesocycle details
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));
    
    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }
    
    if (!mesocycle.isActive) {
      throw new Error("Cannot add sessions to inactive mesocycle");
    }
    
    // Calculate which week this session belongs to
    const weekNumber = this.calculateWeekFromDate(
      targetDate, 
      mesocycle.startDate
    );
    
    if (weekNumber > mesocycle.totalWeeks) {
      throw new Error("Session date is beyond mesocycle duration");
    }
    
    // Create new session
    const [newSession] = await db
      .insert(workoutSessions)
      .values({
        userId: mesocycle.userId,
        mesocycleId: mesocycleId,
        name: `${sessionName} - Week ${weekNumber}`,
        date: targetDate,
        isCompleted: false,
        totalVolume: 0,
        duration: 0,
        createdAt: new Date()
      })
      .returning();
    
    // Add exercises if provided
    if (exerciseIds && exerciseIds.length > 0) {
      for (let i = 0; i < exerciseIds.length; i++) {
        await SessionCustomization.addExerciseToSession(
          newSession.id,
          exerciseIds[i],
          i + 1
        );
      }
    }
    
    console.log(`✅ Additional session created: ${newSession.id}`);
    return newSession;
  }
  
  /**
   * Create "Extra Day" sessions for flexible training
   * Examples: Cardio, Mobility, Arms, Abs
   */
  static async createExtraTrainingDay(
    mesocycleId: number,
    sessionType: 'cardio' | 'mobility' | 'arms' | 'abs' | 'custom',
    targetDate: Date,
    customName?: string
  ) {
    const sessionTemplates = {
      cardio: {
        name: "Cardio Session",
        exercises: [] // No lifting exercises
      },
      mobility: {
        name: "Mobility & Stretching",
        exercises: [] // Mobility work
      },
      arms: {
        name: "Arms Specialization",
        exercises: [376, 377] // Bicep curls, tricep exercises
      },
      abs: {
        name: "Abs & Core",
        exercises: [] // Core exercises
      },
      custom: {
        name: customName || "Custom Session",
        exercises: []
      }
    };
    
    const template = sessionTemplates[sessionType];
    
    return await this.createAdditionalSession(
      mesocycleId,
      template.name,
      targetDate,
      template.exercises
    );
  }
  
  /**
   * Duplicate existing session to different date
   * Useful for makeup sessions or extra volume
   */
  static async duplicateSessionToDate(
    sourceSessionId: number,
    targetDate: Date,
    newName?: string
  ) {
    console.log(`📋 Duplicating session ${sourceSessionId} to ${targetDate}`);
    
    // Get source session
    const [sourceSession] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sourceSessionId));
    
    if (!sourceSession) {
      throw new Error("Source session not found");
    }
    
    // Create new session
    const sessionName = newName || `${sourceSession.name} (Copy)`;
    const [newSession] = await db
      .insert(workoutSessions)
      .values({
        userId: sourceSession.userId,
        mesocycleId: sourceSession.mesocycleId,
        name: sessionName,
        date: targetDate,
        isCompleted: false,
        totalVolume: 0,
        duration: 0,
        createdAt: new Date()
      })
      .returning();
    
    // Copy all exercises
    const sourceExercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.sessionId, sourceSessionId));
    
    for (const exercise of sourceExercises) {
      await db
        .insert(workoutExercises)
        .values({
          sessionId: newSession.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          targetReps: exercise.targetReps,
          restPeriod: exercise.restPeriod,
          weight: null, // Fresh start
          actualReps: null,
          rpe: null,
          rir: null,
          isCompleted: false,
          notes: null
        });
    }
    
    console.log(`✅ Session duplicated successfully: ${newSession.id}`);
    return newSession;
  }
  
  /**
   * Create "Deload Week" session with reduced volume
   */
  static async createDeloadSession(
    mesocycleId: number,
    baseSessionId: number,
    targetDate: Date
  ) {
    console.log(`😌 Creating deload session from ${baseSessionId}`);
    
    // Get base session
    const [baseSession] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, baseSessionId));
    
    // Create deload session
    const [deloadSession] = await db
      .insert(workoutSessions)
      .values({
        userId: baseSession!.userId,
        mesocycleId: mesocycleId,
        name: `${baseSession!.name} (Deload)`,
        date: targetDate,
        isCompleted: false,
        totalVolume: 0,
        duration: 0,
        createdAt: new Date()
      })
      .returning();
    
    // Copy exercises with reduced volume (60% sets, lighter weight)
    const baseExercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.sessionId, baseSessionId));
    
    for (const exercise of baseExercises) {
      const deloadSets = Math.max(1, Math.floor(exercise.sets * 0.6));
      
      await db
        .insert(workoutExercises)
        .values({
          sessionId: deloadSession.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: deloadSets,
          targetReps: exercise.targetReps,
          restPeriod: exercise.restPeriod,
          weight: null,
          actualReps: null,
          rpe: null,
          rir: null,
          isCompleted: false,
          notes: "Deload week - reduced volume"
        });
    }
    
    return deloadSession;
  }
  
  /**
   * Calculate which week a date falls into relative to mesocycle start
   */
  private static calculateWeekFromDate(targetDate: Date, startDate: Date): number {
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  }
}