const CACHE = 'grupay-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'
];

// Instalar: cachear assets principales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback a cache
self.addEventListener('fetch', e => {
  // Solo manejar GET y misma origen + fonts
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const esPropio = url.origin === self.location.origin;
  const esFuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!esPropio && !esFuente) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Si la respuesta es válida, guardar en caché
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
