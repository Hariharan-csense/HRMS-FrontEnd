import { useState, useMemo, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, Polyline, Circle, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Search,
  Phone,
  Navigation2,
  Play,
  Pause,
  Square,
  UserCheck,
  Map,
  Download,
  Layers,
  Gauge,
  Battery,
  Car,
  Smartphone,
  Activity,
  Zap,
  Route,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Employee } from "@/lib/employees";
import { OfficeLocation, reverseGeocode } from "@/lib/locationUtils";
import { toast } from "sonner";
import { liveApi } from "@/components/helper/livetracking/livetracking";
import branchApi from "@/components/helper/branch/branch";
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";
import { useRealtimeTracking } from "@/hooks/useRealtimeTracking";

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(num) ? num : null;
};

const isValidLatLng = (lat: number | null, lng: number | null): lat is number =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-IN");
};

const escapeCsvValue = (value: unknown) => {
  const normalized = value == null ? "" : String(value);
  const escaped = normalized.replace(/"/g, "\"\"");
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const haversineDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const LIVE_TRACKING_MIN_STAY_MINUTES = 30;
const LIVE_TRACKING_STAY_RADIUS_METERS = 75;

const formatDuration = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const matchesEmployeeId = (left: unknown, right: unknown) => {
  if (left == null || right == null) return false;
  return String(left) === String(right);
};

const parseStoredLocation = (raw?: unknown) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw as Record<string, unknown>;
};

const formatCoordinateLabel = (latitude?: unknown, longitude?: unknown) => {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  if (!isValidLatLng(lat, lng)) return "Unknown location";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

const extractLocationName = (address?: unknown) => {
  const fullAddress = String(address || "").trim();
  if (!fullAddress) return "Unknown location";

  // Try to extract a meaningful location name
  const parts = fullAddress.split(",");
  const firstPart = parts[0]?.trim();

  // If it looks like coordinates, return "Location [lat, lng]"
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(firstPart)) {
    return `Location ${firstPart}`;
  }

  // If the address has multiple parts, the first part is usually the location name
  if (parts.length > 1) {
    return firstPart || "Unknown location";
  }

  // If only one part, use it as is
  return firstPart || fullAddress;
};

const looksLikeCoordinateLabel = (value?: unknown) => {
  const text = String(value || "").trim();
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(text);
};

const formatCoordinates = (latitude?: unknown, longitude?: unknown) => {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  if (!isValidLatLng(lat, lng)) return "";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

const hasOpenAttendanceSession = (attendance: any) => {
  if (!attendance) return false;
  const checkIn = attendance.check_in || attendance.checkIn;
  const checkOut = attendance.check_out || attendance.checkOut;
  return Boolean(checkIn) && !checkOut;
};

const buildStaySegments = (
  points: RouteHistoryPoint[],
  minimumDurationMinutes = LIVE_TRACKING_MIN_STAY_MINUTES,
  mergeRadiusMeters = LIVE_TRACKING_STAY_RADIUS_METERS
) => {
  if (!points.length) return [];

  const segments: Array<{
    startTime: string | null;
    endTime: string | null;
    durationMinutes: number;
    latitude: number;
    longitude: number;
    address: string;
    pointCount: number;
  }> = [];

  let currentSegment = {
    points: [points[0]],
    anchor: points[0],
  };

  const flushSegment = () => {
    const segmentPoints = currentSegment.points;
    const firstPoint = segmentPoints[0];
    const lastPoint = segmentPoints[segmentPoints.length - 1];
    const startedAt = firstPoint?.location_timestamp
      ? new Date(firstPoint.location_timestamp)
      : null;
    const endedAt = lastPoint?.location_timestamp
      ? new Date(lastPoint.location_timestamp)
      : null;

    if (!startedAt || !endedAt) {
      return;
    }

    const durationMinutes = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
    );

    if (durationMinutes < minimumDurationMinutes) {
      return;
    }

    const avgLatitude =
      segmentPoints.reduce((sum, point) => sum + Number(point.latitude || 0), 0) /
      segmentPoints.length;
    const avgLongitude =
      segmentPoints.reduce((sum, point) => sum + Number(point.longitude || 0), 0) /
      segmentPoints.length;

    segments.push({
      startTime: firstPoint.location_timestamp || null,
      endTime: lastPoint.location_timestamp || null,
      durationMinutes,
      latitude: avgLatitude,
      longitude: avgLongitude,
      address:
        segmentPoints
          .map((point) => String(point.address || "").trim())
          .find(Boolean) || formatCoordinateLabel(avgLatitude, avgLongitude),
      pointCount: segmentPoints.length,
    });
  };

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const distanceFromAnchor = haversineDistanceMeters(
      Number(currentSegment.anchor.latitude),
      Number(currentSegment.anchor.longitude),
      Number(point.latitude),
      Number(point.longitude)
    );

    if (distanceFromAnchor <= mergeRadiusMeters) {
      currentSegment.points.push(point);
      continue;
    }

    flushSegment();
    currentSegment = {
      points: [point],
      anchor: point,
    };
  }

  flushSegment();
  return segments;
};

const buildRouteHighlights = (
  points: RouteHistoryPoint[],
  mergeRadiusMeters = 120
) => {
  if (!points.length) return [] as StopSegment[];

  const segments: StopSegment[] = [];
  let currentSegment = {
    points: [points[0]],
    anchor: points[0],
  };

  const flushSegment = () => {
    const segmentPoints = currentSegment.points;
    const firstPoint = segmentPoints[0];
    const lastPoint = segmentPoints[segmentPoints.length - 1];
    if (!firstPoint || !lastPoint) return;

    const avgLatitude =
      segmentPoints.reduce((sum, point) => sum + Number(point.latitude || 0), 0) /
      segmentPoints.length;
    const avgLongitude =
      segmentPoints.reduce((sum, point) => sum + Number(point.longitude || 0), 0) /
      segmentPoints.length;
    const startedAt = firstPoint.location_timestamp
      ? new Date(firstPoint.location_timestamp)
      : null;
    const endedAt = lastPoint.location_timestamp
      ? new Date(lastPoint.location_timestamp)
      : null;

    segments.push({
      startTime: firstPoint.location_timestamp || null,
      endTime: lastPoint.location_timestamp || null,
      durationMinutes:
        startedAt && endedAt
          ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))
          : 0,
      latitude: avgLatitude,
      longitude: avgLongitude,
      address:
        segmentPoints
          .map((point) => String(point.address || "").trim())
          .find(Boolean) || "",
      pointCount: segmentPoints.length,
    });
  };

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const distanceFromAnchor = haversineDistanceMeters(
      Number(currentSegment.anchor.latitude),
      Number(currentSegment.anchor.longitude),
      Number(point.latitude),
      Number(point.longitude)
    );

    if (distanceFromAnchor <= mergeRadiusMeters) {
      currentSegment.points.push(point);
      continue;
    }

    flushSegment();
    currentSegment = {
      points: [point],
      anchor: point,
    };
  }

  flushSegment();
  return segments;
};

const getPrimaryLocationLabel = (address?: unknown, latitude?: unknown, longitude?: unknown) => {
  const resolvedAddress = String(address || "").trim();
  if (resolvedAddress) {
    return {
      name: extractLocationName(resolvedAddress),
      address: resolvedAddress,
    };
  }

  const coordinates = formatCoordinateLabel(latitude, longitude);
  return {
    name: coordinates,
    address: coordinates,
  };
};

interface TrackedEmployee extends Employee {
  dbEmployeeId?: string | number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    timestamp: string;
    speed?: number;
    batteryLevel?: number;
  };
  trackingStatus: "checked-in" | "checked-out";
  lastCheckTime?: string;
  isLiveTrackingEnabled?: boolean;
  employmentType: "full-time" | "part-time" | "contract" | "intern";
  vehicleInfo?: {
    type?: string;
    model?: string;
    registrationNumber?: string;
  };
  deviceInfo?: {
    type?: string;
    model?: string;
    os?: string;
  };
  lastActivity?: string;
  totalDistanceTraveled?: number;
  averageSpeed?: number;
  trackingState?: "active" | "idle" | "offline";
  minutesSinceUpdate?: number | null;
}

type RouteHistoryPoint = {
  id?: string | number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string | null;
  location_timestamp?: string | null;
};

type RouteHistorySummary = {
  pointCount?: number;
  totalDistanceMeters?: number;
  tripDurationMinutes?: number;
  stopCount?: number;
  stayRadiusMeters?: number;
  minimumStayMinutes?: number;
  startedAt?: string | null;
  endedAt?: string | null;
  stops?: StopSegment[];
  currentStay?: StopSegment | null;
  lastSeenAt?: string | null;
  minutesSinceLastPing?: number | null;
  startAddress?: string | null;
  endAddress?: string | null;
  attendance?: any;
};

type StopSegment = {
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  address: string;
  pointCount: number;
};

