// Service worker for Protein Tracker
// Strategy: network-first with cache fallback.
// On every load we try to fetch fresh HTML from GitHub Pages.
// If offline, we serve the cached copy so the app still opens.
// skipWaiting + clients.claim means updates take effect immediately
// on the next app open — no need to ever delete & re-add from home screen.

const CACHE = 'pt-sw-v1';
const URLS  = ['/protein-tracker/', '/protein-tracker/index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
});

self.addEventListener('activate', e => {
  // Delete any old cache versions
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle same-origin GET requests
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        // Cache the fresh response
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
