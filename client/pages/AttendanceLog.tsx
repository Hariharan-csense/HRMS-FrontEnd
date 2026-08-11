import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Timer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import attendanceApi from "@/components/helper/attendance/attendance";
import {
  holidayApi,
  Holiday,
  leaveTypeApi,
  type LeaveApplication,
  type LeaveType,
} from "@/components/helper/leave/leave";
import { leavePermissionApi } from "@/components/helper/leavePermission/leavePermission";
import shiftApi, { Shift } from "@/components/helper/shifts/shifts";
import { employeeApi } from "@/components/helper/employee/employee";
import { BASE_URL } from "@/lib/endpoint";
import { cn } from "@/lib/utils";

// src/api/attendanceApi.ts
export interface AttendanceGeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
}

export interface AttendanceLogRecord {
  id: string;
  employeeId: string; // ← employee_id → employeeId
  employeeName: string; // ← employee_name → employeeName
  reportingManager?: string;
  date: string;
  inTime?: string; // ← check_in → inTime
  outTime?: string; // ← check_out → outTime
  type: "full" | "half" | "absent" | "present" | "unmarked" | "leave";
  inConfidence?: number;
  outConfidence?: number;
  imageUrl?: string; // Legacy field - kept for compatibility
  imageIn?: string; // Check-in image URL
  imageOut?: string; // Check-out image URL
  device: string;
  // Backward-compatible convenience field (defaults to check-in location)
  location: AttendanceGeoLocation;
  checkInLocation?: AttendanceGeoLocation;
  checkOutLocation?: AttendanceGeoLocation;
  status:
    | "present"
    | "absent"
    | "half"
    | "miss"
    | "unmarked"
    | "late"
    | "grace"
    | "leave"
    | "week_off"
    | "holiday";
  hoursWorked: number;
  overtimeHours: number;
  autoFlag: boolean;
  flagReason?: string;
  lateBy?: string; // How many minutes late
  clientId?: string | number | null;
  clientName?: string | null;
  clientCode?: string | null;
  originalEmployeeId?: number; // ← original employee_id from backend
}

export interface AttendanceLogRecord {
  isLeaveRecord?: boolean;
  isPermissionRecord?: boolean;
  leaveTypeName?: string;
  leaveStatus?: string;
  leaveSource?: "application" | "override" | "permission";
  permissionStatus?: string;
}

type CalendarLeaveEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  leaveTypeName: string;
  reason?: string;
  status: string;
  leaveMode: "paid" | "half" | "permission";
  source: "application" | "override" | "permission";
};

const mockData: AttendanceLogRecord[] = [
  {
    id: "ATT001",
    employeeId: "EMP001",
    employeeName: "John Administrator",
    reportingManager: "John Administrator",
    date: "2025-12-15",
    inTime: "09:05",
    outTime: "18:32",
    type: "full",
    inConfidence: 92,
    outConfidence: 95,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp001",
    imageIn: "http://192.168.1.9:3000/uploads/attendance/checkin001.jpg",
    imageOut: "http://192.168.1.9:3000/uploads/attendance/checkout001.jpg",
    device: "Browser Webcam",
    location: {
      latitude: 13.0827,
      longitude: -80.2707,
      accuracy: 12,
      address: "Chennai - Office Building A",
    },
    status: "present",
    hoursWorked: 9.45,
    overtimeHours: 0.45,
    autoFlag: false,
  },
  {
    id: "ATT002",
    employeeId: "EMP002",
    employeeName: "Sarah Johnson",
    reportingManager: "Michael Manager",
    date: "2025-12-16",
    inTime: "09:30",
    outTime: "18:15",
    type: "present",
    inConfidence: 88,
    outConfidence: 92,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp002",
    imageIn: "http://192.168.1.9:3000/uploads/attendance/checkin002.jpg",
    imageOut: "http://192.168.1.9:3000/uploads/attendance/checkout002.jpg",
    device: "Desktop Webcam",
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 15,
      address: "Bangalore - Tech Park",
    },
    status: "present",
    hoursWorked: 8.75,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT003",
    employeeId: "EMP003",
    employeeName: "Michael Chen",
    reportingManager: "Michael Manager",
    date: "2025-12-17",
    inTime: "09:15",
    outTime: "13:45",
    type: "half",
    inConfidence: 91,
    outConfidence: 89,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp003",
    imageIn: "http://192.168.1.9:3000/uploads/attendance/checkin003.jpg",
    imageOut: "http://192.168.1.9:3000/uploads/attendance/checkout003.jpg",
    device: "Mobile Camera",
    location: {
      latitude: 19.076,
      longitude: 72.8777,
      accuracy: 18,
      address: "Mumbai - HQ",
    },
    status: "half",
    hoursWorked: 4.5,
    overtimeHours: 0,
    autoFlag: true,
    flagReason: "Early checkout - half day flagged",
  },
  {
    id: "ATT004",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    reportingManager: "Emma HR",
    date: "2025-12-18",
    inTime: null,
    outTime: null,
    type: "absent" as "full" | "half" | "absent" | "present" | "unmarked",
    inConfidence: null,
    outConfidence: null,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp004",
    imageIn: "",
    imageOut: "",
    device: "N/A",
    location: {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      address: "N/A",
    },
    status: "absent" as "present" | "absent" | "half" | "miss" | "unmarked",
    hoursWorked: 0,
    overtimeHours: 0,
    autoFlag: true,
    flagReason: "No check-in detected",
  },
  {
    id: "ATT005",
    employeeId: "EMP001",
    employeeName: "John Administrator",
    reportingManager: "John Administrator",
    date: "2025-12-20",
    inTime: "08:50",
    outTime: "19:10",
    type: "full",
    inConfidence: 95,
    outConfidence: 93,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp001",
    imageIn: "http://192.168.1.9:3000/uploads/attendance/checkin005.jpg",
    imageOut: "http://192.168.1.9:3000/uploads/attendance/checkout005.jpg",
    device: "Browser Webcam",
    location: {
      latitude: 13.0827,
      longitude: -80.2707,
      accuracy: 10,
      address: "Chennai - Office Building A",
    },
    status: "present",
    hoursWorked: 10.33,
    overtimeHours: 1.33,
    autoFlag: false,
  },
  {
    id: "ATT006",
    employeeId: "EMP002",
    employeeName: "Sarah Johnson",
    reportingManager: "Michael Manager",
    date: "2025-12-20",
    inTime: "10:00",
    outTime: "18:45",
    type: "present",
    inConfidence: 87,
    outConfidence: 90,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp002",
    imageIn: "https://picsum.photos/seed/checkin006/400/300.jpg",
    imageOut: "https://picsum.photos/seed/checkout006/400/300.jpg",
    device: "Desktop Webcam",
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 14,
      address: "Bangalore - Tech Park",
    },
    status: "present",
    hoursWorked: 8.75,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT007",
    employeeId: "EMP003",
    employeeName: "Michael Chen",
    reportingManager: "Michael Manager",
    date: "2025-12-22",
    inTime: null,
    outTime: null,
    type: "absent" as "full" | "half" | "absent" | "present" | "unmarked",
    inConfidence: null,
    outConfidence: null,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp003",
    imageIn: "",
    imageOut: "",
    device: "N/A",
    location: {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      address: "N/A",
    },
    status: "absent" as "present" | "absent" | "half" | "miss" | "unmarked",
    hoursWorked: 0,
    overtimeHours: 0,
    autoFlag: true,
    flagReason: "Absence without leave",
  },
  {
    id: "ATT008",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    reportingManager: "Emma HR",
    date: "2025-12-22",
    inTime: "09:00",
    outTime: "17:30",
    type: "full",
    inConfidence: 94,
    outConfidence: 91,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp004",
    imageIn: "https://picsum.photos/seed/checkin008/400/300.jpg",
    imageOut: "https://picsum.photos/seed/checkout008/400/300.jpg",
    device: "Browser Webcam",
    location: {
      latitude: 19.076,
      longitude: 72.8777,
      accuracy: 11,
      address: "Mumbai - HQ",
    },
    status: "present",
    hoursWorked: 8.5,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT009",
    employeeId: "EMP002",
    employeeName: "Sarah Johnson",
    reportingManager: "Michael Manager",
    date: "2025-12-23",
    inTime: "09:45",
    outTime: "13:30",
    type: "half",
    inConfidence: 89,
    outConfidence: 86,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp002",
    imageIn: "https://picsum.photos/seed/checkin009/400/300.jpg",
    imageOut: "https://picsum.photos/seed/checkout009/400/300.jpg",
    device: "Mobile Camera",
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 16,
      address: "Bangalore - Tech Park",
    },
    status: "half",
    hoursWorked: 3.75,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT010",
    employeeId: "EMP001",
    employeeName: "John Administrator",
    reportingManager: "John Administrator",
    date: "2025-12-23",
    inTime: "09:00",
    outTime: "17:45",
    type: "full",
    inConfidence: 96,
    outConfidence: 94,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp001",
    imageIn: "https://picsum.photos/seed/checkin010/400/300.jpg",
    imageOut: "https://picsum.photos/seed/checkout010/400/300.jpg",
    device: "Browser Webcam",
    location: {
      latitude: 13.0827,
      longitude: -80.2707,
      accuracy: 9,
      address: "Chennai - Office Building A",
    },
    status: "present",
    hoursWorked: 8.75,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT011",
    employeeId: "EMP003",
    employeeName: "Michael Chen",
    reportingManager: "Michael Manager",
    date: "2025-12-25",
    inTime: null,
    outTime: null,
    type: "absent" as "full" | "half" | "absent" | "present" | "unmarked",
    inConfidence: null,
    outConfidence: null,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp003",
    imageIn: "",
    imageOut: "",
    device: "N/A",
    location: {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      address: "N/A",
    },
    status: "absent" as "present" | "absent" | "half" | "miss" | "unmarked",
    hoursWorked: 0,
    overtimeHours: 0,
    autoFlag: false,
  },
  {
    id: "ATT012",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    reportingManager: "Emma HR",
    date: "2025-12-10",
    inTime: "09:00",
    outTime: "17:00",
    type: "full",
    inConfidence: 93,
    outConfidence: 92,
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emp004",
    imageIn: "https://picsum.photos/seed/checkin012/400/300.jpg",
    imageOut: "https://picsum.photos/seed/checkout012/400/300.jpg",
    device: "Browser Webcam",
    location: {
      latitude: 19.076,
      longitude: 72.8777,
      accuracy: 12,
      address: "Mumbai - HQ",
    },
    status: "present",
    hoursWorked: 8.0,
    overtimeHours: 0,
    autoFlag: false,
  },
];

const resolveImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return "";
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const getAlternateImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl || imageUrl.startsWith("data:")) return "";

  if (imageUrl.includes("/backend/uploads/")) {
    return imageUrl.replace("/backend/uploads/", "/uploads/");
  }

  if (imageUrl.includes("/uploads/")) {
    return imageUrl.replace("/uploads/", "/backend/uploads/");
  }

  return "";
};

const attendanceImageFallback =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage Not Available%3C/text%3E%3C/svg%3E";

const attendanceImageCanvas =
  "linear-gradient(45deg, #f8fafc 25%, transparent 25%), linear-gradient(-45deg, #f8fafc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8fafc 75%), linear-gradient(-45deg, transparent 75%, #f8fafc 75%)";

type LeaveMode = "none" | "paid" | "half";

const OVERRIDE_STATUS_OPTIONS = [
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
    value: "grace",
    label: "Grace",
    className:
      "border-sky-200 text-sky-700 hover:bg-sky-50 data-[active=true]:border-sky-300 data-[active=true]:bg-sky-100 data-[active=true]:text-sky-900",
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

const getStatusLabel = (status: string) =>
  OVERRIDE_STATUS_OPTIONS.find((option) => option.value === status)?.label ||
  status;

const normalizeLeaveTypeName = (name: string | undefined | null): string => {
  if (!name) return "Leave";
  // Fix common misspellings
  const normalized = name.trim();
  if (/^casule$/i.test(normalized)) return "Casual";
  return normalized;
};

export default function AttendanceLog() {
  const { user } = useAuth();
  const { hasModuleAccess, canPerformModuleAction } = useRole();
  const canEditAttendanceLog =
    canPerformModuleAction("attendance", "edit", "log") ||
    canPerformModuleAction("attendance", "edit");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [logs, setLogs] = useState<AttendanceLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  // AttendanceLog component top-ல (other states கூட)
  const [overrideDraft, setOverrideDraft] = useState<{
    attendanceId?: string;
    employeeId: string;
    date: string;
    originalStatus: string;
    overriddenStatus: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    reason: string;
    leaveMode: LeaveMode;
    leaveTypeName: string;
  } | null>(null);

  // New states for employee list view
  const [viewMode, setViewMode] = useState<"employee-list" | "calendar">(
    "employee-list",
  );
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    employeeId: string;
  } | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [calendarLeaveEntries, setCalendarLeaveEntries] = useState<
    CalendarLeaveEntry[]
  >([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const getEmployeeCode = (employee: any): string => {
    const directCode =
      employee?.employee_code ||
      employee?.employeeCode ||
      employee?.emp_code ||
      employee?.empCode;

    if (typeof directCode === "string" && directCode.trim()) {
      return directCode.trim();
    }

    if (
      typeof employee?.employee_id === "string" &&
      employee.employee_id.trim()
    ) {
      return employee.employee_id.trim();
    }

    const numericId = Number(employee?.id ?? employee?.employee_id ?? 0);
    return `EMP${String(Number.isFinite(numericId) ? numericId : 0).padStart(3, "0")}`;
  };

  const openOverrideCard = (record: AttendanceLogRecord) => {
    if (!canEditAttendanceLog) {
      toast.error("You don't have permission to edit attendance logs");
      return;
    }

    const isPlaceholder =
      record.id.startsWith("absent-") ||
      record.id.startsWith("unmarked-") ||
      record.id.startsWith("absent-fallback-") ||
      record.id.startsWith("weekend-") ||
      record.id.startsWith("holiday-");

    const normalizedOriginalStatus =
      record.status === "miss" ? "absent" : record.status;

    setOverrideDraft({
      attendanceId: isPlaceholder ? undefined : record.id,
      employeeId: record.employeeId,
      date: record.date,
      originalStatus: normalizedOriginalStatus,
      overriddenStatus: "present",
      requestedCheckIn: record.inTime || "",
      requestedCheckOut: record.outTime || "",
      reason: "",
      leaveMode: "none",
      leaveTypeName: "",
    });
    setIsOverrideOpen(true);
  };

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setLeaveTypesLoading(true);
      const result = await leaveTypeApi.getLeaveTypes();
      if (result.data) {
        setLeaveTypes(
          result.data.filter((leaveType) => leaveType.isActive !== false),
        );
      }
      setLeaveTypesLoading(false);
    };

    if (isOverrideOpen) {
      fetchLeaveTypes();
    }
  }, [isOverrideOpen]);

  const selectedLeaveType = useMemo(
    () =>
      leaveTypes.find(
        (leaveType) => leaveType.name === overrideDraft?.leaveTypeName,
      ) || null,
    [leaveTypes, overrideDraft?.leaveTypeName],
  );

  const overrideStatusChoices = useMemo(
    () =>
      OVERRIDE_STATUS_OPTIONS.filter(
        (statusOption) => statusOption.value !== overrideDraft?.originalStatus,
      ),
    [overrideDraft?.originalStatus],
  );

  const resetOverrideDraft = () => {
    setOverrideDraft((prev) =>
      prev
        ? {
            ...prev,
            date: "",
            originalStatus: "absent",
            overriddenStatus: "present",
            requestedCheckIn: "",
            requestedCheckOut: "",
            reason: "",
            leaveMode: "none",
            leaveTypeName: "",
          }
        : prev,
    );
  };

  const handleOverrideStatusSelection = (value: string) => {
    setOverrideDraft((prev) => {
      if (!prev) return prev;

      const nextDraft = {
        ...prev,
        overriddenStatus: value,
      };

      if (value !== "half" && prev.leaveMode === "half") {
        nextDraft.leaveMode = "none" as LeaveMode;
        nextDraft.leaveTypeName = "";
      }

      return nextDraft;
    });
  };

  const handleOverrideLeaveModeSelection = (leaveMode: LeaveMode) => {
    setOverrideDraft((prev) =>
      prev
        ? {
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
            requestedCheckOut:
              leaveMode === "none" ? prev.requestedCheckOut : "",
          }
        : prev,
    );
  };

  const buildOverrideReason = () => {
    if (!overrideDraft) return "";

    const trimmedReason = overrideDraft.reason.trim();
    const leaveLabel =
      overrideDraft.leaveMode === "paid"
        ? "Paid Leave"
        : overrideDraft.leaveMode === "half"
          ? "Half Day Leave"
          : "";

    if (!leaveLabel || !overrideDraft.leaveTypeName) {
      return trimmedReason;
    }

    return `[${leaveLabel} - ${overrideDraft.leaveTypeName}] ${trimmedReason}`;
  };

  const handleOverride = (recordId: string) => {
    const record = filteredData.find((r) => r.id === recordId);
    if (record) {
      openOverrideCard(record);
      setIsModalOpen(false);
    }
  };

  const handleAbsentEdit = (record: AttendanceLogRecord) => {
    openOverrideCard(record);
    setIsModalOpen(false);
  };

  const handleSubmitOverride = async () => {
    if (!overrideDraft) return;

    const requiresTimeFields =
      overrideDraft.leaveMode === "none" &&
      (overrideDraft.overriddenStatus === "present" ||
        overrideDraft.overriddenStatus === "half");

    if (
      !overrideDraft.employeeId.trim() ||
      !overrideDraft.date ||
      !overrideDraft.reason.trim()
    ) {
      toast.error("Employee ID, date and reason are required");
      return;
    }

    if (
      requiresTimeFields &&
      (!overrideDraft.requestedCheckIn || !overrideDraft.requestedCheckOut)
    ) {
      toast.error(
        "Requested check-in and check-out are required for present or half day override",
      );
      return;
    }

    if (overrideDraft.leaveMode !== "none" && !overrideDraft.leaveTypeName) {
      toast.error("Select a leave type");
      return;
    }

    setIsSubmittingOverride(true);
    const result = await attendanceApi.createOverride({
      attendanceId: overrideDraft.attendanceId,
      employeeId: overrideDraft.employeeId,
      date: overrideDraft.date,
      originalStatus: overrideDraft.originalStatus,
      overriddenStatus: overrideDraft.overriddenStatus,
      reason: buildOverrideReason(),
      requestedCheckIn: requiresTimeFields
        ? overrideDraft.requestedCheckIn || undefined
        : undefined,
      requestedCheckOut: requiresTimeFields
        ? overrideDraft.requestedCheckOut || undefined
        : undefined,
      leaveMode: overrideDraft.leaveMode,
    });

    if (result.success || result.data) {
      toast.success("Override request created successfully!");
      setIsOverrideOpen(false);
      setOverrideDraft(null);
      fetchAttendanceLogs();
      setIsSubmittingOverride(false);
      return;
    }

    toast.error(result.error || "Failed to create override request");
    setIsSubmittingOverride(false);
  };

  // Fetch employees list
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const result = await employeeApi.getEmployees();
      setEmployees(result.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Handle employee click to show calendar
  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee({
      id: employee.id.toString(),
      name: `${employee.first_name} ${employee.last_name || ""}`.trim(),
      employeeId: getEmployeeCode(employee),
    });
    setViewMode("calendar");
  };

  // Handle back to employee list
  const handleBackToEmployeeList = () => {
    setViewMode("employee-list");
    setSelectedEmployee(null);
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    setHolidaysLoading(true);
    try {
      const result = await holidayApi.getHolidays();
      if (result.data) {
        // console.log("Raw holidays from API:", result.data);
        // console.log(
        //   "Holiday date formats:",
        //   result.data.map((h) => ({
        //     name: h.name,
        //     originalDate: h.date,
        //     dateType: typeof h.date,
        //   })),
        // );
        setHolidays(result.data);
        // console.log("Fetched holidays:", result.data);
      } else {
        console.warn("No holidays data received");
        setHolidays([]);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays");
      setHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // Fetch shifts
  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const result = await shiftApi.getShifts();
      if (result.data) {
        // console.log("Fetched shifts:", result.data);
        setShifts(result.data);
      } else {
        console.warn("No shifts data received");
        setShifts([]);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("Failed to load shifts");
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  };

  // Fetch attendance logs for the current month
  const fetchAttendanceLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch for the selected month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // Fetch for the entire month to ensure we get all records
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      // // console.log("Selected month:", currentMonth.toLocaleDateString());
      // console.log("Fetching for:", startDate, "to", endDate);

      // Send user information to backend for proper role-based filtering
      const userInfo = {
        userId: user?.id,
        userRole: (user as any)?.role,
        userRoles: (user as any)?.roles,
        userType: (user as any)?.type,
        userName: user?.name,
        companyId: (user as any)?.company_id,
        departmentId: (user as any)?.department_id,
      };

      // // console.log("Sending user info to backend:", userInfo);

      const pageSize = 100;
      const firstPage = await attendanceApi.getAttendanceLogs({
        startDate,
        endDate,
        page: 1,
        limit: pageSize,
        ...userInfo, // Send user info for backend filtering
      });

      // console.log("API First Page Result:", firstPage);
      // console.log("API First Page data:", firstPage.data);

      // Use the data directly from the API response
      let attendanceData: any[] = Array.isArray(firstPage.data)
        ? [...firstPage.data]
        : [];
      const totalCount = Number(firstPage.total || attendanceData.length || 0);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      if (totalPages > 1) {
        const pageRequests: Promise<any>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          pageRequests.push(
            attendanceApi.getAttendanceLogs({
              startDate,
              endDate,
              page,
              limit: pageSize,
              ...userInfo,
            }),
          );
        }

        const pageResponses = await Promise.all(pageRequests);
        pageResponses.forEach((pageResult: any, index: number) => {
          if (Array.isArray(pageResult?.data)) {
            attendanceData = attendanceData.concat(pageResult.data);
          } else {
            console.warn(
              `Attendance page ${index + 2} has no array data`,
              pageResult,
            );
          }
        });
      }

      // console.log(
      //   "Fetched total pages:",
      //   totalPages,
      //   "Total records:",
      //   attendanceData.length,
      // );

      // console.log("Final attendanceData:", attendanceData);
      // console.log("attendanceData length:", attendanceData.length);

      let mappedLogs: AttendanceLogRecord[] = [];

      if (attendanceData.length > 0) {
        // Used to avoid marking late/half-day on subsequent break-session check-ins.
        // We treat only the FIRST punch of a day (per employee) as eligible for shift-based late calculation.
        const firstCheckInByEmployeeDay = new Map<string, string>();
        for (const item of attendanceData) {
          if (!item?.check_in) continue;
          const dayKey = new Date(item.check_in).toISOString().slice(0, 10);
          const employeeKey = String(item.employee_id ?? "");
          if (!employeeKey) continue;
          const mapKey = `${employeeKey}|${dayKey}`;
          const prev = firstCheckInByEmployeeDay.get(mapKey);
          const currTs = new Date(item.check_in).getTime();
          const prevTs = prev ? new Date(prev).getTime() : null;
          if (!prev || (prevTs !== null && currTs < prevTs)) {
            firstCheckInByEmployeeDay.set(mapKey, item.check_in);
          }
        }

        // Map backend response → frontend interface
        mappedLogs = attendanceData.map((item: any) => {
          const parseGeoLocation = (
            rawLocation: any,
          ): AttendanceGeoLocation => {
            const fallback: AttendanceGeoLocation = {
              latitude: 0,
              longitude: 0,
              accuracy: 0,
              address: "N/A",
            };

            if (!rawLocation) return fallback;

            try {
              const parsed =
                typeof rawLocation === "string"
                  ? JSON.parse(rawLocation)
                  : rawLocation;
              return {
                latitude: Number(parsed?.latitude) || 0,
                longitude: Number(parsed?.longitude) || 0,
                accuracy: Number(parsed?.accuracy) || 0,
                address:
                  String(parsed?.address || "N/A")
                    .replace(/^zone\s*\d+\s*/i, "")
                    .trim() || "N/A",
              };
            } catch {
              console.warn("Failed to parse location", rawLocation);
              return fallback;
            }
          };

          const checkInLocation = parseGeoLocation(item.check_in_location);
          const checkOutLocation = parseGeoLocation(item.check_out_location);
          // Backward compatibility: use check-in as the primary location.
          const location = checkInLocation;

          // Format time from ISO string
          const formatTime = (isoString: string | null) => {
            if (!isoString) return null;
            const d = new Date(isoString);
            return d.toTimeString().slice(0, 5); // HH:MM
          };

          // Extract date from check_in, fallback to created_at
          const getDate = (
            isoString: string | null,
            fallbackString?: string | null,
          ) => {
            if (isoString) {
              // If already in YYYY-MM-DD format, return as-is
              if (/^\d{4}-\d{2}-\d{2}/.test(isoString)) {
                return isoString.split("T")[0].split(" ")[0]; // Extract YYYY-MM-DD part
              }
              // Otherwise format the date without timezone conversion
              const d = new Date(isoString);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            }
            if (fallbackString) {
              // If already in YYYY-MM-DD format, return as-is
              if (/^\d{4}-\d{2}-\d{2}/.test(fallbackString)) {
                return fallbackString.split("T")[0].split(" ")[0]; // Extract YYYY-MM-DD part
              }
              // Otherwise format the date without timezone conversion
              const d = new Date(fallbackString);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            }
            return null;
          };

          // Helper function to construct full image URL
          const getImageUrl = (relativePath: string | null) => {
            const fullUrl = resolveImageUrl(relativePath);
            // console.log("Constructing image URL:", { relativePath, fullUrl });
            return fullUrl;
          };

          // Debug log for image fields
          // console.log("API Response Item:", {
          //   check_in_image_url: item.check_in_image_url,
          //   check_out_image_url: item.check_out_image_url,
          //   id: item.id,
          // });

          // Debug log for each item being processed
          const extractedDate = getDate(item.check_in, item.created_at);
          // console.log("Processing API Item:", {
          //   id: item.id,
          //   check_in: item.check_in,
          //   created_at: item.created_at,
          //   extracted_date: extractedDate,
          //   status: item.status,
          //   employee_name: `${item.first_name} ${item.last_name || ""}`.trim(),
          //   hours_worked: item.hours_worked,
          // });

          // Determine actual attendance status using shift-based calculation
          // IMPORTANT: Do not overwrite backend status='late' with frontend calculation.
          // Only allow upgrading present -> late for UI convenience.
          const normalizedBackendStatus = String(
            item.status || "",
          ).toLowerCase();
          let actualStatus: AttendanceLogRecord["status"] =
            normalizedBackendStatus === "half_day" ||
            normalizedBackendStatus === "half-day"
              ? "half"
              : [
                    "present",
                    "absent",
                    "half",
                    "miss",
                    "unmarked",
                    "late",
                    "grace",
                    "leave",
                    "week_off",
                    "holiday",
                  ].includes(normalizedBackendStatus)
                ? (normalizedBackendStatus as AttendanceLogRecord["status"])
                : "miss";
          let calculatedLateBy = "";

          // If there's a check-in time, calculate lateBy and (optionally) upgrade present -> late
          if (item.check_in && item.shift_id) {
            const attendanceDate =
              getDate(item.check_in, item.created_at) || "";
            const employeeKey = String(item.employee_id ?? "");
            const mapKey = `${employeeKey}|${attendanceDate}`;
            const firstCheckInIso = firstCheckInByEmployeeDay.get(mapKey);
            const isFirstPunchForUI = firstCheckInIso
              ? new Date(firstCheckInIso).getTime() ===
                new Date(item.check_in).getTime()
              : true;

            // Skip shift-based late/grace upgrade for subsequent sessions (after break).
            if (!isFirstPunchForUI) {
              // keep actualStatus from backend (expected: present)
            } else {
              const shiftCalculation = calculateAttendanceStatus(
                item.check_in,
                item.shift_id.toString(),
                attendanceDate,
              );

              // Keep backend late/grace as-is; otherwise upgrade present using shift calculation
              if (
                item.status !== "late" &&
                item.status !== "grace" &&
                item.status === "present" &&
                shiftCalculation.status === "late"
              ) {
                actualStatus = "late";
              } else if (
                item.status === "present" &&
                shiftCalculation.status === "grace"
              ) {
                actualStatus = "grace";
              }

              if (actualStatus === "late") {
                calculatedLateBy = shiftCalculation.lateBy || "";
              }

              // console.log("Shift-based attendance calculation:", {
              //   employee: item.first_name,
              //   checkIn: item.check_in,
              //   shiftId: item.shift_id,
              //   backendStatus: item.status,
              //   finalStatus: actualStatus,
              //   lateBy: shiftCalculation.lateBy,
              //   reason: shiftCalculation.reason,
              // });
            }
          } else if (!item.check_in && item.status === "absent") {
            // If no check_in and status is absent, it might be unmarked attendance
            actualStatus = "unmarked";
            // console.log("Unmarked attendance detected for:", item.first_name);
          }

          return {
            id: item.id.toString(),
            employeeId: getEmployeeCode(item),
            employeeName: `${item.first_name} ${item.last_name || ""}`.trim(),
            date:
              item.attendance_date ||
              getDate(item.check_in, item.created_at) ||
              "",
            inTime: formatTime(item.check_in),
            outTime: formatTime(item.check_out),
            status: actualStatus,
            hoursWorked: parseFloat(item.hours_worked || "0"),
            overtimeHours: parseFloat(item.overtime_hours || "0"),
            autoFlag: item.auto_flag === 1,
            flagReason: item.flag_reason || undefined,
            device: item.device_info || "Unknown",
            location,
            checkInLocation,
            checkOutLocation: item.check_out ? checkOutLocation : undefined,
            imageUrl: getImageUrl(item.check_in_image_url), // Legacy field
            imageIn: getImageUrl(item.check_in_image_url),
            imageOut: getImageUrl(item.check_out_image_url),
            inConfidence: undefined,
            outConfidence: undefined,
            reportingManager: undefined,
            type: (actualStatus === "half"
              ? "half"
              : actualStatus === "absent"
                ? "absent"
                : actualStatus === "unmarked"
                  ? "unmarked"
                  : "full") as
              | "full"
              | "half"
              | "absent"
              | "present"
              | "unmarked",
            lateBy: calculatedLateBy,
            clientId: item.client_id || null,
            clientName: item.client_name || null,
            clientCode: item.client_code || null,
            // Also store the original employee_id for matching
            originalEmployeeId: item.employee_id,
          };
        });
      } else {
        // console.log("No attendance data found");
      }

      const leaveEntries: CalendarLeaveEntry[] = [];
      const [leaveApplicationsResult, overridesResult, permissionsResult] =
        await Promise.allSettled([
          leaveTypeApi.getLeaveApplications(),
          attendanceApi.getOverrides(),
          leavePermissionApi.getLeavePermissionApplications(),
        ]);

      const suppressedLeaveDates = new Set<string>();
      if (
        overridesResult.status === "fulfilled" &&
        Array.isArray(overridesResult.value.data)
      ) {
        overridesResult.value.data.forEach((override: any) => {
          if (String(override.status || "").toLowerCase() !== "approved")
            return;

          const overrideDate = normalizeDateOnly(override.override_date);
          if (
            !overrideDate ||
            overrideDate < startDate ||
            overrideDate > endDate
          )
            return;

          const reason = String(override.reason || "");
          const isLeaveOverride =
            /^\[(Paid Leave|Half Day Leave)\s+-\s+([^\]]+)\]/i.test(reason);
          const overriddenStatus = String(
            override.overridden_status || "",
          ).toLowerCase();
          if (isLeaveOverride || overriddenStatus === "leave") return;

          suppressedLeaveDates.add(
            `${String(override.employee_id || "")}|${overrideDate}`,
          );
        });
      }

      if (
        leaveApplicationsResult.status === "fulfilled" &&
        Array.isArray(leaveApplicationsResult.value.data)
      ) {
        leaveApplicationsResult.value.data.forEach((application: any) => {
          if (application.status !== "approved") return;

          const fromDate = normalizeDateOnly(
            application.from_date || application.fromDate,
          );
          const toDate = normalizeDateOnly(
            application.to_date || application.toDate,
          );
          if (!fromDate || !toDate) return;
          if (toDate < startDate || fromDate > endDate) return;

          const leaveTypeName =
            application.leave_type_name ||
            application.leave_type ||
            application.leaveType ||
            "Unknown Leave Type";
          const employeeId = String(
            application.employee_id || application.employeeId || "",
          );
          const clippedFromDate = fromDate < startDate ? startDate : fromDate;
          const clippedToDate = toDate > endDate ? endDate : toDate;
          const leaveDates: string[] = [];
          const cursor = new Date(`${clippedFromDate}T00:00:00`);
          const end = new Date(`${clippedToDate}T00:00:00`);

          while (cursor <= end) {
            const dateStr = formatDateString(
              cursor.getFullYear(),
              cursor.getMonth(),
              cursor.getDate(),
            );
            if (!suppressedLeaveDates.has(`${employeeId}|${dateStr}`)) {
              leaveDates.push(dateStr);
            }
            cursor.setDate(cursor.getDate() + 1);
          }

          leaveDates.forEach((dateStr) => {
            leaveEntries.push({
              id: `leave-app-${application.id}-${dateStr}`,
              employeeId,
              employeeName:
                application.employee_name || application.employeeName,
              fromDate: dateStr,
              toDate: dateStr,
              leaveTypeName: leaveTypeName,
              reason: application.reason,
              status: application.status,
              leaveMode: Number(application.days || 0) <= 0.5 ? "half" : "paid",
              source: "application",
            });
          });
        });
      } else if (leaveApplicationsResult.status === "rejected") {
        console.warn(
          "Failed to fetch leave applications for attendance calendar",
          leaveApplicationsResult.reason,
        );
      }

      if (
        overridesResult.status === "fulfilled" &&
        Array.isArray(overridesResult.value.data)
      ) {
        overridesResult.value.data.forEach((override: any) => {
          if (String(override.status || "").toLowerCase() !== "approved")
            return;

          const overrideDate = normalizeDateOnly(override.override_date);
          const reason = String(override.reason || "");
          const leaveMatch = reason.match(
            /^\[(Paid Leave|Half Day Leave)\s+-\s+([^\]]+)\]/i,
          );
          if (!overrideDate || !leaveMatch) return;
          if (overrideDate < startDate || overrideDate > endDate) return;

          leaveEntries.push({
            id: `leave-override-${override.id}`,
            employeeId: String(override.employee_id || ""),
            employeeName: "",
            fromDate: overrideDate,
            toDate: overrideDate,
            leaveTypeName: leaveMatch[2].trim(),
            reason,
            status: "approved",
            leaveMode: /half/i.test(leaveMatch[1]) ? "half" : "paid",
            source: "override",
          });
        });
      } else if (overridesResult.status === "rejected") {
        console.warn(
          "Failed to fetch attendance overrides for leave calendar",
          overridesResult.reason,
        );
      }

      if (
        permissionsResult.status === "fulfilled" &&
        Array.isArray(permissionsResult.value.data)
      ) {
        permissionsResult.value.data.forEach((permission: any) => {
          const permissionStatus = String(
            permission.status || "",
          ).toLowerCase();
          if (!["pending", "approved"].includes(permissionStatus)) return;

          const permissionDate = normalizeDateOnly(permission.permission_date);
          if (!permissionDate) return;
          if (permissionDate < startDate || permissionDate > endDate) return;

          leaveEntries.push({
            id: `leave-permission-${permission.id}`,
            employeeId: String(permission.employee_id || ""),
            employeeName: permission.employee_name || "",
            fromDate: permissionDate,
            toDate: permissionDate,
            leaveTypeName: "Permission",
            reason: permission.reason,
            status: permissionStatus,
            leaveMode: "permission",
            source: "permission",
          });
        });
      } else if (permissionsResult.status === "rejected") {
        console.warn(
          "Failed to fetch leave permissions for attendance calendar",
          permissionsResult.reason,
        );
      }

      const permissionEntries = leaveEntries.filter(
        (entry) => entry.source === "permission",
      );
      if (permissionEntries.length) {
        mappedLogs = mappedLogs.map((record) => {
          const matchingPermission = permissionEntries.find((entry) => {
            const entryEmployeeId = String(entry.employeeId || "");
            return (
              record.date === entry.fromDate &&
              (entryEmployeeId === String(record.originalEmployeeId || "") ||
                entryEmployeeId === record.employeeId)
            );
          });

          if (!matchingPermission) return record;

          return {
            ...record,
            status: "present",
            type: "full",
            isPermissionRecord: true,
            leaveTypeName: "Permission",
            leaveStatus: matchingPermission.status,
            leaveSource: "permission",
            permissionStatus: matchingPermission.status,
            flagReason: matchingPermission.reason || "Permission",
            lateBy: "",
          };
        });
      }

      setCalendarLeaveEntries(leaveEntries);
      setLogs(mappedLogs);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load attendance logs");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when month changes
  useEffect(() => {
    fetchAttendanceLogs();
  }, [currentMonth]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch holidays on component mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  // Fetch shifts on component mount
  useEffect(() => {
    fetchShifts();
  }, []);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Shift-based attendance calculation
  const calculateAttendanceStatus = (
    checkInTime: string,
    shiftId: string,
    date: string,
  ): {
    status: "present" | "absent" | "half" | "late" | "grace";
    lateBy?: string;
    reason?: string;
  } => {
    if (!checkInTime) {
      return { status: "absent", reason: "No check-in recorded" };
    }

    const shift = shifts.find((s) => s.id.toString() === shiftId.toString());
    if (!shift) {
      return { status: "present", reason: "No shift assigned" }; // Default to present if no shift
    }

    // checkInTime is an ISO timestamp from backend (e.g., "2026-02-05T07:41:46.000Z")
    const checkInDateTime = new Date(checkInTime);
    if (Number.isNaN(checkInDateTime.getTime())) {
      return { status: "present", reason: "Invalid check-in time" };
    }

    // Parse shift start time (e.g., "09:00:00") and compare in the user's local timezone
    const [shiftHours, shiftMinutes] = shift.startTime
      .split(":")
      .slice(0, 2)
      .map(Number);
    const shiftStartDateTime = new Date(checkInDateTime);
    shiftStartDateTime.setHours(shiftHours, shiftMinutes, 0, 0);

    const differenceInMinutes =
      (checkInDateTime.getTime() - shiftStartDateTime.getTime()) / (1000 * 60);
    const gracePeriodMinutes = Number(
      shift.gracePeriod || shift.grace_period || 0,
    );

    if (differenceInMinutes > 0 && differenceInMinutes <= gracePeriodMinutes) {
      const graceByMinutes = Math.floor(differenceInMinutes);
      return {
        status: "grace",
        reason: `Checked in within ${graceByMinutes} minutes grace`,
      };
    }

    if (differenceInMinutes > 0) {
      const lateByMinutes = Math.floor(differenceInMinutes);
      return {
        status: "late",
        lateBy: `${lateByMinutes} minutes`,
        reason: `Checked in ${lateByMinutes} minutes late`,
      };
    }

    return { status: "present", reason: "On time" };
  };

  // Helper function to check if a date is a holiday
  const isHoliday = (dateStr: string) => {
    return holidays.some((holiday) => holiday.date === dateStr);
  };

  // Helper function to get holiday name
  const getHolidayName = (dateStr: string) => {
    const holiday = holidays.find((holiday) => holiday.date === dateStr);
    return holiday?.name || "";
  };

  // Calendar helper functions (must be defined before useMemo below)
  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const normalizeDateOnly = (value?: string | null) => {
    if (!value) return "";
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "";

    // Format date without timezone conversion
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateInRange = (date: string, from: string, to: string) => {
    return date >= from && date <= to;
  };

  const isWeekendDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Get initial data based on user permissions
  const getInitialData = () => {
    if (
      canPerformModuleAction("attendance", "view") &&
      !canPerformModuleAction("attendance", "edit")
    ) {
      // Basic view access only - show own records
      const employeeId = `EMP${String(parseInt(user?.id || "0")).padStart(3, "0")}`;
      return mockData.filter((record) => record.employeeId === employeeId);
    } else if (canPerformModuleAction("attendance", "edit")) {
      // Edit access - can see team/department records
      return mockData.filter(
        (record) =>
          record.employeeName === user?.name ||
          record.reportingManager === user?.name,
      );
    }
    return mockData;
  };

  // Apply filters + role-based visibility to logs
  const filteredData = useMemo(() => {
    let data = logs;

    // When in calendar mode with selected employee, filter by that employee
    if (viewMode === "calendar" && selectedEmployee) {
      data = data.filter(
        (record) =>
          record.originalEmployeeId?.toString() === selectedEmployee.id ||
          record.employeeId === selectedEmployee.employeeId,
      );
    }

    // Backend now handles role-based filtering, so no client-side filtering needed

    if (viewMode === "calendar" && selectedEmployee) {
      const monthStart = formatDateString(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const monthEnd = formatDateString(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        ).getDate(),
      );
      const mergedData = [...data];
      const currentEmployeeLeaves = calendarLeaveEntries.filter((entry) => {
        const entryEmployeeId = String(entry.employeeId || "");
        return (
          entry.toDate >= monthStart &&
          entry.fromDate <= monthEnd &&
          (entryEmployeeId === selectedEmployee.id ||
            entryEmployeeId === selectedEmployee.employeeId)
        );
      });

      currentEmployeeLeaves.forEach((entry) => {
        const from = entry.fromDate < monthStart ? monthStart : entry.fromDate;
        const to = entry.toDate > monthEnd ? monthEnd : entry.toDate;

        for (
          let day = 1;
          day <=
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0,
          ).getDate();
          day++
        ) {
          const dateStr = formatDateString(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day,
          );
          if (!isDateInRange(dateStr, from, to)) continue;

          const existingIndex = mergedData.findIndex(
            (record) => record.date === dateStr,
          );
          const isPermissionEntry = entry.source === "permission";
          const leaveStatus: AttendanceLogRecord["status"] = isPermissionEntry
            ? "present"
            : entry.leaveMode === "half"
              ? "half"
              : "leave";
          const leaveType: AttendanceLogRecord["type"] = isPermissionEntry
            ? "full"
            : entry.leaveMode === "half"
              ? "half"
              : "leave";

          if (existingIndex >= 0) {
            const existing = mergedData[existingIndex];
            const existingId = String(existing.id || "");
            const existingIsSynthetic =
              existingId.startsWith("absent-") ||
              existingId.startsWith("unmarked-") ||
              existing.device === "Leave Application" ||
              existing.device === "Leave Permission";
            const existingIsRealNonLeaveAttendance =
              !existingIsSynthetic &&
              !existing.isLeaveRecord &&
              !["leave"].includes(String(existing.status || "").toLowerCase());

            if (
              entry.source === "application" &&
              existingIsRealNonLeaveAttendance
            ) {
              continue;
            }

            mergedData[existingIndex] = {
              ...existing,
              status: leaveStatus,
              type: leaveType,
              isLeaveRecord: !isPermissionEntry,
              isPermissionRecord: isPermissionEntry,
              leaveTypeName: entry.leaveTypeName,
              leaveStatus: entry.status,
              leaveSource: entry.source,
              permissionStatus: isPermissionEntry
                ? entry.status
                : existing.permissionStatus,
              flagReason:
                entry.reason ||
                (isPermissionEntry
                  ? "Permission"
                  : `${entry.leaveTypeName} leave`),
              lateBy: isPermissionEntry ? "" : existing.lateBy,
            };
          } else {
            mergedData.push({
              id: `${entry.id}-${dateStr}`,
              employeeId: selectedEmployee.employeeId,
              employeeName:
                selectedEmployee.name || entry.employeeName || "Employee",
              date: dateStr,
              inTime: null,
              outTime: null,
              status: leaveStatus,
              hoursWorked: 0,
              overtimeHours: 0,
              autoFlag: false,
              flagReason:
                entry.reason ||
                (isPermissionEntry
                  ? "Permission"
                  : `${entry.leaveTypeName} leave`),
              device: isPermissionEntry
                ? "Leave Permission"
                : entry.source === "override"
                  ? "Attendance Override"
                  : "Leave Application",
              location: {
                latitude: 0,
                longitude: 0,
                accuracy: 0,
                address: isPermissionEntry
                  ? "Permission"
                  : `${entry.leaveTypeName} leave`,
              },
              imageUrl: "",
              imageIn: "",
              imageOut: "",
              type: leaveType,
              originalEmployeeId: Number(selectedEmployee.id),
              isLeaveRecord: !isPermissionEntry,
              isPermissionRecord: isPermissionEntry,
              leaveTypeName: entry.leaveTypeName,
              leaveStatus: entry.status,
              leaveSource: entry.source,
              permissionStatus: isPermissionEntry ? entry.status : undefined,
            });
          }
        }
      });

      data = mergedData;
    }

    // In calendar view, generate placeholder "absent" records for missing past dates
    // so absent days are clickable and can be overridden/edited (RBAC-gated in UI).
    if (viewMode === "calendar" && selectedEmployee) {
      const year = currentMonth.getFullYear();
      const monthIndex = currentMonth.getMonth();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const today = new Date().toISOString().split("T")[0];
      const existingDates = new Set(data.map((r) => r.date));
      const placeholders: AttendanceLogRecord[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDateString(year, monthIndex, day);
        const isPastOrToday = dateStr <= today;
        if (!isPastOrToday) continue;
        if (existingDates.has(dateStr)) continue;
        const isWeekendDay = isWeekendDate(dateStr);
        const isHolidayDay = isHoliday(dateStr);
        const isNonWorkingDay = isWeekendDay || isHolidayDay;

        placeholders.push({
          id: `${isHolidayDay ? "holiday" : isWeekendDay ? "weekend" : "absent"}-${selectedEmployee.id}-${dateStr}`,
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.name,
          date: dateStr,
          inTime: null,
          outTime: null,
          status: isNonWorkingDay
            ? isHolidayDay
              ? "holiday"
              : "week_off"
            : "absent",
          hoursWorked: 0,
          overtimeHours: 0,
          autoFlag: false,
          device: isNonWorkingDay
            ? isHolidayDay
              ? "Holiday"
              : "Weekend"
            : "No Attendance",
          location: {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            address: isNonWorkingDay
              ? isHolidayDay
                ? getHolidayName(dateStr) || "Holiday"
                : "Weekend"
              : "No attendance marked",
          },
          imageUrl: "",
          imageIn: "",
          imageOut: "",
          type: isNonWorkingDay ? "present" : "absent",
          originalEmployeeId: Number(selectedEmployee.id),
        });
      }

      if (placeholders.length) {
        data = data.concat(placeholders);
      }
    }

    // Search by name or ID
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(
        (record) =>
          record.employeeName.toLowerCase().includes(lowerSearch) ||
          record.employeeId.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      data = data.filter((record) =>
        filterStatus === "leave"
          ? record.isLeaveRecord
          : record.status === filterStatus,
      );
    }

    return data;
  }, [
    logs,
    searchTerm,
    filterStatus,
    viewMode,
    selectedEmployee,
    currentMonth,
    holidays,
    calendarLeaveEntries,
  ]);

  const effectiveEmployees = useMemo(() => {
    if (Array.isArray(employees) && employees.length > 0) {
      return employees;
    }

    const map = new Map<string, any>();
    logs.forEach((log) => {
      const uniqueId = String(
        log.originalEmployeeId || log.employeeId || log.id,
      );
      if (!uniqueId || map.has(uniqueId)) return;

      const fullName = String(log.employeeName || "").trim();
      const nameParts = fullName.split(" ").filter(Boolean);
      const firstName = nameParts[0] || "Employee";
      const lastName = nameParts.slice(1).join(" ");

      map.set(uniqueId, {
        id: uniqueId,
        first_name: firstName,
        last_name: lastName,
        employee_code: log.employeeId,
      });
    });

    return Array.from(map.values());
  }, [employees, logs]);
  // Get records for the selected date
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];

    const records = filteredData.filter(
      (record) => record.date === selectedDate,
    );

    // If it's today and no real records found, create a mock unmarked record
    const today = new Date().toISOString().split("T")[0];
    const isToday = selectedDate === today;
    const hasRealRecords = records.some(
      (r) => !r.id.startsWith("absent-") && !r.id.startsWith("unmarked-"),
    );

    if (isToday && !hasRealRecords) {
      const mockUnmarkedRecord: AttendanceLogRecord = {
        id: `unmarked-${selectedDate}`,
        employeeId: "ALL",
        employeeName: "All Employees",
        date: selectedDate,
        inTime: null,
        outTime: null,
        status: "unmarked",
        hoursWorked: 0,
        overtimeHours: 0,
        autoFlag: false,
        device: "Not Marked",
        location: {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          address: "No attendance marked today",
        },
        imageUrl: "",
        imageIn: "",
        imageOut: "",
        type: "unmarked",
      };
      return [mockUnmarkedRecord];
    }

    return records;
  }, [selectedDate, filteredData]);

  // Group data by date to mark calendar
  const recordsByDate = useMemo(() => {
    const grouped: { [key: string]: AttendanceLogRecord[] } = {};
    filteredData.forEach((record) => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    return grouped;
  }, [filteredData]);

  const getStatusBadge = (status: string, record?: AttendanceLogRecord) => {
    const variants: { [key: string]: any } = {
      present: "default",
      absent: "destructive",
      half: "secondary",
      leave: "secondary",
      miss: "outline",
      unmarked: "outline", // Different styling for unmarked attendance
      late: "secondary",
      grace: "secondary",
    };
    const displayText = record?.isPermissionRecord
      ? "PRESENT"
      : record?.isLeaveRecord
        ? `${normalizeLeaveTypeName(record.leaveTypeName)}${status === "half" ? " - HALF" : ""}`.toUpperCase()
        : status === "unmarked"
          ? "NOT MARKED"
          : status === "late"
            ? "LATE"
            : status === "grace"
              ? "GRACE"
            : status.toUpperCase();
    return <Badge variant={variants[status] || "outline"}>{displayText}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      present: "bg-green-100 text-green-700 border-green-200",
      permission: "bg-sky-100 text-sky-700 border-sky-200",
      absent: "bg-red-100 text-red-700 border-red-200",
      half: "bg-yellow-100 text-yellow-700 border-yellow-200",
      miss: "bg-gray-100 text-gray-700 border-gray-200",
      unmarked: "bg-orange-100 text-orange-700 border-orange-200", // Orange for unmarked
      late: "bg-orange-100 text-orange-700 border-orange-200",
      grace: "bg-sky-100 text-sky-700 border-sky-200",
    };
    return colors[status] || colors.miss;
  };

  const handleExport = () => {
    toast.success("Attendance log exported as CSV");
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateString(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const today = new Date().toISOString().split("T")[0];
    const isToday = dateStr === today;

    // If it's today and there are no records, create a mock unmarked record
    if (isToday && !recordsByDate[dateStr]) {
      // Create a temporary unmarked record for display
      const mockUnmarkedRecord: AttendanceLogRecord = {
        id: `unmarked-${dateStr}`,
        employeeId: "ALL",
        employeeName: "All Employees",
        date: dateStr,
        inTime: null,
        outTime: null,
        status: "unmarked",
        hoursWorked: 0,
        overtimeHours: 0,
        autoFlag: false,
        device: "Not Marked",
        location: {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          address: "No attendance marked today",
        },
        imageUrl: "",
        imageIn: "",
        imageOut: "",
        type: "unmarked",
      };

      // Temporarily add this record for the modal
      const tempRecords = [mockUnmarkedRecord];
      setSelectedDate(dateStr);
      setIsModalOpen(true);

      // We'll handle this in the modal rendering
      // console.log("Showing unmarked attendance for today:", dateStr);
    } else if (recordsByDate[dateStr]) {
      setSelectedDate(dateStr);
      setIsModalOpen(true);
    }
  };

  // Generate calendar grid
  const calendarDays = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Employee List View Component
  const EmployeeListView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Employees</CardTitle>
        <CardDescription>
          Click on an employee to view their attendance calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {employeesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Loading employees...
            </p>
          </div>
        ) : !Array.isArray(effectiveEmployees) ||
          effectiveEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No employees found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Debug: employeesLoading={employeesLoading.toString()},
              employeesType=
              {Array.isArray(effectiveEmployees)
                ? "array"
                : typeof effectiveEmployees}
              , employeesLength=
              {Array.isArray(effectiveEmployees)
                ? effectiveEmployees.length
                : "N/A"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {effectiveEmployees.map((employee) => {
              // Ensure employee has required properties
              if (!employee || !employee.id) {
                console.warn("Invalid employee data:", employee);
                return null;
              }

              return (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="w-full min-w-0 overflow-hidden rounded-lg border p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {`${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() ||
                          "E"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 break-words">
                        {`${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                          "Unknown Employee"}
                      </h3>
                      <p className="text-sm text-gray-500 break-all">
                        {getEmployeeCode(employee)}
                      </p>
                      {employee.designation && (
                        <p className="text-xs text-gray-400 break-words whitespace-normal">
                          {employee.designation}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
  return (
    <Layout>
      <div className="w-full max-w-full overflow-x-hidden space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            Attendance Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            {viewMode === "employee-list"
              ? "Select an employee to view their attendance calendar."
              : `Viewing attendance for ${selectedEmployee?.name}. Click a date to see details.`}
          </p>
        </div>

        {/* Back button when in calendar mode */}
        {viewMode === "calendar" && (
          <Button
            onClick={handleBackToEmployeeList}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        )}

        {/* Main Content - Employee List or Calendar */}
        {viewMode === "employee-list" ? (
          <EmployeeListView />
        ) : (
          <>
            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Loading attendance logs...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Error State */}
            {error && !loading && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                      onClick={fetchAttendanceLogs}
                      variant="outline"
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && filteredData.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No attendance records found for {selectedEmployee?.name}{" "}
                      for the selected filters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar - Only when data is loaded and available */}
            {!loading && !error && filteredData.length > 0 && (
              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl break-words">
                        {selectedEmployee?.name} - {monthName}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-0.5">
                        Click a date to view details
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Week days header */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-1 sm:mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-1 sm:py-2"
                      >
                        {day.substring(0, 1)}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square"
                          ></div>
                        );
                      }

                      const dateStr = formatDateString(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day,
                      );
                      const hasRecords = !!recordsByDate[dateStr];
                      const records = recordsByDate[dateStr] || [];

                      // Check if this date is a weekend (Saturday or Sunday - holiday)
                      const dayOfWeek = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day,
                      ).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday is 0, Saturday is 6

                      // Check if this date is a holiday from the API
                      const isApiHoliday = isHoliday(dateStr);
                      const holidayName = getHolidayName(dateStr);

                      // A date is a holiday if it's a weekend OR an API holiday
                      const isHolidayDate = isWeekend || isApiHoliday;

                      // Debug logging for each date
                      if (day >= 20 && day <= 28) {
                        // Log for dates around the issue
                        // console.log(`Date ${dateStr} (${day}):`, {
                        //   hasRecords,
                        //   recordsCount: records.length,
                        //   records: records.map((r) => ({
                        //     id: r.id,
                        //     status: r.status,
                        //     employee: r.employeeName,
                        //   })),
                        //   isWeekend,
                        //   isApiHoliday,
                        //   isHolidayDate,
                        //   holidayName,
                        //   dayOfWeek,
                        // });
                      }

                      // Check if this is today and there are no real records (unmarked attendance)
                      const today = new Date().toISOString().split("T")[0];
                      const isToday = dateStr === today;
                      const hasRealRecords = records.some(
                        (r) =>
                          !r.id.startsWith("absent-") &&
                          !r.id.startsWith("unmarked-"),
                      );
                      const isTodayUnmarked = isToday && !hasRealRecords;

                      const statuses = records.map((r) => r.status);
                      const hasPresent =
                        statuses.includes("present") ||
                        statuses.includes("grace");
                      const hasAbsent = statuses.includes("absent");
                      const hasHalf = statuses.includes("half");
                      const hasLeave =
                        statuses.includes("leave") ||
                        records.some((r) => r.isLeaveRecord);
                      const hasPermission = records.some(
                        (r) => r.isPermissionRecord,
                      );
                      const hasWeekOff =
                        statuses.includes("week_off") ||
                        statuses.includes("holiday");
                      const hasLate = statuses.includes("late");
                      const hasGrace = statuses.includes("grace");
                      const hasUnmarked =
                        statuses.includes("unmarked") || isTodayUnmarked;
                      const hasFlag = records.some((r) => r.autoFlag);
                      const leaveRecord = records.find((r) => r.isLeaveRecord);
                      const leaveLabel = leaveRecord
                        ? `${normalizeLeaveTypeName(leaveRecord.leaveTypeName)}${leaveRecord.status === "half" ? " - HALF" : ""}`.toUpperCase()
                        : "LEAVE";
                      const clientLabel = records
                        .map((record) => record.clientName)
                        .find((name) => Boolean(String(name || "").trim()));
                      // Weekend/holiday should be shown only when there is no real attendance punch.
                      // Synthetic absent/unmarked records are excluded by hasRealRecords.
                      const hasAttendanceOnHoliday =
                        isHolidayDate && hasRealRecords;
                      const disableHolidayCell =
                        isHolidayDate && !hasAttendanceOnHoliday;

                      // Debug status checking
                      if (day >= 20 && day <= 28) {
                        // console.log(`Status check for ${dateStr}:`, {
                        //   statuses,
                        //   hasPresent,
                        //   hasAbsent,
                        //   hasHalf,
                        //   hasLate,
                        //   hasUnmarked,
                        //   isTodayUnmarked,
                        //   isHolidayDate,
                        // });
                      }

                      let bgColor = "bg-white border-gray-200";
                      if (hasRecords || isTodayUnmarked) {
                        if (hasPermission) bgColor = "bg-sky-50 border-sky-300";
                        else if (hasLeave)
                          bgColor = "bg-violet-50 border-violet-300";
                        else if (hasWeekOff)
                          bgColor = "bg-gray-100 border-gray-300";
                        else if (hasGrace)
                          bgColor = "bg-sky-50 border-sky-300";
                        else if (hasPresent)
                          bgColor = "bg-green-50 border-green-300";
                        else if (hasHalf)
                          bgColor = "bg-yellow-50 border-yellow-300";
                        else if (hasAbsent)
                          bgColor = "bg-red-50 border-red-300";
                        else if (hasLate)
                          bgColor = "bg-orange-50 border-orange-300"; // Late = orange
                        else if (isTodayUnmarked || hasUnmarked)
                          bgColor = "bg-orange-50 border-orange-300";
                      } else if (isHolidayDate) {
                        bgColor = "bg-gray-100 border-gray-300"; // Holiday styling
                      } else {
                        // No records - check if past date or future date
                        const today = new Date().toISOString().split("T")[0];
                        if (dateStr < today) {
                          // Past date with no records = NOT MARKED (not absent)
                          bgColor = "bg-orange-50 border-orange-300";
                        } else if (dateStr > today) {
                          // Future date = grayed out (upcoming)
                          bgColor = "bg-gray-100 border-gray-200";
                        } else {
                          // Today with no records = not marked
                          bgColor = "bg-orange-50 border-orange-300";
                        }
                      }

                      return (
                        <button
                          key={day}
                          onClick={() =>
                            !disableHolidayCell && handleDateClick(day)
                          }
                          disabled={disableHolidayCell}
                          className={`aspect-square p-0.5 sm:p-2 rounded border sm:border-2 text-xs sm:text-sm font-medium transition-all ${
                            disableHolidayCell
                              ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                              : hasRecords || isTodayUnmarked
                                ? `${bgColor} cursor-pointer hover:shadow-md sm:hover:scale-105`
                                : (() => {
                                    const today = new Date()
                                      .toISOString()
                                      .split("T")[0];
                                    if (dateStr < today) {
                                      return "bg-orange-50 border-orange-300 text-orange-700 cursor-not-allowed"; // Past not marked
                                    } else if (dateStr > today) {
                                      return "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"; // Future grayed out
                                    } else {
                                      return "bg-orange-50 border-orange-300 text-orange-700 cursor-not-allowed"; // Today not marked
                                    }
                                  })()
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1">
                            <span
                              className={`text-xs sm:text-sm ${
                                disableHolidayCell
                                  ? "text-gray-500 font-medium"
                                  : hasRecords || isTodayUnmarked
                                    ? "text-gray-900 font-bold"
                                    : (() => {
                                        const today = new Date()
                                          .toISOString()
                                          .split("T")[0];
                                        if (dateStr < today) {
                                          return "text-red-600 font-bold"; // Past not marked
                                        } else if (dateStr > today) {
                                          return "text-gray-400 font-medium"; // Future grayed out
                                        } else {
                                          return "text-orange-700 font-bold"; // Today not marked
                                        }
                                      })()
                              }`}
                            >
                              {day}
                            </span>
                            {disableHolidayCell && (
                              <div className="text-xs text-gray-400 font-medium">
                                <span className="sm:hidden inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                                <span className="hidden sm:inline">
                                  {isApiHoliday ? holidayName : "WEEKEND"}
                                </span>
                              </div>
                            )}
                            {!disableHolidayCell &&
                              !(hasRecords || isTodayUnmarked) && (
                                <div className="flex flex-col gap-0.5 sm:gap-1 items-center">
                                  <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                                    {(() => {
                                      const today = new Date()
                                        .toISOString()
                                        .split("T")[0];
                                      if (dateStr < today) {
                                        // Past not marked
                                        return (
                                          <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />
                                        );
                                      } else if (dateStr > today) {
                                        // Future - no icon (grayed out)
                                        return null;
                                      } else {
                                        // Today not marked
                                        return (
                                          <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="hidden sm:block text-xs font-medium">
                                    {(() => {
                                      const today = new Date()
                                        .toISOString()
                                        .split("T")[0];
                                      if (dateStr < today) {
                                        return (
                                          <span className="text-orange-600">
                                            NOT MARKED
                                          </span>
                                        );
                                      } else if (dateStr > today) {
                                        // Future - no text (grayed out)
                                        return null;
                                      } else {
                                        return (
                                          <span className="text-orange-600">
                                            NOT MARKED
                                          </span>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            {!disableHolidayCell &&
                              (hasRecords || isTodayUnmarked) && (
                                <div className="flex flex-col gap-0.5 sm:gap-1 items-center">
                                  <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                                    {hasFlag && (
                                      <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 text-amber-600 flex-shrink-0" />
                                    )}
                                    {hasLeave && (
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-violet-600 flex-shrink-0"></div>
                                    )}
                                    {hasPermission && (
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-sky-600 flex-shrink-0"></div>
                                    )}
                                    {hasWeekOff && (
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-500 flex-shrink-0"></div>
                                    )}
                                    {hasGrace && (
                                      <Timer className="w-2 h-2 sm:w-3 sm:h-3 text-sky-600 flex-shrink-0" />
                                    )}
                                    {hasPresent && !hasGrace && (
                                      <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-green-600 flex-shrink-0" />
                                    )}
                                    {hasHalf && (
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-600 flex-shrink-0"></div>
                                    )}
                                    {hasAbsent && (
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600 flex-shrink-0"></div>
                                    )}
                                    {hasLate && (
                                      <Timer className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />
                                    )}
                                    {!hasPresent &&
                                      !hasHalf &&
                                      !hasAbsent &&
                                      !hasGrace &&
                                      !hasLate &&
                                      (hasUnmarked || isTodayUnmarked) && (
                                        <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />
                                      )}
                                  </div>
                                  {records.length > 1 && (
                                    <span className="hidden sm:inline text-xs text-gray-500 font-medium">
                                      {records.length}
                                    </span>
                                  )}
                                  {hasLeave && leaveRecord && (
                                    <span
                                      className="hidden max-w-full truncate px-1 text-[10px] font-semibold leading-tight text-violet-700 sm:inline-block"
                                      title={leaveLabel}
                                    >
                                      {leaveLabel}
                                    </span>
                                  )}
                                  {hasPermission && (
                                    <span className="hidden sm:inline text-xs font-semibold text-sky-700">
                                      PERMISSION
                                    </span>
                                  )}
                                  {hasWeekOff && (
                                    <span className="hidden sm:inline text-xs font-semibold text-gray-600">
                                      {statuses.includes("holiday")
                                        ? "HOLIDAY"
                                        : "WEEK OFF"}
                                    </span>
                                  )}
                                  {clientLabel &&
                                    !hasLeave &&
                                    !hasPermission &&
                                    !hasWeekOff && (
                                      <span
                                        className="hidden max-w-full whitespace-normal break-words px-1 text-center text-[10px] font-semibold leading-tight text-emerald-700 sm:inline-block"
                                        title={String(clientLabel)}
                                      >
                                        {String(clientLabel).toUpperCase()}
                                      </span>
                                    )}
                                </div>
                              )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2 sm:mb-3">
                      Legend
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Present</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-600 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Absent</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-600 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Half Day</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-violet-600 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Leave</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-sky-600 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Permission</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Late</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Not Marked</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Flagged</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 border border-gray-300 rounded flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">
                          Weekend (Holiday)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal for date details */}
      {/* Modal for date details */}
      {/* Modal for date details - Exact design as per your image */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="border-b bg-background px-6 py-5 pr-12">
            <DialogTitle className="text-xl sm:text-2xl font-bold pr-8">
              Attendance - {selectedDate || "Selected Date"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Showing {selectedDateRecords.length} employee record
              {selectedDateRecords.length !== 1 ? "s" : ""} for{" "}
              {selectedDate || "Selected Date"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 pb-6 pt-4 sm:pt-6">
            {selectedDateRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No attendance records found for this date.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Employee List */}
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold">Employee Details</h3>
                  </div>
                  <div className="divide-y">
                    {selectedDateRecords.map((record) => {
                      // console.log("Modal record data:", {
                      //   id: record.id,
                      //   status: record.status,
                      //   date: record.date,
                      //   employeeName: record.employeeName,
                      // });

                      return (
                        <div
                          key={record.id}
                          className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {record.employeeName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {record.employeeId}
                                  </p>
                                </div>
                                <div className="sm:ml-2">
                                  {record.status === "absent" ? (
                                    <button
                                      type="button"
                                      className={
                                        canEditAttendanceLog
                                          ? "cursor-pointer"
                                          : "cursor-default"
                                      }
                                      onClick={() =>
                                        canEditAttendanceLog &&
                                        handleAbsentEdit(record)
                                      }
                                      title={
                                        canEditAttendanceLog
                                          ? "Click to edit this absent record"
                                          : undefined
                                      }
                                    >
                                      {getStatusBadge(record.status, record)}
                                    </button>
                                  ) : (
                                    getStatusBadge(record.status, record)
                                  )}
                                </div>
                              </div>
                              {(() => {
                                // All sessions for this employee on this date, sorted by check-in asc
                                const empSessions = selectedDateRecords
                                  .filter(
                                    (r) =>
                                      String(r.employeeId) ===
                                      String(record.employeeId),
                                  )
                                  .slice()
                                  .sort((a, b) => {
                                    const ta = a.inTime
                                      ? new Date(`1970-01-01T${a.inTime}:00`).getTime()
                                      : 0;
                                    const tb = b.inTime
                                      ? new Date(`1970-01-01T${b.inTime}:00`).getTime()
                                      : 0;
                                    return ta - tb;
                                  });

                                const isFirstSession =
                                  empSessions.length > 0 &&
                                  empSessions[0].id === record.id;

                                // Total worked hours across all sessions
                                const dayTotalHours = empSessions.reduce(
                                  (sum, r) => sum + (Number(r.hoursWorked) || 0),
                                  0,
                                );

                                // Total break minutes = sum of gaps between session[i].outTime and session[i+1].inTime
                                let totalBreakMinutes = 0;
                                for (let i = 0; i < empSessions.length - 1; i++) {
                                  const outRaw = empSessions[i].outTime;
                                  const inRaw = empSessions[i + 1].inTime;
                                  if (outRaw && inRaw) {
                                    const outMs = new Date(`1970-01-01T${outRaw}:00`).getTime();
                                    const inMs = new Date(`1970-01-01T${inRaw}:00`).getTime();
                                    const diffMin = Math.round((inMs - outMs) / 60000);
                                    if (diffMin > 0) totalBreakMinutes += diffMin;
                                  }
                                }

                                const formatBreak = (mins: number) => {
                                  if (mins <= 0) return null;
                                  const h = Math.floor(mins / 60);
                                  const m = mins % 60;
                                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                };

                                const breakLabel = formatBreak(totalBreakMinutes);
                                const hasMultipleSessions = empSessions.length > 1;

                                return (
                                  <>
                                    <div className="mt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-start gap-x-3 gap-y-1 text-sm text-gray-600">
                                      <span className="whitespace-nowrap">
                                        Check-in: {record.inTime || "—"}
                                      </span>
                                      <span className="whitespace-nowrap">
                                        Check-out: {record.outTime || "—"}
                                      </span>
                                      {isFirstSession && (
                                        <span className="whitespace-nowrap font-medium text-blue-700">
                                          Total Worked:{" "}
                                          {dayTotalHours > 0
                                            ? `${dayTotalHours.toFixed(2)}h`
                                            : "—"}
                                        </span>
                                      )}
                                      {isFirstSession && hasMultipleSessions && breakLabel && (
                                        <span className="whitespace-nowrap font-medium text-orange-600">
                                          ☕ Break: {breakLabel}
                                        </span>
                                      )}
                                      {record.clientName && (
                                        <span className="col-span-2 whitespace-nowrap font-medium text-emerald-700">
                                          Client: {record.clientName}
                                          {record.clientCode
                                            ? ` (${record.clientCode})`
                                            : ""}
                                        </span>
                                      )}
                                    </div>
                                    {isFirstSession && hasMultipleSessions && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {empSessions.map((s, idx) => (
                                          <span
                                            key={s.id}
                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                          >
                                            Session {idx + 1}:{" "}
                                            {s.inTime || "—"} → {s.outTime || "ongoing"}
                                            {Number(s.hoursWorked) > 0
                                              ? ` (${Number(s.hoursWorked).toFixed(2)}h)`
                                              : ""}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Attendance Photos */}
                              <div className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Check-in Photo */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-2">
                                      Check-in Photo
                                    </h5>
                                    {record.imageIn ? (
                                      <div
                                        className="relative group aspect-square w-full overflow-hidden rounded border border-gray-200 bg-slate-100"
                                        style={{
                                          backgroundImage:
                                            attendanceImageCanvas,
                                          backgroundSize: "20px 20px",
                                          backgroundPosition:
                                            "0 0, 0 10px, 10px -10px, -10px 0px",
                                        }}
                                      >
                                        <img
                                          src={record.imageIn}
                                          alt="Check-in"
                                          className="h-full w-full object-contain cursor-pointer"
                                          onClick={(e) =>
                                            window.open(
                                              (
                                                e.currentTarget as HTMLImageElement
                                              ).src,
                                              "_blank",
                                            )
                                          }
                                          onError={(e) => {
                                            const img =
                                              e.currentTarget as HTMLImageElement;
                                            const alternateUrl =
                                              getAlternateImageUrl(img.src);
                                            if (
                                              alternateUrl &&
                                              img.dataset.fallbackTried !==
                                                "true"
                                            ) {
                                              img.dataset.fallbackTried =
                                                "true";
                                              img.src = alternateUrl;
                                              return;
                                            }
                                            img.src = attendanceImageFallback;
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                                        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                                          Photo available
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="aspect-square w-full bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                          <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                                          <p className="text-xs">
                                            No check-in photo
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Check-out Photo */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-2">
                                      Check-out Photo
                                    </h5>
                                    {record.imageOut ? (
                                      <div
                                        className="relative group aspect-square w-full overflow-hidden rounded border border-gray-200 bg-slate-100"
                                        style={{
                                          backgroundImage:
                                            attendanceImageCanvas,
                                          backgroundSize: "20px 20px",
                                          backgroundPosition:
                                            "0 0, 0 10px, 10px -10px, -10px 0px",
                                        }}
                                      >
                                        <img
                                          src={record.imageOut}
                                          alt="Check-out"
                                          className="h-full w-full object-contain cursor-pointer"
                                          onClick={(e) =>
                                            window.open(
                                              (
                                                e.currentTarget as HTMLImageElement
                                              ).src,
                                              "_blank",
                                            )
                                          }
                                          onError={(e) => {
                                            const img =
                                              e.currentTarget as HTMLImageElement;
                                            const alternateUrl =
                                              getAlternateImageUrl(img.src);
                                            if (
                                              alternateUrl &&
                                              img.dataset.fallbackTried !==
                                                "true"
                                            ) {
                                              img.dataset.fallbackTried =
                                                "true";
                                              img.src = alternateUrl;
                                              return;
                                            }
                                            img.src = attendanceImageFallback;
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                                        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                                          Photo available
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="aspect-square w-full bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                          <Clock className="w-6 h-6 mx-auto mb-1" />
                                          <p className="text-xs">
                                            No check-out photo
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Additional Info */}
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Device:</span>{" "}
                                  {record.device}
                                </div>
                                <div className="break-words space-y-1">
                                  <div>
                                    <span className="font-medium">
                                      Check-in:
                                    </span>{" "}
                                    {record.checkInLocation &&
                                    Number.isFinite(
                                      record.checkInLocation.latitude,
                                    ) &&
                                    Number.isFinite(
                                      record.checkInLocation.longitude,
                                    ) &&
                                    (record.checkInLocation.latitude !== 0 ||
                                      record.checkInLocation.longitude !== 0)
                                      ? `${record.checkInLocation.latitude},${record.checkInLocation.longitude}`
                                      : "—"}
                                  </div>
                                  <div className="text-gray-500">
                                    {record.checkInLocation?.address || "—"}
                                  </div>
                                  {record.checkInLocation &&
                                    Number.isFinite(
                                      record.checkInLocation.latitude,
                                    ) &&
                                    Number.isFinite(
                                      record.checkInLocation.longitude,
                                    ) &&
                                    (record.checkInLocation.latitude !== 0 ||
                                      record.checkInLocation.longitude !==
                                        0) && (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        Open in Maps
                                      </a>
                                    )}
                                </div>
                                <div className="break-words space-y-1">
                                  <div>
                                    <span className="font-medium">
                                      Check-out:
                                    </span>{" "}
                                    {record.checkOutLocation &&
                                    Number.isFinite(
                                      record.checkOutLocation.latitude,
                                    ) &&
                                    Number.isFinite(
                                      record.checkOutLocation.longitude,
                                    ) &&
                                    (record.checkOutLocation.latitude !== 0 ||
                                      record.checkOutLocation.longitude !== 0)
                                      ? `${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}`
                                      : "—"}
                                  </div>
                                  <div className="text-gray-500">
                                    {record.checkOutLocation?.address || "—"}
                                  </div>
                                  {record.checkOutLocation &&
                                    Number.isFinite(
                                      record.checkOutLocation.latitude,
                                    ) &&
                                    Number.isFinite(
                                      record.checkOutLocation.longitude,
                                    ) &&
                                    (record.checkOutLocation.latitude !== 0 ||
                                      record.checkOutLocation.longitude !==
                                        0) && (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.checkOutLocation.latitude},${record.checkOutLocation.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        Open in Maps
                                      </a>
                                    )}
                                </div>
                              </div>
                            </div>
                            {canEditAttendanceLog && (
                              <Button
                                onClick={() => {
                                  handleOverride(record.id);
                                  setIsModalOpen(false);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto ml-0 sm:ml-4 mt-0 sm:mt-1"
                              >
                                Override
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Card (in-page) */}
      <Dialog
        open={isOverrideOpen}
        onOpenChange={(open) => {
          setIsOverrideOpen(open);
          if (!open) setOverrideDraft(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Create Attendance Override
            </DialogTitle>
            <DialogDescription>
              All overrides are logged with audit trail
            </DialogDescription>
          </DialogHeader>

          {overrideDraft && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label
                    htmlFor="employeeId"
                    className="text-base font-semibold"
                  >
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="e.g., EMP003 / CMS001"
                    value={overrideDraft.employeeId}
                    onChange={(e) =>
                      setOverrideDraft((prev) =>
                        prev ? { ...prev, employeeId: e.target.value } : prev,
                      )
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="overrideDate"
                    className="text-base font-semibold"
                  >
                    Attendance Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="overrideDate"
                    type="date"
                    value={overrideDraft.date}
                    onChange={(e) =>
                      setOverrideDraft((prev) =>
                        prev ? { ...prev, date: e.target.value } : prev,
                      )
                    }
                    className="h-12"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden h-12 w-12 sm:inline-flex"
                  onClick={resetOverrideDraft}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
                <div>
                  <p className="text-base font-semibold">
                    {overrideDraft.date
                      ? new Date(
                          `${overrideDraft.date}T00:00:00`,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                        })
                      : "Select attendance date"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick the final attendance state for this day.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Current Status
                  </Label>
                  <div className="flex h-12 items-center rounded-md border border-input bg-slate-50 px-4 text-sm text-foreground">
                    {getStatusLabel(overrideDraft.originalStatus)}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Override Status
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {overrideStatusChoices.map((statusOption) => (
                      <button
                        key={statusOption.value}
                        type="button"
                        data-active={
                          overrideDraft.overriddenStatus === statusOption.value
                        }
                        onClick={() =>
                          handleOverrideStatusSelection(statusOption.value)
                        }
                        className={cn(
                          "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                          statusOption.className,
                        )}
                      >
                        {statusOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
                <div>
                  <Label className="text-base font-semibold">Leaves</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select leave mode if this override should be treated as
                    leave.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-active={overrideDraft.leaveMode === "paid"}
                    onClick={() =>
                      handleOverrideLeaveModeSelection(
                        overrideDraft.leaveMode === "paid" ? "none" : "paid",
                      )
                    }
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                      "border-violet-200 text-violet-700 hover:bg-violet-100",
                      overrideDraft.leaveMode === "paid" &&
                        "border-violet-300 bg-violet-100 text-violet-900",
                    )}
                  >
                    Paid Leave
                  </button>
                  <button
                    type="button"
                    data-active={overrideDraft.leaveMode === "half"}
                    onClick={() =>
                      handleOverrideLeaveModeSelection(
                        overrideDraft.leaveMode === "half" ? "none" : "half",
                      )
                    }
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                      "border-indigo-200 text-indigo-700 hover:bg-indigo-100",
                      overrideDraft.leaveMode === "half" &&
                        "border-indigo-300 bg-indigo-100 text-indigo-900",
                    )}
                  >
                    Half Day Leave
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-blue-200 px-5 text-blue-700 hover:bg-blue-50"
                      >
                        {overrideDraft.leaveTypeName || "Choose Leave Type"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {leaveTypesLoading ? (
                        <DropdownMenuItem disabled>
                          Loading leave types...
                        </DropdownMenuItem>
                      ) : leaveTypes.length > 0 ? (
                        leaveTypes.map((leaveType) => (
                          <DropdownMenuItem
                            key={leaveType.id}
                            onClick={() =>
                              setOverrideDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      leaveMode:
                                        prev.leaveMode === "none"
                                          ? "paid"
                                          : prev.leaveMode,
                                      leaveTypeName: leaveType.name,
                                    }
                                  : prev,
                              )
                            }
                          >
                            {leaveType.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          No leave types found
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {selectedLeaveType && (
                  <div className="rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {selectedLeaveType.name}
                    {selectedLeaveType.maxDays
                      ? ` - Max ${selectedLeaveType.maxDays} days`
                      : ""}
                    {selectedLeaveType.isPaid ? " - Paid" : " - Unpaid"}
                  </div>
                )}
              </div>

              {overrideDraft.leaveMode === "none" &&
                (overrideDraft.overriddenStatus === "present" ||
                  overrideDraft.overriddenStatus === "half") && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="requestedCheckIn"
                        className="text-base font-semibold"
                      >
                        Requested Check-in{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="requestedCheckIn"
                        type="time"
                        value={overrideDraft.requestedCheckIn}
                        onChange={(e) =>
                          setOverrideDraft((prev) =>
                            prev
                              ? { ...prev, requestedCheckIn: e.target.value }
                              : prev,
                          )
                        }
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="requestedCheckOut"
                        className="text-base font-semibold"
                      >
                        Requested Check-out{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="requestedCheckOut"
                        type="time"
                        value={overrideDraft.requestedCheckOut}
                        onChange={(e) =>
                          setOverrideDraft((prev) =>
                            prev
                              ? { ...prev, requestedCheckOut: e.target.value }
                              : prev,
                          )
                        }
                        className="h-12"
                      />
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-base font-semibold">
                  Reason for Override <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide detailed reason for this override"
                  className="min-h-32"
                  value={overrideDraft.reason}
                  onChange={(e) =>
                    setOverrideDraft((prev) =>
                      prev ? { ...prev, reason: e.target.value } : prev,
                    )
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
                    setIsOverrideOpen(false);
                    setOverrideDraft(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitOverride}
                  disabled={isSubmittingOverride}
                >
                  {isSubmittingOverride ? "Creating..." : "Create & Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </Layout>
  );
}
