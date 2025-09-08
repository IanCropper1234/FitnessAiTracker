import { db } from "../db";
import { workoutSessions, workoutExercises, exercises, users } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * RP-Based Configuration Engine
 * Implements Renaissance Periodization principles for automatic training configuration
 */

export interface RPConfiguration {
  sets: number;
  reps: string; // e.g. "6-8", "8-12", "12-15"
  intensity: number; // % 1RM
  restPeriod: number; // seconds
  volume: number; // total weekly sets
  specialMethod?: string;
}

export interface UserProfile {
  id: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  trainingAge: number; // months
  recoveryCap: 'low' | 'moderate' | 'high';
  totalSessions: number;
  averageVolume: number;
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  mev: number; // Minimum Effective Volume (sets per week)
  mav: number; // Maximum Adaptive Volume (sets per week)
  mrv: number; // Maximum Recoverable Volume (sets per week)
  currentVolume: number;
}

export class RPConfigurationEngine {
  
  /**
   * MEV/MAV/MRV data based on RP research
   */
  private static readonly VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
    // Upper Body
    'chest': { mev: 8, mav: 18, mrv: 22 },
    'back': { mev: 10, mav: 20, mrv: 25 },
    'shoulders': { mev: 8, mav: 16, mrv: 20 },
    'biceps': { mev: 6, mav: 14, mrv: 20 },
    'triceps': { mev: 6, mav: 14, mrv: 18 },
    'forearms': { mev: 4, mav: 12, mrv: 16 },
    
    // Lower Body
    'quads': { mev: 8, mav: 16, mrv: 20 },
    'hamstrings': { mev: 6, mav: 12, mrv: 16 },
    'glutes': { mev: 6, mav: 12, mrv: 16 },
    'calves': { mev: 8, mav: 16, mrv: 20 },
    
