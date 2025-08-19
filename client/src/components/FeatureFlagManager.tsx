import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle } from 'lucide-react';
import { useWorkoutSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

interface FeatureFlagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureFlagManager: React.FC<FeatureFlagManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, updateSettings] = useWorkoutSettings();
  const { toast } = useToast();
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  if (!isOpen) return null;

  const handleFeatureToggle = (featureName: keyof typeof settings, enabled: boolean) => {
    updateSettings({ [featureName]: enabled });
    toast({
      title: enabled ? "Feature Enabled" : "Feature Disabled",
      description: `${featureName} has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const resetToDefaults = () => {
    updateSettings({
      workoutExecutionV2: true,
      spinnerSetInput: true,
      gestureNavigation: true,
      circularProgress: true,
      restTimerFAB: true,
      workoutSummary: true,
      autoRegulationFeedback: false
    });
    toast({
      title: "Features Reset",
      description: "All features have been reset to defaults",
    });
  };

  const enableAllV2Features = () => {
    updateSettings({
      workoutExecutionV2: true,
      spinnerSetInput: true,
      gestureNavigation: true,
      circularProgress: true,
      restTimerFAB: true,
      workoutSummary: true
    });
    // Note: autoRegulationFeedback is kept separate as it's optional scientific methodology
    
    toast({
      title: "V2 Features Enabled",
      description: "All V2 workout execution features are now active",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Flag Manager
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Development Tool
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200  p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-700">Development Only</span>
            </div>
            <p className="text-sm text-yellow-600">
              These settings are for testing and development. Changes will reset when you refresh the page.
            </p>
          </div>

          {/* Core Features */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Core Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="workoutExecutionV2" className="font-medium">
                    Workout Execution V2
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable enhanced workout execution with new UI components
                  </p>
                </div>
                <Switch
                  id="workoutExecutionV2"
                  checked={settings.workoutExecutionV2}
                  onCheckedChange={(checked) => handleFeatureToggle('workoutExecutionV2', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="spinnerSetInput" className="font-medium">
                    Spinner Set Input
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Replace input fields with spinner controls (±) for weights and reps
                  </p>
                </div>
                <Switch
                  id="spinnerSetInput"
                  checked={settings.spinnerSetInput}
                  onCheckedChange={(checked) => handleFeatureToggle('spinnerSetInput', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="gestureNavigation" className="font-medium">
                    Gesture Navigation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable swipe gestures to navigate between exercises
                  </p>
                </div>
                <Switch
                  id="gestureNavigation"
                  checked={settings.gestureNavigation}
                  onCheckedChange={(checked) => handleFeatureToggle('gestureNavigation', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="circularProgress" className="font-medium">
                    Circular Progress
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show circular progress indicators instead of linear progress bars
                  </p>
                </div>
                <Switch
                  id="circularProgress"
                  checked={settings.circularProgress}
                  onCheckedChange={(checked) => handleFeatureToggle('circularProgress', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="restTimerFAB" className="font-medium">
                    Rest Timer FAB
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show floating action button for rest timer instead of card
                  </p>
                </div>
                <Switch
                  id="restTimerFAB"
                  checked={settings.restTimerFAB}
                  onCheckedChange={(checked) => handleFeatureToggle('restTimerFAB', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border ">
                <div>
                  <Label htmlFor="workoutSummary" className="font-medium">
                    Workout Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show enhanced completion summary with PR confetti
                  </p>
                </div>
                <Switch
                  id="workoutSummary"
                  checked={settings.workoutSummary}
                  onCheckedChange={(checked) => handleFeatureToggle('workoutSummary', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border  bg-blue-50/50">
                <div>
                  <Label htmlFor="autoRegulationFeedback" className="font-medium">
                    Auto-Regulation Feedback
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700">
                      RP Method
                    </Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Collect RPE feedback during workout (last set of each exercise)
                  </p>
                </div>
                <Switch
                  id="autoRegulationFeedback"
                  checked={settings.autoRegulationFeedback}
                  onCheckedChange={(checked) => handleFeatureToggle('autoRegulationFeedback', checked)}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Quick Actions</h3>
            
            <div className="flex gap-2">
              <Button 
                onClick={enableAllV2Features}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Enable All V2
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                className="flex-1"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* Developer Info */}
          {isDeveloperMode && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Developer Info</h3>
              <pre className="text-xs bg-muted p-3  overflow-x-auto">
                {JSON.stringify(getFeatureFlags(), null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setIsDeveloperMode(!isDeveloperMode)}
              className="text-xs"
            >
              {isDeveloperMode ? 'Hide' : 'Show'} Debug Info
            </Button>
            
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};