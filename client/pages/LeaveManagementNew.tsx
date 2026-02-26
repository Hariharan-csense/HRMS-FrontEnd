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
import { Plus, Edit, Trash2, Search, Calendar, CheckCircle, XCircle, Upload, Mail, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { leaveTypeApi } from "@/components/helper/leave/leave";
import { employeeApi } from "@/components/helper/employee/employee";
import { departmentApi, Department } from "@/components/helper/department/department";
import { designationApi, Designation } from "@/components/helper/designation/designation";
import { required } from "zod/v4-mini";

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
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<"types" | "applications">("types");
  const [loading, setLoading] = useState(true);

  // Helper function to map user ID to employee ID (e.g., "2" -> "EMP002")
  const getEmployeeIdForUser = (userId: string) => {
    return String(parseInt(userId));
  };

  // Find current user's employee data and set reporting managers
const findCurrentUserAndSetManagers = async () => {
  // Leave Apply dialog now uses API-based approver list.
  // Prevent legacy employee/designation logic from overwriting API results.
  if (dialogMode === "applications") {
    return;
  }

  if (!user || employees.length === 0 || departments.length === 0 || designations.length === 0) {
    setReportingManagers([]);
    return;
  }

  const userEmployeeId = (user as any)?.employee_id || user?.id;
  const currentUser = employees.find(emp =>
    emp.id == userEmployeeId ||
    emp.id == user?.id ||
    emp.employee_id === userEmployeeId?.toString() ||
    emp.employee_id === user?.id?.toString() ||
    emp.id === userEmployeeId?.toString() ||
    emp.id === user?.id?.toString()
  );

  if (!currentUser) {
    setReportingManagers([]);
    return;
  }

  setCurrentUserEmployee(currentUser);
  const userDeptId = currentUser.department_id;

  let managers: any[] = [];

  if (hasRole(user, "admin") || hasRole(user, "manager")) {
    // Admins & managers see all HR (role or designation)
    managers = employees
      .filter(emp => {
        if (emp.id === currentUser.id) return false;
        const designation = designations.find(d => d.id == emp.designation_id);
        const desigName = (designation?.name || '').toLowerCase();
        return emp.role === 'hr' || desigName.includes('hr');
      })
      .map(emp => {
        const designation = designations.find(d => d.id == emp.designation_id);
        const dept = departments.find(d => d.id == emp.department_id);
        return {
          ...emp,
          fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
          designationName: designation?.name || 'Unknown',
          departmentName: dept?.name || 'Unknown',
        };
      });
  } else if (currentUser.role === 'employee') {
    // Employees see: same-dept managers/leads + all HR
    managers = employees
      .filter(emp => {
        if (emp.id === currentUser.id) return false;
        const designation = designations.find(d => d.id == emp.designation_id);
        const desigName = (designation?.name || '').toLowerCase();
        const isHR = emp.role === 'hr' || desigName.includes('hr');
        const isManager = emp.role === 'manager' || desigName.includes('manager') || desigName.includes('lead');
        const sameDept = emp.department_id == userDeptId;
        return isHR || (isManager && sameDept);
      })
      .map(emp => {
        const designation = designations.find(d => d.id == emp.designation_id);
        const dept = departments.find(d => d.id == emp.department_id);
        const desigName = (designation?.name || '').toLowerCase();
        const isHR = emp.role === 'hr' || desigName.includes('hr');
        const isManager = emp.role === 'manager' || desigName.includes('manager') || desigName.includes('lead');
        return {
          ...emp,
          fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
          designationName: designation?.name || 'Unknown',
          departmentName: dept?.name || 'Unknown',
          isHR,
          isManager,
          isSameDepartment: emp.department_id == userDeptId,
        };
      });

    // Sort: same-dept managers first, then HR, then others
    managers.sort((a, b) => {
      if (a.isManager && a.isSameDepartment && !(b.isManager && b.isSameDepartment)) return -1;
      if (!(a.isManager && a.isSameDepartment) && b.isManager && b.isSameDepartment) return 1;
      if (a.isHR && !b.isHR) return -1;
      if (!a.isHR && b.isHR) return 1;
      return 0;
    });
  }

  // === Always ensure the assigned reporting manager is included (top of list) ===
  if (currentUser.reporting_manager_id) {
    const assignedId = currentUser.reporting_manager_id;
    if (!managers.some(m => m.id === assignedId)) {
      const assignedEmp = employees.find(emp => emp.id === assignedId);
      if (assignedEmp) {
        const designation = designations.find(d => d.id == assignedEmp.designation_id);
        const dept = departments.find(d => d.id == assignedEmp.department_id);
        const mapped = {
          ...assignedEmp,
          fullName: `${assignedEmp.first_name || ''} ${assignedEmp.last_name || ''}`.trim() || 'Assigned Manager',
          designationName: designation?.name || 'Unknown',
          departmentName: dept?.name || 'Unknown',
        };
        managers.unshift(mapped); // Add to top
      }
    }
  }

  // === Final fallback: if still empty, show all other employees ===
  if (managers.length === 0 && employees.length > 1) {
    managers = employees
      .filter(emp => emp.id !== currentUser.id)
      .map(emp => {
        const designation = designations.find(d => d.id == emp.designation_id);
        const dept = departments.find(d => d.id == emp.department_id);
        return {
          ...emp,
          fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
          designationName: designation?.name || 'Unknown',
          departmentName: dept?.name || 'Unknown',
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  setReportingManagers(managers);
};

  // Load employees
  const loadEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const result = await employeeApi.getEmployees();
      
      console.log("Employees Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      // Handle the actual API response structure
      let employeesData = [];
      if (result && (result as any).employees && Array.isArray((result as any).employees)) {
        employeesData = (result as any).employees;
      } else if (result && result.data && Array.isArray(result.data)) {
        employeesData = result.data;
      } else if (Array.isArray(result)) {
        employeesData = result;
      }
      
      if (employeesData.length > 0) {
        setEmployees(employeesData);
        toast.success(`Loaded ${employeesData.length} employees`);
      } else {
        console.error("No employees found in response:", result);
        toast.error("No employees data available");
      }
    } catch (error: any) {
      console.error("Fetch Employees Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
  };

  // Load departments
  const loadDepartments = async () => {
    try {
      console.log("Fetching departments...");
      const result = await departmentApi.getdepartment();
      
      console.log("Departments Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        setDepartments(result.data);
        toast.success(`Loaded ${result.data.length} departments`);
      } else {
        console.error("No departments found in response:", result);
        toast.error("No departments data available");
      }
    } catch (error: any) {
      console.error("Fetch Departments Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
  };

  // Load designations
  const loadDesignations = async () => {
    try {
      console.log("Fetching designations...");
      const result = await designationApi.getDesignations();
      
      console.log("Designations Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        setDesignations(result.data);
        toast.success(`Loaded ${result.data.length} designations`);
      } else {
        console.error("No designations found in response:", result);
        toast.error("No designations data available");
      }
    } catch (error: any) {
      console.error("Fetch Designations Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
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
        // The API helper already processes the response and returns { data: [...] }
        // with the correct LeaveBalance format
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

// Pre-fill employee data for all users
useEffect(() => {
  if (user) {
    setFormData(prev => ({
      ...prev,
      employeeName: `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim() || (user as any)?.name || 'Current User',
      employeeId: (user as any)?.employee_id || user?.id,
    }));
  }
}, [user]);

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

  // Load employees when component mounts
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load departments when component mounts
  useEffect(() => {
    loadDepartments();
  }, []);

  // Load designations when component mounts
  useEffect(() => {
    loadDesignations();
  }, []);

  // Find current user and set reporting managers when all data is loaded
  useEffect(() => {
    if (dialogMode !== "applications" && employees.length > 0 && departments.length > 0 && designations.length > 0) {
      findCurrentUserAndSetManagers();
    }
  }, [user, employees, departments, designations, dialogMode]);

  // Also trigger when dialog opens to ensure managers are loaded
  useEffect(() => {
    if (isDialogOpen && dialogMode !== "applications" && employees.length > 0) {
      findCurrentUserAndSetManagers();
    }
  }, [isDialogOpen, employees, dialogMode]);

  // Load leave applications when applications tab is active (but not on initial load)
  useEffect(() => {
    if (activeTab === "applications" && leaveApplications.length === 0) {
      loadLeaveApplications();
    }
  }, [activeTab]);

  const inferUserRole = (candidate: any): "admin" | "hr" | "manager" | "employee" | "" => {
    const roleText = String(candidate?.role || "").toLowerCase();
    const designationText = String(
      candidate?.designation ||
      candidate?.designationName ||
      candidate?.designation_name ||
      ""
    ).toLowerCase();
    const typeText = String(candidate?.type || "").toLowerCase();
    const departmentText = String(candidate?.department || candidate?.department_name || "").toLowerCase();
    const rolesArrayText = Array.isArray(candidate?.roles)
      ? candidate.roles.join(" ").toLowerCase()
      : "";
    const combined = `${roleText} ${designationText} ${typeText} ${departmentText} ${rolesArrayText}`.trim();

    if (candidate?.isHR || combined.includes("human resource") || combined.includes(" hr ") || combined.startsWith("hr") || combined.endsWith("hr")) return "hr";
    if (candidate?.isAdmin || combined.includes("admin")) return "admin";
    if (candidate?.isManager || combined.includes("manager") || combined.includes("lead")) return "manager";
    if (combined.includes("employee") || typeText === "employee") return "employee";
    return "";
  };

  const filterRelevantUsersForLeave = (users: any[]) => {
    const currentRoles = (user?.roles || []).map((r: string) => String(r).toLowerCase());
    const isAdminUser = currentRoles.some((r: string) => r.includes("admin"));
    const isHrUser = currentRoles.some((r: string) => r.includes("hr"));
    const isEmployeeUser = currentRoles.some((r: string) => r.includes("employee"));

    const currentUserId = String((user as any)?.employee_id || user?.id || "");
    const currentUserEmail = String((user as any)?.email || "").toLowerCase();

    const baseUsers = users.filter((u: any) => {
      const candidateId = String(u?.employeeId || u?.id || "");
      const candidateEmail = String(u?.email || "").toLowerCase();
      return candidateId !== currentUserId && candidateEmail !== currentUserEmail;
    });

    if (isAdminUser && !isHrUser) {
      const filtered = baseUsers.filter((u: any) => inferUserRole(u) === "hr");
      return filtered.length > 0 ? filtered : baseUsers.filter((u: any) => {
        const txt = `${u?.role || ""} ${u?.designation || ""} ${u?.designationName || ""} ${u?.designation_name || ""}`.toLowerCase();
        return txt.includes("hr");
      });
    }

    if (isHrUser && !isAdminUser) {
      const admins = baseUsers.filter((u: any) => inferUserRole(u) === "admin");
      if (admins.length > 0) return admins;

      const adminByText = baseUsers.filter((u: any) => {
        const txt = `${u?.role || ""} ${u?.designation || ""} ${u?.designationName || ""} ${u?.designation_name || ""}`.toLowerCase();
        return txt.includes("admin");
      });
      if (adminByText.length > 0) return adminByText;

      const managers = baseUsers.filter((u: any) => inferUserRole(u) === "manager");
      if (managers.length > 0) return managers;

      const managerByText = baseUsers.filter((u: any) => {
        const txt = `${u?.role || ""} ${u?.designation || ""} ${u?.designationName || ""} ${u?.designation_name || ""}`.toLowerCase();
        return txt.includes("manager") || txt.includes("lead");
      });
      if (managerByText.length > 0) return managerByText;

      return baseUsers;
    }

    if (isEmployeeUser && !isAdminUser && !isHrUser) {
      const filtered = baseUsers.filter((u: any) => {
        const role = inferUserRole(u);
        return role === "admin" || role === "hr" || role === "manager";
      });
      return filtered.length > 0 ? filtered : baseUsers.filter((u: any) => {
        const txt = `${u?.role || ""} ${u?.designation || ""} ${u?.designationName || ""} ${u?.designation_name || ""}`.toLowerCase();
        return txt.includes("admin") || txt.includes("hr") || txt.includes("manager") || txt.includes("lead");
      });
    }

    return baseUsers;
  };

  // Load relevant users for leave (reporting managers, HR) using the new API
  const loadLeaveUsers = async () => {
    try {
      console.log("Fetching leave users...");
      const result = await leaveTypeApi.getLeaveUsers();
      
      console.log("Leave Users Result:", result);
      
      if (result && result.error) {
        console.error("API Error:", result.error);
        toast.error(result.error);
        return;
      }
      
      if (result && result.data && Array.isArray(result.data)) {
        const filteredUsers = filterRelevantUsersForLeave(result.data);
        const currentUserId = String((user as any)?.employee_id || user?.id || "");
        const currentUserEmail = String((user as any)?.email || "").toLowerCase();
        const fallbackUsers = result.data.filter((u: any) => {
          const candidateId = String(u?.employeeId || u?.employee_id || u?.id || "");
          const candidateEmail = String(u?.email || "").toLowerCase();
          return candidateId !== currentUserId && candidateEmail !== currentUserEmail;
        });

        const finalUsers = filteredUsers.length > 0 ? filteredUsers : fallbackUsers;
        console.log("Setting reporting managers:", filteredUsers);
        if (finalUsers.length > 0) {
          setReportingManagers(finalUsers);
        } else {
          // API returned no usable approvers for this user context.
          // Clear stale data instead of keeping a previous employee's list.
          setReportingManagers([]);
        }
        
        const managerCount = finalUsers.filter((u: any) => inferUserRole(u) === "manager").length;
        const hrCount = finalUsers.filter((u: any) => inferUserRole(u) === "hr").length;
        const adminCount = finalUsers.filter((u: any) => inferUserRole(u) === "admin").length;
        
        if (filteredUsers.length > 0) {
          toast.success(`Loaded ${managerCount} manager(s), ${hrCount} HR, ${adminCount} admin`);
        } else if (fallbackUsers.length > 0) {
          toast.warning("Role mapping mismatch; loaded fallback approver list");
        } else {
          toast.warning("No approver available for your role. Please contact admin.");
        }
      } else {
        console.error("No leave users found in response:", result);
        toast.error("No relevant users found");
      }
    } catch (error: any) {
      console.error("Fetch Leave Users Error:", error);
      toast.error("Failed to connect to server: " + (error.message || "Network error"));
    }
  };

  // Load leave users when component mounts or when dialog opens for applications
  useEffect(() => {
    if (isDialogOpen && dialogMode === "applications") {
      loadLeaveUsers();
    }
  }, [isDialogOpen, dialogMode]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [selectedReportingManagers, setSelectedReportingManagers] = useState<string[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('manager-dropdown');
      const button = event.target as HTMLElement;
      
      if (dropdown && !dropdown.contains(button) && !button.closest('button')) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update form data when selected managers change
  useEffect(() => {
    if (selectedReportingManagers.length > 0) {
      const selectedManagers = reportingManagers.filter(m => selectedReportingManagers.includes(m.id));
      const managerNames = selectedManagers.map(m => m.fullName || m.name).join(', ');
      const managerEmails = selectedManagers.map(m => m.email).filter(Boolean).join(', ');
      
      setFormData(prev => ({
        ...prev,
        reportingManagerIds: selectedReportingManagers,
        reportingManagerName: managerNames,
        reportingManagerEmail: managerEmails
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        reportingManagerIds: [],
        reportingManagerName: '',
        reportingManagerEmail: ''
      }));
    }
  }, [selectedReportingManagers, reportingManagers]);

  // Toggle employee expansion
  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  // Filter functions
  const filteredLeaveTypes = useMemo(
    () => leaveTypes.filter((lt) => lt.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [leaveTypes, searchTerm]
  );

  const filteredLeaveBalances = useMemo(() => {
    let filtered = leaveBalances;

    // If user is an employee, show only their data
    if (hasRole(user, "employee") && !hasRole(user, "admin")) {
      const employeeId = getEmployeeIdForUser(user?.id || "");
      filtered = filtered.filter((lb) => lb.employeeId === employeeId);
    } else if (hasRole(user, "admin")) {
      // For admins, apply search filter to see all
      filtered = filtered.filter((lb) => 
        lb.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lb.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lb.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [leaveBalances, searchTerm, user]);

  // Group leave balances by employee for admin view
  const groupedLeaveBalances = useMemo(() => {
    const grouped: Record<string, LeaveBalance[]> = {};
    filteredLeaveBalances.forEach(lb => {
      if (!grouped[lb.employeeId]) {
        grouped[lb.employeeId] = [];
      }
      grouped[lb.employeeId].push(lb);
    });
    return grouped;
  }, [filteredLeaveBalances]);

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

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default form submission behavior
    if (e) {
      e.preventDefault();
    }
    
    if (dialogMode === "applications") {
      // Handle leave application submission
      // Attachments are optional; all other fields are required
      const employeeIdField = formData.employeeId || currentUserEmployee?.id || user?.id;
      const approversSelected = (
        (formData.reportingManagerIds && formData.reportingManagerIds.length > 0) ||
        (selectedReportingManagers && selectedReportingManagers.length > 0) ||
        !!formData.reportingManagerName
      );

      if (!employeeIdField) {
        toast.error('Employee selection is required');
        return;
      }

      if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!approversSelected) {
        toast.error('Please select at least one approver (manager or HR)');
        return;
      }

      try {
        setLoading(true);
        
        // Find the selected leave type to get its ID
        const selectedLeaveType = leaveTypes.find(lt => lt.name === formData.leaveType);
        
        if (!selectedLeaveType) {
          toast.error("Please select a valid leave type");
          return;
        }

        // Get reporting manager details from form or current user data
        const reportingManagerId = formData.reportingManagerId || currentUserEmployee?.reporting_manager_id;
        const reportingManagerName = formData.reportingManagerName || currentUserEmployee?.reporting_manager_name;
        const reportingManagerEmail = formData.reportingManagerEmail || currentUserEmployee?.reporting_manager_email;

        // Prepare leave application data in the format expected by the backend
        const leaveData = {
          leave_type_id: selectedLeaveType.id, // Use the ID instead of name
          from_date: formData.fromDate,
          to_date: formData.toDate,
          reason: formData.reason,
          employee_id: formData.employeeId || currentUserEmployee?.id || '',
          employee_name: formData.employeeName || currentUserEmployee?.name || user?.name || '',
          status: 'applied',
          days: formData.days || 1,
          // Include reporting manager details for notification
          reporting_manager_id: reportingManagerId,
          reporting_manager_name: reportingManagerName,
          reporting_manager_email: reportingManagerEmail,
          // Include leave type name for the email
          leave_type_name: selectedLeaveType.name
        };
        
        console.log("Sending leave data:", leaveData);

        // Call the applyLeave function
        const result = await leaveTypeApi.applyLeave(leaveData);
        
        if (result.error) {
          throw new Error(result.error);
        }

        toast.success("Leave application submitted successfully!");
        setIsDialogOpen(false);
        
        // Refresh the leave applications list
        await loadLeaveApplications();
        
      } catch (error: any) {
        console.error("Error applying for leave:", error);
        toast.error(error.message || "Failed to submit leave application");
      } finally {
        setLoading(false);
      }
      
      return;
    }

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
            <Button type="button" onClick={() => handleOpenDialog(undefined, "applications")} className="gap-2 h-8 sm:h-10 text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Apply Leave</span>
              <span className="sm:hidden">Apply</span>
            </Button>
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
                  <Button type="button" onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Card for Employee - removed redundant Apply Leave button */}

        
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
                {hasRole(user, "employee") && !hasRole(user, "admin") ? (
                  // Employee View - Simple and clean
                  <div className="space-y-3">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Your Leave Balances</h3>
                      {filteredLeaveBalances.length > 0 && (
                        <div className="flex items-center">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium text-sm">
                            {filteredLeaveBalances[0].employeeName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLeaveBalances.map((lb) => (
                        <div key={lb.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-blue-900">{lb.leaveType}</h4>
                            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              Available
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-700 mb-1">
                            {lb.available} days
                          </div>
                          <div className="text-xs text-blue-600">
                            Opening: {lb.opening} | Availed: {lb.availed}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Admin View - Grouped by employee
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-2 sm:space-y-3">
                      {Object.entries(groupedLeaveBalances).map(([employeeId, balances]) => (
                        <div key={employeeId} className="border border-border rounded-lg bg-muted/30">
                          <div 
                            className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleEmployeeExpansion(employeeId)}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm sm:text-base">{balances[0].employeeName}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {balances.length} leave type{balances.length > 1 ? 's' : ''}
                                </span>
                                <svg 
                                  className={`w-4 h-4 transition-transform ${expandedEmployees.has(employeeId) ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {expandedEmployees.has(employeeId) && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                              {balances.map((lb) => (
                                <div key={lb.id} className="border-t border-border pt-2 sm:pt-3">
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{lb.leaveType}</p>
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
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left px-3 py-3 font-semibold">Employee</th>
                            <th className="text-left px-3 py-3 font-semibold">Leave Types</th>
                            <th className="text-center px-3 py-3 font-semibold">Total Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedLeaveBalances).map(([employeeId, balances]) => (
                            <React.Fragment key={employeeId}>
                              <tr 
                                className="border-b border-border hover:bg-muted/50 cursor-pointer"
                                onClick={() => toggleEmployeeExpansion(employeeId)}
                              >
                                <td className="px-3 py-3 font-medium">{balances[0].employeeName}</td>
                                <td className="px-3 py-3">
                                  <span className="text-muted-foreground">
                                    {balances.length} leave type{balances.length > 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="bg-green-50 px-2 py-1 rounded font-semibold text-green-700">
                                    {balances.reduce((sum, lb) => sum + lb.available, 0)} days
                                  </span>
                                </td>
                              </tr>
                              
                              {expandedEmployees.has(employeeId) && (
                                <tr>
                                  <td colSpan={3} className="px-0 py-0">
                                    <div className="bg-muted/30 border-l-4 border-primary">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-2 font-semibold text-xs">Leave Type</th>
                                            <th className="text-center px-3 py-2 font-semibold text-xs">Opening</th>
                                            <th className="text-center px-3 py-2 font-semibold text-xs">Availed</th>
                                            <th className="text-center px-3 py-2 font-semibold text-xs">Available</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {balances.map((lb) => (
                                            <tr key={lb.id} className="border-t border-border">
                                              <td className="px-3 py-2">{lb.leaveType}</td>
                                              <td className="px-3 py-2 text-center bg-blue-50">{lb.opening}</td>
                                              <td className="px-3 py-2 text-center bg-orange-50">{lb.availed}</td>
                                              <td className="px-3 py-2 text-center bg-green-50 font-semibold">{lb.available}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                {/* Apply Leave Button for All Users */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
                  <Button type="button" onClick={() => handleOpenDialog(undefined, "applications")} className="gap-2 h-8 sm:h-10 text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Apply Leave</span>
                    <span className="sm:hidden">Apply</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => loadLeaveApplications()} 
                    className="gap-2 h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredLeaveApplications.map((la) => (
                    <div key={la.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">{la.employeeName }</h3>
                 
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
                          <span className="font-medium text-right">
                            {la.fromDate ? new Date(la.fromDate).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">To:</span>
                          <span className="font-medium text-right">
                            {la.toDate ? new Date(la.toDate).toLocaleDateString() : ''}
                          </span>
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
                        <th className="text-left px-3 py-3 font-semibold">From - To</th>
                        <th className="text-center px-3 py-3 font-semibold">Days</th>
                        <th className="text-left px-3 py-3 font-semibold">Reason</th>
                        <th className="text-left px-3 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaveApplications.map((la) => (
                        <tr key={la.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-3 font-medium">{la.employeeName }</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {la.fromDate ? new Date(la.fromDate).toLocaleDateString() : ''} → {la.toDate ? new Date(la.toDate).toLocaleDateString() : ''}
                          </td>
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
        <DialogContent className="w-full max-w-3xl max-h-[95vh] overflow-y-auto p-0 bg-white border-0 rounded-2xl shadow-2xl">
          {/* Dialog Header */}
          <DialogHeader className="relative bg-gradient-to-r from-[#17c491] via-[#14b389] to-[#0fa372] p-8 text-white rounded-t-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {editingId ? "Edit" : "Request"} {dialogMode === "types" ? "Leave Type" : "Leave Permission"}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-base mt-2 font-medium">
                  {dialogMode === "applications" 
                    ? "Fill in the details below to submit your leave request" 
                    : "Configure leave type settings and permissions"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8 bg-gray-50/50">
            {dialogMode === "types" && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Leave Type Name *
                  </Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    placeholder="e.g., Casual Leave, Sick Leave"
                  />
                </div>
                
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                  <Checkbox
                    checked={formData.isPaid || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                    className="w-6 h-6 text-blue-600 border-blue-400 rounded-lg focus:ring-blue-500/20"
                  />
                  <Label className="text-base font-semibold text-gray-800">Paid Leave</Label>
                  <span className="ml-auto text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">Recommended</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Annual Limit (days) *
                    </Label>
                    <Input
                      value={formData.annualLimit || ""}
                      onChange={(e) => setFormData({ ...formData, annualLimit: parseInt(e.target.value) || 0 })}
                      type="number"
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-sm"
                      placeholder="12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                      Carry Forward (days)
                    </Label>
                    <Input
                      value={formData.carryForward || ""}
                      onChange={(e) => setFormData({ ...formData, carryForward: parseInt(e.target.value) || 0 })}
                      type="number"
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
                  <Checkbox
                    checked={formData.encashable || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, encashable: checked })}
                    className="w-6 h-6 text-green-600 border-green-400 rounded-lg focus:ring-green-500/20"
                  />
                  <Label className="text-base font-semibold text-gray-800">Encashable</Label>
                  <span className="ml-auto text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">Optional</span>
                </div>
              </>
            )}

            {dialogMode === "applications" && (
              <>
                {/* Employee field - show current user name for all users */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-sm">
                  <Label className="text-base font-bold text-purple-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Employee Information
                  </Label>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {((formData.employeeName || (user as any)?.name || 'Current User').charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg">
                        {formData.employeeName || (user as any)?.name || 'Current User'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {(user as any)?.employee_id || user?.id ? `ID: ${(user as any)?.employee_id || user?.id}` : 'Employee'}
                      </p>
                    </div>
                    <div className="bg-purple-100 px-4 py-2 rounded-full">
                      <span className="text-purple-700 font-semibold text-sm">Current User</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Leave Type *
                  </Label>
                  <Select value={formData.leaveType || ""} onValueChange={(val) => setFormData({ ...formData, leaveType: val })}>
                    <SelectTrigger className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                      <SelectValue placeholder="Select leave type..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 max-h-60 overflow-auto border-gray-200 rounded-xl shadow-lg">
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name} className="text-base py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{type.name}</span>
                            {type.isPaid && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-bold">
                                Paid
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      From Date *
                    </Label>
                    <Input
                      value={formData.fromDate || ""}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      type="date"
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      To Date *
                    </Label>
                    <Input
                      value={formData.toDate || ""}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      type="date"
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                    Reason for Leave *
                  </Label>
                  <Input
                    value={formData.reason || ""}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    className="h-12 text-base border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                    placeholder="Please provide a reason for your leave request..."
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    Reporting Manager/HR *
                  </Label>
                  
                  {/* Multi-select Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const dropdown = document.getElementById('manager-dropdown');
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
                        }
                        
                      }}
                      className="w-full h-12 text-base border-gray-300 bg-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all px-4 py-3 text-left flex items-center justify-between hover:border-indigo-400 shadow-sm"
                      
                    >
                      <div className="flex flex-wrap gap-2">
                        {selectedReportingManagers.length > 0 ? (
                          selectedReportingManagers.map((managerId) => {
                            const manager = reportingManagers.find((r) => r.id === managerId);
                            return manager ? (
                              <span key={manager.id} className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-blue-100 px-3 py-1.5 rounded-full text-sm font-bold text-indigo-700">
                                {manager.fullName || manager.name}
                                {manager.role === 'hr' && <span className="text-indigo-600 font-bold">(HR)</span>}
                                {manager.role === 'manager' && <span className="text-green-600 font-bold">(M)</span>}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-gray-400">Select manager(s) or HR...</span>
                        )}
                      </div>
                      <span className="ml-2 text-gray-400 text-lg">▼</span>
                    </button>
                    
                    {/* Dropdown Content */}
                    <div id="manager-dropdown" className="hidden absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-auto">
                      {reportingManagers.length > 0 ? (
                        reportingManagers.map((manager) => (
                          <div
                            key={manager.id}
                            className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 cursor-pointer border-b last:border-b-0 transition-all"
                            onClick={() => {
                              const isSelected = selectedReportingManagers.includes(manager.id);
                              if (isSelected) {
                                setSelectedReportingManagers(prev => prev.filter(id => id !== manager.id));
                              } else {
                                setSelectedReportingManagers(prev => [...prev, manager.id]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={selectedReportingManagers.includes(manager.id)}
                              onChange={() => {}}
                              className="w-5 h-5 text-indigo-600 border-gray-400 rounded-lg focus:ring-indigo-500/20"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {(manager.fullName || manager.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col items-start flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-800">{manager.fullName || manager.name}</span>
                                  {manager.role === 'hr' && (
                                    <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 text-xs rounded-full font-bold">
                                      HR
                                    </span>
                                  )}
                                  {manager.role === 'manager' && (
                                    <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs rounded-full font-bold">
                                      Manager
                                    </span>
                                  )}
                                </div>
                                {(manager.designation || manager.department) && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    {manager.designation && `${manager.designation}`}
                                    {manager.designation && manager.department && ' • '}
                                    {manager.department && `${manager.department}`}
                                  </span>
                                )}
                                {manager.email && (
                                  <span className="text-xs text-gray-400">
                                    {manager.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-sm text-gray-500 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-2xl">👥</span>
                            </div>
                            <span className="font-bold text-gray-700">No approvers found</span>
                            <span className="text-xs text-gray-400">Contact admin to set up reporting structure</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {formData.reportingManagerName && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-sm">
                    <p className="text-base font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      Selected Approver(s):
                    </p>
                    <div className="space-y-3">
                      <p className="text-base font-bold text-gray-800">
                        {formData.reportingManagerName}
                      </p>
                      {formData.reportingManagerEmail && (
                        <p className="text-sm text-gray-600">{formData.reportingManagerEmail}</p>
                      )}
                      <p className="text-sm text-blue-700 mt-4 font-bold bg-blue-100 px-4 py-2 rounded-lg inline-block">
                        {hasRole(user, 'admin') || hasRole(user, 'manager') 
                          ? `You will be notified about this leave application (${selectedReportingManagers.length} recipient${selectedReportingManagers.length > 1 ? 's' : ''})`
                          : `Email will be sent on submission (${selectedReportingManagers.length} recipient${selectedReportingManagers.length > 1 ? 's' : ''})`
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                    Attachment (Optional)
                  </Label>
                  <label className="flex items-center gap-4 px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-base text-gray-600 group-hover:text-blue-600 transition-colors font-medium">Choose file or drag and drop...</span>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end p-8 pt-0 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-b-2xl">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              className="w-full sm:w-auto h-12 text-base font-bold border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all rounded-xl px-8"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSave} 
              className="w-full sm:w-auto h-12 text-base font-bold bg-gradient-to-r from-[#17c491] via-[#14b389] to-[#0fa372] text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 rounded-xl px-8"
            >
              {dialogMode === "applications" ? "Submit Request" : "Save"}
            </Button>
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
