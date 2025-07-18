import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  CheckCircle2,
  Star,
  TrendingUp,
  Dumbbell
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TrainingTemplate {
  id: number;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  specialization: string;
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
  const queryClient = useQueryClient();

  // Get available templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/training/templates', selectedCategory],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/templates${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
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
      console.log('Workout generated:', data);
      // Invalidate training sessions to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
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
      {/* Filter Controls */}
      <div className="flex items-center gap-4">
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

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: TrainingTemplate) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
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