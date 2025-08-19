import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, X } from "lucide-react";
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
  isBodyWeight?: boolean;
}

interface ExerciseFormData {
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
  instructions: string;
  isBodyWeight: boolean;
}

const CATEGORIES = ["push", "pull", "legs", "core", "cardio"];
const MUSCLE_GROUPS = [
  "chest", "front_delts", "side_delts", "rear_delts", "triceps",
  "lats", "rhomboids", "biceps", "forearms",
  "quads", "hamstrings", "glutes", "calves",
  "core", "full_body"
];
const EQUIPMENT_OPTIONS = [
  "barbell", "dumbbells", "cable_machine", "machines", "bodyweight",
  "pull_up_bar", "dip_station", "leg_press_machine", "leg_extension_machine", "leg_curl_machine"
];
const MOVEMENT_PATTERNS = ["compound", "isolation", "unilateral", "bilateral", "isometric", "rotation"];
const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

interface ExerciseFormProps {
  exercise?: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ExerciseForm({ exercise, isOpen, onClose, onSuccess }: ExerciseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!exercise;

  const [formData, setFormData] = useState<ExerciseFormData>({
    name: exercise?.name || "",
    category: exercise?.category || "",
    muscleGroups: exercise?.muscleGroups || [],
    primaryMuscle: exercise?.primaryMuscle || "",
    equipment: exercise?.equipment || "",
    movementPattern: exercise?.movementPattern || "",
    difficulty: exercise?.difficulty || "intermediate",
    instructions: exercise?.instructions || "",
    isBodyWeight: exercise?.isBodyWeight || false,
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      const exerciseData = {
        ...data,
        translations: { en: data.name }
      };
      return apiRequest("POST", "/api/exercises", exerciseData);
    },
    onSuccess: () => {
      toast({
        title: "Exercise Created",
        description: "New exercise has been added to the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/exercises"] });
      onSuccess();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create exercise.",
        variant: "destructive",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      return apiRequest("PUT", `/api/exercises/${exercise!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Exercise Updated",
        description: "Exercise has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/exercises"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update exercise.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      muscleGroups: [],
      primaryMuscle: "",
      equipment: "",
      movementPattern: "",
      difficulty: "intermediate",
      instructions: "",
      isBodyWeight: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.primaryMuscle || formData.muscleGroups.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      updateExerciseMutation.mutate(formData);
    } else {
      createExerciseMutation.mutate(formData);
    }
  };

  const addMuscleGroup = (muscle: string) => {
    if (!formData.muscleGroups.includes(muscle)) {
      setFormData(prev => ({
        ...prev,
        muscleGroups: [...prev.muscleGroups, muscle]
      }));
    }
  };

  const removeMuscleGroup = (muscle: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.filter(m => m !== muscle)
    }));
  };

  const isPending = createExerciseMutation.isPending || updateExerciseMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-[60] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-w-2xl max-h-[90vh] overflow-y-auto pl-[5px] pr-[5px] pt-[10px] pb-[10px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Exercise" : "Create New Exercise"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update exercise details" : "Add a new exercise to the library with Evidence-based methodology methodology"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bench Press"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryMuscle">Primary Muscle *</Label>
              <Select value={formData.primaryMuscle} onValueChange={(value) => setFormData(prev => ({ ...prev, primaryMuscle: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary muscle" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map(muscle => (
                    <SelectItem key={muscle} value={muscle} className="capitalize">
                      {muscle.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Select value={formData.equipment} onValueChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_OPTIONS.map(equipment => (
                    <SelectItem key={equipment} value={equipment} className="capitalize">
                      {equipment.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movementPattern">Movement Pattern</Label>
              <Select value={formData.movementPattern} onValueChange={(value) => setFormData(prev => ({ ...prev, movementPattern: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select movement pattern" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_PATTERNS.map(pattern => (
                    <SelectItem key={pattern} value={pattern} className="capitalize">
                      {pattern}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level} className="capitalize">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isBodyWeight"
                  checked={formData.isBodyWeight}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBodyWeight: checked }))}
                />
                <Label htmlFor="isBodyWeight" className="text-sm font-medium">
                  Body Weight Exercise
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Check this if the exercise uses only body weight (no external weight required)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Muscle Groups *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.muscleGroups.map(muscle => (
                <Badge key={muscle} variant="secondary" className="flex items-center gap-1">
                  {muscle.replace('_', ' ')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeMuscleGroup(muscle)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={addMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Add muscle groups" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.filter(muscle => !formData.muscleGroups.includes(muscle)).map(muscle => (
                  <SelectItem key={muscle} value={muscle} className="capitalize">
                    {muscle.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Detailed exercise instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : (isEditing ? "Update Exercise" : "Create Exercise")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ExerciseManagementProps {
  exercise: Exercise;
}

export function ExerciseManagement({ exercise }: ExerciseManagementProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteExerciseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/exercises/${exercise.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Exercise Deleted",
        description: "Exercise has been removed from the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/exercises"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete exercise.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsEditOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exercise.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteExerciseMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExerciseForm
        exercise={exercise}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => setIsEditOpen(false)}
      />
    </div>
  );
}

interface CreateExerciseButtonProps {
  onSuccess?: () => void;
}

export function CreateExerciseButton({ onSuccess }: CreateExerciseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Exercise
      </Button>

      <ExerciseForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          onSuccess?.();
        }}
      />
    </>
  );
}