import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkoutSetting } from '@/hooks/useSettings';
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
  // Global settings
  const [isV2Enabled] = useWorkoutSetting('workoutExecutionV2');
  
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

  // Session features are now handled by the global settings system

  // Error handling with automatic fallback
  if (error) {
    console.error('WorkoutExecutionWrapper error:', error);
    // Falling back to legacy component due to error
    return <WorkoutExecution sessionId={parseInt(sessionId, 10)} onComplete={onComplete} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="ios-loading-dots flex items-center gap-1 justify-center mb-4">
            <div className="dot w-2 h-2 bg-primary rounded-full"></div>
            <div className="dot w-2 h-2 bg-primary rounded-full"></div>
            <div className="dot w-2 h-2 bg-primary rounded-full"></div>
          </div>
          <p>Loading workout session...</p>
        </div>
      </div>
    );
  }

  // Decision logic for component version
  const shouldUseV2 = () => {
    // Emergency fallback
    if (fallbackMode) {
      // Using V1: Emergency fallback mode enabled
      return false;
    }

    // Global feature flag disabled
    if (!isV2Enabled) {
      // Using V1: Global V2 feature flag disabled
      return false;
    }

    // If V2 is enabled globally, use V2 regardless of session version
    // This allows testing V2 features on existing sessions
    // Using V2: Global V2 feature flag enabled
    return true;
  };

  const useV2 = shouldUseV2();

  // Decision logic complete - using V2 or V1 based on feature flags

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