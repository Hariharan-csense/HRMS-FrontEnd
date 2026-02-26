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
import reportService from "@/components/helper/roles/report/report";
import { PdfExportService } from "@/services/pdfExportService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportsAnalytics() {
  const location = useLocation();

  // State for report data
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employee: 'all',
    department: 'all'
  });
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs for PDF export
  const reportRef = useRef(null);

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
    department: string;
  }

  // State for summary data
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({});
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch employees and departments for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Replace with actual API calls to fetch employees and departments
        const mockEmployees = [
          { id: 'all', name: 'All Employees' },
          { id: '1', name: 'John Doe', department: 'Sales' },
          { id: '2', name: 'Jane Smith', department: 'Marketing' },
          { id: '3', name: 'Bob Johnson', department: 'Engineering' },
        ];
        
        const uniqueDepartments = [...new Set(mockEmployees.map(e => e.department))];
        const departmentOptions = ['all', ...uniqueDepartments].map(dept => ({
          id: dept.toLowerCase(),
          name: dept === 'all' ? 'All Departments' : dept
        }));
        
        setEmployees(mockEmployees);
        setDepartments(departmentOptions);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  // Apply filters to attendance data
  useEffect(() => {
    if (attendanceData.length > 0) {
      let filtered = [...attendanceData];
      
      // Apply date filter
      if (filters.startDate) {
        filtered = filtered.filter(item => 
          new Date(item.date) >= new Date(filters.startDate)
        );
      }
      
      if (filters.endDate) {
        filtered = filtered.filter(item => 
          new Date(item.date) <= new Date(filters.endDate)
        );
      }
      
      setFilteredAttendanceData(filtered);
    }
  }, [filters, attendanceData]);
  
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
      startDate: '',
      endDate: '',
      employee: 'all',
      department: 'all'
    });
  };
  
  // Export to PDF
// Update the exportToPDF function to export raw data
const exportToCSV = () => {
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
    switch(reportType) {
      case 'attendance':
        dataToExport = filteredAttendanceData.length > 0 ? filteredAttendanceData : attendanceData;
        break;
      case 'leave':
        dataToExport = leaveData;
        break;
      case 'payroll':
        dataToExport = payrollData;
        break;
      case 'finance':
        dataToExport = expenseData;
        break;
      default:
        dataToExport = [];
    }
    
    if (!dataToExport || dataToExport.length === 0) {
      setError('No data available to export');
      return;
    }

    // Start building CSV content
    let csvContent = '';
    
    // Add report header
    csvContent += `"${reportTitles[reportType]}"\n`;
    csvContent += `"Generated on: ${currentDate}"\n\n`;
    
    // Get headers from the first item
    const headers = Object.keys(dataToExport[0] || {});
    if (headers.length === 0) {
      setError('No data available to export');
      return;
    }
    
    // Format headers to be more readable
    const formattedHeaders = headers.map(header => 
      header
        .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
        .replace(/^./, str => str.toUpperCase())  // Capitalize first letter
        .trim()
    );
    
    // Add filtered by information if applicable
    if (filters && (filters.startDate || filters.endDate || filters.employee || filters.department)) {
      csvContent += '"Filters Applied:"\n';
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start';
        const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End';
        csvContent += `"Date Range: ${start} to ${end}"\n`;
      }
      if (filters.employee) {
        csvContent += `"Employee: ${filters.employee}"\n`;
      }
      if (filters.department) {
        csvContent += `"Department: ${filters.department}"\n`;
      }
      csvContent += '\n';
    }
    
    // Add headers
    csvContent += formattedHeaders.join(',') + '\n';
    
    // Add data rows
    dataToExport.forEach(item => {
      const values = headers.map(header => {
        let value = item[header];
        
        // Format dates
        if (header.toLowerCase().includes('date') && value) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              value = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
              });
            }
          } catch (e) {
            // If date parsing fails, keep original value
          }
        }
        
        // Format currency
   // Format currency
