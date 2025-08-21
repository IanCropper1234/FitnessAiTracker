/**
 * RPE to RIR Conversion Utility
 * Based on Renaissance Periodization methodology and scientific literature
 * 
 * References:
 * - Zourdos et al. (2016) - Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale
 * - Mike Israetel (Renaissance Periodization) - Scientific Principles of Hypertrophy Training
 * - Helms et al. (2016) - RPE as a method of volume autoregulation in resistance training
 */

export interface RPERIRMapping {
  rpe: number;
  rir: number;
  description: string;
  trainingApplication: string;
}

/**
 * Official RPE to RIR conversion table based on scientific literature
 * and Renaissance Periodization methodology
 */
export const RPE_RIR_CONVERSION_TABLE: RPERIRMapping[] = [
  {
    rpe: 10,
    rir: 0,
    description: "Maximum effort - absolute failure",
    trainingApplication: "Testing 1RM, competition attempts"
  },
  {
    rpe: 9.5,
    rir: 0.5,
    description: "Could maybe do 1 more rep with perfect conditions",
    trainingApplication: "Near-maximum efforts, peaking"
  },
  {
    rpe: 9,
    rir: 1,
    description: "Could definitely do 1 more rep",
    trainingApplication: "Heavy strength work, max effort sets"
  },
  {
    rpe: 8.5,
    rir: 1.5,
    description: "Could do 1-2 more reps",
    trainingApplication: "Heavy strength training"
  },
  {
    rpe: 8,
    rir: 2,
    description: "Could do 2 more reps",
    trainingApplication: "Most strength/hypertrophy work"
  },
  {
    rpe: 7.5,
    rir: 2.5,
    description: "Could do 2-3 more reps",
    trainingApplication: "Moderate-intensity volume work"
  },
  {
    rpe: 7,
    rir: 3,
    description: "Could do 3 more reps",
    trainingApplication: "Hypertrophy training, volume work"
  },
  {
    rpe: 6.5,
    rir: 3.5,
    description: "Could do 3-4 more reps",
    trainingApplication: "Light training, technique work"
  },
  {
    rpe: 6,
    rir: 4,
    description: "Could do 4 more reps",
    trainingApplication: "Light training days, warm-up sets"
  },
  {
    rpe: 5.5,
    rir: 4.5,
    description: "Could do 4-5 more reps",
    trainingApplication: "Active recovery, technique practice"
  },
  {
    rpe: 5,
    rir: 5,
    description: "Could do 5 more reps",
    trainingApplication: "Warm-ups, deload training"
  }
];

/**
 * Convert RPE to RIR using scientific methodology
 * @param rpe Rate of Perceived Exertion (5-10 scale)
 * @returns Reps in Reserve (0-5 scale)
 */
export function convertRPEtoRIR(rpe: number): number {
  // Input validation
  if (isNaN(rpe) || rpe < 5 || rpe > 10) {
    console.warn(`Invalid RPE value: ${rpe}. Using default RIR of 2.`);
    return 2; // Safe default for hypertrophy training
  }

  // Handle exact matches first
  const exactMatch = RPE_RIR_CONVERSION_TABLE.find(mapping => mapping.rpe === rpe);
  if (exactMatch) {
    return exactMatch.rir;
  }

  // Handle interpolation for values between defined points
  // RPE 10 = 0 RIR, RPE 5 = 5 RIR (linear relationship)
  const rir = 10 - rpe;
  
  // Clamp to valid RIR range (0-5)
  return Math.max(0, Math.min(5, rir));
}

/**
 * Convert RIR to RPE using scientific methodology
 * @param rir Reps in Reserve (0-5 scale)
 * @returns Rate of Perceived Exertion (5-10 scale)
 */
export function convertRIRtoRPE(rir: number): number {
  // Input validation
  if (isNaN(rir) || rir < 0 || rir > 5) {
    console.warn(`Invalid RIR value: ${rir}. Using default RPE of 8.`);
    return 8; // Safe default for hypertrophy training
  }

  // Handle exact matches first
  const exactMatch = RPE_RIR_CONVERSION_TABLE.find(mapping => mapping.rir === rir);
  if (exactMatch) {
    return exactMatch.rpe;
  }

  // Handle interpolation for values between defined points
  // RIR 0 = 10 RPE, RIR 5 = 5 RPE (linear relationship)
  const rpe = 10 - rir;
  
  // Clamp to valid RPE range (5-10)
  return Math.max(5, Math.min(10, rpe));
}

