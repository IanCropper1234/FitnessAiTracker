import { db } from "../db";
import { 
  loadProgressionTracking,
  workoutExercises,
  workoutSessions,
  exercises,
  autoRegulationFeedback,
  mesocycles
} from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

interface LoadProgressionRecommendation {
  exerciseId: number;
  exerciseName: string;
  currentWeight: number;
  recommendedWeight: number;
  recommendedReps: string;
  progressionType: 'weight' | 'reps' | 'volume';
  confidence: number; // 0-1 scale
  reasoning: string[];
}

interface PerformanceAnalysis {
  trend: 'improving' | 'plateauing' | 'declining';
  strengthGain: number; // percentage over last 4 weeks
  volumeGain: number; // percentage over last 4 weeks
  consistencyScore: number; // 0-1 based on session completion
  recommendations: string[];
}

export class LoadProgression {
  
  /**
   * Calculate next session load progression based on RPE/RIR feedback
   */
  static async calculateLoadProgression(
    userId: number,
    exerciseId: number,
    currentWeight: number,
    currentReps: number,
    averageRpe: number,
    averageRir: number
  ): Promise<LoadProgressionRecommendation> {
    
    // Get exercise details
    const exerciseDetails = await db
      .select({ name: exercises.name })
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .limit(1);

    const exerciseName = exerciseDetails[0]?.name || "Unknown Exercise";

    // Get recent progression history for this exercise
    const recentProgressions = await db
      .select()
      .from(loadProgressionTracking)
      .where(and(
        eq(loadProgressionTracking.userId, userId),
        eq(loadProgressionTracking.exerciseId, exerciseId)
      ))
      .orderBy(desc(loadProgressionTracking.createdAt))
      .limit(5);

    let recommendedWeight = currentWeight;
    let recommendedReps = `${currentReps}`;
    let progressionType: 'weight' | 'reps' | 'volume' = 'weight';
    let confidence = 0.8;
    const reasoning: string[] = [];

    // RP Auto-regulation Load Progression Algorithm
    
    // Perfect RPE/RIR scenario: RPE 8-8.5, RIR 1-2
    if (averageRpe >= 8 && averageRpe <= 8.5 && averageRir >= 1 && averageRir <= 2) {
      // Increase weight by 2.5-5kg for compounds, 1-2.5kg for isolation
      const weightIncrease = this.getWeightIncrement(exerciseName, currentWeight);
      recommendedWeight = currentWeight + weightIncrease;
      progressionType = 'weight';
      reasoning.push(`Perfect RPE/RIR range (${averageRpe}/${averageRir}) - ready for load increase`);
      confidence = 0.9;
    }
    
    // Too easy: RPE < 7 or RIR > 3
    else if (averageRpe < 7 || averageRir > 3) {
      const weightIncrease = this.getWeightIncrement(exerciseName, currentWeight) * 1.5;
      recommendedWeight = currentWeight + weightIncrease;
      progressionType = 'weight';
      reasoning.push(`Load too light (RPE: ${averageRpe}, RIR: ${averageRir}) - significant increase needed`);
      confidence = 0.85;
    }
    
    // Too hard: RPE > 9 or RIR < 1
    else if (averageRpe > 9 || averageRir < 1) {
      // Reduce weight or focus on rep progression
      if (currentReps < 12) {
        // Focus on rep progression instead of weight
        recommendedReps = `${currentReps + 1}-${currentReps + 3}`;
        progressionType = 'reps';
        reasoning.push(`Load too heavy (RPE: ${averageRpe}, RIR: ${averageRir}) - focus on rep progression`);
      } else {
        // Reduce weight slightly
        recommendedWeight = currentWeight * 0.95;
        progressionType = 'weight';
        reasoning.push(`Load too heavy with high reps - slight weight reduction recommended`);
      }
      confidence = 0.7;
    }
    
    // Moderate progression zone: RPE 7-8, RIR 2-3
    else {
      if (currentReps < 15) {
        // Add reps first
        recommendedReps = `${currentReps + 1}-${currentReps + 2}`;
        progressionType = 'reps';
        reasoning.push(`In progression zone - add reps before increasing weight`);
      } else {
        // Increase weight and reset reps
        const weightIncrease = this.getWeightIncrement(exerciseName, currentWeight);
        recommendedWeight = currentWeight + weightIncrease;
        recommendedReps = `${Math.max(8, currentReps - 3)}-${currentReps}`;
        progressionType = 'weight';
        reasoning.push(`High rep range reached - increase weight and reset reps`);
      }
      confidence = 0.75;
    }

    // Apply historical progression analysis
    if (recentProgressions.length >= 3) {
      const progressionTrend = this.analyzeProgressionTrend(recentProgressions);
      
      if (progressionTrend === 'plateauing') {
        // More conservative progression
        if (progressionType === 'weight') {
          recommendedWeight = currentWeight + (this.getWeightIncrement(exerciseName, currentWeight) * 0.5);
        }
        reasoning.push("Recent plateau detected - conservative progression applied");
        confidence *= 0.8;
      } else if (progressionTrend === 'declining') {
        // Focus on volume/rep progression
        recommendedWeight = currentWeight;
        progressionType = 'reps';
        reasoning.push("Performance declining - maintaining weight and focusing on volume");
        confidence *= 0.6;
      }
    }

    return {
      exerciseId,
      exerciseName,
      currentWeight,
      recommendedWeight: Math.round(recommendedWeight * 4) / 4, // Round to nearest 0.25kg
      recommendedReps,
      progressionType,
      confidence,
      reasoning
    };
  }

