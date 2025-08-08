import React, { createContext, useContext, useState, useCallback } from 'react';

interface WorkoutExecutionState {
  // Workout execution status
  isInActiveWorkout: boolean;
  currentTab: 'execution' | 'exercises' | 'templates' | null;
  
  // Complete Set functionality
  canCompleteSet: boolean;
  onCompleteSet: (() => void) | null;
  currentSetInfo: {
    exerciseName: string;
    setNumber: number;
    totalSets: number;
  } | null;
  
  // Menu bar visibility
  hideMenuBar: boolean;
}

interface WorkoutExecutionContextType {
  state: WorkoutExecutionState;
  setIsInActiveWorkout: (active: boolean) => void;
  setCurrentTab: (tab: 'execution' | 'exercises' | 'templates' | null) => void;
  setCompleteSetHandler: (handler: (() => void) | null) => void;
  setCanCompleteSet: (canComplete: boolean) => void;
  setCurrentSetInfo: (info: WorkoutExecutionState['currentSetInfo']) => void;
  setHideMenuBar: (hide: boolean) => void;
}

const defaultState: WorkoutExecutionState = {
  isInActiveWorkout: false,
  currentTab: null,
  canCompleteSet: false,
  onCompleteSet: null,
  currentSetInfo: null,
  hideMenuBar: false,
};

// Export for use in fallback
export { defaultState };

const WorkoutExecutionContext = createContext<WorkoutExecutionContextType | null>(null);

export const WorkoutExecutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WorkoutExecutionState>(defaultState);

  const setIsInActiveWorkout = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, isInActiveWorkout: active }));
  }, []);

  const setCurrentTab = useCallback((tab: 'execution' | 'exercises' | 'templates' | null) => {
    setState(prev => ({ ...prev, currentTab: tab }));
  }, []);

  const setCompleteSetHandler = useCallback((handler: (() => void) | null) => {
    setState(prev => ({ ...prev, onCompleteSet: handler }));
  }, []);

  const setCanCompleteSet = useCallback((canComplete: boolean) => {
    setState(prev => ({ ...prev, canCompleteSet: canComplete }));
  }, []);

  const setCurrentSetInfo = useCallback((info: WorkoutExecutionState['currentSetInfo']) => {
    setState(prev => ({ ...prev, currentSetInfo: info }));
  }, []);

  const setHideMenuBar = useCallback((hide: boolean) => {
    setState(prev => ({ ...prev, hideMenuBar: hide }));
  }, []);

  return (
    <WorkoutExecutionContext.Provider value={{
      state,
      setIsInActiveWorkout,
      setCurrentTab,
      setCompleteSetHandler,
      setCanCompleteSet,
      setCurrentSetInfo,
      setHideMenuBar,
    }}>
      {children}
    </WorkoutExecutionContext.Provider>
  );
};

export const useWorkoutExecution = () => {
  const context = useContext(WorkoutExecutionContext);
  if (!context) {
    // Return default state instead of throwing error for better error handling
    console.warn('useWorkoutExecution called outside of WorkoutExecutionProvider, returning default state');
    return {
      state: defaultState,
      setIsInActiveWorkout: () => {},
      setCurrentTab: () => {},
      setCompleteSetHandler: () => {},
      setCanCompleteSet: () => {},
      setCurrentSetInfo: () => {},
      setHideMenuBar: () => {},
    };
  }
  return context;
};