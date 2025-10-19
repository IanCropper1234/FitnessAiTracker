import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Capacitor } from '@capacitor/core';

interface OAuthSuccessProps {
  onSuccess: () => void;
}

export default function OAuthSuccess({ onSuccess }: OAuthSuccessProps) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<React.ReactNode>('Completing sign in...');

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        // Get query parameters
        const params = new URLSearchParams(window.location.search);
        const provider = params.get('provider');
        const sessionId = params.get('session');
        const userId = params.get('userId');
        const isApp = params.get('app') === '1';

        console.log('[OAuth Success] Processing OAuth callback:', {
          provider,
          sessionId: sessionId?.substring(0, 10) + '...',
          userId,
          isApp,
          isCapacitor: Capacitor.isNativePlatform()
        });

        if (!sessionId || !userId) {
          throw new Error('Missing session or user information');
        }

        // Show success briefly
        setStatus('success');
        setMessage(`Successfully signed in with ${provider === 'apple' ? 'Apple' : 'Google'}`);

        // Determine if we're in external browser or app WebView
        const isInAppWebView = Capacitor.isNativePlatform();
        const isFromAppOAuth = isApp === true; // URL param indicates OAuth initiated from app
        
        console.log('[OAuth Success] Environment check:', {
          isInAppWebView,
          isFromAppOAuth,
          needsDeepLink: isFromAppOAuth && !isInAppWebView
        });

        if (isFromAppOAuth && !isInAppWebView) {
          // We're in an external browser after OAuth from app
          console.log('[OAuth Success] In external browser, showing return options...');
          
          const deepLink = `mytrainpro://auth/callback?session=${sessionId}&userId=${userId}`;
          console.log('[OAuth Success] Deep link URL:', deepLink);
          
          // Store session info for manual app return
          localStorage.setItem('pending-oauth-session', JSON.stringify({
            sessionId,
            userId,
            provider,
            timestamp: Date.now()
          }));
          console.log('[OAuth Success] Stored pending session in localStorage');
          
          // Function to trigger deep link with multiple methods
          const triggerDeepLink = () => {
            console.log('[OAuth Success] Triggering deep link with multiple methods...');
            
            // Method 1: window.location (most reliable for iOS)
            try {
              window.location.href = deepLink;
              console.log('[OAuth Success] Method 1: window.location.href triggered');
            } catch (err) {
              console.error('[OAuth Success] Method 1 failed:', err);
            }
            
            // Method 2: Create invisible iframe (fallback)
            setTimeout(() => {
              try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = deepLink;
                document.body.appendChild(iframe);
                console.log('[OAuth Success] Method 2: iframe triggered');
                
                // Remove iframe after 1 second
                setTimeout(() => {
                  document.body.removeChild(iframe);
                }, 1000);
              } catch (err) {
                console.error('[OAuth Success] Method 2 failed:', err);
              }
            }, 100);
            
            // Method 3: Show success message after brief delay
            setTimeout(() => {
              console.log('[OAuth Success] If app didn\'t open, showing manual instructions...');
              setMessage(
                <div className="space-y-4">
                  <p className="text-center font-medium text-green-600 dark:text-green-400">
                    ✅ Authentication Successful!
                  </p>
                  
                  <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">If the app didn't open automatically:</p>
                    <ol className="text-sm text-muted-foreground space-y-1.5 ml-4">
                      <li>1. Close this Safari tab/window</li>
                      <li>2. Open the MyTrainPro app</li>
                      <li>3. You'll be signed in automatically (within 2-5 seconds)</li>
                    </ol>
                  </div>
                  
                  <button
                    onClick={triggerDeepLink}
                    className="block w-full px-6 py-3 bg-primary text-white text-center rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-transform"
                    data-testid="button-retry-deeplink"
                  >
                    Try Opening App Again
                  </button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Your session is securely saved and will be restored when you return to the app.
                  </p>
                </div>
              );
            }, 2000);
          };
          
          // Auto-trigger deep link after showing success
          setTimeout(triggerDeepLink, 500);
          
          setMessage(
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">
                Opening MyTrainPro app...
              </p>
              <p className="text-xs text-muted-foreground">
                Please allow the app to open when prompted
              </p>
            </div>
          );
          setStatus('success');
        } else {
          // We're either in the app's WebView or this is a web-only OAuth
          console.log('[OAuth Success] In app WebView or web browser, navigating normally...');
          
          // Mark onboarding as completed for OAuth users
          localStorage.setItem('trainpro-onboarding-completed', 'true');
          localStorage.setItem('mytrainpro-onboarding-completed', 'true'); // Also set with new prefix
          console.log('[OAuth Success] Marked onboarding as completed');
          
          // Wait a moment to show success, then redirect
          setTimeout(() => {
            console.log('[OAuth Success] Redirecting to dashboard...');
            onSuccess();
            setLocation('/');
          }, 1500);
        }

      } catch (error) {
        console.error('[OAuth Success] Error processing OAuth callback:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        
        // Redirect to login on error
        setTimeout(() => {
          setLocation('/login?error=oauth_failed');
        }, 2000);
      }
    };

    handleOAuthSuccess();
  }, [setLocation, onSuccess]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 ios-pwa-container">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">Completing Sign In</h2>
                  <div className="text-sm text-muted-foreground">{message}</div>
                </div>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">Sign In Successful!</h2>
                  <div className="text-sm text-muted-foreground">{message}</div>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <CheckCircle2 className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">Authentication Failed</h2>
                  <div className="text-sm text-muted-foreground">{message}</div>
                  <p className="text-xs text-muted-foreground">Redirecting to login...</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}