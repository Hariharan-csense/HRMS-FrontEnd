import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useRole } from "@/context/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, Building2, AlertCircle, Upload, X, Hash } from "lucide-react";
import { companyApi, Company } from "@/components/helper/company/company";
import { branchApi, Branch } from "@/components/helper/branch/branch";
import { departmentApi, Department } from "@/components/helper/department/department";
import { designationApi, Designation } from "@/components/helper/designation/designation";
import { roleApi, Role, ModulePermission } from "@/components/helper/roles/roles";
import { sequenceApi, Sequence } from "@/components/helper/range/range";

// Mock Data
const mockCompany: Company = {
  id: "CMP001",
  companyId: "CMP001",
  name: "TechCorp Solutions",
  legalName: "TechCorp Solutions Pvt Ltd",
  gstin: "18AABCT1234H1Z0",
  industry: "Information Technology",
  address: "123 Tech Park, Bangalore, India",
  payrollCycle: "Monthly",
  timezone: "IST",
  createdAt: "2024-01-01",
};

const mockBranches: Branch[] = [
  {
    id: "B001",
    name: "Bangalore HQ",
    address: "123 Tech Park, Bangalore",
    coordinates: "12.9716,77.5946",
    radius: 5,
  },
  {
    id: "B002",
    name: "Delhi Office",
    address: "456 Business Tower, Delhi",
    coordinates: "28.6139,77.2090",
    radius: 3,
  },
];

const mockDepartments: Department[] = [
  { id: "D001", name: "Engineering", costCenter: "CC001", head: "Sarah Smith" },
  { id: "D002", name: "Sales", costCenter: "CC002", head: "Emma Wilson" },
  { id: "D003", name: "HR", costCenter: "CC003", head: "David Brown" },
];

const mockDesignations: Designation[] = [
  { id: "DG001", name: "Junior Developer", level: "1" },
  { id: "DG002", name: "Senior Developer", level: "2" },
  { id: "DG003", name: "Manager", level: "3" },
];

const mockRoles: Role[] = [
  {
    id: "R001",
    name: "Admin",
    modules: {
      employees: { view: true, create: true, edit: true, approve: true },
      payroll: { view: true, create: true, edit: true, approve: true },
      attendance: { view: true, create: true, edit: true, approve: true },
      leave: { view: true, create: true, edit: true, approve: true },
      expenses: { view: true, create: true, edit: true, approve: true },
      assets: { view: true, create: true, edit: true, approve: true },
      exit: { view: true, create: true, edit: true, approve: true },
      reports: { view: true, create: true, edit: true, approve: true },
      organization: { view: true, create: true, edit: true, approve: true },
    },
    approvalAuthority: "Full Authority",
    dataVisibility: "All Employees",
  },
  {
    id: "R002",
    name: "HR Manager",
    modules: {
      employees: { view: true, create: true, edit: true, approve: false },
      payroll: { view: true, create: false, edit: false, approve: false },
      attendance: { view: true, create: false, edit: false, approve: false },
      leave: { view: true, create: false, edit: false, approve: true },
      expenses: { view: true, create: false, edit: false, approve: false },
      assets: { view: true, create: true, edit: true, approve: false },
      exit: { view: true, create: false, edit: false, approve: false },
      reports: { view: true, create: false, edit: false, approve: false },
      organization: { view: false, create: false, edit: false, approve: false },
    },
    approvalAuthority: "Leave Requests",
    dataVisibility: "Department Employees",
  },
  {
    id: "R003",
    name: "Manager",
    modules: {
      employees: { view: true, create: false, edit: false, approve: false },
      payroll: { view: true, create: false, edit: false, approve: false },
      attendance: { view: true, create: false, edit: false, approve: false },
      leave: { view: true, create: false, edit: false, approve: true },
      expenses: { view: false, create: false, edit: false, approve: false },
      assets: { view: false, create: false, edit: false, approve: false },
      exit: { view: false, create: false, edit: false, approve: false },
      reports: { view: true, create: false, edit: false, approve: false },
      organization: { view: false, create: false, edit: false, approve: false },
    },
    approvalAuthority: "Leave Requests",
    dataVisibility: "Team Members",
  },
  {
    id: "R004",
    name: "Finance",
    modules: {
      employees: { view: true, create: false, edit: false, approve: false },
      payroll: { view: true, create: true, edit: true, approve: true },
      attendance: { view: false, create: false, edit: false, approve: false },
      leave: { view: false, create: false, edit: false, approve: false },
      expenses: { view: true, create: false, edit: false, approve: true },
      assets: { view: false, create: false, edit: false, approve: false },
      exit: { view: false, create: false, edit: false, approve: false },
      reports: { view: true, create: false, edit: false, approve: false },
      organization: { view: false, create: false, edit: false, approve: false },
    },
    approvalAuthority: "Expense Claims",
    dataVisibility: "All Employees",
  },
  {
    id: "R005",
    name: "Employee",
    modules: {
      employees: { view: false, create: false, edit: false, approve: false },
      payroll: { view: false, create: false, edit: false, approve: false },
      attendance: { view: true, create: true, edit: false, approve: false },
      leave: { view: true, create: true, edit: false, approve: false },
      expenses: { view: true, create: true, edit: true, approve: false },
      assets: { view: true, create: false, edit: false, approve: false },
      exit: { view: false, create: false, edit: false, approve: false },
      reports: { view: false, create: false, edit: false, approve: false },
      organization: { view: false, create: false, edit: false, approve: false },
    },
    approvalAuthority: "No Authority",
    dataVisibility: "Self Only",
  },
];

