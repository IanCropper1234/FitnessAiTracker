import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, Search, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}

interface WorkoutExercise {
  id: number;
  exerciseId: number;
  orderIndex: number;
  sets: number;
  targetReps: string;
  restPeriod: number;
  exercise: Exercise;
}

interface DraggableExerciseListProps {
  exercises: WorkoutExercise[];
  sessionId: string;
  currentExerciseIndex: number;
  onExerciseSelect: (index: number) => void;
  onExercisesReorder?: (newOrder: WorkoutExercise[]) => void;
  onExerciseAdd?: (exerciseId: number) => void;
  onExerciseDelete?: (exerciseId: number) => void;
}

export const DraggableExerciseList: React.FC<DraggableExerciseListProps> = ({
  exercises,
  sessionId,
  currentExerciseIndex,
  onExerciseSelect,
  onExercisesReorder,
  onExerciseAdd,
  onExerciseDelete,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available exercises for adding
  const { data: availableExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/training/exercises"],
  });

  // Add exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      return apiRequest("POST", `/api/training/sessions/${sessionId}/exercises`, {
        exerciseId,
        sets: 3,
        targetReps: "8-12",
        restPeriod: 180,
        insertPosition: exercises.length // Add at the end
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/session", sessionId] });
      toast({
        title: "Exercise Added",
        description: "Exercise has been added to your workout.",
      });
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add exercise: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete exercise mutation
  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      return apiRequest("DELETE", `/api/training/sessions/${sessionId}/exercises/${exerciseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/session", sessionId] });
      toast({
        title: "Exercise Removed",
        description: "Exercise has been removed from your workout.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove exercise: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reorder exercises mutation
  const reorderExercisesMutation = useMutation({
    mutationFn: async (newOrder: { exerciseId: number; orderIndex: number }[]) => {
      return apiRequest("PUT", `/api/training/sessions/${sessionId}/exercises/reorder`, {
        exercises: newOrder
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/session", sessionId] });
      toast({
        title: "Exercises Reordered",
        description: "Exercise order has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reorder exercises: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newExercises = [...exercises];
    const [draggedExercise] = newExercises.splice(draggedIndex, 1);
    newExercises.splice(dropIndex, 0, draggedExercise);

    // Update order indices
    const reorderedExercises = newExercises.map((exercise, index) => ({
      ...exercise,
      orderIndex: index
    }));

    // Call parent callback
    onExercisesReorder?.(reorderedExercises);

    // Update server
    const orderUpdate = reorderedExercises.map(exercise => ({
      exerciseId: exercise.exerciseId,
      orderIndex: exercise.orderIndex
    }));
    
    reorderExercisesMutation.mutate(orderUpdate);
    setDraggedIndex(null);
  };

  const handleAddExercise = (exerciseId: number) => {
    addExerciseMutation.mutate(exerciseId);
    onExerciseAdd?.(exerciseId);
  };

  const handleDeleteExercise = (exerciseId: number) => {
    deleteExerciseMutation.mutate(exerciseId);
    onExerciseDelete?.(exerciseId);
  };

  const filteredAvailableExercises = availableExercises.filter(exercise => {
    const matchesName = exercise.name.toLowerCase().includes(exerciseFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exercise.category === categoryFilter;
    const notAlreadyAdded = !exercises.some(we => we.exerciseId === exercise.id);
    return matchesName && matchesCategory && notAlreadyAdded;
  });

  const categories = Array.from(new Set(availableExercises.map(e => e.category)));

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Exercises ({exercises.length})</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Exercise to Workout</DialogTitle>
            </DialogHeader>
            
            {/* Filters */}
            <div className="flex gap-4 p-4 border-b">
              <div className="flex-1">
                <Input
                  placeholder="Search exercises..."
                  value={exerciseFilter}
                  onChange={(e) => setExerciseFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailableExercises.map(exercise => (
                <Card key={exercise.id} className="hover:bg-accent/50 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exercise.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {exercise.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground/70">
                          {exercise.muscleGroups.join(', ')} • {exercise.equipment}
                        </div>
                        <div className="text-xs text-foreground/60 line-clamp-2">
                          {exercise.instructions}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddExercise(exercise.id)}
                        disabled={addExerciseMutation.isPending}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredAvailableExercises.length === 0 && (
                <div className="text-center py-8 text-foreground/60">
                  No exercises found matching your criteria.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Draggable Exercise List */}
      <div className="space-y-2">
        {exercises.map((exercise, index) => (
          <Card
            key={exercise.id}
            className={`transition-all duration-200 cursor-pointer ${
              index === currentExerciseIndex
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-accent/50'
            } ${draggedIndex === index ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onExerciseSelect(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical className="h-10 w-10" />
                </div>

                {/* Exercise Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exercise.exercise.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {exercise.sets} sets
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exercise.targetReps} reps
                    </Badge>
                  </div>
                  <div className="text-sm text-foreground/60">
                    {exercise.exercise.muscleGroups.join(', ')} • Rest: {Math.floor(exercise.restPeriod / 60)}min
                  </div>
                </div>

                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove "{exercise.exercise.name}" from this workout?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteExercise(exercise.exerciseId)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              No exercises in this workout. Click "Add Exercise" to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};