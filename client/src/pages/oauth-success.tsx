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
          
          setMessage(
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Sign in successful! Choose how to return to the app:
              </p>
              
              {/* Option 1: Deep Link (may not work if URL scheme not registered) */}
              <a 
                href={deepLink}
                className="block w-full px-6 py-3 bg-primary text-white text-center rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-transform"
                data-testid="button-return-app"
              >
                Open MyTrainPro App
              </a>
              
              {/* Option 2: Universal Link */}
              <a 
                href={`https://mytrainpro.com/app-redirect?session=${sessionId}&userId=${userId}`}
                className="block w-full px-6 py-3 bg-secondary text-secondary-foreground text-center rounded-lg font-medium hover:bg-secondary/90"
                data-testid="button-universal-link"
              >
                Alternative: Open via Universal Link
              </a>
              
              {/* Option 3: Manual instructions */}
              <div className="border rounded-lg p-3 bg-muted/50">
                <p className="text-xs font-medium mb-1">Manual Return:</p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Close this browser tab</li>
                  <li>2. Open MyTrainPro app</li>
                  <li>3. You'll be automatically signed in</li>
                </ol>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Session saved. The app will detect your login when you return.
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