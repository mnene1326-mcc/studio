
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('matchflow-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/home',
        '/chats',
        '/me',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
