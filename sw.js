// Days Between — Service Worker
// Caches the app shell for full offline support on iOS Safari and all browsers.
// Cache version: bump this string every time index.html is updated so that
// existing clients discard the old cache and fetch fresh files.

const CACHE = 'days-between-v4';
const ASSETS = [
  './',
  './index.html',
  './sw.js',
  './manifest.json'
];

// On install: pre-cache all assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();   // activate new SW right away, don't wait for old tabs to close
});

// On activate: delete all old caches, then take control of all open clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();  // take over any pages already open under old SW
});

// Fetch strategy: Network-first with cache fallback.
// - When online: always fetches fresh from network, updates the cache entry.
// - When offline: serves the cached copy so the app still works.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Got a good network response — update the cache and return it
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Network failed (offline) — serve from cache
        return caches.match(e.request);
      })
  );
});
