// ─────────────────────────────────────────────
// SERVICE WORKER — Staff Menu
// Strategy:
//   index.html → network first, cache fallback (always fresh when online)
//   everything else → cache first, network fallback (fast & offline safe)
// Bump CACHE_NAME on every deploy to force old SWs to refresh
// ─────────────────────────────────────────────
const CACHE_NAME = 'staff-menu-v4';

const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=DM+Sans:wght@300;400&display=swap'
];

// Install — pre-cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete old caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for index.html, cache first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isHTML) {
    // Network first — always try to get fresh HTML, fall back to cache if offline
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first — fonts, manifest etc. rarely change
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
