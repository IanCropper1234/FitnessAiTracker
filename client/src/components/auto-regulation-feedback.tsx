import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Brain, Zap, Bed, Target, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AutoRegulationFeedbackProps {
  sessionId: number;
  userId: number;
  onComplete?: () => void;
}

export function AutoRegulationFeedback({ sessionId, userId, onComplete }: AutoRegulationFeedbackProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [feedback, setFeedback] = useState({
    pumpQuality: [7],
    muscleSoreness: [3],
    perceivedEffort: [7],
    energyLevel: [7],
    sleepQuality: [7],
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      return apiRequest("/api/training/auto-regulation", {
        method: "POST",
        body: JSON.stringify(feedbackData),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Feedback Submitted!",
        description: "Your training will be adjusted based on this feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats", userId] });
      onComplete?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const feedbackData = {
      sessionId,
      userId,
      pumpQuality: feedback.pumpQuality[0],
      muscleSoreness: feedback.muscleSoreness[0],
      perceivedEffort: feedback.perceivedEffort[0],
      energyLevel: feedback.energyLevel[0],
      sleepQuality: feedback.sleepQuality[0],
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  const updateFeedback = (key: string, value: number[]) => {
    setFeedback(prev => ({ ...prev, [key]: value }));
  };

  const getScaleDescription = (value: number, type: string) => {
    switch (type) {
      case 'pump':
        if (value <= 3) return "Poor pump";
        if (value <= 6) return "Moderate pump";
        if (value <= 8) return "Good pump";
        return "Incredible pump";
      case 'soreness':
        if (value <= 2) return "No soreness";
        if (value <= 4) return "Mild soreness";
        if (value <= 7) return "Moderate soreness";
        return "Very sore";
      case 'effort':
        if (value <= 3) return "Very easy";
        if (value <= 6) return "Moderate effort";
        if (value <= 8) return "Hard effort";
        return "Maximum effort";
      case 'energy':
        if (value <= 3) return "Very low energy";
        if (value <= 6) return "Moderate energy";
        if (value <= 8) return "High energy";
        return "Peak energy";
      case 'sleep':
        if (value <= 3) return "Poor sleep";
        if (value <= 6) return "Average sleep";
        if (value <= 8) return "Good sleep";
        return "Excellent sleep";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-black dark:text-white">
            Auto-Regulation Feedback
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Help us adjust your next workout based on how you're feeling
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pump Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <Label className="text-black dark:text-white">Pump Quality</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={feedback.pumpQuality}
                onValueChange={(value) => updateFeedback('pumpQuality', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>1 - Poor</span>
                <span className="font-medium">{feedback.pumpQuality[0]} - {getScaleDescription(feedback.pumpQuality[0], 'pump')}</span>
                <span>10 - Amazing</span>
              </div>
            </div>
          </div>

          {/* Muscle Soreness */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <Label className="text-black dark:text-white">Muscle Soreness</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={feedback.muscleSoreness}
                onValueChange={(value) => updateFeedback('muscleSoreness', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>1 - None</span>
                <span className="font-medium">{feedback.muscleSoreness[0]} - {getScaleDescription(feedback.muscleSoreness[0], 'soreness')}</span>
                <span>10 - Very sore</span>
              </div>
            </div>
          </div>

          {/* Perceived Effort */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <Label className="text-black dark:text-white">Perceived Effort</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={feedback.perceivedEffort}
                onValueChange={(value) => updateFeedback('perceivedEffort', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>1 - Very easy</span>
                <span className="font-medium">{feedback.perceivedEffort[0]} - {getScaleDescription(feedback.perceivedEffort[0], 'effort')}</span>
                <span>10 - Max effort</span>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-500" />
              <Label className="text-black dark:text-white">Energy Level</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={feedback.energyLevel}
                onValueChange={(value) => updateFeedback('energyLevel', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>1 - Very low</span>
                <span className="font-medium">{feedback.energyLevel[0]} - {getScaleDescription(feedback.energyLevel[0], 'energy')}</span>
                <span>10 - Peak energy</span>
              </div>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-purple-500" />
              <Label className="text-black dark:text-white">Sleep Quality (last night)</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={feedback.sleepQuality}
                onValueChange={(value) => updateFeedback('sleepQuality', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>1 - Poor</span>
                <span className="font-medium">{feedback.sleepQuality[0]} - {getScaleDescription(feedback.sleepQuality[0], 'sleep')}</span>
                <span>10 - Excellent</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onComplete}
              className="flex-1 border-gray-300 dark:border-gray-600"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black"
            >
              {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}