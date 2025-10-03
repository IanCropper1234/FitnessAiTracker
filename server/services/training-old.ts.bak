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

    // Generate AI-powered training adjustment (temporarily using mock data)
    const adjustment = {
      volumeChange: calculateVolumeAdjustment(feedback),
      intensityChange: calculateIntensityAdjustment(feedback),
      reasoning: generateAdjustmentReasoning(feedback)
    };

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
    throw new Error("Failed to process auto-regulation feedback");
  }
}

function calculateVolumeAdjustment(feedback: any): number {
  // RP-inspired auto-regulation logic
  const pumpScore = feedback.pumpQuality;
  const sorenessScore = feedback.muscleSoreness;
  const effortScore = feedback.perceivedEffort;
  const energyScore = feedback.energyLevel;
  
  // High pump + low soreness + good energy = increase volume
  if (pumpScore >= 8 && sorenessScore <= 4 && energyScore >= 7) {
    return 10; // +10% volume
  }
  // Poor pump + high soreness + low energy = decrease volume
  if (pumpScore <= 5 && sorenessScore >= 7 && energyScore <= 5) {
    return -15; // -15% volume
  }
  // Moderate adjustments
  if (pumpScore >= 7 && sorenessScore <= 5) return 5; // +5% volume
  if (pumpScore <= 6 && sorenessScore >= 6) return -10; // -10% volume
  
  return 0; // No change
}

function calculateIntensityAdjustment(feedback: any): number {
  const effortScore = feedback.perceivedEffort;
  const energyScore = feedback.energyLevel;
  
  // High effort + good energy = can handle more intensity
  if (effortScore <= 7 && energyScore >= 8) return 5; // +5% intensity
  // Max effort + low energy = reduce intensity  
  if (effortScore >= 9 && energyScore <= 6) return -10; // -10% intensity
  
  return 0; // No change
}

function generateAdjustmentReasoning(feedback: any): string {
  const volumeChange = calculateVolumeAdjustment(feedback);
  const intensityChange = calculateIntensityAdjustment(feedback);
  
  if (volumeChange > 0 && intensityChange > 0) {
    return "Excellent recovery indicators. Increasing both volume and intensity.";
  } else if (volumeChange < 0 || intensityChange < 0) {
    return "Signs of fatigue detected. Reducing training load to optimize recovery.";
  } else if (volumeChange > 0) {
    return "Good pump and low soreness. Adding volume while maintaining intensity.";
  } else if (intensityChange > 0) {
    return "Energy levels high but volume adequate. Increasing intensity.";
  }
  
  return "Maintaining current training parameters based on feedback.";
}

export async function createWorkoutSession(
  userId: number,
  sessionData: {
    name: string;
    duration: number;
    totalVolume: number;
    exercises: Array<{
      exerciseId: number;
      sets: Array<{ reps: number; weight: number; completed: boolean }>;
    }>;
  }
): Promise<any> {
  try {
    // Create main workout session
    const sessionData_: InsertWorkoutSession = {
      userId,
      programId: 1, // Default program for now
      date: new Date(),
      name: sessionData.name,
      isCompleted: true,
      totalVolume: sessionData.totalVolume,
      duration: sessionData.duration,
    };

    const session = await storage.createWorkoutSession(sessionData_);

    // Create workout exercises
    for (const exerciseData of sessionData.exercises) {
      const completedSets = exerciseData.sets.filter(set => set.completed);
      if (completedSets.length > 0) {
        const repsString = completedSets.map(set => set.reps).join(',');
        const avgWeight = completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length;

        await storage.createWorkoutExercise({
          sessionId: session.id,
          exerciseId: exerciseData.exerciseId,
          orderIndex: 1,
          sets: completedSets.length,
          reps: repsString,
          weight: avgWeight.toString(),
          restPeriod: 90, // Default rest period
          notes: "",
        });
      }
    }

    return { session, success: true };
  } catch (error) {
    throw new Error("Failed to create workout session");
  }
}

export async function getWorkoutPlan(userId: number, day: string): Promise<any> {
  // Mock workout plans for now - will be enhanced with AI generation later
  const workoutPlans: Record<string, any> = {
    monday: {
      name: "Upper Body - Push",
      exercises: [
        { id: 1, name: "Bench Press", sets: 3, reps: "8-12", weight: 80 },
        { id: 2, name: "Incline Dumbbell Press", sets: 3, reps: "10-15", weight: 25 },
        { id: 3, name: "Lateral Raises", sets: 4, reps: "12-20", weight: 12 },
        { id: 4, name: "Tricep Dips", sets: 3, reps: "10-15" },
      ]
    },
    tuesday: {
      name: "Pull Day", 
      exercises: [
        { id: 5, name: "Pull-ups", sets: 3, reps: "6-10" },
        { id: 6, name: "Barbell Rows", sets: 3, reps: "8-12", weight: 70 },
        { id: 7, name: "Face Pulls", sets: 3, reps: "15-20", weight: 15 },
        { id: 8, name: "Bicep Curls", sets: 3, reps: "10-15", weight: 15 },
      ]
    },
    wednesday: {
      name: "Legs",
      exercises: [
        { id: 9, name: "Squats", sets: 4, reps: "8-12", weight: 100 },
        { id: 10, name: "Romanian Deadlifts", sets: 3, reps: "10-15", weight: 80 },
        { id: 11, name: "Leg Press", sets: 3, reps: "12-20", weight: 150 },
        { id: 12, name: "Calf Raises", sets: 4, reps: "15-25", weight: 40 },
      ]
    }
  };

  return workoutPlans[day.toLowerCase()] || workoutPlans.monday;
}
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
