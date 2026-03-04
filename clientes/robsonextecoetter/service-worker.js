const SLUG = "robsonextecoetter";
const VERSION = "v13";

const CACHE = `orcamento-${robsonextecoetter}-${v13}`;

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "../../app/index.html?c=" + robsonextecoetter + "&v=12",
  "./config.js",
  "./logo.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>{
      return Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      );
    }).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r || fetch(e.request))
  );
});
