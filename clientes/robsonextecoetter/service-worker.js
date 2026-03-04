const CACHE = "orcamento-pwa-robson-v4";

const CORE = [
  "./",
  "./index.html",
  "./config.js",
  "./logo.png",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  // app compartilhado (com o cliente já setado)
  "../../app/index.html?c=robsonextecoetter",

  // libs locais do app
  "../../app/assets/libs/html2canvas.min.js",
  "../../app/assets/libs/jspdf.umd.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // navegação: tenta rede, se falhar usa cache
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  // cache-first para assets
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // salva no cache (best effort)
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => cached))
  );
});
