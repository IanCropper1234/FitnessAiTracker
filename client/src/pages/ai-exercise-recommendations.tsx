import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock,
  Dumbbell,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useLocation } from "wouter";
import { AIExerciseRecommendationService } from "@/services/aiExerciseRecommendations";
import { useToast } from "@/hooks/use-toast";

interface ExerciseRecommendation {
  exerciseName: string;
  category: string;
  primaryMuscle: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  sets: number;
  reps: string;
  restPeriod: number;
  reasoning: string;
  progressionNotes: string;
  specialMethod?: string | null;
  specialConfig?: any;
  rpIntensity: number;
  volumeContribution: number;
}

export default function AIExerciseRecommendations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [goals, setGoals] = useState<string[]>([]);
  const [muscleGroupFocus, setMuscleGroupFocus] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(4);
  const [injuryRestrictions, setInjuryRestrictions] = useState<string>('');
  const [customRequirements, setCustomRequirements] = useState<string>('');

  // Available options
  const goalOptions = [
    'Muscle Hypertrophy',
    'Strength Building', 
    'Fat Loss',
    'Athletic Performance',
    'Muscle Endurance',
    'Rehabilitation',
    'Body Composition'
  ];

  const muscleGroupOptions = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 
    'Core', 'Glutes', 'Calves', 'Forearms'
  ];

  const equipmentOptions = [
    'Barbell', 'Dumbbells', 'Cable Machine', 'Resistance Bands',
    'Pull-up Bar', 'Bench', 'Squat Rack', 'Kettlebells', 
    'Bodyweight Only', 'Machines', 'Suspension Trainer'
  ];

  // Get current user data
  const { data: currentExercises } = useQuery({
    queryKey: ['/api/training/exercises'],
  });

  const { data: trainingHistory } = useQuery({
    queryKey: ['/api/analytics/training-history'],
  });

  // AI recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: async () => {
      if (goals.length === 0 || muscleGroupFocus.length === 0 || equipment.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const request = {
        userGoals: goals,
        currentExercises: Array.isArray(currentExercises) ? currentExercises.slice(0, 10) : [],
        trainingHistory: Array.isArray(trainingHistory) ? trainingHistory.slice(0, 5) : [],
        muscleGroupFocus,
        experienceLevel: experienceLevel as any,
        availableEquipment: equipment,
        timeConstraints: {
          sessionDuration,
          sessionsPerWeek
        },
        injuryRestrictions: injuryRestrictions ? injuryRestrictions.split(',').map(s => s.trim()) : undefined
      };

      return await AIExerciseRecommendationService.getExerciseRecommendations(request);
    },
    onSuccess: () => {
      toast({
        title: "AI Analysis Complete",
        description: "Your personalized exercise recommendations are ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed", 
        description: error.message || "Failed to generate recommendations. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGoalToggle = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleMuscleGroupToggle = (muscle: string) => {
    setMuscleGroupFocus(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleEquipmentToggle = (equip: string) => {
    setEquipment(prev => 
      prev.includes(equip) 
        ? prev.filter(e => e !== equip)
        : [...prev, equip]
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            AI Exercise Recommendations
          </h1>
          <p className="text-sm text-muted-foreground">Get intelligent, RP-based exercise suggestions tailored to your goals</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Training Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goals */}
            <div>
              <label className="text-sm font-medium mb-2 block">Training Goals *</label>
              <div className="grid grid-cols-2 gap-2">
                {goalOptions.map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`goal-${goal}`}
                      checked={goals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <label htmlFor={`goal-${goal}`} className="text-xs">{goal}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Muscle Group Focus */}
            <div>
              <label className="text-sm font-medium mb-2 block">Muscle Group Focus *</label>
              <div className="grid grid-cols-3 gap-2">
                {muscleGroupOptions.map(muscle => (
                  <div key={muscle} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`muscle-${muscle}`}
                      checked={muscleGroupFocus.includes(muscle)}
                      onCheckedChange={() => handleMuscleGroupToggle(muscle)}
                    />
                    <label htmlFor={`muscle-${muscle}`} className="text-xs">{muscle}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="text-sm font-medium mb-2 block">Experience Level</label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Available Equipment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Available Equipment *</label>
              <div className="grid grid-cols-2 gap-2">
                {equipmentOptions.map(equip => (
                  <div key={equip} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`equip-${equip}`}
                      checked={equipment.includes(equip)}
                      onCheckedChange={() => handleEquipmentToggle(equip)}
                    />
                    <label htmlFor={`equip-${equip}`} className="text-xs">{equip}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Constraints */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session Duration (min)</label>
                <Input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(parseInt(e.target.value) || 60)}
                  min="30"
                  max="180"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sessions/Week</label>
                <Input
                  type="number"
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 4)}
                  min="2"
                  max="7"
                />
              </div>
            </div>

            {/* Injury Restrictions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Injury Restrictions</label>
              <Input
                placeholder="e.g., Lower back, Right shoulder (comma separated)"
                value={injuryRestrictions}
                onChange={(e) => setInjuryRestrictions(e.target.value)}
              />
            </div>

            {/* Custom Requirements */}
            <div>
              <label className="text-sm font-medium mb-2 block">Additional Requirements</label>
              <Textarea
                placeholder="Any specific preferences or requirements..."
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                className="h-20"
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={() => recommendationMutation.mutate()}
              disabled={recommendationMutation.isPending || goals.length === 0 || muscleGroupFocus.length === 0 || equipment.length === 0}
              className="w-full"
            >
              {recommendationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recommendationMutation.data && !recommendationMutation.isPending && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Configure your preferences and generate recommendations</p>
              </div>
            )}

            {recommendationMutation.isPending && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" />
                <p className="text-sm">AI is analyzing your data...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            )}

            {recommendationMutation.data && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6">
                  {/* Overall Analysis */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">AI Analysis</span>
                    </div>
                    <p className="text-xs text-blue-300">{recommendationMutation.data.reasoning}</p>
                  </div>

                  {/* RP Considerations */}
                  <div className="p-4 bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">RP Methodology Insights</span>
                    </div>
                    <p className="text-xs text-green-300">{recommendationMutation.data.rpConsiderations}</p>
                  </div>

                  {/* Exercise Recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Recommended Exercises
                    </h4>
                    
                    {recommendationMutation.data.recommendations.map((rec: ExerciseRecommendation, index: number) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-sm">{rec.exerciseName}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {rec.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {rec.primaryMuscle}
                                </Badge>
                                <Badge 
                                  variant={rec.difficulty === 'beginner' ? 'default' : rec.difficulty === 'advanced' ? 'destructive' : 'outline'}
                                  className="text-xs"
                                >
                                  {rec.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{rec.sets} × {rec.reps}</div>
                              <div className="text-xs text-muted-foreground">{rec.restPeriod}s rest</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-muted/50 p-2">
                                <div className="text-xs text-muted-foreground">RPE</div>
                                <div className="text-sm font-medium">{rec.rpIntensity}/10</div>
                              </div>
                              <div className="bg-muted/50 p-2">
                                <div className="text-xs text-muted-foreground">Volume</div>
                                <div className="text-sm font-medium">{rec.volumeContribution} sets</div>
                              </div>
                              <div className="bg-muted/50 p-2">
                                <div className="text-xs text-muted-foreground">Equipment</div>
                                <div className="text-sm font-medium">{rec.equipment}</div>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-muted-foreground mb-1">AI Reasoning:</div>
                              <p className="text-xs">{rec.reasoning}</p>
                            </div>

                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Progression Notes:</div>
                              <p className="text-xs text-green-400">{rec.progressionNotes}</p>
                            </div>

                            {rec.specialMethod && (
                              <div className="p-2 bg-orange-500/10 border border-orange-500/20">
                                <div className="text-xs text-orange-400 font-medium">
                                  Special Method: {rec.specialMethod}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Progression Plan */}
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">Progression Plan</span>
                    </div>
                    <p className="text-xs text-purple-300">{recommendationMutation.data.progressionPlan}</p>
                  </div>
                </div>
              </ScrollArea>
            )}

            {recommendationMutation.error && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-red-500">Failed to generate recommendations</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {recommendationMutation.error.message}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => recommendationMutation.reset()}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}