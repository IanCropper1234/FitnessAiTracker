import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown, ChevronUp, Target, Dumbbell } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface ExerciseCardV2Props {
  exercise: {
    id: number;
    exercise: {
      name: string;
      category: string;
      primaryMuscle: string;
      equipment?: string;
      instructions?: string;
    };
    sets: number;
    targetReps: string;
    restPeriod: number;
  };
  workoutSets: Array<{
    setNumber: number;
    targetReps: number;
    actualReps: number;
    weight: number;
    rpe: number;
    completed: boolean;
  }>;
  isCurrentExercise: boolean;
  onSelectExercise: () => void;
  className?: string;
}

export const ExerciseCardV2: React.FC<ExerciseCardV2Props> = ({
  exercise,
  workoutSets,
  isCurrentExercise,
  onSelectExercise,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(isCurrentExercise);
  
  const completedSetsCount = workoutSets.filter(set => set.completed).length;
  const totalSetsCount = workoutSets.length;
  const isExerciseComplete = completedSetsCount === totalSetsCount && totalSetsCount > 0;
  const completionPercentage = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0;

  // Auto-expand when becomes current exercise
  React.useEffect(() => {
    if (isCurrentExercise) {
      setIsExpanded(true);
    }
  }, [isCurrentExercise]);

  const getCardStyle = () => {
    if (isCurrentExercise) {
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 ring-2 ring-blue-300 dark:ring-blue-700';
    } else if (isExerciseComplete) {
      return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
    }
    return 'bg-card hover:bg-muted/50';
  };

  return (
    <Card className={`transition-all duration-200 ${getCardStyle()} ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/30 transition-colors pb-3"
            onClick={onSelectExercise}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Circular progress indicator */}
                <CircularProgress 
                  progress={completionPercentage} 
                  size={36}
                  strokeWidth={3}
                  showText={false}
                  className={isExerciseComplete ? 'text-green-600' : 'text-primary'}
                >
                  {isExerciseComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Dumbbell className="h-4 w-4" />
                  )}
                </CircularProgress>
                
                <div className="flex-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {exercise.exercise.name}
                    {isCurrentExercise && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {completedSetsCount}/{totalSetsCount} sets
                    </span>
                    {totalSetsCount !== exercise.sets && (
                      <Badge variant="outline" className="text-xs">Modified</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Exercise metadata */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="capitalize">
                {exercise.exercise.category}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {exercise.exercise.primaryMuscle.replace('_', ' ')}
              </Badge>
              {exercise.exercise.equipment && (
                <Badge variant="outline" className="capitalize">
                  {exercise.exercise.equipment.replace('_', ' ')}
                </Badge>
              )}
            </div>
            
            {/* Exercise instructions */}
            {exercise.exercise.instructions && (
              <p className="text-sm text-muted-foreground mb-3">
                {exercise.exercise.instructions}
              </p>
            )}
            
            {/* Sets overview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sets Overview</h4>
              <div className="grid gap-1">
                {workoutSets.map((set, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2  text-sm ${
                      set.completed 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-medium">Set {set.setNumber}</span>
                    <div className="flex items-center gap-2">
                      {set.completed ? (
                        <>
                          <span>{set.weight}kg × {set.actualReps}</span>
                          <span>RPE: {set.rpe}</span>
                          <CheckCircle2 className="h-3 w-3" />
                        </>
                      ) : (
                        <span>Target: {set.targetReps} reps</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Rest period info */}
            <div className="mt-3 text-xs text-muted-foreground">
              Rest Period: {Math.floor(exercise.restPeriod / 60)}:{(exercise.restPeriod % 60).toString().padStart(2, '0')}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};