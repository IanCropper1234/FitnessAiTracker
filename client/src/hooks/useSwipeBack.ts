import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface SwipeBackPlugin {
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

// Register the plugin
const IosSwipeBack = registerPlugin<SwipeBackPlugin>('IosSwipeBack');

/**
 * Hook to control iOS native swipe-back gesture
 * @param enabled - Whether to enable or disable the swipe-back gesture
 */
export function useSwipeBack(enabled: boolean) {
  useEffect(() => {
    // Only execute on iOS native platform
    if (Capacitor.getPlatform() !== 'ios' || !Capacitor.isNativePlatform()) {
      console.log('[useSwipeBack] Not on iOS native platform, skipping');
      return;
    }

    // Debug: Check if plugin methods exist
    console.log('[useSwipeBack] Plugin object:', IosSwipeBack);
    console.log('[useSwipeBack] Has enable method:', typeof IosSwipeBack.enable);
    console.log('[useSwipeBack] Has disable method:', typeof IosSwipeBack.disable);

    // Enable or disable based on parameter
    if (enabled) {
      console.log('[useSwipeBack] Attempting to ENABLE...');
      IosSwipeBack.enable()
        .then(() => console.log('✅ [useSwipeBack] Swipe back ENABLED'))
        .catch(err => {
          console.error('[useSwipeBack] Failed to enable:', err);
          console.error('[useSwipeBack] Error details:', JSON.stringify(err));
        });
    } else {
      console.log('[useSwipeBack] Attempting to DISABLE...');
      IosSwipeBack.disable()
        .then(() => console.log('🚫 [useSwipeBack] Swipe back DISABLED'))
        .catch(err => {
          console.error('[useSwipeBack] Failed to disable:', err);
          console.error('[useSwipeBack] Error details:', JSON.stringify(err));
        });
    }

    // Cleanup: ensure swipe back is disabled when component unmounts
    return () => {
      IosSwipeBack.disable()
        .then(() => console.log('🧹 [useSwipeBack] Cleanup: Swipe back disabled'))
        .catch(err => console.error('[useSwipeBack] Cleanup failed:', err));
    };
  }, [enabled]);
}
