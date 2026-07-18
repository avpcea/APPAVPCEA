// service-worker.js

const CACHE_NAME = "AVPCEA-V3";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// INSTALACIÓN
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ACTIVACIÓN
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH: CACHE FIRST + NETWORK FALLBACK
self.addEventListener("fetch", event => {
  const req = event.request;

  // No cachear JS de módulos
  if (req.url.endsWith(".js")) {
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
