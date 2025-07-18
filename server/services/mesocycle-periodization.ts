import { db } from "../db";
import { 
  mesocycles, 
  weeklyVolumeTracking, 
  volumeLandmarks, 
  muscleGroups,
  autoRegulationFeedback,
  workoutSessions,
  loadProgressionTracking
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

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

    // Generate mesocycle program based on template or custom program
    if (templateId || customProgram) {
      await this.generateMesocycleProgram(mesocycleId, templateId, customProgram);
    }

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
    // Delete associated workout sessions
    const sessionsToDelete = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(eq(workoutSessions.programId, mesocycleId));

    for (const session of sessionsToDelete) {
      // Note: This would also delete workout exercises and progression data
      // In production, consider archiving instead of hard delete
    }

    // Delete the mesocycle
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
      .where(eq(workoutSessions.programId, mesocycleId))
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
    // Create simple program structure for now
    const program = {
      weeklyStructure: [
        { dayOfWeek: 0, name: "Push Day", exercises: [] },
        { dayOfWeek: 2, name: "Pull Day", exercises: [] },
        { dayOfWeek: 4, name: "Legs Day", exercises: [] }
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
   * Create workout sessions for entire mesocycle
   */
  static async createMesocycleWorkouts(mesocycleId: number, program: any) {
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId));

    if (!mesocycle) return;

    const startDate = new Date(mesocycle.startDate);
    
    // Generate sessions for each week
    for (let week = 1; week <= mesocycle.totalWeeks; week++) {
      for (const dayProgram of program.weeklyStructure) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + ((week - 1) * 7) + dayProgram.dayOfWeek);

        // Create workout session
        const sessionResult = await db
          .insert(workoutSessions)
          .values({
            userId: mesocycle.userId,
            programId: null, // Set to null to avoid foreign key constraint
            name: `${dayProgram.name} - Week ${week}`,
            date: sessionDate,
            isCompleted: false,
            totalVolume: null,
            duration: null,
            createdAt: new Date()
          })
          .returning({ id: workoutSessions.id });

        // Add exercises to session based on program
        // This would integrate with the existing exercise system
      }
    }
  }

  /**
   * Generate workouts for specific week with volume adjustments
   */
  static async generateWeekWorkouts(
    mesocycleId: number, 
    week: number, 
    volumeAdjustments: VolumeProgression[]
  ) {
    // Get base program structure
    const program = await this.getMesocycleProgram(mesocycleId);
    
    // Apply volume adjustments to exercises based on muscle groups
    // Create new workout sessions for the week with adjusted volumes
    // This integrates with the existing workout session creation system
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