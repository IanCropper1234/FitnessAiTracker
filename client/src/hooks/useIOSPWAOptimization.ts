import { useEffect, useRef } from 'react';

/**
 * Custom hook for iOS PWA optimizations to prevent reload issues
 * Addresses common iOS PWA problems like memory management and lifecycle events
 */
export function useIOSPWAOptimization() {
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Detect if running as iOS PWA
    const isIOSPWA = () => {
      return (
        window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches
      ) && /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    if (!isIOSPWA()) return;

    // Memory management for iOS PWA
    const handleMemoryPressure = () => {
      // Clear unused cached data
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }

      // Trigger garbage collection if available
      if ('gc' in window && typeof window.gc === 'function') {
        window.gc();
      }
    };

    // Handle iOS PWA lifecycle events
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - clean up resources
        handleMemoryPressure();
      } else {
        // App coming to foreground - reinitialize if needed
        setTimeout(() => {
          // Small delay to ensure proper restoration
          window.dispatchEvent(new Event('pwa-restored'));
        }, 100);
      }
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // iOS PWA specific cleanup on page hide
      if (event.persisted) {
        handleMemoryPressure();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // iOS PWA specific restoration on page show
      if (event.persisted) {
        setTimeout(() => {
          window.dispatchEvent(new Event('pwa-restored'));
        }, 50);
      }
    };

    // Add event listeners with passive option for better performance
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('pagehide', handlePageHide, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });

    // Store cleanup functions
    cleanupRef.current = [
      () => document.removeEventListener('visibilitychange', handleVisibilityChange),
      () => window.removeEventListener('pagehide', handlePageHide),
      () => window.removeEventListener('pageshow', handlePageShow),
    ];

    // Initial memory management
    handleMemoryPressure();

    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  // Return utility functions for components to use
  return {
    isIOSPWA: () => {
      return (
        window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches
      ) && /iPad|iPhone|iPod/.test(navigator.userAgent);
    },
    optimizeForIOS: (element: HTMLElement) => {
      if (element) {
        // Enable hardware acceleration
        element.style.transform = 'translate3d(0, 0, 0)';
        element.style.backfaceVisibility = 'hidden';
        // Prevent iOS scrolling issues
        element.style.webkitOverflowScrolling = 'touch';
      }
    }
  };
}