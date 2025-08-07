import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const lastLocationRef = useRef<string>('');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Only animate if this is actually a new page location, not just a re-render
    if (location !== lastLocationRef.current) {
      console.log('AnimatedPage: Page changed from', lastLocationRef.current, 'to', location);
      lastLocationRef.current = location;
      
      // Reset hasAnimated for new location
      setHasAnimated(false);
      
      // Delay animation slightly to ensure DOM is ready
      animationTimeoutRef.current = setTimeout(() => {
        if (containerRef.current && !hasAnimated) {
          setIsAnimating(true);
          setHasAnimated(true);
          
          // Create a much more dramatic and noticeable animation
          const animation = containerRef.current.animate([
            { 
              opacity: 0, 
              transform: 'translateY(50px) scale(0.8) rotateX(15deg)',
              filter: 'blur(5px)'
            },
            { 
              opacity: 0.5, 
              transform: 'translateY(25px) scale(0.9) rotateX(7deg)',
              filter: 'blur(2px)'
            },
            { 
              opacity: 1, 
              transform: 'translateY(0) scale(1) rotateX(0deg)',
              filter: 'blur(0px)'
            }
          ], {
            duration: 800,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            fill: 'both'
          });

          animation.addEventListener('start', () => {
            console.log('🎬 ANIMATION STARTED for page:', location);
          });

          animation.addEventListener('finish', () => {
            console.log('✅ ANIMATION COMPLETED for page:', location);
            setIsAnimating(false);
          });
        }
      }, 50);
    }

    // Cleanup function
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [location]);

  return (
    <div 
      ref={containerRef}
      className={`page-content ${className}`}
      style={{
        opacity: hasAnimated && !isAnimating ? 1 : (isAnimating ? 0 : 1),
        transform: hasAnimated && !isAnimating ? 'translateY(0) scale(1)' : (isAnimating ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)'),
        transition: hasAnimated ? 'none' : 'opacity 0.3s ease, transform 0.3s ease'
      }}
    >
      {children}
    </div>
  );
};