  /**
   * Get appropriate weight increment based on exercise type and current load
   * Now supports metric conversion
   */
  private static getWeightIncrement(exerciseName: string, currentWeight: number, unit: 'kg' | 'lbs' = 'kg'): number {
    // Standard weight increment logic for different exercise types
    const baseIncrement = unit === 'kg' ? 1.25 : 2.5; // 1.25kg or 2.5lbs
    
    // Smaller increments for isolation exercises
    if (exerciseName.toLowerCase().includes('curl') || 
        exerciseName.toLowerCase().includes('raise') ||
        exerciseName.toLowerCase().includes('extension')) {
      return unit === 'kg' ? 0.5 : 1.25;
    }
    
    // Larger increments for compound movements with heavier loads
    if (currentWeight > (unit === 'kg' ? 100 : 220)) {
      return unit === 'kg' ? 2.5 : 5;
    }
    
    return baseIncrement;
  }

  /**
   * Analyze progression trend from historical data
   */
  private static analyzeProgressionTrend(progressions: any[]): 'improving' | 'plateauing' | 'declining' {
    if (progressions.length < 3) return 'improving';

    const weights = progressions.map(p => parseFloat(p.currentWeight)).reverse();
    let improvements = 0;
    let declines = 0;

    for (let i = 1; i < weights.length; i++) {
      if (weights[i] > weights[i-1]) improvements++;
      else if (weights[i] < weights[i-1]) declines++;
    }

    if (improvements >= declines * 2) return 'improving';
    if (declines >= improvements * 2) return 'declining';
    return 'plateauing';
  }

