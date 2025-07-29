import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, ArrowRight, Timer, Target } from 'lucide-react';

interface GiantSetData {
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    order: number;
    sets: Array<{
      setNumber: number;
      reps: number;
      weight: number;
      rpe: number;
    }>;
  }>;
  restBetweenExercises: number;
  restBetweenCircuits: number;
  completedCircuits: number;
  targetCircuits: number;
  circuitType: 'muscle_group' | 'full_body' | 'push_pull' | 'upper_lower';
}

interface GiantSetExecutionProps {
  data: GiantSetData;
  onDataChange: (data: GiantSetData) => void;
  onComplete: () => void;
  weightUnit: 'kg' | 'lbs';
  availableExercises: Array<{ id: number; name: string; }>;
  disabled?: boolean;
}

export function GiantSetExecution({ 
  data, 
  onDataChange, 
  onComplete, 
  weightUnit,
  availableExercises,
  disabled = false 
}: GiantSetExecutionProps) {
  const [phase, setPhase] = useState<'setup' | 'exercise' | 'transition' | 'circuit_rest' | 'complete'>('setup');
  const [currentCircuit, setCurrentCircuit] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [exerciseInputs, setExerciseInputs] = useState<{[key: number]: { weight: number; reps: number; rpe: number; }}>({});

  const progressPercentage = (data.completedCircuits / data.targetCircuits) * 100;
  const exerciseProgress = ((currentExerciseIndex + 1) / data.exercises.length) * 100;

  // Rest timer effect
  useEffect(() => {
    if ((phase === 'transition' || phase === 'circuit_rest') && restTimer > 0) {
      const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'transition' && restTimer === 0) {
      if (currentExerciseIndex < data.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setPhase('exercise');
      } else {
        // Circuit complete
        if (currentCircuit >= data.targetCircuits) {
          setPhase('complete');
          onComplete();
        } else {
          setPhase('circuit_rest');
          setRestTimer(data.restBetweenCircuits);
        }
      }
    } else if (phase === 'circuit_rest' && restTimer === 0) {
      setCurrentCircuit(currentCircuit + 1);
      setCurrentExerciseIndex(0);
      setPhase('exercise');
    }
  }, [phase, restTimer, currentExerciseIndex, currentCircuit, data.exercises.length, data.targetCircuits]);

  const circuitTypes = {
    muscle_group: { name: 'Muscle Group Focus', description: '4+ exercises same muscle group' },
    full_body: { name: 'Full Body Circuit', description: '4+ exercises different muscle groups' },
    push_pull: { name: 'Push-Pull Circuit', description: 'Alternating push and pull movements' },
    upper_lower: { name: 'Upper-Lower Circuit', description: 'Alternating upper and lower body' }
  };

  const handleExerciseComplete = () => {
    const inputs = exerciseInputs[currentExerciseIndex];
    if (!inputs?.weight || !inputs?.reps || !inputs?.rpe) return;

    const updatedExercises = [...data.exercises];
    if (!updatedExercises[currentExerciseIndex].sets) {
      updatedExercises[currentExerciseIndex].sets = [];
    }

    const newSet = {
      setNumber: currentCircuit,
      reps: inputs.reps,
      weight: inputs.weight,
      rpe: inputs.rpe
    };

    updatedExercises[currentExerciseIndex].sets.push(newSet);

    const updatedData = { ...data, exercises: updatedExercises };

    if (currentExerciseIndex === data.exercises.length - 1) {
      // Last exercise in circuit
      updatedData.completedCircuits = currentCircuit;
    }

    onDataChange(updatedData);

    // Move to transition phase
    setPhase('transition');
    setRestTimer(data.restBetweenExercises);
  };

  const updateExerciseInput = (field: string, value: number) => {
    setExerciseInputs(prev => ({
      ...prev,
      [currentExerciseIndex]: { ...prev[currentExerciseIndex], [field]: value }
    }));
  };

  const addExercise = (index: number, exerciseId: number) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updatedExercises = [...data.exercises];
    updatedExercises[index] = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: index + 1,
      sets: []
    };

    onDataChange({ ...data, exercises: updatedExercises });
  };

  const addNewExerciseSlot = () => {
    const updatedData = {
      ...data,
      exercises: [...data.exercises, {
        exerciseId: 0,
        exerciseName: '',
        order: data.exercises.length + 1,
        sets: []
      }]
    };
    onDataChange(updatedData);
  };

  if (phase === 'setup') {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Giant Set Setup</span>
            <Badge variant="outline" className="text-xs">4+ exercises</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Circuit Type</label>
              <Select
                value={data.circuitType}
                onValueChange={(value) => onDataChange({ ...data, circuitType: value as GiantSetData['circuitType'] })}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(circuitTypes).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{config.name}</span>
                        <span className="text-xs text-muted-foreground">{config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Exercises ({data.exercises.length} selected)</label>
                <Button 
                  onClick={addNewExerciseSlot}
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-xs"
                  disabled={data.exercises.length >= 6}
                >
                  + Add
                </Button>
              </div>
              
              {data.exercises.map((exercise, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <Select
                    value={exercise.exerciseId?.toString() || ''}
                    onValueChange={(value) => addExercise(index, parseInt(value))}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder={`Exercise ${index + 1}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExercises.map(ex => (
                        <SelectItem key={ex.id} value={ex.id.toString()}>
                          {ex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Circuits</label>
                <Input
                  type="number"
                  value={data.targetCircuits || ''}
                  onChange={(e) => onDataChange({ ...data, targetCircuits: parseInt(e.target.value) || 3 })}
                  placeholder="3"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rest (Ex)</label>
                <Input
                  type="number"
                  value={data.restBetweenExercises || ''}
                  onChange={(e) => onDataChange({ ...data, restBetweenExercises: parseInt(e.target.value) || 15 })}
                  placeholder="15"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rest (Circuit)</label>
                <Input
                  type="number"
                  value={data.restBetweenCircuits || ''}
                  onChange={(e) => onDataChange({ ...data, restBetweenCircuits: parseInt(e.target.value) || 180 })}
                  placeholder="180"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setPhase('exercise')}
            disabled={data.exercises.length < 4 || !data.exercises.every(ex => ex.exerciseId) || !data.targetCircuits}
            className="w-full h-8 text-sm"
          >
            Start Giant Set
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'complete') {
    return (
      <Card className="border-purple-500/50 bg-purple-50/10 dark:bg-purple-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Giant Set Complete</span>
          </div>
          
          <div className="space-y-2">
            {data.exercises.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{index + 1}. {exercise.exerciseName}</span>
                <Badge variant="outline" className="text-xs">
                  {exercise.sets.length} sets
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            {data.completedCircuits} circuits | {data.exercises.length} exercises | Time saved: ~60%
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentExercise = data.exercises[currentExerciseIndex];

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Circuit {currentCircuit}/{data.targetCircuits}</span>
            <Badge variant="outline" className="text-xs">
              {circuitTypes[data.circuitType].name}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-1" />
        <Progress value={exerciseProgress} className="h-1 bg-purple-100 dark:bg-purple-900" />
      </div>

      {/* Exercise Flow */}
      <div className="flex items-center gap-1 text-xs overflow-x-auto">
        {data.exercises.map((exercise, index) => (
          <div key={index} className="flex items-center gap-1 flex-shrink-0">
            <Badge variant={index === currentExerciseIndex ? 'default' : index < currentExerciseIndex ? 'secondary' : 'outline'}>
              {exercise.exerciseName.split(' ')[0]}
            </Badge>
            {index < data.exercises.length - 1 && <ArrowRight className="h-2 w-2 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Current Exercise Input */}
      {phase === 'exercise' && currentExercise && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">{currentExercise.exerciseName}</span>
              <Badge variant="outline" className="text-xs">
                Exercise {currentExerciseIndex + 1}/{data.exercises.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Weight ({weightUnit})</label>
                <Input
                  type="number"
                  value={exerciseInputs[currentExerciseIndex]?.weight || ''}
                  onChange={(e) => updateExerciseInput('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  value={exerciseInputs[currentExerciseIndex]?.reps || ''}
                  onChange={(e) => updateExerciseInput('reps', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">RPE</label>
                <Select
                  value={exerciseInputs[currentExerciseIndex]?.rpe?.toString() || ''}
                  onValueChange={(value) => updateExerciseInput('rpe', parseFloat(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="RPE" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 6.5, 7, 7.5, 8, 8.5, 9].map(rpe => (
                      <SelectItem key={rpe} value={rpe.toString()}>{rpe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleExerciseComplete}
              disabled={!exerciseInputs[currentExerciseIndex]?.weight || !exerciseInputs[currentExerciseIndex]?.reps || !exerciseInputs[currentExerciseIndex]?.rpe}
              className="w-full h-8 text-sm"
            >
              Complete Exercise {currentExerciseIndex + 1}
            </Button>

            <div className="text-xs text-center text-muted-foreground">
              Focus on form and mind-muscle connection
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest/Transition Phase */}
      {(phase === 'transition' || phase === 'circuit_rest') && (
        <Card className="border-orange-500/50 bg-orange-50/10 dark:bg-orange-950/20">
          <CardContent className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                {phase === 'transition' ? 'Exercise Transition' : 'Circuit Rest'}
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              {phase === 'transition' 
                ? `Next: ${data.exercises[currentExerciseIndex + 1]?.exerciseName || 'Circuit Complete'}`
                : 'Full recovery before next circuit'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}