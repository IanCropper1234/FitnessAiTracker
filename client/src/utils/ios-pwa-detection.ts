/**
 * iOS PWA Detection and Optimization Utilities
 * Helps identify iOS PWA context and apply appropriate optimizations
 */

export const isIOSPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    // Check if running as standalone PWA
    (window.navigator as any)?.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  ) && (
    // Check if iOS device
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // Check for newer iOS devices that may not include iPad/iPhone in user agent
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const applySafariWorkarounds = () => {
  if (!isIOS()) return;

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevent pull-to-refresh
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) return;
    
    const touch = event.touches[0];
    const element = event.target as HTMLElement;
    
    // Allow scrolling on scrollable elements
    if (element.scrollTop > 0 || element.scrollLeft > 0) return;
    
    // Prevent if at top of page
    if (window.scrollY === 0) {
      event.preventDefault();
    }
  }, { passive: false });

  // Fix iOS input zoom
  const addInputListeners = () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.style.fontSize !== '16px') {
        input.style.fontSize = '16px';
      }
    });
  };

  // Apply on mount and when DOM changes
  addInputListeners();
  const observer = new MutationObserver(addInputListeners);
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};

export const optimizeForIOSPWA = () => {
  if (!isIOSPWA()) return;

  // Enable hardware acceleration globally
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-transform: translate3d(0, 0, 0);
      -webkit-backface-visibility: hidden;
    }
    
    /* Optimize scrolling */
    .scroll-area, [data-radix-scroll-area-viewport] {
      -webkit-overflow-scrolling: touch;
      transform: translate3d(0, 0, 0);
    }
    
    /* Prevent iOS zoom on inputs */
    input, textarea, select {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
  };
};