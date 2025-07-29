import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Layers, ArrowRight, Timer, Target } from 'lucide-react';

interface SupersetData {
  supersetType: 'agonist_antagonist' | 'pre_exhaustion' | 'compound_isolation' | 'upper_lower';
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
  restBetweenSupersets: number;
  completedSupersets: number;
  targetSupersets: number;
}

interface SupersetExecutionProps {
  data: SupersetData;
  onDataChange: (data: SupersetData) => void;
  onComplete: () => void;
  weightUnit: 'kg' | 'lbs';
  availableExercises: Array<{ id: number; name: string; }>;
  disabled?: boolean;
}

export function SupersetExecution({ 
  data, 
  onDataChange, 
  onComplete, 
  weightUnit,
  availableExercises,
  disabled = false 
}: SupersetExecutionProps) {
  const [phase, setPhase] = useState<'setup' | 'exercise_a' | 'transition' | 'exercise_b' | 'rest' | 'complete'>('setup');
  const [currentSuperset, setCurrentSuperset] = useState(1);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [exerciseInputs, setExerciseInputs] = useState<{[key: number]: { weight: number; reps: number; rpe: number; }}>({});

  const progressPercentage = (data.completedSupersets / data.targetSupersets) * 100;

  // Rest timer effect
  useEffect(() => {
    if ((phase === 'transition' || phase === 'rest') && restTimer > 0) {
      const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'transition' && restTimer === 0) {
      setPhase('exercise_b');
    } else if (phase === 'rest' && restTimer === 0) {
      setCurrentSuperset(currentSuperset + 1);
      setPhase('exercise_a');
    }
  }, [phase, restTimer]);

  const supersetTypes = {
    agonist_antagonist: { name: 'Agonist-Antagonist', description: 'Opposing muscle groups' },
    pre_exhaustion: { name: 'Pre-Exhaustion', description: 'Isolation then compound' },
    compound_isolation: { name: 'Compound-Isolation', description: 'Compound then isolation' },
    upper_lower: { name: 'Upper-Lower', description: 'Upper and lower body' }
  };

  const handleExerciseComplete = (exerciseIndex: number) => {
    const inputs = exerciseInputs[exerciseIndex];
    if (!inputs?.weight || !inputs?.reps || !inputs?.rpe) return;

    const updatedExercises = [...data.exercises];
    if (!updatedExercises[exerciseIndex]) {
      updatedExercises[exerciseIndex] = {
        exerciseId: 0,
        exerciseName: '',
        order: exerciseIndex + 1,
        sets: []
      };
    }

    const newSet = {
      setNumber: currentSuperset,
      reps: inputs.reps,
      weight: inputs.weight,
      rpe: inputs.rpe
    };

    updatedExercises[exerciseIndex].sets.push(newSet);

    const updatedData = { ...data, exercises: updatedExercises };

    if (exerciseIndex === 0) {
      // Completed Exercise A, transition to Exercise B
      setPhase('transition');
      setRestTimer(data.restBetweenExercises);
    } else {
      // Completed Exercise B, check if superset is done
      if (currentSuperset >= data.targetSupersets) {
        updatedData.completedSupersets = currentSuperset;
        setPhase('complete');
        onComplete();
      } else {
        updatedData.completedSupersets = currentSuperset;
        setPhase('rest');
        setRestTimer(data.restBetweenSupersets);
      }
    }

    onDataChange(updatedData);
  };

  const updateExerciseInput = (exerciseIndex: number, field: string, value: number) => {
    setExerciseInputs(prev => ({
      ...prev,
      [exerciseIndex]: { ...prev[exerciseIndex], [field]: value }
    }));
  };

  const updateSupersetType = (type: string) => {
    onDataChange({ ...data, supersetType: type as SupersetData['supersetType'] });
  };

  const addExercise = (exerciseIndex: number, exerciseId: number) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updatedExercises = [...data.exercises];
    updatedExercises[exerciseIndex] = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: exerciseIndex + 1,
      sets: []
    };

    onDataChange({ ...data, exercises: updatedExercises });
  };

  if (phase === 'setup') {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Superset Setup</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Superset Type</label>
              <Select
                value={data.supersetType}
                onValueChange={updateSupersetType}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(supersetTypes).map(([key, config]) => (
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exercise A</label>
                <Select
                  value={data.exercises[0]?.exerciseId?.toString() || ''}
                  onValueChange={(value) => addExercise(0, parseInt(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id.toString()}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exercise B</label>
                <Select
                  value={data.exercises[1]?.exerciseId?.toString() || ''}
                  onValueChange={(value) => addExercise(1, parseInt(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id.toString()}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Supersets</label>
                <Input
                  type="number"
                  value={data.targetSupersets || ''}
                  onChange={(e) => onDataChange({ ...data, targetSupersets: parseInt(e.target.value) || 3 })}
                  placeholder="3"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rest (A→B)</label>
                <Input
                  type="number"
                  value={data.restBetweenExercises || ''}
                  onChange={(e) => onDataChange({ ...data, restBetweenExercises: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rest (Sets)</label>
                <Input
                  type="number"
                  value={data.restBetweenSupersets || ''}
                  onChange={(e) => onDataChange({ ...data, restBetweenSupersets: parseInt(e.target.value) || 120 })}
                  placeholder="120"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setPhase('exercise_a')}
            disabled={!data.exercises[0] || !data.exercises[1] || !data.targetSupersets}
            className="w-full h-8 text-sm"
          >
            Start Superset
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'complete') {
    return (
      <Card className="border-green-500/50 bg-green-50/10 dark:bg-green-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">Superset Complete</span>
          </div>
          
          <div className="space-y-2">
            {data.exercises.map((exercise, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium">{exercise.exerciseName}</div>
                <div className="text-xs text-muted-foreground">
                  {exercise.sets.length} sets completed
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            {data.completedSupersets} supersets | Time saved: ~40%
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentExerciseName = phase === 'exercise_a' 
    ? data.exercises[0]?.exerciseName 
    : data.exercises[1]?.exerciseName;
  const exerciseIndex = phase === 'exercise_a' ? 0 : 1;

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Superset {currentSuperset}/{data.targetSupersets}</span>
            <Badge variant="outline" className="text-xs">
              {supersetTypes[data.supersetType].name}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      {/* Exercise Flow */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={phase === 'exercise_a' ? 'default' : 'secondary'}>
          {data.exercises[0]?.exerciseName || 'Exercise A'}
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant={phase === 'exercise_b' ? 'default' : 'secondary'}>
          {data.exercises[1]?.exerciseName || 'Exercise B'}
        </Badge>
      </div>

      {/* Current Exercise Input */}
      {(phase === 'exercise_a' || phase === 'exercise_b') && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{currentExerciseName}</span>
              <Badge variant="outline" className="text-xs">
                Set {currentSuperset}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Weight ({weightUnit})</label>
                <Input
                  type="number"
                  value={exerciseInputs[exerciseIndex]?.weight || ''}
                  onChange={(e) => updateExerciseInput(exerciseIndex, 'weight', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  value={exerciseInputs[exerciseIndex]?.reps || ''}
                  onChange={(e) => updateExerciseInput(exerciseIndex, 'reps', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">RPE</label>
                <Select
                  value={exerciseInputs[exerciseIndex]?.rpe?.toString() || ''}
                  onValueChange={(value) => updateExerciseInput(exerciseIndex, 'rpe', parseFloat(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="RPE" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpe => (
                      <SelectItem key={rpe} value={rpe.toString()}>{rpe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={() => handleExerciseComplete(exerciseIndex)}
              disabled={!exerciseInputs[exerciseIndex]?.weight || !exerciseInputs[exerciseIndex]?.reps || !exerciseInputs[exerciseIndex]?.rpe}
              className="w-full h-8 text-sm"
            >
              Complete {phase === 'exercise_a' ? 'Exercise A' : 'Exercise B'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rest/Transition Phase */}
      {(phase === 'transition' || phase === 'rest') && (
        <Card className="border-orange-500/50 bg-orange-50/10 dark:bg-orange-950/20">
          <CardContent className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                {phase === 'transition' ? 'Transition' : 'Rest Between Supersets'}
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              {phase === 'transition' 
                ? 'Quick transition to next exercise'
                : 'Full recovery before next superset'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}