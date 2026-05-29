import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, X } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import reportService from "@/components/helper/roles/report/report";
import ENDPOINTS from "@/lib/endpoint";
import { PdfExportService } from "@/services/pdfExportService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportsAnalytics() {
  const location = useLocation();

  const getReportType = (pathname: string): "attendance" | "leave" | "payroll" | "finance" | "analytics" => {
    if (pathname.startsWith("/reports/finance")) return "finance";
    if (pathname.startsWith("/reports/payroll")) return "payroll";
    if (pathname.startsWith("/reports/leave")) return "leave";
    if (pathname.startsWith("/reports/attendance")) return "attendance";
    return "analytics";
  };

  const reportType = getReportType(location.pathname);

  // State for report data
  const [attendanceData, setAttendanceData] = useState([]); // monthly trend
  const [attendanceRows, setAttendanceRows] = useState([]); // detailed rows for export
  const [filteredAttendanceRows, setFilteredAttendanceRows] = useState([]);
  const [attendanceLeaveRows, setAttendanceLeaveRows] = useState([]);
  const [attendancePermissionRows, setAttendancePermissionRows] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [payrollRows, setPayrollRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    mode: 'month', // 'month' | 'day'
    month: '',
    day: '',
    startDate: '',
    endDate: '',
    employee: 'all',
    department: 'all',
    status: 'all', // 'all' | 'late' | others if needed
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [attendanceReportType, setAttendanceReportType] = useState<"summary" | "detail">("detail");

  useEffect(() => {
    if (reportType === "attendance") {
      setAttendanceReportType("detail");
    }
  }, [reportType]);

  // Refs for PDF export
  const reportRef = useRef(null);
  const RADIAN = Math.PI / 180;
  const renderLeaveLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
    value,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Define types
  interface PayrollSummary {
    totalEmployees?: number;
    avgSalary?: string;
    totalPayroll?: string;
    ytdAmount?: string;
  }

  interface Employee {
    id: string;
    name: string;
    department?: string;
  }

  const buildReportParams = () => {
    const params: any = {};
    const effectiveMode = reportType === "attendance" ? filters.mode : "month";

    if (effectiveMode === "month" && filters.month) {
      params.month = filters.month;
      params.startDate = `${filters.month}-01`;
      const [year, month] = filters.month.split("-").map(Number);
      const lastDay = String(new Date(year, month, 0).getDate()).padStart(2, "0");
      params.endDate = `${filters.month}-${lastDay}`;
    }

    if (effectiveMode === "day" && filters.day) {
      params.day = filters.day;
      params.startDate = filters.day;
      params.endDate = filters.day;
    }

    if (effectiveMode === "range") {
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }

    if (filters.employee !== "all") params.employeeId = filters.employee;
    if (filters.department !== "all") params.departmentId = filters.department;
    if (reportType === "attendance" && filters.status !== "all") {
      params.status = filters.status;
    }

    return params;
  };

  // State for summary data
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({});
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeValue = (value: any) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const filteredEmployees = employees.filter((employee: any) => {
    if (employee.id === "all" || filters.department === "all") return true;
    return normalizeValue(employee.departmentId ?? employee.department_id) === normalizeValue(filters.department);
  });

  const getEmployeeFilterValue = (item: any) =>
    String(
      item?.employeeCode ??
      item?.employee_id ??
      item?.employeeId ??
      item?.code ??
      item?.id ??
      ""
    ).trim();

  const getEmployeeDisplayName = (item: any) => {
    const name =
      item?.employeeName ??
      item?.employee_name ??
      item?.name ??
      `${String(item?.first_name ?? "").trim()} ${String(item?.last_name ?? "").trim()}`.trim();

    const employeeCode = getEmployeeFilterValue(item);
    if (!name && employeeCode) return employeeCode;
    if (!employeeCode) return String(name || "").trim();
    return `${String(name || "").trim()} (${employeeCode})`;
  };

  const getDepartmentFilterValue = (item: any) =>
    String(
      item?.department ??
      item?.department_name ??
      item?.departmentName ??
      item?.dept_name ??
      ""
    ).trim();

  const selectedDepartment = departments.find(
    (department: any) => department.id === filters.department
  ) as any;

  const matchesSelectedDepartment = (item: any) => {
    if (!filters.department || filters.department === "all") return true;

    const selectedDepartmentId = normalizeValue(filters.department);
    const selectedDepartmentName = normalizeValue(selectedDepartment?.name);
    const itemDepartmentId = normalizeValue(item?.departmentId ?? item?.department_id);
    const itemDepartmentName = normalizeValue(getDepartmentFilterValue(item));

    return (
      itemDepartmentId === selectedDepartmentId ||
      (!!selectedDepartmentName && itemDepartmentName === selectedDepartmentName)
    );
  };

  useEffect(() => {
    const fetchReportFilters = async () => {
      try {
        const response = await reportService.getReportFilters();
        const filterData = response?.data?.data || {};

        setEmployees([
          { id: "all", name: "All Employees" },
          ...(filterData.employees || []).map((employee: any) => ({
            ...employee,
            id: String(employee.id),
            departmentId: employee.departmentId === undefined || employee.departmentId === null
              ? employee.departmentId
              : String(employee.departmentId),
          })),
        ]);
        setDepartments([
          { id: "all", name: "All Departments" },
          ...(filterData.departments || []).map((department: any) => ({
            ...department,
            id: String(department.id),
          })),
        ]);
      } catch (err) {
        console.error("Report filters fetch error:", err);
        setEmployees([{ id: "all", name: "All Employees" }]);
        setDepartments([{ id: "all", name: "All Departments" }]);
      }
    };

    fetchReportFilters();
  }, []);

  // Apply filters to attendance rows (export + table)
  useEffect(() => {
    if (attendanceRows.length === 0) {
      setFilteredAttendanceRows([]);
      return;
    }

    let filtered = [...attendanceRows];

    // Date granularity filters
    if (filters.mode === 'month' && filters.month) {
      filtered = filtered.filter((item: any) => {
        const d = String(item.date || item.check_in || item.checkInTime || '').slice(0, 7); // YYYY-MM
        return d === filters.month;
      });
    }

    if (filters.mode === 'day' && filters.day) {
      filtered = filtered.filter((item: any) => {
        const d = String(item.date || item.check_in || item.checkInTime || '').slice(0, 10); // YYYY-MM-DD
        return d === filters.day;
      });
    }

    // Employee filter
    if (filters.employee && filters.employee !== 'all') {
      filtered = filtered.filter((item: any) => getEmployeeFilterValue(item) === filters.employee);
    }

    // Department filter
    if (filters.department && filters.department !== 'all') {
      filtered = filtered.filter((item: any) => matchesSelectedDepartment(item));
    }

    // Status filter (e.g., late arrivals)
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(
        (item: any) => (item.status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }

    setFilteredAttendanceRows(filtered);
  }, [filters, attendanceRows]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      mode: 'month',
      month: '',
      day: '',
      startDate: '',
      endDate: '',
      employee: 'all',
      department: 'all',
      status: 'all',
    });
  };

  useEffect(() => {
    if (filters.employee === "all" || filters.department === "all") return;

    const selectedEmployee = employees.find((employee: any) => employee.id === filters.employee);
    if (
      selectedEmployee &&
      normalizeValue(selectedEmployee.departmentId ?? selectedEmployee.department_id) !== normalizeValue(filters.department)
    ) {
      handleFilterChange("employee", "all");
    }
  }, [filters.department, filters.employee, employees]);

  const getItemValue = (item: any, ...keys: string[]) => {
    for (const key of keys) {
      if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
    }
    return "";
  };

  const getItemDateKey = (item: any) =>
    String(getItemValue(item, "date", "attendanceDate", "check_in_date", "check_in", "checkInTime") || "").slice(0, 10);

  const isTruthyText = (value: any) => ["yes", "true", "1"].includes(normalizeValue(value));

  const buildAttendanceSummaryRows = (rows: any[]) => {
    const employeeMap = new Map<string, any>();

    rows.forEach((item: any) => {
      const employeeCode = getEmployeeFilterValue(item);
      if (!employeeCode) return;

      const date = getItemDateKey(item) || `row-${item.id || employeeMap.size}`;
      const employeeName =
        getItemValue(item, "employeeName", "employee_name", "name") ||
        `${String(getItemValue(item, "first_name")).trim()} ${String(getItemValue(item, "last_name")).trim()}`.trim() ||
        employeeCode;

      if (!employeeMap.has(employeeCode)) {
        employeeMap.set(employeeCode, {
          employeeCode,
          employeeName,
          department: getDepartmentFilterValue(item),
          dates: new Map<string, any>(),
        });
      }

      const employee = employeeMap.get(employeeCode);
      if (!employee.department && getDepartmentFilterValue(item)) {
        employee.department = getDepartmentFilterValue(item);
      }

      const dateSummary = employee.dates.get(date) || {
        workingDay: 0,
        present: 0,
        absent: 0,
        leave: 0,
        permission: 0,
        late: 0,
        lop: 0,
      };

      const status = normalizeValue(getItemValue(item, "status", "attendance_status"));
      const leaveDays = Number(getItemValue(item, "leaveDays", "leave_days")) || 0;
      const isLeave =
        isTruthyText(getItemValue(item, "leaveTaken", "leave_taken")) ||
        status.includes("leave") ||
        Boolean(getItemValue(item, "leaveType", "leave_type", "leave_type_name"));
      const isPermission =
        isTruthyText(getItemValue(item, "permissionTaken", "permission_taken")) ||
        status.includes("permission");
      const isWeekendOrHoliday = status.includes("weekend") || status.includes("holiday");
      const isAbsent = status.includes("absent");
      const isLate =
        status.includes("late") ||
        Number(getItemValue(item, "lateArrival", "late_by")) > 0;
      const isHalf = status === "half" || status === "half_day";
      const isPresent =
        status.includes("present") ||
        status.includes("late") ||
        isPermission ||
        Number(getItemValue(item, "hoursWorked", "hours_worked", "total_hours", "duration")) > 0;

      if (!isWeekendOrHoliday) dateSummary.workingDay = 1;
      if (isLeave) dateSummary.leave = Math.max(dateSummary.leave, leaveDays > 0 && leaveDays <= 1 ? leaveDays : 1);
      if (isPermission) dateSummary.permission = 1;
      if (isLate) dateSummary.late = 1;
      if (isHalf) dateSummary.present = Math.max(dateSummary.present, 0.5);
      if (isPresent && !isLeave && !isAbsent) dateSummary.present = Math.max(dateSummary.present, isHalf ? 0.5 : 1);
      if (isAbsent) {
        dateSummary.absent = 1;
        dateSummary.lop = 1;
      }

      employee.dates.set(date, dateSummary);
    });

    return Array.from(employeeMap.values())
      .map((employee: any) => {
        const totals = Array.from(employee.dates.values()).reduce(
          (acc: any, day: any) => ({
            workingDays: acc.workingDays + day.workingDay,
            presentDays: acc.presentDays + day.present,
            absentDays: acc.absentDays + day.absent,
            leaveDays: acc.leaveDays + day.leave,
            permissionDays: acc.permissionDays + day.permission,
            lateDays: acc.lateDays + day.late,
            lopDays: acc.lopDays + day.lop,
          }),
          {
            workingDays: 0,
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,
            permissionDays: 0,
            lateDays: 0,
            lopDays: 0,
          }
        );

        return {
          "Employee Code": employee.employeeCode,
          "Employee Name": employee.employeeName,
          "Department": employee.department || "",
          "Working Days": totals.workingDays,
          "Present Days": totals.presentDays,
          "Absent Days": totals.absentDays,
          "Leave Days": totals.leaveDays,
          "Permission Days": totals.permissionDays,
          "Late Days": totals.lateDays,
          "LOP Days": totals.lopDays,
        };
      })
      .sort((a: any, b: any) => String(a["Employee Name"]).localeCompare(String(b["Employee Name"])));
  };

  const exportRows = (rows: any[], title: string, fileBase: string, format: "csv" | "xlsx" | "pdf") => {
    if (!rows.length) {
      toast.error("No data available to export");
      return;
    }

    const headers = Object.keys(rows[0] || {});

    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
      XLSX.writeFile(workbook, `${fileBase}-${new Date().toISOString().split("T")[0]}.xlsx`);
      return;
    }

    if (format === "pdf") {
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      pdf.setFontSize(14);
      pdf.text(title, 40, 35);
      pdf.setFontSize(8);
      let y = 60;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const colWidth = Math.max(80, (pageWidth - 80) / headers.length);
      headers.forEach((header, index) => pdf.text(header.slice(0, 18), 40 + index * colWidth, y));
      y += 14;
      rows.forEach((row: any) => {
        if (y > 560) {
          pdf.addPage();
          y = 40;
        }
        headers.forEach((header, index) => pdf.text(String(row[header] ?? "").slice(0, 20), 40 + index * colWidth, y));
        y += 12;
      });
      pdf.save(`${fileBase}-${new Date().toISOString().split("T")[0]}.pdf`);
      return;
    }

    const csvRows = [
      `"${title}"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      "",
      headers.join(","),
      ...rows.map((row: any) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBase}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  // Update the exportToPDF function to export raw data
  const exportToCSV = (format: "csv" | "xlsx" | "pdf" = "csv") => {
    try {
      setLoading(true);

      // Get the data based on the current report type
      let dataToExport = [];
      const reportType = getReportType(location.pathname);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Get the report title based on type
      const reportTitles = {
        attendance: 'Attendance Report',
        leave: 'Leave Report',
        payroll: 'Payroll Report',
        finance: 'Financial Report',
        analytics: 'Analytics Report'
      };

      // Get data based on report type
      const hasActiveAttendanceFilters = Boolean(
        filters.month ||
        filters.day ||
        filters.employee !== "all" ||
        filters.department !== "all" ||
        filters.status !== "all"
      );

      switch (reportType) {
        case 'attendance':
          dataToExport = hasActiveAttendanceFilters ? filteredAttendanceRows : attendanceRows;
          break;
        case 'leave':
          dataToExport = leaveRows;
          break;
        case 'payroll':
          dataToExport = payrollRows;
          break;
        case 'finance':
          dataToExport = expenseRows;
          break;
        default:
          dataToExport = [];
      }

      if (!dataToExport || dataToExport.length === 0) {
        toast.error('No data available to export');
        return;
      }

      if (reportType === 'attendance') {
        if (!dataToExport || dataToExport.length === 0) {
          toast.error("No attendance data to export");
          return;
        }

        // SalaryBox-style headers
        const headers = [
          "Employee ID",
          "Employee Name",
          "Phone Number",
          "Branch",
          "Department",
          "Designation",
          "Date",
          "Status",
          "Hours worked (HH:MM:SS)",
          "Late Arrival (HH:MM:SS)",
          "Early Departure (HH:MM:SS)",
          "Overtime (HH:MM:SS)",
          "Notes",
          "Leave Taken",
          "Leave Type",
          "Leave Days",
          "Leave Reason",
          "Permission Taken",
          "Permission From",
          "Permission To",
          "Permission Duration",
          "Permission Reason",
          "Punch in time",
          "Punch out time",
          "Punch Type",
          "Name",
          "Paid",
          "Scheduled Start Time",
          "Scheduled End Time",
          "Punch in location",
          "Punch out location",
        ];

        const pad = (n: number) => String(n).padStart(2, "0");

        const fmtDate = (d: any) => {
          if (!d) return "";
          const parsed = new Date(d);
          if (isNaN(parsed.getTime())) return String(d);
          return parsed
            .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            .split(" ")
            .join("-");
        };

        const fmtDuration = (val: any) => {
          if (val === null || val === undefined || val === "") return "00:00:00";
          const num = typeof val === "number" ? val : parseFloat(val);
          if (isNaN(num)) return "00:00:00";
          const totalSeconds = Math.round(num * 3600);
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          return `${pad(h)}:${pad(m)}:${pad(s)}`;
        };

        const fmtTime = (val: any) => {
          if (!val) return "";
          if (typeof val === "string" && (val.includes("AM") || val.includes("PM"))) return val;
          const parsed =
            typeof val === "string" && val.includes("T")
              ? new Date(val)
              : null;
          const h = parsed ? parsed.getHours() : Number(String(val).split(":")[0]);
          const m = parsed ? parsed.getMinutes() : Number(String(val).split(":")[1] || "0");
          if (isNaN(h)) return String(val);
          const period = h >= 12 ? "PM" : "AM";
          const hour12 = h % 12 === 0 ? 12 : h % 12;
          return `${hour12}:${pad(m)} ${period}`;
        };

        const normalizeString = (v: any) => (v === null || v === undefined ? "" : String(v));

        const rows = dataToExport.map((item: any) => {
          // Try multiple possible field names for each column
          const get = (...keys: string[]) => {
            for (const k of keys) {
              if (item[k] !== undefined && item[k] !== null) return item[k];
            }
            return "";
          };
          const isLeaveRow =
            normalizeString(get("leaveTaken", "leave_taken")).toLowerCase() === "yes" ||
            normalizeString(get("status", "attendance_status")).toLowerCase().includes("leave") ||
            Boolean(get("leaveType", "leave_type", "leave_type_name"));

          const row = {
            // Prefer business code over numeric id
            "Employee ID": get("employeeCode", "employee_id", "employeeId", "code"),
            "Employee Name":
              get("employeeName", "employee_name", "name") ||
              `${normalizeString(get("first_name"))} ${normalizeString(get("last_name"))}`.trim(),
            "Phone Number": get("phoneNumber", "phone", "phone_number", "mobile", "contact"),
            "Branch": get("branch", "branch_name"),
            "Department": get("department", "department_name", "departmentName", "dept_name"),
            "Designation": get("designation", "designation_name", "title", "role", "job_title"),
            "Date": fmtDate(get("date", "attendanceDate", "check_in_date")),
            "Status": get("status", "attendance_status"),
            "Hours worked (HH:MM:SS)": fmtDuration(get("hoursWorked", "hours_worked", "total_hours", "duration")),
            "Late Arrival (HH:MM:SS)": fmtDuration(get("lateArrival", "late_by")),
            "Early Departure (HH:MM:SS)": fmtDuration(get("earlyDeparture", "early_by")),
            "Overtime (HH:MM:SS)": fmtDuration(get("overtime", "overtime_hours")),
            "Notes": get("notes", "remarks", "flag_reason"),
            "Leave Taken": get("leaveTaken", "leave_taken"),
            "Leave Type": get("leaveType", "leave_type", "leave_type_name"),
            "Leave Days": get("leaveDays", "leave_days"),
            "Leave Reason": get("leaveReason", "leave_reason"),
            "Permission Taken": get("permissionTaken", "permission_taken"),
            "Permission From": fmtTime(get("permissionFromTime", "permission_from_time", "permission_time_from")),
            "Permission To": fmtTime(get("permissionToTime", "permission_to_time", "permission_time_to")),
            "Permission Duration": get("permissionDuration", "permission_duration"),
            "Permission Reason": get("permissionReason", "permission_reason"),
            "Punch in time": isLeaveRow ? "" : fmtTime(get("inTime", "checkInTime", "check_in_time", "punch_in_time", "check_in")),
            "Punch out time": isLeaveRow ? "" : fmtTime(get("outTime", "checkOutTime", "check_out_time", "punch_out_time", "check_out")),
            "Punch Type": get("punchType", "punch_type", "check_in_type") || "Shift",
            "Name": get("shiftName", "shift_name", "shift_type") || "Regular",
            "Paid": get("paid", "paid_status", "isPaid") ? "Yes" : "",
            "Scheduled Start Time": fmtTime(get("scheduledStartTime", "shift_start_time", "shift_start")),
            "Scheduled End Time": fmtTime(get("scheduledEndTime", "shift_end_time", "shift_end")),
            "Punch in location": isLeaveRow ? "" : normalizeString(get("punchInLocation", "check_in_location", "location_in", "location")),
            "Punch out location": isLeaveRow ? "" : normalizeString(get("punchOutLocation", "check_out_location", "location_out")),
          };

          // If locations are objects/JSON strings, stringify gracefully
          const locIn = row["Punch in location"];
          if (locIn && typeof locIn === "object") {
            row["Punch in location"] = JSON.stringify(locIn);
          }
          const locOut = row["Punch out location"];
          if (locOut && typeof locOut === "object") {
            row["Punch out location"] = JSON.stringify(locOut);
          }

          return row;
        });

        const summaryRows = buildAttendanceSummaryRows(dataToExport);

        if (attendanceReportType === "summary" && format !== "xlsx") {
          exportRows(
            summaryRows,
            "Attendance Summary Report",
            "attendance-summary-report",
            format
          );
          return;
        }

        if (attendanceReportType === "detail" && format !== "xlsx") {
          exportRows(
            rows,
            "Attendance Detail Report",
            "attendance-detail-report",
            format
          );
          return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

        if (attendanceReportType === "summary") {
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
          XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Attendance");
        } else {
          XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Attendance");
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
        }

        const getAux = (item: any, ...keys: string[]) => {
          for (const k of keys) {
            if (item?.[k] !== undefined && item?.[k] !== null) return item[k];
          }
          return "";
        };

        const matchesCommonFilters = (item: any) => {
          if (filters.employee && filters.employee !== "all" && getEmployeeFilterValue(item) !== filters.employee) {
            return false;
          }

          if (
            filters.department &&
            filters.department !== "all" &&
            !matchesSelectedDepartment(item)
          ) {
            return false;
          }

          return true;
        };

        const matchesDateFilter = (item: any, ...dateKeys: string[]) => {
          if (!filters.month && !filters.day) return true;

          const dates = dateKeys
            .map((key) => String(getAux(item, key) || "").slice(0, 10))
            .filter(Boolean);

          if (filters.day) return dates.some((date) => date === filters.day);
          if (filters.month) return dates.some((date) => date.slice(0, 7) === filters.month);
          return true;
        };

        const leaveExportRows = attendanceLeaveRows
          .filter((item: any) => matchesCommonFilters(item))
          .filter((item: any) => matchesDateFilter(item, "leaveFromDate", "leaveToDate"))
          .map((item: any) => ({
            "Application ID": getAux(item, "leaveApplicationId"),
            "Employee ID": getAux(item, "employeeCode", "employee_id", "employeeId"),
            "Employee Name": getAux(item, "employeeName", "employee_name", "employee_name"),
            "Phone Number": getAux(item, "phoneNumber", "mobile", "phone"),
            "Branch": getAux(item, "branch", "branch_name"),
            "Department": getAux(item, "department", "department_name"),
            "Designation": getAux(item, "designation", "designation_name"),
            "Leave Type": getAux(item, "leaveType", "leave_type_name"),
            "From Date": fmtDate(getAux(item, "leaveFromDate", "from_date")),
            "To Date": fmtDate(getAux(item, "leaveToDate", "to_date")),
            "Days": getAux(item, "leaveDays", "days"),
            "Status": getAux(item, "leaveStatus", "status"),
            "Reason": getAux(item, "leaveReason", "reason"),
            "Remarks": getAux(item, "leaveRemarks", "remarks"),
          }));

        const permissionExportRows = attendancePermissionRows
          .filter((item: any) => matchesCommonFilters(item))
          .filter((item: any) => matchesDateFilter(item, "permissionDate"))
          .map((item: any) => ({
            "Permission ID": getAux(item, "permissionApplicationId"),
            "Employee ID": getAux(item, "employeeCode", "employee_id", "employeeId"),
            "Employee Name": getAux(item, "employeeName", "employee_name", "employee_name"),
            "Phone Number": getAux(item, "phoneNumber", "mobile", "phone"),
            "Branch": getAux(item, "branch", "branch_name"),
            "Department": getAux(item, "department", "department_name"),
            "Designation": getAux(item, "designation", "designation_name"),
            "Date": fmtDate(getAux(item, "permissionDate", "permission_date")),
            "From": fmtTime(getAux(item, "permissionFromTime", "permission_time_from")),
            "To": fmtTime(getAux(item, "permissionToTime", "permission_time_to")),
            "Duration": getAux(item, "permissionDuration", "permission_duration"),
            "Status": getAux(item, "permissionStatus", "status"),
            "Reason": getAux(item, "permissionReason", "reason"),
            "Remarks": getAux(item, "permissionRemarks", "remarks"),
          }));

        const leavesSheet = XLSX.utils.json_to_sheet(leaveExportRows.length ? leaveExportRows : [{ "No leave data": "" }]);
        XLSX.utils.book_append_sheet(workbook, leavesSheet, "Leaves");

        const permissionsSheet = XLSX.utils.json_to_sheet(
          permissionExportRows.length ? permissionExportRows : [{ "No permission data": "" }]
        );
        XLSX.utils.book_append_sheet(workbook, permissionsSheet, "Permissions");

        const fileName = `attendance-${attendanceReportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } else {
        const headers = Object.keys(dataToExport[0] || {});
        if (headers.length === 0) {
          toast.error('No data available to export');
          return;
        }

        const formattedHeaders = headers.map(header =>
          header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
        );

        const normalizedRows = dataToExport.map((item: any) => {
          const row: any = {};
          headers.forEach((header, index) => {
            let value = item[header];
            if (value && typeof value === 'object') {
              value = Array.isArray(value) ? value.join('; ') : JSON.stringify(value);
            }
            row[formattedHeaders[index]] = value ?? "";
          });
          return row;
        });

        if (format === "xlsx") {
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
          XLSX.utils.book_append_sheet(workbook, worksheet, reportTitles[reportType].slice(0, 31));
          XLSX.writeFile(
            workbook,
            `${reportTitles[reportType].toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`
          );
          return;
        }

        if (format === "pdf") {
          const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
          pdf.setFontSize(14);
          pdf.text(reportTitles[reportType], 40, 35);
          pdf.setFontSize(9);
          pdf.text(`Generated on: ${currentDate}`, 40, 52);

          const pageWidth = pdf.internal.pageSize.getWidth();
          const colWidth = Math.max(70, (pageWidth - 80) / formattedHeaders.length);
          let y = 75;
          pdf.setFontSize(7);
          formattedHeaders.forEach((header, index) => pdf.text(header.slice(0, 18), 40 + index * colWidth, y));
          y += 14;

          normalizedRows.slice(0, 45).forEach((row: any) => {
            if (y > 560) {
              pdf.addPage();
              y = 40;
            }
            formattedHeaders.forEach((header, index) => {
              pdf.text(String(row[header] ?? "").slice(0, 20), 40 + index * colWidth, y);
            });
            y += 12;
          });

          pdf.save(`${reportTitles[reportType].toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          return;
        }

        // Non-attendance CSV export
        let csvContent = '';
        csvContent += `"${reportTitles[reportType]}"\n`;
        csvContent += `"Generated on: ${currentDate}"\n\n`;

        csvContent += formattedHeaders.join(',') + '\n';

        dataToExport.forEach(item => {
          const values = headers.map(header => {
            let value = item[header];
            if (value && typeof value === 'object') {
              value = Array.isArray(value) ? value.join('; ') : JSON.stringify(value);
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
          });
          csvContent += values.join(',') + '\n';
        });

        const blob = new Blob(["\uFEFF" + csvContent], {
          type: 'text/csv;charset=utf-8;'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download',
          `${reportTitles[reportType].toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch report data based on report type
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      const errors: string[] = [];
      const reportParams = buildReportParams();

      if (reportType === "attendance") {
        try {
          const response = await reportService.getAttendanceReport(reportParams);
          const attendanceResult = response?.data?.data;

          // Be defensive about backend shape: accept trend, rows, data, logs, or direct array
          const trend =
            (attendanceResult?.trend && Array.isArray(attendanceResult.trend) ? attendanceResult.trend : null) ||
            (attendanceResult?.rows && Array.isArray(attendanceResult.rows) ? attendanceResult.rows : null) ||
            (attendanceResult?.data && Array.isArray(attendanceResult.data) ? attendanceResult.data : null) ||
            (attendanceResult?.logs && Array.isArray(attendanceResult.logs) ? attendanceResult.logs : null) ||
            (Array.isArray(attendanceResult) ? attendanceResult : null);

          const summary =
            attendanceResult?.summary ||
            attendanceResult?.stats ||
            null;

          let reportLeaveRows = Array.isArray(attendanceResult?.leaveRows) ? attendanceResult.leaveRows : [];
          let reportPermissionRows = Array.isArray(attendanceResult?.permissionRows) ? attendanceResult.permissionRows : [];

          if (reportLeaveRows.length === 0) {
            try {
              const leaveResponse = await ENDPOINTS.getleaveapplications();
              const rawLeaves =
                (Array.isArray(leaveResponse?.data?.applications) && leaveResponse.data.applications) ||
                (Array.isArray(leaveResponse?.data?.leaveApplications) && leaveResponse.data.leaveApplications) ||
                (Array.isArray(leaveResponse?.data) && leaveResponse.data) ||
                [];

              reportLeaveRows = rawLeaves.map((leave: any) => ({
                leaveApplicationId: leave.application_id || leave.leaveApplicationId || leave.id,
                employeePkId: leave.employee_id || leave.employeeId,
                employeeCode: leave.employee_code || leave.employeeCode || leave.employee_id || leave.employeeId,
                employeeName: leave.employee_name || leave.employeeName,
                phoneNumber: leave.phoneNumber || leave.mobile || leave.phone,
                branch: leave.branch || leave.branch_name,
                department: leave.department || leave.department_name,
                designation: leave.designation || leave.designation_name,
                leaveType: leave.leave_type_name || leave.leaveType || leave.leave_type,
                leaveFromDate: leave.from_date || leave.fromDate,
                leaveToDate: leave.to_date || leave.toDate,
                leaveDays: leave.days,
                leaveStatus: leave.status,
                leaveReason: leave.reason,
                leaveRemarks: leave.remarks,
              }));
            } catch (leaveErr) {
              console.warn("Attendance export leave fallback failed:", leaveErr);
            }
          }

          if (reportPermissionRows.length === 0) {
            try {
              const permissionResponse = await ENDPOINTS.getLeavePermissionApplications();
              const rawPermissions =
                (Array.isArray(permissionResponse?.data?.applications) && permissionResponse.data.applications) ||
                (Array.isArray(permissionResponse?.data?.permissions) && permissionResponse.data.permissions) ||
                (Array.isArray(permissionResponse?.data) && permissionResponse.data) ||
                [];

              reportPermissionRows = rawPermissions.map((permission: any) => ({
                permissionApplicationId: permission.permission_id || permission.permissionApplicationId || permission.id,
                employeePkId: permission.employee_id || permission.employeeId,
                employeeCode: permission.employee_code || permission.employeeCode || permission.employee_id || permission.employeeId,
                employeeName: permission.employee_name || permission.employeeName,
                phoneNumber: permission.phoneNumber || permission.mobile || permission.phone,
                branch: permission.branch || permission.branch_name,
                department: permission.department || permission.department_name,
                designation: permission.designation || permission.designation_name,
                permissionDate: permission.permission_date || permission.permissionDate,
                permissionFromTime: permission.permission_time_from || permission.permissionFromTime,
                permissionToTime: permission.permission_time_to || permission.permissionToTime,
                permissionDuration: permission.permissionDuration,
                permissionStatus: permission.status,
                permissionReason: permission.reason,
                permissionRemarks: permission.remarks,
              }));
            } catch (permissionErr) {
              console.warn("Attendance export permission fallback failed:", permissionErr);
            }
          }

          setAttendanceData(trend || []);
          setAttendanceRows(attendanceResult?.rows || []);
          setFilteredAttendanceRows(attendanceResult?.rows || []);
          setAttendanceLeaveRows(reportLeaveRows);
          setAttendancePermissionRows(reportPermissionRows);
          setAttendanceSummary(summary || {});
          console.log("Attendance report payload:", attendanceResult);
          console.log("Attendance trend used for export:", trend);
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Attendance report failed");
          console.error("Attendance report fetch error:", err);
        }
      }

      if (reportType === "leave" || reportType === "finance") {
        try {
          const response = await reportService.getLeaveReport(reportParams);
          const leaveResult = response?.data?.data;
          const normalizedLeaves = (leaveResult?.distribution || []).map((l) => ({
            name: l.name,
            value: l.value,
            fill: l.fill || "#f43f5e",
          }));
          setLeaveData(normalizedLeaves);
          setLeaveRows(leaveResult?.rows || []);
          setLeaveSummary(leaveResult?.stats || {});
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Leave report failed");
          console.error("Leave report fetch error:", err);
        }
      }

      if (reportType === "payroll" || reportType === "finance") {
        try {
          const response = await reportService.getPayrollReport(reportParams);
          const payrollResult = response?.data?.data ?? response?.data;
          if (payrollResult?.trend) {
            setPayrollData(payrollResult.trend);
          } else if (Array.isArray(payrollResult)) {
            setPayrollData(payrollResult);
          }
          if (payrollResult?.summary) {
            setPayrollSummary({
              totalEmployees: payrollResult.summary.totalEmployees,
              avgSalary: payrollResult.summary.avgSalary,
              totalPayroll: payrollResult.summary.totalPayroll,
              ytdAmount: payrollResult.summary.ytdAmount
            });
          }
          setPayrollRows(payrollResult?.rows || []);
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Payroll report failed");
          console.error("Payroll report fetch error:", err);
        }
      }

      if (reportType === "finance") {
        try {
          const response = await reportService.getExpenseReport(reportParams);
          const expenseResult = response?.data?.data;
          setExpenseData(expenseResult?.summary || []);
          setExpenseRows(expenseResult?.rows || []);
          setExpenseStats(expenseResult?.stats || {});
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Expense report failed");
          console.error("Expense report fetch error:", err);
        }
      }

      if (errors.length > 0) {
        setError(errors[0]);
      }

      setLoading(false);
    };

    fetchReportData();
  }, [reportType, filters]);

  const getPageTitle = (): string => {
    switch (reportType) {
      case "attendance":
        return "Attendance Reports";
      case "leave":
        return "Leave Reports";
      case "payroll":
        return "Payroll Reports";
      case "finance":
        return "Finance Reports";
      default:
        return "Reports & Analytics";
    }
  };

  const getPageDescription = (): string => {
    switch (reportType) {
      case "attendance":
        return "Employee attendance and punctuality tracking";
      case "leave":
        return "Leave utilization and approval analytics";
      case "payroll":
        return "Payroll processing and salary analysis";
      case "finance":
        return "Financial analysis and expense tracking";
      default:
        return "Comprehensive HR insights and analytics";
    }
  };

  const getExportLabel = (format: "csv" | "xlsx" | "pdf") => {
    const formatLabel = format === "xlsx" ? "Excel" : format.toUpperCase();
    if (reportType !== "attendance") {
      return format === "csv" ? "Export CSV" : formatLabel;
    }

    return `${attendanceReportType === "summary" ? "Export Summary" : "Export Detail"} ${formatLabel}`;
  };

  const formatCurrency = (value: any) => {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const ReportTable = ({ title, rows, columns }: any) => (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-4 border-b border-slate-200">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{rows.length} record{rows.length === 1 ? "" : "s"} found</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No report data found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {columns.map((column: any) => (
                    <th key={column.key} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, index: number) => (
                  <tr key={row.id || index} className="border-t border-slate-100">
                    {columns.map((column: any) => (
                      <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                        {column.render ? column.render(row) : (row[column.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const leaveColumns = [
    { key: "employeeCode", label: "Employee Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "department", label: "Department" },
    { key: "leaveType", label: "Leave Type" },
    { key: "leaveDays", label: "Leave Days" },
    { key: "dates", label: "Leave Dates", render: (row: any) => `${row.fromDate || "-"} to ${row.toDate || "-"}` },
    { key: "reason", label: "Details", render: (row: any) => row.reason || row.remarks || "-" },
    { key: "status", label: "Status" },
  ];

  const expenseColumns = [
    { key: "employeeCode", label: "Employee Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "department", label: "Department" },
    { key: "expenseAmount", label: "Expense Amount", render: (row: any) => formatCurrency(row.expenseAmount) },
    { key: "category", label: "Category" },
    { key: "expenseDetails", label: "Details" },
    { key: "expenseDate", label: "Expense Date" },
    { key: "status", label: "Status" },
  ];

  const payrollColumns = [
    { key: "employeeCode", label: "Employee Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "department", label: "Department" },
    { key: "month", label: "Payroll Month" },
    { key: "basicSalary", label: "Basic", render: (row: any) => formatCurrency(row.basicSalary) },
    { key: "grossAmount", label: "Gross", render: (row: any) => formatCurrency(row.grossAmount) },
    { key: "totalDays", label: "Total Days" },
    { key: "presentDays", label: "Present Days" },
    { key: "absentDays", label: "Absent Days" },
    { key: "approvedLeaveDays", label: "Leave Days" },
    { key: "payableDays", label: "Payable Days" },
    { key: "lopDays", label: "LOP Days" },
    { key: "lopAmount", label: "LOP Amount", render: (row: any) => formatCurrency(row.lopAmount) },
    { key: "pf", label: "PF", render: (row: any) => formatCurrency(row.pf) },
    { key: "esi", label: "ESI", render: (row: any) => formatCurrency(row.esi) },
    { key: "pt", label: "PT", render: (row: any) => formatCurrency(row.pt) },
    { key: "tdsAmount", label: "TDS", render: (row: any) => formatCurrency(row.tdsAmount || row.tds) },
    { key: "otherDeductions", label: "Other Deductions", render: (row: any) => formatCurrency(row.otherDeductions) },
    { key: "deductions", label: "Total Deductions", render: (row: any) => formatCurrency(row.deductions) },
    { key: "netPay", label: "Net Pay", render: (row: any) => formatCurrency(row.netPay ?? row.payrollAmount) },
    { key: "details", label: "Processed Payroll Details", render: (row: any) => `HRA ${formatCurrency(row.hra)} | Allowances ${formatCurrency(row.allowances)} | Incentives ${formatCurrency(row.incentives)}` },
    { key: "payrollDate", label: "Payroll Date" },
    { key: "status", label: "Status" },
  ];

  // Add filter controls component
  const FilterControls = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV("csv")}
              disabled={loading}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <Download className="h-4 w-4" />
              {getExportLabel("csv")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV("xlsx")}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              {getExportLabel("xlsx")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV("pdf")}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              {getExportLabel("pdf")}
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportType === "attendance" && (
              <div className="space-y-2">
                <Label htmlFor="mode">Report View</Label>
                <Select
                  value={filters.mode}
                  onValueChange={(value) => handleFilterChange('mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month-wise</SelectItem>
                    <SelectItem value="day">Day-wise</SelectItem>
                    <SelectItem value="range">Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "attendance" && (
              <div className="space-y-2">
                <Label htmlFor="attendanceReportType">Report Type</Label>
                <Select
                  value={attendanceReportType}
                  onValueChange={(value: "summary" | "detail") => setAttendanceReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detail">Detail Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(reportType !== "attendance" || filters.mode === 'month') && (
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {reportType === "attendance" && filters.mode === 'day' && (
              <div className="space-y-2">
                <Label htmlFor="day">Date</Label>
                <Input
                  id="day"
                  type="date"
                  value={filters.day}
                  onChange={(e) => handleFilterChange('day', e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {reportType === "attendance" && filters.mode === 'range' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">From Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">To Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {reportType === "attendance" && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="permission">Permission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={filters.employee}
                onValueChange={(value) => handleFilterChange('employee', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees
                    .map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filters.month || filters.day || filters.startDate || filters.endDate || filters.employee !== 'all' || filters.department !== 'all' || (reportType === "attendance" && filters.status !== 'all')) && (
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6" ref={reportRef}>
        <FilterControls />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground mt-2">{getPageDescription()}</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading report data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 font-medium">Error:</div>
              <div className="ml-2 text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Report Content - Only show when not loading */}
        {!loading && !error && (
          <>
            {/* Attendance Reports */}
            {reportType === "attendance" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Attendance Trend</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Monthly attendance metrics and patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={attendanceData} margin={{ top: 15, right: 40, left: 0, bottom: 10 }}>
                        <defs>
                          <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #0ea5e9",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                          formatter={(value) => [`${value}`, ""]}
                        />
                        <Line
                          type="natural"
                          dataKey="present"
                          stroke="#06b6d4"
                          strokeWidth={4}
                          dot={{ fill: "#06b6d4", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Present"
                          isAnimationActive
                        />
                        <Line
                          type="natural"
                          dataKey="absent"
                          stroke="#f43f5e"
                          strokeWidth={4}
                          dot={{ fill: "#f43f5e", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Absent"
                          isAnimationActive
                        />
                        <Line
                          type="natural"
                          dataKey="half"
                          stroke="#eab308"
                          strokeWidth={4}
                          dot={{ fill: "#eab308", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Half Day"
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Employees",
                          value: attendanceSummary?.totalEmployees ?? 0,
                          gradient: "from-purple-500 via-purple-600 to-purple-700",
                          icon: "👥",
                          tooltip: "Total number of employees in the system"
                        },
                        {
                          label: "Avg Attendance",
                          value: attendanceSummary?.avgAttendance ?? "0%",
                          gradient: "from-green-500 via-green-600 to-green-700",
                          icon: "✅",
                          tooltip: "Average attendance rate across all employees"
                        },
                        {
                          label: (filters.month || filters.day) ? "Present" : "Present Today",
                          value: attendanceSummary?.presentToday ?? 0,
                          gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
                          icon: "📍",
                          tooltip: (filters.month || filters.day) ? "Employees present in selected period" : "Employees present today"
                        },
                        {
                          label: (filters.month || filters.day) ? "Absent" : "On Leave",
                          value: attendanceSummary?.onLeave ?? 0,
                          gradient: "from-cyan-500 via-cyan-600 to-cyan-700",
                          icon: "🏖️",
                          tooltip: (filters.month || filters.day) ? "Employees absent in selected period" : "Employees on leave today"
                        },
                      ].map((item: any) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider flex items-center gap-1">
                              {item.label}
                              {item.tooltip && (
                                <span className="cursor-help" title={item.tooltip}>ℹ️</span>
                              )}
                            </div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <ReportTable title="Leave Report Details" rows={leaveRows} columns={leaveColumns} />
              </div>
            )}

            {/* Leave Reports */}
            {reportType === "leave" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-rose-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent">Leave Distribution</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Leave utilization analysis by leave type</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart margin={{ top: 15, right: 30, left: 0, bottom: 15 }}>
                        <Pie
                          data={Array.isArray(leaveData) && leaveData.length > 0 ? leaveData : [
                            { name: "Casual Leave", value: 45, fill: "#22c55e" },
                            { name: "Sick Leave", value: 28, fill: "#f59e0b" },
                            { name: "Earned Leave", value: 32, fill: "#3b82f6" },
                            { name: "Maternity Leave", value: 12, fill: "#ec4899" },
                            { name: "Paternity Leave", value: 8, fill: "#8b5cf6" }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={renderLeaveLabel}
                          outerRadius={110}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive
                        >
                          {(Array.isArray(leaveData) && leaveData.length > 0 ? leaveData : [
                            { name: "Casual Leave", value: 45, fill: "#22c55e" },
                            { name: "Sick Leave", value: 28, fill: "#f59e0b" },
                            { name: "Earned Leave", value: 32, fill: "#3b82f6" },
                            { name: "Maternity Leave", value: 12, fill: "#ec4899" },
                            { name: "Paternity Leave", value: 8, fill: "#8b5cf6" }
                          ]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={2} stroke="#fff" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #f43f5e",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                            color: "hsl(var(--foreground))",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Leave Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Employees", value: (leaveSummary?.totalEmployees ?? 0) > 0 ? leaveSummary?.totalEmployees : 125, gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Approved Leaves", value: (leaveSummary?.approvedLeaves ?? 0) > 0 ? leaveSummary?.approvedLeaves : 42, gradient: "from-green-500 via-green-600 to-green-700", icon: "✅" },
                        { label: "Pending Requests", value: (leaveSummary?.pendingRequests ?? 0) > 0 ? leaveSummary?.pendingRequests : 8, gradient: "from-orange-500 via-orange-600 to-orange-700", icon: "⏳" },
                        { label: "Avg Days Used", value: (leaveSummary?.avgDaysUsed ?? 0) > 0 ? leaveSummary?.avgDaysUsed : 6.5, gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "📅" },
                      ].map((item: any) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider flex items-center gap-1">
                              {item.label}
                              {item.tooltip && (
                                <span className="cursor-help" title={item.tooltip}>ℹ️</span>
                              )}
                            </div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <ReportTable title="Payroll Report Details" rows={payrollRows} columns={payrollColumns} />
              </div>
            )}

            {/* Payroll Reports */}
            {reportType === "payroll" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-teal-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">Payroll Trend</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Monthly payroll disbursement trends and patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={payrollData} margin={{ top: 15, right: 40, left: 0, bottom: 10 }}>
                        <defs>
                          <linearGradient id="payrollGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #14b8a6",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                          formatter={(value) => [`₹${value}K`, ""]}
                        />
                        <Line
                          type="natural"
                          dataKey="amount"
                          stroke="#0d9488"
                          strokeWidth={4}
                          dot={{ fill: "#0d9488", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Payroll Amount"
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Payroll Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Employees", value: payrollSummary.totalEmployees?.toString() || "0", gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Avg Salary", value: payrollSummary.avgSalary || "₹0", gradient: "from-indigo-500 via-indigo-600 to-indigo-700", icon: "💰" },
                        { label: "Total Payroll", value: payrollSummary.totalPayroll || "₹0", gradient: "from-green-500 via-green-600 to-green-700", icon: "📊" },
                        { label: "YTD Amount", value: payrollSummary.ytdAmount || "₹0", gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "📈" },
                      ].map((item: any) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider flex items-center gap-1">
                              {item.label}
                              {item.tooltip && (
                                <span className="cursor-help" title={item.tooltip}>ℹ️</span>
                              )}
                            </div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Finance Reports - Tabbed View */}
            {reportType === "finance" && (
              <div className="space-y-6">

                {/* Expense Summary by Category */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      Expense Summary by Category
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">
                      Breakdown of expenses across different categories
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {expenseData?.length === 0 ? (
                      <div className="text-center text-muted-foreground py-20">
                        No expense data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart
                          data={expenseData}
                          margin={{ top: 15, right: 40, left: 0, bottom: 40 }}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="category"
                            stroke="#94a3b8"
                            fontSize={12}
                            fontWeight={500}
                            angle={-15}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />

                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.95)",
                              border: "2px solid #a855f7",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                              padding: "12px 16px",
                            }}
                            labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                          />

                          <Bar
                            dataKey="amount"
                            fill="url(#barGradient)"
                            radius={[12, 12, 4, 4]}
                            isAnimationActive
                            animationDuration={600}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Expense Statistics */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      Expense Statistics
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Total Claims",
                          value: expenseStats?.totalClaims ?? 0,
                          gradient: "from-blue-500 via-blue-600 to-blue-700",
                          icon: "📋",
                        },
                        {
                          label: "Total Amount",
                          value: expenseStats?.totalAmount ?? "₹0",
                          gradient: "from-orange-500 via-orange-600 to-orange-700",
                          icon: "💵",
                        },
                        {
                          label: "Pending Approval",
                          value: expenseStats?.pendingApproval ?? "₹0",
                          gradient: "from-pink-500 via-pink-600 to-pink-700",
                          icon: "⏳",
                        },
                      ].map((item) => (
                        <Card
                          key={item.label}
                          className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}
                        >
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">
                              {item.label}
                            </div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">
                              {item.value}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <ReportTable title="Expense Report Details" rows={expenseRows} columns={expenseColumns} />

              </div>
            )}

          </>
        )}
      </div>
    </Layout>
  );
}
