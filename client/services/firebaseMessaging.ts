import { getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import ENDPOINTS from "@/lib/endpoint";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

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

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js");
};

export const registerWebPushNotifications = async () => {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    if (!hasFirebaseConfig()) {
      console.warn("Firebase web push config is missing. FCM token not registered.");
      return null;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const serviceWorkerRegistration = await getServiceWorkerRegistration();
    if (!serviceWorkerRegistration) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (!token) return null;

    await ENDPOINTS.registerPushToken({
      token,
      platform: "web",
    });

    if (!foregroundListenerAttached) {
      foregroundListenerAttached = true;
      onMessage(messaging, (payload: MessagePayload) => {
        const title = payload.notification?.title || payload.data?.title || "HRMS";
        const body = payload.notification?.body || payload.data?.body || "";
        if (document.visibilityState === "visible" && "Notification" in window) {
          new Notification(title, {
            body,
            data: payload.data,
          });
        }
      });
    }

    localStorage.setItem("fcmToken", token);
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
    registrationPromise = null;
  }
};
