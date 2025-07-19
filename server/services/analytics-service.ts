import { db } from "../db";
import { nutritionLogs, bodyMetrics, workoutSessions, workoutExercises, autoRegulationFeedback } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, avg, sum, count } from "drizzle-orm";

export class AnalyticsService {
  // Get nutrition analytics for a specific time period
  static async getNutritionAnalytics(userId: number, startDate: string, endDate: string) {
    try {
      const logs = await db
        .select()
        .from(nutritionLogs)
        .where(
          and(
            eq(nutritionLogs.userId, userId),
            gte(nutritionLogs.date, startDate),
            lte(nutritionLogs.date, endDate)
          )
        )
        .orderBy(desc(nutritionLogs.date));

      // Calculate daily totals
      const dailyTotals = logs.reduce((acc, log) => {
        const date = log.date;
        if (!acc[date]) {
          acc[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            logCount: 0
          };
        }
        acc[date].calories += parseFloat(log.calories.toString()) || 0;
        acc[date].protein += parseFloat(log.protein.toString()) || 0;
        acc[date].carbs += parseFloat(log.carbs.toString()) || 0;
        acc[date].fat += parseFloat(log.fat.toString()) || 0;
        acc[date].logCount += 1;
        return acc;
      }, {} as Record<string, any>);

      const dailyData = Object.values(dailyTotals);
      
      // Calculate averages
      const totalDays = dailyData.length;
      const averages = {
        calories: totalDays > 0 ? dailyData.reduce((sum, day) => sum + day.calories, 0) / totalDays : 0,
        protein: totalDays > 0 ? dailyData.reduce((sum, day) => sum + day.protein, 0) / totalDays : 0,
        carbs: totalDays > 0 ? dailyData.reduce((sum, day) => sum + day.carbs, 0) / totalDays : 0,
        fat: totalDays > 0 ? dailyData.reduce((sum, day) => sum + day.fat, 0) / totalDays : 0
      };

      return {
        dailyData: dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        averages,
        totalLogs: logs.length,
        totalDays,
        summary: {
          totalCalories: dailyData.reduce((sum, day) => sum + day.calories, 0),
          totalProtein: dailyData.reduce((sum, day) => sum + day.protein, 0),
          totalCarbs: dailyData.reduce((sum, day) => sum + day.carbs, 0),
          totalFat: dailyData.reduce((sum, day) => sum + day.fat, 0)
        }
      };
    } catch (error) {
      console.error('Error in getNutritionAnalytics:', error);
      throw error;
    }
  }

