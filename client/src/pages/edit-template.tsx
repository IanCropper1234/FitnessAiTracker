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
  const [showSupersetSelector, setShowSupersetSelector] = useState(false);
  const [supersetParentIndex, setSupersetParentIndex] = useState<number | null>(null);
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
      // Normalize the template data to use consistent naming format
      const normalizedTemplateData = template.templateData ? {
        ...template.templateData,
        workouts: template.templateData.workouts?.map((workout: any) => ({
          ...workout,
          exercises: workout.exercises?.map((exercise: any) => {
            // Normalize specialTrainingMethod to use underscore format
            let normalizedMethod = exercise.specialTrainingMethod || exercise.specialMethod;
            if (normalizedMethod) {
              // Convert old camelCase to new underscore format
              if (normalizedMethod === 'dropSet') normalizedMethod = 'drop_set';
              else if (normalizedMethod === 'restPause') normalizedMethod = 'rest_pause';
              else if (normalizedMethod === 'myorepMatch') normalizedMethod = 'myorep_match';
              else if (normalizedMethod === 'clusterSet') normalizedMethod = 'cluster_set';
              else if (normalizedMethod === 'giantSet') normalizedMethod = 'giant_set';
            }
            
            return {
              ...exercise,
              specialTrainingMethod: normalizedMethod,
              // Ensure specialMethodConfig is preserved
              specialMethodConfig: exercise.specialMethodConfig || exercise.specialConfig
            };
          }) || []
        })) || []
      } : { workouts: [] };

      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        daysPerWeek: template.daysPerWeek,
        templateData: normalizedTemplateData
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

  const handleAddSupersetPair = (pairedExercise: { id: number; name: string; muscleGroups?: string[] }) => {
    if (!currentWorkout || supersetParentIndex === null) return;

    const updatedExercises = [...currentWorkout.exercises];
    const parentExercise = updatedExercises[supersetParentIndex];
    
    if (!parentExercise) return;

    // Update parent exercise to superset
    updatedExercises[supersetParentIndex] = {
      ...parentExercise,
      specialTrainingMethod: 'superset',
      specialMethodConfig: {
        restBetween: 30,
        pairedExerciseId: pairedExercise.id,
        pairedExerciseName: pairedExercise.name
      }
    };

    // Create paired exercise with synchronized sets
    const pairedExerciseObj = {
      id: pairedExercise.id,
      exerciseId: pairedExercise.id,
      name: pairedExercise.name,
      exerciseName: pairedExercise.name,
      muscleGroups: pairedExercise.muscleGroups || [],
      sets: parentExercise.sets || 3, // Sync sets with parent
      targetReps: '8-12',
      repsRange: '8-12',
      restPeriod: parentExercise.restPeriod || 60,
      orderIndex: (currentWorkout.exercises?.length || 0) + 1,
      specialTrainingMethod: 'superset',
      specialMethodConfig: {
        restBetween: 30,
        pairedExerciseId: parentExercise.id,
        pairedExerciseName: parentExercise.name || parentExercise.exerciseName,
        isSecondaryExercise: true
      }
    };

    // Insert paired exercise right after parent
    updatedExercises.splice(supersetParentIndex + 1, 0, pairedExerciseObj);

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

    setShowSupersetSelector(false);
    setSupersetParentIndex(null);
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
    const exercise = updatedExercises[exerciseIndex];
    
    updatedExercises[exerciseIndex] = {
      ...exercise,
      [field]: value
    };

    // If this is a superset exercise and we're updating sets, sync with paired exercise
    if (field === 'sets' && exercise.specialTrainingMethod === 'superset' && exercise.specialMethodConfig?.pairedExerciseId) {
      const pairedExerciseIndex = updatedExercises.findIndex(ex => 
        ex.id === exercise.specialMethodConfig?.pairedExerciseId ||
        (ex.specialMethodConfig?.pairedExerciseId === exercise.id)
      );
      
      if (pairedExerciseIndex !== -1 && pairedExerciseIndex !== exerciseIndex) {
        updatedExercises[pairedExerciseIndex] = {
          ...updatedExercises[pairedExerciseIndex],
          sets: value
        };
      }
    }

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
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    const exercise = updatedExercises[exerciseIndex];
    if (!exercise) return;

    if (methodValue === 'standard' || methodValue === 'none') {
      // Clear special training method and config
      updatedExercises[exerciseIndex] = {
        ...exercise,
        specialTrainingMethod: undefined,
        specialMethodConfig: undefined
      };
    } else if (methodValue === 'superset') {
      // For superset, show selector to choose paired exercise
      setSupersetParentIndex(exerciseIndex);
      setShowSupersetSelector(true);
      return; // Don't update state yet, wait for paired exercise selection
    } else {
      // Set new training method and default config
      const defaultConfig = getDefaultMethodConfig(methodValue);
      updatedExercises[exerciseIndex] = {
        ...exercise,
        specialTrainingMethod: methodValue,
        specialMethodConfig: defaultConfig
      };
    }

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
      case 'drop_set':
        return { drops: 1, weightReduction: 20 };
      case 'myorep_match':
        return { targetReps: 15, miniSets: 3, restSeconds: 20 };
      case 'myorep_no_match':
        return { targetReps: 15, miniSets: 3, restSeconds: 20 };
      case 'giant_set':
        return { totalMiniSets: 8, repsPerMiniSet: 5, restSeconds: 10 };
      case 'superset':
        return { supersetExercises: [], restBetween: 30 };
      default:
        return {};
    }
  };

  const renderSpecialMethodConfig = (method: string | undefined, config: any) => {
    if (!method || !config || method === 'standard') return '';
    
    switch (method) {
      case 'drop_set':
        return `${config.drops || 1} drops, ${config.weightReduction || 20}% reduction`;
      case 'myorep_match':
      case 'myorep_no_match':
        return `${config.targetReps || 15} target reps, ${config.miniSets || 3} mini sets`;
      case 'giant_set':
        return `${config.totalMiniSets || 8} total mini sets, ${config.repsPerMiniSet || 5} reps per set`;
      case 'superset':
        const pairedName = config.pairedExerciseName || 'Unknown Exercise';
        return config.isSecondaryExercise 
          ? `Paired with: ${pairedName}`
          : `${config.restBetween || 30}s rest, paired with: ${pairedName}`;
      default:
        return '';
    }
  };

  const renderSpecialMethodConfigInputs = (method: string | undefined, config: any, exerciseIndex: number) => {
    if (!method || method === 'standard') return null;
    
    switch (method) {
      case 'drop_set':
        return (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Label className="text-xs">Drops</Label>
              <Input
                type="number"
                value={config.drops || 1}
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
      case 'rest_pause':
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
      case 'myorep_match':
      case 'myorep_no_match':
        return (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label className="text-xs">Target Reps</Label>
              <Input
                type="number"
                value={config.targetReps || 15}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'targetReps', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="8"
                max="25"
              />
            </div>
            <div>
              <Label className="text-xs">Mini Sets</Label>
              <Input
                type="number"
                value={config.miniSets || 3}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'miniSets', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="2"
                max="8"
              />
            </div>
            <div>
              <Label className="text-xs">Rest (s)</Label>
              <Input
                type="number"
                value={config.restSeconds || 20}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'restSeconds', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="10"
                max="30"
              />
            </div>
          </div>
        );
      case 'cluster_set':
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
      case 'giant_set':
        return (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label className="text-xs">Total Mini Sets</Label>
              <Input
                type="number"
                value={config.totalMiniSets || 8}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'totalMiniSets', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="5"
                max="12"
              />
            </div>
            <div>
              <Label className="text-xs">Reps Per Mini Set</Label>
              <Input
                type="number"
                value={config.repsPerMiniSet || 5}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'repsPerMiniSet', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="3"
                max="8"
              />
            </div>
            <div>
              <Label className="text-xs">Rest (s)</Label>
              <Input
                type="number"
                value={config.restSeconds || 10}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'restSeconds', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="5"
                max="30"
              />
            </div>
          </div>
        );
      case 'superset':
        if (config.isSecondaryExercise) {
          return (
            <div className="text-xs text-muted-foreground">
              This is the second exercise in the superset pair.
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 gap-2 mt-2">
            <div>
              <Label className="text-xs">Rest Between Exercises (s)</Label>
              <Input
                type="number"
                value={config.restBetween || 30}
                onChange={(e) => handleUpdateMethodConfig(exerciseIndex, 'restBetween', parseInt(e.target.value))}
                className="h-6 text-xs"
                min="15"
                max="60"
              />
            </div>
            {config.pairedExerciseName && (
              <div className="text-xs text-muted-foreground">
                Paired with: {config.pairedExerciseName}
              </div>
            )}
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
        <div className="ios-loading-dots flex items-center gap-1">
          <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
          <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
          <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
        </div>
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
            <div className="ios-loading-dots flex items-center gap-1">
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
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
                                  value={exercise.specialTrainingMethod || exercise.trainingMethod || 'standard'} 
                                  onValueChange={(value) => handleUpdateTrainingMethod(index, value)}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="None" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="standard">Standard Set</SelectItem>
                                    <SelectItem value="myorep_match">Myorep Match</SelectItem>
                                    <SelectItem value="myorep_no_match">Myorep No Match</SelectItem>
                                    <SelectItem value="drop_set">Drop Set</SelectItem>
                                    <SelectItem value="giant_set">Giant Set (40+ reps)</SelectItem>
                                    <SelectItem value="superset">Superset</SelectItem>
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
                            {exercise.specialTrainingMethod && exercise.specialTrainingMethod !== 'none' && exercise.specialTrainingMethod !== 'standard' && (
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

      {/* Superset Pair Selector Dialog */}
      {showSupersetSelector && (
        <Dialog open={true} onOpenChange={() => {
          setShowSupersetSelector(false);
          setSupersetParentIndex(null);
        }}>
          <DialogContent className="max-w-md max-h-[80vh] m-4">
            <DialogHeader>
              <DialogTitle className="text-base">Select Superset Pair</DialogTitle>
              <DialogDescription className="text-sm">
                Choose an exercise to pair with for superset
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
                    onClick={() => handleAddSupersetPair(exercise)}
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
              <Button variant="outline" onClick={() => {
                setShowSupersetSelector(false);
                setSupersetParentIndex(null);
              }} size="sm">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}