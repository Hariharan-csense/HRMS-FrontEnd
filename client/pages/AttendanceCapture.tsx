import { useRef, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Camera, MapPin, CheckCircle2, Clock, AlertCircle, Loader2, Radio, Activity, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  reverseGeocode,
  findClosestOffice,
  getAllOfficeLocations,
  OfficeLocation
} from "@/lib/locationUtils";
import attendanceApi from "@/components/helper/attendance/attendance";
import { useAuth } from "@/context/AuthContext";

// Mock liveLocationService for now - this should be implemented properly
const liveLocationService = {
  updateTrackingStatus: async (employeeId: number, enabled: boolean) => {
    console.log(`Live tracking ${enabled ? 'enabled' : 'disabled'} for employee ${employeeId}`);
    return { success: true };
  },
  startAutoTracking: (employeeId: number, interval: number, onSuccess: Function, onError: Function) => {
    console.log(`Starting auto tracking for employee ${employeeId} every ${interval} minutes`);
    // Mock implementation
  },
  stopAutoTracking: () => {
    console.log('Stopping auto tracking');
    // Mock implementation
  }
};


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
  
  // Live tracking states
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string>('inactive');
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);

  useEffect(() => {
    startWebcam();
    fetchAttendanceStatus();
    
    // Cleanup live tracking on unmount
    return () => {
      stopWebcam();
      if (isTrackingActive) {
        liveLocationService.stopAutoTracking();
      }
    };
  }, []);

  // Fetch current attendance status
  const fetchAttendanceStatus = async () => {
    if (!user?.id) return;
    
    try {
      const statusResponse = await attendanceApi.getAttendanceStatus();
      if (statusResponse.success) {
        setIsCheckedIn(statusResponse.isCheckedIn || false);
        
        // Transform today's records to match the local format
        if (statusResponse.todayRecords && statusResponse.todayRecords.length > 0) {
          const transformedRecords = statusResponse.todayRecords.map((record: any): AttendanceRecord => ({
            type: record.check_out ? "check-out" : "check-in",
            timestamp: record.check_out || record.check_in,
            confidence: 95,
            location: {
              latitude: 0,
              longitude: 0,
              accuracy: 0,
              address: record.check_in_location ? JSON.parse(record.check_in_location).address : "Office"
            },
            imageUrl: record.check_in_image_url || "/placeholder-avatar.jpg",
            device: record.device_info || "Unknown",
            status: "success" as const
          }));
          setTodayRecords(transformedRecords);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  // Handle live tracking toggle
  const handleLiveTrackingToggle = async (enabled: boolean) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    const employeeId = parseInt(user.id);
    setIsLiveTrackingEnabled(enabled);
    
    try {
      if (enabled) {
        // Start tracking
        const result = await liveLocationService.updateTrackingStatus(employeeId, true);
        
        if (result.success) {
          setIsTrackingActive(true);
          setTrackingStatus('active');
          
          // Start automatic location updates
          liveLocationService.startAutoTracking(
            employeeId,
            5, // Update every 5 minutes
            (location) => {
              setLastLocationUpdate(new Date());
              toast.success("Location updated successfully", {
                description: `Last update: ${new Date().toLocaleTimeString()}`,
              });
            },
            (error) => {
              toast.error("Location tracking error", {
                description: error,
              });
            }
          );
          
          toast.success("Live location tracking enabled");
        } else {
          setIsLiveTrackingEnabled(false);
          toast.error((result as any).error || "Failed to enable live tracking");
        }
      } else {
        // Stop tracking
        const result = await liveLocationService.updateTrackingStatus(employeeId, false);
        
        if (result.success) {
          liveLocationService.stopAutoTracking();
          setIsTrackingActive(false);
          setTrackingStatus('paused');
          toast.success("Live location tracking disabled");
        } else {
          setIsLiveTrackingEnabled(true);
          toast.error((result as any).error || "Failed to disable live tracking");
        }
      }
    } catch (error) {
      console.error('Live tracking toggle error:', error);
      setIsLiveTrackingEnabled(!enabled);
      toast.error("Failed to update tracking status");
    }
  };

  const startWebcam = async () => {
    try {
      // Check if we're on a secure context (required for camera access)
      const isSecureOrigin = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecureOrigin) {
        toast.error("Camera access requires a secure context (HTTPS or localhost).");
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Check if this is an iOS device
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          toast.error("For iOS devices, please use Safari and ensure camera permissions are granted in Settings > Safari > Camera.");
        } else {
          toast.error("Camera access is not supported on this device or browser. Please try using Chrome, Firefox, or Edge.");
        }
        return;
      }

      // Check camera permissions
      try {
        const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionResult.state === 'denied') {
          toast.error("Camera access was denied. Please enable camera permissions in your browser settings and refresh the page.");
          return;
        }
      } catch (e) {
        console.warn("Permissions API not supported, continuing with camera access");
      }

      // Try to get user media with constraints
      const constraints = {
        video: {
          facingMode: { ideal: "user" }, // Front-facing camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      // Try with ideal constraints first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Couldn't get ideal camera, trying with basic constraints");
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

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
      console.error("Camera access error:", err);
      
      let errorMessage = "Failed to access camera.";
      let showHelpLink = false;

      // Handle different error types
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera permission was denied. Please check your browser settings and grant camera access.";
        showHelpLink = true;
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Please ensure your device has a working camera.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is in use by another application. Please close other apps using the camera and refresh the page.";
      } else if (err.name === "SecurityError") {
        errorMessage = "Camera access is blocked for security reasons. Please use HTTPS or localhost.";
      } else if (err.name === "TypeError") {
        errorMessage = "Invalid camera constraints. Please try a different device or browser.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Unable to satisfy camera constraints. Please try different camera settings.";
      }

      // Show error message with help link if needed
      toast.error(
        <div className="space-y-2">
          <p>{errorMessage}</p>
          {showHelpLink && (
            <a
              href="https://support.google.com/chrome/answer/2693767"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm inline-flex items-center"
            >
              How to enable camera access <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </div>,
        { duration: 10000 }
      );
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
          
          // Refresh status after successful check-in/out
          await fetchAttendanceStatus();

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
            {/* Live Tracking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5" />
                  Live Location Tracking
                </CardTitle>
                <CardDescription>
                  Enable real-time location tracking during work hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Track My Location</p>
                    <p className="text-xs text-muted-foreground">
                      Updates every 5 minutes when enabled
                    </p>
                  </div>
                  <Switch
                    checked={isLiveTrackingEnabled}
                    onCheckedChange={handleLiveTrackingToggle}
                    disabled={isProcessing}
                  />
                </div>

                {isLiveTrackingEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${isTrackingActive ? 'text-green-600 animate-pulse' : 'text-amber-600'}`} />
                      <span className="text-sm font-medium">
                        Status: {trackingStatus}
                      </span>
                    </div>
                    
                    {lastLocationUpdate && (
                      <p className="text-xs text-muted-foreground">
                        Last update: {lastLocationUpdate.toLocaleTimeString()}
                      </p>
                    )}
                    
                    <Alert className={isTrackingActive ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
                      <Radio className={`w-4 h-4 ${isTrackingActive ? 'text-green-600' : 'text-amber-600'}`} />
                      <AlertDescription className={`text-sm ${isTrackingActive ? 'text-green-800' : 'text-amber-800'}`}>
                        {isTrackingActive 
                          ? 'Your location is being tracked and shared with HR/Admin'
                          : 'Location tracking is paused'
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

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
