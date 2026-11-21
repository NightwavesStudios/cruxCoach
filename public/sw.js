const CACHE = "cruxcoach-v3";
const CORE = [
  "/",
  "/app/",
  "/app/log/",
  "/app/reflect/",
  "/app/journal/",
  "/app/plans/",
  "/app/train/",
  "/app/learn/",
  "/app/profile/",
  "/manifest.webmanifest",
  "/assets/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Filled in after the build with every hashed JS/CSS asset.
const BUILD_ASSETS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...CORE, ...BUILD_ASSETS]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function offlineResponse(request) {
  const url = new URL(request.url);
  const withSlash = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;

  return (
    (await caches.match(request, { ignoreSearch: true })) ||
    (await caches.match(withSlash, { ignoreSearch: true })) ||
    (await caches.match("/app/", { ignoreSearch: true })) ||
    (await caches.match("/app", { ignoreSearch: true })) ||
    Response.error()
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => offlineResponse(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }),
    ),
  );
});
