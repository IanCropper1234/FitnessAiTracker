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
    <Card className={`transition-all duration-200 bg-card border-border ${isActive ? 'ring-1 ring-primary/50 bg-primary/3' : ''}`}>
      <CardContent className="p-1 space-y-0.5">
        {/* Ultra-Compact Set Header */}
        <div className="flex items-center justify-between min-h-[20px]">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Badge variant={set.completed ? "default" : "outline"} className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
              S{set.setNumber}
            </Badge>
            <span className="text-[10px] text-foreground/60 truncate">
              T:{setRecommendation?.recommendedReps || set.targetReps}
              {setRecommendation && <span className="text-emerald-400 ml-0.5">R</span>}
            </span>
          </div>
          
          {(setRecommendation || recommendation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendation(!showRecommendation)}
              className="ios-touch-feedback p-0 w-5 h-5 flex-shrink-0"
            >
              <Info className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>

        {/* Ultra-Compact Recommendation Banner */}
        {(setRecommendation || recommendation) && showRecommendation && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-emerald-300 truncate">
                  {setRecommendation ? (
                    `${setRecommendation.recommendedWeight}kg•${setRecommendation.recommendedReps}r•${setRecommendation.recommendedRpe}`
                  ) : recommendation?.sets?.[0] ? (
                    `${recommendation.sets[0].recommendedWeight}kg•${recommendation.sets[0].recommendedReps}r•${recommendation.sets[0].recommendedRpe}`
                  ) : (
                    "No rec"
                  )}
                  {recommendation && <span className="text-emerald-300/70">W{recommendation.week}</span>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseRecommendation}
                className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30 px-1 h-5 flex-shrink-0"
              >
                Use
              </Button>
            </div>
          </div>
        )}

        {/* Conditional Rendering: Show input only for active sets, compact view for completed */}
        {!set.completed && isActive ? (
          <div className="space-y-0.5">
            {/* Compact Body Weight Info */}
            {useBodyWeight && bodyWeightValue > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-0.5">
                <div className="flex items-center gap-0.5 text-[10px] text-blue-400">
                  <Scale className="h-2 w-2" />
                  <span>Body: {getEffectiveWeight()}{weightUnit}</span>
                </div>
              </div>
            )}
            
            {/* Ultra-Compact Grid with Tighter Spacing */}
            <div className="grid grid-cols-3 gap-1">
              {/* Weight Section - Ultra Compact */}
              <div className="space-y-0.5">
                <div className="h-4 flex items-center justify-between pt-[0px] pb-[0px] mt-[10px] mb-[10px]">
                  <label className="text-[10px] font-medium text-foreground">Weight</label>
                  {isBodyWeightExercise && (
                    <Switch
                      checked={useBodyWeight}
                      onCheckedChange={handleBodyWeightToggle}
                      disabled={!bodyWeightValue}
                      className="scale-50 -mt-0.5"
                    />
                  )}
                </div>
                <div className="relative bg-background border border-border/50 rounded-md">
                  <Input
                    type="number"
                    value={getEffectiveWeight() || ''}
                    onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    step="0.5"
                    min="0"
                    max="1000"
                    className={`h-7 text-xs border-0 bg-transparent pr-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${useBodyWeight ? 'bg-muted cursor-not-allowed' : ''}`}
                    disabled={useBodyWeight}
                    readOnly={useBodyWeight}
                    inputMode="decimal"
                  />
                  <div className="absolute right-0 top-0 h-7 flex items-center pl-[5px] pr-[5px]">
                    <div className="h-3 w-px bg-border mr-0.5"></div>
                    <Select
                      value={weightUnit}
                      onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                    >
                      <SelectTrigger className="w-6 h-7 border-0 bg-transparent text-[10px] p-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Reps Section - Ultra Compact */}
              <div className="space-y-0.5">
                <div className="h-4 flex items-center mt-[10px] mb-[10px]">
                  <label className="text-[10px] font-medium text-foreground">Reps</label>
                </div>
                <div className="relative bg-background border border-border/50 rounded-md">
                  <Input
                    type="number"
                    value={set.actualReps || ''}
                    onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="50"
                    className="h-7 text-xs border-0 bg-transparent text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* RPE Section - Ultra Compact */}
              <div className="space-y-0.5">
                <div className="h-4 flex items-center mt-[10px] mb-[10px]">
                  <label className="text-[10px] font-medium text-foreground">RPE</label>
                </div>
                <div className="relative bg-background border border-border/50 rounded-md">
                  <Select
                    value={set.rpe ? set.rpe.toString() : ""}
                    onValueChange={(value) => handleRpeChange(parseFloat(value))}
                  >
                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
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

        {/* Complete Set Button - Ultra Compact */}
        {!set.completed && isActive && (
          <Button
            onClick={onCompleteSet}
            disabled={!isSetValid}
            className="w-full text-xs h-6"
            variant={isSetValid ? "default" : "secondary"}
          >
            {isSetValid ? (
              <>
                <Check className="h-2.5 w-2.5 mr-1" />
                Complete
              </>
            ) : (
              "Enter values"
            )}
          </Button>
        )}

        {/* Completed Set Display - Ultra Minimal */}
        {set.completed && (
          <div className="flex items-center justify-center p-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <Check className="h-2.5 w-2.5 text-emerald-400 mr-0.5" />
            <span className="text-[10px] text-emerald-300 font-medium">
              {set.weight}{weightUnit}×{set.actualReps}@{set.rpe}
            </span>
          </div>
        )}

        {/* Non-active set preview - Ultra Compact */}
        {!set.completed && !isActive && (
          <div className="p-0.5 bg-muted/20 rounded text-center">
            <span className="text-[10px] text-muted-foreground">
              {set.weight > 0 || set.actualReps > 0 || set.rpe > 0
                ? `${set.weight || 0}${weightUnit}×${set.actualReps || 0}@${set.rpe || 0}`
                : "Tap to edit"
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};