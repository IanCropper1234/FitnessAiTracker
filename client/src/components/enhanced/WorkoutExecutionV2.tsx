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
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Header behavior utilities
  const toggleHeaderExpansion = () => {
    setHeaderExpanded(!headerExpanded);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    setHeaderVisible(false); // Auto-hide during input
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    setHeaderVisible(true); // Show again when input loses focus
  };

  const handleScreenTap = () => {
    if (!headerVisible && !inputFocused) {
      setHeaderVisible(true); // Tap anywhere to reveal header
    }
  };

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
    <div className="space-y-4 max-w-4xl mx-auto" {...swipeHandlers} onClick={handleScreenTap}>
      {/* Dynamic Responsive Header - Collapsible + Sticky + Floating */}
      <div 
        className={`
          fixed top-0 left-0 right-0 z-50 mx-auto max-w-4xl
          transition-all duration-300 ease-in-out
          ${headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
          ${inputFocused ? 'backdrop-blur-sm bg-background/80' : 'bg-background/95 backdrop-blur-md'}
          border-b border-border/50 shadow-sm
        `}
      >
        {/* Sticky Smart Bar - Always Visible Minimal Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={toggleHeaderExpansion}
        >
          {/* Left: Current Exercise + Set Counter */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {currentSetIndex + 1}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {currentExercise?.exercise.name || 'No exercise'}
                </h3>
                <div className="text-xs text-muted-foreground">
                  Set {currentSetIndex + 1} of {currentSets.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Progress + Expand Icon */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-semibold text-primary">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {currentExerciseIndex + 1}/{session.exercises.length}
              </div>
            </div>
            <div className={`transform transition-transform duration-200 ${headerExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Collapsible Expanded Content */}
        <div 
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${headerExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="px-3 pb-3 space-y-3 border-t border-border/30">
            {/* Session Info */}
            <div className="text-center pt-2">
              <h1 className="text-foreground text-sm font-medium">
                {session.name}
              </h1>
            </div>

            {/* Detailed Progress */}
            <div className="space-y-2">
              {circularProgressEnabled ? (
                <div className="flex justify-center">
                  <CircularProgress 
                    progress={progressPercentage}
                    size={40}
                    strokeWidth={4}
                  />
                </div>
              ) : (
                <Progress value={progressPercentage} className="h-1.5 bg-muted" />
              )}
              <div className="text-center">
                <span className="text-xs text-muted-foreground">
                  {completedSets} of {totalSets} sets completed
                </span>
              </div>
            </div>

            {/* Current Exercise Details */}
            {currentExercise && (
              <div className="bg-muted/20 rounded-lg p-2.5 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {currentExercise.exercise.muscleGroups.join(', ')} • {currentExercise.exercise.equipment}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <span className="text-xs font-medium">
                        {currentExercise.exercise.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className={`transition-all duration-300 ${headerVisible ? (headerExpanded ? 'h-32' : 'h-16') : 'h-0'}`}></div>
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
            <div className="ios-card p-3 space-y-3">
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
                  onInputFocus={handleInputFocus}
                  onInputBlur={handleInputBlur}
                />
              )}

              {/* All Sets Overview - Enhanced User-Friendly Design */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">Sets Progress</h4>
                    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {currentSets.filter(s => s.completed).length}/{currentSets.length}
                    </div>
                  </div>
                  {/* Add/Remove Set Buttons - Enhanced Style */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addSet(currentExercise.id)}
                      className="ios-touch-feedback flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"
                      title="Add Set"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="text-xs font-medium">Add</span>
                    </button>
                    {currentSets.length > 1 && (
                      <button
                        onClick={() => removeSet(currentExercise.id, currentSetIndex)}
                        className="ios-touch-feedback flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20"
                        title="Remove Set"
                      >
                        <Minus className="h-3 w-3" />
                        <span className="text-xs font-medium">Remove</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Sets Grid - Optimized for Quick Selection */}
                <div className="grid grid-cols-1 gap-2">
                  {currentSets.map((set, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        index === currentSetIndex
                          ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20'
                          : set.completed
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-card border-border/50 hover:bg-muted/30 hover:border-border'
                      }`}
                      onClick={() => setCurrentSetIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Set Info - Left Side */}
                        <div className="flex items-center gap-3">
                          {/* Set Number Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === currentSetIndex
                              ? 'bg-primary text-primary-foreground'
                              : set.completed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {set.setNumber}
                          </div>
                          
                          {/* Set Status */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {set.completed ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    Completed
                                  </span>
                                </div>
                              ) : index === currentSetIndex ? (
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-primary" />
                                  <span className="text-sm font-medium text-primary">
                                    Current Set
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Pending
                                </span>
                              )}
                            </div>
                            {/* Target/Actual Reps */}
                            <div className="text-xs text-muted-foreground">
                              {set.completed ? (
                                `${set.weight}${weightUnit} × ${set.actualReps} reps @ RPE ${set.rpe}`
                              ) : (
                                <>
                                  Target: {getSetRecommendation(currentExercise.exerciseId, set.setNumber)?.recommendedReps || set.targetReps} reps
                                  {getSetRecommendation(currentExercise.exerciseId, set.setNumber) && (
                                    <span className="text-emerald-500 ml-1 font-medium">(Recommended)</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Right Side */}
                        <div className="flex items-center gap-1">
                          {set.completed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                resetSet(currentExercise.id, index);
                              }}
                              className="ios-touch-feedback flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 hover:bg-orange-500/20"
                              title="Reset Set"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="text-xs font-medium">Reset</span>
                            </button>
                          )}
                          {index === currentSetIndex && !set.completed && (
                            <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-lg">
                              Active
                            </div>
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