import { storage } from "../storage";
// Note: Training AI features will be implemented later
// import { generateTrainingAdjustment } from "./openai";
import type { InsertWorkoutSession, InsertAutoRegulationFeedback } from "@shared/schema";

export interface TrainingStats {
  totalSessions: number;
  totalVolume: number;
  averageIntensity: number;
  currentWeek: number;
  completionRate: number;
}

export async function getTrainingStats(userId: number): Promise<TrainingStats> {
  const sessions = await storage.getWorkoutSessions(userId);
  const activeProgram = await storage.getActiveTrainingProgram(userId);

  const completedSessions = sessions.filter(s => s.isCompleted);
  const totalVolume = completedSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
  const completionRate = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

  return {
    totalSessions: completedSessions.length,
    totalVolume,
    averageIntensity: 75, // Mock average intensity
    currentWeek: activeProgram?.currentWeek || 1,
    completionRate,
  };
}

export async function processAutoRegulation(
  sessionId: number,
  userId: number,
  feedback: {
    pumpQuality: number;
    muscleSoreness: number;
    perceivedEffort: number;
    energyLevel: number;
    sleepQuality: number;
  }
): Promise<any> {
  try {
    // Store feedback
    const feedbackData: InsertAutoRegulationFeedback = {
      sessionId,
      userId,
      ...feedback,
    };

    await storage.createAutoRegulationFeedback(feedbackData);

    // Get current training context
    const session = await storage.getWorkoutSession(sessionId);
    if (!session) throw new Error("Session not found");

    const currentVolume = session.totalVolume || 0;
    const activeProgram = await storage.getActiveTrainingProgram(userId);
    const currentWeek = activeProgram?.currentWeek || 1;

    // Generate AI-powered training adjustment
    const adjustment = await generateTrainingAdjustment(
      feedback.pumpQuality,
      feedback.muscleSoreness,
      feedback.perceivedEffort,
      currentVolume,
      currentWeek
    );

    return {
      feedback: feedbackData,
      adjustment,
      nextWorkoutRecommendation: {
        volumeAdjustment: adjustment.volumeChange,
        intensityAdjustment: adjustment.intensityChange,
        notes: adjustment.reasoning,
      }
    };
  } catch (error) {
    throw new Error(`Failed to process auto-regulation: ${error.message}`);
  }
}

export async function createWorkoutSession(
  userId: number,
  programId: number,
  name: string,
  exercises: Array<{
    exerciseId: number;
    sets: number;
    reps: string;
    weight?: number;
    restPeriod?: number;
  }>
): Promise<any> {
  try {
    const sessionData: InsertWorkoutSession = {
      userId,
      programId,
      date: new Date(),
      name,
      isCompleted: false,
      totalVolume: 0,
    };

    const session = await storage.createWorkoutSession(sessionData);

    // Add exercises to session
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      await storage.createWorkoutExercise({
        sessionId: session.id,
        exerciseId: exercise.exerciseId,
        orderIndex: i,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight?.toString(),
        restPeriod: exercise.restPeriod,
      });
    }

    return session;
  } catch (error) {
    throw new Error(`Failed to create workout session: ${error.message}`);
  }
}

export async function getWorkoutPlan(userId: number, day: string): Promise<any> {
  // Mock workout plan generation based on day
  const workoutPlans = {
    push: [
      { name: "Bench Press", sets: 3, reps: "8-12", muscleGroups: ["chest", "triceps"] },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-15", muscleGroups: ["chest"] },
      { name: "Lateral Raises", sets: 4, reps: "12-20", muscleGroups: ["shoulders"] },
      { name: "Tricep Dips", sets: 3, reps: "10-15", muscleGroups: ["triceps"] },
    ],
    pull: [
      { name: "Pull-ups", sets: 3, reps: "6-10", muscleGroups: ["back", "biceps"] },
      { name: "Barbell Rows", sets: 3, reps: "8-12", muscleGroups: ["back"] },
      { name: "Face Pulls", sets: 3, reps: "15-20", muscleGroups: ["rear delts"] },
      { name: "Bicep Curls", sets: 3, reps: "10-15", muscleGroups: ["biceps"] },
    ],
    legs: [
      { name: "Squats", sets: 4, reps: "8-12", muscleGroups: ["quads", "glutes"] },
      { name: "Romanian Deadlifts", sets: 3, reps: "10-15", muscleGroups: ["hamstrings"] },
      { name: "Leg Press", sets: 3, reps: "12-20", muscleGroups: ["quads"] },
      { name: "Calf Raises", sets: 4, reps: "15-25", muscleGroups: ["calves"] },
    ],
  };

  return workoutPlans[day.toLowerCase()] || workoutPlans.push;
}
