import { cn } from "@/lib/utils";

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