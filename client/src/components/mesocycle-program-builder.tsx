import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { ExerciseSelector } from "./exercise-selector";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Target, Dumbbell, Play, Settings } from "lucide-react";

interface MesocycleProgramBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onCreateSuccess: () => void;
}

interface TrainingTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  split: string;
  weeklyFrequency: number;
  targetMuscleGroups?: string[];
  estimatedDuration: number;
}

interface SelectedExercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[] | null;
  primaryMuscle: string;
  equipment: string | null;
  difficulty: string | null;
  sets: number;
  targetReps: string;
  restPeriod: number;
}

interface CustomProgram {
  weeklyStructure: {
    dayOfWeek: number;
    name: string;
    muscleGroups: string[];
    exercises: SelectedExercise[];
  }[];
  specialization?: string[];
  frequency: number;
}

export default function MesocycleProgramBuilder({
  isOpen,
  onClose,
  userId,
  onCreateSuccess
}: MesocycleProgramBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mesocycleName, setMesocycleName] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(6);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [buildMode, setBuildMode] = useState<"template" | "custom">("template");
  const [customProgram, setCustomProgram] = useState<CustomProgram>({
    weeklyStructure: [],
    frequency: 4
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Get available training templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<TrainingTemplate[]>({
    queryKey: ['/api/training/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/templates');
      return response.json();
    },
  });

  // Get exercises for custom program builder
  const { data: exercises = [] } = useQuery({
    queryKey: ['/api/exercises'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exercises');
      return response.json();
    },
  });

  const createMesocycleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/training/mesocycles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mesocycle Created!",
        description: "Your training program has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles'] });
      onCreateSuccess();
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mesocycle.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setMesocycleName("");
    setTotalWeeks(6);
    setSelectedTemplateId(null);
    setBuildMode("template");
    setCustomProgram({ weeklyStructure: [], frequency: 4 });
    onClose();
  };

  const handleCreateMesocycle = () => {
    if (!mesocycleName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a mesocycle name.",
        variant: "destructive",
      });
      return;
    }

    if (buildMode === "template" && !selectedTemplateId) {
      toast({
        title: "Missing Selection",
        description: "Please select a training template.",
        variant: "destructive",
      });
      return;
    }

    if (buildMode === "custom" && customProgram.weeklyStructure.length === 0) {
      toast({
        title: "Missing Program",
        description: "Please design your custom training program.",
        variant: "destructive",
      });
      return;
    }

    const mesocycleData = {
      userId,
      name: mesocycleName,
      totalWeeks,
      templateId: buildMode === "template" ? selectedTemplateId : null,
      customProgram: buildMode === "custom" ? customProgram : null,
    };

    createMesocycleMutation.mutate(mesocycleData);
  };

  const addCustomWorkoutDay = () => {
    const newDay = {
      dayOfWeek: customProgram.weeklyStructure.length,
      name: `Workout ${String.fromCharCode(65 + customProgram.weeklyStructure.length)}`,
      muscleGroups: [],
      exercises: []
    };
    
    setCustomProgram(prev => ({
      ...prev,
      weeklyStructure: [...prev.weeklyStructure, newDay]
    }));
  };

  const updateCustomWorkoutDay = (index: number, field: string, value: any) => {
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Mesocycle
          </DialogTitle>
          <DialogDescription>
            Design your training program using proven RP methodology. Choose from templates or build custom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
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

          <Separator />

          {/* Build Mode Selection */}
          <div className="space-y-4">
            <Label>Program Design Method</Label>
            <div className="flex gap-4">
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
          </div>

          {/* Template Selection */}
          {buildMode === "template" && (
            <div className="space-y-4">
              <Label>Training Templates</Label>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
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
                          {(template.targetMuscleGroups || []).slice(0, 3).map((muscle) => (
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
            </div>
          )}

          {/* Custom Program Builder */}
          {buildMode === "custom" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Weekly Training Structure</Label>
                <Button 
                  size="sm" 
                  onClick={addCustomWorkoutDay}
                  disabled={customProgram.weeklyStructure.length >= 7}
                >
                  Add Workout Day
                </Button>
              </div>

              {customProgram.weeklyStructure.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No workout days added yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Add Workout Day" to start building your program.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Target Muscle Groups</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["chest", "shoulders", "triceps", "lats", "rhomboids", "biceps", "quads", "hamstrings", "glutes", "calves"].map((muscle) => (
                                <div key={muscle} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`${index}-${muscle}`}
                                    checked={day.muscleGroups.includes(muscle)}
                                    onCheckedChange={(checked) => {
                                      const newMuscleGroups = checked
                                        ? [...day.muscleGroups, muscle]
                                        : day.muscleGroups.filter(m => m !== muscle);
                                      updateCustomWorkoutDay(index, "muscleGroups", newMuscleGroups);
                                    }}
                                  />
                                  <label htmlFor={`${index}-${muscle}`} className="text-xs capitalize">
                                    {muscle}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Selected Muscle Groups</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {day.muscleGroups.map((muscle) => (
                                <Badge key={muscle} variant="secondary" className="text-xs capitalize">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Exercise Selection */}
                        <div className="mt-4">
                          <ExerciseSelector
                            selectedExercises={day.exercises}
                            onExercisesChange={(exercises) => updateCustomWorkoutDay(index, "exercises", exercises)}
                            targetMuscleGroups={day.muscleGroups}
                          />
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
            </div>
          )}

          {/* Preview Selected Template */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Program Preview</CardTitle>
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
                    {(selectedTemplate.targetMuscleGroups || []).map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-xs capitalize">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMesocycle}
              disabled={createMesocycleMutation.isPending}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {createMesocycleMutation.isPending ? "Creating..." : "Start Mesocycle"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}