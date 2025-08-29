import { db } from "../db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { 
  autoRegulationFeedback, 
  workoutSessions, 
  volumeLandmarks, 
  muscleGroups,
  workoutExercises
} from "@shared/schema";
import { convertRPEtoRIR, convertRIRtoRPE, validateRPEAccuracy } from "@shared/utils/rpe-rir-conversion";

/**
 * Core Scientific Algorithm Service
 * Provides unified implementations for all evidence-based calculations
 */

export interface ScienceFeedbackScores {
  recoveryScore: number;    // 1-10 scale
  adaptationScore: number;  // 1-10 scale
  fatigueScore: number;     // 1-10 scale
  overallReadiness: number; // 1-10 scale
}

export interface ScienceFatigueAnalysis {
  overallFatigue: number;
  recoveryTrend: "improving" | "declining" | "stable";
  deloadRecommended: boolean;
  daysToDeload?: number;
  reasons: string[];
}

export interface ScienceVolumeRecommendation {
  muscleGroupId: number;
  muscleGroupName: string;
  currentVolume: number;
  recommendedAdjustment: number; // percentage
  recommendation: "increase" | "decrease" | "maintain" | "deload";
  confidenceLevel: number;
  reason: string;
  // Legacy compatibility fields
  adjustmentReason?: string;
}

export class SciAlgorithmCore {
  
  /**
   * Calculate muscle group volume from recent workouts
   * @param muscleGroupId - Target muscle group ID
   * @param userId - User ID
   * @param days - Number of days to look back (default 7 for weekly volume)
   */
  static async calculateMuscleGroupVolume(
    muscleGroupId: number, 
    userId: number, 
    days: number = 7
  ): Promise<number> {
    try {
      // Import at runtime to avoid circular dependencies
      const { workoutSessions, workoutExercises, exerciseMuscleMapping } = await import('@shared/schema');
      const { eq, and, gte } = await import('drizzle-orm');
      
      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get completed sessions in date range
      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            gte(workoutSessions.date, startDate),
            eq(workoutSessions.isCompleted, true)
          )
        );

      let totalSets = 0;

      for (const session of sessions) {
        // Get workout exercises for this session
        const exercises = await db.select().from(workoutExercises).where(eq(workoutExercises.sessionId, session.id));
        
        for (const exercise of exercises) {
          if (!exercise.isCompleted) continue;
          
          // Check if exercise targets this muscle group as PRIMARY muscle
          const mapping = await db
            .select()
            .from(exerciseMuscleMapping)
            .where(
              and(
                eq(exerciseMuscleMapping.exerciseId, exercise.exerciseId),
                eq(exerciseMuscleMapping.muscleGroupId, muscleGroupId),
                eq(exerciseMuscleMapping.role, 'primary')
              )
            );

          if (mapping.length > 0) {
            // Count actual completed sets from setsData
            let exerciseSets = 0;
            if (exercise.setsData) {
              try {
                // setsData is already parsed as JSONB from database
                const setsData = exercise.setsData;
                
                if (Array.isArray(setsData)) {
                  const completedSets = setsData.filter((set: any) => set && set.completed === true).length;
                  exerciseSets = completedSets;
                  totalSets += completedSets;
                } else {
                  exerciseSets = exercise.sets || 0;
                  totalSets += exercise.sets || 0;
                }
              } catch (error) {
                exerciseSets = exercise.sets || 0;
                totalSets += exercise.sets || 0;
              }
            } else {
              exerciseSets = exercise.sets || 0;
              totalSets += exercise.sets || 0;
            }
            
            console.log(`PRIMARY Exercise ${exercise.exerciseId}: ${exerciseSets} completed sets for muscle group ${muscleGroupId}`);
          }
        }
      }

