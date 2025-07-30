import { db } from "../db";
import { dailyWellnessCheckins, weeklyWellnessSummaries } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export class DailyWellnessService {
  // Get daily wellness checkin for specific date
  static async getDailyCheckin(userId: number, date: Date) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const checkins = await db.select()
      .from(dailyWellnessCheckins)
      .where(and(
        eq(dailyWellnessCheckins.userId, userId),
        gte(dailyWellnessCheckins.date, dateStart),
        lte(dailyWellnessCheckins.date, dateEnd)
      ));

    return checkins[0] || null;
  }

  // Create or update daily wellness checkin
  static async upsertDailyCheckin(userId: number, date: Date, wellnessData: {
    energyLevel: number;
    hungerLevel: number;
    sleepQuality?: number;
    stressLevel?: number;
    cravingsIntensity?: number;
    adherencePerception?: number;
    notes?: string;
  }) {
    const existingCheckin = await this.getDailyCheckin(userId, date);

    if (existingCheckin) {
      // Update existing checkin
      const updated = await db.update(dailyWellnessCheckins)
        .set({
          ...wellnessData,
          updatedAt: new Date()
        })
        .where(eq(dailyWellnessCheckins.id, existingCheckin.id))
        .returning();
      
      return updated[0];
    } else {
      // Create new checkin
      const newCheckin = await db.insert(dailyWellnessCheckins)
        .values({
          userId,
          date,
          ...wellnessData
        })
        .returning();
      
      return newCheckin[0];
    }
  }

  // Get daily checkins for a date range
  static async getDailyCheckins(userId: number, startDate: Date, endDate: Date) {
    const checkins = await db.select()
      .from(dailyWellnessCheckins)
      .where(and(
        eq(dailyWellnessCheckins.userId, userId),
        gte(dailyWellnessCheckins.date, startDate),
        lte(dailyWellnessCheckins.date, endDate)
      ))
      .orderBy(desc(dailyWellnessCheckins.date));

    return checkins;
  }

  // Calculate weekly averages from daily checkins
  static async calculateWeeklyAverages(userId: number, weekStartDate: Date) {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // 7 days total
    weekEndDate.setHours(23, 59, 59, 999);

    const dailyCheckins = await this.getDailyCheckins(userId, weekStartDate, weekEndDate);
    
    if (dailyCheckins.length === 0) {
      return null; // No data for this week
    }

    // Calculate averages for each metric
    const averages = {
      avgEnergyLevel: 0,
      avgHungerLevel: 0,
      avgSleepQuality: 0,
      avgStressLevel: 0,
      avgCravingsIntensity: 0,
      avgAdherencePerception: 0,
      daysTracked: dailyCheckins.length
    };

    // Sum up all values
    dailyCheckins.forEach(checkin => {
      averages.avgEnergyLevel += checkin.energyLevel;
      averages.avgHungerLevel += checkin.hungerLevel;
      if (checkin.sleepQuality) averages.avgSleepQuality += checkin.sleepQuality;
      if (checkin.stressLevel) averages.avgStressLevel += checkin.stressLevel;
      if (checkin.cravingsIntensity) averages.avgCravingsIntensity += checkin.cravingsIntensity;
      if (checkin.adherencePerception) averages.avgAdherencePerception += checkin.adherencePerception;
    });

    // Calculate averages with proper null handling
    const energyCount = dailyCheckins.length;
    const hungerCount = dailyCheckins.length;
    const sleepCount = dailyCheckins.filter(c => c.sleepQuality).length;
    const stressCount = dailyCheckins.filter(c => c.stressLevel).length;
    const cravingsCount = dailyCheckins.filter(c => c.cravingsIntensity).length;
    const adherenceCount = dailyCheckins.filter(c => c.adherencePerception).length;

    return {
      avgEnergyLevel: (averages.avgEnergyLevel / energyCount).toFixed(1),
      avgHungerLevel: (averages.avgHungerLevel / hungerCount).toFixed(1),
      avgSleepQuality: sleepCount > 0 ? (averages.avgSleepQuality / sleepCount).toFixed(1) : null,
      avgStressLevel: stressCount > 0 ? (averages.avgStressLevel / stressCount).toFixed(1) : null,
      avgCravingsIntensity: cravingsCount > 0 ? (averages.avgCravingsIntensity / cravingsCount).toFixed(1) : null,
      avgAdherencePerception: adherenceCount > 0 ? (averages.avgAdherencePerception / adherenceCount).toFixed(1) : null,
      daysTracked: dailyCheckins.length
    };
  }

  // Create or update weekly wellness summary
  static async upsertWeeklySummary(userId: number, weekStartDate: Date) {
    const averages = await this.calculateWeeklyAverages(userId, weekStartDate);
    
    if (!averages) {
      return null; // No daily data to summarize
    }

    // Check if summary already exists
    const existingSummary = await db.select()
      .from(weeklyWellnessSummaries)
      .where(and(
        eq(weeklyWellnessSummaries.userId, userId),
        eq(weeklyWellnessSummaries.weekStartDate, weekStartDate)
      ));

    if (existingSummary.length > 0) {
      // Update existing summary
      const updated = await db.update(weeklyWellnessSummaries)
        .set({
          ...averages,
          calculatedAt: new Date()
        })
        .where(eq(weeklyWellnessSummaries.id, existingSummary[0].id))
        .returning();
      
      return updated[0];
    } else {
      // Create new summary
      const newSummary = await db.insert(weeklyWellnessSummaries)
        .values({
          userId,
          weekStartDate,
          ...averages
        })
        .returning();
      
      return newSummary[0];
    }
  }

  // Get weekly wellness summary
  static async getWeeklySummary(userId: number, weekStartDate: Date) {
    const summaries = await db.select()
      .from(weeklyWellnessSummaries)
      .where(and(
        eq(weeklyWellnessSummaries.userId, userId),
        eq(weeklyWellnessSummaries.weekStartDate, weekStartDate)
      ));

    return summaries[0] || null;
  }

  // Get or calculate weekly wellness data for macro adjustments
  static async getWellnessDataForMacroAdjustment(userId: number, weekStartDate: Date) {
    // First try to get existing summary
    let summary = await this.getWeeklySummary(userId, weekStartDate);
    
    // If no summary exists, calculate it from daily data
    if (!summary) {
      summary = await this.upsertWeeklySummary(userId, weekStartDate);
    }

    // If still no summary (no daily data), return defaults
    if (!summary) {
      return {
        energyLevel: 5, // Default middle values
        hungerLevel: 5,
        sleepQuality: 5,
        stressLevel: 5,
        daysTracked: 0
      };
    }

    return {
      energyLevel: parseFloat(summary.avgEnergyLevel || '5'),
      hungerLevel: parseFloat(summary.avgHungerLevel || '5'),
      sleepQuality: parseFloat(summary.avgSleepQuality || '5'),
      stressLevel: parseFloat(summary.avgStressLevel || '5'),
      daysTracked: summary.daysTracked || 0
    };
  }
}