import { storage } from "./storage";
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
    
    // Check every hour for users who need auto-adjustments
    this.intervalId = setInterval(() => {
      this.processAutoAdjustments();
    }, 60 * 60 * 1000); // Run every hour
    
    // Also run once immediately
    setTimeout(() => this.processAutoAdjustments(), 5000);
  }

  private async processAutoAdjustments() {
    try {
      console.log('🔄 Checking for users needing auto-adjustments...');
      
      // Get all users with auto-adjustment enabled
      const usersWithAutoAdjustment = await this.getUsersWithAutoAdjustmentEnabled();
      
      for (const user of usersWithAutoAdjustment) {
        await this.processUserAutoAdjustment(user);
      }
      
      console.log(`✅ Auto-adjustment check complete. Processed ${usersWithAutoAdjustment.length} users.`);
    } catch (error) {
      console.error('❌ Error in auto-adjustment scheduler:', error);
    }
  }

  private async getUsersWithAutoAdjustmentEnabled(): Promise<any[]> {
    try {
      // This is a simplified approach - in a real implementation, you'd query all users
      // For now, we'll check specific user IDs that have auto-adjustment enabled
      const userId = 1; // Test with current user
      const user = await storage.getUser(userId);
      
      if (!user?.autoAdjustmentSettings) return [];
      
      const settings = user.autoAdjustmentSettings as AutoAdjustmentSettings;
      if (!settings.autoAdjustmentEnabled) return [];
      
      return [{ ...user, settings }];
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

  public getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.intervalId ? 'Running every hour' : 'Stopped'
    };
  }
}

// Export singleton instance
export const autoAdjustmentScheduler = new AutoAdjustmentScheduler();