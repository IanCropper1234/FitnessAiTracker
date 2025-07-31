import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLocationRef = useRef(location);

  useEffect(() => {
    if (location !== prevLocationRef.current && containerRef.current) {
      console.log('AnimatedPage: Location changed to:', location, 'starting animation');
      
      // Use Web Animations API for reliable cross-browser animation
      const animation = containerRef.current.animate([
        { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'both'
      });

      animation.addEventListener('finish', () => {
        console.log('Page transition animation completed');
      });

      prevLocationRef.current = location;
    }
  }, [location]);

  return (
    <div 
      ref={containerRef}
      className={`page-content ${className}`}
      style={{
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      }}
    >
      {children}
    </div>
  );
};