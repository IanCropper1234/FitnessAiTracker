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
          // We're in an external browser after OAuth from app, need deep link to return
          console.log('[OAuth Success] In external browser, showing return button...');
          
          const deepLink = `mytrainpro://auth/callback?session=${sessionId}&userId=${userId}`;
          console.log('[OAuth Success] Deep link URL:', deepLink);
          
          // Don't try to auto-trigger the deep link due to iOS security restrictions
          // Instead, show a prominent button immediately
          setMessage(
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Sign in successful! Tap below to return to the app.
              </p>
              <a 
                href={deepLink}
                className="block w-full px-6 py-3 bg-primary text-white text-center rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-transform"
                data-testid="button-return-app"
              >
                Return to MyTrainPro App
              </a>
              <div className="text-center">
                <a 
                  href={`/app-redirect?session=${sessionId}&userId=${userId}`}
                  className="text-xs text-primary underline"
                  data-testid="link-alternative-redirect"
                >
                  Alternative redirect (if button above doesn't work)
                </a>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Or close this browser and open MyTrainPro app manually.
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