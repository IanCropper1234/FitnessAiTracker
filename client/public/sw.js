// Service Worker for TrainPro PWA - iOS Compatible
const CACHE_NAME = 'trainpro-v22';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('TrainPro Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('TrainPro cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('TrainPro essential resources cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('TrainPro service worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('TrainPro Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('TrainPro Service Worker activated');
      return self.clients.claim(); // Take control of existing clients
    })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip service worker for Vite development server requests
  // These include HMR, @vite/client, and module imports
  if (url.pathname.includes('@vite') || 
      url.pathname.includes('/@fs/') ||
      url.pathname.includes('/@id/') ||
      url.pathname.includes('/.vite/') ||
      url.pathname.includes('/node_modules/') ||
      url.pathname.includes('/@react-refresh') ||
      url.pathname.endsWith('.tsx') ||
      url.pathname.endsWith('.ts') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') && url.pathname.includes('/src/')) {
    // Let Vite handle these requests directly
    return;
  }
  
  // Pass through non-GET requests to the network
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Clone the request as it can only be used once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be used once
          const responseToCache = response.clone();
          
          // Cache static assets only
          if (event.request.url.includes('/icons/') || 
              event.request.url.includes('/manifest.json') ||
              event.request.url === self.location.origin + '/') {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        }).catch((error) => {
          // Fallback for offline scenarios
          console.error('Fetch failed:', error);
          
          // Try to serve from cache as fallback
          if (event.request.url === self.location.origin + '/') {
            return caches.match('/').then((response) => {
              if (response) {
                return response;
              }
              // Return a basic offline response if nothing in cache
              return new Response('Offline - TrainPro', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html'
                })
              });
            });
          }
          
          // Return a proper error response for other requests
          return new Response('Network request failed', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
      .catch((error) => {
        // If caches.match fails, return an error response
        console.error('Cache match failed:', error);
        return new Response('Service Worker Error', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});