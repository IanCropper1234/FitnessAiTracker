/**
 * Volume Distribution Types
 * Scientific volume allocation based on Renaissance Periodization methodology
 */

export interface ExerciseVolumeAllocation {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  muscleGroupId: number;
  allocatedSets: number;
  priority: 'primary' | 'secondary' | 'tertiary';
  contribution: number; // 對該肌群的貢獻百分比 (0-100)
  trainingDays: number[]; // 分配到哪些訓練日 (0=Sunday, 1=Monday, etc.)
  setsPerDay: Record<number, number>; // 每天的組數分配
}

export interface VolumeConstraints {
  muscleGroup: string;
  muscleGroupId: number;
  weeklyMin: number; // MEV
  weeklyMax: number; // MAV  
  weeklyLimit: number; // MRV
  frequencyMin: number; // 最少訓練頻率/週
  frequencyMax: number; // 最多訓練頻率/週
  currentWeek: number;
  totalWeeks: number;
  recoveryLevel?: number;
  adaptationLevel?: number;
}

export interface WeeklyVolumeTarget {
  muscleGroup: string;
  muscleGroupId: number;
  targetSets: number;
  phase: 'accumulation' | 'intensification' | 'deload';
  adjustmentFactor: number; // 基於恢復狀態的調整 (0.8-1.2)
  weekNumber: number;
}

export interface VolumeDistributionResult {
  muscleGroup: string;
  totalAllocatedSets: number;
  allocations: ExerciseVolumeAllocation[];
  isWithinConstraints: boolean;
  utilizationPercentage: number; // 佔 MAV 的百分比
  warnings: string[];
}

export interface ExercisePriority {
  exerciseId: number;
  priority: number; // 1-10, 10 = highest priority
  multiplier: number; // Volume allocation multiplier
  category: 'compound' | 'isolation' | 'accessory';
  difficulty: number; // 1-10 difficulty rating
}

export interface TrainingDayDistribution {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  dayName: string;
  muscleGroups: string[];
  totalSets: number;
  exercises: ExerciseVolumeAllocation[];
}

export interface MesocycleVolumeProgression {
  mesocycleId: number;
  weekNumber: number;
  muscleGroupProgressions: WeeklyVolumeTarget[];
  totalWeeklyVolume: number;
  expectedPhase: 'accumulation' | 'intensification' | 'deload';
  volumeIncreaseFromPrevious: number; // +/- sets from previous week
}

/**
 * Exercise role in muscle group training
 */
export enum ExerciseRole {
  PRIMARY = 'primary',     // Main muscle group mover
  SECONDARY = 'secondary', // Significant contributor  
  STABILIZER = 'stabilizer' // Minor stabilizing role
}

/**
 * Volume distribution strategy options
 */
export enum DistributionStrategy {
  COMPOUND_HEAVY = 'compound_heavy',     // 70% to compound movements
  BALANCED = 'balanced',                 // 60% compound, 40% isolation
  ISOLATION_FOCUS = 'isolation_focus',   // 50% compound, 50% isolation  
  FREQUENCY_OPTIMIZED = 'frequency_optimized' // Optimize for training frequency
}