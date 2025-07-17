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
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
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
  equipment: text("equipment"),
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  translations: jsonb("translations"), // multilingual names
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  programId: integer("program_id").references(() => trainingPrograms.id).notNull(),
  date: timestamp("date").notNull(),
  name: text("name").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  totalVolume: integer("total_volume").default(0),
  duration: integer("duration"), // minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => workoutSessions.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // e.g., "8-12" or "10,10,8"
  weight: decimal("weight", { precision: 6, scale: 2 }),
  restPeriod: integer("rest_period"), // seconds
  notes: text("notes"),
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

// Meal Plans table for saved meal templates
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  totalCalories: decimal("total_calories", { precision: 8, scale: 2 }).notNull(),
  totalProtein: decimal("total_protein", { precision: 6, scale: 2 }).notNull(),
  totalCarbs: decimal("total_carbs", { precision: 6, scale: 2 }).notNull(),
  totalFat: decimal("total_fat", { precision: 6, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meal Plan Foods table for foods in each meal plan
export const mealPlanFoods = pgTable("meal_plan_foods", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id).notNull(),
  foodName: text("food_name").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  calories: decimal("calories", { precision: 8, scale: 2 }).notNull(),
  protein: decimal("protein", { precision: 6, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 6, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 6, scale: 2 }).notNull(),
  orderIndex: integer("order_index").default(0),
});

// Enhanced Diet Goals with TDEE calculation and auto-regulation
export const dietGoals = pgTable("diet_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  goalType: text("goal_type").notNull(), // fat_loss, muscle_gain, maintenance, recomp
  currentWeight: decimal("current_weight", { precision: 5, scale: 2 }).notNull(),
  targetWeight: decimal("target_weight", { precision: 5, scale: 2 }),
  currentBodyFat: decimal("current_body_fat", { precision: 4, scale: 2 }),
  targetBodyFat: decimal("target_body_fat", { precision: 4, scale: 2 }),
  activityLevel: text("activity_level").notNull(), // sedentary, light, moderate, active, very_active
  tdee: integer("tdee").notNull(), // Total Daily Energy Expenditure
  targetCalories: integer("target_calories").notNull(),
  targetProtein: decimal("target_protein", { precision: 6, scale: 2 }).notNull(),
  targetCarbs: decimal("target_carbs", { precision: 6, scale: 2 }).notNull(),
  targetFat: decimal("target_fat", { precision: 6, scale: 2 }).notNull(),
  autoRegulation: boolean("auto_regulation").notNull().default(true),
  weeklyWeightChangeTarget: decimal("weekly_weight_change_target", { precision: 4, scale: 2 }).default(0), // kg per week
  lastAdjustment: timestamp("last_adjustment"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true });
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals).omit({ id: true, createdAt: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true, createdAt: true });
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({ id: true, createdAt: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMealPlanFoodSchema = createInsertSchema(mealPlanFoods).omit({ id: true });
export const insertDietGoalSchema = createInsertSchema(dietGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBodyMetricsSchema = createInsertSchema(bodyMetrics).omit({ id: true, createdAt: true });
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export const insertAutoRegulationFeedbackSchema = createInsertSchema(autoRegulationFeedback).omit({ id: true, createdAt: true });
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true, createdAt: true });

// Enhanced nutrition schema insert types
export const insertFoodCategorySchema = createInsertSchema(foodCategories).omit({ id: true });
export const insertFoodItemSchema = createInsertSchema(foodItems).omit({ id: true });
export const insertWeeklyNutritionGoalSchema = createInsertSchema(weeklyNutritionGoals).omit({ id: true, createdAt: true });
export const insertDietPhaseSchema = createInsertSchema(dietPhases).omit({ id: true, createdAt: true });
export const insertMealTimingPreferenceSchema = createInsertSchema(mealTimingPreferences).omit({ id: true, updatedAt: true });

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
export type DietPhase = typeof dietPhases.$inferSelect;
export type InsertDietPhase = z.infer<typeof insertDietPhaseSchema>;
export type MealTimingPreference = typeof mealTimingPreferences.$inferSelect;
export type InsertMealTimingPreference = z.infer<typeof insertMealTimingPreferenceSchema>;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type InsertBodyMetric = z.infer<typeof insertBodyMetricSchema>;
export type MealPlanFood = typeof mealPlanFoods.$inferSelect;
export type InsertMealPlanFood = z.infer<typeof insertMealPlanFoodSchema>;
export type DietGoal = typeof dietGoals.$inferSelect;
export type InsertDietGoal = z.infer<typeof insertDietGoalSchema>;
