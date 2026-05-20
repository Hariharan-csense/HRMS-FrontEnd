import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, AlertTriangle, Clock, User, FileText, Loader2, ChevronDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import attendanceApi from "@/components/helper/attendance/attendance"; // உங்க path correct ஆ இருக்கணும்
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { leaveTypeApi, type LeaveType } from "@/components/helper/leave/leave";
import { cn } from "@/lib/utils";

interface OverrideRecord {
  requested_by: ReactNode;
  requested_by_name?: string;
  updated_at: string | number | Date;
  created_at: string | number | Date;
  override_date?: string;
  id: string;
  recordId: string; // attendance record ID
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  originalStatus: string;
  original_status?: string;
  overriddenStatus: string;
  overridden_status?: string;
  reason: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  approvedBy?: string;
  approved_by?: string;
  approved_by_name?: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  auditTrail: {
    action: string;
    timestamp: string;
    userId: string;
  }[];
}

type AttendanceStatusOption = {
  value: string;
  label: string;
  className: string;
};

type LeaveMode = "none" | "paid" | "half";

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "-";
  const [, year, month, day] = match;
  return `${Number(day)}/${Number(month)}/${year}`;
};

const ATTENDANCE_STATUS_OPTIONS: AttendanceStatusOption[] = [
  {
    value: "absent",
    label: "Absent",
    className:
      "border-red-200 text-red-700 hover:bg-red-50 data-[active=true]:border-red-700 data-[active=true]:bg-red-700 data-[active=true]:text-white",
  },
  {
    value: "half",
    label: "Half Day",
    className:
      "border-amber-200 text-amber-700 hover:bg-amber-50 data-[active=true]:border-amber-300 data-[active=true]:bg-amber-100 data-[active=true]:text-amber-900",
  },
  {
    value: "present",
    label: "Present",
    className:
      "border-emerald-200 text-emerald-700 hover:bg-emerald-50 data-[active=true]:border-emerald-300 data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-900",
  },
  {
    value: "late",
    label: "Late",
    className:
      "border-orange-200 text-orange-700 hover:bg-orange-50 data-[active=true]:border-orange-300 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-900",
  },
  {
    value: "week_off",
    label: "Week Off",
    className:
      "border-slate-200 text-slate-700 hover:bg-slate-50 data-[active=true]:border-slate-300 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900",
  },
  {
    value: "holiday",
    label: "Holiday",
    className:
      "border-indigo-200 text-indigo-700 hover:bg-indigo-50 data-[active=true]:border-indigo-300 data-[active=true]:bg-indigo-100 data-[active=true]:text-indigo-900",
  },
];

const getAttendanceStatusLabel = (status: string) =>
  ATTENDANCE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;

const getStatusDisplayText = (status?: string | null) =>
  getAttendanceStatusLabel(String(status || "-")).toUpperCase();

export default function AttendanceOverride() {
  const { canPerformModuleAction, hasAnyRole } = useRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingOverride, setIsCreatingOverride] = useState(false);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [processingOverrideId, setProcessingOverrideId] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    employeeId: "",
    date: "",
    originalStatus: "absent",
    overriddenStatus: "present",
    reason: "",
    requestedCheckIn: "",
    requestedCheckOut: "",
    leaveMode: "none" as LeaveMode,
    leaveTypeName: "",
  });

  const defaultEmployeeId = useMemo(() => {
    const employeeIdFromSearch = searchParams.get("employeeId");
    if (employeeIdFromSearch?.trim()) {
      return employeeIdFromSearch.trim();
    }

    const authUser = user as (typeof user & {
      employee_id?: string;
      employeeId?: string;
    }) | null;

    if (authUser?.employee_id?.trim()) {
      return authUser.employee_id.trim();
    }

    if (authUser?.employeeId?.trim()) {
      return authUser.employeeId.trim();
    }

    try {
      const storedUserRaw = localStorage.getItem("user");
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      const storedEmployeeId =
        storedUser?.employee_id || storedUser?.employeeId || storedUser?.id;

      if (String(storedEmployeeId || "").trim()) {
        return String(storedEmployeeId).trim();
      }
    } catch (error) {
      console.error("Failed to resolve default employee ID", error);
    }

    return String(user?.id || "").trim();
  }, [searchParams, user]);

  useEffect(() => {
    const employeeId = searchParams.get("employeeId") || defaultEmployeeId || "";
    const date = searchParams.get("date") || "";

    if (employeeId || date) {
      setOverrideForm((prev) => ({
        ...prev,
        employeeId,
        date,
      }));
    }
  }, [defaultEmployeeId, searchParams]);

  // Fetch override history from backend
