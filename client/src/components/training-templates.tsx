import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  CheckCircle2,
  Star,
  TrendingUp,
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TrainingTemplate {
  id: number;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  specialization: string;
  createdBy?: 'system' | 'user';
  userId?: number;
  templateData: {
    workouts: Array<{
      name: string;
      exercises: Array<{
        exerciseName: string;
        sets: number;
        repsRange: string;
        restPeriod: number;
      }>;
      estimatedDuration: number;
      focus: string[];
    }>;
  };
  rpMethodology: {
    volumeGuidelines: Record<string, { mev: number; mav: number; mrv: number }>;
    progressionRules: string[];
    deloadGuidelines: string[];
  };
}

interface TrainingTemplatesProps {
  userId: number;
  onTemplateSelect?: (template: TrainingTemplate) => void;
}

export default function TrainingTemplates({ userId, onTemplateSelect }: TrainingTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get available templates (includes user templates)
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/training/templates', selectedCategory, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('userId', userId.toString());
      
      const response = await apiRequest('GET', `/api/training/templates?${params.toString()}`);
      return response.json();
    },
  });

  // Generate workout from template
  const generateWorkoutMutation = useMutation({
    mutationFn: async (data: { templateId: number; workoutDay: number }) => {
      const response = await apiRequest('POST', '/api/training/templates/generate-workout', { userId, ...data });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Workout Created",
        description: data.message || "Workout generated and added to your sessions",
      });
      // Invalidate training sessions to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/training/templates', {
        userId,
        ...templateData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Your custom training template has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
      setShowCreateDialog(false);
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number; updateData: any }) => {
      const response = await apiRequest('PUT', `/api/training/templates/${data.templateId}`, data.updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Your training template has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
      setEditingTemplate(null);
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest('DELETE', `/api/training/templates/${templateId}`, { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Your training template has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDifficultyStars = (category: string) => {
    const stars = category === 'beginner' ? 1 : category === 'intermediate' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Training Templates</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from RP-based templates or create your own custom training programs
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </DialogTrigger>
            <CreateTemplateDialog 
              userId={userId}
              createMutation={createTemplateMutation}
              onClose={() => setShowCreateDialog(false)}
            />
          </Dialog>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: TrainingTemplate) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.createdBy === 'user' && (
                      <Badge variant="outline" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <div className="flex items-center">
                      {getDifficultyStars(template.category)}
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Template Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{template.daysPerWeek} days/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="capitalize">{template.specialization}</span>
                </div>
              </div>

              {/* Workout Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Workouts Preview:</h4>
                <div className="space-y-1">
                  {template.templateData.workouts.slice(0, 2).map((workout, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="font-medium">{workout.name}</span>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{workout.estimatedDuration}min</span>
                      </div>
                    </div>
                  ))}
                  {template.templateData.workouts.length > 2 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{template.templateData.workouts.length - 2} more workouts
                    </p>
                  )}
                </div>
              </div>

              {/* RP Methodology Highlights */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  RP Methodology
                </h4>
                <div className="text-xs space-y-1">
                  {template.rpMethodology.progressionRules.slice(0, 2).map((rule, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => generateWorkoutMutation.mutate({ templateId: template.id, workoutDay: 0 })}
                  disabled={generateWorkoutMutation.isPending}
                >
                  <Dumbbell className="h-4 w-4 mr-1" />
                  {generateWorkoutMutation.isPending ? "Creating..." : "Start Workout"}
                </Button>
                
                {/* User template management */}
                {template.createdBy === 'user' && template.userId === userId && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {onTemplateSelect && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onTemplateSelect(template)}
                  >
                    Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory === 'all' 
              ? "No training templates are available yet." 
              : `No ${selectedCategory} templates are available.`}
          </p>
        </div>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <EditTemplateDialog 
          template={editingTemplate}
          updateMutation={updateTemplateMutation}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

// Template Detail Modal Component
export function TemplateDetailModal({ 
  template, 
  isOpen, 
  onClose, 
  userId 
}: { 
  template: TrainingTemplate | null; 
  isOpen: boolean; 
  onClose: () => void;
  userId: number;
}) {
  const queryClient = useQueryClient();

  const generateWorkoutMutation = useMutation({
    mutationFn: (data: { templateId: number; workoutDay: number }) =>
      apiRequest('/api/training/templates/generate-workout', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
      onClose();
    },
  });

  if (!template || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="workouts" className="w-full">
            <TabsList>
              <TabsTrigger value="workouts">Workouts</TabsTrigger>
              <TabsTrigger value="methodology">RP Methodology</TabsTrigger>
              <TabsTrigger value="volume">Volume Guidelines</TabsTrigger>
            </TabsList>

            <TabsContent value="workouts" className="space-y-4">
              {template.templateData.workouts.map((workout, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{workout.estimatedDuration} min</span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => generateWorkoutMutation.mutate({ templateId: template.id, workoutDay: index })}
                          disabled={generateWorkoutMutation.isPending}
                        >
                          Start This Workout
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {workout.focus.map((focus, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workout.exercises.map((exercise, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-medium">{exercise.exerciseName}</span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {exercise.sets} × {exercise.repsRange} | {exercise.restPeriod}s rest
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="methodology" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progression Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {template.rpMethodology.progressionRules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Deload Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {template.rpMethodology.deloadGuidelines.map((guideline, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>RP Volume Landmarks</CardTitle>
                  <CardDescription>
                    Minimum Effective Volume (MEV), Maximum Adaptive Volume (MAV), and Maximum Recoverable Volume (MRV) per muscle group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(template.rpMethodology.volumeGuidelines).map(([muscle, volumes]) => (
                      <div key={muscle} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium capitalize mb-2">{muscle}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>MEV:</span>
                            <span className="font-medium">{volumes.mev} sets/week</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MAV:</span>
                            <span className="font-medium">{volumes.mav} sets/week</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MRV:</span>
                            <span className="font-medium">{volumes.mrv} sets/week</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Create Template Dialog Component
function CreateTemplateDialog({ 
  userId, 
  createMutation, 
  onClose 
}: { 
  userId: number; 
  createMutation: any; 
  onClose: () => void; 
}) {
  const [step, setStep] = useState(1); // 1: Basic info, 2: Workout setup
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    daysPerWeek: 3,
    templateData: {
      workouts: [
        {
          name: 'Day 1',
          exercises: [],
          estimatedDuration: 45,
          focus: []
        }
      ]
    }
  });

  // Available exercises for selection (simplified for now)
  const availableExercises = [
    { id: 1, name: "Bench Press", muscleGroups: ["chest"], category: "compound" },
    { id: 2, name: "Overhead Press", muscleGroups: ["shoulders"], category: "compound" },
    { id: 5, name: "Pull-ups", muscleGroups: ["back"], category: "compound" },
    { id: 6, name: "Barbell Rows", muscleGroups: ["back"], category: "compound" },
    { id: 9, name: "Squats", muscleGroups: ["quads"], category: "compound" },
    { id: 10, name: "Romanian Deadlifts", muscleGroups: ["hamstrings"], category: "compound" },
    { id: 3, name: "Incline Dumbbell Press", muscleGroups: ["chest"], category: "isolation" },
    { id: 4, name: "Tricep Dips", muscleGroups: ["triceps"], category: "isolation" },
    { id: 8, name: "Bicep Curls", muscleGroups: ["biceps"], category: "isolation" },
    { id: 11, name: "Leg Press", muscleGroups: ["quads"], category: "isolation" },
    { id: 12, name: "Calf Raises", muscleGroups: ["calves"], category: "isolation" }
  ];

  const addWorkoutDay = () => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: [
          ...prev.templateData.workouts,
          {
            name: `Day ${prev.templateData.workouts.length + 1}`,
            exercises: [],
            estimatedDuration: 45,
            focus: []
          }
        ]
      }
    }));
  };

  const updateWorkout = (workoutIndex: number, workout: any) => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: prev.templateData.workouts.map((w, i) => i === workoutIndex ? workout : w)
      }
    }));
  };

  const addExerciseToWorkout = (workoutIndex: number, exercise: any) => {
    const newExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      repsRange: "8-12",
      restPeriod: 120,
      muscleGroups: exercise.muscleGroups,
      orderIndex: formData.templateData.workouts[workoutIndex].exercises.length + 1
    };

    updateWorkout(workoutIndex, {
      ...formData.templateData.workouts[workoutIndex],
      exercises: [...formData.templateData.workouts[workoutIndex].exercises, newExercise]
    });
  };

  const removeExerciseFromWorkout = (workoutIndex: number, exerciseIndex: number) => {
    updateWorkout(workoutIndex, {
      ...formData.templateData.workouts[workoutIndex],
      exercises: formData.templateData.workouts[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex)
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Custom Training Template</DialogTitle>
        <DialogDescription>
          Design your own training program with custom workouts and exercises
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Custom Push/Pull"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your training template..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="daysPerWeek">Days Per Week</Label>
              <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => {
                const days = parseInt(value);
                setFormData(prev => ({ 
                  ...prev, 
                  daysPerWeek: days,
                  templateData: {
                    ...prev.templateData,
                    workouts: Array.from({ length: days }, (_, i) => ({
                      name: `Day ${i + 1}`,
                      exercises: [],
                      estimatedDuration: 45,
                      focus: []
                    }))
                  }
                }));
              }}>
                <SelectTrigger>
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
          </>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configure Workouts</h3>
              <Badge variant="outline">{formData.daysPerWeek} days per week</Badge>
            </div>

            {formData.templateData.workouts.map((workout, workoutIndex) => (
              <Card key={workoutIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Input
                      value={workout.name}
                      onChange={(e) => updateWorkout(workoutIndex, { ...workout, name: e.target.value })}
                      className="font-semibold text-lg"
                    />
                    <div className="flex items-center gap-2">
                      <Label>Duration (min):</Label>
                      <Input
                        type="number"
                        value={workout.estimatedDuration}
                        onChange={(e) => updateWorkout(workoutIndex, { ...workout, estimatedDuration: parseInt(e.target.value) })}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Exercises ({workout.exercises.length})</h4>
                    <div className="space-y-2">
                      {workout.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-medium min-w-[150px]">{exercise.exerciseName}</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => {
                                const newExercises = [...workout.exercises];
                                newExercises[exerciseIndex] = { ...exercise, sets: parseInt(e.target.value) };
                                updateWorkout(workoutIndex, { ...workout, exercises: newExercises });
                              }}
                              className="w-16"
                            />
                            <span className="text-sm">sets</span>
                          </div>
                          <Input
                            value={exercise.repsRange}
                            onChange={(e) => {
                              const newExercises = [...workout.exercises];
                              newExercises[exerciseIndex] = { ...exercise, repsRange: e.target.value };
                              updateWorkout(workoutIndex, { ...workout, exercises: newExercises });
                            }}
                            placeholder="8-12"
                            className="w-20"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={exercise.restPeriod}
                              onChange={(e) => {
                                const newExercises = [...workout.exercises];
                                newExercises[exerciseIndex] = { ...exercise, restPeriod: parseInt(e.target.value) };
                                updateWorkout(workoutIndex, { ...workout, exercises: newExercises });
                              }}
                              className="w-16"
                            />
                            <span className="text-sm">sec</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeExerciseFromWorkout(workoutIndex, exerciseIndex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Add Exercise</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableExercises.map((exercise) => (
                        <Button
                          key={exercise.id}
                          size="sm"
                          variant="outline"
                          onClick={() => addExerciseToWorkout(workoutIndex, exercise)}
                          className="justify-start"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {exercise.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        {step === 1 ? (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.description}
            >
              Next: Configure Workouts
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

// Edit Template Dialog Component
function EditTemplateDialog({ 
  template, 
  updateMutation, 
  onClose 
}: { 
  template: TrainingTemplate; 
  updateMutation: any; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    category: template.category,
    daysPerWeek: template.daysPerWeek,
    templateData: template.templateData
  });

  const handleSubmit = () => {
    updateMutation.mutate({
      templateId: template.id,
      updateData: formData
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Training Template</DialogTitle>
          <DialogDescription>
            Update your custom training template details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editName">Template Name</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
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
            <Label htmlFor="editDescription">Description</Label>
            <Textarea
              id="editDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="editDaysPerWeek">Days Per Week</Label>
            <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, daysPerWeek: parseInt(value) }))}>
              <SelectTrigger>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.description || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}