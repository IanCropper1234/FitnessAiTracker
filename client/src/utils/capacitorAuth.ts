import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// Current app version - increment when major UI changes are made
const APP_VERSION = '2.0.0'; // Updated with new MyTrainPro landing page

/**
 * Clear WebView cache if app version has changed
 */
function checkAndClearCacheIfNeeded() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion !== APP_VERSION) {
      console.log(`[Cache] Version changed from ${storedVersion} to ${APP_VERSION}, clearing cache...`);
      
      // Force page reload to clear cache
      localStorage.setItem('app-version', APP_VERSION);
      
      // Clear storage except for critical items
      const criticalKeys = ['app-version', 'trainpro-onboarding-completed', 'mytrainpro-onboarding-completed'];
      const keysToPreserve: Record<string, string> = {};
      
      criticalKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) keysToPreserve[key] = value;
      });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore critical items
      Object.entries(keysToPreserve).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('[Cache] Cache cleared, reloading app...');
      
      // Force hard reload
      window.location.reload();
    } else {
      console.log(`[Cache] App version ${APP_VERSION} matches, no cache clear needed`);
    }
  } catch (error) {
    console.error('[Cache] Error checking version:', error);
  }
}

/**
 * Setup OAuth deep link listener for Capacitor app
 * Handles mytrainpro://auth/callback deep links from OAuth flow
 */
export function setupCapacitorOAuthListener() {
  // Only setup in native Capacitor environment
  if (!Capacitor.isNativePlatform()) {
    console.log('[Capacitor Auth] Not a native platform, skipping OAuth listener setup');
    return;
  }

  // Check version and clear cache if needed
  checkAndClearCacheIfNeeded();

  console.log('[Capacitor Auth] Setting up OAuth deep link listener');

  // Check for pending OAuth session on app resume
  App.addListener('appStateChange', (state: { isActive: boolean }) => {
    if (state.isActive) {
      console.log('[Capacitor Auth] App became active, checking for pending OAuth...');
      // Check immediately
      checkPendingOAuthSession();
      
      // Also check after a short delay (iOS sometimes needs this)
      setTimeout(() => {
        console.log('[Capacitor Auth] Delayed check for pending OAuth...');
        checkPendingOAuthSession();
      }, 1000);
    }
  });
  
  // Also check when page becomes visible (covers more scenarios)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[Capacitor Auth] Page became visible, checking for pending OAuth...');
        checkPendingOAuthSession();
      }
    });
  }

  // Listen for app URL open events (deep links)
  App.addListener('appUrlOpen', (data: { url: string }) => {
    console.log('[Capacitor Auth] App URL opened:', data.url);
    // Use the unified handleDeepLink function
    handleDeepLink(data.url);
  });

  // Also handle the URL when app launches
  App.getInfo().then(() => {
    App.getLaunchUrl().then((urlData) => {
      if (urlData && urlData.url) {
        console.log('[Capacitor Auth] App launched with URL:', urlData.url);
        // Process the launch URL
        handleDeepLink(urlData.url);
      }
    });
  });

  // Check for pending OAuth on startup
  checkPendingOAuthSession();
  
  console.log('[Capacitor Auth] OAuth listener setup complete');
}

/**
 * Restore OAuth session using fetch API to avoid infinite redirect loop
 */
