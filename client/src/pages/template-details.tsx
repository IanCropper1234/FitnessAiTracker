import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Dumbbell, 
  Edit2,
  Eye,
  Target,
  Users
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

export default function TemplateDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Get template details
  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/training/templates', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/templates/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested training template could not be found.</p>
          <Button onClick={() => setLocation('/training-templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const workouts = template.templateData?.workouts || [];
  const totalExercises = workouts.reduce((acc: number, w: any) => acc + (w.exercises?.length || 0), 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyStars = (category: string) => {
    const starCount = category === 'beginner' ? 1 : category === 'intermediate' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Target 
        key={i} 
        className={`h-3 w-3 ${i < starCount ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/training-templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        
        {template.createdBy === 'user' && (
          <Button 
            onClick={() => setLocation(`/training-templates?edit=${template.id}`)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Template
          </Button>
        )}
      </div>

      {/* Template Header */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{template.name}</CardTitle>
                {template.createdBy === 'user' && (
                  <Badge variant="outline" className="text-sm">
                    <Users className="h-3 w-3 mr-1" />
                    Custom
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getCategoryColor(template.category) + " text-sm"}>
                  {template.category}
                </Badge>
                <div className="flex items-center gap-1">
                  {getDifficultyStars(template.category)}
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {template.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Template Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{template.daysPerWeek}</div>
            <div className="text-sm text-muted-foreground">Days per Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {workouts.length > 0 ? Math.round(workouts.reduce((acc: number, w: any) => acc + (w.estimatedDuration || 45), 0) / workouts.length) : 45}m
            </div>
            <div className="text-sm text-muted-foreground">Avg Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{workouts.length}</div>
            <div className="text-sm text-muted-foreground">Workouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalExercises}</div>
            <div className="text-sm text-muted-foreground">Total Exercises</div>
          </CardContent>
        </Card>
      </div>

      {/* Workouts Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Workout Breakdown</h3>
        {workouts.map((workout: any, index: number) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Day {index + 1}: {workout.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {workout.estimatedDuration || 45}m
                </div>
              </div>
              {workout.focus && workout.focus.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workout.focus.map((muscle: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {workout.exercises?.map((exercise: any, exIdx: number) => (
                  <div 
                    key={exIdx} 
                    className="flex items-center justify-between p-4 bg-muted/20 border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-base">{exercise.exerciseName}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {exercise.sets} sets × {exercise.repsRange} reps
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {exercise.restPeriod}s rest
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RP Methodology Information */}
      {template.rpMethodology && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Renaissance Periodization Guidelines</CardTitle>
            <CardDescription>
              Evidence-based volume and progression recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.rpMethodology.volumeGuidelines && (
              <div>
                <h4 className="font-medium mb-2">Volume Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(template.rpMethodology.volumeGuidelines).map(([muscle, guidelines]: [string, any]) => (
                    <div key={muscle} className="p-3 bg-muted/20 border">
                      <div className="font-medium capitalize mb-1">{muscle}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>MEV: {guidelines.mev} sets/week</div>
                        <div>MAV: {guidelines.mav} sets/week</div>
                        <div>MRV: {guidelines.mrv} sets/week</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {template.rpMethodology.progressionRules && template.rpMethodology.progressionRules.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Progression Rules</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {template.rpMethodology.progressionRules.map((rule: string, idx: number) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {template.rpMethodology.deloadGuidelines && template.rpMethodology.deloadGuidelines.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Deload Guidelines</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {template.rpMethodology.deloadGuidelines.map((guideline: string, idx: number) => (
                    <li key={idx}>{guideline}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}