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

    // Enable or disable based on parameter
    if (enabled) {
      IosSwipeBack.enable()
        .then(() => console.log('✅ [useSwipeBack] Swipe back ENABLED'))
        .catch(err => console.error('[useSwipeBack] Failed to enable:', err));
    } else {
      IosSwipeBack.disable()
        .then(() => console.log('🚫 [useSwipeBack] Swipe back DISABLED'))
        .catch(err => console.error('[useSwipeBack] Failed to disable:', err));
    }

    // Cleanup: ensure swipe back is disabled when component unmounts
    return () => {
      IosSwipeBack.disable()
        .then(() => console.log('🧹 [useSwipeBack] Cleanup: Swipe back disabled'))
        .catch(err => console.error('[useSwipeBack] Cleanup failed:', err));
    };
  }, [enabled]);
}
