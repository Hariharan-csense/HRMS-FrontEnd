import { useCallback, useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { BASE_URL } from "@/lib/endpoint";

type LocationUpdate = {
  id: number;
  employee_id: string | number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  location_timestamp: string;
  employeeName?: string;
};

type TrackingEvent = "location:update" | "tracking:start" | "tracking:stop" | "user:online" | "user:offline";

type UseRealtimeTrackingOptions = {
  enabled: boolean;
  companyId: string | number;
  onLocationUpdate?: (location: LocationUpdate) => void;
  onError?: (error: string) => void;
  fallbackToPolling?: boolean;
};

type UseRealtimeTrackingReturn = {
  isConnected: boolean;
  connectionMode: "realtime" | "polling" | "disconnected";
  lastUpdate: LocationUpdate | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
};

let globalSocket: Socket | null = null;
const SOCKET_PATH = "/backend/socket.io";

const SOCKET_URL = (() => {
  try {
    return new URL(BASE_URL).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
})();

export const useRealtimeTracking = (
  options: UseRealtimeTrackingOptions
): UseRealtimeTrackingReturn => {
  const {
    enabled = false,
    companyId,
    onLocationUpdate,
    onError,
    fallbackToPolling = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"realtime" | "polling" | "disconnected">(
    "disconnected"
  );
  const [lastUpdate, setLastUpdate] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      if (!globalSocket) {
        globalSocket = io(SOCKET_URL, {
          path: SOCKET_PATH,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
          withCredentials: true,
          autoConnect: false,
        });
      }

      socketRef.current = globalSocket;
      const socket = socketRef.current;
      if (!socket) {
        throw new Error("Socket initialization failed");
      }

      socket.off("connect");
      socket.off("disconnect");
      socket.off("location:update");
      socket.off("tracking:start");
      socket.off("tracking:stop");
      socket.off("connect_error");
      socket.off("error");

      socket.on("connect", () => {
        setIsConnected(true);
        setConnectionMode("realtime");
        setError(null);
        socket.emit("join:company", companyId);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        setConnectionMode(fallbackToPolling ? "polling" : "disconnected");
      });

      socket.on("location:update", (location: LocationUpdate) => {
        setLastUpdate(location);
        onLocationUpdate?.(location);
      });

      socket.on("tracking:start", (data) => {
        console.log("Tracking started for:", data);
      });

      socket.on("tracking:stop", (data) => {
        console.log("Tracking stopped for:", data);
      });

      socket.on("connect_error", (err) => {
        const errorMsg =
          err.message || "WebSocket connection error. Falling back to polling.";
        setIsConnected(false);
        setError(errorMsg);
        onError?.(errorMsg);
        setConnectionMode(fallbackToPolling ? "polling" : "disconnected");
      });

      socket.on("error", (err) => {
        const errorMsg = typeof err === "string" ? err : "Socket.IO error";
        setError(errorMsg);
        onError?.(errorMsg);
      });

      if (socket.connected) {
        setIsConnected(true);
        setConnectionMode("realtime");
        setError(null);
        socket.emit("join:company", companyId);
      } else {
        socket.connect();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize Socket.IO";
      setError(errorMsg);
      onError?.(errorMsg);

      if (fallbackToPolling) {
        setConnectionMode("polling");
      }
    }
  }, [companyId, fallbackToPolling, onError, onLocationUpdate]);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("leave:company", companyId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("location:update");
      socket.off("tracking:start");
      socket.off("tracking:stop");
      socket.off("connect_error");
      socket.off("error");
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionMode("disconnected");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [companyId]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    connectionMode,
    lastUpdate,
    error,
    connect,
    disconnect,
  };
};

// Helper hook to send location updates
type UseSendLocationOptions = {
  employeeId: string | number;
  enabled: boolean;
};

type UseSendLocationReturn = {
  sendLocation: (
    latitude: number,
    longitude: number,
    accuracy?: number | null,
    address?: string | null
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
};

export const useSendLocation = (options: UseSendLocationOptions): UseSendLocationReturn => {
  const { employeeId, enabled } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLocation = async (
    latitude: number,
    longitude: number,
    accuracy?: number | null,
    address?: string | null
  ): Promise<boolean> => {
    if (!enabled || !employeeId) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/backend/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          employeeId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          address: address || null,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send location");
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send location";
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }
  };

  return {
    sendLocation,
    isLoading,
    error,
  };
};
