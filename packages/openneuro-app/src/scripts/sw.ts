/**
 * Service worker entry point
 *
 * Be careful to only include necessary dependencies here
 */
export default null
declare const self: ServiceWorkerGlobalScope
const CACHE_NAME = 'openneuro'
// @ts-expect-error Incorrect types for modern service worker APIs
const CACHE_PATHS = global.serviceWorkerOption.assets

self.addEventListener('install', event => {
  void self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_PATHS)
    }),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method === 'GET') {
    // Skip serving from cache for cross origin 'only-if-cached' requests
    if (
      event.request.cache === 'only-if-cached' &&
      event.request.mode !== 'same-origin'
    )
      return
    // Respond from cache, then the network
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request)
        })
      }),
    )
  }
})
