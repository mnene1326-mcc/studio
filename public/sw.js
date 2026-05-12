
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('matchflow-cache').then(function(cache) {
      return cache.addAll([
        '/',
        '/home',
        '/chats',
        '/me'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
