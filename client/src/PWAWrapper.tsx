import { useState, useEffect } from 'react';
import App from './App';

// Simple PWA wrapper that handles iOS PWA initialization issues
export default function PWAWrapper() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePWA = async () => {
      try {
        console.log('FitAI PWA Wrapper: Starting initialization');
        
        // Detect PWA mode
        const isIOSPWA = window.navigator.standalone === true;
        const currentPath = window.location.pathname;
        
        console.log('FitAI PWA Wrapper: iOS PWA:', isIOSPWA, 'Path:', currentPath);
        
        // For iOS PWA, ensure we're on a valid route
        if (isIOSPWA) {
          const validPaths = ['/', '/auth', '/nutrition', '/add-food', '/training', '/reports', '/profile'];
          if (!validPaths.includes(currentPath)) {
            console.log('FitAI PWA Wrapper: Invalid path, redirecting to home');
            window.location.replace('/');
            return;
          }
        }
        
        // Small delay to ensure DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsReady(true);
        console.log('FitAI PWA Wrapper: Initialization complete');
        
      } catch (err) {
        console.error('FitAI PWA Wrapper: Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initializePWA();
  }, []);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'white',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ fontSize: '18px', color: '#333', marginBottom: '16px' }}>
            FitAI PWA Error
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'pulse 2s infinite', 
            fontSize: '18px', 
            color: '#333',
            marginBottom: '8px'
          }}>
            FitAI
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {window.navigator.standalone ? 'PWA' : 'Web'} Loading...
          </div>
        </div>
      </div>
    );
  }

  return <App />;
}