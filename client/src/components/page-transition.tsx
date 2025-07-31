import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    console.log('AnimatedPage: Page mounted/changed:', location);
    
    if (containerRef.current) {
      setIsAnimating(true);
      
      // Always animate on mount/location change
      const animation = containerRef.current.animate([
        { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], {
        duration: 500,
        easing: 'ease-out',
        fill: 'both'
      });

      animation.addEventListener('finish', () => {
        console.log('Page transition animation completed for:', location);
        setIsAnimating(false);
      });
    }
  }, [location]);

  return (
    <div 
      ref={containerRef}
      className={`page-content ${className}`}
      style={{
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)'
      }}
    >
      {children}
    </div>
  );
};