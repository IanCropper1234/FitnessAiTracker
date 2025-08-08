import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Cloud,
  CloudOff,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressSaveIndicatorProps {
  status: 'idle' | 'saving' | 'success' | 'error';
  message?: string;
  isVisible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
  onDismiss?: () => void;
}

const ProgressSaveIndicator: React.FC<ProgressSaveIndicatorProps> = ({
  status,
  message,
  isVisible = true,
  autoHide = true,
  autoHideDelay = 3000,
  position = 'top-right',
  onDismiss
}) => {
  const [show, setShow] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible && status !== 'idle') {
      setShow(true);
      setAnimationClass('animate-in slide-in-from-top-2 fade-in-0 duration-300');
      
      if (autoHide && (status === 'success' || status === 'error')) {
        const timer = setTimeout(() => {
          setAnimationClass('animate-out slide-out-to-top-2 fade-out-0 duration-300');
          setTimeout(() => {
            setShow(false);
            onDismiss?.();
          }, 300);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else if (!isVisible) {
      setAnimationClass('animate-out slide-out-to-top-2 fade-out-0 duration-300');
      setTimeout(() => setShow(false), 300);
    }
  }, [isVisible, status, autoHide, autoHideDelay, onDismiss]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: null, // Use dots animation instead
          color: 'bg-card border-border text-foreground',
          iconColor: 'text-primary',
          title: 'Saving...',
          defaultMessage: 'Saving workout progress'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'bg-card border-border text-foreground',
          iconColor: 'text-green-600 dark:text-green-400',
          title: 'Saved',
          defaultMessage: 'Workout progress saved successfully'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-card border-border text-foreground',
          iconColor: 'text-red-600 dark:text-red-400',
          title: 'Save Failed',
          defaultMessage: 'Failed to save workout progress'
        };
      default:
        return {
          icon: Save,
          color: 'bg-card border-border text-foreground',
          iconColor: 'text-muted-foreground',
          title: 'Ready',
          defaultMessage: 'Ready to save'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  if (!show) return null;

  const indicatorContent = (
    <div 
      className={cn(
        "fixed z-[100] max-w-sm",
        getPositionClasses(),
        animationClass
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-3 border shadow-lg backdrop-blur-sm transition-all duration-300 ios-notification-backdrop",
          config.color
        )}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Animated Icon */}
        <div className={cn(
          "flex-shrink-0 transition-transform duration-300",
          status === 'saving' ? '' : 'hover:scale-110'
        )}>
          {status === 'saving' ? (
            <div className="ios-loading-dots flex items-center gap-1">
              <div className="dot w-1.5 h-1.5 bg-primary rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-primary rounded-full"></div>
              <div className="dot w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>
          ) : (
            IconComponent && <IconComponent className={cn("h-5 w-5", config.iconColor)} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {config.title}
            </span>
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-1 ml-2">
              {navigator.onLine ? (
                <Cloud className="h-3 w-3 text-current opacity-60" />
              ) : (
                <CloudOff className="h-3 w-3 text-current opacity-60" />
              )}
            </div>
          </div>
          
          {(message || config.defaultMessage) && (
            <p className="text-xs opacity-80 mt-0.5 leading-tight">
              {message || config.defaultMessage}
            </p>
          )}
        </div>
        
        {/* Progress Bar for Saving State */}
        {status === 'saving' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20">
            <div 
              className="h-full bg-current opacity-60 animate-pulse"
              style={{
                animation: 'progress-bar 2s ease-in-out infinite'
              }}
            />
          </div>
        )}
        
        {/* Dismiss Button for Error State */}
        {status === 'error' && onDismiss && (
          <button
            onClick={() => {
              setAnimationClass('animate-out slide-out-to-top-2 fade-out-0 duration-200');
              setTimeout(() => {
                setShow(false);
                onDismiss();
              }, 200);
            }}
            className="flex-shrink-0 p-1 hover:bg-current hover:bg-opacity-10 transition-colors duration-200 ml-1"
          >
            <AlertCircle className="h-4 w-4 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(indicatorContent, document.body);
};

// CSS for custom progress bar animation
const styles = `
  @keyframes progress-bar {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export { ProgressSaveIndicator };
export default ProgressSaveIndicator;