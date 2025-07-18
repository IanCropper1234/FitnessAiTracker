import { db } from "../db";
import { 
  mesocycles, 
  weeklyVolumeTracking, 
  volumeLandmarks, 
  muscleGroups,
  autoRegulationFeedback,
  workoutSessions,
  workoutExercises,
  loadProgressionTracking
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, isNotNull } from "drizzle-orm";

interface VolumeProgression {
  muscleGroupId: number;
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
    
    // Get user's volume landmarks for all muscle groups
    const landmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        currentVolume: volumeLandmarks.currentVolume,
        recoveryLevel: volumeLandmarks.recoveryLevel,
        adaptationLevel: volumeLandmarks.adaptationLevel
      })
      .from(volumeLandmarks)
      .where(eq(volumeLandmarks.userId, userId));

    const progressions: VolumeProgression[] = [];
    
    for (const landmark of landmarks) {
      let targetSets = landmark.mev; // Start at MEV
      let phase: 'accumulation' | 'intensification' | 'deload' = 'accumulation';
      
      // RP Volume Progression Algorithm
      if (currentWeek <= totalWeeks - 2) {
        // Accumulation phase: Progressive volume increase
        const progressionRate = (landmark.mav - landmark.mev) / (totalWeeks - 2);
        targetSets = Math.round(landmark.mev + (progressionRate * (currentWeek - 1)));
        
        // Apply auto-regulation adjustments
        if (landmark.recoveryLevel < 4) {
          // Poor recovery: reduce volume by 10-20%
          targetSets = Math.round(targetSets * 0.8);
        } else if (landmark.recoveryLevel > 7 && landmark.adaptationLevel > 6) {
          // Good recovery and adaptation: can push closer to MAV
          targetSets = Math.min(targetSets * 1.1, landmark.mav);
        }
        
        // Safety check: don't exceed MAV in accumulation
        targetSets = Math.min(targetSets, landmark.mav);
        phase = 'accumulation';
        
      } else if (currentWeek === totalWeeks - 1) {
        // Intensification phase: Push to MAV/MRV
        targetSets = landmark.recoveryLevel >= 6 ? landmark.mav : Math.round(landmark.mav * 0.9);
        phase = 'intensification';
        
      } else {
        // Deload week: Drop to MEV or below
        targetSets = Math.round(landmark.mev * 0.7);
        phase = 'deload';
      }
      
      progressions.push({
        muscleGroupId: landmark.muscleGroupId,
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
    
    // Get recent auto-regulation feedback (last 7 days)
    const recentFeedback = await db
      .select({
        pumpQuality: autoRegulationFeedback.pumpQuality,
        muscleSoreness: autoRegulationFeedback.muscleSoreness,
        perceivedEffort: autoRegulationFeedback.perceivedEffort,
        energyLevel: autoRegulationFeedback.energyLevel,
        sleepQuality: autoRegulationFeedback.sleepQuality,
        createdAt: autoRegulationFeedback.createdAt
      })
      .from(autoRegulationFeedback)
      .innerJoin(workoutSessions, eq(autoRegulationFeedback.sessionId, workoutSessions.id))
      .where(
        and(
          eq(autoRegulationFeedback.userId, userId),
          gte(autoRegulationFeedback.createdAt, sql`NOW() - INTERVAL '7 days'`)
        )
      )
      .orderBy(desc(autoRegulationFeedback.createdAt));

    if (recentFeedback.length === 0) {
      return { shouldDeload: false, fatigueScore: 0, reasons: [] };
    }

    // Calculate fatigue indicators
    const avgPump = recentFeedback.reduce((sum, f) => sum + f.pumpQuality, 0) / recentFeedback.length;
    const avgSoreness = recentFeedback.reduce((sum, f) => sum + f.muscleSoreness, 0) / recentFeedback.length;
    const avgEffort = recentFeedback.reduce((sum, f) => sum + f.perceivedEffort, 0) / recentFeedback.length;
    const avgEnergy = recentFeedback.reduce((sum, f) => sum + f.energyLevel, 0) / recentFeedback.length;
    const avgSleep = recentFeedback.reduce((sum, f) => sum + f.sleepQuality, 0) / recentFeedback.length;

    // RP Fatigue Analysis Algorithm
    const fatigueScore = (
      (10 - avgPump) * 0.25 +        // Poor pump quality indicates fatigue
      (avgSoreness) * 0.2 +          // High soreness indicates incomplete recovery
      (avgEffort) * 0.2 +            // High effort for same loads indicates fatigue
      (10 - avgEnergy) * 0.2 +       // Low energy indicates systemic fatigue
      (10 - avgSleep) * 0.15         // Poor sleep affects recovery
    );

    const reasons: string[] = [];
    let shouldDeload = false;

    // Deload triggers based on RP methodology
    if (avgPump < 6) {
      reasons.push("Pump quality declining (< 6/10)");
      shouldDeload = true;
    }
    if (avgSoreness > 7) {
      reasons.push("Excessive muscle soreness (> 7/10)");
      shouldDeload = true;
    }
    if (avgEffort > 8) {
      reasons.push("Perceived effort too high (> 8/10)");
      shouldDeload = true;
    }
    if (avgEnergy < 5) {
      reasons.push("Low energy levels (< 5/10)");
      shouldDeload = true;
    }
    if (avgSleep < 5) {
      reasons.push("Poor sleep quality (< 5/10)");
      shouldDeload = true;
    }

    // Overall fatigue score threshold
    if (fatigueScore > 6.5) {
      reasons.push(`High overall fatigue score (${fatigueScore.toFixed(1)}/10)`);
      shouldDeload = true;
    }

    return { shouldDeload, fatigueScore, reasons };
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
    const currentWeek = mesocycle?.currentWeek || 1;
    const totalWeeks = mesocycle?.totalWeeks || 6;

    // Analyze fatigue
    const fatigueAnalysis = await this.analyzeFatigueAccumulation(userId);
    
    // Calculate volume progression
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
   * Update volume landmarks based on current week performance
   */
  static async updateVolumeLandmarks(
    userId: number, 
    muscleGroupId: number, 
    actualSets: number,
    averageRpe: number,
    averageRir: number,
    pumpQuality: number,
    soreness: number
  ): Promise<void> {
    
    // Get current landmarks
    const current = await db
      .select()
      .from(volumeLandmarks)
      .where(and(
        eq(volumeLandmarks.userId, userId),
        eq(volumeLandmarks.muscleGroupId, muscleGroupId)
      ))
      .limit(1);

    if (current.length === 0) return;

    const landmark = current[0];
    
    // RP Auto-regulation algorithm for landmark adjustment
    let mevAdjustment = 0;
    let mavAdjustment = 0;
    let mrvAdjustment = 0;

    // Positive indicators: can handle more volume
    if (averageRpe < 7 && averageRir > 2 && pumpQuality > 7 && soreness < 5) {
      mavAdjustment = 1;
      mrvAdjustment = 1;
    }
    
    // Negative indicators: reduce volume capacity
    if (averageRpe > 8.5 || averageRir < 1 || pumpQuality < 5 || soreness > 7) {
      mavAdjustment = -1;
      mrvAdjustment = -2;
    }

    // Update landmarks with bounds checking
    const newMev = Math.max(6, landmark.mev + mevAdjustment);
    const newMav = Math.max(newMev + 4, Math.min(30, landmark.mav + mavAdjustment));
    const newMrv = Math.max(newMav + 2, Math.min(35, landmark.mrv + mrvAdjustment));

    await db
      .update(volumeLandmarks)
      .set({
        mev: newMev,
        mav: newMav,
        mrv: newMrv,
        currentVolume: actualSets,
        recoveryLevel: Math.round(10 - (soreness + (10 - pumpQuality)) / 2),
        adaptationLevel: Math.round((pumpQuality + (10 - averageRpe) + averageRir) / 3),
        lastUpdated: sql`NOW()`
      })
      .where(and(
        eq(volumeLandmarks.userId, userId),
        eq(volumeLandmarks.muscleGroupId, muscleGroupId)
      ));
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
   * Advance to next week with auto-regulation adjustments
   */
  static async advanceWeek(mesocycleId: number) {
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) {
      throw new Error("Mesocycle not found");
    }

    const nextWeek = mesocycle.currentWeek + 1;
    
    // Check if mesocycle is complete
    if (nextWeek > mesocycle.totalWeeks) {
      // Complete mesocycle and suggest deload
      await db
        .update(mesocycles)
        .set({
          isActive: false,
          phase: 'deload',
          updatedAt: new Date()
        })
        .where(eq(mesocycles.id, mesocycleId));

      return {
        mesocycleComplete: true,
        recommendation: "Mesocycle completed. Time for a deload week!"
      };
    }

    // Apply auto-regulation adjustments for next week
    const volumeAdjustments = await this.calculateVolumeProgression(
      mesocycle.userId, 
      nextWeek, 
      mesocycle.totalWeeks
    );

    // Update mesocycle week
    await db
      .update(mesocycles)
      .set({
        currentWeek: nextWeek,
        updatedAt: new Date()
      })
      .where(eq(mesocycles.id, mesocycleId));

    // Generate next week's workouts with adjusted volumes
    await this.generateWeekWorkouts(mesocycleId, nextWeek, volumeAdjustments);

    return {
      newWeek: nextWeek,
      volumeAdjustments,
      message: `Advanced to week ${nextWeek}. Volume adjusted based on auto-regulation feedback.`
    };
  }

  /**
   * Generate mesocycle program from template
   */
  static async generateMesocycleProgram(
    mesocycleId: number, 
    templateId?: number, 
    customProgram?: any
  ) {
    // Create simple program structure with basic exercises for templates
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

    if (customProgram && customProgram.weeklyStructure) {
      // Use custom program design
      await this.createMesocycleWorkouts(mesocycleId, customProgram);
    } else {
      // Use default program structure
      await this.createMesocycleWorkouts(mesocycleId, program);
    }
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
        // Apply volume adjustments based on muscle groups
        let adjustedSets = exercise.sets;
        
        // Calculate adjusted sets based on volume progressions
        const volumeProgression = volumeAdjustments.find(va => 
          // This would need muscle group mapping for more sophisticated adjustment
          va.week === week
        );

        if (volumeProgression) {
          // Apply volume adjustment (RP progression)
          const progressionFactor = week === 1 ? 1.0 : 1.0 + ((week - 1) * 0.1); // 10% progression per week
          adjustedSets = Math.round(exercise.sets * progressionFactor);
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
              // If RPE was 8+ and RIR was 0-1 (or null), increase weight by 2.5-5%
              if (lastRpe >= 8 && (lastRir === null || lastRir <= 1)) {
                progressedWeight = Math.round((lastWeight * 1.025) * 4) / 4; // 2.5% increase, rounded to nearest 0.25
                progressedRpe = Math.max(7, Math.min(8, lastRpe)); // Target similar RPE
                progressedRir = Math.max(1, Math.min(2, (lastRir || 0) + 1)); // Slightly more RIR with heavier weight
              }
              // If RPE was 6-7 and RIR was 2-3, increase weight by 5-7.5%
              else if (lastRpe >= 6 && lastRpe <= 7 && lastRir !== null && lastRir >= 2 && lastRir <= 3) {
                progressedWeight = Math.round((lastWeight * 1.05) * 4) / 4; // 5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe + 1)); // Target slightly higher RPE
                progressedRir = Math.max(1, Math.min(2, lastRir)); // Maintain RIR
              }
              // If RPE was <6 and RIR was 4+, increase weight by 7.5-10%
              else if (lastRpe < 6 && lastRir !== null && lastRir >= 4) {
                progressedWeight = Math.round((lastWeight * 1.075) * 4) / 4; // 7.5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe + 2)); // Target higher RPE
                progressedRir = Math.max(1, Math.min(3, lastRir - 1)); // Reduce RIR
              }
              // If RPE was too high (9-10), reduce weight slightly
              else if (lastRpe >= 9) {
                progressedWeight = Math.round((lastWeight * 0.975) * 4) / 4; // 2.5% decrease
                progressedRpe = 8; // Target lower RPE
                progressedRir = 2; // Target more RIR
              }
              // If RPE was 6-8 but RIR is null, apply conservative progression
              else if (lastRpe >= 6 && lastRpe <= 8 && lastRir === null) {
                progressedWeight = Math.round((lastWeight * 1.025) * 4) / 4; // 2.5% increase
                progressedRpe = Math.max(7, Math.min(8, lastRpe)); // Target similar RPE
                progressedRir = 2; // Conservative RIR target
              }
              // Otherwise keep same weight
              else {
                progressedWeight = lastWeight;
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
                if (progressedWeight > lastWeight) {
                  // If weight increased, suggest slightly fewer reps
                  progressedActualReps = Math.max(suggestedReps - 1, 1).toString();
                } else if (progressedWeight === lastWeight) {
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

        await db
          .insert(workoutExercises)
          .values({
            sessionId: sessionResult[0].id,
            exerciseId: exercise.exerciseId,
            orderIndex: exercise.orderIndex,
            sets: adjustedSets,
            targetReps: progressedTargetReps,
            actualReps: progressedActualReps,
            weight: progressedWeight,
            rpe: progressedRpe,
            rir: progressedRir,
            restPeriod: exercise.restPeriod,
            notes: null,
            isCompleted: false
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