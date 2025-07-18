import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  foodCategories, foodItems, mealPlans, weeklyNutritionGoals, dietPhases, mealTimingPreferences, bodyMetrics, savedMealPlans, dietGoals,
  muscleGroups, volumeLandmarks, weeklyVolumeTracking, exerciseMuscleMapping,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog,
  type FoodCategory, type InsertFoodCategory, type FoodItem, type InsertFoodItem,
  type MealPlan, type InsertMealPlan, type WeeklyNutritionGoal, type InsertWeeklyNutritionGoal,
  type DietPhase, type InsertDietPhase, type MealTimingPreference, type InsertMealTimingPreference,
  type BodyMetric, type InsertBodyMetric, type SavedMealPlan, type InsertSavedMealPlan, type DietGoal, type InsertDietGoal,
  type MuscleGroup, type InsertMuscleGroup, type VolumeLandmark, type InsertVolumeLandmark,
  type WeeklyVolumeTracking, type InsertWeeklyVolumeTracking, type ExerciseMuscleMapping, type InsertExerciseMuscleMapping
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, isNull, like, ilike, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
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

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // User Profiles
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile || undefined;
  }

  // Nutrition Goals
  async getNutritionGoal(userId: number): Promise<NutritionGoal | undefined> {
    const [goal] = await db.select().from(nutritionGoals).where(eq(nutritionGoals.userId, userId));
    return goal || undefined;
  }

  async createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal> {
    const [newGoal] = await db
      .insert(nutritionGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateNutritionGoal(userId: number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined> {
    const [updatedGoal] = await db
      .update(nutritionGoals)
      .set(goal)
      .where(eq(nutritionGoals.userId, userId))
      .returning();
    return updatedGoal || undefined;
  }

  // Nutrition Logs
  async getNutritionLogs(userId: number, date?: Date): Promise<NutritionLog[]> {
    let query = db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          eq(nutritionLogs.userId, userId),
          // Note: You might need to adjust this date filtering based on your DB setup
        )
      );
    }
    
    return await query;
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

  async getNutritionLogsInRange(userId: number, startDate: Date, endDate: Date): Promise<NutritionLog[]> {
    return await db.select().from(nutritionLogs)
      .where(and(
        eq(nutritionLogs.userId, userId),
        gte(nutritionLogs.date, startDate),
        lte(nutritionLogs.date, endDate)
      ))
      .orderBy(desc(nutritionLogs.date));
  }

  // Training Programs
  async getTrainingPrograms(userId: number): Promise<TrainingProgram[]> {
    return await db.select().from(trainingPrograms).where(eq(trainingPrograms.userId, userId));
  }

  async getActiveTrainingProgram(userId: number): Promise<TrainingProgram | undefined> {
    const [program] = await db.select().from(trainingPrograms)
      .where(and(eq(trainingPrograms.userId, userId), eq(trainingPrograms.isActive, true)));
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

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await db.select().from(exercises).where(eq(exercises.category, category));
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
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
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
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
    console.log(`Getting workout exercises for session ${sessionId}`);
    const result = await db.select().from(workoutExercises).where(eq(workoutExercises.sessionId, sessionId));
    console.log(`Found ${result.length} workout exercises for session ${sessionId}`);
    return result;
  }

  async createWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newExercise] = await db
      .insert(workoutExercises)
      .values(exercise)
      .returning();
    return newExercise;
  }

  async updateWorkoutExercise(id: number, exercise: Partial<InsertWorkoutExercise>): Promise<WorkoutExercise | undefined> {
    const [updatedExercise] = await db
      .update(workoutExercises)
      .set(exercise)
      .where(eq(workoutExercises.id, id))
      .returning();
    return updatedExercise || undefined;
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
  async getVolumeLandmarks(userId: number): Promise<VolumeLandmark[]> {
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
    .where(eq(volumeLandmarks.userId, userId));
  }

  async getVolumeLandmark(userId: number, muscleGroupId: number): Promise<VolumeLandmark | undefined> {
    const [landmark] = await db.select().from(volumeLandmarks)
      .where(and(eq(volumeLandmarks.userId, userId), eq(volumeLandmarks.muscleGroupId, muscleGroupId)));
    return landmark || undefined;
  }

  async createVolumeLandmark(landmark: InsertVolumeLandmark): Promise<VolumeLandmark> {
    const [newLandmark] = await db
      .insert(volumeLandmarks)
      .values(landmark)
      .returning();
    return newLandmark;
  }

  async updateVolumeLandmark(userId: number, muscleGroupId: number, landmark: Partial<InsertVolumeLandmark>): Promise<VolumeLandmark | undefined> {
    const [updatedLandmark] = await db
      .update(volumeLandmarks)
      .set({ ...landmark, lastUpdated: new Date() })
      .where(and(eq(volumeLandmarks.userId, userId), eq(volumeLandmarks.muscleGroupId, muscleGroupId)))
      .returning();
    return updatedLandmark || undefined;
  }

  // Weekly Volume Tracking
  async getWeeklyVolumeTracking(userId: number): Promise<WeeklyVolumeTracking[]> {
    return await db.select().from(weeklyVolumeTracking)
      .where(eq(weeklyVolumeTracking.userId, userId))
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
  async getWeightLogs(userId: number): Promise<WeightLog[]> {
    return await db.select().from(weightLogs).where(eq(weightLogs.userId, userId));
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
  async getMealPlans(userId: number, date: Date): Promise<MealPlan[]> {
    // For now, just return all meal plans for the user to test basic functionality
    return await db.select().from(mealPlans)
      .where(eq(mealPlans.userId, userId))
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
  async getWeeklyNutritionGoal(userId: number, weekStartDate: Date): Promise<WeeklyNutritionGoal | undefined> {
    const [goal] = await db.select().from(weeklyNutritionGoals)
      .where(and(
        eq(weeklyNutritionGoals.userId, userId),
        eq(weeklyNutritionGoals.weekStartDate, weekStartDate)
      ));
    return goal || undefined;
  }

  async getCurrentWeeklyNutritionGoal(userId: number): Promise<WeeklyNutritionGoal | undefined> {
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
  async getActiveDietPhase(userId: number): Promise<DietPhase | undefined> {
    const [phase] = await db.select().from(dietPhases)
      .where(and(
        eq(dietPhases.userId, userId),
        eq(dietPhases.isActive, true)
      ));
    return phase || undefined;
  }

  async getDietPhases(userId: number): Promise<DietPhase[]> {
    return await db.select().from(dietPhases)
      .where(eq(dietPhases.userId, userId))
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
  async getMealTimingPreferences(userId: number): Promise<MealTimingPreference | undefined> {
    const [preferences] = await db.select().from(mealTimingPreferences)
      .where(eq(mealTimingPreferences.userId, userId));
    return preferences || undefined;
  }

  async createMealTimingPreferences(preferences: InsertMealTimingPreference): Promise<MealTimingPreference> {
    const [newPreferences] = await db
      .insert(mealTimingPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateMealTimingPreferences(userId: number, preferences: Partial<InsertMealTimingPreference>): Promise<MealTimingPreference | undefined> {
    const [updatedPreferences] = await db
      .update(mealTimingPreferences)
      .set(preferences)
      .where(eq(mealTimingPreferences.userId, userId))
      .returning();
    return updatedPreferences || undefined;
  }

  // Body Metrics
  async getBodyMetrics(userId: number): Promise<BodyMetric[]> {
    return await db.select().from(bodyMetrics)
      .where(eq(bodyMetrics.userId, userId))
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

  // Nutrition Progression
  async getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    const logs = await db.select().from(nutritionLogs)
      .where(and(
        eq(nutritionLogs.userId, userId),
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
  async getSavedMealPlans(userId: number): Promise<SavedMealPlan[]> {
    return await db.select().from(savedMealPlans)
      .where(eq(savedMealPlans.userId, userId))
      .orderBy(desc(savedMealPlans.createdAt));
  }

  async getSavedMealPlansByType(userId: number, mealType: string): Promise<SavedMealPlan[]> {
    return await db.select().from(savedMealPlans)
      .where(and(
        eq(savedMealPlans.userId, userId),
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
  async getDietGoal(userId: number): Promise<DietGoal | undefined> {
    const [goal] = await db.select().from(dietGoals)
      .where(eq(dietGoals.userId, userId))
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

  async updateDietGoal(userId: number, goal: Partial<InsertDietGoal>): Promise<DietGoal | undefined> {
    // First check if a diet goal exists for this user
    const existingGoal = await this.getDietGoal(userId);
    
    if (existingGoal) {
      // Update the existing goal
      const [updatedGoal] = await db
        .update(dietGoals)
        .set({ ...goal, updatedAt: new Date() })
        .where(eq(dietGoals.id, existingGoal.id))
        .returning();
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

  async getUserWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return db.select().from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
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
    const result = await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
    return result.rowCount > 0;
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
    const [updated] = await db.update(workoutExercises)
      .set(updates)
      .where(eq(workoutExercises.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkoutExercise(id: number): Promise<boolean> {
    const result = await db.delete(workoutExercises).where(eq(workoutExercises.id, id));
    return result.rowCount > 0;
  }
}