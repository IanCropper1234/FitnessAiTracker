import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Target, ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useFeature } from '@/hooks/useFeature';

// Enhanced components
import { RestTimerFAB } from './RestTimerFAB';
import { ExerciseCardV2 } from './ExerciseCardV2';
import { SetRowSpinner } from './SetRowSpinner';
import { CircularProgress } from './CircularProgress';

// Import legacy component for fallback
import { WorkoutExecution } from '../workout-execution';

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: number;
  exerciseId: number;
  orderIndex: number;
  sets: number;
  targetReps: string;
  restPeriod: number;
  exercise: {
    id: number;
    name: string;
    category: string;
    primaryMuscle: string;
    equipment?: string;
    instructions?: string;
  };
  setsData?: WorkoutSet[];
}

interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
  version: string; // "1.0" or "2.0"
  features?: {
    spinnerSetInput?: boolean;
    gestureNavigation?: boolean;
    circularProgress?: boolean;
    restTimerFAB?: boolean;
  };
}

interface ExerciseRecommendation {
  exerciseId: number;
  recommendedWeight: number;
  recommendedReps: string;
  recommendedRpe: number;
  week: number;
  reasoning: string;
}

interface WorkoutExecutionV2Props {
  sessionId: string;
  onComplete: () => void;
}

