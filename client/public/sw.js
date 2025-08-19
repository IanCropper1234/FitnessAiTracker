// Service Worker for TrainPro PWA - iOS Compatible
const CACHE_NAME = 'trainpro-v1.2.0';
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
  // Only cache GET requests
  if (event.request.method !== 'GET') {
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
        }).catch(() => {
          // Fallback for offline scenarios
          if (event.request.url === self.location.origin + '/') {
            return caches.match('/');
          }
        });
      })
  );
});