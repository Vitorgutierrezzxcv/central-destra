const CACHE_NAME = "destra-client-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install event - cache initial resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently ignore errors during install
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, then cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // API calls - network first
  if (url.pathname.includes("/api/") || url.pathname.includes("/functions/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response("Offline - cached data not available", { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/i) ||
    url.pathname.includes("/assets/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Background update - fetch new version without blocking
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
              });
            }
            return response;
          })
          .catch(() => {
            return new Response("Offline", { status: 503 });
          });
      })
    );
    return;
  }

  // HTML pages - network first
  if (
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response("Offline", { status: 503 });
          });
        })
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Listen for messages from clients to skip waiting during update
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
