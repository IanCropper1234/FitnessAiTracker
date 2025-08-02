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
import { Search, Filter, Plus, Trash2, Target, ArrowLeft, Dumbbell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
      const response = await fetch('/api/training/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create workout session');
      }
      
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
      exercises: exerciseTemplates.map(template => ({
        exerciseId: template.exerciseId,
        sets: template.sets,
        targetReps: template.targetReps,
        restPeriod: template.restPeriod,
        notes: template.notes || null,
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
                      <CardTitle className="text-base">{template.exercise.name}</CardTitle>
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