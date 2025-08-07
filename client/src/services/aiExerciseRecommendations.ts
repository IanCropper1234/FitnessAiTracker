// AI Exercise Recommendations service - server-side API calls only

interface ExerciseRecommendationRequest {
  userGoals: string[];
  currentExercises: Array<{
    name: string;
    muscleGroups: string[];
    category: string;
  }>;
  trainingHistory: Array<{
    exerciseName: string;
    lastWeight: number;
    lastReps: number;
    progressRate: number;
    fatigueLevel: number;
  }>;
  muscleGroupFocus: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment: string[];
  timeConstraints?: {
    sessionDuration: number;
    sessionsPerWeek: number;
  };
  injuryRestrictions?: string[];
}

interface ExerciseRecommendation {
  exerciseName: string;
  category: string;
  primaryMuscle: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  sets: number;
  reps: string;
  restPeriod: number;
  reasoning: string;
  progressionNotes: string;
  specialMethod?: 'myorepMatch' | 'myorepNoMatch' | 'dropSet' | 'giant_set' | null;
  specialConfig?: any;
  rpIntensity: number;
  volumeContribution: number;
}

interface AIRecommendationResponse {
  recommendations: ExerciseRecommendation[];
  reasoning: string;
  rpConsiderations: string;
  progressionPlan: string;
}

export class AIExerciseRecommendationService {
  
  /**
   * Get AI-powered exercise recommendations (enhanced with weekly plans)
   */
  static async getRecommendations(formData: any): Promise<any> {
    try {
      const response = await fetch('/api/ai/exercise-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to get recommendations: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('AI Recommendations error:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered weekly workout plan
   */
  static async getWeeklyWorkoutPlan(formData: any): Promise<any> {
    try {
      const response = await fetch('/api/ai/weekly-workout-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to generate weekly workout plan: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Weekly Workout Plan error:', error);
      throw error;
    }
  }

  /**
   * Save AI-generated weekly workout plan as templates
   */
  static async saveWeeklyWorkoutPlan(data: { weeklyPlan: any; templateNamePrefix: string }): Promise<any> {
    try {
      const response = await fetch('/api/ai/weekly-workout-plan/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to save weekly workout plan: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Save Weekly Plan error:', error);
      throw error;
    }
  }
  
  /**
   * Get AI-powered exercise recommendations based on user data and RP methodology (legacy method)
   */
  static async getExerciseRecommendations(
    request: ExerciseRecommendationRequest
  ): Promise<AIRecommendationResponse> {
    try {
      const response = await fetch('/api/ai/exercise-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting AI exercise recommendations:', error);
      throw new Error(`Failed to get AI recommendations: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get AI analysis of current program and suggest optimizations
   */
  static async analyzeProgramOptimization(
    currentProgram: any,
    userGoals: string[],
    performanceData: any
  ): Promise<{
    analysis: string;
    optimizations: string[];
    rpAdjustments: string[];
  }> {
    try {
      const response = await fetch('/api/ai/program-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentProgram,
          userGoals,
          performanceData
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze program: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error analyzing program:', error);
      throw new Error(`Failed to analyze program: ${error?.message || 'Unknown error'}`);
    }
  }
}