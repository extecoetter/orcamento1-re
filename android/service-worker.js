const CACHE_NAME = "climatiza-android-1-0-2";

const ASSETS = [
  "/climatizaorcamentos/android/index.html",
  "/climatizaorcamentos/android/manifest.json",
  "/climatizaorcamentos/icons/icon-192.png",
  "/climatizaorcamentos/icons/icon-192-maskable.png",
  "/climatizaorcamentos/icons/icon-512.png",
  "/climatizaorcamentos/icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});
