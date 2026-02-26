 import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
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
import { Search, Download, AlertTriangle, CheckCircle2, Clock, Timer, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import attendanceApi from "@/components/helper/attendance/attendance"
import { holidayApi, Holiday } from "@/components/helper/leave/leave"
import shiftApi, { Shift } from "@/components/helper/shifts/shifts"
import { BASE_URL } from "@/lib/endpoint";
import ENDPOINTS from "@/lib/endpoint";


// src/api/attendanceApi.ts
export interface AttendanceLogRecord {
  id: string;
  employeeId: string;           // ← employee_id → employeeId
  employeeName: string;         // ← employee_name → employeeName
  reportingManager?: string;
  date: string;
  inTime?: string;              // ← check_in → inTime
  outTime?: string;             // ← check_out → outTime
  type: "full" | "half" | "absent" | "present" | "unmarked";
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
  status: "present" | "absent" | "half" | "miss" | "unmarked" | "late";
  hoursWorked: number;
  overtimeHours: number;
  autoFlag: boolean;
  flagReason?: string;
  lateBy?: string;              // How many minutes late
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

const resolveImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  try {
    return new URL(imagePath, BASE_URL).toString();
  } catch {
    const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${BASE_URL}${normalizedPath}`;
  }
};

export default function AttendanceLog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasModuleAccess, canPerformModuleAction } = useRole();
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

  // New states for employee list view
  const [viewMode, setViewMode] = useState<'employee-list' | 'calendar'>('employee-list');
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

  const getEmployeeCode = (employee: any): string => {
    const directCode =
      employee?.employee_code ||
      employee?.employeeCode ||
      employee?.emp_code ||
      employee?.empCode;

    if (typeof directCode === "string" && directCode.trim()) {
      return directCode.trim();
    }

    if (typeof employee?.employee_id === "string" && employee.employee_id.trim()) {
      return employee.employee_id.trim();
    }

    const numericId = Number(employee?.id ?? employee?.employee_id ?? 0);
    return `EMP${String(Number.isFinite(numericId) ? numericId : 0).padStart(3, "0")}`;
  };

  
  const handleOverride = (recordId: string) => {
  const record = filteredData.find(r => r.id === recordId);
  if (record) {
    navigate(
      `/attendance/override?recordId=${record.id}&employeeId=${record.employeeId}&date=${record.date}`
    );
  }
};

  // Fetch employees list
const fetchEmployees = async () => {
  setEmployeesLoading(true);
  try {
    const response = await ENDPOINTS.getEmployee();
    console.log("Full API response:", response);
    console.log("Response data:", response.data);
    console.log("Response data type:", typeof response.data);
    console.log("Is response.data an array?", Array.isArray(response.data));
    
    let employeeData = response.data || [];
    
    // Handle different response structures
    if (response.data?.data && Array.isArray(response.data.data)) {
      employeeData = response.data.data;
      console.log("Using nested data array:", employeeData);
    } else if (response.data?.employees && Array.isArray(response.data.employees)) {
      employeeData = response.data.employees;
      console.log("Using employees array:", employeeData);
    } else if (!Array.isArray(employeeData)) {
      console.warn("Employee data is not an array:", employeeData);
      // Try to find an array in the response
      if (typeof response.data === 'object') {
        const possibleArrays = Object.values(response.data).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          employeeData = possibleArrays[0];
          console.log("Found array in response:", employeeData);
        } else {
          employeeData = [];
        }
      } else {
        employeeData = [];
      }
    }
    
    console.log("Final employee data:", employeeData);
    console.log("Final employee data length:", employeeData.length);
    setEmployees(employeeData);
  } catch (error) {
    console.error("Error fetching employees:", error);
    toast.error("Failed to load employees");
    setEmployees([]); // Set empty array on error
  } finally {
    setEmployeesLoading(false);
  }
};

  // Handle employee click to show calendar
const handleEmployeeClick = (employee: any) => {
  setSelectedEmployee({
    id: employee.id.toString(),
    name: `${employee.first_name} ${employee.last_name || ''}`.trim(),
    employeeId: getEmployeeCode(employee)
  });
  setViewMode('calendar');
};

  // Handle back to employee list
const handleBackToEmployeeList = () => {
  setViewMode('employee-list');
  setSelectedEmployee(null);
};

// Fetch holidays
const fetchHolidays = async () => {
  setHolidaysLoading(true);
  try {
    const result = await holidayApi.getHolidays();
    if (result.data) {
      console.log("Raw holidays from API:", result.data);
      console.log("Holiday date formats:", result.data.map(h => ({ name: h.name, originalDate: h.date, dateType: typeof h.date })));
      setHolidays(result.data);
      console.log("Fetched holidays:", result.data);
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
      console.log("Fetched shifts:", result.data);
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

    console.log("Selected month:", currentMonth.toLocaleDateString());
    console.log("Fetching for:", startDate, "to", endDate);

    // Send user information to backend for proper role-based filtering
    const userInfo = {
      userId: user?.id,
      userRole: (user as any)?.role,
      userRoles: (user as any)?.roles,
      userType: (user as any)?.type,
      userName: user?.name,
      companyId: (user as any)?.company_id,
      departmentId: (user as any)?.department_id
    };
    
    console.log("Sending user info to backend:", userInfo);

    const pageSize = 100;
    const firstPage = await attendanceApi.getAttendanceLogs({
      startDate,
      endDate,
      page: 1,
      limit: pageSize,
      ...userInfo // Send user info for backend filtering
    });

    console.log("API First Page Result:", firstPage);
    console.log("API First Page data:", firstPage.data);

    // Use the data directly from the API response
    let attendanceData: any[] = Array.isArray(firstPage.data) ? [...firstPage.data] : [];
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
            ...userInfo
          })
        );
      }

      const pageResponses = await Promise.all(pageRequests);
      pageResponses.forEach((pageResult: any, index: number) => {
        if (Array.isArray(pageResult?.data)) {
          attendanceData = attendanceData.concat(pageResult.data);
        } else {
          console.warn(`Attendance page ${index + 2} has no array data`, pageResult);
        }
      });
    }

    console.log("Fetched total pages:", totalPages, "Total records:", attendanceData.length);

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

        // Extract date from check_in, fallback to created_at
        const getDate = (isoString: string | null, fallbackString?: string | null) => {
          if (isoString) {
            const d = new Date(isoString);
            return d.toISOString().split("T")[0]; // YYYY-MM-DD
          }
          if (fallbackString) {
            const d = new Date(fallbackString);
            return d.toISOString().split("T")[0]; // YYYY-MM-DD
          }
          return null;
        };

        // Helper function to construct full image URL
        const getImageUrl = (relativePath: string | null) => {
          const fullUrl = resolveImageUrl(relativePath);
          console.log("Constructing image URL:", { relativePath, fullUrl });
          return fullUrl;
        };

        // Debug log for image fields
        console.log("API Response Item:", {
          check_in_image_url: item.check_in_image_url,
          check_out_image_url: item.check_out_image_url,
          id: item.id
        });

        // Debug log for each item being processed
        const extractedDate = getDate(item.check_in, item.created_at);
        console.log("Processing API Item:", {
          id: item.id,
          check_in: item.check_in,
          created_at: item.created_at,
          extracted_date: extractedDate,
          status: item.status,
          employee_name: `${item.first_name} ${item.last_name || ""}`.trim(),
          hours_worked: item.hours_worked
        });

        // Determine actual attendance status using shift-based calculation
        // IMPORTANT: Do not overwrite backend status='late' with frontend calculation.
        // Only allow upgrading present -> late for UI convenience.
        let actualStatus = item.status;
        let calculatedLateBy = "";
        
        // If there's a check-in time, calculate lateBy and (optionally) upgrade present -> late
        if (item.check_in && item.shift_id) {
          const attendanceDate = getDate(item.check_in, item.created_at) || "";
          const shiftCalculation = calculateAttendanceStatus(
            item.check_in,
            item.shift_id.toString(),
            attendanceDate
          );

          // Keep backend late as-is; otherwise upgrade present -> late if calculation says late
          if (item.status !== "late" && item.status === "present" && shiftCalculation.status === "late") {
            actualStatus = "late";
          }

          if (actualStatus === "late") {
            calculatedLateBy = shiftCalculation.lateBy || "";
          }
          
          console.log("Shift-based attendance calculation:", {
            employee: item.first_name,
            checkIn: item.check_in,
            shiftId: item.shift_id,
            backendStatus: item.status,
            finalStatus: actualStatus,
            lateBy: shiftCalculation.lateBy,
            reason: shiftCalculation.reason
          });
        } else if (!item.check_in && item.status === "absent") {
          // If no check_in and status is absent, it might be unmarked attendance
          actualStatus = "unmarked";
          console.log("Unmarked attendance detected for:", item.first_name);
        }

        return {
          id: item.id.toString(),
          employeeId: getEmployeeCode(item),
          employeeName: `${item.first_name} ${item.last_name || ""}`.trim(),
          date: getDate(item.check_in, item.created_at) || "",
          inTime: formatTime(item.check_in),
          outTime: formatTime(item.check_out),
          status: actualStatus,
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
          type: (item.status === "half" ? "half" : item.status === "absent" ? "absent" : item.status === "unmarked" ? "unmarked" : "full") as "full" | "half" | "absent" | "present" | "unmarked",
          lateBy: calculatedLateBy,
          // Also store the original employee_id for matching
          originalEmployeeId: item.employee_id,
        };
      });

      console.log("Mapped logs:", mappedLogs);
      
      // Fetch all employees to create individual absent records
      try {
        const employeesResponse = await ENDPOINTS.getEmployee();
        const employees = employeesResponse.data || [];
        console.log("Fetched employees:", employees);
        console.log("Number of employees:", employees.length);
        
        // Create absent records for all days in the month that don't have attendance
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const allDatesInMonth: string[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          allDatesInMonth.push(dateStr);
        }
        
        console.log("All dates in month:", allDatesInMonth);
        
        // Find dates that don't have attendance records (excluding future dates only)
        const today = new Date().toISOString().split('T')[0];
        const existingDates = mappedLogs.map(log => log.date);
        
        console.log("Today's date:", today);
        console.log("Existing attendance dates:", existingDates);
        
        // Simple logic: any past date (including today) that's not in existing dates = absent
        const absentDates = allDatesInMonth.filter(date => {
          return date <= today && !existingDates.includes(date);
        });
        
        console.log("Dates that should show as absent:", absentDates);
        console.log("Number of absent dates:", absentDates.length);
        console.log("Employees available:", employees.length);
        
        // Create absent records for each employee on each absent date
        const absentRecords: AttendanceLogRecord[] = [];
        if (absentDates.length > 0) {
          console.log("Creating absent records for dates:", absentDates);
          
          // Create at least one absent record per date if employee API fails or returns empty
          const employeesToUse = employees.length > 0 ? employees : [
            { id: 1, employee_code: "EMP001", first_name: "Employee", last_name: "" }
          ];
          
          employeesToUse.forEach((employee: any) => {
            absentDates.forEach(date => {
              const absentRecord = {
                id: `absent-${employee.id}-${date}`,
                employeeId: getEmployeeCode(employee),
                employeeName: `${employee.first_name} ${employee.last_name || ""}`.trim(),
                date: date,
                inTime: null,
                outTime: null,
                status: "absent" as "present" | "absent" | "half" | "miss" | "unmarked",
                hoursWorked: 0,
                overtimeHours: 0,
                autoFlag: false,
                device: "No Attendance",
                location: {
                  latitude: 0,
                  longitude: 0,
                  accuracy: 0,
                  address: "No attendance marked"
                },
                imageUrl: "",
                imageIn: "",
                imageOut: "",
                type: "absent" as "full" | "half" | "absent" | "present" | "unmarked"
              };
              console.log("Creating absent record:", absentRecord);
              absentRecords.push(absentRecord);
            });
          });
        } else {
          console.log("No absent dates found");
        }
        
        console.log("Created absent records:", absentRecords.length);
        absentRecords.forEach(record => console.log("Absent record status:", record.status, "Date:", record.date, "Employee:", record.employeeName));
        
        // Combine existing logs with absent records
        const allLogs = [...mappedLogs, ...absentRecords];
        console.log("Combined logs (including individual absent):", allLogs);
        allLogs.forEach(log => console.log("Final log entry status:", log.status, "Date:", log.date, "Employee:", log.employeeName));
        console.log("Total records:", allLogs.length);
        setLogs(allLogs);
        
      } catch (employeeError) {
        console.error("Error fetching employees:", employeeError);
        // Fallback: create dummy absent records to ensure calendar shows red
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().toISOString().split('T')[0];
        const existingDates = mappedLogs.map(log => log.date);
        
        const absentDates = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (dateStr <= today && !existingDates.includes(dateStr)) {
            absentDates.push(dateStr);
          }
        }
        
        const fallbackAbsentRecords = absentDates.map(date => ({
          id: `absent-fallback-${date}`,
          employeeId: "EMP001",
          employeeName: "Employee",
          date: date,
          inTime: null,
          outTime: null,
          status: "absent" as "present" | "absent" | "half" | "miss" | "unmarked",
          hoursWorked: 0,
          overtimeHours: 0,
          autoFlag: false,
          device: "No Attendance",
          location: {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            address: "No attendance marked"
          },
          imageUrl: "",
          imageIn: "",
          imageOut: "",
          type: "absent" as "full" | "half" | "absent" | "present" | "unmarked"
        }));
        
        console.log("Fallback absent records created:", fallbackAbsentRecords.length);
        console.log("Fallback absent dates:", absentDates);
        const allLogs = [...mappedLogs, ...fallbackAbsentRecords];
        setLogs(allLogs);
      }
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

  // Shift-based attendance calculation
  const calculateAttendanceStatus = (checkInTime: string, shiftId: string, date: string): {
    status: "present" | "absent" | "half" | "late";
    lateBy?: string;
    reason?: string;
  } => {
    if (!checkInTime) {
      return { status: "absent", reason: "No check-in recorded" };
    }

    const shift = shifts.find(s => s.id.toString() === shiftId.toString());
    if (!shift) {
      return { status: "present", reason: "No shift assigned" }; // Default to present if no shift
    }

    // checkInTime is an ISO timestamp from backend (e.g., "2026-02-05T07:41:46.000Z")
    const checkInDateTime = new Date(checkInTime);
    if (Number.isNaN(checkInDateTime.getTime())) {
      return { status: "present", reason: "Invalid check-in time" };
    }

    // Parse shift start time (e.g., "09:00:00") and compare in the user's local timezone
    const [shiftHours, shiftMinutes] = shift.startTime.split(':').slice(0, 2).map(Number);
    const shiftStartDateTime = new Date(checkInDateTime);
    shiftStartDateTime.setHours(shiftHours, shiftMinutes, 0, 0);

    const differenceInMinutes =
      (checkInDateTime.getTime() - shiftStartDateTime.getTime()) / (1000 * 60);

    // Backend rule: any time strictly after shift start is LATE
    if (differenceInMinutes > 0) {
      const lateByMinutes = Math.floor(differenceInMinutes);
      return {
        status: "late",
        lateBy: `${lateByMinutes} minutes`,
        reason: `Checked in ${lateByMinutes} minutes late`
      };
    }

    return { status: "present", reason: "On time" };
  };

  // Helper function to check if a date is a holiday
  const isHoliday = (dateStr: string) => {
    console.log("Checking if date is holiday:", dateStr);
    console.log("Available holidays:", holidays.map(h => ({ name: h.name, date: h.date })));
    const isHolidayFound = holidays.some(holiday => holiday.date === dateStr);
    console.log("Is holiday found:", isHolidayFound);
    return isHolidayFound;
  };

  // Helper function to get holiday name
  const getHolidayName = (dateStr: string) => {
    const holiday = holidays.find(holiday => holiday.date === dateStr);
    return holiday?.name || "";
  };
  
  
  
  
  // Get initial data based on user permissions
  const getInitialData = () => {
    if (canPerformModuleAction("attendance", "view") && !canPerformModuleAction("attendance", "edit")) {
      // Basic view access only - show own records
      const employeeId = `EMP${String(parseInt(user?.id || "0")).padStart(3, "0")}`;
      return mockData.filter((record) => record.employeeId === employeeId);
    } else if (canPerformModuleAction("attendance", "edit")) {
      // Edit access - can see team/department records
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
    console.log("User info:", user);
    console.log("hasModuleAccess('attendance'):", hasModuleAccess("attendance"));
    console.log("canPerformModuleAction('attendance', 'edit'):", canPerformModuleAction("attendance", "edit"));

    // When in calendar mode with selected employee, filter by that employee
    if (viewMode === 'calendar' && selectedEmployee) {
      data = data.filter(record => 
        record.originalEmployeeId?.toString() === selectedEmployee.id ||
        record.employeeId === selectedEmployee.employeeId
      );
      console.log("Filtered by selected employee:", selectedEmployee.name, "Records:", data.length);
    }

    // Backend now handles role-based filtering, so no client-side filtering needed
    console.log("Backend filtered data received:", data.length, "records");

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
  }, [logs, searchTerm, filterStatus, user, viewMode, selectedEmployee]);
  // Get records for the selected date
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return [];
    
    const records = filteredData.filter((record) => record.date === selectedDate);
    
    // If it's today and no real records found, create a mock unmarked record
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    const hasRealRecords = records.some(r => !r.id.startsWith('absent-') && !r.id.startsWith('unmarked-'));
    
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
          address: "No attendance marked today"
        },
        imageUrl: "",
        imageIn: "",
        imageOut: "",
        type: "unmarked"
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

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      present: "default",
      absent: "destructive",
      half: "secondary",
      miss: "outline",
      unmarked: "outline", // Different styling for unmarked attendance
      late: "secondary",
    };
    const displayText =
      status === "unmarked" ? "NOT MARKED" : status === "late" ? "LATE" : status.toUpperCase();
    return <Badge variant={variants[status] || "outline"}>{displayText}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      present: "bg-green-100 text-green-700 border-green-200",
      absent: "bg-red-100 text-red-700 border-red-200",
      half: "bg-yellow-100 text-yellow-700 border-yellow-200",
      miss: "bg-gray-100 text-gray-700 border-gray-200",
      unmarked: "bg-orange-100 text-orange-700 border-orange-200", // Orange for unmarked
      late: "bg-orange-100 text-orange-700 border-orange-200",
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
    const today = new Date().toISOString().split('T')[0];
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
          address: "No attendance marked today"
        },
        imageUrl: "",
        imageIn: "",
        imageOut: "",
        type: "unmarked"
      };
      
      // Temporarily add this record for the modal
      const tempRecords = [mockUnmarkedRecord];
      setSelectedDate(dateStr);
      setIsModalOpen(true);
      
      // We'll handle this in the modal rendering
      console.log("Showing unmarked attendance for today:", dateStr);
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
      <CardContent>
        {employeesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading employees...</p>
          </div>
        ) : !Array.isArray(employees) || employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No employees found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Debug: employeesLoading={employeesLoading.toString()}, 
              employeesType={Array.isArray(employees) ? 'array' : typeof employees}, 
              employeesLength={Array.isArray(employees) ? employees.length : 'N/A'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => {
              // Ensure employee has required properties
              if (!employee || !employee.id) {
                console.warn("Invalid employee data:", employee);
                return null;
              }
              
              return (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase() || 'E'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {getEmployeeCode(employee)}
                      </p>
                      {employee.designation && (
                        <p className="text-xs text-gray-400 truncate">
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
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            Attendance Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            {viewMode === 'employee-list' 
              ? 'Select an employee to view their attendance calendar.'
              : `Viewing attendance for ${selectedEmployee?.name}. Click a date to see details.`
            }
          </p>
        </div>

        {/* Back button when in calendar mode */}
        {viewMode === 'calendar' && (
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
        {viewMode === 'employee-list' ? (
          <EmployeeListView />
        ) : (
          <>
            {/* Filters - Only show for users with edit access */}
            {canPerformModuleAction("attendance", "edit") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid gap-2 sm:gap-4 grid-cols-1 ${
                      canPerformModuleAction("attendance", "approve") ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3"
                    }`}
                  >
                    {canPerformModuleAction("attendance", "approve") && (
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
                      No attendance records found for {selectedEmployee?.name} for the selected filters.
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
                        return <div key={`empty-${index}`} className="aspect-square"></div>;
                      }

                      const dateStr = formatDateString(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      );
                      const hasRecords = !!recordsByDate[dateStr];
                      const records = recordsByDate[dateStr] || [];
                      
                      // Check if this date is a weekend (Saturday or Sunday - holiday)
                      const dayOfWeek = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      ).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday is 0, Saturday is 6
                      
                      // Check if this date is a holiday from the API
                      const isApiHoliday = isHoliday(dateStr);
                      const holidayName = getHolidayName(dateStr);
                      
                      // A date is a holiday if it's a weekend OR an API holiday
                      const isHolidayDate = isWeekend || isApiHoliday;
                      
                      // Debug logging for each date
                      if (day >= 20 && day <= 28) { // Log for dates around the issue
                        console.log(`Date ${dateStr} (${day}):`, {
                          hasRecords,
                          recordsCount: records.length,
                          records: records.map(r => ({ id: r.id, status: r.status, employee: r.employeeName })),
                          isWeekend,
                          isApiHoliday,
                          isHolidayDate,
                          holidayName,
                          dayOfWeek
                        });
                      }
                      
                      // Check if this is today and there are no real records (unmarked attendance)
                      const today = new Date().toISOString().split('T')[0];
                      const isToday = dateStr === today;
                      const hasRealRecords = records.some(r => !r.id.startsWith('absent-') && !r.id.startsWith('unmarked-'));
                      const isTodayUnmarked = isToday && !hasRealRecords;

                      const statuses = records.map((r) => r.status);
                      const hasPresent = statuses.includes("present");
                      const hasAbsent = statuses.includes("absent");
                      const hasHalf = statuses.includes("half");
                      const hasLate = statuses.includes("late");
                      const hasUnmarked = statuses.includes("unmarked") || isTodayUnmarked;
                      const hasFlag = records.some((r) => r.autoFlag);

                      // Debug status checking
                      if (day >= 20 && day <= 28) {
                        console.log(`Status check for ${dateStr}:`, {
                          statuses,
                          hasPresent,
                          hasAbsent,
                          hasHalf,
                          hasLate,
                          hasUnmarked,
                          isTodayUnmarked,
                          isHolidayDate
                        });
                      }

                      let bgColor = "bg-white border-gray-200";
                      if (isHolidayDate) {
                        bgColor = "bg-gray-100 border-gray-300"; // Holiday styling
                      } else if (hasRecords || isTodayUnmarked) {
                        if (hasPresent) bgColor = "bg-green-50 border-green-300";
                        else if (hasHalf) bgColor = "bg-yellow-50 border-yellow-300";
                        else if (hasAbsent) bgColor = "bg-red-50 border-red-300";
                        else if (hasLate) bgColor = "bg-orange-50 border-orange-300"; // Late = orange
                        else if (isTodayUnmarked || hasUnmarked) bgColor = "bg-orange-50 border-orange-300";
                      } else {
                        // No records - check if past date or future date
                        const today = new Date().toISOString().split('T')[0];
                        if (dateStr < today) {
                          // Past date with no records = absent
                          bgColor = "bg-red-50 border-red-300";
                        } else if (dateStr > today) {
                          // Future date = not marked
                          bgColor = "bg-orange-50 border-orange-300";
                        } else {
                          // Today with no records = not marked
                          bgColor = "bg-orange-50 border-orange-300";
                        }
                      }

                      return (
                        <button
                          key={day}
                          onClick={() => !isHolidayDate && handleDateClick(day)}
                          disabled={isHolidayDate}
                          className={`aspect-square p-0.5 sm:p-2 rounded border sm:border-2 text-xs sm:text-sm font-medium transition-all ${
                            isHolidayDate
                              ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                              : (hasRecords || isTodayUnmarked)
                              ? `${bgColor} cursor-pointer hover:shadow-md sm:hover:scale-105`
                              : (() => {
                                  const today = new Date().toISOString().split('T')[0];
                                  if (dateStr < today) {
                                    return "bg-red-50 border-red-300 text-red-700 cursor-not-allowed"; // Past absent
                                  } else if (dateStr > today) {
                                    return "bg-orange-50 border-orange-300 text-orange-700 cursor-not-allowed"; // Future not marked
                                  } else {
                                    return "bg-orange-50 border-orange-300 text-orange-700 cursor-not-allowed"; // Today not marked
                                  }
                                })()
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1">
                            <span
                              className={`text-xs sm:text-sm ${
                                isHolidayDate 
                                  ? "text-gray-500 font-medium" 
                                  : (hasRecords || isTodayUnmarked) 
                                    ? "text-gray-900 font-bold" 
                                    : (() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        if (dateStr < today) {
                                          return "text-red-700 font-bold"; // Past absent
                                        } else if (dateStr > today) {
                                          return "text-orange-700 font-bold"; // Future not marked
                                        } else {
                                          return "text-orange-700 font-bold"; // Today not marked
                                        }
                                      })()
                              }`}
                            >
                              {day}
                            </span>
                            {isHolidayDate && (
                              <div className="text-xs text-gray-400 font-medium">
                                <span className="sm:hidden inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                                <span className="hidden sm:inline">{isApiHoliday ? holidayName : "WEEKEND"}</span>
                              </div>
                            )}
                            {!isHolidayDate && !(hasRecords || isTodayUnmarked) && (
                              <div className="flex flex-col gap-0.5 sm:gap-1 items-center">
                                <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                                  {(() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    if (dateStr < today) {
                                      // Past absent
                                      return <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600 flex-shrink-0"></div>;
                                    } else if (dateStr > today) {
                                      // Future not marked
                                      return <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />;
                                    } else {
                                      // Today not marked
                                      return <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />;
                                    }
                                  })()}
                                </div>
                                <div className="hidden sm:block text-xs font-medium">
                                  {(() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    if (dateStr < today) {
                                      return <span className="text-red-600">ABSENT</span>;
                                    } else if (dateStr > today) {
                                      return <span className="text-orange-600">NOT MARKED</span>;
                                    } else {
                                      return <span className="text-orange-600">NOT MARKED</span>;
                                    }
                                  })()}
                                </div>
                              </div>
                            )}
                            {!isHolidayDate && (hasRecords || isTodayUnmarked) && (
                              <div className="flex flex-col gap-0.5 sm:gap-1 items-center">
                                <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                                  {hasFlag && (
                                    <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 text-amber-600 flex-shrink-0" />
                                  )}
                                  {hasPresent && (
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
                                  {(!hasPresent && !hasHalf && !hasAbsent && !hasLate && (hasUnmarked || isTodayUnmarked)) && (
                                    <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-orange-600 flex-shrink-0" />
                                  )}
                                </div>
                                {records.length > 1 && (
                                  <span className="hidden sm:inline text-xs text-gray-500 font-medium">
                                    {records.length}
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
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
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
                        <span className="text-xs sm:text-sm">Weekend (Holiday)</span>
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
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold pr-8">
              Attendance - {selectedDate || "Selected Date"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Showing {selectedDateRecords.length} employee record{selectedDateRecords.length !== 1 ? "s" : ""} for {selectedDate || "Selected Date"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 sm:mt-6">
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
                      console.log("Modal record data:", {
                        id: record.id,
                        status: record.status,
                        date: record.date,
                        employeeName: record.employeeName
                      });
                      
                      return (
                        <div key={record.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">{record.employeeName}</h4>
                                  <p className="text-sm text-gray-500">{record.employeeId}</p>
                                </div>
                                <div className="sm:ml-2">
                                  {getStatusBadge(record.status)}
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-start gap-x-3 gap-y-1 text-sm text-gray-600">
                                <span className="whitespace-nowrap">Check-in: {record.inTime || "—"}</span>
                                <span className="whitespace-nowrap">Check-out: {record.outTime || "—"}</span>
                                <span className="whitespace-nowrap">Hours: {record.hoursWorked > 0 ? `${record.hoursWorked.toFixed(2)}h` : "—"}</span>
                              </div>
                              
                              {/* Attendance Photos */}
                              <div className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Check-in Photo */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-2">Check-in Photo</h5>
                                    {record.imageIn ? (
                                      <div className="relative group">
                                        <img
                                          src={record.imageIn}
                                          alt="Check-in"
                                          className="w-full h-32 sm:h-48 object-cover rounded border border-gray-200 cursor-pointer"
                                          onClick={() => window.open(record.imageIn, '_blank')}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                                          <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to enlarge
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-32 sm:h-48 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                          <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                                          <p className="text-xs">No check-in photo</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Check-out Photo */}
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-600 mb-2">Check-out Photo</h5>
                                    {record.imageOut ? (
                                      <div className="relative group">
                                        <img
                                          src={record.imageOut}
                                          alt="Check-out"
                                          className="w-full h-32 sm:h-48 object-cover rounded border border-gray-200 cursor-pointer"
                                          onClick={() => window.open(record.imageOut, '_blank')}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage Not Available%3C/text%3E%3C/svg%3E";
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                                          <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to enlarge
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-32 sm:h-48 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                          <Clock className="w-6 h-6 mx-auto mb-1" />
                                          <p className="text-xs">No check-out photo</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Info */}
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Device:</span> {record.device}
                                </div>
                                <div className="break-words">
                                  <span className="font-medium">Location:</span> {record.location.address}
                                </div>
                              </div>
                            </div>
                            {canPerformModuleAction("attendance", "edit") && (
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
    </Layout>
  );
}
