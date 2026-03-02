import { useState, useMemo, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline, Circle, OverlayView } from "@react-google-maps/api";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Employee } from "@/lib/employees";
import { OfficeLocation } from "@/lib/locationUtils";
import { toast } from "sonner";
import { liveApi } from "@/components/helper/livetracking/livetracking";
import branchApi from "@/components/helper/branch/branch";
import { useRole } from "@/context/RoleContext";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(num) ? num : null;
};

const isValidLatLng = (lat: number | null, lng: number | null): lat is number =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

interface TrackedEmployee extends Employee {
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    timestamp: string;
  };
  trackingStatus: "checked-in" | "checked-out";
  lastCheckTime?: string;
  isLiveTrackingEnabled?: boolean;
  employmentType: "full-time" | "part-time" | "contract" | "intern";
}

// Helper to create employee marker icon with initials badge
const createEmployeeMarkerIcon = (firstName: string | undefined, lastName: string | undefined, isCheckedIn: boolean) => {
  const statusColor = isCheckedIn ? "#10b981" : "#ef4444";
  const first = (firstName || "?").charAt(0).toUpperCase();
  const last = (lastName || "?").charAt(0).toUpperCase();
  const initials = `${first}${last}`;

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="64" height="80">
      <ellipse cx="32" cy="72" rx="20" ry="4" fill="rgba(0,0,0,0.1)"/>
      <circle cx="32" cy="32" r="26" fill="white" stroke="${statusColor}" stroke-width="3"/>
      <circle cx="32" cy="32" r="24" fill="${statusColor}" opacity="0.1"/>
      <text x="32" y="38" font-size="18" font-weight="bold" text-anchor="middle" fill="${statusColor}">${initials}</text>
      <circle cx="50" cy="50" r="8" fill="${statusColor}" stroke="white" stroke-width="2"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
    scaledSize: { width: 64, height: 80 },
    anchor: { x: 32, y: 80 },
  };
};

