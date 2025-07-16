import { 
  users, userProfiles, nutritionGoals, nutritionLogs, trainingPrograms, 
  exercises, workoutSessions, workoutExercises, autoRegulationFeedback, weightLogs,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type NutritionGoal, type InsertNutritionGoal, type NutritionLog, type InsertNutritionLog,
  type TrainingProgram, type InsertTrainingProgram, type Exercise, type InsertExercise,
  type WorkoutSession, type InsertWorkoutSession, type WorkoutExercise, type InsertWorkoutExercise,
  type AutoRegulationFeedback, type InsertAutoRegulationFeedback, type WeightLog, type InsertWeightLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
    return await db.select().from(workoutExercises).where(eq(workoutExercises.sessionId, sessionId));
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
}