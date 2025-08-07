import { useRef, useEffect } from 'react';

// Dashboard animation utilities
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  stagger?: number;
}

const defaultConfig: AnimationConfig = {
  duration: 500,
  delay: 0,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  stagger: 100
};

// Hook for staggered fade-in animations
export function useStaggeredAnimation(selector: string, config?: AnimationConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.opacity = '0';
        htmlElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          htmlElement.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], {
            duration: animationConfig.duration!,
            easing: animationConfig.easing!,
            delay: index * animationConfig.stagger!,
            fill: 'forwards'
          });
        }, animationConfig.delay!);
      });
    }
  }, [selector, animationConfig]);

  return containerRef;
}

// Hook for slide-in from left animations
export function useSlideInAnimation(selector: string, config?: AnimationConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.opacity = '0';
        htmlElement.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
          htmlElement.animate([
            { opacity: 0, transform: 'translateX(-20px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ], {
            duration: animationConfig.duration!,
            easing: animationConfig.easing!,
            delay: index * animationConfig.stagger!,
            fill: 'forwards'
          });
        }, animationConfig.delay!);
      });
    }
  }, [selector, animationConfig]);

  return containerRef;
}

// Hook for scale-in animations
export function useScaleInAnimation(selector: string, config?: AnimationConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.opacity = '0';
        htmlElement.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          htmlElement.animate([
            { opacity: 0, transform: 'scale(0.8)' },
            { opacity: 1, transform: 'scale(1)' }
          ], {
            duration: animationConfig.duration!,
            easing: animationConfig.easing!,
            delay: index * animationConfig.stagger!,
            fill: 'forwards'
          });
        }, animationConfig.delay!);
      });
    }
  }, [selector, animationConfig]);

  return containerRef;
}

// Enhanced dashboard card component with built-in animation
export function AnimatedDashboardCard({ 
  children, 
  className = '', 
  animationType = 'fadeIn',
  delay = 0 
}: {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn';
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      const element = cardRef.current;
      
      // Set initial state based on animation type
      const initialStates = {
        fadeIn: { opacity: 0, transform: 'translateY(20px)' },
        slideIn: { opacity: 0, transform: 'translateX(-20px)' },
        scaleIn: { opacity: 0, transform: 'scale(0.8)' }
      };

      const finalStates = {
        fadeIn: { opacity: 1, transform: 'translateY(0)' },
        slideIn: { opacity: 1, transform: 'translateX(0)' },
        scaleIn: { opacity: 1, transform: 'scale(1)' }
      };

      Object.assign(element.style, initialStates[animationType]);
      
      setTimeout(() => {
        element.animate([
          initialStates[animationType],
          finalStates[animationType]
        ], {
          duration: 500,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'forwards'
        });
      }, delay);
    }
  }, [animationType, delay]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
}