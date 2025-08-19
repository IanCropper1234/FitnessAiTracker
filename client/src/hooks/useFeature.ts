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
  globalFeatures[featureName] = enabled;
  
  // Save to localStorage for persistence
  localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
  
  // Sync to server if enabled
  if (isServerSyncEnabled) {
    try {
      await apiRequest('PUT', '/api/workout-settings', globalFeatures);
    } catch (error) {
      console.warn('Failed to sync feature flag to server:', error);
      // Continue with local update even if server sync fails
    }
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
  
  // Sync to server if enabled
  if (isServerSyncEnabled) {
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
  if (isInitialized) return;
  
  isServerSyncEnabled = enableServerSync;
  
  // First try to load from localStorage for immediate availability
  try {
    const savedSettings = localStorage.getItem('workout-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Merge with defaults but prioritize saved settings
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
        // Only merge server features, don't override with defaults again
        globalFeatures = { ...globalFeatures, ...serverFeatures };
        // Save to localStorage for future loads
        localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
        console.log('Features synced from server:', globalFeatures);
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
  
  // Trigger update for all components
  window.dispatchEvent(new CustomEvent('featureFlagsUpdated', { 
    detail: globalFeatures 
  }));
};

// Hook to initialize features when user is authenticated
export const useFeatureInitialization = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      initializeFeatures(true);
    } else if (!isAuthenticated && isInitialized) {
      // Save current settings before logout
      if (globalFeatures) {
        localStorage.setItem('workout-settings', JSON.stringify(globalFeatures));
      }
      // Reset initialization flag but keep features for next login
      isInitialized = false;
      isServerSyncEnabled = false;
    }
  }, [isAuthenticated]);
};