import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// iOS PWA blank page prevention with route-aware initialization
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('FitAI PWA: Root element not found');
    return;
  }
  
  // Detect iOS PWA mode
  const isIOSPWA = window.navigator.standalone === true;
  const currentPath = window.location.pathname;
  console.log('FitAI PWA: Initializing - iOS PWA:', isIOSPWA, 'Path:', currentPath);
  
  // iOS PWA with route-specific handling
  if (isIOSPWA) {
    // If we're on an invalid path, redirect immediately
    const validPaths = ['/', '/auth', '/nutrition', '/add-food', '/training', '/reports', '/profile', '/wellness-test', '/rp-coach'];
    if (!validPaths.includes(currentPath)) {
      console.log('FitAI PWA: Invalid path detected, redirecting to home');
      window.location.replace(window.location.origin + '/');
      return;
    }
    
    // Clear any stale content
    rootElement.innerHTML = '';
    
    // iOS PWA loading screen
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: white;">
        <div style="text-align: center;">
          <div style="animation: pulse 2s infinite; font-size: 16px; color: #333; margin-bottom: 8px;">FitAI</div>
          <div style="font-size: 12px; color: #666;">PWA Loading...</div>
          <div style="font-size: 10px; color: #999; margin-top: 4px;">Route: ${currentPath}</div>
        </div>
      </div>
    `;
    
    // Force immediate render for iOS PWA
    createRoot(rootElement).render(<App />);
  } else {
    // Standard web initialization
    createRoot(rootElement).render(<App />);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
