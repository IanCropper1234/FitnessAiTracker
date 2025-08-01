import { db } from "./db";
import { eq, and, desc, gte } from "drizzle-orm";
import { autoRegulationFeedback, workoutSessions, volumeLandmarks, exerciseMuscleMapping, workoutExercises, muscleGroups } from "../shared/schema";

interface VolumeRecommendation {
  muscleGroupId: number;
  muscleGroupName: string;
  currentVolume: number;
  recommendedAdjustment: number; // percentage change
  adjustmentReason: string;
  confidenceLevel: number; // 1-10
  recommendation: "increase" | "decrease" | "maintain" | "deload";
}

interface FatigueAnalysis {
  overallFatigue: number; // 1-10 scale
  recoveryTrend: "improving" | "declining" | "stable";
  deloadRecommended: boolean;
  daysToDeload?: number;
  muscleGroupFatigue: Array<{
    muscleGroupId: number;
    muscleGroupName: string;
    fatigueLevel: number;
    volumeStress: number;
  }>;
}

// Auto-regulation algorithm based on Renaissance Periodization methodology
export async function generateVolumeRecommendations(
  userId: number,
  feedback?: any
): Promise<VolumeRecommendation[]> {
  try {
    const recommendations: VolumeRecommendation[] = [];
    
    // Get user's volume landmarks
    const landmarks = await db.select().from(volumeLandmarks).where(eq(volumeLandmarks.userId, userId));
    
    // Get recent workout sessions (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    
    const recentSessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, recentDate),
          eq(workoutSessions.isCompleted, true)
        )
      )
      .orderBy(desc(workoutSessions.date));

    console.log(`Generating volume recommendations for user ${userId}, found ${landmarks.length} muscle group landmarks`);

    for (const landmark of landmarks) {
      const [muscleGroup] = await db.select().from(muscleGroups).where(eq(muscleGroups.id, landmark.muscleGroupId));
      if (!muscleGroup) continue;

      // Calculate current weekly volume for this muscle group
      const currentVolume = await calculateMuscleGroupVolume(userId, landmark.muscleGroupId, 7);
      
      // Determine recommendation based on RP methodology
      let recommendation: VolumeRecommendation["recommendation"] = "maintain";
      let adjustmentPercentage = 0;
      let reason = "";
      let confidence = 5;

      // If we have feedback, use it for recommendations
      if (feedback) {
        // Calculate fatigue scores
        const avgRecovery = (feedback.energyLevel + feedback.sleepQuality + (10 - feedback.muscleSoreness)) / 3;
        const avgPerformance = (feedback.pumpQuality + (10 - feedback.perceivedEffort)) / 2;
        const overallReadiness = (avgRecovery + avgPerformance) / 2;

        // RP Auto-regulation Logic
        if (overallReadiness >= 8) {
          // High readiness - can increase volume
        if (currentVolume < landmark.mav) {
          recommendation = "increase";
          adjustmentPercentage = 10; // 10% increase
          reason = "High recovery and performance scores indicate capacity for increased volume";
          confidence = 8;
        } else {
          recommendation = "maintain";
          reason = "Already at Maximum Adaptive Volume (MAV)";
          confidence = 9;
        }
      } else if (overallReadiness <= 4) {
        // Low readiness - reduce volume or deload
        if (currentVolume > landmark.mev) {
          recommendation = "decrease";
          adjustmentPercentage = -15; // 15% decrease
          reason = "Low recovery and performance scores indicate need for volume reduction";
          confidence = 8;
        } else {
          recommendation = "deload";
          adjustmentPercentage = -30; // 30% decrease for deload
          reason = "At minimum effective volume with poor recovery - deload recommended";
          confidence = 9;
        }
      } else if (overallReadiness <= 6) {
        // Moderate readiness - slight adjustments
        if (currentVolume > landmark.mav * 0.9) {
          recommendation = "decrease";
          adjustmentPercentage = -5; // 5% decrease
          reason = "Moderate fatigue with high volume - slight reduction recommended";
          confidence = 6;
        } else {
          recommendation = "maintain";
          reason = "Moderate recovery with appropriate volume";
          confidence = 7;
        }
      } else {
        // Good readiness (6-8) - maintain or slight increase
        if (currentVolume < landmark.mav * 0.8) {
          recommendation = "increase";
          adjustmentPercentage = 5; // 5% increase
          reason = "Good recovery with room for volume increase";
          confidence = 7;
        } else {
          recommendation = "maintain";
          reason = "Optimal volume with good recovery";
          confidence = 8;
        }
      }
      } else {
        // No recent feedback - provide basic volume guidance based on current vs landmarks
        if (currentVolume === 0) {
          recommendation = "increase";
          adjustmentPercentage = 100;
          reason = "No current training volume - start with MEV";
          confidence = 5;
        } else if (currentVolume < landmark.mev) {
          recommendation = "increase";
          adjustmentPercentage = 25;
          reason = "Below minimum effective volume";
          confidence = 6;
        } else if (currentVolume > landmark.mav) {
          recommendation = "maintain";
          adjustmentPercentage = 0;
          reason = "Optimal volume with good recovery";
          confidence = 8;
        } else {
          recommendation = "maintain";
          adjustmentPercentage = 0;
          reason = "Current volume within optimal range";
          confidence = 7;
        }
      }

      recommendations.push({
        muscleGroupId: landmark.muscleGroupId,
        muscleGroupName: muscleGroup.name,
        currentVolume,
        recommendedAdjustment: adjustmentPercentage,
        adjustmentReason: reason,
        confidenceLevel: confidence,
        recommendation,
      });
      
      console.log(`Volume recommendation for ${muscleGroup.name}: ${currentVolume} sets/week, ${recommendation} ${adjustmentPercentage}%`);
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating volume recommendations:', error);
    return [];
  }
}

