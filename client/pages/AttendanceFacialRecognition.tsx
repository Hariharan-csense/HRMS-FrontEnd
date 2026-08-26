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
import * as faceapi from "face-api.js";
import ENDPOINTS from "@/lib/endpoint";

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

const SCAN_INTERVAL_MS = 2800;
const NO_FACE_TOAST_COOLDOWN_MS = 6000;
const FACE_MODEL_URL = "/models";

export default function AttendanceFacialRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const attendanceRequestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const scanTimerRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const lastNoFaceToastAtRef = useRef(0);
  const scannerPausedRef = useRef(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [areFaceModelsReady, setAreFaceModelsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Starting camera...");
  const [lastResult, setLastResult] = useState<FacialResponse | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    loadBrowserFaceModels();
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
      stopCamera();
    };
  }, []);

  const loadBrowserFaceModels = async () => {
    try {
      setScannerStatus("Loading face models...");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
      ]);

      if (mountedRef.current) {
        setAreFaceModelsReady(true);
        setScannerStatus("Scanner active");
      }
    } catch (error) {
      console.error("Browser face model load error:", error);
      setScannerStatus("Browser face models missing");
      toast.error("Unable to load browser face recognition models.");
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
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
          width: { ideal: 1280 },
          height: { ideal: 1280 },
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
        setScannerStatus(
          areFaceModelsReady ? "Scanner active" : "Loading face models...",
        );
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
    if (!areFaceModelsReady) return;
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
  }, [isCameraReady, areFaceModelsReady]);

  const detectFaceDescriptorFromVideo = async () => {
    if (!videoRef.current) {
      throw new Error("Camera is not ready");
    }

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.2,
          maxResults: 1,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return Array.from(detection.descriptor);
  };

  const showNoFaceToast = (message: string) => {
    const now = Date.now();
    if (now - lastNoFaceToastAtRef.current < NO_FACE_TOAST_COOLDOWN_MS) {
      return;
    }

    lastNoFaceToastAtRef.current = now;
    toast.error(message);
  };

  const getOptionalLocation = async () => {
    if (!navigator.geolocation) return null;

    return new Promise<Record<string, number> | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
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
      if (!areFaceModelsReady) {
        setScannerStatus("Loading face models...");
        return;
      }

      const [descriptor, location] = await Promise.all([
        detectFaceDescriptorFromVideo(),
        getOptionalLocation(),
      ]);

      if (!descriptor) {
        setScannerStatus("No face detected");
        showNoFaceToast("No face was detected. Please center one face in the frame.");
        return;
      }

      setScannerStatus("Recognizing employee...");
      attendanceRequestRef.current?.abort();
      const requestController = new AbortController();
      attendanceRequestRef.current = requestController;
      const response = await ENDPOINTS.facialRecognitionDescriptorAttendance({
        action: "auto",
        descriptor,
        location,
      }, { signal: requestController.signal });
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
    } catch (error: any) {
      if (error?.code === "ERR_CANCELED" || !mountedRef.current) return;
      console.error("Facial attendance error:", error);
      if (error?.response?.status === 503) {
        scannerPausedRef.current = true;
        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        setScannerStatus("Server face models missing");
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
                          {lastResult.faceMatch.confidence}%
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
