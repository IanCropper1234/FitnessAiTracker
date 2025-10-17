import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

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

  console.log('[Capacitor Auth] Setting up OAuth deep link listener');

  // Check for pending OAuth session on app resume
  App.addListener('appStateChange', (state: { isActive: boolean }) => {
    if (state.isActive) {
      console.log('[Capacitor Auth] App became active, checking for pending OAuth...');
      checkPendingOAuthSession();
    }
  });

  // Listen for app URL open events (deep links)
  App.addListener('appUrlOpen', (data: { url: string }) => {
    console.log('[Capacitor Auth] App URL opened:', data.url);
    
    try {
      const url = new URL(data.url);
      
      // Check if it's an OAuth callback
      if (url.host === 'auth' && url.pathname === '/callback') {
        console.log('[Capacitor Auth] OAuth callback detected');
        
        const sessionId = url.searchParams.get('session');
        const userId = url.searchParams.get('userId');
        
        if (sessionId && userId) {
          console.log('[Capacitor Auth] OAuth successful! Session:', sessionId, 'User:', userId);
          
          // Mark onboarding as completed for OAuth users
          // OAuth users shouldn't see the first-time user animation
          if (typeof window !== 'undefined') {
            localStorage.setItem('trainpro-onboarding-completed', 'true');
            localStorage.setItem('mytrainpro-onboarding-completed', 'true');
            console.log('[Capacitor Auth] Marked onboarding as completed for OAuth user');
            
            // Store session info temporarily to help with session restoration
            localStorage.setItem('oauth-session-id', sessionId);
            localStorage.setItem('oauth-user-id', userId);
            console.log('[Capacitor Auth] Stored OAuth session info for restoration');
          }
          
          // Redirect to a special URL that will trigger session restoration
          console.log('[Capacitor Auth] Redirecting to session restoration endpoint...');
          // Use the session restoration endpoint to ensure cookies are set
          window.location.href = `/api/auth/restore-session?sessionId=${sessionId}&userId=${userId}&redirect=/`;
        } else {
          console.error('[Capacitor Auth] Missing session or userId in callback');
          window.location.href = '/login?error=oauth_callback_failed';
        }
      }
    } catch (error) {
      console.error('[Capacitor Auth] Error parsing deep link URL:', error);
    }
  });

  // Check for pending OAuth on startup
  checkPendingOAuthSession();
  
  console.log('[Capacitor Auth] OAuth listener setup complete');
}

/**
 * Check for pending OAuth session from external browser
 */
function checkPendingOAuthSession() {
  try {
    const pendingOAuth = localStorage.getItem('pending-oauth-session');
    if (pendingOAuth) {
      const { sessionId, userId, timestamp } = JSON.parse(pendingOAuth);
      
      // Check if session is less than 5 minutes old
      const age = Date.now() - timestamp;
      if (age < 5 * 60 * 1000) {
        console.log('[Capacitor Auth] Found pending OAuth session, restoring...');
        
        // Clear the pending session
        localStorage.removeItem('pending-oauth-session');
        
        // Mark onboarding as completed
        localStorage.setItem('trainpro-onboarding-completed', 'true');
        localStorage.setItem('mytrainpro-onboarding-completed', 'true');
        
        // Restore the session
        window.location.href = `/api/auth/restore-session?sessionId=${sessionId}&userId=${userId}&redirect=/`;
      } else {
        console.log('[Capacitor Auth] Pending OAuth session too old, clearing...');
        localStorage.removeItem('pending-oauth-session');
      }
    }
  } catch (error) {
    console.error('[Capacitor Auth] Error checking pending OAuth:', error);
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
