import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Timer, Plus, Minus, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
}

interface WorkoutSessionProps {
  userId: number;
  sessionName: string;
  exercises: Exercise[];
  onComplete: () => void;
}

interface ExerciseSet {
  set: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export function WorkoutSession({ userId, sessionName, exercises, onComplete }: WorkoutSessionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionData, setSessionData] = useState<Record<number, ExerciseSet[]>>({});
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Initialize sets for current exercise
  const currentExercise = exercises[currentExerciseIndex];
  if (currentExercise && !sessionData[currentExercise.id]) {
    setSessionData(prev => ({
      ...prev,
      [currentExercise.id]: Array.from({ length: currentExercise.sets }, (_, i) => ({
        set: i + 1,
        reps: parseInt(currentExercise.reps.split('-')[0]) || 10,
        weight: currentExercise.weight || 0,
        completed: false
      }))
    }));
  }

  const completeWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      return apiRequest("/api/training/session/complete", {
        method: "POST",
        body: JSON.stringify(workoutData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Workout Completed!",
        description: "Great job! Time for auto-regulation feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout data.",
        variant: "destructive",
      });
    },
  });

  const updateSet = (exerciseId: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setSessionData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) => 
        i === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const toggleSetComplete = (exerciseId: number, setIndex: number) => {
    setSessionData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) => 
        i === setIndex ? { ...set, completed: !set.completed } : set
      )
    }));
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const completeWorkout = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 60000); // minutes
    const totalVolume = Object.values(sessionData).flat()
      .reduce((sum, set) => sum + (set.completed ? set.reps * set.weight : 0), 0);

    const workoutData = {
      userId,
      name: sessionName,
      duration,
      totalVolume,
      exercises: Object.entries(sessionData).map(([exerciseId, sets]) => ({
        exerciseId: parseInt(exerciseId),
        sets: sets.filter(set => set.completed)
      }))
    };

    completeWorkoutMutation.mutate(workoutData);
  };

  const currentSets = sessionData[currentExercise?.id] || [];
  const completedSets = currentSets.filter(set => set.completed).length;
  const allExercisesCompleted = exercises.every(ex => {
    const sets = sessionData[ex.id] || [];
    return sets.some(set => set.completed);
  });

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">{sessionName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-lg font-mono text-black dark:text-white">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Current Exercise */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">{currentExercise?.name}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedSets}/{currentExercise?.sets} sets completed
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSets.map((set, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">{set.set}</span>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Reps</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateSet(currentExercise.id, index, 'reps', Math.max(1, set.reps - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(currentExercise.id, index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateSet(currentExercise.id, index, 'reps', set.reps + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Weight (kg)</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateSet(currentExercise.id, index, 'weight', Math.max(0, set.weight - 2.5))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        step="2.5"
                        value={set.weight}
                        onChange={(e) => updateSet(currentExercise.id, index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateSet(currentExercise.id, index, 'weight', set.weight + 2.5)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={set.completed ? "default" : "outline"}
                  size="sm"
                  className={set.completed ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => toggleSetComplete(currentExercise.id, index)}
                >
                  {set.completed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={previousExercise}
            disabled={currentExerciseIndex === 0}
            className="border-gray-300 dark:border-gray-600"
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentExerciseIndex < exercises.length - 1 ? (
              <Button
                onClick={nextExercise}
                className="bg-black dark:bg-white text-white dark:text-black"
              >
                Next Exercise
              </Button>
            ) : (
              <Button
                onClick={completeWorkout}
                disabled={!allExercisesCompleted || completeWorkoutMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {completeWorkoutMutation.isPending ? "Saving..." : "Complete Workout"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}