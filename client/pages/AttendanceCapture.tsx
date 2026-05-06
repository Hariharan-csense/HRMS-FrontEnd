import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { reverseGeocode } from "@/lib/locationUtils";
import attendanceApi from "@/components/helper/attendance/attendance";
import { useAuth } from "@/context/AuthContext";


interface AttendanceRecord {
  type: "check-in" | "check-out";
  timestamp: string;
  confidence: number;
  attendanceStatus?: string;
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

interface PendingAttendanceCapture {
  type: "check-in" | "check-out";
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  };
  confidence: number;
}

const SELFIE_OUTPUT_SIZE = 1080;
const LIVE_TRACKING_SESSION_KEY = "attendanceLiveTrackingActive";

export default function AttendanceCapture() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  } | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [pendingAttendance, setPendingAttendance] = useState<PendingAttendanceCapture | null>(null);

  useEffect(() => {
      mountedRef.current = true;
      startWebcam();
      fetchAttendanceStatus();

      const handlePageHide = () => stopWebcam();
      const handleVisibilityChange = () => {
        if (document.hidden) {
        stopWebcam();
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup live tracking on unmount
    return () => {
      mountedRef.current = false;
      stopWebcam();
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Fetch current attendance status
  const fetchAttendanceStatus = async () => {
    if (!user?.id) return;
    
    try {
      const statusResponse = await attendanceApi.getAttendanceStatus();
      if (statusResponse.success) {
        const activeSessionFromRecords = Array.isArray(statusResponse.todayRecords)
          ? statusResponse.todayRecords.some((record: any) => Boolean(record?.check_in) && !record?.check_out)
          : false;
        setIsCheckedIn(
          typeof statusResponse.isCheckedIn === "boolean"
            ? statusResponse.isCheckedIn
            : activeSessionFromRecords
        );
        setHasCheckedInToday(
          typeof statusResponse.hasCheckedInToday === "boolean"
            ? statusResponse.hasCheckedInToday
            : Array.isArray(statusResponse.todayRecords) &&
              statusResponse.todayRecords.some((record: any) => Boolean(record?.check_in))
        );
        
        // Transform today's records to match the local format
        if (statusResponse.todayRecords && statusResponse.todayRecords.length > 0) {
          const parseLocation = (rawLocation: any) => {
            if (!rawLocation) return null;
            try {
              return typeof rawLocation === "string" ? JSON.parse(rawLocation) : rawLocation;
            } catch {
              return null;
            }
          };

          const formatCoordsLabel = (latitude: any, longitude: any) => {
            const latNum = Number(latitude);
            const lngNum = Number(longitude);
            if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
            // Use raw values (no rounding) for display.
            return `${String(latitude)},${String(longitude)}`;
          };

          const transformedRecords = statusResponse.todayRecords.flatMap((record: any): AttendanceRecord[] => {
            const records: AttendanceRecord[] = [];

            if (record.check_in) {
              const parsedLocation = parseLocation(record.check_in_location);
              const coordLabel = formatCoordsLabel(parsedLocation?.latitude, parsedLocation?.longitude);
              const safeAddress = String(parsedLocation?.address || "")
                .replace(/^zone\s*\d+\s*/i, "")
                .trim();
              records.push({
                type: "check-in",
                timestamp: record.check_in,
                confidence: 95,
                attendanceStatus: record.status,
                location: {
                  latitude: Number(parsedLocation?.latitude) || 0,
                  longitude: Number(parsedLocation?.longitude) || 0,
                  accuracy: Number(parsedLocation?.accuracy) || 0,
                  address: safeAddress || coordLabel || "Office",
                },
                imageUrl: record.check_in_image_url || "/placeholder-avatar.jpg",
                device: record.device_info || "Unknown",
                status: "success",
              });
            }

            if (record.check_out) {
              const parsedLocation = parseLocation(record.check_out_location || record.check_in_location);
              const coordLabel = formatCoordsLabel(parsedLocation?.latitude, parsedLocation?.longitude);
              const safeAddress = String(parsedLocation?.address || "")
                .replace(/^zone\s*\d+\s*/i, "")
                .trim();
              records.push({
                type: "check-out",
                timestamp: record.check_out,
                confidence: 95,
                attendanceStatus: record.status,
                location: {
                  latitude: Number(parsedLocation?.latitude) || 0,
                  longitude: Number(parsedLocation?.longitude) || 0,
                  accuracy: Number(parsedLocation?.accuracy) || 0,
                  address: safeAddress || coordLabel || "Office",
                },
                imageUrl: record.check_out_image_url || record.check_in_image_url || "/placeholder-avatar.jpg",
                device: record.device_info || "Unknown",
                status: "success",
              });
            }

            return records;
          });
          setTodayRecords(transformedRecords);
        } else {
          setTodayRecords([]);
        }
      } else if (typeof window !== "undefined") {
        setIsCheckedIn(localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true");
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      if (typeof window !== "undefined") {
        setIsCheckedIn(localStorage.getItem(LIVE_TRACKING_SESSION_KEY) === "true");
        setHasCheckedInToday(false);
      }
    }
  };

  const startWebcam = async () => {
    try {
      // Defensive: ensure no previous stream is left open before starting a new one.
      stopWebcam();

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
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        // Ensure video element is ready before attaching stream
        videoRef.current.srcObject = stream;
        const videoTrack = stream.getVideoTracks?.()[0];
        const facingMode = (videoTrack?.getSettings?.().facingMode || "").toLowerCase();
        setIsFrontCamera(facingMode === "user" || facingMode === "");

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.warn("Failed to stop media track:", error);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }

    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
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
            // Get readable location label (sanitized in locationUtils) but keep coords for display.
            const coordsLabel = `${latitude},${longitude}`;
            const readableAddress = await reverseGeocode(latitude, longitude);
            const address = readableAddress || coordsLabel;

            setCurrentLocation({ latitude, longitude, accuracy, address });
            setIsLoadingLocation(false);
            resolve({ latitude, longitude, accuracy, address });
          } catch (error) {
            const address = `${latitude},${longitude}`;
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

  const captureSelfiePreview = () => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error("Camera preview is not ready");
    }

    const context = canvasRef.current.getContext("2d");
    if (!context) {
      throw new Error("Unable to capture photo");
    }

    const frameWidth = videoRef.current.videoWidth || 1280;
    const frameHeight = videoRef.current.videoHeight || 720;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = frameWidth;
    let cropHeight = frameHeight;
    let outputWidth = SELFIE_OUTPUT_SIZE;
    let outputHeight = SELFIE_OUTPUT_SIZE;

    const previewRect = previewFrameRef.current?.getBoundingClientRect();

    if (previewRect && previewRect.width > 0 && previewRect.height > 0) {
      const videoAspectRatio = frameWidth / frameHeight;
      const previewAspectRatio = previewRect.width / previewRect.height;

      let renderedVideoWidth = previewRect.width;
      let renderedVideoHeight = previewRect.height;
      let offsetX = 0;
      let offsetY = 0;

      // Match how `object-cover` lays out the video inside the preview frame.
      if (videoAspectRatio > previewAspectRatio) {
        renderedVideoHeight = previewRect.height;
        renderedVideoWidth = renderedVideoHeight * videoAspectRatio;
        offsetX = (renderedVideoWidth - previewRect.width) / 2;
      } else {
        renderedVideoWidth = previewRect.width;
        renderedVideoHeight = renderedVideoWidth / videoAspectRatio;
        offsetY = (renderedVideoHeight - previewRect.height) / 2;
      }

      const scaleX = frameWidth / renderedVideoWidth;
      const scaleY = frameHeight / renderedVideoHeight;

      // Capture the full visible preview area instead of only the face guide,
      // so background/location context remains visible in the confirmation image.
      cropX = Math.max(0, Math.floor(offsetX * scaleX));
      cropY = Math.max(0, Math.floor(offsetY * scaleY));
      cropWidth = Math.max(1, Math.min(frameWidth - cropX, Math.floor(previewRect.width * scaleX)));
      cropHeight = Math.max(1, Math.min(frameHeight - cropY, Math.floor(previewRect.height * scaleY)));

      if (previewAspectRatio >= 1) {
        outputWidth = SELFIE_OUTPUT_SIZE;
        outputHeight = Math.max(1, Math.round(SELFIE_OUTPUT_SIZE / previewAspectRatio));
      } else {
        outputHeight = SELFIE_OUTPUT_SIZE;
        outputWidth = Math.max(1, Math.round(SELFIE_OUTPUT_SIZE * previewAspectRatio));
      }
    }

    canvasRef.current.width = outputWidth;
    canvasRef.current.height = outputHeight;

    context.clearRect(0, 0, outputWidth, outputHeight);

    if (isFrontCamera) {
      context.save();
      context.translate(outputWidth, 0);
      context.scale(-1, 1);
      context.drawImage(
        videoRef.current,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
      context.restore();
    } else {
      context.drawImage(
        videoRef.current,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }

    return canvasRef.current.toDataURL("image/jpeg", 0.95);
  };

  const captureAttendance = async (type: "check-in" | "check-out") => {
    if (!user?.id) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    if (type === "check-in" && hasCheckedInToday) {
      toast.error("You have already checked in today.");
      return;
    }

    setIsProcessing(true);

    try {
      const location = await getLocation();
      const imageUrl = captureSelfiePreview();

      setPendingAttendance({
        type,
        imageUrl,
        location,
        confidence: 95,
      });
    } catch (err: any) {
      console.error("Attendance capture error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to capture attendance");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitAttendance = async () => {
    if (!pendingAttendance) {
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated. Please login again.");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      const response = await fetch(pendingAttendance.imageUrl);
      const blob = await response.blob();
      formData.append("image", blob, "attendance.jpg");

      const locationData = {
        latitude: pendingAttendance.location.latitude,
        longitude: pendingAttendance.location.longitude,
        address: pendingAttendance.location.address,
        accuracy: pendingAttendance.location.accuracy,
      };

      formData.append("latitude", pendingAttendance.location.latitude.toString());
      formData.append("longitude", pendingAttendance.location.longitude.toString());
      formData.append("address", pendingAttendance.location.address);
      formData.append("accuracy", pendingAttendance.location.accuracy.toString());
      formData.append("location", JSON.stringify(locationData));
      formData.append("employeeId", user.id.toString());

      const apiResponse =
        pendingAttendance.type === "check-in"
          ? await attendanceApi.checkIn(formData)
          : await attendanceApi.checkOut(formData);

      if (apiResponse.error) {
        toast.error(apiResponse.error);
        return;
      }

      const attendanceStatus = apiResponse.data?.attendance?.status;
      const record: AttendanceRecord = {
        type: pendingAttendance.type,
        timestamp: new Date().toISOString(),
        confidence: pendingAttendance.confidence,
        attendanceStatus: attendanceStatus || undefined,
        location: pendingAttendance.location,
        imageUrl: pendingAttendance.imageUrl,
        device: "Browser Webcam",
        status: "success",
      };

      setTodayRecords((prev) => [record, ...prev]);
      setIsCheckedIn(pendingAttendance.type === "check-in");
      if (pendingAttendance.type === "check-in") {
        setHasCheckedInToday(true);
      }
      if (typeof window !== "undefined") {
        if (pendingAttendance.type === "check-in") {
          localStorage.setItem(LIVE_TRACKING_SESSION_KEY, "true");
        } else {
          localStorage.removeItem(LIVE_TRACKING_SESSION_KEY);
        }
      }
      setPendingAttendance(null);
      stopWebcam();
      await fetchAttendanceStatus();

      const statusLabel =
        attendanceStatus === "half_day" ? "Half Day" :
        attendanceStatus === "late" ? "Late" :
        attendanceStatus === "present" ? "Present" :
        "";

      toast.success(
        `${pendingAttendance.type === "check-in" ? "Checked in" : "Checked out"} successfully!`,
        {
          description: `Confidence: ${pendingAttendance.confidence}% | Location: ${pendingAttendance.location.address}${statusLabel ? ` | Attendance: ${statusLabel}` : ""}`,
        }
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Attendance submit error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit attendance");
    } finally {
      setIsProcessing(false);
    }
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
                <div
                  ref={previewFrameRef}
                  className="relative bg-black rounded-lg overflow-hidden aspect-[4/5] sm:aspect-[4/3] md:aspect-video min-h-[260px] sm:min-h-[320px] md:min-h-[420px]"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: isFrontCamera ? "scaleX(-1)" : "none" }}
                  />
                  <div
                    ref={guideRef}
                    className="absolute inset-0 m-auto h-[58vw] w-[58vw] max-h-64 max-w-64 rounded-full border-4 border-teal-500 sm:h-60 sm:w-60 md:h-64 md:w-64"
                  />
                </div>

                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
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
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => captureAttendance("check-in")}
                    disabled={isProcessing || hasCheckedInToday}
                    variant={hasCheckedInToday ? "secondary" : "default"}
                    className={`gap-2 ${hasCheckedInToday ? "bg-muted text-muted-foreground hover:bg-muted" : "bg-[#17c491] hover:bg-[#12a978] text-white"}`}
                    size="lg"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CheckCircle2 className="w-4 h-4" />
                    Check-In
                  </Button>
                  <Button
                    onClick={() => captureAttendance("check-out")}
                    disabled={isProcessing || !isCheckedIn}
                    variant={isCheckedIn ? "default" : "outline"}
                    className={`gap-2 ${isCheckedIn ? "bg-[#17c491] hover:bg-[#12a978] text-white" : ""}`}
                    size="lg"
                  >
                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Clock className="w-4 h-4" />
                    Check-Out
                  </Button>
                </div>

                {isLoadingLocation && (
                  <Alert>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <AlertDescription>
                      Fetching location...
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
                            {record.type === "check-in" && record.attendanceStatus && (
                              <p
                                className={`text-xs font-semibold ${
                                  record.attendanceStatus === "half_day"
                                    ? "text-amber-600"
                                    : record.attendanceStatus === "late"
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {record.attendanceStatus === "half_day"
                                  ? "Half Day"
                                  : record.attendanceStatus === "late"
                                  ? "Late"
                                  : "Present"}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Confidence: <span className="font-semibold text-green-600">{record.confidence}%</span>
                            </p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>🗺️ {record.location.address}</p>
                          <p>
                            📍{" "}
                            {Number.isFinite(record.location.latitude) &&
                            Number.isFinite(record.location.longitude) &&
                            (record.location.latitude !== 0 || record.location.longitude !== 0)
                              ? `${record.location.latitude.toFixed(6)},${record.location.longitude.toFixed(6)}`
                              : "—"}
                          </p>
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
                      {isCheckedIn ? "Checked In" : hasCheckedInToday ? "Checked Out" : "Not Checked In"}
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

      <Dialog
        open={Boolean(pendingAttendance)}
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setPendingAttendance(null);
          }
        }}
      >
        <DialogContent className="w-[92vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:grid sm:aspect-square sm:w-[32rem] sm:max-w-[32rem] sm:grid-rows-[auto_1fr_auto] sm:overflow-hidden sm:p-5">
          <DialogHeader>
            <DialogTitle>
              Confirm {pendingAttendance?.type === "check-in" ? "Check-In" : "Check-Out"}
            </DialogTitle>
            <DialogDescription>
              Review the captured photo and confirm before marking attendance.
            </DialogDescription>
          </DialogHeader>

          {pendingAttendance && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-slate-100">
                <img
                  src={pendingAttendance.imageUrl}
                  alt={`${pendingAttendance.type} preview`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700 space-y-2">
                <p>
                  <span className="font-medium">Action:</span>{" "}
                  {pendingAttendance.type === "check-in" ? "Check-In" : "Check-Out"}
                </p>
                <p>
                  <span className="font-medium">Location:</span> {pendingAttendance.location.address}
                </p>
                <p>
                  <span className="font-medium">Coordinates:</span>{" "}
                  {pendingAttendance.location.latitude.toFixed(6)}, {pendingAttendance.location.longitude.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">Accuracy:</span> +/-{Math.round(pendingAttendance.location.accuracy)}m
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              onClick={submitAttendance}
              disabled={isProcessing || !pendingAttendance}
              className="w-full bg-[#17c491] text-white hover:bg-[#12a978] sm:w-auto"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
            <Button
              variant="outline"
              onClick={() => setPendingAttendance(null)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
