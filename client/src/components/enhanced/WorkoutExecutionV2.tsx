import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Target, ArrowLeft, ArrowRight, ListOrdered, Timer, Save, CheckCircle, Plus, Minus, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useFeature } from '@/hooks/useFeature';

// Enhanced components
import { RestTimerFAB } from './RestTimerFAB';
import { CircularProgress } from './CircularProgress';
import { EnhancedSetInput } from './EnhancedSetInput';
import { DraggableExerciseList } from './DraggableExerciseList';

// Import legacy component for fallback
import WorkoutExecution from '../workout-execution';
import WorkoutFeedbackDialog from "@/components/workout-feedback-dialog";

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
  instructions: string;
  isBodyWeight?: boolean;
}

interface WorkoutExercise {
  id: number;
  exerciseId: number;
  orderIndex: number;
  sets: number;
  targetReps: string;
  restPeriod: number;
  exercise: Exercise;
  setsData?: WorkoutSet[];
}

interface SetRecommendation {
  setNumber: number;
  recommendedWeight: number;
  recommendedReps: number;
  recommendedRpe: number;
}

interface ExerciseRecommendation {
  exerciseId: number;
  exerciseName: string;
  sets: SetRecommendation[];
  week: number;
  reasoning: string;
  movementPattern?: string;
  primaryMuscle?: string;
  difficulty?: string;
}

interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
}

interface WorkoutExecutionV2Props {
  sessionId: string;
  onComplete: () => void;
}

