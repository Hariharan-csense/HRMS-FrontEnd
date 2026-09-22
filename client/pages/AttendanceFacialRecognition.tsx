import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, RefreshCw, ScanFace } from "lucide-react";
import { toast } from "sonner";
import ENDPOINTS from "@/lib/endpoint";
import { reverseGeocode } from "@/lib/locationUtils";

type PunchAction = "check-in" | "check-out";

type RecognizedEmployee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status?: string;
};

type FacialResponse = {
  employee: RecognizedEmployee;
  action: PunchAction;
  message: string;
  faceMatch: {
    confidence: number;
    comparedEmployees: number;
    skippedEmployees: number;
  };
};

const SCAN_INTERVAL_MS = 1800;
const NEXT_EMPLOYEE_DELAY_MS = 3000;

export default function AttendanceFacialRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const attendanceRequestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const scanTimerRef = useRef<number | null>(null);
  const nextEmployeeTimerRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const scannerPausedRef = useRef(false);
  const addressCacheRef = useRef(new Map<string, string>());
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Starting camera...");
  const [lastResult, setLastResult] = useState<FacialResponse | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (mountedRef.current) {
        startCamera();
      }
    };

    const handlePageHide = () => stopCamera();
    const handleWindowBlur = () => stopCamera();
    const handleWindowFocus = () => {
      if (!document.hidden && mountedRef.current) {
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      attendanceRequestRef.current?.abort();
      if (nextEmployeeTimerRef.current) {
        window.clearTimeout(nextEmployeeTimerRef.current);
      }
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (nextEmployeeTimerRef.current) {
      window.clearTimeout(nextEmployeeTimerRef.current);
      nextEmployeeTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mountedRef.current) {
      setIsCameraReady(false);
      setScannerStatus("Camera stopped");
    }
  };

  const startCamera = async () => {
    try {
      scannerPausedRef.current = false;
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (!mountedRef.current || document.hidden) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
        setScannerStatus("Scanner active");
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      toast.error(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied."
          : "Unable to start camera.",
      );
    }
  };

  useEffect(() => {
    if (!isCameraReady) return;
    if (scannerPausedRef.current) return;

    scanTimerRef.current = window.setInterval(() => {
      submitFacialAttendance();
    }, SCAN_INTERVAL_MS);

    submitFacialAttendance();

    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
    };
  }, [isCameraReady]);

  const captureAttendanceImage = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error("Camera frame is not ready");
    }

    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to capture attendance photo");
    context.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      640,
      640,
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Unable to create attendance photo")),
        "image/jpeg",
        0.82,
      );
    });
  };

  const resumeForNextEmployee = () => {
    if (!mountedRef.current || document.hidden) return;
    scannerPausedRef.current = false;
    setLastResult(null);
    setScannerStatus("Ready for next employee");
    submitFacialAttendance();
    if (!scanTimerRef.current) {
      scanTimerRef.current = window.setInterval(
        submitFacialAttendance,
        SCAN_INTERVAL_MS,
      );
    }
  };

  const getOptionalLocation = async () => {
    if (!navigator.geolocation) return null;

    return new Promise<Record<string, number | string> | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
          let address = addressCacheRef.current.get(cacheKey) || "";

          if (!address) {
            address =
              (await Promise.race([
                reverseGeocode(latitude, longitude),
                new Promise<null>((result) =>
                  window.setTimeout(() => result(null), 2500),
                ),
              ])) || "";
            if (address) addressCacheRef.current.set(cacheKey, address);
          }

          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: address || `${latitude},${longitude}`,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 },
      );
    });
  };

  const submitFacialAttendance = async () => {
    if (processingRef.current || scannerPausedRef.current) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setLastResult(null);
    setScannerStatus("Looking for a face...");

    try {
      const [location, image] = await Promise.all([
        getOptionalLocation(),
        captureAttendanceImage(),
      ]);

      setScannerStatus("Recognizing employee...");
      attendanceRequestRef.current?.abort();
      const requestController = new AbortController();
      attendanceRequestRef.current = requestController;
      const formData = new FormData();
      formData.append("action", "auto");
      if (location) formData.append("location", JSON.stringify(location));
      formData.append("image", image, `facial-attendance-${Date.now()}.jpg`);
      const response = await ENDPOINTS.facialRecognitionAttendance(formData);
      if (!mountedRef.current) return;
      const result = response.data as FacialResponse;
      setLastResult(result);
      scannerPausedRef.current = true;
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      setScannerStatus("Attendance marked - ready for next employee");
      toast.success(result.message || "Attendance marked successfully");
      nextEmployeeTimerRef.current = window.setTimeout(
        resumeForNextEmployee,
        NEXT_EMPLOYEE_DELAY_MS,
      );
    } catch (error: any) {
      if (error?.code === "ERR_CANCELED" || !mountedRef.current) return;
      console.error("Facial attendance error:", error);
      if (error?.response?.status === 503) {
        scannerPausedRef.current = true;
        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        setScannerStatus("Face service unavailable");
      } else {
        setScannerStatus("Recognition failed");
      }
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Facial attendance failed",
      );
    } finally {
      attendanceRequestRef.current = null;
      processingRef.current = false;
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const restartScanner = () => {
    setLastResult(null);
    startCamera();
  };

  const employeeName = lastResult?.employee
    ? `${lastResult.employee.first_name || ""} ${lastResult.employee.last_name || ""}`.trim()
    : "";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facial Recognition</h1>
          <p className="text-muted-foreground">
            Admin-assisted check-in and check-out for employees without a phone.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="h-5 w-5" />
                Face Capture
              </CardTitle>
              <CardDescription>
                The scanner will mark check-in or check-out automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square max-h-[68vh] overflow-hidden rounded-md border bg-slate-950">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full scale-x-[-1] object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[72%] w-[58%] max-w-[420px] rounded-[50%] border-2 border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.34)]">
                    <div className="absolute left-1/2 top-[29%] h-2 w-2 -translate-x-1/2 rounded-full bg-white/90" />
                    <div className="absolute left-[25%] right-[25%] top-[36%] border-t border-dashed border-white/80" />
                    <div className="absolute left-[37%] top-[34%] h-2 w-2 rounded-full bg-white/90" />
                    <div className="absolute right-[37%] top-[34%] h-2 w-2 rounded-full bg-white/90" />
                    <div className="absolute bottom-[20%] left-[35%] right-[35%] rounded-full border-b-2 border-white/80 pb-4" />
                    <div className="absolute -left-3 top-1/2 h-px w-6 bg-white/90" />
                    <div className="absolute -right-3 top-1/2 h-px w-6 bg-white/90" />
                    <div className="absolute -top-3 left-1/2 h-6 w-px bg-white/90" />
                    <div className="absolute -bottom-3 left-1/2 h-6 w-px bg-white/90" />
                  </div>
                </div>
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-white">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting camera...
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="flex min-h-10 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-700">
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {scannerStatus}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={restartScanner}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {lastResult ? "Scan next employee" : "Restart"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recognition Result</CardTitle>
                <CardDescription>
                  The backend validates the face against the employee photo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastResult ? (
                  <div className="space-y-4">
                    <div className="rounded-md border bg-green-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold text-green-950">
                          {employeeName || "Employee identified"}
                        </p>
                        <Badge variant="default">
                          {lastResult.action === "check-in" ? "IN" : "OUT"}
                        </Badge>
                      </div>
                      <p className="text-sm text-green-900">
                        {lastResult.employee.employee_id}
                      </p>
                      {lastResult.employee.email && (
                        <p className="text-sm text-green-900">
                          {lastResult.employee.email}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Confidence</p>
                        <p className="text-xl font-bold">
                          {Math.round(lastResult.faceMatch.confidence * 100)}%
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Compared</p>
                        <p className="text-xl font-bold">
                          {lastResult.faceMatch.comparedEmployees}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
                      Waiting for one clear employee face inside the guide.
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
