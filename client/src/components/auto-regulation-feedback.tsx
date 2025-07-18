import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Moon, TrendingUp, Heart } from "lucide-react";

const feedbackSchema = z.object({
  pumpQuality: z.number().min(1).max(10),
  muscleSoreness: z.number().min(1).max(10), 
  perceivedEffort: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  sleepQuality: z.number().min(1).max(10),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

interface AutoRegulationFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  onFeedbackSubmitted: () => void;
}

export function AutoRegulationFeedback({ 
  isOpen, 
  onClose, 
  sessionId, 
  onFeedbackSubmitted 
}: AutoRegulationFeedbackProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      pumpQuality: 5,
      muscleSoreness: 5,
      perceivedEffort: 5,
      energyLevel: 5,
      sleepQuality: 5,
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      return apiRequest(`/api/training/sessions/${sessionId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Your training feedback has been recorded and will help optimize future workouts.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
      onFeedbackSubmitted();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    setIsSubmitting(true);
    await submitFeedbackMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  const getScaleLabel = (value: number, type: 'pump' | 'soreness' | 'effort' | 'energy' | 'sleep') => {
    const labels = {
      pump: {
        1: "No pump",
        3: "Slight pump", 
        5: "Good pump",
        7: "Strong pump",
        10: "Incredible pump"
      },
      soreness: {
        1: "No soreness",
        3: "Mild soreness",
        5: "Moderate soreness", 
        7: "Significant soreness",
        10: "Extreme soreness"
      },
      effort: {
        1: "Very easy",
        3: "Easy",
        5: "Moderate effort",
        7: "Hard",
        10: "Maximum effort"
      },
      energy: {
        1: "Exhausted",
        3: "Low energy",
        5: "Normal energy",
        7: "High energy", 
        10: "Maximum energy"
      },
      sleep: {
        1: "Very poor",
        3: "Poor",
        5: "Average",
        7: "Good",
        10: "Excellent"
      }
    };

    const scale = labels[type];
    const closest = Object.keys(scale)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
      );
    
    return scale[closest as keyof typeof scale];
  };

  const getScaleColor = (value: number, type: 'pump' | 'soreness' | 'effort' | 'energy' | 'sleep') => {
    if (type === 'soreness') {
      // For soreness, lower is better
      if (value <= 3) return "text-green-600";
      if (value <= 6) return "text-yellow-600";
      return "text-red-600";
    } else {
      // For others, higher is generally better
      if (value <= 3) return "text-red-600";
      if (value <= 6) return "text-yellow-600";
      return "text-green-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Post-Workout Auto-Regulation Feedback
          </DialogTitle>
          <DialogDescription>
            This feedback helps optimize your training volume and intensity for maximum results.
            Rate each parameter based on your experience during today's workout.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Pump Quality */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pump Quality
                </CardTitle>
                <CardDescription>
                  How much muscle pump did you feel during your workout?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="pumpQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{field.value}/10</Badge>
                            <span className={`text-sm font-medium ${getScaleColor(field.value, 'pump')}`}>
                              {getScaleLabel(field.value, 'pump')}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Muscle Soreness */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Muscle Soreness/DOMS
                </CardTitle>
                <CardDescription>
                  How sore do you expect to be tomorrow? (Based on current feeling)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="muscleSoreness"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{field.value}/10</Badge>
                            <span className={`text-sm font-medium ${getScaleColor(field.value, 'soreness')}`}>
                              {getScaleLabel(field.value, 'soreness')}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Perceived Effort */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Perceived Effort
                </CardTitle>
                <CardDescription>
                  How hard did this workout feel overall?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="perceivedEffort"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{field.value}/10</Badge>
                            <span className={`text-sm font-medium ${getScaleColor(field.value, 'effort')}`}>
                              {getScaleLabel(field.value, 'effort')}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Energy Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Energy Level
                </CardTitle>
                <CardDescription>
                  How was your energy level during the workout?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="energyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{field.value}/10</Badge>
                            <span className={`text-sm font-medium ${getScaleColor(field.value, 'energy')}`}>
                              {getScaleLabel(field.value, 'energy')}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Sleep Quality */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Sleep Quality (Last Night)
                </CardTitle>
                <CardDescription>
                  How well did you sleep before today's workout?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="sleepQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{field.value}/10</Badge>
                            <span className={`text-sm font-medium ${getScaleColor(field.value, 'sleep')}`}>
                              {getScaleLabel(field.value, 'sleep')}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Skip Feedback
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}