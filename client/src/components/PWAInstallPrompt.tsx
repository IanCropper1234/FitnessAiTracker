import { useEffect } from 'react';
import { X, Download, Share, Home } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * PWA Install Prompt Component
 * 
 * Features:
 * - Android/Chrome: Native install button
 * - iOS Safari: Step-by-step instructions
 * - Dismissable with 7-day cooldown
 * - Responsive mobile-first design
 * - Smooth animations
 * - Listens for manual install requests from other components
 */

export function PWAInstallPrompt() {
  const { showPrompt, isIOSDevice, install, dismissPrompt, triggerInstall } = usePWAInstall();

  // Listen for manual PWA install requests (e.g., from auth page button)
  useEffect(() => {
    const handleInstallRequest = () => {
      console.log('[PWAInstallPrompt] Manual install requested');
      triggerInstall();
    };

    window.addEventListener('pwa-install-requested', handleInstallRequest);
    return () => {
      window.removeEventListener('pwa-install-requested', handleInstallRequest);
    };
  }, [triggerInstall]);

  if (!showPrompt) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-4 pb-safe animate-in slide-in-from-bottom duration-300"
      data-testid="pwa-install-prompt"
    >
      <Card className="max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl border-2 border-purple-500/20">
        <div className="p-4 sm:p-6">
          {/* Close button */}
          <button
            onClick={dismissPrompt}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Dismiss install prompt"
            data-testid="button-dismiss-install"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Install MyTrainPro
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your fitness coach anytime, anywhere
              </p>
            </div>
          </div>

          {/* Benefits */}
          <ul className="space-y-2 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Instant access from your home screen
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Works offline with cached data
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Faster loading and better performance
            </li>
          </ul>

          {/* Platform-specific install instructions */}
          {isIOSDevice ? (
            <IOSInstallInstructions onDismiss={dismissPrompt} />
          ) : (
            <AndroidInstallButton onInstall={install} onDismiss={dismissPrompt} />
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * iOS Safari Install Instructions
 * Enhanced visual guide with animated pointer to Share button
 */
function IOSInstallInstructions({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="space-y-4">
      {/* Visual pointer to Safari Share button */}
      <div className="relative">
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-6 border-2 border-blue-300 dark:border-blue-700">
          {/* Large Share Icon */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg z-10 relative">
                <Share className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              {/* Pulsing ring animation - respects reduced motion preferences */}
              <div className="absolute inset-0 w-16 h-16 bg-blue-400 rounded-2xl motion-safe:animate-ping opacity-50 pointer-events-none" />
            </div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 text-center">
              Tap the Share button at the bottom of Safari
            </p>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-3 bg-white/50 dark:bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                Tap <Share className="w-4 h-4 inline mx-1" /> in Safari toolbar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                Scroll & tap <Home className="w-4 h-4 inline mx-1" /> "Add to Home Screen"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                Tap "Add" to install
              </p>
            </div>
          </div>
        </div>

        {/* Animated arrow pointing down to Safari toolbar */}
        <div className="flex justify-center mt-3">
          <div className="flex flex-col items-center gap-1 motion-safe:animate-bounce pointer-events-none" data-testid="ios-install-arrow">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-500" />
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-500" />
          </div>
        </div>
      </div>

      <Button
        onClick={onDismiss}
        variant="outline"
        className="w-full"
        data-testid="button-ios-got-it"
      >
        Got it!
      </Button>
    </div>
  );
}

/**
 * Android/Chrome Install Button
 * Triggers native install prompt
 */
function AndroidInstallButton({
  onInstall,
  onDismiss
}: {
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}) {
  const handleInstall = async () => {
    await onInstall();
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleInstall}
        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        data-testid="button-install-pwa"
      >
        <Download className="w-4 h-4 mr-2" />
        Install App
      </Button>
      <Button
        onClick={onDismiss}
        variant="outline"
        data-testid="button-dismiss-android"
      >
        Not Now
      </Button>
    </div>
  );
}
