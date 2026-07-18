const CACHE_NAME = 'cadre-familial-v4-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './settings.html',
  './css/styles.css',
  './css/settings.css',
  './js/storage.js',
  './js/weather.js',
  './js/slideshow.js',
  './js/app.js',
  './js/settings.js',
  './config.json',
  './manifest.json',
  './photos/sample-1.svg',
  './photos/sample-2.svg',
  './photos/sample-3.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (err) {
      return caches.match('./index.html');
    }
  })());
});
