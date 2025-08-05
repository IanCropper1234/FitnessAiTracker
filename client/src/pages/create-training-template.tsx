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
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Settings } from 'lucide-react';
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

export default function CreateTrainingTemplate() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const exerciseConfigRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
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

  const currentWorkout = formData.templateData.workouts[currentWorkoutIndex] || {
    name: '',
    exercises: [],
    estimatedDuration: 45,
    focus: []
  };

  // Auto-sync step state based on content
  useEffect(() => {
    const hasBasicInfo = formData.name.trim() !== '';
    const hasExercises = formData.templateData.workouts.some(w => w.exercises.length > 0);
    
    console.log('Step sync check:', { 
      hasBasicInfo, 
      hasExercises, 
      currentStep: step,
      totalWorkouts: formData.templateData.workouts.length,
      workoutExerciseCounts: formData.templateData.workouts.map(w => w.exercises.length),
      workoutDetails: formData.templateData.workouts.map((w, i) => ({ 
        index: i, 
        name: w.name, 
        exerciseCount: w.exercises.length,
        exercises: w.exercises.map(ex => ({ id: ex.exerciseId, name: ex.name }))
      }))
    });
    
    // If we have exercises, advance to step 2 automatically
    if (hasExercises && step === 1) {
      console.log('Auto-advancing to step 2 - exercises detected');
      setStep(2);
    }
    // If we have exercises but no basic info, reset to step 1
    else if (hasExercises && !hasBasicInfo && step === 2) {
      console.log('Resetting to step 1 - exercises exist but basic info missing');
      setStep(1);
    }
  }, [formData.templateData.workouts, step]);

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
    
    setFormData(prev => {
      const updated = {
        ...prev,
        templateData: {
          ...prev.templateData,
          workouts: prev.templateData.workouts.map((w, i) => i === index ? workout : w)
        }
      };
      console.log('updateWorkout - Updated formData:', updated);
      console.log('updateWorkout - New exercise counts:', updated.templateData.workouts.map(w => w.exercises.length));
      
      // Check if we should advance to step 2 immediately after state update
      const hasExercises = updated.templateData.workouts.some(w => w.exercises.length > 0);
      if (hasExercises && step === 1) {
        console.log('updateWorkout - Triggering step advancement from state update');
        setTimeout(() => setStep(2), 50);
      }
      
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
      exercises: currentWorkout.exercises.filter(ex => ex.exerciseId !== exerciseId)
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const updateExercise = (exerciseIndex: number, updates: Partial<TemplateExercise>) => {
    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex, i) => 
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

    if (formData.templateData.workouts.some(w => w.exercises.length === 0)) {
      toast({
        title: "Add Exercises",
        description: "Each training day needs at least one exercise",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const canProceedToStep2 = formData.name.trim() && formData.description.trim();
  const canComplete = formData.templateData.workouts.every(w => w.exercises.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/training')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : "secondary"}>
              Step 1: Basic Setup
            </Badge>
            <Badge variant={step === 2 ? "default" : "secondary"}>
              Step 2: Configure Exercises
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6 max-w-6xl">
        
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., My Custom Push/Pull Training"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Difficulty Level</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Template Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your training template's features and goals..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="daysPerWeek">Training Days Per Week</Label>
                  <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => {
                    const days = parseInt(value);
                    setFormData(prev => ({ 
                      ...prev, 
                      daysPerWeek: days,
                      templateData: {
                        ...prev.templateData,
                        workouts: Array.from({ length: days }, (_, i) => ({
                          name: `Day ${i + 1}`,
                          exercises: [],
                          estimatedDuration: 45,
                          focus: []
                        }))
                      }
                    }));
                    setCurrentWorkoutIndex(0);
                  }}>
                    <SelectTrigger className="w-48">
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="flex items-center gap-2"
              >
                Next: Configure Exercises
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Workouts */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Workout Navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-headline text-[12px]">Configure Training Day</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWorkoutIndex(Math.max(0, currentWorkoutIndex - 1))}
                      disabled={currentWorkoutIndex === 0}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded min-w-[40px] text-center">
                      {currentWorkoutIndex + 1}/{formData.templateData.workouts.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWorkoutIndex(Math.min(formData.templateData.workouts.length - 1, currentWorkoutIndex + 1))}
                      disabled={currentWorkoutIndex === formData.templateData.workouts.length - 1}
                      className="h-8 px-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                  <Label htmlFor="workoutName" className="text-xs font-medium min-w-fit">Day Name:</Label>
                  <Input
                    id="workoutName"
                    value={currentWorkout.name}
                    onChange={(e) => updateWorkout(currentWorkoutIndex, { ...currentWorkout, name: e.target.value })}
                    className="flex-1 h-8 text-sm"
                    placeholder="e.g., Chest & Triceps"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exercise Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              
              {/* Exercise Library */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 lg:h-96 overflow-y-auto">
                    <ExerciseSelector
                      selectedExercises={currentWorkout.exercises}
                      onExercisesChange={(exercisesOrUpdater: any) => {
                        let exercises: any[];
                        
                        // Handle both direct array and function updater
                        if (typeof exercisesOrUpdater === 'function') {
                          exercises = exercisesOrUpdater(currentWorkout.exercises);
                        } else {
                          exercises = exercisesOrUpdater;
                        }
                        
                        console.log('Template - Processing exercises:', exercises);
                        console.log('Template - Type of exercises:', typeof exercises);
                        console.log('Template - Is exercises a function?', typeof exercises === 'function');
                        console.log('Template - Current workout before update:', currentWorkout);
                        console.log('Template - Current formData before update:', formData);
                        
                        // Map to TemplateExercise format
                        const templateExercises = exercises.map(exercise => ({
                          ...exercise,
                          exerciseId: exercise.id,
                          sets: exercise.sets || 3,
                          targetReps: exercise.targetReps || "8-12",
                          restPeriod: exercise.restPeriod || 120,
                          notes: exercise.notes || "",
                          orderIndex: exercise.orderIndex,
                          repsRange: exercise.repsRange
                        }));
                        
                        console.log('Template - Mapped exercises:', templateExercises);
                        
                        const updatedWorkout = { ...currentWorkout, exercises: templateExercises };
                        console.log('Template - Updated workout:', updatedWorkout);
                        
                        updateWorkout(currentWorkoutIndex, updatedWorkout);
                        
                        // Check if we need to advance to step 2 - but user is already in step 2!
                        console.log('Step advancement check:', { 
                          currentStep: step, 
                          templateExercisesLength: templateExercises.length,
                          condition: step === 1 && templateExercises.length > 0 
                        });
                        
                        // Force advance to step 2 when exercises are added, regardless of current step
                        if (templateExercises.length > 0) {
                          console.log('Forcing advance to step 2 - exercises added');
                          // Direct step advancement - updateWorkout will handle the timing
                          setStep(2);
                        }
                        
                        // Auto-scroll to Exercise Configuration when new exercise is added
                        if (exercises.length > currentWorkout.exercises.length && exerciseConfigRef.current) {
                          setTimeout(() => {
                            exerciseConfigRef.current?.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start',
                              inline: 'nearest'
                            });
                          }, 200);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selected Exercises Configuration */}
              <Card ref={exerciseConfigRef}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Exercise Configuration
                    <Badge variant="secondary">{currentWorkout.exercises.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                    {currentWorkout.exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No exercises added yet</p>
                        <p className="text-sm">Select exercises from the left to start configuring</p>
                      </div>
                    ) : (
                      currentWorkout.exercises.map((exercise, index) => (
                        <Card key={`${exercise.exerciseId}-${index}`} className="border-l-4 border-l-primary" data-exercise-index={index}>
                          <CardHeader className="pb-2 pt-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate pr-2">{exercise.name}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExerciseFromCurrentWorkout(exercise.exerciseId)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-[10px] font-medium">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(index, { sets: parseInt(e.target.value) || 1 })}
                                  min="1"
                                  max="10"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-medium">Reps</Label>
                                <Input
                                  value={exercise.targetReps}
                                  onChange={(e) => updateExercise(index, { targetReps: e.target.value })}
                                  placeholder="8-12"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-medium">Rest</Label>
                                <Input
                                  type="number"
                                  value={exercise.restPeriod}
                                  onChange={(e) => updateExercise(index, { restPeriod: parseInt(e.target.value) || 60 })}
                                  min="30"
                                  max="300"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-[10px] font-medium">Method</Label>
                              <Select 
                                value={exercise.specialTrainingMethod || "none"} 
                                onValueChange={(value) => {
                                  if (value === "none") {
                                    updateExercise(index, { 
                                      specialTrainingMethod: undefined,
                                      specialMethodConfig: undefined 
                                    });
                                  } else {
                                    updateExercise(index, { 
                                      specialTrainingMethod: value,
                                      specialMethodConfig: getDefaultSpecialMethodConfig(value)
                                    });
                                    
                                    // Auto-scroll to show the special method configuration
                                    setTimeout(() => {
                                      const exerciseCard = document.querySelector(`[data-exercise-index="${index}"]`);
                                      if (exerciseCard) {
                                        exerciseCard.scrollIntoView({ 
                                          behavior: 'smooth', 
                                          block: 'center',
                                          inline: 'nearest'
                                        });
                                        
                                        // Then scroll specifically to the config panel if it exists
                                        setTimeout(() => {
                                          const configPanel = exerciseCard.querySelector('.special-method-config');
                                          if (configPanel) {
                                            configPanel.scrollIntoView({ 
                                              behavior: 'smooth', 
                                              block: 'nearest'
                                            });
                                          }
                                        }, 100);
                                      }
                                    }, 200);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Standard</SelectItem>
                                  <SelectItem value="dropSet">Drop Set</SelectItem>
                                  <SelectItem value="myorepMatch">Myorep +</SelectItem>
                                  <SelectItem value="myorepNoMatch">Myorep</SelectItem>
                                  <SelectItem value="giantSet">Giant Set</SelectItem>
                                  <SelectItem value="superset">Superset</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {exercise.specialTrainingMethod && (
                              <div className="special-method-config">
                                <SpecialMethodConfigurationPanel
                                  method={exercise.specialTrainingMethod}
                                  config={exercise.specialMethodConfig}
                                  onConfigChange={(config) => updateExercise(index, { specialMethodConfig: config })}
                                  formData={formData}
                                  currentWorkoutIndex={currentWorkoutIndex}
                                  updateWorkout={updateWorkout}
                                />
                              </div>
                            )}

                            <div>
                              <Label className="text-[10px] font-medium">Notes</Label>
                              <Textarea
                                value={exercise.notes || ''}
                                onChange={(e) => updateExercise(index, { notes: e.target.value })}
                                placeholder="Exercise notes..."
                                rows={2}
                                className="text-xs resize-none"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Basic Setup
              </Button>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setLocation('/training')}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !canComplete}
                  className="flex items-center gap-2"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Special Method Configuration Panel Component
function SpecialMethodConfigurationPanel({
  method,
  config,
  onConfigChange,
  formData,
  currentWorkoutIndex,
  updateWorkout
}: {
  method: string;
  config: any;
  onConfigChange: (config: any) => void;
  formData?: any;
  currentWorkoutIndex?: number;
  updateWorkout?: (index: number, workout: any) => void;
}) {
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState(config?.pairedExercise || '');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises'],
    enabled: method === 'superset',
  });
  
  useEffect(() => {
    setExerciseSearchTerm(config?.pairedExercise || '');
  }, [config?.pairedExercise]);
  const renderConfig = () => {
    switch (method) {
      case 'dropSet':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Drop Set Config</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Drops</Label>
                <Input
                  type="number"
                  value={config?.drops || 2}
                  onChange={(e) => onConfigChange({ ...config, drops: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="4"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Reduction %</Label>
                <Input
                  type="number"
                  value={config?.weightReduction || 20}
                  onChange={(e) => onConfigChange({ ...config, weightReduction: parseInt(e.target.value) || 20 })}
                  min="10"
                  max="50"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        );

      case 'myorepMatch':
      case 'myorepNoMatch':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">
              {method === 'myorepMatch' ? 'Myorep+ Config' : 'Myorep Config'}
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Activation</Label>
                <Input
                  type="number"
                  value={config?.activationReps || 12}
                  onChange={(e) => onConfigChange({ ...config, activationReps: parseInt(e.target.value) || 12 })}
                  min="8"
                  max="20"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Back-off</Label>
                <Input
                  type="number"
                  value={config?.backoffReps || 5}
                  onChange={(e) => onConfigChange({ ...config, backoffReps: parseInt(e.target.value) || 5 })}
                  min="3"
                  max="10"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        );

      case 'giantSet':
        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Giant Set Config</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-medium">Exercises</Label>
                <Input
                  type="number"
                  value={config?.exerciseCount || 4}
                  onChange={(e) => onConfigChange({ ...config, exerciseCount: parseInt(e.target.value) || 4 })}
                  min="3"
                  max="6"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium">Rest (sec)</Label>
                <Input
                  type="number"
                  value={config?.restBetweenExercises || 15}
                  onChange={(e) => onConfigChange({ ...config, restBetweenExercises: parseInt(e.target.value) || 15 })}
                  min="0"
                  max="60"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        );

      case 'superset':
        const filteredExercises = exercises?.filter(exercise => 
          exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) &&
          exercise.name !== config?.currentExerciseName
        ).slice(0, 5) || [];

        return (
          <div className="space-y-2 p-2 bg-muted/50 rounded">
            <h5 className="text-xs font-medium">Superset Config</h5>
            <div className="space-y-2">
              <div className="relative">
                <Label className="text-[10px] font-medium">Paired Exercise</Label>
                <Input
                  value={exerciseSearchTerm}
                  onChange={(e) => {
                    setExerciseSearchTerm(e.target.value);
                    setShowExerciseDropdown(true);
                  }}
                  onFocus={() => setShowExerciseDropdown(true)}
                  onBlur={() => setTimeout(() => setShowExerciseDropdown(false), 200)}
                  placeholder="Search and select exercise"
                  className="h-7 text-xs"
                />
                {showExerciseDropdown && exerciseSearchTerm.length >= 2 && filteredExercises.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-background border rounded shadow-lg max-h-32 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="px-2 py-1 text-xs hover:bg-muted cursor-pointer"
                        onClick={() => {
                          // Add exercise to current workout
                          const newExercise: TemplateExercise = {
                            id: exercise.id,
                            exerciseId: exercise.id,
                            name: exercise.name,
                            category: exercise.category,
                            muscleGroups: exercise.muscleGroups || [],
                            primaryMuscle: exercise.primaryMuscle,
                            equipment: exercise.equipment || '',
                            difficulty: exercise.difficulty || 'intermediate',
                            sets: 3,
                            targetReps: "8-12",
                            restPeriod: 120,
                            notes: "",
                            specialTrainingMethod: 'superset',
                            specialMethodConfig: { 
                              pairedExercise: config?.currentExerciseName || '',
                              restBetweenExercises: 10 
                            }
                          };
                          
                          // Get current workout and add the exercise
                          if (formData && updateWorkout && currentWorkoutIndex !== undefined) {
                            const currentWorkout = formData.templateData.workouts[currentWorkoutIndex];
                            const updatedWorkout = {
                              ...currentWorkout,
                              exercises: [...currentWorkout.exercises, newExercise]
                            };
                            updateWorkout(currentWorkoutIndex, updatedWorkout);
                          }
                          
                          // Update the current exercise's config with the paired exercise name
                          onConfigChange({ 
                            ...config, 
                            pairedExercise: exercise.name,
                            pairedExerciseId: exercise.id
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
              <div>
                <Label className="text-[10px] font-medium">Rest (sec)</Label>
                <Input
                  type="number"
                  value={config?.restBetweenExercises || 10}
                  onChange={(e) => onConfigChange({ ...config, restBetweenExercises: parseInt(e.target.value) || 10 })}
                  min="0"
                  max="30"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderConfig();
}

// Helper function to get default config for special methods
function getDefaultSpecialMethodConfig(method: string): any {
  switch (method) {
    case 'dropSet':
      return { drops: 2, weightReduction: 20 };
    case 'myorepMatch':
    case 'myorepNoMatch':
      return { activationReps: 12, backoffReps: 5 };
    case 'giantSet':
      return { exerciseCount: 4, restBetweenExercises: 15 };
    case 'superset':
      return { pairedExercise: '', restBetweenExercises: 10 };
    default:
      return {};
  }
}