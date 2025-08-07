import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2", 
    lg: "w-8 h-8 border-3"
  };

  return (
    <div className={cn("ios-spinner", sizeClasses[size], className)} />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("ios-dots-loading", className)}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div 
      className={cn("skeleton-loading", className)}
      style={{ width, height }}
    />
  );
}

interface SkeletonCardProps {
  children?: React.ReactNode;
  className?: string;
}

export function SkeletonCard({ children, className }: SkeletonCardProps) {
  return (
    <div className={cn("ios-skeleton-card", className)}>
      {children}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  type?: "spinner" | "dots" | "skeleton";
  className?: string;
}

export function LoadingState({ message = "Loading...", type = "spinner", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 space-y-3", className)}>
      {type === "spinner" && <LoadingSpinner size="lg" />}
      {type === "dots" && <LoadingDots />}
      {type === "skeleton" && (
        <div className="space-y-2 w-full max-w-xs">
          <Skeleton height="20px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </div>
      )}
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

// Skeleton components for specific layouts
export function DashboardCardSkeleton() {
  return (
    <SkeletonCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="100px" height="20px" />
        <Skeleton width="24px" height="24px" />
      </div>
      <Skeleton width="60px" height="32px" />
      <Skeleton width="120px" height="16px" />
    </SkeletonCard>
  );
}

export function NutritionLogSkeleton() {
  return (
    <SkeletonCard className="p-3 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton width="32px" height="32px" />
        <div className="flex-1 space-y-1">
          <Skeleton width="140px" height="16px" />
          <Skeleton width="80px" height="14px" />
        </div>
        <Skeleton width="60px" height="16px" />
      </div>
    </SkeletonCard>
  );
}

export function WorkoutSessionSkeleton() {
  return (
    <SkeletonCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton width="120px" height="18px" />
          <Skeleton width="80px" height="14px" />
        </div>
        <Skeleton width="60px" height="24px" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center space-y-1">
          <Skeleton width="40px" height="20px" className="mx-auto" />
          <Skeleton width="60px" height="12px" className="mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton width="40px" height="20px" className="mx-auto" />
          <Skeleton width="60px" height="12px" className="mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton width="40px" height="20px" className="mx-auto" />
          <Skeleton width="60px" height="12px" className="mx-auto" />
        </div>
      </div>
    </SkeletonCard>
  );
}

// Enhanced loading states with error fallbacks
interface LoadingStateWithErrorProps extends LoadingStateProps {
  error?: Error | null;
  onRetry?: () => void;
  retryButton?: string;
}

export function LoadingStateWithError({ 
  error, 
  onRetry, 
  retryButton = "Try Again",
  ...loadingProps 
}: LoadingStateWithErrorProps) {
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 space-y-4", loadingProps.className)}>
        <div className="text-red-500 dark:text-red-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryButton}
          </button>
        )}
      </div>
    );
  }

  return <LoadingState {...loadingProps} />;
}

// Progressive loading state for multi-step operations
interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  message?: string;
  className?: string;
}

export function ProgressiveLoading({ 
  steps, 
  currentStep, 
  message = "Loading...",
  className 
}: ProgressiveLoadingProps) {
  const progress = Math.round((currentStep / steps.length) * 100);

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 space-y-4", className)}>
      <LoadingSpinner size="lg" />
      <div className="text-center space-y-3 max-w-xs">
        <p className="font-medium text-foreground">{message}</p>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Current step */}
        <p className="text-sm text-muted-foreground">
          {currentStep > 0 && currentStep <= steps.length 
            ? steps[currentStep - 1] 
            : "Getting ready..."
          }
        </p>
        
        {/* Step counter */}
        <p className="text-xs text-muted-foreground">
          Step {Math.min(currentStep, steps.length)} of {steps.length}
        </p>
      </div>
    </div>
  );
}

// Loading overlay for forms and interactive components
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading...",
  blur = true,
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/50 z-10",
          blur && "backdrop-blur-sm"
        )}>
          <div className="bg-background border rounded-lg p-6 shadow-lg">
            <LoadingState message={message} type="spinner" />
          </div>
        </div>
      )}
    </div>
  );
}