const fetchOverrides = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await attendanceApi.getOverrides();

    const responseData: any = result.data;

    if (responseData) {
      // Backend response-ல data array இருக்கு → அதை extract பண்ணுங்க
      const overrideList = Array.isArray(responseData) 
        ? responseData 
        : responseData.data || responseData.overrides || [];

      setOverrides(overrideList);
    } else {
      setOverrides([]);
      if (result.error) {
        toast.error(result.error);
      }
    }
  } catch (err) {
    console.error("Fetch overrides error:", err);
    setError("Failed to load override history");
    toast.error("Server error");
    setOverrides([]); // error-லயும் array ஆக set பண்ணுங்க
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchOverrides();
}, []);

useEffect(() => {
  const fetchLeaveTypes = async () => {
    setLeaveTypesLoading(true);
    const result = await leaveTypeApi.getLeaveTypes();
    const responseData: any = result.data;

    if (responseData) {
      setLeaveTypes(result.data.filter((leaveType) => leaveType.isActive !== false));
    }
    setLeaveTypesLoading(false);
  };

  if (isCreatingOverride) {
    fetchLeaveTypes();
  }
}, [isCreatingOverride]);

const selectedLeaveType = useMemo(
  () => leaveTypes.find((leaveType) => leaveType.name === overrideForm.leaveTypeName) || null,
  [leaveTypes, overrideForm.leaveTypeName]
);

const requiresTimeFields =
  overrideForm.leaveMode === "none" &&
  (overrideForm.overriddenStatus === "present" || overrideForm.overriddenStatus === "half");

const buildOverrideReason = () => {
  const trimmedReason = overrideForm.reason.trim();
  const leaveLabel =
    overrideForm.leaveMode === "paid"
      ? "Paid Leave"
      : overrideForm.leaveMode === "half"
        ? "Half Day Leave"
        : "";

  if (!leaveLabel || !overrideForm.leaveTypeName) {
    return trimmedReason;
  }

  return `[${leaveLabel} - ${overrideForm.leaveTypeName}] ${trimmedReason}`;
};

const resetOverrideForm = () => {
  setOverrideForm({
    employeeId: defaultEmployeeId,
    date: "",
    originalStatus: "absent",
    overriddenStatus: "present",
    requestedCheckIn: "",
    requestedCheckOut: "",
    reason: "",
    leaveMode: "none",
    leaveTypeName: "",
  });
};

const handleStatusSelection = (value: string) => {
  setOverrideForm((prev) => {
    const nextForm = {
      ...prev,
      overriddenStatus: value,
    };

    if (value !== "half" && prev.leaveMode === "half") {
      nextForm.leaveMode = "none";
      nextForm.leaveTypeName = "";
    }

    return nextForm;
  });
};

const handleOriginalStatusSelection = (value: string) => {
  setOverrideForm((prev) => ({
    ...prev,
    originalStatus: value,
    overriddenStatus: prev.overriddenStatus === value ? "present" : prev.overriddenStatus,
  }));
};

const handleLeaveModeSelection = (leaveMode: LeaveMode) => {
  setOverrideForm((prev) => ({
    ...prev,
    leaveMode,
    leaveTypeName: "",
    overriddenStatus:
      leaveMode === "half"
        ? "half"
        : prev.overriddenStatus === "half"
          ? "absent"
          : prev.overriddenStatus,
    requestedCheckIn: leaveMode === "none" ? prev.requestedCheckIn : "",
    requestedCheckOut: leaveMode === "none" ? prev.requestedCheckOut : "",
  }));
};


const handleCreateOverride = async () => {
  if (
    !overrideForm.employeeId.trim() ||
    !overrideForm.date ||
    !overrideForm.reason.trim()
  ) {
    toast.error("Employee ID, date and reason are required");
    return;
  }

  if (requiresTimeFields && (!overrideForm.requestedCheckIn || !overrideForm.requestedCheckOut)) {
    toast.error("Requested check-in and check-out are required for present or half day override");
    return;
  }

  if (overrideForm.leaveMode !== "none" && !overrideForm.leaveTypeName) {
    toast.error("Select a leave type");
    return;
  }

  setIsSubmittingOverride(true);
  try {
    const result = await attendanceApi.createOverride({
      employeeId: overrideForm.employeeId,
      reason: buildOverrideReason(),
      requestedCheckIn: requiresTimeFields ? overrideForm.requestedCheckIn || undefined : undefined,
      requestedCheckOut: requiresTimeFields ? overrideForm.requestedCheckOut || undefined : undefined,
      leaveMode: overrideForm.leaveMode,
      date: overrideForm.date,
      originalStatus: overrideForm.originalStatus,
      overriddenStatus: overrideForm.overriddenStatus,
    });

    if (result.success || result.data) {
      toast.success("Override request created successfully!");
      setIsCreatingOverride(false);
      resetOverrideForm();
      await fetchOverrides();
    } else {
      toast.error(result.error || "Failed to create override");
    }
  } catch (err) {
    toast.error("Network error. Please try again.");
  } finally {
    setIsSubmittingOverride(false);
  }
};

