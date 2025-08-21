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
   * Calculate volume progression using RP methodology
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
    
    // RP Volume Progression Algorithm
    if (currentWeek <= totalWeeks - 2) {
      // Accumulation phase: Progressive volume increase
      const progressionRate = (landmark.mav - landmark.mev) / (totalWeeks - 2);
      targetSets = Math.round(landmark.mev + (progressionRate * (currentWeek - 1)));
      
      // Apply auto-regulation adjustments
      if (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel < 4) {
        // Poor recovery: reduce volume by 10-20%
        targetSets = Math.round(targetSets * 0.8);
      } else if (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel > 7 && 
                 landmark.adaptationLevel !== null && landmark.adaptationLevel !== undefined && landmark.adaptationLevel > 6) {
        // Good recovery and adaptation: can push closer to MAV
        targetSets = Math.min(Math.round(targetSets * 1.1), landmark.mav);
      }
      
      // Safety check: don't exceed MAV in accumulation
      targetSets = Math.min(targetSets, landmark.mav);
      phase = 'accumulation';
      
    } else if (currentWeek === totalWeeks - 1) {
      // Intensification phase: Push to MAV/MRV
      targetSets = (landmark.recoveryLevel !== null && landmark.recoveryLevel !== undefined && landmark.recoveryLevel >= 6) 
        ? landmark.mav 
        : Math.round(landmark.mav * 0.9);
      phase = 'intensification';
      
    } else {
      // Deload week: Drop to MEV or below
      targetSets = Math.round(landmark.mev * 0.7);
      phase = 'deload';
    }
    
    return {
      targetSets: Math.max(targetSets, Math.round(landmark.mev * 0.5)), // Never go too low except intentional deload
      phase
    };
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
      let recommendation: ScienceVolumeRecommendation["recommendation"] = "maintain";
      let adjustmentPercentage = 0;
      let reason = "Maintaining current volume";
      let confidence = 5;
      
      if (feedbackData) {
        const scores = this.calculateFeedbackScores(feedbackData);
        
        // RP Auto-regulation Logic
        if (scores.overallReadiness >= 8) {
          // High readiness - can increase volume
          if (landmark.currentVolume < landmark.mav) {
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
          if (landmark.currentVolume > landmark.mev) {
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
          if (landmark.currentVolume > landmark.mav * 0.9) {
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
          if (landmark.currentVolume < landmark.mav * 0.8) {
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
        currentVolume: landmark.currentVolume,
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