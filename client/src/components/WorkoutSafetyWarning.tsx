import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Dumbbell, X } from 'lucide-react';
import { useWorkoutSessionSafety } from '@/hooks/useWorkoutSessionSafety';

interface WorkoutSafetyWarningProps {
  onDismiss?: () => void;
  showInNutrition?: boolean;
}

export function WorkoutSafetyWarning({ onDismiss, showInNutrition = false }: WorkoutSafetyWarningProps) {
  const { workoutState } = useWorkoutSessionSafety();
  const [isDismissed, setIsDismissed] = useState(false);

  // Show warning if workout is active and user is in nutrition area
  const shouldShow = workoutState.isWorkoutActive && showInNutrition && !isDismissed;

  useEffect(() => {
    // Reset dismissed state when workout changes
    setIsDismissed(false);
  }, [workoutState.sessionId]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const workoutDuration = workoutState.workoutStartTime 
    ? Math.floor((Date.now() - workoutState.workoutStartTime) / 60000)
    : 0;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-orange-600" />
          <span className="text-sm">
            <strong>Active Workout Detected</strong> 
            {workoutDuration > 0 && ` (${workoutDuration} min)`}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-orange-100 dark:hover:bg-orange-900"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
      <div className="mt-2 text-xs text-orange-700 dark:text-orange-300">
        Your workout session #{workoutState.sessionId} is still active. 
        Nutrition changes will be saved but consider completing your workout first for best experience.
      </div>
    </Alert>
  );
}