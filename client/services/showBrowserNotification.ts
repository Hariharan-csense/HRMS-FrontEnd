/** Show a system notification via the FCM service worker when possible. */
export const showBrowserNotification = async (
  title: string,
  body: string,
  data: Record<string, string> = {},
) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const actionUrl = data.actionUrl || "/";
  const options: NotificationOptions = {
    body,
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    tag: data.surveyId ? `hrms-survey-${data.surveyId}` : data.notificationId ? `hrms-${data.notificationId}` : "hrms",
    data: { ...data, actionUrl },
    requireInteraction: false,
  };

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } catch {
    try {
      new Notification(title, options);
    } catch (error) {
      console.warn("Unable to display browser notification:", error);
    }
  }
};
