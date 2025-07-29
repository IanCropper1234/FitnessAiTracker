import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Info, Plus, Minus, Scale, Timer, Zap, Target } from "lucide-react";

interface WorkoutSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weight: number;
  rpe: number;
  completed: boolean;
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

interface EnhancedSetInputProps {
  set: WorkoutSet;
  recommendation?: ExerciseRecommendation;
  setRecommendation?: SetRecommendation;
  onUpdateSet: (field: keyof WorkoutSet, value: any) => void;
  onCompleteSet: () => void;
  onAddSet?: () => void;
  onRemoveSet?: () => void;
  isActive: boolean;
  canRemoveSet?: boolean;
  weightUnit?: 'kg' | 'lbs';
  onWeightUnitChange?: (unit: 'kg' | 'lbs') => void;
  userId?: number;
  isBodyWeightExercise?: boolean;
  // Special Training Methods
  specialMethod?: 'myorep_match' | 'myorep_no_match' | 'drop_set' | 'superset' | 'giant_set' | null;
  onSpecialMethodChange?: (method: string | null) => void;
  specialConfig?: any;
  onSpecialConfigChange?: (config: any) => void;
}

export const EnhancedSetInput: React.FC<EnhancedSetInputProps> = ({
  set,
  recommendation,
  setRecommendation,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  isActive,
  canRemoveSet = false,
  weightUnit = 'kg',
  onWeightUnitChange,
  userId = 1,
  isBodyWeightExercise = false,
  specialMethod = null,
  onSpecialMethodChange,
  specialConfig,
  onSpecialConfigChange,
}) => {
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [useBodyWeight, setUseBodyWeight] = useState(false);

  // Fetch user's latest body weight (always fetch to check availability)
  const { data: bodyMetrics = [] } = useQuery<any[]>({
    queryKey: [`/api/body-metrics/${userId}`],
    enabled: isBodyWeightExercise, // Only fetch for body weight exercises
  });

  // Get latest body weight data
  const latestBodyWeight = bodyMetrics.length > 0 ? bodyMetrics[0] : null;
  const bodyWeightValue = latestBodyWeight?.weight ? parseFloat(latestBodyWeight.weight) : 0;
  const bodyWeightUnit = latestBodyWeight?.unit === 'imperial' ? 'lbs' : 'kg';

  // Debug: Log when component renders to see toggle conditions
  if (isBodyWeightExercise) {
    console.log('Body weight exercise detected:', {
      isBodyWeightExercise,
      hasBodyWeightData: bodyWeightValue > 0,
      toggleShouldShow: isBodyWeightExercise && bodyWeightValue > 0,
      setCompleted: set.completed
    });
  }

  const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'kg' && toUnit === 'lbs') return weight * 2.20462;
    if (fromUnit === 'lbs' && toUnit === 'kg') return weight / 2.20462;
    return weight;
  };

  const handleWeightChange = (value: number) => {
    if (!useBodyWeight) {
      onUpdateSet('weight', value);
    }
  };

  // Handle body weight toggle
  const handleBodyWeightToggle = (enabled: boolean) => {
    setUseBodyWeight(enabled);
    
    if (enabled && bodyWeightValue > 0) {
      // Convert body weight to current exercise weight unit if needed
      const convertedWeight = convertWeight(bodyWeightValue, bodyWeightUnit, weightUnit);
      onUpdateSet('weight', Math.round(convertedWeight * 100) / 100);
    }
  };

  // Calculate effective weight to display
  const getEffectiveWeight = (): number => {
    if (useBodyWeight && bodyWeightValue > 0) {
      return Math.round(convertWeight(bodyWeightValue, bodyWeightUnit, weightUnit) * 100) / 100;
    }
    return set.weight;
  };

  const handleRepsChange = (value: number) => {
    onUpdateSet('actualReps', value);
  };

  const handleRpeChange = (value: number) => {
    onUpdateSet('rpe', value);
  };

  const handleUseRecommendation = () => {
    // Use set-specific recommendation if available, otherwise fall back to general recommendation
    const activeRecommendation = setRecommendation || (recommendation?.sets?.[0]);
    
    if (activeRecommendation) {
      // Only update weight if body weight toggle is not enabled
      if (!useBodyWeight) {
        const convertedWeight = convertWeight(activeRecommendation.recommendedWeight, 'kg', weightUnit);
        onUpdateSet('weight', convertedWeight);
      }
      
      onUpdateSet('actualReps', activeRecommendation.recommendedReps);
      onUpdateSet('rpe', activeRecommendation.recommendedRpe);
    }
  };

  const isSetValid = set.weight > 0 && set.actualReps > 0 && set.rpe >= 1 && set.rpe <= 10;

  return (
    <Card className={`transition-all duration-200 bg-card border-border ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardContent className="p-1.5 space-y-1">
        {/* Optimized Set Header - Single Line */}
        <div className="flex items-center justify-between min-h-[24px]">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Badge variant={set.completed ? "default" : "outline"} className="text-xs px-1.5 py-0.5 flex-shrink-0">
              Set {set.setNumber}
            </Badge>
            <span className="text-xs text-foreground/70 truncate">
              Target: {setRecommendation?.recommendedReps || set.targetReps}
              {setRecommendation && (
                <span className="text-emerald-400 ml-1">(R)</span>
              )}
            </span>
          </div>
          
          {(setRecommendation || recommendation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendation(!showRecommendation)}
              className="ios-touch-feedback touch-target p-0 flex-shrink-0"
            >
              <Info className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Compact Recommendation Banner - Collapsed Design */}
        {(setRecommendation || recommendation) && showRecommendation && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-emerald-300 truncate">
                  {setRecommendation ? (
                    `${setRecommendation.recommendedWeight}kg • ${setRecommendation.recommendedReps}r • RPE ${setRecommendation.recommendedRpe}`
                  ) : recommendation?.sets?.[0] ? (
                    `${recommendation.sets[0].recommendedWeight}kg • ${recommendation.sets[0].recommendedReps}r • RPE ${recommendation.sets[0].recommendedRpe}`
                  ) : (
                    "No recommendations"
                  )}
                  {recommendation && (
                    <span className="text-emerald-300/70"> (W{recommendation.week})</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseRecommendation}
                className="ios-touch-feedback touch-target text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30 px-2 flex-shrink-0"
              >
                Use
              </Button>
            </div>
          </div>
        )}

        {/* Special Training Methods Selector - Only for active sets */}
        {!set.completed && isActive && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Training Method</label>
            <Select
              value={specialMethod || ""}
              onValueChange={(value) => onSpecialMethodChange?.(value === "" ? null : value)}
            >
              <SelectTrigger className="h-8 text-xs border border-border/50 bg-background touch-target ios-touch-feedback">
                <SelectValue placeholder="Standard Set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Standard Set</SelectItem>
                <SelectItem value="myorep_match">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    Myorep Match
                  </div>
                </SelectItem>
                <SelectItem value="myorep_no_match">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Myorep No Match
                  </div>
                </SelectItem>
                <SelectItem value="drop_set">
                  <div className="flex items-center gap-2">
                    <Minus className="h-3 w-3" />
                    Drop Set
                  </div>
                </SelectItem>
                <SelectItem value="giant_set">
                  <div className="flex items-center gap-2">
                    <Timer className="h-3 w-3" />
                    Giant Set (40+ reps)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Special Method Configuration - Conditional based on selected method */}
        {!set.completed && isActive && specialMethod === 'giant_set' && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium">
              <Timer className="h-3 w-3" />
              Giant Set Configuration
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-orange-300">Target Total Reps</label>
                <Input
                  type="number"
                  value={specialConfig?.totalTargetReps || 40}
                  onChange={(e) => onSpecialConfigChange?.({
                    ...specialConfig,
                    totalTargetReps: parseInt(e.target.value) || 40,
                    miniSetReps: specialConfig?.miniSetReps || 5,
                    restSeconds: specialConfig?.restSeconds || 10
                  })}
                  min="40"
                  max="100"
                  className="h-7 text-xs bg-background/50 border-orange-500/20"
                />
              </div>
              <div>
                <label className="text-xs text-orange-300">Mini-Set Reps</label>
                <Input
                  type="number"
                  value={specialConfig?.miniSetReps || 5}
                  onChange={(e) => onSpecialConfigChange?.({
                    ...specialConfig,
                    miniSetReps: parseInt(e.target.value) || 5
                  })}
                  min="3"
                  max="15"
                  className="h-7 text-xs bg-background/50 border-orange-500/20"
                />
              </div>
            </div>
            <div className="text-xs text-orange-300/70">
              Perform mini-sets with {specialConfig?.restSeconds || 10}s rest until reaching target reps
            </div>
          </div>
        )}

        {specialMethod === 'drop_set' && !set.completed && isActive && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
              <Minus className="h-3 w-3" />
              Drop Set Configuration
            </div>
            <div className="text-xs text-red-300/70">
              After failure, reduce weight by 15-20% and continue for 5-10s rest
            </div>
          </div>
        )}

        {(specialMethod === 'myorep_match' || specialMethod === 'myorep_no_match') && !set.completed && isActive && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              {specialMethod === 'myorep_match' ? <Target className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {specialMethod === 'myorep_match' ? 'Myorep Match' : 'Myorep No Match'}
            </div>
            <div className="text-xs text-blue-300/70">
              {specialMethod === 'myorep_match' 
                ? 'Perform activation set, then match rep count with mini-sets'
                : 'Perform activation set followed by mini-sets with 20-30s rest'
              }
            </div>
          </div>
        )}

        {/* Conditional Rendering: Show input only for active sets, compact view for completed */}
        {!set.completed && isActive ? (
          <div className="space-y-1">
            {/* Body Weight Info - Shows only when active */}
            {useBodyWeight && bodyWeightValue > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1">
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <Scale className="h-2.5 w-2.5" />
                  <span>Body: {getEffectiveWeight()}{weightUnit}</span>
                </div>
              </div>
            )}
            
            {/* Redesigned Grid Layout - Weight Column Split for Better UX */}
            <div className="space-y-2">
              {/* Weight Section - Separated for Better Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Weight</label>
                  {isBodyWeightExercise && (
                    <Switch
                      checked={useBodyWeight}
                      onCheckedChange={handleBodyWeightToggle}
                      disabled={!bodyWeightValue}
                      className="scale-75"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Weight Input - Full width without unit selector */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={getEffectiveWeight() || ''}
                      onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      step="0.5"
                      min="0"
                      max="1000"
                      className={`workout-input h-9 text-sm border border-border/50 bg-background text-center touch-target [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ios-touch-feedback ${useBodyWeight ? 'bg-muted cursor-not-allowed' : ''}`}
                      disabled={useBodyWeight}
                      readOnly={useBodyWeight}
                      inputMode="decimal"
                    />
                  </div>
                  {/* Unit Selector - Separate column */}
                  <div>
                    <Select
                      value={weightUnit}
                      onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                    >
                      <SelectTrigger className="h-9 text-sm border border-border/50 bg-background touch-target ios-touch-feedback">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Reps and RPE Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Reps Section */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Reps</label>
                  <Input
                    type="number"
                    value={set.actualReps || ''}
                    onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="50"
                    className="workout-input h-9 text-sm border border-border/50 bg-background text-center touch-target [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ios-touch-feedback"
                    inputMode="numeric"
                  />
                </div>

                {/* RPE Section */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">RPE</label>
                  <Select
                    value={set.rpe ? set.rpe.toString() : ""}
                    onValueChange={(value) => handleRpeChange(parseFloat(value))}
                  >
                    <SelectTrigger className="h-9 text-sm border border-border/50 bg-background touch-target ios-touch-feedback">
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="2.5">2.5</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="3.5">3.5</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="4.5">4.5</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="5.5">5.5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="6.5">6.5</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="7.5">7.5</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="8.5">8.5</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="9.5">9.5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Complete Set Button - Only shown for active sets */}
        {!set.completed && isActive && (
          <Button
            onClick={onCompleteSet}
            disabled={!isSetValid}
            className="ios-button touch-target w-full text-sm"
            variant={isSetValid ? "default" : "secondary"}
          >
            {isSetValid ? (
              <>
                <Check className="h-3 w-3 mr-1.5" />
                Complete Set
              </>
            ) : (
              "Enter all values"
            )}
          </Button>
        )}

        {/* Completed Set Display - Minimal and clean */}
        {set.completed && (
          <div className="flex items-center justify-center p-1 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <Check className="h-3 w-3 text-emerald-400 mr-1" />
            <span className="text-xs text-emerald-300 font-medium">
              {set.weight}{weightUnit} × {set.actualReps} @ RPE {set.rpe}
            </span>
            {specialMethod && (
              <Badge variant="outline" className="ml-2 text-xs px-1 py-0 h-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
                {specialMethod === 'giant_set' && <Timer className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'drop_set' && <Minus className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'myorep_match' && <Target className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'myorep_no_match' && <Zap className="h-2 w-2 mr-0.5" />}
                {specialMethod.replace('_', ' ').toUpperCase().slice(0, 3)}
              </Badge>
            )}
          </div>
        )}

        {/* Non-active set preview - Shows basic info for inactive sets */}
        {!set.completed && !isActive && (
          <div className="p-1 bg-muted/20 rounded text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground">
                {set.weight > 0 || set.actualReps > 0 || set.rpe > 0
                  ? `${set.weight || 0}${weightUnit} × ${set.actualReps || 0} @ RPE ${set.rpe || 0}`
                  : "Tap to edit"
                }
              </span>
              {specialMethod && (
                <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-orange-500/10 text-orange-400 border-orange-500/20">
                  {specialMethod === 'giant_set' && <Timer className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'drop_set' && <Minus className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'myorep_match' && <Target className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'myorep_no_match' && <Zap className="h-2 w-2 mr-0.5" />}
                  {specialMethod.replace('_', ' ').toUpperCase().slice(0, 3)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};