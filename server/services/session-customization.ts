import { db } from "../db";
import { 
  workoutSessions, 
  workoutExercises, 
  exercises,
  exerciseMuscleMapping,
  volumeLandmarks
} from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export class SessionCustomization {
  
  /**
   * Add new exercise to existing mesocycle session
   * Maintains volume tracking and RP methodology
   */
  static async addExerciseToSession(
    sessionId: number, 
    exerciseId: number, 
    insertPosition?: number
  ) {
    console.log(`➕ Adding exercise ${exerciseId} to session ${sessionId}`);
    
    // Get session details to ensure it's part of a mesocycle
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId));
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Get existing exercises to determine order
    const existingExercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.sessionId, sessionId))
      .orderBy(workoutExercises.orderIndex);
    
    // Calculate smart defaults based on user's volume landmarks
    const exerciseDefaults = await this.calculateSmartDefaults(
      session.userId, 
      exerciseId
    );
    
    // Determine insert position
    const orderIndex = insertPosition ?? (existingExercises.length + 1);
    
    // Shift existing exercises if inserting in middle
    if (insertPosition && insertPosition <= existingExercises.length) {
      await this.shiftExerciseOrder(sessionId, insertPosition, 1);
    }
    
    // Create new exercise entry
    const [newExercise] = await db
      .insert(workoutExercises)
      .values({
        sessionId,
        exerciseId,
        orderIndex,
        sets: exerciseDefaults.sets,
        targetReps: exerciseDefaults.targetReps,
        restPeriod: exerciseDefaults.restPeriod,
        weight: null,
        actualReps: null,
        rpe: null,
        rir: null,
        isCompleted: false,
        notes: null
      })
      .returning();
    
    // If session is part of mesocycle, update future weeks
    if (session.mesocycleId) {
      await this.propagateExerciseToFutureWeeks(
        session.mesocycleId, 
        sessionId,
        newExercise.id,
        exerciseId
      );
    }
    
    console.log(`✅ Exercise added successfully to session ${sessionId}`);
    return newExercise;
  }
  
  /**
   * Remove exercise from session and future weeks
   */
  static async removeExerciseFromSession(sessionId: number, exerciseId: number) {
    console.log(`➖ Removing exercise ${exerciseId} from session ${sessionId}`);
    
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId));
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Remove from current session
    await db
      .delete(workoutExercises)
      .where(
        and(
          eq(workoutExercises.sessionId, sessionId),
          eq(workoutExercises.exerciseId, exerciseId)
        )
      );
    
    // If mesocycle session, remove from future weeks too
    if (session.mesocycleId) {
      await this.removeExerciseFromFutureWeeks(
        session.mesocycleId,
        exerciseId,
        session.date
      );
    }
    
    console.log(`✅ Exercise removed from session and future weeks`);
  }
  
  /**
   * Substitute one exercise for another
   */
  static async substituteExercise(
    sessionId: number, 
    oldExerciseId: number, 
    newExerciseId: number
  ) {
    console.log(`🔄 Substituting exercise ${oldExerciseId} → ${newExerciseId} in session ${sessionId}`);
    
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, sessionId));
    
    // Get current exercise details
    const [currentExercise] = await db
      .select()
      .from(workoutExercises)
      .where(
        and(
          eq(workoutExercises.sessionId, sessionId),
          eq(workoutExercises.exerciseId, oldExerciseId)
        )
      );
    
    if (!currentExercise) {
      throw new Error("Exercise not found in session");
    }
    
    // Calculate smart defaults for new exercise
    const newDefaults = await this.calculateSmartDefaults(
      session!.userId, 
      newExerciseId
    );
    
    // Update exercise while preserving completed data if any
    await db
      .update(workoutExercises)
      .set({
        exerciseId: newExerciseId,
        sets: currentExercise.isCompleted ? currentExercise.sets : newDefaults.sets,
        targetReps: currentExercise.isCompleted ? currentExercise.targetReps : newDefaults.targetReps,
        restPeriod: newDefaults.restPeriod,
        // Preserve completed data
        weight: currentExercise.weight,
        actualReps: currentExercise.actualReps,
        rpe: currentExercise.rpe,
        rir: currentExercise.rir,
        isCompleted: currentExercise.isCompleted
      })
      .where(eq(workoutExercises.id, currentExercise.id));
    
    // Update future weeks if mesocycle
    if (session!.mesocycleId) {
      await this.substituteExerciseInFutureWeeks(
        session!.mesocycleId,
        oldExerciseId,
        newExerciseId,
        session!.date
      );
    }
    
    console.log(`✅ Exercise substitution completed`);
  }
  
  /**
   * Calculate smart defaults based on user's volume landmarks and exercise type
   */
  private static async calculateSmartDefaults(userId: number, exerciseId: number) {
    // Get exercise details and muscle groups
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, exerciseId));
    
    const muscleMapping = await db
      .select()
      .from(exerciseMuscleMapping)
      .where(eq(exerciseMuscleMapping.exerciseId, exerciseId));
    
    // Get user's volume landmarks for relevant muscle groups
    const muscleGroupIds = muscleMapping.map(m => m.muscleGroupId);
    const landmarks = await db
      .select()
      .from(volumeLandmarks)
      .where(
        and(
          eq(volumeLandmarks.userId, userId),
          inArray(volumeLandmarks.muscleGroupId, muscleGroupIds)
        )
      );
    
    // Calculate appropriate sets based on MEV/MAV
    let recommendedSets = 3; // Default
    if (landmarks.length > 0) {
      const avgMev = landmarks.reduce((sum, l) => sum + l.mev, 0) / landmarks.length;
      const avgRecovery = landmarks.reduce((sum, l) => sum + l.recoveryLevel, 0) / landmarks.length;
      
      // Adjust based on recovery level
      if (avgRecovery < 5) {
        recommendedSets = Math.max(1, Math.floor(avgMev * 0.8));
      } else if (avgRecovery > 7) {
        recommendedSets = Math.min(6, Math.ceil(avgMev * 1.2));
      } else {
        recommendedSets = Math.round(avgMev);
      }
    }
    
    // Exercise type defaults
    const restPeriod = exercise?.category === 'compound' ? 180 : 
                      exercise?.category === 'isolation' ? 90 : 120;
    
    const targetReps = exercise?.category === 'compound' ? "5-8" :
                       exercise?.category === 'isolation' ? "10-15" : "8-12";
    
    return {
      sets: Math.max(1, Math.min(6, recommendedSets)),
      targetReps,
      restPeriod
    };
  }
  
  /**
   * Propagate exercise changes to future weeks in mesocycle
   */
  private static async propagateExerciseToFutureWeeks(
    mesocycleId: number,
    baseSessionId: number,
    newExerciseDbId: number,
    exerciseId: number
  ) {
    // Get base session details
    const [baseSession] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, baseSessionId));
    
    // Find similar sessions in future weeks
    const futureWeekSessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.mesocycleId, mesocycleId),
          sql`DATE(${workoutSessions.date}) > DATE(${baseSession!.date})`,
          sql`EXTRACT(DOW FROM ${workoutSessions.date}) = EXTRACT(DOW FROM ${baseSession!.date})`
        )
      );
    
    // Add exercise to each future session
    for (const futureSession of futureWeekSessions) {
      const [newExerciseData] = await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.id, newExerciseDbId));
      
      await db
        .insert(workoutExercises)
        .values({
          sessionId: futureSession.id,
          exerciseId,
          orderIndex: newExerciseData.orderIndex,
          sets: newExerciseData.sets,
          targetReps: newExerciseData.targetReps,
          restPeriod: newExerciseData.restPeriod,
          weight: null,
          actualReps: null,
          rpe: null,
          rir: null,
          isCompleted: false,
          notes: null
        });
    }
  }
  
  /**
   * Remove exercise from future weeks
   */
  private static async removeExerciseFromFutureWeeks(
    mesocycleId: number,
    exerciseId: number,
    fromDate: Date
  ) {
    await db
      .delete(workoutExercises)
      .where(
        and(
          eq(workoutExercises.exerciseId, exerciseId),
          sql`session_id IN (
            SELECT id FROM workout_sessions 
            WHERE mesocycle_id = ${mesocycleId} 
            AND date > ${fromDate}
          )`
        )
      );
  }
  
  /**
   * Substitute exercise in future weeks
   */
  private static async substituteExerciseInFutureWeeks(
    mesocycleId: number,
    oldExerciseId: number,
    newExerciseId: number,
    fromDate: Date
  ) {
    await db
      .update(workoutExercises)
      .set({ exerciseId: newExerciseId })
      .where(
        and(
          eq(workoutExercises.exerciseId, oldExerciseId),
          sql`session_id IN (
            SELECT id FROM workout_sessions 
            WHERE mesocycle_id = ${mesocycleId} 
            AND date > ${fromDate}
          )`
        )
      );
  }
  
  /**
   * Shift exercise order when inserting
   */
  private static async shiftExerciseOrder(
    sessionId: number, 
    fromPosition: number, 
    shiftAmount: number
  ) {
    await db
      .update(workoutExercises)
      .set({
        orderIndex: sql`order_index + ${shiftAmount}`
      })
      .where(
        and(
          eq(workoutExercises.sessionId, sessionId),
          sql`order_index >= ${fromPosition}`
        )
      );
  }
}