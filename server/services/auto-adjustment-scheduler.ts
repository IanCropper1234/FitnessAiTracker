import { storage } from "../storage-db";
import { AdvancedMacroManagementService } from "./advanced-macro-management";

interface AutoAdjustmentSettings {
  autoAdjustmentEnabled: boolean;
  autoAdjustmentFrequency: 'weekly' | 'biweekly';
  lastAutoAdjustment?: string;
}

export class AutoAdjustmentScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.startScheduler();
  }

  private startScheduler() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Auto-adjustment scheduler started');
    
    // Check once daily at 6 AM for users who need auto-adjustments
    this.intervalId = setInterval(() => {
      this.processAutoAdjustments();
    }, 24 * 60 * 60 * 1000); // Run every 24 hours
    
    // Schedule to run at 6 AM daily
    this.scheduleDaily6AM();
    
    // Also run once immediately (but only in development)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => this.processAutoAdjustments(), 10000);
    }
  }

  private async processAutoAdjustments() {
    try {
      console.log('🔄 Daily auto-adjustment check started...');
      
      // Get all users with auto-adjustment enabled
      const usersWithAutoAdjustment = await this.getUsersWithAutoAdjustmentEnabled();
      
      for (const user of usersWithAutoAdjustment) {
        await this.processUserAutoAdjustment(user);
      }
      
      console.log(`✅ Daily auto-adjustment complete. Processed ${usersWithAutoAdjustment.length} users at ${new Date().toLocaleString()}.`);
    } catch (error) {
      console.error('❌ Error in auto-adjustment scheduler:', error);
    }
  }

  private async getUsersWithAutoAdjustmentEnabled(): Promise<any[]> {
    try {
      // Lightweight approach: only check a limited number of users per run
      // In production, this would be optimized with proper database indexing
      const userIds = [1]; // For now, focus on current user only
      const usersWithAutoAdjustment = [];
      
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (!user?.autoAdjustmentSettings) continue;
        
        const settings = user.autoAdjustmentSettings as AutoAdjustmentSettings;
        if (settings.autoAdjustmentEnabled) {
          usersWithAutoAdjustment.push({ ...user, settings });
        }
      }
      
      return usersWithAutoAdjustment;
    } catch (error) {
      console.error('Error getting users with auto-adjustment:', error);
      return [];
    }
  }

  private async processUserAutoAdjustment(user: any) {
    try {
      const settings = user.settings as AutoAdjustmentSettings;
      const userId = user.id;
      
      console.log(`🔍 Checking auto-adjustment for user ${userId}`);
      
      // Check if adjustment is needed based on frequency and last adjustment
      if (!this.shouldRunAdjustment(settings)) {
        console.log(`⏭️ Skipping user ${userId} - not time for adjustment yet`);
        return;
      }
      
      console.log(`🎯 Running auto-adjustment for user ${userId}`);
      
      // Get current week data
      const currentWeek = this.getCurrentWeekStart();
      
      // Get diet goals
      const dietGoals = await storage.getDietGoal(userId);
      if (!dietGoals) {
        console.log(`⚠️ No diet goals found for user ${userId}`);
        return;
      }

      // Apply the adjustment using the same logic as manual adjustment
      const macroService = new AdvancedMacroManagementService();
      const adjustmentResult = await macroService.calculateWeeklyAdjustment(userId, currentWeek);
      
      if (adjustmentResult.adjustmentPercentage !== 0) {
        await macroService.applyWeeklyAdjustment(userId, currentWeek, adjustmentResult.adjustmentPercentage);
        
        console.log(`✅ Auto-adjustment applied for user ${userId}: ${adjustmentResult.adjustmentPercentage}%`);
        
        // Update last adjustment timestamp
        await this.updateLastAdjustmentTime(userId);
      } else {
        console.log(`📊 No adjustment needed for user ${userId} (0% change)`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing auto-adjustment for user ${user.id}:`, error);
    }
  }

  private shouldRunAdjustment(settings: AutoAdjustmentSettings): boolean {
    if (!settings.lastAutoAdjustment) {
      // First time - run adjustment
      return true;
    }
    
    const lastAdjustment = new Date(settings.lastAutoAdjustment);
    const now = new Date();
    const daysSinceLastAdjustment = Math.floor((now.getTime() - lastAdjustment.getTime()) / (1000 * 60 * 60 * 24));
    
    if (settings.autoAdjustmentFrequency === 'weekly') {
      return daysSinceLastAdjustment >= 7;
    } else if (settings.autoAdjustmentFrequency === 'biweekly') {
      return daysSinceLastAdjustment >= 14;
    }
    
    return false;
  }

  private getCurrentWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate offset to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }

  private async updateLastAdjustmentTime(userId: number) {
    try {
      const user = await storage.getUser(userId);
      if (!user?.autoAdjustmentSettings) return;
      
      const settings = user.autoAdjustmentSettings as AutoAdjustmentSettings;
      const updatedSettings = {
        ...settings,
        lastAutoAdjustment: new Date().toISOString()
      };
      
      await storage.updateUser(userId, {
        autoAdjustmentSettings: updatedSettings
      });
      
      console.log(`📅 Updated last adjustment time for user ${userId}`);
    } catch (error) {
      console.error('Error updating last adjustment time:', error);
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Auto-adjustment scheduler stopped');
  }

  private scheduleDaily6AM() {
    const now = new Date();
    const next6AM = new Date();
    next6AM.setHours(6, 0, 0, 0);
    
    // If it's already past 6 AM today, schedule for tomorrow
    if (now.getHours() >= 6) {
      next6AM.setDate(next6AM.getDate() + 1);
    }
    
    const timeUntil6AM = next6AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.processAutoAdjustments();
      // Set up daily interval starting from 6 AM
      this.intervalId = setInterval(() => {
        this.processAutoAdjustments();
      }, 24 * 60 * 60 * 1000);
    }, timeUntil6AM);
    
    console.log(`📅 Auto-adjustment scheduled for ${next6AM.toLocaleString()}`);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.intervalId ? 'Daily at 6:00 AM' : 'Stopped',
      schedulingMode: 'Optimized - Low server impact'
    };
  }
}

// Export singleton instance
export const autoAdjustmentScheduler = new AutoAdjustmentScheduler();