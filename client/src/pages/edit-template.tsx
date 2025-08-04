import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Search,
  Calendar,
  Dumbbell,
  Save,
  Loader2
} from "lucide-react";

interface Exercise {
  id?: number;
  exerciseId?: number;
  name?: string;
  exerciseName?: string; // for backward compatibility
  muscleGroups?: string[];
  sets: number;
  targetReps?: string;
  repsRange?: string; // for backward compatibility
  restPeriod: number;
  orderIndex?: number;
  specialTrainingMethod?: string;
  trainingMethod?: string; // for backward compatibility
  specialMethodConfig?: any; // Configuration for special training methods
  notes?: string;
}

interface Workout {
  name: string;
  exercises: Exercise[];
  estimatedDuration?: number;
  focus?: string[];
}

interface TemplateData {
  workouts: Workout[];
}

interface TrainingTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  daysPerWeek: number;
  templateData: TemplateData;
  createdBy?: string;
}

export default function EditTemplatePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract template ID from URL
  const templateId = parseInt(location.split('/edit-template/')[1]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    daysPerWeek: 3,
    templateData: { workouts: [] as Workout[] }
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch template data
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['/api/training/templates', templateId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/templates/${templateId}`);
      return response.json();
    },
    enabled: !!templateId
  });

  // Fetch exercises for exercise selector
  const { data: exercises = [] } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/exercises');
      return response.json();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ templateId, updateData }: { templateId: number; updateData: any }) => {
      const response = await apiRequest('PUT', `/api/training/templates/${templateId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Your training template has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
      setLocation('/training?tab=templates');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  });

  // Initialize form data when template is loaded
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        daysPerWeek: template.daysPerWeek,
        templateData: template.templateData || { workouts: [] }
      });
    }
  }, [template]);

  const currentWorkout = formData.templateData?.workouts?.[activeWorkoutIndex];
  const filteredExercises = exercises.filter((ex: { name: string }) => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      templateId,
      updateData: formData
    });
  };

  const handleAddExercise = (exercise: { id: number; name: string; muscleGroups?: string[] }) => {
    if (!currentWorkout) return;

    const newExercise = {
      id: exercise.id,
      exerciseId: exercise.id,
      name: exercise.name,
      exerciseName: exercise.name, // for backward compatibility
      muscleGroups: exercise.muscleGroups || [],
      sets: 3,
      targetReps: "8-12",
      repsRange: "8-12", // for backward compatibility
      restPeriod: 60,
      orderIndex: (currentWorkout.exercises?.length || 0) + 1
    };

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: [...(currentWorkout.exercises || []), newExercise]
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));

    setShowExerciseSelector(false);
    setSearchTerm('');
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.filter((_, idx) => idx !== exerciseIndex);
    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (!currentWorkout || toIndex < 0 || toIndex >= currentWorkout.exercises.length) return;

    const updatedExercises = [...currentWorkout.exercises];
    const [movedExercise] = updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, movedExercise);

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleUpdateExercise = (exerciseIndex: number, field: string, value: any) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      [field]: value
    };

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleUpdateTrainingMethod = (exerciseIndex: number, methodValue: string) => {
    if (methodValue === 'none') {
      handleUpdateExercise(exerciseIndex, 'specialTrainingMethod', undefined);
      handleUpdateExercise(exerciseIndex, 'specialMethodConfig', undefined);
    } else {
      handleUpdateExercise(exerciseIndex, 'specialTrainingMethod', methodValue);
      // Set default config for the method
      const defaultConfig = getDefaultMethodConfig(methodValue);
      handleUpdateExercise(exerciseIndex, 'specialMethodConfig', defaultConfig);
    }
  };

  const handleUpdateMethodConfig = (exerciseIndex: number, configField: string, value: any) => {
    if (!currentWorkout) return;
    
    const updatedExercises = [...currentWorkout.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (!exercise) return;
    
    const updatedConfig = {
      ...exercise.specialMethodConfig,
      [configField]: value
    };
    
    updatedExercises[exerciseIndex] = {
      ...exercise,
      specialMethodConfig: updatedConfig
    };
    
    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };
    
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const getDefaultMethodConfig = (method: string) => {
    switch (method) {
      case 'dropSet':
        return { drops: 2, weightReduction: 20 };
      case 'restPause':
        return { pauseDuration: 15, totalReps: 20 };
      case 'myorepMatch':
        return { activationReps: 12, backoffReps: 3 };
      case 'clusterSet':
        return { repsPerCluster: 3, clusters: 5, restBetween: 15 };
      case 'giantSet':
        return { exerciseCount: 4, restBetweenExercises: 15 };
      case 'tempo':
        return { eccentric: 3, pause: 1, concentric: 1 };
      default:
        return {};
    }
  };

  const renderSpecialMethodConfig = (method: string | undefined, config: any) => {
    if (!method || !config) return '';
    
    switch (method) {
      case 'dropSet':
        return `${config.drops || 2} drops, ${config.weightReduction || 20}% reduction`;
      case 'restPause':
        return `${config.pauseDuration || 15}s pause, ${config.totalReps || 20} total reps`;
      case 'myorepMatch':
        return `${config.activationReps || 12} activation, ${config.backoffReps || 3} backoff`;
      case 'clusterSet':
        return `${config.repsPerCluster || 3} reps × ${config.clusters || 5} clusters`;
      case 'giantSet':
        return `${config.exerciseCount || 4} exercises, ${config.restBetweenExercises || 15}s rest`;
      case 'tempo':
        return `${config.eccentric || 3}-${config.pause || 1}-${config.concentric || 1} tempo`;
      default:
        return '';
    }
  };

  const renderSpecialMethodConfigInputs = (method: string | undefined, config: any, exerciseIndex: number) => {
    if (!method) return null;
    
    switch (method) {
      case 'dropSet':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Drops</Label>
              <Input
                type="number"
                value={config.drops || 2}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'drops', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="1"
                max="5"
              />
            </div>
            <div>
              <Label className="text-xs">Weight Reduction (%)</Label>
              <Input
                type="number"
                value={config.weightReduction || 20}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'weightReduction', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="10"
                max="50"
              />
            </div>
          </div>
        );
      case 'restPause':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Pause Duration (s)</Label>
              <Input
                type="number"
                value={config.pauseDuration || 15}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'pauseDuration', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="10"
                max="30"
              />
            </div>
            <div>
              <Label className="text-xs">Total Reps</Label>
              <Input
                type="number"
                value={config.totalReps || 20}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'totalReps', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="15"
                max="30"
              />
            </div>
          </div>
        );
      case 'myorepMatch':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Activation Reps</Label>
              <Input
                type="number"
                value={config.activationReps || 12}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'activationReps', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="8"
                max="20"
              />
            </div>
            <div>
              <Label className="text-xs">Backoff Reps</Label>
              <Input
                type="number"
                value={config.backoffReps || 3}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'backoffReps', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="2"
                max="8"
              />
            </div>
          </div>
        );
      case 'clusterSet':
        return (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label className="text-xs">Reps/Cluster</Label>
              <Input
                type="number"
                value={config.repsPerCluster || 3}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'repsPerCluster', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="1"
                max="8"
              />
            </div>
            <div>
              <Label className="text-xs">Clusters</Label>
              <Input
                type="number"
                value={config.clusters || 5}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'clusters', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="3"
                max="8"
              />
            </div>
            <div>
              <Label className="text-xs">Rest (s)</Label>
              <Input
                type="number"
                value={config.restBetween || 15}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'restBetween', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="10"
                max="30"
              />
            </div>
          </div>
        );
      case 'giantSet':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Exercise Count</Label>
              <Input
                type="number"
                value={config.exerciseCount || 4}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'exerciseCount', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="3"
                max="6"
              />
            </div>
            <div>
              <Label className="text-xs">Rest Between (s)</Label>
              <Input
                type="number"
                value={config.restBetweenExercises || 15}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'restBetweenExercises', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="10"
                max="30"
              />
            </div>
          </div>
        );
      case 'tempo':
        return (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label className="text-xs">Eccentric (s)</Label>
              <Input
                type="number"
                value={config.eccentric || 3}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'eccentric', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="1"
                max="8"
              />
            </div>
            <div>
              <Label className="text-xs">Pause (s)</Label>
              <Input
                type="number"
                value={config.pause || 1}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'pause', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="0"
                max="5"
              />
            </div>
            <div>
              <Label className="text-xs">Concentric (s)</Label>
              <Input
                type="number"
                value={config.concentric || 1}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'concentric', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="1"
                max="3"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested template could not be found.</p>
        <Button onClick={() => setLocation('/training?tab=templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header - Compact for iOS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/training?tab=templates')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Edit Template</h1>
            <p className="text-sm text-muted-foreground">{template.name}</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={updateMutation.isPending || !formData.name || !formData.description}
          className="flex items-center gap-2"
          size="sm"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      {/* Main Content - Mobile Optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
          <TabsTrigger value="exercises" className="text-xs">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Template Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="h-9">
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
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="daysPerWeek" className="text-sm">Days Per Week</Label>
                <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, daysPerWeek: parseInt(value) }))}>
                  <SelectTrigger className="h-9">
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
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Workout Selector - Compact */}
            <Card className="lg:col-span-1">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Workouts</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {formData.templateData?.workouts?.map((workout: Workout, index: number) => (
                  <Button
                    key={index}
                    variant={activeWorkoutIndex === index ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => setActiveWorkoutIndex(index)}
                  >
                    Day {index + 1}: {workout.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Exercise Editor - Optimized for Mobile */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {currentWorkout ? `${currentWorkout.name} (${currentWorkout.exercises?.length || 0} exercises)` : 'Select a workout'}
                  </CardTitle>
                  {currentWorkout && (
                    <Button
                      onClick={() => setShowExerciseSelector(true)}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {currentWorkout ? (
                  <div className="space-y-2">
                    {currentWorkout.exercises?.map((exercise: Exercise, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-3">
                          {/* Exercise Name and Details */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{exercise.name || exercise.exerciseName || 'Unknown Exercise'}</h4>
                              {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {exercise.muscleGroups.join(', ')}
                                </p>
                              )}
                              {(exercise.specialTrainingMethod || exercise.trainingMethod) && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {exercise.specialTrainingMethod || exercise.trainingMethod}
                                  </Badge>
                                  {exercise.specialMethodConfig && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {renderSpecialMethodConfig(exercise.specialTrainingMethod, exercise.specialMethodConfig)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExercise(index)}
                              className="text-red-600 hover:text-red-700 h-6 w-6 p-0 ml-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Exercise Controls - Mobile Optimized */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Sets</Label>
                              <Input
                                type="number"
                                value={exercise.sets || 0}
                                onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                                className="h-7 text-xs"
                                min="1"
                                max="10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Reps</Label>
                              <Input
                                value={exercise.targetReps || exercise.repsRange || ''}
                                onChange={(e) => handleUpdateExercise(index, 'targetReps', e.target.value)}
                                className="h-7 text-xs"
                                placeholder="8-12"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Rest (sec)</Label>
                              <Input
                                type="number"
                                value={exercise.restPeriod || 60}
                                onChange={(e) => handleUpdateExercise(index, 'restPeriod', parseInt(e.target.value) || 60)}
                                className="h-7 text-xs"
                                min="15"
                                max="300"
                              />
                            </div>
                          </div>
                          
                          {/* Training Method and Configuration */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 mr-2">
                                <Label className="text-xs">Training Method</Label>
                                <Select 
                                  value={exercise.specialTrainingMethod || exercise.trainingMethod || 'none'} 
                                  onValueChange={(value) => handleUpdateTrainingMethod(index, value)}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="None" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="dropSet">Drop Set</SelectItem>
                                    <SelectItem value="restPause">Rest-Pause</SelectItem>
                                    <SelectItem value="myorepMatch">Myo-Reps</SelectItem>
                                    <SelectItem value="clusterSet">Cluster Set</SelectItem>
                                    <SelectItem value="giantSet">Giant Set</SelectItem>
                                    <SelectItem value="tempo">Tempo</SelectItem>
                                    <SelectItem value="lengthened_partials">Lengthened Partials</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveExercise(index, index - 1)}
                                  disabled={index === 0}
                                  className="h-7 w-7 p-0"
                                  title="Move Up"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveExercise(index, index + 1)}
                                  disabled={index === currentWorkout.exercises.length - 1}
                                  className="h-7 w-7 p-0"
                                  title="Move Down"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Special Method Configuration */}
                            {exercise.specialTrainingMethod && exercise.specialTrainingMethod !== 'none' && (
                              <div className="bg-muted/30 p-2 rounded border">
                                <Label className="text-xs font-medium">Method Configuration</Label>
                                {renderSpecialMethodConfigInputs(exercise.specialTrainingMethod, exercise.specialMethodConfig || {}, index)}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No exercises added yet</p>
                        <p className="text-xs">Click "Add" to get started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a workout to edit exercises</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Exercise Selector Dialog - Mobile Optimized */}
      {showExerciseSelector && (
        <Dialog open={true} onOpenChange={() => setShowExerciseSelector(false)}>
          <DialogContent className="max-w-md max-h-[80vh] m-4">
            <DialogHeader>
              <DialogTitle className="text-base">Add Exercise</DialogTitle>
              <DialogDescription className="text-sm">
                Search and select an exercise to add
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredExercises.slice(0, 50).map((exercise: { id: number; name: string; muscleGroups?: string[] }) => (
                  <Card 
                    key={exercise.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleAddExercise(exercise)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{exercise.name}</div>
                        {exercise.muscleGroups && (
                          <div className="text-xs text-muted-foreground truncate">
                            {exercise.muscleGroups.join(', ')}
                          </div>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExerciseSelector(false)} size="sm">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}