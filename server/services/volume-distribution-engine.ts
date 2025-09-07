/**
 * Volume Distribution Engine
 * Scientific volume allocation based on Renaissance Periodization methodology
 * Ensures weekly volume targets are properly distributed across exercises
 */

import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { 
  exercises, 
  exerciseMuscleMapping, 
  muscleGroups,
  volumeLandmarks 
} from "@shared/schema";
import type {
  ExerciseVolumeAllocation,
  VolumeConstraints,
  WeeklyVolumeTarget,
  VolumeDistributionResult,
  ExercisePriority
} from "@shared/types/volume-distribution";
import { DistributionStrategy } from "@shared/types/volume-distribution";

export class VolumeDistributionEngine {
  
  /**
   * 核心函數：將週總量智能分配到多個動作
   * Main function: Intelligently distribute weekly volume across multiple exercises
   */
  static async distributeVolumeAcrossExercises(
    weeklyTarget: number,           // 來自 MEV/MAV 的週目標組數
    exerciseIds: number[],          // 程式中的相關動作ID
    muscleGroup: string,           // 目標肌群
    muscleGroupId: number,         // 肌群 ID
    trainingDays: number[],        // 訓練該肌群的天數 [1, 3, 5] 
    strategy: DistributionStrategy = DistributionStrategy.BALANCED
  ): Promise<VolumeDistributionResult> {
    
    try {
      // Step 1: 獲取動作詳細信息和優先級
      const exerciseDetails = await this.getExerciseDetails(exerciseIds, muscleGroupId);
      console.log(`🔍 Exercise details retrieved: ${exerciseDetails.length} exercises`);
      
      // Step 2: 計算動作優先級
      const prioritizedExercises = await this.calculateExercisePriorities(exerciseDetails, muscleGroup);
      
      // Step 3: 應用分配策略
      const baseAllocations = this.applyDistributionStrategy(weeklyTarget, prioritizedExercises, strategy);
      
      // Step 4: 分配到訓練日
      const finalAllocations = this.distributeAcrossTrainingDays(baseAllocations, trainingDays);
      
      // Step 5: 驗證和調整
      const result = this.validateAndAdjustAllocations(finalAllocations, weeklyTarget, muscleGroup);
      
      console.log(`Volume distribution for ${muscleGroup}: ${weeklyTarget} sets across ${exerciseIds.length} exercises`);
      console.log(`Exercise details found: ${exerciseDetails.length}, priorities calculated: ${prioritizedExercises.length}`);
      console.log(`Base allocations: ${baseAllocations.length}, final allocations: ${finalAllocations.length}`);
      
      return result;
      
    } catch (error) {
      console.error('Error in distributeVolumeAcrossExercises:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        muscleGroup,
        totalAllocatedSets: 0,
        allocations: [],
        isWithinConstraints: false,
        utilizationPercentage: 0,
        warnings: [`Failed to distribute volume: ${errorMessage}`]
      };
    }
  }
  
