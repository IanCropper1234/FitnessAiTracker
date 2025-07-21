import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Dumbbell,
  BarChart3,
  Activity,
  CheckCircle2
} from "lucide-react";

interface WorkoutSet {
  weight: number;
  actualReps: number;
  rpe: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
  muscleGroups: string[];
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: string;
  restPeriod: number;
}

interface WorkoutSessionDetails {
  id: number;
  userId: number;
  name: string;
  date: string;
  duration: number;
  totalVolume: number;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
}

interface AutoRegulationFeedback {
  id: number;
  sessionId: number;
  pumpQuality: number;
  sorenessLevel: number;
  perceivedEffort: number;
  energyLevel: number;
  sleepQuality: number;
  overallRating: number;
  notes?: string;
  createdAt: string;
}

interface WorkoutDetailsProps {
  sessionId: number;
  onBack: () => void;
}

export function WorkoutDetails({ sessionId, onBack }: WorkoutDetailsProps) {
  // Fetch workout session details
  const { data: session, isLoading } = useQuery<WorkoutSessionDetails>({
    queryKey: ["/api/training/session", sessionId],
  });

  // Fetch auto-regulation feedback if available
  const { data: feedback } = useQuery<AutoRegulationFeedback>({
    queryKey: ["/api/training/auto-regulation-feedback", sessionId],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Workout session not found</p>
        </div>
      </div>
    );
  }

  const completedSets = session.exercises.reduce((total, workoutExercise) => {
    const actualRepsArray = workoutExercise.actualReps ? workoutExercise.actualReps.split(',') : [];
    return total + (workoutExercise.isCompleted ? actualRepsArray.length : 0);
  }, 0);
  
  const totalSets = session.exercises.reduce((total, workoutExercise) => {
    return total + parseInt(workoutExercise.sets?.toString() || '0');
  }, 0);

  const averageRPE = session.exercises
    .filter(ex => ex.isCompleted && ex.rpe > 0)
    .reduce((sum, ex) => sum + ex.rpe, 0) / session.exercises.filter(ex => ex.isCompleted && ex.rpe > 0).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back to Training Button - Outside Container */}
      <div className="flex items-center justify-start">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Training
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {session.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {session.isCompleted ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{new Date(session.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">Date</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{session.duration} min</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{session.totalVolume} kg</p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{completedSets}/{totalSets}</p>
              <p className="text-xs text-muted-foreground">Sets Completed</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Auto-Regulation Feedback */}
      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Auto-Regulation Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-blue-600">{feedback.pumpQuality}/10</p>
                <p className="text-sm text-muted-foreground">Pump Quality</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-yellow-600">{feedback.muscleSoreness}/10</p>
                <p className="text-sm text-muted-foreground">Soreness Level</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-red-600">{feedback.perceivedEffort}/10</p>
                <p className="text-sm text-muted-foreground">Perceived Effort</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-green-600">{feedback.energyLevel}/10</p>
                <p className="text-sm text-muted-foreground">Energy Level</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-purple-600">{feedback.sleepQuality}/10</p>
                <p className="text-sm text-muted-foreground">Sleep Quality</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold text-orange-600">{Math.round((feedback.pumpQuality + feedback.energyLevel + feedback.sleepQuality) / 3)}/10</p>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>
            </div>
            
            {feedback.notes && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm">{feedback.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exercise Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Exercise Breakdown
          </CardTitle>
          {averageRPE > 0 && (
            <p className="text-sm text-muted-foreground">
              Average RPE: <span className="font-medium">{averageRPE.toFixed(1)}/10</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {session.exercises.map((workoutExercise, index) => {
            // Parse the stored sets data from actualReps and weight
            const actualRepsArray = workoutExercise.actualReps ? workoutExercise.actualReps.split(',').map(r => parseInt(r)) : [];
            const exerciseWeight = parseFloat(workoutExercise.weight || '0');
            const exerciseRpe = workoutExercise.rpe || 0;
            const exerciseSets = parseInt(workoutExercise.sets?.toString() || '0');
            
            // Calculate volume from stored data
            const exerciseVolume = actualRepsArray.reduce((sum, reps) => sum + (exerciseWeight * reps), 0);
            const exerciseCompletedSets = workoutExercise.isCompleted ? actualRepsArray.length : 0;
            const exerciseProgress = exerciseSets > 0 ? (exerciseCompletedSets / exerciseSets) * 100 : 0;
            
            // Get exercise details from nested exercise object
            const exerciseDetails = workoutExercise.exercise;
            const exerciseName = exerciseDetails?.name || workoutExercise.exerciseName || 'Unknown Exercise';
            const primaryMuscle = exerciseDetails?.primaryMuscle || 'Unknown muscle';
            const muscleGroups = exerciseDetails?.muscleGroups || [];
            
            return (
              <div key={workoutExercise.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{exerciseName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {primaryMuscle} • {Array.isArray(muscleGroups) ? muscleGroups.join(", ") : 'Multiple muscles'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{exerciseVolume.toFixed(1)} kg volume</p>
                    <p className="text-xs text-muted-foreground">
                      {exerciseCompletedSets}/{exerciseSets} sets
                    </p>
                  </div>
                </div>
                
                <Progress value={exerciseProgress} className="h-2" />
                
                {/* Sets breakdown */}
                <div className="grid gap-2">
                  {actualRepsArray.map((reps, setIndex) => (
                    <div 
                      key={setIndex}
                      className="flex items-center justify-between p-3 rounded border bg-green-500/10 dark:bg-green-500/20 border-green-500/30 dark:border-green-500/50"
                    >
                      <span className="text-sm font-medium">Set {setIndex + 1}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{exerciseWeight} kg × {reps} reps</span>
                        {exerciseRpe > 0 && (
                          <span className="text-muted-foreground">RPE {exerciseRpe}</span>
                        )}
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {index < session.exercises.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}