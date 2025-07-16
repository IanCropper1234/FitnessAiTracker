import { storage } from "../storage";
import type { InsertExercise } from "@shared/schema";

export async function initializeExercises() {
  const exercises: InsertExercise[] = [
    // Push exercises
    {
      name: "Bench Press",
      category: "push",
      muscleGroups: ["chest", "triceps", "front_delts"],
      equipment: "barbell",
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
      equipment: "dumbbells",
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
      name: "Lateral Raises",
      category: "push",
      muscleGroups: ["side_delts"],
      equipment: "dumbbells",
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
      name: "Tricep Dips",
      category: "push",
      muscleGroups: ["triceps"],
      equipment: "dip_station",
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
      name: "Overhead Press",
      category: "push",
      muscleGroups: ["front_delts", "triceps"],
      equipment: "barbell",
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
    
    // Pull exercises
    {
      name: "Pull-ups",
      category: "pull",
      muscleGroups: ["lats", "rhomboids", "biceps"],
      equipment: "pull_up_bar",
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
      equipment: "barbell",
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
      name: "Face Pulls",
      category: "pull",
      muscleGroups: ["rear_delts", "rhomboids"],
      equipment: "cable_machine",
      instructions: "Set cable to face height, pull rope to face while separating hands.",
      translations: {
        en: "Face Pulls",
        es: "Jalones Faciales",
        ja: "フェイスプル",
        "zh-CN": "面拉",
        de: "Gesichtszüge",
        "zh-TW": "面拉"
      }
    },
    {
      name: "Bicep Curls",
      category: "pull",
      muscleGroups: ["biceps"],
      equipment: "dumbbells",
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
      name: "Lat Pulldowns",
      category: "pull",
      muscleGroups: ["lats", "biceps"],
      equipment: "cable_machine",
      instructions: "Sit at lat pulldown machine, pull bar down to upper chest.",
      translations: {
        en: "Lat Pulldowns",
        es: "Jalones al Pecho",
        ja: "ラットプルダウン",
        "zh-CN": "高位下拉",
        de: "Latzug",
        "zh-TW": "高位下拉"
      }
    },
    
    // Legs exercises
    {
      name: "Squats",
      category: "legs",
      muscleGroups: ["quads", "glutes", "hamstrings"],
      equipment: "barbell",
      instructions: "Stand with barbell on shoulders, squat down until thighs parallel to floor.",
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
      name: "Romanian Deadlifts",
      category: "legs",
      muscleGroups: ["hamstrings", "glutes"],
      equipment: "barbell",
      instructions: "Hold barbell with straight arms, hinge at hips while keeping back straight.",
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
      name: "Leg Press",
      category: "legs",
      muscleGroups: ["quads", "glutes"],
      equipment: "leg_press_machine",
      instructions: "Sit in leg press machine, lower weight by bending knees, press back up.",
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
      name: "Calf Raises",
      category: "legs",
      muscleGroups: ["calves"],
      equipment: "bodyweight",
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
    {
      name: "Lunges",
      category: "legs",
      muscleGroups: ["quads", "glutes"],
      equipment: "dumbbells",
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
    
    // Core exercises
    {
      name: "Plank",
      category: "core",
      muscleGroups: ["core"],
      equipment: "bodyweight",
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
      equipment: "bodyweight",
      instructions: "Sit with knees bent, lean back slightly, rotate torso side to side.",
      translations: {
        en: "Russian Twists",
        es: "Giros Rusos",
        ja: "ロシアンツイスト",
        "zh-CN": "俄罗斯转体",
        de: "Russische Drehungen",
        "zh-TW": "俄羅斯轉體"
      }
    },
    {
      name: "Dead Bug",
      category: "core",
      muscleGroups: ["core"],
      equipment: "bodyweight",
      instructions: "Lie on back, extend opposite arm and leg, return to starting position.",
      translations: {
        en: "Dead Bug",
        es: "Bicho Muerto",
        ja: "デッドバグ",
        "zh-CN": "死虫",
        de: "Toter Käfer",
        "zh-TW": "死蟲"
      }
    },
    {
      name: "Mountain Climbers",
      category: "cardio",
      muscleGroups: ["core", "legs"],
      equipment: "bodyweight",
      instructions: "In plank position, alternate bringing knees to chest rapidly.",
      translations: {
        en: "Mountain Climbers",
        es: "Escaladores",
        ja: "マウンテンクライマー",
        "zh-CN": "登山者",
        de: "Bergsteiger",
        "zh-TW": "登山者"
      }
    },
    {
      name: "Burpees",
      category: "cardio",
      muscleGroups: ["full_body"],
      equipment: "bodyweight",
      instructions: "Squat down, jump back to plank, do push-up, jump feet forward, jump up.",
      translations: {
        en: "Burpees",
        es: "Burpees",
        ja: "バーピー",
        "zh-CN": "波比跳",
        de: "Burpees",
        "zh-TW": "波比跳"
      }
    }
  ];

  // Initialize exercises in storage
  for (const exercise of exercises) {
    await storage.createExercise(exercise);
  }
}
