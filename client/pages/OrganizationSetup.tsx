import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  AlertCircle,
  Upload,
  X,
  FileText,
  Hash,
} from "lucide-react";
import { companyApi, Company } from "@/components/helper/company/company";
import { branchApi, Branch } from "@/components/helper/branch/branch";
import {
  departmentApi,
  Department,
} from "@/components/helper/department/department";
import {
  designationApi,
  Designation,
} from "@/components/helper/designation/designation";
import { employeeApi, Employee } from "@/components/helper/employee/employee";
import {
  companyPolicyApi,
  CompanyPolicy,
  defaultCompanyPolicy,
} from "@/components/helper/companyPolicy/companyPolicy";
import { showToast } from "@/utils/toast";
import { resolveFileUrl } from "@/lib/endpoint";

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
  payrollStartDay: 1,
  payrollEndDay: 31,
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
  {
    id: "D001",
    name: "Engineering",
    costCenter: "CC001",
    head: "Sarah Smith",
    headId: "1",
  },
  {
    id: "D002",
    name: "Sales",
    costCenter: "CC002",
    head: "Emma Wilson",
    headId: "2",
  },
  {
    id: "D003",
    name: "HR",
    costCenter: "CC003",
    head: "David Brown",
    headId: "3",
  },
];

const mockDesignations: Designation[] = [
  { id: "DG001", name: "Junior Developer" },
  { id: "DG002", name: "Senior Developer" },
  { id: "DG003", name: "Manager" },
];

