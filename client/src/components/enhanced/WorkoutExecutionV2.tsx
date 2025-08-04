import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  // Support both field names for backward compatibility
  specialMethod?: 'myorep_match' | 'myorep_no_match' | 'drop_set' | 'superset' | 'giant_set' | null;
  specialTrainingMethod?: 'myorep_match' | 'myorep_no_match' | 'drop_set' | 'superset' | 'giant_set' | null;
  specialConfig?: any;
  specialMethodConfig?: any;
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
  const circularProgressFeature = useFeature('circularProgress');
  
  // Local state for progress display
  const [circularProgressEnabled, setCircularProgressEnabled] = useState(circularProgressFeature);

  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState<Record<number, WorkoutSet[]>>({});
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [customRestTime, setCustomRestTime] = useState<number | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [headerExpanded, setHeaderExpanded] = useState(false);
  
  // Auto-collapse header after inactivity
  useEffect(() => {
    if (headerExpanded) {
      const timer = setTimeout(() => {
        setHeaderExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [headerExpanded]);
  const [activeTab, setActiveTab] = useState<'execution' | 'exercises'>('execution');

  
  // Special training methods state
  const [specialMethods, setSpecialMethods] = useState<Record<number, string | null>>({});
  const [specialConfigs, setSpecialConfigs] = useState<Record<number, any>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
      const initialSpecialMethods: Record<number, string | null> = {};
      const initialSpecialConfigs: Record<number, any> = {};
      
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
        
        // Restore special method data if available - check both field names for compatibility
        const specialMethod = exercise.specialMethod || exercise.specialTrainingMethod;
        if (specialMethod) {
          console.log(`Restoring special method for exercise ${exercise.id}:`, specialMethod);
          initialSpecialMethods[exercise.id] = specialMethod;
        }
        
        const specialConfig = exercise.specialConfig || exercise.specialMethodConfig;
        if (specialConfig) {
          console.log(`Restoring special config for exercise ${exercise.id}:`, specialConfig);
          // Transform database format back to UI format
          let uiConfig = { ...specialConfig };
          
          // Transform stored config format to UI format based on method
          if (specialMethod === 'myorep_match' || specialMethod === 'myorep_no_match') {
            // For Myorep methods, use the same structure as creation phase
            uiConfig.targetReps = specialConfig.targetReps || 15;
            uiConfig.miniSets = specialConfig.miniSets || 3;
            uiConfig.restSeconds = specialConfig.restSeconds || 20;
            uiConfig.activationSet = specialConfig.activationSet !== false; // Default to true
          }
          
          if (specialMethod === 'drop_set') {
            // For Drop Set, use the same structure as creation phase
            uiConfig.dropSets = specialConfig.dropSets || 3;
            uiConfig.weightReductions = specialConfig.weightReductions || [15, 15, 15];
            uiConfig.dropRestSeconds = specialConfig.dropRestSeconds || 10;
            
            // Legacy support for execution-specific fields
            if (specialConfig.dropsetWeight) {
              uiConfig.dropsetWeight = specialConfig.dropsetWeight;
            }
          }
          
          if (specialMethod === 'giant_set') {
            // For Giant Set, handle different config formats
            uiConfig.totalTargetReps = specialConfig.totalTargetReps || 40;
            
            // Handle both numeric and string formats for miniSetReps
            if (typeof specialConfig.miniSetReps === 'string') {
              uiConfig.miniSetReps = specialConfig.miniSetReps;
            } else {
              uiConfig.miniSetReps = specialConfig.miniSetReps || 5;
            }
            
            // Handle different rest field names
            uiConfig.restSeconds = specialConfig.restSeconds || 
                                 specialConfig.giantRestSeconds || 10;
          }
          
          console.log(`Final UI config for exercise ${exercise.id}:`, uiConfig);
          initialSpecialConfigs[exercise.id] = uiConfig;
        }
      });
      
      console.log('Initialized workout data:', initialData);
      console.log('Restored special methods:', initialSpecialMethods);
      console.log('Restored special configs:', initialSpecialConfigs);
      
      setWorkoutData(initialData);
      setSpecialMethods(initialSpecialMethods);
      setSpecialConfigs(initialSpecialConfigs);
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

  // Save progress mutation with comprehensive error handling
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      try {
        if (!progressData || !sessionId) {
          throw new Error('Missing required data for saving progress');
        }
        
        const response = await apiRequest("PUT", `/api/training/sessions/${sessionId}/progress`, progressData);
        return response;
      } catch (error) {
        console.error('Save progress mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      try {
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
        
        if (variables?.isCompleted) {
          // Workout completed - navigate to feedback page
          toast({
            title: "Workout Completed!",
            description: "Great job! Redirecting to feedback...",
          });
          setLocation(`/workout-feedback/${sessionId}`);
        } else {
          // Just saving progress
          toast({
            title: "Progress Saved",
            description: "Your workout progress has been saved.",
          });
          onComplete();
        }
      } catch (error) {
        console.error('Error in onSuccess handler:', error);
      }
    },
    onError: (error: any) => {
      console.error('Save progress mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to save workout progress: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin  h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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

  // Special training methods handlers
  const handleSpecialMethodChange = (exerciseId: number, method: string | null) => {
    setSpecialMethods(prev => ({
      ...prev,
      [exerciseId]: method
    }));
    
    // Reset config when method changes
    if (method !== specialMethods[exerciseId]) {
      setSpecialConfigs(prev => ({
        ...prev,
        [exerciseId]: method === 'giant_set' ? {
          totalTargetReps: 40,
          miniSetReps: 5,
          restSeconds: 10
        } : {}
      }));
    }
  };

  const handleSpecialConfigChange = (exerciseId: number, config: any) => {
    setSpecialConfigs(prev => ({
      ...prev,
      [exerciseId]: config
    }));
  };

  // Helper function to find superset paired exercise
  const findSupersetPair = (exerciseId: number): WorkoutExercise | null => {
    if (!session?.exercises) return null;
    
    const currentEx = session.exercises.find(ex => ex.id === exerciseId);
    if (!currentEx || specialMethods[exerciseId] !== 'superset') return null;
    
    const pairedExerciseId = specialConfigs[exerciseId]?.pairedExerciseId;
    if (!pairedExerciseId) return null;
    
    return session.exercises.find(ex => ex.exerciseId === pairedExerciseId) || null;
  };

  const completeSet = () => {
    try {
      if (!currentSet?.weight || !currentSet?.actualReps) {
        toast({
          title: "Incomplete Set",
          description: "Please enter weight and reps before completing the set.",
          variant: "destructive",
        });
        return;
      }

      if (!currentExercise?.id) {
        console.error('No current exercise found');
        return;
      }

      updateSet(currentExercise.id, currentSetIndex, 'completed', true);
      
      // Check for Superset auto-switching
      const isCurrentSuperset = specialMethods[currentExercise.id] === 'superset';
      const pairedExercise = findSupersetPair(currentExercise.id);
      
      if (isCurrentSuperset && pairedExercise) {
        // Find the index of the paired exercise in the session
        const pairedExerciseIndex = session!.exercises.findIndex(ex => ex.id === pairedExercise.id);
        
        if (pairedExerciseIndex !== -1) {
          // Check if the same set number exists in the paired exercise
          const pairedSets = workoutData[pairedExercise.id] || [];
          const correspondingSetIndex = currentSetIndex; // Same set number
          
          if (correspondingSetIndex < pairedSets.length && !pairedSets[correspondingSetIndex]?.completed) {
            // Switch to the paired exercise at the same set number
            setCurrentExerciseIndex(pairedExerciseIndex);
            setCurrentSetIndex(correspondingSetIndex);
            
            // Shorter rest for superset transition
            if (restTimerFABEnabled) {
              const supersetRestTime = Math.min(specialConfigs[currentExercise.id]?.restSeconds || 30, 30);
              setRestTimeRemaining(supersetRestTime);
              setIsRestTimerActive(true);
            }
            
            toast({
              title: "Superset Switch!",
              description: `Switching to ${pairedExercise.exercise.name} - Set ${correspondingSetIndex + 1}`,
              duration: 3000,
            });
            return; // Early return to prevent normal progression
          }
        }
      }
      
      // Normal progression logic (when not superset or no paired exercise available)
      if (currentSetIndex < currentSets.length - 1) {
        // Next set in same exercise
        if (restTimerFABEnabled) {
          const restTime = customRestTime || currentExercise.restPeriod || 120;
          setRestTimeRemaining(restTime);
          setIsRestTimerActive(true);
          toast({
            title: "Set Complete!",
            description: `Rest ${Math.floor(restTime / 60)}:${(restTime % 60).toString().padStart(2, '0')} before next set`,
            duration: 3000,
          });
        }
        setCurrentSetIndex(currentSetIndex + 1);
      } else if (currentExerciseIndex < (session?.exercises?.length || 0) - 1) {
        // Move to next exercise
        const nextExercise = session?.exercises?.[currentExerciseIndex + 1];
        if (nextExercise) {
          setCurrentExerciseIndex(currentExerciseIndex + 1);
          setCurrentSetIndex(0);
          toast({
            title: "Exercise Complete!",
            description: `Moving to ${nextExercise.exercise.name}`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Error completing set:', error);
      toast({
        title: "Error",
        description: "Failed to complete set. Please try again.",
        variant: "destructive",
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
      
      return {
        ...prev,
        [exerciseId]: newSets
      };
    });
    
    // Toast outside of state setter
    setTimeout(() => {
      toast({
        title: "Set Added",
        description: `Added Set ${workoutData[exerciseId]?.length || 1} to ${currentExercise?.exercise.name}`,
        duration: 2000,
      });
    }, 0);
  };

  const removeSet = (exerciseId: number, setIndex: number) => {
    const currentSets = workoutData[exerciseId] || [];
    
    if (currentSets.length <= 1) {
      toast({
        title: "Cannot Remove Set",
        description: "Each exercise must have at least one set.",
        variant: "destructive",
      });
      return;
    }

    const setToRemove = currentSets[setIndex];
    if (setToRemove?.completed) {
      toast({
        title: "Cannot Remove Completed Set",
        description: "You cannot remove a completed set.",
        variant: "destructive",
      });
      return;
    }

    const newSets = currentSets.filter((_, i) => i !== setIndex).map((set, i) => ({
      ...set,
      setNumber: i + 1
    }));
    
    setWorkoutData(prev => ({
      ...prev,
      [exerciseId]: newSets
    }));
    
    // Adjust current set index if needed
    if (setIndex <= currentSetIndex && currentSetIndex > 0) {
      setCurrentSetIndex(currentSetIndex - 1);
    } else if (setIndex < currentSets.length - 1 && currentSetIndex >= newSets.length) {
      setCurrentSetIndex(newSets.length - 1);
    }
    
    // Toast outside of state setter
    setTimeout(() => {
      toast({
        title: "Set Removed",
        description: `Removed set from ${currentExercise?.exercise.name}`,
        duration: 2000,
      });
    }, 0);
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
    try {
      if (!session?.exercises || !sessionStartTime) {
        console.error('Missing session data for save and exit');
        toast({
          title: "Error",
          description: "Cannot save workout - missing session data",
          variant: "destructive",
        });
        return;
      }

      const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
      const totalVolume = Math.round(Object.values(workoutData)
        .flat()
        .filter(set => set?.completed)
        .reduce((sum, set) => sum + ((set?.weight || 0) * (set?.actualReps || 0)), 0));

      const progressData = {
        duration,
        totalVolume,
        isCompleted: false,
        exercises: session.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          sets: workoutData[exercise.id] || [],
          specialMethod: specialMethods[exercise.id] || null,
          specialConfig: specialConfigs[exercise.id] || null
        }))
      };

      saveProgressMutation.mutate(progressData);
    } catch (error) {
      console.error('Error in saveAndExit:', error);
      toast({
        title: "Error",
        description: "Failed to save workout progress",
        variant: "destructive",
      });
    }
  };

  const completeWorkout = () => {
    try {
      if (!session?.exercises || !sessionStartTime) {
        console.error('Missing session data for workout completion');
        toast({
          title: "Error",
          description: "Cannot complete workout - missing session data",
          variant: "destructive",
        });
        return;
      }

      // Validation: Check if all sets are completed
      const allSets = Object.values(workoutData).flat();
      const completedSets = allSets.filter(set => set?.completed);
      const incompleteSets = allSets.filter(set => !set?.completed);
      
      if (incompleteSets.length > 0) {
        toast({
          title: "Cannot Complete Workout",
          description: `Please complete all ${incompleteSets.length} remaining set(s) before finishing the workout.`,
          variant: "destructive",
        });
        return;
      }

      const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
      const totalVolume = Math.round(Object.values(workoutData)
        .flat()
        .filter(set => set?.completed)
        .reduce((sum, set) => sum + ((set?.weight || 0) * (set?.actualReps || 0)), 0));

      const progressData = {
        duration,
        totalVolume,
        isCompleted: true,
        exercises: session.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          sets: workoutData[exercise.id] || [],
          specialMethod: specialMethods[exercise.id] || null,
          specialConfig: specialConfigs[exercise.id] || null
        }))
      };

      saveProgressMutation.mutate(progressData);
    } catch (error) {
      console.error('Error in completeWorkout:', error);
      toast({
        title: "Error",
        description: "Failed to complete workout",
        variant: "destructive",
      });
    }
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
    <div className="space-y-2 max-w-4xl mx-auto ios-list-scroll animated-element" {...swipeHandlers}>
      {/* iOS-Style Expandable Compact Header */}
      <div className="ios-card overflow-hidden animated-element">
        {/* Collapsed State - Ultra Compact Single Row */}
        <div 
          className="flex items-center justify-between p-2 cursor-pointer ios-touch-feedback transition-all duration-200 hover:bg-muted/30"
          onClick={() => setHeaderExpanded(!headerExpanded)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Exercise Index & Progress */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 ">
                {currentExerciseIndex + 1}/{session.exercises.length}
              </span>
              <span className="text-xs font-semibold text-primary">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            {/* Exercise Name with Superset Indicator */}
            {currentExercise && (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {currentExercise.exercise.name}
                </span>
                {specialMethods[currentExercise.id] === 'superset' && (() => {
                  const pairedExercise = findSupersetPair(currentExercise.id);
                  return pairedExercise ? (
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-1 py-0.5  border border-purple-500/20">
                      ↔ {pairedExercise.exercise.name}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
            
            {/* Special Method Indicator Dot */}
            {currentExercise && specialMethods[currentExercise.id] && specialMethods[currentExercise.id] !== null && (
              <div className={`w-2 h-2  ${
                specialMethods[currentExercise.id] === 'myorep_match' || specialMethods[currentExercise.id] === 'myorep_no_match' ? 'bg-blue-500' :
                specialMethods[currentExercise.id] === 'drop_set' ? 'bg-red-500' :
                specialMethods[currentExercise.id] === 'superset' ? 'bg-purple-500' :
                specialMethods[currentExercise.id] === 'giant_set' ? 'bg-orange-500' :
                'bg-gray-500'
              }`} />
            )}
          </div>
          
          {/* Expand/Collapse Chevron */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {completedSets}/{totalSets}
            </span>
            <div className={`transform transition-transform duration-200 ${headerExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expanded State - Detailed View with Smooth Transitions */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            headerExpanded 
              ? 'max-h-96 opacity-100 border-t border-border/30 bg-muted/10' 
              : 'max-h-0 opacity-0'
          }`}
        >
          {headerExpanded && (
            <div className="p-2 space-y-2">
              {/* Session Info Row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">
                {session.name}
              </span>

            </div>

            {/* Progress Display - Bar View Only */}
            <div className="space-y-1">
              <Progress value={progressPercentage} className="h-1.5 bg-muted" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Workout Progress</span>
                <span>{Math.floor((Date.now() - sessionStartTime) / 1000 / 60)}min elapsed</span>
              </div>
            </div>

            {/* Special Training Method Details */}
            {currentExercise && specialMethods[currentExercise.id] && specialMethods[currentExercise.id] !== null && (
              <div className="border border-border/50  p-2 bg-background/50">
                <div className="flex items-center justify-between mb-1">
                  <div className={`px-2 py-1  text-xs font-medium border ${
                    specialMethods[currentExercise.id] === 'myorep_match' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                    specialMethods[currentExercise.id] === 'myorep_no_match' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                    specialMethods[currentExercise.id] === 'drop_set' ? 'bg-red-500/10 border-red-500/30 text-red-600' :
                    specialMethods[currentExercise.id] === 'superset' ? 'bg-purple-500/10 border-purple-500/30 text-purple-600' :
                    specialMethods[currentExercise.id] === 'giant_set' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' :
                    'bg-gray-500/10 border-gray-500/30 text-gray-600'
                  }`}>
                    {specialMethods[currentExercise.id] === 'myorep_match' ? 'Myorep Match' :
                     specialMethods[currentExercise.id] === 'myorep_no_match' ? 'Myorep No Match' :
                     specialMethods[currentExercise.id] === 'drop_set' ? 'Drop Set' :
                     specialMethods[currentExercise.id] === 'superset' ? 'Superset' :
                     specialMethods[currentExercise.id] === 'giant_set' ? 'Giant Set' :
                     specialMethods[currentExercise.id]}
                  </div>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                
                {/* Method Configuration Details */}
                <div className="space-y-1 text-xs">
                  {/* Drop Set Configuration */}
                  {specialMethods[currentExercise.id] === 'drop_set' && specialConfigs[currentExercise.id] && (
                    <>
                      {/* Drop Set Count */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Drop Sets:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].dropSets || 3}</span>
                      </div>
                      
                      {/* Drop Set Weights */}
                      {specialConfigs[currentExercise.id].dropSetWeights && specialConfigs[currentExercise.id].dropSetWeights.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Weights:</span>
                          <span className="font-medium">
                            {specialConfigs[currentExercise.id].dropSetWeights.map((weight: number, index: number) => 
                              `${weight}kg`
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Drop Set Target Reps */}
                      {specialConfigs[currentExercise.id].dropSetReps && specialConfigs[currentExercise.id].dropSetReps.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Reps:</span>
                          <span className="font-medium">
                            {specialConfigs[currentExercise.id].dropSetReps.map((reps: number, index: number) => 
                              `${reps} reps`
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Rest Between Drops */}
                      {specialConfigs[currentExercise.id].dropRestSeconds && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rest:</span>
                          <span className="font-medium">{specialConfigs[currentExercise.id].dropRestSeconds}s</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Myorep Match Configuration */}
                  {specialMethods[currentExercise.id] === 'myorep_match' && specialConfigs[currentExercise.id] && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Reps:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].targetReps || 15}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mini Sets:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].miniSets || 3}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rest:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].restSeconds || 20}s</span>
                      </div>
                    </>
                  )}
                  
                  {/* Myorep No Match Configuration */}
                  {specialMethods[currentExercise.id] === 'myorep_no_match' && specialConfigs[currentExercise.id] && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mini Sets:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].miniSets || 3}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rest:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].restSeconds || 20}s</span>
                      </div>
                    </>
                  )}
                  
                  {/* Superset Configuration */}
                  {specialMethods[currentExercise.id] === 'superset' && (() => {
                    const pairedExercise = findSupersetPair(currentExercise.id);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paired With:</span>
                          <span className="font-medium text-purple-400">
                            {pairedExercise?.exercise.name || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rest Between:</span>
                          <span className="font-medium">{specialConfigs[currentExercise.id]?.restSeconds || 60}s</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Performs back-to-back with minimal rest
                        </div>
                      </>
                    );
                  })()}
                  
                  {/* Giant Set Configuration */}
                  {specialMethods[currentExercise.id] === 'giant_set' && specialConfigs[currentExercise.id] && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Reps:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].totalTargetReps || 40}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Mini-Set:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].miniSetReps || 5}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rest:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].restSeconds || 15}s</span>
                      </div>
                    </>
                  )}
                  
                  {/* Superset Configuration */}
                  {specialMethods[currentExercise.id] === 'superset' && specialConfigs[currentExercise.id] && (
                    <>
                      {specialConfigs[currentExercise.id].pairedExerciseId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paired Exercise:</span>
                          <span className="font-medium text-xs">ID {specialConfigs[currentExercise.id].pairedExerciseId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rest Between Sets:</span>
                        <span className="font-medium">{specialConfigs[currentExercise.id].restSeconds || 60}s</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
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
        <TabsContent value="execution" className="space-y-2 mt-2">
          {/* Current Exercise Display */}
          {currentExercise && (
            <div className="ios-card p-1.5 space-y-1.5">
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
                  exerciseId={currentExercise.exerciseId}
                  isBodyWeightExercise={isBodyWeightExercise(currentExercise.exercise)}
                  specialMethod={specialMethods[currentExercise.id] as any}
                  onSpecialMethodChange={(method) => handleSpecialMethodChange(currentExercise.id, method)}
                  specialConfig={specialConfigs[currentExercise.id]}
                  onSpecialConfigChange={(config) => handleSpecialConfigChange(currentExercise.id, config)}
                  sessionExercises={session?.exercises}
                />
              )}

              {/* All Sets Overview - Ultra Compact */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-foreground">Sets</h4>
                    <div className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 ">
                      {currentSets.filter(s => s.completed).length}/{currentSets.length}
                    </div>
                  </div>
                  {/* Add/Remove Set Buttons - Compact Style */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => addSet(currentExercise.id)}
                      className="ios-touch-feedback flex items-center gap-0.5 px-1.5 py-1  bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"
                      title="Add Set"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="text-xs font-medium">Add</span>
                    </button>
                    {currentSets.length > 1 && (
                      <button
                        onClick={() => removeSet(currentExercise.id, currentSetIndex)}
                        className="ios-touch-feedback flex items-center gap-0.5 px-1.5 py-1  bg-red-500/10 border border-red-500/30 text-red-600 hover:bg-red-500/20"
                        title="Remove Set"
                      >
                        <Minus className="h-3 w-3" />
                        <span className="text-xs font-medium">Remove</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Sets Grid - Compact Mobile Layout */}
                <div className="grid grid-cols-1 gap-1.5">
                  {currentSets.map((set, index) => (
                    <div
                      key={index}
                      className={`p-2  cursor-pointer transition-all duration-200 border ${
                        index === currentSetIndex
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : set.completed
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-card border-border/50 hover:bg-muted/30 hover:border-border'
                      }`}
                      onClick={() => setCurrentSetIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Set Info - Left Side */}
                        <div className="flex items-center gap-2">
                          {/* Set Number Badge - Compact */}
                          <div className={`w-6 h-6  flex items-center justify-center text-xs font-bold ${
                            index === currentSetIndex
                              ? 'bg-primary text-primary-foreground'
                              : set.completed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {set.setNumber}
                          </div>
                          
                          {/* Set Status - Compact */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              {set.completed ? (
                                <div className="flex items-center gap-0.5">
                                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Done
                                  </span>
                                </div>
                              ) : index === currentSetIndex ? (
                                <div className="flex items-center gap-0.5">
                                  <Target className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-medium text-primary">
                                    Active
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Pending
                                </span>
                              )}
                            </div>
                            {/* Target/Actual Reps - Compact */}
                            <div className="text-xs text-muted-foreground leading-tight">
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
                            
                            {/* Special Training Method Indicator */}
                            {specialMethods[currentExercise.id] && specialMethods[currentExercise.id] !== null && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className={`px-1.5 py-0.5  text-xs font-medium border ${
                                  specialMethods[currentExercise.id] === 'myorep_match' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                                  specialMethods[currentExercise.id] === 'myorep_no_match' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                                  specialMethods[currentExercise.id] === 'drop_set' ? 'bg-red-500/10 border-red-500/30 text-red-600' :
                                  specialMethods[currentExercise.id] === 'superset' ? 'bg-purple-500/10 border-purple-500/30 text-purple-600' :
                                  specialMethods[currentExercise.id] === 'giant_set' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' :
                                  'bg-gray-500/10 border-gray-500/30 text-gray-600'
                                }`}>
                                  {specialMethods[currentExercise.id] === 'myorep_match' ? 'Myorep Match' :
                                   specialMethods[currentExercise.id] === 'myorep_no_match' ? 'Myorep No Match' :
                                   specialMethods[currentExercise.id] === 'drop_set' ? 'Drop Set' :
                                   specialMethods[currentExercise.id] === 'superset' ? 'Superset' :
                                   specialMethods[currentExercise.id] === 'giant_set' ? 'Giant Set' :
                                   specialMethods[currentExercise.id]}
                                </div>
                                
                                {/* Mini-Set Reps Display */}
                                {(specialMethods[currentExercise.id] === 'myorep_match' || specialMethods[currentExercise.id] === 'drop_set') && 
                                 specialConfigs[currentExercise.id]?.miniSetReps && (
                                  <div className="text-xs text-muted-foreground">
                                    Reps: {specialConfigs[currentExercise.id].miniSetReps}
                                  </div>
                                )}
                                
                                {/* Dropset Weight Display */}
                                {specialMethods[currentExercise.id] === 'drop_set' && 
                                 specialConfigs[currentExercise.id]?.dropsetWeight && (
                                  <div className="text-xs text-muted-foreground">
                                    Weights: {specialConfigs[currentExercise.id].dropsetWeight}
                                  </div>
                                )}
                                
                                {/* Giant Set Display */}
                                {specialMethods[currentExercise.id] === 'giant_set' && 
                                 specialConfigs[currentExercise.id] && (
                                  <div className="text-xs text-muted-foreground">
                                    Target: {specialConfigs[currentExercise.id].totalTargetReps || 40} reps, 
                                    {specialConfigs[currentExercise.id].miniSetReps || 5} per mini-set
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Right Side - Compact */}
                        <div className="flex items-center gap-0.5">
                          {set.completed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                resetSet(currentExercise.id, index);
                              }}
                              className="ios-touch-feedback flex items-center gap-0.5 px-1.5 py-0.5  bg-orange-500/10 border border-orange-500/30 text-orange-600 hover:bg-orange-500/20"
                              title="Reset Set"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="text-xs font-medium">Reset</span>
                            </button>
                          )}
                          {index === currentSetIndex && !set.completed && (
                            <div className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 ">
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

          {/* Ultra Compact Navigation */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              disabled={currentExerciseIndex === 0}
              onClick={() => {
                setCurrentExerciseIndex(currentExerciseIndex - 1);
                setCurrentSetIndex(0);
              }}
              className={`ios-button touch-target flex items-center gap-1.5 p-1.5  border border-border/30 ${
                currentExerciseIndex === 0 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 text-primary" />
              <div className="text-left flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Prev</div>
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
              className={`ios-button touch-target flex items-center gap-1.5 p-1.5  border border-border/30 ${
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
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        </TabsContent>

        {/* Exercise Management Tab */}
        <TabsContent value="exercises" className="space-y-2 mt-2">
          <DraggableExerciseList
            exercises={session.exercises}
            sessionId={sessionId}
            currentExerciseIndex={currentExerciseIndex}
            onExerciseSelect={setCurrentExerciseIndex}
            onExercisesReorder={handleExercisesReorder}
          />
        </TabsContent>
      </Tabs>
      {/* Ultra Compact Action Section */}
      <div className="ios-card p-1.5">
        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-border/30">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{completedSets}/{totalSets} sets</span>
            <span>•</span>
            <span>{Math.round(progressPercentage)}% done</span>
            <span>•</span>
            <span>{Math.floor((Date.now() - sessionStartTime) / 1000 / 60)}min</span>
          </div>
          <div className="text-xs font-medium text-primary">
            {session.exercises.length - currentExerciseIndex - 1} exercises left
          </div>
        </div>
        
        {/* Ultra Compact Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button 
            onClick={saveAndExit} 
            disabled={saveProgressMutation.isPending}
            className="ios-touch-feedback bg-secondary hover:bg-secondary/80 text-secondary-foreground py-1.5 px-1.5  border border-border/30 flex items-center justify-center gap-1 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Save & Exit</span>
          </button>
          <button 
            onClick={completeWorkout} 
            disabled={saveProgressMutation.isPending}
            className="ios-touch-feedback bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-1.5  flex items-center justify-center gap-1 transition-colors"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Complete Workout</span>
          </button>
        </div>
        
        {/* Loading indicator */}
        {saveProgressMutation.isPending && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-3 h-3 border border-primary border-t-transparent  animate-spin"></div>
              Saving...
            </div>
          </div>
        )}
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
        />
      )}

    </div>
  );
};