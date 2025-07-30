import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  appleId: text("apple_id"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  theme: text("theme").notNull().default("dark"),
  showDeveloperFeatures: boolean("show_developer_features").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  weightUnit: text("weight_unit").default("metric"), // metric (kg) or imperial (lbs)
  heightUnit: text("height_unit").default("metric"), // metric (cm) or imperial (inches)
  activityLevel: text("activity_level"), // sedentary, lightly_active, moderately_active, very_active
  fitnessGoal: text("fitness_goal"), // fat_loss, muscle_gain, maintenance
  dietaryRestrictions: text("dietary_restrictions").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nutritionGoals = pgTable("nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dailyCalories: integer("daily_calories").notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  foodName: text("food_name").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  calories: decimal("calories", { precision: 8, scale: 2 }).notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack
  mealOrder: integer("meal_order").default(1), // 1-6 for meal timing
  scheduledTime: timestamp("scheduled_time"), // planned meal time
  // Enhanced RP Diet Coach categorization
  category: text("category"), // protein, carb, fat, mixed
  mealSuitability: text("meal_suitability").array(), // pre-workout, post-workout, regular, snack
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced nutrition schema for RP Diet Coach methodology
export const foodCategories = pgTable("food_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  macroType: text("macro_type").notNull(), // protein, carb, fat, mixed
  priority: integer("priority").default(0), // for sorting
  translations: jsonb("translations"),
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode"),
  categoryId: integer("category_id").references(() => foodCategories.id),
  calories: decimal("calories", { precision: 8, scale: 2 }).notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  servingSize: text("serving_size").notNull(),
  servingUnit: text("serving_unit").notNull(),
  translations: jsonb("translations"),
  isRestaurant: boolean("is_restaurant").default(false),
  restaurantChain: text("restaurant_chain"),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  mealNumber: integer("meal_number").notNull(), // 1-6
  scheduledTime: timestamp("scheduled_time").notNull(),
  targetCalories: decimal("target_calories", { precision: 8, scale: 2 }),
  targetProtein: decimal("target_protein", { precision: 6, scale: 2 }),
  targetCarbs: decimal("target_carbs", { precision: 6, scale: 2 }),
  targetFat: decimal("target_fat", { precision: 6, scale: 2 }),
  isPreWorkout: boolean("is_pre_workout").default(false),
  isPostWorkout: boolean("is_post_workout").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Wellness Check-ins (RP Diet Coach style - authentic methodology)
export const dailyWellnessCheckins = pgTable("daily_wellness_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(), // Daily date for wellness tracking
  energyLevel: integer("energy_level").notNull(), // 1-10 scale
  hungerLevel: integer("hunger_level").notNull(), // 1-10 scale
  sleepQuality: integer("sleep_quality"), // 1-10 scale (optional)
  stressLevel: integer("stress_level"), // 1-10 scale (optional)
  cravingsIntensity: integer("cravings_intensity"), // 1-10 scale (optional)
  adherencePerception: integer("adherence_perception"), // 1-10 how well user thinks they stuck to plan
  notes: text("notes"), // Optional user notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly Wellness Summaries (calculated from daily checkins for macro adjustments)
export const weeklyWellnessSummaries = pgTable("weekly_wellness_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  // Weekly averages calculated from daily checkins
  avgEnergyLevel: decimal("avg_energy_level", { precision: 3, scale: 1 }), // Calculated average
  avgHungerLevel: decimal("avg_hunger_level", { precision: 3, scale: 1 }), // Calculated average
  avgSleepQuality: decimal("avg_sleep_quality", { precision: 3, scale: 1 }), // Calculated average
  avgStressLevel: decimal("avg_stress_level", { precision: 3, scale: 1 }), // Calculated average
  avgCravingsIntensity: decimal("avg_cravings_intensity", { precision: 3, scale: 1 }), // Calculated average
  avgAdherencePerception: decimal("avg_adherence_perception", { precision: 3, scale: 1 }), // Calculated average
  // Metadata
  daysTracked: integer("days_tracked").notNull(), // How many days had checkins
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyNutritionGoals = pgTable("weekly_nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  dailyCalories: integer("daily_calories").notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  adjustmentReason: text("adjustment_reason"), // weight_loss_slow, weight_gain_fast, etc.
  previousWeight: decimal("previous_weight", { precision: 5, scale: 2 }),
  currentWeight: decimal("current_weight", { precision: 5, scale: 2 }),
  adherencePercentage: decimal("adherence_percentage", { precision: 5, scale: 2 }), // % compliance
  energyLevels: integer("energy_levels"), // 1-10 scale (from wellness checkin)
  hungerLevels: integer("hunger_levels"), // 1-10 scale (from wellness checkin)
  adjustmentPercentage: decimal("adjustment_percentage", { precision: 5, scale: 2 }), // % change applied
  createdAt: timestamp("created_at").defaultNow(),
});

// Macro distribution per meal for advanced meal planning
export const mealMacroDistribution = pgTable("meal_macro_distribution", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mealType: text("meal_type").notNull(), // "breakfast", "lunch", "dinner", "snack1", etc.
  mealTiming: text("meal_timing"), // "pre-workout", "post-workout", "regular"
  proteinPercentage: decimal("protein_percentage", { precision: 5, scale: 2 }),
  carbPercentage: decimal("carb_percentage", { precision: 5, scale: 2 }),
  fatPercentage: decimal("fat_percentage", { precision: 5, scale: 2 }),
  caloriePercentage: decimal("calorie_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Macro flexibility rules for social eating
export const macroFlexibilityRules = pgTable("macro_flexibility_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  ruleName: text("rule_name").notNull(), // "Weekend Social", "Business Lunch", etc.
  triggerDays: text("trigger_days").array(), // ["saturday", "sunday"]
  flexProtein: decimal("flex_protein", { precision: 5, scale: 2 }), // % allowable variance
  flexCarbs: decimal("flex_carbs", { precision: 5, scale: 2 }),
  flexFat: decimal("flex_fat", { precision: 5, scale: 2 }),
  compensationStrategy: text("compensation_strategy"), // "reduce_next_meal", "reduce_next_day"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dietPhases = pgTable("diet_phases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  phase: text("phase").notNull(), // cutting, bulking, maintenance
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  targetWeightChange: decimal("target_weight_change", { precision: 5, scale: 2 }),
  weeklyWeightChangeTarget: decimal("weekly_weight_change_target", { precision: 4, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealTimingPreferences = pgTable("meal_timing_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  wakeTime: text("wake_time").notNull(), // HH:MM format
  sleepTime: text("sleep_time").notNull(), // HH:MM format
  workoutTime: text("workout_time"), // HH:MM format
  workoutDays: text("workout_days").array(), // ['monday', 'wednesday', 'friday']
  mealsPerDay: integer("meals_per_day").default(4),
  preWorkoutMeals: integer("pre_workout_meals").default(1),
  postWorkoutMeals: integer("post_workout_meals").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedMeals = pgTable("saved_meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  foodItems: jsonb("food_items").notNull(), // Array of food items with nutrition info
  totalCalories: decimal("total_calories", { precision: 8, scale: 2 }).notNull(),
  totalProtein: decimal("total_protein", { precision: 6, scale: 2 }).notNull(),
  totalCarbs: decimal("total_carbs", { precision: 6, scale: 2 }).notNull(),
  totalFat: decimal("total_fat", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  daysPerWeek: integer("days_per_week").notNull(),
  mesocycleDuration: integer("mesocycle_duration").notNull().default(6), // weeks
  currentWeek: integer("current_week").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // push, pull, legs, cardio
  muscleGroups: text("muscle_groups").array(),
  primaryMuscle: text("primary_muscle").notNull(), // main muscle targeted
  equipment: text("equipment"),
  movementPattern: text("movement_pattern"), // compound, isolation, unilateral, bilateral
  difficulty: text("difficulty").default("intermediate"), // beginner, intermediate, advanced
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  translations: jsonb("translations"), // multilingual names
  isBodyWeight: boolean("is_body_weight").default(false), // true for exercises using body weight only
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  programId: integer("program_id").references(() => trainingPrograms.id), // Made nullable
  mesocycleId: integer("mesocycle_id").references(() => mesocycles.id), // Link to mesocycles
  date: timestamp("date").notNull(),
  name: text("name").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  totalVolume: integer("total_volume").default(0),
  duration: integer("duration"), // minutes
  // V2 Enhancement fields
  version: text("version").notNull().default("1.0"), // "1.0" = Legacy, "2.0" = Enhanced
  features: jsonb("features"), // Feature flags: { spinnerSetInput: true, gestureNavigation: true }
  algorithm: text("algorithm"), // Load progression algorithm used
  actualFinishedAt: timestamp("actual_finished_at"), // Precise completion timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => workoutSessions.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  sets: integer("sets").notNull(),
  targetReps: text("target_reps").notNull(), // e.g., "8-12" or "10,10,8"
  actualReps: text("actual_reps"), // actual reps performed
  weight: decimal("weight", { precision: 6, scale: 2 }),
  rpe: integer("rpe"), // Rate of Perceived Exertion 1-10
  rir: integer("rir"), // Reps in Reserve 0-5
  restPeriod: integer("rest_period"), // seconds
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  setsData: jsonb("sets_data"), // Individual set completion states
  // V2 Enhancement fields
  targetRestSec: integer("target_rest_sec"), // Target rest period in seconds
  recommendedWeight: decimal("recommended_weight", { precision: 6, scale: 2 }), // AI recommended weight
  recommendedRpe: integer("recommended_rpe"), // AI recommended RPE
  weightUnit: text("weight_unit", { enum: ["kg", "lbs"] }).default("kg"), // Weight unit for this exercise
  finishedAt: timestamp("finished_at"), // Individual exercise completion time
  // Special Training Methods
  specialMethod: text("special_method", { enum: ["myorep_match", "myorep_no_match", "drop_set", "superset", "giant_set"] }),
  specialConfig: jsonb("special_config"), // Method-specific configuration
  linkedExercises: integer("linked_exercises").array(), // For supersets/giant sets
});

export const autoRegulationFeedback = pgTable("auto_regulation_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => workoutSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pumpQuality: integer("pump_quality").notNull(), // 1-10 scale
  muscleSoreness: integer("muscle_soreness").notNull(), // 1-10 scale
  perceivedEffort: integer("perceived_effort").notNull(), // 1-10 scale
  energyLevel: integer("energy_level").notNull(), // 1-10 scale
  sleepQuality: integer("sleep_quality").notNull(), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
});

export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Body Metrics table
export const bodyMetrics = pgTable("body_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  neck: decimal("neck", { precision: 5, scale: 2 }),
  chest: decimal("chest", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  hips: decimal("hips", { precision: 5, scale: 2 }),
  thigh: decimal("thigh", { precision: 5, scale: 2 }),
  bicep: decimal("bicep", { precision: 5, scale: 2 }),
  unit: text("unit", { enum: ["metric", "imperial"] }).notNull().default("metric"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved meal plans for Diet Builder
export const savedMealPlans = pgTable("saved_meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  foods: jsonb("foods").notNull(), // Array of food items with quantities
  totalCalories: decimal("total_calories", { precision: 8, scale: 2 }).notNull(),
  totalProtein: decimal("total_protein", { precision: 6, scale: 2 }).notNull(),
  totalCarbs: decimal("total_carbs", { precision: 6, scale: 2 }).notNull(),
  totalFat: decimal("total_fat", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Step 2: Volume Landmarks System - RP Training Tables

// Muscle Groups with Renaissance Periodization methodology
export const muscleGroups = pgTable("muscle_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // chest, back, shoulders, biceps, triceps, etc.
  category: text("category").notNull(), // push, pull, legs
  bodyPart: text("body_part").notNull(), // upper, lower
  priority: integer("priority").notNull().default(1), // 1=primary, 2=secondary for training split
  translations: jsonb("translations"), // multilingual names
});

// Volume Landmarks per muscle group per user (RP Methodology)
export const volumeLandmarks = pgTable("volume_landmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  muscleGroupId: integer("muscle_group_id").references(() => muscleGroups.id).notNull(),
  // Renaissance Periodization Volume Landmarks
  mv: integer("mv").notNull().default(0), // Maintenance Volume (sets/week)
  mev: integer("mev").notNull().default(8), // Minimum Effective Volume
  mav: integer("mav").notNull().default(16), // Maximum Adaptive Volume
  mrv: integer("mrv").notNull().default(22), // Maximum Recoverable Volume
  // Current volume tracking
  currentVolume: integer("current_volume").notNull().default(0), // sets this week
  targetVolume: integer("target_volume").notNull().default(12), // target sets this week
  // Auto-regulation factors
  recoveryLevel: integer("recovery_level").default(5), // 1-10 scale
  adaptationLevel: integer("adaptation_level").default(5), // 1-10 scale
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly volume tracking for progression
export const weeklyVolumeTracking = pgTable("weekly_volume_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  muscleGroupId: integer("muscle_group_id").references(() => muscleGroups.id).notNull(),
  weekNumber: integer("week_number").notNull(), // week of current mesocycle
  targetSets: integer("target_sets").notNull(),
  actualSets: integer("actual_sets").notNull().default(0),
  averageRpe: decimal("average_rpe", { precision: 3, scale: 1 }).default("5.0"),
  averageRir: decimal("average_rir", { precision: 3, scale: 1 }).default("2.0"),
  pumpQuality: integer("pump_quality").default(5), // 1-10
  soreness: integer("soreness").default(3), // 1-10
  isCompleted: boolean("is_completed").default(false),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercise to muscle group mapping with contribution percentages
export const exerciseMuscleMapping = pgTable("exercise_muscle_mapping", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  muscleGroupId: integer("muscle_group_id").references(() => muscleGroups.id).notNull(),
  contributionPercentage: integer("contribution_percentage").notNull().default(100), // 0-100%
  role: text("role").notNull().default("primary"), // primary, secondary, stabilizer
});

// Diet goals with TDEE calculation and auto-regulation
export const dietGoals = pgTable("diet_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tdee: decimal("tdee", { precision: 6, scale: 2 }).notNull(),
  goal: text("goal").notNull(), // cut, bulk, maintain
  targetCalories: decimal("target_calories", { precision: 6, scale: 2 }).notNull(),
  customTargetCalories: decimal("custom_target_calories", { precision: 6, scale: 2 }), // User-defined calories
  useCustomCalories: boolean("use_custom_calories").notNull().default(false), // Toggle for custom vs suggested
  targetProtein: decimal("target_protein", { precision: 6, scale: 2 }).notNull(),
  targetCarbs: decimal("target_carbs", { precision: 6, scale: 2 }).notNull(),
  targetFat: decimal("target_fat", { precision: 6, scale: 2 }).notNull(),
  autoRegulation: boolean("auto_regulation").notNull().default(true),
  weeklyWeightTarget: decimal("weekly_weight_target", { precision: 4, scale: 2 }), // kg per week
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Step 4: Training Templates System
export const trainingTemplates = pgTable("training_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Upper/Lower Split", "PPL", "Full Body"
  description: text("description"),
  category: text("category").notNull(), // beginner, intermediate, advanced
  daysPerWeek: integer("days_per_week").notNull(),
  specialization: text("specialization"), // chest, back, legs, arms, full_body
  templateData: jsonb("template_data").notNull(), // Exercise structure and rep ranges
  rpMethodology: jsonb("rp_methodology").notNull(), // Volume guidelines per muscle group
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by").default("system"), // system or user_id
  createdAt: timestamp("created_at").defaultNow(),
});

// Mesocycle management for periodization
export const mesocycles = pgTable("mesocycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  programId: integer("program_id").references(() => trainingPrograms.id),
  templateId: integer("template_id").references(() => trainingTemplates.id),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  currentWeek: integer("current_week").notNull().default(1),
  totalWeeks: integer("total_weeks").notNull().default(6),
  phase: text("phase").notNull().default("accumulation"), // accumulation, intensification, deload
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Load progression tracking
export const loadProgressionTracking = pgTable("load_progression_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  sessionId: integer("session_id").references(() => workoutSessions.id).notNull(),
  previousWeight: decimal("previous_weight", { precision: 6, scale: 2 }),
  currentWeight: decimal("current_weight", { precision: 6, scale: 2 }).notNull(),
  targetWeight: decimal("target_weight", { precision: 6, scale: 2 }),
  rpeAverage: decimal("rpe_average", { precision: 3, scale: 1 }),
  rirAverage: decimal("rir_average", { precision: 3, scale: 1 }),
  progressionType: text("progression_type").notNull(), // weight, reps, volume
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true });
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals).omit({ id: true, createdAt: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true, createdAt: true });
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({ id: true, createdAt: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertAutoRegulationFeedbackSchema = createInsertSchema(autoRegulationFeedback).omit({ id: true, createdAt: true });
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true, createdAt: true });

// Enhanced nutrition schema insert types
export const insertFoodCategorySchema = createInsertSchema(foodCategories).omit({ id: true });
export const insertFoodItemSchema = createInsertSchema(foodItems).omit({ id: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true, createdAt: true });
export const insertWeeklyNutritionGoalSchema = createInsertSchema(weeklyNutritionGoals).omit({ id: true, createdAt: true });
export const insertDailyWellnessCheckinSchema = createInsertSchema(dailyWellnessCheckins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWeeklyWellnessSummarySchema = createInsertSchema(weeklyWellnessSummaries).omit({ id: true, calculatedAt: true, createdAt: true });
export const insertDietPhaseSchema = createInsertSchema(dietPhases).omit({ id: true, createdAt: true });
export const insertMealTimingPreferenceSchema = createInsertSchema(mealTimingPreferences).omit({ id: true, updatedAt: true });
export const insertSavedMealSchema = createInsertSchema(savedMeals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBodyMetricSchema = createInsertSchema(bodyMetrics).omit({ id: true, createdAt: true });
export const insertSavedMealPlanSchema = createInsertSchema(savedMealPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDietGoalSchema = createInsertSchema(dietGoals).omit({ id: true, createdAt: true, updatedAt: true });

// Step 4: Advanced Training System Schemas
export const insertTrainingTemplateSchema = createInsertSchema(trainingTemplates).omit({ id: true, createdAt: true });
export const insertMesocycleSchema = createInsertSchema(mesocycles).omit({ id: true, createdAt: true });
export const insertLoadProgressionTrackingSchema = createInsertSchema(loadProgressionTracking).omit({ id: true, createdAt: true });

// Step 2: Volume Landmarks System Schemas
export const insertMuscleGroupSchema = createInsertSchema(muscleGroups).omit({ id: true });
export const insertVolumeLandmarkSchema = createInsertSchema(volumeLandmarks).omit({ id: true, lastUpdated: true, createdAt: true });
export const insertWeeklyVolumeTrackingSchema = createInsertSchema(weeklyVolumeTracking).omit({ id: true, createdAt: true });
export const insertExerciseMuscleMapping = createInsertSchema(exerciseMuscleMapping).omit({ id: true });
export const insertMealMacroDistributionSchema = createInsertSchema(mealMacroDistribution).omit({ id: true, createdAt: true });
export const insertMacroFlexibilityRuleSchema = createInsertSchema(macroFlexibilityRules).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type InsertNutritionGoal = z.infer<typeof insertNutritionGoalSchema>;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;
export type AutoRegulationFeedback = typeof autoRegulationFeedback.$inferSelect;
export type InsertAutoRegulationFeedback = z.infer<typeof insertAutoRegulationFeedbackSchema>;
export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;

// Enhanced nutrition types
export type FoodCategory = typeof foodCategories.$inferSelect;
export type InsertFoodCategory = z.infer<typeof insertFoodCategorySchema>;
export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type WeeklyNutritionGoal = typeof weeklyNutritionGoals.$inferSelect;
export type InsertWeeklyNutritionGoal = z.infer<typeof insertWeeklyNutritionGoalSchema>;
export type DailyWellnessCheckin = typeof dailyWellnessCheckins.$inferSelect;
export type InsertDailyWellnessCheckin = z.infer<typeof insertDailyWellnessCheckinSchema>;
export type WeeklyWellnessSummary = typeof weeklyWellnessSummaries.$inferSelect;
export type InsertWeeklyWellnessSummary = z.infer<typeof insertWeeklyWellnessSummarySchema>;
export type DietPhase = typeof dietPhases.$inferSelect;
export type InsertDietPhase = z.infer<typeof insertDietPhaseSchema>;
export type MealTimingPreference = typeof mealTimingPreferences.$inferSelect;
export type InsertMealTimingPreference = z.infer<typeof insertMealTimingPreferenceSchema>;
export type SavedMeal = typeof savedMeals.$inferSelect;
export type InsertSavedMeal = z.infer<typeof insertSavedMealSchema>;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type InsertBodyMetric = z.infer<typeof insertBodyMetricSchema>;
export type SavedMealPlan = typeof savedMealPlans.$inferSelect;
export type InsertSavedMealPlan = z.infer<typeof insertSavedMealPlanSchema>;
export type DietGoal = typeof dietGoals.$inferSelect;
export type InsertDietGoal = z.infer<typeof insertDietGoalSchema>;

// Step 4: Advanced Training System Types
export type TrainingTemplate = typeof trainingTemplates.$inferSelect;
export type InsertTrainingTemplate = z.infer<typeof insertTrainingTemplateSchema>;
export type Mesocycle = typeof mesocycles.$inferSelect;
export type InsertMesocycle = z.infer<typeof insertMesocycleSchema>;
export type LoadProgressionTracking = typeof loadProgressionTracking.$inferSelect;
export type InsertLoadProgressionTracking = z.infer<typeof insertLoadProgressionTrackingSchema>;

// Step 2: Volume Landmarks System Types
export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type InsertMuscleGroup = z.infer<typeof insertMuscleGroupSchema>;
export type VolumeLandmark = typeof volumeLandmarks.$inferSelect;
export type InsertVolumeLandmark = z.infer<typeof insertVolumeLandmarkSchema>;
export type WeeklyVolumeTracking = typeof weeklyVolumeTracking.$inferSelect;
export type InsertWeeklyVolumeTracking = z.infer<typeof insertWeeklyVolumeTrackingSchema>;
export type ExerciseMuscleMapping = typeof exerciseMuscleMapping.$inferSelect;
export type InsertExerciseMuscleMapping = z.infer<typeof insertExerciseMuscleMapping>;

// Special Training Methods Types
export interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

export interface MyorepConfig {
  activationSet: boolean;
  targetReps?: number; // For match sets
  restSeconds: number; // 20-30s for myoreps
  miniSets: WorkoutSet[];
}

export interface DropSetConfig {
  weightReductions: number[]; // Percentages to drop (e.g., [15, 15, 15])
  restSeconds: number; // 5-10s between drops
  sets: WorkoutSet[];
}

export interface GiantSetConfig {
  totalTargetReps: number; // At least 40 reps
  miniSetReps: number; // 5-10 reps per mini-set
  restSeconds: number; // 5-10s between mini-sets
  miniSets: WorkoutSet[];
}

export interface SupersetConfig {
  pairedExerciseId: number;
  restBetween: number; // 30-60s between exercises
  restAfter: number; // 2-3min after complete superset
}

export type SpecialMethodConfig = 
  | { type: 'myorep_match' | 'myorep_no_match'; config: MyorepConfig }
  | { type: 'drop_set'; config: DropSetConfig }
  | { type: 'giant_set'; config: GiantSetConfig }
  | { type: 'superset'; config: SupersetConfig };