export default function OrganizationSetup() {
  const location = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [companyPolicy, setCompanyPolicy] =
    useState<CompanyPolicy>(defaultCompanyPolicy);
  const [employees, setEmployees] = useState<Employee[]>([]);

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
    } else if (pathname.includes("/policies")) {
      setActiveTab("policies");
    } else {
      setActiveTab("company");
    }
  }, [location.pathname]);

  // Data fetching functions
  const fetchCompany = async () => {
    setLoading((prev) => ({ ...prev, company: true }));
    setError((prev) => ({ ...prev, company: "" }));
    try {
      const result = await companyApi.getCompany();
      if (result.data) {
        setCompany(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, company: result.error }));
      }
    } catch (err) {
      setError((prev) => ({
        ...prev,
        company: "Failed to fetch company data",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, company: false }));
    }
  };

  const fetchBranches = async () => {
    setLoading((prev) => ({ ...prev, branches: true }));
    setError((prev) => ({ ...prev, branches: "" }));
    try {
      const result = await branchApi.getBranches();
      if (result.data) {
        setBranches(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, branches: result.error }));
      }
    } catch (err) {
      setError((prev) => ({ ...prev, branches: "Failed to fetch branches" }));
    } finally {
      setLoading((prev) => ({ ...prev, branches: false }));
    }
  };

  const fetchDepartments = async () => {
    setLoading((prev) => ({ ...prev, departments: true }));
    setError((prev) => ({ ...prev, departments: "" }));
    try {
      const result = await departmentApi.getdepartment();
      if (result.data) {
        setDepartments(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, departments: result.error }));
      }
    } catch (err) {
      setError((prev) => ({
        ...prev,
        departments: "Failed to fetch departments",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, departments: false }));
    }
  };

  const fetchDesignations = async () => {
    setLoading((prev) => ({ ...prev, designations: true }));
    setError((prev) => ({ ...prev, designations: "" }));
    try {
      const result = await designationApi.getDesignations();
      if (result.data) {
        setDesignations(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, designations: result.error }));
      }
    } catch (err) {
      setError((prev) => ({
        ...prev,
        designations: "Failed to fetch designations",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, designations: false }));
    }
  };

  const fetchCompanyPolicy = async () => {
    setLoading((prev) => ({ ...prev, policies: true }));
    setError((prev) => ({ ...prev, policies: "" }));
    try {
      const result = await companyPolicyApi.getPolicy();
      if (result.data) {
        setCompanyPolicy(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, policies: result.error }));
      }
    } catch (err) {
      setError((prev) => ({ ...prev, policies: "Failed to fetch policy" }));
    } finally {
      setLoading((prev) => ({ ...prev, policies: false }));
    }
  };

  const fetchEmployees = async () => {
    setLoading((prev) => ({ ...prev, employees: true }));
    setError((prev) => ({ ...prev, employees: "" }));
    try {
      const result = await employeeApi.getEmployees();
      if (result.data) {
        setEmployees(result.data);
      } else if (result.error) {
        setError((prev) => ({ ...prev, employees: result.error }));
      }
    } catch (err) {
      setError((prev) => ({ ...prev, employees: "Failed to fetch employees" }));
    } finally {
      setLoading((prev) => ({ ...prev, employees: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCompany();
    fetchBranches();
    fetchDepartments();
    fetchDesignations();
    fetchCompanyPolicy();
    fetchEmployees();
  }, []);

  // Filter functions
  const filteredBranches = useMemo(
    () =>
      branches.filter((b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [branches, searchTerm],
  );

  const filteredDepartments = useMemo(
    () =>
      departments.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [departments, searchTerm],
  );

  const filteredDesignations = useMemo(
    () =>
      designations.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [designations, searchTerm],
  );

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    if (activeTab === "departments") {
      fetchEmployees();
    }
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
    if (
      !formData.name &&
      activeTab !== "company" &&
      activeTab !== "policies"
    ) {
      showToast.error("Please fill in all required fields");
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
            showToast.error(result.error);
            return;
          }
        }
      } else if (activeTab === "branches") {
        if (editingId) {
          const result = await branchApi.updateBranch(editingId, formData);
          if (result.data) {
            await fetchBranches();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        } else {
          const result = await branchApi.createBranch(formData);
          if (result.data) {
            await fetchBranches();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        }
      } else if (activeTab === "departments") {
        const data = {
          name: formData.name,
          costCenter: formData.costCenter,
          headId: formData.headId || undefined,
        };
        if (editingId) {
          const result = await departmentApi.updateDepartment(editingId, data);
          if (result.data) {
            await fetchDepartments();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        } else {
          const result = await departmentApi.createDepartment(data);
          if (result.data) {
            await fetchDepartments();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        }
      } else if (activeTab === "designations") {
        const data = {
          name: formData.name,
        };
        if (editingId) {
          const result = await designationApi.updateDesignation(
            editingId,
            data,
          );
          if (result.data) {
            await fetchDesignations();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        } else {
          const result = await designationApi.createDesignation(data);
          if (result.data) {
            await fetchDesignations();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      showToast.error("An error occurred while saving. Please try again.");
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
          showToast.error(result.error);
          return;
        }
      } else if (activeTab === "departments") {
        const result = await departmentApi.deleteDepartment(deleteId);
        if (result.success) {
          await fetchDepartments();
        } else if (result.error) {
          showToast.error(result.error);
          return;
        }
      } else if (activeTab === "designations") {
        const result = await designationApi.deleteDesignation(deleteId);
        if (result.success) {
          await fetchDesignations();
        } else if (result.error) {
          showToast.error(result.error);
          return;
        }
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showToast.error("An error occurred while deleting. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        logo: previewUrl,
        logoFile: file,
        removeLogo: false,
      });
    }
  };

  const handleSignatureUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        signature: previewUrl,
        signatureFile: file,
        removeSignature: false,
      });
    }
  };

  const handleRemoveLogo = () => {
    setFormData({
      ...formData,
      logo: undefined,
      logoFile: undefined,
      removeLogo: true,
    });
  };

  const handleRemoveSignature = () => {
    setFormData({
      ...formData,
      signature: undefined,
      signatureFile: undefined,
      removeSignature: true,
    });
  };

  const handleModulePermissionChange = (
    module: string,
    permission: "view" | "create" | "edit" | "approve",
    checked: boolean,
  ) => {
    const modules = formData.modules || {};
    if (!modules[module]) {
      modules[module] = {
        view: false,
        create: false,
        edit: false,
        approve: false,
      };
    }
    modules[module][permission] = checked;
    setFormData({ ...formData, modules });
  };

  const updateCompanyPolicySection = (
    section: keyof CompanyPolicy,
    values: any,
  ) => {
    setCompanyPolicy((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...values,
      },
    }));
  };

  const updateExpenseCategoryPolicy = (
    category: string,
    field: "perClaimLimit" | "monthlyLimit",
    value: number,
  ) => {
    setCompanyPolicy((prev) => ({
      ...prev,
      expense: {
        ...prev.expense,
        categories: {
          ...prev.expense.categories,
          [category]: {
            ...prev.expense.categories[category],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSaveCompanyPolicy = async () => {
    setSaving(true);
    const result = await companyPolicyApi.updatePolicy(companyPolicy);
    if (result.data) {
      setCompanyPolicy(result.data);
      showToast.success("Company policy saved successfully");
    } else if (result.error) {
      showToast.error(result.error);
    }
    setSaving(false);
  };

  const policyFieldClass = "w-full max-w-56";
  const policyToggleClass =
    "flex items-center justify-between gap-4 rounded-md border p-3";

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-6 md:w-8 h-6 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">
              Organization & Master Setup
            </span>
            <span className="sm:hidden">Organization Setup</span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
            Configure company structure, master data, and access controls
          </p>
        </div>

        {/* Search Card (hidden for Company tab) */}
        {activeTab !== "company" && activeTab !== "policies" && (
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
                <Button
                  onClick={() => handleOpenDialog()}
                  disabled={loading[activeTab]}
                  className="gap-2 whitespace-nowrap"
                >
                  {loading[activeTab] ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  ) : (
                    <Plus className="w-4 h-4 hidden sm:inline" />
                  )}
                  <span className="hidden sm:inline">
                    {loading[activeTab] ? "Loading..." : "Add"}
                  </span>
                  <span className="sm:hidden">
                    {loading[activeTab] ? "+" : "+"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 md:gap-2 bg-muted p-1 h-auto min-w-max md:min-w-full">
              <TabsTrigger
                value="company"
                className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap"
              >
                Company
              </TabsTrigger>
              <TabsTrigger
                value="branches"
                className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Branches</span>
                <span className="sm:hidden">Branch</span>
                <span className="hidden md:inline"> ({branches.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="departments"
                className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Departments</span>
                <span className="sm:hidden">Depts</span>
                <span className="hidden md:inline">
                  {" "}
                  ({departments.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="designations"
                className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Designations</span>
                <span className="sm:hidden">Desig</span>
                <span className="hidden md:inline">
                  {" "}
                  ({designations.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="policies"
                className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Company Policy</span>
                <span className="sm:hidden">Policy</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <div className="space-y-6">
              {/* Header */}
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/20 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      {company?.logo && (
                        <img
                          src={resolveFileUrl(company.logo)}
                          alt="Company Logo"
                          className="h-16 w-16 shrink-0 rounded-lg border-2 border-white object-cover shadow-md"
                          onError={(e) => {
                            console.error("Logo failed to load:", company.logo);
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 sm:text-2xl">
                          {!company?.logo && (
                            <div className="shrink-0 rounded-lg bg-[#17c491] p-2">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <span className="truncate">
                            {company?.name || "Company Information"}
                          </span>
                        </h2>
                        <p className="mt-1 truncate text-gray-600">
                          {company?.legalName}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleOpenDialog(company)}
                      className="w-full bg-[#17c491] text-white shadow-md transition-all duration-200 hover:bg-[#17c491]/90 hover:shadow-lg sm:w-auto"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Company
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Basic Information Card */}
                <Card className="border border-gray-100 bg-white shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3 shadow-sm">
                      <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Industry
                      </Label>
                      <p className="text-base font-semibold text-gray-950">
                        {company?.industry || "Not specified"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#17c491]/20 bg-white px-4 py-3 shadow-sm">
                      <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#0b6f53]">
                        GSTIN/PAN
                      </Label>
                      <p className="break-words text-base font-bold text-[#075c46]">
                        {company?.gstin || "Not specified"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Settings Card */}
                <Card className="border border-gray-100 bg-white shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                      Operational Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-[#17c491]/20 bg-white px-4 py-3 shadow-sm">
                        <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#0b6f53]">
                          Payroll Cycle
                        </Label>
                        <p className="text-base font-semibold text-gray-950">
                          {company?.payrollCycle || "Not specified"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#17c491]/20 bg-white px-4 py-3 shadow-sm">
                        <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#0b6f53]">
                          Timezone
                        </Label>
                        <p className="text-base font-semibold text-gray-950">
                          {company?.timezone || "Not specified"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#17c491]/20 bg-[#17c491]/5 px-4 py-3 shadow-sm sm:col-span-2">
                        <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#0b6f53]">
                          Salary Calculation Period
                        </Label>
                        <p className="text-base font-semibold text-gray-950">
                          Day {company?.payrollStartDay || 1} to Day{" "}
                          {company?.payrollEndDay || 31}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Address Card */}
              <Card className="border border-gray-100 bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                    Company Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-[#17c491]/20 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#17c491]">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#0b6f53]">
                          Registered Address
                        </Label>
                        <p className="text-base leading-relaxed text-gray-950">
                          {company?.address || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                    Authorized Signature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {company?.signature ? (
                    <div className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
                      <img
                        src={resolveFileUrl(company.signature)}
                        alt="Authorized Signature"
                        className="h-16 max-w-64 object-contain"
                        onError={(e) => {
                          console.error(
                            "Signature failed to load:",
                            company.signature,
                          );
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No signature uploaded yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches">
            <div className="space-y-4">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/30 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c491] rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Branches
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Manage office locations and geographical boundaries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c491]">
                          {branches.length}
                        </p>
                        <p className="text-xs text-gray-500">Total Branches</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Card */}
              <Card className="shadow-sm border-0 bg-white">
                <CardContent className="pt-6">
                  {error.branches && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error.branches}</p>
                    </div>
                  )}
                  {loading.branches ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading branches...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {filteredBranches.map((branch) => (
                          <div
                            key={branch.id}
                            className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-[#17c491]/10 to-emerald-50/30 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                    <Building2 className="w-4 h-4 text-[#17c491]" />
                                  </div>
                                  <h3 className="font-bold text-base text-gray-900">
                                    {branch.name}
                                  </h3>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleOpenDialog(branch)}
                                  className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(branch.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">
                                  Address
                                </span>
                                <span className="font-medium text-gray-900 text-right ml-2">
                                  {branch.address}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                  <span className="text-sm font-medium text-gray-500">
                                    Coordinates
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#17c491]">
                                    {branch.coordinates}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                  <span className="text-sm font-medium text-gray-500">
                                    Radius
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                    {branch.radius} m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-b border-[#17c491]/20">
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Branch Name
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Address
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Coordinates
                                </th>
                                <th className="text-center px-6 py-4 font-bold text-[#17c491]">
                                  Radius
                                </th>
                                <th className="text-center px-6 py-4 font-bold text-[#17c491]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredBranches.map((branch, index) => (
                                <tr
                                  key={branch.id}
                                  className={`border-b border-gray-100 hover:bg-[#17c491]/5 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                        <Building2 className="w-4 h-4 text-[#17c491]" />
                                      </div>
                                      <span className="font-semibold text-gray-900">
                                        {branch.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className="px-6 py-4 text-gray-900 max-w-xs truncate"
                                    title={branch.address}
                                  >
                                    {branch.address}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c491]/10 text-[#17c491] font-mono">
                                      {branch.coordinates}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                      {branch.radius} m
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleOpenDialog(branch)}
                                        className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <div className="space-y-4">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/30 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c491] rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Departments
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Manage organizational departments and cost centers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c491]">
                          {departments.length}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total Departments
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Card */}
              <Card className="shadow-sm border-0 bg-white">
                <CardContent className="pt-6">
                  {error.departments && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {error.departments}
                      </p>
                    </div>
                  )}
                  {loading.departments ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading departments...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {filteredDepartments.map((dept) => (
                          <div
                            key={dept.id}
                            className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                    <Building2 className="w-4 h-4 text-[#17c491]" />
                                  </div>
                                  <h3 className="font-bold text-base text-gray-900">
                                    {dept.name}
                                  </h3>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleOpenDialog(dept)}
                                  className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(dept.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">
                                  Cost Center
                                </span>
                                <span className="font-bold text-[#17c491]">
                                  {dept.costCenter}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">
                                  Department Head
                                </span>
                                <span className="font-bold text-gray-900">
                                  {dept.head}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-b border-[#17c491]/20">
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Department Name
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Cost Center
                                </th>
                                <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                                  Department Head
                                </th>
                                <th className="text-center px-6 py-4 font-bold text-[#17c491]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDepartments.map((dept, index) => (
                                <tr
                                  key={dept.id}
                                  className={`border-b border-gray-100 hover:bg-[#17c491]/5 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                        <Building2 className="w-4 h-4 text-[#17c491]" />
                                      </div>
                                      <span className="font-semibold text-gray-900">
                                        {dept.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c491]/10 text-[#17c491]">
                                      {dept.costCenter}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-gray-900">
                                    {dept.head}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleOpenDialog(dept)}
                                        className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(dept.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Designations Tab */}
          <TabsContent value="designations">
            <div className="space-y-4">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/30 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c491] rounded-lg">
                        <Hash className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Designations
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Manage job roles and career levels
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c491]">
                          {designations.length}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total Designations
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Card */}
              <Card className="shadow-sm border-0 bg-white">
                <CardContent className="pt-6">
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredDesignations.map((des) => (
                      <div
                        key={des.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-[#17c491]/10 to-emerald-50/30 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                <Hash className="w-4 h-4 text-[#17c491]" />
                              </div>
                              <h3 className="font-bold text-base text-gray-900">
                                {des.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleOpenDialog(des)}
                              className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(des.id)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3"></div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-b border-[#17c491]/20">
                            <th className="text-left px-6 py-4 font-bold text-[#17c491]">
                              Designation Name
                            </th>
                            <th className="text-center px-6 py-4 font-bold text-[#17c491]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDesignations.map((des, index) => (
                            <tr
                              key={des.id}
                              className={`border-b border-gray-100 hover:bg-[#17c491]/5 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-[#17c491]/10 rounded-lg">
                                    <Hash className="w-4 h-4 text-[#17c491]" />
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {des.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenDialog(des)}
                                    className="p-2 bg-[#17c491]/10 hover:bg-[#17c491]/20 text-[#17c491] rounded-lg transition-all duration-200 hover:scale-105"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(des.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Company Policy Tab */}
          <TabsContent value="policies">
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/30 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c491] rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Company Policy
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Configure attendance, leave, permission, and expense rules used by the system.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveCompanyPolicy}
                      disabled={saving || loading.policies}
                      className="whitespace-nowrap"
                    >
                      {saving ? "Saving..." : "Save Policy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error.policies && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error.policies}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attendance Grace</CardTitle>
                  <CardDescription>
                    Set company work timing and grace minutes used during punch-in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className={`${policyToggleClass} sm:col-span-2 lg:col-span-4`}>
                    <Label htmlFor="attendanceGracePolicyEnabled">
                      Enable attendance grace policy
                    </Label>
                    <Switch
                      id="attendanceGracePolicyEnabled"
                      checked={companyPolicy.attendance.gracePolicyEnabled}
                      onCheckedChange={(checked) =>
                        updateCompanyPolicySection("attendance", {
                          gracePolicyEnabled: checked,
                        })
                      }
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Work start time</Label>
                    <Input
                      type="time"
                      value={companyPolicy.attendance.workStartTime}
                      onChange={(event) =>
                        updateCompanyPolicySection("attendance", {
                          workStartTime: event.target.value,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Work end time</Label>
                    <Input
                      type="time"
                      value={companyPolicy.attendance.workEndTime}
                      onChange={(event) =>
                        updateCompanyPolicySection("attendance", {
                          workEndTime: event.target.value,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Grace period minutes</Label>
                    <Input
                      type="number"
                      min={0}
                      value={companyPolicy.attendance.gracePeriodMinutes}
                      onChange={(event) =>
                        updateCompanyPolicySection("attendance", {
                          gracePeriodMinutes: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Grace days per month</Label>
                    <Input
                      type="number"
                      min={0}
                      value={companyPolicy.attendance.graceDaysPerMonth}
                      onChange={(event) =>
                        updateCompanyPolicySection("attendance", {
                          graceDaysPerMonth: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Enter 0 for unlimited grace days.
                    </p>
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Half-day threshold hours</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={companyPolicy.attendance.halfDayThresholdHours}
                      onChange={(event) =>
                        updateCompanyPolicySection("attendance", {
                          halfDayThresholdHours: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Casual Leave</CardTitle>
                  <CardDescription>
                    Controls how casual leave is earned before an employee can apply.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className={`${policyToggleClass} lg:col-span-2`}>
                    <Label htmlFor="casualLeaveEnabled">Enable casual leave policy</Label>
                    <Switch
                      id="casualLeaveEnabled"
                      checked={companyPolicy.leave.casualLeaveEnabled}
                      onCheckedChange={(checked) =>
                        updateCompanyPolicySection("leave", {
                          casualLeaveEnabled: checked,
                        })
                      }
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Casual leave per month</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={companyPolicy.leave.casualLeavePerMonth}
                      onChange={(event) =>
                        updateCompanyPolicySection("leave", {
                          casualLeavePerMonth: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className="w-full max-w-72">
                    <Label>Accrual logic</Label>
                    <Select
                      value={companyPolicy.leave.casualLeaveAccrual}
                      onValueChange={(value: "monthly_start" | "after_full_month") =>
                        updateCompanyPolicySection("leave", {
                          casualLeaveAccrual: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_start">
                          Credit from joining month
                        </SelectItem>
                        <SelectItem value="after_full_month">
                          Credit after full month worked
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={`${policyToggleClass} lg:col-span-2`}>
                    <Label htmlFor="includePendingLeave">
                      Count pending leave while checking balance
                    </Label>
                    <Switch
                      id="includePendingLeave"
                      checked={companyPolicy.leave.includePendingLeaveInUsage}
                      onCheckedChange={(checked) =>
                        updateCompanyPolicySection("leave", {
                          includePendingLeaveInUsage: checked,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permission</CardTitle>
                  <CardDescription>
                    Controls how many short permissions an employee can request per month.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className={`${policyToggleClass} lg:col-span-2`}>
                    <Label htmlFor="permissionPolicyEnabled">Enable permission policy</Label>
                    <Switch
                      id="permissionPolicyEnabled"
                      checked={companyPolicy.permission.enabled}
                      onCheckedChange={(checked) =>
                        updateCompanyPolicySection("permission", { enabled: checked })
                      }
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Permissions per month</Label>
                    <Input
                      type="number"
                      min={0}
                      value={companyPolicy.permission.maxPerMonth}
                      onChange={(event) =>
                        updateCompanyPolicySection("permission", {
                          maxPerMonth: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className={policyFieldClass}>
                    <Label>Hours per permission</Label>
                    <Input
                      type="number"
                      min={0.25}
                      step="0.25"
                      value={companyPolicy.permission.hoursPerPermission}
                      onChange={(event) =>
                        updateCompanyPolicySection("permission", {
                          hoursPerPermission: Number(event.target.value) || 1,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className={`${policyToggleClass} lg:col-span-2`}>
                    <Label htmlFor="includePendingPermission">
                      Count pending permissions in monthly usage
                    </Label>
                    <Switch
                      id="includePendingPermission"
                      checked={companyPolicy.permission.includePendingInUsage}
                      onCheckedChange={(checked) =>
                        updateCompanyPolicySection("permission", {
                          includePendingInUsage: checked,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expense Claims</CardTitle>
                  <CardDescription>
                    Set daily and monthly limits for food, travel, accommodation, and other expenses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={`${policyToggleClass} lg:col-span-2`}>
                      <Label htmlFor="expensePolicyEnabled">Enable expense policy</Label>
                      <Switch
                        id="expensePolicyEnabled"
                        checked={companyPolicy.expense.enabled}
                        onCheckedChange={(checked) =>
                          updateCompanyPolicySection("expense", { enabled: checked })
                        }
                      />
                    </div>
                    <div className={policyFieldClass}>
                      <Label>Monthly overall limit</Label>
                      <Input
                        type="number"
                        min={0}
                        value={companyPolicy.expense.monthlyOverallLimit}
                        onChange={(event) =>
                          updateCompanyPolicySection("expense", {
                            monthlyOverallLimit: Number(event.target.value) || 0,
                          })
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="bg-muted/60">
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Category
                          </th>
                          <th className="w-44 px-4 py-3 text-left text-sm font-semibold">
                            Daily Limit
                          </th>
                          <th className="w-44 px-4 py-3 text-left text-sm font-semibold">
                            Monthly Limit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(companyPolicy.expense.categories).map(
                          ([category, limits]) => (
                            <tr key={category} className="border-t">
                              <td className="px-4 py-3 text-sm font-medium capitalize">
                                {category}
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={limits.perClaimLimit}
                                  onChange={(event) =>
                                    updateExpenseCategoryPolicy(
                                      category,
                                      "perClaimLimit",
                                      Number(event.target.value) || 0,
                                    )
                                  }
                                  className="h-9 w-36"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={limits.monthlyLimit}
                                  onChange={(event) =>
                                    updateExpenseCategoryPolicy(
                                      category,
                                      "monthlyLimit",
                                      Number(event.target.value) || 0,
                                    )
                                  }
                                  className="h-9 w-36"
                                />
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add New"}{" "}
              {activeTab === "company"
                ? "Company"
                : activeTab === "branches"
                  ? "Branch"
                  : activeTab === "departments"
                    ? "Department"
                    : activeTab === "designations"
                      ? "Designation"
                      : "Item"}
            </DialogTitle>
            <DialogDescription>
              Update the selected{" "}
              {activeTab === "company"
                ? "company"
                : activeTab === "branches"
                  ? "branch"
                  : activeTab === "departments"
                    ? "department"
                    : activeTab === "designations"
                      ? "designation"
                      : "item"}{" "}
              details and save your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "company" && (
              <>
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Legal Name *</Label>
                  <Input
                    value={formData.legalName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, legalName: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN/PAN *</Label>
                    <Input
                      value={formData.gstin || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, gstin: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <Input
                      value={formData.industry || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payroll Cycle *</Label>
                    <Select
                      value={formData.payrollCycle || ""}
                      onValueChange={(val) =>
                        setFormData({ ...formData, payrollCycle: val })
                      }
                    >
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
                    <Select
                      value={formData.timezone || ""}
                      onValueChange={(val) =>
                        setFormData({ ...formData, timezone: val })
                      }
                    >
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Salary Calculation From *</Label>
                    <Input
                      value={formData.payrollStartDay || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payrollStartDay: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      type="number"
                      min={1}
                      max={31}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Salary Calculation To *</Label>
                    <Input
                      value={formData.payrollEndDay || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payrollEndDay: parseInt(e.target.value, 10) || 31,
                        })
                      }
                      type="number"
                      min={1}
                      max={31}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-2">
                    {(formData.logo ||
                      (!formData.removeLogo && company?.logo)) && (
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={resolveFileUrl(formData.logo || company?.logo)}
                          alt="Company Logo"
                          className="w-12 h-12 rounded border object-cover"
                          onError={(e) => {
                            console.error(
                              "Dialog logo failed to load:",
                              formData.logo || company?.logo,
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
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
                <div>
                  <Label>Authorized Signature</Label>
                  <div className="mt-2">
                    {(formData.signature ||
                      (!formData.removeSignature && company?.signature)) && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded border bg-white px-3 py-2">
                          <img
                            src={resolveFileUrl(
                              formData.signature || company?.signature,
                            )}
                            alt="Authorized Signature"
                            className="h-12 max-w-48 object-contain"
                            onError={(e) => {
                              console.error(
                                "Dialog signature failed to load:",
                                formData.signature || company?.signature,
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                      <Upload className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        Upload Signature
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleSignatureUpload}
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Coordinates *</Label>
                    <Input
                      value={formData.coordinates || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: e.target.value,
                        })
                      }
                      placeholder="e.g., 12.9716,77.5946"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Radius (meters) *</Label>
                  <Input
                    value={formData.radius || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, radius: e.target.value })
                    }
                    type="number"
                    className="mt-2"
                    min={1}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter geofence radius in meters (e.g., 200)
                  </p>
                </div>
              </>
            )}

            {activeTab === "departments" && (
              <>
                <div>
                  <Label>Department Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Cost Center *</Label>
                  <Input
                    value={formData.costCenter || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, costCenter: e.target.value })
                    }
                    placeholder="e.g., CC001"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Department Head</Label>
                  <Select
                    value={formData.headId?.toString() || ""}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        headId: val === "__none__" ? "" : val,
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        No department head
                      </SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name ||
                            `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}
                        </SelectItem>
                      ))}
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </>
            )}

          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
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
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
