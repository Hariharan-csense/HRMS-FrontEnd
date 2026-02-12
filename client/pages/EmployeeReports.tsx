import React, { useState, useEffect, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  Search, 
  Filter, 
  Loader2,
  AlertTriangle,
  Crown,
  CreditCard,
  UserCheck,
  Building,
  FileText,
  FolderOpen,
  CheckSquare
} from "lucide-react";
import { showToast } from "@/utils/toast";
import employeeApi from "../components/helper/employee/employee";
import { Employee, EmploymentType, EmployeeStatus } from "../lib/employees";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import { useSubscription } from "../contexts/SubscriptionContext";

// Helper function to safely extract date part from ISO string without timezone issues
const extractDatePart = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  try {
    // If it's already in YYYY-MM-DD format, return as-is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    // Handle ISO date strings with timezone
    const date = new Date(dateString);

    // Get the date parts in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return dateString.split("T")[0] || "";
  }
};

interface ReportSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  fields: { key: keyof Employee; label: string; transform?: (value: any) => string }[];
}

const reportSections: ReportSection[] = [
  {
    id: "personal",
    name: "Personal Information",
    icon: <UserCheck className="w-4 h-4" />,
    fields: [
      { key: "employeeId", label: "Employee ID" },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "bloodGroup", label: "Blood Group" },
      { key: "maritalStatus", label: "Marital Status" },
      { key: "emergencyContact", label: "Emergency Contact" },
      { key: "emergencyPhone", label: "Emergency Phone" },
    ]
  },
  {
    id: "employment",
    name: "Employment Details",
    icon: <Building className="w-4 h-4" />,
    fields: [
      { key: "department", label: "Department" },
      { key: "designation", label: "Designation" },
      { key: "dateOfJoining", label: "Date of Joining" },
      { key: "employmentType", label: "Employment Type" },
      { key: "status", label: "Status" },
      { key: "role", label: "Role" },
      { key: "location", label: "Location" },
      { key: "salary", label: "Salary" },
    ]
  },
  {
    id: "statutory",
    name: "Statutory Information",
    icon: <FileText className="w-4 h-4" />,
    fields: [
      { key: "aadhaar", label: "Aadhaar" },
      { key: "pan", label: "PAN" },
      { key: "uan", label: "UAN" },
      { key: "esic", label: "ESIC" },
    ]
  },
  {
    id: "bank",
    name: "Bank Details",
    icon: <CreditCard className="w-4 h-4" />,
    fields: [
      { key: "bankAccountHolder", label: "Account Holder" },
      { key: "bankName", label: "Bank Name" },
      { key: "accountNumber", label: "Account Number" },
      { key: "ifscCode", label: "IFSC Code" },
    ]
  },
  {
    id: "documents",
    name: "Documents",
    icon: <FolderOpen className="w-4 h-4" />,
    fields: [
      { key: "photoUrl", label: "Photo" },
      { key: "idProofUrl", label: "ID Proof" },
      { key: "addressProofUrl", label: "Address Proof" },
      { key: "offerLetterUrl", label: "Offer Letter" },
      { key: "certificatesUrl", label: "Certificates" },
      { key: "bankProofUrl", label: "Bank Proof" },
    ]
  }
];

