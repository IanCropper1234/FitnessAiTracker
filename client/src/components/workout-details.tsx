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

  const completedSets = session.exercises.reduce((total, exercise) => 
    total + exercise.sets.filter(set => set.completed).length, 0
  );
  
  const totalSets = session.exercises.reduce((total, exercise) => 
    total + exercise.sets.length, 0
  );

  const averageRPE = session.exercises
    .flatMap(ex => ex.sets)
    .filter(set => set.completed && set.rpe > 0)
    .reduce((sum, set, _, arr) => sum + set.rpe / arr.length, 0);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Training
            </Button>
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
          
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {session.name}
          </CardTitle>
          
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
                <p className="text-lg font-bold text-yellow-600">{feedback.sorenessLevel}/10</p>
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
                <p className="text-lg font-bold text-orange-600">{feedback.overallRating}/10</p>
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
          {session.exercises.map((exercise, index) => {
            const exerciseVolume = exercise.sets
              .filter(set => set.completed)
              .reduce((sum, set) => sum + (set.weight * set.actualReps), 0);
            
            const exerciseCompletedSets = exercise.sets.filter(set => set.completed).length;
            const exerciseProgress = (exerciseCompletedSets / exercise.sets.length) * 100;
            
            return (
              <div key={exercise.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{exercise.exerciseName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exercise.primaryMuscle} • {exercise.muscleGroups.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{exerciseVolume} kg volume</p>
                    <p className="text-xs text-muted-foreground">
                      {exerciseCompletedSets}/{exercise.sets.length} sets
                    </p>
                  </div>
                </div>
                
                <Progress value={exerciseProgress} className="h-2" />
                
                {/* Sets breakdown */}
                <div className="grid gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div 
                      key={setIndex}
                      className={`flex items-center justify-between p-3 rounded border ${
                        set.completed ? 'bg-green-50 border-green-200' : 'bg-muted'
                      }`}
                    >
                      <span className="text-sm font-medium">Set {setIndex + 1}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{set.weight} kg × {set.actualReps} reps</span>
                        {set.rpe > 0 && (
                          <span className="text-muted-foreground">RPE {set.rpe}</span>
                        )}
                        {set.completed && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
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