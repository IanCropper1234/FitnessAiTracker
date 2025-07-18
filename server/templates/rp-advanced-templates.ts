import { trainingTemplates } from "@shared/schema";

/**
 * Advanced and Specialization Renaissance Periodization Training Templates
 * High-volume, complex programming for experienced athletes
 */

export const rpAdvancedTemplates: Omit<typeof trainingTemplates.$inferInsert, 'id' | 'createdAt'>[] = [
  // ADVANCED PROGRAMS (8 templates)
  {
    name: "DUP Upper/Lower (Advanced)",
    description: "Daily Undulating Periodization with varied intensities across week",
    category: "advanced",
    daysPerWeek: 4,
    specialization: "powerbuilding",
    templateData: {
      name: "DUP Upper/Lower (Advanced)",
      description: "Varied intensity programming for strength and size",
      category: "advanced",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Upper Heavy",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 5, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 5, repsRange: "4-8", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "5-8", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "6-10", restPeriod: 150, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "8-12", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "8-12", restPeriod: 90, orderIndex: 6 }
          ],
          estimatedDuration: 85,
          focus: ["strength", "power", "neural_adaptation"]
        },
        {
          name: "Lower Heavy",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 5, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "3-5", restPeriod: 300, orderIndex: 2 },
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 3, repsRange: "6-10", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "12-20", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 90,
          focus: ["strength", "power", "structural_balance"]
        },
        {
          name: "Upper Hypertrophy",
          exercises: [
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-15", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 4, repsRange: "10-15", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 5, repsRange: "12-20", restPeriod: 75, orderIndex: 3 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1025, exerciseName: "Chest Flyes", muscleGroups: ["chest"], sets: 3, repsRange: "15-20", restPeriod: 75, orderIndex: 5 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "12-15", restPeriod: 75, orderIndex: 6 },
            { exerciseId: 1031, exerciseName: "Overhead Tricep Extension", muscleGroups: ["triceps"], sets: 4, repsRange: "12-15", restPeriod: 75, orderIndex: 7 }
          ],
          estimatedDuration: 80,
          focus: ["hypertrophy", "metabolic_stress", "muscle_quality"]
        },
        {
          name: "Lower Hypertrophy",
          exercises: [
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 5, repsRange: "15-25", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 5, repsRange: "12-20", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "12-20", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1019, exerciseName: "Hip Thrusts", muscleGroups: ["glutes"], sets: 4, repsRange: "15-25", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1018, exerciseName: "Stiff Leg Deadlifts", muscleGroups: ["hamstrings"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1020, exerciseName: "Seated Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "15-30", restPeriod: 60, orderIndex: 6 }
          ],
          estimatedDuration: 75,
          focus: ["hypertrophy", "metabolic_stress", "time_under_tension"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 14, mav: 22, mrv: 32 },
        lats: { mev: 16, mav: 24, mrv: 36 },
        shoulders: { mev: 14, mav: 22, mrv: 32 },
        biceps: { mev: 12, mav: 20, mrv: 30 },
        triceps: { mev: 12, mav: 20, mrv: 30 },
        quads: { mev: 14, mav: 22, mrv: 32 },
        hamstrings: { mev: 12, mav: 18, mrv: 28 },
        glutes: { mev: 12, mav: 18, mrv: 28 },
        calves: { mev: 14, mav: 22, mrv: 32 }
      },
      progressionRules: [
        "Alternate between strength and hypertrophy phases",
        "Use RPE autoregulation for intensity control",
        "Progress load on strength days, volume on hypertrophy days",
        "Monitor fatigue closely due to high demands"
      ],
      deloadGuidelines: [
        "Reduce volume to 30-40% of peak",
        "Maintain movement patterns but reduce intensity",
        "Consider full recovery week every 6-8 weeks"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Push/Pull/Legs 2x (Advanced)",
    description: "6-day high-frequency split with volume specialization phases",
    category: "advanced",
    daysPerWeek: 6,
    specialization: "bodybuilding",
    templateData: {
      name: "Push/Pull/Legs 2x (Advanced)",
      description: "Maximum frequency for advanced bodybuilding",
      category: "advanced",
      daysPerWeek: 6,
      workouts: [
        {
          name: "Push Heavy",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 5, repsRange: "4-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 4, repsRange: "8-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 80,
          focus: ["strength", "chest_emphasis", "triceps_development"]
        },
        {
          name: "Pull Heavy",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 5, repsRange: "3-6", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 5, repsRange: "5-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "6-10", restPeriod: 150, orderIndex: 3 },
            { exerciseId: 374, exerciseName: "Lat Pulldowns", muscleGroups: ["lats"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "8-12", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 85,
          focus: ["strength", "lat_width", "biceps_development"]
        },
        {
          name: "Legs Heavy",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 5, repsRange: "4-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "12-20", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 85,
          focus: ["strength", "quad_development", "posterior_chain"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 16, mav: 26, mrv: 38 },
        lats: { mev: 18, mav: 28, mrv: 42 },
        shoulders: { mev: 16, mav: 26, mrv: 38 },
        biceps: { mev: 14, mav: 22, mrv: 34 },
        triceps: { mev: 14, mav: 22, mrv: 34 },
        quads: { mev: 16, mav: 26, mrv: 38 },
        hamstrings: { mev: 14, mav: 20, mrv: 32 },
        glutes: { mev: 14, mav: 20, mrv: 32 },
        calves: { mev: 16, mav: 26, mrv: 38 }
      },
      progressionRules: [
        "Maximum recoverable frequency programming",
        "Strict autoregulation required daily",
        "Alternate heavy/light days within same week",
        "Requires advanced recovery protocols"
      ],
      deloadGuidelines: [
        "Reduce frequency to 4 days per week",
        "Cut volume to 40% of peak",
        "Prioritize sleep and stress management"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  // SPECIALIZATION PROGRAMS (6 templates)
  {
    name: "Chest Specialization (Advanced)",
    description: "8-week chest-focused program with supporting muscle maintenance",
    category: "advanced",
    daysPerWeek: 4,
    specialization: "chest",
    templateData: {
      name: "Chest Specialization (Advanced)",
      description: "Maximum chest development with balanced approach",
      category: "advanced",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Chest Power",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 6, repsRange: "3-6", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 5, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1024, exerciseName: "Decline Bench Press", muscleGroups: ["chest"], sets: 4, repsRange: "8-12", restPeriod: 150, orderIndex: 3 },
            { exerciseId: 1025, exerciseName: "Chest Flyes", muscleGroups: ["chest"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1026, exerciseName: "Cable Crossovers", muscleGroups: ["chest"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 75,
          focus: ["chest_power", "chest_mass", "chest_definition"]
        },
        {
          name: "Chest Volume",
          exercises: [
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 5, repsRange: "8-15", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 1032, exerciseName: "Incline Flyes", muscleGroups: ["chest"], sets: 5, repsRange: "12-20", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 1033, exerciseName: "Dumbbell Pullovers", muscleGroups: ["chest", "lats"], sets: 4, repsRange: "12-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1034, exerciseName: "Push-ups to Failure", muscleGroups: ["chest"], sets: 3, repsRange: "AMRAP", restPeriod: 120, orderIndex: 4 },
            { exerciseId: 1026, exerciseName: "Cable Crossovers", muscleGroups: ["chest"], sets: 5, repsRange: "15-25", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 70,
          focus: ["chest_volume", "muscle_damage", "pump"]
        },
        {
          name: "Support Upper",
          exercises: [
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 2134, exerciseName: "Lateral Raises", muscleGroups: ["shoulders"], sets: 3, repsRange: "12-15", restPeriod: 75, orderIndex: 3 },
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 75, orderIndex: 4 },
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 50,
          focus: ["maintenance", "balance", "recovery"]
        },
        {
          name: "Lower Body",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "8-12", restPeriod: 150, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "15-25", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 3, repsRange: "12-15", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["maintenance", "foundation", "balance"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        chest: { mev: 20, mav: 32, mrv: 45 }, // Specialization volume
        lats: { mev: 8, mav: 12, mrv: 16 }, // Maintenance
        shoulders: { mev: 8, mav: 12, mrv: 16 },
        biceps: { mev: 6, mav: 10, mrv: 14 },
        triceps: { mev: 8, mav: 12, mrv: 16 }, // Slightly higher due to chest work
        quads: { mev: 8, mav: 12, mrv: 16 },
        hamstrings: { mev: 6, mav: 10, mrv: 14 },
        glutes: { mev: 6, mav: 10, mrv: 14 }
      },
      progressionRules: [
        "Prioritize chest progression over all other muscle groups",
        "Maintain other muscle groups at maintenance volumes",
        "Use multiple angles and rep ranges for chest",
        "Monitor overreaching carefully due to high chest volume"
      ],
      deloadGuidelines: [
        "Reduce chest volume to normal intermediate levels",
        "Maintain support muscle work",
        "Consider massage and recovery modalities"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Leg Specialization (Advanced)",
    description: "8-week leg-focused program with upper body maintenance",
    category: "advanced",
    daysPerWeek: 4,
    specialization: "legs",
    templateData: {
      name: "Leg Specialization (Advanced)",
      description: "Maximum lower body development program",
      category: "advanced",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Quad Emphasis",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 6, repsRange: "4-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 5, repsRange: "6-12", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 5, repsRange: "15-25", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1014, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "12-20", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1035, exerciseName: "Leg Extensions", muscleGroups: ["quads"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 5 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "15-30", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 90,
          focus: ["quad_mass", "quad_strength", "leg_definition"]
        },
        {
          name: "Posterior Chain",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 5, repsRange: "3-8", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 5, repsRange: "8-15", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1019, exerciseName: "Hip Thrusts", muscleGroups: ["glutes"], sets: 5, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1015, exerciseName: "Leg Curls", muscleGroups: ["hamstrings"], sets: 5, repsRange: "12-20", restPeriod: 90, orderIndex: 4 },
            { exerciseId: 1036, exerciseName: "Good Mornings", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
            { exerciseId: 1020, exerciseName: "Seated Calf Raises", muscleGroups: ["calves"], sets: 5, repsRange: "20-30", restPeriod: 75, orderIndex: 6 }
          ],
          estimatedDuration: 85,
          focus: ["hamstring_mass", "glute_development", "posterior_strength"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        quads: { mev: 20, mav: 32, mrv: 45 }, // Specialization
        hamstrings: { mev: 18, mav: 28, mrv: 40 }, // Specialization
        glutes: { mev: 18, mav: 28, mrv: 40 }, // Specialization
        calves: { mev: 16, mav: 24, mrv: 35 }, // Enhanced
        chest: { mev: 6, mav: 10, mrv: 14 }, // Maintenance
        lats: { mev: 8, mav: 12, mrv: 16 },
        shoulders: { mev: 6, mav: 10, mrv: 14 },
        biceps: { mev: 4, mav: 8, mrv: 12 },
        triceps: { mev: 4, mav: 8, mrv: 12 }
      },
      progressionRules: [
        "Prioritize leg progression with maximum volume tolerance",
        "Upper body maintenance only",
        "Use various squat and deadlift variations",
        "Monitor systemic fatigue from high leg volume"
      ],
      deloadGuidelines: [
        "Reduce leg volume to normal intermediate levels",
        "Consider complete leg rest for 3-5 days",
        "Focus on mobility and soft tissue work"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  // POWERLIFTING SPECIALIZATION PROGRAMS (3 templates)
  {
    name: "Powerlifting Peaking (Advanced)",
    description: "12-week competition preparation with peak strength focus",
    category: "advanced",
    daysPerWeek: 4,
    specialization: "powerlifting",
    templateData: {
      name: "Powerlifting Peaking (Advanced)",
      description: "Competition preparation with maximum strength development",
      category: "advanced",
      daysPerWeek: 4,
      workouts: [
        {
          name: "Squat Day",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 6, repsRange: "1-5", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 1017, exerciseName: "Front Squats", muscleGroups: ["quads"], sets: 4, repsRange: "3-6", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 1051, exerciseName: "Pause Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "3-5", restPeriod: 240, orderIndex: 3 },
            { exerciseId: 390, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 }
          ],
          estimatedDuration: 90,
          focus: ["squat_strength", "competition_preparation"]
        },
        {
          name: "Bench Day",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 6, repsRange: "1-5", restPeriod: 300, orderIndex: 1 },
            { exerciseId: 1052, exerciseName: "Pause Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "3-6", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 1053, exerciseName: "Close Grip Bench", muscleGroups: ["triceps", "chest"], sets: 4, repsRange: "5-8", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 3, repsRange: "8-12", restPeriod: 90, orderIndex: 4 }
          ],
          estimatedDuration: 85,
          focus: ["bench_strength", "competition_preparation"]
        },
        {
          name: "Deadlift Day",
          exercises: [
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 6, repsRange: "1-5", restPeriod: 360, orderIndex: 1 },
            { exerciseId: 1054, exerciseName: "Deficit Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 4, repsRange: "3-6", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 1055, exerciseName: "Rack Pulls", muscleGroups: ["lats", "traps"], sets: 4, repsRange: "5-8", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 }
          ],
          estimatedDuration: 90,
          focus: ["deadlift_strength", "competition_preparation"]
        },
        {
          name: "Accessory Day",
          exercises: [
            { exerciseId: 2211, exerciseName: "Overhead Press", muscleGroups: ["shoulders", "triceps"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1022, exerciseName: "Planks", muscleGroups: ["core"], sets: 4, repsRange: "60-90s", restPeriod: 90, orderIndex: 4 }
          ],
          estimatedDuration: 60,
          focus: ["strength_support", "weak_point_training"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        // Competition lifting focus - minimal volume, maximum intensity
        chest: { mev: 8, mav: 12, mrv: 16 },
        lats: { mev: 8, mav: 12, mrv: 16 },
        shoulders: { mev: 6, mav: 10, mrv: 14 },
        triceps: { mev: 8, mav: 12, mrv: 16 },
        quads: { mev: 10, mav: 14, mrv: 18 },
        hamstrings: { mev: 8, mav: 12, mrv: 16 },
        glutes: { mev: 8, mav: 12, mrv: 16 }
      },
      progressionRules: [
        "Peak strength in competition lifts only",
        "Use opener, second, and third attempt practice",
        "Minimize accessory work during peak phase",
        "Practice competition timing and commands"
      ],
      deloadGuidelines: [
        "Complete rest 3-5 days before competition",
        "Practice openers only at 50-60% intensity",
        "Focus on mobility and mental preparation"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  {
    name: "Olympic Lifting Prep (Advanced)",
    description: "6-day program for Olympic weightlifting development",
    category: "advanced", 
    daysPerWeek: 6,
    specialization: "olympic_lifting",
    templateData: {
      name: "Olympic Lifting Prep (Advanced)",
      description: "Technical mastery and strength for Olympic lifts",
      category: "advanced",
      daysPerWeek: 6,
      workouts: [
        {
          name: "Snatch Development",
          exercises: [
            { exerciseId: 1056, exerciseName: "Power Snatch", muscleGroups: ["shoulders", "quads", "core"], sets: 6, repsRange: "1-3", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1057, exerciseName: "Snatch Pull", muscleGroups: ["hamstrings", "glutes", "traps"], sets: 4, repsRange: "3-5", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1058, exerciseName: "Overhead Squat", muscleGroups: ["quads", "shoulders"], sets: 4, repsRange: "3-6", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1059, exerciseName: "Snatch Grip RDL", muscleGroups: ["hamstrings"], sets: 3, repsRange: "6-10", restPeriod: 120, orderIndex: 4 }
          ],
          estimatedDuration: 75,
          focus: ["snatch_technique", "mobility", "power"]
        },
        {
          name: "Clean & Jerk Development",
          exercises: [
            { exerciseId: 1060, exerciseName: "Power Clean", muscleGroups: ["hamstrings", "shoulders", "core"], sets: 6, repsRange: "1-3", restPeriod: 180, orderIndex: 1 },
            { exerciseId: 1061, exerciseName: "Front Squat", muscleGroups: ["quads"], sets: 5, repsRange: "3-6", restPeriod: 180, orderIndex: 2 },
            { exerciseId: 1062, exerciseName: "Push Jerk", muscleGroups: ["shoulders", "triceps"], sets: 5, repsRange: "1-3", restPeriod: 180, orderIndex: 3 },
            { exerciseId: 1063, exerciseName: "Clean Pull", muscleGroups: ["hamstrings", "traps"], sets: 4, repsRange: "3-5", restPeriod: 120, orderIndex: 4 }
          ],
          estimatedDuration: 80,
          focus: ["clean_technique", "jerk_technique", "power"]
        },
        {
          name: "Strength Support",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 5, repsRange: "3-8", restPeriod: 240, orderIndex: 1 },
            { exerciseId: 1021, exerciseName: "Deadlifts", muscleGroups: ["hamstrings", "glutes", "lats"], sets: 4, repsRange: "5-8", restPeriod: 240, orderIndex: 2 },
            { exerciseId: 1064, exerciseName: "Behind Neck Press", muscleGroups: ["shoulders"], sets: 4, repsRange: "6-10", restPeriod: 120, orderIndex: 3 },
            { exerciseId: 1065, exerciseName: "Bulgarian Split Squats", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "8-12", restPeriod: 90, orderIndex: 4 }
          ],
          estimatedDuration: 70,
          focus: ["strength_foundation", "stability"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        // Olympic lifting requires high skill practice volume
        shoulders: { mev: 12, mav: 20, mrv: 28 },
        quads: { mev: 14, mav: 22, mrv: 30 },
        hamstrings: { mev: 10, mav: 16, mrv: 22 },
        glutes: { mev: 10, mav: 16, mrv: 22 },
        core: { mev: 14, mav: 22, mrv: 30 },
        traps: { mev: 8, mav: 14, mrv: 20 }
      },
      progressionRules: [
        "Prioritize technique over maximum load",
        "Daily practice of competition lifts",
        "Build strength in supporting movements",
        "Monitor CNS fatigue carefully"
      ],
      deloadGuidelines: [
        "Reduce intensity to 70% for technique work",
        "Maintain movement frequency",
        "Focus on mobility and flexibility"
      ]
    },
    isActive: true,
    createdBy: "system"
  },

  // BODYBUILDING SPECIALIZATION PROGRAMS (3 templates)
  {
    name: "Arm Specialization (Advanced)",
    description: "8-week arm-focused program with extreme arm volume",
    category: "advanced",
    daysPerWeek: 5,
    specialization: "arms",
    templateData: {
      name: "Arm Specialization (Advanced)",
      description: "Maximum arm development with supporting muscle maintenance",
      category: "advanced",
      daysPerWeek: 5,
      workouts: [
        {
          name: "Bicep Specialization",
          exercises: [
            { exerciseId: 376, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 6, repsRange: "6-12", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 377, exerciseName: "Hammer Curls", muscleGroups: ["biceps"], sets: 5, repsRange: "8-15", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 1030, exerciseName: "Preacher Curls", muscleGroups: ["biceps"], sets: 5, repsRange: "10-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1066, exerciseName: "Cable Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "12-20", restPeriod: 75, orderIndex: 4 },
            { exerciseId: 1067, exerciseName: "Concentration Curls", muscleGroups: ["biceps"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["bicep_mass", "bicep_peak", "bicep_width"]
        },
        {
          name: "Tricep Specialization", 
          exercises: [
            { exerciseId: 1013, exerciseName: "Tricep Extensions", muscleGroups: ["triceps"], sets: 6, repsRange: "6-12", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 1016, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 5, repsRange: "8-15", restPeriod: 90, orderIndex: 2 },
            { exerciseId: 1031, exerciseName: "Overhead Tricep Extension", muscleGroups: ["triceps"], sets: 5, repsRange: "10-15", restPeriod: 90, orderIndex: 3 },
            { exerciseId: 1068, exerciseName: "Cable Pushdowns", muscleGroups: ["triceps"], sets: 4, repsRange: "12-20", restPeriod: 75, orderIndex: 4 },
            { exerciseId: 1069, exerciseName: "Diamond Push-ups", muscleGroups: ["triceps"], sets: 3, repsRange: "10-20", restPeriod: 90, orderIndex: 5 }
          ],
          estimatedDuration: 60,
          focus: ["tricep_mass", "tricep_definition", "lockout_strength"]
        },
        {
          name: "Chest Support",
          exercises: [
            { exerciseId: 2136, exerciseName: "Bench Press", muscleGroups: ["chest", "triceps"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 2213, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 1025, exerciseName: "Chest Flyes", muscleGroups: ["chest"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 3 }
          ],
          estimatedDuration: 40,
          focus: ["maintenance", "arm_support"]
        },
        {
          name: "Back Support",
          exercises: [
            { exerciseId: 372, exerciseName: "Pull-ups", muscleGroups: ["lats", "biceps"], sets: 4, repsRange: "8-12", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 373, exerciseName: "Barbell Rows", muscleGroups: ["lats", "rhomboids"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 375, exerciseName: "Seated Cable Rows", muscleGroups: ["rhomboids"], sets: 3, repsRange: "12-20", restPeriod: 90, orderIndex: 3 }
          ],
          estimatedDuration: 40,
          focus: ["maintenance", "posture"]
        },
        {
          name: "Legs Support",
          exercises: [
            { exerciseId: 389, exerciseName: "Squats", muscleGroups: ["quads", "glutes"], sets: 4, repsRange: "10-15", restPeriod: 120, orderIndex: 1 },
            { exerciseId: 1009, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings", "glutes"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 2 },
            { exerciseId: 391, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 75, orderIndex: 3 }
          ],
          estimatedDuration: 45,
          focus: ["maintenance", "foundation"]
        }
      ]
    },
    rpMethodology: {
      volumeGuidelines: {
        biceps: { mev: 22, mav: 35, mrv: 50 }, // Extreme specialization
        triceps: { mev: 22, mav: 35, mrv: 50 }, // Extreme specialization
        chest: { mev: 8, mav: 12, mrv: 16 }, // Maintenance
        lats: { mev: 8, mav: 12, mrv: 16 }, // Maintenance
        shoulders: { mev: 6, mav: 10, mrv: 14 }, // Maintenance
        quads: { mev: 8, mav: 12, mrv: 16 }, // Maintenance
        hamstrings: { mev: 6, mav: 10, mrv: 14 }
      },
      progressionRules: [
        "Extreme arm volume with perfect recovery",
        "Maintain all other muscle groups",
        "Use multiple angles and grips",
        "Monitor overreaching symptoms closely"
      ],
      deloadGuidelines: [
        "Reduce arm volume to normal intermediate levels",
        "Consider massage and recovery modalities",
        "Monitor for overuse injuries"
      ]
    },
    isActive: true,
    createdBy: "system"
  }
];