// Calculate muscle group volume over specified days
async function calculateMuscleGroupVolume(
  userId: number,
  muscleGroupId: number,
  days: number
): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`Calculating volume for muscle group ${muscleGroupId} over ${days} days for user ${userId}`);

    // Get completed workout sessions in date range
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, startDate),
          eq(workoutSessions.isCompleted, true)
        )
      );

    console.log(`Found ${sessions.length} completed sessions in date range`);

    let totalSets = 0;

    for (const session of sessions) {
      // Get workout exercises for this session
      const exercises = await db.select().from(workoutExercises).where(eq(workoutExercises.sessionId, session.id));
      
      for (const exercise of exercises) {
        if (!exercise.isCompleted) continue;
        
        // Check if exercise targets this muscle group (fix column name)
        const mapping = await db
          .select()
          .from(exerciseMuscleMapping)
          .where(
            and(
              eq(exerciseMuscleMapping.exerciseId, exercise.exerciseId),
              eq(exerciseMuscleMapping.muscleGroupId, muscleGroupId)
            )
          );

        if (mapping.length > 0) {
          // Count actual completed sets from setsData instead of just the sets field
          if (exercise.setsData) {
            try {
              const setsData = JSON.parse(exercise.setsData as string);
              const completedSets = setsData.filter((set: any) => set.completed === true).length;
              totalSets += completedSets;
              console.log(`Exercise ${exercise.exerciseId}: ${completedSets} completed sets for muscle group ${muscleGroupId}`);
            } catch (parseError) {
              console.error('Error parsing setsData:', parseError);
              // Fallback to sets field if setsData parsing fails
              totalSets += exercise.sets || 0;
            }
          } else {
            // Fallback to sets field if no setsData
            totalSets += exercise.sets || 0;
          }
        }
      }
    }

    console.log(`Total volume for muscle group ${muscleGroupId}: ${totalSets} sets`);
    return totalSets;
  } catch (error) {
    console.error('Error calculating muscle group volume:', error);
    return 0;
  }
}

