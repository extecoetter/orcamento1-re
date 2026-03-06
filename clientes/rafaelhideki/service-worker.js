
const SLUG = "rafaelhideki";
const APP_V = "0.1.13";          // versão do app (querystring)
const SW_V  = "v15";             // versão do service worker (mude sempre que atualizar)

const CACHE = `orcamento-${SLUG}-${SW_V}`;

const APP_ENTRY = `../../app/index.html?c=${SLUG}&v=${APP_V}`;

const CORE = [
  "./",
  "./android/index.html",
  "./manifest.json",
  "./config.js",
  "./logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  // app compartilhado (sempre versionado!)
  APP_ENTRY,

  // libs locais do PDF (offline)
  "../../app/assets/libs/html2canvas.min.js",
  "../../app/assets/libs/jspdf.umd.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 1) Navegação (abrir /clientes/robsonextecoetter/):
  // tenta rede, se falhar usa cache do index do cliente
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  // 2) app/index.html (o coração do app): NETWORK-FIRST pra não misturar versões
  if (url.href.includes("/app/index.html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 3) resto (config/logo/icons/libs): CACHE-FIRST
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
