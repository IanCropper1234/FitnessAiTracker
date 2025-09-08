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
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3);
  const [buildMode] = useState<"template">("template");
  const [dayTemplates, setDayTemplates] = useState<Record<number, number | null>>({});
  const [specialMethodStrategy, setSpecialMethodStrategy] = useState<string>("BALANCED");
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<string[]>([]);



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
      // Invalidate both mesocycles and sessions cache since new sessions are created
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
      setLocation('/training?tab=mesocycles');
    },
    onError: (error: any) => {
      console.error('Mesocycle creation error:', error);
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

    // Check if at least one day has a template assigned
    const assignedDays = Object.values(dayTemplates).filter(id => id !== null).length;
    if (assignedDays === 0) {
      toast({
        title: "Error", 
        description: "Please assign at least one workout template to a training day",
        variant: "destructive",
      });
      return;
    }

    const mesocycleData = {
      name: mesocycleName,
      totalWeeks,
      trainingDaysPerWeek,
      dayTemplates: dayTemplates,
      specialMethodStrategy,
      targetMuscleGroups
    };

    createMesocycleMutation.mutate(mesocycleData);
  };

  // Remove selectedTemplate as it's no longer needed

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
            Design your training program using proven evidence-based methodology
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingDays">Training Days per Week</Label>
                  <Select value={trainingDaysPerWeek.toString()} onValueChange={(value) => setTrainingDaysPerWeek(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="4">4 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="6">6 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Total Sessions</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm flex items-center">
                    {totalWeeks * trainingDaysPerWeek} sessions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Method Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Special Training Methods Distribution
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how special training methods (Drop Sets, MyoReps, etc.) are distributed across your program based on scientific evidence.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialMethodStrategy">Distribution Strategy</Label>
                <Select value={specialMethodStrategy} onValueChange={setSpecialMethodStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSERVATIVE">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Conservative (10-15%)</span>
                        <span className="text-xs text-muted-foreground">Beginner-friendly, focus on technique mastery</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BALANCED">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Balanced (20-30%)</span>
                        <span className="text-xs text-muted-foreground">Evidence-based mix optimizing stimulus-to-fatigue ratio</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="AGGRESSIVE">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Aggressive (35-50%)</span>
                        <span className="text-xs text-muted-foreground">Advanced trainees with high intensity tolerance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="SPECIALIZATION">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Muscle Specialization (40-60%)</span>
                        <span className="text-xs text-muted-foreground">Target specific muscle groups for enhanced development</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strategy Description */}
              {specialMethodStrategy && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm space-y-2">
                    {specialMethodStrategy === "CONSERVATIVE" && (
                      <>
                        <p className="font-medium text-blue-600">Conservative Distribution</p>
                        <p>• 10% MyoRep methods on accessories (weeks 4-6)</p>
                        <p>• Focus on technique mastery and adaptation</p>
                        <p>• Minimal fatigue accumulation</p>
                        <p className="text-xs text-muted-foreground">Based on beginner adaptation research</p>
                      </>
                    )}
                    {specialMethodStrategy === "BALANCED" && (
                      <>
                        <p className="font-medium text-green-600">Balanced Distribution</p>
                        <p>• 15% MyoReps + 10% Drop Sets + 8% Cluster Sets</p>
                        <p>• Phase-specific allocation (accumulation → intensification)</p>
                        <p>• Optimized stimulus-to-fatigue ratio</p>
                        <p className="text-xs text-muted-foreground">RP methodology - 20-30% special methods</p>
                      </>
                    )}
                    {specialMethodStrategy === "AGGRESSIVE" && (
                      <>
                        <p className="font-medium text-orange-600">Aggressive Distribution</p>
                        <p>• 20% MyoReps + 15% Drop Sets + 12% Cluster Sets + 8% Rest-Pause</p>
                        <p>• Higher intensity tolerance required</p>
                        <p>• Enhanced strength/power maintenance</p>
                        <p className="text-xs text-muted-foreground">Advanced trainee protocols</p>
                      </>
                    )}
                    {specialMethodStrategy === "SPECIALIZATION" && (
                      <>
                        <p className="font-medium text-purple-600">Muscle Specialization</p>
                        <p>• 25% MyoReps + 20% Drop Sets + 10% Giant Sets</p>
                        <p>• 50% increased volume for target muscles</p>
                        <p>• Multiple angle stimulation</p>
                        <p className="text-xs text-muted-foreground">Requires target muscle selection below</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Target Muscle Groups for Specialization */}
              {specialMethodStrategy === "SPECIALIZATION" && (
                <div className="space-y-2">
                  <Label>Target Muscle Groups for Specialization</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {ALL_MUSCLE_GROUPS.map((muscle) => (
                      <label key={muscle} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={targetMuscleGroups.includes(muscle)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetMuscleGroups([...targetMuscleGroups, muscle]);
                            } else {
                              setTargetMuscleGroups(targetMuscleGroups.filter(m => m !== muscle));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{MUSCLE_GROUP_DISPLAY_NAMES[muscle]}</span>
                      </label>
                    ))}
                  </div>
                  {targetMuscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {targetMuscleGroups.map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {MUSCLE_GROUP_DISPLAY_NAMES[muscle]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Scientific Foundation</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Distribution strategies are based on Renaissance Periodization methodology and 2024 meta-analysis research. 
                      Special methods are allocated based on fatigue management, phase periodization, and individual recovery capacity.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Day Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training Day Assignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign workout templates to each training day. Templates can be reused across multiple days.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: trainingDaysPerWeek }, (_, index) => {
                const dayNumber = index + 1;
                const selectedTemplateId = dayTemplates[dayNumber];
                const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                
                return (
                  <div key={dayNumber} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Day {dayNumber}</h4>
                      {selectedTemplate && (
                        <Badge variant="outline" className="text-xs">
                          {selectedTemplate.exerciseTemplates?.length || 0} exercises
                        </Badge>
                      )}
                    </div>
                    
                    <Select 
                      value={selectedTemplateId?.toString() || ""} 
                      onValueChange={(value) => {
                        if (value === "none") {
                          setDayTemplates(prev => ({ ...prev, [dayNumber]: null }));
                        } else {
                          setDayTemplates(prev => ({ ...prev, [dayNumber]: parseInt(value) }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template</SelectItem>
                        {templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name} ({template.exerciseTemplates?.length || 0} exercises)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedTemplate && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground mb-2">
                          <strong>{selectedTemplate.name}</strong> • {selectedTemplate.difficulty} • 
                          {selectedTemplate.estimatedDuration ? ` ~${selectedTemplate.estimatedDuration}min` : ''}
                        </div>
                        {selectedTemplate.exerciseTemplates && selectedTemplate.exerciseTemplates.length > 0 && (
                          <div className="text-xs space-y-1">
                            {selectedTemplate.exerciseTemplates.slice(0, 3).map((exercise: any, idx: number) => {
                              const exerciseData = exercises.find(e => e.id === exercise.exerciseId);
                              const exerciseName = exerciseData?.name || `Exercise ${exercise.exerciseId}`;
                              
                              // Format special training method display
                              const formatSpecialMethod = (method: string) => {
                                switch (method) {
                                  case 'myorep_match': return 'Myorep Match';
                                  case 'myorep_no_match': return 'Myorep No Match';
                                  case 'drop_set': return 'Drop Set';
                                  case 'giant_set': return 'Giant Set';
                                  case 'superset': return 'Superset';
                                  default: return method;
                                }
                              };
                              
                              return (
                                <div key={idx} className="text-muted-foreground">
                                  <div className="font-medium">{exerciseName}</div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span>{exercise.sets}×{exercise.targetReps}</span>
                                    {exercise.restPeriod && <span>• {exercise.restPeriod}s rest</span>}
                                    {exercise.specialMethod && (
                                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                        {formatSpecialMethod(exercise.specialMethod)}
                                      </span>
                                    )}
                                  </div>
                                  {exercise.notes && (
                                    <div className="text-xs text-muted-foreground/70 italic">
                                      "{exercise.notes}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {selectedTemplate.exerciseTemplates.length > 3 && (
                              <div className="text-muted-foreground">
                                +{selectedTemplate.exerciseTemplates.length - 3} more exercises...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Template Selection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Workout Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your saved workout session templates. Need more templates? 
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

          {/* Template Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Library</CardTitle>
              <p className="text-sm text-muted-foreground">
                Browse and preview your available workout templates.
              </p>
            </CardHeader>
            <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="ios-loading-dots flex items-center gap-1">
                      <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                      <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                      <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
                    </div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-2">No saved workout templates found</p>
                    <p className="text-xs">Save some workout sessions as templates from your training dashboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template: any) => {
                      const exerciseCount = template.exerciseTemplates?.length || 0;
                      const exerciseList = template.exerciseTemplates || [];
                      const isUsed = Object.values(dayTemplates).includes(template.id);
                      const usedDays = Object.entries(dayTemplates).filter(([_, templateId]) => templateId === template.id).map(([day]) => day);
                      const hasSpecialMethods = exerciseList.some((ex: any) => ex.specialMethod);
                      
                      return (
                        <Card key={template.id} className={`${isUsed ? "ring-1 ring-primary bg-primary/5" : ""}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              {template.name}
                              {isUsed && (
                                <Badge variant="secondary" className="text-xs">
                                  Day {usedDays.join(', ')}
                                </Badge>
                              )}
                            </CardTitle>
                            <div className="flex gap-2 flex-wrap">
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
                              {hasSpecialMethods && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                  Special Methods
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                              {template.description || 'Custom workout template'}
                            </p>
                            {exerciseList.length > 0 && (
                              <div className="space-y-1">
                                {exerciseList.slice(0, 3).map((ex: any, idx: number) => {
                                  const exerciseData = exercises.find(e => e.id === ex.exerciseId);
                                  const exerciseName = exerciseData?.name || `Exercise ${ex.exerciseId}`;
                                  
                                  return (
                                    <div key={idx} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground truncate">
                                          {exerciseName}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {ex.sets}×{ex.targetReps}
                                        </span>
                                        {ex.specialMethod && (
                                          <Badge variant="secondary" className="text-xs">
                                            {ex.specialMethod.replace('_', ' ')}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {exerciseList.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{exerciseList.length - 3} more exercises...
                                  </div>
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



          {/* Mesocycle Summary */}
          {Object.values(dayTemplates).some(id => id !== null) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mesocycle Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">Training Days:</span> {trainingDaysPerWeek} per week
                  </div>
                  <div>
                    <span className="font-medium">Total Duration:</span> {totalWeeks} weeks
                  </div>
                  <div>
                    <span className="font-medium">Total Sessions:</span> {totalWeeks * trainingDaysPerWeek}
                  </div>
                  <div>
                    <span className="font-medium">Assigned Days:</span> {Object.values(dayTemplates).filter(id => id !== null).length}/{trainingDaysPerWeek}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="font-medium text-sm">Weekly Schedule:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: trainingDaysPerWeek }, (_, index) => {
                      const dayNumber = index + 1;
                      const templateId = dayTemplates[dayNumber];
                      const template = templates.find(t => t.id === templateId);
                      
                      return (
                        <div key={dayNumber} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                          <span className="font-medium">Day {dayNumber}:</span>
                          <span className="text-muted-foreground">
                            {template ? `${template.name} (${template.exerciseTemplates?.length || 0} exercises)` : 'No template assigned'}
                          </span>
                        </div>
                      );
                    })}
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
            <div className="ios-loading-dots flex items-center gap-1">
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          ) : (
            <Play className="h-4 w-4" />
          )}
          {createMesocycleMutation.isPending ? "Creating..." : "Start Mesocycle"}
        </Button>
      </div>


    </div>
  );
}