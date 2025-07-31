import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const TransitionTest = () => {
  const [isVisible, setIsVisible] = useState(true);

  const triggerTransition = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button onClick={triggerTransition} variant="outline" size="sm">
        Test Transition
      </Button>
      <div 
        className={`mt-4 p-4 bg-blue-500 text-white rounded transition-all duration-1000 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-16 scale-90'
        }`}
      >
        Transition Test Box
      </div>
    </div>
  );
};