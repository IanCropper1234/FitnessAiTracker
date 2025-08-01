import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap } from 'lucide-react';
import { SpinnerInput } from './SpinnerInput';

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

interface ExerciseRecommendation {
  exerciseId: number;
  recommendedWeight: number;
  recommendedReps: string;
  recommendedRpe: number;
  week: number;
  reasoning: string;
}

interface SetRowSpinnerProps {
  set: WorkoutSet;
  recommendation?: ExerciseRecommendation;
  onUpdateSet: (field: keyof WorkoutSet, value: any) => void;
  onCompleteSet: () => void;
  isActive: boolean;
  className?: string;
}

export const SetRowSpinner: React.FC<SetRowSpinnerProps> = ({
  set,
  recommendation,
  onUpdateSet,
  onCompleteSet,
  isActive,
  className = "",
}) => {
  const canComplete = set.weight > 0 && set.actualReps > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recommendation banner */}
      {recommendation && isActive && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800  p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              AI Recommendation (Week {recommendation.week})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Weight:</span>
              <span className="ml-1 font-medium">{recommendation.recommendedWeight}kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reps:</span>
              <span className="ml-1 font-medium">{recommendation.recommendedReps}</span>
            </div>
            <div>
              <span className="text-muted-foreground">RPE:</span>
              <span className="ml-1 font-medium">{recommendation.recommendedRpe}</span>
            </div>
          </div>
          {recommendation.reasoning && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {recommendation.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Set header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">
            Set {set.setNumber}
          </h4>
          <Badge variant="outline" className="text-xs">
            Target: {set.targetReps} reps
          </Badge>
        </div>
        {set.completed && (
          <Badge variant="default" className="bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Weight */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Weight (kg)</Label>
          <SpinnerInput
            value={set.weight}
            onChange={(value) => onUpdateSet('weight', value)}
            min={0}
            max={500}
            step={0.5}
            inputMode="decimal"
            disabled={set.completed}
            className="w-full"
          />
        </div>

        {/* Actual Reps */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Actual Reps</Label>
          <SpinnerInput
            value={set.actualReps}
            onChange={(value) => onUpdateSet('actualReps', value)}
            min={0}
            max={50}
            step={1}
            inputMode="numeric"
            disabled={set.completed}
            className="w-full"
          />
        </div>

        {/* RPE */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">RPE (1-10)</Label>
          <SpinnerInput
            value={set.rpe}
            onChange={(value) => onUpdateSet('rpe', value)}
            min={1}
            max={10}
            step={1}
            inputMode="numeric"
            disabled={set.completed}
            className="w-full"
          />
        </div>

        {/* Complete Button */}
        <div className="space-y-2">
          <Label className="text-xs font-medium opacity-0">Action</Label>
          <Button
            onClick={onCompleteSet}
            disabled={set.completed || !canComplete}
            className={`w-full h-10 ${
              set.completed 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : canComplete
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {set.completed ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Done</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Quick fill buttons */}
      {!set.completed && recommendation && isActive && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onUpdateSet('weight', recommendation.recommendedWeight);
              onUpdateSet('actualReps', parseInt(recommendation.recommendedReps.split('-')[0] || '8'));
              onUpdateSet('rpe', recommendation.recommendedRpe);
            }}
            className="text-xs"
          >
            Use Recommendation
          </Button>
        </div>
      )}
    </div>
  );
};