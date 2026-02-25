const CACHE_NAME = "bible-study-suite-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./apps.js",
  "./bible.js",
  "./notes.js",
  "./audio.js",
  "./manifest.webmanifest",
  "./logo.png",
  "./icons/icon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
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
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Keep Bible API live (network-first) to avoid stale scripture results.
  if (url.origin === "https://bible-api.com") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
