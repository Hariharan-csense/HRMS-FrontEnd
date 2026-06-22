import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { liveApi } from "@/components/helper/livetracking/livetracking";
import branchApi, { Branch } from "@/components/helper/branch/branch";
import { MapPin, Users, Navigation2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import KeylessMap, {
  KeylessMapCircle,
  KeylessMapMarker,
  KeylessMapPath,
} from "@/components/KeylessMap";

type LatLngLiteral = { lat: number; lng: number };
const FALLBACK_RADIUS = 200;

type TrackedEmployee = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  trackingStatus?: "active" | "idle" | "offline";
  locationTimestamp?: string | null;
  accuracy?: number | null;
};

const parseCoords = (coordinates?: string): LatLngLiteral | null => {
  if (!coordinates) return null;
  const [lat, lng] = coordinates.split(",").map((v) => Number(v.trim()));
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
};

const getEmployeeName = (emp?: TrackedEmployee | null) =>
  emp?.name || `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "E";

export default function AdminRealTimeMap() {
  const { user } = useAuth();

  const [officeLocation, setOfficeLocation] = useState<LatLngLiteral | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<TrackedEmployee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string | number | null>(null);
  const [travelPaths, setTravelPaths] = useState<Record<string, Array<{ lat: number; lng: number }>>>({});

  useEffect(() => {
    const loadBranches = async () => {
      const result = await branchApi.getBranches();
      if (result.data) {
        setBranches(result.data);
        if (!selectedBranchId && result.data.length > 0) {
          const userBranchId =
            (user as any)?.branch_id ||
            (user as any)?.branchId ||
            (user as any)?.branch?.id ||
            (user as any)?.branch?.branch_id;

          const matched = userBranchId
            ? result.data.find(
                (b) =>
                  b.id?.toString() === String(userBranchId) ||
                  (b.branchId && b.branchId.toString() === String(userBranchId)),
              )
            : null;

          const defaultBranch = matched || result.data[0];
          setSelectedBranchId(defaultBranch.id?.toString() || defaultBranch.branchId || null);
        }
      } else {
        setBranches([]);
      }
    };
    loadBranches();
  }, [selectedBranchId, user]);

  useEffect(() => {
    if (!selectedBranchId) {
      setOfficeLocation(null);
      setRadius(null);
      return;
    }
    const branch = branches.find((b) => b.id?.toString() === selectedBranchId);
    if (!branch) return;
    const coords = parseCoords(branch.coordinates);
    if (coords) {
      setOfficeLocation(coords);
      const radiusMeters = Number(branch.radius) || 0;
      setRadius(radiusMeters || FALLBACK_RADIUS);
    } else {
      setOfficeLocation(null);
      setRadius(null);
    }
  }, [selectedBranchId, branches]);

  useEffect(() => {
    let active = true;
    const fetchEmployees = async () => {
      const response = await liveApi.getEmployees();
      if (!active) return;
      if (response.data) {
        const mapped = response.data
          .filter((emp) => emp.latitude && emp.longitude)
          .map((emp) => ({
            id: emp.id ?? emp.employee_id ?? emp.employeeId,
            first_name: emp.first_name || emp.firstName,
            last_name: emp.last_name || emp.lastName,
            name: emp.name,
            latitude: Number(emp.latitude),
            longitude: Number(emp.longitude),
            trackingStatus: emp.trackingStatus || (emp.latitude && emp.longitude ? "active" : "offline"),
            locationTimestamp: emp.locationTimestamp,
            accuracy: emp.accuracy,
          }));
        setEmployees(mapped);

        setTravelPaths((prev) => {
          const next = { ...prev };
          mapped.forEach((emp) => {
            if (!emp.latitude || !emp.longitude) return;
            const point = { lat: emp.latitude, lng: emp.longitude };
            const path = next[emp.id] || [];
            const last = path[path.length - 1];
            if (last && last.lat === point.lat && last.lng === point.lng) return;
            next[emp.id] = [...path, point].slice(-200);
          });
          return next;
        });
      }
    };
    fetchEmployees();
    const id = setInterval(fetchEmployees, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const trackedCount = employees.length;
  const activeCount = employees.filter((e) => e.trackingStatus === "active").length;

  const mapMarkers = useMemo<KeylessMapMarker[]>(() => {
    const markers: KeylessMapMarker[] = [];

    if (officeLocation) {
      markers.push({
        id: "office",
        position: officeLocation,
        label: "Office",
        title: "Office",
        color: "#0ea5e9",
        size: 42,
      });
    }

    employees.forEach((emp) => {
      if (!emp.latitude || !emp.longitude) return;
      const name = getEmployeeName(emp);
      const isSelected = selectedEmp === emp.id;
      markers.push({
        id: `emp-${emp.id}`,
        position: { lat: emp.latitude, lng: emp.longitude },
        label: getInitials(name),
        title: name,
        color: emp.trackingStatus === "active" ? "#0ea5e9" : "#94a3b8",
        size: isSelected ? 46 : 38,
        pulse: emp.trackingStatus === "active",
        onClick: () => setSelectedEmp(isSelected ? null : emp.id),
        popup: isSelected ? (
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-slate-600">
              {emp.trackingStatus === "active" ? "Active" : "Offline"}
            </p>
            {emp.locationTimestamp && (
              <p className="text-xs text-slate-500">
                Updated {new Date(emp.locationTimestamp).toLocaleString()}
              </p>
            )}
          </div>
        ) : null,
      });
    });

    return markers;
  }, [employees, officeLocation, selectedEmp]);

  const mapCircles = useMemo<KeylessMapCircle[]>(() => {
    if (!officeLocation || !radius) return [];
    return [
      {
        id: "office-radius",
        center: officeLocation,
        radiusMeters: radius,
        color: "#10b981",
        fillOpacity: 0.08,
        strokeOpacity: 0.9,
      },
    ];
  }, [officeLocation, radius]);

  const mapPaths = useMemo<KeylessMapPath[]>(
    () =>
      Object.entries(travelPaths)
        .filter(([, path]) => path.length > 1)
        .map(([empId, points]) => ({
          id: `path-${empId}`,
          points,
          color: "#f59e0b",
          width: 2,
          opacity: 0.6,
        })),
    [travelPaths],
  );

  return (
    <Card className="border-0 shadow-xl chart-container">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-gray-800 font-bold">Live Employee Tracking</CardTitle>
            <CardDescription className="text-gray-600">
              Multi-employee markers, office geofence, and real-time refresh
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium">Branch</label>
            <span className="font-semibold">
              {branches.find((b) => b.id?.toString() === selectedBranchId || b.branchId === selectedBranchId)?.name ||
                "Detecting..."}
            </span>
          </div>
          {officeLocation && (
            <span className="text-xs text-gray-500">
              Lat {officeLocation.lat.toFixed(5)}, Lng {officeLocation.lng.toFixed(5)}
            </span>
          )}
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> {trackedCount} tracked
          </Badge>
          <Badge variant="default" className="flex items-center gap-1">
            <Navigation2 className="h-4 w-4" /> {activeCount} active now
          </Badge>
          {radius && <span className="text-gray-500">Radius {radius} m</span>}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!officeLocation ? (
          <p className="text-sm text-gray-600">
            Office geofence not set. Choose a branch above (no default).
          </p>
        ) : (
          <KeylessMap
            center={officeLocation}
            markers={mapMarkers}
            circles={mapCircles}
            paths={mapPaths}
            height={420}
            className="shadow-sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
