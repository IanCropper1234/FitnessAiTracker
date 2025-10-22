import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface PWAInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'ios' | 'android' | 'desktop';
  installStatus: string;
  onInstall?: () => void;
}

export function PWAInstallGuide({ 
  isOpen, 
  onClose, 
  platform, 
  installStatus,
  onInstall 
}: PWAInstallGuideProps) {
  
  // iOS Installation Guide
  const IOSGuideContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <h3 className="text-lg font-semibold mb-2">Install MyTrainPro</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Add MyTrainPro to your home screen for quick access
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full font-bold">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">Tap the Share button</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Share className="h-5 w-5" />
              <span>Located at the bottom of Safari</span>
            </div>
          </div>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full font-bold">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">Select "Add to Home Screen"</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Plus className="h-5 w-5" />
              <span>Scroll down to find this option</span>
            </div>
          </div>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-full font-bold">
            3
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">Tap "Add"</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>Confirm to add MyTrainPro to your home screen</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onClose} variant="outline" className="w-full">
          Got it!
        </Button>
      </div>
    </div>
  );

  // Android Installation Progress
  const AndroidInstallProgress = () => {
    const [progress, setProgress] = React.useState(0);
    const [step, setStep] = React.useState('Checking compatibility...');

    React.useEffect(() => {
      if (installStatus === 'installing') {
        const steps = [
          { progress: 30, message: 'Checking compatibility...', duration: 600 },
          { progress: 60, message: 'Preparing installation...', duration: 500 },
          { progress: 90, message: 'Ready to install!', duration: 400 }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
          if (currentStep < steps.length) {
            const currentStepData = steps[currentStep];
            setProgress(currentStepData.progress);
            setStep(currentStepData.message);
            currentStep++;
          } else {
            clearInterval(interval);
            setProgress(100);
            onInstall?.();
          }
        }, 700);

        return () => clearInterval(interval);
      }
    }, [installStatus]);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">{step}</h3>
          <Progress value={progress} className="mt-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {progress}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {platform === 'ios' ? 'Install on iOS' : 'Installing MyTrainPro'}
          </DialogTitle>
          <DialogDescription>
            {platform === 'ios' 
              ? 'Follow these simple steps to install MyTrainPro on your iPhone or iPad'
              : 'Setting up MyTrainPro as a Progressive Web App'
            }
          </DialogDescription>
        </DialogHeader>

        {platform === 'ios' ? <IOSGuideContent /> : <AndroidInstallProgress />}
      </DialogContent>
    </Dialog>
  );
}

// Missing React import for hooks
import * as React from 'react';
