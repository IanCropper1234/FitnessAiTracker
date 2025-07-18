import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Activity, Zap, Moon, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AutoRegulationFeedbackProps {
  sessionId: number;
  userId: number;
  onComplete: () => void;
}

interface FeedbackData {
  pumpQuality: number;
  muscleSoreness: number;
  perceivedEffort: number;
  energyLevel: number;
  sleepQuality: number;
}

export function AutoRegulationFeedback({ sessionId, userId, onComplete }: AutoRegulationFeedbackProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<FeedbackData>({
    pumpQuality: 7,
    muscleSoreness: 5,
    perceivedEffort: 7,
    energyLevel: 7,
    sleepQuality: 7,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: FeedbackData) => {
      return apiRequest("POST", "/api/training/auto-regulation-feedback", {
        sessionId,
        userId,
        ...feedbackData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Your auto-regulation feedback has been recorded. This will help optimize your future workouts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFeedback = (field: keyof FeedbackData, value: number) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const getFeedbackColor = (value: number, isReverse: boolean = false) => {
    if (isReverse) {
      if (value <= 3) return "text-green-600";
      if (value <= 6) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (value <= 3) return "text-red-600";
      if (value <= 6) return "text-yellow-600";
      return "text-green-600";
    }
  };

  const getFeedbackLabel = (value: number, labels: string[]) => {
    if (value <= 3) return labels[0];
    if (value <= 6) return labels[1];
    return labels[2];
  };

  const getRecommendation = () => {
    const { pumpQuality, muscleSoreness, perceivedEffort, energyLevel, sleepQuality } = feedback;
    const avgRecovery = (energyLevel + sleepQuality + (10 - muscleSoreness)) / 3;
    const avgPerformance = (pumpQuality + (10 - perceivedEffort)) / 2;

    if (avgRecovery >= 7 && avgPerformance >= 7) {
      return {
        type: "increase",
        message: "Great session! Your recovery and performance indicators suggest you can handle more volume.",
        icon: TrendingUp,
        color: "text-green-600",
      };
    } else if (avgRecovery <= 4 || avgPerformance <= 4) {
      return {
        type: "decrease",
        message: "Consider reducing volume or taking a deload. Your body shows signs of fatigue.",
        icon: AlertTriangle,
        color: "text-red-600",
      };
    } else {
      return {
        type: "maintain",
        message: "Maintain current volume. Your recovery and performance are balanced.",
        icon: Target,
        color: "text-blue-600",
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Post-Workout Auto-Regulation Feedback
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Help us optimize your training by providing feedback on how you felt during and after this workout.
            This data will be used to adjust your future training volume and intensity.
          </p>
        </CardHeader>
      </Card>

      {/* Pump Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pump Quality
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How good was the muscle pump during your workout?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pump Quality (1-10)</Label>
              <Badge variant="outline" className={getFeedbackColor(feedback.pumpQuality)}>
                {feedback.pumpQuality}/10 - {getFeedbackLabel(feedback.pumpQuality, ["Poor", "Moderate", "Excellent"])}
              </Badge>
            </div>
            <Slider
              value={[feedback.pumpQuality]}
              onValueChange={(value) => updateFeedback("pumpQuality", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Moderate</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muscle Soreness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Muscle Soreness
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How sore are your muscles from previous workouts?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Soreness Level (1-10)</Label>
              <Badge variant="outline" className={getFeedbackColor(feedback.muscleSoreness, true)}>
                {feedback.muscleSoreness}/10 - {getFeedbackLabel(feedback.muscleSoreness, ["None", "Moderate", "Very Sore"])}
              </Badge>
            </div>
            <Slider
              value={[feedback.muscleSoreness]}
              onValueChange={(value) => updateFeedback("muscleSoreness", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No Soreness</span>
              <span>Moderate</span>
              <span>Very Sore</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perceived Effort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Perceived Effort
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How hard did this workout feel overall?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Effort Level (1-10)</Label>
              <Badge variant="outline" className={getFeedbackColor(feedback.perceivedEffort, true)}>
                {feedback.perceivedEffort}/10 - {getFeedbackLabel(feedback.perceivedEffort, ["Easy", "Moderate", "Very Hard"])}
              </Badge>
            </div>
            <Slider
              value={[feedback.perceivedEffort]}
              onValueChange={(value) => updateFeedback("perceivedEffort", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Easy</span>
              <span>Moderate</span>
              <span>Maximum Effort</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Energy Level
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How was your energy level during the workout?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Energy Level (1-10)</Label>
              <Badge variant="outline" className={getFeedbackColor(feedback.energyLevel)}>
                {feedback.energyLevel}/10 - {getFeedbackLabel(feedback.energyLevel, ["Low", "Moderate", "High"])}
              </Badge>
            </div>
            <Slider
              value={[feedback.energyLevel]}
              onValueChange={(value) => updateFeedback("energyLevel", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Moderate</span>
              <span>Very High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sleep Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep Quality
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How was your sleep quality last night?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sleep Quality (1-10)</Label>
              <Badge variant="outline" className={getFeedbackColor(feedback.sleepQuality)}>
                {feedback.sleepQuality}/10 - {getFeedbackLabel(feedback.sleepQuality, ["Poor", "Moderate", "Excellent"])}
              </Badge>
            </div>
            <Slider
              value={[feedback.sleepQuality]}
              onValueChange={(value) => updateFeedback("sleepQuality", value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Poor</span>
              <span>Moderate</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <recommendation.icon className={`h-5 w-5 ${recommendation.color}`} />
            Training Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Badge 
              variant={recommendation.type === "increase" ? "default" : recommendation.type === "decrease" ? "destructive" : "secondary"}
              className="mt-1"
            >
              {recommendation.type === "increase" ? "Increase Volume" : 
               recommendation.type === "decrease" ? "Reduce Volume" : "Maintain Volume"}
            </Badge>
            <p className="text-sm leading-relaxed">
              {recommendation.message}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          onClick={() => submitFeedbackMutation.mutate(feedback)}
          disabled={submitFeedbackMutation.isPending}
          className="flex-1"
          size="lg"
        >
          {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}