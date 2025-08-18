import { db } from "../db";
import { 
  mesocycles, 
  weeklyVolumeTracking, 
  volumeLandmarks, 
  muscleGroups,
  autoRegulationFeedback,
  workoutSessions,
  workoutExercises,
  loadProgressionTracking,
  exerciseMuscleMapping
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, isNotNull, inArray } from "drizzle-orm";
import { TemplateEngine } from "./template-engine";
import { RPAlgorithmCore } from "./rp-algorithm-core";

interface VolumeProgression {
  muscleGroupId: number;
  muscleGroupName?: string;
  week: number;
  targetSets: number;
  phase: 'accumulation' | 'intensification' | 'deload';
}

interface MesocycleRecommendation {
  shouldDeload: boolean;
  nextWeekVolume: VolumeProgression[];
  phaseTransition?: {
    currentPhase: string;
    nextPhase: string;
    reason: string;
  };
  fatigueFeedback: {
    overallFatigue: number;
    recoveryLevel: number;
    recommendations: string[];
  };
}

export class MesocyclePeriodization {
  
  /**
   * Calculate volume progression for next week based on RP methodology
   */
  static async calculateVolumeProgression(
    userId: number, 
    currentWeek: number,
    totalWeeks: number = 6
  ): Promise<VolumeProgression[]> {
    
    // Get user's volume landmarks for all muscle groups with names
    const landmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        currentVolume: volumeLandmarks.currentVolume,
        recoveryLevel: volumeLandmarks.recoveryLevel,
        adaptationLevel: volumeLandmarks.adaptationLevel
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, userId));

    const progressions: VolumeProgression[] = [];
    
    for (const landmark of landmarks) {
      let targetSets = landmark.mev; // Start at MEV
      let phase: 'accumulation' | 'intensification' | 'deload' = 'accumulation';
      
      // Use unified RP Volume Progression Algorithm
      const progression = RPAlgorithmCore.calculateVolumeProgression(currentWeek, totalWeeks, {
        mev: landmark.mev,
        mav: landmark.mav,
        mrv: landmark.mrv,
        recoveryLevel: landmark.recoveryLevel,
        adaptationLevel: landmark.adaptationLevel
      });
      
      targetSets = progression.targetSets;
      phase = progression.phase;
      
      progressions.push({
        muscleGroupId: landmark.muscleGroupId,
        muscleGroupName: landmark.muscleGroupName,
        week: currentWeek + 1,
        targetSets: Math.max(targetSets, landmark.mev), // Never go below MEV except deload
        phase
      });
    }
    
    return progressions;
  }

  /**
   * Analyze fatigue accumulation and determine deload necessity
   */
  static async analyzeFatigueAccumulation(userId: number): Promise<{
    shouldDeload: boolean;
    fatigueScore: number;
    reasons: string[];
  }> {
    // Use unified RP Algorithm Core for fatigue analysis
    const analysis = await RPAlgorithmCore.analyzeFatigue(userId, 10);
    
    return {
      shouldDeload: analysis.deloadRecommended,
      fatigueScore: analysis.overallFatigue,
      reasons: analysis.reasons
    };
  }

  /**
   * Generate complete mesocycle recommendations
   */
  static async generateMesocycleRecommendations(userId: number): Promise<MesocycleRecommendation> {
    
    // Get current active mesocycle
    const currentMesocycle = await db
      .select()
      .from(mesocycles)
      .where(and(eq(mesocycles.userId, userId), eq(mesocycles.isActive, true)))
      .orderBy(desc(mesocycles.createdAt))
      .limit(1);

    const mesocycle = currentMesocycle[0];
    
    // If no active mesocycle, return minimal recommendations with empty volume data
    if (!mesocycle) {
      const fatigueAnalysis = await this.analyzeFatigueAccumulation(userId);
      
      return {
        shouldDeload: fatigueAnalysis.shouldDeload,
        nextWeekVolume: [], // Empty array when no active mesocycle
        phaseTransition: undefined,
        fatigueFeedback: {
          overallFatigue: fatigueAnalysis.fatigueScore,
          recoveryLevel: 10 - fatigueAnalysis.fatigueScore,
          recommendations: [
            "No active mesocycle - consider creating a new training program",
            "Focus on establishing consistent training routine",
            "Set appropriate volume landmarks for muscle groups"
          ]
        }
      };
    }

    const currentWeek = mesocycle.currentWeek || 1;
    const totalWeeks = mesocycle.totalWeeks || 6;

    // Analyze fatigue
    const fatigueAnalysis = await this.analyzeFatigueAccumulation(userId);
    
    // Calculate volume progression only if there's an active mesocycle
    const nextWeekVolume = await this.calculateVolumeProgression(userId, currentWeek, totalWeeks);

    // Determine phase transitions
    let phaseTransition = undefined;
    if (mesocycle) {
      const currentPhase = mesocycle.phase;
      let nextPhase = currentPhase;
      let reason = "";

      if (fatigueAnalysis.shouldDeload) {
        nextPhase = 'deload';
        reason = "High fatigue accumulation detected";
      } else if (currentWeek >= totalWeeks - 1 && currentPhase === 'accumulation') {
        nextPhase = 'intensification';
        reason = "Entering intensification phase";
      } else if (currentWeek >= totalWeeks && currentPhase === 'intensification') {
        nextPhase = 'deload';
        reason = "Mesocycle complete, entering deload";
      }

      if (nextPhase !== currentPhase) {
        phaseTransition = { currentPhase, nextPhase, reason };
      }
    }

    // Generate recovery recommendations
    const recommendations: string[] = [];
    
    if (fatigueAnalysis.fatigueScore > 5) {
      recommendations.push("Consider additional rest days");
      recommendations.push("Focus on sleep quality and stress management");
      recommendations.push("Reduce training intensity by 10-15%");
    }
    
    if (fatigueAnalysis.fatigueScore < 3) {
      recommendations.push("Recovery is excellent - can maintain or increase volume");
      recommendations.push("Consider adding specialization work");
    }

    return {
      shouldDeload: fatigueAnalysis.shouldDeload,
      nextWeekVolume,
      phaseTransition,
      fatigueFeedback: {
        overallFatigue: fatigueAnalysis.fatigueScore,
        recoveryLevel: 10 - fatigueAnalysis.fatigueScore,
        recommendations
      }
    };
  }

  /**
   * Update volume landmarks based on auto-regulation feedback using RP methodology
   */
  static async updateVolumeLandmarksFromFeedback(
    userId: number,
    sessionId: number,
    feedbackData: {
      pumpQuality: number;
      muscleSoreness: number;
      perceivedEffort: number;
      energyLevel: number;
      sleepQuality: number;
    }
  ): Promise<void> {
    
    // Get exercises from the session to determine muscle groups trained
    const sessionExercises = await db
      .select({
        exerciseId: workoutExercises.exerciseId,
        sets: workoutExercises.sets,
        isCompleted: workoutExercises.isCompleted,
        weight: workoutExercises.weight,
        rpe: workoutExercises.rpe,
        rir: workoutExercises.rir
      })
      .from(workoutExercises)
      .where(and(
        eq(workoutExercises.sessionId, sessionId),
        eq(workoutExercises.isCompleted, true)
      ));

    // Get muscle group mappings for completed exercises
    const muscleGroupMappings = await db
      .select({
        muscleGroupId: exerciseMuscleMapping.muscleGroupId,
        contributionPercentage: exerciseMuscleMapping.contributionPercentage,
        role: exerciseMuscleMapping.role,
        exerciseId: exerciseMuscleMapping.exerciseId
      })
      .from(exerciseMuscleMapping)
      .where(
        inArray(exerciseMuscleMapping.exerciseId, sessionExercises.map(e => e.exerciseId))
      );

    // Calculate sets per muscle group from this session
    const muscleGroupSets = new Map<number, number>();
    for (const exercise of sessionExercises) {
      const mappings = muscleGroupMappings.filter(m => m.exerciseId === exercise.exerciseId);
      
      for (const mapping of mappings) {
        // Use contribution percentage as multiplier (convert from percentage to decimal)
        const contributionMultiplier = (mapping.contributionPercentage || 50) / 100.0;
        const sets = exercise.sets * contributionMultiplier;
        
        muscleGroupSets.set(
          mapping.muscleGroupId,
          (muscleGroupSets.get(mapping.muscleGroupId) || 0) + sets
        );
      }
    }

    // Update volume landmarks for each trained muscle group
    for (const muscleGroupEntry of Array.from(muscleGroupSets.entries())) {
      const [muscleGroupId, setsThisSession] = muscleGroupEntry;
      await this.updateSingleMuscleGroupVolume(
        userId,
        muscleGroupId,
        setsThisSession,
        feedbackData
      );
    }
  }

  /**
   * Update volume landmarks for a single muscle group using RP methodology
   */
  static async updateSingleMuscleGroupVolume(
    userId: number, 
    muscleGroupId: number, 
    actualSets: number,
    feedbackData: {
      pumpQuality: number;
      muscleSoreness: number;
      perceivedEffort: number;
      energyLevel: number;
      sleepQuality: number;
    }
  ): Promise<void> {
    
    // Get current volume landmarks
    const currentLandmarks = await db
      .select()
      .from(volumeLandmarks)
      .where(and(
        eq(volumeLandmarks.userId, userId),
        eq(volumeLandmarks.muscleGroupId, muscleGroupId)
      ))
      .limit(1);

    if (currentLandmarks.length === 0) {
      // Initialize landmarks if they don't exist
      console.log(`Initializing volume landmarks for muscle group ${muscleGroupId}`);
      return;
    }

    const landmarks = currentLandmarks[0];

    // Renaissance Periodization Volume Adjustment Algorithm
    // Based on multiple feedback indicators following RP methodology
    
    // 1. Calculate Recovery Score (0-10) from multiple indicators
    const recoveryScore = this.calculateRecoveryScore(feedbackData);
    
    // 2. Calculate Adaptation Score (0-10) based on pump quality and performance
    const adaptationScore = this.calculateAdaptationScore(feedbackData, actualSets, landmarks.targetVolume || landmarks.currentVolume);
    
    // 3. Determine Volume Adjustment using RP progression rules
    const volumeAdjustment = this.calculateVolumeAdjustment(
      recoveryScore, 
      adaptationScore, 
      landmarks.currentVolume,
      landmarks.mev,
      landmarks.mav,
      landmarks.mrv
    );

    // 4. Update volume landmarks with RP methodology
    const newCurrentVolume = Math.max(landmarks.mev, Math.min(landmarks.mrv, landmarks.currentVolume + volumeAdjustment));
    const newTargetVolume = this.calculateNextWeekTarget(newCurrentVolume, recoveryScore, adaptationScore, landmarks.mav);
    const newRecoveryLevel = Math.max(1, Math.min(10, Math.round(recoveryScore)));
    const newAdaptationLevel = Math.max(1, Math.min(10, Math.round(adaptationScore)));

    // 5. Apply updates to database
    await db
      .update(volumeLandmarks)
      .set({
        currentVolume: newCurrentVolume,
        targetVolume: newTargetVolume,
        recoveryLevel: newRecoveryLevel,
        adaptationLevel: newAdaptationLevel,
        lastUpdated: new Date()
      })
      .where(and(
        eq(volumeLandmarks.userId, userId),
        eq(volumeLandmarks.muscleGroupId, muscleGroupId)
      ));

    console.log(`Updated volume landmarks for muscle group ${muscleGroupId}: ${landmarks.currentVolume} → ${newCurrentVolume} sets (target: ${newTargetVolume})`)
  }

  /**
   * Calculate recovery score using RP methodology (0-10 scale)
   */
  private static calculateRecoveryScore(feedbackData: {
    pumpQuality: number;
    muscleSoreness: number;
    perceivedEffort: number;
    energyLevel: number;
    sleepQuality: number;
  }): number {
    // RP methodology: Lower soreness and effort = better recovery
    const sorenessRecovery = 10 - feedbackData.muscleSoreness; // Invert soreness (lower is better)
    const effortRecovery = 10 - feedbackData.perceivedEffort; // Invert effort (lower is better)
    const energyScore = feedbackData.energyLevel; // Higher is better
    const sleepScore = feedbackData.sleepQuality; // Higher is better
    
    // Weighted average: soreness and effort most important for volume decisions
    return (sorenessRecovery * 0.3 + effortRecovery * 0.3 + energyScore * 0.25 + sleepScore * 0.15);
  }

  /**
   * Calculate adaptation score using RP methodology (0-10 scale)
   */
  private static calculateAdaptationScore(
    feedbackData: { pumpQuality: number },
    actualSets: number,
    targetSets: number
  ): number {
    // RP methodology: Pump quality is primary indicator of muscle adaptation
    const pumpScore = feedbackData.pumpQuality;
    
    // Bonus for completing target volume
    const volumeCompletion = targetSets > 0 ? Math.min(1.0, actualSets / targetSets) : 1.0;
    const volumeBonus = volumeCompletion >= 1.0 ? 1.0 : volumeCompletion * 0.5;
    
    return Math.min(10, pumpScore + volumeBonus);
  }

  /**
   * Calculate volume adjustment based on RP progression rules
   */
  private static calculateVolumeAdjustment(
    recoveryScore: number,
    adaptationScore: number,
    currentVolume: number,
    mev: number,
    mav: number,
    mrv: number
  ): number {
    // RP methodology volume progression rules
    
    // Excellent recovery AND adaptation (8+/10): Aggressive progression
    if (recoveryScore >= 8 && adaptationScore >= 8) {
      return currentVolume < mav ? 2 : 1; // +2 sets if below MAV, +1 if approaching MRV
    }
    
    // Good recovery OR adaptation (6-7/10): Conservative progression  
    if (recoveryScore >= 6 && adaptationScore >= 6) {
      return currentVolume < mav ? 1 : 0; // +1 set if below MAV, maintain if above
    }
    
    // Moderate recovery (4-6/10): Maintain current volume
    if (recoveryScore >= 4 && adaptationScore >= 4) {
      return 0; // Maintain
    }
    
    // Poor recovery (<4/10): Volume reduction required
    if (recoveryScore < 4 || adaptationScore < 4) {
      return currentVolume > mev ? -2 : -1; // -2 sets if above MEV, -1 to stay above MEV
    }
    
    return 0; // Default: maintain
  }

  /**
   * Calculate next week's target volume using RP methodology
   */
  private static calculateNextWeekTarget(
    currentVolume: number,
    recoveryScore: number,
    adaptationScore: number,
    mav: number
  ): number {
    // RP methodology: Plan next week based on current adaptation
    
    if (recoveryScore >= 7 && adaptationScore >= 7) {
      // Plan for progression next week
      return Math.min(mav, currentVolume + 1);
    } else if (recoveryScore >= 5 && adaptationScore >= 5) {
      // Plan to maintain next week
      return currentVolume;
    } else {
      // Plan potential reduction next week if recovery doesn't improve
      return Math.max(currentVolume - 1, currentVolume * 0.8);
    }
  }

  /**
   * Advance mesocycle to next week with intelligent progression
   */
  static async advanceWeek(mesocycleId: number): Promise<{
    success: boolean;
    newWeek: number;
    progressions: any[];
    specialMethodAdjustments: any[];
  }> {
    try {
      // Get current mesocycle
      const mesocycle = await db
        .select()
        .from(mesocycles)
        .where(eq(mesocycles.id, mesocycleId))
        .limit(1);

      if (mesocycle.length === 0) {
        throw new Error('Mesocycle not found');
      }

      const currentMesocycle = mesocycle[0];
      const newWeek = currentMesocycle.currentWeek + 1;

      if (newWeek > currentMesocycle.totalWeeks) {
        throw new Error('Mesocycle already completed');
      }

      // Calculate volume progressions for next week
      const progressions = await this.calculateVolumeProgression(
        currentMesocycle.userId,
        newWeek,
        currentMesocycle.totalWeeks
      );

      // Store userId for later use
      const userId = currentMesocycle.userId;

      // Update mesocycle current week
      await db
        .update(mesocycles)
        .set({
          currentWeek: newWeek
        })
        .where(eq(mesocycles.id, mesocycleId));

      // Generate new workout sessions for the advanced week
      await this.generateWeekWorkoutSessions(mesocycleId, newWeek, progressions);
      
      // Apply special training method adjustments to the new week's sessions
      const specialMethodAdjustments = await this.adjustSpecialTrainingMethods(
        userId, 
        mesocycleId, 
        newWeek, 
        progressions
      );

      return {
        success: true,
        newWeek,
        progressions,
        specialMethodAdjustments
      };
    } catch (error) {
      console.error('Error advancing mesocycle week:', error);
      throw error;
    }
  }

  /**
   * Adjust special training methods based on volume progression
   */
  static async adjustSpecialTrainingMethods(
    userId: number,
    mesocycleId: number,
    week: number,
    progressions: VolumeProgression[]
  ): Promise<any[]> {
    const adjustments: any[] = [];

    // Get all upcoming workout sessions for this week
    const upcomingSessions = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.mesocycleId, mesocycleId),
        sql`${workoutSessions.name} LIKE ${'%Week ' + week + '%'}`,
        eq(workoutSessions.isCompleted, false)
      ));

    for (const session of upcomingSessions) {
      const sessionExercises = await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.sessionId, session.id));

      for (const exercise of sessionExercises) {
        if (!exercise.specialMethod) {
          continue;
        }

        // Determine volume change direction for this exercise's muscle groups
        const volumeChange = this.determineVolumeChange(exercise.exerciseId, progressions);
        
        // Apply special training method adjustments
        const adjustment = this.applySpecialMethodProgression(
          exercise,
          volumeChange,
          week
        );

        if (adjustment.changed) {
          // Update the exercise in database
          await db
            .update(workoutExercises)
            .set({
              specialConfig: adjustment.newConfig,
              targetReps: adjustment.newTargetReps,
              notes: adjustment.reasoning
            })
            .where(eq(workoutExercises.id, exercise.id));

          adjustments.push({
            exerciseId: exercise.id,
            exerciseName: `Exercise ${exercise.exerciseId}`,
            method: exercise.specialMethod,
            change: adjustment.change,
            reasoning: adjustment.reasoning
          });
        }
      }
    }

    return adjustments;
  }

  /**
   * Apply special training method progression rules
   */
  static applySpecialMethodProgression(
    exercise: any,
    volumeChange: 'increase' | 'maintain' | 'decrease',
    week: number
  ): {
    changed: boolean;
    newConfig: any;
    newTargetReps: string;
    change: string;
    reasoning: string;
  } {
    const currentConfig = exercise.specialConfig || {};
    let newConfig = { ...currentConfig };
    let newTargetReps = exercise.targetReps;
    let changed = false;
    let change = '';
    let reasoning = '';

    switch (exercise.specialMethod) {
      case 'myorep_match':
        if (volumeChange === 'increase') {
          // Increase special training method target reps by +1 (use user-set value, no defaults)
          const currentSpecialReps = newConfig.targetReps;
          if (currentSpecialReps !== undefined && currentSpecialReps !== null) {
            newConfig.targetReps = currentSpecialReps + 1;
            change = '+1 special method target reps';
            reasoning = `Week ${week}: Increased training volume - MyoRep Match special target reps +1 (${currentSpecialReps} → ${newConfig.targetReps})`;
            changed = true;
          }
        } else if (volumeChange === 'decrease') {
          // Decrease special training method target reps by -1 (no lower limit)
          const currentSpecialReps = newConfig.targetReps;
          if (currentSpecialReps !== undefined && currentSpecialReps !== null) {
            newConfig.targetReps = currentSpecialReps - 1;
            change = '-1 special method target reps';
            reasoning = `Week ${week}: Decreased training volume - MyoRep Match special target reps -1 (${currentSpecialReps} → ${newConfig.targetReps})`;
            changed = true;
          }
        }
        break;

      case 'myorep_no_match':
        if (volumeChange === 'increase') {
          // Increase target reps by +1 (use user-set value, no defaults)
          const currentTargetReps = newConfig.targetReps;
          if (currentTargetReps !== undefined) {
            newConfig.targetReps = currentTargetReps + 1;
            change = '+1 target reps';
            reasoning = `Week ${week}: Increased training volume - MyoRep No Match target reps +1 (${currentTargetReps} → ${newConfig.targetReps})`;
            changed = true;
          }
        } else if (volumeChange === 'decrease') {
          // Decrease target reps by -1 (no lower limit)
          const currentTargetReps = newConfig.targetReps;
          if (currentTargetReps !== undefined) {
            newConfig.targetReps = currentTargetReps - 1;
            change = '-1 target reps';
            reasoning = `Week ${week}: Decreased training volume - MyoRep No Match target reps -1 (${currentTargetReps} → ${newConfig.targetReps})`;
            changed = true;
          }
        }
        break;

      case 'drop_set':
        if (volumeChange === 'increase') {
          // Increase target reps per drop by +1 (use user-set value, no upper limit)
          const currentTargetReps = newConfig.targetRepsPerDrop;
          if (currentTargetReps !== undefined) {
            newConfig.targetRepsPerDrop = currentTargetReps + 1;
            change = '+1 target reps per drop';
            reasoning = `Week ${week}: Increased training volume - Drop Set target reps per drop +1 (${currentTargetReps} → ${newConfig.targetRepsPerDrop})`;
            changed = true;
          }
        } else if (volumeChange === 'decrease') {
          // Decrease target reps per drop by -1 (no lower limit)
          const currentTargetReps = newConfig.targetRepsPerDrop;
          if (currentTargetReps !== undefined) {
            newConfig.targetRepsPerDrop = currentTargetReps - 1;
            change = '-1 target reps per drop';
            reasoning = `Week ${week}: Decreased training volume - Drop Set target reps per drop -1 (${currentTargetReps} → ${newConfig.targetRepsPerDrop})`;
            changed = true;
          }
        }
        break;

      case 'giant_set':
        if (volumeChange === 'increase') {
          // Increase total target reps by +5 (use user-set value, no upper limit)
          const currentTotalReps = newConfig.totalTargetReps;
          if (currentTotalReps !== undefined) {
            newConfig.totalTargetReps = currentTotalReps + 5;
            change = '+5 total target reps';
            reasoning = `Week ${week}: Increased training volume - Giant Set total target reps +5 (${currentTotalReps} → ${newConfig.totalTargetReps})`;
            changed = true;
          }
        } else if (volumeChange === 'decrease') {
          // Decrease total target reps by -5 (no lower limit)
          const currentTotalReps = newConfig.totalTargetReps;
          if (currentTotalReps !== undefined) {
            newConfig.totalTargetReps = currentTotalReps - 5;
            change = '-5 total target reps';
            reasoning = `Week ${week}: Decreased training volume - Giant Set total target reps -5 (${currentTotalReps} → ${newConfig.totalTargetReps})`;
            changed = true;
          }
        }
        break;

      case 'superset':
        // Superset: remain unchanged for all volume changes
        reasoning = `Week ${week}: Superset parameters maintained regardless of volume change`;
        break;

      default:
        break;
    }

    return {
      changed,
      newConfig,
      newTargetReps,
      change,
      reasoning
    };
  }

  /**
   * Parse reps range string (e.g., "8-12" -> {min: 8, max: 12})
   */
  static parseRepsRange(repsString: string): { min: number; max: number } {
    const parts = repsString.split('-');
    if (parts.length === 2) {
      return {
        min: parseInt(parts[0]) || 8,
        max: parseInt(parts[1]) || 12
      };
    }
    const single = parseInt(repsString) || 8;
    return { min: single, max: single };
  }

  /**
   * Determine volume change direction for an exercise based on muscle group progressions
   */
  static determineVolumeChange(
    exerciseId: number,
    progressions: VolumeProgression[]
  ): 'increase' | 'maintain' | 'decrease' {
    // This would need to be implemented based on exercise-to-muscle-group mapping
    // For now, we'll use a simple heuristic based on the progression phase
    const avgProgression = progressions.reduce((sum, p) => {
      if (p.phase === 'accumulation') return sum + 1;
      if (p.phase === 'deload') return sum - 1;
      return sum;
    }, 0) / progressions.length;

    if (avgProgression > 0.3) return 'increase';
    if (avgProgression < -0.3) return 'decrease';
    return 'maintain';
  }

  /**
   * Generate workout sessions for a specific week
   */
  static async generateWeekWorkoutSessions(
    mesocycleId: number,
    week: number,
    progressions: VolumeProgression[]
  ): Promise<void> {
    // Get mesocycle info
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId))
      .limit(1);

    if (!mesocycle) return;

    // Get previous week's sessions to use as templates for the new week
    const previousWeekSessions = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.mesocycleId, mesocycleId),
        sql`${workoutSessions.name} LIKE ${'%Week ' + (week - 1) + '%'}`
      ))
      .orderBy(workoutSessions.date);

    if (previousWeekSessions.length === 0) return;

    // Create new sessions for this week based on previous week's structure
    const sessionsToCreate = [];
    const startDate = new Date(mesocycle.startDate);
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    for (let i = 0; i < previousWeekSessions.length; i++) {
      const prevSession = previousWeekSessions[i];
      
      // Calculate new session date
      const sessionDate = new Date(startDate);
      const dayOffset = Math.floor(i * 7 / previousWeekSessions.length);
      sessionDate.setDate(startDate.getDate() + dayOffset);

      const sessionData = {
        userId: mesocycle.userId,
        mesocycleId: mesocycleId,
        programId: null,
        date: sessionDate,
        name: prevSession.name.replace(`Week ${week - 1}`, `Week ${week}`),
        isCompleted: false,
        totalVolume: 0,
        duration: prevSession.duration,
        version: "2.0",
        features: { spinnerSetInput: true, gestureNavigation: true },
        algorithm: "RP_BASED"
      };

      sessionsToCreate.push(sessionData);
    }

    // Create all sessions
    const createdSessions = await db.insert(workoutSessions).values(sessionsToCreate).returning();

    // Create exercises for each session based on previous week with progressions applied
    for (let i = 0; i < createdSessions.length; i++) {
      const newSession = createdSessions[i];
      const prevSession = previousWeekSessions[i];

      // Get exercises from previous week's session
      const prevExercises = await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.sessionId, prevSession.id))
        .orderBy(workoutExercises.orderIndex);

      // Apply progressions to create new exercises
      const exerciseInserts = prevExercises.map((exercise: any) => {
        // Apply volume progression adjustments here
        const volumeChange = this.determineVolumeChange(exercise.exerciseId, progressions);
        let newSets = exercise.sets;
        let newTargetReps = exercise.targetReps;
        
        // Apply basic volume adjustments
        if (volumeChange === 'increase' && newSets < 5) {
          newSets += 1;
        } else if (volumeChange === 'decrease' && newSets > 1) {
          newSets -= 1;
        }

        // Apply special training method progressions if present
        let adjustedSpecialConfig = exercise.specialConfig;
        let adjustedTargetReps = newTargetReps;
        let adjustedNotes = `Week ${week} progression applied`;
        
        if (exercise.specialMethod && exercise.specialMethod !== 'standard') {
          const volumeChange = this.determineVolumeChange(exercise.exerciseId, progressions);
          const specialAdjustment = this.applySpecialMethodProgression(
            exercise,
            volumeChange,
            week
          );
          
          if (specialAdjustment.changed) {
            adjustedSpecialConfig = specialAdjustment.newConfig;
            // Keep main target reps unchanged, only adjust special config
            adjustedNotes = specialAdjustment.reasoning;
          }
        }

        return {
          sessionId: newSession.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: newSets,
          targetReps: adjustedTargetReps,
          weight: null, // Will be calculated based on progression
          restPeriod: exercise.restPeriod,
          specialMethod: exercise.specialMethod,
          specialConfig: adjustedSpecialConfig,
          notes: adjustedNotes
        };
      });

      if (exerciseInserts.length > 0) {
        await db.insert(workoutExercises).values(exerciseInserts);
      }
    }

    console.log(`Generated ${createdSessions.length} sessions for Week ${week} with AI-driven progressions`);
  }

  /**
   * Create new mesocycle with custom program builder
   */
  static async createMesocycleWithProgram(
    userId: number,
    name: string,
    templateId?: number,
    totalWeeks: number = 6,
    customProgram?: any
  ): Promise<number> {
    
    // Deactivate current mesocycles
    await db
      .update(mesocycles)
      .set({ isActive: false })
      .where(eq(mesocycles.userId, userId));

    // Create new mesocycle
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));

    const result = await db
      .insert(mesocycles)
      .values({
        userId,
        templateId,
        name,
        startDate,
        endDate,
        currentWeek: 1,
        totalWeeks,
        phase: 'accumulation',
        isActive: true
      })
      .returning({ id: mesocycles.id });

    const mesocycleId = result[0].id;

    // Always generate mesocycle program (use default if no template/custom program)
    await this.generateMesocycleProgram(mesocycleId, templateId, customProgram);

    return mesocycleId;
  }

  /**
   * Update mesocycle (pause, restart, modify)
   */
  static async updateMesocycle(mesocycleId: number, updateData: any) {
    const result = await db
      .update(mesocycles)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(mesocycles.id, mesocycleId))
      .returning();

    return result[0];
  }

  /**
   * Delete mesocycle and associated data
   */
  static async deleteMesocycle(mesocycleId: number) {
    // Delete associated workout sessions and their related data
    const sessionsToDelete = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(eq(workoutSessions.mesocycleId, mesocycleId));

    for (const session of sessionsToDelete) {
      // Delete load progression tracking for this session (CRITICAL - this was missing!)
      await db
        .delete(loadProgressionTracking)
        .where(eq(loadProgressionTracking.sessionId, session.id));
      
      // Delete workout exercises for this session
      await db
        .delete(workoutExercises)
        .where(eq(workoutExercises.sessionId, session.id));
      
      // Delete auto-regulation feedback for this session
      await db
        .delete(autoRegulationFeedback)
        .where(eq(autoRegulationFeedback.sessionId, session.id));
    }

    // Delete the workout sessions
    await db
      .delete(workoutSessions)
      .where(eq(workoutSessions.mesocycleId, mesocycleId));

    // Finally delete the mesocycle
    await db
      .delete(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));
  }

  /**
   * Get mesocycle program (weekly workout plan)
   */
  static async getMesocycleProgram(mesocycleId: number) {
    // Get mesocycle details
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }

    // Get planned workout sessions for this mesocycle
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.mesocycleId, mesocycleId))
      .orderBy(workoutSessions.date);

    return {
      mesocycle,
      weeklyProgram: this.organizeSessionsByWeek(sessions, mesocycle.startDate),
      currentWeek: mesocycle.currentWeek,
      totalWeeks: mesocycle.totalWeeks
    };
  }



  /**
   * Generate mesocycle program from template - FIXED to properly use TemplateEngine
   */
  static async generateMesocycleProgram(
    mesocycleId: number, 
    templateId?: number, 
    customProgram?: any
  ) {
    // Get mesocycle details
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }

    if (templateId) {
      // Use TemplateEngine to generate proper template-based sessions
      console.log(`🔄 Generating Week 1 workouts for mesocycle ${mesocycleId} from template ${templateId}`);
      
      try {
        const templateSessions = await TemplateEngine.generateFullProgramFromTemplate(
          mesocycle.userId,
          templateId,
          mesocycleId,
          mesocycle.startDate
        );
        
        console.log(`✅ Generated ${templateSessions.totalWorkouts} sessions for Week 1 with volume adjustments`);
        return templateSessions;
        
      } catch (error) {
        console.error("Template generation failed, falling back to default program:", error);
        // Fall back to default program if template fails
        await this.createDefaultMesocycleWorkouts(mesocycleId);
      }
    } else if (customProgram && customProgram.weeklyStructure) {
      // Use custom program design
      await this.createMesocycleWorkouts(mesocycleId, customProgram);
    } else {
      // Use default program structure
      await this.createDefaultMesocycleWorkouts(mesocycleId);
    }
  }

  /**
   * Create default mesocycle workouts when no template is provided
   */
  static async createDefaultMesocycleWorkouts(mesocycleId: number) {
    const program = {
      weeklyStructure: [
        { 
          dayOfWeek: 0, 
          name: "Push Day", 
          exercises: [
            { exerciseId: 372, sets: 3, targetReps: "8-10", restPeriod: 180 },
            { exerciseId: 373, sets: 3, targetReps: "6-8", restPeriod: 120 }
          ]
        },
        { 
          dayOfWeek: 2, 
          name: "Pull Day", 
          exercises: [
            { exerciseId: 374, sets: 3, targetReps: "6-10", restPeriod: 120 },
            { exerciseId: 375, sets: 3, targetReps: "8-12", restPeriod: 120 }
          ]
        },
        { 
          dayOfWeek: 4, 
          name: "Legs Day", 
          exercises: [
            { exerciseId: 376, sets: 3, targetReps: "8-12", restPeriod: 180 },
            { exerciseId: 377, sets: 3, targetReps: "8-10", restPeriod: 180 }
          ]
        }
      ]
    };

    await this.createMesocycleWorkouts(mesocycleId, program);
  }

  /**
   * Create workout sessions for week 1 only (correct mesocycle workflow)
   */
  static async createMesocycleWorkouts(mesocycleId: number, program: any) {
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) return;

    const startDate = new Date(mesocycle.startDate);
    
    // Generate sessions for WEEK 1 ONLY (subsequent weeks created by Advance Week)
    const week = 1;
    for (const dayProgram of program.weeklyStructure) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + ((week - 1) * 7) + dayProgram.dayOfWeek);

      // Create workout session linked to mesocycle
      const sessionResult = await db
        .insert(workoutSessions)
        .values({
          userId: mesocycle.userId,
          programId: null, // Not linked to training program
          mesocycleId: mesocycleId, // Link to mesocycle
          name: `${dayProgram.name} - Week ${week}`,
          date: sessionDate,
          isCompleted: false,
          totalVolume: 0,
          duration: 0,
          createdAt: new Date()
        })
        .returning({ id: workoutSessions.id });

      // Add exercises to session based on program
      if (dayProgram.exercises && dayProgram.exercises.length > 0) {
        for (let i = 0; i < dayProgram.exercises.length; i++) {
          const exercise = dayProgram.exercises[i];
          await db
            .insert(workoutExercises)
            .values({
              sessionId: sessionResult[0].id,
              exerciseId: exercise.exerciseId || exercise.id,
              orderIndex: i,
              sets: exercise.sets || 3,
              targetReps: exercise.targetReps || "8-12",
              actualReps: null,
              weight: null,
              rpe: null,
              rir: null,
              restPeriod: exercise.restPeriod || 120,
              notes: null,
              isCompleted: false
            });
        }
      }
    }

    console.log(`✅ Mesocycle ${mesocycleId}: Created Week 1 sessions only`);
  }

  /**
   * Generate workouts for specific week with volume adjustments
   */
  static async generateWeekWorkouts(
    mesocycleId: number, 
    week: number, 
    volumeAdjustments: VolumeProgression[]
  ) {
    console.log(`🔄 Generating Week ${week} workouts for mesocycle ${mesocycleId}`);
    
    // Get mesocycle details
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }

    // CRITICAL SAFEGUARD: Check if sessions for this week already exist
    const existingSessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.mesocycleId, mesocycleId),
          sql`${workoutSessions.name} LIKE '%Week ${week}%'`
        )
      );

    if (existingSessions.length > 0) {
      console.log(`⚠️ Week ${week} sessions already exist for mesocycle ${mesocycleId}. Skipping generation.`);
      return { message: `Week ${week} sessions already exist`, existingSessions: existingSessions.length };
    }

    // Get base program structure from Week 1 sessions
    const week1Sessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.mesocycleId, mesocycleId),
          gte(workoutSessions.date, mesocycle.startDate),
          lte(workoutSessions.date, new Date(mesocycle.startDate.getTime() + 7 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(workoutSessions.date);

    const startDate = new Date(mesocycle.startDate);
    
    // Create sessions for the new week
    for (const baseSession of week1Sessions) {
      // Calculate new session date
      const sessionDate = new Date(baseSession.date);
      sessionDate.setDate(sessionDate.getDate() + ((week - 1) * 7));

      // Get exercises from base session
      const baseExercises = await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.sessionId, baseSession.id))
        .orderBy(workoutExercises.orderIndex);

      // Create new session for this week
      const sessionName = baseSession.name.replace(/Week \d+/, `Week ${week}`);
      const sessionResult = await db
        .insert(workoutSessions)
        .values({
          userId: mesocycle.userId,
          programId: null,
          mesocycleId: mesocycleId,
          name: sessionName,
          date: sessionDate,
          isCompleted: false,
          totalVolume: 0,
          duration: 0,
          createdAt: new Date()
        })
        .returning({ id: workoutSessions.id });

      // Add exercises with volume adjustments and auto-progression
      for (const exercise of baseExercises) {
        // Apply volume adjustments based on muscle groups using RP methodology
        let adjustedSets = exercise.sets;
        
        // Get muscle groups for this exercise to apply volume adjustments
        const exerciseMuscleGroups = await db
          .select({
            muscleGroupId: exerciseMuscleMapping.muscleGroupId,
            role: exerciseMuscleMapping.role
          })
          .from(exerciseMuscleMapping)
          .where(eq(exerciseMuscleMapping.exerciseId, exercise.exerciseId));



        if (exerciseMuscleGroups.length > 0) {
          // Apply volume progression based on primary muscle group
          const primaryMuscleGroup = exerciseMuscleGroups.find(emg => emg.role === 'primary') 
            || exerciseMuscleGroups[0];
          
          const volumeProgression = volumeAdjustments.find(va => 
            va.muscleGroupId === primaryMuscleGroup.muscleGroupId
          );

          if (volumeProgression) {
            // Calculate set adjustment based on RP volume progression
            const baselineVolume = Math.max(adjustedSets, 1); // Minimum 1 set
            
            // Apply RP progression: adjust sets based on target volume for muscle group
            if (volumeProgression.phase === 'accumulation') {
              // Progressive volume increase during accumulation
              adjustedSets = Math.min(volumeProgression.targetSets, baselineVolume + Math.ceil((week - 1) * 0.5));
            } else if (volumeProgression.phase === 'intensification') {
              // Peak volume during intensification
              adjustedSets = volumeProgression.targetSets;
            } else if (volumeProgression.phase === 'deload') {
              // Reduced volume during deload
              adjustedSets = Math.max(Math.round(baselineVolume * 0.7), 1);
            }
            
            console.log(`📊 Exercise ${exercise.exerciseId}: ${exercise.sets} → ${adjustedSets} sets (${volumeProgression.phase} phase, muscle group ${volumeProgression.muscleGroupName})`);
          }
        }

        // Get the latest completed exercise data for auto-progression
        let progressedWeight = exercise.weight;
        let progressedRpe = exercise.rpe;
        let progressedRir = exercise.rir;
        let progressedTargetReps = exercise.targetReps;
        let progressedActualReps = null;

        if (week > 1) {
          // Find the most recent completed exercise for this exercise type
          const previousWeekExercises = await db
            .select()
            .from(workoutExercises)
            .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
            .where(
              and(
                eq(workoutSessions.mesocycleId, mesocycleId),
                eq(workoutExercises.exerciseId, exercise.exerciseId),
                eq(workoutSessions.isCompleted, true),
                isNotNull(workoutExercises.weight)
              )
            )
            .orderBy(desc(workoutSessions.date))
            .limit(1);

          if (previousWeekExercises.length > 0) {
            const lastExercise = previousWeekExercises[0].workout_exercises;
            const lastWeight = lastExercise.weight;
            const lastRpe = lastExercise.rpe;
            const lastRir = lastExercise.rir;
            const lastActualReps = lastExercise.actualReps;

            // RP Auto-progression logic
            if (lastWeight && lastRpe) {
              const weightNum = parseFloat(lastWeight.toString());
              // If RPE was 8+ and RIR was 0-1 (or null), increase weight by 2.5-5%
              if (lastRpe >= 8 && (lastRir === null || lastRir <= 1)) {
                progressedWeight = (Math.round((weightNum * 1.025) * 4) / 4).toString(); // 2.5% increase, rounded to nearest 0.25
                progressedRpe = Math.max(7, Math.min(8, lastRpe)); // Target similar RPE
                progressedRir = Math.max(1, Math.min(2, (lastRir || 0) + 1)); // Slightly more RIR with heavier weight
              }
              // If RPE was 6-7 and RIR was 2-3, increase weight by 5-7.5%
              else if (lastRpe >= 6 && lastRpe <= 7 && lastRir !== null && lastRir >= 2 && lastRir <= 3) {
                progressedWeight = (Math.round((weightNum * 1.05) * 4) / 4).toString(); // 5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe + 1)); // Target slightly higher RPE
                progressedRir = Math.max(1, Math.min(2, lastRir)); // Maintain RIR
              }
              // If RPE was <6 and RIR was 4+, increase weight by 7.5-10%
              else if (lastRpe < 6 && lastRir !== null && lastRir >= 4) {
                progressedWeight = (Math.round((weightNum * 1.075) * 4) / 4).toString(); // 7.5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe + 2)); // Target higher RPE
                progressedRir = Math.max(1, Math.min(3, lastRir - 1)); // Reduce RIR
              }
              // If RPE was too high (9-10), reduce weight slightly
              else if (lastRpe >= 9) {
                progressedWeight = (Math.round((weightNum * 0.975) * 4) / 4).toString(); // 2.5% decrease
                progressedRpe = 8; // Target lower RPE
                progressedRir = 2; // Target more RIR
              }
              // If RPE was 6-8 but RIR is null, apply conservative progression
              else if (lastRpe >= 6 && lastRpe <= 8 && lastRir === null) {
                progressedWeight = (Math.round((weightNum * 1.025) * 4) / 4).toString(); // 2.5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe)); // Target similar RPE
                progressedRir = 2; // Conservative RIR target
              }
              // Otherwise keep same weight
              else {
                progressedWeight = weightNum.toString();
                progressedRpe = lastRpe;
                progressedRir = lastRir || 2; // Default RIR if null
              }

              // Use previous week's target reps as starting point
              progressedTargetReps = exercise.targetReps;
              
              // Calculate suggested starting reps based on previous performance
              if (lastActualReps) {
                // Parse the actual reps (could be "7,8,5" format)
                const repsArray = lastActualReps.split(',').map(r => parseInt(r.trim()));
                // Use the first set's reps as the suggested starting rep count
                const suggestedReps = repsArray[0];
                
                // Adjust based on progression strategy
                if (progressedWeight && parseFloat(progressedWeight) > parseFloat(lastWeight.toString())) {
                  // If weight increased, suggest slightly fewer reps
                  progressedActualReps = Math.max(suggestedReps - 1, 1).toString();
                } else if (progressedWeight && parseFloat(progressedWeight) === parseFloat(lastWeight.toString())) {
                  // Same weight, aim for same or more reps
                  progressedActualReps = Math.max(suggestedReps, 1).toString();
                } else {
                  // Weight decreased (rare), aim for more reps
                  progressedActualReps = Math.max(suggestedReps + 1, 1).toString();
                }
              }
            }
          }
        }

        // Get latest special training method data for this exercise to maintain consistency
        let specialMethodData = null;
        let specialConfigData = null;
        
        if (exercise.specialMethod) {
          // Use existing special method from base exercise
          specialMethodData = exercise.specialMethod;
          specialConfigData = exercise.specialConfig;
        } else {
          // Look for latest special training method data from recent sessions
          const recentSessions = await db
            .select({
              specialMethod: workoutExercises.specialMethod,
              specialConfig: workoutExercises.specialConfig
            })
            .from(workoutExercises)
            .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
            .where(
              and(
                eq(workoutExercises.exerciseId, exercise.exerciseId),
                eq(workoutSessions.userId, mesocycle.userId),
                isNotNull(workoutExercises.specialMethod)
              )
            )
            .orderBy(desc(workoutSessions.date))
            .limit(1);

          if (recentSessions.length > 0) {
            specialMethodData = recentSessions[0].specialMethod;
            specialConfigData = recentSessions[0].specialConfig;
            console.log(`🎯 Pre-filling special method for exercise ${exercise.exerciseId}: ${specialMethodData}`, specialConfigData);
          }
        }

        await db
          .insert(workoutExercises)
          .values({
            sessionId: sessionResult[0].id,
            exerciseId: exercise.exerciseId,
            orderIndex: exercise.orderIndex,
            sets: adjustedSets,
            targetReps: progressedTargetReps,
            actualReps: progressedActualReps,
            weight: progressedWeight?.toString() || null,
            rpe: progressedRpe,
            rir: progressedRir,
            restPeriod: exercise.restPeriod,
            notes: null,
            isCompleted: false,
            specialMethod: specialMethodData,
            specialConfig: specialConfigData
          });
      }
    }

    console.log(`✅ Generated ${week1Sessions.length} sessions for Week ${week} with volume adjustments`);
  }

  /**
   * Organize sessions by week for program display
   */
  static organizeSessionsByWeek(sessions: any[], startDate: Date) {
    const weeks: any = {};
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const daysDiff = Math.floor((sessionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const week = Math.floor(daysDiff / 7) + 1;
      
      if (!weeks[week]) {
        weeks[week] = [];
      }
      weeks[week].push(session);
    });
    
    return weeks;
  }
}