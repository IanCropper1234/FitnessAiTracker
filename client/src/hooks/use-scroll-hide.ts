import { useState, useEffect } from "react";

interface UseScrollHideOptions {
  threshold?: number;
  initialVisible?: boolean;
}

export function useScrollHide({ 
  threshold = 10, 
  initialVisible = true 
}: UseScrollHideOptions = {}) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // Only trigger if scroll delta exceeds threshold
      if (scrollDelta < threshold) return;

      // Show when scrolling up or at top of page
      if (scrollingUp || currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide when scrolling down (and not near top)
      else if (scrollingDown && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScrollHandler, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", throttledScrollHandler);
    };
  }, [lastScrollY, threshold]);

  return isVisible;
}