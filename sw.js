const CACHE_NAME = 'evolve-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './manifest.json',
    './Icon-192.png',
    './icon-512.png
];

// Install the service worker and cache the files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached file if found, otherwise fetch from network
            return cachedResponse || fetch(event.request);
        })
    );
});
