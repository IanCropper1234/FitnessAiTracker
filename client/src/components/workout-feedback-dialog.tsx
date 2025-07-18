import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface WorkoutFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  userId: number;
  onSubmitComplete: () => void;
}

interface FeedbackData {
  pumpQuality: number;
  muscleSoreness: number;
  perceivedEffort: number;
  energyLevel: number;
  sleepQuality: number;
  notes: string;
}

export default function WorkoutFeedbackDialog({
  isOpen,
  onClose,
  sessionId,
  userId,
  onSubmitComplete
}: WorkoutFeedbackDialogProps) {
  const queryClient = useQueryClient();
  
  const [feedback, setFeedback] = useState<FeedbackData>({
    pumpQuality: 5,
    muscleSoreness: 5,
    perceivedEffort: 5,
    energyLevel: 5,
    sleepQuality: 5,
    notes: ""
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackData) => {
      const response = await apiRequest('POST', '/api/training/auto-regulation-feedback', {
        sessionId,
        userId,
        ...data
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/fatigue-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/volume-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycle-recommendations'] });
      onSubmitComplete();
      onClose();
    },
  });

  const handleSubmit = () => {
    submitFeedbackMutation.mutate(feedback);
  };

  const updateFeedback = (field: keyof FeedbackData, value: number | string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workout Feedback - Auto-Regulation</DialogTitle>
          <DialogDescription>
            Your feedback helps optimize future training volume and intensity based on Renaissance Periodization methodology.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pump Quality */}
          <div className="space-y-2">
            <Label>Pump Quality (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.pumpQuality]}
                onValueChange={(value) => updateFeedback('pumpQuality', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Poor (1)</span>
                <span className="font-medium">{feedback.pumpQuality}</span>
                <span>Excellent (10)</span>
              </div>
            </div>
          </div>

          {/* Muscle Soreness */}
          <div className="space-y-2">
            <Label>Muscle Soreness (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.muscleSoreness]}
                onValueChange={(value) => updateFeedback('muscleSoreness', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>No soreness (1)</span>
                <span className="font-medium">{feedback.muscleSoreness}</span>
                <span>Very sore (10)</span>
              </div>
            </div>
          </div>

          {/* Perceived Effort */}
          <div className="space-y-2">
            <Label>Perceived Effort (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.perceivedEffort]}
                onValueChange={(value) => updateFeedback('perceivedEffort', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Very easy (1)</span>
                <span className="font-medium">{feedback.perceivedEffort}</span>
                <span>Maximum effort (10)</span>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label>Energy Level (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.energyLevel]}
                onValueChange={(value) => updateFeedback('energyLevel', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Exhausted (1)</span>
                <span className="font-medium">{feedback.energyLevel}</span>
                <span>Full energy (10)</span>
              </div>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-2">
            <Label>Sleep Quality Last Night (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.sleepQuality]}
                onValueChange={(value) => updateFeedback('sleepQuality', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Poor sleep (1)</span>
                <span className="font-medium">{feedback.sleepQuality}</span>
                <span>Perfect sleep (10)</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional feedback about the workout, how you're feeling, or factors affecting your training..."
              value={feedback.notes}
              onChange={(e) => updateFeedback('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Skip Feedback
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
            >
              {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}