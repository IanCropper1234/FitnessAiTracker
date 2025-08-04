import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Target, Dumbbell, Settings, Play, Loader2, ChevronLeft, ChevronRight, Plus, X, Search } from "lucide-react";

// Muscle group constants
const ALL_MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "abs", "quads", "hamstrings", "glutes", "calves"
] as const;

const MUSCLE_GROUP_DISPLAY_NAMES: Record<string, string> = {
  chest: "Chest",
  back: "Back", 
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves"
};

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
}

interface WorkoutDay {
  name: string;
  muscleGroups: string[];
  exercises: TemplateExercise[];
  estimatedDuration: number;
  focus: string[];
}

interface CustomProgram {
  weeklyStructure: WorkoutDay[];
}

export default function CreateMesocyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state
  const [mesocycleName, setMesocycleName] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(6);
  const [buildMode, setBuildMode] = useState<"template" | "custom">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [customProgram, setCustomProgram] = useState<CustomProgram>({
    weeklyStructure: []
  });
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/training/templates'],
    enabled: buildMode === "template"
  });

  // Fetch exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/exercises');
      return response.json();
    }
  });

  // Create mesocycle mutation
  const createMesocycleMutation = useMutation({
    mutationFn: async (mesocycleData: any) => {
      const response = await apiRequest('POST', '/api/mesocycles', mesocycleData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mesocycle created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles'] });
      setLocation('/training?tab=mesocycles');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mesocycle",
        variant: "destructive",
      });
    },
  });

  // Custom program handlers
  const addCustomWorkoutDay = () => {
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: [
        ...prev.weeklyStructure,
        {
          name: `Workout ${prev.weeklyStructure.length + 1}`,
          muscleGroups: [],
          exercises: [],
          estimatedDuration: 45,
          focus: []
        }
      ]
    }));
  };

  const updateCustomWorkoutDay = (index: number, field: keyof WorkoutDay, value: any) => {
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: prev.weeklyStructure.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    }));
  };

  const removeCustomWorkoutDay = (index: number) => {
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: prev.weeklyStructure.filter((_, i) => i !== index)
    }));
    if (currentWorkoutIndex >= index && currentWorkoutIndex > 0) {
      setCurrentWorkoutIndex(currentWorkoutIndex - 1);
    }
  };

  const addExerciseToCurrentWorkout = (exercise: Exercise) => {
    const newExercise: TemplateExercise = {
      id: Date.now(),
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 60,
      notes: "",
      specialTrainingMethod: "standard",
      specialMethodConfig: {}
    };

    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: prev.weeklyStructure.map((day, i) => 
        i === currentWorkoutIndex ? {
          ...day,
          exercises: [...day.exercises, newExercise]
        } : day
      )
    }));
    
    setShowExerciseSelector(false);
  };

  const removeExerciseFromWorkout = (workoutIndex: number, exerciseIndex: number) => {
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: prev.weeklyStructure.map((day, i) => 
        i === workoutIndex ? {
          ...day,
          exercises: day.exercises.filter((_, ei) => ei !== exerciseIndex)
        } : day
      )
    }));
  };

  const updateExercise = (workoutIndex: number, exerciseIndex: number, field: keyof TemplateExercise, value: any) => {
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: prev.weeklyStructure.map((day, i) => 
        i === workoutIndex ? {
          ...day,
          exercises: day.exercises.map((ex, ei) => 
            ei === exerciseIndex ? { ...ex, [field]: value } : ex
          )
        } : day
      )
    }));
  };

  const handleCreateMesocycle = () => {
    if (!mesocycleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mesocycle name",
        variant: "destructive",
      });
      return;
    }

    if (buildMode === "template" && !selectedTemplateId) {
      toast({
        title: "Error", 
        description: "Please select a training template",
        variant: "destructive",
      });
      return;
    }

    if (buildMode === "custom" && customProgram.weeklyStructure.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one workout day",
        variant: "destructive",
      });
      return;
    }

    const mesocycleData = {
      name: mesocycleName,
      totalWeeks,
      buildMode,
      templateId: buildMode === "template" ? selectedTemplateId : null,
      customProgram: buildMode === "custom" ? customProgram : null,
    };

    createMesocycleMutation.mutate(mesocycleData);
  };

  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/training?tab=mesocycles')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Mesocycle
          </h1>
          <p className="text-sm text-muted-foreground">
            Design your training program using proven RP methodology
          </p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mesocycleName">Mesocycle Name</Label>
                  <Input
                    id="mesocycleName"
                    placeholder="e.g., Hypertrophy Block 1"
                    value={mesocycleName}
                    onChange={(e) => setMesocycleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalWeeks">Duration (weeks)</Label>
                  <Select value={totalWeeks.toString()} onValueChange={(value) => setTotalWeeks(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 weeks</SelectItem>
                      <SelectItem value="6">6 weeks</SelectItem>
                      <SelectItem value="8">8 weeks</SelectItem>
                      <SelectItem value="12">12 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Build Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Design Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${buildMode === "template" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setBuildMode("template")}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Use Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Choose from proven RP training templates
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${buildMode === "custom" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setBuildMode("custom")}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Custom Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Build your own training program
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          {buildMode === "template" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Training Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template: any) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplateId === template.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.split}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.weeklyFrequency}x/week
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(template.targetMuscleGroups || []).slice(0, 3).map((muscle: string) => (
                              <Badge key={muscle} variant="secondary" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                            {(template.targetMuscleGroups || []).length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(template.targetMuscleGroups || []).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Program Builder */}
          {buildMode === "custom" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Weekly Training Structure</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={addCustomWorkoutDay}
                    disabled={customProgram.weeklyStructure.length >= 7}
                  >
                    Add Workout Day
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {customProgram.weeklyStructure.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No workout days added yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add Workout Day" to start building your program.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Workout Day Navigation */}
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWorkoutIndex(Math.max(0, currentWorkoutIndex - 1))}
                        disabled={currentWorkoutIndex === 0}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {customProgram.weeklyStructure[currentWorkoutIndex]?.name || `Day ${currentWorkoutIndex + 1}`}
                        </span>
                        <Badge variant="outline">
                          {currentWorkoutIndex + 1} of {customProgram.weeklyStructure.length}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWorkoutIndex(Math.min(customProgram.weeklyStructure.length - 1, currentWorkoutIndex + 1))}
                        disabled={currentWorkoutIndex === customProgram.weeklyStructure.length - 1}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Current Workout Configuration */}
                    {customProgram.weeklyStructure[currentWorkoutIndex] && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Input
                              value={customProgram.weeklyStructure[currentWorkoutIndex].name}
                              onChange={(e) => updateCustomWorkoutDay(currentWorkoutIndex, "name", e.target.value)}
                              className="max-w-xs font-medium"
                              placeholder="Workout name..."
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCustomWorkoutDay(currentWorkoutIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                              Remove Day
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Muscle Groups Selection */}
                          <div>
                            <Label className="text-sm font-medium">Target Muscle Groups</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                              {ALL_MUSCLE_GROUPS.map((muscle) => (
                                <div key={muscle} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${currentWorkoutIndex}-${muscle}`}
                                    checked={customProgram.weeklyStructure[currentWorkoutIndex].muscleGroups.includes(muscle)}
                                    onCheckedChange={(checked) => {
                                      const newMuscleGroups = checked
                                        ? [...customProgram.weeklyStructure[currentWorkoutIndex].muscleGroups, muscle]
                                        : customProgram.weeklyStructure[currentWorkoutIndex].muscleGroups.filter(m => m !== muscle);
                                      updateCustomWorkoutDay(currentWorkoutIndex, "muscleGroups", newMuscleGroups);
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor={`${currentWorkoutIndex}-${muscle}`} className="text-sm cursor-pointer">
                                    {MUSCLE_GROUP_DISPLAY_NAMES[muscle]}
                                  </label>
                                </div>
                              ))}
                            </div>
                            
                            {/* Selected Muscle Groups Display */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {customProgram.weeklyStructure[currentWorkoutIndex].muscleGroups.map((muscle) => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {MUSCLE_GROUP_DISPLAY_NAMES[muscle] || muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Exercises Section */}
                          <div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Exercises</Label>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowExerciseSelector(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Exercise
                              </Button>
                            </div>
                            
                            <div className="space-y-2 mt-2">
                              {customProgram.weeklyStructure[currentWorkoutIndex].exercises.length === 0 ? (
                                <Card className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground">No exercises added yet</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Click "Add Exercise" to start building this workout
                                  </p>
                                </Card>
                              ) : (
                                customProgram.weeklyStructure[currentWorkoutIndex].exercises.map((exercise, exerciseIndex) => (
                                  <Card key={exercise.id} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{exercise.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {exercise.muscleGroups.join(', ')}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs">
                                          <Input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateExercise(currentWorkoutIndex, exerciseIndex, 'sets', parseInt(e.target.value) || 1)}
                                            className="w-12 h-6 text-xs"
                                            min="1"
                                          />
                                          <span>×</span>
                                          <Input
                                            value={exercise.targetReps}
                                            onChange={(e) => updateExercise(currentWorkoutIndex, exerciseIndex, 'targetReps', e.target.value)}
                                            className="w-16 h-6 text-xs"
                                            placeholder="8-12"
                                          />
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeExerciseFromWorkout(currentWorkoutIndex, exerciseIndex)}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Selected Template */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Program Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Template:</span> {selectedTemplate.name}
                  </div>
                  <div>
                    <span className="font-medium">Split:</span> {selectedTemplate.split}
                  </div>
                  <div>
                    <span className="font-medium">Frequency:</span> {selectedTemplate.weeklyFrequency}x per week
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> ~{selectedTemplate.estimatedDuration} min/session
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-sm">Target Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedTemplate.targetMuscleGroups || []).map((muscle: string) => (
                      <Badge key={muscle} variant="outline" className="text-xs capitalize">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Fixed Action Buttons */}
      <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setLocation('/training?tab=mesocycles')}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateMesocycle}
          disabled={createMesocycleMutation.isPending}
          className="flex items-center gap-2"
        >
          {createMesocycleMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {createMesocycleMutation.isPending ? "Creating..." : "Start Mesocycle"}
        </Button>
      </div>

      {/* Exercise Selector Dialog */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Exercise</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExerciseSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Choose exercises for {customProgram.weeklyStructure[currentWorkoutIndex]?.name || `Day ${currentWorkoutIndex + 1}`}
              </p>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search exercises..."
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="pull">Pull</SelectItem>
                      <SelectItem value="legs">Legs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {exercises.slice(0, 20).map((exercise: any) => (
                      <Card key={exercise.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => addExerciseToCurrentWorkout(exercise)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{exercise.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {exercise.muscleGroups?.join(', ') || exercise.primaryMuscle}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}