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
  const [message, setMessage] = useState('Completing sign in...');

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

        // If this is from the app (opened in external browser), use deep link to return to app
        if (isApp || !Capacitor.isNativePlatform()) {
          // We're in an external browser after OAuth, need to return to app using deep link
          console.log('[OAuth Success] Redirecting to app via deep link...');
          
          // Try deep link first
          const deepLink = `mytrainpro://auth/callback?session=${sessionId}&userId=${userId}`;
          console.log('[OAuth Success] Attempting deep link:', deepLink);
          
          // Attempt to open the deep link
          window.location.href = deepLink;
          
          // Also set a fallback in case deep link doesn't work
          setTimeout(() => {
            setMessage('Please return to the MyTrainPro app');
            // If still here after 2 seconds, show message to manually return to app
            setStatus('success');
          }, 2000);
        } else {
          // We're in the app's WebView, can navigate normally
          console.log('[OAuth Success] In app WebView, navigating normally...');
          
          // Mark onboarding as completed for OAuth users
          localStorage.setItem('trainpro-onboarding-completed', 'true');
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
                  <p className="text-sm text-muted-foreground">{message}</p>
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
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
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
                  <p className="text-sm text-muted-foreground">{message}</p>
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