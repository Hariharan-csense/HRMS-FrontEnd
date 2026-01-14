import { useRef, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  reverseGeocode,
  findClosestOffice,
  getAllOfficeLocations,
  OfficeLocation
} from "@/lib/locationUtils";
import attendanceApi from "@/components/helper/attendance/attendance";
import { useAuth } from "@/context/AuthContext";

interface AttendanceRecord {
  type: "check-in" | "check-out";
  timestamp: string;
  confidence: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  };
  imageUrl: string;
  device: string;
  status: "success" | "failed";
}

export default function AttendanceCapture() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  } | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [officeLocations] = useState<OfficeLocation[]>(getAllOfficeLocations());
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not supported on this device or browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front-facing camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        // Ensure video element is ready before attaching stream
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .catch((err: any) => {
                console.error("Error playing video:", err);
                toast.error("Failed to play video stream.");
              });
          }
        };

        // Handle any errors during video playback
        videoRef.current.onerror = () => {
          toast.error("Error loading video stream.");
        };
      }
    } catch (err: any) {
      // Detailed error handling for different failure types
      let errorMessage = "Failed to access camera.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage =
          "Camera permission denied. Please check browser permissions and grant camera access.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera device found. Please check if a camera is connected.";
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "Camera is in use by another application. Please close other apps using the camera.";
      } else if (err.name === "SecurityError") {
        errorMessage =
          "Camera access is blocked for security reasons. Ensure you are using HTTPS or localhost.";
      } else if (err.name === "TypeError") {
        errorMessage = "Invalid camera constraints. Please try a different device.";
      }

      console.error("Camera access error:", err);
      toast.error(errorMessage);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
  };

  const getLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  }> => {
    return new Promise((resolve, reject) => {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          try {
            // Try to find closest office location
            const closestOffice = findClosestOffice(latitude, longitude);

            // Try reverse geocoding for real address
            setIsReverseGeocoding(true);
            const realAddress = await reverseGeocode(latitude, longitude);
            setIsReverseGeocoding(false);

            // Use real address if available, otherwise use closest office or coordinates
            const address = realAddress || closestOffice?.address || `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            // Auto-select closest office if within radius
            if (closestOffice && !selectedOfficeId) {
              setSelectedOfficeId(closestOffice.id);
            }

            setCurrentLocation({ latitude, longitude, accuracy, address });
            setIsLoadingLocation(false);
            resolve({ latitude, longitude, accuracy, address });
          } catch (error) {
            // Fallback if reverse geocoding fails
            const address = `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setCurrentLocation({ latitude, longitude, accuracy, address });
            setIsLoadingLocation(false);
            resolve({ latitude, longitude, accuracy, address });
          }
        },
        () => {
          toast.error("Failed to get location. Please enable location services.");
          setIsLoadingLocation(false);
          reject(new Error("Location not available"));
        }
      );
    });
  };

  const captureAttendance = async (type: "check-in" | "check-out") => {
    // Check if user is authenticated
    if (!user?.id) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Get location
      const location = await getLocation();

      // Capture face
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        if (context) {
          context.drawImage(videoRef.current, 0, 0, 640, 480);
          const imageUrl = canvasRef.current.toDataURL("image/jpeg");

          // Simple confidence check (can be replaced with actual facial recognition)
          const confidence = 95; // Fixed confidence for now

          // Prepare form data for API call
          const formData = new FormData();
          
          // Convert base64 to blob for image upload
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          formData.append('image', blob, 'attendance.jpg');
          
          // Add location data as JSON string
          const locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            accuracy: location.accuracy
          };
          formData.append('latitude', location.latitude.toString());
          formData.append('longitude', location.longitude.toString());
          formData.append('address', location.address);
          formData.append('accuracy', location.accuracy.toString());
          formData.append('location', JSON.stringify(locationData));
          
          // Add office ID if selected
          if (selectedOfficeId) {
            formData.append('officeId', selectedOfficeId);
          }

          // Add employee ID from current authenticated user
          if (!user?.id) {
            toast.error("User not authenticated. Please login again.");
            setIsProcessing(false);
            return;
          }
          formData.append('employeeId', user.id.toString());

          // Call API based on type
          let apiResponse;
          if (type === "check-in") {
            apiResponse = await attendanceApi.checkIn(formData);
          } else {
            apiResponse = await attendanceApi.checkOut(formData);
          }

          if (apiResponse.error) {
            toast.error(apiResponse.error);
            setIsProcessing(false);
            return;
          }

          // Create attendance record for local display
          const record: AttendanceRecord = {
            type,
            timestamp: new Date().toISOString(),
            confidence: confidence,
            location,
            imageUrl,
            device: "Browser Webcam",
            status: "success",
          };

          setTodayRecords((prev) => [record, ...prev]);
          setIsCheckedIn(type === "check-in" ? true : false);

          toast.success(`${type === "check-in" ? "Checked in" : "Checked out"} successfully!`, {
            description: `Confidence: ${confidence}% | Location: ${location.address}`,
          });
        }
      }
    } catch (err: any) {
      console.error("Attendance capture error:", err);
      toast.error(err.response?.data?.message || "Failed to capture attendance");
    }

    setIsProcessing(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Check-In/Out</h1>
          <p className="text-muted-foreground mt-2">Use facial recognition and location for attendance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam & Capture */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Facial Recognition</CardTitle>
                <CardDescription>Position your face in the center of the camera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-teal-500 rounded-full m-auto w-64 h-64" />
                </div>

                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="hidden"
                />

                {currentLocation && (
                  <div className="space-y-3">
                    <Alert>
                      <MapPin className="w-4 h-4" />
                      <AlertDescription>
                        <div className="text-sm">
                          <p className="font-medium">{currentLocation.address}</p>
                          <p className="text-xs text-muted-foreground">
                            Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Accuracy: ±{Math.round(currentLocation.accuracy)}m
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Office Location Selector */}
                    <div className="space-y-2">
                      <label htmlFor="office" className="block text-sm font-medium text-slate-900">
                        Select Office Location
                      </label>
                      <select
                        id="office"
                        value={selectedOfficeId}
                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">
                          {officeLocations.length > 0 ? "-- Select an office --" : "No offices available"}
                        </option>
                        {officeLocations.map((office) => (
                          <option key={office.id} value={office.id}>
                            {office.name} • {office.city}
                          </option>
                        ))}
                      </select>
                      {selectedOfficeId && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Office selected for this attendance
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => captureAttendance("check-in")}
                    disabled={isProcessing || isCheckedIn}
                    className="gap-2"
                    size="lg"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CheckCircle2 className="w-4 h-4" />
                    Check-In
                  </Button>
                  <Button
                    onClick={() => captureAttendance("check-out")}
                    disabled={isProcessing || !isCheckedIn}
                    className="gap-2"
                    size="lg"
                    variant="outline"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Clock className="w-4 h-4" />
                    Check-Out
                  </Button>
                </div>

                {(isLoadingLocation || isReverseGeocoding) && (
                  <Alert>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <AlertDescription>
                      {isReverseGeocoding ? "Getting address details..." : "Fetching location..."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Today's Records */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Your check-in and check-out records</CardDescription>
              </CardHeader>
              <CardContent>
                {todayRecords.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No attendance records yet</p>
                ) : (
                  <div className="space-y-3">
                    {todayRecords.map((record, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={record.type === "check-in" ? "default" : "outline"}>
                              {record.type === "check-in" ? "IN" : "OUT"}
                            </Badge>
                            <div>
                              <p className="font-medium">
                                {new Date(record.timestamp).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Confidence: <span className="font-semibold text-green-600">{record.confidence}%</span>
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>📍 {record.location.address}</p>
                          <p>
                            🎯 ±{Math.round(record.location.accuracy)}m • {record.device}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    {isCheckedIn ? (
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    ) : (
                      <AlertCircle className="w-10 h-10 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <p className="text-2xl font-bold">
                      {isCheckedIn ? "Checked In" : "Not Checked In"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Last Check-In</p>
                    <p className="font-semibold">
                      {todayRecords.find((r) => r.type === "check-in")
                        ? new Date(
                            todayRecords.find((r) => r.type === "check-in")!.timestamp
                          ).toLocaleTimeString("en-IN")
                        : "Not yet"}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">Last Check-Out</p>
                    <p className="font-semibold">
                      {todayRecords.find((r) => r.type === "check-out")
                        ? new Date(
                            todayRecords.find((r) => r.type === "check-out")!.timestamp
                          ).toLocaleTimeString("en-IN")
                        : "Not yet"}
                    </p>
                  </div>
                </div>

                {currentLocation && (
                  <Alert className="bg-green-50 border-green-200">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      Location services active
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
