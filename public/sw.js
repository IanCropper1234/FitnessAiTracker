// FitAI PWA Service Worker - iOS Session Handling
const CACHE_NAME = 'fitai-pwa-v1';
const STATIC_CACHE_NAME = 'fitai-static-v1';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('FitAI PWA: Service worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('FitAI PWA: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('FitAI PWA: Service worker activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('FitAI PWA: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests with iOS PWA session awareness
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with special iOS PWA session handling
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, {
        credentials: 'include', // Ensure cookies/session are included
        headers: {
          ...request.headers,
          'X-PWA-Mode': 'ios-standalone' // Identify PWA requests
        }
      }).catch((error) => {
        console.error('FitAI PWA: API request failed:', error);
        // For auth endpoints, return a custom response to trigger local recovery
        if (url.pathname.includes('/auth/')) {
          return new Response(JSON.stringify({ 
            error: 'Network unavailable',
            pwaFallback: true 
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Handle page navigation with network-first, fallback to cache
  if (request.mode === 'navigate') {
    console.log('FitAI PWA SW: Navigation request to:', url.pathname);
    event.respondWith(
      fetch(request, { credentials: 'include' })
        .then((response) => {
          console.log('FitAI PWA SW: Navigation response status:', response.status, 'for', url.pathname);
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.error('FitAI PWA SW: Navigation failed for', url.pathname, error);
          // Fallback to cached version or offline page
          return caches.match(request).then((response) => {
            console.log('FitAI PWA SW: Using cached response for', url.pathname);
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Default: network-first strategy for all other requests
  event.respondWith(
    fetch(request, { credentials: 'include' }).catch(() => {
      return caches.match(request);
    })
  );
});

// Handle PWA session recovery messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RECOVER_SESSION') {
    console.log('FitAI PWA: Session recovery requested');
    
    // Notify client about session recovery attempt
    event.ports[0].postMessage({ 
      success: true, 
      message: 'Session recovery initiated' 
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('FitAI PWA: Cache clear requested');
    
    // Clear all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ 
        success: true, 
        message: 'Cache cleared successfully' 
      });
    });
  }
});

// iOS PWA specific handling for session timeouts
self.addEventListener('sync', (event) => {
  if (event.tag === 'session-refresh') {
    console.log('FitAI PWA: Background session refresh');
    event.waitUntil(
      fetch('/api/auth/user', { 
        credentials: 'include',
        headers: { 'X-PWA-Mode': 'background-sync' }
      }).catch((error) => {
        console.log('FitAI PWA: Background session refresh failed:', error);
      })
    );
  }
});

console.log('FitAI PWA: Service worker loaded successfully');