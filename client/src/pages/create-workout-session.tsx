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
  
  // Pagination state for exercise library
  const [currentPage, setCurrentPage] = useState(1);
  const EXERCISES_PER_PAGE = 12; // 3x4 grid, optimal for memory usage

  // Load exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises'],
  });

  // Categories for filtering
  const categories = useMemo(() => {
    const unique = new Set(exercises.map((exercise) => exercise.category));
    return ["all", ...Array.from(unique).sort()];
  }, [exercises]);

  // Filter exercises based on search term and category
  const filteredExercises = useMemo(() => {
    const alreadySelectedIds = new Set(exerciseTemplates.map(template => template.exerciseId));
    
    return exercises.filter((exercise) => {
      // Skip already selected exercises
      if (alreadySelectedIds.has(exercise.id)) return false;
      
      // Filter by category
      if (selectedCategory !== "all" && exercise.category !== selectedCategory) return false;
      
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          exercise.name.toLowerCase().includes(term) ||
          exercise.category.toLowerCase().includes(term) ||
          exercise.primaryMuscle.toLowerCase().includes(term) ||
          (exercise.equipment && exercise.equipment.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [exercises, exerciseTemplates, searchTerm, selectedCategory]);

  // Paginated exercises for memory optimization
  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
    const endIndex = startIndex + EXERCISES_PER_PAGE;
    return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage, EXERCISES_PER_PAGE]);

  const totalPages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Handle search with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle category change with pagination reset
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

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

  // Save workout template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest("POST", "/api/training/saved-workout-templates", templateData);
    },
    onSuccess: (data) => {
      toast({
        title: "Template Saved!",
        description: `${sessionName} has been saved as a reusable template.`,
      });
      
      // Invalidate cache to refresh saved templates
      queryClient.invalidateQueries({ queryKey: ["/api/training/saved-workout-templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save workout template.",
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
      case 'myorep_match':
        return {
          activationSet: true,
          targetReps: 15,
          restSeconds: 20,
          miniSets: 3
        };
      case 'myorep_no_match':
        return {
          activationSet: true,
          restSeconds: 20,
          miniSets: 3
        };
      case 'drop_set':
        return {
          dropSets: 3,
          weightReductions: [15, 15, 15],
          dropSetWeights: [0, 0, 0],
          dropSetReps: [8, 8, 8],
          dropRestSeconds: 10
        };
      case 'giant_set':
        return {
          totalTargetReps: 40,
          miniSetReps: 8,
          restSeconds: 15
        };
      case 'superset':
        return {
          pairedExerciseId: null,
          restSeconds: 60
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

  const handleSaveAsTemplate = async () => {
    if (!sessionName.trim() || exerciseTemplates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a session name and add at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    // Estimate duration based on exercises and rest periods
    const estimatedDuration = exerciseTemplates.reduce((total, template) => {
      // Rough calculation: sets * (45s exercise + rest period)
      return total + (template.sets * (45 + template.restPeriod)) / 60;
    }, 0);

    const templateData = {
      name: sessionName.trim(),
      description: `Custom workout template with ${exerciseTemplates.length} exercises`,
      exerciseTemplates: exerciseTemplates.map((template) => ({
        exerciseId: template.exerciseId,
        exercise: template.exercise,
        sets: template.sets,
        targetReps: template.targetReps,
        restPeriod: template.restPeriod,
        notes: template.notes || "",
        specialMethod: template.specialMethod || null,
        specialConfig: template.specialConfig || null,
      })),
      tags: [
        // Auto-generate tags based on exercises
        ...Array.from(new Set(exerciseTemplates.map(t => t.exercise.category)))
      ],
      estimatedDuration: Math.round(estimatedDuration),
      difficulty: 'intermediate'
    };

    saveTemplateMutation.mutate(templateData);
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
          <CardContent className="p-5 space-y-4 pl-[10px] pr-[10px] pt-[5px] pb-[5px]">
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
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
                        paginatedExercises.map((exercise) => (
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
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center px-4 py-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-2"
                        >
                          &lt;
                        </Button>
                        <span className="px-2 py-1 text-sm font-medium">
                          {currentPage}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-2"
                        >
                          &gt;
                        </Button>
                      </div>
                    </div>
                  )}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          updateExerciseTemplate(index, 'sets', value === '' ? '' : (parseInt(value) || 1));
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          updateExerciseTemplate(index, 'restPeriod', value === '' ? '' : (parseInt(value) || 90));
                        }}
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
                        <SelectItem value="myorep_match">Myorep Match</SelectItem>
                        <SelectItem value="myorep_no_match">Myorep No Match</SelectItem>
                        <SelectItem value="drop_set">Drop Set</SelectItem>
                        <SelectItem value="giant_set">Giant Set</SelectItem>
                        <SelectItem value="superset">Superset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Method Configuration */}
                  {template.specialMethod && template.specialConfig && (
                    <div className="p-4 border bg-muted/50 space-y-3">
                      <h4 className="font-medium text-sm">
                        {template.specialMethod === 'myorep_match' && 'Myorep Match Configuration'}
                        {template.specialMethod === 'myorep_no_match' && 'Myorep No Match Configuration'}
                        {template.specialMethod === 'drop_set' && 'Drop Set Configuration'}
                        {template.specialMethod === 'giant_set' && 'Giant Set Configuration'}
                        {template.specialMethod === 'superset' && 'Superset Configuration'}
                      </h4>
                      
                      {/* Myorep Match Configuration */}
                      {template.specialMethod === 'myorep_match' && template.specialConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Target Reps</Label>
                            <Input
                              type="number"
                              min="10"
                              max="20"
                              value={template.specialConfig.targetReps ?? 15}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'targetReps', value === '' ? '' : (parseInt(value) || 15));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mini Sets</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={template.specialConfig.miniSets ?? 3}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'miniSets', value === '' ? '' : (parseInt(value) || 3));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest (seconds)</Label>
                            <Input
                              type="number"
                              min="15"
                              max="30"
                              value={template.specialConfig.restSeconds ?? 20}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'restSeconds', value === '' ? '' : (parseInt(value) || 20));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Myorep No Match Configuration */}
                      {template.specialMethod === 'myorep_no_match' && template.specialConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Mini Sets</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={template.specialConfig.miniSets ?? 3}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'miniSets', value === '' ? '' : (parseInt(value) || 3));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest (seconds)</Label>
                            <Input
                              type="number"
                              min="15"
                              max="30"
                              value={template.specialConfig.restSeconds ?? 20}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'restSeconds', value === '' ? '' : (parseInt(value) || 20));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Drop Set Configuration */}
                      {template.specialMethod === 'drop_set' && template.specialConfig && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Number of Drop Sets</Label>
                            <Select
                              value={(template.specialConfig?.dropSets || 3).toString()}
                              onValueChange={(value) => {
                                const dropSets = parseInt(value);
                                const currentReductions = template.specialConfig?.weightReductions || [15, 15, 15];
                                const currentReps = template.specialConfig?.dropSetReps || [8, 8, 8];
                                const newReductions = Array(dropSets).fill(0).map((_, i) => currentReductions[i] || 15);
                                const newReps = Array(dropSets).fill(0).map((_, i) => currentReps[i] || 8);
                                updateSpecialConfig(index, 'dropSets', dropSets);
                                updateSpecialConfig(index, 'weightReductions', newReductions);
                                updateSpecialConfig(index, 'dropSetReps', newReps);
                              }}
                            >
                              <SelectTrigger className="w-32">
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
                          <div className="space-y-1">
                            <Label className="text-xs">Weight Reductions (%)</Label>
                            <div className="flex gap-2 flex-wrap">
                              {Array(template.specialConfig?.dropSets || 3).fill(0).map((_, dropIndex) => (
                                <Input
                                  key={dropIndex}
                                  type="number"
                                  min="5"
                                  max="30"
                                  value={(template.specialConfig?.weightReductions ?? [])[dropIndex] ?? 15}
                                  onChange={(e) => {
                                    const newReductions = [...(template.specialConfig?.weightReductions || Array(template.specialConfig?.dropSets || 3).fill(15))];
                                    const value = e.target.value;
                                    newReductions[dropIndex] = value === '' ? '' : (parseInt(value) || 15);
                                    updateSpecialConfig(index, 'weightReductions', newReductions);
                                  }}
                                  className="w-20"
                                  placeholder={`Drop ${dropIndex + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Target Reps per Drop Set</Label>
                            <div className="flex gap-2 flex-wrap">
                              {Array(template.specialConfig?.dropSets || 3).fill(0).map((_, dropIndex) => (
                                <Input
                                  key={dropIndex}
                                  type="number"
                                  min="5"
                                  max="20"
                                  value={(template.specialConfig?.dropSetReps ?? [])[dropIndex] ?? 8}
                                  onChange={(e) => {
                                    const newReps = [...(template.specialConfig?.dropSetReps || Array(template.specialConfig?.dropSets || 3).fill(8))];
                                    const value = e.target.value;
                                    newReps[dropIndex] = value === '' ? '' : (parseInt(value) || 8);
                                    updateSpecialConfig(index, 'dropSetReps', newReps);
                                  }}
                                  className="w-20"
                                  placeholder={`Reps ${dropIndex + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest Between Drops (seconds)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="15"
                              value={template.specialConfig?.dropRestSeconds ?? 10}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'dropRestSeconds', value === '' ? '' : (parseInt(value) || 10));
                              }}
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}

                      {/* Giant Set Configuration */}
                      {template.specialMethod === 'giant_set' && template.specialConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Total Target Reps</Label>
                            <Input
                              type="number"
                              min="30"
                              max="60"
                              value={template.specialConfig?.totalTargetReps ?? 40}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'totalTargetReps', value === '' ? '' : (parseInt(value) || 40));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mini Set Reps</Label>
                            <Input
                              type="number"
                              min="5"
                              max="15"
                              value={template.specialConfig?.miniSetReps ?? 8}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'miniSetReps', value === '' ? '' : (parseInt(value) || 8));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest (seconds)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="15"
                              value={template.specialConfig?.restSeconds ?? template.specialConfig?.giantRestSeconds ?? 15}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'restSeconds', value === '' ? '' : (parseInt(value) || 15));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Superset Configuration */}
                      {template.specialMethod === 'superset' && template.specialConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Paired Exercise</Label>
                            <Popover 
                              open={pairedExerciseSearchOpen === index} 
                              onOpenChange={(open) => setPairedExerciseSearchOpen(open ? index : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={pairedExerciseSearchOpen === index}
                                  className="w-full justify-between"
                                >
                                  {template.specialConfig?.pairedExerciseId
                                    ? exercises?.find(ex => ex.id === template.specialConfig?.pairedExerciseId)?.name
                                    : "Select paired exercise..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search exercises..." />
                                  <CommandEmpty>No exercise found.</CommandEmpty>
                                  <CommandGroup className="max-h-60 overflow-auto">
                                    {exercises?.filter(ex => ex.id !== template.exerciseId).map(exercise => (
                                      <CommandItem
                                        key={exercise.id}
                                        value={exercise.name}
                                        onSelect={() => {
                                          updateSpecialConfig(index, 'pairedExerciseId', exercise.id);
                                          setPairedExerciseSearchOpen(null);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            template.specialConfig?.pairedExerciseId === exercise.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{exercise.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {exercise.primaryMuscle} • {exercise.category}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rest Between Sets (seconds)</Label>
                            <Input
                              type="number"
                              min="30"
                              max="120"
                              value={template.specialConfig?.restSeconds ?? 60}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateSpecialConfig(index, 'restSeconds', value === '' ? '' : (parseInt(value) || 60));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Show method description */}
                      <div className="text-xs text-muted-foreground">
                        {template.specialMethod === 'myorep_match' && 'Myorep Match: Perform activation set to near failure, then complete mini-sets matching the target reps until you can no longer achieve the target.'}
                        {template.specialMethod === 'myorep_no_match' && 'Myorep No Match: Perform activation set to near failure, then complete mini-sets with as many reps as possible until significant drop-off.'}
                        {template.specialMethod === 'drop_set' && 'Drop Set: Perform set to failure, then immediately reduce weight and continue for additional sets.'}
                        {template.specialMethod === 'giant_set' && 'Giant Set: Perform one exercise with very short rest periods between mini-sets to accumulate high volume.'}
                        {template.specialMethod === 'superset' && 'Superset: Pair two exercises performed back-to-back with minimal rest between them, targeting different muscle groups for efficiency.'}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={template.notes}
                      onChange={(e) => updateExerciseTemplate(index, 'notes', e.target.value)}
                      placeholder="Any specific instructions or modifications..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {exerciseTemplates.length === 0 && !showExerciseLibrary && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium mb-1">No exercises selected</p>
                <p className="text-sm">Click "Add Exercises" to select from the exercise library</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            Cancel
          </Button>
          <Button 
            type="button"
            variant="secondary"
            onClick={handleSaveAsTemplate}
            disabled={saveTemplateMutation.isPending || exerciseTemplates.length === 0 || !sessionName.trim()}
            className="w-full sm:w-auto"
          >
            {saveTemplateMutation.isPending ? "Saving..." : "Save as Template"}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createWorkoutSessionMutation.isPending || exerciseTemplates.length === 0 || !sessionName.trim()}
            className="w-full sm:w-auto"
          >
            {createWorkoutSessionMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </div>
    </div>
  );
}