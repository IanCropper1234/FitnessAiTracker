import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Dumbbell, Target } from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[] | null;
  primaryMuscle: string;
  equipment: string | null;
  difficulty: string | null;
}

interface SelectedExercise extends Exercise {
  sets: number;
  targetReps: string;
  restPeriod: number;
}

interface ExerciseSelectorProps {
  selectedExercises: SelectedExercise[];
  onExercisesChange: (exercises: SelectedExercise[]) => void;
  targetMuscleGroups?: string[];
}

export function ExerciseSelector({ selectedExercises, onExercisesChange, targetMuscleGroups }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  const categories = ["all", "push", "pull", "legs", "cardio"];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (exercise.muscleGroups?.some(muscle => 
                           muscle.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    
    const matchesTargetMuscles = !targetMuscleGroups?.length || 
                                targetMuscleGroups.some(target => 
                                  exercise.muscleGroups?.includes(target) || 
                                  exercise.primaryMuscle === target
                                );
    
    return matchesSearch && matchesCategory && matchesTargetMuscles;
  });

  const addExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      ...exercise,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 120, // 2 minutes
    };
    
    onExercisesChange([...selectedExercises, newExercise]);
    setIsDialogOpen(false);
  };

  const removeExercise = (exerciseId: number) => {
    onExercisesChange(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId: number, field: keyof SelectedExercise, value: any) => {
    onExercisesChange(
      selectedExercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Exercises</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Select Exercises</DialogTitle>
              <DialogDescription>
                Choose exercises from the library to add to your workout plan
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Muscle Groups Filter */}
              {targetMuscleGroups?.length && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Targeting:</span>
                  <div className="flex flex-wrap gap-1">
                    {targetMuscleGroups.map(muscle => (
                      <Badge key={muscle} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Exercise List */}
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8">Loading exercises...</div>
                  ) : filteredExercises.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No exercises found
                    </div>
                  ) : (
                    filteredExercises.map(exercise => (
                      <Card key={exercise.id} className="cursor-pointer hover:bg-accent">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{exercise.name}</CardTitle>
                            <Button
                              size="sm"
                              onClick={() => addExercise(exercise)}
                              disabled={selectedExercises.some(ex => ex.id === exercise.id)}
                            >
                              {selectedExercises.some(ex => ex.id === exercise.id) ? "Added" : "Add"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {exercise.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {exercise.primaryMuscle}
                              </Badge>
                            </div>
                            {exercise.equipment && (
                              <p className="text-xs text-muted-foreground">
                                Equipment: {exercise.equipment}
                              </p>
                            )}
                            {exercise.muscleGroups?.length && (
                              <div className="flex flex-wrap gap-1">
                                {exercise.muscleGroups.slice(0, 3).map(muscle => (
                                  <Badge key={muscle} variant="secondary" className="text-xs">
                                    {muscle}
                                  </Badge>
                                ))}
                                {exercise.muscleGroups.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{exercise.muscleGroups.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Exercises */}
      <div className="space-y-3">
        {selectedExercises.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No exercises selected</p>
            <p className="text-sm">Click "Add Exercise" to get started</p>
          </Card>
        ) : (
          selectedExercises.map(exercise => (
            <Card key={exercise.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.primaryMuscle}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExercise(exercise.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Sets</label>
                    <Input
                      type="number"
                      value={exercise.sets || 1}
                      onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Reps</label>
                    <Input
                      value={exercise.targetReps}
                      onChange={(e) => updateExercise(exercise.id, 'targetReps', e.target.value)}
                      placeholder="e.g., 8-12"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rest (sec)</label>
                    <Input
                      type="number"
                      value={exercise.restPeriod || 60}
                      onChange={(e) => updateExercise(exercise.id, 'restPeriod', parseInt(e.target.value) || 60)}
                      min="30"
                      max="600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}