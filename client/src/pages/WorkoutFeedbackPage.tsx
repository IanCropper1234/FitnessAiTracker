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
  
  console.log('WorkoutFeedbackPage - match:', match, 'params:', params);
  
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

  // Load exercise-level RPE data collected during workout
  const [exerciseRpeData, setExerciseRpeData] = useState<Array<{
    exerciseId: number;
    exerciseName: string;
    set: number;
    rpe: number;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    if (sessionId) {
      setFeedback(prev => ({ ...prev, sessionId }));
      
      // Load RPE data collected during workout
      const rpeDataKey = `workout-${sessionId}-rpe-data`;
      const storedRpeData = sessionStorage.getItem(rpeDataKey);
      if (storedRpeData) {
        try {
          const parsedData = JSON.parse(storedRpeData);
          setExerciseRpeData(parsedData);
          
          // Calculate average RPE for perceived effort initial value
          if (parsedData.length > 0) {
            const avgRpe = parsedData.reduce((sum: number, item: any) => sum + item.rpe, 0) / parsedData.length;
            setFeedback(prev => ({ ...prev, perceivedEffort: Math.round(avgRpe) }));
          }
        } catch (error) {
          console.error('Error parsing stored RPE data:', error);
        }
      }
    }
  }, [sessionId]);

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackData) =>
      apiRequest('POST', '/api/auto-regulation/feedback', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/fatigue-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/volume-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycle-recommendations'] });
      // Invalidate feedback status queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/training/feedback-status'] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/training/feedback-status'
      });
      
      // Show success notification and navigate back
      setTimeout(() => {
        setLocation('/training?feedbackSubmitted=true');
      }, 100);
    },
  });

  const handleSubmit = () => {
    if (sessionId) {
      // Submit main feedback
      submitFeedbackMutation.mutate(feedback);
      
      // Clean up stored RPE data after successful submission
      const rpeDataKey = `workout-${sessionId}-rpe-data`;
      sessionStorage.removeItem(rpeDataKey);
    }
  };

  const handleSkip = () => {
    setLocation('/training');
  };

  const updateFeedback = (field: keyof FeedbackData, value: number | string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  if (!match || !sessionId) {
    console.log('WorkoutFeedbackPage - Route not matched or invalid sessionId:', { match, sessionId, params });
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">Invalid session ID (match: {String(match)}, sessionId: {sessionId})</p>
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
            Your feedback helps optimize future training volume and intensity based on evidence-based methodology.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise RPE Summary - Only show if we have data */}
          {exerciseRpeData.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Exercise RPE Summary</Label>
              <div className="bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">RPE data collected during your workout:</p>
                <div className="grid gap-2">
                  {exerciseRpeData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.exerciseName}</span>
                      <span className="text-muted-foreground">Set {item.set}</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary font-medium">
                        RPE {item.rpe}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  Average RPE: {exerciseRpeData.length > 0 ? 
                    (exerciseRpeData.reduce((sum, item) => sum + item.rpe, 0) / exerciseRpeData.length).toFixed(1) : 
                    'N/A'
                  } (pre-filled in Perceived Effort below)
                </div>
              </div>
            </div>
          )}
          
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