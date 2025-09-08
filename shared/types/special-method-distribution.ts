// Special Method Distribution Engine Types
// Based on Renaissance Periodization methodology and scientific research

export type SpecialMethodType = 
  | 'myorep_match' 
  | 'myorep_no_match' 
  | 'drop_set' 
  | 'superset' 
  | 'giant_set';

export type TrainingPhase = 'accumulation' | 'intensification' | 'deload';

export interface SpecialMethodAllocation {
  method: SpecialMethodType;
  percentage: number; // 0-100
  targetWeeks: number[]; // Which weeks to apply this method
  exerciseTypes: ('compound' | 'isolation')[];
  muscleGroups: string[];
  reasoning: string;
}

export interface DistributionStrategy {
  name: string;
  description: string;
  scientificRationale: string;
  targetPopulation: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  allocations: SpecialMethodAllocation[];
}

export interface PhaseSpecificDistribution {
  phase: TrainingPhase;
  week: number;
  totalWeeks: number;
  fatigueLevel: number; // 1-10 scale
  adaptationLevel: number; // 1-10 scale
  allocations: SpecialMethodAllocation[];
}

export interface DistributionConstraints {
  maxSpecialMethodsPerSession: number;
  maxSpecialMethodsPerWeek: number;
  minimumRegularSetsPercentage: number; // 保證常規訓練的最低百分比
  fatigueThreshold: number; // 疲勞閾值
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

export interface DistributionResult {
  strategy: DistributionStrategy;
  weeklyDistribution: PhaseSpecificDistribution[];
  totalSpecialMethodPercentage: number;
  expectedFatigueImpact: number;
  scientificJustification: string[];
  warnings: string[];
}

// Predefined Evidence-Based Distribution Strategies
export const DISTRIBUTION_STRATEGIES: Record<string, DistributionStrategy> = {
  CONSERVATIVE: {
    name: "Conservative Distribution",
    description: "Minimal special methods with focus on technique mastery",
    scientificRationale: "Based on beginner adaptation research - prioritize movement quality over intensity techniques",
    targetPopulation: 'beginner',
    allocations: [
      {
        method: 'myorep_match',
        percentage: 10,
        targetWeeks: [4, 5, 6],
        exerciseTypes: ['isolation'],
        muscleGroups: ['biceps', 'triceps', 'shoulders'],
        reasoning: "Low-risk introduction to intensity techniques on smaller muscle groups"
      }
    ]
  },
  
  BALANCED: {
    name: "Balanced Distribution", 
    description: "Evidence-based mix optimizing stimulus-to-fatigue ratio",
    scientificRationale: "RP methodology - 20-30% special methods with phase-specific allocation",
    targetPopulation: 'intermediate',
    allocations: [
      {
        method: 'myorep_match',
        percentage: 15,
        targetWeeks: [2, 3, 4, 5],
        exerciseTypes: ['isolation'],
        muscleGroups: ['biceps', 'triceps', 'shoulders', 'calves'],
        reasoning: "Time-efficient hypertrophy stimulus for accessories (RP research)"
      },
      {
        method: 'drop_set',
        percentage: 10,
        targetWeeks: [3, 4, 5],
        exerciseTypes: ['isolation'],
        muscleGroups: ['chest', 'lats', 'quads'],
        reasoning: "Matched hypertrophy with 2-3x time efficiency (meta-analysis 2023)"
      },
      {
        method: 'superset',
        percentage: 8,
        targetWeeks: [1, 2, 6],
        exerciseTypes: ['isolation'],
        muscleGroups: ['chest', 'lats', 'quads', 'glutes'],
        reasoning: "Time-efficient training with paired muscle groups"
      }
    ]
  },
  
  AGGRESSIVE: {
    name: "Aggressive Distribution",
    description: "High-intensity approach for advanced trainees",
    scientificRationale: "Advanced trainee protocols - higher special method tolerance with careful fatigue management",
    targetPopulation: 'advanced',
    allocations: [
      {
        method: 'myorep_match',
        percentage: 20,
        targetWeeks: [2, 3, 4, 5, 6],
        exerciseTypes: ['isolation'],
        muscleGroups: ['biceps', 'triceps', 'shoulders', 'calves'],
        reasoning: "Maximal time efficiency for experienced trainees"
      },
      {
        method: 'drop_set',
        percentage: 15,
        targetWeeks: [3, 4, 5, 6],
        exerciseTypes: ['isolation', 'compound'],
        muscleGroups: ['chest', 'lats', 'quads', 'hamstrings'],
        reasoning: "Advanced trainee tolerance for higher intensity methods"
      },
      {
        method: 'superset',
        percentage: 12,
        targetWeeks: [1, 2, 5, 6],
        exerciseTypes: ['isolation'],
        muscleGroups: ['chest', 'lats', 'quads', 'glutes', 'hamstrings'],
        reasoning: "Enhanced training efficiency with paired exercises"
      },
      {
        method: 'giant_set',
        percentage: 8,
        targetWeeks: [4, 5],
        exerciseTypes: ['isolation'],
        muscleGroups: ['triceps', 'biceps', 'shoulders'],
        reasoning: "Peak intensity for multiple muscle groups"
      }
    ]
  },
  
  SPECIALIZATION: {
    name: "Muscle Specialization",
    description: "Targeted approach for specific muscle group development",
    scientificRationale: "Specialization protocols with 40-60% increased volume for target muscles",
    targetPopulation: 'intermediate',
    allocations: [
      {
        method: 'myorep_match',
        percentage: 25,
        targetWeeks: [2, 3, 4, 5, 6],
        exerciseTypes: ['isolation'],
        muscleGroups: ['target_muscle'], // Will be dynamically assigned
        reasoning: "Maximal specialization stimulus with manageable fatigue"
      },
      {
        method: 'drop_set',
        percentage: 20,
        targetWeeks: [3, 4, 5, 6],
        exerciseTypes: ['isolation', 'compound'],
        muscleGroups: ['target_muscle'],
        reasoning: "Enhanced muscle damage and metabolic stress for target muscle"
      },
      {
        method: 'giant_set',
        percentage: 10,
        targetWeeks: [4, 5],
        exerciseTypes: ['isolation'],
        muscleGroups: ['target_muscle'],
        reasoning: "Multiple angle stimulation for specialization phases"
      }
    ]
  }
};

// Fatigue Impact Coefficients (based on research)
export const FATIGUE_COEFFICIENTS: Record<SpecialMethodType, number> = {
  'myorep_match': 1.2,
  'myorep_no_match': 1.3,
  'drop_set': 1.4,
  'superset': 1.6,
  'giant_set': 1.8
};

// Phase-Specific Multipliers
export const PHASE_MULTIPLIERS: Record<TrainingPhase, number> = {
  'accumulation': 1.0,
  'intensification': 1.3,
  'deload': 0.4
};