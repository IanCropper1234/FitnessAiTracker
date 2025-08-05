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
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Parse URL parameters for context
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const returnPath = searchParams.get('return') || '/training';
  const targetMuscles = searchParams.get('target')?.split(',') || [];

  const categories = ['all', 'push', 'pull', 'legs', 'cardio'];

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      const response = await fetch('/api/training/exercises', {
        credentials: 'include'
      });
      return response.json();
    }
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

  const handleSaveSelection = () => {
    // Store selected exercises in sessionStorage for the calling component
    sessionStorage.setItem('selectedExercises', JSON.stringify(selectedExercises));
    
    // Navigate back to the source page
    setLocation(returnPath);
  };

  const handleCancel = () => {
    setLocation(returnPath);
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
            <div>
              <h1 className="text-2xl font-bold">Select Exercises</h1>
              <p className="text-muted-foreground">Choose exercises from the library to add to your workout plan</p>
            </div>
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
                              onClick={() => removeExercise(exercise.id)}
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

                            {/* Special Method Configuration */}
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
        </div>
      </div>
    </div>
  );
}