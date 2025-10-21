import { useState, useEffect } from 'react';

/**
 * PWA Install Hook - Smart installation prompt management
 * 
 * Features:
 * - Captures beforeinstallprompt event
 * - Implements 30-second engagement delay
 * - Prevents spam with 7-day dismissal tracking
 * - Detects iOS Safari for custom instructions
 * - Tracks installation state
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  // Installation state
  isInstallable: boolean;
  isInstalled: boolean;
  isIOSDevice: boolean;
  
  // UI control
  showPrompt: boolean;
  showInstallButton: boolean;
  
  // Actions
  install: () => Promise<void>;
  dismissPrompt: () => void;
  triggerInstall: () => void;
}

const STORAGE_KEYS = {
  DISMISSED_AT: 'pwa-install-dismissed-at',
  INSTALLED: 'pwa-installed',
  ENGAGEMENT_START: 'pwa-engagement-start'
} as const;

const TIMING = {
  ENGAGEMENT_DELAY: 30000, // 30 seconds
  DISMISSAL_COOLDOWN: 7 * 24 * 60 * 60 * 1000 // 7 days
} as const;

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [engagementReady, setEngagementReady] = useState(false);

  // Detect iOS device
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(iOS);
  }, []);

  // Check if already installed
  useEffect(() => {
    const checkInstallStatus = () => {
      // Check localStorage flag
      if (localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true') {
        setIsInstalled(true);
        return true;
      }

      // Check if running in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
      
      if (standalone) {
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
        setIsInstalled(true);
        return true;
      }

      return false;
    };

    checkInstallStatus();
  }, []);

  // Check if recently dismissed
  const isRecentlyDismissed = (): boolean => {
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    if (!dismissedAt) return false;

    const timeSinceDismissal = Date.now() - parseInt(dismissedAt, 10);
    return timeSinceDismissal < TIMING.DISMISSAL_COOLDOWN;
  };

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      console.log('PWA: Install prompt captured');
      setDeferredPrompt(installEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Handle app installed event
  useEffect(() => {
    const handler = () => {
      console.log('PWA: App installed successfully');
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Effect 1: Start engagement timer (runs once)
  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      console.log('PWA: Already installed, not showing prompt');
      return;
    }

    // Don't show if recently dismissed
    if (isRecentlyDismissed()) {
      console.log('PWA: Install prompt dismissed recently, not showing');
      return;
    }

    console.log('PWA: Starting engagement timer (30 seconds)...');
    
    // Set engagement start time
    if (!localStorage.getItem(STORAGE_KEYS.ENGAGEMENT_START)) {
      localStorage.setItem(STORAGE_KEYS.ENGAGEMENT_START, Date.now().toString());
    }

    // Start timer - only sets engagementReady flag after 30 seconds
    const timer = setTimeout(() => {
      console.log('PWA: Engagement timer completed, marking as ready');
      setEngagementReady(true);
    }, TIMING.ENGAGEMENT_DELAY);

    return () => {
      console.log('PWA: Clearing engagement timer');
      clearTimeout(timer);
    };
  }, [isInstalled]);

  // Effect 2: Show prompt when engagement is ready and conditions are met
  useEffect(() => {
    // Wait for engagement timer to complete
    if (!engagementReady) return;

    // Don't show if already installed
    if (isInstalled) {
      console.log('PWA: Already installed, not showing prompt');
      return;
    }

    // Don't show if recently dismissed
    if (isRecentlyDismissed()) {
      console.log('PWA: Install prompt dismissed recently, not showing');
      return;
    }

    // Check for test mode (force show PWA prompt)
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.get('pwa-test') === '1';

    // Check if we can show the prompt (reads current deferredPrompt, not stale closure)
    const canShowPrompt = forceShow || isIOSDevice || deferredPrompt !== null;
    
    if (canShowPrompt) {
      console.log('PWA: Showing install prompt (force=' + forceShow + ', iOS=' + isIOSDevice + ', hasPrompt=' + (deferredPrompt !== null) + ')');
      setShowPrompt(true);
    } else {
      console.log('PWA: Cannot show prompt yet (not iOS and no deferredPrompt)');
    }
  }, [engagementReady, deferredPrompt, isIOSDevice, isInstalled]);

  // Install action (Android/Chrome)
  const install = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA: User choice: ${outcome}`);

      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
        setIsInstalled(true);
      } else {
        // User dismissed the prompt
        localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
      }

      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA: Install failed:', error);
    }
  };

  // Dismiss prompt action
  const dismissPrompt = () => {
    console.log('PWA: User dismissed install prompt');
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
    setShowPrompt(false);
  };

  // Manual trigger - bypass engagement delay
  const triggerInstall = () => {
    if (isInstalled) {
      console.log('PWA: Already installed');
      return;
    }

    if (isRecentlyDismissed()) {
      console.log('PWA: Recently dismissed, respecting cooldown');
      return;
    }

    console.log('PWA: Manual install trigger activated');
    setShowPrompt(true);
  };

  // Show install button when installable but prompt not shown
  const showInstallButton = 
    !isInstalled && 
    !isRecentlyDismissed() && 
    !showPrompt &&
    (deferredPrompt !== null || isIOSDevice);

  return {
    isInstallable: deferredPrompt !== null || isIOSDevice,
    isInstalled,
    isIOSDevice,
    showPrompt: showPrompt && !isInstalled,
    showInstallButton,
    install,
    dismissPrompt,
    triggerInstall
  };
}
