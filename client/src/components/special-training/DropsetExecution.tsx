import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, RotateCcw, ArrowDown, Zap } from 'lucide-react';

interface DropsetData {
  drops: Array<{
    dropNumber: number;
    weight: number;
    reps: number;
    rpe: number;
    weightReduction?: number;
  }>;
  totalDrops: number;
  restBetweenDrops: number;
}

interface DropsetExecutionProps {
  data: DropsetData;
  onDataChange: (data: DropsetData) => void;
  onComplete: () => void;
  weightUnit: 'kg' | 'lbs';
  disabled?: boolean;
}

export function DropsetExecution({ 
  data, 
  onDataChange, 
  onComplete, 
  weightUnit,
  disabled = false 
}: DropsetExecutionProps) {
  const [currentDrop, setCurrentDrop] = useState(1);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [currentRpe, setCurrentRpe] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const maxDrops = 4; // Typical maximum for drop sets
  const progressPercentage = (data.drops.length / maxDrops) * 100;

  const getRecommendedWeight = () => {
    if (data.drops.length === 0) return 0;
    const lastDrop = data.drops[data.drops.length - 1];
    return Math.round(lastDrop.weight * 0.75); // 25% reduction
  };

  const handleDropComplete = () => {
    if (!currentWeight || !currentReps || !currentRpe) return;

    const weightReduction = data.drops.length > 0 
      ? Math.round(((data.drops[data.drops.length - 1].weight - currentWeight) / data.drops[data.drops.length - 1].weight) * 100)
      : 0;

    const newDrop = {
      dropNumber: currentDrop,
      weight: currentWeight,
      reps: currentReps,
      rpe: currentRpe,
      weightReduction: weightReduction || undefined
    };

    const updatedData = {
      ...data,
      drops: [...data.drops, newDrop]
    };

    onDataChange(updatedData);

    // Auto-termination conditions
    const shouldTerminate = 
      currentDrop >= maxDrops || 
      currentReps < 6 || // If reps drop too low
      currentRpe < 8; // If not reaching failure

    if (shouldTerminate) {
      setIsComplete(true);
      onComplete();
    } else {
      setCurrentDrop(currentDrop + 1);
      setCurrentWeight(getRecommendedWeight());
      setCurrentReps(0);
      setCurrentRpe(null);
    }
  };

  const handleFinishEarly = () => {
    setIsComplete(true);
    onComplete();
  };

  if (isComplete) {
    return (
      <Card className="border-orange-500/50 bg-orange-50/10 dark:bg-orange-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Drop Set Complete</span>
          </div>
          
          <div className="space-y-2">
            {data.drops.map((drop, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Drop {drop.dropNumber}:</span>
                <div className="flex items-center gap-2">
                  <span>{drop.weight}{weightUnit} × {drop.reps}</span>
                  <Badge variant="outline" className="text-xs">RPE {drop.rpe}</Badge>
                  {drop.weightReduction && (
                    <Badge variant="secondary" className="text-xs">
                      -{drop.weightReduction}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Total drops: {data.drops.length} | Time saved: ~50%
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Drop Set Protocol</span>
            <Badge variant="outline" className="text-xs">
              Drop {currentDrop}/{maxDrops}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleFinishEarly}
            className="text-xs h-6"
          >
            Finish
          </Button>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      {/* Current Drop Input */}
      <Card className="border-border/50">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-orange-500" />
              <span className="text-sm font-medium">Drop {currentDrop}</span>
            </div>
            {currentDrop > 1 && (
              <Badge variant="secondary" className="text-xs">
                Recommended: {getRecommendedWeight()}{weightUnit}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Weight ({weightUnit})</label>
              <Input
                type="number"
                value={currentWeight || ''}
                onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                placeholder={currentDrop > 1 ? getRecommendedWeight().toString() : "0"}
                className="h-8 text-center text-sm"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Reps</label>
              <Input
                type="number"
                value={currentReps || ''}
                onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-center text-sm"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">RPE</label>
              <Select
                value={currentRpe?.toString() || ''}
                onValueChange={(value) => setCurrentRpe(parseFloat(value))}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="RPE" />
                </SelectTrigger>
                <SelectContent>
                  {[8, 8.5, 9, 9.5, 10].map(rpe => (
                    <SelectItem key={rpe} value={rpe.toString()}>{rpe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleDropComplete}
            disabled={!currentWeight || !currentReps || !currentRpe}
            className="w-full h-8 text-sm"
          >
            {currentDrop === 1 ? 'Complete Initial Set' : `Complete Drop ${currentDrop}`}
          </Button>

          {currentDrop > 1 && (
            <div className="text-xs text-center text-muted-foreground">
              Reduce weight immediately and continue to failure
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Drops Summary */}
      {data.drops.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-2">
            <div className="text-xs font-medium mb-2">Completed Drops:</div>
            <div className="space-y-1">
              {data.drops.map((drop, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Drop {drop.dropNumber}:</span>
                  <div className="flex items-center gap-1">
                    <span>{drop.weight}{weightUnit} × {drop.reps}</span>
                    <Badge variant="outline" className="text-xs">RPE {drop.rpe}</Badge>
                    {drop.weightReduction && index > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        -{drop.weightReduction}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RP Guidance */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-2">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium">RP Guidance</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Drop 20-30% weight immediately after failure. Best for machines/cables. 
            Stop when reps drop below 6 or RPE drops below 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}