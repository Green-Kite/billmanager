self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.caches) {
      const keys = await self.caches.keys();
      await Promise.all(keys.map((key) => self.caches.delete(key)));
    }

    const clients = await self.clients.matchAll({ type: 'window' });
    await self.registration.unregister();

    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});
