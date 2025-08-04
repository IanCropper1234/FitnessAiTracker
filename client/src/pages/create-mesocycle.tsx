import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { ArrowLeft, Target, Dumbbell, Settings, Play, Loader2 } from "lucide-react";
// import { ExerciseSelector } from "@/components/ExerciseSelector";

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

interface WorkoutDay {
  name: string;
  muscleGroups: string[];
  exercises: Array<{
    id: number;
    name: string;
    sets: number;
    targetReps: string;
    restPeriod: number;
  }>;
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

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/training/templates'],
    enabled: buildMode === "template"
  });

  // Create mesocycle mutation
  const createMesocycleMutation = useMutation({
    mutationFn: async (mesocycleData: any) => {
      const response = await fetch('/api/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mesocycleData),
      });
      if (!response.ok) throw new Error('Failed to create mesocycle');
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
          exercises: []
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
                    {customProgram.weeklyStructure.map((day, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Input
                              value={day.name}
                              onChange={(e) => updateCustomWorkoutDay(index, "name", e.target.value)}
                              className="max-w-xs"
                            />
                            <Badge variant="outline">
                              Day {index + 1}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Target Muscle Groups</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                                {ALL_MUSCLE_GROUPS.map((muscle) => (
                                  <div key={muscle} className="flex items-center space-x-2 py-1">
                                    <Checkbox
                                      id={`${index}-${muscle}`}
                                      checked={day.muscleGroups.includes(muscle)}
                                      onCheckedChange={(checked) => {
                                        const newMuscleGroups = checked
                                          ? [...day.muscleGroups, muscle]
                                          : day.muscleGroups.filter(m => m !== muscle);
                                        updateCustomWorkoutDay(index, "muscleGroups", newMuscleGroups);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor={`${index}-${muscle}`} className="text-xs cursor-pointer flex-1">
                                      {MUSCLE_GROUP_DISPLAY_NAMES[muscle]}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Selected Muscle Groups</Label>
                              <div className="flex flex-wrap gap-1 mt-1 min-h-[40px] p-2 bg-muted/20">
                                {day.muscleGroups.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">No muscle groups selected</span>
                                ) : (
                                  day.muscleGroups.map((muscle) => (
                                    <Badge key={muscle} variant="secondary" className="text-xs">
                                      {MUSCLE_GROUP_DISPLAY_NAMES[muscle] || muscle}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Exercise Selection - Placeholder for now */}
                          <div className="mt-4">
                            <Label className="text-xs">Exercises</Label>
                            <div className="text-xs text-muted-foreground mt-1">
                              Exercise selection will be implemented in the full program builder
                            </div>
                          </div>
                          
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCustomWorkoutDay(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove Day
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
    </div>
  );
}