import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFeature, updateFeatureFlags } from '@/hooks/useFeature';
import { WorkoutExecution } from './workout-execution';
import { WorkoutExecutionV2 } from './enhanced/WorkoutExecutionV2';

interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;
  isCompleted: boolean;
  version: string; // "1.0" or "2.0"
  features?: {
    spinnerSetInput?: boolean;
    gestureNavigation?: boolean;
    circularProgress?: boolean;
    restTimerFAB?: boolean;
    workoutSummary?: boolean;
  };
}

interface WorkoutExecutionWrapperProps {
  sessionId: string;
  onComplete: () => void;
  fallbackMode?: boolean; // Emergency fallback to V1
}

export const WorkoutExecutionWrapper: React.FC<WorkoutExecutionWrapperProps> = ({
  sessionId,
  onComplete,
  fallbackMode = false,
}) => {
  // Global feature flags
  const isV2Enabled = useFeature('workoutExecutionV2');
  
  // Fetch session to determine version
  const { data: session, isLoading, error } = useQuery<WorkoutSession>({
    queryKey: ["/api/training/session", sessionId],
    retry: (failureCount, error) => {
      // If V2 fails, enable fallback mode
      if (failureCount === 2) {
        console.warn('Session fetch failed, enabling fallback mode');
        return false;
      }
      return failureCount < 2;
    },
  });

  // Update feature flags based on session features
  useEffect(() => {
    if (session?.features) {
      updateFeatureFlags({
        spinnerSetInput: session.features.spinnerSetInput || false,
        gestureNavigation: session.features.gestureNavigation || false,
        circularProgress: session.features.circularProgress || false,
        restTimerFAB: session.features.restTimerFAB || false,
        workoutSummary: session.features.workoutSummary || false,
      });
    }
  }, [session?.features]);

  // Error handling with automatic fallback
  if (error) {
    console.error('WorkoutExecutionWrapper error:', error);
    console.log('Falling back to legacy component due to error');
    return <WorkoutExecution sessionId={parseInt(sessionId, 10)} onComplete={onComplete} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading workout session...</p>
        </div>
      </div>
    );
  }

  // Decision logic for component version
  const shouldUseV2 = () => {
    // Emergency fallback
    if (fallbackMode) {
      console.log('Using V1: Emergency fallback mode enabled');
      return false;
    }

    // Global feature flag disabled
    if (!isV2Enabled) {
      console.log('Using V1: Global V2 feature flag disabled');
      return false;
    }

    // If V2 is enabled globally, use V2 regardless of session version
    // This allows testing V2 features on existing sessions
    console.log('Using V2: Global V2 feature flag enabled');
    return true;
  };

  const useV2 = shouldUseV2();

  // Log decision for debugging
  console.log('WorkoutExecutionWrapper decision:', {
    sessionId,
    sessionVersion: session?.version,
    isV2Enabled,
    fallbackMode,
    useV2,
    sessionFeatures: session?.features,
  });

  // Render appropriate component
  if (useV2) {
    return (
      <WorkoutExecutionV2 
        sessionId={sessionId} 
        onComplete={onComplete}
      />
    );
  } else {
    return (
      <WorkoutExecution 
        sessionId={parseInt(sessionId, 10)} 
        onComplete={onComplete}
      />
    );
  }
};