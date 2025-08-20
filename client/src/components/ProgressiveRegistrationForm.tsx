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

export function ProgressiveRegistrationForm({ onSuccess }: { onSuccess: (user: any) => void }) {
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

  const totalSteps = 3;

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

        // Show verification step or success
        if (result.verificationRequired) {
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

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${step >= stepNumber 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }
          `}>
            {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-12 h-0.5 mx-2 ${
              step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

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

        {/* Navigation Buttons */}
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
            ) : step === totalSteps ? (
              'Create Account'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}