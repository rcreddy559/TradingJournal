// Offline-first service worker for the Trading Journal app shell.
// Bump CACHE_VERSION whenever the shell logic changes to invalidate old caches.
const CACHE_VERSION = "v3";
const CACHE_NAME = `trading-journal-shell-${CACHE_VERSION}`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  // Activate the new worker as soon as it finishes installing.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Allow the page to trigger an immediate update via postMessage.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let the browser deal with the rest
  // (fonts, CDNs, etc.) so we never cache opaque cross-origin responses.
  if (url.origin !== self.location.origin) return;

  // Never intercept Vite's dev module graph. Serving these from cache breaks
  // HMR and module loading if a worker is ever active on a dev server.
  if (
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@id/") ||
    url.pathname.startsWith("/@fs/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/")
  ) {
    return;
  }

  // Network-first for navigations so users get fresh HTML when online, with a
  // cached app-shell fallback that keeps the SPA usable offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/") || caches.match("/index.html");
        }),
    );
    return;
  }

  // Stale-while-revalidate for static assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          // Only cache successful, non-opaque responses so an error page can
          // never be pinned in the shell cache.
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
