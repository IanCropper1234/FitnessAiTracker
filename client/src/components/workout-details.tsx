import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { AutoRegulationFeedback } from "@shared/schema";
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
import { SpecialMethodBadge } from "@/components/ui/special-method-badge";
import { getSpecialMethodStyle } from "@/lib/specialMethodUtils";

interface WorkoutSet {
  weight: number;
  actualReps: number;
  rpe: number;
  completed: boolean;
  weightUnit?: string;
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
  weightUnit?: string;
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
    .filter(ex => ex.isCompleted && ex.rpe && ex.rpe > 0)
    .reduce((sum, ex) => sum + (ex.rpe || 0), 0) / session.exercises.filter(ex => ex.isCompleted && ex.rpe && ex.rpe > 0).length || 0;

  // Calculate total volume with proper unit handling
  const calculateTotalVolume = () => {
    let totalKgVolume = 0;
    let totalLbsVolume = 0;
    
    session.exercises.forEach(workoutExercise => {
      const setsData = workoutExercise.setsData || [];
      const actualRepsArray = setsData.length > 0 
        ? setsData.map(set => set.actualReps) 
        : (workoutExercise.actualReps ? workoutExercise.actualReps.split(',').map((r: string) => parseInt(r)) : []);
      
      const exerciseWeight = setsData.length > 0 
        ? setsData[0]?.weight || 0 
        : parseFloat(workoutExercise.weight || '0');
        
      const exerciseWeightUnit = setsData.length > 0 
        ? setsData[0]?.weightUnit || workoutExercise.weightUnit || 'kg'
        : workoutExercise.weightUnit || 'kg';
      
      const exerciseVolume = actualRepsArray.reduce((sum: number, reps: number) => sum + (exerciseWeight * reps), 0);
      
      if (exerciseWeightUnit === 'lbs') {
        totalLbsVolume += exerciseVolume;
      } else {
        totalKgVolume += exerciseVolume;
      }
    });
    
    // Return display string based on what volumes exist
    if (totalKgVolume > 0 && totalLbsVolume > 0) {
      return `${totalKgVolume.toFixed(1)} kg + ${totalLbsVolume.toFixed(1)} lbs`;
    } else if (totalLbsVolume > 0) {
      return `${totalLbsVolume.toFixed(1)} lbs`;
    } else {
      return `${totalKgVolume.toFixed(1)} kg`;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
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
            <CardTitle className="text-headline flex items-center gap-2 text-[12px] font-bold">
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
              <p className="text-sm font-medium">{calculateTotalVolume()}</p>
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
            
            // Get the weight unit for this exercise (critical fix for unit display)
            const exerciseWeightUnit = setsData.length > 0 
              ? setsData[0]?.weightUnit || workoutExercise.weightUnit || 'kg'
              : workoutExercise.weightUnit || 'kg';
            
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
                    <p className="text-sm font-medium">{exerciseVolume.toFixed(1)} {exerciseWeightUnit} volume</p>
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
                    <div key={setIndex} className="space-y-2">
                      <div className="flex items-center justify-between p-3 border bg-green-500/10 dark:bg-green-500/20 border-green-500/30 dark:border-green-500/50">
                        <span className="text-sm font-medium">Set {setIndex + 1}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{setData.weight} {setData.weightUnit || exerciseWeightUnit} × {setData.actualReps} reps</span>
                          {setData.rpe > 0 && (
                            <span className="text-muted-foreground">RPE {setData.rpe}</span>
                          )}
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      
                      {/* Special Training Method Details for each set */}
                      {specialMethod && (
                        <div className="p-2 border text-xs bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <SpecialMethodBadge method={specialMethod} />
                          </div>
                          
                          {/* Myo-Rep Match per-set details */}
                          {specialMethod === 'myorep_match' && (
                            <div className="space-y-1">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Target Reps:</span>
                                  <span className="font-medium ml-1">{specialConfig?.targetReps || '15'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Mini Sets:</span>
                                  <span className="font-medium ml-1">{specialConfig?.miniSets || '2'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rest:</span>
                                  <span className="font-medium ml-1">{specialConfig?.restSeconds || '20'}s</span>
                                </div>
                              </div>
                              {specialConfig?.miniSetRepsString && (
                                <div>
                                  <span className="text-muted-foreground">Mini-sets Reps:</span>
                                  <span className="font-medium ml-1">{specialConfig.miniSetRepsString}</span>
                                </div>
                              )}
                              {specialConfig?.totalCalculatedReps && (
                                <div>
                                  <span className="text-muted-foreground">Total Calculated:</span>
                                  <span className="font-medium ml-1">{specialConfig.totalCalculatedReps} reps</span>
                                </div>
                              )}
                              {specialConfig?.activationSet && (
                                <div>
                                  <span className="text-muted-foreground">Activation Set:</span>
                                  <span className="font-medium ml-1">Yes</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Myo-Rep No Match per-set details */}
                          {specialMethod === 'myorep_no_match' && (
                            <div className="space-y-1">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Mini Sets:</span>
                                  <span className="font-medium ml-1">{specialConfig?.miniSets || '2'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rest:</span>
                                  <span className="font-medium ml-1">{specialConfig?.restSeconds || '20'}s</span>
                                </div>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Perform to failure, then mini-sets
                              </div>
                            </div>
                          )}
                          
                          {/* Drop Set per-set details */}
                          {specialMethod === 'drop_set' && (
                            <div className="space-y-1">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Drop Sets:</span>
                                  <span className="font-medium ml-1">{specialConfig?.dropSets || '3'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rest:</span>
                                  <span className="font-medium ml-1">{specialConfig?.dropRestSeconds || '10'}s</span>
                                </div>
                              </div>
                              {specialConfig?.dropSetWeights && specialConfig.dropSetWeights.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Weights:</span>
                                  <span className="font-medium ml-1">
                                    {specialConfig.dropSetWeights.map((weight: number) => `${weight}${exerciseWeightUnit}`).join(' → ')}
                                  </span>
                                </div>
                              )}
                              {specialConfig?.dropSetReps && specialConfig.dropSetReps.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Target Reps:</span>
                                  <span className="font-medium ml-1">
                                    {specialConfig.dropSetReps.map((reps: number) => `${reps}`).join(' → ')}
                                  </span>
                                </div>
                              )}
                              {specialConfig?.weightReductions && specialConfig.weightReductions.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Reductions:</span>
                                  <span className="font-medium ml-1">
                                    {specialConfig.weightReductions.map((r: number) => `${r}%`).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Giant Set per-set details */}
                          {specialMethod === 'giant_set' && (
                            <div className="space-y-1">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Target Total:</span>
                                  <span className="font-medium ml-1">{specialConfig?.totalTargetReps || '40'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Mini-Sets:</span>
                                  <span className="font-medium ml-1">{specialConfig?.totalMiniSets || '8'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rest:</span>
                                  <span className="font-medium ml-1">{specialConfig?.restSeconds || '10'}s</span>
                                </div>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {specialConfig?.totalTargetReps || '40'} reps across {specialConfig?.totalMiniSets || '8'} mini-sets
                              </div>
                            </div>
                          )}
                          
                          {/* Superset per-set details */}
                          {specialMethod === 'superset' && (
                            <div className="space-y-1">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Rest Between Sets:</span>
                                  <span className="font-medium ml-1">{specialConfig?.restSeconds || '60'}s</span>
                                </div>
                                {specialConfig?.pairedExerciseId && (
                                  <div>
                                    <span className="text-muted-foreground">Paired Exercise:</span>
                                    <span className="font-medium ml-1">ID {specialConfig.pairedExerciseId}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Perform immediately after paired exercise
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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