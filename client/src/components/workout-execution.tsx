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
import { Play, Pause, CheckCircle2, Clock, Target, TrendingUp, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

  // Fetch workout session details
  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ["/api/training/sessions", sessionId],
  });

  // Initialize workout data
  useEffect(() => {
    if (session && Object.keys(workoutData).length === 0) {
      const initialData: Record<number, WorkoutSet[]> = {};
      session.exercises.forEach(exercise => {
        const targetRepsArray = exercise.targetReps.includes('-') 
          ? [parseInt(exercise.targetReps.split('-')[0])]
          : exercise.targetReps.split(',').map(r => parseInt(r.trim()));
        
        initialData[exercise.id] = Array.from({ length: exercise.sets }, (_, i) => ({
          setNumber: i + 1,
          targetReps: targetRepsArray[i] || targetRepsArray[0] || 10,
          actualReps: 0,
          weight: 0,
          rpe: 7,
          completed: false
        }));
      });
      setWorkoutData(initialData);
    }
  }, [session, workoutData]);

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
        description: "Great job! Your workout has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout completion.",
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

  const currentExercise = session.exercises[currentExerciseIndex];
  const currentSets = workoutData[currentExercise?.id] || [];
  const currentSet = currentSets[currentSetIndex];
  
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0);
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
    
    // Start rest timer
    if (currentSetIndex < currentSets.length - 1) {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      {/* Current Exercise */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentExercise.exercise.name}
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
              <h4 className="font-medium">All Sets</h4>
              <div className="grid gap-2">
                {currentSets.map((set, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      set.completed ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' :
                      index === currentSetIndex ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                  >
                    <span className="font-medium">Set {set.setNumber}</span>
                    <div className="flex items-center gap-4 text-sm">
                      {set.completed ? (
                        <>
                          <span>{set.weight}kg × {set.actualReps} reps</span>
                          <span>RPE: {set.rpe}</span>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </>
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
          <Button variant="outline" onClick={onComplete} className="flex-1">
            Save & Exit
          </Button>
        )}
      </div>
    </div>
  );
}