  // Get training analytics for a specific time period
  static async getTrainingAnalytics(userId: number, startDate: string, endDate: string) {
    try {
      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, userId),
            gte(workoutSessions.date, startDate),
            lte(workoutSessions.date, endDate),
            eq(workoutSessions.isCompleted, true)
          )
        )
        .orderBy(desc(workoutSessions.date));

      // Get exercises for completed sessions
      const exerciseData = [];
      let totalVolume = 0;
      let totalDuration = 0;

      for (const session of sessions) {
        const exercises = await db
          .select()
          .from(workoutExercises)
          .where(
            and(
              eq(workoutExercises.sessionId, session.id),
              eq(workoutExercises.isCompleted, true)
            )
          );

        const sessionVolume = parseFloat(session.totalVolume?.toString() || '0');
        const sessionDuration = parseFloat(session.duration?.toString() || '0');
        
        totalVolume += sessionVolume;
        totalDuration += sessionDuration;

        exerciseData.push({
          date: session.date,
          sessionId: session.id,
          volume: sessionVolume,
          duration: sessionDuration,
          exerciseCount: exercises.length
        });
      }

      // Calculate weekly aggregations
      const weeklyData = exerciseData.reduce((acc, session) => {
        const date = new Date(session.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!acc[weekKey]) {
          acc[weekKey] = {
            weekStart: weekKey,
            sessions: 0,
            totalVolume: 0,
            totalDuration: 0,
            totalExercises: 0
          };
        }
        
        acc[weekKey].sessions += 1;
        acc[weekKey].totalVolume += session.volume;
        acc[weekKey].totalDuration += session.duration;
        acc[weekKey].totalExercises += session.exerciseCount;
        
        return acc;
      }, {} as Record<string, any>);

      return {
        sessions: exerciseData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        weeklyData: Object.values(weeklyData),
        summary: {
          totalSessions: sessions.length,
          totalVolume,
          totalDuration,
          averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
          averageWeeklyVolume: Object.values(weeklyData).length > 0 ? 
            Object.values(weeklyData).reduce((sum: number, week: any) => sum + week.totalVolume, 0) / Object.values(weeklyData).length : 0
        }
      };
    } catch (error) {
      console.error('Error in getTrainingAnalytics:', error);
      throw error;
    }
  }

  // Get body progress analytics
  static async getBodyProgressAnalytics(userId: number, startDate: string, endDate: string) {
    try {
      const metrics = await db
        .select()
        .from(bodyMetrics)
        .where(
          and(
            eq(bodyMetrics.userId, userId),
            gte(bodyMetrics.date, startDate),
            lte(bodyMetrics.date, endDate)
          )
        )
        .orderBy(desc(bodyMetrics.date));

      if (metrics.length === 0) {
        return {
          data: [],
          progress: null,
          summary: {
            totalEntries: 0,
            weightChange: 0,
            bodyFatChange: 0
          }
        };
      }

      const latest = metrics[0];
      const earliest = metrics[metrics.length - 1];

      const weightChange = parseFloat(latest.weight) - parseFloat(earliest.weight);
      const bodyFatChange = latest.bodyFatPercentage && earliest.bodyFatPercentage ?
        parseFloat(latest.bodyFatPercentage) - parseFloat(earliest.bodyFatPercentage) : 0;

      return {
        data: metrics.reverse(), // Order from oldest to newest for charts
        progress: {
          weightChange: Number(weightChange.toFixed(1)),
          bodyFatChange: Number(bodyFatChange.toFixed(1)),
          trend: weightChange > 0 ? 'gain' : weightChange < 0 ? 'loss' : 'maintained',
          timespan: Math.ceil((new Date(latest.date).getTime() - new Date(earliest.date).getTime()) / (1000 * 60 * 60 * 24))
        },
        summary: {
          totalEntries: metrics.length,
          currentWeight: parseFloat(latest.weight),
          currentBodyFat: latest.bodyFatPercentage ? parseFloat(latest.bodyFatPercentage) : null,
          weightChange,
          bodyFatChange
        }
      };
    } catch (error) {
      console.error('Error in getBodyProgressAnalytics:', error);
      throw error;
    }
  }

  // Get auto-regulation feedback analytics
  static async getFeedbackAnalytics(userId: number, startDate: string, endDate: string) {
    try {
      const feedback = await db
        .select()
        .from(autoRegulationFeedback)
        .where(
          and(
            eq(autoRegulationFeedback.userId, userId),
            gte(autoRegulationFeedback.createdAt, startDate),
            lte(autoRegulationFeedback.createdAt, endDate)
          )
        )
        .orderBy(desc(autoRegulationFeedback.createdAt));

      if (feedback.length === 0) {
        return {
          data: [],
          averages: null,
          trends: null
        };
      }

      // Calculate averages
      const averages = {
        pumpQuality: feedback.reduce((sum, f) => sum + (f.pumpQuality || 0), 0) / feedback.length,
        muscleSoreness: feedback.reduce((sum, f) => sum + (f.muscleSoreness || 0), 0) / feedback.length,
        perceivedEffort: feedback.reduce((sum, f) => sum + (f.perceivedEffort || 0), 0) / feedback.length,
        energyLevel: feedback.reduce((sum, f) => sum + (f.energyLevel || 0), 0) / feedback.length,
        sleepQuality: feedback.reduce((sum, f) => sum + (f.sleepQuality || 0), 0) / feedback.length
      };

      // Calculate trends (last 7 entries vs previous 7)
      let trends = null;
      if (feedback.length >= 14) {
        const recent = feedback.slice(0, 7);
        const previous = feedback.slice(7, 14);
        
        const recentAvgs = {
          pumpQuality: recent.reduce((sum, f) => sum + (f.pumpQuality || 0), 0) / recent.length,
          energyLevel: recent.reduce((sum, f) => sum + (f.energyLevel || 0), 0) / recent.length,
          sleepQuality: recent.reduce((sum, f) => sum + (f.sleepQuality || 0), 0) / recent.length
        };
        
        const previousAvgs = {
          pumpQuality: previous.reduce((sum, f) => sum + (f.pumpQuality || 0), 0) / previous.length,
          energyLevel: previous.reduce((sum, f) => sum + (f.energyLevel || 0), 0) / previous.length,
          sleepQuality: previous.reduce((sum, f) => sum + (f.sleepQuality || 0), 0) / previous.length
        };

        trends = {
          pumpQuality: recentAvgs.pumpQuality - previousAvgs.pumpQuality,
          energyLevel: recentAvgs.energyLevel - previousAvgs.energyLevel,
          sleepQuality: recentAvgs.sleepQuality - previousAvgs.sleepQuality
        };
      }

      return {
        data: feedback.reverse(), // Order from oldest to newest
        averages: {
          pumpQuality: Number(averages.pumpQuality.toFixed(1)),
          muscleSoreness: Number(averages.muscleSoreness.toFixed(1)),
          perceivedEffort: Number(averages.perceivedEffort.toFixed(1)),
          energyLevel: Number(averages.energyLevel.toFixed(1)),
          sleepQuality: Number(averages.sleepQuality.toFixed(1))
        },
        trends: trends ? {
          pumpQuality: Number(trends.pumpQuality.toFixed(1)),
          energyLevel: Number(trends.energyLevel.toFixed(1)),
          sleepQuality: Number(trends.sleepQuality.toFixed(1))
        } : null,
        summary: {
          totalEntries: feedback.length,
          recoveryScore: Number(((averages.energyLevel + averages.sleepQuality) / 2).toFixed(1)),
          fatigueScore: Number(((averages.muscleSoreness + averages.perceivedEffort) / 2).toFixed(1))
        }
      };
    } catch (error) {
      console.error('Error in getFeedbackAnalytics:', error);
      throw error;
    }
  }

  // Get comprehensive analytics summary
  static async getComprehensiveAnalytics(userId: number, startDate: string, endDate: string) {
    try {
      const [nutrition, training, bodyProgress, feedback] = await Promise.all([
        this.getNutritionAnalytics(userId, startDate, endDate),
        this.getTrainingAnalytics(userId, startDate, endDate),
        this.getBodyProgressAnalytics(userId, startDate, endDate),
        this.getFeedbackAnalytics(userId, startDate, endDate)
      ]);

      return {
        nutrition,
        training,
        bodyProgress,
        feedback,
        overview: {
          totalNutritionLogs: nutrition.totalLogs,
          totalTrainingSessions: training.summary.totalSessions,
          totalBodyMetrics: bodyProgress.summary.totalEntries,
          totalFeedbackEntries: feedback.summary?.totalEntries || 0,
          averageCaloriesPerDay: Math.round(nutrition.averages.calories),
          averageSessionsPerWeek: training.summary.totalSessions > 0 ? 
            Number((training.summary.totalSessions / Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))).toFixed(1)) : 0,
          weightChange: bodyProgress.progress?.weightChange || 0,
          recoveryScore: feedback.summary?.recoveryScore || 0
        }
      };
    } catch (error) {
      console.error('Error in getComprehensiveAnalytics:', error);
      throw error;
    }
  }
}