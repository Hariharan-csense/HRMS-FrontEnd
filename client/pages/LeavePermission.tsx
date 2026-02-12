import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Calendar, CheckCircle, XCircle, Upload, Mail, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { leavePermissionApi, type LeavePermission, type LeavePermissionFormData } from "@/components/helper/leavePermission/leavePermission";

export default function LeavePermission() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<LeavePermission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeavePermissionFormData>({} as LeavePermissionFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusFormData, setStatusFormData] = useState({ status: 'approved', remarks: '' });
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [reportingManagerError, setReportingManagerError] = useState<string>('');
  const [managers, setManagers] = useState<any[]>([]);

  // Load leave permissions
  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await leavePermissionApi.getLeavePermissionApplications();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setPermissions(result.data);
        toast.success(`Loaded ${result.data.length} permission requests`);
      }
    } catch (error: any) {
      console.error("Load Permissions Error:", error);
      toast.error("Failed to load permission requests");
    } finally {
      setLoading(false);
    }
  };

  // Load managers and HR users
  const loadManagers = async () => {
    try {
      const result = await leavePermissionApi.getLeavePermissionUsers();
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setManagers(result.data);
        console.log('Loaded managers:', result.data);
      }
    } catch (error: any) {
      console.error("Load Managers Error:", error);
      toast.error("Failed to load managers");
    }
  };

  // Validation functions
  const validateDate = (date: string): string => {
    if (!date) {
      return "Date is required";
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Check if date is in the past
    if (selectedDate < today) {
      return "Cannot select past dates";
    }

    // Check if date is too far in future (more than 30 days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (selectedDate > maxDate) {
      return "Cannot select dates more than 30 days in advance";
    }

    // Check if it's a weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "Cannot select weekends. Please select a weekday.";
    }

    return "";
  };

  const validateTime = (fromTime: string, toTime: string, date: string): string => {
    if (!fromTime || !toTime) {
      return "Both from and to times are required";
    }

    // Check if to time is after from time
    if (toTime <= fromTime) {
      return "To time must be after from time";
    }

    // Check if time range is reasonable (not more than 4 hours)
    const [fromHours, fromMinutes] = fromTime.split(':').map(Number);
    const [toHours, toMinutes] = toTime.split(':').map(Number);
    
    const fromTotalMinutes = fromHours * 60 + fromMinutes;
    const toTotalMinutes = toHours * 60 + toMinutes;
    const durationMinutes = toTotalMinutes - fromTotalMinutes;

    if (durationMinutes > 240) { // 4 hours
      return "Permission duration cannot exceed 4 hours";
    }

    if (durationMinutes < 30) { // 30 minutes minimum
      return "Permission duration must be at least 30 minutes";
    }

    // Removed the future time validation - users can now request permission for any time
    // on the selected date, including past times for today

    return "";
  };

  // Handle date change with validation
  const handleDateChange = (date: string) => {
    setFormData({ ...formData, permission_date: date });
    const error = validateDate(date);
    setDateError(error);
    
    // Clear time error when date changes
    if (date !== formData.permission_date) {
      setTimeError('');
    }
  };

  // Handle time change with validation
  const handleTimeChange = (field: 'permission_time_from' | 'permission_time_to', time: string) => {
    const newFormData = { ...formData, [field]: time };
    setFormData(newFormData);
    
    // Validate times if both are set
    if (newFormData.permission_time_from && newFormData.permission_time_to) {
      const error = validateTime(
        newFormData.permission_time_from, 
        newFormData.permission_time_to, 
        newFormData.permission_date || ''
      );
      setTimeError(error);
    }
  };

  useEffect(() => {
    loadPermissions();
    loadManagers();
  }, []);

  // Filter permissions based on user role and search
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = 
      permission.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permission_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Dialog handlers
  const handleOpenDialog = (permission?: LeavePermission) => {
    if (permission) {
      setEditingId(permission.id);
      setFormData({
        permission_date: permission.permission_date,
        permission_time_from: permission.permission_time_from,
        permission_time_to: permission.permission_time_to,
        reason: permission.reason,
        employee_id: permission.employee_id,
        employee_name: permission.employee_name
      });
    } else {
      setEditingId(null);
      setFormData({
        employee_id: user?.id?.toString(),
        employee_name: `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || user?.name || 'Current User',
        permission_date: '',
        permission_time_from: '',
        permission_time_to: '',
        reason: ''
      });
    }
    setSelectedFile(null);
    setDateError('');
    setTimeError('');
    setReportingManagerError('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate all fields
    const dateValidationError = validateDate(formData.permission_date || '');
    const timeValidationError = validateTime(
      formData.permission_time_from || '', 
      formData.permission_time_to || '', 
      formData.permission_date || ''
    );

    setDateError(dateValidationError);
    setTimeError(timeValidationError);

    // Validate reporting manager
    if (!formData.reporting_manager_id) {
      setReportingManagerError('Please select a reporting manager or HR');
      toast.error('Please select a reporting manager or HR');
      return;
    } else {
      setReportingManagerError('');
    }

    if (!formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (dateValidationError) {
      toast.error(dateValidationError);
      return;
    }

    if (timeValidationError) {
      toast.error(timeValidationError);
      return;
    }

    try {
      setLoading(true);
      
      const result = await leavePermissionApi.applyLeavePermission(formData, selectedFile || undefined);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Leave permission request submitted successfully!");
      setIsDialogOpen(false);
      
      // Clear form and errors
      setFormData({} as LeavePermissionFormData);
      setDateError('');
      setTimeError('');
      setReportingManagerError('');
      setSelectedFile(null);
      
      await loadPermissions();
      
    } catch (error: any) {
      console.error("Save Permission Error:", error);
      toast.error(error.message || "Failed to submit permission request");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateId) return;

    try {
      setLoading(true);
      
      const result = await leavePermissionApi.updateLeavePermissionStatus(
        statusUpdateId, 
        statusFormData.status as 'approved' | 'rejected', 
        statusFormData.remarks
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Permission request ${statusFormData.status} successfully!`);
      setStatusDialogOpen(false);
      setStatusUpdateId(null);
      setStatusFormData({ status: 'approved', remarks: '' });
      await loadPermissions();
      
    } catch (error: any) {
      console.error("Status Update Error:", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const openStatusDialog = (permission: LeavePermission) => {
    setStatusUpdateId(permission.id);
    setStatusFormData({ status: 'approved', remarks: '' });
    setStatusDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status as keyof typeof variants]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canApproveReject = () => {
    return hasRole(user, "hr") || hasRole(user, "admin") || hasRole(user, "manager");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leave Permission</h1>
            <p className="text-muted-foreground">Manage leave permission requests</p>
          </div>
          {hasRole(user, "employee") && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Request Permission
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Permission Requests
            </CardTitle>
            <CardDescription>
              {hasRole(user, "employee") 
                ? "View and manage your leave permission requests"
                : "Review and manage leave permission requests from employees"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, reason, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No permission requests found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPermissions.map((permission) => (
                  <div key={permission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{permission.employee_name}</h3>
                          {getStatusBadge(permission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {permission.permission_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canApproveReject() && permission.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => openStatusDialog(permission)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Review
                          </Button>
                        )}
                        {permission.attachment_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={permission.attachment_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-1 h-4 w-4" />
                              Attachment
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date:</span>
                        <p>{new Date(permission.permission_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <p>{permission.permission_time_from} - {permission.permission_time_to}</p>
                      </div>
                      <div>
                        <span className="font-medium">Applied:</span>
                        <p>{new Date(permission.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Reason:</span>
                      <p className="text-sm text-muted-foreground mt-1">{permission.reason}</p>
                    </div>

                    {permission.approved_by_name && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Processed by:</span> {permission.approved_by_name}
                        {permission.approved_at && (
                          <span> on {new Date(permission.approved_at).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    )}

                    {permission.remarks && (
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <span className="font-medium">Remarks:</span> {permission.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Permission Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-3xl max-h-[95vh] overflow-y-auto p-0 bg-white border-0 rounded-2xl shadow-2xl">
            {/* Dialog Header */}
            <DialogHeader
              className="relative p-8 text-white rounded-t-2xl"
              style={{ background: "linear-gradient(135deg, #17c491 0%, #0fa372 100%)" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 ">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {editingId ? "Edit Permission Request" : "Request Leave Permission"}
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100 text-base mt-2 font-medium">
                    Fill in the details for your leave permission request
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-8 space-y-8 bg-gray-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="permission_date" className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Date *
                  </Label>
                  <Input
                    id="permission_date"
                    type="date"
                    value={formData.permission_date || ''}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className={`h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm ${dateError ? 'border-red-500' : ''}`}
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{dateError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="permission_time_from" className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    From Time *
                  </Label>
                  <Input
                    id="permission_time_from"
                    type="time"
                    value={formData.permission_time_from || ''}
                    onChange={(e) => handleTimeChange('permission_time_from', e.target.value)}
                    className={`h-12 text-base border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-sm ${timeError ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="permission_time_to" className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    To Time *
                  </Label>
                  <Input
                    id="permission_time_to"
                    type="time"
                    value={formData.permission_time_to || ''}
                    onChange={(e) => handleTimeChange('permission_time_to', e.target.value)}
                    className={`h-12 text-base border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm ${timeError ? 'border-red-500' : ''}`}
                  />
                  {timeError && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{timeError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reporting_manager" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Reporting Manager/HR *
                </Label>
                <Select
                  value={formData.reporting_manager_id || ''}
                  onValueChange={(value) => {
                    setFormData({ ...formData, reporting_manager_id: value });
                    setReportingManagerError('');
                  }}
                >
                  <SelectTrigger className={`h-12 text-base border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm ${reportingManagerError ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select manager(s) or HR..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-60 overflow-auto border-gray-200 rounded-xl shadow-lg">
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id} className="text-base py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{manager.fullName || manager.name}</span>
                          {manager.isHR && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">HR</span>
                          )}
                          {manager.isManager && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">Manager</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reportingManagerError && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{reportingManagerError}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="reason" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                  Reason *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for leave permission..."
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  className="text-base border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="attachment" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                  Attachment (Optional)
                </Label>
                <label className="flex items-center gap-4 px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-base text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
                    {selectedFile ? selectedFile.name : 'Choose file or drag and drop...'}
                  </span>
                  <input
                    id="attachment"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500">Supported formats: Images, PDF, DOC, DOCX (Max 5MB)</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="w-full sm:w-auto h-12 text-base font-bold border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all rounded-xl px-8"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="w-full sm:w-auto h-12 text-base font-bold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 rounded-xl px-8"
                  style={{ background: "linear-gradient(135deg, #17c491 0%, #0fa372 100%)" }}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="w-full max-w-md max-h-[95vh] overflow-y-auto p-0 bg-white border-0 rounded-2xl shadow-2xl">
            {/* Dialog Header */}
            <DialogHeader
              className="relative p-8 text-white rounded-t-2xl"
              style={{ background: "linear-gradient(135deg, #17c491 0%, #0fa372 100%)" }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10 blur-lg"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                    Review Permission Request
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100 text-base mt-1 font-medium">
                    Approve or reject this leave permission request
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-8 space-y-6 bg-gray-50/50">
              <div className="space-y-3">
                <Label htmlFor="status" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#17c491" }}></span>
                  Status *
                </Label>
                <Select
                  value={statusFormData.status}
                  onValueChange={(value) => setStatusFormData({ ...statusFormData, status: value })}
                >
                  <SelectTrigger className="h-12 text-base border-gray-300 rounded-xl transition-all shadow-sm" style={{ outline: "none" }}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-60 overflow-auto border-gray-200 rounded-xl shadow-lg">
                    <SelectItem value="approved" className="text-base py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Approved</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">✓</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected" className="text-base py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rejected</span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold">✗</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="remarks" className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                  Remarks (Optional)
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any remarks (optional)..."
                  value={statusFormData.remarks}
                  onChange={(e) => setStatusFormData({ ...statusFormData, remarks: e.target.value })}
                  rows={4}
                  className="text-base border-gray-300 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setStatusDialogOpen(false)} 
                  className="w-full sm:w-auto h-12 text-base font-bold border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all rounded-xl px-8"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={loading}
                  className={`w-full sm:w-auto h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 rounded-xl px-8 ${
                    statusFormData.status === 'approved' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                  }`}
                >
                  {loading ? "Updating..." : `${statusFormData.status.charAt(0).toUpperCase() + statusFormData.status.slice(1)} Request`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
