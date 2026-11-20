const CACHE_NAME = 'anihoodz-v1';

const STATIC_FILES = [
    'style.css',
    'itemImages/image1.jpg',
    'itemImages/image2.jpg',
    'itemImages/image3.jpg',
    'itemImages/image4.jpg',
    'itemImages/image5.jpg',
    'itemImages/image6.jpg',
    'itemImages/image7.jpg',
    'itemImages/image8.jpg',
    'itemImages/image9.jpg',
    'itemImages/image10.jpg',
];

// Save the static files when the worker is first installed
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_FILES);
        })
    );
    self.skipWaiting();
});

// Remove old caches when you change CACHE_NAME
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (name) {
                    return name !== CACHE_NAME;
                }).map(function (name) {
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Serve from the cache first, fall back to the network
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            return cached || fetch(event.request);
        })
    );
});