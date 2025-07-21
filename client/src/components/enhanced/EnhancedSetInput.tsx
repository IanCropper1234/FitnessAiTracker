import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Info, Plus, Minus } from "lucide-react";
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
}) => {
  const spinnerEnabled = useFeature('spinnerSetInput');
  const [showRecommendation, setShowRecommendation] = useState(false);

  const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'kg' && toUnit === 'lbs') return weight * 2.20462;
    if (fromUnit === 'lbs' && toUnit === 'kg') return weight / 2.20462;
    return weight;
  };

  const handleWeightChange = (value: number) => {
    onUpdateSet('weight', value);
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
      const convertedWeight = convertWeight(activeRecommendation.recommendedWeight, 'kg', weightUnit);
      onUpdateSet('weight', convertedWeight);
      onUpdateSet('actualReps', activeRecommendation.recommendedReps);
      onUpdateSet('rpe', activeRecommendation.recommendedRpe);
    }
  };

  const isSetValid = set.weight > 0 && set.actualReps > 0 && set.rpe >= 1 && set.rpe <= 10;

  return (
    <Card className={`transition-all duration-200 bg-card border-border ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardContent className="p-4 space-y-4">
        {/* Set Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={set.completed ? "default" : "outline"} className="bg-primary text-primary-foreground">
              Set {set.setNumber}
            </Badge>
            <span className="text-sm text-foreground/70">
              Target: {set.targetReps} reps
            </span>
          </div>
          
          {(setRecommendation || recommendation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendation(!showRecommendation)}
              className="text-xs text-foreground hover:bg-accent"
            >
              <Info className="h-3 w-3 mr-1" />
              Rec
            </Button>
          )}
        </div>

        {/* Set-Specific Recommendation Banner */}
        {(setRecommendation || recommendation) && showRecommendation && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-emerald-400">
                  {setRecommendation ? `Set ${setRecommendation.setNumber} Recommendation` : `Mesocycle Recommendation`}
                  {recommendation && (
                    <span className="text-xs text-emerald-300/70"> (Week {recommendation.week})</span>
                  )}
                </div>
                <div className="text-xs text-emerald-300">
                  {setRecommendation ? (
                    <>
                      {setRecommendation.recommendedWeight}kg • {setRecommendation.recommendedReps} reps • RPE {setRecommendation.recommendedRpe}
                    </>
                  ) : recommendation?.sets?.[0] ? (
                    <>
                      {recommendation.sets[0].recommendedWeight}kg • {recommendation.sets[0].recommendedReps} reps • RPE {recommendation.sets[0].recommendedRpe}
                    </>
                  ) : (
                    "No specific recommendations available"
                  )}
                </div>
                {recommendation?.reasoning && (
                  <div className="text-xs text-emerald-300/80">
                    {recommendation.reasoning}
                  </div>
                )}
                {setRecommendation && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Progressive Set Loading
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseRecommendation}
                className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
              >
                Use
              </Button>
            </div>
          </div>
        )}

        {/* Compact Single-Row Input Layout */}
        <div className="grid grid-cols-4 gap-2 items-end pl-[1px] pr-[1px] pt-[0px] pb-[0px] mt-[8px] mb-[8px] ml-[-35px] mr-[-35px]">
          {/* Weight Input with Unit Selection */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-foreground/80 leading-none">Weight</label>
              <Select
                value={weightUnit}
                onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                disabled={set.completed}
              >
                <SelectTrigger className="w-10 h-5 text-[9px] bg-background border-border text-foreground p-0">
                  <SelectValue className="text-[9px]" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border min-w-[40px]">
                  <SelectItem value="kg" className="text-xs py-1">KG</SelectItem>
                  <SelectItem value="lbs" className="text-xs py-1">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              {spinnerEnabled ? (
                <SpinnerInput
                  value={set.weight}
                  onChange={handleWeightChange}
                  min={0}
                  max={1000}
                  step={0.5}
                  placeholder="0"
                  disabled={set.completed}
                  className="w-full h-8 text-sm"
                />
              ) : (
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  step="0.5"
                  min="0"
                  max="1000"
                  disabled={set.completed}
                  className="w-full h-8 text-sm bg-background border-border text-foreground px-2"
                  inputMode="decimal"
                />
              )}
            </div>
          </div>

          {/* Actual Reps Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-foreground/80 leading-none">Actual Reps</label>
            {spinnerEnabled ? (
              <SpinnerInput
                value={set.actualReps}
                onChange={handleRepsChange}
                min={0}
                max={50}
                step={1}
                placeholder="0"
                disabled={set.completed}
                className="h-8 text-sm"
              />
            ) : (
              <Input
                type="number"
                value={set.actualReps || ''}
                onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="50"
                disabled={set.completed}
                className="h-8 text-sm bg-background border-border text-foreground px-2"
                inputMode="numeric"
              />
            )}
          </div>

          {/* RPE Input (1-10) */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-foreground/80 leading-none">RPE</label>
            {spinnerEnabled ? (
              <SpinnerInput
                value={set.rpe}
                onChange={handleRpeChange}
                min={1}
                max={10}
                step={0.5}
                placeholder="8"
                disabled={set.completed}
                className="h-8 text-sm"
              />
            ) : (
              <Input
                type="number"
                value={set.rpe || ''}
                onChange={(e) => handleRpeChange(parseFloat(e.target.value) || 0)}
                placeholder="8"
                min="1"
                max="10"
                step="0.5"
                disabled={set.completed}
                className="h-8 text-sm bg-background border-border text-foreground px-2"
                inputMode="decimal"
              />
            )}
          </div>

          {/* Complete/Action Button */}
          <div className="space-y-1">
            <div className="h-3"></div> {/* Spacer for alignment */}
            {!set.completed && isActive ? (
              <Button
                onClick={onCompleteSet}
                disabled={!isSetValid}
                className="h-8 px-2 text-xs"
                variant={isSetValid ? "default" : "secondary"}
                size="sm"
              >
                {isSetValid ? (
                  <Check className="h-3 w-3" />
                ) : (
                  "Fill"
                )}
              </Button>
            ) : set.completed ? (
              <div className="h-8 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
            ) : (
              <div className="h-8"></div>
            )}
          </div>
        </div>


      </CardContent>
    </Card>
  );
};