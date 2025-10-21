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
  
  // Actions
  install: () => Promise<void>;
  dismissPrompt: () => void;
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

  // Smart timing: Show prompt after 30 seconds of engagement
  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) return;

    // Don't show if recently dismissed
    if (isRecentlyDismissed()) {
      console.log('PWA: Install prompt dismissed recently, not showing');
      return;
    }

    // For iOS, show instructions after engagement delay
    // For Android/Chrome, wait for deferredPrompt
    const canShowPrompt = isIOSDevice || deferredPrompt !== null;
    
    if (!canShowPrompt) return;

    // Set engagement start time
    if (!localStorage.getItem(STORAGE_KEYS.ENGAGEMENT_START)) {
      localStorage.setItem(STORAGE_KEYS.ENGAGEMENT_START, Date.now().toString());
    }

    const timer = setTimeout(() => {
      console.log('PWA: Showing install prompt after engagement delay');
      setShowPrompt(true);
    }, TIMING.ENGAGEMENT_DELAY);

    return () => clearTimeout(timer);
  }, [deferredPrompt, isInstalled, isIOSDevice]);

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

  return {
    isInstallable: deferredPrompt !== null || isIOSDevice,
    isInstalled,
    isIOSDevice,
    showPrompt: showPrompt && !isInstalled,
    install,
    dismissPrompt
  };
}
