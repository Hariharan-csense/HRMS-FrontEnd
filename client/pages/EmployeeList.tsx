import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { employeeApi } from "@/components/helper/employee/employee";
import shiftApi, { Shift } from "@/components/helper/shifts/shifts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  AlertCircle,
  Upload,
  FileText,
  X,
  Loader2
} from "lucide-react";
import {
  Employee,
  EmploymentType,
  EmployeeStatus,
  
  getEmploymentTypeLabel,
  getStatusLabel,
  getStatusBadgeClass,
} from "@/lib/employees";

// Extend the Employee type to include shift_id from the API
interface EmployeeWithShiftId extends Employee {
  shift_id?: number | string;
}

type FormData = Omit<Employee, "id" | "createdAt" | "updatedAt"> & {
  employeeId: string;
  shift: string;
};

const initialFormData: FormData = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  maritalStatus: "",
  emergencyContact: "",
  emergencyPhone: "",
  departmentId: "",
  designationId: "",
  department: "",
  designation: "",
  dateOfJoining: "",
  employmentType: "full-time",
  shift: "", // Will be set when loading an existing employee
  status: "active",
  role: "",
  location: "",
  aadhaar: "",
  pan: "",
  uan: "",
  esic: "",
  bankAccountHolder: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  photoUrl: "",
  idProofUrl: "",
  addressProofUrl: "",
  offerLetterUrl: "",
  certificatesUrl: "",
  bankProofUrl: "",
};

const departments = ["Engineering", "Sales", "HR", "Finance", "Operations", "Marketing"];
const designations = [
  "Junior Developer",
  "Senior Developer",
  "Manager",
  "Director",
  "Analyst",
  "Executive",
];

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

