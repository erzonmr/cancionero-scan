/*
 * Service worker de Cancionero Scan (PWA).
 *
 * Objetivo modesto y predecible: que la app se pueda instalar y abra rápido.
 * Las canciones NO se guardan aquí: viven en Supabase y se piden siempre a la red.
 *
 *  - Navegación (abrir la app / cualquier ruta): red primero; sin red, la última
 *    copia de index.html. Así cada despliegue nuevo llega en la siguiente apertura.
 *  - /_expo/static/ y /assets/: archivos con hash en el nombre → caché primero.
 *  - Resto del mismo origen (iconos, manifest): caché y se actualiza en segundo plano.
 *  - Otros orígenes (Supabase, CDN de Tesseract) no se tocan: el navegador y
 *    Tesseract (IndexedDB) ya gestionan su propia caché.
 *
 * Sube VERSION si cambias este archivo de forma incompatible: se borran las cachés viejas.
 */
const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', '/manifest.json', '/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(request).then((hit) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || network;
      }),
    ),
  );
});
