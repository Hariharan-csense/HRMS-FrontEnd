import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Building2, AlertCircle, Upload, X, Hash } from "lucide-react";
import { companyApi, Company } from "@/components/helper/company/company";
import { branchApi, Branch } from "@/components/helper/branch/branch";
import { departmentApi, Department } from "@/components/helper/department/department";
import { designationApi, Designation } from "@/components/helper/designation/designation";
import { sequenceApi, Sequence } from "@/components/helper/range/range";
import { showToast } from "@/utils/toast";

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

export default function OrganizationSetup() {
  const location = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
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
    fetchSequences();
  }, []);

  // Debug formData changes for sequences
  useEffect(() => {
    if (activeTab === "sequences") {
      console.log('FormData changed:', formData);
    }
  }, [formData, activeTab]);


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
        if (editingId) {
          const result = await departmentApi.updateDepartment(editingId, formData);
          if (result.data) {
            await fetchDepartments();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        } else {
          const result = await departmentApi.createDepartment(formData);
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
          level_grade: formData.level
        };
        if (editingId) {
          const result = await designationApi.updateDesignation(editingId, data);
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
      } else if (activeTab === "sequences") {
        console.log('Saving sequence data:', formData);
        if (editingId) {
          const result = await sequenceApi.updateSequence(editingId, formData);
          if (result.data) {
            await fetchSequences();
          } else if (result.error) {
            showToast.error(result.error);
            return;
          }
        } else {
          const result = await sequenceApi.createSequence(formData);
          if (result.data) {
            await fetchSequences();
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
      } else if (activeTab === "sequences") {
        const result = await sequenceApi.deleteSequence(deleteId);
        if (result.success) {
          await fetchSequences();
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 md:gap-2 bg-muted p-1 h-auto min-w-max md:min-w-full">
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
              <TabsTrigger value="sequences" className="text-xs py-2 md:py-3 md:text-sm whitespace-nowrap">
                <span className="hidden sm:inline">Sequences</span>
                <span className="sm:hidden">Seq</span>
                <span className="hidden md:inline"> ({sequences.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <div className="space-y-6">
              {/* Header */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {company?.logo && (
                        <img
                          src={`${company.logo.startsWith('http') ? company.logo : `http://192.168.1.11:3000${company.logo}`}`}
                          alt="Company Logo"
                          className="w-16 h-16 rounded-lg border-2 border-white shadow-md object-cover"
                          onError={(e) => {
                            console.error('Logo failed to load:', company.logo);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                          {!company?.logo && (
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          {company?.name || 'Company Information'}
                        </h2>
                        <p className="text-gray-600 mt-1">{company?.legalName}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleOpenDialog(company)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Company
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information Card */}
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Company ID</Label>
                        <p className="text-sm font-semibold text-gray-900">{company?.companyId}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Industry</Label>
                        <p className="text-sm font-semibold text-gray-900">{company?.industry}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                      <Label className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">GSTIN/PAN</Label>
                      <p className="text-lg font-bold text-blue-900">{company?.gstin}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Settings Card */}
                <Card className="shadow-sm border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Operational Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <Label className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">Payroll Cycle</Label>
                        <p className="text-sm font-semibold text-blue-900">{company?.payrollCycle}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <Label className="text-xs font-medium text-blue-700 uppercase tracking-wider block mb-1">Timezone</Label>
                        <p className="text-sm font-semibold text-blue-900">{company?.timezone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Address Card */}
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    Company Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-600">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-orange-700 uppercase tracking-wider block mb-2">Registered Address</Label>
                        <p className="text-gray-900 leading-relaxed">{company?.address}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches">
            <div className="space-y-4">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c419] rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Branches</h2>
                        <p className="text-gray-600 text-sm mt-1">Manage office locations and geographical boundaries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c419]">{branches.length}</p>
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
                    <span className="ml-2 text-sm text-muted-foreground">Loading branches...</span>
                  </div>
                ) : (
                  <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredBranches.map((branch) => (
                    <div key={branch.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#17c419]/10 rounded-lg">
                              <Building2 className="w-4 h-4 text-[#17c419]" />
                            </div>
                            <h3 className="font-bold text-base text-gray-900">{branch.name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(branch)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                          <span className="text-sm font-medium text-gray-500">Address</span>
                          <span className="font-medium text-gray-900 text-right ml-2">{branch.address}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Coordinates</span>
                            <span className="font-mono text-xs font-bold text-[#17c419]">{branch.coordinates}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Radius</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              {branch.radius} km
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
                        <tr className="bg-gradient-to-r from-[#17c419]/10 to-emerald-50 border-b border-[#17c419]/20">
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Branch Name</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Address</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Coordinates</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Radius</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBranches.map((branch, index) => (
                          <tr key={branch.id} className={`border-b border-gray-100 hover:bg-[#17c419]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#17c419]/10 rounded-lg">
                                  <Building2 className="w-4 h-4 text-[#17c419]" />
                                </div>
                                <span className="font-semibold text-gray-900">{branch.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-900 max-w-xs truncate" title={branch.address}>
                              {branch.address}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c419]/10 text-[#17c419] font-mono">
                                {branch.coordinates}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                {branch.radius} km
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenDialog(branch)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c419] rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Departments</h2>
                        <p className="text-gray-600 text-sm mt-1">Manage organizational departments and cost centers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c419]">{departments.length}</p>
                        <p className="text-xs text-gray-500">Total Departments</p>
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
                <div className="md:hidden space-y-3">
                  {filteredDepartments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#17c419]/10 rounded-lg">
                              <Building2 className="w-4 h-4 text-[#17c419]" />
                            </div>
                            <h3 className="font-bold text-base text-gray-900">{dept.name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(dept)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                          <span className="text-sm font-medium text-gray-500">Cost Center</span>
                          <span className="font-bold text-[#17c419]">{dept.costCenter}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-500">Department Head</span>
                          <span className="font-bold text-gray-900">{dept.head}</span>
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
                        <tr className="bg-gradient-to-r from-[#17c419]/10 to-emerald-50 border-b border-[#17c419]/20">
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Department Name</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Cost Center</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Department Head</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((dept, index) => (
                          <tr key={dept.id} className={`border-b border-gray-100 hover:bg-[#17c419]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#17c419]/10 rounded-lg">
                                  <Building2 className="w-4 h-4 text-[#17c419]" />
                                </div>
                                <span className="font-semibold text-gray-900">{dept.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c419]/10 text-[#17c419]">
                                {dept.costCenter}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{dept.head}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenDialog(dept)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c419] rounded-lg">
                        <Hash className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Designations</h2>
                        <p className="text-gray-600 text-sm mt-1">Manage job roles and career levels</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c419]">{designations.length}</p>
                        <p className="text-xs text-gray-500">Total Designations</p>
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
                    <div key={des.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#17c419]/10 rounded-lg">
                              <Hash className="w-4 h-4 text-[#17c419]" />
                            </div>
                            <h3 className="font-bold text-base text-gray-900">{des.name}</h3>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(des)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-500">Career Level</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c419]/10 text-[#17c419]">
                            Level {des.level}
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
                        <tr className="bg-gradient-to-r from-[#17c419]/10 to-emerald-50 border-b border-[#17c419]/20">
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Designation Name</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Career Level</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDesignations.map((des, index) => (
                          <tr key={des.id} className={`border-b border-gray-100 hover:bg-[#17c419]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#17c419]/10 rounded-lg">
                                  <Hash className="w-4 h-4 text-[#17c419]" />
                                </div>
                                <span className="font-semibold text-gray-900">{des.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c419]/10 text-[#17c419]">
                                Level {des.level}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenDialog(des)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
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


          {/* Sequences Tab */}
          <TabsContent value="sequences">
            <div className="space-y-4">
              {/* Header Card */}
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#17c419] rounded-lg">
                        <Hash className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Sequences</h2>
                        <p className="text-gray-600 text-sm mt-1">Manage ID generation patterns and formats</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#17c419]">{sequences.length}</p>
                        <p className="text-xs text-gray-500">Active Sequences</p>
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
                  {filteredSequences.map((seq) => (
                    <div key={seq.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-orange-50/50 to-amber-50/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-[#17c419]/10 rounded-lg">
                              <Hash className="w-4 h-4 text-[#17c419]" />
                            </div>
                            <h3 className="font-bold text-base text-gray-900 capitalize">{seq.module}</h3>
                          </div>
                          <p className="text-xs text-gray-500 font-mono">Prefix: <span className="font-bold text-[#17c419]">{seq.prefix}</span></p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDialog(seq)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(seq.id.toString())}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 bg-white rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-orange-50 rounded-lg">
                            <p className="text-xs text-gray-500">Start</p>
                            <p className="font-bold text-[#17c419]">{seq.start_number}</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-500">Current</p>
                            <p className="font-bold text-blue-600">{seq.current_number}</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-gray-500">Length</p>
                            <p className="font-bold text-green-600">{seq.number_length}</p>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-500 mb-2">Sample Format:</p>
                          <div className="bg-[#17c419] text-white p-2 rounded font-mono text-sm text-center">
                            {seq.prefix}{String(seq.current_number).padStart(seq.number_length, "0")}
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
                        <tr className="bg-gradient-to-r from-[#17c419]/10 to-emerald-50 border-b border-[#17c419]/20">
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Module</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Prefix</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Start</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Current</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Length</th>
                          <th className="text-left px-6 py-4 font-bold text-[#17c419]">Sample Format</th>
                          <th className="text-center px-6 py-4 font-bold text-[#17c419]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSequences.map((seq, index) => (
                          <tr key={seq.id} className={`border-b border-gray-100 hover:bg-[#17c419]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#17c419]/10 rounded-lg">
                                  <Hash className="w-4 h-4 text-[#17c419]" />
                                </div>
                                <span className="font-semibold text-gray-900 capitalize">{seq.module}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#17c419]/10 text-[#17c419] font-mono">
                                {seq.prefix}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#17c419]/50 text-[#17c419]">
                                {seq.start_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700">
                                {seq.current_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-700">
                                {seq.number_length}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="bg-[#17c419] text-white px-3 py-1 rounded font-mono text-sm text-center">
                                {seq.prefix}{String(seq.current_number).padStart(seq.number_length, "0")}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenDialog(seq)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(seq.id.toString())}
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
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add New"} {activeTab === "company" ? "Company" : activeTab === "branches" ? "Branch" : activeTab === "departments" ? "Department" : activeTab === "designations" ? "Designation" : "Sequence"}
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
                    {(formData.logo || company?.logo) && (
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={
                            formData.logo && formData.logo.startsWith('data:') 
                              ? formData.logo 
                              : (formData.logo || company?.logo)?.startsWith('http') 
                                ? (formData.logo || company?.logo)
                                : `http://192.168.1.11:3000${formData.logo || company?.logo}`
                          }
                          alt="Company Logo"
                          className="w-12 h-12 rounded border object-cover"
                          onError={(e) => {
                            console.error('Dialog logo failed to load:', formData.logo || company?.logo);
                            e.currentTarget.style.display = 'none';
                          }}
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
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        console.log('Current number changed:', e.target.value, '->', newValue);
                        setFormData({ ...formData, current_number: newValue });
                      }}
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
                    {formData.prefix || "PREFIX"}{String(formData.current_number || 0).padStart(formData.number_length || 4, "0")}
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
