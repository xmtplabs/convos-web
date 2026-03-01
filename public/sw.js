/* global self, caches */
const CACHE = "convos-cache";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  // skip dev server files
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/__vite") ||
    url.pathname.startsWith("/__tsd/")
  ) {
    return;
  }

  // Hashed assets (e.g. /assets/index-abc123.js) — cache-first
  // New builds produce new filenames, so stale entries are never served.
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Navigation — network-first, fall back to cached shell
  // After a deploy, the fresh HTML references new hashed assets automatically.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/").then((r) => r || fetch(request))),
    );
    return;
  }

  // Other same-origin requests (icons, manifest, etc.) — network-first
  e.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || fetch(request))),
  );
});
