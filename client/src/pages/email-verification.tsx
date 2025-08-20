import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Clock, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  user: {
    id: number;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  onVerificationSuccess: () => void;
  onReturnToLogin?: () => void;
}

export default function EmailVerification({ user, onVerificationSuccess, onReturnToLogin }: EmailVerificationProps) {
  const [countdown, setCountdown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const { toast } = useToast();

  // Load last resend time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`lastResendTime_${user.email}`);
    if (stored) {
      const storedTime = parseInt(stored);
      const timeDiff = (Date.now() - storedTime) / 1000;
      if (timeDiff < 60) {
        setCountdown(Math.ceil(60 - timeDiff));
        setLastResendTime(storedTime);
      }
    }
  }, [user.email]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {
        email: user.email
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resend verification email");
      }
      return response.json();
    },
    onSuccess: () => {
      const now = Date.now();
      setLastResendTime(now);
      setCountdown(60);
      localStorage.setItem(`lastResendTime_${user.email}`, now.toString());
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive"
      });
    }
  });

  const handleResendEmail = () => {
    if (countdown > 0) return;
    resendVerificationMutation.mutate();
  };

  const handleRefreshVerification = async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/user");
      if (response.ok) {
        const data = await response.json();
        if (data.user?.emailVerified) {
          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified.",
          });
          onVerificationSuccess();
        } else {
          toast({
            title: "Not Verified Yet",
            description: "Please check your email and click the verification link.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Verify Your Email Address
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification link to <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Email Verification Required
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  You need to verify your email address before accessing your dashboard. 
                  Please check your inbox and click the verification link.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Check your inbox for an email from TrainPro</p>
              <p>• Click the verification link in the email</p>
              <p>• Return here and click "Check Verification Status"</p>
              <p>• If you don't see the email, check your spam folder</p>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleRefreshVerification}
              className="w-full"
              variant="default"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Verification Status
            </Button>

            <Button 
              onClick={handleResendEmail}
              disabled={countdown > 0 || resendVerificationMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {resendVerificationMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Return to Login Button */}
          {onReturnToLogin && (
            <Button 
              onClick={onReturnToLogin}
              variant="ghost"
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Login Page
            </Button>
          )}

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Verification emails can be resent every 60 seconds
          </div>
        </CardContent>
      </Card>
    </div>
  );
}