export default function EmployeeReports() {
  const { user } = useAuth();
  const { canPerformAction } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | "all">("all");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(["personal", "employment"]));
  const [exporting, setExporting] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Check if user can access reports
  const userPrimaryRole = user?.roles[0];
  const canAccessReports = userPrimaryRole ? canPerformAction(userPrimaryRole, "reports", "view") : false;

  // Get subscription status
  const { isTrialExpired, isTrialEndingSoon, isUserLimitExceeded, currentEmployeeCount, subscription } = useSubscription();

  // Show subscription warning if trial expired, ending soon, or user limit exceeded
  const showSubscriptionWarning = isTrialExpired || isTrialEndingSoon || isUserLimitExceeded;

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log("EmployeeReports: Starting to fetch employees...");
      const result = await employeeApi.getEmployees();
      console.log("EmployeeReports: Raw API result:", result);
      
      const apiEmployees = result.data || [];
      console.log("EmployeeReports: Employees array length:", apiEmployees.length);

      if (Array.isArray(apiEmployees) && apiEmployees.length > 0) {
        const transformedEmployees = apiEmployees.map((emp: any) => {
          const transformed: Employee = {
            id: emp.id.toString(),
            employeeId: emp.employee_id || "",
            firstName: emp.first_name || "",
            lastName: emp.last_name || "",
            email: emp.email || "",
            phone: emp.mobile || "",
            dateOfBirth: emp.dob ? extractDatePart(emp.dob) : "",
            gender: (() => {
              const g = (emp.gender || "").toLowerCase().trim();
              if (g === "male") return "Male";
              if (g === "female") return "Female";
              return "Other";
            })(),
            bloodGroup: emp.blood_group || "",
            maritalStatus: (() => {
              const ms = (emp.marital_status || "").toLowerCase().trim();
              if (ms === "single") return "Single";
              if (ms === "married") return "Married";
              if (ms === "divorced") return "Divorced";
              if (ms === "widowed") return "Widowed";
              if (ms.includes("commit") || ms === "commeted") return "Married";
              return "Single";
            })(),
            emergencyContact: emp.emergency_contact_name || "",
            emergencyPhone: emp.emergency_contact_phone || "",
            departmentId: emp.department_id?.toString() || "",
            designationId: emp.designation_id?.toString() || "",
            department: emp.department || emp.department_name || "Unknown",
            designation: emp.designation || emp.designation_name || "Unknown",
            dateOfJoining: emp.doj ? extractDatePart(emp.doj) : "",
            employmentType: (() => {
              const type = (emp.employment_type || "").toLowerCase().trim();
              if (type.includes("full")) return "full-time";
              if (type.includes("part")) return "part-time";
              if (type.includes("contract")) return "contract";
              if (type.includes("intern")) return "intern";
              return "full-time";
            })() as EmploymentType,
            status: (() => {
              const s = (emp.status || "").toLowerCase().trim();
              if (s === "active") return "active";
              if (s === "inactive") return "inactive";
              if (s === "on leave" || s === "on-leave") return "on-leave";
              if (s === "terminated") return "terminated";
              return "active";
            })() as EmployeeStatus,
            role: emp.role || "",
            location: emp.location_office || "",
            aadhaar: emp.aadhaar || "",
            pan: emp.pan || "",
            uan: emp.uan || "",
            esic: emp.esic || "",
            bankAccountHolder: emp.bankDetails?.account_holder_name || "",
            bankName: emp.bankDetails?.bank_name || "",
            accountNumber: emp.bankDetails?.account_number || "",
            ifscCode: emp.bankDetails?.ifsc_code || "",
            photoUrl: emp.documents?.find((d: any) => d.fieldname === "photo")?.file_path || "",
            idProofUrl: emp.documents?.find((d: any) => d.fieldname === "id_proof")?.file_path || "",
            addressProofUrl: emp.documents?.find((d: any) => d.fieldname === "address_proof")?.file_path || "",
            offerLetterUrl: emp.documents?.find((d: any) => d.fieldname === "offer_letter")?.file_path || "",
            certificatesUrl: "",
            bankProofUrl: "",
            salary: emp.salary || 0,
            createdAt: emp.created_at || new Date().toISOString(),
            updatedAt: emp.updated_at || new Date().toISOString(),
          };
          return transformed;
        });

        setEmployees(transformedEmployees);
      } else {
        console.error("EmployeeReports: No employees found or invalid data format");
        // Use mock data for testing when backend is not available
        const mockEmployees: Employee[] = [
          {
            id: "1",
            employeeId: "EMP001",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+919876543210",
            dateOfBirth: "1990-05-15",
            gender: "Male",
            bloodGroup: "B+",
            maritalStatus: "Married",
            emergencyContact: "Jane Doe",
            emergencyPhone: "+919876543211",
            departmentId: "1",
            designationId: "1",
            department: "Engineering",
            designation: "Senior Software Engineer",
            dateOfJoining: "2020-01-15",
            employmentType: "full-time",
            status: "active",
            role: "employee",
            location: "Bangalore",
            aadhaar: "123456789012",
            pan: "ABCDE1234F",
            uan: "123456789012",
            esic: "123456789012345",
            bankAccountHolder: "John Doe",
            bankName: "HDFC Bank",
            accountNumber: "12345678901234",
            ifscCode: "HDFC0001234",
            salary: 85000,
            photoUrl: "",
            idProofUrl: "",
            addressProofUrl: "",
            offerLetterUrl: "",
            certificatesUrl: "",
            bankProofUrl: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            employeeId: "EMP002",
            firstName: "Sarah",
            lastName: "Smith",
            email: "sarah.smith@example.com",
            phone: "+919876543212",
            dateOfBirth: "1992-08-21",
            gender: "Female",
            bloodGroup: "A+",
            maritalStatus: "Single",
            emergencyContact: "Mike Smith",
            emergencyPhone: "+919876543213",
            departmentId: "2",
            designationId: "2",
            department: "HR",
            designation: "HR Manager",
            dateOfJoining: "2019-11-10",
            employmentType: "full-time",
            status: "active",
            role: "hr",
            location: "Bangalore",
            aadhaar: "987654321098",
            pan: "ZYXWV9876A",
            uan: "987654321098",
            esic: "987654321098765",
            bankAccountHolder: "Sarah Smith",
            bankName: "ICICI Bank",
            accountNumber: "98765432109876",
            ifscCode: "ICIC0001987",
            salary: 95000,
            photoUrl: "",
            idProofUrl: "",
            addressProofUrl: "",
            offerLetterUrl: "",
            certificatesUrl: "",
            bankProofUrl: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        
        console.log("EmployeeReports: Using mock data for testing");
        setEmployees(mockEmployees);
        setError("Backend server not available. Using sample data for testing.");
      }
    } catch (err) {
      console.error("EmployeeReports: Error fetching employees:", err);
      setError("Failed to connect to server");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const deptResult = await employeeApi.getDepartments();
      console.log("Raw departments response:", deptResult);
      
      // Response is { success: true, departments: [...] }
      if (deptResult.data?.departments && Array.isArray(deptResult.data.departments)) {
        const formattedDepts = deptResult.data.departments.map((dept: any) => ({
          id: dept.id.toString(),
          name: dept.name || "Unknown"
        }));
        setDepartments(formattedDepts);
      } else {
        console.warn("No valid departments array in response");
        // Use mock departments for testing
        const mockDepartments = [
          { id: "1", name: "Engineering" },
          { id: "2", name: "HR" },
          { id: "3", name: "Finance" },
          { id: "4", name: "Sales" },
          { id: "5", name: "Operations" },
          { id: "6", name: "Marketing" }
        ];
        setDepartments(mockDepartments);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      // Use mock departments for testing
      const mockDepartments = [
        { id: "1", name: "Engineering" },
        { id: "2", name: "HR" },
        { id: "3", name: "Finance" },
        { id: "4", name: "Sales" },
        { id: "5", name: "Operations" },
        { id: "6", name: "Marketing" }
      ];
      setDepartments(mockDepartments);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (emp.firstName?.toLowerCase() || "").includes(searchLower) ||
        (emp.lastName?.toLowerCase() || "").includes(searchLower) ||
        (emp.email?.toLowerCase() || "").includes(searchLower) ||
        (emp.employeeId?.toLowerCase() || "").includes(searchLower);

      const matchesDept = filterDept === "all" || emp.departmentId === filterDept;
      const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, filterDept, filterStatus]);

  // Handle employee selection
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    }
  };

  // Handle section selection
  const handleSelectSection = (sectionId: string) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSelectAllSections = () => {
    if (selectedSections.size === reportSections.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(reportSections.map(section => section.id)));
    }
  };

  // Generate CSV content
  const generateCSV = (employeesToExport: Employee[], sectionsToExport: string[]) => {
    const rows: string[] = [];
    
    // Add header - use field labels directly instead of section names
    const headers: string[] = [];
    sectionsToExport.forEach(sectionId => {
      const section = reportSections.find(s => s.id === sectionId);
      if (section) {
        section.fields.forEach(field => {
          headers.push(field.label);
        });
      }
    });
    rows.push(headers.join(","));

    // Add data rows
    employeesToExport.forEach(employee => {
      const row: string[] = [];
      sectionsToExport.forEach(sectionId => {
        const section = reportSections.find(s => s.id === sectionId);
        if (section) {
          section.fields.forEach(field => {
            let value = employee[field.key] || "";
            // Handle special formatting
            if (field.key === "salary" && value) {
              value = value.toString();
            }
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            row.push(value.toString());
          });
        }
      });
      rows.push(row.join(","));
    });

    return rows.join("\n");
  };

  // Export functionality
  const handleExport = async (type: "individual" | "combined") => {
    if (selectedEmployees.size === 0) {
      showToast.error("Please select at least one employee to export");
      return;
    }

    if (selectedSections.size === 0) {
      showToast.error("Please select at least one section to export");
      return;
    }

    setExporting(true);
    try {
      const employeesToExport = filteredEmployees.filter(emp => selectedEmployees.has(emp.id));

      if (type === "individual") {
        // Export each employee as separate file
        for (const employee of employeesToExport) {
          const csvContent = generateCSV([employee], Array.from(selectedSections));
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `${employee.employeeId}_${employee.firstName}_${employee.lastName}_report.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Export all selected employees as combined file
        const csvContent = generateCSV(employeesToExport, Array.from(selectedSections));
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `employee_reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!canAccessReports) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access employee reports.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17c491] to-[#17c491] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Employee Reports</h1>
          </div>
          <p className="text-blue-100">Generate and export comprehensive employee reports</p>
        </div>

        {/* Subscription Warning Banner */}
        {showSubscriptionWarning && (
          <Card className={`${isTrialExpired ? 'border-red-200 bg-red-50' : isTrialEndingSoon ? 'border-orange-200 bg-orange-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${isTrialExpired ? 'text-red-600' : isTrialEndingSoon ? 'text-orange-600' : 'text-yellow-600'} flex-shrink-0`} />
                <div className="flex-1">
                  <p className={`font-medium ${isTrialExpired ? 'text-red-800' : isTrialEndingSoon ? 'text-orange-800' : 'text-yellow-800'}`}>
                    {isTrialExpired 
                      ? "Your free trial has ended" 
                      : isTrialEndingSoon 
                      ? `Trial ending in ${subscription?.trial_days_remaining || 0} days`
                      : `User limit exceeded (${currentEmployeeCount}/${subscription?.max_users || 0})`
                    }
                  </p>
                  <p className={`text-sm ${isTrialExpired ? 'text-red-600' : isTrialEndingSoon ? 'text-orange-600' : 'text-yellow-600'}`}>
                    {isTrialExpired 
                      ? "Please subscribe to continue using all features" 
                      : isTrialEndingSoon 
                      ? "Upgrade now to continue without interruption"
                      : "Upgrade your plan to add more employees"
                    }
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => window.location.href = '/subscription/plans'}
                  className={`${isTrialExpired ? 'bg-red-600 hover:bg-red-700' : isTrialEndingSoon ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isTrialExpired ? 'Subscribe Now' : isTrialEndingSoon ? 'Upgrade Now' : 'Upgrade Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filtered</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
                </div>
                <Filter className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedEmployees.size}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sections</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSections.size}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Report Sections
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllSections}
                  className="text-xs"
                >
                  {selectedSections.size === reportSections.length ? "Deselect All" : "Select All"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportSections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={selectedSections.has(section.id)}
                    onCheckedChange={() => handleSelectSection(section.id)}
                  />
                  <label
                    htmlFor={section.id}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
                  >
                    {section.icon}
                    {section.name}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Options
              </CardTitle>
              <CardDescription>
                Export selected employees and sections to CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleExport("combined")}
                disabled={exporting || selectedEmployees.size === 0 || selectedSections.size === 0}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Combined CSV
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleExport("individual")}
                disabled={exporting || selectedEmployees.size === 0 || selectedSections.size === 0}
                variant="outline"
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Individual Files
                  </>
                )}
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Combined: All selected employees in one CSV</p>
                <p>• Individual: Separate CSV for each employee</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee List
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllEmployees}
                className="text-xs"
              >
                {selectedEmployees.size === filteredEmployees.length ? "Deselect All" : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchEmployees} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table - Hidden on small screens */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                            onCheckedChange={handleSelectAllEmployees}
                          />
                        </TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Employment Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees.has(employee.id)}
                              onCheckedChange={() => handleSelectEmployee(employee.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                employee.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : employee.status === "inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : employee.status === "on-leave"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {employee.status}
                            </span>
                          </TableCell>
                          <TableCell>{employee.employmentType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards - Visible on small screens */}
                <div className="lg:hidden space-y-4">
                  {/* Select All Checkbox for Mobile */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={handleSelectAllEmployees}
                    />
                    <span className="font-medium text-sm">
                      {selectedEmployees.size === filteredEmployees.length ? "Deselect All" : "Select All"} ({selectedEmployees.size} selected)
                    </span>
                  </div>

                  {filteredEmployees.map((employee) => (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEmployees.has(employee.id)}
                            onCheckedChange={() => handleSelectEmployee(employee.id)}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {`${employee.firstName} ${employee.lastName}`}
                            </h3>
                            <p className="text-sm text-gray-500">{employee.employeeId}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.status === "active"
                              ? "bg-green-100 text-green-800"
                              : employee.status === "inactive"
                              ? "bg-gray-100 text-gray-800"
                              : employee.status === "on-leave"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Email</span>
                          <span className="text-gray-900 break-all">{employee.email}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Department</span>
                          <span className="text-gray-900">{employee.department}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Designation</span>
                          <span className="text-gray-900">{employee.designation}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium">Employment Type</span>
                          <span className="text-gray-900">{employee.employmentType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No employees found matching the current filters.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
