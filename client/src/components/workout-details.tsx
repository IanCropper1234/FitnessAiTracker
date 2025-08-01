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
  exerciseName?: string;
  primaryMuscle?: string;
  muscleGroups?: string[];
  sets?: WorkoutSet[];
  targetSets?: number;
  targetReps?: string;
  restPeriod?: number;
  actualReps?: string;
  weight?: string;
  rpe?: number;
  isCompleted?: boolean;
  setsData?: WorkoutSet[];
  exercise?: {
    name: string;
    primaryMuscle: string;
    muscleGroups: string[];
  };
  specialMethod?: string;
  special_method?: string;
  specialConfig?: any;
  special_config?: any;
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
          <div className="h-20 bg-muted "></div>
          <div className="h-32 bg-muted "></div>
          <div className="h-48 bg-muted "></div>
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
            <div className="text-center p-3 bg-muted ">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{new Date(session.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">Date</p>
            </div>
            <div className="text-center p-3 bg-muted ">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{session.duration} min</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="text-center p-3 bg-muted ">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{session.totalVolume} kg</p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center p-3 bg-muted ">
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
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-blue-600">{feedback.pumpQuality}/10</p>
                <p className="text-sm text-muted-foreground">Pump Quality</p>
              </div>
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-yellow-600">{feedback.muscleSoreness}/10</p>
                <p className="text-sm text-muted-foreground">Soreness Level</p>
              </div>
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-red-600">{feedback.perceivedEffort}/10</p>
                <p className="text-sm text-muted-foreground">Perceived Effort</p>
              </div>
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-green-600">{feedback.energyLevel}/10</p>
                <p className="text-sm text-muted-foreground">Energy Level</p>
              </div>
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-purple-600">{feedback.sleepQuality}/10</p>
                <p className="text-sm text-muted-foreground">Sleep Quality</p>
              </div>
              <div className="text-center p-3 border ">
                <p className="text-lg font-bold text-orange-600">{Math.round((feedback.pumpQuality + feedback.energyLevel + feedback.sleepQuality) / 3)}/10</p>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>
            </div>
            
            {feedback.notes && (
              <div className="p-4 bg-muted ">
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
            // Use setsData if available, otherwise parse from actualReps
            const setsData = workoutExercise.setsData || [];
            const actualRepsArray = setsData.length > 0 
              ? setsData.map(set => set.actualReps) 
              : (workoutExercise.actualReps ? workoutExercise.actualReps.split(',').map((r: string) => parseInt(r)) : []);
            
            const exerciseWeight = setsData.length > 0 
              ? setsData[0]?.weight || 0 
              : parseFloat(workoutExercise.weight || '0');
            const exerciseRpe = setsData.length > 0 
              ? setsData[0]?.rpe || 0 
              : workoutExercise.rpe || 0;
            const exerciseSets = setsData.length || parseInt(workoutExercise.sets?.toString() || '0');
            
            // Calculate volume from stored data
            const exerciseVolume = actualRepsArray.reduce((sum: number, reps: number) => sum + (exerciseWeight * reps), 0);
            const exerciseCompletedSets = workoutExercise.isCompleted ? actualRepsArray.length : 0;
            const exerciseProgress = exerciseSets > 0 ? (exerciseCompletedSets / exerciseSets) * 100 : 0;
            
            // Get exercise details from nested exercise object
            const exerciseDetails = workoutExercise.exercise;
            const exerciseName = exerciseDetails?.name || workoutExercise.exerciseName || 'Unknown Exercise';
            const primaryMuscle = exerciseDetails?.primaryMuscle || 'Unknown muscle';
            const muscleGroups = exerciseDetails?.muscleGroups || [];
            
            // Get special training method information
            const specialMethod = workoutExercise.specialMethod || workoutExercise.special_method;
            const specialConfig = workoutExercise.specialConfig || workoutExercise.special_config;
            
            // Format special method display name
            const getSpecialMethodName = (method: string) => {
              switch (method) {
                case 'myorep_match': return 'Myo-Rep Match';
                case 'myorep_no_match': return 'Myo-Rep No Match';
                case 'drop_set': return 'Drop Set';
                case 'superset': return 'Superset';
                case 'giant_set': return 'Giant Set';
                default: return method;
              }
            };
            
            return (
              <div key={workoutExercise.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{exerciseName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {primaryMuscle} • {Array.isArray(muscleGroups) ? muscleGroups.join(", ") : 'Multiple muscles'}
                    </p>
                    {specialMethod && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getSpecialMethodName(specialMethod)}
                      </Badge>
                    )}
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
                  {(setsData.length > 0 ? setsData : actualRepsArray.map((reps: number, setIndex: number) => ({
                    actualReps: reps,
                    weight: exerciseWeight,
                    rpe: exerciseRpe,
                    completed: true
                  }))).map((setData: any, setIndex: number) => (
                    <div 
                      key={setIndex}
                      className="flex items-center justify-between p-3 border bg-green-500/10 dark:bg-green-500/20 border-green-500/30 dark:border-green-500/50"
                    >
                      <span className="text-sm font-medium">Set {setIndex + 1}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{setData.weight} kg × {setData.actualReps} reps</span>
                        {setData.rpe > 0 && (
                          <span className="text-muted-foreground">RPE {setData.rpe}</span>
                        )}
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  ))}
                  
                  {/* Special Training Method Details */}
                  {specialMethod && specialConfig && (
                    <div className="mt-2 p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {getSpecialMethodName(specialMethod)}
                        </span>
                        {specialMethod === 'myorep_match' && specialConfig.miniSetRepsString && (
                          <span className="text-xs text-blue-600/80 dark:text-blue-400/80">
                            Mini-sets: {specialConfig.miniSetRepsString} reps
                          </span>
                        )}
                      </div>
                      {specialMethod === 'myorep_match' && specialConfig.totalCalculatedReps && (
                        <div className="text-xs text-blue-600/60 dark:text-blue-400/60 mt-1">
                          Total calculated reps: {specialConfig.totalCalculatedReps}
                        </div>
                      )}
                    </div>
                  )}
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