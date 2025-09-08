// Programme-Level Special Method Distribution Engine
// Based on Renaissance Periodization methodology and latest scientific research

import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db";
import { 
  exercises, 
  volumeLandmarks, 
  muscleGroups,
  exerciseMuscleMapping 
} from "@shared/schema";
import type {
  SpecialMethodType,
  TrainingPhase,
  SpecialMethodAllocation,
  DistributionStrategy,
  PhaseSpecificDistribution,
  DistributionConstraints,
  DistributionResult
} from "@shared/types/special-method-distribution";
import { 
  DISTRIBUTION_STRATEGIES,
  FATIGUE_COEFFICIENTS,
  PHASE_MULTIPLIERS
} from "@shared/types/special-method-distribution";

export class SpecialMethodDistributionEngine {
  
  /**
   * Generate intelligent special method distribution for mesocycle
   */
  static async generateDistribution(
    userId: number,
    exerciseIds: number[],
    totalWeeks: number,
    strategyName: keyof typeof DISTRIBUTION_STRATEGIES,
    constraints: DistributionConstraints,
    targetMuscleGroups?: string[]
  ): Promise<DistributionResult> {
    
    console.log(`🎯 Generating special method distribution: ${strategyName} for ${totalWeeks} weeks`);
    
    // Step 1: Get base strategy
    const baseStrategy = DISTRIBUTION_STRATEGIES[strategyName];
    if (!baseStrategy) {
      throw new Error(`Unknown distribution strategy: ${strategyName}`);
    }
    
    // Step 2: Analyze exercise pool and user constraints
    const exerciseAnalysis = await this.analyzeExercisePool(userId, exerciseIds);
    
    // Step 3: Get user's fatigue tolerance and adaptation level
    const userProfile = await this.getUserTrainingProfile(userId);
    
    // Step 4: Generate phase-specific allocations
    const phaseDistributions = await this.generatePhaseDistributions(
      baseStrategy,
      totalWeeks,
      userProfile,
      exerciseAnalysis,
      constraints,
      targetMuscleGroups
    );
    
    // Step 5: Calculate fatigue impact and validate
    const fatigueImpact = this.calculateFatigueImpact(phaseDistributions);
    const validation = this.validateDistribution(phaseDistributions, constraints);
    
    // Step 6: Generate scientific justification
    const justification = this.generateScientificJustification(
      baseStrategy, 
      phaseDistributions, 
      userProfile
    );
    
    const result: DistributionResult = {
      strategy: baseStrategy,
      weeklyDistribution: phaseDistributions,
      totalSpecialMethodPercentage: this.calculateTotalSpecialMethodPercentage(phaseDistributions),
      expectedFatigueImpact: fatigueImpact,
      scientificJustification: justification,
      warnings: validation.warnings
    };
    
    console.log(`✅ Distribution generated: ${result.totalSpecialMethodPercentage}% special methods, fatigue impact: ${fatigueImpact.toFixed(1)}`);
    
    return result;
  }
  
