import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  User,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertTriangle,
  Info,
  HelpCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  Search,
  Eye,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Helper function to calculate next workout day in template rotation
function calculateNextWorkoutDay(template: any, userId: number): number {
  try {
    // Get user's recent sessions to determine the next workout day
    // This is a simplified approach - in production, you'd track template progression
    const totalWorkouts = template.templateData?.workouts?.length || 1;
    
    // For now, cycle through workouts sequentially (0, 1, 2, 0, 1, 2...)
    // In a real implementation, you'd track the user's current position in the template
    const sessionCount = Math.floor(Math.random() * totalWorkouts); // Simplified for demo
    return sessionCount % totalWorkouts;
  } catch (error) {
    console.error('Error calculating next workout day:', error);
    return 0; // Default to first workout
  }
}

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
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get available templates (includes user templates)
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/training/templates', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const response = await apiRequest('GET', `/api/training/templates?${params.toString()}`);
      return response.json();
    },
  });

  // Generate full program from template
  const generateProgramMutation = useMutation({
    mutationFn: async (data: { templateId: number; userId: number }) => {
      const response = await apiRequest('POST', '/api/training/templates/generate-program', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Training Program Created",
        description: `${data.totalWorkouts} workout sessions created and ready to start`,
      });
      // Invalidate training sessions to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions', userId] });
    },
  });

  // Generate workout from template
  const generateWorkoutMutation = useMutation({
    mutationFn: async (data: { templateId: number; workoutDay?: number; userId: number }) => {
      const response = await apiRequest('POST', '/api/training/templates/generate-workout', data);
      return response.json();
    },
    onSuccess: (data) => {
      const workoutInfo = data.workoutDay !== undefined 
        ? `Day ${data.workoutDay + 1} of ${data.totalWorkouts}` 
        : "Workout";
      toast({
        title: "Workout Created",
        description: `${workoutInfo} generated and ready to start`,
      });
      // Invalidate training sessions to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions', userId] });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: number; updateData: any }) => {
      const response = await apiRequest('PATCH', `/api/training/templates/${data.templateId}`, {
        userId,
        ...data.updateData
      });
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

  // Template validation and cleanup mutation
  const validateTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/training/templates/validate-and-cleanup');
      return response.json();
    },
    onSuccess: (data) => {
      let description = `Found ${data.totalTemplates} templates. Deleted ${data.deletedTemplates} invalid templates.`;
      
      if (data.skippedTemplates > 0) {
        description += ` Skipped ${data.skippedTemplates} templates (in use by active mesocycles).`;
      }
      
      toast({
        title: "Template Validation Complete",
        description,
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
        <div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Training Templates</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from RP-based templates or create your own custom training programs
          </p>
        </div>

        {/* Enhanced Action Buttons Layout */}
        <div className="space-y-3">
          {/* Database Maintenance Section */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-muted/20 border border-border">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Database Maintenance</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-xs">
                          <p className="font-medium">Template Validation Tool</p>
                          <p>Scans all training templates for:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Missing exercise references</li>
                            <li>Broken workout structures</li>
                            <li>Invalid data entries</li>
                          </ul>
                          <p className="text-muted-foreground">Safely removes broken templates while protecting active mesocycles.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground truncate">Validates templates and removes invalid entries</p>
              </div>
            </div>
            <Button
              onClick={() => validateTemplatesMutation.mutate()}
              disabled={validateTemplatesMutation.isPending}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              {validateTemplatesMutation.isPending ? "Validating..." : "Validate"}
            </Button>
          </div>
          
          {/* Create Template Button */}
          <Button 
            onClick={() => setLocation('/create-training-template')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 w-full"
          >
            <Plus className="w-4 h-4" />
            Create Custom Template
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Filter by Level:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
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
              <CardDescription className="text-sm line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Template Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Days/Week</span>
                    <span className="font-semibold">{template.daysPerWeek}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="font-semibold">
                      {template.templateData?.workouts?.[0]?.estimatedDuration || 45}m
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Dumbbell className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Exercises</span>
                    <span className="font-semibold">
                      {template.templateData?.workouts?.reduce((acc, w) => acc + (w.exercises?.length || 0), 0) || 0}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateWorkoutMutation.mutate({ 
                      templateId: template.id, 
                      workoutDay: 0, // Always start from Day 1
                      userId 
                    })}
                    disabled={generateWorkoutMutation.isPending}
                    className="flex-1"
                    size="sm"
                  >
                    <Dumbbell className="h-4 w-4 mr-1" />
                    Start Workout
                  </Button>
                  
                  <Button
                    onClick={() => generateProgramMutation.mutate({ templateId: template.id, userId })}
                    disabled={generateProgramMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Full Program
                  </Button>
                </div>

                {/* Template Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => setLocation(`/template/${template.id}`)}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {template.createdBy === 'user' && (
                    <>
                      <Button
                        onClick={() => setEditingTemplate(template)}
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        disabled={deleteTemplateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
          <p className="text-muted-foreground mb-6">
            {selectedCategory === 'all' 
              ? 'No training templates are available at the moment.'
              : `No ${selectedCategory} templates found. Try changing the filter.`
            }
          </p>
          <Button onClick={() => setLocation('/create-training-template')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <EnhancedEditTemplateDialog 
          template={editingTemplate}
          updateMutation={updateTemplateMutation}
          onClose={() => setEditingTemplate(null)}
          userId={userId}
        />
      )}
    </div>
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



// Enhanced Edit Template Dialog Component with Exercise Management
function EnhancedEditTemplateDialog({ 
  template, 
  updateMutation, 
  onClose,
  userId
}: { 
  template: TrainingTemplate; 
  updateMutation: any; 
  onClose: () => void;
  userId: number;
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    category: template.category,
    daysPerWeek: template.daysPerWeek,
    templateData: template.templateData
  });

  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get available exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/exercises');
      return response.json();
    },
  });

  const currentWorkout = formData.templateData?.workouts?.[activeWorkoutIndex];
  const filteredExercises = exercises.filter((ex: any) => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExercise = (exercise: any) => {
    if (!currentWorkout) return;

    const newExercise = {
      exerciseName: exercise.name,
      sets: 3,
      repsRange: "8-12",
      restPeriod: 60
    };

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: [...(currentWorkout.exercises || []), newExercise]
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));

    setShowExerciseSelector(false);
    setSearchTerm('');
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.filter((_, idx) => idx !== exerciseIndex);
    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (!currentWorkout || toIndex < 0 || toIndex >= currentWorkout.exercises.length) return;

    const updatedExercises = [...currentWorkout.exercises];
    const [movedExercise] = updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, movedExercise);

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleUpdateExercise = (exerciseIndex: number, field: string, value: any) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      [field]: value
    };

    const updatedWorkouts = [...(formData.templateData?.workouts || [])];
    updatedWorkouts[activeWorkoutIndex] = {
      ...currentWorkout,
      exercises: updatedExercises
    };

    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: updatedWorkouts
      }
    }));
  };

  const handleSubmit = () => {
    updateMutation.mutate({
      templateId: template.id,
      updateData: formData
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Training Template
          </DialogTitle>
          <DialogDescription>
            Customize your training template by editing exercises, sets, reps, and workout structure
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="exercises">Exercise Management</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="exercises" className="flex-1 overflow-hidden">
            <div className="flex gap-4 h-full">
              {/* Workout Selector */}
              <div className="w-1/4 space-y-2">
                <h4 className="font-medium">Workouts</h4>
                {formData.templateData?.workouts?.map((workout, index) => (
                  <Button
                    key={index}
                    variant={activeWorkoutIndex === index ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveWorkoutIndex(index)}
                  >
                    Day {index + 1}: {workout.name}
                  </Button>
                ))}
              </div>

              {/* Exercise Editor */}
              <div className="flex-1 space-y-4 overflow-hidden">
                {currentWorkout && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {currentWorkout.name} Exercises ({currentWorkout.exercises?.length || 0})
                      </h4>
                      <Button
                        onClick={() => setShowExerciseSelector(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[400px]">
                      {currentWorkout.exercises?.map((exercise, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Reorder Controls */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveExercise(index, index - 1)}
                                disabled={index === 0}
                                className="p-1 h-6 w-6"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveExercise(index, index + 1)}
                                disabled={index === currentWorkout.exercises.length - 1}
                                className="p-1 h-6 w-6"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Exercise Details */}
                            <div className="flex-1 grid grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Exercise</Label>
                                <div className="font-medium text-sm">{exercise.exerciseName}</div>
                              </div>
                              <div>
                                <Label className="text-xs">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value))}
                                  className="h-8"
                                  min="1"
                                  max="10"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Reps Range</Label>
                                <Input
                                  value={exercise.repsRange}
                                  onChange={(e) => handleUpdateExercise(index, 'repsRange', e.target.value)}
                                  className="h-8"
                                  placeholder="8-12"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rest (sec)</Label>
                                <Input
                                  type="number"
                                  value={exercise.restPeriod}
                                  onChange={(e) => handleUpdateExercise(index, 'restPeriod', parseInt(e.target.value))}
                                  className="h-8"
                                  min="15"
                                  max="300"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExercise(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.description || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogFooter>

        {/* Exercise Selector Dialog */}
        {showExerciseSelector && (
          <Dialog open={true} onOpenChange={() => setShowExerciseSelector(false)}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Add Exercise</DialogTitle>
                <DialogDescription>
                  Search and select an exercise to add to your workout
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredExercises.slice(0, 50).map((exercise: any) => (
                    <Card 
                      key={exercise.id} 
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleAddExercise(exercise)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          {exercise.muscleGroups && (
                            <div className="text-sm text-muted-foreground">
                              {exercise.muscleGroups.join(', ')}
                            </div>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExerciseSelector(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}