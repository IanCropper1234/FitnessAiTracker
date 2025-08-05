import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Settings, Timer, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExerciseSelector } from '@/components/exercise-selector-simple';

interface Exercise {
  id: number;
  name: string;
  category: string;
  primaryMuscle: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  instructions: string;
}

interface TemplateExercise {
  id: number;
  exerciseId: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  difficulty: string;
  sets: number;
  targetReps: string;
  restPeriod: number;
  notes?: string;
  specialTrainingMethod?: string;
  specialMethodConfig?: any;
  orderIndex?: number;
  repsRange?: string;
}

interface TemplateWorkout {
  name: string;
  exercises: TemplateExercise[];
  estimatedDuration: number;
  focus: string[];
}

interface TemplateData {
  workouts: TemplateWorkout[];
}

// Auto-save functionality constants
const AUTO_SAVE_KEY = 'fitai_template_draft';
const AUTO_SAVE_INTERVAL = 300; // 300ms debounce for immediate save

// Helper functions for auto-save
const saveToLocalStorage = (data: any) => {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
      ...data,
      lastSaved: new Date().toISOString()
    }));
    console.log('🔄 Auto-saved template draft at:', new Date().toLocaleTimeString());
  } catch (error) {
    console.warn('Failed to save template draft to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Remove the lastSaved field before returning
      const { lastSaved, ...data } = parsed;
      return data;
    }
  } catch (error) {
    console.warn('Failed to load template draft from localStorage:', error);
  }
  return null;
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
  } catch (error) {
    console.warn('Failed to clear template draft from localStorage:', error);
  }
};

