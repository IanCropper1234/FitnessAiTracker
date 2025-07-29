import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SpecialMethodSelector, SpecialTrainingMethod } from './SpecialMethodSelector';
import { MyorepsExecution } from './MyorepsExecution';
import { DropsetExecution } from './DropsetExecution';
import { SupersetExecution } from './SupersetExecution';
import { GiantSetExecution } from './GiantSetExecution';
import { EnhancedSetInput } from '../enhanced/EnhancedSetInput';
import { apiRequest } from '@/lib/queryClient';

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
}

interface SpecialTrainingWrapperProps {
  sets: WorkoutSet[];
  onSetsUpdate: (sets: WorkoutSet[], specialMethodData?: any) => void;
  exerciseId: number;
  exerciseName: string;
  weightUnit: 'kg' | 'lbs';
  onWeightUnitChange: (unit: 'kg' | 'lbs') => void;
  userId: number;
  isBodyWeightExercise?: boolean;
  activeSetIndex: number;
  onActiveSetChange: (index: number) => void;
  availableExercises?: Array<{ id: number; name: string; }>;
  initialSpecialMethod?: SpecialTrainingMethod;
  initialSpecialMethodData?: any;
}

// Default special method data structures
const getDefaultSpecialMethodData = (method: SpecialTrainingMethod) => {
  switch (method) {
    case 'myoreps':
      return {
        activationSet: { reps: 0, weight: 0, rpe: 0 },
        miniSets: [],
        restInterval: 20,
        terminationReason: undefined
      };
    case 'dropset':
      return {
        drops: [],
        totalDrops: 3,
        restBetweenDrops: 0
      };
    case 'superset':
      return {
        supersetType: 'agonist_antagonist',
        exercises: [
          { exerciseId: 0, exerciseName: '', order: 1, sets: [] },
          { exerciseId: 0, exerciseName: '', order: 2, sets: [] }
        ],
        restBetweenExercises: 10,
        restBetweenSupersets: 120,
        completedSupersets: 0,
        targetSupersets: 3
      };
    case 'giantset':
      return {
        exercises: [
          { exerciseId: 0, exerciseName: '', order: 1, sets: [] },
          { exerciseId: 0, exerciseName: '', order: 2, sets: [] },
          { exerciseId: 0, exerciseName: '', order: 3, sets: [] },
          { exerciseId: 0, exerciseName: '', order: 4, sets: [] }
        ],
        restBetweenExercises: 15,
        restBetweenCircuits: 180,
        completedCircuits: 0,
        targetCircuits: 3,
        circuitType: 'muscle_group'
      };
    default:
      return null;
  }
};

