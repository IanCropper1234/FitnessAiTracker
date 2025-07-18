// Renaissance Periodization Muscle Groups with RP Volume Landmarks
export const rpMuscleGroups = [
  // Push (Upper Body)
  {
    name: "chest",
    category: "push",
    bodyPart: "upper",
    priority: 1,
    translations: {
      en: "Chest",
      es: "Pecho",
      de: "Brust",
      ja: "胸",
      "zh-CN": "胸部",
      "zh-TW": "胸部"
    }
  },
  {
    name: "shoulders",
    category: "push",
    bodyPart: "upper",
    priority: 1,
    translations: {
      en: "Shoulders",
      es: "Hombros",
      de: "Schultern",
      ja: "肩",
      "zh-CN": "肩膀",
      "zh-TW": "肩膀"
    }
  },
  {
    name: "triceps",
    category: "push",
    bodyPart: "upper",
    priority: 2,
    translations: {
      en: "Triceps",
      es: "Tríceps",
      de: "Trizeps",
      ja: "上腕三頭筋",
      "zh-CN": "三头肌",
      "zh-TW": "三頭肌"
    }
  },

  // Pull (Upper Body)
  {
    name: "lats",
    category: "pull",
    bodyPart: "upper",
    priority: 1,
    translations: {
      en: "Lats",
      es: "Dorsales",
      de: "Latissimus",
      ja: "広背筋",
      "zh-CN": "背阔肌",
      "zh-TW": "闊背肌"
    }
  },
  {
    name: "rhomboids",
    category: "pull",
    bodyPart: "upper",
    priority: 1,
    translations: {
      en: "Rhomboids",
      es: "Romboides",
      de: "Rhomboiden",
      ja: "菱形筋",
      "zh-CN": "菱形肌",
      "zh-TW": "菱形肌"
    }
  },
  {
    name: "rear_delts",
    category: "pull",
    bodyPart: "upper",
    priority: 1,
    translations: {
      en: "Rear Delts",
      es: "Deltoides Posteriores",
      de: "Hintere Schulter",
      ja: "後部三角筋",
      "zh-CN": "后三角肌",
      "zh-TW": "後三角肌"
    }
  },
  {
    name: "biceps",
    category: "pull",
    bodyPart: "upper",
    priority: 2,
    translations: {
      en: "Biceps",
      es: "Bíceps",
      de: "Bizeps",
      ja: "上腕二頭筋",
      "zh-CN": "二头肌",
      "zh-TW": "二頭肌"
    }
  },

  // Legs (Lower Body)
  {
    name: "quads",
    category: "legs",
    bodyPart: "lower",
    priority: 1,
    translations: {
      en: "Quadriceps",
      es: "Cuádriceps",
      de: "Quadrizeps",
      ja: "大腿四頭筋",
      "zh-CN": "股四头肌",
      "zh-TW": "股四頭肌"
    }
  },
  {
    name: "hamstrings",
    category: "legs",
    bodyPart: "lower",
    priority: 1,
    translations: {
      en: "Hamstrings",
      es: "Isquiotibiales",
      de: "Beinbeuger",
      ja: "ハムストリング",
      "zh-CN": "腘绳肌",
      "zh-TW": "膕繩肌"
    }
  },
  {
    name: "glutes",
    category: "legs",
    bodyPart: "lower",
    priority: 1,
    translations: {
      en: "Glutes",
      es: "Glúteos",
      de: "Gesäßmuskel",
      ja: "臀筋",
      "zh-CN": "臀肌",
      "zh-TW": "臀肌"
    }
  },
  {
    name: "calves",
    category: "legs",
    bodyPart: "lower",
    priority: 2,
    translations: {
      en: "Calves",
      es: "Pantorrillas",
      de: "Waden",
      ja: "ふくらはぎ",
      "zh-CN": "小腿",
      "zh-TW": "小腿"
    }
  }
];

// Renaissance Periodization Volume Landmarks (sets per week)
// Based on RP methodology for hypertrophy training
export const rpVolumeLandmarks = {
  // Upper Body Push
  chest: { mv: 0, mev: 8, mav: 18, mrv: 26 },
  shoulders: { mv: 0, mev: 8, mav: 20, mrv: 28 },
  triceps: { mv: 0, mev: 6, mav: 14, mrv: 20 },

  // Upper Body Pull  
  lats: { mv: 0, mev: 8, mav: 18, mrv: 25 },
  rhomboids: { mv: 0, mev: 8, mav: 16, mrv: 22 },
  rear_delts: { mv: 0, mev: 8, mav: 16, mrv: 22 },
  biceps: { mv: 0, mev: 6, mav: 14, mrv: 20 },

  // Lower Body
  quads: { mv: 0, mev: 8, mav: 20, mrv: 28 },
  hamstrings: { mv: 0, mev: 6, mav: 16, mrv: 22 },
  glutes: { mv: 0, mev: 6, mav: 16, mrv: 22 },
  calves: { mv: 0, mev: 6, mav: 14, mrv: 20 }
};

// Exercise to muscle group mapping with contribution percentages
export const exerciseMuscleMapping = [
  // Pull-ups
  { exerciseName: "Pull-ups", muscleGroup: "lats", contribution: 70, role: "primary" },
  { exerciseName: "Pull-ups", muscleGroup: "rhomboids", contribution: 20, role: "secondary" },
  { exerciseName: "Pull-ups", muscleGroup: "biceps", contribution: 10, role: "secondary" },

  // Barbell Rows
  { exerciseName: "Barbell Rows", muscleGroup: "lats", contribution: 50, role: "primary" },
  { exerciseName: "Barbell Rows", muscleGroup: "rhomboids", contribution: 40, role: "primary" },
  { exerciseName: "Barbell Rows", muscleGroup: "biceps", contribution: 10, role: "secondary" },

  // Lat Pulldowns
  { exerciseName: "Lat Pulldowns", muscleGroup: "lats", contribution: 80, role: "primary" },
  { exerciseName: "Lat Pulldowns", muscleGroup: "rhomboids", contribution: 15, role: "secondary" },
  { exerciseName: "Lat Pulldowns", muscleGroup: "biceps", contribution: 5, role: "secondary" },

  // Bicep Curls
  { exerciseName: "Bicep Curls", muscleGroup: "biceps", contribution: 100, role: "primary" },

  // Hammer Curls
  { exerciseName: "Hammer Curls", muscleGroup: "biceps", contribution: 100, role: "primary" },

  // More mappings will be added as exercises are created
];