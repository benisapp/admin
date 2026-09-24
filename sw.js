// Service worker de Benis Admin.
// Estrategia:
//  - Navegaciones (el HTML): red primero, caché como respaldo offline.
//  - Archivos estáticos del mismo origen: caché primero (los assets de Vite
//    llevan hash en el nombre, así que es seguro).
//  - Peticiones a otros orígenes (Firebase, Google Fonts): pasan directo.
//
// Sube la versión de CACHE cuando quieras forzar una limpieza en los clientes.
const CACHE = 'benis-admin-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('./index.html')),
        ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        }),
    ),
  )
})
