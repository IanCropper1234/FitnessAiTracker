import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, CheckCircle2, Clock, Target, TrendingUp, RotateCcw, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import WorkoutFeedbackDialog from "./workout-feedback-dialog";

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
  notes: string;
  weight: string | null;
  rpe: number | null;
  rir: number | null;
  actualReps: string | null;
  exercise: {
    id: number;
    name: string;
    category: string;
    muscleGroups: string[];
    primaryMuscle: string;
    equipment: string;
    movementPattern: string;
    difficulty: string;
    instructions: string;
  };
  workoutSets: WorkoutSet[];
}

interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;
  isCompleted: boolean;
  duration: number;
  totalVolume: number;
  exercises: WorkoutExercise[];
}

interface WorkoutExecutionProps {
  sessionId: number;
  onComplete: () => void;
}

export function WorkoutExecution({ sessionId, onComplete }: WorkoutExecutionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [workoutData, setWorkoutData] = useState<Record<number, WorkoutSet[]>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  // Fetch workout session details
  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ["/api/training/session", sessionId],
  });

  // Initialize workout data
  useEffect(() => {
    if (session && Object.keys(workoutData).length === 0) {
      const initialData: Record<number, WorkoutSet[]> = {};
      session.exercises.forEach(exercise => {
        const targetRepsArray = exercise.targetReps.includes('-') 
          ? [parseInt(exercise.targetReps.split('-')[0])]
          : exercise.targetReps.split(',').map(r => parseInt(r.trim()));
        
        // Use prefilled values from database if available
        const prefilledWeight = exercise.weight ? parseFloat(exercise.weight) : 0;
        const prefilledRpe = exercise.rpe || 7;
        
        // Parse actual reps from previous week if available
        let prefilledActualReps = 0;
        if (exercise.actualReps) {
          // Handle both single number and comma-separated format
          if (exercise.actualReps.includes(',')) {
            const repsArray = exercise.actualReps.split(',').map(r => parseInt(r.trim()));
            prefilledActualReps = repsArray[0] || 0; // Use first set's reps as default
          } else {
            prefilledActualReps = parseInt(exercise.actualReps) || 0;
          }
        }
        
        initialData[exercise.id] = Array.from({ length: exercise.sets }, (_, i) => ({
          setNumber: i + 1,
          targetReps: targetRepsArray[i] || targetRepsArray[0] || 10,
          actualReps: prefilledActualReps,
          weight: prefilledWeight,
          rpe: prefilledRpe,
          completed: false
        }));
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

  const completeWorkoutMutation = useMutation({
    mutationFn: async (completionData: any) => {
      return apiRequest("PUT", `/api/training/sessions/${sessionId}/complete`, completionData);
    },
    onSuccess: () => {
      toast({
        title: "Workout Completed!",
        description: "Great job! Now let's collect some feedback to optimize your future training.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      setShowFeedback(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout completion.",
        variant: "destructive",
      });
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return apiRequest("PUT", `/api/training/sessions/${sessionId}/progress`, progressData);
    },
    onSuccess: () => {
      toast({
        title: "Progress Saved",
        description: "Your workout progress has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout progress.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading workout session...</p>
        </div>
      </div>
    );
  }

  // Check if session has exercises
  if (!session.exercises || session.exercises.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises in this session</h3>
          <p className="text-muted-foreground mb-4">
            This workout session doesn't have any exercises. Please add exercises to continue.
          </p>
          <Button onClick={onComplete}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentExercise = session.exercises[currentExerciseIndex];
  const currentSets = workoutData[currentExercise?.id] || [];
  const currentSet = currentSets[currentSetIndex];
  
  // Calculate total sets dynamically based on current workout data
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

  // Add new set to current exercise
  const addSet = (exerciseId: number) => {
    setWorkoutData(prev => {
      const existingSets = prev[exerciseId] || [];
      const lastSet = existingSets[existingSets.length - 1];
      const targetRepsArray = currentExercise.targetReps.includes('-') 
        ? [parseInt(currentExercise.targetReps.split('-')[0])]
        : currentExercise.targetReps.split(',').map(r => parseInt(r.trim()));
      
      const newSet: WorkoutSet = {
        setNumber: existingSets.length + 1,
        targetReps: targetRepsArray[0] || 10,
        actualReps: lastSet?.actualReps || 0,
        weight: lastSet?.weight || 0,
        rpe: lastSet?.rpe || 7,
        completed: false
      };

      const updatedSets = [...existingSets, newSet];
      
      // Update set numbers
      updatedSets.forEach((set, index) => {
        set.setNumber = index + 1;
      });

      return {
        ...prev,
        [exerciseId]: updatedSets
      };
    });

    toast({
      title: "Set Added",
      description: `Added new set to ${currentExercise.exercise.name}`,
    });
  };

  // Remove set from current exercise
  const removeSet = (exerciseId: number, setIndex: number) => {
    setWorkoutData(prev => {
      const existingSets = prev[exerciseId] || [];
      
      if (existingSets.length <= 1) {
        toast({
          title: "Cannot Remove Set",
          description: "Each exercise must have at least one set.",
          variant: "destructive",
        });
        return prev;
      }

      // Check if removing a completed set
      const setToRemove = existingSets[setIndex];
      if (setToRemove.completed) {
        toast({
          title: "Cannot Remove Completed Set",
          description: "You cannot remove a set that has already been completed.",
          variant: "destructive",
        });
        return prev;
      }

      const updatedSets = existingSets.filter((_, index) => index !== setIndex);
      
      // Update set numbers
      updatedSets.forEach((set, index) => {
        set.setNumber = index + 1;
      });

      // Adjust current set index if needed
      if (setIndex <= currentSetIndex && currentSetIndex > 0) {
        setCurrentSetIndex(Math.max(0, currentSetIndex - 1));
      } else if (setIndex < currentSetIndex) {
        setCurrentSetIndex(currentSetIndex - 1);
      } else if (currentSetIndex >= updatedSets.length) {
        setCurrentSetIndex(Math.max(0, updatedSets.length - 1));
      }

      return {
        ...prev,
        [exerciseId]: updatedSets
      };
    });

    toast({
      title: "Set Removed",
      description: `Removed set from ${currentExercise.exercise.name}`,
    });
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
    
    // Get updated sets after completion
    const updatedSets = workoutData[currentExercise.id];
    
    // Start rest timer and advance to next set/exercise
    if (currentSetIndex < updatedSets.length - 1) {
      setRestTimeRemaining(currentExercise.restPeriod);
      setIsRestTimerActive(true);
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  const skipRest = () => {
    setIsRestTimerActive(false);
    setRestTimeRemaining(0);
  };

  const completeWorkout = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60); // minutes
    const totalVolume = Object.values(workoutData)
      .flat()
      .filter(set => set.completed)
      .reduce((sum, set) => sum + (set.weight * set.actualReps), 0);

    const completionData = {
      duration,
      totalVolume,
      isCompleted: true,
      exercises: session.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: workoutData[exercise.id] || []
      }))
    };

    completeWorkoutMutation.mutate(completionData);
  };

  const saveAndExit = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60); // minutes
    const totalVolume = Object.values(workoutData)
      .flat()
      .filter(set => set.completed)
      .reduce((sum, set) => sum + (set.weight * set.actualReps), 0);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show auto-regulation feedback after workout completion
  if (showFeedback && session.userId) {
    return (
      <>
        <WorkoutFeedbackDialog
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          sessionId={sessionId}
          userId={session.userId}
          onSubmitComplete={() => {
            setShowFeedback(false);
            onComplete();
          }}
        />
        <div className="p-6 text-center">
          <p className="text-lg font-medium">Workout Complete!</p>
          <p className="text-muted-foreground">Please provide your feedback to optimize future training.</p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{session.name}</span>
            <Badge variant="outline">
              Exercise {currentExerciseIndex + 1} of {session.exercises.length}
            </Badge>
          </CardTitle>
          <Progress value={progressPercentage} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {completedSets} of {totalSets} sets completed ({Math.round(progressPercentage)}%)
          </p>
        </CardHeader>
      </Card>

      {/* Rest Timer */}
      {isRestTimerActive && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Rest Time: {formatTime(restTimeRemaining)}</span>
            </div>
            <Button size="sm" variant="outline" onClick={skipRest}>
              Skip Rest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Exercises Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workout Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.exercises.map((exercise, index) => {
              const exerciseSets = workoutData[exercise.id] || [];
              const completedSetsCount = exerciseSets.filter(set => set.completed).length;
              const totalSetsCount = exerciseSets.length;
              const isCurrentExercise = index === currentExerciseIndex;
              const isExerciseComplete = completedSetsCount === totalSetsCount && totalSetsCount > 0;
              
              return (
                <div
                  key={exercise.id}
                  className={`p-3 rounded-lg border ${
                    isCurrentExercise 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                      : isExerciseComplete
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{exercise.exercise.name}</span>
                      {isCurrentExercise && (
                        <Badge variant="default" size="sm">Current</Badge>
                      )}
                      {isExerciseComplete && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {completedSetsCount}/{totalSetsCount} sets
                      {totalSetsCount !== exercise.sets && (
                        <span className="text-xs ml-1 text-blue-600">
                          (modified)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" size="sm" className="capitalize">
                      {exercise.exercise.category}
                    </Badge>
                    <Badge variant="secondary" size="sm" className="capitalize">
                      {exercise.exercise.primaryMuscle.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise Details */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentExercise.exercise.name}
              <Badge variant="outline">
                Exercise {currentExerciseIndex + 1} of {session.exercises.length}
              </Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {currentExercise.exercise.category}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {currentExercise.exercise.primaryMuscle.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {currentExercise.exercise.equipment?.replace('_', ' ')}
              </Badge>
            </div>
            {currentExercise.exercise.instructions && (
              <p className="text-sm text-muted-foreground">
                {currentExercise.exercise.instructions}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Current Set */}
            {currentSet && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">
                  Set {currentSet.setNumber} of {currentSets.length}
                  <span className="text-muted-foreground ml-2">
                    (Target: {currentSet.targetReps} reps)
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={currentSet.weight || ''}
                      onChange={(e) => updateSet(currentExercise.id, currentSetIndex, 'weight', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Actual Reps</Label>
                    <Input
                      type="number"
                      value={currentSet.actualReps || ''}
                      onChange={(e) => updateSet(currentExercise.id, currentSetIndex, 'actualReps', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>RPE (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={currentSet.rpe || ''}
                      onChange={(e) => updateSet(currentExercise.id, currentSetIndex, 'rpe', parseInt(e.target.value) || 7)}
                      placeholder="7"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={completeSet}
                      disabled={currentSet.completed}
                      className="w-full"
                    >
                      {currentSet.completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete Set
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* All Sets Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">All Sets</h4>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSet(currentExercise.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Set
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                {currentSets.map((set, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/50 ${
                      set.completed ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' :
                      index === currentSetIndex ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                    onClick={() => !set.completed && setCurrentSetIndex(index)}
                    title={!set.completed ? "Click to jump to this set" : "Set completed"}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Set {set.setNumber}</span>
                      {/* Show delete button for incomplete sets when there are multiple sets */}
                      {!set.completed && currentSets.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering set selection
                            removeSet(currentExercise.id, index);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove this set"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {set.completed ? (
                        <>
                          <span>{set.weight}kg × {set.actualReps} reps</span>
                          <span>RPE: {set.rpe}</span>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </>
                      ) : index === currentSetIndex ? (
                        <Badge variant="default" size="sm">
                          Current Set
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          Target: {set.targetReps} reps
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercise Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={currentExerciseIndex === 0}
              onClick={() => {
                setCurrentExerciseIndex(currentExerciseIndex - 1);
                setCurrentSetIndex(0);
              }}
            >
              Previous Exercise
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
              Next Exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {completedSets === totalSets ? (
          <Button 
            onClick={completeWorkout}
            disabled={completeWorkoutMutation.isPending}
            className="flex-1"
            size="lg"
          >
            {completeWorkoutMutation.isPending ? "Saving..." : "Complete Workout"}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={saveAndExit}
            disabled={saveProgressMutation.isPending}
            className="flex-1"
          >
            {saveProgressMutation.isPending ? "Saving..." : "Save & Exit"}
          </Button>
        )}
      </div>
    </div>
  );
}