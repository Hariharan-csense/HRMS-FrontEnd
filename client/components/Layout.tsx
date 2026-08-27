import React, { useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ENDPOINTS from "@/lib/endpoint";
import attendanceApi from "@/components/helper/attendance/attendance";
import { cn } from "@/lib/utils";
import AIAssistantChat from "@/components/AIAssistantChat";

interface LayoutProps {
  children: React.ReactNode;
}

const LIVE_TRACKING_SESSION_KEY = "attendanceLiveTrackingActive";
const LIVE_LOCATION_PING_MS = 5 * 60 * 1000;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const liveWatchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("hrms.sidebar.collapsed") === "true";
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
      const [result, fieldResult] = await Promise.allSettled([
        attendanceApi.getAttendanceStatus(),
        ENDPOINTS.getActiveClientAttendance(),
      ]);
      if (cancelled) {
        return;
      }

      const attendanceResult =
        result.status === "fulfilled" ? result.value : null;
      const hasActiveFieldAttendance =
        fieldResult.status === "fulfilled" && Boolean(fieldResult.value?.data?.data);

      if (attendanceResult?.success || hasActiveFieldAttendance) {
        const checkedIn =
          typeof attendanceResult?.isCheckedIn === "boolean"
            ? attendanceResult.isCheckedIn
            : false;
        const shouldKeepTracking = checkedIn || hasActiveFieldAttendance;
        setIsCheckedIn(shouldKeepTracking);
        if (shouldKeepTracking) {
          localStorage.setItem(LIVE_TRACKING_SESSION_KEY, "true");
        } else {
          localStorage.removeItem(LIVE_TRACKING_SESSION_KEY);
        }
        return;
      }

      setIsCheckedIn(false);
      localStorage.removeItem(LIVE_TRACKING_SESSION_KEY);
    };

    syncAttendanceStatus();
    const intervalId = window.setInterval(syncAttendanceStatus, 30000);
    const handleTrackingStatusChanged = () => {
      const localTrackingActive =
        typeof window !== "undefined" &&
        localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true";
      setIsCheckedIn(localTrackingActive);
      syncAttendanceStatus();
    };
    window.addEventListener(
      "attendance:tracking-status-changed",
      handleTrackingStatusChanged,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(
        "attendance:tracking-status-changed",
        handleTrackingStatusChanged,
      );
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const localTrackingActive =
      typeof window !== "undefined" &&
      localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true";
    const shouldTrack = Boolean(isCheckedIn && localTrackingActive);

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
      if (now - lastSentAtRef.current < LIVE_LOCATION_PING_MS) {
        return;
      }

      lastSentAtRef.current = now;

      ENDPOINTS.postLiveLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString(),
        device_info: "browser-live-tracker",
        source: "attendance-live-tracker",
      }).catch((error) => {
        console.warn("Global live tracking ping failed", error?.message || error);
      });
    };

    const requestAndSendLiveLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLiveLocation(position.coords);
        },
        (error) => {
          console.warn("Global live tracking ping failed", error?.message || error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 15000,
        }
      );
    };

    requestAndSendLiveLocation();
    const intervalId = window.setInterval(
      requestAndSendLiveLocation,
      LIVE_LOCATION_PING_MS,
    );

    return () => {
      window.clearInterval(intervalId);
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

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("hrms.sidebar.collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - part of flex layout */}
      <div
        className={cn(
          "hidden lg:block lg:flex-shrink-0 transition-[width] duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>
      
      {/* Mobile Sidebar - overlay */}
      <div className="lg:hidden fixed top-0 left-0 h-full z-30">
        <Sidebar isCollapsed={false} />
      </div>

      {/* Main Content - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar - fixed at top */}
        <div className="w-full z-20">
          <Topbar />
        </div>

        {/* Page Content - responsive padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-16 bg-background sm:pt-20">
          <div className="min-h-full w-full min-w-0 p-3 sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      <AIAssistantChat />
    </div>
  );
};
