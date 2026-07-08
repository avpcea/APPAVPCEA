// ============================================================
// SERVICE WORKER LIMPIO PARA GITHUB PAGES
// ============================================================

const CACHE_NAME = "avpcea-cache-v1";

const URLS_TO_CACHE = [
  "./",               // index.html
  "./styles.css",     // si existe
  "./app.js",         // si existe
];

// Instalación
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        console.warn("No se pudieron cachear algunos archivos.");
      });
    })
  );
});

// Activación
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Network-first con fallback a caché
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
