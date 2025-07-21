import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Info } from "lucide-react";
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

interface ExerciseRecommendation {
  exerciseId: number;
  recommendedWeight: number;
  recommendedReps: string;
  recommendedRpe: number;
  week: number;
  reasoning: string;
  progressionType?: string;
  confidence?: number;
}

interface EnhancedSetInputProps {
  set: WorkoutSet;
  recommendation?: ExerciseRecommendation;
  onUpdateSet: (field: keyof WorkoutSet, value: any) => void;
  onCompleteSet: () => void;
  isActive: boolean;
  weightUnit?: 'kg' | 'lbs';
  onWeightUnitChange?: (unit: 'kg' | 'lbs') => void;
}

export const EnhancedSetInput: React.FC<EnhancedSetInputProps> = ({
  set,
  recommendation,
  onUpdateSet,
  onCompleteSet,
  isActive,
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
    if (recommendation) {
      const convertedWeight = convertWeight(recommendation.recommendedWeight, 'kg', weightUnit);
      onUpdateSet('weight', convertedWeight);
      
      // Parse recommended reps (e.g., "8-12" -> 8, "10" -> 10)
      const repsMatch = recommendation.recommendedReps.match(/(\d+)/);
      if (repsMatch) {
        onUpdateSet('actualReps', parseInt(repsMatch[1]));
      }
      
      onUpdateSet('rpe', recommendation.recommendedRpe || 8);
    }
  };

  const isSetValid = set.weight > 0 && set.actualReps > 0 && set.rpe >= 1 && set.rpe <= 10;

  return (
    <Card className={`transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
      <CardContent className="p-4 space-y-4">
        {/* Set Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={set.completed ? "default" : "outline"}>
              Set {set.setNumber}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Target: {set.targetReps} reps
            </span>
          </div>
          
          {recommendation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendation(!showRecommendation)}
              className="text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Recommended
            </Button>
          )}
        </div>

        {/* Recommendation Banner */}
        {recommendation && showRecommendation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-green-800">
                  Mesocycle Recommendation (Week {recommendation.week})
                </div>
                <div className="text-xs text-green-700">
                  {recommendation.recommendedWeight}kg • {recommendation.recommendedReps} reps • RPE {recommendation.recommendedRpe}
                </div>
                <div className="text-xs text-green-600">
                  {recommendation.reasoning}
                </div>
                {recommendation.progressionType && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                    {recommendation.progressionType}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseRecommendation}
                className="text-xs bg-green-100 hover:bg-green-200"
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
            <label className="text-xs font-medium text-gray-700">Weight</label>
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
                  className="flex-1"
                  inputMode="decimal"
                />
              )}
              
              <Select
                value={weightUnit}
                onValueChange={(value: 'kg' | 'lbs') => onWeightUnitChange?.(value)}
                disabled={set.completed}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">KG</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actual Reps Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Actual Reps</label>
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
                inputMode="numeric"
              />
            )}
          </div>

          {/* RPE Input (1-10) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">RPE (1-10)</label>
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
          <div className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-700 font-medium">
              Completed: {set.weight}{weightUnit} × {set.actualReps} reps @ RPE {set.rpe}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};