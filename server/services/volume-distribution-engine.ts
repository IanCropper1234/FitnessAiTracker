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
    console.log(`🔍 Exercise details:`, exerciseDetails.map(e => ({ id: e.id, category: e.category, difficulty: e.difficulty, role: e.role })));
    
    return exerciseDetails.map(exercise => {
      let priority = 5; // Base priority
      let multiplier = 1.0;
      
      // 複合動作優先級更高 (根據實際資料庫的類型)
      const compoundCategories = ['push', 'pull', 'legs', 'compound'];
      if (compoundCategories.includes(exercise.category)) {
        priority += 3;
        multiplier += 0.4;
      } else {
        priority += 1;
        multiplier += 0.2;
      }
      
      // 難度影響優先級 (處理字串難度)
      let difficultyValue = 5; // 預設值
      if (exercise.difficulty) {
        if (typeof exercise.difficulty === 'string') {
          const difficultyMap: Record<string, number> = {
            'beginner': 3,
            'intermediate': 5,
            'advanced': 7
          };
          difficultyValue = difficultyMap[exercise.difficulty] || 5;
        } else {
          difficultyValue = exercise.difficulty;
        }
        priority += Math.floor(difficultyValue / 2);
        multiplier += (difficultyValue - 5) * 0.1;
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
      
      console.log(`📝 Exercise ${exercise.id}: priority=${priority}, multiplier=${multiplier}, category=${exercise.category}`);
      
      return {
        exerciseId: exercise.id,
        priority,
        multiplier,
        category: exercise.category || 'accessory',
        difficulty: difficultyValue
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
    
    console.log(`🎯 Applying distribution strategy: ${totalSets} sets to ${prioritizedExercises.length} exercises`);
    
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
    
    // 分離複合和孤立動作 (根據實際資料庫的類型)
    const compoundCategories = ['push', 'pull', 'legs', 'compound'];
    const compoundExercises = prioritizedExercises.filter(e => compoundCategories.includes(e.category));
    const isolationExercises = prioritizedExercises.filter(e => !compoundCategories.includes(e.category));
    
    console.log(`📊 Exercise categories: ${compoundExercises.length} compound, ${isolationExercises.length} isolation`);
    console.log(`📊 Category breakdown:`, prioritizedExercises.map(e => ({ id: e.exerciseId, category: e.category })));
    
    // 特殊情況：如果只有一種類型的動作，將所有組數分配給該類型
    if (compoundExercises.length > 0 && isolationExercises.length === 0) {
      console.log(`📦 Only compound exercises found, allocating all ${totalSets} sets to compound`);
      return this.distributeVolumeByPriority(totalSets, compoundExercises);
    } else if (isolationExercises.length > 0 && compoundExercises.length === 0) {
      console.log(`🎯 Only isolation exercises found, allocating all ${totalSets} sets to isolation`);
      return this.distributeVolumeByPriority(totalSets, isolationExercises);
    }
    
    // 正常情況：按比例分配組數
    const compoundSets = Math.floor(totalSets * compoundRatio);
    const isolationSets = totalSets - compoundSets;
    
    console.log(`🔢 Set allocation: ${compoundSets} to compound, ${isolationSets} to isolation`);
    
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
    
    console.log(`🔄 Distributing ${totalSets} sets among ${exercises.length} exercises`);
    
    if (exercises.length === 0) return [];
    if (totalSets <= 0) return [];
    
    // 簡化分配：平均分配為基礎，確保每個動作至少1組
    const allocations: ExerciseVolumeAllocation[] = [];
    let remainingSets = totalSets;
    
    // 每個動作最少1組
    const minSetsPerExercise = 1;
    const totalMinSets = exercises.length * minSetsPerExercise;
    
    if (totalMinSets > totalSets) {
      // 如果總組數不夠每個動作分配1組，平均分配
      const setsPerExercise = Math.floor(totalSets / exercises.length);
      const extraSets = totalSets % exercises.length;
      
      exercises.forEach((exercise, index) => {
        const allocatedSets = setsPerExercise + (index < extraSets ? 1 : 0);
        allocations.push({
          exerciseId: exercise.exerciseId,
          exerciseName: `Exercise ${exercise.exerciseId}`,
          muscleGroup: '',
          muscleGroupId: 0,
          allocatedSets,
          priority: ['push', 'pull', 'legs', 'compound'].includes(exercise.category) ? 'primary' : 'secondary',
          contribution: 100,
          trainingDays: [],
          setsPerDay: {}
        });
      });
    } else {
      // 先分配每個動作1組，然後分配剩餘組數
      exercises.forEach(exercise => {
        allocations.push({
          exerciseId: exercise.exerciseId,
          exerciseName: `Exercise ${exercise.exerciseId}`,
          muscleGroup: '',
          muscleGroupId: 0,
          allocatedSets: minSetsPerExercise,
          priority: ['push', 'pull', 'legs', 'compound'].includes(exercise.category) ? 'primary' : 'secondary',
          contribution: 100,
          trainingDays: [],
          setsPerDay: {}
        });
        remainingSets -= minSetsPerExercise;
      });
      
      // 分配剩餘組數，優先給前面的動作
      let exerciseIndex = 0;
      while (remainingSets > 0 && exerciseIndex < allocations.length) {
        const maxAdditionalSets = Math.min(8, Math.ceil(totalSets / exercises.length) + 2); // 動態設定最大組數
        const currentSets = allocations[exerciseIndex].allocatedSets;
        const canAdd = Math.min(maxAdditionalSets - currentSets, remainingSets);
        
        if (canAdd > 0) {
          allocations[exerciseIndex].allocatedSets += canAdd;
          remainingSets -= canAdd;
        }
        
        exerciseIndex++;
        
        // 如果已經遍歷完所有動作，重新開始
        if (exerciseIndex >= allocations.length) {
          exerciseIndex = 0;
        }
      }
    }
    
    console.log(`✅ Distribution complete: ${allocations.map(a => `Ex${a.exerciseId}:${a.allocatedSets}`).join(', ')}`);
    
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