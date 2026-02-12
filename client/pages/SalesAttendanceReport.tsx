import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Filter,
  Download,
  Building,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { salesAttendanceApi, type SalesAttendanceData, type SalesEmployeeComparison, type SalesEmployeeDetail } from "@/components/helper/salesAttendance/salesAttendance";

const COLORS = {
  'Client-Focused': '#10b981',
  'Mixed (Client-Heavy)': '#3b82f6',
  'Mixed (Office-Heavy)': '#f59e0b',
  'Office-Focused': '#ef4444',
  'No Attendance': '#6b7280'
};

export default function SalesAttendanceReport() {
  const [attendanceData, setAttendanceData] = useState<SalesAttendanceData | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<SalesEmployeeComparison | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<SalesEmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Load data on component mount and when date range changes
  useEffect(() => {
    loadAttendanceData();
  }, [startDate, endDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const result = await salesAttendanceApi.getComparison({ startDate, endDate });
      if (result.success) {
        setAttendanceData(result.data);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployeeDetail = async (employee: SalesEmployeeComparison) => {
    setSelectedEmployee(employee);
    setDetailLoading(true);
    setIsDetailDialogOpen(true);
    
    try {
      // Extract employee ID from employee_id string (assuming format like "EMP001")
      const employeeId = employee.employee_id;
      const result = await salesAttendanceApi.getEmployeeDetail(employeeId, { startDate, endDate });
      if (result.success) {
        setEmployeeDetail(result.data);
      }
    } catch (error) {
      console.error("Error loading employee detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getPatternColor = (pattern: string) => {
    return COLORS[pattern as keyof typeof COLORS] || '#6b7280';
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'Client-Focused':
        return <MapPin className="w-4 h-4" />;
      case 'Office-Focused':
        return <Building className="w-4 h-4" />;
      case 'Mixed (Client-Heavy)':
        return <TrendingUp className="w-4 h-4" />;
      case 'Mixed (Office-Heavy)':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("Error formatting date-time string:", isoString, error);
      return 'Invalid Date';
    }
  };

  // Prepare chart data
  const patternChartData = (attendanceData?.employee_comparison || []).reduce((acc, emp) => {
    const existing = acc.find(item => item.pattern === emp.attendance_pattern);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ pattern: emp.attendance_pattern, count: 1 });
    }
    return acc;
  }, [] as { pattern: string; count: number }[]);

  const attendanceComparisonData = (attendanceData?.employee_comparison || []).map(emp => ({
    name: emp.employee_name?.split(' ')[0] || 'Unknown', // First name only with fallback
    regular: emp.regular_attendance_days || 0,
    client: emp.client_attendance_days || 0,
    percentage: emp.client_attendance_percentage || 0
  }));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading sales attendance report...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Sales Attendance Analysis
          </h1>
          <p className="text-muted-foreground mt-2">Compare regular attendance vs client attendance for sales team</p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">From:</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">To:</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <Button onClick={loadAttendanceData} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Department Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceData?.department_summary?.total_sales_employees ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total Sales Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceData?.department_summary?.total_client_visits ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total Client Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attendanceData?.department_summary?.total_client_hours ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total Client Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attendanceData?.department_summary?.average_client_attendance_percentage ?? 0}%</p>
                    <p className="text-sm text-muted-foreground">Avg Client Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Pattern Distribution</CardTitle>
              <CardDescription>How sales team members split their time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patternChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ pattern, count }) => `${pattern}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {patternChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPatternColor(entry.pattern)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Comparison</CardTitle>
              <CardDescription>Regular vs Client attendance days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regular" fill="#3b82f6" name="Regular Days" />
                  <Bar dataKey="client" fill="#10b981" name="Client Days" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance Details</CardTitle>
            <CardDescription>Individual attendance patterns and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold">Total Days</th>
                    <th className="text-left px-4 py-3 font-semibold">Regular</th>
                    <th className="text-left px-4 py-3 font-semibold">Client</th>
                    <th className="text-left px-4 py-3 font-semibold">Client %</th>
                    <th className="text-left px-4 py-3 font-semibold">Pattern</th>
                    <th className="text-left px-4 py-3 font-semibold">Client Hours</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(attendanceData?.employee_comparison || []).map((employee) => (
                    <tr key={employee.employee_id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{employee.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.employee_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{employee.total_working_days}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-blue-600" />
                          {employee.regular_attendance_days}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-green-600" />
                          {employee.client_attendance_days}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${employee.client_attendance_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{employee.client_attendance_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          style={{ borderColor: getPatternColor(employee.attendance_pattern), color: getPatternColor(employee.attendance_pattern) }}
                          className="flex items-center gap-1"
                        >
                          {getPatternIcon(employee.attendance_pattern)}
                          {employee.attendance_pattern}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{employee.total_client_hours}h</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewEmployeeDetail(employee)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Attendance Details</DialogTitle>
            <DialogDescription>
              Daily attendance breakdown for {selectedEmployee?.employee_name}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading employee details...</div>
            </div>
          ) : employeeDetail ? (
            <div className="space-y-6">
              {/* Employee Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-semibold">{employeeDetail.employee.employee_id}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-semibold">{employeeDetail.employee.department_name}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Client Visits</p>
                    <p className="font-semibold">{employeeDetail.daily_comparison.filter(d => d.client_visits && d.client_visits > 0).length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="font-semibold">{Math.round((employeeDetail.daily_comparison.reduce((sum, d) => sum + (d.total_minutes || 0), 0) / 60) * 100) / 100}h</p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {employeeDetail.daily_comparison.map((day) => (
                      <div key={day.date} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                            <Badge
                              variant="outline"
                              style={{ borderColor: getPatternColor(day.attendance_pattern), color: getPatternColor(day.attendance_pattern) }}
                              className="text-xs"
                            >
                              {day.attendance_pattern}
                            </Badge>
                          </div>
                          {day.client_visits && (
                            <span className="text-sm text-muted-foreground">{day.client_visits} client visits</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-3">
                          {day.regular_check_in && (
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3 text-blue-600" />
                              <span>Office: {formatDateTime(day.regular_check_in)} - {formatDateTime(day.regular_check_out) || 'Ongoing'}</span>
                            </div>
                          )}
                          {day.client_first_check_in && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-green-600" />
                              <span>Client: {formatDateTime(day.client_first_check_in)} - {formatDateTime(day.client_last_check_out) || 'Ongoing'}</span>
                            </div>
                          )}
                        </div>

                        {/* Client Attendance Details with Work Completed Notes */}
                        {day.client_attendance_details && day.client_attendance_details.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Client Visit Details:</p>
                            {day.client_attendance_details.map((detail, index) => (
                              <div key={index} className="bg-muted/30 rounded p-2 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                  <div>
                                    <span className="font-medium">Time: </span>
                                    {formatDateTime(detail.check_in_time)} - {formatDateTime(detail.check_out_time) || 'Ongoing'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Duration: </span>
                                    {detail.duration_minutes} minutes
                                  </div>
                                </div>
                                {detail.work_completed && (
                                  <div className="mt-2">
                                    <span className="font-medium text-green-700">Work Completed: </span>
                                    <span className="text-gray-700">{detail.work_completed}</span>
                                  </div>
                                )}
                                {detail.check_out_location && (
                                  <div className="mt-1">
                                    <span className="font-medium">Location: </span>
                                    {detail.check_out_location}
                                  </div>
                                )}
                                {detail.check_out_notes && (
                                  <div className="mt-1">
                                    <span className="font-medium">Notes: </span>
                                    {detail.check_out_notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
