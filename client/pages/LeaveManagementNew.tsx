import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, Calendar, CheckCircle, XCircle, Upload, Mail } from "lucide-react";
import { toast } from "sonner";
import { leaveTypeApi } from "@/components/helper/leave/leave";

// Types
interface LeaveType {
  id: string;
  name: string;
  isPaid: boolean;
  annualLimit: number;
  carryForward: number;
  encashable: boolean;
  createdAt: string;
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  opening: number;
  availed: number;
  available: number;
  createdAt: string;
}

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  attachment?: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerId?: string;
  reportingManagerName?: string;
  reportingManagerEmail?: string;
  createdAt: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  role: "manager" | "hr";
}

const mockManagers: Manager[] = [
  { id: "MGR001", name: "Michael Manager", email: "manager@company.com", role: "manager" },
  { id: "MGR002", name: "Emma HR", email: "hr@company.com", role: "hr" },
];

const mockEmployees = [
  { id: "EMP001", name: "John Doe" },
  { id: "EMP002", name: "Sarah Smith" },
  { id: "EMP003", name: "Michael Johnson" },
  { id: "EMP004", name: "Emily Davis" },
  { id: "EMP005", name: "Robert Wilson" },
];

// Mock Data
const mockLeaveTypes: LeaveType[] = [
  {
    id: "LT001",
    name: "Casual Leave",
    isPaid: true,
    annualLimit: 12,
    carryForward: 5,
    encashable: true,
    createdAt: "2024-01-01",
  },
  {
    id: "LT002",
    name: "Sick Leave",
    isPaid: true,
    annualLimit: 10,
    carryForward: 0,
    encashable: false,
    createdAt: "2024-01-01",
  },
  {
    id: "LT003",
    name: "Annual Leave",
    isPaid: true,
    annualLimit: 20,
    carryForward: 10,
    encashable: true,
    createdAt: "2024-01-01",
  },
  {
    id: "LT004",
    name: "Unpaid Leave",
    isPaid: false,
    annualLimit: 0,
    carryForward: 0,
    encashable: false,
    createdAt: "2024-01-01",
  },
];

const mockLeaveBalances: LeaveBalance[] = [
  { id: "LB001", employeeId: "EMP001", employeeName: "John Doe", leaveType: "Casual Leave", opening: 12, availed: 3, available: 9, createdAt: "2024-01-01" },
  { id: "LB002", employeeId: "EMP001", employeeName: "John Doe", leaveType: "Sick Leave", opening: 10, availed: 2, available: 8, createdAt: "2024-01-01" },
  { id: "LB003", employeeId: "EMP002", employeeName: "Sarah Smith", leaveType: "Casual Leave", opening: 12, availed: 5, available: 7, createdAt: "2024-01-01" },
  { id: "LB004", employeeId: "EMP003", employeeName: "Michael Johnson", leaveType: "Annual Leave", opening: 20, availed: 8, available: 12, createdAt: "2024-01-01" },
];

const mockLeaveApplications: LeaveApplication[] = [
  {
    id: "LA001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    leaveType: "Casual Leave",
    fromDate: "2024-04-10",
    toDate: "2024-04-12",
    days: 3,
    reason: "Personal work",
    status: "applied",
    createdAt: "2024-04-01",
  },
  {
    id: "LA002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    leaveType: "Sick Leave",
    fromDate: "2024-04-15",
    toDate: "2024-04-15",
    days: 1,
    reason: "Medical appointment",
    status: "approved",
    createdAt: "2024-04-01",
  },
  {
    id: "LA003",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    leaveType: "Annual Leave",
    fromDate: "2024-05-01",
    toDate: "2024-05-05",
    days: 5,
    reason: "Vacation",
    status: "applied",
    createdAt: "2024-04-01",
  },
];