export default function CreateTrainingTemplate() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Removed step state - now single page interface
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const exerciseConfigRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Immediate auto-save function for field-level changes
  const triggerAutoSave = (newData: typeof formData) => {
    try {
      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set a new timeout for debounced auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          saveToLocalStorage(newData);
          console.log('🔄 Auto-saved template draft at:', new Date().toLocaleTimeString());
        } catch (error) {
          console.warn('Immediate auto-save failed:', error);
        }
      }, AUTO_SAVE_INTERVAL);
    } catch (error) {
      console.warn('Auto-save trigger failed:', error);
    }
  };

  // Force save function for critical moments (like before navigation)
  const forceSave = (data: typeof formData) => {
    try {
      saveToLocalStorage(data);
      console.log('🔐 Force-saved template draft at:', new Date().toLocaleTimeString());
    } catch (error) {
      console.warn('Force save failed:', error);
    }
  };
  
  // Initialize form data with auto-saved data if available
  const [formData, setFormData] = useState(() => {
    try {
      const savedData = loadFromLocalStorage();
      if (savedData) {
        return savedData;
      }
    } catch (error) {
      console.warn('Failed to load saved data on initialization:', error);
    }
    
    return {
      name: '',
      description: '',
      category: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
      daysPerWeek: 4,
      templateData: {
        workouts: Array.from({ length: 4 }, (_, i) => ({
          name: `Day ${i + 1}`,
          exercises: [],
          estimatedDuration: 45,
          focus: []
        }))
      } as TemplateData
    };
  });

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Show toast when auto-saved data is loaded on mount
  useEffect(() => {
    try {
      const savedData = loadFromLocalStorage();
      if (savedData && (savedData.name || savedData.description || savedData.templateData?.workouts?.some((w: TemplateWorkout) => w.exercises.length > 0))) {
        toast({
          title: "Draft Restored",
          description: "Your previous template draft has been automatically restored with all exercise configurations.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.warn('Error loading auto-saved data:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const currentWorkout = formData.templateData.workouts[currentWorkoutIndex] || {
    name: '',
    exercises: [],
    estimatedDuration: 45,
    focus: []
  };

  // Removed step sync logic - single page interface

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        const response = await apiRequest('POST', '/api/training/templates', data);
        return await response.json();
      } catch (error) {
        console.error('Template creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear auto-saved draft on successful creation
      clearLocalStorage();
      toast({
        title: "Success",
        description: "Training template created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
      setLocation('/training');
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create training template. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  });

  const updateWorkout = (index: number, workout: TemplateWorkout) => {
    console.log('updateWorkout called:', { index, workout, exerciseCount: workout.exercises.length });
    
    setFormData((prev: typeof formData) => {
      const updated = {
        ...prev,
        templateData: {
          ...prev.templateData,
          workouts: prev.templateData.workouts.map((w: TemplateWorkout, i: number) => i === index ? workout : w)
        }
      };
      console.log('updateWorkout - Updated formData:', updated);
      console.log('updateWorkout - New exercise counts:', updated.templateData.workouts.map((w: TemplateWorkout) => w.exercises.length));
      
      // Delayed auto-save to prevent data loss during rapid changes
      setTimeout(() => {
        triggerAutoSave(updated);
      }, 100);
      
      return updated;
    });
  };

  const addExerciseToCurrentWorkout = (exercise: Exercise) => {
    const newExercise: TemplateExercise = {
      id: exercise.id,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 120,
      notes: "",
      orderIndex: currentWorkout.exercises.length + 1, // Add orderIndex to ensure proper ordering
      repsRange: "8-12" // Add repsRange for template compatibility
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise]
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const removeExerciseFromCurrentWorkout = (exerciseId: number) => {
    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter((ex: TemplateExercise) => ex.exerciseId !== exerciseId)
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const updateExercise = (exerciseIndex: number, updates: Partial<TemplateExercise>) => {
    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex: TemplateExercise, i: number) => 
        i === exerciseIndex ? { ...ex, ...updates } : ex
      )
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
    
    // Auto-scroll to Exercise Configuration section when training method is changed
    if (updates.specialTrainingMethod) {
      setTimeout(() => {
        const exerciseCard = document.querySelector(`[data-exercise-index="${exerciseIndex}"]`);
        if (exerciseCard) {
          exerciseCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 150);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Missing Required Information",
        description: "Template name and description are required",
        variant: "destructive"
      });
      return;
    }

    if (formData.templateData.workouts.some((w: TemplateWorkout) => w.exercises.length === 0)) {
      toast({
        title: "Add Exercises",
        description: "Each training day needs at least one exercise",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const canComplete = formData.name.trim() && formData.description.trim() && formData.templateData.workouts.every((w: TemplateWorkout) => w.exercises.length > 0);
  
  // Clear draft function
  const clearDraft = () => {
    clearLocalStorage();
    setFormData({
      name: '',
      description: '',
      category: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
      daysPerWeek: 4,
      templateData: {
        workouts: Array.from({ length: 4 }, (_, i) => ({
          name: `Day ${i + 1}`,
          exercises: [],
          estimatedDuration: 45,
          focus: []
        }))
      } as TemplateData
    });
    setCurrentWorkoutIndex(0);
    toast({
      title: "Draft Cleared",
      description: "Template draft has been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/training')}
            className="flex items-center gap-2 h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Create Template</h1>
          <Button
            onClick={handleSubmit}
            disabled={!canComplete}
            size="sm"
            className="h-10"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-full">
        
        {/* Basic Information - iOS Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Template Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearDraft}
                className="text-xs h-8"
              >
                Clear Draft
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const updated = { ...formData, name: e.target.value };
                  setFormData(updated);
                  triggerAutoSave(updated);
                }}
                onBlur={(e) => {
                  const updated = { ...formData, name: e.target.value };
                  triggerAutoSave(updated);
                }}
                placeholder="e.g., My Custom Push/Pull Training"
                className="h-11 text-base"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Difficulty</Label>
                <Select value={formData.category} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => {
                  const updated = { ...formData, category: value };
                  setFormData(updated);
                  triggerAutoSave(updated);
                }}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="daysPerWeek" className="text-sm font-medium">Training Days</Label>
                <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => {
                  const days = parseInt(value);
                  const updated = { 
                    ...formData, 
                    daysPerWeek: days,
                    templateData: {
                      ...formData.templateData,
                      workouts: Array.from({ length: days }, (_, i) => ({
                        name: `Day ${i + 1}`,
                        exercises: [],
                        estimatedDuration: 45,
                        focus: []
                      }))
                    }
                  };
                  setFormData(updated);
                  triggerAutoSave(updated);
                  setCurrentWorkoutIndex(0);
                }}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="4">4 Days</SelectItem>
                    <SelectItem value="5">5 Days</SelectItem>
                    <SelectItem value="6">6 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const updated = { ...formData, description: e.target.value };
                  setFormData(updated);
                  triggerAutoSave(updated);
                }}
                onBlur={(e) => {
                  const updated = { ...formData, description: e.target.value };
                  triggerAutoSave(updated);
                }}
                placeholder="Describe your training template's features and goals..."
                rows={3}
                className="text-base resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Workout Configuration - iOS Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Configure Workouts</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWorkoutIndex(Math.max(0, currentWorkoutIndex - 1))}
                  disabled={currentWorkoutIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2 py-1 bg-muted rounded min-w-[50px] text-center">
                  {currentWorkoutIndex + 1}/{formData.templateData.workouts.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWorkoutIndex(Math.min(formData.templateData.workouts.length - 1, currentWorkoutIndex + 1))}
                  disabled={currentWorkoutIndex === formData.templateData.workouts.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Day Name */}
            <div>
              <Label htmlFor="workoutName" className="text-sm font-medium">Day Name</Label>
              <Input
                id="workoutName"
                value={currentWorkout.name}
                onChange={(e) => {
                  const updatedWorkout = { ...currentWorkout, name: e.target.value };
                  updateWorkout(currentWorkoutIndex, updatedWorkout);
                }}
                onBlur={(e) => {
                  const updatedWorkout = { ...currentWorkout, name: e.target.value };
                  updateWorkout(currentWorkoutIndex, updatedWorkout);
                }}
                className="h-11 text-base"
                placeholder="e.g., Chest & Triceps"
              />
            </div>

            {/* Exercise Selection - Compact */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Exercises ({currentWorkout.exercises.length})
                </Label>
              </div>
              
              <div className="space-y-3">
                <ExerciseSelector
                  selectedExercises={currentWorkout.exercises}
                  currentWorkoutIndex={currentWorkoutIndex}
                  onExercisesChange={(exercisesOrUpdater: any) => {
                    // Force save before any exercise changes to ensure no data loss
                    forceSave(formData);
                    
                    let exercises: any[];
                    
                    // Handle both direct array and function updater
                    if (typeof exercisesOrUpdater === 'function') {
                      exercises = exercisesOrUpdater(currentWorkout.exercises);
                    } else {
                      exercises = exercisesOrUpdater;
                    }
                    
                    console.log('Template - Processing exercises:', exercises);
                    
                    // Map to TemplateExercise format - PRESERVE SPECIAL TRAINING DATA 100%
                    const templateExercises = exercises.map(exercise => {
                      console.log('Template - Mapping exercise with special config:', exercise.name, {
                        specialMethod: exercise.specialMethod,
                        specialConfig: exercise.specialConfig
                      });
                      
                      return {
                        ...exercise,
                        exerciseId: exercise.id,
                        sets: exercise.sets || 3,
                        targetReps: exercise.targetReps || "8-12",
                        restPeriod: exercise.restPeriod || 120,
                        notes: exercise.notes || "",
                        // CRITICAL: Map special training method fields correctly
                        specialTrainingMethod: exercise.specialMethod || null,
                        specialMethodConfig: exercise.specialConfig ? { ...exercise.specialConfig } : null,
                        orderIndex: exercise.orderIndex,
                        repsRange: exercise.repsRange
                      };
                    });
                    
                    console.log('Template - Mapped exercises:', templateExercises);
                    
                    const updatedWorkout = { ...currentWorkout, exercises: templateExercises };
                    console.log('Template - Updated workout:', updatedWorkout);
                    
                    updateWorkout(currentWorkoutIndex, updatedWorkout);
                  }}
                />
              </div>
            </div>

            {/* Exercise Overview - Single Section */}
            {currentWorkout.exercises.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Exercise Overview</Label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {currentWorkout.exercises.map((exercise: TemplateExercise, index: number) => (
                    <Card key={`${exercise.exerciseId}-${index}`} className="border-l-2 border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{exercise.name}</h4>
                            <Badge variant="outline" className="text-xs">{exercise.category}</Badge>
                            <Badge variant="secondary" className="text-xs">{exercise.primaryMuscle}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExerciseFromCurrentWorkout(exercise.exerciseId)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Single Overview Line with all training details */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <strong>{exercise.sets}</strong> sets
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>{exercise.targetReps}</strong> reps
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            <strong>{exercise.restPeriod}s</strong> rest
                          </span>
                          {exercise.specialTrainingMethod && exercise.specialTrainingMethod !== 'none' && (
                            <span className="flex items-center gap-1 text-primary">
                              <Zap className="h-3 w-3" />
                              <strong>
                                {exercise.specialTrainingMethod === 'myorepMatch' && 'Myorep +'}
                                {exercise.specialTrainingMethod === 'myorepNoMatch' && 'Myorep'}
                                {exercise.specialTrainingMethod === 'dropSet' && 'Drop Set'}
                                {exercise.specialTrainingMethod === 'giantSet' && 'Giant Set'}
                                {exercise.specialTrainingMethod === 'superset' && 'Superset'}
                              </strong>
                            </span>
                          )}
                        </div>
                        
                        {/* Show special training method details if configured */}
                        {exercise.specialTrainingMethod && exercise.specialMethodConfig && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2">
                            {exercise.specialTrainingMethod === 'myorepMatch' && (
                              <span>Target: {exercise.specialMethodConfig.targetReps || 15} reps, Mini Sets: {exercise.specialMethodConfig.miniSets || 3}, Rest: {exercise.specialMethodConfig.restBetweenMiniSets || 15}s</span>
                            )}
                            {exercise.specialTrainingMethod === 'myorepNoMatch' && (
                              <span>Mini Sets: {exercise.specialMethodConfig.miniSets || 3}, Rest: {exercise.specialMethodConfig.restBetweenMiniSets || 15}s</span>
                            )}
                            {exercise.specialTrainingMethod === 'dropSet' && (
                              <span>Drops: {exercise.specialMethodConfig.numberOfDrops || 2}, Weight Reduction: {exercise.specialMethodConfig.weightReductionPercentage || 20}%, Target Reps: {exercise.specialMethodConfig.targetRepsPerDrop || 8}</span>
                            )}
                            {exercise.specialTrainingMethod === 'giantSet' && (
                              <span>Total Reps: {exercise.specialMethodConfig.totalTargetReps || 40}, Mini Sets: {exercise.specialMethodConfig.miniSetReps || 10}, Rest: {exercise.specialMethodConfig.restBetweenMiniSets || 10}s</span>
                            )}
                          </div>
                        )}
                        
                        {exercise.notes && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Notes:</span> {exercise.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Special Method Configuration Panel Component
function SpecialMethodConfigurationPanel({
  method,
  config = {},
  onConfigChange,
  formData,
  currentWorkoutIndex,
  updateWorkout,
  currentExercise,
  exerciseIndex,
  readOnly = false
}: {
  method: string;
  config: any;
  onConfigChange: (config: any) => void;
  formData?: any;
  currentWorkoutIndex?: number;
  updateWorkout?: (index: number, workout: any) => void;
  currentExercise?: any;
  exerciseIndex?: number;
  readOnly?: boolean;
}) {
  // Defensive check to ensure we're in a proper React component context
  if (!method) {
    return null;
  }

  const [exerciseSearchTerm, setExerciseSearchTerm] = useState(config?.pairedExerciseName || config?.pairedExercise || '');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const { toast } = useToast();
  
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises'],
    enabled: method === 'superset',
  });
  
  useEffect(() => {
    const newSearchTerm = config?.pairedExerciseName || config?.pairedExercise || '';
    if (newSearchTerm !== exerciseSearchTerm) {
      setExerciseSearchTerm(newSearchTerm);
    }
  }, [config?.pairedExerciseName, config?.pairedExercise, exerciseSearchTerm]);
  const renderConfig = () => {
    switch (method) {
      case 'dropSet':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Drop Set Config {readOnly && <span className="text-muted-foreground">(View Only)</span>}</h5>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Number of drops (2-5)</Label>
                <Input
                  type="number"
                  value={config?.drops || 2}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, drops: parseInt(e.target.value) || 2 })}
                  min="2"
                  max="5"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Weight reductions per drop (5-30%)</Label>
                <Input
                  type="number"
                  value={config?.weightReduction || 20}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, weightReduction: parseInt(e.target.value) || 20 })}
                  min="5"
                  max="30"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Rest between drops (5-15s)</Label>
                <Input
                  type="number"
                  value={config?.restBetweenDrops || 10}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, restBetweenDrops: parseInt(e.target.value) || 10 })}
                  min="5"
                  max="15"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        );

      case 'myorepMatch':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Myorep Match Config {readOnly && <span className="text-muted-foreground">(View Only)</span>}</h5>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Target Reps (10-20)</Label>
                <Input
                  type="number"
                  value={config?.targetReps || 15}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, targetReps: parseInt(e.target.value) || 15 })}
                  min="10"
                  max="20"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Mini Sets (1-5)</Label>
                <Input
                  type="number"
                  value={config?.miniSets || 3}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, miniSets: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="5"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Rest (15-30s)</Label>
                <Input
                  type="number"
                  value={config?.restSeconds || 20}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, restSeconds: parseInt(e.target.value) || 20 })}
                  min="15"
                  max="30"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        );
      
      case 'myorepNoMatch':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Myorep No Match Config {readOnly && <span className="text-muted-foreground">(View Only)</span>}</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Mini Sets (1-5)</Label>
                <Input
                  type="number"
                  value={config?.miniSets || 3}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, miniSets: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="5"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Rest (15-30s)</Label>
                <Input
                  type="number"
                  value={config?.restSeconds || 20}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, restSeconds: parseInt(e.target.value) || 20 })}
                  min="15"
                  max="30"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        );

      case 'giantSet':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Giant Set Config {readOnly && <span className="text-muted-foreground">(View Only)</span>}</h5>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Total target reps (30-60)</Label>
                <Input
                  type="number"
                  value={config?.totalTargetReps || 40}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, totalTargetReps: parseInt(e.target.value) || 40 })}
                  min="30"
                  max="60"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Mini set reps (5-15)</Label>
                <Input
                  type="number"
                  value={config?.miniSetReps || 8}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, miniSetReps: parseInt(e.target.value) || 8 })}
                  min="5"
                  max="15"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Rest (5-15s)</Label>
                <Input
                  type="number"
                  value={config?.restSeconds || 10}
                  onChange={readOnly ? undefined : (e) => onConfigChange({ ...config, restSeconds: parseInt(e.target.value) || 10 })}
                  min="5"
                  max="15"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        );

      case 'superset':
        const filteredExercises = exercises?.filter(exercise => 
          exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) &&
          exercise.name !== currentExercise?.name
        ).slice(0, 5) || [];

        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Superset Configuration {readOnly && <span className="text-muted-foreground">(View Only)</span>}</h5>
            <p className="text-[10px] text-muted-foreground">Informational only - paired exercise configured separately</p>
            <div className="space-y-2">
              <div className="relative">
                <Label className="text-[10px] font-medium">Search Paired Exercise</Label>
                <Input
                  value={exerciseSearchTerm}
                  onChange={readOnly ? undefined : (e) => {
                    setExerciseSearchTerm(e.target.value);
                    setShowExerciseDropdown(true);
                  }}
                  onFocus={readOnly ? undefined : () => setShowExerciseDropdown(true)}
                  onBlur={readOnly ? undefined : () => setTimeout(() => setShowExerciseDropdown(false), 200)}
                  placeholder="Search and select paired exercise"
                  className="h-7 text-xs"
                  disabled={readOnly}
                />
                {!readOnly && showExerciseDropdown && exerciseSearchTerm.length >= 2 && filteredExercises.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-background border rounded shadow-lg max-h-32 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="px-2 py-1 text-xs hover:bg-muted cursor-pointer"
                        onClick={() => {
                          // Auto-create paired exercise for Superset - following create-workout-session implementation
                          if (formData && updateWorkout && currentWorkoutIndex !== undefined && currentExercise && exerciseIndex !== undefined) {
                            const currentWorkout = formData.templateData.workouts[currentWorkoutIndex];
                            
                            // Check if paired exercise already exists in the workout
                            const existingPairedIndex = currentWorkout.exercises.findIndex((ex: TemplateExercise) => ex.exerciseId === exercise.id);
                            
                            if (existingPairedIndex === -1) {
                              // Create new paired exercise template
                              const pairedTemplate: TemplateExercise = {
                                id: exercise.id,
                                exerciseId: exercise.id,
                                name: exercise.name,
                                category: exercise.category,
                                muscleGroups: exercise.muscleGroups || [],
                                primaryMuscle: exercise.primaryMuscle,
                                equipment: exercise.equipment || '',
                                difficulty: exercise.difficulty || 'intermediate',
                                sets: currentExercise.sets, // Same number of sets as current exercise
                                targetReps: currentExercise.targetReps, // Same target reps
                                restPeriod: currentExercise.restPeriod, // Same rest period
                                notes: `Superset pair with ${currentExercise.name}`,
                                specialTrainingMethod: 'superset',
                                specialMethodConfig: { 
                                  pairedExerciseId: currentExercise.exerciseId,
                                  restBetweenExercises: 10
                                }
                              };
                              
                              // Insert the paired exercise immediately after the current exercise
                              const insertIndex = exerciseIndex + 1;
                              const updatedExercises = [
                                ...currentWorkout.exercises.slice(0, insertIndex),
                                pairedTemplate,
                                ...currentWorkout.exercises.slice(insertIndex)
                              ];
                              
                              const updatedWorkout = {
                                ...currentWorkout,
                                exercises: updatedExercises
                              };
                              updateWorkout(currentWorkoutIndex, updatedWorkout);
                              
                              toast({
                                title: "Paired Exercise Added",
                                description: `${exercise.name} has been automatically added as your superset pair.`,
                              });
                            } else {
                              // Update existing paired exercise to reference this exercise
                              const updatedExercises = [...currentWorkout.exercises];
                              updatedExercises[existingPairedIndex] = {
                                ...updatedExercises[existingPairedIndex],
                                specialTrainingMethod: 'superset',
                                specialMethodConfig: {
                                  ...updatedExercises[existingPairedIndex].specialMethodConfig,
                                  pairedExerciseId: currentExercise.exerciseId,
                                  restBetweenExercises: 10
                                },
                                notes: `Superset pair with ${currentExercise.name}`,
                                sets: currentExercise.sets, // Sync sets
                                targetReps: currentExercise.targetReps, // Sync reps
                                restPeriod: currentExercise.restPeriod, // Sync rest
                              };
                              
                              const updatedWorkout = {
                                ...currentWorkout,
                                exercises: updatedExercises
                              };
                              updateWorkout(currentWorkoutIndex, updatedWorkout);
                              
                              toast({
                                title: "Exercise Updated",
                                description: `${exercise.name} has been configured as your superset pair.`,
                              });
                            }
                          }
                          
                          // Update the current exercise's config with the paired exercise info
                          onConfigChange({ 
                            ...config, 
                            pairedExerciseId: exercise.id,
                            pairedExerciseName: exercise.name,
                            restBetweenExercises: 10
                          });
                          
                          setExerciseSearchTerm(exercise.name);
                          setShowExerciseDropdown(false);
                        }}
                      >
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {exercise.primaryMuscle} • {exercise.category}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {config?.pairedExerciseName && (
                <div className="text-[10px] text-green-600 font-medium">
                  ✓ Paired with: {config.pairedExerciseName}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderConfig();
}

// Helper function to get default config for special methods - match create-workout-session.tsx
function getDefaultSpecialMethodConfig(method: string): any {
  switch (method) {
    case 'dropSet':
      return { 
        drops: 2, 
        weightReduction: 20, 
        restBetweenDrops: 10 
      };
    case 'myorepMatch':
      return { 
        targetReps: 15, 
        miniSets: 3, 
        restSeconds: 20 
      };
    case 'myorepNoMatch':
      return { 
        miniSets: 3, 
        restSeconds: 20 
      };
    case 'giantSet':
      return { 
        totalTargetReps: 40, 
        miniSetReps: 8, 
        restSeconds: 10 
      };
    case 'superset':
      return { 
        pairedExerciseId: null, 
        pairedExerciseName: '', 
        restBetweenExercises: 10 
      };
    default:
      return {};
  }
}