const canApproveOverride =
  hasAnyRole(["admin", "ceo", "superadmin"]) &&
  (
    canPerformModuleAction("attendance", "approve", "override") ||
    canPerformModuleAction("attendance", "update", "override")
  );

const canRejectOverride =
  hasAnyRole(["admin", "ceo", "superadmin"]) &&
  (
    canPerformModuleAction("attendance", "reject", "override") ||
    canPerformModuleAction("attendance", "update", "override")
  );

const statusChoices = useMemo(
  () =>
    ATTENDANCE_STATUS_OPTIONS.filter(
      (statusOption) => statusOption.value !== overrideForm.originalStatus
    ),
  [overrideForm.originalStatus]
);

const handleProcessOverride = async (overrideId: string, status: "approved" | "rejected") => {
  setProcessingOverrideId(overrideId);
  try {
    const result = await attendanceApi.processOverride(overrideId, { status });
    if (result.success || result.data) {
      toast.success(`Override ${status} successfully`);
      await fetchOverrides();
    } else {
      toast.error(result.error || `Failed to ${status} override`);
    }
  } catch (err) {
    toast.error("Network error. Please try again.");
  } finally {
    setProcessingOverrideId(null);
  }
};
 const filteredOverrides = useMemo(() => {
  // Safety first
  if (!overrides || !Array.isArray(overrides)) {
    return [];
  }

  if (!searchTerm.trim()) {
    return overrides;
  }

  const lowerSearch = searchTerm.toLowerCase().trim();

  return overrides.filter((override) => {
    if (!override) return false;

    return (
      (override.employeeName || "").toLowerCase().includes(lowerSearch) ||
      (override.employeeId || "").toLowerCase().includes(lowerSearch) ||
      (override.recordId || "").toLowerCase().includes(lowerSearch) ||
      (override.reason || "").toLowerCase().includes(lowerSearch)
    );
  });
}, [overrides, searchTerm]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatRequestedTime = (value?: string | null) => {
    if (!value) return "-";
    const [hourText, minuteText = "00"] = String(value).split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (Number.isNaN(hour)) return String(value);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
  };

  const renderOverrideActions = (override: any, compact = false) => (
    <div className={`flex items-center ${compact ? "justify-start" : "justify-end"} gap-2 flex-wrap`}>
      {override.status === "pending" && (
        <>
          {canApproveOverride && (
            <Button
              size="sm"
              onClick={() => handleProcessOverride(String(override.id), "approved")}
              disabled={processingOverrideId === String(override.id)}
            >
              {processingOverrideId === String(override.id) ? "Processing..." : "Approve"}
            </Button>
          )}
          {canRejectOverride && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleProcessOverride(String(override.id), "rejected")}
              disabled={processingOverrideId === String(override.id)}
            >
              {processingOverrideId === String(override.id) ? "Processing..." : "Reject"}
            </Button>
          )}
        </>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <FileText className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Trail - OVR{String(override.id).padStart(3, "0")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{String(override.employee_id).padStart(3, "0")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Date</p>
                <p className="font-medium">
                  {override.override_date
                    ? formatDateOnly(override.override_date)
                    : "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Reason</p>
              <p className="p-4 bg-blue-50 border border-blue-200 rounded-lg">{override.reason}</p>
            </div>

            <div>
              <p className="font-medium mb-2">Requested Entry</p>
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Requested Check-in</p>
                  <p className="font-medium">{formatRequestedTime(override.requested_check_in)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Check-out</p>
                  <p className="font-medium">{formatRequestedTime(override.requested_check_out)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-4">Audit Trail</p>
              <div className="space-y-3">
                <div className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Override Created</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Requested by: {override.requested_by_name || `User ID ${override.requested_by}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(override.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {(override.approvedBy || override.approved_by) && (
                  <div className="flex gap-4 p-4 border rounded-lg">
                    <div
                      className={`w-2 h-2 mt-2 flex-shrink-0 rounded-full ${
                        override.status === "rejected" ? "bg-red-600" : "bg-green-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          override.status === "rejected" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {override.status === "rejected" ? "Rejected" : "Approved"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Approved by: {override.approved_by_name || override.approvedBy || override.approved_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(override.updated_at).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Attendance Override
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Manage attendance adjustments with audit trail
          </p>
        </div>

        {/* Hard Rule Alert */}
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 p-3 sm:p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <AlertDescription className="text-amber-900 dark:text-amber-200 text-xs sm:text-sm ml-2">
            <strong>Hard Rule:</strong> All attendance changes must go through the override process with reason and approval.
          </AlertDescription>
        </Alert>

        {/* Create Override Button */}
        <div className="flex justify-end">
          <Dialog open={isCreatingOverride} onOpenChange={setIsCreatingOverride}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Clock className="w-4 h-4" />
                New Override Request
              </Button>
            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create Attendance Override</DialogTitle>
                  <DialogDescription>
                    All overrides are logged with audit trail
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">
                        Employee ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="employeeId"
                        placeholder="e.g., EMP003 / CMS001"
                        value={overrideForm.employeeId}
                        onChange={(e) =>
                          setOverrideForm((prev) => ({
                            ...prev,
                            employeeId: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overrideDate">
                        Attendance Date <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="overrideDate"
                          type="date"
                          value={overrideForm.date}
                          onChange={(e) =>
                            setOverrideForm((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={resetOverrideForm}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold">
                          {overrideForm.date
                            ? new Date(`${overrideForm.date}T00:00:00`).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                              })
                            : "Select attendance date"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pick the final attendance state for this day.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {ATTENDANCE_STATUS_OPTIONS.map((statusOption) => (
                          <button
                            key={statusOption.value}
                            type="button"
                            data-active={overrideForm.originalStatus === statusOption.value}
                            onClick={() => handleOriginalStatusSelection(statusOption.value)}
                            className={cn(
                              "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                              statusOption.className
                            )}
                          >
                            {statusOption.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Override Status</Label>
                      <div className="flex flex-wrap gap-3">
                        {statusChoices.map((statusOption) => (
                          <button
                            key={statusOption.value}
                            type="button"
                            data-active={overrideForm.overriddenStatus === statusOption.value}
                            onClick={() => handleStatusSelection(statusOption.value)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                              statusOption.className
                            )}
                          >
                            {statusOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                    <div>
                      <Label>Leaves</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select leave mode if this override should be treated as leave.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        data-active={overrideForm.leaveMode === "paid"}
                        onClick={() => handleLeaveModeSelection(overrideForm.leaveMode === "paid" ? "none" : "paid")}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                          "border-violet-200 text-violet-700 hover:bg-violet-100",
                          overrideForm.leaveMode === "paid" && "border-violet-300 bg-violet-100 text-violet-900"
                        )}
                      >
                        Paid Leave
                      </button>
                      <button
                        type="button"
                        data-active={overrideForm.leaveMode === "half"}
                        onClick={() => handleLeaveModeSelection(overrideForm.leaveMode === "half" ? "none" : "half")}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                          "border-indigo-200 text-indigo-700 hover:bg-indigo-100",
                          overrideForm.leaveMode === "half" && "border-indigo-300 bg-indigo-100 text-indigo-900"
                        )}
                      >
                        Half Day Leave
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            {overrideForm.leaveTypeName || "Choose Leave Type"}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          {leaveTypesLoading ? (
                            <DropdownMenuItem disabled>Loading leave types...</DropdownMenuItem>
                          ) : leaveTypes.length > 0 ? (
                            leaveTypes.map((leaveType) => (
                              <DropdownMenuItem
                                key={leaveType.id}
                                onClick={() =>
                                  setOverrideForm((prev) => ({
                                    ...prev,
                                    leaveMode: prev.leaveMode === "none" ? "paid" : prev.leaveMode,
                                    leaveTypeName: leaveType.name,
                                  }))
                                }
                              >
                                {leaveType.name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>No leave types found</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {selectedLeaveType && (
                      <div className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
                        {selectedLeaveType.name}
                        {selectedLeaveType.maxDays ? ` • Max ${selectedLeaveType.maxDays} days` : ""}
                        {selectedLeaveType.isPaid ? " • Paid" : " • Unpaid"}
                      </div>
                    )}
                  </div>

                  {requiresTimeFields && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="requestedCheckIn">
                          Requested Check-in <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="requestedCheckIn"
                          type="time"
                          value={overrideForm.requestedCheckIn}
                          onChange={(e) =>
                            setOverrideForm((prev) => ({
                              ...prev,
                              requestedCheckIn: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestedCheckOut">
                          Requested Check-out <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="requestedCheckOut"
                          type="time"
                          value={overrideForm.requestedCheckOut}
                          onChange={(e) =>
                            setOverrideForm((prev) => ({
                              ...prev,
                              requestedCheckOut: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Reason for Override <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide detailed reason for this override"
                      className="min-h-32"
                      value={overrideForm.reason}
                      onChange={(e) =>
                        setOverrideForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: Doctor appointment with verified medical certificate
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingOverride(false);
                        resetOverrideForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOverride} disabled={isSubmittingOverride}>
                      {isSubmittingOverride ? "Creating..." : "Create & Submit"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading override history...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchOverrides} variant="outline" className="mt-4">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOverrides.length === 0 && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No override records found</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Override History Table */}
        {!loading && !error && filteredOverrides.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Override History</CardTitle>
                  <CardDescription>
                    All attendance override requests ({filteredOverrides.length})
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search overrides..."
                    className="pl-10 w-full sm:w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="md:hidden space-y-3">
                {filteredOverrides.map((override) => (
                  <div key={override.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm">OVR{String(override.id).padStart(3, "0")}</p>
                        <p className="text-xs text-muted-foreground">
                          Emp: {String(override.employee_id).padStart(3, "0")}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(override.status)}>{override.status.toUpperCase()}</Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Date:{" "}
                      {override.override_date
                        ? formatDateOnly(override.override_date)
                        : "-"}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{override.original_status?.toUpperCase()}</Badge>
                      <span className="text-muted-foreground">to</span>
                      <Badge variant="default">{override.overridden_status?.toUpperCase()}</Badge>
                    </div>

                    <p className="text-sm break-words">{override.reason || "-"}</p>
                    {renderOverrideActions(override, true)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table className="table-fixed">
                  <colgroup>
                    <col className="w-[86px]" />
                    <col className="w-[110px]" />
                    <col className="w-[100px]" />
                    <col className="w-[220px]" />
                    <col />
                    <col className="w-[130px]" />
                    <col className="w-[190px]" />
                    <col className="w-[220px]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status Change</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
<TableBody>
  {filteredOverrides.length === 0 ? (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
        No override records found
      </TableCell>
    </TableRow>
  ) : (
    filteredOverrides.map((override) => (
      <TableRow key={override.id}>
        {/* ID */}
        <TableCell className="font-mono text-sm whitespace-nowrap">
          OVR{String(override.id).padStart(3, "0")}
        </TableCell>

        {/* Employee */}
        <TableCell>
          <div>
            {/* <p className="font-medium">Unknown Employee</p> employee_name இல்லை → backend-ல join பண்ணி அனுப்புங்க அல்லது fallback */}
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {String(override.employee_id).padStart(3, "0")}
            </p>
          </div>
        </TableCell>

        {/* Date */}
        <TableCell className="whitespace-nowrap">
          {override.override_date 
            ? formatDateOnly(override.override_date)
            : "-"}
        </TableCell>

        {/* Status Change */}
        <TableCell>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Badge variant="secondary" className="inline-flex min-w-[78px] justify-center whitespace-nowrap rounded-full px-3 py-1">
              {getStatusDisplayText(override.original_status)}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="default" className="inline-flex min-w-[78px] justify-center whitespace-nowrap rounded-full px-3 py-1">
              {getStatusDisplayText(override.overridden_status)}
            </Badge>
          </div>
        </TableCell>

        {/* Reason */}
        <TableCell>
          <p className="line-clamp-2 break-words leading-5" title={override.reason || ""}>
            {override.reason || "-"}
          </p>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge
            className="inline-flex min-w-[92px] justify-center whitespace-nowrap rounded-full px-3 py-1"
            variant={
              override.status === "approved" ? "default" :
              override.status === "rejected" ? "destructive" :
              "secondary"
            }
          >
            {override.status.toUpperCase()}
          </Badge>
        </TableCell>

        {/* Submitted */}
        <TableCell className="text-sm">
          {override.created_at 
            ? new Date(override.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </TableCell>

        {/* Actions - Process + Audit Trail */}
        <TableCell className="text-right">
          {renderOverrideActions(override)}
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