  /**
   * Analyze exercise pool to understand training context
   */
  private static async analyzeExercisePool(userId: number, exerciseIds: number[]) {
    const exerciseDetails = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        muscleGroupIds: exerciseMuscleMapping.muscleGroupId
      })
      .from(exercises)
      .leftJoin(exerciseMuscleMapping, eq(exercises.id, exerciseMuscleMapping.exerciseId))
      .where(inArray(exercises.id, exerciseIds));
    
    // Group by exercise categories and muscle groups
    const compoundExercises = exerciseDetails.filter(e => 
      ['push', 'pull', 'legs'].includes(e.category || '')
    );
    const isolationExercises = exerciseDetails.filter(e => 
      ['accessories', 'core'].includes(e.category || '')
    );
    
    // Get muscle group distribution
    const muscleGroupCounts = exerciseDetails.reduce((acc, exercise) => {
      if (exercise.muscleGroupIds) {
        acc[exercise.muscleGroupIds] = (acc[exercise.muscleGroupIds] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalExercises: exerciseIds.length,
      compoundCount: compoundExercises.length,
      isolationCount: isolationExercises.length,
      muscleGroupDistribution: muscleGroupCounts,
      compoundPercentage: (compoundExercises.length / exerciseIds.length) * 100,
      isolationPercentage: (isolationExercises.length / exerciseIds.length) * 100
    };
  }
  
  /**
   * Get user's training profile for personalization
   */
  private static async getUserTrainingProfile(userId: number) {
    const landmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        recoveryLevel: volumeLandmarks.recoveryLevel,
        adaptationLevel: volumeLandmarks.adaptationLevel
      })
      .from(volumeLandmarks)
      .where(eq(volumeLandmarks.userId, userId));
    
    if (landmarks.length === 0) {
      // Default profile for new users
      return {
        avgRecoveryLevel: 5,
        avgAdaptationLevel: 5,
        experienceLevel: 'beginner' as const,
        fatigueThreshold: 6
      };
    }
    
    const avgRecovery = landmarks.reduce((sum, l) => sum + (l.recoveryLevel || 5), 0) / landmarks.length;
    const avgAdaptation = landmarks.reduce((sum, l) => sum + (l.adaptationLevel || 5), 0) / landmarks.length;
    
    // Determine experience level based on adaptation scores
    let experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite' = 'beginner';
    if (avgAdaptation >= 8) experienceLevel = 'elite';
    else if (avgAdaptation >= 6) experienceLevel = 'advanced';
    else if (avgAdaptation >= 4) experienceLevel = 'intermediate';
    
    return {
      avgRecoveryLevel: avgRecovery,
      avgAdaptationLevel: avgAdaptation,
      experienceLevel,
      fatigueThreshold: avgRecovery > 7 ? 8 : avgRecovery > 5 ? 7 : 6
    };
  }
  
  /**
   * Generate phase-specific distributions across mesocycle
   */
  private static async generatePhaseDistributions(
    baseStrategy: DistributionStrategy,
    totalWeeks: number,
    userProfile: any,
    exerciseAnalysis: any,
    constraints: DistributionConstraints,
    targetMuscleGroups?: string[]
  ): Promise<PhaseSpecificDistribution[]> {
    
    const distributions: PhaseSpecificDistribution[] = [];
    
    for (let week = 1; week <= totalWeeks; week++) {
      // Determine phase based on week
      const phase = this.determinePhase(week, totalWeeks);
      const phaseMultiplier = PHASE_MULTIPLIERS[phase];
      
      // Calculate fatigue level for this week (increases over time, resets in deload)
      const fatigueLevel = this.calculateWeeklyFatigue(week, totalWeeks, phase, userProfile.avgRecoveryLevel);
      
      // Adjust allocations based on phase and fatigue
      const adjustedAllocations = baseStrategy.allocations
        .filter(allocation => allocation.targetWeeks.includes(week))
        .map(allocation => this.adjustAllocationForPhase(
          allocation, 
          phase, 
          fatigueLevel, 
          userProfile, 
          constraints,
          targetMuscleGroups
        ));
      
      distributions.push({
        phase,
        week,
        totalWeeks,
        fatigueLevel,
        adaptationLevel: userProfile.avgAdaptationLevel,
        allocations: adjustedAllocations
      });
    }
    
    return distributions;
  }
  
  /**
   * Determine training phase based on week
   */
  private static determinePhase(week: number, totalWeeks: number): TrainingPhase {
    if (week === totalWeeks) return 'deload';
    if (week >= totalWeeks - 1) return 'intensification';
    return 'accumulation';
  }
  
  /**
   * Calculate weekly fatigue accumulation
   */
  private static calculateWeeklyFatigue(
    week: number, 
    totalWeeks: number, 
    phase: TrainingPhase, 
    recoveryLevel: number
  ): number {
    if (phase === 'deload') return Math.max(1, recoveryLevel - 3);
    
    // Fatigue builds up linearly with recovery modulation
    const baseProgression = (week / (totalWeeks - 1)) * 7; // 1-7 scale
    const recoveryModulation = (10 - recoveryLevel) / 10; // Lower recovery = higher fatigue
    
    return Math.min(10, Math.max(1, baseProgression * (1 + recoveryModulation)));
  }
  
  /**
   * Adjust allocation for specific phase and conditions
   */
  private static adjustAllocationForPhase(
    allocation: SpecialMethodAllocation,
    phase: TrainingPhase,
    fatigueLevel: number,
    userProfile: any,
    constraints: DistributionConstraints,
    targetMuscleGroups?: string[]
  ): SpecialMethodAllocation {
    
    let adjustedPercentage = allocation.percentage;
    const phaseMultiplier = PHASE_MULTIPLIERS[phase];
    
    // Phase adjustment
    adjustedPercentage *= phaseMultiplier;
    
    // Fatigue adjustment (reduce special methods when fatigue is high)
    if (fatigueLevel > userProfile.fatigueThreshold) {
      const fatigueReduction = (fatigueLevel - userProfile.fatigueThreshold) * 0.15;
      adjustedPercentage *= (1 - fatigueReduction);
    }
    
    // Experience level adjustment
    const experienceMultiplier = this.getExperienceMultiplier(userProfile.experienceLevel);
    adjustedPercentage *= experienceMultiplier;
    
    // Target muscle group specialization
    if (targetMuscleGroups && allocation.muscleGroups.some(mg => targetMuscleGroups.includes(mg))) {
      adjustedPercentage *= 1.5; // 50% increase for target muscles
    }
    
    // Apply constraints
    adjustedPercentage = Math.min(adjustedPercentage, constraints.maxSpecialMethodsPerSession);
    adjustedPercentage = Math.max(adjustedPercentage, 0);
    
    return {
      ...allocation,
      percentage: Math.round(adjustedPercentage * 10) / 10, // Round to 1 decimal
      reasoning: `${allocation.reasoning} (Phase: ${phase}, Fatigue: ${fatigueLevel.toFixed(1)})`
    };
  }
  
  /**
   * Get experience-based multiplier
   */
  private static getExperienceMultiplier(experienceLevel: string): number {
    switch (experienceLevel) {
      case 'beginner': return 0.6;
      case 'intermediate': return 1.0;
      case 'advanced': return 1.3;
      case 'elite': return 1.5;
      default: return 1.0;
    }
  }
  
  /**
   * Calculate total fatigue impact of distribution
   */
  private static calculateFatigueImpact(distributions: PhaseSpecificDistribution[]): number {
    let totalImpact = 0;
    
    for (const distribution of distributions) {
      let weeklyImpact = 0;
      for (const allocation of distribution.allocations) {
        const methodFatigue = FATIGUE_COEFFICIENTS[allocation.method] || 1.0;
        const phaseMultiplier = PHASE_MULTIPLIERS[distribution.phase];
        weeklyImpact += (allocation.percentage / 100) * methodFatigue * phaseMultiplier;
      }
      totalImpact += weeklyImpact;
    }
    
    return totalImpact / distributions.length;
  }
  
  /**
   * Calculate total percentage of special methods
   */
  private static calculateTotalSpecialMethodPercentage(distributions: PhaseSpecificDistribution[]): number {
    let totalPercentage = 0;
    
    for (const distribution of distributions) {
      const weeklyPercentage = distribution.allocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 0
      );
      totalPercentage += weeklyPercentage;
    }
    
    return Math.round((totalPercentage / distributions.length) * 10) / 10;
  }
  
  /**
   * Validate distribution against constraints
   */
  private static validateDistribution(
    distributions: PhaseSpecificDistribution[], 
    constraints: DistributionConstraints
  ): { isValid: boolean; warnings: string[] } {
    
    const warnings: string[] = [];
    
    for (const distribution of distributions) {
      const totalPercentage = distribution.allocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 0
      );
      
      // Check maximum special methods per week
      if (totalPercentage > constraints.maxSpecialMethodsPerWeek) {
        warnings.push(`Week ${distribution.week}: ${totalPercentage}% exceeds maximum ${constraints.maxSpecialMethodsPerWeek}%`);
      }
      
      // Check minimum regular sets percentage
      const regularPercentage = 100 - totalPercentage;
      if (regularPercentage < constraints.minimumRegularSetsPercentage) {
        warnings.push(`Week ${distribution.week}: Only ${regularPercentage}% regular training (minimum: ${constraints.minimumRegularSetsPercentage}%)`);
      }
      
      // Check fatigue threshold
      if (distribution.fatigueLevel > constraints.fatigueThreshold) {
        warnings.push(`Week ${distribution.week}: High fatigue level ${distribution.fatigueLevel} (threshold: ${constraints.fatigueThreshold})`);
      }
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Generate scientific justification for distribution
   */
  private static generateScientificJustification(
    strategy: DistributionStrategy,
    distributions: PhaseSpecificDistribution[],
    userProfile: any
  ): string[] {
    
    const justifications: string[] = [];
    
    // Base strategy justification
    justifications.push(strategy.scientificRationale);
    
    // Phase-specific justifications
    const phases = Array.from(new Set(distributions.map(d => d.phase)));
    for (const phase of phases) {
      switch (phase) {
        case 'accumulation':
          justifications.push("Accumulation phase: Moderate special method use to build work capacity while managing fatigue");
          break;
        case 'intensification':
          justifications.push("Intensification phase: Increased special method intensity to maximize adaptation stimulus");
          break;
        case 'deload':
          justifications.push("Deload phase: Minimal special methods to promote recovery and supercompensation");
          break;
      }
    }
    
    // Experience-specific justification
    justifications.push(`Adjusted for ${userProfile.experienceLevel} trainee tolerance and adaptation capacity`);
    
    // Recovery-specific justification
    if (userProfile.avgRecoveryLevel < 5) {
      justifications.push("Conservative approach due to lower recovery capacity");
    } else if (userProfile.avgRecoveryLevel > 7) {
      justifications.push("Enhanced special method utilization based on superior recovery capacity");
    }
    
    return justifications;
  }
}