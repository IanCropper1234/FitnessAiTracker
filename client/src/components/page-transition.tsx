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
  return (
    <div className={`page-transition ${className}`}>
      {children}
    </div>
  );
};