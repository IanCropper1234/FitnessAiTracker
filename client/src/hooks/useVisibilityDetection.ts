import { useEffect, useRef, useCallback } from 'react';

// Extend Window interface to include ReactNativeWebView for React Native WebView integration
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

interface VisibilityDetectionOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  onBlankPageDetected?: () => void;
  onLongInactivity?: () => void;
  blankPageCheckInterval?: number;
  inactivityThreshold?: number;
  enableAutoReload?: boolean;
}

export function useVisibilityDetection(options: VisibilityDetectionOptions = {}) {
  const {
    onVisibilityChange,
    onBlankPageDetected,
    onLongInactivity,
    blankPageCheckInterval = 12000, // Check every 12 seconds (reduced frequency)
    inactivityThreshold = 30 * 60 * 1000, // 30 minutes
    enableAutoReload = true
  } = options;

  const lastActivityRef = useRef(Date.now());
  const isVisibleRef = useRef(!document.hidden);
  const blankPageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const reloadAttemptsRef = useRef(0);
  const lastReloadAttemptRef = useRef<number>(0);
  
  // Store event handler functions in refs for proper cleanup
  const handlePageShowRef = useRef<(() => void) | null>(null);
  const handlePageHideRef = useRef<(() => void) | null>(null);
  
  // Skip React hook functionality if ReactNativeWebView is available (injected script handles it)
  const isWebViewEnvironment = typeof window !== 'undefined' && window.ReactNativeWebView;

  // Check if page is blank (common indicators) - Optimized with limits
  const isPageBlank = useCallback(() => {
    try {
      // Skip if in WebView environment (injected script handles this)
      if (isWebViewEnvironment) return false;
      
      // Check if essential elements are missing
      const hasContent = document.body && document.body.children.length > 0;
      const rootElement = document.getElementById('root');
      const hasRoot = rootElement && rootElement.innerHTML.trim() !== '';
      
      // Check for visible elements with content (limit to first 20 elements for performance)
      const visibleElements = document.querySelectorAll('div, main, section, article, p, h1, h2, h3, span');
      let hasVisibleContent = false;
      const maxElementsToCheck = Math.min(visibleElements.length, 20);
      
      for (let i = 0; i < maxElementsToCheck; i++) {
        const el = visibleElements[i];
        try {
          if (el.textContent?.trim() && el.textContent.trim().length > 0) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              hasVisibleContent = true;
              break;
            }
          }
        } catch (styleError) {
          // Skip elements that can't be styled
          continue;
        }
      }

      // Page is considered blank if essential indicators are missing
      const blankIndicators = [
        !hasContent,
        !hasRoot,
        !hasVisibleContent
      ].filter(Boolean).length;

      return blankIndicators >= 2; // Threshold for blank page detection
    } catch (error) {
      console.warn('Error checking if page is blank:', error);
      return false;
    }
  }, [isWebViewEnvironment]);

  // Handle page reload with retry mechanism and backoff
  const handleAutoReload = useCallback((reason: string = 'blank_page_detected') => {
    if (!enableAutoReload) return;
    
    // Skip if in WebView environment (injected script handles this)
    if (isWebViewEnvironment) return;

    const now = Date.now();
    const timeSinceLastAttempt = now - lastReloadAttemptRef.current;
    const maxAttempts = 3;
    const backoffTime = Math.pow(2, reloadAttemptsRef.current) * 60000; // Exponential backoff: 1min, 2min, 4min

    // Check if we're within backoff period
    if (timeSinceLastAttempt < backoffTime) {
      console.log('Reload attempt skipped due to backoff period:', backoffTime - timeSinceLastAttempt, 'ms remaining');
      return;
    }

    // Check max attempts
    if (reloadAttemptsRef.current >= maxAttempts) {
      console.log('Max reload attempts reached, stopping auto-reload');
      return;
    }

    reloadAttemptsRef.current++;
    lastReloadAttemptRef.current = now;

    console.log(`Auto-reloading due to ${reason} (attempt ${reloadAttemptsRef.current}/${maxAttempts})`);
    
    // Show user notification if possible
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'AUTO_RELOAD',
        reason: reason,
        attempt: reloadAttemptsRef.current,
        maxAttempts: maxAttempts,
        timestamp: now
      }));
    }

    // Attempt reload
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to reload page:', error);
      // Fallback: try to navigate to home
      setTimeout(() => {
        try {
          window.location.href = window.location.origin;
        } catch (navError) {
          console.error('Failed to navigate to origin:', navError);
        }
      }, 1000);
    }
  }, [enableAutoReload, isWebViewEnvironment]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Setup activity listeners (skip if WebView handles it)
  useEffect(() => {
    if (isWebViewEnvironment) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity, isWebViewEnvironment]);

  // Setup visibility change detection (skip if WebView handles it)
  useEffect(() => {
    if (isWebViewEnvironment) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = isVisible;

      console.log('Visibility changed:', { isVisible, wasVisible });

      if (isVisible && !wasVisible) {
        // App became visible (returned from background)
        const backgroundDuration = backgroundTimeRef.current 
          ? Date.now() - backgroundTimeRef.current 
          : 0;
        
        console.log('App returned from background after:', backgroundDuration, 'ms');
        
        backgroundTimeRef.current = null;
        updateActivity();
        
        // Reset reload attempts on successful visibility change
        reloadAttemptsRef.current = 0;
        lastReloadAttemptRef.current = 0;

        // If app was in background for more than 5 minutes, check for blank page
        if (backgroundDuration > 5 * 60 * 1000) {
          setTimeout(() => {
            if (isPageBlank()) {
              console.log('Blank page detected after long background period');
              onBlankPageDetected?.();
              handleAutoReload('background_return');
            }
          }, 2000); // Give page more time to render
        }
      } else if (!isVisible && wasVisible) {
        // App went to background
        backgroundTimeRef.current = Date.now();
        console.log('App went to background');
      }

      onVisibilityChange?.(isVisible);
    };

    // Store handlers in refs for proper cleanup
    const handlePageShow = () => {
      console.log('Page show event - checking for blank page');
      setTimeout(() => {
        if (isPageBlank()) {
          onBlankPageDetected?.();
          handleAutoReload('page_show');
        }
      }, 2000);
    };

    const handlePageHide = () => {
      console.log('Page hide event');
      backgroundTimeRef.current = Date.now();
    };

    // Store handlers in refs
    handlePageShowRef.current = handlePageShow;
    handlePageHideRef.current = handlePageHide;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (handlePageShowRef.current) {
        window.removeEventListener('pageshow', handlePageShowRef.current);
      }
      if (handlePageHideRef.current) {
        window.removeEventListener('pagehide', handlePageHideRef.current);
      }
      handlePageShowRef.current = null;
      handlePageHideRef.current = null;
    };
  }, [onVisibilityChange, onBlankPageDetected, handleAutoReload, updateActivity, isPageBlank, isWebViewEnvironment]);

  // Setup blank page monitoring (skip if WebView handles it)
  useEffect(() => {
    if (isWebViewEnvironment) return;
    
    blankPageCheckIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current && isPageBlank()) {
        console.log('Blank page detected during routine check');
        onBlankPageDetected?.();
        handleAutoReload('routine_check');
      }
    }, blankPageCheckInterval);

    return () => {
      if (blankPageCheckIntervalRef.current) {
        clearInterval(blankPageCheckIntervalRef.current);
      }
    };
  }, [blankPageCheckInterval, onBlankPageDetected, handleAutoReload, isPageBlank, isWebViewEnvironment]);

  // Setup inactivity monitoring (skip if WebView handles it)
  useEffect(() => {
    if (isWebViewEnvironment) return;
    
    inactivityCheckIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceActivity > inactivityThreshold) {
        console.log('Long inactivity detected:', timeSinceActivity, 'ms');
        onLongInactivity?.();
        
        // Check if page is blank during long inactivity
        if (isPageBlank()) {
          console.log('Blank page detected during inactivity');
          handleAutoReload('inactivity');
        }
      }
    }, 90000); // Check every 90 seconds (increased interval for performance)

    return () => {
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }
    };
  }, [inactivityThreshold, onLongInactivity, handleAutoReload, isPageBlank, isWebViewEnvironment]);

  return {
    isVisible: isVisibleRef.current,
    lastActivity: lastActivityRef.current,
    isPageBlank,
    forceReload: handleAutoReload
  };
}