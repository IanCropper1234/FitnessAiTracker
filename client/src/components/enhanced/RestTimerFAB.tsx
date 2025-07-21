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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">Custom Rest Time</h3>
                  </div>
                  <button
                    onClick={() => setShowCustomTime(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-20 h-12 text-center text-lg font-mono border-2"
                    />
                    <label className="text-sm text-foreground/60 mt-1 block">minutes</label>
                  </div>
                  <div className="text-2xl font-bold text-foreground/40">:</div>
                  <div className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-20 h-12 text-center text-lg font-mono border-2"
                    />
                    <label className="text-sm text-foreground/60 mt-1 block">seconds</label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomTime(false)}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCustomTimeSet}
                    className="h-12 font-semibold"
                  >
                    Start Timer
                  </Button>
                </div>
              </>
            ) : (
              // Timer display view
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">Rest Timer</h3>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <CircularProgress 
                      progress={progress} 
                      size={120}
                      strokeWidth={8}
                      showText={false}
                      className="text-primary"
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold font-mono text-foreground">{formatTime(timeRemaining)}</div>
                        <div className="text-sm text-foreground/60">remaining</div>
                      </div>
                    </CircularProgress>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {onToggle && (
                    <Button
                      variant="outline"
                      onClick={onToggle}
                      className="h-12 flex items-center gap-2"
                    >
                      {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isActive ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  <Button
                    onClick={onSkip}
                    className="h-12 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Skip Rest
                  </Button>
                </div>
                
                {/* Quick time presets */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground/70 text-center">Quick Start</div>
                  <div className="grid grid-cols-5 gap-2">
                    {quickTimes.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onCustomTimeSet?.(preset.seconds)}
                        className="h-10 px-2 text-xs font-medium rounded-lg bg-accent/50 hover:bg-accent text-foreground/80 hover:text-foreground transition-colors border border-border/50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomTime(true)}
                    className="w-full h-10 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Custom Time
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Collapsed timer button - centered and clean
        <button
          onMouseDown={handleMouseDown}
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black hover:shadow-2xl border-2 border-white/20 dark:border-black/20"
        >
          <div className="relative">
            {timeRemaining > 0 ? (
              <CircularProgress 
                progress={progress} 
                size={36}
                strokeWidth={3}
                showText={false}
                className="text-white dark:text-black"
              >
                <div className="text-center">
                  <div className="text-xs font-bold">{Math.ceil(timeRemaining / 60)}</div>
                  <div className="text-[8px] opacity-80">min</div>
                </div>
              </CircularProgress>
            ) : (
              <Timer className="h-6 w-6" />
            )}
          </div>
        </button>
      )}
    </div>
  );
};