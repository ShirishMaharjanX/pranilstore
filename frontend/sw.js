const CACHE_NAME = 'pranilstore-v1';
const urlsToCache = ['/', '/index.html', '/style.css', '/app.js', '/storage.js', '/cart.js', '/auth.js', '/admin.js', '/app-config.js'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))); });
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request).catch(() => new Response('Offline', { status: 503, statusText: 'Service Unavailable' }))));
});
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => { if (cacheName !== CACHE_NAME) return caches.delete(cacheName); })))); });