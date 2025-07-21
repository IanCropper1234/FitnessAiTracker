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
        {/* Set Header with Add/Remove Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={set.completed ? "default" : "outline"} className="bg-primary text-primary-foreground">
              Set {set.setNumber}
            </Badge>
            <span className="text-sm text-foreground/70">
              Target: {set.targetReps} reps
            </span>
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
          
          {/* Add/Remove Set Buttons - Right Side */}
          {!set.completed && isActive && (
            <div className="flex items-center gap-1">
              {onAddSet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddSet}
                  className="w-8 h-8 p-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                  title="Add Set"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {onRemoveSet && canRemoveSet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveSet}
                  className="w-8 h-8 p-0 text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                  title="Remove Set"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
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

        {/* Enhanced 3-Field Input Layout */}
        <div className="grid grid-cols-3 gap-3">
          {/* Weight Input with Unit Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Weight</label>
            <div className="flex gap-1">
              {spinnerEnabled ? (
                <SpinnerInput
                  value={set.weight}
                  onChange={handleWeightChange}
                  min={0}
                  max={1000}
                  step={0.5}
                  placeholder="0"
                  disabled={set.completed}
                  className="flex-1"
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
                  className="flex-1 bg-background border-border text-foreground"
                  inputMode="decimal"
                />
              )}
              
              <Select
                value={weightUnit}
                onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                disabled={set.completed}
              >
                <SelectTrigger className="w-16 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="kg">KG</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actual Reps Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Actual Reps</label>
            {spinnerEnabled ? (
              <SpinnerInput
                value={set.actualReps}
                onChange={handleRepsChange}
                min={0}
                max={50}
                step={1}
                placeholder="0"
                disabled={set.completed}
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
                className="bg-background border-border text-foreground"
                inputMode="numeric"
              />
            )}
          </div>

          {/* RPE Input (1-10) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">RPE (1-10)</label>
            {spinnerEnabled ? (
              <SpinnerInput
                value={set.rpe}
                onChange={handleRpeChange}
                min={1}
                max={10}
                step={0.5}
                placeholder="8"
                disabled={set.completed}
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
                className="bg-background border-border text-foreground"
                inputMode="decimal"
              />
            )}
          </div>
        </div>

        {/* Complete Set Button */}
        {!set.completed && isActive && (
          <Button
            onClick={onCompleteSet}
            disabled={!isSetValid}
            className="w-full"
            variant={isSetValid ? "default" : "secondary"}
          >
            {isSetValid ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete Set
              </>
            ) : (
              "Enter Weight, Reps & RPE"
            )}
          </Button>
        )}

        {/* Completed Set Display */}
        {set.completed && (
          <div className="flex items-center justify-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <Check className="h-4 w-4 text-emerald-400 mr-2" />
            <span className="text-sm text-emerald-300 font-medium">
              Completed: {set.weight}{weightUnit} × {set.actualReps} reps @ RPE {set.rpe}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};