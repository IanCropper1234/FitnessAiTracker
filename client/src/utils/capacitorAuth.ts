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

  console.log('[Capacitor Auth] OAuth listener setup complete');
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
