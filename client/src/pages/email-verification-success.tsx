import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailVerificationSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLocation("/auth");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / 5);
        return newProgress > 0 ? newProgress : 0;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [setLocation]);

  const handleSignInNow = () => {
    setIsExiting(true);
    setTimeout(() => setLocation("/auth"), 300);
  };

  const handleGoToDashboard = () => {
    setIsExiting(true);
    setTimeout(() => setLocation("/"), 300);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!isExiting && (
          <motion.div
            key="success-notification"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: -10,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
            Email Verified Successfully!
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your email has been verified and your account is now active.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-left space-y-2">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Account Activated
                </p>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Your email address has been confirmed</li>
                  <li>• You can now sign in to your TrainPro account</li>
                  <li>• Access all features and start your fitness journey</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Countdown and Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Automatically redirecting to sign in page in {countdown} seconds
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={handleSignInNow}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Sign In Now
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="outline"
                onClick={handleGoToDashboard}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Welcome to TrainPro! Ready to start your AI-powered fitness journey?
            </p>
          </div>
        </CardContent>
      </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}