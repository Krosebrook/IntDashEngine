
const CACHE_NAME = 'int-dashboard-v3';
const OFFLINE_URL = 'offline.html';
const ASSETS_TO_PRECACHE = [
  './',
  'index.html',
  'index.tsx',
  'manifest.json',
  OFFLINE_URL
];

// Pre-cache on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets and offline page');
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Helper to wrap a response with custom metadata headers
 */
async function cacheWithMetadata(cache, request, response) {
  const clonedResponse = response.clone();
  const headers = new Headers(clonedResponse.headers);
  headers.set('X-Cache-Timestamp', Date.now().toString());
  
  // Note: Synthesizing a new response to include metadata headers
  // This is useful for diagnostics but consumes slightly more memory during the write
  try {
    const blob = await clonedResponse.blob();
    const metaResponse = new Response(blob, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers: headers
    });
    await cache.put(request, metaResponse);
  } catch (err) {
    // Fallback to standard cache if synthesis fails (e.g. opaque responses)
    await cache.put(request, response.clone());
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. DYNAMIC DATA: Always Fresh (Network-First/Only)
  const isAiRoute = url.pathname.includes('/api/insights') || 
                    url.pathname.includes('/api/recommend-kpis') || 
                    url.pathname.includes('/api/generate-dashboard');
  const isAuthRoute = url.pathname.includes('/api/auth');

  if (url.hostname === 'generativelanguage.googleapis.com' || isAiRoute || isAuthRoute) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. NAVIGATION: Cache with Offline Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(async (networkResponse) => {
        const cache = await caches.open(CACHE_NAME);
        cacheWithMetadata(cache, event.request, networkResponse);
        return networkResponse;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || cache.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 3. STATIC & LIBRARIES: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cacheWithMetadata(cache, event.request, networkResponse);
          }
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle update command from UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
