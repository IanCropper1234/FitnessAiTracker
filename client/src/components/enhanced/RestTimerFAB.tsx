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
        // Expanded menu bubble view
        <div className="absolute bottom-16 left-0 flex flex-col-reverse space-y-reverse space-y-3 animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
          {showCustomTime ? (
            // Custom time setting bubble
            <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[220px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">Custom Rest Time</span>
                </div>
                <button
                  onClick={() => setShowCustomTime(false)}
                  className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-xs text-foreground/60">min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-xs text-foreground/60">sec</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCustomTime(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomTimeSet}
                  className="flex-1"
                >
                  Start
                </Button>
              </div>
            </div>
          ) : (
            // Timer display bubble
            <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">Rest Timer</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-accent text-foreground/60 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center justify-center mb-3">
                <CircularProgress 
                  progress={progress} 
                  size={60}
                  strokeWidth={4}
                  showText={false}
                >
                  <span className="text-sm font-bold text-foreground">{formatTime(timeRemaining)}</span>
                </CircularProgress>
              </div>
              
              <div className="flex gap-2 mb-3">
                {onToggle && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onToggle}
                    className="flex-1"
                  >
                    {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={onSkip}
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>
              
              {/* Quick time presets */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                {quickTimes.slice(0, 3).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onCustomTimeSet?.(preset.seconds)}
                    className="px-2 py-1 text-xs rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {quickTimes.slice(3).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onCustomTimeSet?.(preset.seconds)}
                    className="px-2 py-1 text-xs rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowCustomTime(!showCustomTime)}
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 bg-background border border-border text-foreground hover:bg-accent"
            title="Custom Time"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Collapsed menu bubble FAB (matching menu style)
        <button
          onMouseDown={handleMouseDown}
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          <div className="relative">
            <CircularProgress 
              progress={progress} 
              size={32}
              strokeWidth={3}
              showText={false}
              className="text-current"
            >
              <Timer className="h-5 w-5" />
            </CircularProgress>
          </div>
        </button>
      )}
    </div>
  );
};