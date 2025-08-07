import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Dumbbell, 
  Trash2, 
  Target, 
  Zap, 
  Minus, 
  Timer
} from "lucide-react";

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
  specialMethod?: string | null;
  specialConfig?: any;
}

interface ExerciseSelectorProps {
  selectedExercises: SelectedExercise[];
  onExercisesChange: (exercises: SelectedExercise[]) => void;
  targetMuscleGroups?: string[];
}

export function ExerciseSelector({ selectedExercises, onExercisesChange, targetMuscleGroups }: ExerciseSelectorProps) {
  const [location, setLocation] = useLocation();

  // Check for newly selected exercises from the standalone page
  useEffect(() => {
    const handleStorageChange = () => {
      const storedExercises = sessionStorage.getItem('selectedExercises');
      if (storedExercises) {
        try {
          const exercises = JSON.parse(storedExercises);
          // Ensure exercises are properly formatted as SelectedExercise
          const formattedExercises: SelectedExercise[] = exercises.map((ex: any) => ({
            ...ex,
            sets: ex.sets || 3,
            targetReps: ex.targetReps || '8-12',
            restPeriod: ex.restPeriod || 60,
            specialMethod: ex.specialMethod || null,
            specialConfig: ex.specialConfig || null
          }));
          onExercisesChange([...selectedExercises, ...formattedExercises]);
          sessionStorage.removeItem('selectedExercises');
        } catch (error) {
          console.error('Error parsing stored exercises:', error);
          sessionStorage.removeItem('selectedExercises');
        }
      }
    };

    // Check on mount and when returning to the page
    handleStorageChange();
    
    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, [selectedExercises, onExercisesChange]);

  const removeExercise = (exerciseId: number) => {
    onExercisesChange(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId: number, field: string, value: any) => {
    onExercisesChange(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Navigate to standalone exercise selection page (user preference)
  const openExerciseSelection = () => {
    const queryParams = new URLSearchParams({
      return: encodeURIComponent(location),
      ...(targetMuscleGroups?.length ? { target: targetMuscleGroups.join(',') } : {})
    });
    setLocation(`/exercise-selection?${queryParams.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Exercises</h3>
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={openExerciseSelection}
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>
      </div>

      {/* Selected Exercises List */}
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-3">
          {selectedExercises.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No exercises selected</p>
              <p className="text-sm">Add exercises to get started</p>
            </Card>
          ) : (
            selectedExercises.map((exercise: SelectedExercise) => (
              <Card key={exercise.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{exercise.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {exercise.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {exercise.primaryMuscle}
                          </Badge>
                          {exercise.equipment && (
                            <Badge variant="outline" className="text-xs opacity-70">
                              {exercise.equipment}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Exercise Configuration */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sets</label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Target Reps</label>
                        <Input
                          value={exercise.targetReps}
                          onChange={(e) => updateExercise(exercise.id, 'targetReps', e.target.value)}
                          placeholder="8-12"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Rest (seconds)</label>
                        <Input
                          type="number"
                          value={exercise.restPeriod}
                          onChange={(e) => updateExercise(exercise.id, 'restPeriod', parseInt(e.target.value) || 60)}
                          min="30"
                          max="300"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Special Training Methods */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Special Method</label>
                        <Select
                          value={exercise.specialMethod || 'none'}
                          onValueChange={(value) => {
                            updateExercise(exercise.id, 'specialMethod', value === 'none' ? null : value);
                            // Reset special config when method changes
                            if (value === 'none') {
                              updateExercise(exercise.id, 'specialConfig', null);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="myorepMatch">
                              <Target className="inline h-3 w-3 mr-1" />
                              Myorep Match
                            </SelectItem>
                            <SelectItem value="myorepNoMatch">
                              <Zap className="inline h-3 w-3 mr-1" />
                              Myorep No Match
                            </SelectItem>
                            <SelectItem value="dropSet">
                              <Minus className="inline h-3 w-3 mr-1" />
                              Drop Set
                            </SelectItem>
                            <SelectItem value="giant_set">
                              <Timer className="inline h-3 w-3 mr-1" />
                              Giant Set
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Special Method Configuration */}
                      {exercise.specialMethod === 'myorepMatch' && (
                        <div className="bg-green-500/10 border border-green-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                            <Target className="h-3 w-3" />
                            Myorep Match Configuration
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-green-300">Target Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.targetReps ?? 15}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  targetReps: parseInt(e.target.value) || 15
                                })}
                                min="10"
                                max="20"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-green-300">Mini Sets</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.miniSets ?? 3}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  miniSets: parseInt(e.target.value) || 3
                                })}
                                min="1"
                                max="5"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-green-300">Rest (seconds)</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.restSeconds ?? 20}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  restSeconds: parseInt(e.target.value) || 20
                                })}
                                min="15"
                                max="30"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'myorepNoMatch' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                            <Zap className="h-3 w-3" />
                            Myorep No Match Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-blue-300">Mini Sets</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.miniSets ?? 3}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  miniSets: parseInt(e.target.value) || 3
                                })}
                                min="1"
                                max="5"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-blue-300">Rest (seconds)</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.restSeconds ?? 20}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  restSeconds: parseInt(e.target.value) || 20
                                })}
                                min="15"
                                max="30"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'dropSet' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                            <Minus className="h-3 w-3" />
                            Drop Set Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-red-300">Weight Reduction %</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.weightReduction ?? 20}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  weightReduction: parseInt(e.target.value) || 20
                                })}
                                min="10"
                                max="50"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-red-300">Drop Set Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.dropSetReps ?? 8}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  dropSetReps: parseInt(e.target.value) || 8
                                })}
                                min="5"
                                max="15"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'giant_set' && (
                        <div className="bg-orange-500/10 border border-orange-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-orange-400 font-medium">
                            <Timer className="h-3 w-3" />
                            Giant Set Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-orange-300">Target Total Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.totalTargetReps ?? 40}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  totalTargetReps: parseInt(e.target.value) || 40,
                                  miniSetReps: exercise.specialConfig?.miniSetReps || 5,
                                  restSeconds: exercise.specialConfig?.restSeconds || 10
                                })}
                                min="40"
                                max="100"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-orange-300">Mini-Set Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.miniSetReps ?? 5}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  miniSetReps: parseInt(e.target.value) || 5
                                })}
                                min="3"
                                max="15"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Muscle Groups Display */}
                    {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                          <Badge key={muscle} variant="outline" className="text-xs opacity-70">
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.muscleGroups.length > 3 && (
                          <Badge variant="outline" className="text-xs opacity-70">
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
  );
}