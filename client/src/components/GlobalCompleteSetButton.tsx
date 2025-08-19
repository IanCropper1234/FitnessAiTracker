import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock, Trophy } from 'lucide-react';
import { useWorkoutExecution } from '@/contexts/WorkoutExecutionContext';

export const GlobalCompleteSetButton: React.FC = () => {
  const { state } = useWorkoutExecution();

  // Only show when in active workout and execution tab
  const shouldShow = state.isInActiveWorkout && 
                     state.currentTab === 'execution' && 
                     (state.onCompleteSet !== null || state.onCompleteWorkout !== null);

  if (!shouldShow) return null;

  // Determine button mode: Complete Workout or Complete Set
  const isWorkoutComplete = state.allSetsCompleted && state.onCompleteWorkout;
  const buttonHandler = isWorkoutComplete ? state.onCompleteWorkout : state.onCompleteSet;
  const canProceed = isWorkoutComplete ? state.canCompleteWorkout : state.canCompleteSet;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="safe-area-pb px-4 py-3">
        <Button
          onClick={buttonHandler || undefined}
          disabled={!canProceed}
          className={`w-full min-h-[48px] text-base font-semibold transition-all duration-200 ios-touch-feedback ${
            canProceed 
              ? isWorkoutComplete 
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
          variant="default"
        >
          {canProceed ? (
            <>
              {isWorkoutComplete ? (
                <>
                  <Trophy className="h-5 w-5 mr-2" />
                  Complete Workout
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Complete Set
                </>
              )}
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 mr-2" />
              Enter all values
            </>
          )}
        </Button>
        
        {/* Set information - hide when workout is complete */}
        {state.currentSetInfo && !isWorkoutComplete && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            {state.currentSetInfo.exerciseName} • Set {state.currentSetInfo.setNumber} of {state.currentSetInfo.totalSets}
          </div>
        )}
        
        {/* Workout completion message */}
        {isWorkoutComplete && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            All sets completed! Ready to finish workout.
          </div>
        )}
      </div>
    </div>
  );
};