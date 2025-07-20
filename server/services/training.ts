import { storage } from "../storage";
import type { 
  InsertTrainingProgram, 
  InsertWorkoutSession, 
  InsertWorkoutExercise,
  InsertAutoRegulationFeedback,
  Exercise,
  WorkoutSession,
  TrainingProgram
} from "@shared/schema";

export interface TrainingStats {
  totalSessions: number;
  totalVolume: number;
  averageSessionLength: number;
  favoriteExercises: string[];
  weeklyProgress: Array<{
    week: string;
    sessions: number;
    volume: number;
  }>;
}

export async function getTrainingStats(userId: number, dateFilter?: string): Promise<TrainingStats> {
  try {
    // Get all workout sessions for the user
    const sessions = await storage.getWorkoutSessions(userId, dateFilter);
    const completedSessions = sessions.filter(session => session.isCompleted);
    
    // Calculate total volume
    const totalVolume = completedSessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
    
    // Calculate average session length
    const averageSessionLength = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / completedSessions.length)
      : 0;

    // Get weekly progress for the last 8 weeks
    const weeklyProgress = await getWeeklyProgress(userId, dateFilter);

    return {
      totalSessions: completedSessions.length,
      totalVolume,
      averageSessionLength,
      favoriteExercises: [], // TODO: Implement based on exercise frequency
      weeklyProgress
    };
  } catch (error) {
    console.error('Error getting training stats:', error);
    return {
      totalSessions: 0,
      totalVolume: 0,
      averageSessionLength: 0,
      favoriteExercises: [],
      weeklyProgress: []
    };
  }
}

async function getWeeklyProgress(userId: number, dateFilter?: string) {
  try {
    // Get all completed workout sessions for the user
    const sessions = await storage.getWorkoutSessions(userId, dateFilter);
    const completedSessions = sessions.filter(session => session.isCompleted);
    
    if (completedSessions.length === 0) {
      return [];
    }
    
    // Group sessions by week directly from their dates
    const weekGroups: { [key: string]: { sessions: number; volume: number; weekStart: Date } } = {};
    
    completedSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      
      // Calculate week start (Sunday) for this session
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          sessions: 0,
          volume: 0,
          weekStart: new Date(weekStart)
        };
      }
      
      weekGroups[weekKey].sessions++;
      weekGroups[weekKey].volume += (session.totalVolume || 0);
    });
    
    // Convert to array and sort by date (most recent first)
    const weeklyData = Object.entries(weekGroups)
      .map(([weekKey, data]) => ({
        week: weekKey,
        sessions: data.sessions,
        volume: data.volume,
        weekStart: data.weekStart
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime()) // Oldest first for chart display
      .slice(-8); // Take last 8 weeks
    
    console.log('Weekly progress calculated:', weeklyData.length, 'weeks with data');
    
    return weeklyData.map(week => ({
      week: week.week,
      sessions: week.sessions,
      volume: week.volume
    }));
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    return [];
  }
  
  return weeks;
}

export async function createWorkoutSession(
  userId: number, 
  programId: number, 
  sessionData: Omit<InsertWorkoutSession, 'userId' | 'programId'>
): Promise<WorkoutSession> {
  const newSession: InsertWorkoutSession = {
    userId,
    programId,
    ...sessionData
  };
  
  return await storage.createWorkoutSession(newSession);
}

export async function getWorkoutPlan(userId: number, date: string) {
  // TODO: Implement workout plan generation based on training program
  // This would use RP methodology to determine:
  // - Which muscle groups to train
  // - Volume landmarks (MEV, MAV, MRV)
  // - Exercise selection based on training phase
  
  return {
    date,
    exercises: [],
    estimatedDuration: 0,
    focus: "Full Body" // or "Push", "Pull", "Legs"
  };
}

export async function processAutoRegulation(
  sessionId: number,
  userId: number,
  feedback: Omit<InsertAutoRegulationFeedback, 'sessionId' | 'userId'>
): Promise<void> {
  const feedbackData: InsertAutoRegulationFeedback = {
    sessionId,
    userId,
    ...feedback
  };
  
  await storage.createAutoRegulationFeedback(feedbackData);
  
  // TODO: Process auto-regulation logic
  // This would analyze feedback and suggest:
  // - Volume adjustments for next session
  // - Load progression recommendations
  // - Deload recommendations if fatigue is high
}

export async function calculateVolumeProgression(
  userId: number,
  muscleGroup: string,
  currentWeek: number
): Promise<{
  currentVolume: number;
  suggestedVolume: number;
  isDeloadWeek: boolean;
  reasoning: string;
}> {
  // TODO: Implement RP volume progression logic
  // This would consider:
  // - Current week in mesocycle
  // - Auto-regulation feedback
  // - Volume landmarks (MEV, MAV, MRV)
  // - Progressive overload principles
  
  return {
    currentVolume: 0,
    suggestedVolume: 0,
    isDeloadWeek: false,
    reasoning: "Volume progression calculation not yet implemented"
  };
}

export async function generateWorkoutRecommendations(
  userId: number,
  targetMuscleGroups: string[],
  availableTime: number, // minutes
  equipment: string[]
): Promise<{
  exercises: Exercise[];
  estimatedDuration: number;
  volumeTargets: Record<string, number>;
}> {
  // TODO: Implement intelligent workout generation
  // This would consider:
  // - User's training history
  // - Volume landmarks
  // - Exercise selection based on movement patterns
  // - Fatigue management
  
  return {
    exercises: [],
    estimatedDuration: 0,
    volumeTargets: {}
  };
}