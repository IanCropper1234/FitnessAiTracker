import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  foodCategories, foodItems, mealPlans, weeklyNutritionGoals, dietPhases, mealTimingPreferences, bodyMetrics, savedMealPlans, savedMeals, dietGoals, weightGoals,
  muscleGroups, volumeLandmarks, weeklyVolumeTracking, exerciseMuscleMapping, mesocycles, trainingTemplates, savedWorkoutTemplates,
  type User, type InsertUser, type UpsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog,
  type FoodCategory, type InsertFoodCategory, type FoodItem, type InsertFoodItem,
  type MealPlan, type InsertMealPlan, type WeeklyNutritionGoal, type InsertWeeklyNutritionGoal,
  type DietPhase, type InsertDietPhase, type MealTimingPreference, type InsertMealTimingPreference,
  type BodyMetric, type InsertBodyMetric, type SavedMealPlan, type InsertSavedMealPlan, type SavedMeal, type InsertSavedMeal, type DietGoal, type InsertDietGoal,
  type WeightGoal, type InsertWeightGoal,
  type MuscleGroup, type InsertMuscleGroup, type VolumeLandmark, type InsertVolumeLandmark,
  type WeeklyVolumeTracking, type InsertWeeklyVolumeTracking, type ExerciseMuscleMapping, type InsertExerciseMuscleMapping,
  type TrainingTemplate, type InsertTrainingTemplate, type SavedWorkoutTemplate, type InsertSavedWorkoutTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, isNull, like, ilike, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Database access for external algorithms
  getDb() {
    return db;
  }
  // Users - Hybrid system supporting both integer and string IDs
  async getUser(id: string | number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    return user || undefined;
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: string | number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, Number(id)))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserDeveloperSettings(id: string | number, showDeveloperFeatures: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ showDeveloperFeatures })
      .where(eq(users.id, Number(id)))
      .returning();
    return updatedUser || undefined;
  }

  // User Profiles
  async getUserProfile(userId: string | number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, Number(userId)));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string | number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, Number(userId)))
      .returning();
    return updatedProfile || undefined;
  }

  // Nutrition Goals
  async getNutritionGoal(userId: string | number): Promise<NutritionGoal | undefined> {
    const [goal] = await db.select().from(nutritionGoals).where(eq(nutritionGoals.userId, Number(userId)));
    return goal || undefined;
  }

  async createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal> {
    const [newGoal] = await db
      .insert(nutritionGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateNutritionGoal(userId: string | number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined> {
    const [updatedGoal] = await db
      .update(nutritionGoals)
      .set(goal)
      .where(eq(nutritionGoals.userId, Number(userId)))
      .returning();
    return updatedGoal || undefined;
  }

  // Nutrition Logs
  async getNutritionLogs(userId: string | number | string, date?: Date): Promise<NutritionLog[]> {
    // Ensure userId is a number
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) {
      throw new Error('Invalid userId provided');
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db.select().from(nutritionLogs)
        .where(
          and(
            eq(nutritionLogs.userId, userIdNum),
            gte(nutritionLogs.date, startOfDay),
            lte(nutritionLogs.date, endOfDay)
          )
        )
        .orderBy(desc(nutritionLogs.date));
    }
    
    return await db.select().from(nutritionLogs)
      .where(eq(nutritionLogs.userId, userIdNum))
      .orderBy(desc(nutritionLogs.date));
  }

  async getNutritionLogById(id: number): Promise<NutritionLog | undefined> {
    const [log] = await db.select().from(nutritionLogs).where(eq(nutritionLogs.id, id));
    return log || undefined;
  }

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [newLog] = await db
      .insert(nutritionLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog | undefined> {
    const [updatedLog] = await db
      .update(nutritionLogs)
      .set(log)
      .where(eq(nutritionLogs.id, id))
      .returning();
    return updatedLog || undefined;
  }

  async deleteNutritionLog(id: number): Promise<boolean> {
    const result = await db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
    return result.rowCount > 0;
  }

  async getNutritionLogsInRange(userId: string | number, startDate: Date, endDate: Date): Promise<NutritionLog[]> {
    return await db.select().from(nutritionLogs)
      .where(and(
        eq(nutritionLogs.userId, Number(userId)),
        gte(nutritionLogs.date, startDate),
        lte(nutritionLogs.date, endDate)
      ))
      .orderBy(desc(nutritionLogs.date));
  }

  // Training Programs
  async getTrainingPrograms(userId: string | number): Promise<TrainingProgram[]> {
    return await db.select().from(trainingPrograms).where(eq(trainingPrograms.userId, Number(userId)));
  }

  async getActiveTrainingProgram(userId: string | number): Promise<TrainingProgram | undefined> {
    const [program] = await db.select().from(trainingPrograms)
      .where(and(eq(trainingPrograms.userId, Number(userId)), eq(trainingPrograms.isActive, true)));
    return program || undefined;
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const [newProgram] = await db
      .insert(trainingPrograms)
      .values(program)
      .returning();
    return newProgram;
  }

  async updateTrainingProgram(id: number, program: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined> {
    const [updatedProgram] = await db
      .update(trainingPrograms)
      .set(program)
      .where(eq(trainingPrograms.id, id))
      .returning();
    return updatedProgram || undefined;
  }

  // Exercises - returns both shared exercises (userId = null) and user-specific exercises
  async getExercises(userId?: number): Promise<Exercise[]> {
    if (userId) {
      // Return shared exercises (userId = null) and user's own exercises
      return await db.select().from(exercises)
        .where(sql`user_id IS NULL OR user_id = ${userId}`);
    } else {
      // Return all exercises (for admin/system use)
      return await db.select().from(exercises);
    }
  }

  async getExerciseByName(name: string, userId?: number): Promise<Exercise | undefined> {
    if (userId) {
      // Check for duplicate within user's scope (shared + own exercises)
      const [exercise] = await db.select()
        .from(exercises)
        .where(sql`LOWER(TRIM(${exercises.name})) = LOWER(TRIM(${name})) AND (user_id IS NULL OR user_id = ${userId})`)
        .limit(1);
      return exercise || undefined;
    } else {
      // Original behavior for system use
      const [exercise] = await db.select()
        .from(exercises)
        .where(sql`LOWER(TRIM(${exercises.name})) = LOWER(TRIM(${name}))`)
        .limit(1);
      return exercise || undefined;
    }
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.category, category));
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    // Check for duplicates within user's scope (shared + own exercises)
    const existingExercise = await this.getExerciseByName(exercise.name, exercise.userId);
    if (existingExercise) {
      throw new Error(`Exercise with name "${exercise.name}" already exists`);
    }
    
    const [newExercise] = await db
      .insert(exercises)
      .values(exercise)
      .returning();
    return newExercise;
  }

  async updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const [updatedExercise] = await db
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, id))
      .returning();
    return updatedExercise || undefined;
  }

  async deleteExercise(id: number): Promise<boolean> {
    const result = await db.delete(exercises).where(eq(exercises.id, id));
    return result.rowCount > 0;
  }

  // Workout Sessions
  async getWorkoutSessions(userId: string | number, date?: Date): Promise<WorkoutSession[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db.select().from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, Number(userId)),
            gte(workoutSessions.date, startOfDay),
            lte(workoutSessions.date, endOfDay)
          )
        )
        .orderBy(desc(workoutSessions.date));
    }
    
    return await db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, Number(userId)))
      .orderBy(desc(workoutSessions.date));
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session || undefined;
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const [newSession] = await db
      .insert(workoutSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateWorkoutSession(id: number, session: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const [updatedSession] = await db
      .update(workoutSessions)
      .set(session)
      .where(eq(workoutSessions.id, id))
      .returning();
    return updatedSession || undefined;
  }

  // Workout Exercises
  async getWorkoutExercises(sessionId: number): Promise<WorkoutExercise[]> {
    // Getting workout exercises for session
    const result = await db.select().from(workoutExercises).where(eq(workoutExercises.sessionId, sessionId));
    // Found workout exercises for session
    return result;
  }

  async createWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newExercise] = await db
      .insert(workoutExercises)
      .values(exercise)
      .returning();
    return newExercise;
  }

  async deleteWorkoutSession(id: number): Promise<boolean> {
    try {
      console.log(`Attempting to delete workout session ${id}`);
      
      // First delete related workout exercises
      console.log('Deleting workout exercises...');
      await db.delete(workoutExercises).where(eq(workoutExercises.sessionId, id));
      
      // Delete any auto-regulation feedback related to this session
      console.log('Deleting auto-regulation feedback...');
      await db.delete(autoRegulationFeedback).where(eq(autoRegulationFeedback.sessionId, id));
      
      // Finally delete the workout session
      console.log('Deleting workout session...');
      const result = await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
      console.log(`Delete result: ${result.rowCount} rows affected`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting workout session:', error);
      return false;
    }
  }

  async resetWorkoutSessionProgress(sessionId: number): Promise<void> {
    await db
      .update(workoutExercises)
      .set({
        actualReps: null,
        weight: null,
        rpe: null,
        rir: null,
        notes: null,
        isCompleted: false
      })
      .where(eq(workoutExercises.sessionId, sessionId));
  }

  // Auto-Regulation Feedback
  async getAutoRegulationFeedback(sessionId: number): Promise<AutoRegulationFeedback | undefined> {
    const [feedback] = await db.select().from(autoRegulationFeedback)
      .where(eq(autoRegulationFeedback.sessionId, sessionId));
    return feedback || undefined;
  }

  async createAutoRegulationFeedback(feedback: InsertAutoRegulationFeedback): Promise<AutoRegulationFeedback> {
    const [newFeedback] = await db
      .insert(autoRegulationFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  // Step 2: Volume Landmarks System

  // Muscle Groups
  async getMuscleGroups(): Promise<MuscleGroup[]> {
    return await db.select().from(muscleGroups);
  }

  async getMuscleGroup(id: number): Promise<MuscleGroup | undefined> {
    const [muscleGroup] = await db.select().from(muscleGroups).where(eq(muscleGroups.id, id));
    return muscleGroup || undefined;
  }

  async createMuscleGroup(muscleGroup: InsertMuscleGroup): Promise<MuscleGroup> {
    const [newMuscleGroup] = await db
      .insert(muscleGroups)
      .values(muscleGroup)
      .returning();
    return newMuscleGroup;
  }

  // Volume Landmarks
  async getVolumeLandmarks(userId: string | number): Promise<VolumeLandmark[]> {
    return await db.select({
      id: volumeLandmarks.id,
      userId: volumeLandmarks.userId,
      muscleGroupId: volumeLandmarks.muscleGroupId,
      mv: volumeLandmarks.mv,
      mev: volumeLandmarks.mev,
      mav: volumeLandmarks.mav,
      mrv: volumeLandmarks.mrv,
      currentVolume: volumeLandmarks.currentVolume,
      targetVolume: volumeLandmarks.targetVolume,
      recoveryLevel: volumeLandmarks.recoveryLevel,
      adaptationLevel: volumeLandmarks.adaptationLevel,
      lastUpdated: volumeLandmarks.lastUpdated,
      createdAt: volumeLandmarks.createdAt,
      muscleGroup: {
        id: muscleGroups.id,
        name: muscleGroups.name,
        category: muscleGroups.category,
        bodyPart: muscleGroups.bodyPart,
        priority: muscleGroups.priority,
        translations: muscleGroups.translations
      }
    })
    .from(volumeLandmarks)
    .leftJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
    .where(eq(volumeLandmarks.userId, Number(userId)));
  }

  async getVolumeLandmark(userId: string | number, muscleGroupId: number): Promise<VolumeLandmark | undefined> {
    const [landmark] = await db.select().from(volumeLandmarks)
      .where(and(eq(volumeLandmarks.userId, Number(userId)), eq(volumeLandmarks.muscleGroupId, muscleGroupId)));
    return landmark || undefined;
  }

  async createVolumeLandmark(landmark: InsertVolumeLandmark): Promise<VolumeLandmark> {
    const [newLandmark] = await db
      .insert(volumeLandmarks)
      .values(landmark)
      .returning();
    return newLandmark;
  }

  async updateVolumeLandmark(userId: string | number, muscleGroupId: number, landmark: Partial<InsertVolumeLandmark>): Promise<VolumeLandmark | undefined> {
    const [updatedLandmark] = await db
      .update(volumeLandmarks)
      .set({ ...landmark, lastUpdated: new Date() })
      .where(and(eq(volumeLandmarks.userId, Number(userId)), eq(volumeLandmarks.muscleGroupId, muscleGroupId)))
      .returning();
    return updatedLandmark || undefined;
  }

  // Weekly Volume Tracking
  async getWeeklyVolumeTracking(userId: string | number): Promise<WeeklyVolumeTracking[]> {
    return await db.select().from(weeklyVolumeTracking)
      .where(eq(weeklyVolumeTracking.userId, Number(userId)))
      .orderBy(desc(weeklyVolumeTracking.startDate));
  }

  async createWeeklyVolumeTracking(tracking: InsertWeeklyVolumeTracking): Promise<WeeklyVolumeTracking> {
    const [newTracking] = await db
      .insert(weeklyVolumeTracking)
      .values(tracking)
      .returning();
    return newTracking;
  }

  async updateWeeklyVolumeTracking(id: number, tracking: Partial<InsertWeeklyVolumeTracking>): Promise<WeeklyVolumeTracking | undefined> {
    const [updatedTracking] = await db
      .update(weeklyVolumeTracking)
      .set(tracking)
      .where(eq(weeklyVolumeTracking.id, id))
      .returning();
    return updatedTracking || undefined;
  }

  // Exercise Muscle Mapping
  async getExerciseMuscleMapping(exerciseId: number): Promise<ExerciseMuscleMapping[]> {
    return await db.select().from(exerciseMuscleMapping)
      .where(eq(exerciseMuscleMapping.exerciseId, exerciseId));
  }

  async createExerciseMuscleMapping(mapping: InsertExerciseMuscleMapping): Promise<ExerciseMuscleMapping> {
    const [newMapping] = await db
      .insert(exerciseMuscleMapping)
      .values(mapping)
      .returning();
    return newMapping;
  }

  // Weight Logs
  async getWeightLogs(userId: string | number): Promise<WeightLog[]> {
    return await db.select().from(weightLogs).where(eq(weightLogs.userId, Number(userId)));
  }

  async createWeightLog(log: InsertWeightLog): Promise<WeightLog> {
    const [newLog] = await db
      .insert(weightLogs)
      .values(log)
      .returning();
    return newLog;
  }

  // Enhanced Nutrition Features
  // Food Categories & Items
  async getFoodCategories(): Promise<FoodCategory[]> {
    return await db.select().from(foodCategories);
  }

  async getFoodCategoriesByMacroType(macroType: string): Promise<FoodCategory[]> {
    return await db.select().from(foodCategories).where(eq(foodCategories.macroType, macroType));
  }

  async createFoodCategory(category: InsertFoodCategory): Promise<FoodCategory> {
    const [newCategory] = await db
      .insert(foodCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItemsByCategory(categoryId: number): Promise<FoodItem[]> {
    return await db.select().from(foodItems).where(eq(foodItems.categoryId, categoryId));
  }

  async searchFoodItems(query: string): Promise<FoodItem[]> {
    return await db.select().from(foodItems)
      .where(ilike(foodItems.name, `%${query}%`));
  }

  async getFoodItemByBarcode(barcode: string): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.barcode, barcode));
    return item || undefined;
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const [newItem] = await db
      .insert(foodItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Meal Planning
  async getMealPlans(userId: string | number, date: Date): Promise<MealPlan[]> {
    // For now, just return all meal plans for the user to test basic functionality
    return await db.select().from(mealPlans)
      .where(eq(mealPlans.userId, Number(userId)))
      .orderBy(mealPlans.mealNumber);
  }

  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const [newPlan] = await db
      .insert(mealPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateMealPlan(id: number, plan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const [updatedPlan] = await db
      .update(mealPlans)
      .set(plan)
      .where(eq(mealPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    const result = await db.delete(mealPlans).where(eq(mealPlans.id, id));
    return result.rowCount > 0;
  }

  // Weekly Nutrition Goals
  async getWeeklyNutritionGoal(userId: string | number, weekStartDate: Date): Promise<WeeklyNutritionGoal | undefined> {
    const [goal] = await db.select().from(weeklyNutritionGoals)
      .where(and(
        eq(weeklyNutritionGoals.userId, Number(userId)),
        eq(weeklyNutritionGoals.weekStartDate, weekStartDate)
      ));
    return goal || undefined;
  }

  async getCurrentWeeklyNutritionGoal(userId: string | number): Promise<WeeklyNutritionGoal | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return await this.getWeeklyNutritionGoal(userId, startOfWeek);
  }

  async createWeeklyNutritionGoal(goal: InsertWeeklyNutritionGoal): Promise<WeeklyNutritionGoal> {
    const [newGoal] = await db
      .insert(weeklyNutritionGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateWeeklyNutritionGoal(id: number, goal: Partial<InsertWeeklyNutritionGoal>): Promise<WeeklyNutritionGoal | undefined> {
    const [updatedGoal] = await db
      .update(weeklyNutritionGoals)
      .set(goal)
      .where(eq(weeklyNutritionGoals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  // Diet Phases
  async getActiveDietPhase(userId: string | number): Promise<DietPhase | undefined> {
    const [phase] = await db.select().from(dietPhases)
      .where(and(
        eq(dietPhases.userId, Number(userId)),
        eq(dietPhases.isActive, true)
      ));
    return phase || undefined;
  }

  async getDietPhases(userId: string | number): Promise<DietPhase[]> {
    return await db.select().from(dietPhases)
      .where(eq(dietPhases.userId, Number(userId)))
      .orderBy(desc(dietPhases.createdAt));
  }

  async createDietPhase(phase: InsertDietPhase): Promise<DietPhase> {
    const [newPhase] = await db
      .insert(dietPhases)
      .values(phase)
      .returning();
    return newPhase;
  }

  async updateDietPhase(id: number, phase: Partial<InsertDietPhase>): Promise<DietPhase | undefined> {
    const [updatedPhase] = await db
      .update(dietPhases)
      .set(phase)
      .where(eq(dietPhases.id, id))
      .returning();
    return updatedPhase || undefined;
  }

  // Meal Timing Preferences
  async getMealTimingPreferences(userId: string | number): Promise<MealTimingPreference | undefined> {
    const [preferences] = await db.select().from(mealTimingPreferences)
      .where(eq(mealTimingPreferences.userId, Number(userId)));
    return preferences || undefined;
  }

  async createMealTimingPreferences(preferences: InsertMealTimingPreference): Promise<MealTimingPreference> {
    const [newPreferences] = await db
      .insert(mealTimingPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateMealTimingPreferences(userId: string | number, preferences: Partial<InsertMealTimingPreference>): Promise<MealTimingPreference | undefined> {
    const [updatedPreferences] = await db
      .update(mealTimingPreferences)
      .set(preferences)
      .where(eq(mealTimingPreferences.userId, Number(userId)))
      .returning();
    return updatedPreferences || undefined;
  }

  // Body Metrics
  async getBodyMetrics(userId: string | number, date?: Date): Promise<BodyMetric[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db.select().from(bodyMetrics)
        .where(
          and(
            eq(bodyMetrics.userId, Number(userId)),
            gte(bodyMetrics.date, startOfDay),
            lte(bodyMetrics.date, endOfDay)
          )
        )
        .orderBy(desc(bodyMetrics.date));
    }
    
    return await db.select().from(bodyMetrics)
      .where(eq(bodyMetrics.userId, Number(userId)))
      .orderBy(desc(bodyMetrics.date));
  }

  async createBodyMetric(metric: InsertBodyMetric): Promise<BodyMetric> {
    const [newMetric] = await db
      .insert(bodyMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async deleteBodyMetric(id: number): Promise<boolean> {
    const result = await db.delete(bodyMetrics).where(eq(bodyMetrics.id, id));
    return result.rowCount > 0;
  }

  // Weight Goals
  async getWeightGoals(userId: string | number): Promise<WeightGoal[]> {
    return await db.select().from(weightGoals)
      .where(eq(weightGoals.userId, Number(userId)))
      .orderBy(desc(weightGoals.createdAt));
  }

  async getActiveWeightGoal(userId: string | number): Promise<WeightGoal | undefined> {
    const [goal] = await db.select().from(weightGoals)
      .where(and(eq(weightGoals.userId, Number(userId)), eq(weightGoals.isActive, true)))
      .orderBy(desc(weightGoals.createdAt));
    return goal || undefined;
  }

  async createWeightGoal(goal: InsertWeightGoal): Promise<WeightGoal> {
    // First, deactivate any existing active goals for this user
    await db.update(weightGoals)
      .set({ isActive: false })
      .where(and(eq(weightGoals.userId, goal.userId), eq(weightGoals.isActive, true)));

    // Create the new goal with isActive = true
    const [newGoal] = await db
      .insert(weightGoals)
      .values({ ...goal, isActive: true })
      .returning();
    return newGoal;
  }

  async updateWeightGoal(id: number, goal: Partial<InsertWeightGoal>): Promise<WeightGoal | undefined> {
    const [updatedGoal] = await db
      .update(weightGoals)
      .set({ ...goal, updatedAt: new Date() })
      .where(eq(weightGoals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteWeightGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(weightGoals)
      .where(eq(weightGoals.id, id))
      .returning();
    return result.length > 0;
  }

  // Nutrition Progression
  async getNutritionProgression(userId: string | number, startDate: Date, endDate: Date): Promise<any[]> {
    const logs = await db.select().from(nutritionLogs)
      .where(and(
        eq(nutritionLogs.userId, Number(userId)),
        gte(nutritionLogs.date, startDate),
        lte(nutritionLogs.date, endDate)
      ))
      .orderBy(nutritionLogs.date);

    // Group by date and sum macros
    const dailyData = logs.reduce((acc: any, log: any) => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }
      acc[dateKey].calories += Number(log.calories) || 0;
      acc[dateKey].protein += Number(log.protein) || 0;
      acc[dateKey].carbs += Number(log.carbs) || 0;
      acc[dateKey].fat += Number(log.fat) || 0;
      return acc;
    }, {});

    return Object.values(dailyData);
  }

  // Saved Meal Plans
  async getSavedMealPlans(userId: string | number): Promise<SavedMealPlan[]> {
    return await db.select().from(savedMealPlans)
      .where(eq(savedMealPlans.userId, Number(userId)))
      .orderBy(desc(savedMealPlans.createdAt));
  }

  async getSavedMealPlan(userId: string | number, planId: number): Promise<SavedMealPlan | undefined> {
    const [mealPlan] = await db.select().from(savedMealPlans)
      .where(and(
        eq(savedMealPlans.userId, Number(userId)),
        eq(savedMealPlans.id, planId)
      ));
    return mealPlan || undefined;
  }

  async getSavedMealPlansByType(userId: string | number, mealType: string): Promise<SavedMealPlan[]> {
    return await db.select().from(savedMealPlans)
      .where(and(
        eq(savedMealPlans.userId, Number(userId)),
        eq(savedMealPlans.mealType, mealType)
      ))
      .orderBy(desc(savedMealPlans.createdAt));
  }

  async createSavedMealPlan(mealPlan: InsertSavedMealPlan): Promise<SavedMealPlan> {
    const [newMealPlan] = await db
      .insert(savedMealPlans)
      .values(mealPlan)
      .returning();
    return newMealPlan;
  }

  async updateSavedMealPlan(id: number, mealPlan: Partial<InsertSavedMealPlan>): Promise<SavedMealPlan | undefined> {
    const [updatedMealPlan] = await db
      .update(savedMealPlans)
      .set({ ...mealPlan, updatedAt: new Date() })
      .where(eq(savedMealPlans.id, id))
      .returning();
    return updatedMealPlan || undefined;
  }

  async deleteSavedMealPlan(id: number): Promise<boolean> {
    const result = await db.delete(savedMealPlans).where(eq(savedMealPlans.id, id));
    return result.rowCount > 0;
  }

  // Diet Goals
  async getDietGoal(userId: string | number): Promise<DietGoal | undefined> {
    const [goal] = await db.select().from(dietGoals)
      .where(eq(dietGoals.userId, Number(userId)))
      .orderBy(desc(dietGoals.createdAt));
    return goal || undefined;
  }

  async createDietGoal(goal: InsertDietGoal): Promise<DietGoal> {
    const [newGoal] = await db
      .insert(dietGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateDietGoal(userId: string | number, goal: Partial<InsertDietGoal>): Promise<DietGoal | undefined> {
    console.log('Updating diet goal for user:', userId, 'with data:', goal);
    // First check if a diet goal exists for this user
    const existingGoal = await this.getDietGoal(userId);
    
    if (existingGoal) {
      // Clean the goal data to ensure proper types
      const cleanGoal = { ...goal };
      delete (cleanGoal as any).updatedAt; // Remove any existing updatedAt to prevent type errors
      
      console.log('Existing goal before update:', existingGoal);
      console.log('Clean goal data to update:', cleanGoal);
      
      // Update the existing goal
      const [updatedGoal] = await db
        .update(dietGoals)
        .set({ ...cleanGoal, updatedAt: new Date() })
        .where(eq(dietGoals.id, existingGoal.id))
        .returning();
      
      console.log('Updated goal result:', updatedGoal);
      return updatedGoal || undefined;
    } else {
      // Create a new goal if none exists
      return await this.createDietGoal({ userId, ...goal } as InsertDietGoal);
    }
  }

  // Workout Sessions
  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const [created] = await db.insert(workoutSessions).values(session).returning();
    return created;
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session || undefined;
  }

  async getUserWorkoutSessions(userId: string | number): Promise<WorkoutSession[]> {
    return db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, Number(userId)))
      .orderBy(desc(workoutSessions.date));
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const [updated] = await db.update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkoutSession(id: number): Promise<boolean> {
    try {
      console.log('Deleting workout session with ID:', id, 'Type:', typeof id);
      
      if (isNaN(id) || id <= 0) {
        console.error('Invalid session ID:', id);
        return false;
      }
      
      // First delete related workout exercises
      const exercisesResult = await db.delete(workoutExercises).where(eq(workoutExercises.sessionId, id));
      console.log('Deleted exercises:', exercisesResult.rowCount);
      
      // Delete any auto-regulation feedback related to this session
      const feedbackResult = await db.delete(autoRegulationFeedback).where(eq(autoRegulationFeedback.sessionId, id));
      console.log('Deleted feedback:', feedbackResult.rowCount);
      
      // Finally delete the workout session
      const sessionResult = await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
      console.log('Deleted session:', sessionResult.rowCount);
      
      return sessionResult.rowCount > 0;
    } catch (error) {
      console.error('Error deleting workout session:', error);
      return false;
    }
  }

  // Workout Exercises
  async createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [created] = await db.insert(workoutExercises).values(workoutExercise).returning();
    return created;
  }

  async getWorkoutExercises(sessionId: number): Promise<WorkoutExercise[]> {
    return db.select().from(workoutExercises)
      .where(eq(workoutExercises.sessionId, sessionId))
      .orderBy(workoutExercises.orderIndex);
  }

  async updateWorkoutExercise(id: number, updates: Partial<InsertWorkoutExercise>): Promise<WorkoutExercise | undefined> {
    // Updating workout exercise in database
    const [updated] = await db.update(workoutExercises)
      .set(updates)
      .where(eq(workoutExercises.id, id))
      .returning();
    // Workout exercise updated successfully
    return updated || undefined;
  }

  async deleteWorkoutExercise(id: number): Promise<boolean> {
    const result = await db.delete(workoutExercises).where(eq(workoutExercises.id, id));
    return result.rowCount > 0;
  }

  // Mesocycle Management
  async getMesocycle(id: number): Promise<any | undefined> {
    const [mesocycle] = await db.select().from(mesocycles).where(eq(mesocycles.id, id));
    return mesocycle || undefined;
  }

  async getUserMesocycles(userId: string | number): Promise<any[]> {
    return db.select().from(mesocycles)
      .where(eq(mesocycles.userId, Number(userId)))
      .orderBy(desc(mesocycles.isActive), desc(mesocycles.createdAt));
  }

  // Training Templates
  async getTrainingTemplate(templateId: number): Promise<TrainingTemplate | undefined> {
    const [template] = await db.select().from(trainingTemplates).where(eq(trainingTemplates.id, templateId));
    return template || undefined;
  }

  async getUserTrainingTemplates(userId: string | number): Promise<TrainingTemplate[]> {
    return db.select().from(trainingTemplates)
      .where(eq(trainingTemplates.createdBy, userId))
      .orderBy(desc(trainingTemplates.createdAt));
  }

  async createTrainingTemplate(template: InsertTrainingTemplate): Promise<TrainingTemplate> {
    const [created] = await db.insert(trainingTemplates).values(template).returning();
    return created;
  }

  async updateTrainingTemplate(templateId: number, updates: Partial<InsertTrainingTemplate>): Promise<TrainingTemplate | undefined> {
    const [updated] = await db.update(trainingTemplates)
      .set(updates)
      .where(eq(trainingTemplates.id, templateId))
      .returning();
    return updated || undefined;
  }

  async deleteTrainingTemplate(templateId: number): Promise<boolean> {
    const result = await db.delete(trainingTemplates).where(eq(trainingTemplates.id, templateId));
    return result.rowCount > 0;
  }

  // Saved Meals
  async getSavedMeals(userId: string | number): Promise<SavedMeal[]> {
    return db.select().from(savedMeals)
      .where(eq(savedMeals.userId, Number(userId)))
      .orderBy(desc(savedMeals.createdAt));
  }

  async createSavedMeal(meal: InsertSavedMeal): Promise<SavedMeal> {
    const [created] = await db.insert(savedMeals).values(meal).returning();
    return created;
  }

  async deleteSavedMeal(id: number): Promise<boolean> {
    const result = await db.delete(savedMeals).where(eq(savedMeals.id, id));
    return result.rowCount > 0;
  }

  // Saved Workout Templates
  async getSavedWorkoutTemplates(userId: string | number): Promise<SavedWorkoutTemplate[]> {
    return db.select().from(savedWorkoutTemplates)
      .where(eq(savedWorkoutTemplates.userId, Number(userId)))
      .orderBy(desc(savedWorkoutTemplates.createdAt));
  }

  async getSavedWorkoutTemplate(templateId: number): Promise<SavedWorkoutTemplate | undefined> {
    const [template] = await db.select().from(savedWorkoutTemplates)
      .where(eq(savedWorkoutTemplates.id, templateId));
    return template || undefined;
  }

  async createSavedWorkoutTemplate(template: InsertSavedWorkoutTemplate): Promise<SavedWorkoutTemplate> {
    const [created] = await db.insert(savedWorkoutTemplates).values(template).returning();
    return created;
  }

  async updateSavedWorkoutTemplate(id: number, template: Partial<InsertSavedWorkoutTemplate>): Promise<SavedWorkoutTemplate | undefined> {
    const [updated] = await db.update(savedWorkoutTemplates)
      .set(template)
      .where(eq(savedWorkoutTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSavedWorkoutTemplate(id: number): Promise<boolean> {
    const result = await db.delete(savedWorkoutTemplates).where(eq(savedWorkoutTemplates.id, id));
    return result.rowCount > 0;
  }
}

// Export singleton instance for use in other modules
export const storage = new DatabaseStorage();