      return totalSets;
    } catch (error) {
      console.error('Error calculating muscle group volume:', error);
      return 0;
    }
  }
  
  /**
   * Core scientific feedback scoring algorithm
   * Used by both auto-regulation and mesocycle systems
   */
  static calculateFeedbackScores(feedbackData: {
    pumpQuality: number;
    muscleSoreness: number;
    perceivedEffort: number;
    energyLevel: number;
    sleepQuality: number;
  }): ScienceFeedbackScores {
    
    const { pumpQuality, muscleSoreness, perceivedEffort, energyLevel, sleepQuality } = feedbackData;
    
    // Recovery Score: Higher is better recovery
    const recoveryScore = (
      energyLevel * 0.35 +           // Energy is primary recovery indicator
      sleepQuality * 0.3 +           // Sleep quality is crucial
      (10 - muscleSoreness) * 0.2 +  // Less soreness = better recovery
      pumpQuality * 0.15             // Good pump indicates recovered state
    );
    
    // Adaptation Score: Readiness to handle training stress
    const adaptationScore = (
      pumpQuality * 0.4 +              // Pump quality indicates adaptation capacity
      (10 - perceivedEffort) * 0.3 +   // Lower effort for same loads = adaptation
      energyLevel * 0.2 +              // Energy supports adaptation
      (10 - muscleSoreness) * 0.1      // Reduced soreness indicates adaptation
    );
    
    // Fatigue Score: Higher indicates more fatigue
    const fatigueScore = (
      (10 - pumpQuality) * 0.25 +      // Poor pump = fatigue
      muscleSoreness * 0.2 +           // Soreness = incomplete recovery
      perceivedEffort * 0.2 +          // High effort = fatigue
      (10 - energyLevel) * 0.2 +       // Low energy = systemic fatigue
      (10 - sleepQuality) * 0.15       // Poor sleep = fatigue
    );
    
    // Overall Readiness: Combines recovery and adaptation
    const overallReadiness = (recoveryScore + adaptationScore) / 2;
    
    return {
      recoveryScore: Math.round(recoveryScore * 10) / 10,
      adaptationScore: Math.round(adaptationScore * 10) / 10,
      fatigueScore: Math.round(fatigueScore * 10) / 10,
      overallReadiness: Math.round(overallReadiness * 10) / 10
    };
  }
  
  /**
   * Unified scientific fatigue analysis
   * Replaces duplicate logic in multiple files
   */
  static async analyzeFatigue(userId: number, days: number = 10): Promise<ScienceFatigueAnalysis> {
    
    // Get recent feedback data
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
          gte(autoRegulationFeedback.createdAt, new Date(Date.now() - days * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(autoRegulationFeedback.createdAt));

    if (recentFeedback.length === 0) {
      return {
        overallFatigue: 5,
        recoveryTrend: "stable",
        deloadRecommended: false,
        reasons: ["No recent feedback data available"]
      };
    }

    // Calculate fatigue scores using unified algorithm
    const fatigueScores = recentFeedback.map(feedback => 
      this.calculateFeedbackScores(feedback).fatigueScore
    );

    const overallFatigue = fatigueScores.reduce((sum, score) => sum + score, 0) / fatigueScores.length;

    // Determine trend
    const midPoint = Math.floor(fatigueScores.length / 2);
    if (midPoint === 0) {
      return {
        overallFatigue,
        recoveryTrend: "stable",
        deloadRecommended: overallFatigue >= 7,
        reasons: overallFatigue >= 7 ? ["High fatigue levels detected"] : []
      };
    }

    const earlierAvg = fatigueScores.slice(0, midPoint).reduce((sum, score) => sum + score, 0) / midPoint;
    const recentAvg = fatigueScores.slice(midPoint).reduce((sum, score) => sum + score, 0) / (fatigueScores.length - midPoint);
    
    let recoveryTrend: "improving" | "declining" | "stable" = "stable";
    if (recentAvg > earlierAvg + 0.5) {
      recoveryTrend = "declining";
    } else if (recentAvg < earlierAvg - 0.5) {
      recoveryTrend = "improving";
    }

    // Deload decision logic using RP methodology
    const reasons: string[] = [];
    let deloadRecommended = false;

    // Get average values for threshold checks
    const avgPump = recentFeedback.reduce((sum, f) => sum + f.pumpQuality, 0) / recentFeedback.length;
    const avgSoreness = recentFeedback.reduce((sum, f) => sum + f.muscleSoreness, 0) / recentFeedback.length;
    const avgEffort = recentFeedback.reduce((sum, f) => sum + f.perceivedEffort, 0) / recentFeedback.length;
    const avgEnergy = recentFeedback.reduce((sum, f) => sum + f.energyLevel, 0) / recentFeedback.length;
    const avgSleep = recentFeedback.reduce((sum, f) => sum + f.sleepQuality, 0) / recentFeedback.length;

    // RP Deload Triggers
    if (avgPump < 6) {
      reasons.push("Pump quality declining (< 6/10)");
      deloadRecommended = true;
    }
    if (avgSoreness > 7) {
      reasons.push("Excessive muscle soreness (> 7/10)");
      deloadRecommended = true;
    }
    if (avgEffort > 8) {
      reasons.push("Perceived effort too high (> 8/10)");
      deloadRecommended = true;
    }
    if (avgEnergy < 5) {
      reasons.push("Low energy levels (< 5/10)");
      deloadRecommended = true;
    }
    if (avgSleep < 5) {
      reasons.push("Poor sleep quality (< 5/10)");
      deloadRecommended = true;
    }
    if (overallFatigue > 6.5) {
      reasons.push(`High overall fatigue score (${overallFatigue.toFixed(1)}/10)`);
      deloadRecommended = true;
    }

    // Consecutive high fatigue check
    const consecutiveHighFatigue = fatigueScores.slice(-3).filter(score => score >= 7).length;
    if (consecutiveHighFatigue >= 2) {
      reasons.push("Multiple consecutive high-fatigue sessions");
      deloadRecommended = true;
    }

    let daysToDeload: number | undefined;
    if (deloadRecommended) {
      daysToDeload = Math.max(3, Math.min(7, Math.round(overallFatigue)));
    }

    return {
      overallFatigue: Math.round(overallFatigue * 10) / 10,
      recoveryTrend,
      deloadRecommended,
      daysToDeload,
      reasons
    };
  }
  
  /**
   * Calculate volume progression using RP methodology with Periodization Reset Strategy
   * 方案2: 週期性重設策略 - 前半週期組數漸進，後半週期強度導向
   */
  static calculateVolumeProgression(
    currentWeek: number,
    totalWeeks: number,
    landmark: {
      mev: number;
      mav: number;
      mrv: number;
      recoveryLevel?: number | null;
      adaptationLevel?: number | null;
    }
  ): { targetSets: number; phase: 'accumulation' | 'intensification' | 'deload' } {
    
    let targetSets = landmark.mev; // Start at MEV
    let phase: 'accumulation' | 'intensification' | 'deload' = 'accumulation';
    
    // 計算週期分割點 (前半期 vs 後半期)
    const midPoint = Math.ceil(totalWeeks / 2);
    
    // 週期性重設策略：分為兩個階段
    if (currentWeek <= midPoint) {
      // 階段1：累積期 - 組數漸進 (週1-3)
      // 從 MEV 逐步增加，但有合理上限
      const maxAccumulationSets = Math.min(landmark.mav, landmark.mev + 3); // 最多增加3組
      const progressionRate = (maxAccumulationSets - landmark.mev) / midPoint;
      targetSets = Math.round(landmark.mev + (progressionRate * (currentWeek - 1)));
      
      // 自動調節：恢復狀態影響組數增長
      if (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel < 4) {
        // 恢復不佳：減少組數增長 20%
        targetSets = Math.round(targetSets * 0.8);
      } else if (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel > 7) {
        // 恢復良好：可以稍微增加組數
        targetSets = Math.min(Math.round(targetSets * 1.1), maxAccumulationSets);
      }
      
      // 安全限制：不超過累積期上限
      targetSets = Math.min(targetSets, maxAccumulationSets);
      phase = 'accumulation';
      
    } else if (currentWeek < totalWeeks) {
      // 階段2：強化期 - 組數穩定，強度導向 (週4-5)
      // 維持合理組數，透過 RIR 降低來增加強度
      const stableSetCount = Math.min(landmark.mav, landmark.mev + 3);
      targetSets = stableSetCount;
      
      // 恢復狀態決定是否維持高組數
      if (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel < 5) {
        // 恢復不佳：略微降低組數以配合高強度
        targetSets = Math.round(stableSetCount * 0.9);
      }
      
      phase = 'intensification';
      
    } else {
      // 階段3：減載期 - 恢復期 (週6)
      targetSets = Math.round(landmark.mev * 0.6); // 降到 MEV 的 60%
      phase = 'deload';
    }
    
    // 最終安全檢查：確保組數在合理範圍內
    const minSets = phase === 'deload' ? Math.round(landmark.mev * 0.5) : landmark.mev;
    const maxSets = Math.min(landmark.mav, landmark.mev + 4); // 絕對上限：MEV + 4組
    
    return {
      targetSets: Math.max(Math.min(targetSets, maxSets), minSets),
      phase
    };
  }
  
  /**
   * Calculate intensity progression for evidence-based training
   * 配合方案2: 當組數穩定時，透過強度調整來持續漸進
   */
  static calculateIntensityProgression(
    currentWeek: number,
    totalWeeks: number,
    baseRir: number = 3
  ): {
    targetRir: number;
    intensityNote: string;
  } {
    const midPoint = Math.ceil(totalWeeks / 2);
    
    if (currentWeek <= midPoint) {
      // 累積期：維持適中 RIR，專注於組數增長
      return {
        targetRir: baseRir,
        intensityNote: `累積期：維持 RIR ${baseRir}，專注組數建立適應`
      };
    } else if (currentWeek < totalWeeks) {
      // 強化期：降低 RIR，增加強度
      const intensityWeek = currentWeek - midPoint + 1;
      const targetRir = Math.max(1, baseRir - intensityWeek);
      return {
        targetRir,
        intensityNote: `強化期：RIR 降至 ${targetRir}，組數穩定但強度提升`
      };
    } else {
      // 減載期：回復較高 RIR
      return {
        targetRir: baseRir + 1,
        intensityNote: `減載期：RIR 提升至 ${baseRir + 1}，促進恢復`
      };
    }
  }
  
  /**
   * Generate volume recommendations using unified scientific logic
   */
  static async generateVolumeRecommendations(
    userId: number,
    feedbackData?: any
  ): Promise<ScienceVolumeRecommendation[]> {
    
    const recommendations: ScienceVolumeRecommendation[] = [];
    
    // Get user's volume landmarks with muscle group names
    const landmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        currentVolume: volumeLandmarks.currentVolume
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, userId));
    
    for (const landmark of landmarks) {
      // Calculate actual current volume from recent workouts (last 7 days)
      const actualCurrentVolume = await this.calculateMuscleGroupVolume(
        landmark.muscleGroupId, 
        userId, 
        7 // 7 days for weekly volume
      );
      
      let recommendation: ScienceVolumeRecommendation["recommendation"] = "maintain";
      let adjustmentPercentage = 0;
      let reason = "Maintaining current volume";
      let confidence = 5;
      
      if (feedbackData) {
        const scores = this.calculateFeedbackScores(feedbackData);
        
        // RP Auto-regulation Logic using actual current volume
        if (scores.overallReadiness >= 8) {
          // High readiness - can increase volume
          if (actualCurrentVolume < landmark.mav) {
            recommendation = "increase";
            adjustmentPercentage = 10;
            reason = "High readiness indicates capacity for volume increase";
            confidence = 8;
          } else {
            recommendation = "maintain";
            reason = "Already at Maximum Adaptive Volume (MAV)";
            confidence = 9;
          }
        } else if (scores.overallReadiness <= 4) {
          // Low readiness - reduce volume or deload
          if (actualCurrentVolume > landmark.mev) {
            recommendation = "decrease";
            adjustmentPercentage = -15;
            reason = "Low readiness indicates need for volume reduction";
            confidence = 8;
          } else {
            recommendation = "deload";
            adjustmentPercentage = -30;
            reason = "At minimum effective volume with poor recovery - deload recommended";
            confidence = 9;
          }
        } else if (scores.overallReadiness <= 6) {
          // Moderate readiness - slight adjustments
          if (actualCurrentVolume > landmark.mav * 0.9) {
            recommendation = "decrease";
            adjustmentPercentage = -5;
            reason = "Moderate fatigue with high volume - slight reduction recommended";
            confidence = 6;
          } else {
            recommendation = "maintain";
            reason = "Moderate recovery with appropriate volume";
            confidence = 7;
          }
        } else {
          // Good readiness (6-8) - maintain or slight increase
          if (actualCurrentVolume < landmark.mav * 0.8) {
            recommendation = "increase";
            adjustmentPercentage = 5;
            reason = "Good recovery with room for volume increase";
            confidence = 7;
          } else {
            recommendation = "maintain";
            reason = "Optimal volume with good recovery";
            confidence = 8;
          }
        }
      }
      
      recommendations.push({
        muscleGroupId: landmark.muscleGroupId,
        muscleGroupName: landmark.muscleGroupName,
        currentVolume: actualCurrentVolume, // Use actual calculated volume
        recommendedAdjustment: adjustmentPercentage,
        recommendation,
        confidenceLevel: confidence,
        reason,
        adjustmentReason: reason // Legacy compatibility
      });
    }
    
    return recommendations;
  }
}