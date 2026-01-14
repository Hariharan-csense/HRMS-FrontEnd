import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, AlertTriangle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import attendanceApi from "@/components/helper/attendance/attendance"


// src/api/attendanceApi.ts
export interface AttendanceLogRecord {
  id: string;
  employeeId: string;           // ← employee_id → employeeId
  employeeName: string;         // ← employee_name → employeeName
  reportingManager?: string;
  date: string;
  inTime?: string;              // ← check_in → inTime
  outTime?: string;             // ← check_out → outTime
  type: "full" | "half" | "absent" | "present";
  inConfidence?: number;
  outConfidence?: number;
  imageUrl?: string;            // Legacy field - kept for compatibility
  imageIn?: string;             // Check-in image URL
  imageOut?: string;            // Check-out image URL
  device: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  };
  status: "present" | "absent" | "half" | "miss";
  hoursWorked: number;
  overtimeHours: number;
  autoFlag: boolean;
  flagReason?: string;
  originalEmployeeId?: number;  // ← original employee_id from backend
}

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
    imageIn: "http://192.168.1.8:3000/uploads/attendance/checkin001.jpg",
    imageOut: "http://192.168.1.8:3000/uploads/attendance/checkout001.jpg",
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
    imageIn: "http://192.168.1.8:3000/uploads/attendance/checkin002.jpg",
    imageOut: "http://192.168.1.8:3000/uploads/attendance/checkout002.jpg",
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
    imageIn: "http://192.168.1.8:3000/uploads/attendance/checkin003.jpg",
    imageOut: "http://192.168.1.8:3000/uploads/attendance/checkout003.jpg",
    device: "Mobile Camera",
    location: {
      latitude: 19.0760,
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
    type: "absent",
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
    status: "absent",
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
    imageIn: "http://192.168.1.8:3000/uploads/attendance/checkin005.jpg",
    imageOut: "http://192.168.1.8:3000/uploads/attendance/checkout005.jpg",
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
    type: "absent",
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
    status: "absent",
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
      latitude: 19.0760,
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
    type: "absent",
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
    status: "absent",
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
      latitude: 19.0760,
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

export default function AttendanceLog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<AttendanceLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  // AttendanceLog component top-ல (other states கூட)
const [overrideFormData, setOverrideFormData] = useState<{
  recordId: string;
  employeeId: string;
  employeeName: string;
  date: string;
} | null>(null);

  
  const handleOverride = (recordId: string) => {
  const record = filteredData.find(r => r.id === recordId);
  if (record) {
    navigate(
      `/attendance/override?recordId=${record.id}&employeeId=${record.employeeId}&date=${record.date}`
    );
  }
};
  
    // Fetch attendance logs for the current month
const fetchAttendanceLogs = async () => {
  setLoading(true);
  setError(null);

  try {
    const date = new Date(currentMonth);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    console.log("Fetching for:", startDate, "to", endDate);

    const result = await attendanceApi.getAttendanceLogs({
      startDate,
      endDate,
    });

    console.log("API Result:", result);
    console.log("API Result data:", result.data);
    console.log("Type of result.data:", typeof result.data);
    console.log("Is result.data an array?", Array.isArray(result.data));

    // Handle different response structures
    let attendanceData: any[] = [];
    const responseData = result.data as any;
    
    if (responseData) {
      if (Array.isArray(responseData)) {
        console.log("Using direct array data");
        attendanceData = responseData;
      } else if (responseData.logs && Array.isArray(responseData.logs)) {
        console.log("Using logs array");
        attendanceData = responseData.logs;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        console.log("Using data array");
        attendanceData = responseData.data;
      }
    }

    console.log("Final attendanceData:", attendanceData);
    console.log("attendanceData length:", attendanceData.length);

    if (attendanceData.length > 0) {
      // Map backend response → frontend interface
      const mappedLogs: AttendanceLogRecord[] = attendanceData.map((item: any) => {
        // Parse location JSON string
        let location = {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          address: "N/A",
        };
        try {
          const loc = typeof item.check_in_location === "string" 
            ? JSON.parse(item.check_in_location) 
            : item.check_in_location;
          location = {
            latitude: loc.latitude || 0,
            longitude: loc.longitude || 0,
            accuracy: loc.accuracy || 0,
            address: loc.address || "N/A",
          };
        } catch (e) {
          console.warn("Failed to parse location", item.check_in_location);
        }

        // Format time from ISO string
        const formatTime = (isoString: string | null) => {
          if (!isoString) return null;
          const d = new Date(isoString);
          return d.toTimeString().slice(0, 5); // HH:MM
        };

        // Extract date from check_in
        const getDate = (isoString: string | null) => {
          if (!isoString) return null;
          const d = new Date(isoString);
          return d.toISOString().split("T")[0]; // YYYY-MM-DD
        };

        // Helper function to construct full image URL
        const getImageUrl = (relativePath: string | null) => {
          if (!relativePath) return "";
          // If it's already a full URL (starts with http), return as is
          if (relativePath.startsWith("http")) return relativePath;
          // Otherwise, prepend the backend base URL
          const fullUrl = `http://192.168.1.8:3000${relativePath}`;
          console.log("Constructing image URL:", { relativePath, fullUrl });
          return fullUrl;
        };

        // Debug log for image fields
        console.log("API Response Item:", {
          check_in_image_url: item.check_in_image_url,
          check_out_image_url: item.check_out_image_url,
          id: item.id
        });

        return {
          id: item.id.toString(),
          employeeId: item.employee_code || `EMP${item.employee_id}`,
          employeeName: `${item.first_name} ${item.last_name || ""}`.trim(),
          date: getDate(item.check_in) || "",
          inTime: formatTime(item.check_in),
          outTime: formatTime(item.check_out),
          status: item.status,
          hoursWorked: parseFloat(item.hours_worked || "0"),
          overtimeHours: parseFloat(item.overtime_hours || "0"),
          autoFlag: item.auto_flag === 1,
          flagReason: item.flag_reason || undefined,
          device: item.device_info || "Unknown",
          location,
          imageUrl: getImageUrl(item.check_in_image_url), // Legacy field
          imageIn: getImageUrl(item.check_in_image_url),
          imageOut: getImageUrl(item.check_out_image_url),
          inConfidence: undefined,
          outConfidence: undefined,
          reportingManager: undefined,
          type: item.status === "half" ? "half" : item.status === "absent" ? "absent" : "full",
          // Also store the original employee_id for matching
          originalEmployeeId: item.employee_id,
        };
      });

      console.log("Mapped logs:", mappedLogs);
      setLogs(mappedLogs);
    } else {
      console.log("No attendance data found");
      setLogs([]);
    }
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
  
  
  
  
  // Get initial data based on user role
  const getInitialData = () => {
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      const employeeId = `EMP${String(parseInt(user?.id || "0")).padStart(3, "0")}`;
      return mockData.filter((record) => record.employeeId === employeeId);
    } else if (hasRole(user, "manager")) {
      return mockData.filter(
        (record) =>
          record.employeeName === user?.name ||
          record.reportingManager === user?.name
      );
    }
    return mockData;
  };

  // Apply filters + role-based visibility to logs
  const filteredData = useMemo(() => {
    let data = logs;
    console.log("Initial logs for filtering:", data);
    console.log("User roles:", (user as any)?.roles);

    // Role-based visibility (client-side filtering)
    if (
      hasRole(user, "employee") &&
      !hasRole(user, "manager") &&
      !hasRole(user, "admin") &&
      !hasRole(user, "hr")
    ) {
      // Regular employee → sees only their own records
      const employeeId = (user as any)?.employeeId || `EMP${String(user?.id || "0").padStart(3, "0")}`;
      const userId = user?.id?.toString();
      console.log("Employee filtering for employeeId:", employeeId);
      console.log("Employee filtering for userId:", userId);
      
      data = data.filter((record) => {
        // Check both employee_code and employee_id
        const matchesEmployeeCode = record.employeeId === employeeId;
        const matchesEmployeeId = record.originalEmployeeId?.toString() === userId;
        console.log(`Record ${record.id}: employeeCode=${record.employeeId}, originalEmployeeId=${record.originalEmployeeId}, matchesCode=${matchesEmployeeCode}, matchesId=${matchesEmployeeId}`);
        return matchesEmployeeCode || matchesEmployeeId;
      });
      
      console.log("Data after employee filtering:", data);
    } else if (hasRole(user, "manager")) {
      // Manager → sees self + team members
      console.log("Manager filtering for name:", user?.name);
      data = data.filter(
        (record) =>
          record.employeeName === user?.name ||
          record.reportingManager === user?.name
      );
      console.log("Data after manager filtering:", data);
    }
    // Admin & HR → see all records (no filtering)

    // Search by name or ID
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(
        (record) =>
          record.employeeName.toLowerCase().includes(lowerSearch) ||
          record.employeeId.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      data = data.filter((record) => record.status === filterStatus);
    }

    console.log("Final filtered data:", data);
    return data;
  }, [logs, searchTerm, filterStatus, user]);
  // Get records for the selected date
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];
    return filteredData.filter((record) => record.date === selectedDate);
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

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      present: "default",
      absent: "destructive",
      half: "secondary",
      miss: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      present: "bg-green-100 text-green-700 border-green-200",
      absent: "bg-red-100 text-red-700 border-red-200",
      half: "bg-yellow-100 text-yellow-700 border-yellow-200",
      miss: "bg-gray-100 text-gray-700 border-gray-200",
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

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (recordsByDate[dateStr]) {
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
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            Attendance Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            View employee attendance on a calendar. Click a date to see details.
          </p>
        </div>

        {/* Filters - Only show for Admin/HR/Manager */}
        {(hasRole(user, "admin") || hasRole(user, "hr") || hasRole(user, "manager")) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`grid gap-2 sm:gap-4 grid-cols-1 ${
                  hasRole(user, "manager") ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3"
                }`}
              >
                {(hasRole(user, "admin") || hasRole(user, "hr")) && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      <Input
                        placeholder="Name or ID"
                        className="pl-8 text-xs sm:text-sm h-8 sm:h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-1 sm:gap-2">
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="ml-1 sm:ml-2">Export</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading attendance logs...</p>
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
                <Button onClick={fetchAttendanceLogs} variant="outline" className="mt-4">
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
                  No attendance records found for the selected filters.
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
                  <CardTitle className="text-lg sm:text-xl break-words">{monthName}</CardTitle>
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
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const dateStr = formatDateString(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  );
                  const hasRecords = !!recordsByDate[dateStr];
                  const records = recordsByDate[dateStr] || [];

                  const statuses = records.map((r) => r.status);
                  const hasPresent = statuses.includes("present");
                  const hasAbsent = statuses.includes("absent");
                  const hasHalf = statuses.includes("half");
                  const hasFlag = records.some((r) => r.autoFlag);

                  let bgColor = "bg-white border-gray-200";
                  if (hasRecords) {
                    if (hasAbsent) bgColor = "bg-red-50 border-red-300";
                    else if (hasHalf) bgColor = "bg-yellow-50 border-yellow-300";
                    else if (hasPresent) bgColor = "bg-green-50 border-green-300";
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      disabled={!hasRecords}
                      className={`aspect-square p-0.5 sm:p-2 rounded border sm:border-2 text-xs sm:text-sm font-medium transition-all ${
                        hasRecords
                          ? `${bgColor} cursor-pointer hover:shadow-md sm:hover:scale-105`
                          : "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1">
                        <span
                          className={`text-xs sm:text-sm ${hasRecords ? "text-gray-900 font-bold" : ""}`}
                        >
                          {day}
                        </span>
                        {hasRecords && (
                          <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                            {hasFlag && (
                              <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 text-amber-600 flex-shrink-0" />
                            )}
                            {hasPresent && (
                              <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-green-600 flex-shrink-0" />
                            )}
                            {hasAbsent && (
                              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600 flex-shrink-0"></div>
                            )}
                            {hasHalf && (
                              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-600 flex-shrink-0"></div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
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
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Flagged</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal for date details */}
            {/* Modal for date details */}
            {/* Modal for date details - Exact design as per your image */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Attendance - {selectedDate || "Selected Date"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Showing {selectedDateRecords.length} record{selectedDateRecords.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {selectedDateRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No attendance records found for this date.
              </div>
            ) : (
              selectedDateRecords.map((record) => (
                <div key={record.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-white p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column - Employee Info */}
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          {record.employeeName}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Employee ID:</span>
                            <span className="font-medium">{record.employeeId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reporting Manager:</span>
                            <span className="font-medium">{record.reportingManager || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className="bg-green-600 text-white">
                              PRESENT
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Time & Duration */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Time & Duration</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-in:</span>
                            <span className="font-medium">
                              {record.inTime || "—"} {record.inConfidence ? `(${record.inConfidence}% confidence)` : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span className="font-medium">
                              {record.outTime || "—"} {record.outConfidence ? `(${record.outConfidence}% confidence)` : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hours Worked:</span>
                            <span className="font-medium text-lg">
                              {record.hoursWorked > 0 ? `${record.hoursWorked.toFixed(2)}h` : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-6" />

                    {/* Images Section - Check-in and Check-out Photos */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold">Attendance Photos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Check-in Image */}
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Check-in Photo</h5>
                          {record.imageIn ? (
                            <div className="relative group">
                              <img
                                src={record.imageIn}
                                alt="Check-in"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => window.open(record.imageIn, '_blank')}
                                >
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm">No check-in photo</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Check-out Image */}
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Check-out Photo</h5>
                          {record.imageOut ? (
                            <div className="relative group">
                              <img
                                src={record.imageOut}
                                alt="Check-out"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => window.open(record.imageOut, '_blank')}
                                >
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                                  <Clock className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm">No check-out photo</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section - Device & Location */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-medium mb-2">Device</h4>
                        <p className="text-lg font-semibold">{record.device}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Location</h4>
                        <p className="text-lg font-semibold">{record.location.address}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Coordinates: {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                          <br />
                          Accuracy: {record.location.accuracy}m
                        </p>
                      </div>
                    </div>

                    {/* Override Button */}
                    {(hasRole(user, "admin") || hasRole(user, "hr") || hasRole(user, "manager")) && (
                      <div className="mt-8 flex justify-end">
                        <Button
                          onClick={() => {
                            handleOverride(record.id);
                            setIsModalOpen(false);
                          }}
                          className="bg-green-600 hover:bg-green-700 gap-2"
                        >
                          <Clock className="w-5 h-5" />
                          Override Record
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}