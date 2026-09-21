const VERSION = "hullwake-v1543";
const PRECACHE = [
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/text\.js|game\.js/.test(url.pathname) || url.hostname.indexOf("whop.com") !== -1) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }
  if (url.pathname.endsWith("index.html") || url.pathname.endsWith("/void-runner/") || url.pathname.endsWith("/void-runner")) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(
    fetch(req).then((res) => res).catch(() => caches.match(req))
  );
});