export default function LeaveManagement() {
  const location = useLocation();
  const { user } = useAuth();
  //const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(mockLeaveTypes);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("types");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [dialogMode, setDialogMode] = useState<"types" | "applications">("types");
  const [loading, setLoading] = useState(true);

  // Helper function to map user ID to employee ID (e.g., "2" -> "EMP002")
  const getEmployeeIdForUser = (userId: string) => {
    return `EMP${String(parseInt(userId)).padStart(3, "0")}`;
  };

  // Load leave applications
  const loadLeaveApplications = async () => {
    try {
      console.log("Fetching leave applications...");
      const result = await leaveTypeApi.getLeaveApplications();
      
      console.log("Leave Applications Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        setLeaveApplications(result.data);
        toast.success(`Loaded ${result.data.length} leave applications`);
      } else {
        console.error("Unexpected API response format:", result);
        toast.error("Invalid data format from server");
      }
    } catch (error: any) {
      console.error("Fetch Leave Applications Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
  };

  // Load leave balances
  const loadLeaveBalances = async () => {
    try {
      console.log("Fetching leave balances...");
      const result = await leaveTypeApi.getLeaveBalances();
      
      console.log("Leave Balances Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        setLeaveBalances(result.data);
        toast.success(`Loaded ${result.data.length} leave balances`);
      } else {
        console.error("Unexpected API response format:", result);
        toast.error("Invalid data format from server");
      }
    } catch (error: any) {
      console.error("Fetch Leave Balances Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
  };

useEffect(() => {
  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      console.log("Fetching leave types...");

      const result = await leaveTypeApi.getLeaveTypes();

      console.log("Raw API Result:", result);

      // API helper already processes the response and returns { data: [...] }
      let leaveTypesData = [];
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        setLoading(false);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        leaveTypesData = result.data;
      } else if (Array.isArray(result)) {
        leaveTypesData = result;
      } else {
        console.error("Unexpected API response format:", result);
        toast.error("Invalid data format from server");
        setLoading(false);
        return;
      }

      // The API helper already maps the data, but to different field names
      // We need to map from API helper format to component format
      const mappedTypes = leaveTypesData.map((item: any) => {
        console.log("API Helper Item:", item);
        const mapped = {
          id: item.id,
          name: item.name,
          isPaid: item.isPaid,
          annualLimit: item.maxDays, // API helper uses maxDays from annual_limit
          carryForward: item.carryForwardLimit || 0, // API helper uses carryForwardLimit from carry_forward
          encashable: item.encashable, // API helper now includes encashable field
          createdAt: item.createdAt || new Date().toISOString(),
        };
        console.log("Component Mapped:", mapped);
        return mapped;
      });

      console.log("Mapped Leave Types:", mappedTypes);
      setLeaveTypes(mappedTypes);
      toast.success(`Loaded ${mappedTypes.length} leave types`);

    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  loadLeaveTypes();
}, []);

  // Detect route and set active tab
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.includes("/balance")) {
      setActiveTab("balance");
    } else if (pathname.includes("/apply")) {
      setActiveTab("applications");
    } else {
      setActiveTab("types");
    }
  }, [location.pathname]);

  // Load leave balances when balance tab is active
  useEffect(() => {
    if (activeTab === "balance") {
      loadLeaveBalances();
    }
  }, [activeTab]);

  // Load leave applications when applications tab is active
  useEffect(() => {
    if (activeTab === "applications") {
      loadLeaveApplications();
    }
  }, [activeTab]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter functions
  const filteredLeaveTypes = useMemo(
    () => leaveTypes.filter((lt) => lt.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [leaveTypes, searchTerm]
  );

  const filteredLeaveBalances = useMemo(() => {
    let filtered = leaveBalances;

    // If user is an employee, show only their data
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      const employeeId = getEmployeeIdForUser(user?.id || "");
      filtered = filtered.filter((lb) => lb.employeeId === employeeId);
    } else if (hasRole(user, "manager")) {
      // Managers see their own and their direct reports' leave data
      filtered = filtered.filter(
        (lb) =>
          lb.employeeName === user?.name || // Show their own
          leaveApplications.find((la) => la.employeeName === lb.employeeName && la.reportingManagerName === user?.name) // Show their team members
      );
    } else {
      // For admins, apply search filter to see all
      filtered = filtered.filter((lb) => lb.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || lb.leaveType.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  }, [leaveBalances, searchTerm, user, leaveApplications]);

  const filteredLeaveApplications = useMemo(() => {
    let filtered = leaveApplications;

    // If user is an employee, show only their data
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      const employeeId = getEmployeeIdForUser(user?.id || "");
      filtered = filtered.filter((la) => la.employeeId === employeeId);
    } else if (hasRole(user, "manager")) {
      // Managers see their own and their direct reports' applications
      filtered = filtered.filter(
        (la) =>
          la.employeeName === user?.name || // Show their own
          la.reportingManagerName === user?.name // Show their direct reports
      );
    } else {
      // For admins, apply search filter to see all
      filtered = filtered.filter((la) => la.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || la.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  }, [leaveApplications, searchTerm, user]);

  const pendingApplications = leaveApplications.filter((la) => la.status === "applied");

  // Dialog handlers
  const handleOpenDialog = (item?: any, mode?: "types" | "applications") => {
    // Set dialog mode - default to "applications" for leave applications, otherwise use current tab if it's valid
    let dialogModeToUse: "types" | "applications";
    if (mode) {
      dialogModeToUse = mode;
    } else if (activeTab === "types") {
      dialogModeToUse = "types";
    } else {
      dialogModeToUse = "applications";
    }
    setDialogMode(dialogModeToUse);
    
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      // Auto-load employee data if user is an employee and we're opening an application dialog
      if (dialogModeToUse === "applications" && hasRole(user, "employee")) {
        const employeeId = getEmployeeIdForUser(user?.id || "");
        setFormData({
          employeeId,
          employeeName: user?.name || "",
        });
      } else {
        setFormData({});
      }
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name && dialogMode === "types") {
      toast.error("Please fill in all required fields");
      return;
    }

    if (dialogMode === "types") {
      try {
        // Prepare data for API - convert component format to API format
        const apiData = {
          name: formData.name,
          is_paid: formData.isPaid ? 1 : 0,
          annual_limit: formData.annualLimit || 0,
          carry_forward: formData.carryForward || 0,
          encashable: formData.encashable ? 1 : 0,
          description: formData.description || "",
        };

        let result;
        if (editingId) {
          // Update existing leave type
          result = await leaveTypeApi.updateLeaveType(editingId, apiData);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Leave type updated successfully");
        } else {
          // Create new leave type
          result = await leaveTypeApi.createLeaveType(apiData);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Leave type created successfully");
        }

        // Refresh the list
        const refreshData = async () => {
          try {
            setLoading(true);
            const result = await leaveTypeApi.getLeaveTypes();

            let leaveTypesData = [];
            
            if (result && result.error) {
              console.error("API Error:", result.error);
              toast.error(result.error);
              setLoading(false);
              return;
            }
            
            if (result && result.data && Array.isArray(result.data)) {
              leaveTypesData = result.data;
            } else if (Array.isArray(result)) {
              leaveTypesData = result;
            } else {
              console.error("Unexpected API response format:", result);
              toast.error("Invalid data format from server");
              setLoading(false);
              return;
            }

            const mappedTypes = leaveTypesData.map((item: any) => ({
              id: item.id,
              name: item.name,
              isPaid: item.isPaid,
              annualLimit: item.maxDays,
              carryForward: item.carryForwardLimit || 0,
              encashable: item.encashable,
              createdAt: item.createdAt || new Date().toISOString(),
            }));

            setLeaveTypes(mappedTypes);
          } catch (error: any) {
            console.error("Fetch Error:", error);
            toast.error("Failed to connect to server: " + (error.message || "Network error"));
          } finally {
            setLoading(false);
          }
        };
        
        await refreshData();
        setIsDialogOpen(false);
      } catch (error: any) {
        console.error("Save Error:", error);
        toast.error("Failed to save leave type: " + (error.message || "Unknown error"));
      }
    } else if (dialogMode === "applications") {
      // Handle leave applications (existing logic)
      if (editingId) {
        setLeaveApplications((prev) => prev.map((la) => (la.id === editingId ? { ...la, ...formData } : la)));
      } else {
        const days = Math.ceil((new Date(formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const newApplication = {
          id: `LA${String(leaveApplications.length + 1).padStart(3, "0")}`,
          ...formData,
          days,
          status: "applied",
          createdAt: new Date().toISOString().split("T")[0],
        } as LeaveApplication;

        setLeaveApplications((prev) => [newApplication, ...prev]);

        // Send email to reporting manager/HR
        if (formData.reportingManagerEmail) {
          toast.success(`Leave request submitted! Email sent to ${formData.reportingManagerName}`, {
            description: `Notification sent to ${formData.reportingManagerEmail}`,
            icon: <Mail className="w-4 h-4" />,
          });
        }
      }
      setIsDialogOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (activeTab === "types") {
      try {
        const result = await leaveTypeApi.deleteLeaveType(deleteId!);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Leave type deleted successfully");
        
        // Refresh list
        const refreshLeaveTypes = async () => {
          try {
            setLoading(true);
            console.log("Fetching leave types...");

            const result = await leaveTypeApi.getLeaveTypes();

            console.log("Raw API Result:", result);

            // API helper already processes the response and returns { data: [...] }
            let leaveTypesData = [];
            
            if (result && result.error) {
              console.error("API Error:", result.error);
              toast.error(result.error);
              setLoading(false);
              return;
            }
            
            if (result && result.data && Array.isArray(result.data)) {
              leaveTypesData = result.data;
            } else if (Array.isArray(result)) {
              leaveTypesData = result;
            } else {
              console.error("Unexpected API response format:", result);
              toast.error("Invalid data format from server");
              setLoading(false);
              return;
            }

            // The API helper already maps the data, but to different field names
            // We need to map from API helper format to component format
            const mappedTypes = leaveTypesData.map((item: any) => {
              console.log("API Helper Item:", item);
              const mapped = {
                id: item.id,
                name: item.name,
                isPaid: item.isPaid,
                annualLimit: item.maxDays, // API helper uses maxDays from annual_limit
                carryForward: item.carryForwardLimit || 0, // API helper uses carryForwardLimit from carry_forward
                encashable: item.encashable, // API helper now includes encashable field
                createdAt: item.createdAt || new Date().toISOString(),
              };
              console.log("Component Mapped:", mapped);
              return mapped;
            });

            console.log("Mapped Leave Types:", mappedTypes);
            setLeaveTypes(mappedTypes);
          } catch (error: any) {
            console.error("Fetch Error:", error);
            toast.error("Failed to connect to server: " + (error.message || "Network error"));
          } finally {
            setLoading(false);
          }
        };
        
        await refreshLeaveTypes();
        setIsDeleteDialogOpen(false);
      } catch (error: any) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete leave type: " + (error.message || "Unknown error"));
      }
    } else if (dialogMode === "applications") {
      setLeaveApplications((prev) => prev.filter((la) => la.id !== deleteId));
      setIsDeleteDialogOpen(false);
    }
  };

  const handleApproveReject = (id: string, approved: boolean) => {
    setLeaveApplications((prev) =>
      prev.map((la) => (la.id === id ? { ...la, status: approved ? "approved" : "rejected" } : la))
    );
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Calendar className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary flex-shrink-0" />
                <span className="hidden sm:inline">Leave Management</span>
                <span className="sm:hidden">Leave Mgmt</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Apply and manage employee leaves</p>
            </div>
            {hasRole(user, "employee") && (
              <Button onClick={() => handleOpenDialog(undefined, "applications")} className="gap-2 h-8 sm:h-10 text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Apply Leave</span>
                <span className="sm:hidden">Apply</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search Card */}
        {activeTab !== "approvals" && !hasRole(user, "employee") && (
          <Card>
            <CardContent className="pt-3 sm:pt-4 md:pt-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                {activeTab === "types" && (
                  <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Card for Employee */}
        {activeTab === "balance" && hasRole(user, "employee") && (
          <Card>
            <CardContent className="pt-3 sm:pt-4 md:pt-6">
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full md:w-auto h-8 sm:h-10 text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Apply Leave
              </Button>
            </CardContent>
          </Card>
        )}

        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 gap-1 md:gap-2 bg-muted p-1 h-auto min-w-max md:min-w-full">
            <TabsTrigger value="types" className="text-xs md:text-sm">
              <span className="sm:hidden">Types</span>
              <span className="hidden sm:inline">Leave Types ({leaveTypes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="text-xs md:text-sm">
              <span className="sm:hidden">Bal</span>
              <span className="hidden sm:inline">Balance</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-xs md:text-sm">
              <span className="sm:hidden">Apps</span>
              <span className="hidden sm:inline">Applications ({leaveApplications.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Leave Types Tab */}
          <TabsContent value="types">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredLeaveTypes.map((lt) => (
                    <div key={lt.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{lt.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(lt)}
                            className="p-1 sm:p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lt.id)}
                            className="p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Type:</span>
                          <span className={`text-right px-1.5 py-0.5 rounded text-xs font-medium ${lt.isPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {lt.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Annual Limit:</span>
                          <span className="font-medium text-right">{lt.annualLimit} days</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Carry Fwd:</span>
                          <span className="font-medium text-right">{lt.carryForward} days</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Encashable:</span>
                          <span className="font-medium text-right">{lt.encashable ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-3 font-semibold">Name</th>
                        <th className="text-left px-3 py-3 font-semibold">Type</th>
                        <th className="text-left px-3 py-3 font-semibold">Annual Limit</th>
                        <th className="text-left px-3 py-3 font-semibold">Carry Fwd</th>
                        <th className="text-left px-3 py-3 font-semibold">Encash</th>
                        <th className="text-left px-3 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaveTypes.map((lt) => (
                        <tr key={lt.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-3 font-medium">{lt.name}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${lt.isPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {lt.isPaid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-3 py-3">{lt.annualLimit} days</td>
                          <td className="px-3 py-3">{lt.carryForward} days</td>
                          <td className="px-3 py-3">{lt.encashable ? "Yes" : "No"}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(lt)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(lt.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Balance Tab */}
          <TabsContent value="balance">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredLeaveBalances.map((lb) => (
                    <div key={lb.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="mb-2 sm:mb-3">
                        <h3 className="font-semibold text-sm sm:text-base">{lb.employeeName}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{lb.leaveType}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-blue-50 rounded p-2 sm:p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Opening</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-700">{lb.opening}</p>
                        </div>
                        <div className="bg-orange-50 rounded p-2 sm:p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Availed</p>
                          <p className="text-lg sm:text-xl font-bold text-orange-700">{lb.availed}</p>
                        </div>
                        <div className="bg-green-50 rounded p-2 sm:p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Available</p>
                          <p className="text-lg sm:text-xl font-bold text-green-700">{lb.available}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-3 font-semibold">Employee</th>
                        <th className="text-left px-3 py-3 font-semibold">Leave Type</th>
                        <th className="text-center px-3 py-3 font-semibold">Opening</th>
                        <th className="text-center px-3 py-3 font-semibold">Availed</th>
                        <th className="text-center px-3 py-3 font-semibold">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaveBalances.map((lb) => (
                        <tr key={lb.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-3 font-medium">{lb.employeeName}</td>
                          <td className="px-3 py-3">{lb.leaveType}</td>
                          <td className="px-3 py-3 text-center bg-blue-50">{lb.opening}</td>
                          <td className="px-3 py-3 text-center bg-orange-50">{lb.availed}</td>
                          <td className="px-3 py-3 text-center bg-green-50 font-semibold">{lb.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredLeaveApplications.map((la) => (
                    <div key={la.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">{la.employeeName}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{la.leaveType}</p>
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                            la.status === "applied"
                              ? "bg-yellow-100 text-yellow-800"
                              : la.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {la.status.charAt(0).toUpperCase() + la.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">From:</span>
                          <span className="font-medium text-right">{la.fromDate}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">To:</span>
                          <span className="font-medium text-right">{la.toDate}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Days:</span>
                          <span className="font-medium text-right">{la.days}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Reason:</span>
                          <span className="text-right flex-1">{la.reason}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-3 font-semibold">Employee</th>
                        <th className="text-left px-3 py-3 font-semibold">Type</th>
                        <th className="text-left px-3 py-3 font-semibold">From - To</th>
                        <th className="text-center px-3 py-3 font-semibold">Days</th>
                        <th className="text-left px-3 py-3 font-semibold">Reason</th>
                        <th className="text-left px-3 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaveApplications.map((la) => (
                        <tr key={la.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-3 font-medium">{la.employeeName}</td>
                          <td className="px-3 py-3">{la.leaveType}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{la.fromDate} → {la.toDate}</td>
                          <td className="px-3 py-3 text-center">{la.days}</td>
                          <td className="px-3 py-3">{la.reason}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`text-sm px-2 py-1 rounded font-medium ${
                                la.status === "applied"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : la.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {la.status.charAt(0).toUpperCase() + la.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingId ? "Edit" : "Add New"} {dialogMode === "types" ? "Leave Type" : "Leave Application"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {dialogMode === "types" && (
              <>
                <div>
                  <Label className="text-xs sm:text-sm">Leave Type Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isPaid || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                  />
                  <Label>Paid Leave</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Annual Limit (days) *</Label>
                    <Input
                      value={formData.annualLimit || ""}
                      onChange={(e) => setFormData({ ...formData, annualLimit: parseInt(e.target.value) || 0 })}
                      type="number"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Carry Forward (days)</Label>
                    <Input
                      value={formData.carryForward || ""}
                      onChange={(e) => setFormData({ ...formData, carryForward: parseInt(e.target.value) || 0 })}
                      type="number"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.encashable || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, encashable: checked })}
                  />
                  <Label>Encashable</Label>
                </div>
              </>
            )}

            {dialogMode === "applications" && (
              <>
                {!hasRole(user, "employee") && (
                  <div>
                    <Label className="text-xs sm:text-sm">Employee *</Label>
                    <Select value={formData.employeeName || ""} onValueChange={(val) => setFormData({ ...formData, employeeName: val, employeeId: val })}>
                      <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
<SelectContent className="z-50 max-h-60 overflow-auto">
  {mockEmployees.length === 0 ? (
    <div className="px-4 py-2 text-sm text-muted-foreground">No employees available</div>
  ) : (
    mockEmployees.map((employee) => (
      <SelectItem key={employee.id} value={employee.name}>
        {employee.name}
      </SelectItem>
    ))
  )}
</SelectContent>
                    </Select>
                  </div>
                )}
                {hasRole(user, "employee") && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Employee</Label>
                    <p className="font-medium mt-1">{formData.employeeName || user?.name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs sm:text-sm">Leave Type *</Label>
                  <Select value={formData.leaveType || ""} onValueChange={(val) => setFormData({ ...formData, leaveType: val })}>
                    <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-60 overflow-auto">
  {leaveTypes.map((type) => (
    <SelectItem key={type.id} value={type.name}>
      {type.name}
    </SelectItem>
  ))}
</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm">From Date *</Label>
                    <Input
                      value={formData.fromDate || ""}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      type="date"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">To Date *</Label>
                    <Input
                      value={formData.toDate || ""}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      type="date"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Reason for Leave *</Label>
                  <Input
                    value={formData.reason || ""}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Reporting Manager/HR *</Label>
                  <Select
                    value={formData.reportingManagerId || ""}
                    onValueChange={(val) => {
                      const manager = mockManagers.find(m => m.id === val);
                      setFormData({
                        ...formData,
                        reportingManagerId: val,
                        reportingManagerName: manager?.name || "",
                        reportingManagerEmail: manager?.email || ""
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select manager or HR..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-60 overflow-auto">
                      {mockManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.reportingManagerEmail && (
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Reporting To:</p>
                    <div>
                      <p className="text-xs sm:text-sm font-medium">{formData.reportingManagerName}</p>
                      <p className="text-xs text-muted-foreground">{formData.reportingManagerEmail}</p>
                      <p className="text-xs text-blue-600 mt-1 sm:mt-2">Email will be sent on submission</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Attachment (Optional)</Label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer mt-2 hover:bg-muted">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Choose file...</span>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto text-xs sm:text-sm">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
