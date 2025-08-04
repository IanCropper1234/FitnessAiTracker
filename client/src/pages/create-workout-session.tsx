import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Search, Filter, Plus, Trash2, Target, ArrowLeft, Dumbbell, Check, ChevronsUpDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  primaryMuscle: string;
  equipment?: string;
}

interface ExerciseTemplate {
  exerciseId: number;
  exercise: Exercise;
  sets: number;
  targetReps: string;
  restPeriod: number;
  notes: string;
  specialMethod?: string;
  specialConfig?: {
    // Myorep Configuration
    activationSet?: boolean;
    targetReps?: number;
    restSeconds?: number;
    miniSets?: number;
    // Dropset Configuration
    dropSets?: number;
    weightReductions?: number[];
    dropSetWeights?: number[];
    dropSetReps?: number[];
    dropRestSeconds?: number;
    // Giant Set Configuration
    totalTargetReps?: number;
    miniSetReps?: number;
    giantRestSeconds?: number;
    // Superset Configuration
    pairedExerciseId?: number;
  };
}

export function CreateWorkoutSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [sessionName, setSessionName] = useState("");
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pairedExerciseSearchOpen, setPairedExerciseSearchOpen] = useState<number | null>(null);

  // Load exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises'],
  });

  // Categories for filtering
  const categories = useMemo(() => {
    const unique = new Set(exercises.map((exercise) => exercise.category));
    return ["all", ...Array.from(unique).sort()];
  }, [exercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    const selectedExerciseIds = new Set(exerciseTemplates.map(template => template.exerciseId));
    
    return exercises.filter((exercise) => {
      if (selectedExerciseIds.has(exercise.id)) return false;
      
      const matchesSearch = !searchTerm || 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [exercises, exerciseTemplates, searchTerm, selectedCategory]);

  // Create workout session mutation
  const createWorkoutSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('POST', '/api/training/sessions', sessionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout session created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
      setLocation('/training');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workout session",
        variant: "destructive",
      });
    },
  });

  const addExerciseFromLibrary = (exercise: Exercise) => {
    const template: ExerciseTemplate = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 90,
      notes: "",
      specialMethod: undefined,
      specialConfig: undefined,
    };
    setExerciseTemplates(prev => [...prev, template]);
  };

  const removeExercise = (index: number) => {
    setExerciseTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseTemplate = (index: number, field: keyof ExerciseTemplate, value: any) => {
    setExerciseTemplates(prev => prev.map((template, i) => 
      i === index ? { ...template, [field]: value } : template
    ));
  };

  const updateSpecialConfig = (index: number, configField: string, value: any) => {
    const currentTemplate = exerciseTemplates[index];
    
    setExerciseTemplates(prev => {
      let newTemplates = prev.map((template, i) => 
        i === index ? { 
          ...template, 
          specialConfig: { 
            ...template.specialConfig, 
            [configField]: value 
          } 
        } : template
      );

      // Auto-create paired exercise for Superset
      if (currentTemplate.specialMethod === 'superset' && configField === 'pairedExerciseId' && value) {
        const pairedExercise = exercises?.find(ex => ex.id === value);
        if (pairedExercise) {
          // Check if paired exercise already exists in the session
          const existingPairedIndex = newTemplates.findIndex(template => template.exerciseId === value);
          
          if (existingPairedIndex === -1) {
            // Create new paired exercise template
            const pairedTemplate: ExerciseTemplate = {
              exerciseId: pairedExercise.id,
              exercise: pairedExercise,
              sets: currentTemplate.sets, // Same number of sets
              targetReps: currentTemplate.targetReps, // Same target reps
              restPeriod: currentTemplate.restPeriod, // Same rest period
              notes: `Superset pair with ${currentTemplate.exercise.name}`,
              specialMethod: 'superset',
              specialConfig: {
                pairedExerciseId: currentTemplate.exerciseId, // Reference back to original exercise
                restSeconds: currentTemplate.specialConfig?.restSeconds || 60
              }
            };
            
            // Insert the paired exercise immediately after the current exercise
            const insertIndex = index + 1;
            newTemplates = [
              ...newTemplates.slice(0, insertIndex),
              pairedTemplate,
              ...newTemplates.slice(insertIndex)
            ];
            
            toast({
              title: "Paired Exercise Added",
              description: `${pairedExercise.name} has been automatically added as your superset pair.`,
            });
          } else {
            // Update existing paired exercise to reference this exercise
            newTemplates[existingPairedIndex] = {
              ...newTemplates[existingPairedIndex],
              specialMethod: 'superset',
              specialConfig: {
                ...newTemplates[existingPairedIndex].specialConfig,
                pairedExerciseId: currentTemplate.exerciseId,
                restSeconds: currentTemplate.specialConfig?.restSeconds || 60
              },
              notes: `Superset pair with ${currentTemplate.exercise.name}`
            };
            
            toast({
              title: "Exercise Updated",
              description: `${pairedExercise.name} has been configured as your superset pair.`,
            });
          }
        }
      }

      return newTemplates;
    });
  };

  const getSpecialMethodDefaults = (method: string) => {
    switch (method) {
      case 'drop_set':
        return {
          drops: 2,
          weightReduction: 20
        };
      case 'rest_pause':
        return {
          pauseDuration: 15,
          totalReps: 20
        };
      case 'myorep_match':
        return {
          activationReps: 12,
          backoffReps: 3
        };
      case 'cluster_set':
        return {
          repsPerCluster: 3,
          clusters: 5,
          restBetween: 15
        };
      case 'giant_set':
        return {
          exerciseCount: 4,
          restBetweenExercises: 15
        };
      case 'tempo':
        return {
          eccentric: 3,
          pause: 1,
          concentric: 1
        };
      case 'lengthened_partials':
        return {
          partialReps: 5,
          rangeOfMotion: 'lengthened'
        };
      default:
        return {};
    }
  };

  const handleSpecialMethodChange = (index: number, method: string) => {
    const template = exerciseTemplates[index];
    if (method === 'none' || method === '') {
      updateExerciseTemplate(index, 'specialMethod', undefined);
      updateExerciseTemplate(index, 'specialConfig', undefined);
    } else {
      updateExerciseTemplate(index, 'specialMethod', method);
      updateExerciseTemplate(index, 'specialConfig', getSpecialMethodDefaults(method));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleSubmit = async () => {
    if (!sessionName.trim() || exerciseTemplates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a session name and add at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      name: sessionName.trim(),
      exercises: exerciseTemplates.map((template, index) => ({
        exerciseId: template.exerciseId,
        orderIndex: index + 1,
        sets: template.sets,
        targetReps: template.targetReps,
        restPeriod: template.restPeriod,
        notes: template.notes || null,
        specialMethod: template.specialMethod || null,
        specialConfig: template.specialConfig || null,
      })),
    };

    createWorkoutSessionMutation.mutate(sessionData);
  };

  const handleGoBack = () => {
    setLocation('/training');
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl pl-[5px] pr-[5px] pt-[16px] pb-[16px]">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Training
        </Button>
      </div>
      <div className="space-y-6">
        {/* Session Name */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="sessionName">Session Name *</Label>
              <Input
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Upper Body Push Day"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Exercises ({exerciseTemplates.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseLibrary(!showExerciseLibrary)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Exercises
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exercise Library */}
            {showExerciseLibrary && (
              <Card className="border-2 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 border-border/60 backdrop-blur-sm border-dashed pl-[0px] pr-[0px] ml-[-10px] mr-[-10px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Exercise Library
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[140px] h-8">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pl-[5px] pr-[5px]">
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {exercisesLoading ? (
                        <div className="col-span-full text-center py-4 text-muted-foreground">
                          Loading exercises...
                        </div>
                      ) : filteredExercises.length === 0 ? (
                        <div className="col-span-full text-center py-4 text-muted-foreground">
                          {searchTerm || selectedCategory !== "all" 
                            ? "No exercises found matching your filters" 
                            : "All available exercises have been added"}
                        </div>
                      ) : (
                        filteredExercises.map((exercise) => (
                          <Card key={exercise.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardHeader className="pb-2 ml-[0px] mr-[0px] pl-[10px] pr-[10px]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm leading-tight">{exercise.name}</CardTitle>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {exercise.category}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {exercise.primaryMuscle?.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs shrink-0"
                                  onClick={() => addExerciseFromLibrary(exercise)}
                                >
                                  Add
                                </Button>
                              </div>
                            </CardHeader>
                            {exercise.equipment && (
                              <CardContent className="pt-0 pb-2">
                                <p className="text-xs text-muted-foreground">
                                  {exercise.equipment}
                                </p>
                              </CardContent>
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
            
            {/* Selected Exercises */}
            {exerciseTemplates.map((template, index) => (
              <Card key={template.exerciseId} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{template.exercise.name}</CardTitle>
                        {template.specialMethod === 'superset' && template.specialConfig?.pairedExerciseId && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            <Plus className="h-2 w-2 mr-1" />
                            Superset
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {template.exercise.category}
                        </Badge>
                        <Badge className={getDifficultyColor(template.exercise.difficulty)}>
                          {template.exercise.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {template.exercise.primaryMuscle.replace('_', ' ')}
                        </Badge>
                      </div>
                      {template.specialMethod === 'superset' && template.specialConfig?.pairedExerciseId && (
                        <div className="mt-2 text-xs text-purple-400">
                          ↔ Paired with: {exercises?.find(ex => ex.id === template.specialConfig?.pairedExerciseId)?.name}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExercise(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={template.sets}
                        onChange={(e) => updateExerciseTemplate(index, 'sets', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Reps</Label>
                      <Input
                        value={template.targetReps}
                        onChange={(e) => updateExerciseTemplate(index, 'targetReps', e.target.value)}
                        placeholder="e.g., 8-12 or 10,10,8"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rest Period (seconds)</Label>
                      <Input
                        type="number"
                        min="30"
                        max="300"
                        value={template.restPeriod}
                        onChange={(e) => updateExerciseTemplate(index, 'restPeriod', parseInt(e.target.value) || 90)}
                      />
                    </div>
                  </div>
                  
                  {/* Special Training Method Selection */}
                  <div className="space-y-2">
                    <Label>Special Training Method (optional)</Label>
                    <Select 
                      value={template.specialMethod || "none"} 
                      onValueChange={(value) => handleSpecialMethodChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select special method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="drop_set">Drop Set</SelectItem>
                        <SelectItem value="rest_pause">Rest-Pause</SelectItem>
                        <SelectItem value="myorep_match">Myo-Reps</SelectItem>
                        <SelectItem value="cluster_set">Cluster Set</SelectItem>
                        <SelectItem value="giant_set">Giant Set</SelectItem>
                        <SelectItem value="tempo">Tempo</SelectItem>
                        <SelectItem value="lengthened_partials">Lengthened Partials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Method Configuration */}
                  {template.specialMethod && template.specialConfig && (
                    <div className="p-4 border bg-muted/50 space-y-3">
                      <h4 className="font-medium text-sm">
                        {template.specialMethod === 'drop_set' && 'Drop Set Configuration'}
                        {template.specialMethod === 'rest_pause' && 'Rest-Pause Configuration'}
                        {template.specialMethod === 'myorep_match' && 'Myo-Reps Configuration'}
                        {template.specialMethod === 'cluster_set' && 'Cluster Set Configuration'}
                        {template.specialMethod === 'giant_set' && 'Giant Set Configuration'}
                        {template.specialMethod === 'tempo' && 'Tempo Configuration'}
                        {template.specialMethod === 'lengthened_partials' && 'Lengthened Partials Configuration'}
                      </h4>
                      
                      {/* Drop Set Configuration */}
                      {template.specialMethod === 'drop_set' && template.specialConfig && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Drops</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={template.specialConfig.drops || 2}
                              onChange={(e) => updateSpecialConfig(index, 'drops', parseInt(e.target.value) || 2)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Weight Reduction (%)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="50"
                              value={template.specialConfig.weightReduction || 20}
                              onChange={(e) => updateSpecialConfig(index, 'weightReduction', parseInt(e.target.value) || 20)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rest-Pause Configuration */}
                      {template.specialMethod === 'rest_pause' && template.specialConfig && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Pause Duration (s)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="30"
                              value={template.specialConfig.pauseDuration || 15}
                              onChange={(e) => updateSpecialConfig(index, 'pauseDuration', parseInt(e.target.value) || 15)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total Reps</Label>
                            <Input
                              type="number"
                              min="15"
                              max="30"
                              value={template.specialConfig.totalReps || 20}
                              onChange={(e) => updateSpecialConfig(index, 'totalReps', parseInt(e.target.value) || 20)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Myo-Reps Configuration */}
                      {template.specialMethod === 'myorep_match' && template.specialConfig && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Activation Reps</Label>
                            <Input
                              type="number"
                              min="8"
                              max="20"
                              value={template.specialConfig.activationReps || 12}
                              onChange={(e) => updateSpecialConfig(index, 'activationReps', parseInt(e.target.value) || 12)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Backoff Reps</Label>
                            <Input
                              type="number"
                              min="2"
                              max="5"
                              value={template.specialConfig.backoffReps || 3}
                              onChange={(e) => updateSpecialConfig(index, 'backoffReps', parseInt(e.target.value) || 3)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Cluster Set Configuration */}
                      {template.specialMethod === 'cluster_set' && template.specialConfig && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Reps/Cluster</Label>
                            <Input
                              type="number"
                              min="1"
                              max="8"
                              value={template.specialConfig.repsPerCluster || 3}
                              onChange={(e) => updateSpecialConfig(index, 'repsPerCluster', parseInt(e.target.value) || 3)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Clusters</Label>
                            <Input
                              type="number"
                              min="2"
                              max="8"
                              value={template.specialConfig.clusters || 5}
                              onChange={(e) => updateSpecialConfig(index, 'clusters', parseInt(e.target.value) || 5)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest (s)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="30"
                              value={template.specialConfig.restBetween || 15}
                              onChange={(e) => updateSpecialConfig(index, 'restBetween', parseInt(e.target.value) || 15)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Giant Set Configuration */}
                      {template.specialMethod === 'giant_set' && template.specialConfig && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Exercise Count</Label>
                            <Input
                              type="number"
                              min="3"
                              max="6"
                              value={template.specialConfig.exerciseCount || 4}
                              onChange={(e) => updateSpecialConfig(index, 'exerciseCount', parseInt(e.target.value) || 4)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest Between (s)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="30"
                              value={template.specialConfig.restBetweenExercises || 15}
                              onChange={(e) => updateSpecialConfig(index, 'restBetweenExercises', parseInt(e.target.value) || 15)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tempo Configuration */}
                      {template.specialMethod === 'tempo' && template.specialConfig && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Eccentric (s)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="8"
                              value={template.specialConfig.eccentric || 3}
                              onChange={(e) => updateSpecialConfig(index, 'eccentric', parseInt(e.target.value) || 3)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Pause (s)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="3"
                              value={template.specialConfig.pause || 1}
                              onChange={(e) => updateSpecialConfig(index, 'pause', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Concentric (s)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="3"
                              value={template.specialConfig.concentric || 1}
                              onChange={(e) => updateSpecialConfig(index, 'concentric', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lengthened Partials Configuration */}
                      {template.specialMethod === 'lengthened_partials' && template.specialConfig && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Partial Reps</Label>
                            <Input
                              type="number"
                              min="3"
                              max="10"
                              value={template.specialConfig.partialReps || 5}
                              onChange={(e) => updateSpecialConfig(index, 'partialReps', parseInt(e.target.value) || 5)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Range of Motion</Label>
                            <Select
                              value={template.specialConfig.rangeOfMotion || 'lengthened'}
                              onValueChange={(value) => updateSpecialConfig(index, 'rangeOfMotion', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lengthened">Lengthened</SelectItem>
                                <SelectItem value="shortened">Shortened</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={template.notes}
                      onChange={(e) => updateExerciseTemplate(index, 'notes', e.target.value)}
                      placeholder="Add any special notes for this exercise..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {exerciseTemplates.length === 0 && (
              <Card className="p-8 text-center border-2 border-dashed">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No exercises added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding exercises from the library below
                </p>
                <Button onClick={() => setShowExerciseLibrary(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Exercise
                </Button>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Library */}
      {showExerciseLibrary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Exercise Library
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExerciseLibrary(false)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise List */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => addExercise(exercise)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {exercise.category} • {exercise.difficulty}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create Session Button */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => setLocation('/training')}
        >
          Cancel
        </Button>
        <Button
          onClick={createSession}
          disabled={createSessionMutation.isPending || !sessionName || exerciseTemplates.length === 0}
        >
          {createSessionMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Create Session
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}