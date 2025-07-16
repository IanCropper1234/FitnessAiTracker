import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/components/language-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    pumpQuality: 5,
    muscleSoreness: 5,
    perceivedEffort: 5,
    energyLevel: 5,
    sleepQuality: 5,
  });

  const submitFeedback = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/training/feedback", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
      toast({
        title: t("feedback.submitted"),
        description: t("feedback.adjustments_calculated"),
      });
      onComplete?.();
    },
    onError: (error) => {
      toast({
        title: t("error.failed_submit"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    submitFeedback.mutate({
      sessionId,
      userId,
      ...feedback,
    });
  };

  const feedbackItems = [
    {
      key: "pumpQuality",
      label: t("feedback.pump_quality"),
      description: t("feedback.pump_description"),
      color: "hsl(207, 90%, 54%)",
    },
    {
      key: "muscleSoreness",
      label: t("feedback.muscle_soreness"),
      description: t("feedback.soreness_description"),
      color: "hsl(142, 76%, 36%)",
    },
    {
      key: "perceivedEffort",
      label: t("feedback.perceived_effort"),
      description: t("feedback.effort_description"),
      color: "hsl(45, 93%, 47%)",
    },
    {
      key: "energyLevel",
      label: t("feedback.energy_level"),
      description: t("feedback.energy_description"),
      color: "hsl(280, 100%, 60%)",
    },
    {
      key: "sleepQuality",
      label: t("feedback.sleep_quality"),
      description: t("feedback.sleep_description"),
      color: "hsl(160, 100%, 40%)",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t("feedback.post_workout_feedback")}
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {t("feedback.help_optimize")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {feedbackItems.map((item) => (
          <div key={item.key} className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-foreground">{item.label}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-foreground">
                  {feedback[item.key as keyof typeof feedback]}
                </span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
            
            <Slider
              value={[feedback[item.key as keyof typeof feedback]]}
              onValueChange={(value) => 
                setFeedback(prev => ({ ...prev, [item.key]: value[0] }))
              }
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 - {t("feedback.very_low")}</span>
              <span>10 - {t("feedback.very_high")}</span>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={submitFeedback.isPending}
            className="w-full"
          >
            {submitFeedback.isPending ? t("common.submitting") : t("feedback.submit_feedback")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
