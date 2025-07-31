import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [animationKey, setAnimationKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('AnimatedPage: Location changed to:', location);
    
    // Force a new animation by resetting state
    setIsVisible(false);
    setAnimationKey(prev => prev + 1);
    
    // Force reflow
    if (containerRef.current) {
      containerRef.current.offsetHeight;
    }
    
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div 
      key={animationKey}
      ref={containerRef}
      className={`page-content transform transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-20 scale-95'
      } ${className}`}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  );
};