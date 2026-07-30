const CACHE_NAME = "oil-converter-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "icon.png",
  "icon-192.png",
  "icon-512.png",
  "screenshot_mobile.png",
  "screenshot_desktop.png"
];

// Install Event
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch Event - Network First with Cache Fallback for offline usage
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the updated assets dynamically
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline (use ignoreSearch: true to match queries like ?source=pwa)
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          return cachedResponse || Response.error();
        });
      })
  );
});