export const WorkoutExecutionV2: React.FC<WorkoutExecutionV2Props> = ({
  sessionId,
  onComplete,
}) => {
  // Feature flags
  const isV2Enabled = useFeature('workoutExecutionV2');
  const spinnerInputEnabled = useFeature('spinnerSetInput');
  const gestureNavEnabled = useFeature('gestureNavigation');
  const circularProgressEnabled = useFeature('circularProgress');
  const restTimerFABEnabled = useFeature('restTimerFAB');

  // State management
  const [workoutData, setWorkoutData] = useState<Record<number, WorkoutSet[]>>({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session data
  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ["/api/training/session", sessionId],
  });

  // Check if we should use legacy component
  if (!isV2Enabled || session?.version === "1.0") {
    return <WorkoutExecution sessionId={sessionId} onComplete={onComplete} />;
  }

  // Fetch exercise recommendations
  const { data: recommendations = [] } = useQuery<ExerciseRecommendation[]>({
    queryKey: ["/api/training/exercise-recommendations", sessionId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/training/exercise-recommendations/${sessionId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!sessionId && !!session
  });

  // Initialize workout data
  useEffect(() => {
    if (session && Object.keys(workoutData).length === 0) {
      console.log('Initializing V2 workout data from session:', session);
      const initialData: Record<number, WorkoutSet[]> = {};
      
      session.exercises.forEach(exercise => {
        const targetRepsArray = exercise.targetReps.includes('-') 
          ? [parseInt(exercise.targetReps.split('-')[0])]
          : exercise.targetReps.split(',').map(r => parseInt(r.trim()));
        
        // Check for saved sets data
        if (exercise.setsData && Array.isArray(exercise.setsData) && exercise.setsData.length > 0) {
          initialData[exercise.id] = exercise.setsData;
        } else {
          // Create fresh sets
          initialData[exercise.id] = Array.from({ length: exercise.sets }, (_, i) => ({
            setNumber: i + 1,
            targetReps: targetRepsArray[i] || targetRepsArray[0] || 10,
            actualReps: 0,
            weight: 0,
            rpe: 7,
            completed: false
          }));
        }
      });
      
      setWorkoutData(initialData);
    }
  }, [session]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            toast({
              title: "Rest Complete!",
              description: "Time for your next set.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimeRemaining, toast]);

  // Gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (gestureNavEnabled && currentExerciseIndex < (session?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      }
    },
    onSwipedRight: () => {
      if (gestureNavEnabled && currentExerciseIndex > 0) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
        setCurrentSetIndex(0);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      const response = await apiRequest("PUT", `/api/training/sessions/${sessionId}/progress`, progressData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/session", sessionId] });
      toast({
        title: "Progress Saved",
        description: "Your workout progress has been saved.",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save workout progress: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading enhanced workout session...</p>
        </div>
      </div>
    );
  }

  const currentExercise = session.exercises[currentExerciseIndex];
  const currentSets = workoutData[currentExercise?.id] || [];
  const currentSet = currentSets[currentSetIndex];
  
  // Calculate progress
  const totalSets = Object.values(workoutData).reduce((sum, sets) => sum + sets.length, 0);
  const completedSets = Object.values(workoutData).flat().filter(set => set.completed).length;
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const updateSet = (exerciseId: number, setIndex: number, field: keyof WorkoutSet, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) => 
        i === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const completeSet = () => {
    if (!currentSet.weight || !currentSet.actualReps) {
      toast({
        title: "Incomplete Set",
        description: "Please enter weight and reps before completing the set.",
        variant: "destructive",
      });
      return;
    }

    updateSet(currentExercise.id, currentSetIndex, 'completed', true);
    
    // Start rest timer and advance
    if (currentSetIndex < currentSets.length - 1) {
      setRestTimeRemaining(currentExercise.restPeriod);
      setIsRestTimerActive(true);
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  const saveAndExit = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
    const totalVolume = Math.round(Object.values(workoutData)
      .flat()
      .filter(set => set.completed)
      .reduce((sum, set) => sum + (set.weight * set.actualReps), 0));

    const progressData = {
      duration,
      totalVolume,
      isCompleted: false,
      exercises: session.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: workoutData[exercise.id] || []
      }))
    };

    saveProgressMutation.mutate(progressData);
  };

  const getExerciseRecommendation = (exerciseId: number): ExerciseRecommendation | null => {
    return recommendations.find(rec => rec.exerciseId === exerciseId) || null;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" {...swipeHandlers}>
      {/* Enhanced Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{session.name}</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              V2 Enhanced
            </Badge>
          </CardTitle>
          
          {/* Enhanced Progress Display */}
          <div className="flex items-center gap-4">
            {circularProgressEnabled ? (
              <CircularProgress progress={progressPercentage} size={48} strokeWidth={4}>
                <span className="text-xs font-bold">{Math.round(progressPercentage)}%</span>
              </CircularProgress>
            ) : (
              <Progress value={progressPercentage} className="flex-1" />
            )}
            <div className="text-sm text-muted-foreground">
              {completedSets} of {totalSets} sets completed
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Exercise Overview */}
      <div className="space-y-3">
        {session.exercises.map((exercise, index) => (
          <ExerciseCardV2
            key={exercise.id}
            exercise={exercise}
            workoutSets={workoutData[exercise.id] || []}
            isCurrentExercise={index === currentExerciseIndex}
            onSelectExercise={() => {
              setCurrentExerciseIndex(index);
              setCurrentSetIndex(0);
            }}
          />
        ))}
      </div>

      {/* Current Exercise Details */}
      {currentExercise && currentSet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentExercise.exercise.name}
              <Badge variant="outline">
                Exercise {currentExerciseIndex + 1} of {session.exercises.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {spinnerInputEnabled ? (
              <SetRowSpinner
                set={currentSet}
                recommendation={getExerciseRecommendation(currentExercise.exerciseId)}
                onUpdateSet={(field, value) => updateSet(currentExercise.id, currentSetIndex, field, value)}
                onCompleteSet={completeSet}
                isActive={true}
              />
            ) : (
              // Legacy 4-column layout
              <div className="grid grid-cols-4 gap-2 items-end">
                {/* Legacy input components would go here */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Legacy input mode</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <Button
            variant="outline"
            disabled={currentExerciseIndex === 0}
            onClick={() => {
              setCurrentExerciseIndex(currentExerciseIndex - 1);
              setCurrentSetIndex(0);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Exercise {currentExerciseIndex + 1} of {session.exercises.length}
            </div>
            <div className="font-medium">
              {currentExercise?.exercise.name}
            </div>
          </div>
          
          <Button
            variant="outline"
            disabled={currentExerciseIndex === session.exercises.length - 1}
            onClick={() => {
              setCurrentExerciseIndex(currentExerciseIndex + 1);
              setCurrentSetIndex(0);
            }}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={saveAndExit} className="flex-1">
          Save & Exit
        </Button>
        <Button onClick={() => {/* Complete workout logic */}} className="flex-1">
          Complete Workout
        </Button>
      </div>

      {/* Enhanced Rest Timer FAB */}
      {restTimerFABEnabled && (
        <RestTimerFAB
          isActive={isRestTimerActive}
          timeRemaining={restTimeRemaining}
          totalTime={currentExercise?.restPeriod || 120}
          onSkip={() => {
            setIsRestTimerActive(false);
            setRestTimeRemaining(0);
          }}
          position="bottom-right"
          draggable={true}
        />
      )}
    </div>
  );
};