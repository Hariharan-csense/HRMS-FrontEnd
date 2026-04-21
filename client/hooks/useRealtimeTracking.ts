import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";

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

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      // Reuse global socket if available and not connected
      if (globalSocket && !globalSocket.connected) {
        socketRef.current = globalSocket;
      } else if (!globalSocket) {
        // Create new socket connection
        globalSocket = io(window.location.origin, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
          withCredentials: true,
        });
        socketRef.current = globalSocket;
      }

      const socket = socketRef.current;

      socket.on("connect", () => {
        setIsConnected(true);
        setConnectionMode("realtime");
        setError(null);

        // Join company-specific room
        socket.emit("join:company", companyId);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        setConnectionMode("disconnected");
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
        setError(errorMsg);
        onError?.(errorMsg);

        // Try polling as fallback
        if (fallbackToPolling) {
          setConnectionMode("polling");
        }
      });

      socket.on("error", (err) => {
        const errorMsg = typeof err === "string" ? err : "Socket.IO error";
        setError(errorMsg);
        onError?.(errorMsg);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize Socket.IO";
      setError(errorMsg);
      onError?.(errorMsg);

      if (fallbackToPolling) {
        setConnectionMode("polling");
      }
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave:company", companyId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionMode("disconnected");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

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
  }, [enabled, companyId]);

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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
