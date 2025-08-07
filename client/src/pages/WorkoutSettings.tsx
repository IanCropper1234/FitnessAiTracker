import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Activity } from 'lucide-react';
import { useFeature, updateFeatureFlag } from '@/hooks/useFeature';
import { useToast } from '@/hooks/use-toast';

export default function WorkoutSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current feature flags
  const autoRegulationFeedback = useFeature('autoRegulationFeedback');
  const gestureNavigation = useFeature('gestureNavigation');
  const circularProgress = useFeature('circularProgress');
  const restTimerFAB = useFeature('restTimerFAB');

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    updateFeatureFlag(featureName as any, enabled);
    
    const featureDisplayNames: Record<string, string> = {
      autoRegulationFeedback: 'Auto-Regulation Feedback',
      gestureNavigation: 'Gesture Navigation', 
      circularProgress: 'Circular Progress',
      restTimerFAB: 'Rest Timer FAB'
    };
    
    toast({
      title: enabled ? "Feature Enabled" : "Feature Disabled",
      description: `${featureDisplayNames[featureName]} has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/training')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Workout Settings
          </h1>
          <p className="text-muted-foreground">Customize your workout experience</p>
        </div>
      </div>

      {/* Auto-Regulation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Renaissance Periodization (RP) Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-800/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="autoRegulationFeedback" className="font-medium text-foreground">
                  Auto-Regulation Feedback
                </Label>
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs">
                  RP Method
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Collect RPE (Rate of Perceived Exertion) feedback during workouts. This helps optimize future training volume and intensity based on Renaissance Periodization methodology.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                • Triggers after the last set of each exercise
                • Data is integrated with post-workout feedback
                • Used for intelligent training adjustments
              </div>
            </div>
            <Switch
              id="autoRegulationFeedback"
              checked={autoRegulationFeedback}
              onCheckedChange={(checked) => handleFeatureToggle('autoRegulationFeedback', checked)}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interface Enhancements */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Enhancements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border">
            <div>
              <Label htmlFor="gestureNavigation" className="font-medium text-foreground">
                Gesture Navigation
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable swipe gestures to navigate between exercises during workouts
              </p>
            </div>
            <Switch
              id="gestureNavigation"
              checked={gestureNavigation}
              onCheckedChange={(checked) => handleFeatureToggle('gestureNavigation', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-border">
            <div>
              <Label htmlFor="circularProgress" className="font-medium text-foreground">
                Circular Progress Indicators
              </Label>
              <p className="text-sm text-muted-foreground">
                Show circular progress rings instead of linear progress bars
              </p>
            </div>
            <Switch
              id="circularProgress"
              checked={circularProgress}
              onCheckedChange={(checked) => handleFeatureToggle('circularProgress', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-border">
            <div>
              <Label htmlFor="restTimerFAB" className="font-medium text-foreground">
                Floating Rest Timer
              </Label>
              <p className="text-sm text-muted-foreground">
                Show rest timer as floating action button with pulse animations
              </p>
            </div>
            <Switch
              id="restTimerFAB"
              checked={restTimerFAB}
              onCheckedChange={(checked) => handleFeatureToggle('restTimerFAB', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">About Auto-Regulation Feedback</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The Renaissance Periodization auto-regulation system uses your RPE feedback to intelligently adjust training volume and intensity. When enabled, you'll be prompted to rate your perceived exertion after completing each exercise during your workout.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This data is then combined with your post-workout wellness feedback to provide comprehensive training recommendations following RP methodology.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}