async function restoreSessionAndNavigate(sessionId: string, userId: string) {
  try {
    console.log('[Capacitor Auth] Calling session restore API...');
    
    // Call the session restore endpoint
    const response = await fetch(`/api/auth/restore-session?sessionId=${sessionId}&userId=${userId}&redirect=/`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log('[Capacitor Auth] Session restore response:', response.status);
    
    if (response.status === 0 || response.status === 302 || response.ok) {
      // Session restored successfully
      console.log('[Capacitor Auth] ✅ Session restored successfully!');
      
      // Mark session as successfully restored
      localStorage.setItem('last-successful-oauth-session', sessionId);
      localStorage.setItem('trainpro-onboarding-completed', 'true');
      localStorage.setItem('mytrainpro-onboarding-completed', 'true');
      
      // Close the in-app browser automatically (only works if opened with Browser.open)
      if (Capacitor.isNativePlatform()) {
        try {
          await Browser.close();
          console.log('[Capacitor Auth] ✅ Closed OAuth browser automatically');
        } catch (err) {
          console.log('[Capacitor Auth] Could not close browser (might be already closed):', err);
          // Not critical - browser might already be closed or user might have manually closed it
        }
      }
      
      // Navigate to home page WITHOUT reloading the entire WebView
      console.log('[Capacitor Auth] Navigating to home page...');
      
      // Force a hard reload to ensure cookies are picked up
      window.location.replace('/');
    } else {
      console.error('[Capacitor Auth] Session restore failed:', response.status);
      alert('Login failed. Please try again.');
      window.location.replace('/auth');
    }
  } catch (error) {
    console.error('[Capacitor Auth] Error restoring session:', error);
    alert('Login failed. Please try again.');
    window.location.replace('/auth');
  }
}

// Helper function to handle deep links
function handleDeepLink(urlString: string) {
  console.log('[Capacitor Auth] Processing deep link:', urlString);
  
  try {
    const url = new URL(urlString);
    
    if (url.host === 'auth' && url.pathname === '/callback') {
      const sessionId = url.searchParams.get('session');
      const userId = url.searchParams.get('userId');
      
      if (sessionId && userId) {
        console.log('[Capacitor Auth] OAuth callback detected');
        console.log('[Capacitor Auth] Deep link contains valid OAuth data - Session:', sessionId, 'User:', userId);
        
        // Check if this session is different from last successful login
        const lastSuccessfulSession = localStorage.getItem('last-successful-oauth-session');
        if (lastSuccessfulSession === sessionId) {
          console.log('[Capacitor Auth] Session already successfully restored, skipping to prevent duplicate login');
          return;
        }
        
        // Visual feedback with friendly message
        console.log('[Capacitor Auth] Processing new OAuth session...');
        
        // Restore session using fetch API instead of redirect to avoid infinite loop
        restoreSessionAndNavigate(sessionId, userId);
      } else {
        console.error('[Capacitor Auth] Missing session or userId in callback');
        alert('OAuth Error: Missing session or userId');
        window.location.href = '/auth?error=oauth_callback_failed';
      }
    } else {
      console.log('[Capacitor Auth] Non-OAuth deep link, ignoring');
    }
  } catch (error) {
    console.error('[Capacitor Auth] Error processing deep link:', error);
    alert(`Error handling deep link: ${error}`);
  }
}

/**
 * Check for pending OAuth session from server (server-side solution)
 * This works even when Safari and WebView have separate storage
 * Uses retry mechanism to catch pending sessions that may be created after app opens
 */
async function checkPendingOAuthSession(retryCount = 0, maxRetries = 6) {
  try {
    console.log(`[Capacitor Auth] Checking server for pending OAuth session... (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Generate or retrieve device ID
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(7);
      localStorage.setItem('device-id', deviceId);
    }
    
    // Check server for pending sessions
    const response = await fetch('/api/auth/check-pending-oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ deviceId })
    });
    
    if (!response.ok) {
      console.log('[Capacitor Auth] Server check failed:', response.status);
      // Retry on server error
      if (retryCount < maxRetries) {
        console.log(`[Capacitor Auth] Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkPendingOAuthSession(retryCount + 1, maxRetries), 2000);
      }
      return;
    }
    
    const data = await response.json();
    
    if (data.hasPending) {
      console.log(`[Capacitor Auth] ✅ Found pending OAuth session for user ${data.userId}!`);
      
      // Check if this session is different from last successful login
      const lastSuccessfulSession = localStorage.getItem('last-successful-oauth-session');
      if (lastSuccessfulSession === data.sessionId) {
        console.log('[Capacitor Auth] Session already successfully restored, skipping to prevent duplicate login');
        return;
      }
      
      // Restore session using fetch API instead of redirect to avoid infinite loop
      console.log('[Capacitor Auth] Restoring session via API...');
      restoreSessionAndNavigate(data.sessionId, data.userId);
    } else {
      console.log('[Capacitor Auth] No pending OAuth sessions found');
      
      // Retry if haven't reached max retries yet
      // This catches cases where OAuth callback completes after app opens
      if (retryCount < maxRetries) {
        console.log(`[Capacitor Auth] Will retry in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkPendingOAuthSession(retryCount + 1, maxRetries), 2000);
      } else {
        console.log('[Capacitor Auth] Max retries reached, stopping checks');
      }
    }
  } catch (error) {
    console.error('[Capacitor Auth] Error checking pending OAuth:', error);
    
    // Retry on error
    if (retryCount < maxRetries) {
      console.log(`[Capacitor Auth] Retrying after error in 2 seconds... (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => checkPendingOAuthSession(retryCount + 1, maxRetries), 2000);
    }
  }
}

/**
 * Check if running in Capacitor app
 */
export function isCapacitorApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get platform information
 */
export function getPlatformInfo(): { isApp: boolean; platform: string } {
  return {
    isApp: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };
}