    // Core
    'abs': { mev: 0, mav: 12, mrv: 20 },
    'lower_back': { mev: 2, mav: 8, mrv: 12 }
  };

  /**
   * Training phase configurations based on RP methodology
   */
  private static readonly PHASE_CONFIGS = {
    accumulation: {
      intensityRange: [65, 80], // % 1RM
      volumeMultiplier: 1.0,
      restPeriods: { compound: 180, isolation: 120 }
    },
    intensification: {
      intensityRange: [80, 90], // % 1RM
      volumeMultiplier: 0.8,
      restPeriods: { compound: 240, isolation: 150 }
    },
    realization: {
      intensityRange: [90, 100], // % 1RM
      volumeMultiplier: 0.6,
      restPeriods: { compound: 300, isolation: 180 }
    },
    deload: {
      intensityRange: [50, 65], // % 1RM
      volumeMultiplier: 0.5,
      restPeriods: { compound: 120, isolation: 90 }
    }
  };

  /**
   * Experience level modifiers
   */
  private static readonly EXPERIENCE_MODIFIERS = {
    beginner: { volumeMultiplier: 0.7, intensityReduction: 10, setRange: [2, 3] },
    intermediate: { volumeMultiplier: 0.85, intensityReduction: 5, setRange: [3, 4] },
    advanced: { volumeMultiplier: 1.0, intensityReduction: 0, setRange: [3, 5] },
    elite: { volumeMultiplier: 1.15, intensityReduction: 0, setRange: [4, 6] }
  };

  /**
   * Assess user's training experience level based on historical data
   */
  static async assessUserExperience(userId: number): Promise<UserProfile> {
    console.log(`🔍 Assessing training experience for user ${userId}`);
    
    // Get user's training history
    const userStats = await db
      .select({
        totalSessions: sql<number>`count(*)`,
        avgVolume: sql<number>`avg(${workoutSessions.totalVolume})`,
        firstSession: sql<Date | null>`min(${workoutSessions.date})`,
        lastSession: sql<Date | null>`max(${workoutSessions.date})`
      })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));

    const stats = userStats[0];
    const trainingAge = this.calculateTrainingAge(stats.firstSession, stats.lastSession);
    const experienceLevel = this.determineExperienceLevel(stats.totalSessions, trainingAge, stats.avgVolume);
    const recoveryCap = this.assessRecoveryCapacity(stats.totalSessions, trainingAge);

    console.log(`📊 User experience assessment:`, {
      experienceLevel,
      trainingAge,
      totalSessions: stats.totalSessions,
      avgVolume: stats.avgVolume,
      recoveryCap
    });

    return {
      id: userId,
      experienceLevel,
      trainingAge,
      recoveryCap,
      totalSessions: stats.totalSessions || 0,
      averageVolume: stats.avgVolume || 0
    };
  }

  /**
   * Calculate training age in months
   */
  private static calculateTrainingAge(firstSession: Date | null, lastSession: Date | null): number {
    if (!firstSession || !lastSession) return 0;
    const diffTime = Math.abs(lastSession.getTime() - firstSession.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Convert to months
  }

  /**
   * Determine experience level based on multiple factors
   */
  private static determineExperienceLevel(
    totalSessions: number,
    trainingAge: number,
    avgVolume: number
  ): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
    // Multi-factor analysis
    const sessionScore = Math.min(totalSessions / 50, 4); // Max 4 points
    const ageScore = Math.min(trainingAge / 12, 4); // Max 4 points  
    const volumeScore = Math.min((avgVolume || 0) / 10000, 4); // Max 4 points
    
    const totalScore = sessionScore + ageScore + volumeScore;
    
    if (totalScore < 3) return 'beginner';
    if (totalScore < 6) return 'intermediate';
    if (totalScore < 9) return 'advanced';
    return 'elite';
  }

  /**
   * Assess recovery capacity based on training consistency
   */
  private static assessRecoveryCapacity(
    totalSessions: number,
    trainingAge: number
  ): 'low' | 'moderate' | 'high' {
    const consistency = trainingAge > 0 ? totalSessions / trainingAge : 0;
    
    if (consistency < 2) return 'low';
    if (consistency < 4) return 'moderate';
    return 'high';
  }

  /**
   * Generate RP-based configuration for an exercise
   */
  static async generateExerciseConfiguration(
    exerciseId: number,
    phase: 'accumulation' | 'intensification' | 'realization' | 'deload',
    weekNumber: number,
    userProfile: UserProfile,
    muscleGroup: string
  ): Promise<RPConfiguration> {
    console.log(`⚙️ Generating RP config for exercise ${exerciseId}, phase: ${phase}, week: ${weekNumber}`);
    
    // Get exercise details
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, exerciseId));

    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    const isCompound = this.isCompoundExercise(exercise.category);
    const phaseConfig = this.PHASE_CONFIGS[phase];
    const expModifier = this.EXPERIENCE_MODIFIERS[userProfile.experienceLevel];
    const volumeLandmarks = this.VOLUME_LANDMARKS[muscleGroup] || this.VOLUME_LANDMARKS['chest'];

    // Calculate sets based on experience and phase
    const baseSets = isCompound ? 4 : 3;
    const adjustedSets = Math.round(baseSets * expModifier.volumeMultiplier * phaseConfig.volumeMultiplier);
    const sets = Math.max(expModifier.setRange[0], Math.min(expModifier.setRange[1], adjustedSets));

    // Calculate intensity with weekly progression
    const baseIntensity = phaseConfig.intensityRange[0] + 
      ((phaseConfig.intensityRange[1] - phaseConfig.intensityRange[0]) * (weekNumber - 1) / 3);
    const intensity = Math.max(50, baseIntensity - expModifier.intensityReduction);

    // Determine rep ranges based on intensity
    const reps = this.calculateRepRange(intensity, isCompound);
    
    // Calculate rest periods
    const restPeriod = phaseConfig.restPeriods[isCompound ? 'compound' : 'isolation'];
    
    // Calculate weekly volume target
    const weeklyVolume = Math.round(volumeLandmarks.mav * expModifier.volumeMultiplier);

    console.log(`✅ Generated config:`, { sets, reps, intensity, restPeriod, weeklyVolume });

    return {
      sets,
      reps,
      intensity: Math.round(intensity),
      restPeriod,
      volume: weeklyVolume
    };
  }

  /**
   * Determine if exercise is compound based on category
   */
  private static isCompoundExercise(category: string): boolean {
    const compoundCategories = ['push', 'pull', 'legs', 'compound', 'squat', 'deadlift', 'press'];
    return compoundCategories.some(cat => category?.toLowerCase().includes(cat));
  }

  /**
   * Calculate rep range based on intensity
   */
  private static calculateRepRange(intensity: number, isCompound: boolean): string {
    if (intensity >= 90) return isCompound ? "1-3" : "3-5";
    if (intensity >= 80) return isCompound ? "3-5" : "5-8";
    if (intensity >= 70) return isCompound ? "5-8" : "8-12";
    if (intensity >= 60) return isCompound ? "8-12" : "12-15";
    return isCompound ? "12-15" : "15-20";
  }

  /**
   * Apply fatigue-based auto-regulation
   */
  static async applyAutoRegulation(
    sessionId: number,
    userProfile: UserProfile,
    currentWeek: number
  ): Promise<void> {
    console.log(`🧠 Applying auto-regulation for session ${sessionId}, week ${currentWeek}`);
    
    // Calculate fatigue coefficient based on week progression
    const fatigueCoeff = 1 + (currentWeek - 1) * 0.1; // 10% fatigue increase per week
    
    // Adjust based on user recovery capacity
    const recoveryMultiplier = {
      'low': 1.2,
      'moderate': 1.0,
      'high': 0.8
    }[userProfile.recoveryCap];

    const adjustmentFactor = fatigueCoeff * recoveryMultiplier;

    // Apply adjustments to all exercises in session
    await db
      .update(workoutExercises)
      .set({
        notes: sql`COALESCE(notes, '') || ' [Auto-regulated: ' || ${adjustmentFactor}::text || 'x fatigue]'`
      })
      .where(eq(workoutExercises.sessionId, sessionId));

    console.log(`✅ Auto-regulation applied with factor: ${adjustmentFactor}`);
  }

  /**
   * Get volume distribution for muscle group across week
   */
  static getVolumeDistribution(
    muscleGroup: string,
    sessionsPerWeek: number,
    userProfile: UserProfile
  ): number[] {
    const landmarks = this.VOLUME_LANDMARKS[muscleGroup] || this.VOLUME_LANDMARKS['chest'];
    const expModifier = this.EXPERIENCE_MODIFIERS[userProfile.experienceLevel];
    
    const targetVolume = Math.round(landmarks.mav * expModifier.volumeMultiplier);
    
    // Distribute volume across sessions (front-loaded for RP methodology)
    const distribution = Array(sessionsPerWeek).fill(0);
    let remainingVolume = targetVolume;
    
    for (let i = 0; i < sessionsPerWeek && remainingVolume > 0; i++) {
      const sessionVolume = Math.round(remainingVolume / (sessionsPerWeek - i));
      distribution[i] = Math.min(sessionVolume, Math.round(landmarks.mrv / sessionsPerWeek));
      remainingVolume -= distribution[i];
    }
    
    return distribution;
  }
}