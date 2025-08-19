import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading';
import { Sparkles, Dumbbell, Apple, BarChart3, Target, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirstTimeUserLoadingProps {
  onComplete: () => void;
  className?: string;
}

interface LoadingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  duration: number;
}

const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TrainPro',
    subtitle: 'Your AI-powered fitness journey begins',
    icon: Sparkles,
    duration: 2000
  },
  {
    id: 'training',
    title: 'Preparing Training System',
    subtitle: 'Loading Evidence-based methodology methods',
    icon: Dumbbell,
    duration: 1500
  },
  {
    id: 'nutrition',
    title: 'Setting Up Nutrition AI',
    subtitle: 'Initializing smart meal planning',
    icon: Apple,
    duration: 1500
  },
  {
    id: 'analytics',
    title: 'Calibrating Analytics',
    subtitle: 'Preparing progress tracking tools',
    icon: BarChart3,
    duration: 1500
  },
  {
    id: 'goals',
    title: 'Activating Goal Engine',
    subtitle: 'Ready to transform your fitness',
    icon: Target,
    duration: 1500
  }
];

export function FirstTimeUserLoading({ onComplete, className }: FirstTimeUserLoadingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const currentStep = LOADING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === LOADING_STEPS.length - 1;

  // Simulate progress within each step
  useEffect(() => {
    if (isCompleting) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const increment = 100 / (currentStep.duration / 50); // Update every 50ms
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [currentStepIndex, currentStep.duration, isCompleting]);

  // Handle step transitions
  useEffect(() => {
    if (isCompleting) return;

    const timer = setTimeout(() => {
      if (isLastStep) {
        setIsCompleting(true);
        // Complete after a short delay to show the final step
        setTimeout(() => {
          onComplete();
        }, 1000);
      } else {
        setCurrentStepIndex(prev => prev + 1);
        setLoadingProgress(0); // Reset progress for next step
      }
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, currentStep.duration, isLastStep, onComplete, isCompleting]);

  // Total progress across all steps
  const totalProgress = Math.round(
    ((currentStepIndex * 100) + loadingProgress) / LOADING_STEPS.length
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.5, ease: 'easeIn' }
    }
  };

  const stepVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: 'easeOut',
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 1.1,
      transition: { duration: 0.3 }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.3
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const progressVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: loadingProgress / 100,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const floatingElements = [
    { icon: Heart, delay: 0.5, duration: 3 },
    { icon: Zap, delay: 1.2, duration: 2.5 },
    { icon: Sparkles, delay: 2.1, duration: 4 },
  ];

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-accent/20',
        'flex items-center justify-center overflow-hidden',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => {
          const IconComponent = element.icon;
          return (
            <motion.div
              key={index}
              className="absolute text-primary/10 dark:text-primary/5"
              initial={{ 
                opacity: 0, 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                rotate: 0
              }}
              animate={{
                opacity: [0, 0.3, 0],
                y: [null, -100],
                rotate: 360,
                transition: {
                  duration: element.duration,
                  delay: element.delay,
                  repeat: Infinity,
                  ease: 'easeOut'
                }
              }}
            >
              <IconComponent className="w-12 h-12" />
            </motion.div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 px-6 max-w-md mx-auto">
        {/* App logo/brand */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: { 
              type: 'spring',
              stiffness: 150,
              damping: 12
            }
          }}
          className="text-6xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          TrainPro
        </motion.div>

        {/* Current step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {/* Step icon */}
            <motion.div 
              className="flex justify-center"
              variants={iconVariants}
              animate={isCompleting ? 'pulse' : 'visible'}
            >
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/5 flex items-center justify-center relative overflow-hidden">
                <currentStep.icon className="w-10 h-10 text-primary relative z-10" />
                
                {/* Icon background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </div>
            </motion.div>

            {/* Step content */}
            <div className="space-y-3">
              <motion.h2 
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.4 }
                }}
              >
                {currentStep.title}
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.5 }
                }}
              >
                {currentStep.subtitle}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: 0.6 }
          }}
        >
          {/* Step progress bar */}
          <div className="w-full h-2 bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-blue-600 transform origin-left"
              variants={progressVariants}
              animate="visible"
            />
          </div>
          
          {/* Overall progress bar */}
          <div className="w-full h-1 bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/60 to-blue-600/60 transform origin-left"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: totalProgress / 100,
                transition: { duration: 0.3, ease: 'easeOut' }
              }}
            />
          </div>

          {/* Progress text */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {LOADING_STEPS.length}</span>
            <span>{totalProgress}%</span>
          </div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { delay: 0.8 }
          }}
          className="flex justify-center"
        >
          <LoadingSpinner size="sm" className="text-primary" />
        </motion.div>

        {/* Welcome message for first step */}
        {currentStepIndex === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: 1.2 }
            }}
            className="text-center space-y-2 pt-4"
          >
            <p className="text-sm text-muted-foreground">
              Preparing your personalized fitness experience...
            </p>
          </motion.div>
        )}

        {/* Completion message */}
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                type: 'spring',
                stiffness: 200,
                damping: 15
              }
            }}
            className="text-center space-y-2 pt-4"
          >
            <p className="text-lg font-semibold text-primary">
              Ready to transform your fitness! 🚀
            </p>
            <p className="text-sm text-muted-foreground">
              Let's begin your journey...
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}