const formatMinutesAgo = (minutes?: number | null) => {
  if (minutes == null) return "Unknown";
  if (minutes <= 0) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} mins ago`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!mins) return `${hrs}h ago`;
  return `${hrs}h ${mins}m ago`;
};

const getTrackingTone = (state?: string | null) => {
  switch (String(state || "").toLowerCase()) {
    case "active":
      return {
        label: "Live",
        badgeClass: "bg-green-100 text-green-800 hover:bg-green-100",
      };
    case "idle":
      return {
        label: "Idle",
        badgeClass: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      };
    default:
      return {
        label: "Offline",
        badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-100",
      };
  }
};

const normalizeLiveState = (
  state?: string | null,
  minutesSinceUpdate?: number | null,
  hasCurrentLocation?: boolean,
) => {
  const normalized = String(state || "").trim().toLowerCase();

  if (["active", "online", "live", "tracking"].includes(normalized)) {
    return "active" as const;
  }

  if (["idle", "inactive", "stale"].includes(normalized)) {
    return "idle" as const;
  }

  if (hasCurrentLocation) {
    if (typeof minutesSinceUpdate === "number" && Number.isFinite(minutesSinceUpdate)) {
      return minutesSinceUpdate <= 5 ? "active" as const : "idle" as const;
    }
    return "active" as const;
  }

  return "offline" as const;
};

// Helper to create employee marker icon with initials badge and animation
const createEmployeeMarkerIcon = (firstName: string | undefined, lastName: string | undefined, isCheckedIn: boolean) => {
  const statusColor = isCheckedIn ? "#10b981" : "#ef4444";
  const first = (firstName || "?").charAt(0).toUpperCase();
  const last = (lastName || "?").charAt(0).toUpperCase();
  const initials = `${first}${last}`;
  const pulseColor = isCheckedIn ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
      <defs>
        <style>
          @keyframes pulse {
            0% { r: 30; opacity: 0.6; }
            50% { r: 35; opacity: 0.3; }
            100% { r: 30; opacity: 0.6; }
          }
          .pulse-circle {
            animation: pulse 2s ease-in-out infinite;
          }
        </style>
      </defs>
      <circle class="pulse-circle" cx="40" cy="40" r="30" fill="${pulseColor}"/>
      <circle cx="40" cy="40" r="28" fill="white" stroke="${statusColor}" stroke-width="3"/>
      <circle cx="40" cy="40" r="26" fill="${statusColor}" opacity="0.1"/>
      <text x="40" y="46" font-size="20" font-weight="bold" text-anchor="middle" fill="${statusColor}">${initials}</text>
      <circle cx="60" cy="60" r="10" fill="${statusColor}" stroke="white" stroke-width="2"/>
      ${isCheckedIn ? '<circle cx="60" cy="60" r="14" fill="none" stroke="#10b981" stroke-width="2" opacity="0.5"/>' : ''}
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
    scaledSize: { width: 80, height: 80 },
    anchor: { x: 40, y: 40 },
  };
};

const createNavigationPuckIcon = (isSelected: boolean) => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: isSelected ? 9 : 7,
  fillColor: isSelected ? "#1d4ed8" : "#2563eb",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: isSelected ? 4 : 3,
});

export default function LiveTracking() {
  const { hasModuleAccess } = useRole();
  const { user } = useAuth();
  const { isLoaded: isMapLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [travelPaths, setTravelPaths] = useState<Record<string, Array<{ lat: number; lng: number }>>>({});
  const [selectedRoutePoints, setSelectedRoutePoints] = useState<RouteHistoryPoint[]>([]);
  const [selectedRouteSummary, setSelectedRouteSummary] = useState<RouteHistorySummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [mapLoadError, setMapLoadError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("google_maps_blocked") === "1" ? "GOOGLE_MAP_BLOCKED" : null;
  });
  const [mapStyle, setMapStyle] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap");
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [showMetrics, setShowMetrics] = useState(true);
  const [visitedLocations, setVisitedLocations] = useState<StopSegment[]>([]);
  const [visitDateRange, setVisitDateRange] = useState<"today" | "week" | "month" | "all">("today");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [employeeLocationHistories, setEmployeeLocationHistories] = useState<Record<string, StopSegment[]>>({});
  const [employeeHoverMapData, setEmployeeHoverMapData] = useState<
    Record<string, { path: { lat: number; lng: number }[]; markers: { lat: number; lng: number; address: string; duration: number }[] }>
  >({});
  const [hoverDateRange, setHoverDateRange] = useState<"today" | "yesterday" | "week" | "month">("today");
  const [hoverTravelPath, setHoverTravelPath] = useState<{ empId: string; path: { lat: number; lng: number }[] } | null>(null);
  const [hoverStayMarkers, setHoverStayMarkers] = useState<{ empId: string; markers: { lat: number; lng: number; address: string; duration: number }[] } | null>(null);

  const canViewTracking = hasModuleAccess('live_tracking') || hasModuleAccess('attendance');
  const companyId = user?.company_id || user?.companyId;

  const { isConnected, connectionMode, error: realtimeError, lastUpdate } = useRealtimeTracking({
    enabled: Boolean(canViewTracking && companyId),
    companyId: companyId || "0",
    onLocationUpdate: (location) => {
      setEmployees((prev) =>
        prev.map((employee) =>
          String(employee.id) === String(location.employee_id)
            ? {
                ...employee,
                latitude: Number(location.latitude) || employee.latitude || null,
                longitude: Number(location.longitude) || employee.longitude || null,
                accuracy: Number(location.accuracy) || null,
                address: location.address || employee.address || null,
                locationTimestamp: location.location_timestamp || new Date().toISOString(),
                isTracking: true,
                trackingStatus: "active",
                minutesSinceUpdate: 0,
              }
            : employee
        )
      );
    },
  });

  // CSV export function for location history
  const exportLocationHistoryCSV = (employeeName: string, timeline: any[]) => {
    const headers = ['Type', 'Date', 'Time', 'Location Address', 'Latitude', 'Longitude', 'Duration'];
    const rows = timeline.map((event) => {
      const date = new Date(event.time);
      const dateStr = date.toLocaleDateString('en-IN');
      const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const type = event.type === 'checkin' ? 'CHECK-IN' : event.type === 'checkout' ? 'CHECK-OUT' : 'VISIT';
      const address = event.type === 'stop' ? event.address : (event.location?.address || '');
      const lat = event.type === 'stop' ? event.latitude : (event.location?.latitude || '');
      const lng = event.type === 'stop' ? event.longitude : (event.location?.longitude || '');
      const duration = event.type === 'stop' && event.durationMinutes > 0
        ? formatDuration(event.durationMinutes)
        : event.type === 'checkin' ? 'Start' : event.type === 'checkout' ? 'End' : '-';
      return [type, dateStr, timeStr, address, lat, lng, duration];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${employeeName.replace(/\s+/g, '_')}_location_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };
  const shouldUseFallbackMap =
    !GOOGLE_MAPS_API_KEY ||
    mapLoadError === "GOOGLE_MAP_BLOCKED" ||
    Boolean(loadError);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapLoadError("GOOGLE_MAP_BLOCKED");
      return;
    }

    if (loadError) {
      if (typeof window !== "undefined") {
        localStorage.setItem("google_maps_blocked", "1");
      }
      setMapLoadError("GOOGLE_MAP_BLOCKED");
    }
  }, [loadError]);

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCheckingIn(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        address: "Current Location"
      };

      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        toast.success("Successfully checked in!", {
          description: "Your location has been recorded for tracking."
        });
      } else {
        throw new Error('Failed to check in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error("Failed to check in", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => {
    if (!canViewTracking) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, attendanceResponse] = await Promise.all([
          liveApi.getEmployees(),
          liveApi.getAttendanceLogs({ limit: 500 })
        ]);

        if (employeesResponse.error) {
          toast.error("Failed to fetch employees", {
            description: employeesResponse.error
          });
        } else {
          setEmployees(employeesResponse.data || []);
        }

        if (attendanceResponse.error) {
          toast.error("Failed to fetch attendance logs", {
            description: attendanceResponse.error
          });
        } else {
          setAttendanceLogs(attendanceResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load tracking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canViewTracking]);

  useEffect(() => {
    if (!canViewTracking) return;

    const fetchBranchLocations = async () => {
      try {
        const result = await branchApi.getBranches();
        if (!result.data) {
          setOfficeLocations([]);
          return;
        }

        const mappedLocations: OfficeLocation[] = result.data
          .map((branch) => {
            const [latRaw, lngRaw] = String(branch.coordinates || "")
              .split(",")
              .map((value) => value.trim());
            const latitude = Number(latRaw);
            const longitude = Number(lngRaw);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return {
              id: String(branch.id),
              name: branch.name || "Office",
              latitude,
              longitude,
              address: branch.address || "",
              city: "",
              country: "",
            } as OfficeLocation;
          })
          .filter((item): item is OfficeLocation => item !== null);

        setOfficeLocations(mappedLocations);
      } catch (error) {
        console.error("Error loading branch office locations:", error);
        setOfficeLocations([]);
      }
    };

    fetchBranchLocations();
  }, [canViewTracking]);

  useEffect(() => {
    if (!autoRefresh || !canViewTracking || connectionMode === "realtime") return;

    const interval = setInterval(async () => {
      try {
        const [employeesResponse, attendanceResponse] = await Promise.all([
          liveApi.getEmployees(),
          liveApi.getAttendanceLogs({ limit: 500 })
        ]);

        if (!employeesResponse.error) {
          setEmployees(employeesResponse.data || []);
        }

        if (!attendanceResponse.error) {
          setAttendanceLogs(attendanceResponse.data || []);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, canViewTracking, refreshInterval, connectionMode]);

  const trackedEmployees = useMemo(() => {
    if (!canViewTracking || employees.length === 0) {
      return [];
    }

    if (employees.length > 0) {
      return employees.map((emp): TrackedEmployee => {
        const latestAttendance = attendanceLogs
          .filter((log) => matchesEmployeeId(log.employee_id, emp.id) || matchesEmployeeId(log.employeeId, emp.id))
          .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime())[0];

        const hasRecentLivePing = Boolean((emp as any).locationTimestamp || (emp as any).timestamp);
        const employeeMarkedActive =
          String((emp as any).trackingStatus || "").toLowerCase() === "active" ||
          Boolean((emp as any).isTracking);
        const isCheckedIn =
          hasOpenAttendanceSession(latestAttendance) || (employeeMarkedActive && hasRecentLivePing);
        const parsedCheckInLocation = parseStoredLocation(latestAttendance?.check_in_location);
        const parsedCheckOutLocation = parseStoredLocation(latestAttendance?.check_out_location);
        const fallbackAddress =
          String((parsedCheckInLocation as any)?.address || "").trim() ||
          formatCoordinateLabel(
            (parsedCheckInLocation as any)?.latitude,
            (parsedCheckInLocation as any)?.longitude
          );

        let currentLocation:
          | (TrackedEmployee["currentLocation"] & {
            speed?: number;
            batteryLevel?: number;
          })
          | undefined;
        const empLat = toFiniteNumber((emp as any).latitude);
        const empLng = toFiniteNumber((emp as any).longitude);
        if (isCheckedIn && isValidLatLng(empLat, empLng)) {
          const empAccuracy = toFiniteNumber((emp as any).accuracy);
          currentLocation = {
            latitude: empLat,
            longitude: empLng,
            accuracy: empAccuracy ?? 10,
            address:
              String(emp.address || "").trim() ||
              fallbackAddress ||
              formatCoordinateLabel(empLat, empLng),
            timestamp: emp.locationTimestamp || new Date().toISOString(),
            speed: (emp as any).speed,
            batteryLevel: (emp as any).battery_level,
          };
        } else if (isCheckedIn && latestAttendance?.check_in_location) {
          try {
            const locationData = parseStoredLocation(latestAttendance.check_in_location);
            const checkInLat = toFiniteNumber(locationData?.latitude);
            const checkInLng = toFiniteNumber(locationData?.longitude);
            const checkInAccuracy = toFiniteNumber(locationData?.accuracy);
            if (isValidLatLng(checkInLat, checkInLng)) {
              currentLocation = {
                latitude: checkInLat,
                longitude: checkInLng,
                accuracy: checkInAccuracy ?? 10,
                address:
                  String(locationData?.address || "").trim() ||
                  formatCoordinateLabel(checkInLat, checkInLng),
                timestamp: latestAttendance.check_in,
                speed: (emp as any).speed,
                batteryLevel: (emp as any).battery_level,
              };
            }
          } catch (error) {
            console.error('Error parsing check-in location:', error);
          }
        }

        const lastKnownLocation = latestAttendance?.check_out
          ? getPrimaryLocationLabel(
            (parsedCheckOutLocation as any)?.address,
            (parsedCheckOutLocation as any)?.latitude,
            (parsedCheckOutLocation as any)?.longitude
          )
          : getPrimaryLocationLabel(
            currentLocation?.address || fallbackAddress,
            currentLocation?.latitude ?? (parsedCheckInLocation as any)?.latitude,
            currentLocation?.longitude ?? (parsedCheckInLocation as any)?.longitude
          );

        const normalizedMinutesSinceUpdate = toFiniteNumber((emp as any).minutesSinceUpdate);
        const trackingState = isCheckedIn
          ? normalizeLiveState(
            String((emp as any).trackingStatus || ""),
            normalizedMinutesSinceUpdate,
            Boolean(currentLocation),
          )
          : "offline";

        return {
          ...emp,
          dbEmployeeId: emp.id,
          id: emp.employee_id || emp.id,
          firstName: emp.first_name || emp.firstName,
          lastName: emp.last_name || emp.lastName,
          email: emp.email,
          department: emp.department,
          phone: emp.phone,
          photoUrl: emp.photo_url || emp.photoUrl,
          location: lastKnownLocation.address,
          isLiveTrackingEnabled: (emp as any).location_tracking_enabled === 1 || (emp as any).isLiveTrackingEnabled,
          currentLocation,
          trackingStatus: isCheckedIn ? "checked-in" : "checked-out",
          trackingState,
          minutesSinceUpdate: normalizedMinutesSinceUpdate,
          lastCheckTime: latestAttendance?.check_in ? new Date(latestAttendance.check_in).toLocaleTimeString("en-IN") : undefined,
          employmentType: (emp as any).employmentType || "full-time" as const,
          vehicleInfo: (emp as any).vehicle_info,
          deviceInfo: (emp as any).device_info,
          lastActivity: (emp as any).last_activity,
          totalDistanceTraveled: (emp as any).total_distance_traveled,
          averageSpeed: (emp as any).average_speed,
        };
      });
    }

    return [];
  }, [employees, attendanceLogs, canViewTracking]);

  const filteredEmployees = useMemo(() => {
    if (!canViewTracking) return [];

    return trackedEmployees
      .filter((emp) => {
        const firstName = String(emp.firstName || "");
        const lastName = String(emp.lastName || "");
        const email = String(emp.email || "");
        const matchesSearch =
          firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!showAll) {
          return matchesSearch && emp.trackingStatus === "checked-in";
        }
        return matchesSearch;
      })
      .sort((a, b) => b.trackingStatus.localeCompare(a.trackingStatus));
  }, [trackedEmployees, searchTerm, showAll, canViewTracking]);

  const exportRows = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const attendanceEmployeeId = emp.dbEmployeeId ?? emp.id;
      const latestAttendance = attendanceLogs
        .filter((log) =>
          matchesEmployeeId(log.employee_id, attendanceEmployeeId) ||
          matchesEmployeeId(log.employeeId, attendanceEmployeeId)
        )
        .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime())[0];

      return {
        employeeId: emp.id,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        department: emp.department || "",
        phone: emp.phone || "",
        trackingStatus: emp.trackingStatus,
        location: emp.currentLocation?.address || emp.location || "",
        latitude: emp.currentLocation?.latitude ?? "",
        longitude: emp.currentLocation?.longitude ?? "",
        checkInTime: formatDateTime(latestAttendance?.check_in || latestAttendance?.checkIn),
        checkOutTime: formatDateTime(latestAttendance?.check_out || latestAttendance?.checkOut),
        lastLocationUpdate: formatDateTime(emp.currentLocation?.timestamp),
      };
    });
  }, [filteredEmployees, attendanceLogs]);

  const mapCenter = useMemo(() => {
    if (!canViewTracking) return { lat: 13.0827, lng: 80.2707 };

    const firstTrackedEmp = trackedEmployees.find((e) => e.currentLocation);
    return firstTrackedEmp
      ? {
        lat: firstTrackedEmp.currentLocation!.latitude,
        lng: firstTrackedEmp.currentLocation!.longitude,
      }
      : { lat: 13.0827, lng: 80.2707 };
  }, [trackedEmployees, canViewTracking]);

  const fallbackMapUrl = useMemo(() => {
    const lat = mapCenter.lat;
    const lng = mapCenter.lng;
    const delta = 0.08;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
  }, [mapCenter]);

  useEffect(() => {
    if (!canViewTracking) return;

    setTravelPaths((prev) => {
      const next = { ...prev };

      trackedEmployees.forEach((emp) => {
        if (emp.trackingStatus !== "checked-in" || !emp.currentLocation) return;

        const pointLat = toFiniteNumber(emp.currentLocation.latitude);
        const pointLng = toFiniteNumber(emp.currentLocation.longitude);
        if (!isValidLatLng(pointLat, pointLng)) return;
        const newPoint = {
          lat: pointLat,
          lng: pointLng,
        };

        const currentPath = next[emp.id] || [];
        const lastPoint = currentPath[currentPath.length - 1];

        // Avoid adding duplicate points when location has not changed.
        if (lastPoint && lastPoint.lat === newPoint.lat && lastPoint.lng === newPoint.lng) {
          return;
        }

        next[emp.id] = [...currentPath, newPoint].slice(-500);
      });

      return next;
    });
  }, [trackedEmployees, canViewTracking]);

  useEffect(() => {
    if (!canViewTracking || selectedEmployee || trackedEmployees.length === 0) {
      return;
    }

    const firstActiveEmployee = trackedEmployees.find(
      (emp) => emp.trackingStatus === "checked-in" && emp.currentLocation
    );

    if (firstActiveEmployee) {
      setSelectedEmployee(String(firstActiveEmployee.id));
      setSelectedMarker(`emp-${firstActiveEmployee.id}`);
    }
  }, [trackedEmployees, selectedEmployee, canViewTracking]);

  useEffect(() => {
    if (!lastUpdate || !selectedEmployee) return;

    const selectedEmp = trackedEmployees.find((emp) => String(emp.id) === String(selectedEmployee));
    if (!selectedEmp) return;

    const selectedDbId = String(selectedEmp.dbEmployeeId ?? selectedEmp.id);
    if (String(lastUpdate.employee_id) !== selectedDbId) return;

    const latitude = Number(lastUpdate.latitude);
    const longitude = Number(lastUpdate.longitude);
    if (!isValidLatLng(latitude, longitude)) return;

    setSelectedRoutePoints((prev) => {
      const nextPoint = {
        id: String(lastUpdate.id || `${Date.now()}`),
        employee_id: lastUpdate.employee_id,
        latitude,
        longitude,
        accuracy: lastUpdate.accuracy ?? null,
        address: lastUpdate.address || "",
        location_timestamp: lastUpdate.location_timestamp || new Date().toISOString(),
      } as RouteHistoryPoint;

      const lastPoint = prev[prev.length - 1];
      if (lastPoint && lastPoint.latitude === nextPoint.latitude && lastPoint.longitude === nextPoint.longitude) {
        return prev;
      }

      return [...prev, nextPoint].slice(-1000);
    });
  }, [lastUpdate, selectedEmployee, trackedEmployees]);

  useEffect(() => {
    if (!mapInstance || filteredEmployees.length === 0 || !canViewTracking) return;
    if (isAnimating) return;
    if (selectedRoutePoints.length >= 2) return;

    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return;
    }

    try {
      const bounds = new window.google.maps.LatLngBounds();
      filteredEmployees.forEach((emp) => {
        if (emp.currentLocation) {
          bounds.extend({
            lat: emp.currentLocation.latitude,
            lng: emp.currentLocation.longitude,
          });
        }
      });

      officeLocations.forEach((office) => {
        bounds.extend({ lat: office.latitude, lng: office.longitude });
      });

      mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  }, [mapInstance, filteredEmployees, officeLocations, canViewTracking, isAnimating]);

  useEffect(() => {
    if (!mapInstance || selectedRoutePoints.length < 2) return;
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return;
    }

    try {
      const bounds = new window.google.maps.LatLngBounds();

      selectedRoutePoints.forEach((point) => {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      });

      mapInstance.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
    } catch (error) {
      console.error("Error fitting selected route bounds:", error);
    }
  }, [mapInstance, selectedRoutePoints]);

  // Fetch location history for hover tooltip - get all GPS points with addresses and travel path
  const fetchEmployeeLocationHistory = async (employeeDbId: string | number, empId?: string) => {
    if (!employeeDbId) return;

    const cacheKey = String(employeeDbId);
    if (employeeLocationHistories[cacheKey] && employeeHoverMapData[cacheKey]) {
      if (empId) {
        setHoverTravelPath({ empId, path: employeeHoverMapData[cacheKey].path });
        setHoverStayMarkers({ empId, markers: employeeHoverMapData[cacheKey].markers });
      }
      return;
    }

    try {
      const result = await liveApi.getLiveLocationHistory(employeeDbId, { limit: 200 });
      if (!result.error && result.data) {
        const rawPoints = result.data.points || [];

        // Get check-in and check-out times for this employee
        const empAttendance = attendanceLogs
          .filter((log) => matchesEmployeeId(log.employee_id, employeeDbId) || matchesEmployeeId(log.employeeId, employeeDbId))
          .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime());

        const latestCheckIn = empAttendance[0]?.check_in || empAttendance[0]?.checkIn;
        const latestCheckOut = empAttendance[0]?.check_out || empAttendance[0]?.checkOut;

        const checkInTime = latestCheckIn ? new Date(latestCheckIn).getTime() : null;
        const checkOutTime = latestCheckOut ? new Date(latestCheckOut).getTime() : null;

        // Filter points to only include those between check-in and check-out
        const filteredPoints = rawPoints.filter((p: any) => {
          if (!p.location_timestamp) return false;
          const pointTime = new Date(p.location_timestamp).getTime();
          if (checkInTime && pointTime < checkInTime) return false; // Before check-in
          if (checkOutTime && pointTime > checkOutTime) return false; // After check-out
          return isValidLatLng(Number(p.latitude), Number(p.longitude));
        });

        // Build travel path (only points between check-in and check-out)
        const travelPath = filteredPoints
          .sort((a: any, b: any) => new Date(a.location_timestamp).getTime() - new Date(b.location_timestamp).getTime())
          .map((p: any) => ({
            lat: Number(p.latitude),
            lng: Number(p.longitude),
          }));

        const sortedPoints = [...filteredPoints]
          .sort((a: any, b: any) => new Date(a.location_timestamp).getTime() - new Date(b.location_timestamp).getTime());
        const groupedStops = buildStaySegments(
          sortedPoints.map((point: any) => ({
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
            address: point.address || null,
            location_timestamp: point.location_timestamp || null,
          })),
          LIVE_TRACKING_MIN_STAY_MINUTES,
          LIVE_TRACKING_STAY_RADIUS_METERS
        );
        const routeHighlights = buildRouteHighlights(
          sortedPoints.map((point: any) => ({
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
            address: point.address || null,
            location_timestamp: point.location_timestamp || null,
          }))
        );

        const resolveSegmentAddresses = async (segments: StopSegment[]) =>
          Promise.all(
            segments.map(async (segment) => {
              if (String(segment.address || "").trim()) {
                return segment;
              }

              try {
                const resolvedAddress = await reverseGeocode(segment.latitude, segment.longitude);
                return {
                  ...segment,
                  address:
                    String(resolvedAddress || "").trim() ||
                    formatCoordinateLabel(segment.latitude, segment.longitude),
                };
              } catch (error) {
                console.warn("Failed to reverse geocode hover location", error);
                return {
                  ...segment,
                  address: formatCoordinateLabel(segment.latitude, segment.longitude),
                };
              }
            })
          );

        const [resolvedStops, resolvedHighlights] = await Promise.all([
          resolveSegmentAddresses(groupedStops),
          resolveSegmentAddresses(routeHighlights),
        ]);

        const dedupedHighlights = resolvedHighlights.filter((segment, index, allSegments) => {
          if (!segment.address) return true;
          if (index === 0) return true;
          const previous = allSegments[index - 1];
          return (
            extractLocationName(previous.address) !== extractLocationName(segment.address) ||
            haversineDistanceMeters(
              previous.latitude,
              previous.longitude,
              segment.latitude,
              segment.longitude
            ) > 100
          );
        });

        const stayMarkers = resolvedStops.map((stop) => ({
          lat: stop.latitude,
          lng: stop.longitude,
          address: stop.address,
          duration: stop.durationMinutes,
        }));

        // Set travel path and stay markers for visualization
        if (empId) {
          setHoverTravelPath({ empId, path: travelPath });
          setHoverStayMarkers({ empId, markers: stayMarkers });
        }

        setEmployeeHoverMapData((prev) => ({
          ...prev,
          [cacheKey]: {
            path: travelPath,
            markers: stayMarkers,
          },
        }));
        setEmployeeLocationHistories((prev) => ({
          ...prev,
          [cacheKey]: dedupedHighlights as StopSegment[],
        }));
      }
    } catch (error) {
      console.error('Error fetching location history:', error);
    }
  };

  const handleRefresh = async () => {
    if (!canViewTracking) return;

    try {
      const [employeesResponse, attendanceResponse] = await Promise.all([
        liveApi.getEmployees(),
        liveApi.getAttendanceLogs({ limit: 500 })
      ]);

      if (!employeesResponse.error) {
        setEmployees(employeesResponse.data || []);
      }

      if (!attendanceResponse.error) {
        setAttendanceLogs(attendanceResponse.data || []);
      }

      toast.success("Location data refreshed!", {
        description: "All tracked employees updated",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }
  };

  const handleViewDetails = (empId: string) => {
    if (!canViewTracking) return;
    setSelectedEmployee(selectedEmployee === empId ? null : empId);
  };

  useEffect(() => {
    if (!canViewTracking || !selectedEmployee) {
      setSelectedRoutePoints([]);
      setSelectedRouteSummary(null);
      return;
    }

    const selectedEmp = trackedEmployees.find((emp) => String(emp.id) === String(selectedEmployee));
    const employeeDbId = selectedEmp?.dbEmployeeId ?? selectedEmp?.id;

    if (!employeeDbId) {
      setSelectedRoutePoints([]);
      setSelectedRouteSummary(null);
      return;
    }

    const latestAttendance = attendanceLogs
      .filter((log) => String(log.employee_id ?? log.employeeId) === String(employeeDbId))
      .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime())[0];

    const params: Record<string, any> = { limit: 1000 };

    // Calculate date range based on selection
    const now = new Date();
    let startDate: Date | null = null;

    if (visitDateRange === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (visitDateRange === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (visitDateRange === "month") {
      startDate = new Date(now.setDate(now.getDate() - 30));
    }

    if (startDate) {
      params.startDate = startDate.toISOString();
    }

    if (latestAttendance?.check_in) {
      const checkInDate = new Date(latestAttendance.check_in);
      if (!startDate || checkInDate > startDate) {
        params.startDate = checkInDate.toISOString();
      }
    }

    if (latestAttendance?.check_out) {
      params.endDate = new Date(latestAttendance.check_out).toISOString();
    }

    let cancelled = false;

    const fetchRouteHistory = async () => {
      setRouteLoading(true);
      const result = await liveApi.getLiveLocationHistory(employeeDbId, {
        ...params,
        minimumStayMinutes: LIVE_TRACKING_MIN_STAY_MINUTES,
        stayRadiusMeters: LIVE_TRACKING_STAY_RADIUS_METERS,
      });
      if (cancelled) return;

      if (result.error) {
        toast.error("Failed to load route history", { description: result.error });
        setSelectedRoutePoints([]);
        setSelectedRouteSummary(null);
      } else {
        const routePoints = (result.data?.points || [])
          .map((point) => ({
            ...point,
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
          }))
          .filter((point) => isValidLatLng(point.latitude, point.longitude));

        let computedDistance = 0;
        for (let i = 1; i < routePoints.length; i += 1) {
          computedDistance += haversineDistanceMeters(
            routePoints[i - 1].latitude,
            routePoints[i - 1].longitude,
            routePoints[i].latitude,
            routePoints[i].longitude
          );
        }

        const parsedCheckInLocation = parseStoredLocation(latestAttendance?.check_in_location);
        const parsedCheckOutLocation = parseStoredLocation(latestAttendance?.check_out_location);
        const firstRoutePoint = routePoints[0];
        const lastRoutePoint = routePoints[routePoints.length - 1];
        const fallbackStartAddress =
          String(firstRoutePoint?.address || "").trim() ||
          String((parsedCheckInLocation as any)?.address || "").trim() ||
          selectedEmp?.currentLocation?.address ||
          formatCoordinateLabel(
            firstRoutePoint?.latitude ?? (parsedCheckInLocation as any)?.latitude,
            firstRoutePoint?.longitude ?? (parsedCheckInLocation as any)?.longitude
          );
        const fallbackEndAddress =
          String(lastRoutePoint?.address || "").trim() ||
          String((parsedCheckOutLocation as any)?.address || "").trim() ||
          String((parsedCheckInLocation as any)?.address || "").trim() ||
          selectedEmp?.currentLocation?.address ||
          formatCoordinateLabel(
            lastRoutePoint?.latitude ??
            (parsedCheckOutLocation as any)?.latitude ??
            (parsedCheckInLocation as any)?.latitude,
            lastRoutePoint?.longitude ??
            (parsedCheckOutLocation as any)?.longitude ??
            (parsedCheckInLocation as any)?.longitude
          );

        let resolvedEndAddress = result.data?.summary?.endAddress || fallbackEndAddress;
        if (
          looksLikeCoordinateLabel(resolvedEndAddress) &&
          lastRoutePoint &&
          !String(lastRoutePoint.address || "").trim()
        ) {
          try {
            const reverseGeocoded = await reverseGeocode(
              Number(lastRoutePoint.latitude),
              Number(lastRoutePoint.longitude)
            );
            if (reverseGeocoded) {
              resolvedEndAddress = reverseGeocoded;
            }
          } catch (error) {
            console.warn("Failed to reverse geocode current travel location", error);
          }
        }

        setSelectedRoutePoints(routePoints);
        setTravelPaths((prev) => ({
          ...prev,
          [String(selectedEmp?.id || selectedEmployee)]: routePoints.map((point) => ({
            lat: point.latitude,
            lng: point.longitude,
          })),
        }));
        setSelectedRouteSummary({
          ...(result.data?.summary || {}),
          totalDistanceMeters:
            result.data?.summary?.totalDistanceMeters != null
              ? result.data.summary.totalDistanceMeters
              : computedDistance,
          startAddress: result.data?.summary?.startAddress || fallbackStartAddress,
          endAddress: resolvedEndAddress,
        });

        const apiStops = Array.isArray(result.data?.summary?.stops)
          ? (result.data?.summary?.stops as StopSegment[])
          : [];
        const fallbackStops = buildStaySegments(
          routePoints,
          LIVE_TRACKING_MIN_STAY_MINUTES,
          LIVE_TRACKING_STAY_RADIUS_METERS
        ) as StopSegment[];
        const normalizedStops = (apiStops.length ? apiStops : fallbackStops).map((stop) => ({
          ...stop,
          address:
            String(stop.address || "").trim() ||
            formatCoordinateLabel(stop.latitude, stop.longitude),
        }));
        setVisitedLocations(normalizedStops);
        setSelectedRouteSummary((previous) =>
          previous
            ? {
              ...previous,
              minimumStayMinutes:
                previous.minimumStayMinutes || LIVE_TRACKING_MIN_STAY_MINUTES,
              stayRadiusMeters:
                previous.stayRadiusMeters || LIVE_TRACKING_STAY_RADIUS_METERS,
              stops: normalizedStops,
              stopCount: previous.stopCount || normalizedStops.length,
            }
            : previous
        );
      }

      setRouteLoading(false);
    };

    fetchRouteHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedEmployee, trackedEmployees, attendanceLogs, canViewTracking, visitDateRange]);

  const handleExportCsv = () => {
    if (selectedEmployee && selectedRoutePoints.length > 0) {
      const selectedEmp = trackedEmployees.find(
        (emp) => String(emp.id) === String(selectedEmployee)
      );
      const staySegments =
        selectedRouteSummary?.stops?.length
          ? selectedRouteSummary.stops
          : (buildStaySegments(selectedRoutePoints) as StopSegment[]);
      const detailedHeaders = [
        "Row Type",
        "Employee ID",
        "Employee Name",
        "Department",
        "Status",
        "Location Name",
        "Address",
        "Latitude",
        "Longitude",
        "Start Time",
        "End Time",
        "Duration Minutes",
        "Accuracy",
        "Point Count",
      ];

      const routeRows = selectedRoutePoints.map((point) => [
        "Route Point",
        selectedEmp?.id || selectedEmployee,
        `${selectedEmp?.firstName || ""} ${selectedEmp?.lastName || ""}`.trim(),
        selectedEmp?.department || "",
        selectedEmp?.trackingStatus || "",
        extractLocationName(
          String(point.address || "").trim() ||
          formatCoordinateLabel(point.latitude, point.longitude)
        ),
        String(point.address || "").trim() ||
        formatCoordinateLabel(point.latitude, point.longitude),
        point.latitude,
        point.longitude,
        formatDateTime(point.location_timestamp),
        "",
        "",
        point.accuracy ?? "",
        1,
      ]);

      const stayRows = staySegments.map((segment) => [
        `Stayed ${LIVE_TRACKING_MIN_STAY_MINUTES}+ Minutes`,
        selectedEmp?.id || selectedEmployee,
        `${selectedEmp?.firstName || ""} ${selectedEmp?.lastName || ""}`.trim(),
        selectedEmp?.department || "",
        selectedEmp?.trackingStatus || "",
        extractLocationName(segment.address),
        segment.address,
        segment.latitude,
        segment.longitude,
        formatDateTime(segment.startTime),
        formatDateTime(segment.endTime),
        segment.durationMinutes,
        "",
        segment.pointCount,
      ]);

      const csvContent = [
        detailedHeaders.join(","),
        ...routeRows.map((row) => row.map(escapeCsvValue).join(",")),
        ...(stayRows.length
          ? ["", detailedHeaders.join(","), ...stayRows.map((row) => row.map(escapeCsvValue).join(","))]
          : []),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateLabel = new Date().toISOString().slice(0, 10);
      const employeeLabel = String(selectedEmp?.id || selectedEmployee).replace(/[^\w-]+/g, "-");

      link.href = url;
      link.setAttribute("download", `live-tracking-${employeeLabel}-${dateLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Selected employee travel history exported");
      return;
    }

    if (!exportRows.length) {
      toast.error("No live tracking records available to export");
      return;
    }

    const headers = [
      "Employee ID",
      "Name",
      "Department",
      "Phone",
      "Tracking Status",
      "Location Name",
      "Location",
      "Latitude",
      "Longitude",
      "Check In Time",
      "Check Out Time",
      "Last Location Update",
    ];

    const csvContent = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.employeeId,
          row.name,
          row.department,
          row.phone,
          row.trackingStatus,
          extractLocationName(row.location),
          row.location,
          row.latitude,
          row.longitude,
          row.checkInTime,
          row.checkOutTime,
          row.lastLocationUpdate,
        ]
          .map(escapeCsvValue)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateLabel = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute("download", `live-tracking-${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Live tracking CSV exported");
  };

  const handleExportVisitedLocations = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }

    toast.info(`Selected employee: ${selectedEmployee}`);
    toast.info(`Visited locations count: ${visitedLocations.length}`);

    if (visitedLocations.length === 0) {
      toast.error("No visited locations to export. Select a different date range or ensure the employee has location history.");
      return;
    }

    const selectedEmp = trackedEmployees.find(
      (emp) => String(emp.id) === String(selectedEmployee)
    );

    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Visit Number",
      "Location Name",
      "Full Address",
      "Latitude",
      "Longitude",
      "Arrival Time",
      "Departure Time",
      "Duration (Minutes)",
      "Time Spent",
    ];

    const csvRows = visitedLocations.map((visit, index) => {
      // Force location name to always have a value
      const locationName = visit.address
        ? extractLocationName(visit.address)
        : `Location ${visit.latitude?.toFixed(6)}, ${visit.longitude?.toFixed(6)}`;

      const fullAddress = visit.address
        ? visit.address
        : `${visit.latitude?.toFixed(6)}, ${visit.longitude?.toFixed(6)}`;

      toast.info(`Visit ${index + 1}: ${locationName}`);

      const row = [
        selectedEmp?.id || selectedEmployee,
        `${selectedEmp?.firstName || ""} ${selectedEmp?.lastName || ""}`.trim(),
        selectedEmp?.department || "",
        index + 1,
        locationName,
        fullAddress,
        visit.latitude,
        visit.longitude,
        formatDateTime(visit.startTime),
        formatDateTime(visit.endTime),
        visit.durationMinutes,
        formatDuration(visit.durationMinutes),
      ];
      return row.map(escapeCsvValue).join(",");
    });

    const csvContent = [
      headers.join(","),
      ...csvRows,
    ].join("\n");

    toast.info(`CSV content length: ${csvContent.length}`);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateLabel = new Date().toISOString().slice(0, 10);
    const employeeLabel = String(selectedEmp?.id || selectedEmployee).replace(/[^\w-]+/g, "-");

    link.href = url;
    link.setAttribute("download", `visited-locations-${employeeLabel}-${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${visitedLocations.length} visited locations successfully`);
  };

  const mapOptions = useMemo(() => {
    if (!canViewTracking) return {};
    return {
      zoom: 12,
      mapTypeControl: true,
      mapTypeId: mapStyle,
      streetViewControl: false,
      fullscreenControl: true,
    };
  }, [canViewTracking, mapStyle]);

  const noTrackingAccessView = (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Employee Check-In</CardTitle>
              <CardDescription>
                Check in to start location tracking for your travel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <MapPin className="w-4 h-4" />
                <AlertDescription>
                  Location tracking will start after you check in. Your movement will be monitored while you travel.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full"
                size="lg"
              >
                {checkingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Check In Now
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>After check-in, your location will be tracked</p>
                <p>when you travel to places like Egmore</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );

  const trackingView = (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <Navigation2 className="w-8 h-8 text-blue-600 flex-shrink-0" />
            Live Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Real-time location tracking of employees with tracking enabled
          </p>
        </div>

        <Alert className={connectionMode === "realtime" ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
          <AlertDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {connectionMode === "realtime"
                ? "Realtime socket connected"
                : connectionMode === "polling"
                  ? "Realtime unavailable. Using polling refresh"
                  : "Connecting to live tracking..."}
            </span>
            {isConnected && <Badge className="bg-green-600">Live</Badge>}
            {realtimeError && <span className="text-amber-700">{realtimeError}</span>}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tracked Employees</div>
              <div className="text-3xl font-bold mt-2">{trackedEmployees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Currently Active</div>
              <div className="text-3xl font-bold mt-2 text-green-600">
                {trackedEmployees.filter((e) => e.trackingStatus === "checked-in").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Checked Out</div>
              <div className="text-3xl font-bold mt-2 text-gray-600">
                {trackedEmployees.filter((e) => e.trackingStatus === "checked-out").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
              <div className="text-lg font-bold mt-2">{new Date().toLocaleTimeString("en-IN")}</div>
            </CardContent>
          </Card>
        </div>

        {showMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <div className="text-sm font-medium text-blue-900">Average Speed</div>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {(() => {
                    const activeEmployees = trackedEmployees.filter((e) => e.trackingStatus === "checked-in" && e.currentLocation?.speed);
                    if (activeEmployees.length === 0) return "0 km/h";
                    const avgSpeed = activeEmployees.reduce((sum, e) => sum + (e.currentLocation?.speed || 0), 0) / activeEmployees.length;
                    return `${avgSpeed.toFixed(1)} km/h`;
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-5 h-5 text-green-600" />
                  <div className="text-sm font-medium text-green-900">Avg Battery Level</div>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {(() => {
                    const employeesWithBattery = trackedEmployees.filter((e) => e.currentLocation?.batteryLevel);
                    if (employeesWithBattery.length === 0) return "N/A";
                    const avgBattery = employeesWithBattery.reduce((sum, e) => sum + (e.currentLocation?.batteryLevel || 0), 0) / employeesWithBattery.length;
                    return `${avgBattery.toFixed(0)}%`;
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-5 h-5 text-purple-600" />
                  <div className="text-sm font-medium text-purple-900">Total Distance</div>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {(() => {
                    const totalDistance = trackedEmployees.reduce((sum, e) => sum + (e.totalDistanceTraveled || 0), 0);
                    return `${(totalDistance / 1000).toFixed(2)} km`;
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <div className="text-sm font-medium text-orange-900">Active Devices</div>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {trackedEmployees.filter((e) => e.deviceInfo).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Map & Tracking Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Locations
              </Button>
              <Button onClick={handleExportCsv} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              {selectedEmployee && (
                <Button onClick={handleExportVisitedLocations} variant="outline" size="sm" className="gap-2" disabled={isReverseGeocoding || routeLoading}>
                  <Route className="w-4 h-4" />
                  {isReverseGeocoding ? "Loading..." : "Export Visits"}
                </Button>
              )}
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Auto Refresh {autoRefresh ? "ON" : "OFF"}
              </Button>
              <Button onClick={() => setShowAll(!showAll)} variant={showAll ? "default" : "outline"} size="sm">
                {showAll ? "All Employees" : "Checked In Only"}
              </Button>
              <Button
                onClick={() => setShowMetrics(!showMetrics)}
                variant={showMetrics ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Activity className="w-4 h-4" />
                Metrics {showMetrics ? "ON" : "OFF"}
              </Button>

              <div className="flex gap-2 border-l pl-2 ml-2 items-center">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <select
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  <option value="roadmap">Roadmap</option>
                  <option value="satellite">Satellite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="terrain">Terrain</option>
                </select>
              </div>

              <div className="flex gap-2 border-l pl-2 ml-2 items-center">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1min</option>
                  <option value={300}>5min</option>
                </select>
              </div>

              <div className="flex gap-2 border-l pl-2 ml-2">
                <Button
                  onClick={() => {
                    const hasCheckedInEmployees = trackedEmployees.some((emp) => emp.trackingStatus === "checked-in");
                    if (!hasCheckedInEmployees) {
                      toast.error("No checked-in employees to track");
                      return;
                    }
                    setIsAnimating(true);
                  }}
                  variant={isAnimating ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  disabled={isAnimating}
                >
                  <Play className="w-4 h-4" />
                  Start Travel
                </Button>
                <Button
                  onClick={() => setIsAnimating(false)}
                  variant={isAnimating ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  disabled={!isAnimating}
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button
                  onClick={() => {
                    setIsAnimating(false);
                    setTravelPaths({});
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Real-Time Location Map (Google Maps)
            </CardTitle>
            <CardDescription>
              📍 Offices | 🟢 Checked In | ⭕ Checked Out
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-muted-foreground">Loading tracking data...</span>
              </div>
            ) : filteredEmployees.length === 0 && searchTerm === "" ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  No employees with live tracking enabled yet. Enable tracking in Employee Management to see locations here.
                </AlertDescription>
              </Alert>
            ) : filteredEmployees.length === 0 ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>No employees match your search criteria</AlertDescription>
              </Alert>
            ) : shouldUseFallbackMap ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {!GOOGLE_MAPS_API_KEY
                      ? "Google Maps API key missing. Showing OpenStreetMap fallback."
                      : "Google Maps is blocked for this API key. Showing OpenStreetMap fallback."}
                  </AlertDescription>
                </Alert>
                <iframe
                  title="Fallback Map"
                  src={fallbackMapUrl}
                  className="w-full h-[500px] rounded-md border"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredEmployees
                    .filter((emp) => emp.currentLocation)
                    .map((emp) => (
                      <a
                        key={`fallback-link-${emp.id}`}
                        href={`https://www.openstreetmap.org/?mlat=${emp.currentLocation!.latitude}&mlon=${emp.currentLocation!.longitude}#map=15/${emp.currentLocation!.latitude}/${emp.currentLocation!.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {emp.firstName} {emp.lastName} - Open location
                      </a>
                    ))}
                </div>
              </div>
            ) : !isMapLoaded ? (
              <div className="flex items-center justify-center h-[500px] text-sm text-muted-foreground">
                Loading map...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ height: "500px", width: "100%" }}
                center={mapCenter}
                zoom={12}
                options={mapOptions}
                onLoad={setMapInstance}
                onUnmount={() => setMapInstance(null)}
              >
                {officeLocations.map((office) => (
                  <Marker
                    key={`office-${office.id}`}
                    position={{ lat: office.latitude, lng: office.longitude }}
                    title={office.name}
                    icon={{
                      path: 1,
                      scale: 8,
                      fillColor: "#0ea5e9",
                      fillOpacity: 0.9,
                      strokeColor: "white",
                      strokeWeight: 2,
                    }}
                    onClick={() => setSelectedMarker(`office-${office.id}`)}
                  >
                    {selectedMarker === `office-${office.id}` && (
                      <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">{office.name}</div>
                          <div className="text-xs text-gray-600">{office.address}</div>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                ))}

                {Object.entries(travelPaths).map(([empId, pathPoints]) => {
                  if (pathPoints.length < 2) return null;
                  if (selectedEmployee && String(selectedEmployee) === String(empId)) return null;

                  return (
                    <Polyline
                      key={`path-${empId}`}
                      path={pathPoints.slice(-100)}
                      options={{
                        strokeColor: "#64748b",
                        strokeOpacity: 0.45,
                        strokeWeight: 3,
                        geodesic: true,
                        zIndex: 10,
                      }}
                    />
                  );
                })}

                {selectedRoutePoints.length >= 2 && (
                  <>
                    <Polyline
                      path={selectedRoutePoints.map((point) => ({
                        lat: point.latitude,
                        lng: point.longitude,
                      }))}
                      options={{
                        strokeColor: "#312e81",
                        strokeOpacity: 0.95,
                        strokeWeight: 10,
                        geodesic: true,
                        zIndex: 20,
                      }}
                    />
                    <Polyline
                      path={selectedRoutePoints.map((point) => ({
                        lat: point.latitude,
                        lng: point.longitude,
                      }))}
                      options={{
                        strokeColor: "#4f46e5",
                        strokeOpacity: 1,
                        strokeWeight: 6,
                        geodesic: true,
                        zIndex: 21,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              scale: 3,
                              fillColor: "#4f46e5",
                              fillOpacity: 1,
                              strokeOpacity: 1,
                            },
                            offset: "0%",
                            repeat: "90px",
                          },
                        ],
                      }}
                    />
                  </>
                )}

                {selectedRoutePoints[0] && (
                  <Marker
                    position={{
                      lat: selectedRoutePoints[0].latitude,
                      lng: selectedRoutePoints[0].longitude,
                    }}
                    title={`Check-in: ${selectedRouteSummary?.startAddress || "Start location"}`}
                    label={{
                      text: "IN",
                      color: "white",
                      fontWeight: "700",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: "#16a34a",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }}
                  />
                )}

                {selectedRoutePoints[selectedRoutePoints.length - 1] && (
                  <Marker
                    position={{
                      lat: selectedRoutePoints[selectedRoutePoints.length - 1].latitude,
                      lng: selectedRoutePoints[selectedRoutePoints.length - 1].longitude,
                    }}
                    title={`Latest location: ${selectedRouteSummary?.endAddress || "Latest location"}`}
                    label={{
                      text: selectedRouteSummary?.endedAt ? "OUT" : "NOW",
                      color: "white",
                      fontWeight: "700",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: selectedRouteSummary?.endedAt ? "#475569" : "#2563eb",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }}
                  />
                )}

                {visitedLocations.map((visit, index) => (
                  <Marker
                    key={`selected-stop-${index}`}
                    position={{ lat: visit.latitude, lng: visit.longitude }}
                    title={`${extractLocationName(visit.address)} - ${formatDuration(visit.durationMinutes)}`}
                    label={{
                      text: `${index + 1}`,
                      color: "white",
                      fontWeight: "700",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                      scale: 6,
                      fillColor: "#7c3aed",
                      fillOpacity: 0.95,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
                ))}

                {/* Hover Travel Path - shows when hovering employee */}
                {hoveredMarker && hoverTravelPath && hoverTravelPath.empId === hoveredMarker && hoverTravelPath.path.length >= 2 && (
                  <Polyline
                    path={hoverTravelPath.path}
                    options={{
                      strokeColor: "#f59e0b",
                      strokeOpacity: 0.8,
                      strokeWeight: 3,
                      geodesic: true,
                      icons: [
                        {
                          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2, fillColor: "#f59e0b", fillOpacity: 0.8 },
                          offset: "0%",
                          repeat: "100px",
                        },
                      ],
                    }}
                  />
                )}

                {/* Hover Stay Markers - locations where employee spent 30+ minutes */}
                {hoveredMarker && hoverStayMarkers && hoverStayMarkers.empId === hoveredMarker && hoverStayMarkers.markers.map((marker, idx) => (
                  <Marker
                    key={`stay-${hoverStayMarkers.empId}-${idx}`}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    title={`Stayed ${marker.duration} min: ${marker.address}`}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: "#8b5cf6",
                      fillOpacity: 0.9,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    }}
                  />
                ))}

                {/* Hover Check-in Location Marker */}
                {hoveredMarker && (() => {
                  const empId = hoveredMarker.replace('emp-', '');
                  const emp = filteredEmployees.find((e) => String(e.id) === empId);
                  if (!emp) return null;
                  // Find check-in location from attendance logs
                  const checkInLog = attendanceLogs.find(
                    (log) => (matchesEmployeeId(log.employee_id, emp.dbEmployeeId) || matchesEmployeeId(log.employeeId, emp.dbEmployeeId)) &&
                      (log.check_in || log.checkIn)
                  );
                  if (!checkInLog) return null;
                  const checkInLoc = parseStoredLocation(checkInLog.check_in_location);
                  if (!checkInLoc || !isValidLatLng(checkInLoc.latitude, checkInLoc.longitude)) return null;
                  return (
                    <Marker
                      key={`checkin-${empId}`}
                      position={{ lat: checkInLoc.latitude, lng: checkInLoc.longitude }}
                      title={`Check-in: ${checkInLoc.address || formatCoordinateLabel(checkInLoc.latitude, checkInLoc.longitude)}`}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: "#10b981",
                        fillOpacity: 0.9,
                        strokeColor: "#fff",
                        strokeWeight: 3,
                      }}
                    />
                  );
                })()}

                {filteredEmployees.map((emp) => {
                  if (!emp.currentLocation) return null;
                  const empLat = toFiniteNumber(emp.currentLocation.latitude);
                  const empLng = toFiniteNumber(emp.currentLocation.longitude);
                  if (!isValidLatLng(empLat, empLng)) return null;
                  const isCheckedIn = emp.trackingStatus === "checked-in";
                  const isSelectedEmployee = String(selectedEmployee || "") === String(emp.id);
                  const accuracyRadius = Math.max(1, toFiniteNumber(emp.currentLocation.accuracy) ?? 10);

                  return (
                    <div key={`emp-${emp.id}`}>
                      <Circle
                        center={{
                          lat: empLat,
                          lng: empLng,
                        }}
                        radius={accuracyRadius}
                        options={{
                          fillColor: isCheckedIn ? "#10b981" : "#ef4444",
                          fillOpacity: 0.15,
                          strokeColor: isCheckedIn ? "#10b981" : "#ef4444",
                          strokeOpacity: 0.5,
                          strokeWeight: 2,
                        }}
                      />

                      <Marker
                        position={{
                          lat: empLat,
                          lng: empLng,
                        }}
                        zIndex={5}
                        icon={createNavigationPuckIcon(isSelectedEmployee) as any}
                      />

                      <Marker
                        position={{
                          lat: empLat,
                          lng: empLng,
                        }}
                        zIndex={10}
                        title={`${emp.firstName} ${emp.lastName}`}
                        icon={createEmployeeMarkerIcon(emp.firstName, emp.lastName, isCheckedIn) as any}
                        onClick={() => {
                          setSelectedMarker(`emp-${emp.id}`);
                          setSelectedEmployee(String(emp.id));
                          if (emp.dbEmployeeId) {
                            fetchEmployeeLocationHistory(emp.dbEmployeeId, `emp-${emp.id}`);
                          }
                        }}
                        onMouseOver={() => {
                          setHoveredMarker(`emp-${emp.id}`);
                          // Fetch location history and travel path for this employee
                          if (emp.dbEmployeeId) {
                            fetchEmployeeLocationHistory(emp.dbEmployeeId, `emp-${emp.id}`);
                          }
                        }}
                        onMouseOut={() => {
                          setHoveredMarker(null);
                          setHoverTravelPath(null);
                          setHoverStayMarkers(null);
                        }}
                      >
                        {selectedMarker === `emp-${emp.id}` && (
                          <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                            <div className="map-info-window space-y-3 text-sm min-w-[320px] max-w-[360px]">
                              {/* Header - Employee Info */}
                              <div className="border-b pb-3 flex items-center gap-3">
                                {emp.photoUrl ? (
                                  <img
                                    src={emp.photoUrl}
                                    alt={`${emp.firstName} ${emp.lastName}`}
                                    className="w-12 h-12 rounded-full border-2 object-cover"
                                    style={{ borderColor: isCheckedIn ? "#10b981" : "#ef4444" }}
                                  />
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold text-white"
                                    style={{ backgroundColor: isCheckedIn ? "#10b981" : "#ef4444", borderColor: isCheckedIn ? "#10b981" : "#ef4444" }}
                                  >
                                    {(emp.firstName?.[0] || '')}{(emp.lastName?.[0] || '')}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-base truncate">
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="truncate">{emp.department || 'No Department'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isCheckedIn
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                      {isCheckedIn ? "Checked In" : "Checked Out"}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatMinutesAgo(emp.minutesSinceUpdate)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Stats Row */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                  <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                                  <div className="text-xs text-slate-500">Duration</div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {emp.lastCheckTime || '--'}
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                  <Route className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                                  <div className="text-xs text-slate-500">Distance</div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {emp.totalDistanceTraveled ? `${(emp.totalDistanceTraveled / 1000).toFixed(1)} km` : '--'}
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                  <MapPin className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                                  <div className="text-xs text-slate-500">Check-ins</div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {attendanceLogs.filter((log) => matchesEmployeeId(log.employee_id, emp.dbEmployeeId) || matchesEmployeeId(log.employeeId, emp.dbEmployeeId)).length}
                                  </div>
                                </div>
                              </div>

                              {/* Activity Timeline - Check-ins + Visited Stops */}
                              {(() => {
                                const empAttendance = attendanceLogs
                                  .filter((log) => matchesEmployeeId(log.employee_id, emp.dbEmployeeId) || matchesEmployeeId(log.employeeId, emp.dbEmployeeId))
                                  .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime());

                                const visitedStops = employeeLocationHistories[String(emp.dbEmployeeId)] || [];

                                // Build a unified timeline of all events
                                type TimelineEvent =
                                  | { type: 'checkin'; time: string; location: any; id: string }
                                  | { type: 'checkout'; time: string; location: any; id: string }
                                  | { type: 'stop'; time: string; endTime?: string; address: string; durationMinutes: number; latitude: number; longitude: number; id: string };

                                const timeline: TimelineEvent[] = [];

                                // Add check-in/check-out events
                                empAttendance.forEach((log, idx) => {
                                  const checkInTime = log.check_in || log.checkIn;
                                  const checkOutTime = log.check_out || log.checkOut;
                                  const checkInLoc = parseStoredLocation(log.check_in_location);
                                  const checkOutLoc = parseStoredLocation(log.check_out_location);

                                  if (checkInTime) {
                                    timeline.push({
                                      type: 'checkin',
                                      time: checkInTime,
                                      location: checkInLoc,
                                      id: `in-${idx}`
                                    });
                                  }
                                  if (checkOutTime) {
                                    timeline.push({
                                      type: 'checkout',
                                      time: checkOutTime,
                                      location: checkOutLoc,
                                      id: `out-${idx}`
                                    });
                                  }
                                });

                                // Add visited stops (places where they spent time)
                                visitedStops.forEach((stop, idx) => {
                                  if (stop.startTime) {
                                    timeline.push({
                                      type: 'stop',
                                      time: stop.startTime,
                                      endTime: stop.endTime,
                                      address: stop.address || formatCoordinateLabel(stop.latitude, stop.longitude),
                                      durationMinutes: stop.durationMinutes || 0,
                                      latitude: stop.latitude,
                                      longitude: stop.longitude,
                                      id: `stop-${idx}`
                                    });
                                  }
                                });

                                // Sort by time (newest first)
                                timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                                if (timeline.length === 0) return null;

                                // Apply date filter
                                const now = new Date();
                                const filteredTimeline = timeline.filter((event) => {
                                  const eventDate = new Date(event.time);
                                  if (hoverDateRange === 'today') {
                                    return eventDate.toDateString() === now.toDateString();
                                  } else if (hoverDateRange === 'yesterday') {
                                    const yesterday = new Date(now);
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    return eventDate.toDateString() === yesterday.toDateString();
                                  } else if (hoverDateRange === 'week') {
                                    const weekAgo = new Date(now);
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return eventDate >= weekAgo;
                                  } else if (hoverDateRange === 'month') {
                                    const monthAgo = new Date(now);
                                    monthAgo.setDate(monthAgo.getDate() - 30);
                                    return eventDate >= monthAgo;
                                  }
                                  return true;
                                });

                                if (filteredTimeline.length === 0) return (
                                  <div className="border-t pt-2 text-xs text-slate-500 text-center py-4">
                                    No location data for selected date range
                                  </div>
                                );

                                return (
                                  <div className="border-t pt-2">
                                    {/* Filter and Export Row */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                          <Download className="w-3 h-3" />
                                          Location Report
                                        </span>
                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                          {filteredTimeline.length} records
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <select
                                          value={hoverDateRange}
                                          onChange={(e) => setHoverDateRange(e.target.value as any)}
                                          className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value="today">Today</option>
                                          <option value="yesterday">Yesterday</option>
                                          <option value="week">This Week</option>
                                          <option value="month">This Month</option>
                                        </select>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            exportLocationHistoryCSV(`${emp.firstName} ${emp.lastName}`, filteredTimeline);
                                          }}
                                          className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                          title="Export to CSV"
                                        >
                                          <Download className="w-3 h-3" />
                                          CSV
                                        </button>
                                      </div>
                                    </div>

                                    {/* CSV Style Table Header */}
                                    <div className="bg-slate-100 rounded-t-lg px-2 py-1.5 grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200">
                                      <div className="col-span-2">Type</div>
                                      <div className="col-span-3">Time</div>
                                      <div className="col-span-5">Location Address</div>
                                      <div className="col-span-2 text-right">Duration</div>
                                    </div>

                                    {/* CSV Style Table Body */}
                                    <div className="max-h-[240px] overflow-y-auto border border-t-0 border-slate-200 rounded-b-lg">
                                      {filteredTimeline.map((event, idx) => {
                                        const isCheckIn = event.type === 'checkin';
                                        const isCheckOut = event.type === 'checkout';
                                        const isStop = event.type === 'stop';

                                        const typeLabel = isCheckIn ? 'CHECK-IN' : isCheckOut ? 'CHECK-OUT' : 'VISIT';
                                        const typeColor = isCheckIn ? 'text-green-700 bg-green-50' : isCheckOut ? 'text-red-700 bg-red-50' : 'text-blue-700 bg-blue-50';
                                        const time = new Date(event.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                                        const address = isStop ? event.address : (event.location?.address || formatCoordinateLabel(event.location?.latitude, event.location?.longitude));
                                        const locationName = extractLocationName(address);
                                        const duration = isStop && event.durationMinutes > 0 ? formatDuration(event.durationMinutes) : isCheckIn ? 'Start' : isCheckOut ? 'End' : '-';

                                        return (
                                          <div
                                            key={event.id}
                                            className={`px-2 py-2 grid grid-cols-12 gap-1 text-xs border-b border-slate-100 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                          >
                                            {/* Type Badge */}
                                            <div className="col-span-2">
                                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColor}`}>
                                                {typeLabel}
                                              </span>
                                            </div>

                                            {/* Time */}
                                            <div className="col-span-3 text-slate-700 font-mono">
                                              {time}
                                            </div>

                                            {/* Address */}
                                            <div className="col-span-5 min-w-0" title={address}>
                                              <div className="truncate font-medium text-slate-800">
                                                {locationName || 'N/A'}
                                              </div>
                                              <div className="truncate text-[10px] text-slate-500">
                                                {address || 'N/A'}
                                              </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="col-span-2 text-right text-slate-600">
                                              {duration}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                  </div>
                                );
                              })()}

                              {/* Current Location */}
                              <div className="border-t pt-2">
                                <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                  <Navigation2 className="w-3 h-3" />
                                  Current Location
                                </div>
                                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                                  <div className="truncate font-medium text-slate-800">
                                    {extractLocationName(emp.currentLocation.address)}
                                  </div>
                                  <div className="truncate">{emp.currentLocation.address}</div>
                                  <div className="text-slate-400 mt-0.5 flex items-center gap-1">
                                    <span>Accuracy: ±{Math.round(emp.currentLocation.accuracy)}m</span>
                                    <span>•</span>
                                    <span>{new Date(emp.currentLocation.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    </div>
                  );
                })}
              </GoogleMap>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Tracked Employees
            </CardTitle>
            <CardDescription>
              Click on an employee to view detailed tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEmployee && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                {routeLoading ? (
                  <div className="text-sm text-slate-600">Loading selected employee route...</div>
                ) : selectedRouteSummary ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-slate-500">Trip Distance</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {((selectedRouteSummary.totalDistanceMeters || 0) / 1000).toFixed(2)} km
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Trip Duration</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {formatDuration(selectedRouteSummary.tripDurationMinutes)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Route Points</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {selectedRouteSummary.pointCount || selectedRoutePoints.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Time Window</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatDateTime(selectedRouteSummary.startedAt)}
                          {selectedRouteSummary.endedAt ? ` - ${formatDateTime(selectedRouteSummary.endedAt)}` : ""}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Visited Stops</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {selectedRouteSummary.stopCount || visitedLocations.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Last Location Ping</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatMinutesAgo(selectedRouteSummary.minutesSinceLastPing)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Check-In Location</div>
                      <div className="text-sm font-medium text-slate-900">
                        {selectedRouteSummary.startAddress ||
                          selectedRouteSummary.endAddress ||
                          "Unknown location"}
                      </div>
                      {selectedRoutePoints[0] && (
                        <div className="text-xs text-slate-500 mt-1">
                          {formatCoordinates(
                            selectedRoutePoints[0].latitude,
                            selectedRoutePoints[0].longitude
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Current / Latest Travel Location</div>
                      <div className="text-sm font-medium text-slate-900">
                        {selectedRouteSummary.endAddress ||
                          selectedRouteSummary.startAddress ||
                          "Unknown location"}
                      </div>
                      {selectedRoutePoints[selectedRoutePoints.length - 1] && (
                        <div className="text-xs text-slate-500 mt-1">
                          {formatCoordinates(
                            selectedRoutePoints[selectedRoutePoints.length - 1].latitude,
                            selectedRoutePoints[selectedRoutePoints.length - 1].longitude
                          )}
                        </div>
                      )}
                    </div>
                    {selectedRouteSummary.currentStay ? (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                        <div className="text-xs text-emerald-700">Current Stay</div>
                        <div className="mt-1 text-sm font-semibold text-emerald-900">
                          {extractLocationName(selectedRouteSummary.currentStay.address)}
                        </div>
                        <div className="mt-1 text-xs text-emerald-800">
                          {formatDuration(selectedRouteSummary.currentStay.durationMinutes)} spent here
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">No route history available for the selected employee.</div>
                )}
              </div>
            )}

            {selectedEmployee && (
              <div className="mb-4 rounded-lg border border-purple-100 bg-purple-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div className="font-semibold text-purple-900">Visited Locations</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={visitDateRange}
                      onChange={(e) => setVisitDateRange(e.target.value as any)}
                      className="px-2 py-1 text-sm border rounded-md bg-white"
                    >
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="all">All Time</option>
                    </select>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {visitedLocations.length} stops
                    </Badge>
                  </div>
                </div>
                {selectedRouteSummary?.minimumStayMinutes ? (
                  <div className="mb-3 text-xs text-purple-700">
                    Stops are grouped when the employee stays around {selectedRouteSummary.minimumStayMinutes}+ minutes within {selectedRouteSummary.stayRadiusMeters || 50}m.
                  </div>
                ) : null}
                {visitedLocations.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visitedLocations.map((visit, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-purple-900">
                              {extractLocationName(visit.address)}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 line-clamp-2">{visit.address}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDateTime(visit.startTime)}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                <span>{formatDuration(visit.durationMinutes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    No visited locations detected. Employee may not have stayed at any location for {LIVE_TRACKING_MIN_STAY_MINUTES}+ minutes, or route history is not available. Try selecting a different date range.
                  </div>
                )}
              </div>
            )}



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedEmployee === emp.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  onClick={() => handleViewDetails(emp.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt={`${emp.firstName} ${emp.lastName}`}
                        className="w-12 h-12 rounded-full border-2"
                        style={{ borderColor: emp.trackingStatus === "checked-in" ? "#10b981" : "#ef4444" }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: emp.trackingStatus === "checked-in" ? "#10b981" : "#ef4444" }}
                      >
                        {emp.firstName?.charAt(0).toUpperCase()}
                        {emp.lastName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                      <div className="text-sm text-gray-500">{emp.department}</div>
                    </div>
                    <Badge
                      variant={emp.trackingState === "active" ? "default" : "secondary"}
                      className={
                        getTrackingTone(emp.trackingState).badgeClass
                      }
                    >
                      {getTrackingTone(emp.trackingState).label}
                    </Badge>
                  </div>

                  {emp.currentLocation && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">
                            {getPrimaryLocationLabel(
                              emp.currentLocation.address,
                              emp.currentLocation.latitude,
                              emp.currentLocation.longitude
                            ).name}
                          </div>
                          <div className="truncate text-gray-600">
                            {getPrimaryLocationLabel(
                              emp.currentLocation.address,
                              emp.currentLocation.latitude,
                              emp.currentLocation.longitude
                            ).address}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(emp.currentLocation.timestamp).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{formatMinutesAgo(emp.minutesSinceUpdate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{emp.phone}</span>
                      </div>
                      {emp.currentLocation.speed && (
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{emp.currentLocation.speed.toFixed(1)} km/h</span>
                        </div>
                      )}
                      {emp.currentLocation.batteryLevel && (
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{emp.currentLocation.batteryLevel.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!emp.currentLocation && (
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Tracking stopped after check-out. Employee is offline now.
                    </div>
                  )}

                  {selectedEmployee === emp.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Employee ID:</span> {emp.id}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {emp.email}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Employment Type:</span> {emp.employmentType}
                      </div>
                      {emp.lastCheckTime && (
                        <div className="text-sm">
                          <span className="font-medium">Last Check Time:</span> {emp.lastCheckTime}
                        </div>
                      )}
                      {emp.vehicleInfo && (
                        <div className="text-sm">
                          <span className="font-medium">Vehicle:</span> {emp.vehicleInfo.type} {emp.vehicleInfo.model} ({emp.vehicleInfo.registrationNumber})
                        </div>
                      )}
                      {emp.deviceInfo && (
                        <div className="text-sm">
                          <span className="font-medium">Device:</span> {emp.deviceInfo.type} {emp.deviceInfo.model} ({emp.deviceInfo.os})
                        </div>
                      )}
                      {emp.totalDistanceTraveled && (
                        <div className="text-sm">
                          <span className="font-medium">Total Distance:</span> {(emp.totalDistanceTraveled / 1000).toFixed(2)} km
                        </div>
                      )}
                      {emp.averageSpeed && (
                        <div className="text-sm">
                          <span className="font-medium">Average Speed:</span> {emp.averageSpeed.toFixed(1)} km/h
                        </div>
                      )}
                      {selectedEmployee === emp.id && selectedRouteSummary && (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">Trip Distance:</span>{" "}
                            {((selectedRouteSummary.totalDistanceMeters || 0) / 1000).toFixed(2)} km
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Trip Duration:</span>{" "}
                            {formatDuration(selectedRouteSummary.tripDurationMinutes)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Route Points:</span>{" "}
                            {selectedRouteSummary.pointCount || selectedRoutePoints.length}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Visited Stops:</span>{" "}
                            {selectedRouteSummary.stopCount || visitedLocations.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );

  return canViewTracking ? trackingView : noTrackingAccessView;
}

