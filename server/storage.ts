import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  foodCategories, foodItems, mealPlans, weeklyNutritionGoals, dietPhases, mealTimingPreferences,
  muscleGroups, volumeLandmarks, weeklyVolumeTracking, exerciseMuscleMapping, savedMealPlans, savedMeals,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog,
  type FoodCategory, type InsertFoodCategory, type FoodItem, type InsertFoodItem,
  type MealPlan, type InsertMealPlan, type WeeklyNutritionGoal, type InsertWeeklyNutritionGoal,
  type DietPhase, type InsertDietPhase, type MealTimingPreference, type InsertMealTimingPreference,
  type BodyMetric, type InsertBodyMetric, type MuscleGroup, type InsertMuscleGroup,
  type VolumeLandmark, type InsertVolumeLandmark, type WeeklyVolumeTracking, type InsertWeeklyVolumeTracking,
  type ExerciseMuscleMapping, type InsertExerciseMuscleMapping, type SavedMealPlan, type InsertSavedMealPlan,
  type SavedMeal, type InsertSavedMeal
} from "@shared/schema";

export interface IStorage {
  // Database access
  getDb(): any;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserDeveloperSettings(id: number, showDeveloperFeatures: boolean): Promise<User | undefined>;
  
  // User Profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Nutrition Goals
  getNutritionGoal(userId: number): Promise<NutritionGoal | undefined>;
  createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal>;
  updateNutritionGoal(userId: number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined>;
  
  // Diet Goals
  getDietGoal(userId: number): Promise<any | undefined>;
  createDietGoal(goal: any): Promise<any>;
  updateDietGoal(userId: number, goal: any): Promise<any | undefined>;
  
  // Nutrition Logs
  getNutritionLogs(userId: number, date?: Date): Promise<NutritionLog[]>;
  getNutritionLogsInRange(userId: number, startDate: Date, endDate: Date): Promise<NutritionLog[]>;
  createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog | undefined>;
  deleteNutritionLog(id: number): Promise<boolean>;
  
  // Training Programs
  getTrainingPrograms(userId: number): Promise<TrainingProgram[]>;
  getActiveTrainingProgram(userId: number): Promise<TrainingProgram | undefined>;
  createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateTrainingProgram(id: number, program: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined>;
  
  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  
  // Workout Sessions
  getWorkoutSessions(userId: number, date?: Date): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, session: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined>;
  
  // Workout Exercises
  getWorkoutExercises(sessionId: number): Promise<WorkoutExercise[]>;
  createWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  updateWorkoutExercise(id: number, exercise: Partial<InsertWorkoutExercise>): Promise<WorkoutExercise | undefined>;
  
  // Auto-Regulation Feedback
  getAutoRegulationFeedback(sessionId: number): Promise<AutoRegulationFeedback | undefined>;
  createAutoRegulationFeedback(feedback: InsertAutoRegulationFeedback): Promise<AutoRegulationFeedback>;
  
  // Weight Logs
  getWeightLogs(userId: number): Promise<WeightLog[]>;
  createWeightLog(log: InsertWeightLog): Promise<WeightLog>;

  // Step 2: Volume Landmarks System
  // Muscle Groups
  getMuscleGroups(): Promise<MuscleGroup[]>;
  getMuscleGroup(id: number): Promise<MuscleGroup | undefined>;
  createMuscleGroup(muscleGroup: InsertMuscleGroup): Promise<MuscleGroup>;

  // Volume Landmarks  
  getVolumeLandmarks(userId: number): Promise<VolumeLandmark[]>;
  getVolumeLandmark(userId: number, muscleGroupId: number): Promise<VolumeLandmark | undefined>;
  createVolumeLandmark(landmark: InsertVolumeLandmark): Promise<VolumeLandmark>;
  updateVolumeLandmark(userId: number, muscleGroupId: number, landmark: Partial<InsertVolumeLandmark>): Promise<VolumeLandmark | undefined>;

  // Weekly Volume Tracking
  getWeeklyVolumeTracking(userId: number): Promise<WeeklyVolumeTracking[]>;
  createWeeklyVolumeTracking(tracking: InsertWeeklyVolumeTracking): Promise<WeeklyVolumeTracking>;
  updateWeeklyVolumeTracking(id: number, tracking: Partial<InsertWeeklyVolumeTracking>): Promise<WeeklyVolumeTracking | undefined>;

  // Exercise Muscle Mapping
  getExerciseMuscleMapping(exerciseId: number): Promise<ExerciseMuscleMapping[]>;
  createExerciseMuscleMapping(mapping: InsertExerciseMuscleMapping): Promise<ExerciseMuscleMapping>;

  // Enhanced Nutrition Features
  // Food Categories & Items
  getFoodCategories(): Promise<FoodCategory[]>;
  getFoodCategoriesByMacroType(macroType: string): Promise<FoodCategory[]>;
  createFoodCategory(category: InsertFoodCategory): Promise<FoodCategory>;
  
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItemsByCategory(categoryId: number): Promise<FoodItem[]>;
  searchFoodItems(query: string): Promise<FoodItem[]>;
  getFoodItemByBarcode(barcode: string): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  
  // Meal Planning
  getMealPlans(userId: number, date: Date): Promise<MealPlan[]>;
  createMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, plan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<boolean>;
  
  // Weekly Nutrition Goals
  getWeeklyNutritionGoal(userId: number, weekStartDate: Date): Promise<WeeklyNutritionGoal | undefined>;
  getCurrentWeeklyNutritionGoal(userId: number): Promise<WeeklyNutritionGoal | undefined>;
  createWeeklyNutritionGoal(goal: InsertWeeklyNutritionGoal): Promise<WeeklyNutritionGoal>;
  updateWeeklyNutritionGoal(id: number, goal: Partial<InsertWeeklyNutritionGoal>): Promise<WeeklyNutritionGoal | undefined>;
  
  // Diet Phases
  getActiveDietPhase(userId: number): Promise<DietPhase | undefined>;
  getDietPhases(userId: number): Promise<DietPhase[]>;
  createDietPhase(phase: InsertDietPhase): Promise<DietPhase>;
  updateDietPhase(id: number, phase: Partial<InsertDietPhase>): Promise<DietPhase | undefined>;
  
  // Meal Timing Preferences
  getMealTimingPreferences(userId: number): Promise<MealTimingPreference | undefined>;
  createMealTimingPreferences(preferences: InsertMealTimingPreference): Promise<MealTimingPreference>;
  updateMealTimingPreferences(userId: number, preferences: Partial<InsertMealTimingPreference>): Promise<MealTimingPreference | undefined>;
  
  // Body Metrics
  getBodyMetrics(userId: number, date?: Date): Promise<BodyMetric[]>;
  createBodyMetric(metric: InsertBodyMetric): Promise<BodyMetric>;
  deleteBodyMetric(id: number): Promise<boolean>;
  
  // Nutrition Progression
  getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
  
  // Saved Meal Plans
  getSavedMealPlans(userId: number): Promise<SavedMealPlan[]>;
  getSavedMealPlan(userId: number, planId: number): Promise<SavedMealPlan | undefined>;
  getSavedMealPlansByType(userId: number, mealType: string): Promise<SavedMealPlan[]>;
  createSavedMealPlan(mealPlan: InsertSavedMealPlan): Promise<SavedMealPlan>;
  updateSavedMealPlan(id: number, mealPlan: Partial<InsertSavedMealPlan>): Promise<SavedMealPlan | undefined>;
  deleteSavedMealPlan(id: number): Promise<boolean>;

  // Saved Meals
  getSavedMeals(userId: number): Promise<SavedMeal[]>;
  createSavedMeal(meal: InsertSavedMeal): Promise<SavedMeal>;
  deleteSavedMeal(id: number): Promise<boolean>;

  // Mesocycles
  getMesocycle(id: number): Promise<any | undefined>;
  getUserMesocycles(userId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  // Database access (not available in memory storage)
  getDb(): any {
    throw new Error("Database access not available in memory storage");
  }
  private users: Map<number, User> = new Map();
  private userProfiles: Map<number, UserProfile> = new Map();
  private nutritionGoals: Map<number, NutritionGoal> = new Map();
  private nutritionLogs: Map<number, NutritionLog> = new Map();
  private trainingPrograms: Map<number, TrainingProgram> = new Map();
  private exercises: Map<number, Exercise> = new Map();
  private workoutSessions: Map<number, WorkoutSession> = new Map();
  private workoutExercises: Map<number, WorkoutExercise> = new Map();
  private autoRegulationFeedback: Map<number, AutoRegulationFeedback> = new Map();
  private weightLogs: Map<number, WeightLog> = new Map();
  
  private currentUserId = 1;
  private currentUserProfileId = 1;
  private currentNutritionGoalId = 1;
  private currentNutritionLogId = 1;
  private currentTrainingProgramId = 1;
  private currentExerciseId = 1;
  private currentWorkoutSessionId = 1;
  private currentWorkoutExerciseId = 1;
  private currentAutoRegulationFeedbackId = 1;
  private currentWeightLogId = 1;
  private bodyMetrics: Map<number, BodyMetric> = new Map();
  private currentBodyMetricId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { 
      ...user, 
      id: this.currentUserId++, 
      createdAt: new Date(),
      password: user.password || null,
      appleId: user.appleId || null,
      preferredLanguage: user.preferredLanguage || "en",
      theme: user.theme || "dark",
      showDeveloperFeatures: user.showDeveloperFeatures || false
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserDeveloperSettings(id: number, showDeveloperFeatures: boolean): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, showDeveloperFeatures };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User Profiles
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(profile => profile.userId === userId);
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const newProfile: UserProfile = { 
      ...profile, 
      id: this.currentUserProfileId++, 
      updatedAt: new Date(),
      height: profile.height || null,
      age: profile.age || null,
      weight: profile.weight || null,
      activityLevel: profile.activityLevel || null,
      fitnessGoal: profile.fitnessGoal || null,
      dietaryRestrictions: profile.dietaryRestrictions || null
    };
    this.userProfiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const existingProfile = Array.from(this.userProfiles.values()).find(p => p.userId === userId);
    if (!existingProfile) return undefined;
    
    const updatedProfile = { ...existingProfile, ...profile, updatedAt: new Date() };
    this.userProfiles.set(existingProfile.id, updatedProfile);
    return updatedProfile;
  }

  // Nutrition Goals
  async getNutritionGoal(userId: number): Promise<NutritionGoal | undefined> {
    return Array.from(this.nutritionGoals.values()).find(goal => goal.userId === userId);
  }

  async createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal> {
    const newGoal: NutritionGoal = { ...goal, id: this.currentNutritionGoalId++, createdAt: new Date() };
    this.nutritionGoals.set(newGoal.id, newGoal);
    return newGoal;
  }

  async updateNutritionGoal(userId: number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined> {
    const existingGoal = Array.from(this.nutritionGoals.values()).find(g => g.userId === userId);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { ...existingGoal, ...goal };
    this.nutritionGoals.set(existingGoal.id, updatedGoal);
    return updatedGoal;
  }

  // Nutrition Logs
  async getNutritionLogs(userId: number, date?: Date): Promise<NutritionLog[]> {
    let logs = Array.from(this.nutritionLogs.values()).filter(log => log.userId === userId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      logs = logs.filter(log => log.date >= startOfDay && log.date <= endOfDay);
    }
    
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getNutritionLogsInRange(userId: number, startDate: Date, endDate: Date): Promise<NutritionLog[]> {
    return Array.from(this.nutritionLogs.values())
      .filter(log => 
        log.userId === userId && 
        log.date >= startDate && 
        log.date <= endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const newLog: NutritionLog = { 
      ...log, 
      id: this.currentNutritionLogId++, 
      createdAt: new Date(),
      category: log.category || null,
      mealType: log.mealType || null,
      mealOrder: log.mealOrder || null,
      scheduledTime: log.scheduledTime || null,
      mealSuitability: log.mealSuitability || null
    };
    this.nutritionLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog | undefined> {
    const existingLog = this.nutritionLogs.get(id);
    if (!existingLog) return undefined;
    
    const updatedLog = { ...existingLog, ...log };
    this.nutritionLogs.set(id, updatedLog);
    return updatedLog;
  }

  async deleteNutritionLog(id: number): Promise<boolean> {
    return this.nutritionLogs.delete(id);
  }

  // Training Programs
  async getTrainingPrograms(userId: number): Promise<TrainingProgram[]> {
    return Array.from(this.trainingPrograms.values()).filter(program => program.userId === userId);
  }

  async getActiveTrainingProgram(userId: number): Promise<TrainingProgram | undefined> {
    return Array.from(this.trainingPrograms.values()).find(program => program.userId === userId && program.isActive);
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const newProgram: TrainingProgram = { 
      ...program, 
      id: this.currentTrainingProgramId++, 
      createdAt: new Date(),
      description: program.description || null,
      mesocycleDuration: program.mesocycleDuration || 4,
      currentWeek: program.currentWeek || 1,
      isActive: program.isActive || false
    };
    this.trainingPrograms.set(newProgram.id, newProgram);
    return newProgram;
  }

  async updateTrainingProgram(id: number, program: Partial<InsertTrainingProgram>): Promise<TrainingProgram | undefined> {
    const existingProgram = this.trainingPrograms.get(id);
    if (!existingProgram) return undefined;
    
    const updatedProgram = { ...existingProgram, ...program };
    this.trainingPrograms.set(id, updatedProgram);
    return updatedProgram;
  }

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(exercise => exercise.category === category);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async getExerciseByName(name: string): Promise<Exercise | undefined> {
    return Array.from(this.exercises.values()).find(exercise => exercise.name === name);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise: Exercise = { 
      ...exercise, 
      id: this.currentExerciseId++,
      muscleGroups: exercise.muscleGroups || null,
      equipment: exercise.equipment || null,
      movementPattern: exercise.movementPattern || null,
      difficulty: exercise.difficulty || null,
      instructions: exercise.instructions || null,
      videoUrl: exercise.videoUrl || null,
      translations: exercise.translations || {},
      isBodyWeight: exercise.isBodyWeight || null
    };
    this.exercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  async updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const existingExercise = this.exercises.get(id);
    if (!existingExercise) return undefined;
    
    const updatedExercise = { ...existingExercise, ...exercise };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<boolean> {
    return this.exercises.delete(id);
  }

  // Workout Sessions
  async getWorkoutSessions(userId: number, date?: Date): Promise<WorkoutSession[]> {
    let sessions = Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      sessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startOfDay && sessionDate <= endOfDay;
      });
    }
    
    return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    return this.workoutSessions.get(id);
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const newSession: WorkoutSession = { 
      ...session, 
      id: this.currentWorkoutSessionId++, 
      createdAt: new Date(),
      version: session.version || "1.0",
      duration: session.duration || null,
      isCompleted: session.isCompleted || false,
      totalVolume: session.totalVolume || null,
      programId: session.programId || null,
      mesocycleId: session.mesocycleId || null,
      features: session.features || null,
      algorithm: session.algorithm || null,
      actualFinishedAt: session.actualFinishedAt || null
    };
    this.workoutSessions.set(newSession.id, newSession);
    return newSession;
  }

  async updateWorkoutSession(id: number, session: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const existingSession = this.workoutSessions.get(id);
    if (!existingSession) return undefined;
    
    const updatedSession = { ...existingSession, ...session };
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Workout Exercises
  async getWorkoutExercises(sessionId: number): Promise<WorkoutExercise[]> {
    return Array.from(this.workoutExercises.values())
      .filter(exercise => exercise.sessionId === sessionId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const newExercise: WorkoutExercise = { 
      ...exercise, 
      id: this.currentWorkoutExerciseId++,
      isCompleted: exercise.isCompleted || null,
      actualReps: exercise.actualReps || null,
      weight: exercise.weight || null,
      rpe: exercise.rpe || null,
      rir: exercise.rir || null,
      restPeriod: exercise.restPeriod || null,
      notes: exercise.notes || null,
      finishedAt: exercise.finishedAt || null,
      weightUnit: exercise.weightUnit || null
    };
    this.workoutExercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  async updateWorkoutExercise(id: number, exercise: Partial<InsertWorkoutExercise>): Promise<WorkoutExercise | undefined> {
    const existingExercise = this.workoutExercises.get(id);
    if (!existingExercise) return undefined;
    
    const updatedExercise = { ...existingExercise, ...exercise };
    this.workoutExercises.set(id, updatedExercise);
    return updatedExercise;
  }

  // Auto-Regulation Feedback
  async getAutoRegulationFeedback(sessionId: number): Promise<AutoRegulationFeedback | undefined> {
    return Array.from(this.autoRegulationFeedback.values()).find(feedback => feedback.sessionId === sessionId);
  }

  async createAutoRegulationFeedback(feedback: InsertAutoRegulationFeedback): Promise<AutoRegulationFeedback> {
    const newFeedback: AutoRegulationFeedback = { ...feedback, id: this.currentAutoRegulationFeedbackId++, createdAt: new Date() };
    this.autoRegulationFeedback.set(newFeedback.id, newFeedback);
    return newFeedback;
  }

  // Weight Logs
  async getWeightLogs(userId: number): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createWeightLog(log: InsertWeightLog): Promise<WeightLog> {
    const newLog: WeightLog = { ...log, id: this.currentWeightLogId++, createdAt: new Date() };
    this.weightLogs.set(newLog.id, newLog);
    return newLog;
  }

  // Body Metrics (missing methods added for completeness)
  async getBodyMetrics(userId: number, date?: Date): Promise<BodyMetric[]> {
    let metrics = Array.from(this.bodyMetrics.values())
      .filter(metric => metric.userId === userId);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      metrics = metrics.filter(metric => {
        const metricDate = new Date(metric.date);
        return metricDate >= startOfDay && metricDate <= endOfDay;
      });
    }
    
    return metrics.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createBodyMetric(metric: InsertBodyMetric): Promise<BodyMetric> {
    const newMetric: BodyMetric = { 
      ...metric, 
      id: this.currentBodyMetricId++,
      createdAt: new Date(),
      weight: metric.weight || null,
      unit: metric.unit || "metric",
      bodyFatPercentage: metric.bodyFatPercentage || null,
      neck: metric.neck || null,
      chest: metric.chest || null,
      waist: metric.waist || null,
      hips: metric.hips || null,
      thigh: metric.thigh || null,
      bicep: metric.bicep || null
    };
    this.bodyMetrics.set(newMetric.id, newMetric);
    return newMetric;
  }

  async deleteBodyMetric(id: number): Promise<boolean> {
    return this.bodyMetrics.delete(id);
  }

  // Stub implementations for missing interface methods
  async getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    return []; // Stub for memory storage
  }

  async getSavedMealPlans(userId: number): Promise<SavedMealPlan[]> {
    return []; // Stub for memory storage
  }

  async getSavedMealPlan(userId: number, planId: number): Promise<SavedMealPlan | undefined> {
    return undefined; // Stub for memory storage
  }

  async getSavedMealPlansByType(userId: number, mealType: string): Promise<SavedMealPlan[]> {
    return []; // Stub for memory storage
  }

  async createSavedMealPlan(mealPlan: InsertSavedMealPlan): Promise<SavedMealPlan> {
    throw new Error("Not implemented in memory storage");
  }

  async updateSavedMealPlan(id: number, mealPlan: Partial<InsertSavedMealPlan>): Promise<SavedMealPlan | undefined> {
    return undefined; // Stub for memory storage
  }

  async deleteSavedMealPlan(id: number): Promise<boolean> {
    return false; // Stub for memory storage
  }

  async getMesocycle(id: number): Promise<any | undefined> {
    return undefined; // Stub for memory storage
  }

  async getUserMesocycles(userId: number): Promise<any[]> {
    return []; // Stub for memory storage
  }

  // Additional stub implementations for missing methods
  async getFoodCategories(): Promise<FoodCategory[]> {
    return []; // Stub for memory storage
  }

  async getFoodItems(): Promise<FoodItem[]> {
    return []; // Stub for memory storage
  }

  async getMealPlans(userId: number): Promise<MealPlan[]> {
    return []; // Stub for memory storage
  }

  async getWeeklyNutritionGoals(userId: number): Promise<WeeklyNutritionGoal[]> {
    return []; // Stub for memory storage
  }

  async getDietPhases(userId: number): Promise<DietPhase[]> {
    return []; // Stub for memory storage
  }

  async getActiveDietPhase(userId: number): Promise<DietPhase | undefined> {
    return undefined; // Stub for memory storage
  }

  async createDietPhase(phase: InsertDietPhase): Promise<DietPhase> {
    throw new Error("Not implemented in memory storage");
  }

  async updateDietPhase(id: number, phase: Partial<InsertDietPhase>): Promise<DietPhase | undefined> {
    return undefined; // Stub for memory storage
  }

  async getMealTimingPreferences(userId: number): Promise<MealTimingPreference | undefined> {
    return undefined; // Stub for memory storage
  }

  async createMealTimingPreferences(preferences: InsertMealTimingPreference): Promise<MealTimingPreference> {
    throw new Error("Not implemented in memory storage");
  }

  async updateMealTimingPreferences(userId: number, preferences: Partial<InsertMealTimingPreference>): Promise<MealTimingPreference | undefined> {
    return undefined; // Stub for memory storage
  }

  async deleteBodyMetric(id: number): Promise<boolean> {
    return this.bodyMetrics.delete(id);
  }

  // Placeholder methods for compatibility
  async getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    return [];
  }

  async getSavedMealPlans(userId: number): Promise<SavedMealPlan[]> {
    return [];
  }

  async getSavedMealPlan(userId: number, planId: number): Promise<SavedMealPlan | undefined> {
    return undefined;
  }

  async getSavedMealPlansByType(userId: number, mealType: string): Promise<SavedMealPlan[]> {
    return [];
  }

  async createSavedMealPlan(mealPlan: InsertSavedMealPlan): Promise<SavedMealPlan> {
    throw new Error("Not implemented in memory storage");
  }

  async updateSavedMealPlan(id: number, mealPlan: Partial<InsertSavedMealPlan>): Promise<SavedMealPlan | undefined> {
    return undefined;
  }

  async deleteSavedMealPlan(id: number): Promise<boolean> {
    return false;
  }

  // Saved Meals
  async getSavedMeals(userId: number): Promise<SavedMeal[]> {
    return [];
  }

  async createSavedMeal(meal: InsertSavedMeal): Promise<SavedMeal> {
    throw new Error("Not implemented in memory storage");
  }

  async deleteSavedMeal(id: number): Promise<boolean> {
    return false;
  }

  // Diet Goals
  async getDietGoal(userId: number): Promise<any | undefined> {
    return undefined; // Stub for memory storage
  }

  async createDietGoal(goal: any): Promise<any> {
    throw new Error("Not implemented in memory storage");
  }

  async updateDietGoal(userId: number, goal: any): Promise<any | undefined> {
    return undefined; // Stub for memory storage
  }

  // Mesocycles
  async getMesocycle(id: number): Promise<any | undefined> {
    // Not implemented in memory storage
    return undefined;
  }

  async getUserMesocycles(userId: number): Promise<any[]> {
    // Not implemented in memory storage
    return [];
  }
}

import { DatabaseStorage } from "./storage-db";

export const storage: IStorage = new DatabaseStorage();
