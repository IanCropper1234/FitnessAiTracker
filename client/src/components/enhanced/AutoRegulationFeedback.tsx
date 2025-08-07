import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Heart,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoRegulationFeedbackProps {
  currentRPE: number;
  onRPEChange: (rpe: number) => void;
  onFeedbackSubmit: (feedback: {
    rpe: number;
    energyLevel: number;
    difficulty: 'too_easy' | 'just_right' | 'too_hard';
    notes?: string;
  }) => void;
  className?: string;
}

const AutoRegulationFeedback: React.FC<AutoRegulationFeedbackProps> = ({
  currentRPE,
  onRPEChange,
  onFeedbackSubmit,
  className
}) => {
  const [selectedRPE, setSelectedRPE] = useState(currentRPE);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [difficulty, setDifficulty] = useState<'too_easy' | 'just_right' | 'too_hard'>('just_right');
  const [notes, setNotes] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // RPE descriptions for better user understanding
  const rpeDescriptions = {
    6: 'Very Easy - Could do many more reps',
    7: 'Easy - Could do 3-4 more reps', 
    8: 'Moderate - Could do 2-3 more reps',
    9: 'Hard - Could do 1-2 more reps',
    10: 'Maximum - Could not do any more reps'
  };

  // Energy level descriptions
  const energyDescriptions = {
    1: 'Very Low - Struggling',
    2: 'Low - Below average',
    3: 'Average - Normal',
    4: 'High - Above average', 
    5: 'Very High - Excellent'
  };

  useEffect(() => {
    setSelectedRPE(currentRPE);
  }, [currentRPE]);

  const handleRPESelect = (rpe: number) => {
    setSelectedRPE(rpe);
    onRPEChange(rpe);
    
    // Trigger selection animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSubmit = () => {
    onFeedbackSubmit({
      rpe: selectedRPE,
      energyLevel,
      difficulty,
      notes: notes.trim() || undefined
    });

    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'too_easy': return 'text-green-600 bg-green-100 border-green-300';
      case 'just_right': return 'text-blue-600 bg-blue-100 border-blue-300'; 
      case 'too_hard': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRPEColor = (rpe: number) => {
    if (rpe <= 6) return 'text-green-600 bg-green-100 border-green-300';
    if (rpe <= 7) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    if (rpe <= 8) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <Card className={cn(
      "transition-all duration-500 ease-out border-2",
      showSuccess ? "border-green-300 bg-green-50/50" : "border-border",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header with animation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 transition-all duration-300",
              showSuccess ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
            )}>
              {showSuccess ? <CheckCircle className="h-4 w-4" /> : <Star className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Auto-Regulation Feedback</h3>
              <p className="text-xs text-muted-foreground">How did that set feel?</p>
            </div>
          </div>
          
          {showSuccess && (
            <div className="flex items-center gap-1 text-green-600 animate-in slide-in-from-right duration-300">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Recorded!</span>
            </div>
          )}
        </div>

        {/* RPE Selection with enhanced animations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Rate of Perceived Exertion (RPE)
            </label>
            <Badge variant="outline" className={cn(
              "text-xs transition-all duration-300",
              getRPEColor(selectedRPE)
            )}>
              RPE {selectedRPE}
            </Badge>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {[6, 7, 8, 9, 10].map((rpe) => (
              <button
                key={rpe}
                onClick={() => handleRPESelect(rpe)}
                className={cn(
                  "h-12 text-xs font-semibold transition-all duration-300 border-2 flex flex-col items-center justify-center gap-0.5",
                  "ios-touch-feedback hover:scale-105 active:scale-95",
                  selectedRPE === rpe
                    ? getRPEColor(rpe) + " scale-105 shadow-lg"
                    : "text-muted-foreground bg-background border-border hover:bg-muted/50",
                  isAnimating && selectedRPE === rpe ? "animate-pulse" : ""
                )}
              >
                <span className="text-sm font-bold">{rpe}</span>
                <span className="text-[10px] opacity-75">
                  {rpe === 6 ? 'Easy' : rpe === 7 ? 'Light' : rpe === 8 ? 'Mod' : rpe === 9 ? 'Hard' : 'Max'}
                </span>
              </button>
            ))}
          </div>
          
          {selectedRPE && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-2  animate-in fade-in-0 slide-in-from-top-2 duration-300">
              {rpeDescriptions[selectedRPE as keyof typeof rpeDescriptions]}
            </p>
          )}
        </div>

        {/* Energy Level Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Energy Level
            </label>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="text-xs font-medium">{energyLevel}/5</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setEnergyLevel(level)}
                className={cn(
                  "h-10 text-xs font-semibold transition-all duration-300 border-2",
                  "ios-touch-feedback hover:scale-105 active:scale-95",
                  energyLevel === level
                    ? "text-red-600 bg-red-100 border-red-300 scale-105"
                    : "text-muted-foreground bg-background border-border hover:bg-muted/50"
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Heart className={cn(
                    "h-3 w-3 transition-colors",
                    energyLevel >= level ? "text-red-500 fill-red-500" : "text-muted-foreground"
                  )} />
                  <span className="text-[10px]">{level}</span>
                </div>
              </button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {energyDescriptions[energyLevel as keyof typeof energyDescriptions]}
          </p>
        </div>

        {/* Difficulty Assessment */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            Overall Difficulty
          </label>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'too_easy', label: 'Too Easy', icon: TrendingDown },
              { key: 'just_right', label: 'Just Right', icon: Minus },
              { key: 'too_hard', label: 'Too Hard', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDifficulty(key as any)}
                className={cn(
                  "h-10 text-xs font-medium transition-all duration-300 border-2 flex items-center justify-center gap-1",
                  "ios-touch-feedback hover:scale-105 active:scale-95",
                  difficulty === key
                    ? getDifficultyColor(key) + " scale-105"
                    : "text-muted-foreground bg-background border-border hover:bg-muted/50"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the set feel? Any observations..."
            className="min-h-[60px] text-xs resize-none"
            rows={2}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          className={cn(
            "w-full h-10 transition-all duration-300",
            showSuccess 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-primary hover:bg-primary/90"
          )}
          disabled={showSuccess}
        >
          <div className="flex items-center justify-center gap-2">
            {showSuccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            <span className="font-medium text-sm">
              {showSuccess ? 'Feedback Recorded' : 'Submit Feedback'}
            </span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export { AutoRegulationFeedback };
export default AutoRegulationFeedback;