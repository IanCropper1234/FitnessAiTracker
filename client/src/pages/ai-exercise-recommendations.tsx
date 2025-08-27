import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Info,
  Save,
  Calendar,
  Plus
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
  sessionDay?: number;
  sessionName?: string;
}

interface WeeklyWorkoutPlan {
  sessions: WorkoutSession[];
  weekStructure: string;
  totalVolume: number;
  reasoning: string;
  rpConsiderations: string;
  progressionPlan: string;
  specialMethodsUsage: {
    percentage: number;
    distribution: string;
  };
}

interface WorkoutSession {
  day: number;
  name: string;
  muscleGroupFocus: string[];
  exercises: ExerciseRecommendation[];
  sessionDuration: number;
  totalVolume: number;
  specialMethodsCount: number;
}

export default function CreateAIWorkoutSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [goals, setGoals] = useState<string[]>([]);
  const [muscleGroupFocus, setMuscleGroupFocus] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(4);
  const [specialMethodPercentage, setSpecialMethodPercentage] = useState<number>(20);
  const [injuryRestrictions, setInjuryRestrictions] = useState<string>('');
  const [customRequirements, setCustomRequirements] = useState<string>('');
  
  // Weekly plan state - default to single program as requested
  const [viewMode, setViewMode] = useState<'single' | 'weekly'>('single');
  const [templateNamePrefix, setTemplateNamePrefix] = useState<string>('AI Generated Workout');

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
    'Chest', 'Back', 'Quads', 'Hamstrings', 'Glutes',
    'Front/Anterior Delts', 'Side/Medial Delts', 'Rear/Posterior Delts',
    'Biceps', 'Triceps', 'Calves', 'Abs', 'Traps', 'Forearms'
  ];

  const equipmentOptions = [
    'Barbell', 'Dumbbells', 'Cable Machine', 'Resistance Bands',
    'Pull-up Bar', 'Bench', 'Squat Rack', 'Kettlebells', 
    'Bodyweight Only', 'Machines', 'Suspension Trainer'
  ];

  // Get current user data
  const { data: currentExercises } = useQuery<any[]>({
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

      const formData = {
        userGoals: goals,
        muscleGroupFocus,
        experienceLevel,
        availableEquipment: equipment,
        timeConstraints: {
          sessionDuration,
          sessionsPerWeek
        },
        injuryRestrictions,
        customRequirements,
        currentExercises: (currentExercises as any[]) || [],
        trainingHistory: trainingHistory || []
      };

      console.log('Sending AI recommendation request:', formData);
      console.log('Current exercises count:', (currentExercises as any[])?.length || 0);
      
      if (viewMode === 'weekly') {
        return await AIExerciseRecommendationService.getWeeklyWorkoutPlan(formData);
      } else {
        return await AIExerciseRecommendationService.getRecommendations(formData);
      }
    },
    onSuccess: (data) => {
      console.log('AI recommendations received:', data);
      const exerciseCount = viewMode === 'weekly' 
        ? data.sessions?.reduce((total: number, session: WorkoutSession) => total + session.exercises.length, 0) || 0
        : data.recommendations?.length || 0;
      
      toast({
        title: "AI Analysis Complete",
        description: viewMode === 'weekly' 
          ? `Generated complete ${sessionsPerWeek}-day workout program with ${exerciseCount} total exercises.`
          : `Generated ${exerciseCount} exercise recommendations based on your goals.`,
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

  // Save weekly workout plan mutation
  const saveWeeklyPlanMutation = useMutation({
    mutationFn: async (data: { weeklyPlan: WeeklyWorkoutPlan; templateNamePrefix: string }) => {
      console.log('Saving weekly workout plan:', data);
      return await AIExerciseRecommendationService.saveWeeklyWorkoutPlan(data);
    },
    onSuccess: (result) => {
      console.log('Weekly plan saved successfully:', result);
      toast({
        title: "Workout Plan Saved!",
        description: `Successfully saved ${result.templates.length} workout templates. You can find them in your training templates.`,
      });
    },
    onError: (error: any) => {
      console.error('Save weekly plan error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save workout plan. Please try again.",
        variant: "destructive",
      });
    },
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

  // Save individual exercise to template
  const handleSaveExerciseToTemplate = async (rec: ExerciseRecommendation) => {
    try {
      const response = await fetch('/api/training/saved-workout-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `AI Generated - ${rec.exerciseName}`,
          description: `AI-generated exercise focusing on ${rec.primaryMuscle}. ${rec.reasoning}`,
          exerciseTemplates: [{
            exerciseId: (() => {
              // Find the exercise ID by name with flexible matching
              let exerciseMatch = (currentExercises as any[])?.find((ex: any) => 
                ex.name.toLowerCase() === rec.exerciseName.toLowerCase()
              );
              
              // If no exact match, try partial matching
              if (!exerciseMatch) {
                exerciseMatch = (currentExercises as any[])?.find((ex: any) => 
                  ex.name.toLowerCase().includes(rec.exerciseName.toLowerCase()) ||
                  rec.exerciseName.toLowerCase().includes(ex.name.toLowerCase())
                );
              }
              
              console.log(`Single exercise mapping: "${rec.exerciseName}" -> ${exerciseMatch ? `${exerciseMatch.name} (ID: ${exerciseMatch.id})` : 'NOT FOUND'}`);
              return exerciseMatch?.id || null;
            })(),
            exerciseName: rec.exerciseName,
            sets: rec.sets,
            targetReps: rec.reps,
            restPeriod: rec.restPeriod,
            notes: rec.reasoning,
            specialMethod: rec.specialMethod === 'null' ? null : rec.specialMethod,
            specialConfig: rec.specialConfig || {},
            specialMethodData: rec.specialConfig || {}
          }],
          tags: ['ai-generated'],
          estimatedDuration: 30,
          difficulty: rec.difficulty
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise template');
      }

      toast({
        title: "Exercise Saved!",
        description: `${rec.exerciseName} has been saved to your training templates.`,
      });

      // Invalidate templates cache to refresh the templates tab
      queryClient.invalidateQueries({ queryKey: ['/api/training/saved-workout-templates'] });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save exercise template.",
        variant: "destructive",
      });
    }
  };

  // Save all exercises from single session as one template
  const handleSaveAllExercisesToTemplate = async () => {
    if (!recommendationMutation.data?.recommendations) return;

    try {
      const exercises = recommendationMutation.data.recommendations.map((rec: ExerciseRecommendation, index: number) => {
        // Find the exercise ID by name with flexible matching
        let exerciseMatch = (currentExercises as any[])?.find((ex: any) => 
          ex.name.toLowerCase() === rec.exerciseName.toLowerCase()
        );
        
        // If no exact match, try partial matching
        if (!exerciseMatch) {
          exerciseMatch = (currentExercises as any[])?.find((ex: any) => 
            ex.name.toLowerCase().includes(rec.exerciseName.toLowerCase()) ||
            rec.exerciseName.toLowerCase().includes(ex.name.toLowerCase())
          );
        }
        
        // If still no match, try with common variations
        if (!exerciseMatch) {
          const variations = [
            rec.exerciseName.replace(/^barbell\s+/i, ''),
            rec.exerciseName.replace(/^dumbbell\s+/i, ''),
            rec.exerciseName.replace(/\s+press$/i, ''),
            rec.exerciseName.replace(/\s+curl$/i, ''),
            'Barbell ' + rec.exerciseName,
            'Dumbbell ' + rec.exerciseName
          ];
          
          for (const variation of variations) {
            exerciseMatch = (currentExercises as any[])?.find((ex: any) => 
              ex.name.toLowerCase() === variation.toLowerCase()
            );
            if (exerciseMatch) break;
          }
        }
        
        console.log(`Exercise mapping: "${rec.exerciseName}" -> ${exerciseMatch ? `${exerciseMatch.name} (ID: ${exerciseMatch.id})` : 'NOT FOUND'}`);
        
        return {
          exerciseId: exerciseMatch?.id || null,
          exerciseName: exerciseMatch?.name || rec.exerciseName,
          sets: rec.sets,
          targetReps: rec.reps,
          restPeriod: rec.restPeriod,
          notes: rec.reasoning,
          specialMethod: rec.specialMethod === 'null' ? null : rec.specialMethod,
          specialConfig: rec.specialConfig || {},
          specialMethodData: rec.specialConfig || {}
        };
      });

      const response = await fetch('/api/training/saved-workout-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `AI Generated Session - ${new Date().toLocaleDateString()}`,
          description: `AI-generated complete training session with ${exercises.length} exercises. ${recommendationMutation.data.reasoning}`,
          exerciseTemplates: exercises,
          tags: ['ai-generated'],
          estimatedDuration: 60,
          difficulty: 'intermediate'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save session template');
      }

      toast({
        title: "Session Saved!",
        description: `Complete AI session with ${exercises.length} exercises has been saved to your training templates.`,
      });

      // Invalidate templates cache to refresh the templates tab
      queryClient.invalidateQueries({ queryKey: ['/api/training/saved-workout-templates'] });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save session template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 ml-[-10px] mr-[-10px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/training')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            Create AI Workout Session
          </h1>
          <p className="text-sm text-muted-foreground">Generate intelligent, evidence-based workout sessions tailored to your goals</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 min-h-0 max-h-[calc(100vh-120px)]">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Training Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generation Mode Selector */}
            <div>
              <label className="text-sm font-medium mb-3 block">Generation Mode</label>
              <Tabs value={viewMode} onValueChange={(value) => {
                // Only allow single mode selection
                if (value === 'single') {
                  setViewMode(value as 'single' | 'weekly');
                }
              }}>
                <TabsList className="h-10 items-center justify-center bg-muted p-1 text-muted-foreground grid w-full grid-cols-1 pt-[0px] pb-[0px] mt-[15px] mb-[15px]">
                  <TabsTrigger value="single" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2 h-auto min-h-[44px] ml-[-5px] mr-[-5px]">
                    <Dumbbell className="h-4 w-4" />
                    <span className="font-medium text-[12px]">Single Session Generation</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground mt-2">
                Generate AI-powered exercise recommendations for a single training session using evidence-based methodology
              </p>
            </div>
            {/* Goals */}
            <div>
              <label className="text-sm font-medium mb-2 block">Training Goals *</label>
              <div className="grid grid-cols-2 gap-2 ml-[-10px] mr-[-10px]">
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
              <div className="grid grid-cols-3 gap-2 pl-[0px] pr-[0px] ml-[-10px] mr-[-10px]">
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
                  <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (6 months - 3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                  <SelectItem value="elite">Elite (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Available Equipment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Available Equipment *</label>
              <div className="grid grid-cols-2 gap-2 ml-[-10px] mr-[-10px]">
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
            <div className={viewMode === 'weekly' ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
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
              {viewMode === 'weekly' && (
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
              )}
            </div>

            {/* Special Training Methods Percentage */}
            <div>
              <label className="text-sm font-medium mb-2 block">Special Training Methods %</label>
              <div className="space-y-2">
                <Select value={specialMethodPercentage.toString()} onValueChange={(value) => setSpecialMethodPercentage(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% - Standard sets only</SelectItem>
                    <SelectItem value="10">10% - Minimal special methods</SelectItem>
                    <SelectItem value="20">20% - Moderate (Recommended)</SelectItem>
                    <SelectItem value="30">30% - Enhanced intensity</SelectItem>
                    <SelectItem value="40">40% - High intensity</SelectItem>
                    <SelectItem value="50">50% - Maximum variety</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Percentage of exercises using special methods (MyoRep, Drop Sets, Giant Sets, etc.)
                </p>
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

            {/* Weekly Plan Template Name (only in weekly mode) */}
            {viewMode === 'weekly' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Template Name Prefix</label>
                <Input
                  placeholder="AI Generated Workout"
                  value={templateNamePrefix}
                  onChange={(e) => setTemplateNamePrefix(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Each session will be saved as: "{templateNamePrefix} - Day 1", "{templateNamePrefix} - Day 2", etc.
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={() => recommendationMutation.mutate()}
              disabled={recommendationMutation.isPending || goals.length === 0 || muscleGroupFocus.length === 0 || equipment.length === 0}
              className="w-full"
            >
              {recommendationMutation.isPending ? (
                <>
                  <div className="ios-loading-dots flex items-center gap-1 mr-2">
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  {viewMode === 'weekly' ? 'Generating Weekly Plan...' : 'Analyzing with AI...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {viewMode === 'weekly' ? 'Generate Weekly Workout Plan' : 'Generate AI Recommendations'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="flex flex-col max-h-[90vh]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden">
            {!recommendationMutation.data && !recommendationMutation.isPending && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Configure your preferences and generate recommendations</p>
              </div>
            )}

            {recommendationMutation.isPending && (
              <div className="text-center py-12">
                <div className="ios-loading-dots flex items-center gap-1 justify-center mb-3">
                  <div className="dot w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="dot w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="dot w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-sm">AI is analyzing your data...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            )}

            {recommendationMutation.data && (
              <div className="space-y-4 h-full overflow-y-auto pr-2">
                {/* Save Weekly Plan Button (only for weekly mode) */}
                {viewMode === 'weekly' && recommendationMutation.data.sessions && (
                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => saveWeeklyPlanMutation.mutate({ 
                          weeklyPlan: recommendationMutation.data, 
                          templateNamePrefix 
                        })}
                        disabled={saveWeeklyPlanMutation.isPending}
                        variant="default"
                        className="w-full"
                      >
                        {saveWeeklyPlanMutation.isPending ? (
                          <>
                            <div className="ios-loading-dots flex items-center gap-1 mr-2">
                              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                              <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                            Saving Templates...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save as Training Templates
                          </>
                        )}
                      </Button>
                      <div className="text-xs text-center text-muted-foreground">
                        This will create {recommendationMutation.data.sessions?.length || 0} individual training templates
                      </div>
                    </div>
                )}

                {/* Weekly Plan Summary (for weekly mode) */}
                {viewMode === 'weekly' && recommendationMutation.data.sessions && (
                    <div className="p-4 bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-medium text-foreground">Weekly Plan Summary</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><span className="font-medium">Sessions:</span> {recommendationMutation.data.sessions.length} days</p>
                        <p><span className="font-medium">Total Exercises:</span> {recommendationMutation.data.sessions.reduce((total: number, session: any) => total + session.exercises.length, 0)}</p>
                        <p><span className="font-medium">Special Methods:</span> {recommendationMutation.data.specialMethodsUsage?.percentage || 0}% distribution</p>
                        <p><span className="font-medium">Weekly Volume:</span> {recommendationMutation.data.totalVolume || 0} sets</p>
                      </div>
                    </div>
                )}

                {/* Overall Analysis */}
                <div className="p-4 bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium text-foreground">AI Analysis</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{recommendationMutation.data.reasoning}</p>
                </div>

                {/* RP Considerations */}
                <div className="p-4 bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium text-foreground">Science Based Methodology Insights</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{recommendationMutation.data.rpConsiderations}</p>
                </div>

                {/* Exercise Recommendations - Different display for weekly vs single mode */}
                {viewMode === 'weekly' && recommendationMutation.data.sessions ? (
                    // Weekly Plan Display
                    (<div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2 sticky top-0 bg-background z-10 py-2">
                        <Calendar className="h-4 w-4" />
                        Weekly Training Sessions ({recommendationMutation.data.sessions.length} Days)
                      </h4>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {recommendationMutation.data.sessions.map((session: WorkoutSession, sessionIndex: number) => (
                          <Card key={sessionIndex} className="border-l-4 border-l-primary/50">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-sm">{session.name}</h5>
                                  <p className="text-xs text-muted-foreground">
                                    {session.muscleGroupFocus?.join(', ') || 'Multi-muscle'} • {session.exercises.length} exercises • {session.sessionDuration || 60}min
                                  </p>
                                </div>
                                <Badge variant="outline">Day {session.day}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {session.exercises.map((exercise: ExerciseRecommendation, exerciseIndex: number) => (
                                  <div key={exerciseIndex} className="p-2 bg-muted/30 border border-muted">
                                    <div className="flex items-center justify-between mb-1">
                                      <h6 className="font-medium text-xs">{exercise.exerciseName}</h6>
                                      <div className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold shadow-sm">
                                        {exercise.sets} × {exercise.reps}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs h-4 px-1">
                                        {exercise.primaryMuscle}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs h-4 px-1">
                                        {exercise.equipment}
                                      </Badge>
                                      <Badge variant={exercise.specialMethod && exercise.specialMethod !== 'null' ? "default" : "secondary"} className="text-xs h-4 px-1">
                                        {exercise.specialMethod && exercise.specialMethod !== 'null' ? exercise.specialMethod : 'Standard'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      RPE {exercise.rpIntensity}/10 • {exercise.restPeriod}s rest • {exercise.volumeContribution} sets
                                    </div>
                                    {exercise.specialConfig && exercise.specialMethod && exercise.specialMethod !== 'null' && (
                                      <div className="mt-1 p-1 bg-orange-500/10 text-xs text-orange-400">
                                        {exercise.specialMethod === 'myorep_match' && (
                                          <span>Target: {exercise.specialConfig.targetReps || 15} reps, Mini-sets: {exercise.specialConfig.miniSets || 3}</span>
                                        )}
                                        {exercise.specialMethod === 'drop_set' && (
                                          <span>Drops: {exercise.specialConfig.dropSets || 2}, Reductions: {exercise.specialConfig.weightReductions?.join('%, ') || '15, 15'}%</span>
                                        )}
                                        {exercise.specialMethod === 'giant_set' && (
                                          <span>Target: {exercise.specialConfig.totalTargetReps || 40} reps</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>)
                ) : (
                    // Single Session Display
                    (<div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Recommended Exercises ({recommendationMutation.data.recommendations?.length || 0})
                        </h4>
                        {/* Save All Exercises Button for Single Session */}
                        {recommendationMutation.data.recommendations && recommendationMutation.data.recommendations.length > 0 && (
                          <Button 
                            onClick={() => handleSaveAllExercisesToTemplate()}
                            variant="default"
                            size="sm"
                            className="text-xs whitespace-nowrap"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save All
                          </Button>
                        )}
                      </div>
                      {recommendationMutation.data.recommendations?.map((rec: ExerciseRecommendation, index: number) => (
                      <Card key={index} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
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
                            </div>
                            
                            {/* Sets and Reps in separate row */}
                            <div className="flex items-center justify-between">
                              <div className="bg-primary text-primary-foreground px-4 py-2 text-lg font-bold shadow-sm">
                                {rec.sets} × {rec.reps}
                              </div>
                              <div className="text-sm text-muted-foreground">{rec.restPeriod}s rest</div>
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
                              <p className="text-xs text-foreground">{rec.progressionNotes}</p>
                            </div>

                            <div className={`p-3 ${rec.specialMethod && rec.specialMethod !== 'null' ? 'bg-muted border border-border' : 'bg-muted/50 border border-border/50'}`}>
                              <div className={`text-xs font-medium mb-2 ${rec.specialMethod && rec.specialMethod !== 'null' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Special Method: {rec.specialMethod && rec.specialMethod !== 'null' ? rec.specialMethod : 'Standard'}
                              </div>
                              {rec.specialConfig && rec.specialMethod && rec.specialMethod !== 'null' && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {rec.specialMethod === 'myorep_match' && (
                                    <div>Target: {rec.specialConfig.targetReps || 15} reps, Mini-sets: {rec.specialConfig.miniSets || 3}, Rest: {rec.specialConfig.restSeconds || 15}s</div>
                                  )}
                                  {rec.specialMethod === 'myorep_no_match' && (
                                    <div>Mini-sets: {rec.specialConfig.miniSets || 3}, Rest: {rec.specialConfig.restSeconds || 15}s</div>
                                  )}
                                  {rec.specialMethod === 'drop_set' && (
                                    <div>Drops: {rec.specialConfig.dropSets || 2}, Reductions: {rec.specialConfig.weightReductions?.join('%, ') || '15, 15'}%, Rest: {rec.specialConfig.dropRestSeconds || 10}s</div>
                                  )}
                                  {rec.specialMethod === 'giant_set' && (
                                    <div>Target: {rec.specialConfig.totalTargetReps || 40} reps, Mini-sets: {rec.specialConfig.miniSetReps || 5} reps, Rest: {rec.specialConfig.restSeconds || 10}s</div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Save to Template Button */}
                            <div className="flex justify-end pt-2 border-t border-muted/20">
                              <button 
                                onClick={() => handleSaveExerciseToTemplate(rec)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors shadow-sm hover:shadow-md"
                              >
                                <span>💾</span>
                                Save to Templates
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>)
                )}

                {/* Progression Plan */}
                <div className="p-4 bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium text-foreground">Progression Plan</span>
                    </div>
                  <p className="text-xs text-muted-foreground">{recommendationMutation.data.progressionPlan}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}