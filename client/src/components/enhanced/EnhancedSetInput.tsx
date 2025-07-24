import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Info, Plus, Minus, Scale } from "lucide-react";
import { useFeature } from "@/hooks/useFeature";
import { SpinnerInput } from "./SpinnerInput";

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
}) => {
  const spinnerEnabled = useFeature('spinnerSetInput');
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
    <Card className={`transition-all duration-200 bg-card border-border ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''} w-full max-w-full overflow-hidden`}>
      <CardContent className="p-1.5 space-y-1 w-full">
        {/* Ultra Compact Set Header */}
        <div className="flex items-center justify-between min-h-[20px]">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Badge variant={set.completed ? "default" : "outline"} className="text-xs px-1 py-0 h-5 flex-shrink-0">
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
              className="h-5 w-5 p-0 flex-shrink-0"
            >
              <Info className="h-2.5 w-2.5" />
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
                className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30 h-6 px-2 flex-shrink-0"
              >
                Use
              </Button>
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
            
            {/* Ultra Compact Three-Column Grid: Weight | Reps | RPE */}
            <div className="grid grid-cols-3 gap-0.5 w-full max-w-full">
              {/* Weight Column - Ultra Compact */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between h-4">
                  <label className="text-xs font-medium text-foreground truncate leading-none">Weight</label>
                  {isBodyWeightExercise && (
                    <Switch
                      checked={useBodyWeight}
                      onCheckedChange={handleBodyWeightToggle}
                      disabled={!bodyWeightValue}
                      className="scale-[0.5] ml-0.5"
                    />
                  )}
                </div>
                <div className="relative w-full">
                  {spinnerEnabled ? (
                    <SpinnerInput
                      value={getEffectiveWeight()}
                      onChange={handleWeightChange}
                      min={0}
                      max={1000}
                      step={0.5}
                      placeholder="0"
                      disabled={useBodyWeight}
                      className={`w-full h-6 text-xs pr-5 ${useBodyWeight ? 'bg-muted text-muted-foreground' : ''}`}
                    />
                  ) : (
                    <Input
                      type="number"
                      value={getEffectiveWeight() || ''}
                      onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={`w-full h-6 text-xs pr-5 border-border ${useBodyWeight ? 'bg-muted cursor-not-allowed' : ''}`}
                      disabled={useBodyWeight}
                      readOnly={useBodyWeight}
                    />
                  )}
                  {/* Ultra Compact Unit Selector */}
                  <Select
                    value={weightUnit}
                    onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                  >
                    <SelectTrigger className="absolute right-0 top-0 w-5 h-6 border-0 bg-transparent text-xs p-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reps Column - Ultra Compact */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <label className="text-xs font-medium text-foreground leading-none h-4 flex items-center">Reps</label>
                {spinnerEnabled ? (
                  <SpinnerInput
                    value={set.actualReps}
                    onChange={handleRepsChange}
                    min={0}
                    max={50}
                    step={1}
                    placeholder="0"
                    className="w-full h-6 text-xs"
                  />
                ) : (
                  <Input
                    type="number"
                    value={set.actualReps || ''}
                    onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-6 text-xs border-border"
                    inputMode="numeric"
                  />
                )}
              </div>

              {/* RPE Column - Ultra Compact */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <label className="text-xs font-medium text-foreground leading-none h-4 flex items-center">RPE</label>
                {spinnerEnabled ? (
                  <SpinnerInput
                    value={set.rpe}
                    onChange={handleRpeChange}
                    min={1}
                    max={10}
                    step={0.5}
                    placeholder="8"
                    className="w-full h-6 text-xs"
                  />
                ) : (
                  <Input
                    type="number"
                    value={set.rpe || ''}
                    onChange={(e) => handleRpeChange(parseFloat(e.target.value) || 0)}
                    placeholder="8"
                    className="w-full h-6 text-xs border-border"
                    inputMode="decimal"
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Complete Set Button - Only shown for active sets */}
        {!set.completed && isActive && (
          <Button
            onClick={onCompleteSet}
            disabled={!isSetValid}
            className="w-full h-7 text-xs"
            variant={isSetValid ? "default" : "secondary"}
          >
            {isSetValid ? (
              <>
                <Check className="h-3 w-3 mr-1" />
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
          </div>
        )}

        {/* Non-active set preview - Shows basic info for inactive sets */}
        {!set.completed && !isActive && (
          <div className="p-1 bg-muted/20 rounded text-center">
            <span className="text-xs text-muted-foreground">
              {set.weight > 0 || set.actualReps > 0 || set.rpe > 0
                ? `${set.weight || 0}${weightUnit} × ${set.actualReps || 0} @ RPE ${set.rpe || 0}`
                : "Tap to edit"
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};