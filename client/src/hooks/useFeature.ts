import { useState, useEffect } from 'react';

// Feature flag configuration
interface FeatureFlags {
  workoutExecutionV2: boolean;
  spinnerSetInput: boolean;
  gestureNavigation: boolean;
  circularProgress: boolean;
  restTimerFAB: boolean;
  workoutSummary: boolean;
}

// Default feature flags (can be overridden by user preferences or server)
const defaultFeatures: FeatureFlags = {
  workoutExecutionV2: true, // Enable V2 by default for testing
  spinnerSetInput: true,
  gestureNavigation: true,
  circularProgress: true,
  restTimerFAB: true,
  workoutSummary: true,
};

// Global feature flag store
let globalFeatures: FeatureFlags = { ...defaultFeatures };

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

export const updateFeatureFlag = (featureName: keyof FeatureFlags, enabled: boolean) => {
  globalFeatures[featureName] = enabled;
  // Trigger re-render in components using this feature
  window.dispatchEvent(new CustomEvent('featureFlagUpdated', { 
    detail: { featureName, enabled } 
  }));
};

export const updateFeatureFlags = (newFeatures: Partial<FeatureFlags>) => {
  globalFeatures = { ...globalFeatures, ...newFeatures };
  window.dispatchEvent(new CustomEvent('featureFlagsUpdated', { 
    detail: newFeatures 
  }));
};

// Get current feature flags (for server sync)
export const getFeatureFlags = (): FeatureFlags => ({ ...globalFeatures });

// Initialize features from server or user preferences
export const initializeFeatures = (serverFeatures?: Partial<FeatureFlags>) => {
  if (serverFeatures) {
    globalFeatures = { ...defaultFeatures, ...serverFeatures };
  }
};