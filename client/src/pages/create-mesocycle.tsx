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

import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Target, Dumbbell, Play, Loader2 } from "lucide-react";

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



export default function CreateMesocyclePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state
  const [mesocycleName, setMesocycleName] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(6);
  const [buildMode] = useState<"template">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);



  // Fetch saved workout templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/training/saved-workout-templates']
  });

  // Fetch exercises for template preview
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ['/api/training/exercises']
  });



  // Create mesocycle mutation
  const createMesocycleMutation = useMutation({
    mutationFn: async (mesocycleData: any) => {
      const response = await apiRequest('POST', '/api/training/mesocycles', mesocycleData);
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



  const handleCreateMesocycle = () => {
    if (!mesocycleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mesocycle name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Error", 
        description: "Please select a workout template",
        variant: "destructive",
      });
      return;
    }

    const mesocycleData = {
      name: mesocycleName,
      totalWeeks,
      templateId: selectedTemplateId // This will be the saved workout template ID
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

          {/* Template Selection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved Workout Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose from your saved workout session templates. Need more templates? 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary underline" 
                  onClick={() => setLocation('/training')}
                >
                  Save workout sessions as templates
                </Button> from your training dashboard.
              </p>
            </CardHeader>
          </Card>

          {/* Available Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Workout Templates</CardTitle>
            </CardHeader>
            <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-2">No saved workout templates found</p>
                    <p className="text-xs">Save some workout sessions as templates from your training dashboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template: any) => {
                      const exerciseCount = template.exerciseTemplates?.length || 0;
                      const exerciseList = template.exerciseTemplates || [];
                      
                      return (
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
                                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.difficulty}
                              </Badge>
                              {template.estimatedDuration && (
                                <Badge variant="outline" className="text-xs">
                                  ~{template.estimatedDuration}min
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                              {template.description || 'Custom workout template'}
                            </p>
                            {exerciseList.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Exercises:</span>{' '}
                                {exerciseList.slice(0, 2).map((ex: any, idx: number) => 
                                  `${ex.sets}x${ex.targetReps}`
                                ).join(', ')}
                                {exerciseList.length > 2 && ` +${exerciseList.length - 2} more`}
                              </div>
                            )}
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.tags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{template.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>



          {/* Preview Selected Template */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Template:</span> {selectedTemplate.name}
                  </div>
                  <div>
                    <span className="font-medium">Exercises:</span> {selectedTemplate.exerciseTemplates?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span> {selectedTemplate.difficulty}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> ~{selectedTemplate.estimatedDuration || 'N/A'} min
                  </div>
                </div>
                {selectedTemplate.exerciseTemplates && selectedTemplate.exerciseTemplates.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-sm">Exercises:</span>
                    <div className="mt-2 space-y-1">
                      {selectedTemplate.exerciseTemplates.slice(0, 5).map((exercise: any, index: number) => {
                        const exerciseData = exercises.find(e => e.id === exercise.exerciseId);
                        const exerciseName = exerciseData?.name || `Exercise ${exercise.exerciseId}`;
                        
                        return (
                          <div key={index} className="text-xs bg-muted p-2 rounded">
                            <span className="font-medium">{exerciseName}</span>
                            <span className="text-muted-foreground ml-2">
                              {exercise.sets} sets × {exercise.targetReps} reps
                              {exercise.restPeriod && ` • ${exercise.restPeriod}s rest`}
                              {exercise.specialMethod && ` • ${exercise.specialMethod}`}
                            </span>
                          </div>
                        );
                      })}
                      {selectedTemplate.exerciseTemplates.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{selectedTemplate.exerciseTemplates.length - 5} more exercises...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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


    </div>
  );
}