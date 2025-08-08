import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FirstTimeUserData {
  isFirstTime: boolean;
  hasCompletedOnboarding: boolean;
  hasAnyData: boolean;
}

interface UseFirstTimeUserReturn {
  isFirstTimeUser: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
}

/**
 * Hook to determine if user is visiting the app for the first time
 * Based on multiple factors:
 * 1. Whether they've seen the onboarding animation (localStorage)
 * 2. Whether they have any existing data (nutrition logs, workouts, etc.)
 * 3. Whether their profile is complete
 */
export function useFirstTimeUser(userId?: number): UseFirstTimeUserReturn {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has seen onboarding in localStorage
  const hasSeenOnboarding = localStorage.getItem('fitai-onboarding-completed') === 'true';

  // Query to check if user has any existing data
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ['/api/user/first-time-check', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/user/first-time-check?userId=${userId}`);
      if (!response.ok) {
        // If the endpoint doesn't exist, fallback to basic checks
        return await fallbackFirstTimeCheck(userId);
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fallback method to check if user has data (if API endpoint doesn't exist)
  const fallbackFirstTimeCheck = async (userId: number) => {
    try {
      // Check for existing nutrition logs
      const nutritionResponse = await fetch(`/api/nutrition/logs?limit=1`);
      const nutritionData = nutritionResponse.ok ? await nutritionResponse.json() : null;
      
      // Check for existing workout sessions
      const workoutResponse = await fetch(`/api/training/sessions?limit=1`);
      const workoutData = workoutResponse.ok ? await workoutResponse.json() : null;
      
      // Check user profile completeness
      const profileResponse = await fetch('/api/auth/user');
      const profileData = profileResponse.ok ? await profileResponse.json() : null;
      
      const hasNutritionData = nutritionData && nutritionData.length > 0;
      const hasWorkoutData = workoutData && workoutData.length > 0;
      const hasIncompleteProfile = !profileData?.user?.name || !profileData?.user?.email;
      
      return {
        hasAnyData: hasNutritionData || hasWorkoutData,
        hasCompletedOnboarding: hasSeenOnboarding,
        isFirstTime: !hasSeenOnboarding && !hasNutritionData && !hasWorkoutData
      };
    } catch (error) {
      console.log('Error checking first-time user status:', error);
      // If all checks fail, assume not first time to avoid showing onboarding unnecessarily
      return {
        hasAnyData: true,
        hasCompletedOnboarding: true,
        isFirstTime: false
      };
    }
  };

  // Determine if user is first time based on all factors
  useEffect(() => {
    if (userDataLoading || !userId) {
      return;
    }

    if (userData) {
      const isFirstTime = !userData.hasCompletedOnboarding && 
                         !userData.hasAnyData && 
                         !hasSeenOnboarding;
      
      setIsFirstTimeUser(isFirstTime);
    } else {
      // No user data available, assume not first time
      setIsFirstTimeUser(false);
    }
    
    setIsLoading(false);
  }, [userData, userDataLoading, userId, hasSeenOnboarding]);

  // Complete onboarding - mark as completed in localStorage
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('fitai-onboarding-completed', 'true');
    setIsFirstTimeUser(false);
  }, []);

  return {
    isFirstTimeUser,
    isLoading,
    completeOnboarding,
  };
}