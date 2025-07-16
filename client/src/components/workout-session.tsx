import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/language-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Plus } from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  completed?: boolean;
}

interface WorkoutSessionProps {
  userId: number;
  sessionName: string;
  exercises: Exercise[];
  onComplete?: () => void;
}

export function WorkoutSession({ userId, sessionName, exercises, onComplete }: WorkoutSessionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentExercises, setCurrentExercises] = useState(exercises);
  const [startTime] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);

  const completeWorkout = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/training/session", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      toast({
        title: t("training.workout_completed"),
        description: `${sessionName} has been completed`,
      });
      setIsCompleted(true);
      onComplete?.();
    },
    onError: (error) => {
      toast({
        title: t("error.failed_submit"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExercise = (exerciseId: number, field: string, value: any) => {
    setCurrentExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const markExerciseComplete = (exerciseId: number) => {
    setCurrentExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };

  const handleCompleteWorkout = () => {
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000 / 60); // minutes
    const totalVolume = currentExercises.reduce((sum, ex) => 
      sum + (ex.sets * (ex.weight || 0)), 0
    );

    completeWorkout.mutate({
      userId,
      programId: 1, // Mock program ID
      name: sessionName,
      duration,
      totalVolume,
      exercises: currentExercises.map((ex, index) => ({
        exerciseId: ex.id,
        orderIndex: index,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
      })),
    });
  };

  const completedCount = currentExercises.filter(ex => ex.completed).length;
  const progressPercentage = Math.round((completedCount / currentExercises.length) * 100);

  if (isCompleted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t("training.workout_completed")}</h3>
          <p className="text-muted-foreground">Great job completing {sessionName}!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{sessionName}</span>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {Math.round((Date.now() - startTime.getTime()) / 1000 / 60)}min
            </div>
          </CardTitle>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {currentExercises.length} exercises completed
          </p>
        </CardHeader>
      </Card>

      {/* Exercise List */}
      <div className="space-y-3">
        {currentExercises.map((exercise, index) => (
          <Card key={exercise.id} className={exercise.completed ? "opacity-75" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
                <Button
                  variant={exercise.completed ? "default" : "outline"}
                  size="sm"
                  onClick={() => markExerciseComplete(exercise.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("training.sets")}</Label>
                  <Input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(exercise.id, "sets", Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("training.reps")}</Label>
                  <Input
                    value={exercise.reps}
                    onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                    placeholder="8-12"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("training.weight")} (kg)</Label>
                  <Input
                    type="number"
                    value={exercise.weight || ""}
                    onChange={(e) => updateExercise(exercise.id, "weight", Number(e.target.value))}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Complete Workout Button */}
      <Button
        onClick={handleCompleteWorkout}
        disabled={completedCount === 0 || completeWorkout.isPending}
        className="w-full"
        size="lg"
      >
        {completeWorkout.isPending ? t("common.submitting") : t("training.complete_workout")}
      </Button>
    </div>
  );
}
