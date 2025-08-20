/**
 * Instant Loading Screen - Shows immediately on app start
 * Displays while all contexts and authentication initialize in background
 */

import React from 'react';
import { motion } from 'framer-motion';

export function InstantLoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-center space-y-6 px-6 max-w-sm mx-auto">
        {/* App logo with instant display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.2, ease: 'easeOut' }
          }}
          className="space-y-3"
        >
          <div className="text-4xl font-bold text-black dark:text-white">
            TrainPro
          </div>
          <motion.div 
            className="w-12 h-0.5 bg-blue-600 mx-auto"
            initial={{ width: 0 }}
            animate={{ 
              width: 48,
              transition: { delay: 0.1, duration: 0.3 }
            }}
          />
        </motion.div>

        {/* Loading spinner with instant display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { delay: 0.05, duration: 0.15 }
          }}
          className="space-y-4"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Starting up...
          </p>
        </motion.div>
      </div>
    </div>
  );
}