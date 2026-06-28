const CACHE = 'lift-v1';

self.addEventListener('install', evt => {
  // Pre-cache the app shell so it's available offline from the very first install
  evt.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  // Remove any old cache versions on activation
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;

  // Navigation requests (HTML) — network first, fall back to cached shell
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(resp => {
          caches.open(CACHE).then(c => c.put(evt.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS/CSS/images with content hashes) — cache first,
  // network fallback + update cache for next time
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(evt.request, resp.clone()));
        return resp;
      });
    })
  );
});
