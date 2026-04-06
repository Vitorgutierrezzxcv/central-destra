const CACHE_NAME = 'destra-portal-v1';
const STATIC_ASSETS = [
  '/ClientPortalLogin',
  '/ClientPortalDashboard',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache same-origin GET requests for navigation
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/functions')) {
    return;
  }

  // Cache-first for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|svg|woff2|ico)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for navigation
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
