import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const TransitionTest = () => {
  const [animating, setAnimating] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const triggerTransition = () => {
    if (boxRef.current && !animating) {
      setAnimating(true);
      
      // Animate using Web Animations API
      const animation = boxRef.current.animate([
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(-20px) scale(0.9)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], {
        duration: 1000,
        easing: 'ease-out'
      });

      animation.addEventListener('finish', () => {
        setAnimating(false);
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button onClick={triggerTransition} variant="outline" size="sm" disabled={animating}>
        {animating ? 'Animating...' : 'Test Animation'}
      </Button>
      <div 
        ref={boxRef}
        className="mt-4 p-4 bg-blue-500 text-white "
        style={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
      >
        Animation Test Box
      </div>
    </div>
  );
};