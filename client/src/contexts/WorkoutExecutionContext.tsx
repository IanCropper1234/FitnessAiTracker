import { createContext, useContext, useState, useCallback } from 'react';

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
  
  // Complete Workout functionality
  canCompleteWorkout: boolean;
  onCompleteWorkout: (() => void) | null;
  allSetsCompleted: boolean;
  
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
  setCompleteWorkoutHandler: (handler: (() => void) | null) => void;
  setCanCompleteWorkout: (canComplete: boolean) => void;
  setAllSetsCompleted: (completed: boolean) => void;
  setHideMenuBar: (hide: boolean) => void;
}

const defaultState: WorkoutExecutionState = {
  isInActiveWorkout: false,
  currentTab: null,
  canCompleteSet: false,
  onCompleteSet: null,
  currentSetInfo: null,
  canCompleteWorkout: false,
  onCompleteWorkout: null,
  allSetsCompleted: false,
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

  const setCompleteWorkoutHandler = useCallback((handler: (() => void) | null) => {
    setState(prev => ({ ...prev, onCompleteWorkout: handler }));
  }, []);

  const setCanCompleteWorkout = useCallback((canComplete: boolean) => {
    setState(prev => ({ ...prev, canCompleteWorkout: canComplete }));
  }, []);

  const setAllSetsCompleted = useCallback((completed: boolean) => {
    setState(prev => ({ ...prev, allSetsCompleted: completed }));
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
      setCompleteWorkoutHandler,
      setCanCompleteWorkout,
      setAllSetsCompleted,
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
      setCompleteWorkoutHandler: () => {},
      setCanCompleteWorkout: () => {},
      setAllSetsCompleted: () => {},
      setHideMenuBar: () => {},
    };
  }
  return context;
};