export default function EmployeeList() {
  const { user } = useAuth();
  const { canPerformAction } = useRole();
  //const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmployeeId, setNewEmployeeId] = useState<string>("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [empToDelete, setEmpToDelete] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([]);
  const [uploadedFileObjects, setUploadedFileObjects] = useState<Record<string, File>>({});
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
 
  

  // Load shifts from backend
  const loadShifts = async () => {
    setLoadingShifts(true);
    try {
      const { data, error } = await shiftApi.getShifts();
      if (error) {
        toast.error(error);
      } else if (data) {
        // Transform the shift data to ensure consistent property names
        const transformedShifts = data.map(shift => ({
          ...shift,
          id: shift.id.toString(), // Ensure ID is always a string
          startTime: shift.startTime || shift.start_time,
          endTime: shift.endTime || shift.end_time,
          gracePeriod: shift.gracePeriod || shift.grace_period,
          halfDayThreshold: shift.halfDayThreshold || shift.half_day_threshold,
          otEligible: shift.otEligible || shift.ot_eligible,
          createdAt: shift.createdAt || shift.created_at
        }));
        setShifts(transformedShifts);
      }
    } catch (error) {
      console.error("Error loading shifts:", error);
      toast.error("Failed to load shifts");
    } finally {
      setLoadingShifts(false);
    }
  };

  // Load shifts on component mount
  useEffect(() => {
    loadShifts();
  }, []);

  // Debug: Log shift-related data
  useEffect(() => {
    if (isDialogOpen && editingId) {
      console.log('Current formData.shift:', formData.shift);
      console.log('Available shifts:', shifts);
      const selectedShift = shifts.find(s => s.id.toString() === formData.shift);
      console.log('Selected shift:', selectedShift);
    }
  }, [formData.shift, shifts, isDialogOpen, editingId]);

  // Check if user can create employees
  const userPrimaryRole = user?.roles[0];
  const canCreateEmployee = userPrimaryRole ? canPerformAction(userPrimaryRole, "employees", "create") : false;

  const filteredEmployees = useMemo(() => {
    let visibleEmployees = employees;

    if (user) {
      // HR should see all employees in the company
      if (user.roles.includes("hr")) {
        visibleEmployees = employees; // HR can see all employees
      } 
      // Manager sees their direct reports and department members
      else if (user.roles.includes("manager")) {
        visibleEmployees = employees.filter(
          (emp) =>
            (emp.firstName + " " + emp.lastName) === user.name ||
            emp.department === user.department
        );
      } 
      // Regular employees only see their own profile
      else if (user.roles.includes("employee") && !user.roles.includes("admin")) {
        visibleEmployees = employees.filter(
          (emp) => (emp.firstName + " " + emp.lastName) === user.name
        );
      }
    }

  return visibleEmployees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      (emp.firstName?.toLowerCase() || "").includes(searchLower) ||
      (emp.lastName?.toLowerCase() || "").includes(searchLower) ||
      (emp.email?.toLowerCase() || "").includes(searchLower);

    const matchesDept = filterDept === "all" || emp.departmentId === filterDept;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });
}, [employees, searchTerm, filterDept, filterStatus, user]);
const handleOpenDialog = (employee?: EmployeeWithShiftId) => {
  if (employee) {
    console.log('Opening dialog with employee:', employee);
    console.log('Employee shift_id:', (employee as any).shift_id);
    console.log('Employee shift:', employee.shift);
    setEditingId(employee.id.toString());
setFormData({
  employeeId: employee.employeeId || "",
  firstName: employee.firstName || "",
  lastName: employee.lastName || "",
  email: employee.email || "",
  phone: employee.phone || "",
  dateOfBirth: employee.dateOfBirth || "",
  gender: employee.gender || "",
  bloodGroup: employee.bloodGroup || "",
  maritalStatus: employee.maritalStatus || "",
  emergencyContact: employee.emergencyContact || "",
  emergencyPhone: employee.emergencyPhone || "",
  departmentId: employee.departmentId || "",
  // Handle shift from the API response
  shift: employee?.shift?.toString() || "",
  designationId: employee.designationId || "",
  department: employee.department || "",
  designation: employee.designation || "",
  dateOfJoining: employee.dateOfJoining || "",
  employmentType: employee.employmentType || "full-time",
  status: employee.status || "active",
  role: employee.role || "",
  location: employee.location || "",
  aadhaar: employee.aadhaar || "",
  pan: employee.pan || "",
  uan: employee.uan || "",
  esic: employee.esic || "",
  bankAccountHolder: employee.bankAccountHolder || "",
  bankName: employee.bankName || "",
  accountNumber: employee.accountNumber || "",
  ifscCode: employee.ifscCode || "",
  photoUrl: employee.photoUrl || "",
  idProofUrl: employee.idProofUrl || "",
  addressProofUrl: employee.addressProofUrl || "",
  offerLetterUrl: employee.offerLetterUrl || "",
  certificatesUrl: employee.certificatesUrl || "",
  bankProofUrl: employee.bankProofUrl || "",
});

    // Log the form data for debugging
    console.log("Edit dialog opened with employee data:", employee);
    console.log("Form data after setting:", {
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      designation: employee.designation,
      status: employee.status
    });

  } else {
    // create mode – already correct
    setEditingId(null);
    setNewEmployeeId(`EMP${String(employees.length + 1).padStart(3, "0")}`);
    setFormData(initialFormData);
    setUploadedFiles({});
    setUploadedFileObjects({});
  }
  setIsDialogOpen(true);
};

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setNewEmployeeId("");
    setFormData(initialFormData);
    setUploadedFiles({});
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleFileUpload = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    // For UI preview - filename
    setUploadedFiles((prev) => ({
      ...prev,
      [field]: file.name,
    }));

    // For actual upload - File object
    setUploadedFileObjects((prev) => ({
      ...prev,
      [field]: file,
    }));

    // Optional: formData-ல filename save if needed (but not necessary for upload)
    // handleFormChange(field as keyof FormData, file.name);
  }
};

const handleRemoveFile = (field: string) => {
  // Remove from preview (filename)
  setUploadedFiles((prev) => {
    const updated = { ...prev };
    delete updated[field];
    return updated;
  });

  // Remove actual File object - மிக முக்கியம் save time-ல duplicate போகாம இருக்க
  setUploadedFileObjects((prev) => {
    const updated = { ...prev };
    delete updated[field];
    return updated;
  });
};
// const handleSave = async () => {
//   if (!formData.firstName || !formData.email) {
//     alert("First Name and Email are required!");
//     return;
//   }

//   if (!editingId && !newEmployeeId.trim()) {
//     alert("Please enter an Employee ID (e.g., EMP002)");
//     return;
//   }

//   if (!editingId && !formData.dateOfJoining) {
//     alert("Date of Joining is required!");
//     return;
//   }

//   setSaving(true);

