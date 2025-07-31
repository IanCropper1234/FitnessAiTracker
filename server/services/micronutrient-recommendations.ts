// Micronutrient Recommendations Service
// Based on USDA Dietary Guidelines and scientific literature for optimal health

interface UserData {
  age?: number;
  gender?: 'male' | 'female';
  weight?: number; // in kg
  height?: number; // in cm
  activityLevel?: string;
  isPregnant?: boolean;
  isLactating?: boolean;
}

interface MicronutrientRDA {
  vitaminA: number; // μg RAE
  vitaminD: number; // μg
  vitaminE: number; // mg
  vitaminK: number; // μg
  vitaminC: number; // mg
  vitaminB1: number; // mg (Thiamine)
  vitaminB2: number; // mg (Riboflavin)
  vitaminB3: number; // mg (Niacin)
  vitaminB6: number; // mg (Pyridoxine)
  vitaminB12: number; // μg (Cobalamin)
  folate: number; // μg
  biotin: number; // μg
  pantothenicAcid: number; // mg
  choline: number; // mg
  calcium: number; // mg
  magnesium: number; // mg
  phosphorus: number; // mg
  potassium: number; // mg
  sodium: number; // mg (upper limit)
  iron: number; // mg
  zinc: number; // mg
  selenium: number; // μg
  copper: number; // mg
  manganese: number; // mg
  iodine: number; // μg
  chromium: number; // μg
  molybdenum: number; // μg
}

export class MicronutrientRecommendationService {
  static calculateRDA(userData: UserData): MicronutrientRDA {
    const age = userData.age || 30;
    const gender = userData.gender || 'male';
    const weight = userData.weight || 70;
    const activityLevel = userData.activityLevel || 'moderately_active';
    
    // Base RDA values for healthy adults (age 19-50)
    let rda: MicronutrientRDA = {
      // Fat-Soluble Vitamins
      vitaminA: gender === 'male' ? 900 : 700, // μg RAE
      vitaminD: age > 70 ? 20 : 15, // μg
      vitaminE: 15, // mg
      vitaminK: gender === 'male' ? 120 : 90, // μg
      
      // Water-Soluble Vitamins
      vitaminC: gender === 'male' ? 90 : 75, // mg
      vitaminB1: gender === 'male' ? 1.2 : 1.1, // mg
      vitaminB2: gender === 'male' ? 1.3 : 1.1, // mg
      vitaminB3: gender === 'male' ? 16 : 14, // mg
      vitaminB6: age > 50 ? (gender === 'male' ? 1.7 : 1.5) : 1.3, // mg
      vitaminB12: 2.4, // μg
      folate: 400, // μg
      biotin: 30, // μg
      pantothenicAcid: 5, // mg
      choline: gender === 'male' ? 550 : 425, // mg
      
      // Major Minerals
      calcium: age > 50 ? 1200 : 1000, // mg
      magnesium: gender === 'male' ? 
        (age <= 30 ? 400 : 420) : 
        (age <= 30 ? 310 : 320), // mg
      phosphorus: 700, // mg
      potassium: 3500, // mg (AI - Adequate Intake)
      sodium: 2300, // mg (upper limit)
      
      // Trace Minerals
      iron: gender === 'female' && age <= 50 ? 18 : 8, // mg
      zinc: gender === 'male' ? 11 : 8, // mg
      selenium: 55, // μg
      copper: 0.9, // mg
      manganese: gender === 'male' ? 2.3 : 1.8, // mg
      iodine: 150, // μg
      chromium: gender === 'male' ? 35 : 25, // μg
      molybdenum: 45, // μg
    };
    
    // Activity level adjustments for athletes and highly active individuals
    if (activityLevel === 'very_active' || activityLevel === 'extremely_active') {
      // Increase B-vitamins for energy metabolism
      rda.vitaminB1 *= 1.2;
      rda.vitaminB2 *= 1.2;
      rda.vitaminB3 *= 1.1;
      rda.vitaminB6 *= 1.1;
      
      // Increase antioxidants for exercise stress
      rda.vitaminC *= 1.3;
      rda.vitaminE *= 1.2;
      
      // Increase minerals for sweat loss
      rda.magnesium *= 1.15;
      rda.zinc *= 1.1;
      rda.iron *= 1.1;
      rda.potassium *= 1.2;
    }
    
    // Age-specific adjustments
    if (age > 65) {
      rda.vitaminD = 20; // Higher for older adults
      rda.vitaminB12 *= 1.5; // Higher absorption needs
      rda.calcium = 1200; // Bone health
    }
    
    // Weight-based adjustments for larger individuals
    if (weight > 90) {
      const weightFactor = Math.min(weight / 70, 1.3); // Cap at 30% increase
      rda.magnesium *= weightFactor;
      rda.potassium *= weightFactor;
      rda.choline *= weightFactor;
    }
    
    return rda;
  }
  
  static calculateAdequacyPercentage(actual: number, recommended: number): number {
    if (!actual || !recommended) return 0;
    return Math.round((actual / recommended) * 100);
  }
  
  static getAdequacyStatus(percentage: number): {
    status: 'deficient' | 'low' | 'adequate' | 'high' | 'excessive';
    color: string;
    description: string;
  } {
    if (percentage < 50) {
      return {
        status: 'deficient',
        color: 'text-red-600 dark:text-red-400',
        description: 'Significantly below recommended'
      };
    } else if (percentage < 80) {
      return {
        status: 'low',
        color: 'text-orange-600 dark:text-orange-400',
        description: 'Below recommended'
      };
    } else if (percentage <= 120) {
      return {
        status: 'adequate',
        color: 'text-green-600 dark:text-green-400',
        description: 'Meets recommendations'
      };
    } else if (percentage <= 200) {
      return {
        status: 'high',
        color: 'text-blue-600 dark:text-blue-400',
        description: 'Above recommended'
      };
    } else {
      return {
        status: 'excessive',
        color: 'text-purple-600 dark:text-purple-400',
        description: 'Significantly above recommended'
      };
    }
  }
}