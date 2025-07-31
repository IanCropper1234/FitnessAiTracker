import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// iOS PWA blank page prevention - ensure DOM is ready
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('FitAI PWA: Root element not found');
    return;
  }
  
  // Detect iOS PWA mode
  const isIOSPWA = window.navigator.standalone === true;
  console.log('FitAI PWA: Initializing app - iOS PWA mode:', isIOSPWA);
  
  // For iOS PWA, ensure proper initialization
  if (isIOSPWA) {
    // Clear any existing content
    rootElement.innerHTML = '';
    
    // Add loading indicator while React initializes
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: white;">
        <div style="text-align: center;">
          <div style="animation: pulse 2s infinite; font-size: 16px; color: #333;">Loading FitAI...</div>
          <div style="font-size: 12px; color: #666; margin-top: 8px;">PWA Mode</div>
        </div>
      </div>
    `;
    
    // Small delay to ensure proper iOS PWA initialization
    setTimeout(() => {
      createRoot(rootElement).render(<App />);
    }, 100);
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
