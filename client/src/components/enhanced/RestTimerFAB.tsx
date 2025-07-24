import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, X, Settings, Timer } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { Input } from '@/components/ui/input';

interface RestTimerFABProps {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  onSkip: () => void;
  onToggle?: () => void;
  onCustomTimeSet?: (seconds: number) => void;
  defaultRestPeriod?: number; // Rest Period from template/session
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  draggable?: boolean;
}

export const RestTimerFAB: React.FC<RestTimerFABProps> = ({
  isActive,
  timeRemaining,
  totalTime,
  onSkip,
  onToggle,
  onCustomTimeSet,
  defaultRestPeriod = 120,
  position = 'bottom-right',
  draggable = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(defaultRestPeriod / 60));
  const [customSeconds, setCustomSeconds] = useState(defaultRestPeriod % 60);

  // Position classes based on prop
  const getPositionClass = () => {
    if (fabPosition) return '';
    
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  // Format time to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  // Handle custom time setting
  const handleCustomTimeSet = () => {
    const totalCustomSeconds = customMinutes * 60 + customSeconds;
    if (onCustomTimeSet && totalCustomSeconds > 0) {
      onCustomTimeSet(totalCustomSeconds);
    }
    setShowCustomTime(false);
    setIsExpanded(false);
  };

  // Quick time presets based on default rest period
  const quickTimes = [
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '2m', seconds: 120 },
    { label: '3m', seconds: 180 },
    { label: 'Default', seconds: defaultRestPeriod }
  ];

  // Handle mouse/touch drag events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      setFabPosition({
        x: deltaX,
        y: deltaY,
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-hide when not active
  if (!isActive && timeRemaining === 0) {
    return null;
  }

  const fabStyle = fabPosition 
    ? {
        transform: `translate(${fabPosition.x}px, ${fabPosition.y}px)`,
        position: 'fixed' as const,
        bottom: '1rem',
        right: '1rem',
      }
    : {};

  return (
    <div
      className={`fixed z-50 ${getPositionClass()} transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={fabStyle}
    >
      {isExpanded ? (
        // Expanded timer card - centered design
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
          <div 
            className="bg-background border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 fade-in-0 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {showCustomTime ? (
              // Custom time setting view
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-base text-foreground">Custom Rest Time</h3>
                  </div>
                  <button
                    onClick={() => setShowCustomTime(false)}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-16 h-10 text-center text-base font-mono border"
                    />
                    <label className="text-xs text-foreground/60 mt-1 block">min</label>
                  </div>
                  <div className="text-lg font-bold text-foreground/40">:</div>
                  <div className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-16 h-10 text-center text-base font-mono border"
                    />
                    <label className="text-xs text-foreground/60 mt-1 block">sec</label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomTime(false)}
                    className="h-10 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCustomTimeSet}
                    className="h-10 font-medium text-sm"
                  >
                    Start Timer
                  </Button>
                </div>
              </>
            ) : (
              // Timer display view
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-base text-foreground">Rest Timer</h3>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <CircularProgress 
                      progress={progress} 
                      size={100}
                      strokeWidth={6}
                      showText={false}
                      className="text-primary"
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold font-mono text-foreground">{formatTime(timeRemaining)}</div>
                        <div className="text-xs text-foreground/60">remaining</div>
                      </div>
                    </CircularProgress>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {onToggle && (
                    <Button
                      variant="outline"
                      onClick={onToggle}
                      className="h-10 flex items-center gap-1.5 text-sm"
                    >
                      {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {isActive ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  <Button
                    onClick={onSkip}
                    className="h-10 flex items-center gap-1.5 text-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                    Skip Rest
                  </Button>
                </div>
                
                {/* Quick time presets */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-foreground/70 text-center">Quick Start</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {quickTimes.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onCustomTimeSet?.(preset.seconds)}
                        className="h-8 px-1.5 text-xs font-medium rounded-md bg-accent/50 hover:bg-accent text-foreground/80 hover:text-foreground transition-colors border border-border/50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomTime(true)}
                    className="w-full h-8 flex items-center gap-1.5 text-sm"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Custom Time
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Collapsed timer button - minimalist pulsing ring design
        <button
          onMouseDown={handleMouseDown}
          onClick={() => setIsExpanded(true)}
          className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          {/* Outer pulsing ring when active */}
          {timeRemaining > 0 && (
            <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-400/20 animate-pulse" />
          )}
          
          {/* Main button with glassmorphism effect */}
          <div className="relative w-12 h-12 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-black/20 flex items-center justify-center">
            {timeRemaining > 0 ? (
              // Active timer with modern ring progress
              <div className="relative">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  {/* Background circle */}
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-300/30 dark:text-gray-600/30"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    className="text-blue-500 dark:text-blue-400 transition-all duration-300"
                    strokeDasharray={`${88 * progress / 100} 88`}
                  />
                </svg>
                {/* Time display with better typography */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white leading-none">
                    {Math.ceil(timeRemaining / 60)}
                  </div>
                  <div className="text-[7px] text-gray-600 dark:text-gray-300 leading-none">
                    min
                  </div>
                </div>
              </div>
            ) : (
              // Inactive state with modern timer icon
              <div className="relative">
                <Timer className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                {/* Subtle indicator dot */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-400/10 transition-colors duration-300" />
        </button>
      )}
    </div>
  );
};