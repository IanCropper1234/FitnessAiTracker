/**
 * Progressive Registration Form Component
 * Multi-step registration with enhanced validation and UX
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { Mail, User, Lock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegistrationData {
  email: string;
  name: string;
  password: string;
  preferredLanguage: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  requirements: string[];
  feedback: string[];
}

export function ProgressiveRegistrationForm({ onSuccess, onSwitchToSignIn }: { 
  onSuccess: (user: any) => void;
  onSwitchToSignIn?: () => void;
}) {
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [data, setData] = useState<RegistrationData>({
    email: '',
    name: '',
    password: '',
    preferredLanguage: 'en'
  });
  const [passwordValidation, setPasswordValidation] = useState<ValidationResult>({
    isValid: false,
    score: 0,
    requirements: [],
    feedback: []
  });
  const [emailValidated, setEmailValidated] = useState(false);
  const { toast } = useToast();

  const totalSteps = registrationComplete ? 4 : 3;

  // Real-time email validation
  const validateEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidated(false);
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailValidated(false);
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    try {
      const response = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (result.valid) {
        setEmailValidated(true);
        setErrors(prev => ({ ...prev, email: '' }));
        if (result.normalizedEmail !== email) {
          setData(prev => ({ ...prev, email: result.normalizedEmail }));
        }
      } else {
        setEmailValidated(false);
        // Provide more specific error messages
        let errorMessage = result.error;
        if (result.error === 'Email address is already registered') {
          errorMessage = 'This email is already registered. Please use a different email or sign in.';
        } else if (result.error === 'Validation failed') {
          errorMessage = 'Unable to validate email. Please check your connection and try again.';
        }
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidated(false);
      setErrors(prev => ({ ...prev, email: 'Unable to validate email. Please check your connection and try again.' }));
    }
  };

  // Debounced email validation
  useEffect(() => {
    if (data.email) {
      const timeoutId = setTimeout(() => validateEmail(data.email), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailValidated(false);
      setErrors(prev => ({ ...prev, email: '' }));
    }
  }, [data.email]);

  const handleNext = () => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!data.email) newErrors.email = 'Email is required';
      else if (!emailValidated) newErrors.email = 'Please enter a valid email address';
    } else if (step === 2) {
      if (!data.name || data.name.trim().length < 2) {
        newErrors.name = 'Please enter your full name (at least 2 characters)';
      }
      if (!data.password) {
        newErrors.password = 'Password is required';
      } else if (!passwordValidation.isValid) {
        newErrors.password = 'Password does not meet security requirements';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Account Created Successfully!",
          description: result.message,
          variant: "default"
        });

        // Show verification step
        if (result.verificationRequired) {
          setRegistrationComplete(true);
          setRegistrationData(result);
          setStep(4); // Verification step
        } else {
          onSuccess(result.user);
        }
      } else {
        if (response.status === 429) {
          setErrors({ general: `Too many attempts. Please try again in ${Math.ceil(result.retryAfter / 60)} minutes.` });
        } else {
          setErrors({ general: result.error || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const StepIndicator = () => {
    const maxStep = registrationComplete ? 4 : 3;
    
    return (
      <div className="flex items-center justify-center mb-6 px-4 overflow-x-auto">
        {Array.from({ length: maxStep }, (_, i) => i + 1).map((stepNumber) => (
          <div key={stepNumber} className="flex items-center flex-shrink-0">
            <div className={`
              w-7 h-7 rounded-none flex items-center justify-center text-xs font-medium
              ${step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {step > stepNumber ? <CheckCircle className="w-3 h-3" /> : stepNumber}
            </div>
            {stepNumber < maxStep && (
              <div className={`w-8 h-0.5 mx-1 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join TrainPro for AI-powered fitness coaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StepIndicator />

        {errors.general && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className={errors.email ? 'border-red-500' : emailValidated ? 'border-green-500' : ''}
                />
                {emailValidated && (
                  <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
              {emailValidated && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Email is available
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll use this email for account verification and important updates.
            </p>
          </div>
        )}

        {/* Step 2: Personal Info & Password */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a strong password"
                className={errors.password ? 'border-red-500' : passwordValidation.isValid ? 'border-green-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              
              <PasswordStrengthIndicator
                password={data.password}
                onValidationChange={setPasswordValidation}
                className="mt-3"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Your Information</h3>
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">{data.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">{data.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Password:</span>
                <Badge variant={passwordValidation.isValid ? "default" : "secondary"}>
                  {passwordValidation.isValid ? "Strong" : "Needs improvement"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}

        {/* Step 4: Email Verification Sent */}
        {step === 4 && registrationComplete && (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                  Account Created Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We've sent a verification email to:
                </p>
                <p className="text-lg font-medium text-black dark:text-white">
                  {data.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-left space-y-2">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Next Steps:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Check your email inbox for our verification message</li>
                    <li>• Click the verification link to activate your account</li>
                    <li>• Return here to sign in once verified</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button 
                className="text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => {
                  // TODO: Implement resend verification email
                  toast({
                    title: "Verification email resent",
                    description: "Please check your inbox again.",
                  });
                }}
              >
                click here to resend
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isLoading || (step === 1 && !emailValidated) || (step === 2 && !passwordValidation.isValid)}
              className={step === 1 ? "w-full" : "ml-auto"}
            >
              {isLoading ? (
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : step === 3 ? (
                'Create Account'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 4 Action Buttons */}
        {step === 4 && registrationComplete && (
          <div className="space-y-3 mt-6">
            <Button
              onClick={() => onSwitchToSignIn?.()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Reset form for new registration
                setStep(1);
                setRegistrationComplete(false);
                setRegistrationData(null);
                setData({ email: '', name: '', password: '', preferredLanguage: 'en' });
                setErrors({});
                setEmailValidated(false);
              }}
              className="w-full"
            >
              Register Another Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}