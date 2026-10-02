// MAGGURU RSUD Bulukumba — Service Worker (PWA)
const CACHE_NAME = "magguru-pwa-v2"
const OFFLINE_URL = "/offline.html"

const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/apple-touch-icon.png",
  "/logo.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  // Hanya proses GET requests
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // Abaikan request API Supabase dan Auth dari caching offline langsung
  if (url.pathname.startsWith("/api") || url.pathname.includes("supabase.co")) {
    return
  }

  // Untuk navigasi dokumen HTML (halaman web)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedOffline = await cache.match(OFFLINE_URL)
        return cachedOffline || Response.error()
      })
    )
    return
  }

  // Untuk static assets (images, icons, styles): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => null)

      return cachedResponse || fetchPromise
    })
  )
})
