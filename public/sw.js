// Family Tasks service worker — push notifications only, no offline caching
// (offline support is explicitly out of scope for this app).

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { title, body, url, type } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "Family Tasks", {
      body,
      data: { url: url || "/today", type },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/today";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of clientsList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (clientsList.length > 0 && "focus" in clientsList[0]) {
        clientsList[0].focus();
        return clientsList[0].navigate ? clientsList[0].navigate(targetUrl) : undefined;
      }

      return self.clients.openWindow(targetUrl);
    })(),
  );
});
