import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Target, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
  instructions: string;
  translations: Record<string, string>;
}

interface ExerciseTemplate {
  exerciseId: number;
  exercise: Exercise;
  sets: number;
  targetReps: string;
  restPeriod: number;
  notes: string;
}

interface WorkoutSessionCreatorProps {
  selectedExercises: Exercise[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkoutSessionCreator({ selectedExercises, isOpen, onClose, onSuccess }: WorkoutSessionCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionName, setSessionName] = useState("");
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);

  // Update exercise templates when selectedExercises changes
  useEffect(() => {
    if (selectedExercises.length > 0) {
      setExerciseTemplates(
        selectedExercises.map(exercise => ({
          exerciseId: exercise.id,
          exercise,
          sets: 3,
          targetReps: "8-12",
          restPeriod: 90,
          notes: ""
        }))
      );
    } else {
      setExerciseTemplates([]);
    }
  }, [selectedExercises]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSessionName("");
    }
  }, [isOpen]);

  const createWorkoutSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest("POST", "/api/training/sessions", sessionData);
    },
    onSuccess: () => {
      toast({
        title: "Workout Session Created",
        description: "Your workout session is ready to start!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      onSuccess();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout session.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSessionName("");
    // Don't reset exerciseTemplates here as they come from props
  };

  const updateExerciseTemplate = (index: number, field: keyof ExerciseTemplate, value: any) => {
    setExerciseTemplates(prev => 
      prev.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    );
  };

  const removeExercise = (index: number) => {
    setExerciseTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a session name.",
        variant: "destructive",
      });
      return;
    }

    if (exerciseTemplates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      userId: 1, // TODO: Get from auth context
      name: sessionName,
      exercises: exerciseTemplates.map((template, index) => ({
        exerciseId: template.exerciseId,
        orderIndex: index,
        sets: template.sets,
        targetReps: template.targetReps,
        restPeriod: template.restPeriod,
        notes: template.notes
      }))
    };

    createWorkoutSessionMutation.mutate(sessionData);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workout Session</DialogTitle>
          <DialogDescription>
            Configure your workout session with the selected exercises. Set target sets, reps, and rest periods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="sessionName">Session Name *</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Upper Body Push Day"
              required
            />
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exercises ({exerciseTemplates.length})</h3>
            
            {exerciseTemplates.map((template, index) => (
              <Card key={template.exerciseId} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.exercise.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {template.exercise.category}
                        </Badge>
                        <Badge className={getDifficultyColor(template.exercise.difficulty)}>
                          {template.exercise.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {template.exercise.primaryMuscle.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExercise(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={template.sets}
                        onChange={(e) => updateExerciseTemplate(index, 'sets', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Reps</Label>
                      <Input
                        value={template.targetReps}
                        onChange={(e) => updateExerciseTemplate(index, 'targetReps', e.target.value)}
                        placeholder="e.g., 8-12 or 10,10,8"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rest Period (seconds)</Label>
                      <Input
                        type="number"
                        min="30"
                        max="300"
                        value={template.restPeriod}
                        onChange={(e) => updateExerciseTemplate(index, 'restPeriod', parseInt(e.target.value) || 90)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={template.notes}
                      onChange={(e) => updateExerciseTemplate(index, 'notes', e.target.value)}
                      placeholder="Any specific instructions or modifications..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {exerciseTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No exercises selected. Add exercises from the Exercise Library first.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createWorkoutSessionMutation.isPending || exerciseTemplates.length === 0}
          >
            {createWorkoutSessionMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}