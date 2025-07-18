import { db } from "../db";
import { 
  loadProgressionTracking, 
  weeklyVolumeTracking,
  volumeLandmarks,
  workoutSessions,
  workoutExercises,
  exerciseMuscleMapping,
  autoRegulationFeedback
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Processes workout completion data into load progression tracking and volume updates
 * This service connects workout execution to the periodization systems
 */
export class WorkoutDataProcessor {

  /**
   * Process completed workout session to update load progression and volume tracking
   */
  static async processWorkoutCompletion(sessionId: number, userId: number) {
    try {
      // Get session details
      const [session] = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.id, sessionId));

      if (!session) {
        throw new Error("Session not found");
      }

      // Get workout exercises with performance data
      const exercises = await db
        .select({
          exerciseId: workoutExercises.exerciseId,
          sets: workoutExercises.sets,
          actualReps: workoutExercises.actualReps,
          weight: workoutExercises.weight,
          rpe: workoutExercises.rpe,
          rir: workoutExercises.rir,
          isCompleted: workoutExercises.isCompleted
        })
        .from(workoutExercises)
        .where(eq(workoutExercises.sessionId, sessionId));

      // Process each exercise for load progression
      for (const exercise of exercises) {
        if (exercise.isCompleted && exercise.actualReps && exercise.weight) {
          await this.updateLoadProgression(
            userId,
            exercise.exerciseId,
            sessionId,
            {
              weight: parseFloat(exercise.weight),
              reps: this.parseRepsString(exercise.actualReps),
              rpe: exercise.rpe,
              rir: exercise.rir,
              sets: exercise.sets,
              sessionDate: session.date
            }
          );
        }
      }

      // Update weekly volume tracking
      await this.updateWeeklyVolumeTracking(userId, sessionId, session.date);

      // Update volume landmarks based on actual performance
      await this.updateVolumeLandmarks(userId, sessionId);

      console.log(`Processed workout completion for session ${sessionId}`);
      
    } catch (error) {
      console.error("Error processing workout completion:", error);
      throw error;
    }
  }

  /**
   * Update load progression tracking for specific exercise
   */
  static async updateLoadProgression(
    userId: number,
    exerciseId: number,
    sessionId: number,
    data: {
      weight: number;
      reps: number[];
      rpe: number | null;
      rir: number | null;
      sets: number;
      sessionDate: Date;
    }
  ) {
    // Calculate volume (sets x reps x weight)
    const totalReps = data.reps.reduce((sum, reps) => sum + reps, 0);
    const volume = data.weight * totalReps;

    // Calculate 1RM estimate using Epley formula if RPE is available
    let estimatedOneRM = null;
    if (data.rpe && data.reps.length > 0) {
      const avgReps = totalReps / data.sets;
      const rpeMultiplier = this.getRPEMultiplier(data.rpe, avgReps);
      estimatedOneRM = data.weight * rpeMultiplier;
    }

    // Find previous best performance for comparison
    const previousBest = await db
      .select()
      .from(loadProgressionTracking)
      .where(
        and(
          eq(loadProgressionTracking.userId, userId),
          eq(loadProgressionTracking.exerciseId, exerciseId)
        )
      )
      .orderBy(desc(loadProgressionTracking.sessionDate))
      .limit(1);

    // Determine progression status
    let progressionStatus = 'maintained';
    if (previousBest.length > 0) {
      const prev = previousBest[0];
      const prevVolume = prev.volume || 0;
      const prevWeight = parseFloat(prev.weight) || 0;
      
      if (volume > prevVolume * 1.05) {
        progressionStatus = 'improved';
      } else if (data.weight > prevWeight * 1.025) {
        progressionStatus = 'improved';
      } else if (volume < prevVolume * 0.95) {
        progressionStatus = 'declined';
      }
    } else {
      progressionStatus = 'baseline';
    }

    // Insert new progression record
    await db.insert(loadProgressionTracking).values({
      userId,
      exerciseId,
      sessionId,
      sessionDate: data.sessionDate,
      weight: data.weight.toString(),
      reps: data.reps.join(','),
      volume,
      estimatedOneRM,
      rpe: data.rpe,
      rir: data.rir,
      progressionStatus,
      createdAt: new Date()
    });
  }

  /**
   * Update weekly volume tracking aggregated by muscle groups
   */
  static async updateWeeklyVolumeTracking(userId: number, sessionId: number, sessionDate: Date) {
    // Get week start date (Monday)
    const weekStart = new Date(sessionDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all exercises from this session with muscle group mapping
    const sessionExercises = await db
      .select({
        exerciseId: workoutExercises.exerciseId,
        sets: workoutExercises.sets,
        actualReps: workoutExercises.actualReps,
        weight: workoutExercises.weight,
        isCompleted: workoutExercises.isCompleted,
        muscleGroupId: exerciseMuscleMapping.muscleGroupId,
        volumeContribution: exerciseMuscleMapping.volumeContribution
      })
      .from(workoutExercises)
      .leftJoin(exerciseMuscleMapping, eq(workoutExercises.exerciseId, exerciseMuscleMapping.exerciseId))
      .where(
        and(
          eq(workoutExercises.sessionId, sessionId),
          eq(workoutExercises.isCompleted, true)
        )
      );

    // Aggregate volume by muscle group
    const muscleGroupVolumes = new Map<number, number>();

    for (const exercise of sessionExercises) {
      if (exercise.muscleGroupId && exercise.actualReps && exercise.weight) {
        const reps = this.parseRepsString(exercise.actualReps);
        const totalReps = reps.reduce((sum, r) => sum + r, 0);
        const volume = parseFloat(exercise.weight) * totalReps;
        const contribution = exercise.volumeContribution || 1.0;
        const adjustedVolume = volume * contribution;

        const currentVolume = muscleGroupVolumes.get(exercise.muscleGroupId) || 0;
        muscleGroupVolumes.set(exercise.muscleGroupId, currentVolume + adjustedVolume);
      }
    }

    // Update or create weekly volume tracking records
    for (const [muscleGroupId, volume] of muscleGroupVolumes) {
      // Check if record exists for this week
      const [existingRecord] = await db
        .select()
        .from(weeklyVolumeTracking)
        .where(
          and(
            eq(weeklyVolumeTracking.userId, userId),
            eq(weeklyVolumeTracking.muscleGroupId, muscleGroupId),
            gte(weeklyVolumeTracking.weekStartDate, weekStart),
            lte(weeklyVolumeTracking.weekStartDate, weekEnd)
          )
        );

      if (existingRecord) {
        // Update existing record
        await db
          .update(weeklyVolumeTracking)
          .set({
            totalVolume: (existingRecord.totalVolume || 0) + volume,
            totalSets: (existingRecord.totalSets || 0) + sessionExercises.filter(e => 
              e.muscleGroupId === muscleGroupId && e.isCompleted
            ).reduce((sum, e) => sum + e.sets, 0),
            updatedAt: new Date()
          })
          .where(eq(weeklyVolumeTracking.id, existingRecord.id));
      } else {
        // Create new record
        await db.insert(weeklyVolumeTracking).values({
          userId,
          muscleGroupId,
          weekStartDate: weekStart,
          totalVolume: volume,
          totalSets: sessionExercises.filter(e => 
            e.muscleGroupId === muscleGroupId && e.isCompleted
          ).reduce((sum, e) => sum + e.sets, 0),
          averageIntensity: null, // Will be calculated later
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  }

  /**
   * Update volume landmarks based on recent performance
   */
  static async updateVolumeLandmarks(userId: number, sessionId: number) {
    // Get recent auto-regulation feedback for this session
    const [feedback] = await db
      .select()
      .from(autoRegulationFeedback)
      .where(eq(autoRegulationFeedback.sessionId, sessionId))
      .limit(1);

    if (!feedback) {
      // Don't update landmarks without feedback
      return;
    }

    // Get all volume landmarks for this user
    const landmarks = await db
      .select()
      .from(volumeLandmarks)
      .where(eq(volumeLandmarks.userId, userId));

    // Update current volume and recovery metrics based on feedback
    for (const landmark of landmarks) {
      // Get weekly volume for this muscle group
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);

      const [weeklyData] = await db
        .select()
        .from(weeklyVolumeTracking)
        .where(
          and(
            eq(weeklyVolumeTracking.userId, userId),
            eq(weeklyVolumeTracking.muscleGroupId, landmark.muscleGroupId),
            gte(weeklyVolumeTracking.weekStartDate, weekStart)
          )
        );

      if (weeklyData) {
        // Update current volume
        const currentVolume = Math.round(weeklyData.totalSets);
        
        // Calculate recovery level based on feedback
        const recoveryLevel = this.calculateRecoveryLevel(feedback);
        
        // Calculate adaptation level based on pump quality and effort
        const adaptationLevel = this.calculateAdaptationLevel(feedback);

        await db
          .update(volumeLandmarks)
          .set({
            currentVolume,
            recoveryLevel,
            adaptationLevel,
            lastUpdated: new Date()
          })
          .where(eq(volumeLandmarks.id, landmark.id));
      }
    }
  }

  /**
   * Parse reps string (e.g., "8,10,12" or "8-10") into array of numbers
   */
  static parseRepsString(repsStr: string): number[] {
    if (repsStr.includes(',')) {
      return repsStr.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
    } else if (repsStr.includes('-')) {
      const avg = repsStr.split('-').map(r => parseInt(r.trim()));
      return [Math.round((avg[0] + avg[1]) / 2)];
    } else {
      const parsed = parseInt(repsStr.trim());
      return isNaN(parsed) ? [0] : [parsed];
    }
  }

  /**
   * Get RPE multiplier for 1RM estimation
   */
  static getRPEMultiplier(rpe: number, reps: number): number {
    // Simplified RPE to 1RM conversion table
    const rpeTable: Record<number, Record<number, number>> = {
      6: { 1: 0.89, 2: 0.86, 3: 0.83, 5: 0.77, 8: 0.71, 10: 0.65 },
      7: { 1: 0.92, 2: 0.89, 3: 0.86, 5: 0.81, 8: 0.75, 10: 0.69 },
      8: { 1: 0.96, 2: 0.92, 3: 0.89, 5: 0.84, 8: 0.78, 10: 0.72 },
      9: { 1: 1.00, 2: 0.96, 3: 0.92, 5: 0.87, 8: 0.81, 10: 0.75 },
      10: { 1: 1.00, 2: 1.00, 3: 0.96, 5: 0.91, 8: 0.84, 10: 0.78 }
    };

    const nearestRpe = Math.round(Math.max(6, Math.min(10, rpe)));
    const nearestReps = reps <= 1 ? 1 : reps <= 2 ? 2 : reps <= 3 ? 3 : reps <= 5 ? 5 : reps <= 8 ? 8 : 10;
    
    return 1 / (rpeTable[nearestRpe]?.[nearestReps] || 0.75);
  }

  /**
   * Calculate recovery level from auto-regulation feedback
   */
  static calculateRecoveryLevel(feedback: any): number {
    const sleepWeight = 0.3;
    const energyWeight = 0.3;
    const sorenessWeight = 0.4; // Inverted (lower soreness = better recovery)

    const sleepScore = feedback.sleepQuality || 5;
    const energyScore = feedback.energyLevel || 5;
    const sorenessScore = 11 - (feedback.muscleSoreness || 5); // Invert soreness

    const weightedScore = (sleepScore * sleepWeight) + 
                         (energyScore * energyWeight) + 
                         (sorenessScore * sorenessWeight);

    return Math.round(Math.max(1, Math.min(10, weightedScore)));
  }

  /**
   * Calculate adaptation level from auto-regulation feedback
   */
  static calculateAdaptationLevel(feedback: any): number {
    const pumpWeight = 0.5;
    const effortWeight = 0.3;
    const energyWeight = 0.2;

    const pumpScore = feedback.pumpQuality || 5;
    const effortScore = 11 - (feedback.perceivedEffort || 5); // Invert effort
    const energyScore = feedback.energyLevel || 5;

    const weightedScore = (pumpScore * pumpWeight) + 
                         (effortScore * effortWeight) + 
                         (energyScore * energyWeight);

    return Math.round(Math.max(1, Math.min(10, weightedScore)));
  }
}