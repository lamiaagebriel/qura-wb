/*
 * Qura service worker — keeps the app opening with no connection.
 * Registered in production only (components/offline/service-worker.tsx).
 *
 * - Pages: network first; each page you open is saved, and shown again when
 *   offline. Pages you never opened fall back to /offline.
 * - Build assets (/_next/static — content-hashed), icons, manifest: cache
 *   first (they never change for a given URL).
 * - API calls and Next's in-app navigation data (RSC) always go to the
 *   network; offline, the router falls back to a full page load, which the
 *   page strategy above then handles.
 * Bump VERSION to drop every cache on the next deploy.
 */
// v2: businesses moved from sample data to the database — drop pages saved
// with the old data.
const VERSION = "v2";
const STATIC_CACHE = `qura-static-${VERSION}`;
const PAGES_CACHE = `qura-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

// Saves /offline plus the build files it loads, so it hydrates (and its
// Retry button works) even if it was never opened while online.
async function saveOfflinePage() {
  const response = await fetch(new Request(OFFLINE_URL, { cache: "reload" }));
  if (!response.ok) throw new Error(`${OFFLINE_URL}: ${response.status}`);
  const html = await response.clone().text();
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s\\)]+/g) ?? []);
  await (await caches.open(PAGES_CACHE)).put(OFFLINE_URL, response);
  await (await caches.open(STATIC_CACHE)).addAll([...assets]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(saveOfflinePage());
  self.skipWaiting(); // a new version takes over right away
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, PAGES_CACHE];
      for (const name of await caches.keys()) {
        if (name.startsWith("qura-") && !keep.includes(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// Sign out → forget saved pages (they may show the signed-in profile).
self.addEventListener("message", (event) => {
  if (event.data?.type !== "clear-pages") return;
  event.waitUntil(caches.delete(PAGES_CACHE).then(saveOfflinePage));
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/splash/") ||
  ["/icon", "/apple-icon", "/manifest.webmanifest"].includes(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Next's client-navigation payloads: network only (see header comment).
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(event));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

async function pageNetworkFirst(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: PAGES_CACHE });
    return (
      cached ??
      (await caches.match(OFFLINE_URL, { cacheName: PAGES_CACHE })) ??
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}
