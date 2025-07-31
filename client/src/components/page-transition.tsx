import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLocationRef = useRef(location);

  useEffect(() => {
    // Only animate if location actually changed
    if (location !== prevLocationRef.current) {
      console.log('Page transition triggered:', prevLocationRef.current, '->', location);
      
      // Start invisible
      setIsVisible(false);
      
      // Force reflow to ensure the invisible state is applied
      if (containerRef.current) {
        containerRef.current.offsetHeight;
      }
      
      // Then make visible with animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      prevLocationRef.current = location;
      return () => clearTimeout(timer);
    } else {
      // Initial mount - show immediately with animation
      setIsVisible(true);
    }
  }, [location]);

  return (
    <div 
      ref={containerRef}
      className={`transform transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-16 scale-90'
      } ${className}`}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </div>
  );
};