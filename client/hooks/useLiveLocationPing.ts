import { useEffect, useRef } from "react";
import ENDPOINTS from "@/lib/endpoint";

type Location = { lat: number; lng: number; accuracy?: number };

/**
 * Sends the user's live location to the backend whenever it changes, throttled.
 */
export function useLiveLocationPing(location: Location | null, enabled: boolean, minIntervalMs = 10000) {
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !location) return;

    const now = Date.now();
    if (now - lastSentRef.current < minIntervalMs) return;

    lastSentRef.current = now;

    ENDPOINTS.postLiveLocation({
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      device_info: "web",
    }).catch((err) => {
      console.warn("Live location ping failed", err?.message || err);
    });
  }, [location?.lat, location?.lng, location?.accuracy, enabled, minIntervalMs]);
}
