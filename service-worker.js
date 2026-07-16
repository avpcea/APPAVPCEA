// ============================================================
// SERVICE WORKER PARA GITHUB PAGES + SPA + SUPABASE
// ============================================================

const CACHE_NAME = "avpcea-cache-v0";

const URLS_TO_CACHE = [
  "./",                     // index.html
  "./styles.css",
  "./manifest.json",
  "./supabase.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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

// Estrategia: Cache-first SOLO para archivos estáticos
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // No interceptar llamadas a Supabase ni Edge Functions
  if (req.url.includes("supabase.co")) return;
  if (req.url.includes("/functions/v1/")) return;

  // Solo interceptar archivos estáticos
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone);
          });
          return response;
        })
        .catch(() => caches.match("./"));
    })
  );
});
