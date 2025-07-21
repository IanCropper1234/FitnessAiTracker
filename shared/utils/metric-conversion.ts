/**
 * Metric Conversion Utilities for FitAI
 * Handles conversion between KG/LBS for weight and CM/INCHES for measurements
 */

export type WeightUnit = 'kg' | 'lbs';
export type MeasurementUnit = 'metric' | 'imperial';

// Conversion constants
const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;

/**
 * Convert weight between KG and LBS
 */
export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round((value * KG_TO_LBS) * 10) / 10; // Round to 1 decimal
  }
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round((value / KG_TO_LBS) * 10) / 10; // Round to 1 decimal
  }
  
  return value;
}

/**
 * Convert measurement between CM and INCHES
 */
export function convertMeasurement(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    return Math.round((value * CM_TO_INCHES) * 10) / 10; // Round to 1 decimal
  }
  
  if (fromUnit === 'imperial' && toUnit === 'metric') {
    return Math.round((value / CM_TO_INCHES) * 10) / 10; // Round to 1 decimal
  }
  
  return value;
}

/**
 * Get appropriate weight increment for load progression based on unit
 */
export function getWeightIncrement(
  exerciseName: string, 
  currentWeight: number, 
  unit: WeightUnit = 'kg'
): number {
  const lowerName = exerciseName.toLowerCase();
  
  // Base increments in KG
  let incrementKg: number;
  
  // Compound movements - larger increments
  if (lowerName.includes('squat') || lowerName.includes('deadlift')) {
    incrementKg = currentWeight > 100 ? 5 : 2.5;
  } else if (lowerName.includes('bench') || lowerName.includes('press') || lowerName.includes('row')) {
    incrementKg = currentWeight > 60 ? 2.5 : 1.25;
  } else if (lowerName.includes('curl') || lowerName.includes('extension') || lowerName.includes('raise')) {
    // Isolation movements - smaller increments
    incrementKg = currentWeight > 20 ? 1.25 : 0.625;
  } else {
    // Default progression
    incrementKg = currentWeight > 40 ? 2.5 : 1.25;
  }
  
  // Convert to target unit if needed
  if (unit === 'lbs') {
    return convertWeight(incrementKg, 'kg', 'lbs');
  }
  
  return incrementKg;
}

/**
 * Format weight with unit for display
 */
export function formatWeight(value: number, unit: WeightUnit): string {
  return `${value}${unit}`;
}

/**
 * Format measurement with unit for display
 */
export function formatMeasurement(value: number, unit: MeasurementUnit): string {
  const unitLabel = unit === 'metric' ? 'cm' : 'in';
  return `${value}${unitLabel}`;
}

/**
 * Get user's preferred weight unit from body metrics or default to kg
 */
export function getUserWeightUnit(bodyMetrics?: any[]): WeightUnit {
  if (bodyMetrics && bodyMetrics.length > 0) {
    const latestMetric = bodyMetrics[bodyMetrics.length - 1];
    return latestMetric.unit === 'imperial' ? 'lbs' : 'kg';
  }
  return 'kg'; // Default to metric
}

/**
 * Convert weight value for display in user's preferred unit
 */
export function displayWeight(
  value: number, 
  storedUnit: WeightUnit, 
  displayUnit: WeightUnit
): number {
  return convertWeight(value, storedUnit, displayUnit);
}

/**
 * Validate weight increment is appropriate for the given unit
 */
export function validateWeightIncrement(increment: number, unit: WeightUnit): boolean {
  if (unit === 'kg') {
    // KG increments should be multiples of 0.25kg (common plate sizes)
    return (increment * 4) % 1 === 0;
  } else {
    // LBS increments should be multiples of 0.5lbs or 1lbs
    return (increment * 2) % 1 === 0;
  }
}