import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading';
import { Sparkles, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppInitialLoadingProps {
  className?: string;
}

export function AppInitialLoading({ className }: AppInitialLoadingProps) {
  const [loadingText, setLoadingText] = useState('Starting FitAI...');
  const [progress, setProgress] = useState(0);

  // Simulate loading progress and change loading text
  useEffect(() => {
    const loadingSteps = [
      { text: 'Starting FitAI...', duration: 800 },
      { text: 'Connecting to servers...', duration: 600 },
      { text: 'Loading your data...', duration: 600 },
      { text: 'Almost ready...', duration: 400 }
    ];

    let currentStep = 0;
    let totalDuration = 0;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, 40);

    const updateText = () => {
      if (currentStep < loadingSteps.length) {
        setLoadingText(loadingSteps[currentStep].text);
        totalDuration += loadingSteps[currentStep].duration;
        
        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            updateText();
          }
        }, loadingSteps[currentStep].duration);
      }
    };

    updateText();

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: 0.2
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay: 0.4
      }
    }
  };

  const floatingElements = [
    { icon: Sparkles, delay: 0.3, x: '20%', y: '20%' },
    { icon: Zap, delay: 0.6, x: '80%', y: '30%' },
    { icon: Activity, delay: 0.9, x: '15%', y: '70%' },
  ];

  return (
    <motion.div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'flex items-center justify-center overflow-hidden relative',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10" />
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => {
          const IconComponent = element.icon;
          return (
            <motion.div
              key={index}
              className="absolute text-primary/20 dark:text-primary/10"
              style={{
                left: element.x,
                top: element.y,
              }}
              initial={{ 
                opacity: 0, 
                scale: 0.5,
                rotate: -45
              }}
              animate={{
                opacity: [0, 0.6, 0.3],
                scale: [0.5, 1, 0.8],
                rotate: [0, 360, 180],
                y: [0, -20, 0],
                transition: {
                  duration: 3 + index,
                  delay: element.delay,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            >
              <IconComponent className="w-8 h-8" />
            </motion.div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 px-6 max-w-sm mx-auto">
        {/* App logo */}
        <motion.div
          variants={logoVariants}
          className="space-y-4"
        >
          <div className="text-5xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            FitAI
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-blue-600 mx-auto" />
        </motion.div>

        {/* Loading content */}
        <motion.div
          variants={textVariants}
          className="space-y-6"
        >
          {/* Loading spinner */}
          <div className="flex justify-center">
            <LoadingSpinner size="lg" className="text-primary" />
          </div>

          {/* Loading text */}
          <motion.div
            key={loadingText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.3 }
            }}
            className="space-y-2"
          >
            <p className="text-lg font-medium text-foreground">
              {loadingText}
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait a moment...
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto space-y-2">
            <div className="w-full h-1.5 bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-blue-600"
                initial={{ width: '0%' }}
                animate={{ 
                  width: `${progress}%`,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(progress)}%
            </p>
          </div>
        </motion.div>

        {/* Subtle pulsing dot indicator */}
        <motion.div
          className="flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { delay: 0.8 }
          }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-primary/40 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4],
                transition: {
                  duration: 1.5,
                  delay: index * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}