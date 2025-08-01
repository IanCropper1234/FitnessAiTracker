import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer2, 
  Timer, 
  RotateCcw, 
  TrendingUp, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useFeature } from '@/hooks/useFeature';

interface FeatureShowcaseProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  isVisible,
  onClose,
}) => {
  // Check which features are enabled
  const workoutExecutionV2 = useFeature('workoutExecutionV2');
  const spinnerSetInput = useFeature('spinnerSetInput');
  const gestureNavigation = useFeature('gestureNavigation');
  const circularProgress = useFeature('circularProgress');
  const restTimerFAB = useFeature('restTimerFAB');

  const features = [
    {
      id: 'workoutExecutionV2',
      enabled: workoutExecutionV2,
      icon: <Smartphone className="h-5 w-5" />,
      title: 'Enhanced Workout UI',
      description: 'Mobile-optimized interface with improved navigation and visual feedback',
      status: 'Core Enhancement'
    },
    {
      id: 'spinnerSetInput',
      enabled: spinnerSetInput,
      icon: <RotateCcw className="h-5 w-5" />,
      title: 'Spinner Set Input',
      description: 'Touch-friendly spinners for weight, reps, and RPE with haptic feedback',
      status: 'Input Enhancement'
    },
    {
      id: 'gestureNavigation',
      enabled: gestureNavigation,
      icon: <MousePointer2 className="h-5 w-5" />,
      title: 'Gesture Navigation',
      description: 'Swipe left/right to navigate between exercises quickly',
      status: 'Navigation'
    },
    {
      id: 'circularProgress',
      enabled: circularProgress,
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Circular Progress',
      description: 'Visual progress indicators with completion percentages',
      status: 'Visual Enhancement'
    },
    {
      id: 'restTimerFAB',
      enabled: restTimerFAB,
      icon: <Timer className="h-5 w-5" />,
      title: 'Floating Rest Timer',
      description: 'Draggable floating timer that activates automatically after completing sets',
      status: 'Timer Enhancement'
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Enhanced Workout Features
            </CardTitle>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 ">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Testing Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Enable features using the "V2 Features" toggle in Training Dashboard</li>
              <li>• Start a workout session to test the enhanced interface</li>
              <li>• Try swiping left/right when gesture navigation is enabled</li>
              <li>• Complete a set to activate the floating rest timer</li>
              <li>• Use spinner inputs for precise weight/rep adjustments</li>
            </ul>
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`p-4  border ${
                  feature.enabled 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2  ${
                    feature.enabled 
                      ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {feature.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{feature.title}</h4>
                      <Badge 
                        variant={feature.enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {feature.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 ">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Feature Status Summary
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                ✓ {features.filter(f => f.enabled).length} Enabled
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                ○ {features.filter(f => !f.enabled).length} Disabled
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};