import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, X } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface RestTimerFABProps {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  onSkip: () => void;
  onToggle?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  draggable?: boolean;
}

export const RestTimerFAB: React.FC<RestTimerFABProps> = ({
  isActive,
  timeRemaining,
  totalTime,
  onSkip,
  onToggle,
  position = 'bottom-right',
  draggable = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
        // Expanded view
        <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm">Rest Timer</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center mb-3">
            <CircularProgress 
              progress={progress} 
              size={60}
              strokeWidth={4}
              showText={false}
            >
              <span className="text-sm font-bold">{formatTime(timeRemaining)}</span>
            </CircularProgress>
          </div>
          
          <div className="flex gap-2">
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
        </div>
      ) : (
        // Collapsed FAB
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white"
          onMouseDown={handleMouseDown}
          onClick={() => setIsExpanded(true)}
        >
          <div className="relative">
            <CircularProgress 
              progress={progress} 
              size={32}
              strokeWidth={3}
              showText={false}
              className="text-white"
            >
              <Clock className="h-4 w-4" />
            </CircularProgress>
          </div>
        </Button>
      )}
    </div>
  );
};