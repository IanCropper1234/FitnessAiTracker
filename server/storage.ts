import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  foodCategories, foodItems, mealPlans, weeklyNutritionGoals, dietPhases, mealTimingPreferences,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog,
  type FoodCategory, type InsertFoodCategory, type FoodItem, type InsertFoodItem,
  type MealPlan, type InsertMealPlan, type WeeklyNutritionGoal, type InsertWeeklyNutritionGoal,
  type DietPhase, type InsertDietPhase, type MealTimingPreference, type InsertMealTimingPreference,
  type BodyMetric, type InsertBodyMetric
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // User Profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Nutrition Goals
  getNutritionGoal(userId: number): Promise<NutritionGoal | undefined>;
  createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal>;
  updateNutritionGoal(userId: number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined>;
  
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
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Workout Sessions
  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
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
  getBodyMetrics(userId: number): Promise<BodyMetric[]>;
  createBodyMetric(metric: InsertBodyMetric): Promise<BodyMetric>;
  deleteBodyMetric(id: number): Promise<boolean>;
  
  // Nutrition Progression
  getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
  
  // Diet Goals (for meal planning)
  getUserDietGoals(userId: number): Promise<any>;
  createUserDietGoals(goals: any): Promise<any>;
  updateUserDietGoals(userId: number, goals: any): Promise<any>;
}

export class MemStorage implements IStorage {
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
  
  // Enhanced meal planning storage
  private foodCategories: Map<number, FoodCategory> = new Map();
  private foodItems: Map<number, FoodItem> = new Map();
  private mealPlans: Map<number, MealPlan> = new Map();
  private weeklyNutritionGoals: Map<number, WeeklyNutritionGoal> = new Map();
  private dietPhases: Map<number, DietPhase> = new Map();
  private mealTimingPreferences: Map<number, MealTimingPreference> = new Map();
  private bodyMetrics: Map<number, BodyMetric> = new Map();
  private dietGoals: Map<number, any> = new Map();
  
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
  private currentFoodCategoryId = 1;
  private currentFoodItemId = 1;
  private currentMealPlanId = 1;
  private currentWeeklyNutritionGoalId = 1;
  private currentDietPhaseId = 1;
  private currentMealTimingPreferenceId = 1;
  private currentBodyMetricId = 1;
  private currentDietGoalId = 1;

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
      theme: user.theme || "dark"
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
      mealType: log.mealType || null,
      mealOrder: log.mealOrder || null,
      scheduledTime: log.scheduledTime || null
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

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise: Exercise = { 
      ...exercise, 
      id: this.currentExerciseId++,
      muscleGroups: exercise.muscleGroups || null,
      equipment: exercise.equipment || null,
      instructions: exercise.instructions || null,
      videoUrl: exercise.videoUrl || null,
      translations: exercise.translations || {}
    };
    this.exercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  // Workout Sessions
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    return this.workoutSessions.get(id);
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const newSession: WorkoutSession = { 
      ...session, 
      id: this.currentWorkoutSessionId++, 
      createdAt: new Date(),
      duration: session.duration || null,
      isCompleted: session.isCompleted || false,
      totalVolume: session.totalVolume || null
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
      weight: exercise.weight || null,
      restPeriod: exercise.restPeriod || null,
      notes: exercise.notes || null
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

  // Enhanced Meal Planning Methods
  async getFoodCategories(): Promise<FoodCategory[]> {
    return Array.from(this.foodCategories.values());
  }

  async getFoodCategoriesByMacroType(macroType: string): Promise<FoodCategory[]> {
    return Array.from(this.foodCategories.values()).filter(cat => cat.macroType === macroType);
  }

  async createFoodCategory(category: InsertFoodCategory): Promise<FoodCategory> {
    const newCategory: FoodCategory = { 
      ...category, 
      id: this.currentFoodCategoryId++,
      priority: category.priority || 0,
      translations: category.translations || null
    };
    this.foodCategories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async getFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItemsByCategory(categoryId: number): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values()).filter(item => item.categoryId === categoryId);
  }

