import { getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import ENDPOINTS from "@/lib/endpoint";
import { showBrowserNotification } from "@/services/showBrowserNotification";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const vapidKey = String(import.meta.env.VITE_FIREBASE_VAPID_KEY || "").trim();

const hasFirebaseConfig = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey,
  );

let registrationPromise: Promise<string | null> | null = null;
let foregroundListenerAttached = false;

const parsePayloadData = (payload: MessagePayload): Record<string, string> => {
  const raw = payload.data || {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, String(value ?? "")]),
  );
};

const attachForegroundListener = (messaging: ReturnType<typeof getMessaging>) => {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;

  onMessage(messaging, (payload: MessagePayload) => {
    const data = parsePayloadData(payload);
    const title =
      payload.notification?.title || data.title || "HRMS";
    const body =
      payload.notification?.body || data.body || "";
    void showBrowserNotification(title, body, data);
  });
};

const waitForServiceWorkerActivation = async (
  registration: ServiceWorkerRegistration,
) => {
  if (registration.active) return registration;

  const installing = registration.installing || registration.waiting;
  if (!installing) {
    await navigator.serviceWorker.ready;
    return registration;
  }

  await new Promise<void>((resolve) => {
    const onStateChange = () => {
      if (installing.state === "activated") {
        installing.removeEventListener("statechange", onStateChange);
        resolve();
      }
    };
    installing.addEventListener("statechange", onStateChange);
    onStateChange();
  });

  return registration;
};

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" },
  );
  return waitForServiceWorkerActivation(registration);
};

export const resetWebPushRegistration = () => {
  registrationPromise = null;
  foregroundListenerAttached = false;
};

export const registerWebPushNotifications = async (force = false) => {
  if (registrationPromise && !force) return registrationPromise;

  registrationPromise = (async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    if (!hasFirebaseConfig()) {
      console.warn("Firebase web push config is missing. FCM token not registered.");
      return null;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return null;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    attachForegroundListener(messaging);

    const serviceWorkerRegistration = await getServiceWorkerRegistration();
    if (!serviceWorkerRegistration) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (!token) {
      console.warn(
        "FCM getToken returned empty. Check VITE_FIREBASE_VAPID_KEY and notification permission.",
      );
      return null;
    }

    const storedToken = localStorage.getItem("fcmToken");
    if (storedToken !== token) {
      if (storedToken) {
        try {
          await ENDPOINTS.unregisterPushToken({ token: storedToken });
        } catch {
          // ignore stale unregister errors
        }
      }

      try {
        await ENDPOINTS.registerPushToken({
          token,
          platform: "web",
        });
        localStorage.setItem("fcmToken", token);
        console.info("Web push token registered with backend.");
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to register push token with server";
        console.warn("Push token registration failed:", message);
        return null;
      }
    }

    return token;
  })();

  return registrationPromise;
};

export const unregisterStoredWebPushToken = async () => {
  const token = localStorage.getItem("fcmToken");
  if (!token) return;

  try {
    await ENDPOINTS.unregisterPushToken({ token });
  } catch (error) {
    console.warn("Failed to unregister FCM token", error);
  } finally {
    localStorage.removeItem("fcmToken");
    resetWebPushRegistration();
  }
};
