import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Target, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
  instructions: string;
  translations: Record<string, string>;
}

interface ExerciseTemplate {
  exerciseId: number;
  exercise: Exercise;
  sets: number;
  targetReps: string;
  restPeriod: number;
  notes: string;
}

interface WorkoutSessionCreatorProps {
  selectedExercises: Exercise[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkoutSessionCreator({ selectedExercises, isOpen, onClose, onSuccess }: WorkoutSessionCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionName, setSessionName] = useState("");
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  
  // Exercise library state
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 12;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Fetch exercises for the library
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises'],
    enabled: showExerciseLibrary || isOpen,
  });

  // Memoized: Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = debouncedSearchTerm === "" ||
        exercise.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (exercise.muscleGroups?.some(muscle => 
          muscle.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ));
      
      const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
      
      const alreadyAdded = exerciseTemplates.some(template => template.exerciseId === exercise.id);
      
      return matchesSearch && matchesCategory && !alreadyAdded;
    });
  }, [exercises, debouncedSearchTerm, selectedCategory, exerciseTemplates]);

  // Memoized: Paginated exercises
  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * exercisesPerPage;
    const endIndex = startIndex + exercisesPerPage;
    return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage, exercisesPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);

  const categories = ["all", "push", "pull", "legs", "cardio"];

  // Add exercise from library
  const addExerciseFromLibrary = (exercise: Exercise) => {
    const newTemplate: ExerciseTemplate = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 90,
      notes: ""
    };
    
    setExerciseTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your workout.`,
    });
  };

  // Update exercise templates when selectedExercises changes
  useEffect(() => {
    if (selectedExercises.length > 0) {
      setExerciseTemplates(
        selectedExercises.map(exercise => ({
          exerciseId: exercise.id,
          exercise,
          sets: 3,
          targetReps: "8-12",
          restPeriod: 90,
          notes: ""
        }))
      );
    } else {
      setExerciseTemplates([]);
    }
  }, [selectedExercises]);

  // Auto-open exercise library if no exercises are available
  useEffect(() => {
    if (isOpen && exerciseTemplates.length === 0 && selectedExercises.length === 0) {
      setShowExerciseLibrary(true);
    }
  }, [isOpen, exerciseTemplates.length, selectedExercises.length]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSessionName("");
      setShowExerciseLibrary(false);
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  const createWorkoutSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest("POST", "/api/training/sessions", sessionData);
    },
    onSuccess: () => {
      toast({
        title: "Workout Session Created",
        description: "Your workout session is ready to start!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      onSuccess();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workout session.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSessionName("");
    // Don't reset exerciseTemplates here as they come from props
  };

  const updateExerciseTemplate = (index: number, field: keyof ExerciseTemplate, value: any) => {
    setExerciseTemplates(prev => 
      prev.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    );
  };

  const removeExercise = (index: number) => {
    setExerciseTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a session name.",
        variant: "destructive",
      });
      return;
    }

    if (exerciseTemplates.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      userId: 1, // TODO: Get from auth context
      name: sessionName,
      exercises: exerciseTemplates.map((template, index) => ({
        exerciseId: template.exerciseId,
        orderIndex: index,
        sets: template.sets,
        targetReps: template.targetReps,
        restPeriod: template.restPeriod,
        notes: template.notes
      }))
    };

    createWorkoutSessionMutation.mutate(sessionData);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workout Session</DialogTitle>
          <DialogDescription>
            Configure your workout session with the selected exercises. Set target sets, reps, and rest periods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Name */}
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

          {/* Exercises */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Exercises ({exerciseTemplates.length})</h3>
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

            {/* Exercise Library */}
            {showExerciseLibrary && (
              <Card className="border-2 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 border-border/60 backdrop-blur-sm border-dashed pl-[0px] pr-[0px] ml-[-15px] mr-[-15px]">
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
                      <SelectContent className="z-[200]">
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Results Counter and Pagination Info */}
                  {filteredExercises.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-1 mb-4">
                      <span className="font-medium">
                        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
                        {totalPages > 1 && (
                          <span className="ml-2 text-xs opacity-75">
                            (Page {currentPage} of {totalPages})
                          </span>
                        )}
                      </span>
                      {totalPages > 1 && (
                        <span className="text-xs opacity-75">
                          Showing {Math.min((currentPage - 1) * exercisesPerPage + 1, filteredExercises.length)}-{Math.min(currentPage * exercisesPerPage, filteredExercises.length)} of {filteredExercises.length}
                        </span>
                      )}
                    </div>
                  )}

                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        paginatedExercises.map(exercise => (
                          <Card key={exercise.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardHeader className="pb-2">
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
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
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
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createWorkoutSessionMutation.isPending || exerciseTemplates.length === 0 || !sessionName.trim()}
          >
            {createWorkoutSessionMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}