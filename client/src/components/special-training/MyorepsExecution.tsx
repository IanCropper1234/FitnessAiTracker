import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Timer, Zap, AlertCircle } from 'lucide-react';

interface MyorepsData {
  activationSet: { reps: number; weight: number; rpe: number; };
  miniSets: Array<{ 
    setNumber: number; 
    targetReps: number; 
    actualReps: number; 
    matchStatus: 'match' | 'no_match' | 'pending';
  }>;
  restInterval: number;
  terminationReason?: 'target_reached' | 'no_match' | 'user_stop';
}

interface MyorepsExecutionProps {
  data: MyorepsData;
  onDataChange: (data: MyorepsData) => void;
  onComplete: () => void;
  weightUnit: 'kg' | 'lbs';
  disabled?: boolean;
}

export function MyorepsExecution({ 
  data, 
  onDataChange, 
  onComplete, 
  weightUnit,
  disabled = false 
}: MyorepsExecutionProps) {
  const [phase, setPhase] = useState<'activation' | 'rest' | 'miniset' | 'complete'>('activation');
  const [currentMiniSet, setCurrentMiniSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [miniSetReps, setMiniSetReps] = useState(0);

  // Calculate target mini-set reps (25% of activation set)
  const targetMiniReps = Math.max(3, Math.round(data.activationSet.reps * 0.25));

  // Rest timer effect
  useEffect(() => {
    if (phase === 'rest' && restTimer > 0) {
      const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'rest' && restTimer === 0) {
      setPhase('miniset');
    }
  }, [phase, restTimer]);

  const handleActivationComplete = () => {
    setPhase('rest');
    setRestTimer(data.restInterval);
  };

  const handleMiniSetComplete = (matchStatus: 'match' | 'no_match') => {
    const newMiniSet = {
      setNumber: currentMiniSet,
      targetReps: targetMiniReps,
      actualReps: miniSetReps,
      matchStatus
    };

    const updatedData = {
      ...data,
      miniSets: [...data.miniSets, newMiniSet]
    };

    if (matchStatus === 'no_match' || currentMiniSet >= 5) {
      updatedData.terminationReason = matchStatus === 'no_match' ? 'no_match' : 'target_reached';
      setPhase('complete');
      onDataChange(updatedData);
      onComplete();
    } else {
      onDataChange(updatedData);
      setCurrentMiniSet(currentMiniSet + 1);
      setMiniSetReps(0);
      setPhase('rest');
      setRestTimer(data.restInterval);
    }
  };

  const handleUserStop = () => {
    const updatedData = {
      ...data,
      terminationReason: 'user_stop'
    };
    onDataChange(updatedData);
    onComplete();
  };

  const updateActivationSet = (field: keyof MyorepsData['activationSet'], value: number) => {
    onDataChange({
      ...data,
      activationSet: { ...data.activationSet, [field]: value }
    });
  };

  const completedMiniSets = data.miniSets.length;
  const progressPercentage = (completedMiniSets / 5) * 100;

  if (phase === 'complete') {
    return (
      <Card className="border-blue-500/50 bg-blue-50/10 dark:bg-blue-950/20">
        <CardContent className="p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Myo-Reps Complete</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Activation:</span>
              <div className="font-medium">{data.activationSet.reps} @ {data.activationSet.weight}{weightUnit}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Mini-Sets:</span>
              <div className="font-medium">{completedMiniSets}/5</div>
            </div>
            <div>
              <span className="text-muted-foreground">Reason:</span>
              <div className="font-medium capitalize">{data.terminationReason?.replace('_', ' ')}</div>
            </div>
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
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Myo-Reps Protocol</span>
            <Badge variant="outline" className="text-xs">
              {phase === 'activation' ? 'Activation' : `Mini-Set ${currentMiniSet}/5`}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUserStop}
            className="text-xs h-6"
          >
            Stop
          </Button>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      {/* Activation Set Phase */}
      {phase === 'activation' && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Activation Set (12-30 reps)</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Weight</label>
                <Input
                  type="number"
                  value={data.activationSet.weight || ''}
                  onChange={(e) => updateActivationSet('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  value={data.activationSet.reps || ''}
                  onChange={(e) => updateActivationSet('reps', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-center text-sm"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">RPE</label>
                <Select
                  value={data.activationSet.rpe?.toString() || ''}
                  onValueChange={(value) => updateActivationSet('rpe', parseFloat(value))}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="RPE" />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 8.5, 9, 9.5].map(rpe => (
                      <SelectItem key={rpe} value={rpe.toString()}>{rpe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleActivationComplete}
              disabled={!data.activationSet.reps || !data.activationSet.weight || !data.activationSet.rpe}
              className="w-full h-8 text-sm"
            >
              Complete Activation Set
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rest Phase */}
      {phase === 'rest' && (
        <Card className="border-orange-500/50 bg-orange-50/10 dark:bg-orange-950/20">
          <CardContent className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Rest Period</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              Take 3-5 deep breaths, prepare for mini-set
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini-Set Phase */}
      {phase === 'miniset' && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Mini-Set {currentMiniSet}/5</span>
              <Badge variant="secondary" className="text-xs">
                Target: {targetMiniReps} reps
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Reps Completed</label>
              <Input
                type="number"
                value={miniSetReps || ''}
                onChange={(e) => setMiniSetReps(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-center text-sm"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => handleMiniSetComplete('match')}
                disabled={!miniSetReps}
                className="h-8 text-sm bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Match
              </Button>
              <Button 
                onClick={() => handleMiniSetComplete('no_match')}
                disabled={!miniSetReps}
                variant="destructive"
                className="h-8 text-sm"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                No Match
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Click "Match" if you hit {targetMiniReps}+ reps, "No Match" if failed
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Mini-Sets Summary */}
      {data.miniSets.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-2">
            <div className="text-xs font-medium mb-1">Completed Mini-Sets:</div>
            <div className="flex gap-1 flex-wrap">
              {data.miniSets.map((set, index) => (
                <Badge 
                  key={index}
                  variant={set.matchStatus === 'match' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {set.actualReps} {set.matchStatus === 'match' ? '✓' : '✗'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}