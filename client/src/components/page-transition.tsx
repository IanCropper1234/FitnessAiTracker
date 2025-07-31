import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [key, setKey] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location !== key) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setKey(location);
        setIsTransitioning(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location, key]);

  return (
    <div 
      key={key}
      className={`page-transition ${className} ${isTransitioning ? 'opacity-0' : ''}`}
    >
      {children}
    </div>
  );
};

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Reset animation state on location change
    setIsAnimating(true);
    
    // Start the fade in animation after a brief delay
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isAnimating 
          ? 'opacity-0 translate-y-4 scale-95' 
          : 'opacity-100 translate-y-0 scale-100'
      } ${className}`}
    >
      {children}
    </div>
  );
};