// Comprehensive muscle group mapping for exercise consistency

export const MUSCLE_GROUPS = {
  // Primary muscle groups matching database
  CHEST: 'chest',
  FRONT_DELTS: 'front_delts',
  SIDE_DELTS: 'side_delts', 
  REAR_DELTS: 'rear_delts',
  TRICEPS: 'triceps',
  LATS: 'lats',
  RHOMBOIDS: 'rhomboids',
  BICEPS: 'biceps',
  QUADS: 'quads',
  HAMSTRINGS: 'hamstrings',
  GLUTES: 'glutes',
  CALVES: 'calves',
  CORE: 'core',
  TRAPS: 'traps',
  FOREARMS: 'forearms'
} as const;

export const ALL_MUSCLE_GROUPS = [
  MUSCLE_GROUPS.CHEST,
  MUSCLE_GROUPS.FRONT_DELTS,
  MUSCLE_GROUPS.SIDE_DELTS,
  MUSCLE_GROUPS.REAR_DELTS,
  MUSCLE_GROUPS.TRICEPS,
  MUSCLE_GROUPS.LATS,
  MUSCLE_GROUPS.RHOMBOIDS,
  MUSCLE_GROUPS.BICEPS,
  MUSCLE_GROUPS.QUADS,
  MUSCLE_GROUPS.HAMSTRINGS,
  MUSCLE_GROUPS.GLUTES,
  MUSCLE_GROUPS.CALVES,
  MUSCLE_GROUPS.CORE,
  MUSCLE_GROUPS.TRAPS,
  MUSCLE_GROUPS.FOREARMS
];

// User-friendly display names for muscle groups
export const MUSCLE_GROUP_DISPLAY_NAMES = {
  [MUSCLE_GROUPS.CHEST]: 'Chest',
  [MUSCLE_GROUPS.FRONT_DELTS]: 'Front Delts',
  [MUSCLE_GROUPS.SIDE_DELTS]: 'Side Delts',
  [MUSCLE_GROUPS.REAR_DELTS]: 'Rear Delts',
  [MUSCLE_GROUPS.TRICEPS]: 'Triceps',
  [MUSCLE_GROUPS.LATS]: 'Lats',
  [MUSCLE_GROUPS.RHOMBOIDS]: 'Rhomboids',
  [MUSCLE_GROUPS.BICEPS]: 'Biceps',
  [MUSCLE_GROUPS.QUADS]: 'Quads',
  [MUSCLE_GROUPS.HAMSTRINGS]: 'Hamstrings',
  [MUSCLE_GROUPS.GLUTES]: 'Glutes',
  [MUSCLE_GROUPS.CALVES]: 'Calves',
  [MUSCLE_GROUPS.CORE]: 'Core',
  [MUSCLE_GROUPS.TRAPS]: 'Traps',
  [MUSCLE_GROUPS.FOREARMS]: 'Forearms'
};

export type MuscleGroup = typeof MUSCLE_GROUPS[keyof typeof MUSCLE_GROUPS];

// Mapping for exercise categories to muscle groups
export const CATEGORY_MUSCLE_MAP = {
  push: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.FRONT_DELTS, MUSCLE_GROUPS.SIDE_DELTS, MUSCLE_GROUPS.TRICEPS],
  pull: [MUSCLE_GROUPS.LATS, MUSCLE_GROUPS.RHOMBOIDS, MUSCLE_GROUPS.REAR_DELTS, MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.TRAPS],
  legs: [MUSCLE_GROUPS.QUADS, MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES, MUSCLE_GROUPS.CALVES],
  core: [MUSCLE_GROUPS.CORE],
  cardio: []
} as const;

// Exercise muscle group validation
export function validateMuscleGroups(muscleGroups: string[]): boolean {
  return muscleGroups.every(mg => ALL_MUSCLE_GROUPS.includes(mg as MuscleGroup));
}

// Get muscle groups for category
export function getMuscleGroupsForCategory(category: string): string[] {
  return CATEGORY_MUSCLE_MAP[category as keyof typeof CATEGORY_MUSCLE_MAP] || [];
}