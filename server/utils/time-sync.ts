import fetch from 'node-fetch';

export class TimeSyncService {
  private static cachedTime: { serverTime: Date; realTime: Date; lastSync: Date } | null = null;
  private static readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // Get current real time synchronized with online time source
  static async getCurrentTime(): Promise<Date> {
    try {
      // Check if we need to refresh cached time
      if (!this.cachedTime || 
          (Date.now() - this.cachedTime.lastSync.getTime()) > this.SYNC_INTERVAL_MS) {
        await this.syncTimeWithOnlineSource();
      }

      // Calculate current time using cached offset
      if (this.cachedTime) {
        const timeDiff = Date.now() - this.cachedTime.serverTime.getTime();
        return new Date(this.cachedTime.realTime.getTime() + timeDiff);
      }

      // Fallback to system time if sync fails
      return new Date();
    } catch (error) {
      console.warn('Time sync failed, using system time:', error);
      return new Date();
    }
  }

  // Sync with online time source (World Time API)
  private static async syncTimeWithOnlineSource(): Promise<void> {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/UTC', {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json() as { datetime: string };
        const realTime = new Date(data.datetime);
        const serverTime = new Date();
        
        this.cachedTime = {
          serverTime,
          realTime,
          lastSync: new Date()
        };

        console.log(`Time synced - Server: ${serverTime.toISOString()}, Real: ${realTime.toISOString()}`);
      } else {
        throw new Error(`World Time API response not ok: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to sync time with World Time API:', error);
      // Try alternative time source
      try {
        const response = await fetch('http://worldclockapi.com/api/json/utc/now', {
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json() as { currentDateTime: string };
          const realTime = new Date(data.currentDateTime);
          const serverTime = new Date();
          
          this.cachedTime = {
            serverTime,
            realTime,
            lastSync: new Date()
          };

          console.log(`Time synced (alt) - Server: ${serverTime.toISOString()}, Real: ${realTime.toISOString()}`);
        }
      } catch (altError) {
        console.warn('Alternative time sync also failed:', altError);
        throw error; // Re-throw original error
      }
    }
  }

  // Get time offset information for debugging
  static getTimeInfo(): { 
    serverTime: Date; 
    realTime: Date | null; 
    offsetMs: number | null; 
    lastSync: Date | null 
  } {
    const serverTime = new Date();
    
    if (this.cachedTime) {
      const timeDiff = Date.now() - this.cachedTime.serverTime.getTime();
      const estimatedRealTime = new Date(this.cachedTime.realTime.getTime() + timeDiff);
      
      return {
        serverTime,
        realTime: estimatedRealTime,
        offsetMs: estimatedRealTime.getTime() - serverTime.getTime(),
        lastSync: this.cachedTime.lastSync
      };
    }

    return {
      serverTime,
      realTime: null,
      offsetMs: null,
      lastSync: null
    };
  }
}