importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

importScripts("/firebase.js");

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title || payload.data?.title || "HRMS";
  const body = payload.notification?.body || payload.data?.body || "";
  const actionUrl = payload.fcmOptions?.link || payload.data?.actionUrl || "/";

  self.registration.showNotification(title, {
    body,
    data: {
      actionUrl,
    },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const actionUrl = event.notification?.data?.actionUrl || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(actionUrl);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      }),
  );
});
