importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);
importScripts("/firebase.js");

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

const toAbsoluteUrl = (url) => {
  const value = String(url || "/").trim();
  if (!value || value === "/") return self.location.origin + "/";
  if (/^https?:\/\//i.test(value)) return value;
  return self.location.origin + (value.startsWith("/") ? value : `/${value}`);
};

const showPushNotification = (title, body, data = {}) => {
  const actionUrl = toAbsoluteUrl(data.actionUrl || "/");
  return self.registration.showNotification(title, {
    body,
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    tag: data.surveyId ? `hrms-survey-${data.surveyId}` : "hrms",
    data: { ...data, actionUrl },
    requireInteraction: false,
  });
};

messaging.onBackgroundMessage(function (payload) {
  const data = payload.data || {};
  const title =
    payload.notification?.title || data.title || "HRMS";
  const body =
    payload.notification?.body || data.body || "";

  return showPushNotification(title, body, data);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const actionUrl = toAbsoluteUrl(event.notification?.data?.actionUrl || "/");

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