/**
 * Get training recommendations based on RPE/RIR values
 * @param rpe Rate of Perceived Exertion
 * @returns Training application and recommendations
 */
export function getTrainingRecommendations(rpe: number): {
  rir: number;
  trainingZone: string;
  recommendations: string[];
  volumeGuidance: string;
} {
  const rir = convertRPEtoRIR(rpe);
  
  if (rpe >= 9) {
    return {
      rir,
      trainingZone: "Strength/Peaking",
      recommendations: [
        "Use for strength testing or peaking phases",
        "Limit frequency to avoid excessive fatigue",
        "Ensure adequate rest between sets"
      ],
      volumeGuidance: "Low volume, high intensity"
    };
  } else if (rpe >= 7) {
    return {
      rir,
      trainingZone: "Hypertrophy/Strength",
      recommendations: [
        "Optimal range for muscle growth and strength gains",
        "Can be used frequently in training",
        "Good for autoregulated volume progression"
      ],
      volumeGuidance: "Moderate to high volume"
    };
  } else {
    return {
      rir,
      trainingZone: "Technique/Recovery",
      recommendations: [
        "Use for warm-ups and technique practice",
        "Good for deload weeks",
        "Active recovery and movement quality"
      ],
      volumeGuidance: "High volume, low intensity"
    };
  }
}

/**
 * Validate RPE/RIR accuracy based on rep range
 * Different rep ranges have different accuracy levels for RPE/RIR estimation
 * @param reps Number of reps performed
 * @param rpe Reported RPE
 * @returns Confidence level and accuracy notes
 */
export function validateRPEAccuracy(reps: number, rpe: number): {
  confidenceLevel: number; // 0-1 scale
  accuracyNotes: string[];
  isReliable: boolean;
} {
  let confidenceLevel = 0.8; // Base confidence
  const accuracyNotes: string[] = [];
  
  // Rep range affects RPE accuracy (based on scientific literature)
  if (reps <= 5) {
    confidenceLevel = 0.9;
    accuracyNotes.push("High accuracy range for RPE estimation");
  } else if (reps <= 12) {
    confidenceLevel = 0.8;
    accuracyNotes.push("Good accuracy range for RPE estimation");
  } else if (reps <= 20) {
    confidenceLevel = 0.6;
    accuracyNotes.push("Moderate accuracy - higher rep ranges less reliable");
  } else {
    confidenceLevel = 0.4;
    accuracyNotes.push("Lower accuracy - very high rep ranges unreliable for RPE");
  }

  // RPE range validation
  if (rpe < 6) {
    confidenceLevel *= 0.7;
    accuracyNotes.push("Low RPE values may be less accurate");
  } else if (rpe > 9.5) {
    accuracyNotes.push("Very high RPE - ensure true effort assessment");
  }

  return {
    confidenceLevel,
    accuracyNotes,
    isReliable: confidenceLevel >= 0.6
  };
}

/**
 * Renaissance Periodization specific RPE/RIR guidelines
 * Based on Dr. Mike Israetel's methodology
 */
export const RP_TRAINING_GUIDELINES = {
  // Optimal RPE ranges for different training goals
  STRENGTH_TRAINING: {
    minRPE: 8,
    maxRPE: 10,
    description: "Heavy strength work, low volume"
  },
  HYPERTROPHY_TRAINING: {
    minRPE: 7,
    maxRPE: 9,
    description: "Optimal for muscle growth, moderate to high volume"
  },
  VOLUME_TRAINING: {
    minRPE: 6,
    maxRPE: 8,
    description: "Volume accumulation, technique refinement"
  },
  DELOAD_RECOVERY: {
    minRPE: 5,
    maxRPE: 7,
    description: "Active recovery, movement quality"
  },
  
  // Volume landmarks progression (RP methodology)
  WEEKLY_RPE_PROGRESSION: [
    { week: 1, targetRPE: 7, description: "MEV - Minimum Effective Volume" },
    { week: 2, targetRPE: 7.5, description: "Progressive overload" },
    { week: 3, targetRPE: 8, description: "Increasing intensity" },
    { week: 4, targetRPE: 8.5, description: "Approaching MAV" },
    { week: 5, targetRPE: 9, description: "MAV - Maximum Adaptive Volume" },
    { week: 6, targetRPE: 5, description: "Deload week" }
  ]
};