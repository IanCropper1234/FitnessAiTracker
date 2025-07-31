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
  }, [location]);

  return (
    <div 
      ref={containerRef}
      className={`page-content ${className}`}
      style={{
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
      }}
    >
      {children}
    </div>
  );
};