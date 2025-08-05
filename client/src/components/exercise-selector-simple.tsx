import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Minus, Timer, Target, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        const exercises = JSON.parse(storedExercises);
        onExercisesChange([...selectedExercises, ...exercises]);
        sessionStorage.removeItem('selectedExercises');
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

  const handleNavigateToSelection = () => {
    const targetParams = targetMuscleGroups?.length ? `&target=${targetMuscleGroups.join(',')}` : '';
    setLocation(`/exercise-selection/template?return=${encodeURIComponent(location)}${targetParams}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleNavigateToSelection}
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>

        {/* Selected Exercises */}
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-2">
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
                        <h4 className="font-medium text-sm sm:text-base">{exercise.name}</h4>
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
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <label className="text-sm font-medium">Sets</label>
                          <Input
                            type="number"
                            value={exercise.sets || 1}
                            onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                            min="1"
                            max="10"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Target Reps</label>
                          <Input
                            value={exercise.targetReps}
                            onChange={(e) => updateExercise(exercise.id, 'targetReps', e.target.value)}
                            placeholder="e.g., 8-12"
                            className="h-9"
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
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Special Training Method Configuration */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Training Method</label>
                        <Select
                          value={exercise.specialMethod || "standard"}
                          onValueChange={(value) => updateExercise(exercise.id, 'specialMethod', value === "standard" ? null : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Standard Set" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Set</SelectItem>
                            <SelectItem value="myorep_match">
                              <div className="flex items-center gap-2">
                                <Target className="h-3 w-3" />
                                Myorep Match
                              </div>
                            </SelectItem>
                            <SelectItem value="myorep_no_match">
                              <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3" />
                                Myorep No Match
                              </div>
                            </SelectItem>
                            <SelectItem value="drop_set">
                              <div className="flex items-center gap-2">
                                <Minus className="h-3 w-3" />
                                Drop Set
                              </div>
                            </SelectItem>
                            <SelectItem value="giant_set">
                              <div className="flex items-center gap-2">
                                <Timer className="h-3 w-3" />
                                Giant Set (40+ reps)
                              </div>
                            </SelectItem>
                            <SelectItem value="superset">
                              <div className="flex items-center gap-2">
                                <Plus className="h-3 w-3" />
                                Superset
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Special Method Configuration Details */}
                      {exercise.specialMethod === 'myorep_match' && (
                        <div className="bg-green-500/10 border border-green-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                            <Target className="h-3 w-3" />
                            Myorep Match Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-green-300">Activation Set Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.activationReps ?? 12}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  activationReps: parseInt(e.target.value) || 12
                                })}
                                min="8"
                                max="20"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-green-300">Mini-Set Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.miniSetReps ?? 5}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  miniSetReps: parseInt(e.target.value) || 5
                                })}
                                min="3"
                                max="10"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'drop_set' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                            <Minus className="h-3 w-3" />
                            Drop Set Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-red-300">Weight Reduction (%)</label>
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}