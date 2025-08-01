import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FeedbackData {
  sessionId: number;
  pumpQuality: number;
  muscleSoreness: number;
  perceivedEffort: number;
  energyLevel: number;
  sleepQuality: number;
  notes: string;
}

export default function WorkoutFeedbackPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/workout-feedback/:sessionId');
  const queryClient = useQueryClient();
  
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;
  
  const [feedback, setFeedback] = useState<FeedbackData>({
    sessionId: sessionId || 0,
    pumpQuality: 7,
    muscleSoreness: 5,
    perceivedEffort: 7,
    energyLevel: 7,
    sleepQuality: 7,
    notes: ''
  });

  useEffect(() => {
    if (sessionId) {
      setFeedback(prev => ({ ...prev, sessionId }));
    }
  }, [sessionId]);

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackData) =>
      apiRequest('/api/auto-regulation/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/fatigue-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/volume-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycle-recommendations'] });
      setLocation('/training');
    },
  });

  const handleSubmit = () => {
    if (sessionId) {
      submitFeedbackMutation.mutate(feedback);
    }
  };

  const handleSkip = () => {
    setLocation('/training');
  };

  const updateFeedback = (field: keyof FeedbackData, value: number | string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  if (!match || !sessionId) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">Invalid session ID</p>
            <Button onClick={() => setLocation('/training')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Training
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleSkip}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Workout Complete!</h1>
          <p className="text-muted-foreground">Share your feedback to optimize future training</p>
        </div>
        <CheckCircle2 className="h-8 w-8 text-green-500 ml-auto" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Regulation Feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your feedback helps optimize future training volume and intensity based on Renaissance Periodization methodology.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pump Quality */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Pump Quality (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.pumpQuality]}
                onValueChange={(value) => updateFeedback('pumpQuality', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Poor (1)</span>
                <span className="font-medium text-foreground">{feedback.pumpQuality}</span>
                <span>Excellent (10)</span>
              </div>
            </div>
          </div>

          {/* Muscle Soreness */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Muscle Soreness (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.muscleSoreness]}
                onValueChange={(value) => updateFeedback('muscleSoreness', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>No soreness (1)</span>
                <span className="font-medium text-foreground">{feedback.muscleSoreness}</span>
                <span>Very sore (10)</span>
              </div>
            </div>
          </div>

          {/* Perceived Effort */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Perceived Effort (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.perceivedEffort]}
                onValueChange={(value) => updateFeedback('perceivedEffort', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Very easy (1)</span>
                <span className="font-medium text-foreground">{feedback.perceivedEffort}</span>
                <span>Maximum effort (10)</span>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Energy Level (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.energyLevel]}
                onValueChange={(value) => updateFeedback('energyLevel', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Exhausted (1)</span>
                <span className="font-medium text-foreground">{feedback.energyLevel}</span>
                <span>Full energy (10)</span>
              </div>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Sleep Quality Last Night (1-10)</Label>
            <div className="px-3">
              <Slider
                value={[feedback.sleepQuality]}
                onValueChange={(value) => updateFeedback('sleepQuality', value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Poor sleep (1)</span>
                <span className="font-medium text-foreground">{feedback.sleepQuality}</span>
                <span>Perfect sleep (10)</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional feedback about the workout, how you're feeling, or factors affecting your training..."
              value={feedback.notes}
              onChange={(e) => updateFeedback('notes', e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Feedback
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
              className="flex-1"
            >
              {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}