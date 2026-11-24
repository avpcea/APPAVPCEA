// ===============================================================
// SERVICE WORKER AVPCEA — V5 (PWA + PUSH EMERGENCIAS)
// ===============================================================
const CACHE_NAME = "AVPCEA-V5";

const STATIC_ASSETS = [
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || req.url.endsWith(".js") || req.url.includes("supabase.co")) return;

  // Network-First para HTML (evita quedarse atrapado en versiones viejas)
  if (req.mode === "navigate" || req.url.endsWith(".html")) {
    event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  // Cache-First para iconos y CSS
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

// ===============================================================
// RECEPCIÓN DE ALERTA PUSH EN SEGUNDO PLANO / MÓVIL BLOQUEADO
// ===============================================================
self.addEventListener("push", event => {
  let payload = { title: "🚨 EMERGENCIA AVPCEA", body: "Activación urgente de servicio.", url: "./index.html" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      vibrate: [500, 200, 500, 200, 800],
      tag: "avpcea-emergencia-activa",
      renotify: true,
      requireInteraction: true,
      data: { url: payload.url }
    })
  );
});

// Al tocar la notificación en el móvil, abre o enfoca la app
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || "./index.html");
    })
  );
});
