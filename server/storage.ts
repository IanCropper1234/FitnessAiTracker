import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog
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

  async createNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const newLog: NutritionLog = { 
      ...log, 
      id: this.currentNutritionLogId++, 
      createdAt: new Date(),
      mealType: log.mealType || null
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
}

import { DatabaseStorage } from "./storage-db";

export const storage = new DatabaseStorage();
