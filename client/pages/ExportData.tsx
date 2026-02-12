import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Calendar, FileText, Users, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { leavePermissionApi, type LeavePermission } from "@/components/helper/leavePermission/leavePermission";
import { leaveTypeApi } from "@/components/helper/leave/leave";
import { employeeApi } from "@/components/helper/employee/employee";

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerName?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  employeeId: string;
  leaveType: string;
}

export default function ExportData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leave");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Data states
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [permissionApplications, setPermissionApplications] = useState<LeavePermission[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  // Filter states
  const [leaveFilters, setLeaveFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    employeeId: 'all',
    leaveType: 'all'
  });
  
  const [permissionFilters, setPermissionFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    employeeId: 'all',
    leaveType: 'all'
  });

  // Check if user has admin access
  const canAccessExport = () => {
    return hasRole(user, "admin") || hasRole(user, "hr");
  };

  // Load data functions
  const loadLeaveApplications = async () => {
    try {
      setLoading(true);
      const result = await leaveTypeApi.getLeaveApplications();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setLeaveApplications(result.data);
      }
    } catch (error: any) {
      console.error("Load Leave Applications Error:", error);
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionApplications = async () => {
    try {
      setLoading(true);
      const result = await leavePermissionApi.getLeavePermissionApplications();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setPermissionApplications(result.data);
      }
    } catch (error: any) {
      console.error("Load Permission Applications Error:", error);
      toast.error("Failed to load permission applications");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const result = await employeeApi.getEmployees();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if ((result as any).employees) {
        setEmployees((result as any).employees);
      } else if (result.data) {
        setEmployees(result.data);
      }
    } catch (error: any) {
      console.error("Load Employees Error:", error);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const result = await leaveTypeApi.getLeaveTypes();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setLeaveTypes(result.data);
      }
    } catch (error: any) {
      console.error("Load Leave Types Error:", error);
    }
  };

  useEffect(() => {
    if (canAccessExport()) {
      loadEmployees();
      loadLeaveTypes();
      if (activeTab === "leave") {
        loadLeaveApplications();
      } else {
        loadPermissionApplications();
      }
    }
  }, [activeTab]);

  // Filter functions
  const filteredLeaveApplications = leaveApplications.filter(app => {
    if (leaveFilters.dateFrom && new Date(app.fromDate) < new Date(leaveFilters.dateFrom)) return false;
    if (leaveFilters.dateTo && new Date(app.toDate) > new Date(leaveFilters.dateTo)) return false;
    if (leaveFilters.status !== 'all' && app.status !== leaveFilters.status) return false;
    if (leaveFilters.employeeId !== 'all' && app.employeeId !== leaveFilters.employeeId) return false;
    if (leaveFilters.leaveType !== 'all' && app.leaveType !== leaveFilters.leaveType) return false;
    return true;
  });

  const filteredPermissionApplications = permissionApplications.filter(app => {
    if (permissionFilters.dateFrom && new Date(app.permission_date) < new Date(permissionFilters.dateFrom)) return false;
    if (permissionFilters.dateTo && new Date(app.permission_date) > new Date(permissionFilters.dateTo)) return false;
    if (permissionFilters.status !== 'all' && app.status !== permissionFilters.status) return false;
    if (permissionFilters.employeeId !== 'all' && app.employee_id !== permissionFilters.employeeId) return false;
    return true;
  });

  // CSV export functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLeaveData = () => {
    setExporting(true);
    try {
      const headers = [
        'employeeName',
        'leaveType', 
        'fromDate',
        'toDate',
        'days',
        'reason',
        'status',
        'reportingManagerName',
        'createdAt',
        'approvedAt',
        'approvedBy'
      ];

      const filename = `leave_applications_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(filteredLeaveApplications, filename, headers);
      toast.success(`Exported ${filteredLeaveApplications.length} leave applications to CSV`);
    } catch (error: any) {
      console.error("Export Error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const exportPermissionData = () => {
    setExporting(true);
    try {
      const headers = [
        'employee_name',
        'permission_id',
        'permission_date',
        'permission_time_from',
        'permission_time_to',
        'reason',
        'status',
        'approved_by_name',
        'created_at',
        'approved_at',
        'remarks'
      ];

      const filename = `permission_applications_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(filteredPermissionApplications, filename, headers);
      toast.success(`Exported ${filteredPermissionApplications.length} permission applications to CSV`);
    } catch (error: any) {
      console.error("Export Error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (!canAccessExport()) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this module.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Export Data</h1>
            <p className="text-muted-foreground">Export employee leave and permission data to CSV format</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Leave Applications
            </TabsTrigger>
            <TabsTrigger value="permission" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Permission Applications
            </TabsTrigger>
          </TabsList>

          {/* Leave Applications Tab */}
          <TabsContent value="leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Applications Export
                </CardTitle>
                <CardDescription>
                  Filter and export leave application data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave-date-from">From Date</Label>
                    <Input
                      id="leave-date-from"
                      type="date"
                      value={leaveFilters.dateFrom}
                      onChange={(e) => setLeaveFilters({...leaveFilters, dateFrom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-date-to">To Date</Label>
                    <Input
                      id="leave-date-to"
                      type="date"
                      value={leaveFilters.dateTo}
                      onChange={(e) => setLeaveFilters({...leaveFilters, dateTo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-status">Status</Label>
                    <Select value={leaveFilters.status} onValueChange={(value) => setLeaveFilters({...leaveFilters, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-employee">Employee</Label>
                    <Select value={leaveFilters.employeeId} onValueChange={(value) => setLeaveFilters({...leaveFilters, employeeId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave-type">Leave Type</Label>
                    <Select value={leaveFilters.leaveType} onValueChange={(value) => setLeaveFilters({...leaveFilters, leaveType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leave Types</SelectItem>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {filteredLeaveApplications.length} records found
                  </div>
                  <Button 
                    onClick={exportLeaveData} 
                    disabled={exporting || filteredLeaveApplications.length === 0}
                    className="flex items-center gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permission Applications Tab */}
          <TabsContent value="permission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Permission Applications Export
                </CardTitle>
                <CardDescription>
                  Filter and export permission application data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permission-date-from">From Date</Label>
                    <Input
                      id="permission-date-from"
                      type="date"
                      value={permissionFilters.dateFrom}
                      onChange={(e) => setPermissionFilters({...permissionFilters, dateFrom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permission-date-to">To Date</Label>
                    <Input
                      id="permission-date-to"
                      type="date"
                      value={permissionFilters.dateTo}
                      onChange={(e) => setPermissionFilters({...permissionFilters, dateTo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permission-status">Status</Label>
                    <Select value={permissionFilters.status} onValueChange={(value) => setPermissionFilters({...permissionFilters, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permission-employee">Employee</Label>
                    <Select value={permissionFilters.employeeId} onValueChange={(value) => setPermissionFilters({...permissionFilters, employeeId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {filteredPermissionApplications.length} records found
                  </div>
                  <Button 
                    onClick={exportPermissionData} 
                    disabled={exporting || filteredPermissionApplications.length === 0}
                    className="flex items-center gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
