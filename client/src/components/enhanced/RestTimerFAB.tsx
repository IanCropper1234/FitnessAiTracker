import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Timer, Settings, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CircularProgress } from './CircularProgress';

interface RestTimerFABProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  defaultRestPeriod: number;
  onSkip: () => void;
  onToggle?: () => void;
  onCustomTimeSet?: (seconds: number) => void;
  draggable?: boolean;
}

const RestTimerFAB: React.FC<RestTimerFABProps> = ({
  timeRemaining,
  totalTime,
  isActive,
  defaultRestPeriod,
  onSkip,
  onToggle,
  onCustomTimeSet,
  draggable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(3);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);

  // Format time to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage with smooth animation
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  
  // Animation states
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [completionAnimation, setCompletionAnimation] = useState(false);
  
  // Trigger pulse animation when timer is active
  React.useEffect(() => {
    if (isActive && timeRemaining > 0) {
      setPulseAnimation(true);
      const pulseTimer = setInterval(() => {
        setPulseAnimation(false);
        setTimeout(() => setPulseAnimation(true), 100);
      }, 2000); // Pulse every 2 seconds
      
      return () => clearInterval(pulseTimer);
    } else {
      setPulseAnimation(false);
    }
  }, [isActive, timeRemaining]);
  
  // Trigger completion animation
  React.useEffect(() => {
    if (progress >= 100 && isActive) {
      setCompletionAnimation(true);
      setTimeout(() => setCompletionAnimation(false), 1000);
    }
  }, [progress, isActive]);

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

  // Handle mouse/touch drag events with improved positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    
    // Get current position or default to current element position
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = fabPosition?.x ?? rect.left;
    const currentY = fabPosition?.y ?? rect.top;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let dragDistance = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only mark as dragged if moved more than 5px
      if (dragDistance > 5) {
        setHasDragged(true);
      }
      
      setFabPosition({
        x: currentX + deltaX,
        y: currentY + deltaY,
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      
      if (hasDragged) {
        snapToEdge();
        // Reset hasDragged after a small delay to prevent immediate click
        setTimeout(() => setHasDragged(false), 50);
      } else {
        setHasDragged(false);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent scrolling during drag
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = fabPosition?.x ?? rect.left;
    const currentY = fabPosition?.y ?? rect.top;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    let dragDistance = 0;
    
    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default if we have touches
      if (e.touches && e.touches.length > 0) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only mark as dragged if moved more than 5px
      if (dragDistance > 5) {
        setHasDragged(true);
      }
      
      setFabPosition({
        x: currentX + deltaX,
        y: currentY + deltaY,
      });
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      
      if (hasDragged) {
        snapToEdge();
        // Reset hasDragged after a small delay to prevent immediate click
        setTimeout(() => setHasDragged(false), 50);
      } else {
        setHasDragged(false);
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Prevent scrolling during drag
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  // Smart edge snapping for better device positioning
  const snapToEdge = () => {
    if (!fabPosition) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fabSize = 64;
    const margin = 12;
    
    // Find the closest edge
    const distanceToLeft = fabPosition.x;
    const distanceToRight = viewportWidth - fabPosition.x - fabSize;
    
    // Snap to the closest horizontal edge with safe margin
    let newX = fabPosition.x;
    if (distanceToLeft < distanceToRight) {
      newX = margin; // Snap to left edge
    } else {
      newX = Math.max(margin, viewportWidth - fabSize - margin); // Snap to right edge
    }
    
    // Keep vertical position but ensure it's within bounds
    const newY = Math.max(margin, Math.min(viewportHeight - fabSize - margin, fabPosition.y));
    
    setFabPosition({ x: newX, y: newY });
  };

  // Auto-hide when not active
  if (!isActive && timeRemaining === 0) {
    return null;
  }

  // Get safe positioning with overflow prevention
  const getSafePosition = () => {
    // Default position when not dragged - aligned with floating training menu
    if (!fabPosition) {
      return {
        bottom: '5rem', // Match floating training menu (bottom-20 = 5rem)
        left: '1rem',
        position: 'fixed' as const,
      };
    }
    
    // Safe boundaries for dragged position
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fabSize = 64; // 16 * 4 (w-16 h-16)
    const margin = 12; // Safe margin from edges
    
    // Constrain within safe boundaries
    const safeX = Math.max(margin, Math.min(viewportWidth - fabSize - margin, fabPosition.x));
    const safeY = Math.max(margin, Math.min(viewportHeight - fabSize - margin, fabPosition.y));
    
    return {
      position: 'fixed' as const,
      left: `${safeX}px`,
      top: `${safeY}px`,
      bottom: 'auto',
      right: 'auto',
    };
  };

  const timerContent = (
    <>
      {/* Expanded timer modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
          <div 
            className="bg-background border border-border -2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 fade-in-0 duration-200"
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
                    className="ios-button touch-target flex items-center justify-center  hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
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
                    className="ios-button touch-target flex items-center justify-center  hover:bg-accent text-foreground/60 hover:text-foreground transition-colors"
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
                        className="ios-button touch-target px-1.5 text-xs font-medium  bg-accent/50 hover:bg-accent text-foreground/80 hover:text-foreground transition-colors border border-border/50"
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
      )}
      
      {/* Floating Action Button - Perfect Circle Design */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          e.preventDefault();
          if (!hasDragged && !isDragging) {
            setIsExpanded(true);
          }
        }}
        className={`fixed z-40 transition-all duration-300 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } relative flex items-center justify-center w-16 h-16 timer-fab-circle shadow-lg hover:scale-105 active:scale-95 group fab-touch select-none`}
        style={{
          ...getSafePosition(),
          borderRadius: '50%',
          overflow: 'hidden'
        }}
      >
        {/* Enhanced pulsing ring when active with animation states */}
        {timeRemaining > 0 && (
          <>
            <div 
              className={`absolute inset-0 timer-fab-circle transition-colors duration-500 animate-pulse ${
                pulseAnimation ? 'bg-blue-500/30 dark:bg-blue-400/30' : 'bg-blue-500/20 dark:bg-blue-400/20'
              } ${completionAnimation ? 'bg-green-500/40 dark:bg-green-400/40' : ''}`}
              style={{ borderRadius: '50%' }}
            />
            {/* Additional ripple effect for urgent countdown */}
            {timeRemaining <= 10 && (
              <div 
                className="absolute inset-0 timer-fab-circle bg-red-500/20 dark:bg-red-400/20 animate-ping" 
                style={{ borderRadius: '50%' }}
              />
            )}
          </>
        )}
        
        {/* Main button with glassmorphism effect - Perfect Circle */}
        <div 
          className="relative w-12 h-12 timer-fab-circle bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-black/20 flex items-center justify-center"
          style={{ borderRadius: '50%' }}
        >
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
                {/* Enhanced progress circle with color transitions */}
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  className={`transition-all duration-500 ${
                    completionAnimation ? 'text-green-500 dark:text-green-400' :
                    timeRemaining <= 10 ? 'text-red-500 dark:text-red-400' :
                    timeRemaining <= 30 ? 'text-yellow-500 dark:text-yellow-400' :
                    'text-blue-500 dark:text-blue-400'
                  }`}
                  strokeDasharray={`${88 * progress / 100} 88`}
                  style={{
                    transform: completionAnimation ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center'
                  }}
                />
              </svg>
              {/* Enhanced time display with animations and color states */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-[11px] font-bold leading-none transition-all duration-300 ${
                  completionAnimation ? 'text-green-600 dark:text-green-400 scale-110' :
                  timeRemaining <= 10 ? 'text-red-600 dark:text-red-400 animate-pulse' :
                  timeRemaining <= 30 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-900 dark:text-white'
                }`}>
                  {Math.ceil(timeRemaining / 60)}
                </div>
                <div className={`text-[7px] leading-none transition-colors duration-300 ${
                  timeRemaining <= 10 ? 'text-red-500 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-300'
                }`}>
                  {timeRemaining <= 10 ? 'sec' : 'min'}
                </div>
              </div>
            </div>
          ) : (
            // Inactive state with modern timer icon
            <div className="relative">
              <Timer className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {/* Subtle indicator dot */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 dark:bg-blue-400  opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        
        {/* Hover glow effect - Perfect Circle */}
        <div 
          className="absolute inset-0 timer-fab-circle bg-blue-500/0 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-400/10 transition-colors duration-300" 
          style={{ borderRadius: '50%' }}
        />
      </button>
    </>
  );

  // Use createPortal to render the timer at the root level for proper floating behavior
  return createPortal(timerContent, document.body);
};

export { RestTimerFAB };
export default RestTimerFAB;