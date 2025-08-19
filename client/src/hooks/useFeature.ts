import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Feature flag configuration
interface FeatureFlags {
  workoutExecutionV2: boolean;
  spinnerSetInput: boolean;
  gestureNavigation: boolean;
  circularProgress: boolean;
  restTimerFAB: boolean;
  workoutSummary: boolean;
  autoRegulationFeedback: boolean;
}

// Default feature flags (can be overridden by user preferences or server)
const defaultFeatures: FeatureFlags = {
  workoutExecutionV2: true, // Enable V2 by default for testing
  spinnerSetInput: true,
  gestureNavigation: true,
  circularProgress: true,
  restTimerFAB: true,
  workoutSummary: true,
  autoRegulationFeedback: false, // Disabled by default - user can enable in settings
};

// Global feature flag store
let globalFeatures: FeatureFlags = { ...defaultFeatures };
let isServerSyncEnabled = false;
let isInitialized = false;
let isInitializing = false; // Prevent multiple concurrent initializations

export const useFeature = (featureName: keyof FeatureFlags): boolean => {
  const [isEnabled, setIsEnabled] = useState(globalFeatures[featureName]);

  useEffect(() => {
    const handleFeatureUpdate = (event: CustomEvent) => {
      if (event.detail.featureName === featureName) {
        setIsEnabled(event.detail.enabled);
      }
    };

    const handleFeatureUpdates = () => {
      setIsEnabled(globalFeatures[featureName]);
    };

    window.addEventListener('featureFlagUpdated', handleFeatureUpdate as EventListener);
    window.addEventListener('featureFlagsUpdated', handleFeatureUpdates);

    return () => {
      window.removeEventListener('featureFlagUpdated', handleFeatureUpdate as EventListener);
      window.removeEventListener('featureFlagsUpdated', handleFeatureUpdates);
    };
  }, [featureName]);

  return isEnabled;
};

export const useFeatures = (): FeatureFlags => {
  const [features, setFeatures] = useState<FeatureFlags>(globalFeatures);

  useEffect(() => {
    const handleFeatureUpdates = () => {
      setFeatures({ ...globalFeatures });
    };

    window.addEventListener('featureFlagsUpdated', handleFeatureUpdates);
    window.addEventListener('featureFlagUpdated', handleFeatureUpdates);

    return () => {
      window.removeEventListener('featureFlagsUpdated', handleFeatureUpdates);
      window.removeEventListener('featureFlagUpdated', handleFeatureUpdates);
    };
  }, []);

  return features;
};

export const updateFeatureFlag = async (featureName: keyof FeatureFlags, enabled: boolean) => {
  console.log(`Updating feature flag: ${featureName} = ${enabled}`);
  globalFeatures[featureName] = enabled;
  
  // Save to localStorage for persistence - this is crucial
  try {
    localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
    console.log('Settings saved to localStorage:', globalFeatures);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
  
  // Sync to server if enabled and not during initialization
  if (isServerSyncEnabled && isInitialized) {
    try {
      await apiRequest('PUT', '/api/workout-settings', globalFeatures);
      console.log('Settings synced to server');
    } catch (error) {
      console.warn('Failed to sync feature flag to server:', error);
      // Continue with local update even if server sync fails
    }
  } else {
    console.log('Server sync skipped - not initialized or sync disabled');
  }
  
  // Trigger re-render in components using this feature
  window.dispatchEvent(new CustomEvent('featureFlagUpdated', { 
    detail: { featureName, enabled } 
  }));
};

export const updateFeatureFlags = async (newFeatures: Partial<FeatureFlags>) => {
  globalFeatures = { ...globalFeatures, ...newFeatures };
  
  // Save to localStorage for persistence
  localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
  
  // Sync to server if enabled and fully initialized
  if (isServerSyncEnabled && isInitialized) {
    try {
      await apiRequest('PUT', '/api/workout-settings', globalFeatures);
    } catch (error) {
      console.warn('Failed to sync feature flags to server:', error);
    }
  }
  
  window.dispatchEvent(new CustomEvent('featureFlagsUpdated', { 
    detail: newFeatures 
  }));
};

// Get current feature flags (for server sync)
export const getFeatureFlags = (): FeatureFlags => ({ ...globalFeatures });

// Initialize features from server
export const initializeFeatures = async (enableServerSync = true) => {
  if (isInitialized || isInitializing) {
    console.log('Features already initialized or initializing, skipping');
    return;
  }
  
  console.log('Initializing features...');
  isInitializing = true;
  isServerSyncEnabled = enableServerSync;
  
  // First try to load from localStorage for immediate availability
  try {
    const savedSettings = localStorage.getItem('workout-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Prioritize saved settings over defaults
      globalFeatures = { ...defaultFeatures, ...parsedSettings };
      console.log('Features loaded from localStorage:', globalFeatures);
    } else {
      // No saved settings, start with defaults
      globalFeatures = { ...defaultFeatures };
    }
  } catch (error) {
    console.warn('Failed to load features from localStorage:', error);
    globalFeatures = { ...defaultFeatures };
  }
  
  // Then try to sync with server if enabled
  if (enableServerSync) {
    try {
      const response = await fetch('/api/workout-settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const serverFeatures = await response.json() as FeatureFlags;
        console.log('Server features received:', serverFeatures);
        
        // Check if we have local customizations stored
        const hasLocalSettings = savedSettings && savedSettings !== 'null';
        
        if (hasLocalSettings) {
          console.log('Local settings exist - prioritizing local over server');
          // User has made local changes, don't override with server
          const localSettings = JSON.parse(savedSettings);
          
          // Only merge new server properties that don't exist locally
          const mergedSettings = { ...serverFeatures, ...localSettings };
          globalFeatures = mergedSettings;
          
          // Don't immediately sync back to server during initialization
          // This prevents infinite loops - server sync will happen when user changes settings
          console.log('Local preferences kept, server sync skipped during init');
        } else {
          console.log('No local settings - using server settings');
          // No local customizations, use server settings
          globalFeatures = { ...defaultFeatures, ...serverFeatures };
          localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
        }
      }
    } catch (error) {
      console.warn('Failed to load features from server, using cached/defaults:', error);
    }
  }
  
  // Ensure we have at least default features
  if (!globalFeatures) {
    globalFeatures = { ...defaultFeatures };
  }
  
  isInitialized = true;
  isInitializing = false;
  
  // Trigger update for all components
  window.dispatchEvent(new CustomEvent('featureFlagsUpdated', { 
    detail: globalFeatures 
  }));
};

// Hook to initialize features when user is authenticated
export const useFeatureInitialization = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (isAuthenticated && !isInitialized && !isInitializing) {
      console.log('User authenticated, initializing features');
      initializeFeatures(true);
    } else if (!isAuthenticated) {
      console.log('User logged out, preserving settings');
      // Save current settings before logout
      if (globalFeatures) {
        localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
      }
      // Reset only when actually logging out
      isInitialized = false;
      isInitializing = false;
      isServerSyncEnabled = false;
    }
  }, [isAuthenticated]);
};