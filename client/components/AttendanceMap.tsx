import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";
import { useLiveLocationPing } from "@/hooks/useLiveLocationPing";

type LatLngLiteral = { lat: number; lng: number; accuracy?: number };

type AttendanceMapProps = {
  officeLocation?: LatLngLiteral | null;
  officeName?: string;
  radiusMeters?: number;
  /**
   * When true, the component auto fires check-in/check-out calls
   * on geofence enter/exit using attendance endpoints.
   */
  enableAutoCheck?: boolean;
};

const containerStyle = {
  width: "100%",
  height: "400px",
};

const DEFAULT_RADIUS = 200; // meters

const haversineDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function AttendanceMap({
  officeLocation,
  officeName = "Office",
  radiusMeters = DEFAULT_RADIUS,
  enableAutoCheck = false,
}: AttendanceMapProps) {
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

  const [employeeLocation, setEmployeeLocation] = useState<LatLngLiteral | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const lastStatus = useRef<"inside" | "outside" | "pending">("pending");
  const hasAutoCheckedIn = useRef(false);
  const hasAutoCheckedOut = useRef(false);

  useEffect(() => {
    if (!officeLocation) return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        } as LatLngLiteral & { accuracy?: number };
        setEmployeeLocation(coords);
        setDistanceKm(
          haversineDistanceInKm(coords.lat, coords.lng, officeLocation.lat, officeLocation.lng)
        );
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || "Unable to fetch your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [officeLocation?.lat, officeLocation?.lng]);

  const circleOptions = useMemo(
    () => ({
      strokeColor: "#10b981",
      strokeOpacity: 0.9,
      strokeWeight: 1.5,
      fillColor: "#10b981",
      fillOpacity: 0.12,
      clickable: false,
    }),
    []
  );

  const distanceMeters = distanceKm !== null ? distanceKm * 1000 : null;
  const isInside = distanceMeters !== null ? distanceMeters <= radiusMeters : null;
  const statusVariant = isInside === null ? "pending" : isInside ? "inside" : "outside";
  const mapKey = officeLocation ? `${officeLocation.lat},${officeLocation.lng},${radiusMeters}` : "empty";

  // Push live location to backend while enabled
  useLiveLocationPing(employeeLocation, Boolean(enableAutoCheck));

  // Auto check-in / check-out based on geofence
  useEffect(() => {
    if (!officeLocation) return;

    const attemptAutoAttendance = async (action: "check-in" | "check-out") => {
      if (!enableAutoCheck || !employeeLocation) return;
      try {
        const formData = new FormData();
        formData.append("latitude", employeeLocation.lat.toString());
        formData.append("longitude", employeeLocation.lng.toString());
        formData.append("note", "Auto geo-fence");
        formData.append("source", "auto");
        if ((employeeLocation as any).accuracy) {
          formData.append("accuracy", (employeeLocation as any).accuracy.toString());
        }

        if (action === "check-in") {
          await ENDPOINTS.checkIn(formData);
          hasAutoCheckedIn.current = true;
        } else {
          await ENDPOINTS.checkOut(formData);
          hasAutoCheckedOut.current = true;
        }
      } catch (err) {
        console.error(`Auto ${action} failed`, err);
      }
    };

    if (statusVariant === "inside" && lastStatus.current !== "inside") {
      if (!hasAutoCheckedIn.current) {
        attemptAutoAttendance("check-in");
      }
    }

    if (statusVariant === "outside" && lastStatus.current === "inside") {
      if (!hasAutoCheckedOut.current) {
        attemptAutoAttendance("check-out");
      }
    }

    if (statusVariant !== "pending") {
      lastStatus.current = statusVariant;
    }
  }, [statusVariant, enableAutoCheck, employeeLocation]);

  const canRenderMap = isLoaded && typeof window !== "undefined" && (window as any).google && officeLocation;

  return (
    <Card className="chart-container border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-gray-800 font-bold">Real-Time Attendance Location</CardTitle>
            <CardDescription className="text-gray-600">
              Live employee marker, office geofence, and radius validation
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {!officeLocation ? (
          <p className="text-sm text-gray-600">Office location not configured yet. Add a branch to set office geo-fence.</p>
        ) : !canRenderMap ? (
          <p className="text-sm text-gray-600">
            {loadError ? "Failed to load Google Maps." : "Loading map…"}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
            <GoogleMap
              key={mapKey}
              mapContainerStyle={containerStyle}
              center={employeeLocation || officeLocation}
              zoom={15}
              options={{
                disableDefaultUI: true,
                clickableIcons: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              <Circle center={officeLocation} radius={radiusMeters} options={circleOptions} />
              <Marker position={officeLocation} label="Office" />
              {employeeLocation && (
                <Marker
                  position={employeeLocation}
                  label="You"
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                />
              )}
            </GoogleMap>
          </div>
        )}

        {officeLocation && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Office
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">{officeName}</p>
              <p className="text-sm text-gray-600">
                Lat {officeLocation.lat.toFixed(4)}, Lng {officeLocation.lng.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Radius: {radiusMeters} m</p>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Distance from office
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {distanceMeters !== null ? `${distanceMeters.toFixed(0)} m` : "Awaiting location…"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Uses Haversine formula with high-accuracy GPS.
              </p>
            </div>

            <div
              className={`rounded-lg p-4 border ${
                statusVariant === "pending"
                  ? "border-gray-200 bg-gray-50"
                  : statusVariant === "inside"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-100 bg-rose-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Status</p>
              <div className="mt-2 flex items-center gap-2">
                {statusVariant === "pending" && (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-lg font-bold text-amber-700">Waiting for location</p>
                  </>
                )}
                {statusVariant === "inside" && (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <p className="text-lg font-bold text-emerald-700">Inside office radius</p>
                  </>
                )}
                {statusVariant === "outside" && (
                  <>
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <p className="text-lg font-bold text-rose-700">Outside office radius</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Real-time geofence validation for attendance check-in/out.
              </p>
            </div>
          </div>
        )}

        {geoError && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {geoError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