  /**
   * Comprehensive performance analysis for a user
   */
  static async analyzePerformance(userId: number, timeframeDays: number = 28): Promise<PerformanceAnalysis> {
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    // Get all workout sessions in timeframe
    const sessions = await db
      .select({
        id: workoutSessions.id,
        date: workoutSessions.date,
        isCompleted: workoutSessions.isCompleted,
        totalVolume: workoutSessions.totalVolume
      })
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.date, startDate)
      ))
      .orderBy(workoutSessions.date);

    // Calculate consistency score
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.isCompleted).length;
    const consistencyScore = totalSessions > 0 ? completedSessions / totalSessions : 0;

    // Calculate volume progression
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalfVolume = sessions.slice(0, midPoint).reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const secondHalfVolume = sessions.slice(midPoint).reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    
    const volumeGain = firstHalfVolume > 0 
      ? ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100 
      : 0;

    // Get load progression data
    const loadProgressions = await db
      .select()
      .from(loadProgressionTracking)
      .where(and(
        eq(loadProgressionTracking.userId, userId),
        gte(loadProgressionTracking.createdAt, startDate)
      ))
      .orderBy(loadProgressionTracking.createdAt);

    // Calculate strength gains
    const exerciseStrengthGains = new Map<number, number>();
    
    for (const progression of loadProgressions) {
      const exerciseId = progression.exerciseId;
      if (!exerciseStrengthGains.has(exerciseId)) {
        exerciseStrengthGains.set(exerciseId, 0);
      }
      
      const previousWeight = parseFloat(progression.previousWeight || '0');
      const currentWeight = parseFloat(progression.currentWeight);
      
      if (previousWeight > 0) {
        const gain = ((currentWeight - previousWeight) / previousWeight) * 100;
        exerciseStrengthGains.set(exerciseId, gain);
      }
    }

    const averageStrengthGain = exerciseStrengthGains.size > 0
      ? Array.from(exerciseStrengthGains.values()).reduce((sum, gain) => sum + gain, 0) / exerciseStrengthGains.size
      : 0;

    // Determine overall trend
    let trend: 'improving' | 'plateauing' | 'declining' = 'improving';
    if (averageStrengthGain < 0 && volumeGain < 0) {
      trend = 'declining';
    } else if (averageStrengthGain < 2 && volumeGain < 5) {
      trend = 'plateauing';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (consistencyScore < 0.7) {
      recommendations.push("Improve training consistency - aim for 80%+ session completion");
    }
    
    if (trend === 'plateauing') {
      recommendations.push("Consider deload week or exercise variation");
      recommendations.push("Focus on form improvement and mind-muscle connection");
    }
    
    if (trend === 'declining') {
      recommendations.push("Evaluate recovery factors: sleep, stress, nutrition");
      recommendations.push("Consider reducing training volume temporarily");
    }
    
    if (volumeGain > 20) {
      recommendations.push("Excellent volume progression - monitor for overreaching");
    }
    
    if (averageStrengthGain > 10) {
      recommendations.push("Outstanding strength gains - maintain current approach");
    }

    return {
      trend,
      strengthGain: averageStrengthGain,
      volumeGain,
      consistencyScore,
      recommendations
    };
  }

  /**
   * Record load progression after workout completion
   */
  static async recordProgression(
    userId: number,
    exerciseId: number,
    sessionId: number,
    previousWeight: number,
    currentWeight: number,
    averageRpe: number,
    averageRir: number,
    progressionType: 'weight' | 'reps' | 'volume',
    notes?: string
  ): Promise<void> {
    
    // Ensure all numeric values are properly converted and not null/undefined
    const safeValues = {
      userId: parseInt(userId.toString()),
      exerciseId: parseInt(exerciseId.toString()),
      sessionId: parseInt(sessionId.toString()),
      previousWeight: (previousWeight || 0).toString(),
      currentWeight: (currentWeight || 0).toString(),
      targetWeight: null, // Will be calculated for next session
      rpeAverage: (averageRpe || 7).toString(),
      rirAverage: (averageRir || 2).toString(),
      progressionType: progressionType || 'volume',
      notes: notes || null
    };

    console.log('Recording load progression with values:', safeValues);
    
    await db
      .insert(loadProgressionTracking)
      .values([safeValues]);
  }

  /**
   * Get progression recommendations for upcoming workout
   */
  static async getWorkoutProgressions(userId: number, exerciseIds: number[] = []): Promise<LoadProgressionRecommendation[]> {
    
    const recommendations: LoadProgressionRecommendation[] = [];
    
    // Check if user has an active mesocycle with upcoming workouts
    const activeMesocycle = await db
      .select()
      .from(mesocycles)
      .where(and(eq(mesocycles.userId, userId), eq(mesocycles.isActive, true)))
      .limit(1);

    // If no specific exercises provided, get all exercises user has performed
    let targetExerciseIds = exerciseIds;
    if (exerciseIds.length === 0) {
      const recentExercises = await db
        .selectDistinct({ exerciseId: workoutExercises.exerciseId })
        .from(workoutExercises)
        .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
        .where(and(
          eq(workoutSessions.userId, userId),
          eq(workoutExercises.isCompleted, true)
        ))
        .limit(20); // Get up to 20 most recent exercises
      
      targetExerciseIds = recentExercises.map(e => e.exerciseId);
    }
    
    for (const exerciseId of targetExerciseIds) {
      let currentWeight = 0;
      let targetReps = '8-12';
      let isFromUpcomingWorkout = false;

      // Priority 1: Check upcoming mesocycle workouts for current week targets
      if (activeMesocycle.length > 0) {
        const upcomingWorkout = await db
          .select({
            weight: workoutExercises.weight,
            targetReps: workoutExercises.targetReps,
            sessionDate: workoutSessions.date
          })
          .from(workoutExercises)
          .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
          .where(and(
            eq(workoutSessions.userId, userId),
            eq(workoutExercises.exerciseId, exerciseId),
            eq(workoutSessions.mesocycleId, activeMesocycle[0].id),
            eq(workoutExercises.isCompleted, false)
          ))
          .orderBy(workoutSessions.date)
          .limit(1);

        if (upcomingWorkout.length > 0) {
          currentWeight = parseFloat(upcomingWorkout[0].weight || '0');
          targetReps = upcomingWorkout[0].targetReps || '8-12';
          isFromUpcomingWorkout = true;
        }
      }

      // Priority 2: If no upcoming workout, use most recent completed performance
      if (currentWeight === 0) {
        const recentPerformance = await db
          .select({
            weight: workoutExercises.weight,
            actualReps: workoutExercises.actualReps,
            rpe: workoutExercises.rpe,
            rir: workoutExercises.rir,
            targetReps: workoutExercises.targetReps
          })
          .from(workoutExercises)
          .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
          .where(and(
            eq(workoutSessions.userId, userId),
            eq(workoutExercises.exerciseId, exerciseId),
            eq(workoutExercises.isCompleted, true)
          ))
          .orderBy(desc(workoutSessions.date))
          .limit(1);

        if (recentPerformance.length > 0) {
          const performance = recentPerformance[0];
          currentWeight = parseFloat(performance.weight || '0');
          targetReps = performance.targetReps || '8-12';
          
          const repsArray = performance.actualReps?.split(',').map(r => parseInt(r)) || [];
          const avgReps = repsArray.length > 0 ? repsArray.reduce((sum, r) => sum + r, 0) / repsArray.length : 10;
          const rpe = performance.rpe || 7;
          const rir = performance.rir || 2;

          // Calculate progression based on past performance
          const recommendation = await this.calculateLoadProgression(
            userId,
            exerciseId,
            currentWeight,
            avgReps,
            rpe,
            rir
          );
          
          recommendations.push(recommendation);
          continue;
        }
      }

      // If we have upcoming workout data, create aligned recommendation
      if (currentWeight > 0 && isFromUpcomingWorkout) {
        const exerciseDetails = await db
          .select({ name: exercises.name })
          .from(exercises)
          .where(eq(exercises.id, exerciseId))
          .limit(1);

        const exerciseName = exerciseDetails[0]?.name || "Unknown Exercise";
        
        recommendations.push({
          exerciseId,
          exerciseName,
          currentWeight,
          recommendedWeight: currentWeight, // Already adjusted by Advance Week
          recommendedReps: targetReps,
          progressionType: 'weight',
          confidence: 0.9, // High confidence since it's from mesocycle progression
          reasoning: [
            "Weight already adjusted by mesocycle auto-progression",
            "Follow current mesocycle programming",
            "Focus on hitting target rep ranges with good form"
          ]
        });
      }
    }
    
    return recommendations;
  }
}