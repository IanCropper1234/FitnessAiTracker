import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { useWorkoutExecution } from '@/contexts/WorkoutExecutionContext';

export const GlobalCompleteSetButton: React.FC = () => {
  const { state } = useWorkoutExecution();

  // Only show when in active workout and execution tab
  const shouldShow = state.isInActiveWorkout && 
                     state.currentTab === 'execution' && 
                     state.onCompleteSet !== null;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="safe-area-pb px-4 py-3">
        <Button
          onClick={state.onCompleteSet || undefined}
          disabled={!state.canCompleteSet}
          className={`w-full min-h-[48px] text-base font-semibold transition-all duration-200 ios-touch-feedback ${
            state.canCompleteSet 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
          variant="default"
        >
          {state.canCompleteSet ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Complete Set
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 mr-2" />
              Enter all values
            </>
          )}
        </Button>
        
        {/* Set information */}
        {state.currentSetInfo && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            {state.currentSetInfo.exerciseName} • Set {state.currentSetInfo.setNumber} of {state.currentSetInfo.totalSets}
          </div>
        )}
      </div>
    </div>
  );
};