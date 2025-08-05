import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Search, 
  Target, 
  Plus,
  Check,
  Dumbbell,
  Timer,
  Zap,
  Minus,
  ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface Exercise {
  id: number;
  name: string;
  category: string;
  primaryMuscle: string;
  equipment?: string;
  muscleGroups?: string[];
}

interface SelectedExercise extends Exercise {
  sets?: number;
  targetReps?: string;
  restPeriod?: number;
  specialMethod?: string | null;
  specialConfig?: any;
}

interface ExerciseSelectionProps {
  targetMuscleGroups?: string[];
  onExercisesSelected?: (exercises: Exercise[]) => void;
}

export default function ExerciseSelection() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/exercise-selection/:source?');
  
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pairedExerciseSearchOpen, setPairedExerciseSearchOpen] = useState<number | null>(null);

  // Parse URL parameters for context - use window.location.search for query params
  const searchParams = new URLSearchParams(window.location.search);
  const rawReturnParam = searchParams.get('return');
  const returnPath = rawReturnParam ? decodeURIComponent(rawReturnParam) : '/training';
  const targetMuscles = searchParams.get('target')?.split(',') || [];
  
  console.log('DEBUG - Exercise Selection URL parsing:');
  console.log('  Wouter location:', location);
  console.log('  window.location.search:', window.location.search);
  console.log('  Search params toString:', searchParams.toString());
  console.log('  Raw return param:', rawReturnParam);
  console.log('  Decoded return path:', returnPath);

  const categories = ['all', 'push', 'pull', 'legs', 'cardio'];

  // Fetch exercises with error-safe handling to prevent page reload
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/training/exercises', {
          credentials: 'include'
        });
        
        // If not authenticated, return empty array instead of throwing
        if (response.status === 401 || response.status === 403) {
          console.log('Exercise fetch: Authentication required, returning empty array');
          return [];
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.warn('Exercise fetch error (gracefully handled):', error);
        return []; // Return empty array on any error to prevent page reload
      }
    },
    retry: false, // Disable retry to prevent infinite auth loops
    refetchOnWindowFocus: false // Prevent refetch that could trigger auth issues
  });

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter((exercise: Exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesTarget = targetMuscles.length === 0 || 
                         targetMuscles.some(muscle => 
                           exercise.muscleGroups?.some(mg => mg.toLowerCase().includes(muscle.toLowerCase()))
                         );
    
    return matchesSearch && matchesCategory && matchesTarget;
  });

  const addExercise = (exercise: Exercise) => {
    if (!selectedExercises.some(ex => ex.id === exercise.id)) {
      const newExercise: SelectedExercise = {
        ...exercise,
        sets: 3,
        targetReps: '8-12',
        restPeriod: 60,
        specialMethod: null
      };
      setSelectedExercises([...selectedExercises, newExercise]);
    }
  };

  const removeExercise = (exerciseId: number) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId: number, field: string, value: any) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Add paired exercise for superset
  const addPairedExercise = (originalExerciseId: number, pairedExerciseId: number) => {
    const originalExercise = selectedExercises.find(ex => ex.id === originalExerciseId);
    const pairedExerciseData = exercises.find((ex: Exercise) => ex.id === pairedExerciseId);
    
    if (!originalExercise || !pairedExerciseData) return;
    
    // Check if paired exercise is already selected
    if (selectedExercises.some(ex => ex.id === pairedExerciseId)) return;
    
    // Create paired exercise with same sets as original
    const pairedExercise: SelectedExercise = {
      ...pairedExerciseData,
      sets: originalExercise.sets || 3,
      targetReps: originalExercise.targetReps || '8-12',
      restPeriod: originalExercise.restPeriod || 60,
      specialMethod: 'superset',
      specialConfig: {
        pairedExerciseId: originalExerciseId,
        restSeconds: originalExercise.specialConfig?.restSeconds || 60
      }
    };
    
    // Update original exercise to reference paired exercise
    updateExercise(originalExerciseId, 'specialConfig', {
      ...originalExercise.specialConfig,
      pairedExerciseId: pairedExerciseId,
      restSeconds: originalExercise.specialConfig?.restSeconds || 60
    });
    
    // Add paired exercise
    setSelectedExercises([...selectedExercises, pairedExercise]);
  };

  // Sync sets between superset pair
  const syncSupersetSets = (exerciseId: number, newSets: number) => {
    const exercise = selectedExercises.find(ex => ex.id === exerciseId);
    if (!exercise || exercise.specialMethod !== 'superset') return;
    
    const pairedId = exercise.specialConfig?.pairedExerciseId;
    if (pairedId) {
      // Update both exercises
      setSelectedExercises(selectedExercises.map(ex => {
        if (ex.id === exerciseId || ex.id === pairedId) {
          return { ...ex, sets: newSets };
        }
        return ex;
      }));
    } else {
      // Just update this exercise
      updateExercise(exerciseId, 'sets', newSets);
    }
  };

  // Remove superset pair
  const removeSupersetPair = (exerciseId: number) => {
    const exercise = selectedExercises.find(ex => ex.id === exerciseId);
    if (!exercise || exercise.specialMethod !== 'superset') {
      removeExercise(exerciseId);
      return;
    }
    
    const pairedId = exercise.specialConfig?.pairedExerciseId;
    if (pairedId) {
      // Remove both exercises from superset
      setSelectedExercises(selectedExercises.filter(ex => 
        ex.id !== exerciseId && ex.id !== pairedId
      ));
    } else {
      // Just remove this exercise
      removeExercise(exerciseId);
    }
  };

  const handleSaveSelection = () => {
    // CRITICAL: Store ALL exercise data including special training method configurations
    console.log('SAVE DEBUG - Storing exercises with special configs:', selectedExercises.map(ex => ({
      name: ex.name,
      specialMethod: ex.specialMethod,
      specialConfig: ex.specialConfig
    })));
    
    // Store selected exercises in sessionStorage for the calling component
    sessionStorage.setItem('selectedExercises', JSON.stringify(selectedExercises));
    
    // Navigate back to the source page
    console.log('Navigating back to:', returnPath);
    console.log('Current location before navigation:', location);
    
    // Use setTimeout to ensure proper navigation
    setTimeout(() => {
      console.log('Executing navigation to:', returnPath);
      setLocation(returnPath);
      
      // Fallback: use window.history if setLocation fails
      setTimeout(() => {
        if (window.location.pathname !== returnPath) {
          console.log('setLocation failed, using window.history.pushState');
          window.history.pushState({}, '', returnPath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }, 100);
    }, 50);
  };

  const handleCancel = () => {
    // Clear any stored exercises since we're canceling
    sessionStorage.removeItem('selectedExercises');
    console.log('Canceling and navigating back to:', returnPath);
    
    // Use setTimeout to ensure proper navigation
    setTimeout(() => {
      console.log('Executing cancel navigation to:', returnPath);
      setLocation(returnPath);
      
      // Fallback: use window.history if setLocation fails
      setTimeout(() => {
        if (window.location.pathname !== returnPath) {
          console.log('Cancel setLocation failed, using window.history.pushState');
          window.history.pushState({}, '', returnPath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }, 100);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost" 
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedExercises.length} selected
            </Badge>
            <Button onClick={handleSaveSelection} disabled={selectedExercises.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Save Selection
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exercise Library */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Exercise Library</h2>
              
              {/* Search and Filter */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Target Muscle Groups Filter */}
                {targetMuscles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Targeting:</span>
                    <div className="flex flex-wrap gap-1">
                      {targetMuscles.map(muscle => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Exercise List */}
              <ScrollArea className="h-[70vh]">
                <div className="space-y-3 pr-4">
                  {isLoading ? (
                    <div className="text-center py-8">Loading exercises...</div>
                  ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No exercises found
                    </div>
                  ) : (
                    filteredExercises.map((exercise: Exercise) => (
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
          </div>

          {/* Selected Exercises Configuration */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Selected Exercises</h2>
              
              <ScrollArea className="h-[70vh]">
                <div className="space-y-4 pr-4">
                  {selectedExercises.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No exercises selected</p>
                      <p className="text-sm">Select exercises from the library to configure them</p>
                    </Card>
                  ) : (
                    selectedExercises.map((exercise: SelectedExercise) => (
                      <Card key={exercise.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-sm">{exercise.name}</h4>
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
                              onClick={() => {
                                if (exercise.specialMethod === 'superset') {
                                  removeSupersetPair(exercise.id);
                                } else {
                                  removeExercise(exercise.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-sm font-medium">Sets</label>
                                <Input
                                  type="number"
                                  value={exercise.sets || 1}
                                  onChange={(e) => {
                                    const newSets = parseInt(e.target.value) || 1;
                                    if (exercise.specialMethod === 'superset') {
                                      syncSupersetSets(exercise.id, newSets);
                                    } else {
                                      updateExercise(exercise.id, 'sets', newSets);
                                    }
                                  }}
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

                            {/* Training Method Selection */}
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
                              <div className="bg-purple-500/10 border border-purple-500/20 p-3 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-purple-400 font-medium">
                                  <Plus className="h-3 w-3" />
                                  Superset Configuration
                                </div>
                                
                                {!exercise.specialConfig?.pairedExerciseId ? (
                                  <div className="space-y-2">
                                    <label className="text-xs text-purple-300">Select Paired Exercise</label>
                                    <Popover 
                                      open={pairedExerciseSearchOpen === exercise.id} 
                                      onOpenChange={(open) => setPairedExerciseSearchOpen(open ? exercise.id : null)}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={pairedExerciseSearchOpen === exercise.id}
                                          className="w-full justify-between h-8 text-xs"
                                        >
                                          Select paired exercise...
                                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                          <CommandInput placeholder="Search exercises..." className="h-8 text-xs" />
                                          <CommandEmpty>No exercise found.</CommandEmpty>
                                          <CommandGroup className="max-h-48 overflow-auto">
                                            {exercises?.filter((ex: Exercise) => 
                                              ex.id !== exercise.id && 
                                              !selectedExercises.some(selected => selected.id === ex.id)
                                            ).map((availableExercise: Exercise) => (
                                              <CommandItem
                                                key={availableExercise.id}
                                                value={availableExercise.name}
                                                onSelect={() => {
                                                  addPairedExercise(exercise.id, availableExercise.id);
                                                  setPairedExerciseSearchOpen(null);
                                                }}
                                                className="cursor-pointer"
                                              >
                                                <div className="flex flex-col w-full">
                                                  <span className="font-medium text-xs">{availableExercise.name}</span>
                                                  <div className="flex gap-1 mt-1">
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                      {availableExercise.category}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                                      {availableExercise.primaryMuscle}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs text-purple-300">Paired Exercise</label>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateExercise(exercise.id, 'specialConfig', {
                                            ...exercise.specialConfig,
                                            pairedExerciseId: undefined
                                          });
                                        }}
                                        className="h-6 px-2 text-xs text-purple-300 hover:text-purple-400"
                                      >
                                        Change
                                      </Button>
                                    </div>
                                    <div className="p-2 bg-purple-500/5 border border-purple-500/20 rounded">
                                      <div className="text-xs text-purple-200 font-medium">
                                        {exercises?.find((ex: Exercise) => ex.id === exercise.specialConfig?.pairedExerciseId)?.name}
                                      </div>
                                      <div className="text-xs text-purple-300 mt-1">
                                        Sets are synchronized between paired exercises
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <label className="text-xs text-purple-300">Rest Between Sets (seconds)</label>
                                      <Input
                                        type="number"
                                        min="30"
                                        max="180"
                                        value={exercise.specialConfig?.restSeconds || 60}
                                        onChange={(e) => {
                                          const newRestSeconds = parseInt(e.target.value) || 60;
                                          updateExercise(exercise.id, 'specialConfig', {
                                            ...exercise.specialConfig,
                                            restSeconds: newRestSeconds
                                          });
                                          // Also update the paired exercise
                                          const pairedId = exercise.specialConfig?.pairedExerciseId;
                                          if (pairedId) {
                                            updateExercise(pairedId, 'specialConfig', {
                                              ...selectedExercises.find(ex => ex.id === pairedId)?.specialConfig,
                                              restSeconds: newRestSeconds
                                            });
                                          }
                                        }}
                                        className="w-32 h-8 text-xs bg-background border border-border/50"
                                      />
                                    </div>
                                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}