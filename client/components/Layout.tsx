import React, { useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ENDPOINTS from "@/lib/endpoint";
import attendanceApi from "@/components/helper/attendance/attendance";

interface LayoutProps {
  children: React.ReactNode;
}

const LIVE_TRACKING_SESSION_KEY = "attendanceLiveTrackingActive";

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const liveWatchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true";
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let cancelled = false;

    const syncAttendanceStatus = async () => {
      const localTrackingActive =
        typeof window !== "undefined" &&
        localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true";

      const result = await attendanceApi.getAttendanceStatus();
      if (cancelled) {
        return;
      }

      if (result?.success) {
        const checkedIn =
          typeof result.isCheckedIn === "boolean"
            ? result.isCheckedIn
            : localTrackingActive;
        setIsCheckedIn(checkedIn || localTrackingActive);
        if (checkedIn) {
          localStorage.setItem(LIVE_TRACKING_SESSION_KEY, "true");
        } else if (!localTrackingActive) {
          localStorage.removeItem(LIVE_TRACKING_SESSION_KEY);
        }
        return;
      }

      setIsCheckedIn(localTrackingActive);
    };

    syncAttendanceStatus();
    const intervalId = window.setInterval(syncAttendanceStatus, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const localTrackingActive =
      typeof window !== "undefined" &&
      localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true";
    const shouldTrack = Boolean(isCheckedIn || localTrackingActive);

    if (!isAuthenticated || !user?.id || user?.type !== "employee" || !shouldTrack) {
      if (liveWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(liveWatchIdRef.current);
        liveWatchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const sendLiveLocation = (coords: GeolocationCoordinates) => {
      const now = Date.now();
      if (now - lastSentAtRef.current < 10000) {
        return;
      }

      lastSentAtRef.current = now;

      ENDPOINTS.postLiveLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString(),
        device_info: "browser-live-tracker",
      }).catch((error) => {
        console.warn("Global live tracking ping failed", error?.message || error);
      });
    };

    liveWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        sendLiveLocation(position.coords);
      },
      (error) => {
        console.warn("Global live tracking watch failed", error?.message || error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      if (liveWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveWatchIdRef.current);
        liveWatchIdRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, isCheckedIn]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - part of flex layout */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar - overlay */}
      <div className="lg:hidden fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Main Content - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar - fixed at top */}
        <div className="w-full z-20">
          <Topbar />
        </div>

        {/* Page Content - responsive padding */}
        <main className="flex-1 overflow-y-auto pt-16 bg-background">
          <div className="p-4 sm:p-6 lg:p-6 w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
