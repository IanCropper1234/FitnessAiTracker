import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Zap, Target, RotateCcw, Layers, Info } from 'lucide-react';

export type SpecialTrainingMethod = 'standard' | 'myoreps' | 'dropset' | 'superset' | 'giantset';

interface SpecialMethodSelectorProps {
  currentMethod: SpecialTrainingMethod;
  onMethodChange: (method: SpecialTrainingMethod) => void;
  exerciseName?: string;
  disabled?: boolean;
}

const methodConfigs = {
  standard: {
    name: 'Standard',
    icon: Target,
    color: 'bg-gray-500',
    description: 'Traditional straight sets',
    timeMultiplier: '1x',
    difficulty: 'Beginner',
    rpGuidance: 'Works with all exercises',
  },
  myoreps: {
    name: 'Myo-Reps',
    icon: Zap,
    color: 'bg-blue-500',
    description: 'Activation set + mini-sets with short rest',
    timeMultiplier: '0.7x',
    difficulty: 'Intermediate',
    rpGuidance: 'Best for isolation exercises, machines',
  },
  dropset: {
    name: 'Drop Set',
    icon: RotateCcw,
    color: 'bg-orange-500',
    description: 'Continue to failure with reduced weight',
    timeMultiplier: '0.5x',
    difficulty: 'Intermediate',
    rpGuidance: 'Optimal for machines/cables (quick weight changes)',
  },
  superset: {
    name: 'Superset',
    icon: Layers,
    color: 'bg-green-500',
    description: 'Two exercises back-to-back',
    timeMultiplier: '0.6x',
    difficulty: 'Intermediate',
    rpGuidance: 'Pairs agonist-antagonist or pre-exhaustion',
  },
  giantset: {
    name: 'Giant Set',
    icon: Clock,
    color: 'bg-purple-500',
    description: '4+ exercises in circuit format',
    timeMultiplier: '0.4x',
    difficulty: 'Advanced',
    rpGuidance: 'Focus on technique and mind-muscle connection',
  },
} as const;

export function SpecialMethodSelector({ 
  currentMethod, 
  onMethodChange, 
  exerciseName = '',
  disabled = false 
}: SpecialMethodSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const currentConfig = methodConfigs[currentMethod];
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-2">
      {/* Method Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full ${currentConfig.color}`} />
          <Select
            value={currentMethod}
            onValueChange={(value: SpecialTrainingMethod) => onMethodChange(value)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs border-border/50 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(methodConfigs).map(([key, config]) => {
                const MethodIcon = config.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <MethodIcon className="h-3 w-3" />
                      <span>{config.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {config.timeMultiplier}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Info Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Method details & RP guidance</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Method Details Card */}
      {showDetails && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <span className="font-medium text-sm">{currentConfig.name}</span>
              <Badge variant="secondary" className="text-xs">
                {currentConfig.difficulty}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {currentConfig.description}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Time:</span>
                <span className="ml-1 font-medium">{currentConfig.timeMultiplier}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className="ml-1 font-medium">{currentConfig.difficulty}</span>
              </div>
            </div>
            
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">RP Guidance:</span> {currentConfig.rpGuidance}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}