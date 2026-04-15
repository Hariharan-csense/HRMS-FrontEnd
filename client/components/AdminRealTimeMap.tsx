import { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, Circle, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { liveApi } from "@/components/helper/livetracking/livetracking";
import branchApi, { Branch } from "@/components/helper/branch/branch";
import { MapPin, Users, Navigation2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";

type LatLngLiteral = { lat: number; lng: number };
const FALLBACK_RADIUS = 200;

type TrackedEmployee = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  trackingStatus?: "active" | "offline";
  locationTimestamp?: string | null;
  accuracy?: number | null;
};

const containerStyle = {
  width: "100%",
  height: "420px",
};

const parseCoords = (coordinates?: string): LatLngLiteral | null => {
  if (!coordinates) return null;
  const [lat, lng] = coordinates.split(",").map((v) => Number(v.trim()));
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
};

const buildIcon = (emp: TrackedEmployee) => {
  const name = emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "EMP";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "E";

  const active = emp.trackingStatus === "active";
  const color = active ? "#0ea5e9" : "#94a3b8";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="64" height="80">
      <ellipse cx="32" cy="72" rx="20" ry="4" fill="rgba(0,0,0,0.12)"/>
      <circle cx="32" cy="32" r="26" fill="white" stroke="${color}" stroke-width="3"/>
      <text x="32" y="38" font-size="18" font-weight="bold" text-anchor="middle" fill="${color}">${initials}</text>
      <circle cx="52" cy="50" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
    scaledSize: { width: 64, height: 80 },
    anchor: { x: 32, y: 80 },
  };
};

export default function AdminRealTimeMap() {
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

  const { user } = useAuth();

  const [officeLocation, setOfficeLocation] = useState<LatLngLiteral | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<TrackedEmployee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string | number | null>(null);
  const [travelPaths, setTravelPaths] = useState<Record<string, Array<{ lat: number; lng: number }>>>({});

  // Load office geofence from branches
  useEffect(() => {
    const loadBranches = async () => {
      const result = await branchApi.getBranches();
      if (result.data) {
        setBranches(result.data);
        if (!selectedBranchId && result.data.length > 0) {
          // Prefer user's own branch if available, otherwise fall back to first branch
          const userBranchId =
            (user as any)?.branch_id ||
            (user as any)?.branchId ||
            (user as any)?.branch?.id ||
            (user as any)?.branch?.branch_id;

          const matched = userBranchId
            ? result.data.find(
                (b) =>
                  b.id?.toString() === String(userBranchId) ||
                  (b.branchId && b.branchId.toString() === String(userBranchId))
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

  // When user selects branch, set location
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
      const radiusValue = Number(branch.radius) || 0;
      const radiusMeters = radiusValue > 1000 ? radiusValue : radiusValue * 1000;
      setRadius(radiusMeters || FALLBACK_RADIUS);
    } else {
      setOfficeLocation(null);
      setRadius(null);
    }
  }, [selectedBranchId, branches]);

  // Load employees + refresh every 15s
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

        // Build travel paths (retain last 200 points per employee)
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

  const circleOptions = useMemo(
    () => ({
      strokeColor: "#10b981",
      strokeOpacity: 0.9,
      strokeWeight: 1.5,
      fillColor: "#10b981",
      fillOpacity: 0.08,
      clickable: false,
    }),
    []
  );

  const trackedCount = employees.length;
  const activeCount = employees.filter((e) => e.trackingStatus === "active").length;

  const canRenderMap =
    isLoaded && typeof window !== "undefined" && (window as any).google && officeLocation && radius;
  const mapKey = officeLocation ? `${officeLocation.lat},${officeLocation.lng},${radius}` : "empty";

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
        ) : !canRenderMap ? (
          <p className="text-sm text-gray-600">
            {loadError ? "Failed to load Google Maps." : "Loading map…"}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            <GoogleMap
              key={mapKey}
              mapContainerStyle={containerStyle}
              center={officeLocation}
              zoom={14}
              options={{
                disableDefaultUI: true,
                clickableIcons: false,
              }}
            >
              {radius && <Circle center={officeLocation} radius={radius} options={circleOptions} />}
              <Marker position={officeLocation} label="Office" />
              {Object.entries(travelPaths).map(([empId, path]) =>
                path.length > 1 ? (
                  <Polyline
                    key={`path-${empId}`}
                    path={path}
                    options={{
                      strokeColor: "#f59e0b",
                      strokeOpacity: 0.6,
                      strokeWeight: 2,
                      geodesic: true,
                    }}
                  />
                ) : null
              )}
              {employees.map((emp) => (
                <Marker
                  key={emp.id}
                  position={{ lat: emp.latitude || 0, lng: emp.longitude || 0 }}
                  icon={buildIcon(emp)}
                  onClick={() => setSelectedEmp(emp.id)}
                />
              ))}
              {selectedEmp && (
                <InfoWindow
                  position={{
                    lat: employees.find((e) => e.id === selectedEmp)?.latitude || officeLocation.lat,
                    lng: employees.find((e) => e.id === selectedEmp)?.longitude || officeLocation.lng,
                  }}
                  onCloseClick={() => setSelectedEmp(null)}
                >
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">
                      {employees.find((e) => e.id === selectedEmp)?.name ||
                        `${employees.find((e) => e.id === selectedEmp)?.first_name || ""} ${
                          employees.find((e) => e.id === selectedEmp)?.last_name || ""
                        }`}
                    </p>
                    <p className="text-gray-600">
                      {employees.find((e) => e.id === selectedEmp)?.trackingStatus === "active"
                        ? "Active"
                        : "Offline"}
                    </p>
                    {employees.find((e) => e.id === selectedEmp)?.locationTimestamp && (
                      <p className="text-gray-500 text-xs">
                        Updated {new Date(
                          employees.find((e) => e.id === selectedEmp)?.locationTimestamp || ""
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
