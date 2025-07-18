import type { InsertExercise } from "@shared/schema";

export const enhancedExercises: InsertExercise[] = [
  // Push exercises - Chest
  {
    name: "Bench Press",
    category: "push",
    muscleGroups: ["chest", "triceps", "front_delts"],
    primaryMuscle: "chest",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Lie on bench, grip barbell slightly wider than shoulder-width, lower to chest, press up.",
    translations: {
      en: "Bench Press",
      es: "Press de Banca",
      ja: "ベンチプレス",
      "zh-CN": "卧推",
      de: "Bankdrücken",
      "zh-TW": "臥推"
    }
  },
  {
    name: "Incline Dumbbell Press",
    category: "push",
    muscleGroups: ["chest", "front_delts"],
    primaryMuscle: "chest",
    equipment: "dumbbells",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Set bench to 30-45 degrees, press dumbbells up and slightly together.",
    translations: {
      en: "Incline Dumbbell Press",
      es: "Press Inclinado con Mancuernas",
      ja: "インクラインダンベルプレス",
      "zh-CN": "上斜哑铃推举",
      de: "Schrägbank-Hanteldrücken",
      "zh-TW": "上斜啞鈴推舉"
    }
  },
  {
    name: "Dumbbell Flyes",
    category: "push",
    muscleGroups: ["chest"],
    primaryMuscle: "chest",
    equipment: "dumbbells",
    movementPattern: "isolation",
    difficulty: "intermediate",
    instructions: "Lie on bench, arc dumbbells from wide position to over chest, feeling stretch in pecs.",
    translations: {
      en: "Dumbbell Flyes",
      es: "Aperturas con Mancuernas",
      ja: "ダンベルフライ",
      "zh-CN": "哑铃飞鸟",
      de: "Kurzhantel-Fliegende",
      "zh-TW": "啞鈴飛鳥"
    }
  },

  // Push exercises - Shoulders
  {
    name: "Overhead Press",
    category: "push",
    muscleGroups: ["front_delts", "triceps"],
    primaryMuscle: "front_delts",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Stand with barbell at shoulder height, press overhead until arms are fully extended.",
    translations: {
      en: "Overhead Press",
      es: "Press Militar",
      ja: "オーバーヘッドプレス",
      "zh-CN": "推举",
      de: "Überkopfdrücken",
      "zh-TW": "推舉"
    }
  },
  {
    name: "Lateral Raises",
    category: "push",
    muscleGroups: ["side_delts"],
    primaryMuscle: "side_delts",
    equipment: "dumbbells",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Stand with dumbbells at sides, raise arms laterally to shoulder height.",
    translations: {
      en: "Lateral Raises",
      es: "Elevaciones Laterales",
      ja: "ラテラルレイズ",
      "zh-CN": "侧平举",
      de: "Seitheben",
      "zh-TW": "側平舉"
    }
  },
  {
    name: "Rear Delt Flyes",
    category: "push",
    muscleGroups: ["rear_delts"],
    primaryMuscle: "rear_delts",
    equipment: "dumbbells",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Bend forward, raise dumbbells to sides with slight bend in elbows.",
    translations: {
      en: "Rear Delt Flyes",
      es: "Aperturas Posteriores",
      ja: "リアデルトフライ",
      "zh-CN": "后束飞鸟",
      de: "Rückwärtige Schulter-Fliegende",
      "zh-TW": "後束飛鳥"
    }
  },

  // Push exercises - Triceps
  {
    name: "Tricep Dips",
    category: "push",
    muscleGroups: ["triceps"],
    primaryMuscle: "triceps",
    equipment: "dip_station",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Support body on dip bars, lower body by bending elbows, push back up.",
    translations: {
      en: "Tricep Dips",
      es: "Fondos de Tríceps",
      ja: "トライセップディップス",
      "zh-CN": "三头肌臂屈伸",
      de: "Trizeps-Dips",
      "zh-TW": "三頭肌撐體"
    }
  },
  {
    name: "Close-Grip Bench Press",
    category: "push",
    muscleGroups: ["triceps", "chest"],
    primaryMuscle: "triceps",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Bench press with hands closer than shoulder width, focus on tricep contraction.",
    translations: {
      en: "Close-Grip Bench Press",
      es: "Press de Banca Agarre Cerrado",
      ja: "ナローグリップベンチプレス",
      "zh-CN": "窄握卧推",
      de: "Enges Bankdrücken",
      "zh-TW": "窄握臥推"
    }
  },

  // Pull exercises - Back
  {
    name: "Pull-ups",
    category: "pull",
    muscleGroups: ["lats", "rhomboids", "biceps"],
    primaryMuscle: "lats",
    equipment: "pull_up_bar",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Hang from bar with overhand grip, pull body up until chin clears bar.",
    translations: {
      en: "Pull-ups",
      es: "Dominadas",
      ja: "プルアップ",
      "zh-CN": "引体向上",
      de: "Klimmzüge",
      "zh-TW": "引體向上"
    }
  },
  {
    name: "Barbell Rows",
    category: "pull",
    muscleGroups: ["lats", "rhomboids", "rear_delts"],
    primaryMuscle: "lats",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Bend at hips, pull barbell to lower chest, squeeze shoulder blades together.",
    translations: {
      en: "Barbell Rows",
      es: "Remo con Barra",
      ja: "バーベルロウ",
      "zh-CN": "杠铃划船",
      de: "Langhantelrudern",
      "zh-TW": "槓鈴划船"
    }
  },
  {
    name: "Lat Pulldowns",
    category: "pull",
    muscleGroups: ["lats", "biceps"],
    primaryMuscle: "lats",
    equipment: "cable_machine",
    movementPattern: "compound",
    difficulty: "beginner",
    instructions: "Sit at lat pulldown machine, pull bar down to chest while leaning slightly back.",
    translations: {
      en: "Lat Pulldowns",
      es: "Jalones al Pecho",
      ja: "ラットプルダウン",
      "zh-CN": "高位下拉",
      de: "Latzug",
      "zh-TW": "高位下拉"
    }
  },
  {
    name: "Seated Cable Rows",
    category: "pull",
    muscleGroups: ["rhomboids", "lats", "rear_delts"],
    primaryMuscle: "rhomboids",
    equipment: "cable_machine",
    movementPattern: "compound",
    difficulty: "beginner",
    instructions: "Sit at cable row machine, pull handle to torso while squeezing shoulder blades.",
    translations: {
      en: "Seated Cable Rows",
      es: "Remo en Polea Sentado",
      ja: "シーテッドケーブルロウ",
      "zh-CN": "坐姿拉索划船",
      de: "Sitzender Kabelzug",
      "zh-TW": "坐姿拉索划船"
    }
  },

  // Pull exercises - Biceps
  {
    name: "Bicep Curls",
    category: "pull",
    muscleGroups: ["biceps"],
    primaryMuscle: "biceps",
    equipment: "dumbbells",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Stand with dumbbells at sides, curl weights up while keeping elbows stable.",
    translations: {
      en: "Bicep Curls",
      es: "Curl de Bíceps",
      ja: "バイセップカール",
      "zh-CN": "二头肌弯举",
      de: "Bizeps-Curls",
      "zh-TW": "二頭肌彎舉"
    }
  },
  {
    name: "Hammer Curls",
    category: "pull",
    muscleGroups: ["biceps", "forearms"],
    primaryMuscle: "biceps",
    equipment: "dumbbells",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Hold dumbbells with neutral grip, curl while maintaining hammer position.",
    translations: {
      en: "Hammer Curls",
      es: "Curl Martillo",
      ja: "ハンマーカール",
      "zh-CN": "锤式弯举",
      de: "Hammer-Curls",
      "zh-TW": "錘式彎舉"
    }
  },

  // Legs exercises - Quads
  {
    name: "Squats",
    category: "legs",
    muscleGroups: ["quads", "glutes"],
    primaryMuscle: "quads",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Stand with barbell on upper back, descend until thighs parallel to ground, drive up.",
    translations: {
      en: "Squats",
      es: "Sentadillas",
      ja: "スクワット",
      "zh-CN": "深蹲",
      de: "Kniebeugen",
      "zh-TW": "深蹲"
    }
  },
  {
    name: "Leg Press",
    category: "legs",
    muscleGroups: ["quads", "glutes"],
    primaryMuscle: "quads",
    equipment: "leg_press_machine",
    movementPattern: "compound",
    difficulty: "beginner",
    instructions: "Sit in leg press machine, lower weight until knees near chest, press up.",
    translations: {
      en: "Leg Press",
      es: "Prensa de Piernas",
      ja: "レッグプレス",
      "zh-CN": "腿举",
      de: "Beinpresse",
      "zh-TW": "腿舉"
    }
  },
  {
    name: "Leg Extensions",
    category: "legs",
    muscleGroups: ["quads"],
    primaryMuscle: "quads",
    equipment: "leg_extension_machine",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Sit in leg extension machine, extend legs until straight, lower slowly.",
    translations: {
      en: "Leg Extensions",
      es: "Extensiones de Piernas",
      ja: "レッグエクステンション",
      "zh-CN": "腿屈伸",
      de: "Beinstrecker",
      "zh-TW": "腿屈伸"
    }
  },

  // Legs exercises - Hamstrings/Glutes
  {
    name: "Romanian Deadlifts",
    category: "legs",
    muscleGroups: ["hamstrings", "glutes"],
    primaryMuscle: "hamstrings",
    equipment: "barbell",
    movementPattern: "compound",
    difficulty: "intermediate",
    instructions: "Hold barbell, push hips back while lowering weight, feel stretch in hamstrings.",
    translations: {
      en: "Romanian Deadlifts",
      es: "Peso Muerto Rumano",
      ja: "ルーマニアンデッドリフト",
      "zh-CN": "罗马尼亚硬拉",
      de: "Rumänisches Kreuzheben",
      "zh-TW": "羅馬尼亞硬舉"
    }
  },
  {
    name: "Leg Curls",
    category: "legs",
    muscleGroups: ["hamstrings"],
    primaryMuscle: "hamstrings",
    equipment: "leg_curl_machine",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Lie on leg curl machine, curl heels toward glutes, lower slowly.",
    translations: {
      en: "Leg Curls",
      es: "Curl de Piernas",
      ja: "レッグカール",
      "zh-CN": "腿弯举",
      de: "Beinbeuger",
      "zh-TW": "腿彎舉"
    }
  },
  {
    name: "Lunges",
    category: "legs",
    muscleGroups: ["quads", "glutes"],
    primaryMuscle: "quads",
    equipment: "dumbbells",
    movementPattern: "unilateral",
    difficulty: "intermediate",
    instructions: "Step forward into lunge position, lower back knee toward ground, push back up.",
    translations: {
      en: "Lunges",
      es: "Zancadas",
      ja: "ランジ",
      "zh-CN": "弓步",
      de: "Ausfallschritte",
      "zh-TW": "弓步"
    }
  },

  // Legs exercises - Calves
  {
    name: "Calf Raises",
    category: "legs",
    muscleGroups: ["calves"],
    primaryMuscle: "calves",
    equipment: "bodyweight",
    movementPattern: "isolation",
    difficulty: "beginner",
    instructions: "Stand on toes, raise heels as high as possible, lower slowly.",
    translations: {
      en: "Calf Raises",
      es: "Elevaciones de Gemelos",
      ja: "カーフレイズ",
      "zh-CN": "提踵",
      de: "Wadenheben",
      "zh-TW": "提踵"
    }
  },

  // Core exercises
  {
    name: "Plank",
    category: "core",
    muscleGroups: ["core"],
    primaryMuscle: "core",
    equipment: "bodyweight",
    movementPattern: "isometric",
    difficulty: "beginner",
    instructions: "Hold push-up position with forearms on ground, keep body straight.",
    translations: {
      en: "Plank",
      es: "Plancha",
      ja: "プランク",
      "zh-CN": "平板支撑",
      de: "Planke",
      "zh-TW": "平板支撐"
    }
  },
  {
    name: "Russian Twists",
    category: "core",
    muscleGroups: ["core"],
    primaryMuscle: "core",
    equipment: "bodyweight",
    movementPattern: "rotation",
    difficulty: "beginner",
    instructions: "Sit with knees bent, lean back slightly, rotate torso side to side.",
    translations: {
      en: "Russian Twists",
      es: "Giros Rusos",
      ja: "ロシアンツイスト",
      "zh-CN": "俄式转体",
      de: "Russische Drehungen",
      "zh-TW": "俄式轉體"
    }
  }
];