//   try {
//     if (editingId) {
//       // UPDATE existing employee (JSON)
//       const updateData = {
//         employee_id: formData.employeeId || undefined,
//         first_name: formData.firstName,
//         last_name: formData.lastName,
//         email: formData.email,
//         mobile: formData.phone || null,
//         dob: formData.dateOfBirth || null,
//         gender: formData.gender || null,
//         blood_group: formData.bloodGroup || null,
//         marital_status: formData.maritalStatus || null,
//         emergency_contact_name: formData.emergencyContact || null,
//         emergency_contact_phone: formData.emergencyPhone || null,
//         doj: formData.dateOfJoining || null,
//         employment_type: formData.employmentType,
//         department_id: formData.departmentId ? parseInt(formData.departmentId) : undefined,
//         designation_id: formData.designationId ? parseInt(formData.designationId) : undefined,
//         location_office: formData.location || null,
//         status: formData.status,
//         role: formData.role || undefined,
//         aadhaar: formData.aadhaar || null,
//         pan: formData.pan || null,
//         uan: formData.uan || null,
//         esic: formData.esic || null,
//         account_holder_name: formData.bankAccountHolder || null,
//         bank_name: formData.bankName || null,
//         account_number: formData.accountNumber || null,
//         ifsc_code: formData.ifscCode || null,
//       };

//       const result = await employeeApi.updateEmployee(editingId, updateData);

//       if (result.data) {
//         await refreshEmployees();
//         alert("Employee updated successfully!");
//       } else {
//         alert(result.error || "Failed to update employee");
//       }
//     } else {
//       // CREATE new employee (multipart/form-data for files)
//       const formDataToSend = new FormData();

//       // Required fields
//       formDataToSend.append("employee_id", newEmployeeId.trim().toUpperCase());
//       formDataToSend.append("first_name", formData.firstName);
//       formDataToSend.append("last_name", formData.lastName);
//       formDataToSend.append("email", formData.email);
//       formDataToSend.append("doj", formData.dateOfJoining); // ← REQUIRED! 400 error fix

//       // Optional fields
//       if (formData.phone) formDataToSend.append("mobile", formData.phone);
//       if (formData.dateOfBirth) formDataToSend.append("dob", formData.dateOfBirth);
//       if (formData.gender) formDataToSend.append("gender", formData.gender);
//       if (formData.bloodGroup) formDataToSend.append("blood_group", formData.bloodGroup); // ← fixed
//       if (formData.maritalStatus) formDataToSend.append("marital_status", formData.maritalStatus);
//       if (formData.emergencyContact) formDataToSend.append("emergency_contact_name", formData.emergencyContact);
//       if (formData.emergencyPhone) formDataToSend.append("emergency_contact_phone", formData.emergencyPhone);
//       formDataToSend.append("employment_type", formData.employmentType);
//       if (formData.departmentId) formDataToSend.append("department_id", formData.departmentId);
//       if (formData.designationId) formDataToSend.append("designation_id", formData.designationId);
//       if (formData.location) formDataToSend.append("location_office", formData.location);
//       formDataToSend.append("status", formData.status);
//       if (formData.role) formDataToSend.append("role", formData.role);
//       if (formData.aadhaar) formDataToSend.append("aadhaar", formData.aadhaar);
//       if (formData.pan) formDataToSend.append("pan", formData.pan);
//       if (formData.uan) formDataToSend.append("uan", formData.uan);
//       if (formData.esic) formDataToSend.append("esic", formData.esic);

//       // Bank details
//       if (formData.bankAccountHolder) formDataToSend.append("account_holder_name", formData.bankAccountHolder);
//       if (formData.bankName) formDataToSend.append("bank_name", formData.bankName);
//       if (formData.accountNumber) formDataToSend.append("account_number", formData.accountNumber);
//       if (formData.ifscCode) formDataToSend.append("ifsc_code", formData.ifscCode);

//       // Files - actual File objects
//       Object.keys(uploadedFileObjects).forEach((field) => {
//         const file = uploadedFileObjects[field];
//         if (file instanceof File) {
//           formDataToSend.append(field, file);
//         }
//       });

//       const result = await employeeApi.createEmployee(formDataToSend);

//       if (result.data) {
//         await refreshEmployees();
//         alert("New employee created successfully!");
//       } else {
//         alert(result.error || "Failed to create employee");
//       }
//     }

//     handleCloseDialog();
//   } catch (err) {
//     console.error("Save error:", err);
//     alert("An unexpected error occurred");
//   } finally {
//     setSaving(false);
//   }
// };


