// ===============================
// SERVICE WORKER AVPCEA — V4
// ===============================

const CACHE_NAME = "AVPCEA-V4";

// Archivos estáticos que SÍ se pueden cachear
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ===============================
// INSTALL — Cachea solo archivos seguros
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ===============================
// ACTIVATE — Limpia versiones antiguas
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===============================
// FETCH — NO interceptar JS ni Supabase
// ===============================
self.addEventListener("fetch", event => {
  const req = event.request;

  // 1. NO interceptar JS (módulos ES6)
  if (req.url.endsWith(".js")) {
    return;
  }

  // 2. NO interceptar llamadas a Supabase
  if (req.url.includes("supabase.co")) {
    return;
  }

  // 3. Solo cachear GET
  if (req.method !== "GET") {
    return;
  }

  // 4. Estrategia cache-first para archivos estáticos
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});
