import { trainingTemplates } from "@shared/schema";

/**
 * Comprehensive Renaissance Periodization Training Templates
 * Following RP methodology with proper volume landmarks and progression
 */

export const rpTrainingTemplates: Omit<typeof trainingTemplates.$inferInsert, 'id' | 'createdAt'>[] = [
  // BEGINNER PROGRAMS (4 templates)
  {
    name: "Full Body (Beginner)",
    description: "3-day full body routine focusing on fundamentals and movement quality",
    category: "beginner",
    daysPerWeek: 3,
    specialization: "full_body",
    templateData: {
      name: "Full Body (Beginner)",
      description: "Foundation building with compound movements",
      category: "beginner",
      daysPerWeek: 3,
      workouts: [
        {
          name: "Full Body A",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 3, repsRange: "5-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 2, repsRange: "10-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["full_body", "strength", "coordination"]
        },
        {
          name: "Full Body B",
          exercises: [
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 2, repsRange: "10-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 55,
          focus: ["full_body", "hypertrophy", "balance"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 6, mav: 12, mrv: 18 },
        lats: { mev: 8, mav: 14, mrv: 20 },
        shoulders: { mev: 6, mav: 12, mrv: 18 },
        biceps: { mev: 4, mav: 10, mrv: 16 },
        triceps: { mev: 4, mav: 10, mrv: 16 },
        quads: { mev: 6, mav: 12, mrv: 18 },
        hamstrings: { mev: 4, mav: 10, mrv: 16 },
        glutes: { mev: 4, mav: 10, mrv: 16 }
      },
      progressionRules: [
        "Master movement patterns before adding weight",
        "Progress load by 2.5-5kg when hitting top of rep range",
        "Focus on consistent training frequency",
        "Autoregulate based on daily readiness"
      ],
      deloadGuidelines: [
        "Reduce volume to 60% of MEV",
        "Practice movement quality",
        "Add mobility work"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Push/Pull/Legs (Beginner)",
    description: "3-day split focusing on movement patterns with moderate volume",
    category: "beginner",
    daysPerWeek: 3,
    specialization: "full_body",
    templateData: {
      name: "Push/Pull/Legs (Beginner)",
      description: "Movement-based split for skill development",
      category: "beginner",
      daysPerWeek: 3,
      workouts: [
        {
          name: "Push Day",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 50,
          focus: ["chest", "shoulders", "triceps"]
        },
        {
          name: "Pull Day",
          exercises: [
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 3, repsRange: "5-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 50,
          focus: ["lats", "rhomboids", "biceps"]
        },
        {
          name: "Leg Day",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 55,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 8, mav: 16, mrv: 22 },
        lats: { mev: 10, mav: 18, mrv: 25 },
        shoulders: { mev: 8, mav: 16, mrv: 22 },
        biceps: { mev: 6, mav: 14, mrv: 20 },
        triceps: { mev: 6, mav: 14, mrv: 20 },
        quads: { mev: 8, mav: 16, mrv: 22 },
        hamstrings: { mev: 6, mav: 12, mrv: 18 },
        glutes: { mev: 6, mav: 12, mrv: 18 },
        calves: { mev: 8, mav: 16, mrv: 22 }
      },
      progressionRules: [
        "Start at MEV for first 2 weeks",
        "Add 1-2 sets per muscle group weekly",
        "Deload when approaching MRV",
        "Focus on compound movements first"
      ],
      deloadGuidelines: [
        "Reduce volume to 50-60% of MEV",
        "Maintain movement patterns",
        "Focus on form and mobility"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Upper/Lower (Beginner)",
    description: "4-day beginner split with moderate frequency and volume",
    category: "beginner",
    daysPerWeek: 4,
    specialization: "full_body",
    templateData: {
      name: "Upper/Lower (Beginner)",
      description: "Higher frequency training for faster adaptation",
      category: "beginner",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Upper Body A",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 2, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 2, repsRange: "10-15", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 50,
          focus: ["chest", "lats", "shoulders", "arms"]
        },
        {
          name: "Lower Body A",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 3, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 45,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        },
        {
          name: "Upper Body B",
          exercises: [
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 3, repsRange: "5-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 2, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 2, repsRange: "8-15", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 50,
          focus: ["chest", "lats", "shoulders", "arms"]
        },
        {
          name: "Lower Body B",
          exercises: [
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1018, exerciseName: "Stiff Leg Deadlifts", muscleGroups: ["hamstrings"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1019, exerciseName: "Hip Thrusts", muscleGroups: ["glutes"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1020, exerciseName: "Seated Calf Raises", muscleGroups: ["calves"], sets: 3, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 45,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 8, mav: 16, mrv: 22 },
        lats: { mev: 10, mav: 18, mrv: 25 },
        shoulders: { mev: 8, mav: 16, mrv: 22 },
        biceps: { mev: 6, mav: 14, mrv: 20 },
        triceps: { mev: 6, mav: 14, mrv: 20 },
        quads: { mev: 8, mav: 16, mrv: 22 },
        hamstrings: { mev: 6, mav: 12, mrv: 18 },
        glutes: { mev: 6, mav: 12, mrv: 18 },
        calves: { mev: 8, mav: 16, mrv: 22 }
      },
      progressionRules: [
        "Higher frequency allows faster skill development",
        "Alternate exercise variations between sessions",
        "Progress weekly when hitting rep targets",
        "Monitor recovery between sessions"
      ],
      deloadGuidelines: [
        "Reduce volume to 50% of MEV",
        "Maintain frequency but reduce intensity",
        "Focus on movement quality"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Starter Strength (Beginner)",
    description: "3-day strength-focused program emphasizing basic barbell movements",
    category: "beginner",
    daysPerWeek: 3,
    specialization: "strength",
    templateData: {
      name: "Starter Strength (Beginner)",
      description: "Foundation strength building with progressive overload",
      category: "beginner",
      daysPerWeek: 3,
      workouts: [
        {
          name: "Workout A",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "5-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "5-8", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "5-8", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 4 }
          ],
          estimatedDuration: 45,
          focus: ["strength", "coordination", "power"]
        },
        {
          name: "Workout B",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 1, repsRange: "5", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 3, repsRange: "5-8", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 3, repsRange: "3-8", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1022, exerciseName: "Planks", muscleGroups: ["core"], sets: 3, repsRange: "30-60s", restPeriod: 90, orderIndex: 4 }
          ],
          estimatedDuration: 40,
          focus: ["strength", "power", "stability"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 6, mav: 12, mrv: 16 },
        lats: { mev: 8, mav: 14, mrv: 18 },
        shoulders: { mev: 6, mav: 12, mrv: 16 },
        quads: { mev: 6, mav: 12, mrv: 16 },
        hamstrings: { mev: 4, mav: 8, mrv: 12 },
        glutes: { mev: 4, mav: 8, mrv: 12 }
      },
      progressionRules: [
        "Add 2.5-5kg to squat/deadlift weekly",
        "Add 1.25-2.5kg to bench/press weekly",
        "Focus on consistent form before load",
        "Deload at 90% of previous best"
      ],
      deloadGuidelines: [
        "Reduce load to 80% of working weight",
        "Maintain rep ranges and rest periods",
        "Focus on explosive concentric movement"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  // INTERMEDIATE PROGRAMS (8 templates)
  {
    name: "Upper/Lower Split (Intermediate)",
    description: "4-day split with higher frequency and volume progression",
    category: "intermediate",
    daysPerWeek: 4,
    specialization: "full_body",
    templateData: {
      name: "Upper/Lower Split (Intermediate)",
      description: "Enhanced frequency for intermediate trainees",
      category: "intermediate",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Upper Body A",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 70,
          focus: ["chest", "lats", "shoulders", "arms"]
        },
        {
          name: "Lower Body A",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 65,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        },
        {
          name: "Upper Body B",
          exercises: [
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 70,
          focus: ["chest", "lats", "shoulders", "arms"]
        },
        {
          name: "Lower Body B",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "5-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1019, exerciseName: "Hip Thrusts", muscleGroups: ["glutes"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1020, exerciseName: "Seated Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 65,
          focus: ["hamstrings", "quads", "glutes", "calves"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 10, mav: 18, mrv: 25 },
        lats: { mev: 12, mav: 20, mrv: 28 },
        shoulders: { mev: 10, mav: 18, mrv: 25 },
        biceps: { mev: 8, mav: 16, mrv: 22 },
        triceps: { mev: 8, mav: 16, mrv: 22 },
        quads: { mev: 10, mav: 18, mrv: 25 },
        hamstrings: { mev: 8, mav: 14, mrv: 20 },
        glutes: { mev: 8, mav: 14, mrv: 20 },
        calves: { mev: 10, mav: 18, mrv: 25 }
      },
      progressionRules: [
        "Progressive overload each week",
        "Vary rep ranges for different adaptations",
        "Monitor fatigue accumulation closely",
        "Implement autoregulation based on feedback"
      ],
      deloadGuidelines: [
        "Reduce volume to 40-50% of peak",
        "Maintain intensity but reduce total sets",
        "Add mobility and recovery work"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  // INTERMEDIATE PROGRAMS CONTINUED (4 more templates)
  {
    name: "Push/Pull/Legs (Intermediate)",
    description: "6-day split with high frequency and volume for experienced trainees",
    category: "intermediate",
    daysPerWeek: 6,
    specialization: "full_body",
    templateData: {
      name: "Push/Pull/Legs (Intermediate)",
      description: "High frequency split for rapid progress",
      category: "intermediate",
      daysPerWeek: 6,
      workouts: [
        {
          name: "Push Day A",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 70,
          focus: ["chest", "shoulders", "triceps"]
        },
        {
          name: "Pull Day A",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "5-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 75,
          focus: ["lats", "rhomboids", "biceps"]
        },
        {
          name: "Leg Day A",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 4, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1019, exerciseName: "Hip Thrusts", muscleGroups: ["glutes"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "15-25", restPeriod: 60, orderIndex: 6 }
          ],
          estimatedDuration: 75,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 12, mav: 20, mrv: 28 },
        lats: { mev: 14, mav: 22, mrv: 32 },
        shoulders: { mev: 12, mav: 20, mrv: 28 },
        biceps: { mev: 10, mav: 18, mrv: 26 },
        triceps: { mev: 10, mav: 18, mrv: 26 },
        quads: { mev: 12, mav: 20, mrv: 28 },
        hamstrings: { mev: 10, mav: 16, mrv: 24 },
        glutes: { mev: 10, mav: 16, mrv: 24 },
        calves: { mev: 12, mav: 20, mrv: 28 }
      },
      progressionRules: [
        "High frequency allows for rapid adaptations",
        "Alternate heavy and light sessions",
        "Monitor recovery between sessions carefully",
        "Use autoregulation to manage fatigue"
      ],
      deloadGuidelines: [
        "Reduce volume to 40% of peak",
        "Maintain movement quality",
        "Consider reducing frequency temporarily"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Body Part Split (Intermediate)",
    description: "5-day body part focused split for muscle specialization",
    category: "intermediate",
    daysPerWeek: 5,
    specialization: "bodybuilding",
    templateData: {
      name: "Body Part Split (Intermediate)",
      description: "Classic bodybuilding split with focused sessions",
      category: "intermediate",
      daysPerWeek: 5,
      workouts: [
        {
          name: "Chest Day",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 1024, exerciseName: "Decline Bench Press", muscleGroups: ["chest"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1025, exerciseName: "Chest Flyes", muscleGroups: ["chest"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1026, exerciseName: "Cable Crossovers", muscleGroups: ["chest"], sets: 3, repsRange: "15-20", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["chest"]
        },
        {
          name: "Back Day",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "5-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 4, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 75,
          focus: ["lats", "rhomboids"]
        },
        {
          name: "Shoulders Day",
          exercises: [
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 5, repsRange: "12-15", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 1027, exerciseName: "Rear Delt Flyes", muscleGroups: ["shoulders"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1028, exerciseName: "Arnold Press", muscleGroups: ["shoulders"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 1029, exerciseName: "Face Pulls", muscleGroups: ["shoulders"], sets: 4, repsRange: "15-20", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 55,
          focus: ["shoulders"]
        },
        {
          name: "Arms Day",
          exercises: [
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "8-12", restPeriod: 90, orderIndex: 1 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 4, repsRange: "8-12", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1030, exerciseName: "Preacher Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 5 },
            { exerciseId: 1031, exerciseName: "Overhead Tricep Extension", muscleGroups: ["triceps"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 60,
          focus: ["biceps", "triceps"]
        },
        {
          name: "Legs Day",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 5, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 4, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "15-25", restPeriod: 60, orderIndex: 6 }
          ],
          estimatedDuration: 80,
          focus: ["quads", "hamstrings", "glutes", "calves"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 12, mav: 20, mrv: 28 },
        lats: { mev: 14, mav: 22, mrv: 32 },
        shoulders: { mev: 12, mav: 20, mrv: 28 },
        biceps: { mev: 10, mav: 18, mrv: 26 },
        triceps: { mev: 10, mav: 18, mrv: 26 },
        quads: { mev: 12, mav: 20, mrv: 28 },
        hamstrings: { mev: 10, mav: 16, mrv: 24 },
        glutes: { mev: 10, mav: 16, mrv: 24 },
        calves: { mev: 12, mav: 20, mrv: 28 }
      },
      progressionRules: [
        "Focus on one muscle group per session",
        "Allow full recovery between body parts",
        "Progressive overload with volume and intensity",
        "Monitor pump and muscle responsiveness"
      ],
      deloadGuidelines: [
        "Reduce sets by 50% for each muscle group",
        "Maintain exercise selection",
        "Focus on mind-muscle connection"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Power Building (Intermediate)",
    description: "4-day program combining powerlifting and bodybuilding methods",
    category: "intermediate",
    daysPerWeek: 4,
    specialization: "powerbuilding",
    templateData: {
      name: "Power Building (Intermediate)",
      description: "Strength and size development combined",
      category: "intermediate",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Squat Focus",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 5, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 4, repsRange: "15-25", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 75,
          focus: ["strength", "leg_mass", "power"]
        },
        {
          name: "Bench Focus",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 5, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1025, exerciseName: "Chest Flyes", muscleGroups: ["chest"], sets: 3, repsRange: "15-20", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 70,
          focus: ["strength", "chest_mass", "power"]
        },
        {
          name: "Deadlift Focus",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 5, repsRange: "3-6", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 4, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1018, exerciseName: "Stiff Leg Deadlifts", muscleGroups: ["hamstrings"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 75,
          focus: ["strength", "back_mass", "power"]
        },
        {
          name: "OHP Focus",
          exercises: [
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 5, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1024, exerciseName: "Decline Bench Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1027, exerciseName: "Rear Delt Flyes", muscleGroups: ["shoulders"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 70,
          focus: ["strength", "shoulder_mass", "power"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 10, mav: 16, mrv: 22 },
        lats: { mev: 12, mav: 18, mrv: 24 },
        shoulders: { mev: 10, mav: 16, mrv: 22 },
        biceps: { mev: 8, mav: 14, mrv: 18 },
        triceps: { mev: 8, mav: 14, mrv: 18 },
        quads: { mev: 10, mav: 16, mrv: 22 },
        hamstrings: { mev: 8, mav: 12, mrv: 16 },
        glutes: { mev: 8, mav: 12, mrv: 16 },
        calves: { mev: 8, mav: 14, mrv: 18 }
      },
      progressionRules: [
        "Focus on strength progression in main lifts",
        "Use accessory work for hypertrophy",
        "Monitor both strength and size metrics",
        "Periodize between strength and size phases"
      ],
      deloadGuidelines: [
        "Reduce intensity on main lifts to 75%",
        "Maintain accessory volume",
        "Focus on technique refinement"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Functional Strength (Intermediate)",
    description: "4-day program emphasizing movement quality and athletic performance",
    category: "intermediate",
    daysPerWeek: 4,
    specialization: "functional",
    templateData: {
      name: "Functional Strength (Intermediate)",
      description: "Athletic performance and movement quality focus",
      category: "intermediate",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Lower Power",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "5-8", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1037, exerciseName: "Box Jumps", muscleGroups: ["quads", "glutes", "calves"], sets: 4, repsRange: "5-8", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1038, exerciseName: "Single Leg RDL", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1039, exerciseName: "Lateral Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "10-15", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["power", "stability", "coordination"]
        },
        {
          name: "Upper Power",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "5-8", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1040, exerciseName: "Medicine Ball Slams", muscleGroups: ["chest", "shoulders", "core"], sets: 4, repsRange: "8-12", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "6-10", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1041, exerciseName: "Push-up Variations", muscleGroups: ["chest", "triceps"], sets: 3, repsRange: "10-20", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1042, exerciseName: "Band Pull-aparts", muscleGroups: ["shoulders"], sets: 3, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
          ],
          estimatedDuration: 55,
          focus: ["power", "endurance", "stability"]
        },
        {
          name: "Functional Strength",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "5-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1043, exerciseName: "Turkish Get-ups", muscleGroups: ["core", "shoulders"], sets: 3, repsRange: "3-5", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 1044, exerciseName: "Farmer's Walks", muscleGroups: ["core", "traps"], sets: 4, repsRange: "30-60s", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1045, exerciseName: "Kettlebell Swings", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "15-25", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1022, exerciseName: "Planks", muscleGroups: ["core"], sets: 3, repsRange: "45-90s", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 65,
          focus: ["functional_strength", "core", "stability"]
        },
        {
          name: "Athletic Conditioning",
          exercises: [
            { exerciseId: 1046, exerciseName: "Burpees", muscleGroups: ["full_body"], sets: 4, repsRange: "8-15", restPeriod: 90, orderIndex: 1 },
            { exerciseId: 1047, exerciseName: "Mountain Climbers", muscleGroups: ["core", "shoulders"], sets: 4, repsRange: "20-40", restPeriod: 60, orderIndex: 2 },
            { exerciseId: 1048, exerciseName: "Battle Ropes", muscleGroups: ["shoulders", "core"], sets: 4, repsRange: "30-45s", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1049, exerciseName: "Agility Ladder", muscleGroups: ["legs", "coordination"], sets: 3, repsRange: "30-60s", restPeriod: 60, orderIndex: 4 },
            { exerciseId: 1050, exerciseName: "Bear Crawls", muscleGroups: ["full_body"], sets: 3, repsRange: "20-40s", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 50,
          focus: ["conditioning", "agility", "endurance"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 8, mav: 14, mrv: 18 },
        lats: { mev: 10, mav: 16, mrv: 20 },
        shoulders: { mev: 10, mav: 16, mrv: 20 },
        core: { mev: 12, mav: 20, mrv: 28 },
        quads: { mev: 10, mav: 16, mrv: 20 },
        hamstrings: { mev: 8, mav: 14, mrv: 18 },
        glutes: { mev: 8, mav: 14, mrv: 18 }
      },
      progressionRules: [
        "Focus on movement quality over load",
        "Progress complexity before intensity",
        "Monitor athletic performance metrics",
        "Integrate power and endurance training"
      ],
      deloadGuidelines: [
        "Reduce intensity and complexity",
        "Focus on basic movement patterns",
        "Emphasize mobility and recovery"
      ]
    },
    isActive: true,
    createdBy: "system"
  }
];
