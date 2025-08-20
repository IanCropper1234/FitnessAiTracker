/**
 * Enhanced Password Strength Indicator Component
 * Real-time password validation with visual feedback
 */
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  requirements: string[];
  feedback: string[];
}

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange: (result: PasswordValidationResult) => void;
  showToggle?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  onValidationChange, 
  showToggle = false,
  className = "" 
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    score: 0,
    requirements: [],
    feedback: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!password) {
      const emptyValidation = {
        isValid: false,
        score: 0,
        requirements: [],
        feedback: []
      };
      setValidation(emptyValidation);
      onValidationChange(emptyValidation);
      return;
    }

    // Debounce validation requests
    const timeoutId = setTimeout(async () => {
      setIsChecking(true);
      try {
        const response = await fetch('/api/auth/validate-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        if (response.ok) {
          const result = await response.json();
          setValidation(result);
          onValidationChange(result);
        }
      } catch (error) {
        console.error('Password validation failed:', error);
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [password, onValidationChange]);

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthText = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score > 0) return 'Weak';
    return '';
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Password Strength
          </span>
          <div className="flex items-center gap-2">
            {isChecking && (
              <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            )}
            <span className={`text-sm font-medium ${
              validation.score >= 60 ? 'text-green-600 dark:text-green-400' : 
              validation.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}>
              {getStrengthText(validation.score)}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <Progress 
            value={validation.score} 
            className="h-2"
          />
          <div 
            className={`absolute inset-0 h-2 rounded-full ${getStrengthColor(validation.score)} transition-all duration-300`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        
        {validation.score > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Score: {validation.score}/100
          </div>
        )}
      </div>

      {/* Requirements Check */}
      {validation.requirements && validation.requirements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Requirements:
          </h4>
          <ul className="space-y-1">
            {validation.requirements.map((requirement, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-red-600 dark:text-red-400">{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {validation.feedback && validation.feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggestions:
          </h4>
          <ul className="space-y-1">
            {validation.feedback.map((feedback, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
                <span className="text-blue-600 dark:text-blue-400">{feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {validation.isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span>Password meets all security requirements!</span>
        </div>
      )}

      {/* Password Toggle (if enabled) */}
      {showToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword(!showPassword)}
          className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showPassword ? (
            <>
              <EyeOff className="w-4 h-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Show
            </>
          )}
        </Button>
      )}
    </div>
  );
}