if ((header.toLowerCase().includes('amount') || 
     header.toLowerCase().includes('salary') || 
     header.toLowerCase().includes('total')) && 
    typeof value === 'number') {
  value = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,  // Changed from 2 to 0 to remove decimal places
    maximumFractionDigits: 0   // Changed from 2 to 0 to remove decimal places
  }).format(value);
}
        
        // Handle nested objects and arrays
        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            value = value.join('; ');
          } else {
            value = Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ');
          }
        }
        
        // Escape quotes and wrap in quotes
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });

    // Add summary/footer
    csvContent += `\n"Total Records: ${dataToExport.length}"\n`;
    csvContent += `"Generated by HRMS on ${currentDate}"\n`;

    // Create download link
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
    
  } catch (error) {
    console.error('Error exporting data:', error);
    setError('Failed to export data. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Determine report type from URL - synchronous, no state needed
  const getReportType = (pathname: string): "attendance" | "leave" | "payroll" | "finance" | "analytics" => {
    if (pathname.startsWith("/reports/finance")) return "finance";
    if (pathname.startsWith("/reports/payroll")) return "payroll";
    if (pathname.startsWith("/reports/leave")) return "leave";
    if (pathname.startsWith("/reports/attendance")) return "attendance";
    return "analytics";
  };

  const reportType = getReportType(location.pathname);

  // Fetch report data based on report type
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      const errors: string[] = [];

      if (reportType === "attendance") {
        try {
          const response = await reportService.getAttendanceReport();
          const attendanceResult = response?.data?.data;
          setAttendanceData(attendanceResult?.trend || []);
          setAttendanceSummary(attendanceResult?.summary || {});
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Attendance report failed");
          console.error("Attendance report fetch error:", err);
        }
      }

      if (reportType === "finance") {
        try {
          const response = await reportService.getExpenseReport();
          const expenseResult = response?.data?.data;
          setExpenseData(expenseResult?.summary || []);
          setExpenseStats(expenseResult?.stats || {});
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Expense report failed");
          console.error("Expense report fetch error:", err);
        }
      }

      if (reportType === "leave" || reportType === "finance") {
        try {
          const response = await reportService.getLeaveReport();
          const leaveResult = response?.data?.data;
          const normalizedLeaves = (leaveResult?.distribution || []).map((l) => ({
            name: l.name,
            value: l.value,
            fill: l.fill || "#f43f5e",
          }));
          setLeaveData(normalizedLeaves);
          setLeaveSummary(leaveResult?.stats || {});
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Leave report failed");
          console.error("Leave report fetch error:", err);
        }
      }

      if (reportType === "payroll" || reportType === "finance") {
        try {
          const response = await reportService.getPayrollReport();
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
        } catch (err: any) {
          errors.push(err?.response?.data?.message || err?.message || "Payroll report failed");
          console.error("Payroll report fetch error:", err);
        }
      }

      if (reportType === "finance") {
        try {
          const response = await reportService.getExpenseReport();
          const expenseResult = response?.data?.data;
          setExpenseData(expenseResult?.summary || []);
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
  }, [reportType]);

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
              onClick={exportToCSV}
              disabled={loading}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate}
                className="w-full"
              />
            </div>
            
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
                  {departments.map((dept) => (
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
                disabled={filters.department === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(
                      (emp) =>
                        filters.department === 'all' ||
                        emp.department?.toLowerCase() === filters.department ||
                        emp.id === 'all'
                    )
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(filters.startDate || filters.endDate || filters.employee !== 'all' || filters.department !== 'all') && (
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
                      <LineChart data={filteredAttendanceData.length ? filteredAttendanceData : attendanceData} margin={{ top: 15, right: 40, left: 0, bottom: 10 }}>
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
                          label: filters.startDate || filters.endDate ? "Present" : "Present Today", 
                          value: attendanceSummary?.presentToday ?? 0, 
                          gradient: "from-indigo-500 via-indigo-600 to-indigo-700", 
                          icon: "📍",
                          tooltip: filters.startDate || filters.endDate ? "Employees present in selected date range" : "Employees present today"
                        },
                        { 
                          label: filters.startDate || filters.endDate ? "Absent" : "On Leave", 
                          value: attendanceSummary?.onLeave ?? 0, 
                          gradient: "from-cyan-500 via-cyan-600 to-cyan-700", 
                          icon: "🏖️",
                          tooltip: filters.startDate || filters.endDate ? "Employees absent in selected date range" : "Employees on leave today"
                        },
                      ].map((item) => (
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
                          data={Array.isArray(leaveData) ? leaveData : []}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={110}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive
                        >
                          {Array.isArray(leaveData) && leaveData.map((entry, index) => (
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
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
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
                        { label: "Total Employees", value: leaveSummary?.totalEmployees ?? 0, gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Approved Leaves", value: leaveSummary?.approvedLeaves ?? 0, gradient: "from-green-500 via-green-600 to-green-700", icon: "✅" },
                        { label: "Pending Requests", value: leaveSummary?.pendingRequests ?? 0, gradient: "from-orange-500 via-orange-600 to-orange-700", icon: "⏳" },
                        { label: "Avg Days Used", value: leaveSummary?.avgDaysUsed ?? 0, gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "📅" },
                      ].map((item) => (
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
                      ].map((item) => (
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

              </div>
            )}

          </>
        )}
      </div>
    </Layout>
  );
}
