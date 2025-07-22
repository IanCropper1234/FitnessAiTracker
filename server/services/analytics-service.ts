import { db } from "../db";
import { nutritionLogs, bodyMetrics, workoutSessions, workoutExercises, autoRegulationFeedback } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export class AnalyticsService {
  // Get nutrition analytics for a specific time period
  static async getNutritionAnalytics(userId: number, days: number = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Use raw SQL to avoid date conversion issues in Drizzle
      const result = await db.execute(sql`
        SELECT 
          id,
          user_id,
          date,
          food_name,
          quantity,
          unit,
          calories,
          protein,
          carbs,
          fat,
          meal_type,
          meal_order,
          category,
          created_at
        FROM nutrition_logs 
        WHERE user_id = ${userId}
          AND date >= ${startDate.toISOString().split('T')[0]}
          AND date <= ${endDate.toISOString().split('T')[0]}
        ORDER BY date DESC
      `);

      const logs = result.rows || [];

      if (logs.length === 0) {
        return {
          data: [],
          dailyData: [],
          averages: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          totalLogs: 0,
          totalDays: 0,
          summary: {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0
          }
        };
      }

      // Calculate daily totals
      const dailyTotals = logs.reduce((acc: any, log: any) => {
        const logDate = new Date(log.date);
        const dateKey = logDate.toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            logCount: 0
          };
        }
        
        acc[dateKey].calories += parseFloat(log.calories?.toString() || '0');
        acc[dateKey].protein += parseFloat(log.protein?.toString() || '0');
        acc[dateKey].carbs += parseFloat(log.carbs?.toString() || '0');
        acc[dateKey].fat += parseFloat(log.fat?.toString() || '0');
        acc[dateKey].logCount += 1;
        
        return acc;
      }, {});

      const dailyData = Object.values(dailyTotals);
      const totalDays = Math.max(dailyData.length, 1);
      
      // Calculate averages
      const averages = {
        calories: Math.round(dailyData.reduce((sum: number, day: any) => sum + day.calories, 0) / totalDays),
        protein: Math.round(dailyData.reduce((sum: number, day: any) => sum + day.protein, 0) / totalDays),
        carbs: Math.round(dailyData.reduce((sum: number, day: any) => sum + day.carbs, 0) / totalDays),
        fat: Math.round(dailyData.reduce((sum: number, day: any) => sum + day.fat, 0) / totalDays)
      };

      return {
        data: logs,
        dailyData: dailyData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        averages,
        totalLogs: logs.length,
        totalDays: dailyData.length,
        summary: {
          totalCalories: dailyData.reduce((sum: number, day: any) => sum + day.calories, 0),
          totalProtein: dailyData.reduce((sum: number, day: any) => sum + day.protein, 0),
          totalCarbs: dailyData.reduce((sum: number, day: any) => sum + day.carbs, 0),
          totalFat: dailyData.reduce((sum: number, day: any) => sum + day.fat, 0)
        }
      };
    } catch (error) {
      console.error('Error in getNutritionAnalytics:', error);
      throw new Error('Failed to fetch nutrition analytics');
    }
  }

  // Get training analytics for a specific time period
  static async getTrainingAnalytics(userId: number, days: number = 30) {
    try {
      // Calculate date range - include both past and future sessions within the window
      const centerDate = new Date();
      const startDate = new Date();
      startDate.setDate(centerDate.getDate() - days);
      const endDate = new Date();
      endDate.setDate(centerDate.getDate() + days); // Allow future sessions too
      
      // Use raw SQL for training sessions - get all completed sessions, then filter by date range
      const sessionResult = await db.execute(sql`
        SELECT 
          id,
          user_id,
          program_id,
          mesocycle_id,
          date,
          name,
          is_completed,
          total_volume,
          duration,
          created_at
        FROM workout_sessions 
        WHERE user_id = ${userId}
          AND is_completed = true
        ORDER BY date DESC
      `);

      const allSessions = sessionResult.rows || [];

      // Filter sessions by date range in JavaScript since SQL date filtering was problematic
      const sessions = allSessions.filter((session: any) => {
        const sessionDate = new Date(session.date);
        const daysDifference = Math.abs((centerDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDifference <= days;
      });

      if (sessions.length === 0) {
        return {
          data: [],
          weeklyData: [],
          summary: {
            totalSessions: 0,
            totalVolume: 0,
            averageDuration: 0,
            weeklyFrequency: 0
          }
        };
      }

      // Calculate weekly aggregations for RP methodology
      const weeklyData = sessions.reduce((acc: any, session: any) => {
        const sessionDate = new Date(session.date);
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!acc[weekKey]) {
          acc[weekKey] = {
            weekStart: weekKey,
            sessions: 0,
            totalVolume: 0,
            totalDuration: 0,
            averageVolume: 0,
            averageDuration: 0
          };
        }
        
        acc[weekKey].sessions += 1;
        acc[weekKey].totalVolume += parseInt(session.total_volume?.toString() || '0');
        acc[weekKey].totalDuration += parseInt(session.duration?.toString() || '0');
        
        return acc;
      }, {});

      // Calculate averages for each week
      Object.values(weeklyData).forEach((week: any) => {
        week.averageVolume = Math.round(week.totalVolume / week.sessions);
        week.averageDuration = Math.round(week.totalDuration / week.sessions);
      });

      const weeklyDataArray = Object.values(weeklyData);
      
      const totalVolume = sessions.reduce((sum: number, session: any) => sum + parseInt(session.total_volume?.toString() || '0'), 0);
      const averageWeeklyVolume = weeklyDataArray.length > 0 ? Math.round(totalVolume / weeklyDataArray.length) : 0;
      
      const summary = {
        totalSessions: sessions.length,
        totalVolume: totalVolume,
        averageDuration: Math.round(sessions.reduce((sum: number, session: any) => sum + parseInt(session.duration?.toString() || '0'), 0) / sessions.length),
        weeklyFrequency: Math.round((sessions.length / Math.max(weeklyDataArray.length, 1)) * 10) / 10,
        averageWeeklyVolume: averageWeeklyVolume,
        averageSessionDuration: Math.round(sessions.reduce((sum: number, session: any) => sum + parseInt(session.duration?.toString() || '0'), 0) / sessions.length),
        totalDuration: sessions.reduce((sum: number, session: any) => sum + parseInt(session.duration?.toString() || '0'), 0)
      };

      return {
        data: sessions,
        weeklyData: weeklyDataArray.sort((a: any, b: any) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()),
        summary
      };
    } catch (error) {
      console.error('Error in getTrainingAnalytics:', error);
      throw new Error('Failed to fetch training analytics');
    }
  }

  // Get body progress analytics
  static async getBodyProgressAnalytics(userId: number, days: number = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Use raw SQL for body metrics - get ALL metrics to properly calculate weight change
      const result = await db.execute(sql`
        SELECT 
          id,
          user_id,
          date,
          weight,
          body_fat_percentage,
          neck,
          chest,
          waist,
          hips,
          thigh,
          bicep,
          unit,
          created_at
        FROM body_metrics 
        WHERE user_id = ${userId}
        ORDER BY date ASC
      `);

      const metrics = result.rows || [];

      if (metrics.length === 0) {
        return {
          data: [],
          summary: {
            totalEntries: 0,
            currentWeight: null,
            currentBodyFat: null
          },
          progress: {
            weightChange: 0,
            bodyFatChange: 0,
            trend: 'stable'
          }
        };
      }

      // Sort by date first, then by created_at for same-date entries to get truly latest
      const sortedMetrics = metrics.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA === dateB) {
          // If same date, sort by created_at to get most recent entry
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return dateA - dateB;
      });
      const latest = sortedMetrics[sortedMetrics.length - 1];
      const earliest = sortedMetrics[0];

      const weightChange = latest.weight && earliest.weight 
        ? parseFloat(latest.weight.toString()) - parseFloat(earliest.weight.toString())
        : 0;
      
      const bodyFatChange = latest.body_fat_percentage && earliest.body_fat_percentage
        ? parseFloat(latest.body_fat_percentage.toString()) - parseFloat(earliest.body_fat_percentage.toString())
        : 0;

      let trend = 'stable';
      if (Math.abs(weightChange) > 0.5) {
        trend = weightChange > 0 ? 'gain' : 'loss';
      }

      return {
        data: metrics,
        summary: {
          totalEntries: metrics.length,
          currentWeight: latest.weight ? parseFloat(latest.weight.toString()) : null,
          currentBodyFat: latest.body_fat_percentage ? parseFloat(latest.body_fat_percentage.toString()) : null
        },
        progress: {
          weightChange: Math.round(weightChange * 10) / 10,
          bodyFatChange: Math.round(bodyFatChange * 10) / 10,
          trend
        }
      };
    } catch (error) {
      console.error('Error in getBodyProgressAnalytics:', error);
      throw new Error('Failed to fetch body progress analytics');
    }
  }

  // Get auto-regulation feedback analytics
  static async getFeedbackAnalytics(userId: number, days: number = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Use raw SQL for feedback data - get all feedback then filter by date
      const result = await db.execute(sql`
        SELECT 
          arf.id,
          arf.session_id,
          arf.user_id,
          arf.pump_quality,
          arf.muscle_soreness,
          arf.perceived_effort,
          arf.energy_level,
          arf.sleep_quality,
          arf.created_at,
          ws.date as session_date
        FROM auto_regulation_feedback arf
        JOIN workout_sessions ws ON arf.session_id = ws.id
        WHERE arf.user_id = ${userId}
        ORDER BY ws.date DESC
      `);

      const allFeedbackData = result.rows || [];

      // Filter feedback by date range in JavaScript
      const feedbackData = allFeedbackData.filter((feedback: any) => {
        const sessionDate = new Date(feedback.session_date);
        const daysDifference = Math.abs((endDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDifference <= days;
      });

      if (feedbackData.length === 0) {
        return {
          data: [],
          averages: {
            pumpQuality: 0,
            muscleSoreness: 0,
            perceivedEffort: 0,
            energyLevel: 0,
            sleepQuality: 0
          },
          summary: {
            recoveryScore: 0,
            fatigueScore: 0,
            totalFeedback: 0
          },
          trends: {
            pumpQuality: 0,
            energyLevel: 0,
            sleepQuality: 0
          }
        };
      }

      // Calculate averages following RP methodology
      const averages = {
        pumpQuality: Math.round((feedbackData.reduce((sum: number, fb: any) => sum + parseInt(fb.pump_quality?.toString() || '0'), 0) / feedbackData.length) * 10) / 10,
        muscleSoreness: Math.round((feedbackData.reduce((sum: number, fb: any) => sum + parseInt(fb.muscle_soreness?.toString() || '0'), 0) / feedbackData.length) * 10) / 10,
        perceivedEffort: Math.round((feedbackData.reduce((sum: number, fb: any) => sum + parseInt(fb.perceived_effort?.toString() || '0'), 0) / feedbackData.length) * 10) / 10,
        energyLevel: Math.round((feedbackData.reduce((sum: number, fb: any) => sum + parseInt(fb.energy_level?.toString() || '0'), 0) / feedbackData.length) * 10) / 10,
        sleepQuality: Math.round((feedbackData.reduce((sum: number, fb: any) => sum + parseInt(fb.sleep_quality?.toString() || '0'), 0) / feedbackData.length) * 10) / 10
      };

      // RP methodology: Recovery score calculation (weighted scoring)
      const recoveryScore = Math.round(
        (averages.sleepQuality * 0.3 + 
         averages.energyLevel * 0.3 + 
         (10 - averages.muscleSoreness) * 0.25 + 
         (10 - averages.perceivedEffort) * 0.15) * 10
      ) / 10;

      // RP methodology: Fatigue score calculation
      const fatigueScore = Math.round(
        (averages.perceivedEffort * 0.4 + 
         averages.muscleSoreness * 0.35 + 
         (10 - averages.energyLevel) * 0.25) * 10
      ) / 10;

      // Calculate trends (compare first and second half of period)
      const midPoint = Math.floor(feedbackData.length / 2);
      const firstHalf = feedbackData.slice(0, midPoint);
      const secondHalf = feedbackData.slice(midPoint);

      const trends = {
        pumpQuality: 0,
        energyLevel: 0,
        sleepQuality: 0
      };

      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstHalfAvg = {
          pump: firstHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.pump_quality?.toString() || '0'), 0) / firstHalf.length,
          energy: firstHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.energy_level?.toString() || '0'), 0) / firstHalf.length,
          sleep: firstHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.sleep_quality?.toString() || '0'), 0) / firstHalf.length
        };
        
        const secondHalfAvg = {
          pump: secondHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.pump_quality?.toString() || '0'), 0) / secondHalf.length,
          energy: secondHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.energy_level?.toString() || '0'), 0) / secondHalf.length,
          sleep: secondHalf.reduce((sum: number, fb: any) => sum + parseInt(fb.sleep_quality?.toString() || '0'), 0) / secondHalf.length
        };

        trends.pumpQuality = Math.round((secondHalfAvg.pump - firstHalfAvg.pump) * 10) / 10;
        trends.energyLevel = Math.round((secondHalfAvg.energy - firstHalfAvg.energy) * 10) / 10;
        trends.sleepQuality = Math.round((secondHalfAvg.sleep - firstHalfAvg.sleep) * 10) / 10;
      }

      return {
        data: feedbackData,
        averages,
        summary: {
          recoveryScore,
          fatigueScore,
          totalFeedback: feedbackData.length
        },
        trends
      };
    } catch (error) {
      console.error('Error in getFeedbackAnalytics:', error);
      throw new Error('Failed to fetch feedback analytics');
    }
  }

  // Get comprehensive analytics combining all modules
  static async getComprehensiveAnalytics(userId: number, days: number = 30) {
    try {
      const [nutrition, training, bodyProgress, feedback] = await Promise.all([
        this.getNutritionAnalytics(userId, days),
        this.getTrainingAnalytics(userId, days),
        this.getBodyProgressAnalytics(userId, days),
        this.getFeedbackAnalytics(userId, days)
      ]);

      // Calculate nutrition adherence percentage against targets
      let adherencePercentage = 0;
      try {
        // Get user's nutrition goals
        const goalsResult = await db.execute(sql`
          SELECT daily_calories, protein, carbs, fat
          FROM nutrition_goals 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 1
        `);
        
        if (goalsResult.rows && goalsResult.rows.length > 0 && nutrition.dailyData.length > 0) {
          const goals = goalsResult.rows[0] as any;
          const targetCalories = parseFloat(goals.daily_calories?.toString() || '2000');
          
          // Calculate adherence for each day with nutrition logs
          let totalAdherence = 0;
          let daysWithLogs = 0;
          
          nutrition.dailyData.forEach((day: any) => {
            if (day.calories > 0) {
              const dailyAdherence = Math.max(0, 100 - Math.abs((day.calories - targetCalories) / targetCalories * 100));
              totalAdherence += dailyAdherence;
              daysWithLogs++;
            }
          });
          
          adherencePercentage = daysWithLogs > 0 ? Math.round(totalAdherence / daysWithLogs) : 0;
        }
      } catch (error) {
        console.error('Error calculating adherence:', error);
        adherencePercentage = 0;
      }

      // Create comprehensive overview metrics following RP principles
      const overview = {
        nutritionConsistency: nutrition.totalDays > 0 ? Math.round((nutrition.totalLogs / (nutrition.totalDays * 4)) * 100) : 0, // Assuming 4 meals/day target
        trainingConsistency: training.summary.weeklyFrequency > 0 ? Math.round((training.summary.weeklyFrequency / 4) * 100) : 0, // Assuming 4 sessions/week target
        recoveryScore: feedback.summary.recoveryScore || 0,
        progressTrend: bodyProgress.progress.trend,
        weightChange: bodyProgress.progress.weightChange || 0,
        totalNutritionLogs: nutrition.totalLogs || 0,
        totalTrainingSessions: training.summary.totalSessions || 0,
        totalBodyMetrics: bodyProgress.summary.totalEntries || 0,
        totalFeedbackEntries: feedback.summary.totalFeedback || 0,
        averageSessionsPerWeek: training.summary.weeklyFrequency || 0,
        averageCaloriesPerDay: nutrition.averages.calories || 0
      };

      // Add nutrition object with adherence percentage
      const enhancedNutrition = {
        ...nutrition,
        adherencePercentage
      };

      return {
        overview,
        nutrition: enhancedNutrition,
        training,
        bodyProgress,
        feedback,
        period: {
          days,
          startDate: new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      console.error('Error in getComprehensiveAnalytics:', error);
      throw new Error('Failed to fetch comprehensive analytics');
    }
  }
}