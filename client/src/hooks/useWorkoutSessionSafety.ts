import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface ActiveWorkoutState {
  isWorkoutActive: boolean;
  sessionId: number | null;
  workoutStartTime: number | null;
  warningShown: boolean;
}

/**
 * Hook to manage workout session safety and prevent conflicts
 * when users navigate between workout execution and nutrition tracking
 */
export function useWorkoutSessionSafety() {
  const [location] = useLocation();
  const [workoutState, setWorkoutState] = useState<ActiveWorkoutState>({
    isWorkoutActive: false,
    sessionId: null,
    workoutStartTime: null,
    warningShown: false
  });

  // Check for active workout sessions
  const { data: activeSessions } = useQuery({
    queryKey: ['/api/training/active-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/training/active-sessions');
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    enabled: true
  });

  // Monitor for workout execution URLs
  useEffect(() => {
    const isWorkoutExecution = location.includes('/workout/') || 
                              location.includes('/training/') ||
                              sessionStorage.getItem('activeWorkoutSession');
    
    const sessionId = sessionStorage.getItem('activeWorkoutSession');
    const startTime = sessionStorage.getItem('workoutStartTime');
    
    if (isWorkoutExecution || sessionId) {
      setWorkoutState(prev => ({
        ...prev,
        isWorkoutActive: true,
        sessionId: sessionId ? parseInt(sessionId) : null,
        workoutStartTime: startTime ? parseInt(startTime) : Date.now()
      }));
    } else if (activeSessions?.length === 0) {
      // Clear workout state when no active sessions
      setWorkoutState({
        isWorkoutActive: false,
        sessionId: null,
        workoutStartTime: null,
        warningShown: false
      });
      sessionStorage.removeItem('activeWorkoutSession');
      sessionStorage.removeItem('workoutStartTime');
    }
  }, [location, activeSessions]);

  // Prevent data conflicts during active workouts
  const shouldRestrictNutritionEdits = workoutState.isWorkoutActive;
  
  // Safe navigation checker
  const checkSafeNavigation = (targetLocation: string): boolean => {
    // Always allow navigation to workout-related pages
    if (targetLocation.includes('/workout/') || targetLocation.includes('/training/')) {
      return true;
    }
    
    // If no active workout, navigation is safe
    if (!workoutState.isWorkoutActive) {
      return true;
    }
    
    // For nutrition pages during workout, show warning but allow
    return true;
  };

  // Data synchronization safety
  const getSafeQueryOptions = (queryKey: string[]) => {
    if (workoutState.isWorkoutActive && queryKey.some(key => 
      typeof key === 'string' && (key.includes('nutrition') || key.includes('diet'))
    )) {
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: false, // Disable automatic refetch during workout
        refetchOnWindowFocus: false
      };
    }
    return {};
  };

  // Mutation safety wrapper
  const isMutationSafe = (mutationType: 'nutrition' | 'workout' | 'general'): boolean => {
    if (!workoutState.isWorkoutActive) return true;
    
    switch (mutationType) {
      case 'workout':
        return true; // Always allow workout mutations
      case 'nutrition':
        return true; // Allow but with warnings
      case 'general':
        return true;
      default:
        return true;
    }
  };

  return {
    workoutState,
    shouldRestrictNutritionEdits,
    checkSafeNavigation,
    getSafeQueryOptions,
    isMutationSafe,
    // Utility functions
    markWorkoutStart: (sessionId: number) => {
      const startTime = Date.now();
      sessionStorage.setItem('activeWorkoutSession', sessionId.toString());
      sessionStorage.setItem('workoutStartTime', startTime.toString());
      setWorkoutState({
        isWorkoutActive: true,
        sessionId,
        workoutStartTime: startTime,
        warningShown: false
      });
    },
    markWorkoutEnd: () => {
      sessionStorage.removeItem('activeWorkoutSession');
      sessionStorage.removeItem('workoutStartTime');
      setWorkoutState({
        isWorkoutActive: false,
        sessionId: null,
        workoutStartTime: null,
        warningShown: false
      });
    }
  };
}