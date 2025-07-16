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
  createdAt: timestamp("created_at").defaultNow(),
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
