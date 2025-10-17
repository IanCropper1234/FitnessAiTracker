import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AppRedirect() {
  const [message, setMessage] = useState<React.ReactNode>('Redirecting to MyTrainPro app...');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const userId = params.get('userId');

    if (sessionId && userId) {
      // Build deep link URL
      const deepLink = `mytrainpro://auth/callback?session=${sessionId}&userId=${userId}`;
      
      // Attempt to open the deep link
      window.location.href = deepLink;

      // Show fallback button after 1.5 seconds
      setTimeout(() => {
        setShowFallback(true);
        setMessage(
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Tap below to open MyTrainPro app:
            </p>
            <a 
              href={deepLink}
              className="block w-full px-6 py-3 bg-primary text-white text-center rounded-lg font-medium hover:bg-primary/90 active:scale-95 transition-transform"
              data-testid="button-open-app"
            >
              Open MyTrainPro App
            </a>
            <p className="text-xs text-center text-muted-foreground">
              Or close this page and open the app manually.
            </p>
          </div>
        );
      }, 1500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 ios-pwa-container">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center space-y-4">
            {!showFallback && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
            {showFallback && message}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}