const handleSave = async () => {
  if (!formData.firstName || !formData.email) {
    alert("First Name and Email are required!");
    return;
  }

  if (!editingId && !newEmployeeId.trim()) {
    alert("Please enter an Employee ID (e.g., EMP002)");
    return;
  }

  if (!formData.dateOfJoining) {
    alert("Date of Joining is required!");
    return;
  }

  setSaving(true);

  try {
    const formDataToSend = new FormData();

    // Employee ID - Create vs Update
    if (editingId) {
      // Update mode - employee_id optional ஆக send பண்ணலாம் or skip
      if (formData.employeeId) {
        formDataToSend.append("employee_id", formData.employeeId);
      }
    } else {
      // Create mode - MUST have employee_id
      formDataToSend.append("employee_id", newEmployeeId.trim().toUpperCase());
    }

    // Basic fields
    formDataToSend.append("first_name", formData.firstName);
    formDataToSend.append("last_name", formData.lastName || "");
    formDataToSend.append("email", formData.email);
    
    // Ensure dates are sent in YYYY-MM-DD format
    const dojToSend = formData.dateOfJoining ? extractDatePart(formData.dateOfJoining) : "";
    formDataToSend.append("doj", dojToSend);
    console.log("Sending DOJ:", dojToSend); // Debug
    
    formDataToSend.append("employment_type", formData.employmentType);
    formDataToSend.append("status", formData.status);

    // Optional fields
    if (formData.phone) formDataToSend.append("mobile", formData.phone);
    if (formData.dateOfBirth) {
      const dobToSend = extractDatePart(formData.dateOfBirth);
      console.log("Sending DOB:", dobToSend); // Debug
      formDataToSend.append("dob", dobToSend);
    }
    if (formData.gender) formDataToSend.append("gender", formData.gender);
    if (formData.bloodGroup) formDataToSend.append("blood_group", formData.bloodGroup);
    if (formData.maritalStatus) formDataToSend.append("marital_status", formData.maritalStatus);
    if (formData.emergencyContact) formDataToSend.append("emergency_contact_name", formData.emergencyContact);
    if (formData.emergencyPhone) formDataToSend.append("emergency_contact_phone", formData.emergencyPhone);

    if (formData.departmentId) formDataToSend.append("department_id", formData.departmentId);
    if (formData.designationId) formDataToSend.append("designation_id", formData.designationId);
    if (formData.shift) {
      formDataToSend.append("shift_id", formData.shift.toString());
    }
    if (formData.location) formDataToSend.append("location_office", formData.location);
    if (formData.role) formDataToSend.append("role", formData.role);

    // Statutory
    if (formData.aadhaar) formDataToSend.append("aadhaar", formData.aadhaar);
    if (formData.pan) formDataToSend.append("pan", formData.pan);
    if (formData.uan) formDataToSend.append("uan", formData.uan);
    if (formData.esic) formDataToSend.append("esic", formData.esic);

    // Bank
    if (formData.bankAccountHolder) formDataToSend.append("account_holder_name", formData.bankAccountHolder);
    if (formData.bankName) formDataToSend.append("bank_name", formData.bankName);
    if (formData.accountNumber) formDataToSend.append("account_number", formData.accountNumber);
    if (formData.ifscCode) formDataToSend.append("ifsc_code", formData.ifscCode);

  
    Object.keys(uploadedFileObjects).forEach((field) => {
      const file = uploadedFileObjects[field];
      if (file instanceof File) {
        console.log(`Uploading file: ${field} -> ${file.name}`); // debug
        formDataToSend.append(field, file);
      }
    });

    // API Call
    let result;
    if (editingId) {
      result = await employeeApi.updateEmployee(editingId, formDataToSend);
    } else {
      result = await employeeApi.createEmployee(formDataToSend);
    }

    if (result.data) {
      await refreshEmployees();
      alert(editingId ? "Employee updated successfully!" : "New employee created successfully!");
      handleCloseDialog();
    } else {
      alert(result.error || "Failed to save employee");
      console.error("API Error:", result.error);
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("An unexpected error occurred. Check console for details.");
  } finally {
    setSaving(false);
  }
};



const fetchAndTransformEmployees = async () => {
  try {
    const result = await employeeApi.getEmployees();
    console.log("Raw API employees:", result);

    // The API helper returns { data: employeesArray } directly
    const apiEmployees = result.data || [];

    if (Array.isArray(apiEmployees)) {
      console.log("Raw API employees:", apiEmployees);
      
      const transformedEmployees = apiEmployees.map((emp: any) => {
        const transformed: Employee = {
          id: emp.id.toString(),
          employeeId: emp.employee_id || "",
          firstName: emp.first_name || "",
          lastName: emp.last_name || "",
          email: emp.email || "",
          phone: emp.mobile || "",
          dateOfBirth: (() => {
            if (emp.dob) {
              console.log("Raw DOB from API:", emp.dob); // Debug
              const dateOnly = extractDatePart(emp.dob);
              console.log("Processed DOB:", dateOnly); // Debug
              return dateOnly;
            }
            return "";
          })(),
          // Gender: "male" → "Male" (case fix)
          gender: (() => {
            const g = (emp.gender || "").toLowerCase().trim();
            if (g === "male") return "Male";
            if (g === "female") return "Female";
            return "Other";
          })(),
          bloodGroup: emp.blood_group || "",
          // Marital Status: "commeted" → "Married" (typo handle + case fix)
          maritalStatus: (() => {
            const ms = (emp.marital_status || "").toLowerCase().trim();
            if (ms === "single") return "Single";
            if (ms === "married") return "Married";
            if (ms === "divorced") return "Divorced";
            if (ms === "widowed") return "Widowed";
            // Handle typo in your data
            if (ms.includes("commit") || ms === "commeted") return "Married";
            return "Single";
          })(),
          emergencyContact: emp.emergency_contact_name || "",
          emergencyPhone: emp.emergency_contact_phone || "",
          departmentId: emp.department_id?.toString() || "",
          designationId: emp.designation_id?.toString() || "",
          shift: emp.shift_id?.toString() || "", // Add shift_id to the transformed data
          department: emp.department || emp.department_name || "Unknown",
          designation: emp.designation || emp.designation_name || "Unknown",
          dateOfJoining: (() => {
            if (emp.doj) {
              console.log("Raw DOJ from API:", emp.doj); // Debug
              const dateOnly = extractDatePart(emp.doj);
              console.log("Processed DOJ:", dateOnly); // Debug
              return dateOnly;
            }
            return "";
          })(),
          // Employment Type: "Full-Time" → "full-time"
          employmentType: (() => {
            const type = (emp.employment_type || "").toLowerCase().trim();
            if (type.includes("full")) return "full-time";
            if (type.includes("part")) return "part-time";
            if (type.includes("contract")) return "contract";
            if (type.includes("intern")) return "intern";
            return "full-time";
          })() as EmploymentType,
          // Status: "Active" → "active"
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
          // Bank
          bankAccountHolder: emp.bankDetails?.account_holder_name || "",
          bankName: emp.bankDetails?.bank_name || "",
          accountNumber: emp.bankDetails?.account_number || "",
          ifscCode: emp.bankDetails?.ifsc_code || "",
          // Documents
          photoUrl: emp.documents?.find((d: any) => d.fieldname === "photo")?.file_path || "",
          idProofUrl: emp.documents?.find((d: any) => d.fieldname === "id_proof")?.file_path || "",
          addressProofUrl: emp.documents?.find((d: any) => d.fieldname === "address_proof")?.file_path || "",
          offerLetterUrl: emp.documents?.find((d: any) => d.fieldname === "offer_letter")?.file_path || "",
          certificatesUrl: "",
          bankProofUrl: "",
          createdAt: emp.created_at || new Date().toISOString(),
          updatedAt: emp.updated_at || new Date().toISOString(),
        };
        
        console.log(`Transformed employee ${emp.id}:`, {
          firstName: transformed.firstName,
          lastName: transformed.lastName,
          department: transformed.department,
          designation: transformed.designation,
          status: transformed.status
        });
        
        return transformed;
      });

      console.log("Final transformed employees:", transformedEmployees);
      setEmployees(transformedEmployees);
      return transformedEmployees;
    } else {
      console.error("Unexpected API response format:", result);
      setError("Invalid data received from server");
      setEmployees([]);
      return [];
    }
  } catch (err) {
    console.error("Error fetching employees:", err);
    setError("Failed to connect to server");
    setEmployees([]);
    return [];
  }
};

const refreshEmployees = async () => {
  await fetchAndTransformEmployees();
};

  const handleDeleteClick = (id: string) => {
  setEmpToDelete(id);
  setIsDeleteDialogOpen(true);
};

const handleConfirmDelete = async () => {
  if (empToDelete) {
    const result = await employeeApi.deleteEmployee(empToDelete);

    if (result.success) {
      // Local state update
      setEmployees((prev) => prev.filter((emp) => emp.id !== empToDelete));
      alert("Employee deleted successfully!");
    } else {
      alert(result.error || "Failed to delete employee");
    }

    setIsDeleteDialogOpen(false);
    setEmpToDelete(null);
  }
};
   
    // Fetch departments and designations on mount

useEffect(() => {
  const fetchOptions = async () => {
    try {
      const deptResult = await employeeApi.getDepartments();
      console.log("Raw departments response:", deptResult);

      // Response is { success: true, departments: [...] }
      if (deptResult.data?.departments && Array.isArray(deptResult.data.departments)) {
        const formattedDepts = deptResult.data.departments.map((dept: any) => ({
          id: dept.id.toString(),  // number → string
          name: dept.name || "Unknown"
        }));
        setDepartments(formattedDepts);
      } else {
        console.warn("No valid departments array in response");
        setDepartments([]);
      }

      const desigResult = await employeeApi.getDesignations();
      console.log("Raw designations response:", desigResult);

      if (desigResult.data?.designations && Array.isArray(desigResult.data.designations)) {
        const formattedDesigs = desigResult.data.designations.map((desig: any) => ({
          id: desig.id.toString(),
          name: desig.name || "Unknown"
        }));
        setDesignations(formattedDesigs);
      } else {
        console.warn("No valid designations array in response");
        setDesignations([]);
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      setDepartments([]);
      setDesignations([]);
    }
  };
  fetchOptions();
}, []);
  // Fetch employees when component mounts
    useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      await fetchAndTransformEmployees();
      setLoading(false);
    };

    fetchEmployees();
  }, []);
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <Users className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">Employee Management</span>
            <span className="sm:hidden">Employees</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Manage employee records and information</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">{employees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Active</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                {employees.filter((e) => e.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Departments</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">{new Set(employees.map((e) => e.department)).size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:block">Total Payroll</div>
              <div className="text-xs sm:hidden font-medium text-muted-foreground">Payroll</div>
              <div className="text-base sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 truncate">
                ₹{(employees.reduce((sum, e) => sum + (e.salary || 0), 0) / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
  {/* <Label htmlFor="departmentId">Department</Label> */}
  {/* <Select 
    value={formData.departmentId} 
    onValueChange={(val) => handleFormChange("departmentId", val)}
  >
    <SelectTrigger id="departmentId" className="mt-2">
      <SelectValue placeholder="Select Department" />
    </SelectTrigger>
    <SelectContent>
      {Array.isArray(departments) && departments.length > 0 ? (
        departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.name}
          </SelectItem>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Loading departments... or No departments found
        </div>
      )}
    </SelectContent>
  </Select> */}
   </div>

  <div>
  {/* <Label htmlFor="designationId">Designation</Label> */}
  {/* <Select 
    value={formData.designationId} 
    onValueChange={(val) => handleFormChange("designationId", val)}
  >
    <SelectTrigger id="designationId" className="mt-2">
      <SelectValue placeholder="Select Designation" />
    </SelectTrigger>
    <SelectContent>
      {Array.isArray(designations) && designations.length > 0 ? (
        designations.map((des) => (
          <SelectItem key={des.id} value={des.id}>
            {des.name}
          </SelectItem>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Loading designations... or No designations found
        </div>
      )}
    </SelectContent>
  </Select> */}
</div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {canCreateEmployee && (
                  <Button onClick={() => handleOpenDialog()} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Employee
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            <CardDescription>
              Showing {filteredEmployees.length} of {employees.length} employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[65px]">ID</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[110px]">Name</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[160px]">Email</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[100px]">Department</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[110px]">Designation</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[100px]">Shift</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[75px]">Status</th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[55px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{emp.employeeId || emp.id}</td>
                          <td className="px-2 py-2.5 font-medium whitespace-nowrap">
                            {emp.firstName} {emp.lastName}
                          </td>
                          <td className="px-2 py-2.5 text-xs truncate" title={emp.email}>{emp.email}</td>
                          <td className="px-2 py-2.5 text-xs whitespace-nowrap">{emp.department}</td>
                          <td className="px-2 py-2.5 text-xs whitespace-nowrap">{emp.designation}</td>
                          <td className="px-2 py-2.5 text-xs whitespace-nowrap">
                            {emp.shift ? 
                              (shifts.find(s => s.id.toString() === emp.shift)?.name || emp.shift)
                              : 'N/A'}
                          </td>
                          <td className="px-2 py-2.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded border inline-block ${getStatusBadgeClass(emp.status)}`}>
                              {getStatusLabel(emp.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            {!user?.roles.includes("hr") && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleOpenDialog(emp)}
                                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(emp.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="border border-border rounded-lg p-3 sm:p-4 bg-card hover:bg-muted/50 transition-colors space-y-2 sm:space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                           {emp.employeeId || emp.id}
                            </span>
                            <h3 className="font-bold text-sm sm:text-base truncate">{emp.firstName} {emp.lastName}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                        </div>
                        {!user?.roles.includes("hr") && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenDialog(emp)}
                              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(emp.id)}
                              className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block">Department</label>
                          <p className="font-medium truncate">{emp.department}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block">Designation</label>
                          <p className="font-medium truncate">{emp.designation}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block">Status</label>
                          <span className={`text-xs px-1.5 py-0.5 rounded border inline-block ${getStatusBadgeClass(emp.status)}`}>
                            {getStatusLabel(emp.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingId ? "Update employee information" : "Fill in all employee details"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto gap-1 md:gap-0 bg-muted p-1">
              <TabsTrigger value="personal" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Personal</span>
                <span className="sm:hidden">Person</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Employment</span>
                <span className="sm:hidden">Employ</span>
              </TabsTrigger>
              <TabsTrigger value="statutory" className="text-xs sm:text-sm py-2">
                <span className="hidden md:inline">Statutory</span>
                <span className="md:hidden">Stat</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="text-xs sm:text-sm py-2">Bank</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm py-2">
                <span className="hidden md:inline">Documents</span>
                <span className="md:hidden">Docs</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-3 sm:space-y-4 mt-4">
              <div>
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
  id="employeeId"
  placeholder="e.g., EMP001"
  value={formData.employeeId || newEmployeeId}
  onChange={(e) => {
    if (!editingId) {
      setNewEmployeeId(e.target.value.toUpperCase());
    } else {
      handleFormChange("employeeId", e.target.value.toUpperCase());
    }
  }}
  disabled={!!editingId}  // edit mode-ல change பண்ண வேண்டாம்
  className={`mt-2 ${editingId ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
/>
                {!editingId && (
                  <p className="text-xs text-muted-foreground mt-1">Enter Employee ID (e.g., EMP001, EMP002)</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender || ""} onValueChange={(val) => handleFormChange("gender", val)}>
                    <SelectTrigger id="gender" className="mt-2">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup || ""} onValueChange={(val) => handleFormChange("bloodGroup", val)}>
                    <SelectTrigger id="bloodGroup" className="mt-2">
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <div>
  
  <Input
    id="maritalStatus"
    value={formData.maritalStatus || ""}
    onChange={(e) => handleFormChange("maritalStatus", e.target.value)}
    placeholder="e.g., Married, Single, Committed"
    className="mt-2"
  />
</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact || ""}
                      onChange={(e) => handleFormChange("emergencyContact", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone || ""}
                      onChange={(e) => handleFormChange("emergencyPhone", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-3 sm:space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input
                    id="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => handleFormChange("dateOfJoining", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(val) => handleFormChange("employmentType", val)}
                  >
                    <SelectTrigger id="employmentType" className="mt-2">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shift">Shift</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(val) => handleFormChange("shift", val)}
                    disabled={loadingShifts}
                  >
                    <SelectTrigger id="shift" className="mt-2">
                      <SelectValue placeholder={
                        loadingShifts ? "Loading shifts..." : 
                        shifts.length === 0 ? "No shifts available" : "Select a shift"
                      }>
                        {formData.shift && shifts.length > 0 && (
                          <span>{
                            shifts.find(s => s.id.toString() === formData.shift)?.name || 
                            `Shift ${formData.shift}`
                          }</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.length > 0 ? (
                        shifts.map((shift) => {
                          // Use the correct property names based on the Shift interface
                          const startTime = shift.startTime || shift.start_time || '';
                          const endTime = shift.endTime || shift.end_time || '';
                          
                          return (
                            <SelectItem 
                              key={shift.id.toString()} 
                              value={shift.id.toString()}
                            >
                              {shift.name} ({startTime} - {endTime})
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No shifts available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="department">Department</Label>
    <Select 
      value={formData.department} 
      onValueChange={(val) => handleFormChange("department", val)}
    >
      <SelectTrigger id="department" className="mt-2">
        <SelectValue placeholder="Select Department" />
      </SelectTrigger>
      <SelectContent>
        {departments && departments.length > 0 ? (
          departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.name}>
              {dept.name}
            </SelectItem>
          ))
        ) : (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            No departments available
          </p>
        )}
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label htmlFor="designation">Designation</Label>
    <Select 
      value={formData.designation} 
      onValueChange={(val) => handleFormChange("designation", val)}
    >
      <SelectTrigger id="designation" className="mt-2">
        <SelectValue placeholder="Select Designation" />
      </SelectTrigger>
      <SelectContent>
        {designations && designations.length > 0 ? (
          designations.map((des) => (
            <SelectItem key={des.id} value={des.name}>
              {des.name}
            </SelectItem>
          ))
        ) : (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            No designations available
          </p>
        )}
      </SelectContent>
    </Select>
  </div>
</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role || ""}
                    onChange={(e) => handleFormChange("role", e.target.value)}
                    placeholder="e.g., Admin, Manager, User"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location/Office</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => handleFormChange("location", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(val: any) => handleFormChange("status", val)}>
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Statutory Tab */}
            <TabsContent value="statutory" className="space-y-3 sm:space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    value={formData.aadhaar || ""}
                    onChange={(e) => handleFormChange("aadhaar", e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="pan">PAN (Permanent Account Number)</Label>
                  <Input
                    id="pan"
                    value={formData.pan || ""}
                    onChange={(e) => handleFormChange("pan", e.target.value)}
                    placeholder="XXXXX0000X"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uan">UAN (Universal Account Number)</Label>
                  <Input
                    id="uan"
                    value={formData.uan || ""}
                    onChange={(e) => handleFormChange("uan", e.target.value)}
                    placeholder="XXXXXXXXXXXX"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="esic">ESIC Number</Label>
                  <Input
                    id="esic"
                    value={formData.esic || ""}
                    onChange={(e) => handleFormChange("esic", e.target.value)}
                    placeholder="XXXXXXXXXXXX"
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Bank Details Tab */}
            <TabsContent value="bank" className="space-y-3 sm:space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="bankAccountHolder">Account Holder Name</Label>
                  <Input
                    id="bankAccountHolder"
                    value={formData.bankAccountHolder || ""}
                    onChange={(e) => handleFormChange("bankAccountHolder", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName || ""}
                    onChange={(e) => handleFormChange("bankName", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber || ""}
                    onChange={(e) => handleFormChange("accountNumber", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode || ""}
                    onChange={(e) => handleFormChange("ifscCode", e.target.value)}
                    placeholder="XXXXX0000XXX"
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
           {/* Documents Tab */}
<TabsContent value="documents" className="space-y-4 sm:space-y-6 mt-4">
  {[
    { field: "photo", label: "Photo", description: "Employee profile photo (JPG/PNG)" },
    { field: "id_proof", label: "ID Proof", description: "Aadhaar, PAN, Passport, etc." },
    { field: "address_proof", label: "Address Proof", description: "Utility bill, rental agreement, etc." },
    { field: "offer_letter", label: "Offer Letter", description: "Original joining offer letter" },
    { field: "certificates", label: "Educational Certificates", description: "Degree, diploma certificates (multiple allowed)" },
    { field: "bank_proof", label: "Bank Proof", description: "Cancelled cheque or passbook front page" },
  ].map((doc) => (
    <div key={doc.field} className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Label className="text-base font-semibold">{doc.label}</Label>
          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
        </div>
        {uploadedFiles[doc.field] && (
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
            ✓ Uploaded
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
          <Upload className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Choose File</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(doc.field, e)}
            accept=".jpg,.jpeg,.png,.pdf"
          />
        </label>

        {uploadedFiles[doc.field] && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {uploadedFiles[doc.field]}
            </span>
           <button
  onClick={() => handleRemoveFile(doc.field)}
  className="ml-2 p-1 hover:bg-muted-foreground/20 rounded transition-colors"
>
  <X className="w-4 h-4 text-muted-foreground" />
</button>
          </div>
        )}
      </div>
    </div>
  ))}
</TabsContent>
          </Tabs>

          <div className="flex gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 border-t pt-3 sm:pt-4 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
  onClick={handleSave} 
  disabled={saving} 
  className="w-full sm:w-auto"
>
  {saving ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {editingId ? "Updating..." : "Adding..."}
    </>
  ) : (
    editingId ? "Update Employee" : "Add Employee"
  )}
</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