export default function LiveTracking() {
  const { hasModuleAccess } = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [travelPaths, setTravelPaths] = useState<Record<string, Array<{ lat: number; lng: number }>>>({});
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [mapLoadError, setMapLoadError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("google_maps_blocked") === "1" ? "GOOGLE_MAP_BLOCKED" : null;
  });

  const canViewTracking = hasModuleAccess('live_tracking') || hasModuleAccess('attendance');

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
          liveApi.getAttendanceLogs()
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
    if (!autoRefresh || !canViewTracking) return;

    const interval = setInterval(async () => {
      try {
        const [employeesResponse, attendanceResponse] = await Promise.all([
          liveApi.getEmployees(),
          liveApi.getAttendanceLogs()
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
    }, isAnimating ? 5000 : 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, canViewTracking, isAnimating]);

  const trackedEmployees = useMemo(() => {
    if (!canViewTracking || employees.length === 0) {
      return [];
    }
    
    if (employees.length > 0) {
      return employees.map((emp): TrackedEmployee => {
        const latestAttendance = attendanceLogs
          .filter(log => log.employee_id === emp.id || log.employeeId === emp.id)
          .sort((a, b) => new Date(b.check_in || b.checkIn).getTime() - new Date(a.check_in || a.checkIn).getTime())[0];

        const isCheckedIn = latestAttendance && latestAttendance.check_in && !latestAttendance.check_out;
        
        let currentLocation = undefined;
        const empLat = toFiniteNumber((emp as any).latitude);
        const empLng = toFiniteNumber((emp as any).longitude);
        if (isValidLatLng(empLat, empLng)) {
          const empAccuracy = toFiniteNumber((emp as any).accuracy);
          currentLocation = {
            latitude: empLat,
            longitude: empLng,
            accuracy: empAccuracy ?? 10,
            address: emp.address || "Unknown location",
            timestamp: emp.locationTimestamp || new Date().toISOString(),
          };
        } else if (latestAttendance?.check_in_location) {
          try {
            const locationData = typeof latestAttendance.check_in_location === 'string' 
              ? JSON.parse(latestAttendance.check_in_location) 
              : latestAttendance.check_in_location;
            const checkInLat = toFiniteNumber(locationData?.latitude);
            const checkInLng = toFiniteNumber(locationData?.longitude);
            const checkInAccuracy = toFiniteNumber(locationData?.accuracy);
            if (isValidLatLng(checkInLat, checkInLng)) {
              currentLocation = {
                latitude: checkInLat,
                longitude: checkInLng,
                accuracy: checkInAccuracy ?? 10,
                address: locationData.address || "Unknown location",
                timestamp: latestAttendance.check_in,
              };
            }
          } catch (error) {
            console.error('Error parsing check-in location:', error);
          }
        }

        return {
          ...emp,
          id: emp.employee_id || emp.id,
          firstName: emp.first_name || emp.firstName,
          lastName: emp.last_name || emp.lastName,
          email: emp.email,
          department: emp.department,
          phone: emp.phone,
          photoUrl: emp.photo_url || emp.photoUrl,
          isLiveTrackingEnabled: (emp as any).location_tracking_enabled === 1 || (emp as any).isLiveTrackingEnabled,
          currentLocation,
          trackingStatus: isCheckedIn ? "checked-in" : "checked-out",
          lastCheckTime: latestAttendance?.check_in ? new Date(latestAttendance.check_in).toLocaleTimeString("en-IN") : undefined,
          employmentType: (emp as any).employmentType || "full-time" as const,
        };
      });
    }

    return [];
  }, [employees, attendanceLogs, canViewTracking]);

  const filteredEmployees = useMemo(() => {
    if (!canViewTracking) return [];
    
    return trackedEmployees
      .filter((emp) => {
        const matchesSearch =
          emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!showAll) {
          return matchesSearch && emp.trackingStatus === "checked-in";
        }
        return matchesSearch;
      })
      .sort((a, b) => b.trackingStatus.localeCompare(a.trackingStatus));
  }, [trackedEmployees, searchTerm, showAll, canViewTracking]);

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
    if (!isAnimating || !canViewTracking) return;

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
  }, [isAnimating, trackedEmployees, canViewTracking]);

  useEffect(() => {
    if (!mapInstance || filteredEmployees.length === 0 || !canViewTracking) return;
    if (isAnimating) return;

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

  const handleRefresh = async () => {
    if (!canViewTracking) return;
    
    try {
      const [employeesResponse, attendanceResponse] = await Promise.all([
        liveApi.getEmployees(),
        liveApi.getAttendanceLogs()
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

  const mapOptions = useMemo(() => {
    if (!canViewTracking) return {};
    return {
      zoom: 12,
      mapTypeControl: true,
      mapTypeId: "roadmap",
      streetViewControl: false,
      fullscreenControl: true,
    };
  }, [canViewTracking]);

  if (!canViewTracking) {
    return (
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
  }

  return (
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
            ) : mapLoadError ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Google Maps is blocked for this API key. Showing OpenStreetMap fallback.
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
            ) : (
              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                onError={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("google_maps_blocked", "1");
                  }
                  setMapLoadError("GOOGLE_MAP_BLOCKED");
                  toast.error("Google Maps blocked. Switched to fallback map.");
                }}
              >
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

                  {filteredEmployees.filter((e) => {
                    const lat = toFiniteNumber(e.currentLocation?.latitude);
                    const lng = toFiniteNumber(e.currentLocation?.longitude);
                    return isValidLatLng(lat, lng);
                  }).length > 1 && (
                    <Polyline
                      path={filteredEmployees
                        .map((e) => {
                          const lat = toFiniteNumber(e.currentLocation?.latitude);
                          const lng = toFiniteNumber(e.currentLocation?.longitude);
                          return isValidLatLng(lat, lng) ? { lat, lng } : null;
                        })
                        .filter((point): point is { lat: number; lng: number } => point !== null)}
                      options={{
                        strokeColor: "#3b82f6",
                        strokeOpacity: 0.7,
                        strokeWeight: 3,
                        geodesic: true,
                        icons: [
                          {
                            icon: {
                              path: "M 0,-1 0,1",
                              strokeOpacity: 1,
                              scale: 4,
                            },
                            offset: "0",
                            repeat: "20px",
                          },
                        ],
                      }}
                    />
                  )}

                  {isAnimating && Object.entries(travelPaths).map(([empId, pathPoints]) => {
                    if (pathPoints.length < 2) return null;

                    return (
                      <Polyline
                        key={`path-${empId}`}
                        path={pathPoints.slice(-100)}
                        options={{
                          strokeColor: "#f59e0b",
                          strokeOpacity: 0.6,
                          strokeWeight: 2,
                          geodesic: true,
                        }}
                      />
                    );
                  })}

                  {filteredEmployees.map((emp) => {
                    if (!emp.currentLocation) return null;
                    const empLat = toFiniteNumber(emp.currentLocation.latitude);
                    const empLng = toFiniteNumber(emp.currentLocation.longitude);
                    if (!isValidLatLng(empLat, empLng)) return null;
                    const isCheckedIn = emp.trackingStatus === "checked-in";
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
                          title={`${emp.firstName} ${emp.lastName}`}
                          icon={createEmployeeMarkerIcon(emp.firstName, emp.lastName, isCheckedIn) as any}
                          onClick={() => setSelectedMarker(`emp-${emp.id}`)}
                        >
                          {selectedMarker === `emp-${emp.id}` && (
                            <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                              <div className="space-y-2 text-sm min-w-[280px]">
                                <div className="border-b pb-2 flex items-center gap-3">
                                  {emp.photoUrl && (
                                    <img
                                      src={emp.photoUrl}
                                      alt={`${emp.firstName} ${emp.lastName}`}
                                      className="w-10 h-10 rounded-full border-2"
                                      style={{ borderColor: isCheckedIn ? "#10b981" : "#ef4444" }}
                                    />
                                  )}
                                  <div>
                                    <div className="font-bold">
                                      {emp.firstName} {emp.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{emp.id}</div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        isCheckedIn
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {isCheckedIn ? "✓ Checked In" : "Checked Out"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="text-xs font-medium">{emp.department}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Accuracy:</span>
                                    <span className="text-xs font-medium">±{Math.round(emp.currentLocation.accuracy)}m</span>
                                  </div>
                                </div>
                                <div className="border-t pt-2">
                                  <div className="text-xs text-gray-600 mb-1">Address</div>
                                  <div className="text-xs font-medium">{emp.currentLocation.address}</div>
                                </div>
                                <div className="border-t pt-2">
                                  <div className="text-xs text-gray-600 mb-1">Last Updated</div>
                                  <div className="text-xs font-medium">
                                    {new Date(emp.currentLocation.timestamp).toLocaleString("en-IN")}
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
              </LoadScript>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEmployee === emp.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
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
                      variant={emp.trackingStatus === "checked-in" ? "default" : "secondary"}
                      className={
                        emp.trackingStatus === "checked-in"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {emp.trackingStatus === "checked-in" ? "✓ Active" : "Inactive"}
                    </Badge>
                  </div>

                  {emp.currentLocation && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 truncate">{emp.currentLocation.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(emp.currentLocation.timestamp).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{emp.phone}</span>
                      </div>
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
}
