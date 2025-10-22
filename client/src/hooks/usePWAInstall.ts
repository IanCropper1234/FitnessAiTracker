import { useState, useEffect, useCallback } from 'react';

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Install status types
type InstallStatus = 
  | 'unsupported'      // Browser doesn't support PWA installation
  | 'not-ready'        // beforeinstallprompt not fired yet
  | 'ready'            // Ready to install
  | 'installing'       // Installation prompt shown
  | 'installed'        // Already installed or running in standalone mode
  | 'dismissed';       // User dismissed the install prompt

// Installation strategy types
type InstallStrategy = 
  | 'auto-prompt'      // Android - can auto-trigger prompt
  | 'manual-ios'       // iOS - needs manual guide
  | 'already-installed' // Already installed
  | 'unsupported';     // Not supported

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<InstallStatus>('not-ready');
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  // Check platform and installation status
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Enhanced iOS/iPadOS detection
    // iPadOS 13+ reports as MacIntel, so we need additional checks
    const isIOSUserAgent = /iphone|ipad|ipod/.test(userAgent);
    const isPadOSDesktopMode = navigator.platform === 'MacIntel' && 
                               navigator.maxTouchPoints > 1;
    const iosDevice = isIOSUserAgent || isPadOSDesktopMode;
    
    const androidDevice = /android/.test(userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);
    setIsInStandaloneMode(standalone);

    if (standalone) {
      setInstallStatus('installed');
    }

    console.log('[PWA Install] Platform detection:', {
      isIOS: iosDevice,
      isIOSUserAgent,
      isPadOSDesktopMode,
      isAndroid: androidDevice,
      isStandalone: standalone,
      userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints
    });
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      
      // Prevent the default mini-infobar from appearing
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(promptEvent);
      setInstallStatus('ready');
      
      console.log('[PWA Install] beforeinstallprompt fired - ready to install');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      console.log('[PWA Install] App installed successfully');
      setInstallStatus('installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Get installation strategy
  const getInstallStrategy = useCallback((): InstallStrategy => {
    if (isInStandaloneMode) {
      return 'already-installed';
    }

    if (isIOS) {
      // iOS needs manual guide (Share -> Add to Home Screen)
      return 'manual-ios';
    }

    if (isAndroid && deferredPrompt) {
      // Android can auto-trigger prompt
      return 'auto-prompt';
    }

    return 'unsupported';
  }, [isIOS, isAndroid, isInStandaloneMode, deferredPrompt]);

  // Trigger installation prompt (Android)
  const promptInstall = useCallback(async (): Promise<{ success: boolean; outcome?: string }> => {
    if (!deferredPrompt) {
      console.log('[PWA Install] No deferred prompt available');
      return { success: false, outcome: 'no-prompt' };
    }

    setInstallStatus('installing');

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA Install] User choice:', outcome);

      if (outcome === 'accepted') {
        setInstallStatus('installed');
        setDeferredPrompt(null);
        return { success: true, outcome: 'accepted' };
      } else {
        setInstallStatus('dismissed');
        setDeferredPrompt(null);
        return { success: false, outcome: 'dismissed' };
      }
    } catch (error) {
      console.error('[PWA Install] Error during installation:', error);
      setInstallStatus('ready');
      return { success: false, outcome: 'error' };
    }
  }, [deferredPrompt]);

  // Smooth installation flow with preparation steps
  const startSmoothInstallFlow = useCallback(async (
    onStepChange?: (step: string) => void
  ): Promise<{ success: boolean }> => {
    const steps = [
      { message: 'Checking compatibility...', duration: 600 },
      { message: 'Preparing installation...', duration: 500 },
      { message: 'Ready to install!', duration: 400 }
    ];

    // Show preparation steps
    for (const step of steps) {
      onStepChange?.(step.message);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Trigger the actual install prompt
    const result = await promptInstall();
    return result;
  }, [promptInstall]);

  // Check if PWA is installable
  const canInstall = installStatus === 'ready' && deferredPrompt !== null;

  return {
    // State
    canInstall,
    installStatus,
    isIOS,
    isAndroid,
    isInStandaloneMode,
    
    // Methods
    promptInstall,
    startSmoothInstallFlow,
    getInstallStrategy,
    
    // Utilities
    isPWASupported: installStatus !== 'unsupported' && installStatus !== 'not-ready'
  };
}
