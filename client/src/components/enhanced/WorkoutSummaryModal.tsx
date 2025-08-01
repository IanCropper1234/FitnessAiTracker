import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  Weight, 
  TrendingUp,
  Star,
  Target,
  CheckCircle2
} from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

interface WorkoutSummaryData {
  sessionName: string;
  duration: number; // in minutes
  totalVolume: number; // kg * reps
  completedSets: number;
  totalSets: number;
  exercises: Array<{
    name: string;
    sets: WorkoutSet[];
    muscleGroups: string[];
  }>;
  averageRPE: number;
  personalRecords?: Array<{
    exercise: string;
    type: 'weight' | 'reps' | 'volume';
    value: number;
    improvement: string;
  }>;
}

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: WorkoutSummaryData;
  onShareProgress?: () => void;
  onViewAnalytics?: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  onShareProgress,
  onViewAnalytics,
}) => {
  if (!isOpen) return null;

  const {
    sessionName,
    duration,
    totalVolume,
    completedSets,
    totalSets,
    exercises,
    averageRPE,
    personalRecords = []
  } = summaryData;

  const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CircularProgress 
              progress={completionPercentage}
              size={80}
              strokeWidth={6}
              className="mx-auto"
            >
              <div className="text-center">
                <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
                <span className="text-lg font-bold">{Math.round(completionPercentage)}%</span>
              </div>
            </CircularProgress>
          </div>
          
          <CardTitle className="text-xl">
            Workout Complete!
          </CardTitle>
          <p className="text-muted-foreground">{sessionName}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 ">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-bold">{formatDuration(duration)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 ">
              <Weight className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Volume (kg)</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 ">
              <Target className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <div className="text-lg font-bold">{completedSets}/{totalSets}</div>
              <div className="text-sm text-muted-foreground">Sets Completed</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 ">
              <Star className="h-5 w-5 mx-auto mb-1 text-orange-600" />
              <div className="text-lg font-bold">{averageRPE.toFixed(1)}/10</div>
              <div className="text-sm text-muted-foreground">Avg RPE</div>
            </div>
          </div>

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Personal Records
              </h3>
              <div className="space-y-2">
                {personalRecords.map((pr, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 "
                  >
                    <div>
                      <div className="font-medium">{pr.exercise}</div>
                      <div className="text-sm text-muted-foreground">
                        New {pr.type} record: {pr.value}{pr.type === 'weight' ? 'kg' : pr.type === 'reps' ? ' reps' : 'kg'}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {pr.improvement}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Summary */}
          <div>
            <h3 className="font-semibold mb-3">Exercise Summary</h3>
            <div className="space-y-3">
              {exercises.map((exercise, index) => {
                const completedExerciseSets = exercise.sets.filter(set => set.completed).length;
                const exerciseCompletion = exercise.sets.length > 0 ? (completedExerciseSets / exercise.sets.length) * 100 : 0;
                
                return (
                  <div key={index} className="p-3 border ">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="flex gap-1 mt-1">
                          {exercise.muscleGroups.map((muscle, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {completedExerciseSets}/{exercise.sets.length} sets
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(exerciseCompletion)}% complete
                        </div>
                      </div>
                    </div>
                    
                    {exerciseCompletion === 100 && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        Exercise completed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            {onViewAnalytics && (
              <Button onClick={onViewAnalytics} variant="default" className="flex-1">
                View Analytics
              </Button>
            )}
          </div>
          
          {onShareProgress && (
            <Button onClick={onShareProgress} variant="secondary" className="w-full">
              Share Progress
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};