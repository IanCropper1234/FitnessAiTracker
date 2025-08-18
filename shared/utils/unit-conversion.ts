// Unit conversion utilities for weight and measurements
export interface WeightData {
  value: number;
  unit: 'kg' | 'lbs' | 'metric' | 'imperial';
}

export interface ConvertedWeight {
  kg: number;
  lbs: number;
  originalValue: number;
  originalUnit: string;
  displayValue: number;
  displayUnit: string;
}

export class UnitConverter {
  // Weight conversion constants
  static readonly KG_TO_LBS = 2.20462262185;
  static readonly LBS_TO_KG = 0.45359237;

  /**
   * Convert weight to both kg and lbs, preserving original values
   */
  static convertWeight(weight: number, unit: string): ConvertedWeight {
    let kg: number;
    let lbs: number;
    let displayUnit: string;
    let displayValue: number;

    // Normalize unit formats
    const normalizedUnit = this.normalizeWeightUnit(unit);

    if (normalizedUnit === 'kg') {
      kg = weight;
      lbs = weight * this.KG_TO_LBS;
      displayUnit = 'kg';
      displayValue = weight;
    } else {
      // Assume lbs for imperial/lbs
      lbs = weight;
      kg = weight * this.LBS_TO_KG;
      displayUnit = 'lbs';
      displayValue = weight;
    }

    return {
      kg: Math.round(kg * 100) / 100, // Round to 2 decimal places
      lbs: Math.round(lbs * 100) / 100,
      originalValue: weight,
      originalUnit: unit,
      displayValue: Math.round(displayValue * 100) / 100,
      displayUnit
    };
  }

  /**
   * Convert weight change between units
   */
  static convertWeightChange(change: number, fromUnit: string, toUnit: string): number {
    const normalizedFrom = this.normalizeWeightUnit(fromUnit);
    const normalizedTo = this.normalizeWeightUnit(toUnit);

    if (normalizedFrom === normalizedTo) {
      return change;
    }

    if (normalizedFrom === 'kg' && normalizedTo === 'lbs') {
      return change * this.KG_TO_LBS;
    }

    if (normalizedFrom === 'lbs' && normalizedTo === 'kg') {
      return change * this.LBS_TO_KG;
    }

    return change;
  }

  /**
   * Get user's preferred weight unit from various sources
   * Since database now stores all weights in metric, we prioritize user profile preference
   */
  static getUserWeightUnit(userProfile?: any, bodyMetrics?: any[]): 'kg' | 'lbs' {
    // Priority: User profile weight_unit > legacy body metric unit > default to kg
    
    // Check user profile first (primary source after database standardization)
    if (userProfile?.user?.weightUnit) {
      if (userProfile.user.weightUnit === 'imperial') return 'lbs';
      if (userProfile.user.weightUnit === 'metric') return 'kg';
    }
    
    // Fallback: Check latest body metric for legacy preference
    if (bodyMetrics && bodyMetrics.length > 0) {
      const latestMetric = bodyMetrics[0];
      if (latestMetric.unit === 'imperial') return 'lbs';
      if (latestMetric.unit === 'metric') return 'kg';
    }

    // Default to kg if no preference found
    return 'kg';
  }



  /**
   * Normalize different unit representations
   */
  static normalizeWeightUnit(unit: string): 'kg' | 'lbs' {
    if (!unit) return 'kg';
    
    const normalized = unit.toLowerCase().trim();
    
    if (normalized === 'imperial' || normalized === 'lbs' || normalized === 'pounds') {
      return 'lbs';
    }
    
    return 'kg'; // Default to kg for metric/kg/any other value
  }

  /**
   * Format weight with proper unit display
   */
  static formatWeight(weight: number, unit: string, precision: number = 1): string {
    const normalizedUnit = this.normalizeWeightUnit(unit);
    return `${weight.toFixed(precision)}${normalizedUnit}`;
  }

  /**
   * Convert weights in weekly goals data with proper unit handling
   */
  static convertWeeklyGoalsUnits(weeklyGoals: any, preferredUnit: 'kg' | 'lbs'): any {
    if (!weeklyGoals || weeklyGoals.length === 0) return weeklyGoals;

    return weeklyGoals.map((goal: any) => {
      const converted = { ...goal };

      // Convert current weight
      if (goal.currentWeight) {
        const currentConverted = this.convertWeight(parseFloat(goal.currentWeight), goal.weightUnit || 'kg');
        converted.currentWeight = preferredUnit === 'kg' ? currentConverted.kg : currentConverted.lbs;
        converted.currentWeightDisplay = this.formatWeight(converted.currentWeight, preferredUnit);
      }

      // Convert previous weight
      if (goal.previousWeight) {
        const previousConverted = this.convertWeight(parseFloat(goal.previousWeight), goal.weightUnit || 'kg');
        converted.previousWeight = preferredUnit === 'kg' ? previousConverted.kg : previousConverted.lbs;
        converted.previousWeightDisplay = this.formatWeight(converted.previousWeight, preferredUnit);
      }

      // Convert weight change
      if (goal.weightChange) {
        const originalUnit = goal.weightUnit || 'kg';
        const changeValue = parseFloat(goal.weightChange);
        converted.weightChange = this.convertWeightChange(changeValue, originalUnit, preferredUnit);
        converted.weightChangeDisplay = this.formatWeight(converted.weightChange, preferredUnit);
      }

      // Convert target weight change
      if (goal.targetWeightChangePerWeek) {
        const originalUnit = goal.weightUnit || 'kg';
        const targetValue = parseFloat(goal.targetWeightChangePerWeek);
        converted.targetWeightChangePerWeek = this.convertWeightChange(targetValue, originalUnit, preferredUnit);
        converted.targetWeightChangeDisplay = this.formatWeight(converted.targetWeightChangePerWeek, preferredUnit);
      }

      // Set display unit for the frontend
      converted.displayUnit = preferredUnit;

      return converted;
    });
  }
}