  /**
   * 獲取動作詳細信息和肌群映射
   */
  private static async getExerciseDetails(exerciseIds: number[], muscleGroupId: number) {
    const exerciseDetails = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        muscleGroups: exercises.muscleGroups,
        contributionPercentage: exerciseMuscleMapping.contributionPercentage,
        role: exerciseMuscleMapping.role
      })
      .from(exercises)
      .leftJoin(exerciseMuscleMapping, and(
        eq(exerciseMuscleMapping.exerciseId, exercises.id),
        eq(exerciseMuscleMapping.muscleGroupId, muscleGroupId)
      ))
      .where(inArray(exercises.id, exerciseIds));
    
    return exerciseDetails;
  }
  
  /**
   * 根據動作類型和重要性計算優先級
   */
  private static async calculateExercisePriorities(
    exerciseDetails: any[],
    muscleGroup: string
  ): Promise<ExercisePriority[]> {
    
    console.log(`🔍 Calculating priorities for ${exerciseDetails.length} exercises in ${muscleGroup}`);
    
    return exerciseDetails.map(exercise => {
      let priority = 5; // Base priority
      let multiplier = 1.0;
      
      // 複合動作優先級更高
      if (exercise.category === 'compound') {
        priority += 3;
        multiplier += 0.4;
      } else if (exercise.category === 'isolation') {
        priority += 1;
        multiplier += 0.2;
      }
      
      // 難度影響優先級
      if (exercise.difficulty) {
        priority += Math.floor(exercise.difficulty / 2);
        multiplier += (exercise.difficulty - 5) * 0.1;
      }
      
      // 主要肌群動作優先級更高
      if (exercise.role === 'primary') {
        priority += 2;
        multiplier += 0.3;
      } else if (exercise.role === 'secondary') {
        priority += 1;
        multiplier += 0.1;
      }
      
      // 貢獻百分比影響
      if (exercise.contributionPercentage) {
        multiplier += (exercise.contributionPercentage - 50) * 0.01;
      }
      
      // 確保在合理範圍內
      priority = Math.max(1, Math.min(10, priority));
      multiplier = Math.max(0.5, Math.min(2.0, multiplier));
      
      return {
        exerciseId: exercise.id,
        priority,
        multiplier,
        category: exercise.category || 'accessory',
        difficulty: exercise.difficulty || 5
      };
    });
  }
  
  /**
   * 應用分配策略
   */
  private static applyDistributionStrategy(
    totalSets: number,
    prioritizedExercises: ExercisePriority[],
    strategy: DistributionStrategy
  ): ExerciseVolumeAllocation[] {
    
    let compoundRatio = 0.6; // Default balanced strategy
    
    switch (strategy) {
      case DistributionStrategy.COMPOUND_HEAVY:
        compoundRatio = 0.7;
        break;
      case DistributionStrategy.ISOLATION_FOCUS:
        compoundRatio = 0.5;
        break;
      case DistributionStrategy.FREQUENCY_OPTIMIZED:
        compoundRatio = 0.65;
        break;
    }
    
    // 分離複合和孤立動作
    const compoundExercises = prioritizedExercises.filter(e => e.category === 'compound');
    const isolationExercises = prioritizedExercises.filter(e => e.category !== 'compound');
    
    // 計算分配組數
    const compoundSets = Math.floor(totalSets * compoundRatio);
    const isolationSets = totalSets - compoundSets;
    
    const allocations: ExerciseVolumeAllocation[] = [];
    
    // 分配複合動作組數
    if (compoundExercises.length > 0) {
      const compoundAllocations = this.distributeVolumeByPriority(compoundSets, compoundExercises);
      allocations.push(...compoundAllocations);
    }
    
    // 分配孤立動作組數
    if (isolationExercises.length > 0) {
      const isolationAllocations = this.distributeVolumeByPriority(isolationSets, isolationExercises);
      allocations.push(...isolationAllocations);
    }
    
    return allocations;
  }
  
  /**
   * 根據優先級分配組數
   */
  private static distributeVolumeByPriority(
    totalSets: number,
    exercises: ExercisePriority[]
  ): ExerciseVolumeAllocation[] {
    
    if (exercises.length === 0) return [];
    
    // 計算總權重
    const totalWeight = exercises.reduce((sum, ex) => sum + (ex.priority * ex.multiplier), 0);
    
    let remainingSets = totalSets;
    const allocations: ExerciseVolumeAllocation[] = [];
    
    // 按優先級排序
    const sortedExercises = exercises.sort((a, b) => b.priority - a.priority);
    
    for (let i = 0; i < sortedExercises.length; i++) {
      const exercise = sortedExercises[i];
      
      let allocatedSets: number;
      
      if (i === sortedExercises.length - 1) {
        // 最後一個動作分配剩餘組數
        allocatedSets = remainingSets;
      } else {
        // 根據權重分配
        const weight = exercise.priority * exercise.multiplier;
        const proportion = weight / totalWeight;
        allocatedSets = Math.max(1, Math.round(totalSets * proportion));
      }
      
      // 確保每個動作至少 1 組，最多 6 組
      allocatedSets = Math.max(1, Math.min(6, allocatedSets));
      allocatedSets = Math.min(allocatedSets, remainingSets);
      
      allocations.push({
        exerciseId: exercise.exerciseId,
        exerciseName: `Exercise ${exercise.exerciseId}`, // Will be updated with real name
        muscleGroup: '', // Will be filled by caller
        muscleGroupId: 0, // Will be filled by caller
        allocatedSets: allocatedSets || 0, // 確保不是 null
        priority: exercise.category === 'compound' ? 'primary' : 'secondary',
        contribution: 100, // Will be updated based on muscle mapping
        trainingDays: [],
        setsPerDay: {}
      });
      
      remainingSets -= allocatedSets;
      
      if (remainingSets <= 0) break;
    }
    
    return allocations;
  }
  
  /**
   * 分配到訓練日
   */
  private static distributeAcrossTrainingDays(
    allocations: ExerciseVolumeAllocation[],
    trainingDays: number[]
  ): ExerciseVolumeAllocation[] {
    
    return allocations.map(allocation => {
      const setsPerDay: Record<number, number> = {};
      const totalSets = allocation.allocatedSets;
      const daysCount = trainingDays.length;
      
      if (daysCount === 0) {
        return { ...allocation, trainingDays: [], setsPerDay: {} };
      }
      
      // 平均分配到各訓練日
      const safeTotal = totalSets || 0;
      const baseSetsPerDay = Math.floor(safeTotal / daysCount);
      const extraSets = safeTotal % daysCount;
      
      trainingDays.forEach((day, index) => {
        setsPerDay[day] = baseSetsPerDay + (index < extraSets ? 1 : 0);
      });
      
      return {
        ...allocation,
        trainingDays: [...trainingDays],
        setsPerDay
      };
    });
  }
  
  /**
   * 驗證和調整分配結果
   */
  private static validateAndAdjustAllocations(
    allocations: ExerciseVolumeAllocation[],
    targetSets: number,
    muscleGroup: string
  ): VolumeDistributionResult {
    
    const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.allocatedSets || 0), 0);
    const isWithinConstraints = Math.abs(totalAllocated - targetSets) <= 1; // Allow 1 set variance
    const utilizationPercentage = targetSets > 0 ? (totalAllocated / targetSets) * 100 : 0;
    
    const warnings: string[] = [];
    
    if (totalAllocated !== targetSets) {
      warnings.push(`Volume mismatch: allocated ${totalAllocated} sets vs target ${targetSets} sets`);
    }
    
    if (allocations.some(alloc => (alloc.allocatedSets || 0) === 0)) {
      warnings.push(`Some exercises received 0 sets`);
    }
    
    if (allocations.some(alloc => (alloc.allocatedSets || 0) > 6)) {
      warnings.push(`Some exercises received >6 sets per week`);
    }
    
    return {
      muscleGroup,
      totalAllocatedSets: totalAllocated,
      allocations,
      isWithinConstraints,
      utilizationPercentage,
      warnings
    };
  }
  
  /**
   * 確保週總量不超過 MAV 限制
   */
  static validateWeeklyVolumeConstraints(
    allocations: ExerciseVolumeAllocation[],
    constraints: VolumeConstraints
  ): { isValid: boolean; violations: string[] } {
    
    const totalVolume = allocations.reduce((sum, alloc) => sum + alloc.allocatedSets, 0);
    const violations: string[] = [];
    
    if (totalVolume < constraints.weeklyMin) {
      violations.push(`Total volume ${totalVolume} below MEV ${constraints.weeklyMin}`);
    }
    
    if (totalVolume > constraints.weeklyLimit) {
      violations.push(`Total volume ${totalVolume} exceeds MRV ${constraints.weeklyLimit}`);
    }
    
    const uniqueTrainingDays = new Set(allocations.flatMap(alloc => alloc.trainingDays)).size;
    
    if (uniqueTrainingDays < constraints.frequencyMin) {
      violations.push(`Training frequency ${uniqueTrainingDays} below minimum ${constraints.frequencyMin}`);
    }
    
    if (uniqueTrainingDays > constraints.frequencyMax) {
      violations.push(`Training frequency ${uniqueTrainingDays} above maximum ${constraints.frequencyMax}`);
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  }
}