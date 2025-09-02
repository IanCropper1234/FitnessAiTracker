import { db } from "../db";
import { 
  dailyWellnessCheckins, 
  mesocycles, 
  dietGoals,
  weeklyWellnessSummaries
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface IllnessInfo {
  isDetected: boolean;
  severity: number; // 1-5 scale
  type: string;
  autoDetected: boolean;
  confidence: number; // 0-1 scale for auto-detection
  triggers: string[];
}

interface MesocyclePauseResult {
  success: boolean;
  mesocycleId: number;
  pausedAt: Date;
  preIllnessWeek: number;
  adjustments: any;
}

interface IllnessDetectionTriggers {
  energyDrop: boolean;
  sleepDisruption: boolean;
  stressPeak: boolean;
  consistentDecline: boolean;
  manualReport: boolean;
}

export class IllnessDetectionService {
  
  /**
   * Analyze recent wellness data to detect potential illness onset
   * Based on RP methodology for recognizing systemic fatigue patterns
   */
  static async detectIllnessTriggers(userId: number): Promise<IllnessInfo> {
    // Get last 7 days of wellness check-ins
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCheckins = await db
      .select()
      .from(dailyWellnessCheckins)
      .where(and(
        eq(dailyWellnessCheckins.userId, userId),
        gte(dailyWellnessCheckins.date, sevenDaysAgo)
      ))
      .orderBy(desc(dailyWellnessCheckins.date));

    if (recentCheckins.length < 3) {
      return {
        isDetected: false,
        severity: 0,
        type: "insufficient_data",
        autoDetected: false,
        confidence: 0,
        triggers: ["Need at least 3 days of wellness data"]
      };
    }

    // Check for manual illness reporting first
    const manualIllnessReport = recentCheckins.find(checkin => checkin.illnessStatus);
    if (manualIllnessReport) {
      return {
        isDetected: true,
        severity: manualIllnessReport.illnessSeverity || 3,
        type: manualIllnessReport.illnessType || "reported",
        autoDetected: false,
        confidence: 1.0,
        triggers: ["User reported illness symptoms"]
      };
    }

    // Auto-detection algorithm based on RP fatigue analysis principles
    const triggers = this.analyzeWellnessTrends(recentCheckins);
    
    // Calculate confidence score based on trigger severity
    const confidence = this.calculateDetectionConfidence(triggers, recentCheckins);
    
    // Determine if illness is likely based on RP criteria
    const isDetected = confidence >= 0.6; // 60% confidence threshold
    const severity = this.estimateIllnessSeverity(recentCheckins, triggers);
    const type = this.classifyIllnessType(triggers, recentCheckins);

    return {
      isDetected,
      severity,
      type,
      autoDetected: true,
      confidence,
      triggers: this.formatTriggerMessages(triggers)
    };
  }

  /**
   * Analyze wellness trends to identify illness triggers
   */
  private static analyzeWellnessTrends(checkins: any[]): IllnessDetectionTriggers {
    const energyLevels = checkins.map(c => c.energyLevel).filter(e => e !== null);
    const sleepQualities = checkins.map(c => c.sleepQuality).filter(s => s !== null);
    const stressLevels = checkins.map(c => c.stressLevel).filter(s => s !== null);
    
    // Energy drop detection (RP criterion: 20%+ drop from baseline)
    const avgEnergyLastHalf = energyLevels.slice(0, Math.ceil(energyLevels.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(energyLevels.length / 2);
    const avgEnergyFirstHalf = energyLevels.slice(Math.floor(energyLevels.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(energyLevels.length / 2);
    const energyDrop = avgEnergyFirstHalf > 6 && (avgEnergyFirstHalf - avgEnergyLastHalf) >= 2;

    // Sleep disruption detection (RP criterion: sleep quality <6 for 2+ days)
    const recentPoorSleep = sleepQualities.slice(0, 3).filter(s => s < 6).length >= 2;
    
    // Stress peak detection (stress >7 for 2+ days)
    const recentHighStress = stressLevels.slice(0, 3).filter(s => s > 7).length >= 2;
    
    // Consistent decline across metrics (RP criterion: progressive worsening)
    const consistentDecline = this.detectConsistentDecline(checkins);

    return {
      energyDrop,
      sleepDisruption: recentPoorSleep,
      stressPeak: recentHighStress,
      consistentDecline,
      manualReport: false
    };
  }

  /**
   * Detect consistent decline pattern across multiple wellness metrics
   */
  private static detectConsistentDecline(checkins: any[]): boolean {
    if (checkins.length < 4) return false;

    const metrics = ['energyLevel', 'sleepQuality', 'hungerLevel'];
    let decliningMetrics = 0;

    for (const metric of metrics) {
      const values = checkins.map(c => c[metric]).filter(v => v !== null);
      if (values.length < 3) continue;

      // Check if trend is consistently downward
      const recent = values.slice(0, 2);
      const older = values.slice(-2);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

      if ((avgOlder - avgRecent) >= 1) {
        decliningMetrics++;
      }
    }

    return decliningMetrics >= 2; // 2+ metrics showing decline
  }

  /**
   * Calculate detection confidence based on trigger severity
   */
  private static calculateDetectionConfidence(triggers: IllnessDetectionTriggers, checkins: any[]): number {
    let confidence = 0;

    if (triggers.energyDrop) confidence += 0.3;
    if (triggers.sleepDisruption) confidence += 0.25;
    if (triggers.stressPeak) confidence += 0.2;
    if (triggers.consistentDecline) confidence += 0.35;

    // Boost confidence if multiple severe symptoms
    const severeSymptoms = checkins.filter(c => c.energyLevel <= 3 || c.sleepQuality <= 4).length;
    if (severeSymptoms >= 2) confidence += 0.15;

    return Math.min(1.0, confidence);
  }

  /**
   * Estimate illness severity based on wellness patterns
   */
  private static estimateIllnessSeverity(checkins: any[], triggers: IllnessDetectionTriggers): number {
    const recentCheckin = checkins[0];
    const avgEnergy = checkins.map(c => c.energyLevel).reduce((a, b) => a + b, 0) / checkins.length;
    
    // Severity estimation based on RP recovery guidelines
    if (avgEnergy <= 3 || recentCheckin.energyLevel <= 2) return 4; // Severe
    if (avgEnergy <= 4 && triggers.consistentDecline) return 3; // Moderate-severe
    if (triggers.energyDrop && triggers.sleepDisruption) return 3; // Moderate
    if (triggers.energyDrop || triggers.sleepDisruption) return 2; // Mild-moderate
    return 1; // Mild
  }

  /**
   * Classify illness type based on symptom patterns
   */
  private static classifyIllnessType(triggers: IllnessDetectionTriggers, checkins: any[]): string {
    const avgStress = checkins.map(c => c.stressLevel || 5).reduce((a, b) => a + b, 0) / checkins.length;
    const avgSleep = checkins.map(c => c.sleepQuality || 7).reduce((a, b) => a + b, 0) / checkins.length;
    
    if (triggers.stressPeak && avgStress > 7) return "stress";
    if (triggers.sleepDisruption && avgSleep < 5) return "fatigue";
    if (triggers.energyDrop && triggers.consistentDecline) return "systemic_fatigue";
    return "general_illness";
  }

  /**
   * Format trigger messages for user display
   */
  private static formatTriggerMessages(triggers: IllnessDetectionTriggers): string[] {
    const messages: string[] = [];
    
    if (triggers.energyDrop) {
      messages.push("Significant energy level drop detected");
    }
    if (triggers.sleepDisruption) {
      messages.push("Sleep quality disruption observed");
    }
    if (triggers.stressPeak) {
      messages.push("Elevated stress levels detected");
    }
    if (triggers.consistentDecline) {
      messages.push("Progressive decline across wellness metrics");
    }

    return messages.length > 0 ? messages : ["Multiple wellness indicators suggest recovery need"];
  }

  /**
   * Pause active mesocycle due to illness with RP-based adjustments
   */
  static async pauseMesocycleForIllness(
    userId: number,
    illnessData: IllnessInfo
  ): Promise<MesocyclePauseResult> {
    
    // Find active mesocycle
    const activeMesocycle = await db
      .select()
      .from(mesocycles)
      .where(and(
        eq(mesocycles.userId, userId),
        eq(mesocycles.isActive, true),
        eq(mesocycles.isPaused, false)
      ))
      .limit(1);

    if (activeMesocycle.length === 0) {
      throw new Error("No active mesocycle found to pause");
    }

    const mesocycle = activeMesocycle[0];
    const pausedAt = new Date();
    
    // RP methodology: Store pre-illness state for intelligent recovery
    const adjustments = {
      pauseReason: "illness",
      illnessSeverity: illnessData.severity,
      illnessType: illnessData.type,
      autoDetected: illnessData.autoDetected,
      confidence: illnessData.confidence,
      triggers: illnessData.triggers,
      pausedAt: pausedAt.toISOString(),
      expectedDeload: illnessData.severity >= 3 // Severe illness = deload recommended
    };

    // Update mesocycle with pause information
    await db
      .update(mesocycles)
      .set({
        isPaused: true,
        pauseReason: "illness",
        pausedAt,
        preIllnessWeek: mesocycle.currentWeek,
        illnessAdjustments: adjustments,
        recoveryTrackingStarted: pausedAt
      })
      .where(eq(mesocycles.id, mesocycle.id));

    return {
      success: true,
      mesocycleId: mesocycle.id,
      pausedAt,
      preIllnessWeek: mesocycle.currentWeek,
      adjustments
    };
  }

  /**
   * Evaluate recovery readiness based on RP return-to-training criteria
   */
  static async evaluateRecoveryReadiness(userId: number): Promise<{
    isReadyToResume: boolean;
    recoveryPercentage: number;
    recommendations: string[];
    daysInRecovery: number;
  }> {
    
    // Get paused mesocycle if exists
    const pausedMesocycle = await db
      .select()
      .from(mesocycles)
      .where(and(
        eq(mesocycles.userId, userId),
        eq(mesocycles.isPaused, true),
        eq(mesocycles.pauseReason, "illness")
      ))
      .limit(1);

    if (pausedMesocycle.length === 0) {
      return {
        isReadyToResume: false,
        recoveryPercentage: 0,
        recommendations: ["No paused mesocycle found"],
        daysInRecovery: 0
      };
    }

    const mesocycle = pausedMesocycle[0];
    const pausedAt = new Date(mesocycle.pausedAt!);
    const daysInRecovery = Math.floor((Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Get recent wellness data to assess recovery
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentCheckins = await db
      .select()
      .from(dailyWellnessCheckins)
      .where(and(
        eq(dailyWellnessCheckins.userId, userId),
        gte(dailyWellnessCheckins.date, threeDaysAgo)
      ))
      .orderBy(desc(dailyWellnessCheckins.date));

    if (recentCheckins.length === 0) {
      return {
        isReadyToResume: false,
        recoveryPercentage: 0,
        recommendations: ["Please complete daily wellness check-ins to assess recovery"],
        daysInRecovery
      };
    }

    // RP Recovery Criteria Analysis
    const avgEnergy = recentCheckins.map(c => c.energyLevel).reduce((a, b) => a + b, 0) / recentCheckins.length;
    const avgSleep = recentCheckins.map(c => c.sleepQuality || 7).reduce((a, b) => a + b, 0) / recentCheckins.length;
    const avgStress = recentCheckins.map(c => c.stressLevel || 5).reduce((a, b) => a + b, 0) / recentCheckins.length;
    const avgRecoveryReadiness = recentCheckins.map(c => c.recoveryReadiness || 5).reduce((a, b) => a + b, 0) / recentCheckins.length;
    
    // No illness status reported in recent days
    const noRecentIllness = !recentCheckins.some(c => c.illnessStatus);

    // Calculate recovery percentage
    let recoveryScore = 0;
    if (avgEnergy >= 7) recoveryScore += 30;
    else if (avgEnergy >= 6) recoveryScore += 20;
    else if (avgEnergy >= 5) recoveryScore += 10;

    if (avgSleep >= 7) recoveryScore += 25;
    else if (avgSleep >= 6) recoveryScore += 15;

    if (avgStress <= 5) recoveryScore += 20;
    else if (avgStress <= 6) recoveryScore += 10;

    if (noRecentIllness) recoveryScore += 15;

    if (avgRecoveryReadiness >= 7) recoveryScore += 10;

    const recoveryPercentage = Math.min(100, recoveryScore);

    // RP Return Criteria: 80%+ recovery score and no illness for 2+ days
    const isReadyToResume = recoveryPercentage >= 80 && noRecentIllness && daysInRecovery >= 2;

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgEnergy < 7) {
      recommendations.push("Focus on improving energy levels through rest and nutrition");
    }
    if (avgSleep < 7) {
      recommendations.push("Prioritize sleep quality and duration");
    }
    if (avgStress > 5) {
      recommendations.push("Manage stress levels before resuming intense training");
    }
    if (!noRecentIllness) {
      recommendations.push("Wait until illness symptoms fully resolve");
    }
    if (daysInRecovery < 2) {
      recommendations.push("Allow at least 2 symptom-free days before training resumption");
    }

    if (isReadyToResume) {
      recommendations.push("Recovery criteria met - safe to resume training with reduced volume");
    }

    return {
      isReadyToResume,
      recoveryPercentage,
      recommendations,
      daysInRecovery
    };
  }
}