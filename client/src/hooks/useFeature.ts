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
  
  // Sync to server if enabled
  if (isServerSyncEnabled) {
    try {
      await apiRequest('/api/workout-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(globalFeatures),
      });
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
  
  // Sync to server if enabled
  if (isServerSyncEnabled) {
    try {
      await apiRequest('/api/workout-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(globalFeatures),
      });
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
  
  if (enableServerSync) {
    try {
      const serverFeatures = await apiRequest('/api/workout-settings') as FeatureFlags;
      globalFeatures = { ...defaultFeatures, ...serverFeatures };
      console.log('Features initialized from server:', globalFeatures);
    } catch (error) {
      console.warn('Failed to load features from server, using defaults:', error);
      globalFeatures = { ...defaultFeatures };
    }
  } else {
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
      // Reset to defaults when logged out
      globalFeatures = { ...defaultFeatures };
      isInitialized = false;
      isServerSyncEnabled = false;
    }
  }, [isAuthenticated]);
};