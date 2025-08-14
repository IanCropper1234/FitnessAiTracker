import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

interface AppInitialLoadingProps {
  className?: string;
}

export function AppInitialLoading({ className }: AppInitialLoadingProps) {
  return (
    <motion.div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'flex items-center justify-center',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Simple centered content */}
      <div className="text-center space-y-6 px-6 max-w-sm mx-auto">
        {/* Simple app logo with subtle animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: { duration: 0.4, ease: 'easeOut' }
          }}
          className="space-y-3"
        >
          <div className="text-4xl font-bold text-foreground">
            TrainPro
          </div>
          <div className="w-12 h-0.5 bg-primary mx-auto" />
        </motion.div>

        {/* Simple loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { delay: 0.2, duration: 0.4 }
          }}
          className="space-y-4"
        >
          <LoadingSpinner size="md" className="text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}