// Comprehensive fatigue analysis
export async function getFatigueAnalysis(userId: number, days: number = 14): Promise<FatigueAnalysis> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get recent auto-regulation feedback
    const recentFeedback = await db
      .select({
        feedback: autoRegulationFeedback,
        session: workoutSessions
      })
      .from(autoRegulationFeedback)
      .innerJoin(workoutSessions, eq(autoRegulationFeedback.sessionId, workoutSessions.id))
      .where(
        and(
          eq(autoRegulationFeedback.userId, userId),
          gte(workoutSessions.date, startDate)
        )
      )
      .orderBy(desc(workoutSessions.date));

    if (recentFeedback.length === 0) {
      return {
        overallFatigue: 5,
        recoveryTrend: "stable",
        deloadRecommended: false,
        muscleGroupFatigue: []
      };
    }

    // Calculate overall fatigue trend
    const fatigueScores = recentFeedback.map(item => {
      const recovery = (item.feedback.energyLevel + item.feedback.sleepQuality + (10 - item.feedback.muscleSoreness)) / 3;
      const performance = (item.feedback.pumpQuality + (10 - item.feedback.perceivedEffort)) / 2;
      return 10 - ((recovery + performance) / 2); // Higher score = more fatigue
    });

    const overallFatigue = fatigueScores.reduce((sum, score) => sum + score, 0) / fatigueScores.length;

    // Determine trend (compare first half vs second half)
    const midPoint = Math.floor(fatigueScores.length / 2);
    const earlierAvg = fatigueScores.slice(0, midPoint).reduce((sum, score) => sum + score, 0) / midPoint;
    const recentAvg = fatigueScores.slice(midPoint).reduce((sum, score) => sum + score, 0) / (fatigueScores.length - midPoint);
    
    let recoveryTrend: FatigueAnalysis["recoveryTrend"] = "stable";
    if (recentAvg > earlierAvg + 0.5) {
      recoveryTrend = "declining";
    } else if (recentAvg < earlierAvg - 0.5) {
      recoveryTrend = "improving";
    }

    // Deload recommendation logic (RP methodology)
    const consecutiveHighFatigue = fatigueScores.slice(-3).filter(score => score >= 7).length;
    const deloadRecommended = overallFatigue >= 7 || consecutiveHighFatigue >= 2;
    
    let daysToDeload: number | undefined;
    if (deloadRecommended) {
      daysToDeload = Math.max(3, Math.min(7, Math.round(overallFatigue)));
    }

    // Calculate muscle group specific fatigue
    const allMuscleGroups = await db.select().from(muscleGroups);
    const landmarks = await db.select().from(volumeLandmarks).where(eq(volumeLandmarks.userId, userId));
    const muscleGroupFatigue = await Promise.all(
      allMuscleGroups.map(async (mg) => {
        const volume = await calculateMuscleGroupVolume(userId, mg.id, days);
        const landmark = landmarks.find(l => l.muscleGroupId === mg.id);
        
        let volumeStress = 0;
        let fatigueLevel = overallFatigue; // Default to overall fatigue
        
        if (landmark && landmark.mav > 0) {
          volumeStress = volume / landmark.mav; // Ratio of current to MAV
          fatigueLevel = Math.min(10, overallFatigue * (1 + volumeStress * 0.2));
        }

        return {
          muscleGroupId: mg.id,
          muscleGroupName: mg.name,
          fatigueLevel: Math.round(fatigueLevel * 10) / 10, // Round to 1 decimal
          volumeStress: Math.round(volumeStress * 100) / 100 // Round to 2 decimals
        };
      })
    );

    return {
      overallFatigue,
      recoveryTrend,
      deloadRecommended,
      daysToDeload,
      muscleGroupFatigue
    };
  } catch (error) {
    console.error('Error analyzing fatigue:', error);
    return {
      overallFatigue: 5,
      recoveryTrend: "stable",
      deloadRecommended: false,
      muscleGroupFatigue: []
    };
  }
}

// Get current volume recommendations for user
export async function getVolumeRecommendations(userId: number): Promise<VolumeRecommendation[]> {
  try {
    // Get the most recent feedback (within last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    
    const recentFeedback = await db
      .select()
      .from(autoRegulationFeedback)
      .where(
        and(
          eq(autoRegulationFeedback.userId, userId),
          gte(autoRegulationFeedback.createdAt, recentDate)
        )
      )
      .orderBy(desc(autoRegulationFeedback.createdAt))
      .limit(1);

    // Pass feedback if available, otherwise generate recommendations without feedback
    const feedback = recentFeedback.length > 0 ? recentFeedback[0] : undefined;
    return await generateVolumeRecommendations(userId, feedback);
  } catch (error) {
    console.error('Error getting volume recommendations:', error);
    return [];
  }
}