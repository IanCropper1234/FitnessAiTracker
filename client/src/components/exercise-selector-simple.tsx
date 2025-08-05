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
  onExercisesChange: (exercises: SelectedExercise[] | ((prev: SelectedExercise[]) => SelectedExercise[])) => void;
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
          console.log('Found stored exercises:', exercises);
          
          // Validate that exercises is an array
          if (Array.isArray(exercises) && exercises.length > 0) {
            // Convert exercises to SelectedExercise format - ENSURE COMPLETE DATA TRANSFER
            const formattedExercises: SelectedExercise[] = exercises.map((ex: any) => {
              console.log('DEBUG - Processing exercise from storage:', ex.name, 'Special Method:', ex.specialMethod, 'Special Config:', ex.specialConfig);
              
              return {
                id: ex.id,
                name: ex.name,
                category: ex.category,
                muscleGroups: ex.muscleGroups,
                primaryMuscle: ex.primaryMuscle,
                equipment: ex.equipment,
                difficulty: ex.difficulty,
                sets: ex.sets || 3,
                targetReps: ex.targetReps || '8-12',
                restPeriod: ex.restPeriod || 60,
                // CRITICAL: Preserve special training method data 100%
                specialMethod: ex.specialMethod || null,
                specialConfig: ex.specialConfig ? { ...ex.specialConfig } : null
              };
            });
            
            // Add exercises to current selection
            onExercisesChange((prev: SelectedExercise[]) => [...prev, ...formattedExercises]);
          } else {
            console.log('Invalid exercises format, skipping');
          }
          
          // Clear storage after processing
          sessionStorage.removeItem('selectedExercises');
          console.log('Added exercises and cleared storage');
        } catch (error) {
          console.error('Error parsing stored exercises:', error);
          sessionStorage.removeItem('selectedExercises');
        }
      }
    };

    // Check immediately on mount
    handleStorageChange();
    
    // Set up a one-time check after navigation
    const timeoutId = setTimeout(handleStorageChange, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Remove dependencies to prevent infinite loop

  const removeExercise = (exerciseId: number) => {
    onExercisesChange((prev: SelectedExercise[]) => prev.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId: number, field: string, value: any) => {
    onExercisesChange((prev: SelectedExercise[]) => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  const handleNavigateToSelection = () => {
    const targetParams = targetMuscleGroups?.length ? `&target=${targetMuscleGroups.join(',')}` : '';
    const returnUrl = encodeURIComponent(location);
    console.log('DEBUG - ExerciseSelector handleNavigateToSelection:');
    console.log('  Current location:', location);
    console.log('  Return URL encoded:', returnUrl);
    console.log('  Full navigation URL:', `/exercise-selection/template?return=${returnUrl}${targetParams}`);
    setLocation(`/exercise-selection/template?return=${returnUrl}${targetParams}`);
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
                            <SelectItem value="myorepMatch">
                              <div className="flex items-center gap-2">
                                <Target className="h-3 w-3" />
                                Myorep Match
                              </div>
                            </SelectItem>
                            <SelectItem value="myorepNoMatch">
                              <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3" />
                                Myorep No Match
                              </div>
                            </SelectItem>
                            <SelectItem value="dropSet">
                              <div className="flex items-center gap-2">
                                <Minus className="h-3 w-3" />
                                Drop Set
                              </div>
                            </SelectItem>
                            <SelectItem value="giantSet">
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

                      {/* Special Method Configuration - Matching create-workout-session exactly */}
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
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-red-300">Number of Drop Sets</label>
                              <Select
                                value={(exercise.specialConfig?.dropSets || 3).toString()}
                                onValueChange={(value) => {
                                  const dropSets = parseInt(value);
                                  const currentReductions = exercise.specialConfig?.weightReductions || [15, 15, 15];
                                  const currentReps = exercise.specialConfig?.dropSetReps || [8, 8, 8];
                                  const newReductions = Array(dropSets).fill(0).map((_, i) => currentReductions[i] || 15);
                                  const newReps = Array(dropSets).fill(0).map((_, i) => currentReps[i] || 8);
                                  updateExercise(exercise.id, 'specialConfig', {
                                    ...exercise.specialConfig,
                                    dropSets,
                                    weightReductions: newReductions,
                                    dropSetReps: newReps
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2">2 Drops</SelectItem>
                                  <SelectItem value="3">3 Drops</SelectItem>
                                  <SelectItem value="4">4 Drops</SelectItem>
                                  <SelectItem value="5">5 Drops</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-red-300">Weight Reductions (%)</label>
                              <div className="flex gap-2 flex-wrap">
                                {Array(exercise.specialConfig?.dropSets || 3).fill(0).map((_, dropIndex) => (
                                  <Input
                                    key={dropIndex}
                                    type="number"
                                    min="5"
                                    max="30"
                                    value={(exercise.specialConfig?.weightReductions || [])[dropIndex] || 15}
                                    onChange={(e) => {
                                      const newReductions = [...(exercise.specialConfig?.weightReductions || Array(exercise.specialConfig?.dropSets || 3).fill(15))];
                                      newReductions[dropIndex] = parseInt(e.target.value) || 15;
                                      updateExercise(exercise.id, 'specialConfig', {
                                        ...exercise.specialConfig,
                                        weightReductions: newReductions
                                      });
                                    }}
                                    className="w-20 h-8 text-xs bg-background border border-border/50"
                                    placeholder={`Drop ${dropIndex + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-red-300">Target Reps per Drop Set</label>
                              <div className="flex gap-2 flex-wrap">
                                {Array(exercise.specialConfig?.dropSets || 3).fill(0).map((_, dropIndex) => (
                                  <Input
                                    key={dropIndex}
                                    type="number"
                                    min="5"
                                    max="20"
                                    value={(exercise.specialConfig?.dropSetReps || [])[dropIndex] || 8}
                                    onChange={(e) => {
                                      const newReps = [...(exercise.specialConfig?.dropSetReps || Array(exercise.specialConfig?.dropSets || 3).fill(8))];
                                      newReps[dropIndex] = parseInt(e.target.value) || 8;
                                      updateExercise(exercise.id, 'specialConfig', {
                                        ...exercise.specialConfig,
                                        dropSetReps: newReps
                                      });
                                    }}
                                    className="w-20 h-8 text-xs bg-background border border-border/50"
                                    placeholder={`Reps ${dropIndex + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-red-300">Rest Between Drops (seconds)</label>
                              <Input
                                type="number"
                                min="5"
                                max="15"
                                value={exercise.specialConfig?.dropRestSeconds || 10}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  dropRestSeconds: parseInt(e.target.value) || 10
                                })}
                                className="w-32 h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'giantSet' && (
                        <div className="bg-orange-500/10 border border-orange-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-orange-400 font-medium">
                            <Timer className="h-3 w-3" />
                            Giant Set Configuration
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-orange-300">Total Target Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.totalTargetReps ?? 40}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  totalTargetReps: parseInt(e.target.value) || 40
                                })}
                                min="30"
                                max="60"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-orange-300">Mini Set Reps</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.miniSetReps ?? 8}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  miniSetReps: parseInt(e.target.value) || 8
                                })}
                                min="5"
                                max="15"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-orange-300">Rest (seconds)</label>
                              <Input
                                type="number"
                                value={exercise.specialConfig?.restSeconds ?? 15}
                                onChange={(e) => updateExercise(exercise.id, 'specialConfig', {
                                  ...exercise.specialConfig,
                                  restSeconds: parseInt(e.target.value) || 15
                                })}
                                min="5"
                                max="15"
                                className="h-8 text-xs bg-background border border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {exercise.specialMethod === 'superset' && (
                        <div className="bg-purple-500/10 border border-purple-500/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-purple-400 font-medium">
                            <Plus className="h-3 w-3" />
                            Superset Configuration
                          </div>
                          <div className="text-xs text-purple-300">
                            <p>Use the full Exercise Selection page for complete superset configuration.</p>
                            <p className="mt-1">Paired exercises and set synchronization available there.</p>
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