export const WorkoutExecutionV2: React.FC<WorkoutExecutionV2Props> = ({
  sessionId,
  onComplete,
}) => {
  // Feature flags
  const isV2Enabled = useFeature('workoutExecutionV2');
  const gestureNavEnabled = useFeature('gestureNavigation');
  const restTimerFABEnabled = useFeature('restTimerFAB');
  const circularProgressEnabled = useFeature('circularProgress');

  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState<Record<number, WorkoutSet[]>>({});
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [customRestTime, setCustomRestTime] = useState<number | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [activeTab, setActiveTab] = useState<'execution' | 'exercises'>('execution');
  const [showFeedback, setShowFeedback] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force V2 when the feature is enabled, regardless of session version
  if (!isV2Enabled) {
    return <WorkoutExecution sessionId={parseInt(sessionId, 10)} onComplete={onComplete} />;
  }

  // Fetch session data
  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ["/api/training/session", sessionId],
  });

  // Fetch exercise recommendations from mesocycle advance week function
  const { data: recommendations = [] } = useQuery<ExerciseRecommendation[]>({
    queryKey: ["/api/training/exercise-recommendations", sessionId],
    enabled: !!sessionId,
  });

  // Initialize workout data from session
  useEffect(() => {
    if (session?.exercises) {
      console.log('Initializing V2 workout data from session:', session);
      
      const initialData: Record<number, WorkoutSet[]> = {};
      
      session.exercises.forEach(exercise => {
        if (exercise.setsData && exercise.setsData.length > 0) {
          // Restore from saved sets data
          console.log(`Restoring saved sets data for exercise ${exercise.exerciseId}:`, exercise.setsData);
          initialData[exercise.id] = exercise.setsData;
        } else {
          // Create default sets
          const targetRepsNum = parseInt(exercise.targetReps.split('-')[0]) || 8;
          const defaultSets: WorkoutSet[] = [];
          
          for (let i = 0; i < exercise.sets; i++) {
            defaultSets.push({
              setNumber: i + 1,
              targetReps: targetRepsNum,
              actualReps: 0,
              weight: 0,
              rpe: 8,
              completed: false,
            });
          }
          
          initialData[exercise.id] = defaultSets;
        }
      });
      
      console.log('Initialized workout data:', initialData);
      setWorkoutData(initialData);
    }
  }, [session]);

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            toast({
              title: "Rest Complete!",
              description: "Time to start your next set.",
              duration: 3000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimeRemaining, toast]);

  // Swipe gesture handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (gestureNavEnabled && currentExerciseIndex < (session?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
        toast({
          title: "Next Exercise",
          description: `Swiped to ${session?.exercises[currentExerciseIndex + 1]?.exercise.name}`,
          duration: 2000,
        });
      }
    },
    onSwipedRight: () => {
      if (gestureNavEnabled && currentExerciseIndex > 0) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
        setCurrentSetIndex(0);
        toast({
          title: "Previous Exercise", 
          description: `Swiped to ${session?.exercises[currentExerciseIndex - 1]?.exercise.name}`,
          duration: 2000,
        });
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      const response = await apiRequest("PUT", `/api/training/sessions/${sessionId}/progress`, progressData);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant caches when workout is completed
      queryClient.invalidateQueries({ queryKey: ["/api/training/session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      // Also invalidate user-specific session queries with all possible query key variants
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/training/sessions" && query.queryKey[1] === "1"
      });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/training/stats" && query.queryKey[1] === "1"
      });
      
      if (variables.isCompleted) {
        // Workout completed - show feedback dialog
        toast({
          title: "Workout Completed!",
          description: "Great job! Time for auto-regulation feedback.",
        });
        setShowFeedback(true);
      } else {
        // Just saving progress
        toast({
          title: "Progress Saved",
          description: "Your workout progress has been saved.",
        });
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save workout progress: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading enhanced workout session...</p>
        </div>
      </div>
    );
  }

  const currentExercise = session.exercises[currentExerciseIndex];
  const currentSets = workoutData[currentExercise?.id] || [];
  const currentSet = currentSets[currentSetIndex];
  
  // Calculate progress
  const totalSets = Object.values(workoutData).reduce((sum, sets) => sum + sets.length, 0);
  const completedSets = Object.values(workoutData).flat().filter(set => set.completed).length;
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const updateSet = (exerciseId: number, setIndex: number, field: keyof WorkoutSet, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, i) => 
        i === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const completeSet = () => {
    if (!currentSet?.weight || !currentSet?.actualReps) {
      toast({
        title: "Incomplete Set",
        description: "Please enter weight and reps before completing the set.",
        variant: "destructive",
      });
      return;
    }

    updateSet(currentExercise.id, currentSetIndex, 'completed', true);
    
    // Start rest timer and advance
    if (currentSetIndex < currentSets.length - 1) {
      // Next set in same exercise
      if (restTimerFABEnabled) {
        const restTime = customRestTime || currentExercise.restPeriod;
        setRestTimeRemaining(restTime);
        setIsRestTimerActive(true);
        toast({
          title: "Set Complete!",
          description: `Rest ${Math.floor(restTime / 60)}:${(restTime % 60).toString().padStart(2, '0')} before next set`,
          duration: 3000,
        });
      }
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExerciseIndex < session.exercises.length - 1) {
      // Move to next exercise
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      toast({
        title: "Exercise Complete!",
        description: `Moving to ${session.exercises[currentExerciseIndex + 1]?.exercise.name}`,
        duration: 3000,
      });
    }
  };

  const addSet = (exerciseId: number) => {
    setWorkoutData(prev => {
      const currentSets = prev[exerciseId] || [];
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: WorkoutSet = {
        setNumber: currentSets.length + 1,
        targetReps: lastSet?.targetReps || 8,
        actualReps: 0,
        weight: lastSet?.weight || 0,
        rpe: lastSet?.rpe || 8,
        completed: false,
      };
      
      const newSets = [...currentSets, newSet];
      
      toast({
        title: "Set Added",
        description: `Added Set ${newSet.setNumber} to ${currentExercise?.exercise.name}`,
        duration: 2000,
      });
      
      return {
        ...prev,
        [exerciseId]: newSets
      };
    });
  };

  const removeSet = (exerciseId: number, setIndex: number) => {
    setWorkoutData(prev => {
      const currentSets = prev[exerciseId] || [];
      if (currentSets.length <= 1) {
        toast({
          title: "Cannot Remove Set",
          description: "Each exercise must have at least one set.",
          variant: "destructive",
        });
        return prev;
      }

      const setToRemove = currentSets[setIndex];
      if (setToRemove?.completed) {
        toast({
          title: "Cannot Remove Completed Set",
          description: "You cannot remove a completed set.",
          variant: "destructive",
        });
        return prev;
      }

      const newSets = currentSets.filter((_, i) => i !== setIndex).map((set, i) => ({
        ...set,
        setNumber: i + 1
      }));
      
      // Adjust current set index if needed
      if (setIndex <= currentSetIndex && currentSetIndex > 0) {
        setCurrentSetIndex(currentSetIndex - 1);
      } else if (setIndex < currentSets.length - 1 && currentSetIndex >= newSets.length) {
        setCurrentSetIndex(newSets.length - 1);
      }
      
      toast({
        title: "Set Removed",
        description: `Removed set from ${currentExercise?.exercise.name}`,
        duration: 2000,
      });
      
      return {
        ...prev,
        [exerciseId]: newSets
      };
    });
  };

  const resetSet = (exerciseId: number, setIndex: number) => {
    setWorkoutData(prev => {
      const currentSets = prev[exerciseId] || [];
      const updatedSets = [...currentSets];
      
      if (updatedSets[setIndex]) {
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          completed: false,
          actualReps: 0,
          weight: 0,
          rpe: 8
        };
        
        toast({
          title: "Set Reset",
          description: `Reset Set ${setIndex + 1} for ${currentExercise?.exercise.name}`,
          duration: 2000,
        });
      }
      
      return {
        ...prev,
        [exerciseId]: updatedSets
      };
    });
  };

  const saveAndExit = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
    const totalVolume = Math.round(Object.values(workoutData)
      .flat()
      .filter(set => set.completed)
      .reduce((sum, set) => sum + (set.weight * set.actualReps), 0));

    const progressData = {
      duration,
      totalVolume,
      isCompleted: false,
      exercises: session.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: workoutData[exercise.id] || []
      }))
    };

    saveProgressMutation.mutate(progressData);
  };

  const completeWorkout = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
    const totalVolume = Math.round(Object.values(workoutData)
      .flat()
      .filter(set => set.completed)
      .reduce((sum, set) => sum + (set.weight * set.actualReps), 0));

    const progressData = {
      duration,
      totalVolume,
      isCompleted: true,
      exercises: session.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        sets: workoutData[exercise.id] || []
      }))
    };

    saveProgressMutation.mutate(progressData);
  };

  const getSetRecommendation = (exerciseId: number, setNumber: number): SetRecommendation | undefined => {
    const exerciseRec = recommendations.find(rec => rec.exerciseId === exerciseId);
    if (!exerciseRec?.sets) return undefined;
    
    return exerciseRec.sets.find(set => set.setNumber === setNumber);
  };

  const getExerciseRecommendation = (exerciseId: number): ExerciseRecommendation | undefined => {
    return recommendations.find(rec => rec.exerciseId === exerciseId);
  };

  // Determine if exercise is body weight based using database field
  const isBodyWeightExercise = (exercise: Exercise): boolean => {
    // Use the isBodyWeight field from the database if available
    return exercise.isBodyWeight === true;
  };

  const handleExercisesReorder = (newOrder: WorkoutExercise[]) => {
    // Update current exercise index if needed
    const currentExerciseId = currentExercise?.id;
    const newIndex = newOrder.findIndex(ex => ex.id === currentExerciseId);
    if (newIndex !== -1) {
      setCurrentExerciseIndex(newIndex);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" {...swipeHandlers}>
      {/* iOS-Style Header */}
      <div className="ios-card p-6 space-y-4 pl-[44px] pr-[44px] pt-[0px] pb-[0px] mt-[-5px] mb-[-5px] ml-[0px] mr-[0px] text-[17px]">
        {/* Session Title - iOS Large Title Style */}
        <div className="text-center">
          <h1 className="text-foreground text-[16px] font-medium mt-[15px] mb-[15px]">
            {session.name}
          </h1>
        </div>

        {/* Exercise Progress - iOS Style */}
        <div className="flex items-center justify-between">
          <div className="text-ios-callout text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {session.exercises.length}
          </div>
          <div className="text-ios-callout font-semibold text-primary">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>

        {/* Progress Indicator - Clean iOS Style */}
        <div className="space-y-3">
          {circularProgressEnabled ? (
            <div className="flex justify-center py-2">
              <CircularProgress 
                progress={progressPercentage}
                size={60}
                strokeWidth={6}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-1.5 bg-muted" />
              <div className="text-center">
                <span className="text-ios-caption1 text-muted-foreground">
                  {completedSets} of {totalSets} sets completed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Current Exercise Info - iOS Style */}
        {currentExercise && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-ios-headline font-semibold text-foreground">
                  {currentExercise.exercise.name}
                </h3>
                <p className="text-ios-footnote text-muted-foreground mt-1">
                  {currentExercise.exercise.muscleGroups.join(', ')} • {currentExercise.exercise.equipment}
                </p>
              </div>
              <div className="ml-4">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                  <span className="text-ios-caption1 font-medium">
                    {currentExercise.exercise.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Enhanced Tabs Interface */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Workout Execution
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Exercise Management
          </TabsTrigger>
        </TabsList>

        {/* Workout Execution Tab */}
        <TabsContent value="execution" className="space-y-4 mt-4">
          {/* Current Exercise Display */}
          {currentExercise && (
            <div className="ios-card p-4 space-y-4">
              

                {/* Current Set Input */}
                {currentSet && (
                  <EnhancedSetInput
                    set={currentSet}
                    recommendation={getExerciseRecommendation(currentExercise.exerciseId)}
                    setRecommendation={getSetRecommendation(currentExercise.exerciseId, currentSet.setNumber)}
                    onUpdateSet={(field, value) => updateSet(currentExercise.id, currentSetIndex, field, value)}
                    onCompleteSet={completeSet}
                    isActive={true}
                    weightUnit={weightUnit}
                    onWeightUnitChange={setWeightUnit}
                    userId={session?.userId || 1}
                    isBodyWeightExercise={isBodyWeightExercise(currentExercise.exercise)}
                  />
                )}

              {/* All Sets Overview - iOS List Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">All Sets</h4>
                  {/* Add/Remove Set Buttons - iOS Style */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => addSet(currentExercise.id)}
                      className="ios-touch-feedback w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
                      title="Add Set"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                    {currentSets.length > 1 && (
                      <button
                        onClick={() => removeSet(currentExercise.id, currentSetIndex)}
                        className="ios-touch-feedback w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"
                        title="Remove Set"
                      >
                        <Minus className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  {currentSets.map((set, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        index === currentSetIndex
                          ? 'bg-primary/5 border border-primary/30'
                          : set.completed
                          ? 'bg-emerald-500/5 border border-emerald-500/20'
                          : 'border border-border/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setCurrentSetIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Set {set.setNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {set.completed ? (
                            <>
                              <span className="text-xs text-emerald-400 font-medium">
                                {set.weight}{weightUnit} × {set.actualReps} @ RPE {set.rpe}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetSet(currentExercise.id, index);
                                }}
                                className="ios-touch-feedback w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center"
                                title="Reset Set"
                              >
                                <RotateCcw className="h-3 w-3 text-orange-400" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Target: {getSetRecommendation(currentExercise.exerciseId, set.setNumber)?.recommendedReps || set.targetReps} reps
                              {getSetRecommendation(currentExercise.exerciseId, set.setNumber) && (
                                <span className="text-xs text-emerald-400 ml-1">(Rec)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* iOS-Style Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentExerciseIndex === 0}
              onClick={() => {
                setCurrentExerciseIndex(currentExerciseIndex - 1);
                setCurrentSetIndex(0);
              }}
              className={`ios-touch-feedback flex items-center gap-2 p-2.5 rounded-lg border border-border/30 flex-1 ${
                currentExerciseIndex === 0 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              <ArrowLeft className="h-4 w-4 text-primary" />
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Previous</div>
                {currentExerciseIndex > 0 && (
                  <div className="text-xs font-medium text-foreground truncate">
                    {session.exercises[currentExerciseIndex - 1]?.exercise.name}
                  </div>
                )}
              </div>
            </button>
            
            <button
              disabled={currentExerciseIndex === session.exercises.length - 1}
              onClick={() => {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSetIndex(0);
              }}
              className={`ios-touch-feedback flex items-center gap-2 p-2.5 rounded-lg border border-border/30 flex-1 ${
                currentExerciseIndex === session.exercises.length - 1 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              <div className="text-right flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Next</div>
                {currentExerciseIndex < session.exercises.length - 1 && (
                  <div className="text-xs font-medium text-foreground truncate">
                    {session.exercises[currentExerciseIndex + 1]?.exercise.name}
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-primary" />
            </button>
          </div>
        </TabsContent>

        {/* Exercise Management Tab */}
        <TabsContent value="exercises" className="space-y-4 mt-4">
          <DraggableExerciseList
            exercises={session.exercises}
            sessionId={sessionId}
            currentExerciseIndex={currentExerciseIndex}
            onExerciseSelect={setCurrentExerciseIndex}
            onExercisesReorder={handleExercisesReorder}
          />
        </TabsContent>
      </Tabs>
      {/* iOS-Style Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={saveAndExit} 
          disabled={saveProgressMutation.isPending}
          className="ios-touch-feedback flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2.5 px-3 rounded-lg border border-border/30 flex items-center justify-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">Save & Exit</span>
        </button>
        <button 
          onClick={completeWorkout} 
          disabled={saveProgressMutation.isPending}
          className="ios-touch-feedback flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Complete Workout</span>
        </button>
      </div>
      {/* Enhanced Rest Timer FAB */}
      {restTimerFABEnabled && (
        <RestTimerFAB
          isActive={isRestTimerActive}
          timeRemaining={restTimeRemaining}
          totalTime={customRestTime || currentExercise?.restPeriod || 120}
          defaultRestPeriod={currentExercise?.restPeriod || 120}
          onSkip={() => {
            setIsRestTimerActive(false);
            setRestTimeRemaining(0);
          }}
          onCustomTimeSet={(seconds) => {
            setCustomRestTime(seconds);
            setRestTimeRemaining(seconds);
            setIsRestTimerActive(true);
            toast({
              title: "Custom Rest Timer Started",
              description: `Rest for ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
              duration: 2000,
            });
          }}
          position="bottom-left"
          draggable={false}
        />
      )}
      {/* WorkoutFeedbackDialog - Critical Missing Component */}
      {showFeedback && session && (
        <WorkoutFeedbackDialog
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          sessionId={parseInt(sessionId, 10)}
          userId={session.userId}
          onSubmitComplete={() => {
            setShowFeedback(false);
            // Additional cache invalidation after feedback submission
            queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
            queryClient.invalidateQueries({ predicate: (query) => 
              query.queryKey[0] === "/api/training/sessions" && query.queryKey[1] === "1"
            });
            queryClient.invalidateQueries({ predicate: (query) => 
              query.queryKey[0] === "/api/training/stats" && query.queryKey[1] === "1"
            });
            onComplete();
          }}
        />
      )}
    </div>
  );
};