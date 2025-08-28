import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Info, Plus, Minus, Scale, Timer, Zap, Target, History } from "lucide-react";
import { SpecialMethodHistoryButton } from '@/components/SpecialMethodHistoryButton';

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

interface HistoricalSetData {
  weight: number | string;
  reps: number | string;
  rpe: number | string;
  setNumber: number;
  date: string;
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
  exerciseId?: number; // For fetching historical data
  // Special Training Methods
  specialMethod?: 'myorep_match' | 'myorep_no_match' | 'drop_set' | 'superset' | 'giant_set' | null;
  onSpecialMethodChange?: (method: string | null) => void;
  specialConfig?: any;
  onSpecialConfigChange?: (config: any) => void;
  // Session exercises for lookup
  sessionExercises?: Array<{id: number; exerciseId: number; exercise: {id: number; name: string}}>;
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
  exerciseId,
  specialMethod = null,
  onSpecialMethodChange,
  specialConfig,
  onSpecialConfigChange,
  sessionExercises,
}) => {
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch historical data for this specific exercise and set number
  const { data: historicalData } = useQuery<HistoricalSetData[]>({
    queryKey: ['/api/training/exercise-history', exerciseId, set.setNumber, userId],
    queryFn: async () => {
      if (!exerciseId) return [];
      const response = await fetch(`/api/training/exercise-history/${exerciseId}?userId=${userId}&setNumber=${set.setNumber}&limit=5`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!exerciseId && !!userId && !!set.setNumber
  });

  // Fetch user's latest body weight (always fetch to check availability)
  const { data: bodyMetrics = [] } = useQuery<any[]>({
    queryKey: [`/api/body-metrics`],
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
    onUpdateSet('weight', value);
  };

  // Handle body weight button - just fill in the weight without disabling input
  const handleFillBodyWeight = () => {
    if (bodyWeightValue > 0) {
      // Convert body weight to current exercise weight unit if needed
      const convertedWeight = convertWeight(bodyWeightValue, bodyWeightUnit, weightUnit);
      onUpdateSet('weight', Math.round(convertedWeight * 100) / 100);
      
      // Also update the weight unit to match body weight unit if needed
      if (onWeightUnitChange && bodyWeightUnit !== weightUnit) {
        onWeightUnitChange(bodyWeightUnit);
      }
    }
  };

  // Calculate effective weight to display
  const getEffectiveWeight = (): number => {
    return set.weight;
  };

  const handleRepsChange = (value: number) => {
    onUpdateSet('actualReps', value);
  };

  const handleRpeChange = useCallback((value: number) => {
    try {
      console.log('RPE Change triggered:', value, typeof value);
      
      // Ensure value is a valid number
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numericValue)) {
        console.error('RPE value is NaN:', value);
        return;
      }
      
      if (numericValue < 1 || numericValue > 10) {
        console.error('RPE value out of range (1-10):', numericValue);
        return;
      }
      
      console.log('Calling onUpdateSet with RPE:', numericValue);
      onUpdateSet('rpe', numericValue);
    } catch (error) {
      console.error('Error in handleRpeChange:', error, {value, type: typeof value});
    }
  }, [onUpdateSet]);

  const handleUseRecommendation = () => {
    // Use set-specific recommendation if available, otherwise fall back to general recommendation
    const activeRecommendation = setRecommendation || (recommendation?.sets?.[0]);
    
    if (activeRecommendation) {
      const convertedWeight = convertWeight(activeRecommendation.recommendedWeight, 'kg', weightUnit);
      onUpdateSet('weight', convertedWeight);
      
      onUpdateSet('actualReps', activeRecommendation.recommendedReps);
      onUpdateSet('rpe', activeRecommendation.recommendedRpe);
      setShowRecommendation(false);
    }
  };

  const handleUseHistoricalData = (historicalSet: HistoricalSetData) => {
    console.log('Applying historical data:', historicalSet);
    
    const weight = typeof historicalSet.weight === 'string' ? parseFloat(historicalSet.weight) : historicalSet.weight;
    const convertedWeight = convertWeight(weight, 'kg', weightUnit);
    console.log('Setting weight:', convertedWeight);
    onUpdateSet('weight', convertedWeight);
    
    const reps = typeof historicalSet.reps === 'string' ? parseInt(historicalSet.reps) : historicalSet.reps;
    const rpe = typeof historicalSet.rpe === 'string' ? parseFloat(historicalSet.rpe) : historicalSet.rpe;
    
    console.log('Setting reps:', reps);
    console.log('Setting rpe:', rpe);
    
    onUpdateSet('actualReps', reps);
    onUpdateSet('rpe', rpe);
    setShowHistory(false);
  };

  // Get the most recent historical data
  const latestHistoricalData = historicalData?.[0];

  // Calculate if the set is valid - consider body weight for body weight exercises
  const effectiveWeight = getEffectiveWeight();
  const isSetValid = effectiveWeight > 0 && set.actualReps > 0 && set.rpe >= 1 && set.rpe <= 10;

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
          
          <div className="flex items-center gap-1">
            {/* Historical Data Button */}
            {latestHistoricalData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="ios-touch-feedback touch-target p-0 flex-shrink-0"
                title={`Set ${set.setNumber} history`}
              >
                <History className="h-3 w-3 text-blue-400" />
              </Button>
            )}
            
            {/* Recommendation Button */}
            {(setRecommendation || recommendation) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecommendation(!showRecommendation)}
                className="ios-touch-feedback touch-target p-0 flex-shrink-0"
                title="Recommended loads"
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Compact Recommendation Banner - Collapsed Design */}
        {(setRecommendation || recommendation) && showRecommendation && (
          <div className="bg-emerald-500/10 border border-emerald-500/20  p-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-emerald-300 truncate">
                  {setRecommendation ? (
                    `${convertWeight(setRecommendation.recommendedWeight, 'kg', weightUnit)}${weightUnit} • ${setRecommendation.recommendedReps}r • RPE ${setRecommendation.recommendedRpe}`
                  ) : recommendation?.sets?.[0] ? (
                    `${convertWeight(recommendation.sets[0].recommendedWeight, 'kg', weightUnit)}${weightUnit} • ${recommendation.sets[0].recommendedReps}r • RPE ${recommendation.sets[0].recommendedRpe}`
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

        {/* Historical Data Banner - Shows last completed set data */}
        {latestHistoricalData && showHistory && (
          <div className="bg-blue-500/10 border border-blue-500/20  p-1.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-blue-300 truncate">
                    Set {set.setNumber} Last: {convertWeight(typeof latestHistoricalData.weight === 'string' ? parseFloat(latestHistoricalData.weight) : latestHistoricalData.weight, 'kg', weightUnit)}{weightUnit} • {typeof latestHistoricalData.reps === 'string' ? parseInt(latestHistoricalData.reps) : latestHistoricalData.reps}r • RPE {typeof latestHistoricalData.rpe === 'string' ? parseFloat(latestHistoricalData.rpe) : latestHistoricalData.rpe}
                    <span className="text-blue-300/70 ml-1">
                      ({new Date(latestHistoricalData.date).toLocaleDateString()})
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseHistoricalData(latestHistoricalData)}
                  className="ios-touch-feedback touch-target text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 px-2 flex-shrink-0"
                >
                  Use
                </Button>
              </div>
              
              {/* Show additional historical sets if available */}
              {historicalData && historicalData.length > 1 && (
                <div className="space-y-1">
                  {historicalData.slice(1, 3).map((histData, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-blue-300/60 truncate">
                          Set {set.setNumber}: {convertWeight(typeof histData.weight === 'string' ? parseFloat(histData.weight) : histData.weight, 'kg', weightUnit)}{weightUnit} • {typeof histData.reps === 'string' ? parseInt(histData.reps) : histData.reps}r • RPE {typeof histData.rpe === 'string' ? parseFloat(histData.rpe) : histData.rpe}
                          <span className="text-blue-300/40 ml-1">
                            ({new Date(histData.date).toLocaleDateString()})
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseHistoricalData(histData)}
                        className="ios-touch-feedback touch-target text-xs text-blue-300/60 hover:text-blue-300 px-1 flex-shrink-0"
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Special Training Methods Selector - Only for active sets */}
        {!set.completed && isActive && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Training Method</label>
              {/* History Auto-Apply Icon - Only show if exerciseId is valid */}
              {exerciseId && exerciseId > 0 && (
                <SpecialMethodHistoryButton 
                  exerciseId={exerciseId}
                  userId={userId}
                  setNumber={set.setNumber}
                  currentSpecialMethod={specialMethod || 'standard'}
                  onApplyHistoricalData={(historicalData) => {
                    try {
                      if (historicalData.specialMethod && onSpecialMethodChange) {
                        onSpecialMethodChange(historicalData.specialMethod);
                        if (historicalData.specialConfig && onSpecialConfigChange) {
                          onSpecialConfigChange(historicalData.specialConfig);
                        }
                      }
                    } catch (error) {
                      console.error('Error applying historical data in EnhancedSetInput:', error);
                    }
                  }}
                />
              )}
            </div>
            <Select
              value={specialMethod || "standard"}
              onValueChange={(value) => onSpecialMethodChange?.(value === "standard" ? null : value)}
            >
              <SelectTrigger className="h-8 text-xs border border-border/50 bg-background touch-target ios-touch-feedback">
                <SelectValue placeholder="Standard Set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Set</SelectItem>
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
                <SelectItem value="superset">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Superset
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Special Method Configuration - Conditional based on selected method */}
        {!set.completed && isActive && specialMethod === 'giant_set' && (
          <div className="bg-orange-500/10 border border-orange-500/20  p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium">
              <Timer className="h-3 w-3" />
              Giant Set Configuration
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-orange-300">Target Total Reps</label>
                <Input
                  type="number"
                  value={specialConfig?.totalTargetReps ?? 40}
                  onChange={(e) => onSpecialConfigChange?.({
                    ...specialConfig,
                    totalTargetReps: parseInt(e.target.value) || 40,
                    totalMiniSets: specialConfig?.totalMiniSets || 8,
                    restSeconds: specialConfig?.restSeconds || 10
                  })}
                  min="40"
                  max="100"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              <div>
                <label className="text-xs text-orange-300">Total Mini-Sets</label>
                <Input
                  type="number"
                  value={specialConfig?.totalMiniSets ?? 8}
                  onChange={(e) => onSpecialConfigChange?.({
                    ...specialConfig,
                    totalMiniSets: parseInt(e.target.value) || 8,
                    totalTargetReps: specialConfig?.totalTargetReps || 40,
                    restSeconds: specialConfig?.restSeconds || 10
                  })}
                  min="4"
                  max="15"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-orange-300/70">
                Target: {specialConfig?.totalTargetReps ?? 40} reps in {specialConfig?.totalMiniSets ?? 8} mini-sets
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    totalTargetReps: Math.max(20, (specialConfig?.totalTargetReps ?? 40) - 10)
                  })}
                  className="h-6 w-6 p-0 border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20"
                >
                  <Minus className="h-3 w-3 text-orange-400" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    totalTargetReps: Math.min(100, (specialConfig?.totalTargetReps ?? 40) + 10)
                  })}
                  className="h-6 w-6 p-0 border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20"
                >
                  <Plus className="h-3 w-3 text-orange-400" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {specialMethod === 'drop_set' && !set.completed && isActive && (
          <div className="bg-red-500/10 border border-red-500/20  p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
              <Minus className="h-3 w-3" />
              Drop Set Configuration
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-red-300">Drop Sets</label>
                  <Input
                    type="number"
                    value={specialConfig?.dropSets ?? 3}
                    onChange={(e) => {
                      const dropSets = parseInt(e.target.value) || 3;
                      const currentWeights = specialConfig?.dropSetWeights || [0, 0, 0];
                      const currentReps = specialConfig?.dropSetReps || [8, 8, 8];
                      const newWeights = Array(dropSets).fill(0).map((_, i) => currentWeights[i] || 0);
                      const newReps = Array(dropSets).fill(0).map((_, i) => currentReps[i] || 8);
                      onSpecialConfigChange?.({
                        ...specialConfig,
                        dropSets,
                        dropSetWeights: newWeights,
                        dropSetReps: newReps
                      });
                    }}
                    min="2"
                    max="6"
                    className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <div>
                  <label className="text-xs text-red-300">Rest (sec)</label>
                  <Input
                    type="number"
                    value={specialConfig?.dropRestSeconds ?? 10}
                    onChange={(e) => onSpecialConfigChange?.({
                      ...specialConfig,
                      dropRestSeconds: parseInt(e.target.value) || 10
                    })}
                    min="5"
                    max="15"
                    className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>
              
              {/* Drop Set Weight Inputs - Actual weights per set */}
              <div className="space-y-1">
                <label className="text-xs text-red-300">Drop Set Weights</label>
                {specialConfig?.weightReductions && specialConfig.weightReductions.length > 0 && (
                  <div className="text-xs text-red-300/60 mb-1">
                    Configured: {specialConfig.weightReductions.map((r: number, i: number) => `${r}% / ${specialConfig.dropSetReps?.[i] || 8} reps`).join(', ')}
                  </div>
                )}
                <div className="space-y-1">
                  {Array.from({ length: specialConfig?.dropSets ?? 3 }, (_, index) => {
                    const suggestedReduction = specialConfig?.weightReductions?.[index];
                    const suggestedReps = specialConfig?.dropSetReps?.[index];
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-300/70 w-12">Set {index + 1}:</span>
                          <Input
                            type="number"
                            value={specialConfig?.dropSetWeights?.[index] ?? 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const currentWeights = [...(specialConfig?.dropSetWeights || [])];
                              currentWeights[index] = value;
                              onSpecialConfigChange?.({
                                ...specialConfig,
                                dropSetWeights: currentWeights
                              });
                            }}
                            min="0"
                            step="0.5"
                            className="h-7 text-xs bg-background border border-border/50 flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder={suggestedReduction ? `${suggestedReduction}% drop` : "0"}
                          />
                          <span className="text-xs text-red-300/50 w-8">{weightUnit}</span>
                          <Input
                            type="number"
                            value={specialConfig?.dropSetReps?.[index] ?? 8}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 8;
                              const currentReps = [...(specialConfig?.dropSetReps || [])];
                              currentReps[index] = value;
                              onSpecialConfigChange?.({
                                ...specialConfig,
                                dropSetReps: currentReps
                              });
                            }}
                            min="5"
                            max="20"
                            className="h-7 text-xs bg-background border border-border/50 w-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="8"
                          />
                          <span className="text-xs text-red-300/50 w-8">reps</span>
                        </div>
                        {(suggestedReduction || suggestedReps) && (
                          <div className="text-xs text-red-400/50 ml-14">
                            {suggestedReduction && `-${suggestedReduction}%`}
                            {suggestedReduction && suggestedReps && ' / '}
                            {suggestedReps && `${suggestedReps} reps target`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-red-300/70">
                Perform {specialConfig?.dropSets ?? 3} drop sets with {specialConfig?.dropRestSeconds ?? 10}s rest
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentDropSets = specialConfig?.dropSets ?? 3;
                    const newDropSets = Math.max(2, currentDropSets - 1);
                    const newWeights = (specialConfig?.dropSetWeights || [0, 0, 0]).slice(0, newDropSets);
                    const newReps = (specialConfig?.dropSetReps || [8, 8, 8]).slice(0, newDropSets);
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      dropSets: newDropSets,
                      dropSetWeights: newWeights,
                      dropSetReps: newReps
                    });
                  }}
                  className="h-6 w-6 p-0 border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
                >
                  <Minus className="h-3 w-3 text-red-400" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentDropSets = specialConfig?.dropSets ?? 3;
                    const newDropSets = Math.min(6, currentDropSets + 1);
                    const currentWeights = specialConfig?.dropSetWeights || [0, 0, 0];
                    const currentReps = specialConfig?.dropSetReps || [8, 8, 8];
                    const newWeights = [...currentWeights];
                    const newReps = [...currentReps];
                    while (newWeights.length < newDropSets) {
                      newWeights.push(0);
                      newReps.push(8);
                    }
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      dropSets: newDropSets,
                      dropSetWeights: newWeights,
                      dropSetReps: newReps
                    });
                  }}
                  className="h-6 w-6 p-0 border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
                >
                  <Plus className="h-3 w-3 text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {specialMethod === 'myorep_match' && !set.completed && isActive && (
          <div className="bg-blue-500/10 border border-blue-500/20  p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <Target className="h-3 w-3" />
              Myorep Match Configuration
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-blue-300">Target Reps</label>
                <Input
                  type="number"
                  value={specialConfig?.targetReps ?? 15}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      targetReps: value === '' ? '' : (parseInt(value) || 15),
                      miniSets: specialConfig?.miniSets || 3,
                      restSeconds: specialConfig?.restSeconds || 20
                    });
                  }}
                  min="10"
                  max="20"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              <div>
                <label className="text-xs text-blue-300">Mini Sets</label>
                <Input
                  type="number"
                  value={specialConfig?.miniSets ?? 3}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      miniSets: value === '' ? '' : (parseInt(value) || 3),
                      targetReps: specialConfig?.targetReps || 15,
                      restSeconds: specialConfig?.restSeconds || 20
                    });
                  }}
                  min="1"
                  max="5"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              <div>
                <label className="text-xs text-blue-300">Rest (sec)</label>
                <Input
                  type="number"
                  value={specialConfig?.restSeconds ?? 20}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      restSeconds: value === '' ? '' : (parseInt(value) || 20),
                      targetReps: specialConfig?.targetReps || 15,
                      miniSets: specialConfig?.miniSets || 3
                    });
                  }}
                  min="15"
                  max="30"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-blue-300/70">
                Perform activation set to near failure, then {specialConfig?.miniSets || 3} mini-sets
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    miniSets: Math.max(1, (specialConfig?.miniSets || 3) - 1)
                  })}
                  className="h-6 w-6 p-0 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <Minus className="h-3 w-3 text-blue-400" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    miniSets: Math.min(8, (specialConfig?.miniSets || 3) + 1)
                  })}
                  className="h-6 w-6 p-0 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <Plus className="h-3 w-3 text-blue-400" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {specialMethod === 'myorep_no_match' && !set.completed && isActive && (
          <div className="bg-blue-500/10 border border-blue-500/20  p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <Zap className="h-3 w-3" />
              Myorep No Match Configuration
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-blue-300">Mini Sets</label>
                <Input
                  type="number"
                  value={specialConfig?.miniSets ?? 3}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      miniSets: value === '' ? '' : (parseInt(value) || 3),
                      restSeconds: specialConfig?.restSeconds || 20
                    });
                  }}
                  min="1"
                  max="5"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              <div>
                <label className="text-xs text-blue-300">Rest (sec)</label>
                <Input
                  type="number"
                  value={specialConfig?.restSeconds ?? 20}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      restSeconds: value === '' ? '' : (parseInt(value) || 20),
                      miniSets: specialConfig?.miniSets || 3
                    });
                  }}
                  min="15"
                  max="30"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-blue-300/70">
                Perform activation set to near failure, then {specialConfig?.miniSets ?? 3} mini-sets
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    miniSets: Math.max(1, (specialConfig?.miniSets || 3) - 1),
                    restSeconds: specialConfig?.restSeconds || 20
                  })}
                  className="h-6 w-6 p-0 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <Minus className="h-3 w-3 text-blue-400" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSpecialConfigChange?.({
                    ...specialConfig,
                    miniSets: Math.min(8, (specialConfig?.miniSets || 3) + 1),
                    restSeconds: specialConfig?.restSeconds || 20
                  })}
                  className="h-6 w-6 p-0 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <Plus className="h-3 w-3 text-blue-400" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Superset Configuration */}
        {specialMethod === 'superset' && !set.completed && isActive && (
          <div className="bg-purple-500/10 border border-purple-500/20 p-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
              <Plus className="h-3 w-3" />
              Superset Configuration
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-purple-300">Paired Exercise</label>
                <Input
                  type="text"
                  value={(() => {
                    if (specialConfig?.pairedExerciseId && sessionExercises) {
                      const pairedExercise = sessionExercises.find(ex => ex.exerciseId === specialConfig.pairedExerciseId);
                      return pairedExercise?.exercise?.name || "Exercise not found";
                    }
                    return specialConfig?.pairedExerciseName || "Not configured";
                  })()}
                  disabled
                  className="h-7 text-xs bg-background/50 border border-border/30 text-purple-300/70"
                />
              </div>
              <div>
                <label className="text-xs text-purple-300">Rest Between Sets (seconds)</label>
                <Input
                  type="number"
                  value={specialConfig?.restSeconds ?? 60}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSpecialConfigChange?.({
                      ...specialConfig,
                      restSeconds: value === '' ? '' : (parseInt(value) || 60)
                    });
                  }}
                  min="30"
                  max="120"
                  className="h-7 text-xs bg-background border border-border/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>
            <div className="text-xs text-purple-300/70">
              Perform this exercise paired with the configured exercise back-to-back with minimal rest between them.
            </div>
          </div>
        )}

        {/* Conditional Rendering: Show input only for active sets, compact view for completed */}
        {!set.completed && isActive ? (
          <div className="space-y-1">
            {/* Body Weight Info - Shows only when active */}
            {false && ( // Removed bodyweight info display
              <div className="bg-blue-500/10 border border-blue-500/20  p-1">
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
                  {isBodyWeightExercise && bodyWeightValue > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFillBodyWeight}
                      className="h-6 px-2 text-xs"
                    >
                      <Scale className="h-3 w-3 mr-1" />
                      {Math.round(convertWeight(bodyWeightValue, bodyWeightUnit, weightUnit) * 100) / 100}{weightUnit}
                    </Button>
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
                      className="workout-input h-9 text-sm border border-border/50 bg-background text-center touch-target [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ios-touch-feedback"
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
                    value={set.rpe ? set.rpe.toString() : "8"}
                    onValueChange={(value) => handleRpeChange(parseFloat(value))}
                  >
                    <SelectTrigger className="h-9 text-sm border border-border/50 bg-background touch-target ios-touch-feedback">
                      <SelectValue placeholder="8" />
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

        {/* Complete Set Button removed - now handled by GlobalCompleteSetButton */}

        {/* Completed Set Display - Minimal and clean */}
        {set.completed && (
          <div className="flex items-center justify-center p-1 bg-emerald-500/10 border border-emerald-500/20 ">
            <Check className="h-3 w-3 text-emerald-400 mr-1" />
            <span className="text-xs text-emerald-300 font-medium">
              {effectiveWeight}{weightUnit} × {set.actualReps} @ RPE {set.rpe}
            </span>
            {specialMethod && (
              <Badge variant="outline" className="ml-2 text-xs px-1 py-0 h-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
                {specialMethod === 'giant_set' && <Timer className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'drop_set' && <Minus className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'myorep_match' && <Target className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'myorep_no_match' && <Zap className="h-2 w-2 mr-0.5" />}
                {specialMethod === 'superset' && <Plus className="h-2 w-2 mr-0.5" />}
                {specialMethod.replace('_', ' ').toUpperCase().slice(0, 3)}
              </Badge>
            )}
          </div>
        )}

        {/* Non-active set preview - Shows basic info for inactive sets */}
        {!set.completed && !isActive && (
          <div className="p-1 bg-muted/20  text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground">
                {effectiveWeight > 0 || set.actualReps > 0 || set.rpe > 0
                  ? `${effectiveWeight || 0}${weightUnit} × ${set.actualReps || 0} @ RPE ${set.rpe || 0}`
                  : "Tap to edit"
                }
              </span>
              {specialMethod && (
                <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-orange-500/10 text-orange-400 border-orange-500/20">
                  {specialMethod === 'giant_set' && <Timer className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'drop_set' && <Minus className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'myorep_match' && <Target className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'myorep_no_match' && <Zap className="h-2 w-2 mr-0.5" />}
                  {specialMethod === 'superset' && <Plus className="h-2 w-2 mr-0.5" />}
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