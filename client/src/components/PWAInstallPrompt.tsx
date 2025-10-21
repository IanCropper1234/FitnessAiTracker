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
 * Shows step-by-step guide for Add to Home Screen
 */
function IOSInstallInstructions({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
          To install on iOS:
        </p>
        <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-3">
            <span className="font-bold shrink-0">1.</span>
            <span className="flex items-center gap-2">
              Tap the <Share className="w-4 h-4 inline" /> Share button below
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold shrink-0">2.</span>
            <span className="flex items-center gap-2">
              Select <Home className="w-4 h-4 inline" /> "Add to Home Screen"
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold shrink-0">3.</span>
            <span>Tap "Add" to confirm</span>
          </li>
        </ol>
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
