/**
 * Service Worker for Doctor Who Library PWA
 * 
 * Features:
 * - Cache-first strategy for assets
 * - Network-first strategy for API calls
 * - Offline fallback pages
 * - Background sync for offline actions
 * - Push notifications for enrichment updates
 * - Intelligent cache management
 */

const CACHE_NAME = 'doctor-who-library-v1';
const OFFLINE_CACHE = 'doctor-who-offline-v1';
const IMAGE_CACHE = 'doctor-who-images-v1';
const API_CACHE = 'doctor-who-api-v1';

// Cache strategies
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';
const NETWORK_ONLY = 'network-only';

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/offline.html',
  '/fallback.html'
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/library/items',
  '/api/library/sections',
  '/api/library/stats'
];

// Routes with specific caching strategies
const CACHE_STRATEGIES = {
  '/api/library/items': STALE_WHILE_REVALIDATE,
  '/api/library/sections': CACHE_FIRST,
  '/api/library/stats': NETWORK_FIRST,
  '/api/enrichment/stream': NETWORK_ONLY,
  '/api/enrichment/': NETWORK_FIRST
};

// ============================================================================
// Service Worker Installation
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache offline pages
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('SW: Caching offline pages');
        return cache.addAll(['/offline.html', '/fallback.html']);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// ============================================================================
// Service Worker Activation
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// ============================================================================
// Fetch Event Handler
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(url.pathname);
  
  // Handle different request types
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, strategy));
  } else {
    event.respondWith(handleStaticRequest(request, strategy));
  }
});

// ============================================================================
// Cache Strategy Functions
// ============================================================================

function getCacheStrategy(pathname) {
  for (const [route, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (pathname.startsWith(route)) {
      return strategy;
    }
  }
  return STALE_WHILE_REVALIDATE;
}

async function handleStaticRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  switch (strategy) {
    case CACHE_FIRST:
      return cacheFirst(request, cache);
    case NETWORK_FIRST:
      return networkFirst(request, cache);
    case STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

async function handleApiRequest(request, strategy) {
  const cache = await caches.open(API_CACHE);
  
  switch (strategy) {
    case NETWORK_ONLY:
      return networkOnly(request);
    case NETWORK_FIRST:
      return networkFirst(request, cache);
    case STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try cache first for images
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful image responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('SW: Image fetch failed:', error);
    // Return placeholder image for failed requests
    return cache.match('/images/placeholder.png');
  }
}

// ============================================================================
// Caching Strategies Implementation
// ============================================================================

async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || getOfflineFallback(request);
  }
}

async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Silently fail for background updates
  });
  
  return cachedResponse || fetchPromise;
}

async function networkOnly(request) {
  return fetch(request);
}

// ============================================================================
// Offline Fallback
// ============================================================================

async function getOfflineFallback(request) {
  const offlineCache = await caches.open(OFFLINE_CACHE);
  const url = new URL(request.url);
  
  // Return specific offline pages based on the route
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'This content is not available offline'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Return offline HTML page
  return offlineCache.match('/offline.html');
}

// ============================================================================
// Background Sync
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('SW: Background sync event:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-enrichment-requests') {
    event.waitUntil(syncEnrichmentRequests());
  } else if (event.tag === 'sync-view-tracking') {
    event.waitUntil(syncViewTracking());
  }
});

async function syncFavorites() {
  try {
    const favorites = await getStoredData('offline-favorites');
    if (favorites && favorites.length > 0) {
      await fetch('/api/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(favorites)
      });
      
      // Clear synced data
      await clearStoredData('offline-favorites');
    }
  } catch (error) {
    console.error('SW: Failed to sync favorites:', error);
  }
}

async function syncEnrichmentRequests() {
  try {
    const requests = await getStoredData('offline-enrichment-requests');
    if (requests && requests.length > 0) {
      await fetch('/api/enrichment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requests)
      });
      
      // Clear synced data
      await clearStoredData('offline-enrichment-requests');
    }
  } catch (error) {
    console.error('SW: Failed to sync enrichment requests:', error);
  }
}

async function syncViewTracking() {
  try {
    const views = await getStoredData('offline-view-tracking');
    if (views && views.length > 0) {
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(views)
      });
      
      // Clear synced data
      await clearStoredData('offline-view-tracking');
    }
  } catch (error) {
    console.error('SW: Failed to sync view tracking:', error);
  }
}

// ============================================================================
// Push Notifications
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  if (action === 'view') {
    event.waitUntil(
      self.clients.openWindow(data.url)
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});

// ============================================================================
// Share Target
// ============================================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHARE_TARGET') {
    console.log('SW: Share target received:', event.data);
    
    // Handle shared content
    event.waitUntil(
      handleSharedContent(event.data.shareData)
    );
  }
});

async function handleSharedContent(shareData) {
  // Process shared content and potentially save it
  console.log('SW: Processing shared content:', shareData);
  
  // You could implement logic to save shared Doctor Who content
  // or search for it in your library
}

// ============================================================================
// Utility Functions
// ============================================================================

async function getStoredData(key) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = await cache.match(`/data/${key}`);
    return response ? response.json() : null;
  } catch (error) {
    console.error('SW: Failed to get stored data:', error);
    return null;
  }
}

async function clearStoredData(key) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.delete(`/data/${key}`);
  } catch (error) {
    console.error('SW: Failed to clear stored data:', error);
  }
}

// ============================================================================
// Cache Management
// ============================================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
}

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (error) => {
  console.error('SW: Service worker error:', error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('SW: Unhandled promise rejection:', event.reason);
});

console.log('SW: Service worker registered successfully');