  async searchFoodItems(query: string): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values()).filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getFoodItemByBarcode(barcode: string): Promise<FoodItem | undefined> {
    return Array.from(this.foodItems.values()).find(item => item.barcode === barcode);
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const newItem: FoodItem = { 
      ...item, 
      id: this.currentFoodItemId++,
      barcode: item.barcode || null,
      categoryId: item.categoryId || null,
      translations: item.translations || null,
      isRestaurant: item.isRestaurant || false,
      restaurantChain: item.restaurantChain || null
    };
    this.foodItems.set(newItem.id, newItem);
    return newItem;
  }

  async getMealPlans(userId: number, date: Date): Promise<MealPlan[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.mealPlans.values())
      .filter(plan => 
        plan.userId === userId && 
        plan.date >= startOfDay && 
        plan.date <= endOfDay
      )
      .sort((a, b) => a.mealNumber - b.mealNumber);
  }

  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const newPlan: MealPlan = { 
      ...plan, 
      id: this.currentMealPlanId++,
      targetCalories: plan.targetCalories || null,
      targetProtein: plan.targetProtein || null,
      targetCarbs: plan.targetCarbs || null,
      targetFat: plan.targetFat || null,
      isPreWorkout: plan.isPreWorkout || false,
      isPostWorkout: plan.isPostWorkout || false,
      createdAt: new Date()
    };
    this.mealPlans.set(newPlan.id, newPlan);
    return newPlan;
  }

  async updateMealPlan(id: number, plan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const existingPlan = this.mealPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan = { ...existingPlan, ...plan };
    this.mealPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    return this.mealPlans.delete(id);
  }

  async getWeeklyNutritionGoal(userId: number, weekStartDate: Date): Promise<WeeklyNutritionGoal | undefined> {
    return Array.from(this.weeklyNutritionGoals.values())
      .find(goal => goal.userId === userId && goal.weekStartDate.getTime() === weekStartDate.getTime());
  }

  async getCurrentWeeklyNutritionGoal(userId: number): Promise<WeeklyNutritionGoal | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return Array.from(this.weeklyNutritionGoals.values())
      .find(goal => goal.userId === userId && goal.weekStartDate.getTime() === startOfWeek.getTime());
  }

  async createWeeklyNutritionGoal(goal: InsertWeeklyNutritionGoal): Promise<WeeklyNutritionGoal> {
    const newGoal: WeeklyNutritionGoal = { 
      ...goal, 
      id: this.currentWeeklyNutritionGoalId++,
      adjustmentReason: goal.adjustmentReason || null,
      previousWeight: goal.previousWeight || null,
      currentWeight: goal.currentWeight || null,
      createdAt: new Date()
    };
    this.weeklyNutritionGoals.set(newGoal.id, newGoal);
    return newGoal;
  }

  async updateWeeklyNutritionGoal(id: number, goal: Partial<InsertWeeklyNutritionGoal>): Promise<WeeklyNutritionGoal | undefined> {
    const existingGoal = this.weeklyNutritionGoals.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { ...existingGoal, ...goal };
    this.weeklyNutritionGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async getActiveDietPhase(userId: number): Promise<DietPhase | undefined> {
    return Array.from(this.dietPhases.values())
      .find(phase => phase.userId === userId && phase.isActive);
  }

  async getDietPhases(userId: number): Promise<DietPhase[]> {
    return Array.from(this.dietPhases.values())
      .filter(phase => phase.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createDietPhase(phase: InsertDietPhase): Promise<DietPhase> {
    const newPhase: DietPhase = { 
      ...phase, 
      id: this.currentDietPhaseId++,
      endDate: phase.endDate || null,
      targetWeightChange: phase.targetWeightChange || null,
      weeklyWeightChangeTarget: phase.weeklyWeightChangeTarget || null,
      isActive: phase.isActive !== undefined ? phase.isActive : true,
      createdAt: new Date()
    };
    this.dietPhases.set(newPhase.id, newPhase);
    return newPhase;
  }

  async updateDietPhase(id: number, phase: Partial<InsertDietPhase>): Promise<DietPhase | undefined> {
    const existingPhase = this.dietPhases.get(id);
    if (!existingPhase) return undefined;
    
    const updatedPhase = { ...existingPhase, ...phase };
    this.dietPhases.set(id, updatedPhase);
    return updatedPhase;
  }

  async getMealTimingPreferences(userId: number): Promise<MealTimingPreference | undefined> {
    return Array.from(this.mealTimingPreferences.values())
      .find(pref => pref.userId === userId);
  }

  async createMealTimingPreferences(preferences: InsertMealTimingPreference): Promise<MealTimingPreference> {
    const newPreferences: MealTimingPreference = { 
      ...preferences, 
      id: this.currentMealTimingPreferenceId++,
      workoutTime: preferences.workoutTime || null,
      workoutDays: preferences.workoutDays || null,
      mealsPerDay: preferences.mealsPerDay || 4,
      preWorkoutMeals: preferences.preWorkoutMeals || 1,
      postWorkoutMeals: preferences.postWorkoutMeals || 1,
      updatedAt: new Date()
    };
    this.mealTimingPreferences.set(newPreferences.id, newPreferences);
    return newPreferences;
  }

  async updateMealTimingPreferences(userId: number, preferences: Partial<InsertMealTimingPreference>): Promise<MealTimingPreference | undefined> {
    const existingPreferences = Array.from(this.mealTimingPreferences.values())
      .find(pref => pref.userId === userId);
    
    if (!existingPreferences) {
      // Create new preferences if they don't exist
      return this.createMealTimingPreferences({ userId, ...preferences } as InsertMealTimingPreference);
    }
    
    const updatedPreferences = { ...existingPreferences, ...preferences, updatedAt: new Date() };
    this.mealTimingPreferences.set(existingPreferences.id, updatedPreferences);
    return updatedPreferences;
  }

  async getBodyMetrics(userId: number): Promise<BodyMetric[]> {
    return Array.from(this.bodyMetrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createBodyMetric(metric: InsertBodyMetric): Promise<BodyMetric> {
    const newMetric: BodyMetric = { 
      ...metric, 
      id: this.currentBodyMetricId++,
      weight: metric.weight || null,
      bodyFatPercentage: metric.bodyFatPercentage || null,
      neck: metric.neck || null,
      chest: metric.chest || null,
      waist: metric.waist || null,
      hips: metric.hips || null,
      thigh: metric.thigh || null,
      bicep: metric.bicep || null,
      unit: metric.unit || "metric",
      createdAt: new Date()
    };
    this.bodyMetrics.set(newMetric.id, newMetric);
    return newMetric;
  }

  async deleteBodyMetric(id: number): Promise<boolean> {
    return this.bodyMetrics.delete(id);
  }

  async getNutritionProgression(userId: number, startDate: Date, endDate: Date): Promise<any[]> {
    const logs = await this.getNutritionLogsInRange(userId, startDate, endDate);
    const bodyMetrics = await this.getBodyMetrics(userId);
    
    // Group logs by date and calculate daily totals
    const dailyData = new Map();
    
    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          date: dateStr,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          weight: null,
          bodyFat: null
        });
      }
      
      const day = dailyData.get(dateStr);
      day.totalCalories += Number(log.calories);
      day.totalProtein += Number(log.protein);
      day.totalCarbs += Number(log.carbs);
      day.totalFat += Number(log.fat);
    });
    
    // Add body metrics
    bodyMetrics.forEach(metric => {
      const dateStr = metric.date.toISOString().split('T')[0];
      if (dailyData.has(dateStr)) {
        const day = dailyData.get(dateStr);
        day.weight = metric.weight;
        day.bodyFat = metric.bodyFatPercentage;
      }
    });
    
    return Array.from(dailyData.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Diet Goals for meal planning
  async getUserDietGoals(userId: number): Promise<any> {
    return Array.from(this.dietGoals.values()).find(goal => goal.userId === userId);
  }

  async createUserDietGoals(goals: any): Promise<any> {
    const newGoals = { ...goals, id: this.currentDietGoalId++ };
    this.dietGoals.set(newGoals.id, newGoals);
    return newGoals;
  }

  async updateUserDietGoals(userId: number, goals: any): Promise<any> {
    const existingGoals = Array.from(this.dietGoals.values()).find(goal => goal.userId === userId);
    if (!existingGoals) {
      return this.createUserDietGoals({ userId, ...goals });
    }
    
    const updatedGoals = { ...existingGoals, ...goals };
    this.dietGoals.set(existingGoals.id, updatedGoals);
    return updatedGoals;
  }
}

import { DatabaseStorage } from "./storage-db";

export const storage = new DatabaseStorage();