export function SpecialTrainingWrapper({
  sets,
  onSetsUpdate,
  exerciseId,
  exerciseName,
  weightUnit,
  onWeightUnitChange,
  userId,
  isBodyWeightExercise = false,
  activeSetIndex,
  onActiveSetChange,
  availableExercises = [],
  initialSpecialMethod = 'standard',
  initialSpecialMethodData
}: SpecialTrainingWrapperProps) {
  const [specialMethod, setSpecialMethod] = useState<SpecialTrainingMethod>(initialSpecialMethod);
  const [specialMethodData, setSpecialMethodData] = useState(
    initialSpecialMethodData || getDefaultSpecialMethodData(initialSpecialMethod)
  );
  const [isSpecialMethodActive, setIsSpecialMethodActive] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to save special training method data to database
  const saveSpecialMethodMutation = useMutation({
    mutationFn: async ({ method, data }: { method: SpecialTrainingMethod; data: any }) => {
      return apiRequest("/api/training/special-methods", {
        method: "POST",
        body: {
          exerciseId,
          method,
          data
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Special Training Method Saved",
        description: `${specialMethod} method data saved successfully`,
        duration: 2000,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/training/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/special-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save special training method data",
        variant: "destructive",
      });
    }
  });

  // Handle special method change
  const handleMethodChange = (method: SpecialTrainingMethod) => {
    setSpecialMethod(method);
    
    if (method === 'standard') {
      setSpecialMethodData(null);
      setIsSpecialMethodActive(false);
    } else {
      const defaultData = getDefaultSpecialMethodData(method);
      setSpecialMethodData(defaultData);
      setIsSpecialMethodActive(false); // Reset to setup phase
    }
  };

  // Handle special method data updates
  const handleSpecialMethodDataChange = (data: any) => {
    setSpecialMethodData(data);
  };

  // Handle special method completion
  const handleSpecialMethodComplete = () => {
    setIsSpecialMethodActive(false);
    
    // Convert special method data to workout sets
    const updatedSets = convertSpecialMethodToSets(specialMethod, specialMethodData);
    
    // Save special method data to database
    if (specialMethod !== 'standard' && specialMethodData) {
      saveSpecialMethodMutation.mutate({ 
        method: specialMethod, 
        data: specialMethodData 
      });
    }
    
    onSetsUpdate(updatedSets, { method: specialMethod, data: specialMethodData });
  };

  // Convert special method execution data to standard workout sets
  const convertSpecialMethodToSets = (method: SpecialTrainingMethod, data: any): WorkoutSet[] => {
    const newSets: WorkoutSet[] = [];

    switch (method) {
      case 'myoreps':
        if (data.activationSet?.reps > 0) {
          // Activation set
          newSets.push({
            setNumber: 1,
            targetReps: data.activationSet.reps,
            actualReps: data.activationSet.reps,
            weight: data.activationSet.weight,
            rpe: data.activationSet.rpe,
            completed: true
          });
          
          // Mini sets
          data.miniSets?.forEach((miniSet: any, index: number) => {
            newSets.push({
              setNumber: index + 2,
              targetReps: miniSet.targetReps,
              actualReps: miniSet.actualReps,
              weight: data.activationSet.weight,
              rpe: data.activationSet.rpe, // Use activation set RPE
              completed: true
            });
          });
        }
        break;

      case 'dropset':
        data.drops?.forEach((drop: any, index: number) => {
          newSets.push({
            setNumber: index + 1,
            targetReps: drop.reps,
            actualReps: drop.reps,
            weight: drop.weight,
            rpe: drop.rpe,
            completed: true
          });
        });
        break;

      case 'superset':
      case 'giantset':
        // For supersets and giant sets, we create sets for the primary exercise
        // Additional exercises would be handled separately in the workout structure
        if (data.exercises?.[0]?.sets) {
          data.exercises[0].sets.forEach((set: any, index: number) => {
            newSets.push({
              setNumber: index + 1,
              targetReps: set.reps,
              actualReps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
              completed: true
            });
          });
        }
        break;
    }

    return newSets;
  };

  // Update set data for standard training
  const handleSetUpdate = (setIndex: number, field: keyof WorkoutSet, value: any) => {
    const updatedSets = [...sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    onSetsUpdate(updatedSets);
  };

  // Complete a standard set
  const handleSetComplete = (setIndex: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], completed: true };
    onSetsUpdate(updatedSets);
    
    // Move to next set if available
    if (setIndex < sets.length - 1) {
      onActiveSetChange(setIndex + 1);
    }
  };

  // Add a new set
  const handleAddSet = () => {
    const newSet: WorkoutSet = {
      setNumber: sets.length + 1,
      targetReps: sets[sets.length - 1]?.targetReps || 8,
      actualReps: 0,
      weight: sets[sets.length - 1]?.weight || 0,
      rpe: 0,
      completed: false
    };
    onSetsUpdate([...sets, newSet]);
  };

  // Remove a set
  const handleRemoveSet = (setIndex: number) => {
    const updatedSets = sets.filter((_, index) => index !== setIndex);
    // Renumber sets
    const renumberedSets = updatedSets.map((set, index) => ({
      ...set,
      setNumber: index + 1
    }));
    onSetsUpdate(renumberedSets);
    
    // Adjust active set index if necessary
    if (activeSetIndex >= renumberedSets.length) {
      onActiveSetChange(Math.max(0, renumberedSets.length - 1));
    }
  };

  return (
    <div className="space-y-3">
      {/* Special Training Method Selector */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Training Method</span>
              <Badge variant="outline" className="text-xs">
                {exerciseName}
              </Badge>
            </div>
            
            <SpecialMethodSelector
              currentMethod={specialMethod}
              onMethodChange={handleMethodChange}
              exerciseName={exerciseName}
              disabled={isSpecialMethodActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Method Execution or Standard Sets */}
      {specialMethod !== 'standard' && !isSpecialMethodActive ? (
        // Special method setup/execution
        <div className="space-y-3">
          {specialMethod === 'myoreps' && (
            <MyorepsExecution
              data={specialMethodData}
              onDataChange={handleSpecialMethodDataChange}
              onComplete={handleSpecialMethodComplete}
              weightUnit={weightUnit}
            />
          )}
          
          {specialMethod === 'dropset' && (
            <DropsetExecution
              data={specialMethodData}
              onDataChange={handleSpecialMethodDataChange}
              onComplete={handleSpecialMethodComplete}
              weightUnit={weightUnit}
            />
          )}
          
          {specialMethod === 'superset' && (
            <SupersetExecution
              data={specialMethodData}
              onDataChange={handleSpecialMethodDataChange}
              onComplete={handleSpecialMethodComplete}
              weightUnit={weightUnit}
              availableExercises={availableExercises}
            />
          )}
          
          {specialMethod === 'giantset' && (
            <GiantSetExecution
              data={specialMethodData}
              onDataChange={handleSpecialMethodDataChange}
              onComplete={handleSpecialMethodComplete}
              weightUnit={weightUnit}
              availableExercises={availableExercises}
            />
          )}
        </div>
      ) : (
        // Standard sets display
        <div className="space-y-2">
          {/* Sets Control Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Sets {sets.filter(s => s.completed).length}/{sets.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={handleAddSet}
                className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                + Add
              </button>
              {sets.length > 1 && (
                <button
                  onClick={() => handleRemoveSet(sets.length - 1)}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  - Remove
                </button>
              )}
            </div>
          </div>

          {/* Standard Sets */}
          {sets.map((set, index) => (
            <div key={`${exerciseId}-${set.setNumber}`}>
              <EnhancedSetInput
                set={set}
                onUpdateSet={(field, value) => handleSetUpdate(index, field, value)}
                onCompleteSet={() => handleSetComplete(index)}
                onAddSet={index === sets.length - 1 ? handleAddSet : undefined}
                onRemoveSet={sets.length > 1 ? () => handleRemoveSet(index) : undefined}
                isActive={index === activeSetIndex}
                canRemoveSet={sets.length > 1}
                weightUnit={weightUnit}
                onWeightUnitChange={onWeightUnitChange}
                userId={userId}
                isBodyWeightExercise={isBodyWeightExercise}
              />
            </div>
          ))}
        </div>
      )}

      {/* Volume Coefficient Info for Special Methods */}
      {specialMethod !== 'standard' && (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">RP Volume Coefficient:</span>
              <Badge variant="secondary" className="text-xs">
                {specialMethod === 'myoreps' && '1.2x'}
                {specialMethod === 'dropset' && '1.5x'}
                {specialMethod === 'superset' && '0.8x'}
                {specialMethod === 'giantset' && '0.67x'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}