const mockSequences: Sequence[] = [
  {
    id: 1,
    company_id: 2,
    module: "employee",
    prefix: "EMP",
    start_number: 100,
    current_number: 0,
    number_length: 4,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:42.000Z",
  },
  {
    id: 2,
    company_id: 2,
    module: "leave",
    prefix: "LV",
    start_number: 1,
    current_number: 0,
    number_length: 4,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 3,
    company_id: 2,
    module: "expense",
    prefix: "EXP",
    start_number: 1,
    current_number: 0,
    number_length: 5,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 4,
    company_id: 2,
    module: "asset",
    prefix: "AST",
    start_number: 1,
    current_number: 1,
    number_length: 4,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:50.000Z",
  },
  {
    id: 5,
    company_id: 2,
    module: "branch",
    prefix: "BR",
    start_number: 1,
    current_number: 0,
    number_length: 3,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 6,
    company_id: 2,
    module: "department",
    prefix: "DEP",
    start_number: 1,
    current_number: 1,
    number_length: 3,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 7,
    company_id: 2,
    module: "designation",
    prefix: "DES",
    start_number: 1,
    current_number: 0,
    number_length: 3,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 8,
    company_id: 2,
    module: "role",
    prefix: "ROLE",
    start_number: 1,
    current_number: 0,
    number_length: 2,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
  {
    id: 9,
    company_id: 2,
    module: "costcenter",
    prefix: "CC",
    start_number: 1,
    current_number: 1,
    number_length: 4,
    created_at: "2025-12-29T10:45:19.000Z",
    updated_at: "2025-12-29T10:45:19.000Z",
  },
];

const modulesList = ["Employees", "Payroll", "Attendance", "Leave", "Expenses", "Assets", "Exit", "Reports", "Organization"];

export default function OrganizationSetup() {
  const location = useLocation();
  //const { setRoles: setRolesInContext } = useRole();
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Detect route and set active tab
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.includes("/branches")) {
      setActiveTab("branches");
    } else if (pathname.includes("/departments")) {
      setActiveTab("departments");
    } else if (pathname.includes("/designations")) {
      setActiveTab("designations");
    } else if (pathname.includes("/roles")) {
      setActiveTab("roles");
    } else if (pathname.includes("/sequences")) {
      setActiveTab("sequences");
    } else {
      setActiveTab("company");
    }
  }, [location.pathname]);

  // Data fetching functions
  const fetchCompany = async () => {
    setLoading(prev => ({ ...prev, company: true }));
    setError(prev => ({ ...prev, company: '' }));
    try {
      const result = await companyApi.getCompany();
      if (result.data) {
        setCompany(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, company: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, company: 'Failed to fetch company data' }));
    } finally {
      setLoading(prev => ({ ...prev, company: false }));
    }
  };

  const fetchBranches = async () => {
    setLoading(prev => ({ ...prev, branches: true }));
    setError(prev => ({ ...prev, branches: '' }));
    try {
      const result = await branchApi.getBranches();
      if (result.data) {
        setBranches(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, branches: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, branches: 'Failed to fetch branches' }));
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  };

  const fetchDepartments = async () => {
    setLoading(prev => ({ ...prev, departments: true }));
    setError(prev => ({ ...prev, departments: '' }));
    try {
      const result = await departmentApi.getdepartment();
      if (result.data) {
        setDepartments(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, departments: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, departments: 'Failed to fetch departments' }));
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  };

  const fetchDesignations = async () => {
    setLoading(prev => ({ ...prev, designations: true }));
    setError(prev => ({ ...prev, designations: '' }));
    try {
      const result = await designationApi.getDesignations();
      if (result.data) {
        setDesignations(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, designations: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, designations: 'Failed to fetch designations' }));
    } finally {
      setLoading(prev => ({ ...prev, designations: false }));
    }
  };

  const fetchRoles = async () => {
    setLoading(prev => ({ ...prev, roles: true }));
    setError(prev => ({ ...prev, roles: '' }));
    try {
      const result = await roleApi.getRoles();
      if (result.data) {
        setRoles(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, roles: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, roles: 'Failed to fetch roles' }));
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const fetchSequences = async () => {
    setLoading(prev => ({ ...prev, sequences: true }));
    setError(prev => ({ ...prev, sequences: '' }));
    try {
      const result = await sequenceApi.getSequences();
      if (result.data) {
        setSequences(result.data);
      } else if (result.error) {
        setError(prev => ({ ...prev, sequences: result.error }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, sequences: 'Failed to fetch sequences' }));
    } finally {
      setLoading(prev => ({ ...prev, sequences: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCompany();
    fetchBranches();
    fetchDepartments();
    fetchDesignations();
    fetchRoles();
    fetchSequences();
  }, []);

  // Sync roles with RoleContext whenever they change

  // Filter functions
  const filteredBranches = useMemo(
    () => branches.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [branches, searchTerm]
  );

  const filteredDepartments = useMemo(
    () => departments.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [departments, searchTerm]
  );

  const filteredDesignations = useMemo(
    () => designations.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [designations, searchTerm]
  );

  const filteredRoles = useMemo(
    () => roles.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [roles, searchTerm]
  );

  const filteredSequences = useMemo(
    () => sequences.filter((s) =>
      s.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prefix.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sequences, searchTerm]
  );

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name && activeTab !== "company" && activeTab !== "sequences") {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (activeTab === "company") {
        if (company?.id) {
          const result = await companyApi.updateCompany(company.id, formData);
          if (result.data) {
            setCompany(result.data);
            await fetchCompany();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      } else if (activeTab === "branches") {
        if (editingId) {
          const result = await branchApi.updateBranch(editingId, formData);
          if (result.data) {
            await fetchBranches();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        } else {
          const result = await branchApi.createBranch(formData);
          if (result.data) {
            await fetchBranches();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      } else if (activeTab === "departments") {
        if (editingId) {
          const result = await departmentApi.updateDepartment(editingId, formData);
          if (result.data) {
            await fetchDepartments();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        } else {
          const result = await departmentApi.createDepartment(formData);
          if (result.data) {
            await fetchDepartments();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      } else if (activeTab === "designations") {
        const data = {
          name: formData.name,
          level_grade: formData.level
        };
        if (editingId) {
          const result = await designationApi.updateDesignation(editingId, data);
          if (result.data) {
            await fetchDesignations();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        } else {
          const result = await designationApi.createDesignation(data);
          if (result.data) {
            await fetchDesignations();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      } else if (activeTab === "roles") {
        if (editingId) {
          const result = await roleApi.updateRole(editingId, formData);
          if (result.data) {
            await fetchRoles();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        } else {
          const result = await roleApi.createRole(formData);
          if (result.data) {
            await fetchRoles();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      } else if (activeTab === "sequences") {
        if (editingId) {
          const result = await sequenceApi.updateSequence(editingId, formData);
          if (result.data) {
            await fetchSequences();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        } else {
          const result = await sequenceApi.createSequence(formData);
          if (result.data) {
            await fetchSequences();
          } else if (result.error) {
            alert(result.error);
            return;
          }
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      alert("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      if (activeTab === "branches") {
        const result = await branchApi.deleteBranch(deleteId);
        if (result.success) {
          await fetchBranches();
        } else if (result.error) {
          alert(result.error);
          return;
        }
      } else if (activeTab === "departments") {
        const result = await departmentApi.deleteDepartment(deleteId);
        if (result.success) {
          await fetchDepartments();
        } else if (result.error) {
          alert(result.error);
          return;
        }
      } else if (activeTab === "designations") {
        const result = await designationApi.deleteDesignation(deleteId);
        if (result.success) {
          await fetchDesignations();
        } else if (result.error) {
          alert(result.error);
          return;
        }
      } else if (activeTab === "roles") {
        const result = await roleApi.deleteRole(deleteId);
        if (result.success) {
          await fetchRoles();
        } else if (result.error) {
          alert(result.error);
          return;
        }
      } else if (activeTab === "sequences") {
        const result = await sequenceApi.deleteSequence(deleteId);
        if (result.success) {
          await fetchSequences();
        } else if (result.error) {
          alert(result.error);
          return;
        }
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      alert("An error occurred while deleting. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModulePermissionChange = (
    module: string,
    permission: "view" | "create" | "edit" | "approve",
    checked: boolean
  ) => {
    const modules = formData.modules || {};
    if (!modules[module]) {
      modules[module] = { view: false, create: false, edit: false, approve: false };
    }
    modules[module][permission] = checked;
    setFormData({ ...formData, modules });
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-6 md:w-8 h-6 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">Organization & Master Setup</span>
            <span className="sm:hidden">Organization Setup</span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Configure company structure, master data, and access controls</p>
        </div>

        {/* Search Card (hidden for Company tab) */}
        {activeTab !== "company" && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Button onClick={() => handleOpenDialog()} disabled={loading[activeTab]} className="gap-2 whitespace-nowrap">
                  {loading[activeTab] ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  ) : (
                    <Plus className="w-4 h-4 hidden sm:inline" />
                  )}
                  <span className="hidden sm:inline">{loading[activeTab] ? 'Loading...' : 'Add'}</span>
                  <span className="sm:hidden">{loading[activeTab] ? '+' : '+'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 bg-muted p-1 h-auto min-w-max md:min-w-full">
              <TabsTrigger value="company" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">Company</TabsTrigger>
              <TabsTrigger value="branches" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">Branches</span>
                <span className="sm:hidden">Branch</span>
                <span className="hidden md:inline"> ({branches.length})</span>
              </TabsTrigger>
              <TabsTrigger value="departments" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">Departments</span>
                <span className="sm:hidden">Depts</span>
                <span className="hidden md:inline"> ({departments.length})</span>
              </TabsTrigger>
              <TabsTrigger value="designations" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">Designations</span>
                <span className="sm:hidden">Desig</span>
                <span className="hidden md:inline"> ({designations.length})</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">Roles <span className="hidden md:inline">({roles.length})</span></TabsTrigger>
              <TabsTrigger value="sequences" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">Sequences</span>
                <span className="sm:hidden">Seq</span>
                <span className="hidden md:inline"> ({sequences.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Company Master</CardTitle>
                <CardDescription className="text-xs md:text-sm">Configure company information and settings</CardDescription>
              </CardHeader>
              <CardContent>
                {error.company && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error.company}</p>
                  </div>
                )}
                {loading.company ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading company data...</span>
                  </div>
                ) : company ? (
                  <div className="space-y-4 md:space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="min-w-0">
                        <Label className="text-xs md:text-sm font-semibold block">Company ID</Label>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.companyId}</p>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-xs md:text-sm font-semibold block">Company Name</Label>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.name}</p>
                      </div>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="min-w-0">
                      <Label className="text-xs md:text-sm font-semibold block">Legal Name</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.legalName}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs md:text-sm font-semibold block">GSTIN/PAN</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.gstin}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="min-w-0">
                      <Label className="text-xs md:text-sm font-semibold block">Industry</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.industry}</p>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs md:text-sm font-semibold block">Timezone</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.timezone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="min-w-0">
                      <Label className="text-xs md:text-sm font-semibold block">Payroll Cycle</Label>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.payrollCycle}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Label className="text-xs md:text-sm font-semibold block">Address</Label>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{company.address}</p>
                  </div>
                  <Button onClick={() => handleOpenDialog(company)} className="w-full md:w-auto text-xs md:text-sm py-2 md:py-2.5">
                    Edit Company
                  </Button>
                </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches">
            <Card>
              <CardContent className="pt-6">
                {error.branches && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error.branches}</p>
                  </div>
                )}
                {loading.branches ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading branches...</span>
                  </div>
                ) : (
                  <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredBranches.map((branch) => (
                    <div key={branch.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{branch.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(branch)}
                            className="p-1 sm:p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id)}
                            className="p-1 sm:p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Address:</span>
                          <span className="font-medium text-right">{branch.address}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Coordinates:</span>
                          <span className="font-medium text-xs">{branch.coordinates}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Radius:</span>
                          <span className="font-medium">{branch.radius} km</span>
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
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Address</th>
                        <th className="text-left px-3 py-2 font-semibold">Coordinates</th>
                        <th className="text-left px-3 py-2 font-semibold">Radius</th>
                        <th className="text-left px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranches.map((branch) => (
                        <tr key={branch.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium">{branch.name}</td>
                          <td className="px-3 py-2 text-xs">{branch.address}</td>
                          <td className="px-3 py-2 text-xs">{branch.coordinates}</td>
                          <td className="px-3 py-2 text-xs">{branch.radius} km</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(branch)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(branch.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card>
              <CardContent className="pt-6">
                {error.departments && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error.departments}</p>
                  </div>
                )}
                {loading.departments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading departments...</span>
                  </div>
                ) : (
                  <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredDepartments.map((dept) => (
                    <div key={dept.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{dept.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(dept)}
                            className="p-1 sm:p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="p-1 sm:p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Cost Center:</span>
                          <span className="font-medium">{dept.costCenter}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Head:</span>
                          <span className="font-medium">{dept.head}</span>
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
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Cost Center</th>
                        <th className="text-left px-3 py-2 font-semibold">Head</th>
                        <th className="text-left px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium">{dept.name}</td>
                          <td className="px-3 py-2 text-xs">{dept.costCenter}</td>
                          <td className="px-3 py-2 text-xs">{dept.head}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(dept)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(dept.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Designations Tab */}
          <TabsContent value="designations">
            <Card>
              <CardContent className="pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredDesignations.map((des) => (
                    <div key={des.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{des.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(des)}
                            className="p-1 sm:p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(des.id)}
                            className="p-1 sm:p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Level/Grade:</span>
                          <span className="font-medium">Level {des.level}</span>
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
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Level/Grade</th>
                        <th className="text-left px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDesignations.map((des) => (
                        <tr key={des.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium">{des.name}</td>
                          <td className="px-3 py-2 text-xs">Level {des.level}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(des)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(des.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card>
              <CardContent className="pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredRoles.map((role) => {
                    const allowedModules = Object.entries(role.modules || {})
                      .filter(([_, perms]) => Object.values(perms).some(p => p))
                      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
                    return (
                      <div key={role.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                          <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{role.name}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenDialog(role)}
                              className="p-1 sm:p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="p-1 sm:p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground flex-shrink-0">Approval Authority:</span>
                            <span className="font-medium text-right">{role.approvalAuthority}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground flex-shrink-0">Data Visibility:</span>
                            <span className="font-medium text-right">{role.dataVisibility}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs font-medium block mb-1">Modules:</span>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {allowedModules.map((module) => (
                                <span key={module} className="bg-primary/15 text-primary px-2 py-0.5 sm:py-1 rounded text-xs font-medium whitespace-nowrap">
                                  {module}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2 font-semibold">Role Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Approval Authority</th>
                        <th className="text-left px-3 py-2 font-semibold">Data Visibility</th>
                        <th className="text-left px-3 py-2 font-semibold">Modules</th>
                        <th className="text-left px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((role) => {
                        const allowedModules = Object.entries(role.modules || {})
                          .filter(([_, perms]) => Object.values(perms).some(p => p))
                          .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
                        return (
                          <tr key={role.id} className="border-b border-border hover:bg-muted/50">
                            <td className="px-3 py-2 font-medium whitespace-nowrap">{role.name}</td>
                            <td className="px-3 py-2 text-xs whitespace-nowrap">{role.approvalAuthority}</td>
                            <td className="px-3 py-2 text-xs whitespace-nowrap">{role.dataVisibility}</td>
                            <td className="px-3 py-2 text-xs">
                              <div className="flex flex-wrap gap-1">
                                {allowedModules.map((module) => (
                                  <span key={module} className="bg-primary/15 text-primary px-2 py-1 rounded text-xs font-medium">
                                    {module}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenDialog(role)}
                                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(role.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences">
            <Card>
              <CardContent className="pt-6">
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredSequences.map((seq) => (
                    <div key={seq.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base break-words capitalize">{seq.module}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Prefix: <span className="font-mono font-semibold text-foreground">{seq.prefix}</span></p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(seq)}
                            className="p-1 sm:p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(seq.id.toString())}
                            className="p-1 sm:p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm bg-white dark:bg-slate-950 rounded p-2 sm:p-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Start:</span>
                          <span className="font-medium">{seq.start_number}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Current:</span>
                          <span className="font-medium">{seq.current_number}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Length:</span>
                          <span className="font-medium">{seq.number_length} digits</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <span className="text-muted-foreground text-xs block mb-1">Sample:</span>
                          <span className="font-mono text-xs sm:text-sm font-semibold">{seq.prefix}{String(seq.current_number).padStart(seq.number_length, "0")}</span>
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
                        <th className="text-left px-3 py-2 font-semibold">Module</th>
                        <th className="text-left px-3 py-2 font-semibold">Prefix</th>
                        <th className="text-center px-3 py-2 font-semibold">Start</th>
                        <th className="text-center px-3 py-2 font-semibold">Current</th>
                        <th className="text-center px-3 py-2 font-semibold">Length</th>
                        <th className="text-left px-3 py-2 font-semibold">Sample Format</th>
                        <th className="text-left px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSequences.map((seq) => (
                        <tr key={seq.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium capitalize">{seq.module}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary">{seq.prefix}</td>
                          <td className="px-3 py-2 text-center">{seq.start_number}</td>
                          <td className="px-3 py-2 text-center">{seq.current_number}</td>
                          <td className="px-3 py-2 text-center">{seq.number_length} digits</td>
                          <td className="px-3 py-2 font-mono text-xs bg-muted/30 px-2 py-1 rounded">{seq.prefix}{String(seq.current_number).padStart(seq.number_length, "0")}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(seq)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(seq.id.toString())}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add New"} {activeTab === "company" ? "Company" : activeTab === "branches" ? "Branch" : activeTab === "departments" ? "Department" : activeTab === "designations" ? "Designation" : activeTab === "roles" ? "Role" : "Sequence"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "company" && (
              <>
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Legal Name *</Label>
                  <Input
                    value={formData.legalName || ""}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN/PAN *</Label>
                    <Input
                      value={formData.gstin || ""}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <Input
                      value={formData.industry || ""}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payroll Cycle *</Label>
                    <Select value={formData.payrollCycle || ""} onValueChange={(val) => setFormData({ ...formData, payrollCycle: val })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timezone *</Label>
                    <Select value={formData.timezone || ""} onValueChange={(val) => setFormData({ ...formData, timezone: val })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IST">IST (India)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">EST (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-2">
                    {formData.logo && (
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={typeof formData.logo === 'string' && formData.logo.startsWith('data:') ? formData.logo : undefined}
                          alt="Company Logo"
                          className="w-12 h-12 rounded border"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, logo: undefined })}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Upload Logo</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleLogoUpload}
                        accept="image/*"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === "branches" && (
              <>
                <div>
                  <Label>Branch Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Coordinates *</Label>
                    <Input
                      value={formData.coordinates || ""}
                      onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                      placeholder="e.g., 12.9716,77.5946"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Radius (km) *</Label>
                  <Input
                    value={formData.radius || ""}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    type="number"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {activeTab === "departments" && (
              <>
                <div>
                  <Label>Department Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Cost Center *</Label>
                  <Input
                    value={formData.costCenter || ""}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    placeholder="e.g., CC001"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Department Head *</Label>
                  <Select value={formData.head || ""} onValueChange={(val) => setFormData({ ...formData, head: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Smith">Sarah Smith</SelectItem>
                      <SelectItem value="Emma Wilson">Emma Wilson</SelectItem>
                      <SelectItem value="David Brown">David Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeTab === "designations" && (
              <>
                <div>
                  <Label>Designation Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Level/Grade *</Label>
                  <Select value={formData.level || ""} onValueChange={(val) => setFormData({ ...formData, level: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 (Entry)</SelectItem>
                      <SelectItem value="2">Level 2 (Mid)</SelectItem>
                      <SelectItem value="3">Level 3 (Senior)</SelectItem>
                      <SelectItem value="4">Level 4 (Lead)</SelectItem>
                      <SelectItem value="5">Level 5 (Manager)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeTab === "roles" && (
              <>
                <div>
                  <Label>Role Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Approval Authority *</Label>
                  <Select value={formData.approvalAuthority || ""} onValueChange={(val) => setFormData({ ...formData, approvalAuthority: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Authority">Full Authority</SelectItem>
                      <SelectItem value="Leave Requests">Leave Requests</SelectItem>
                      <SelectItem value="Expense Claims">Expense Claims</SelectItem>
                      <SelectItem value="No Authority">No Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Visibility Scope *</Label>
                  <Select value={formData.dataVisibility || ""} onValueChange={(val) => setFormData({ ...formData, dataVisibility: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Employees">All Employees</SelectItem>
                      <SelectItem value="Department Employees">Department Employees</SelectItem>
                      <SelectItem value="Reporting Line">Reporting Line</SelectItem>
                      <SelectItem value="Self Only">Self Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Module Access Checkboxes */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Module Access</Label>
                  <p className="text-xs text-muted-foreground mb-4">Configure permissions for each module</p>
                  <div className="space-y-3">
                    {modulesList.map((module) => (
                      <div key={module} className="border rounded-lg p-3">
                        <p className="font-medium text-sm mb-2">{module}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {["view", "create", "edit", "approve"].map((permission) => (
                            <label key={permission} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.modules?.[module.toLowerCase()]?.[permission as "view" | "create" | "edit" | "approve"] || false}
                                onCheckedChange={(checked) =>
                                  handleModulePermissionChange(module.toLowerCase(), permission as "view" | "create" | "edit" | "approve", checked as boolean)
                                }
                              />
                              <span className="text-sm capitalize">{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "sequences" && (
              <>
                <div>
                  <Label>Module Name *</Label>
                  <Input
                    value={formData.module || ""}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    placeholder="e.g., employee"
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prefix *</Label>
                    <Input
                      value={formData.prefix || ""}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                      placeholder="e.g., EMP"
                      className="mt-2 uppercase"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>Start Number *</Label>
                    <Input
                      value={formData.start_number || ""}
                      onChange={(e) => setFormData({ ...formData, start_number: parseInt(e.target.value) || 0 })}
                      type="number"
                      placeholder="e.g., 100"
                      className="mt-2"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Number *</Label>
                    <Input
                      value={formData.current_number || ""}
                      onChange={(e) => setFormData({ ...formData, current_number: parseInt(e.target.value) || 0 })}
                      type="number"
                      placeholder="e.g., 0"
                      className="mt-2"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Number Length (digits) *</Label>
                    <Input
                      value={formData.number_length || ""}
                      onChange={(e) => setFormData({ ...formData, number_length: parseInt(e.target.value) || 0 })}
                      type="number"
                      placeholder="e.g., 4"
                      className="mt-2"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <p className="text-lg font-mono">
                    {formData.prefix || "PREFIX"}{String(formData.currentNumber || 0).padStart(formData.numberLength || 4, "0")}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
