import { notifyDeletionPending } from "@/lib/deletionDrafts";
import { InlineEdit, saveInline } from "@/components/InlineEdit";
import React, { useState, useMemo, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Layout } from "@/components/Layout";
import { useRole } from "@/context/RoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { employeeApi } from "@/components/helper/employee/employee";
import ENDPOINTS from "@/lib/endpoint";
import { roleApi } from "@/components/helper/roles/roles";
import shiftApi, { Shift } from "@/components/helper/shifts/shifts";
import {
  departmentApi,
  Department,
} from "@/components/helper/department/department";
import {
  designationApi,
  Designation,
} from "@/components/helper/designation/designation";
import branchApi, { Branch } from "@/components/helper/branch/branch";
import { showToast } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Loader2,
  MapPin,
  Download,
  FileSpreadsheet,
  FileUp,
  Calendar,
  Eye,
} from "lucide-react";
import {
  Employee,
  EmploymentType,
  EmployeeStatus,
  getEmploymentTypeLabel,
  getStatusLabel,
  getStatusBadgeClass,
} from "@/lib/employees";
import {
  isValidEmail,
  normalizeEmail,
  sanitizePhoneInput,
} from "@/lib/validation";

// Extend the Employee type with list-only fields from the API
interface EmployeeListItem extends Employee {
  shift_id?: number | string;
  shiftName?: string;
  branchId?: string;
  branchName?: string;
  salary_type?: "MONTHLY" | "HOURLY";
  monthly_salary?: number;
  hourly_rate?: number;
  overtime_hourly_rate?: number;
  subscription_plan_id?: number;
}

interface SubscriptionSeatPool {
  id: number;
  plan_id: number;
  plan_name: string;
  billing_cycle: "monthly" | "yearly";
  max_users: number;
  assigned_users: number;
  available_users: number;
}

type FormData = Omit<Employee, "id" | "createdAt" | "updatedAt"> & {
  employeeId: string;
  branchId?: string;
  shift: string;
  enableLiveTracking: boolean;
  officePhone?: string;
  officeEmail?: string;
  salary?: number;
  salaryType?: "MONTHLY" | "HOURLY";
  monthlySalary?: number;
  hourlyRate?: number;
  overtimeHourlyRate?: number;
  subscriptionBillingCycle: "monthly" | "yearly" | "";
  subscriptionPlanId: string;
};

const initialFormData: FormData = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  branchId: "",
  officePhone: "",
  officeEmail: "",
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
  salary: 0,
  salaryType: "MONTHLY",
  monthlySalary: 0,
  hourlyRate: 0,
  overtimeHourlyRate: 0,
  subscriptionBillingCycle: "",
  subscriptionPlanId: "",
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
  enableLiveTracking: false,
};

const departments = [
  "Engineering",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
];
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
    const trimmedDate = String(dateString).trim();

    // If it's already in YYYY-MM-DD format, return as-is
    if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return trimmedDate;
    }

    const dayFirstMatch = trimmedDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dayFirstMatch) {
      const [, day, month, year] = dayFirstMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle ISO date strings with timezone
    const date = new Date(trimmedDate);

    // Get the date parts in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return String(dateString).split("T")[0] || "";
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const splitISODate = (value?: string) => {
  const normalized = extractDatePart(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return { year: "", month: "", day: "" };
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
};

const buildISODate = (year: string, month: string, day: string) => {
  if (!year || !month || !day) return "";

  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (
    !Number.isFinite(numericYear) ||
    !Number.isFinite(numericMonth) ||
    !Number.isFinite(numericDay)
  ) {
    return "";
  }

  const safeMonth = clamp(numericMonth, 1, 12);
  const safeDay = clamp(numericDay, 1, getDaysInMonth(numericYear, safeMonth));

  return `${String(numericYear).padStart(4, "0")}-${String(safeMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};

const formatDateForDisplay = (value?: string) => {
  const { year, month, day } = splitISODate(value);
  if (!year || !month || !day) return "";
  return `${day}-${month}-${year}`;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEAR_WHEEL_SPEED = 6;

const normalizeManualDateInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("-");
};

const parseManualDisplayDate = (value: string) => {
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  return buildISODate(year, month, day);
};

const FastDateInput = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value?: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatDateForDisplay(value));
  const currentYear = new Date().getFullYear();
  const parsed = splitISODate(value);
  const selectedYear = Number(parsed.year) || 1990;
  const selectedMonth = Number(parsed.month) || 1;
  const selectedDay = Number(parsed.day) || 1;
  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1899 },
        (_, index) => currentYear - index,
      ),
    [currentYear],
  );
  const daysInSelectedMonth = getDaysInMonth(selectedYear, selectedMonth);

  useEffect(() => {
    setDisplayValue(formatDateForDisplay(value));
  }, [value]);

  const setDate = (
    year: number,
    month: number,
    day: number,
    closePicker = false,
  ) => {
    onChange(buildISODate(String(year), String(month), String(day)));
    if (closePicker) {
      setOpen(false);
    }
  };

  const handleManualChange = (nextValue: string) => {
    const normalizedValue = normalizeManualDateInput(nextValue);
    setDisplayValue(normalizedValue);

    if (!normalizedValue) {
      onChange("");
      return;
    }

    const parsedValue = parseManualDisplayDate(normalizedValue);
    if (parsedValue) {
      onChange(parsedValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative mt-2">
        <Input
          id={id}
          inputMode="numeric"
          value={displayValue}
          onChange={(event) => handleManualChange(event.target.value)}
          onBlur={() => {
            const parsedValue = parseManualDisplayDate(displayValue);
            if (parsedValue) {
              setDisplayValue(formatDateForDisplay(parsedValue));
            }
          }}
          placeholder="dd-mm-yyyy"
          className="pr-11"
        />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
            aria-label="Open date picker"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-[320px] p-3">
        <div className="grid grid-cols-[1fr_104px] gap-3">
          <div className="space-y-3">
            <Select
              value={String(selectedMonth).padStart(2, "0")}
              onValueChange={(month) => {
                const nextMonth = Number(month);
                setDate(
                  selectedYear,
                  nextMonth,
                  clamp(
                    selectedDay,
                    1,
                    getDaysInMonth(selectedYear, nextMonth),
                  ),
                );
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_LABELS.map((label, index) => {
                  const month = String(index + 1).padStart(2, "0");
                  return (
                    <SelectItem key={month} value={month}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                <div key={`${label}-${index}`}>{label}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({
                length: new Date(selectedYear, selectedMonth - 1, 1).getDay(),
              }).map((_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {Array.from(
                { length: daysInSelectedMonth },
                (_, index) => index + 1,
              ).map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={day === selectedDay ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setDate(selectedYear, selectedMonth, day, true)
                  }
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          <div
            className="max-h-64 overflow-y-auto rounded-md border bg-slate-50"
            onWheel={(event) => {
              event.currentTarget.scrollTop += event.deltaY * YEAR_WHEEL_SPEED;
              event.preventDefault();
            }}
          >
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className={`block w-full border-b px-3 py-2 text-left text-sm hover:bg-white ${
                  year === selectedYear
                    ? "bg-primary text-primary-foreground hover:bg-primary"
                    : ""
                }`}
                onClick={() =>
                  setDate(
                    year,
                    selectedMonth,
                    clamp(selectedDay, 1, getDaysInMonth(year, selectedMonth)),
                  )
                }
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const isLocationTrackingEnabled = (value: unknown): boolean =>
  value === 1 || value === "1" || value === true;

const normalizeExcelHeader = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const excelDateToISO = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.toISOString().split("T")[0];
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

const normalizeImportedEmploymentType = (value: unknown): EmploymentType => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized.includes("part")) return "part-time";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("intern")) return "intern";
  return "full-time";
};

const normalizeImportedStatus = (value: unknown): EmployeeStatus => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "inactive") return "inactive";
  if (normalized === "terminated") return "terminated";
  if (normalized === "on leave" || normalized === "on-leave") return "on-leave";
  return "active";
};

const getDocumentByField = (documents: any[] | undefined, field: string) =>
  (documents || []).find(
    (document: any) =>
      document?.fieldname === field || document?.type === field,
  );

const normalizeRoleKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeRoleOptions = (roleNames: unknown[]) => {
  const rolesByKey = new Map<string, string>();

  roleNames.forEach((roleName) => {
    const label = String(roleName || "").trim();
    const key = normalizeRoleKey(label);
    if (!key || rolesByKey.has(key)) return;
    rolesByKey.set(key, label);
  });

  return Array.from(rolesByKey.values()).sort((a, b) => a.localeCompare(b));
};

const getCanonicalRoleValue = (value: unknown, roleOptions: string[]) => {
  const roleKey = normalizeRoleKey(value);
  if (!roleKey) return "";
  return (
    roleOptions.find((roleName) => normalizeRoleKey(roleName) === roleKey) ||
    String(value || "").trim()
  );
};

const isNumericLike = (value: unknown) => /^\d+$/.test(String(value || "").trim());

export default function EmployeeList() {
  const { canPerformModuleAction } = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | "all">(
    "all",
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] =
    useState<EmployeeListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmployeeId, setNewEmployeeId] = useState<string>("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [empToDelete, setEmpToDelete] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(
    {},
  );
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [designations, setDesignations] = useState<
    { id: string; name: string }[]
  >([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [uploadedFileObjects, setUploadedFileObjects] = useState<
    Record<string, File>
  >({});
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [importingExcel, setImportingExcel] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [emailDuplicateCheck, setEmailDuplicateCheck] = useState<{
    checking: boolean;
    error: string | null;
  }>({ checking: false, error: null });
  const [showNoLoginWarningDialog, setShowNoLoginWarningDialog] =
    useState(false);
  const [subscriptionSeatPools, setSubscriptionSeatPools] = useState<
    SubscriptionSeatPool[]
  >([]);

  // Add-on dialog states
  const [isAddOnDialogOpen, setIsAddOnDialogOpen] = useState(false);
  const [addOnType, setAddOnType] = useState<
    "department" | "designation" | "role"
  >("department");
  const [addOnFormData, setAddOnFormData] = useState<{
    name: string;
    costCenter?: string;
    headId?: string;
  }>({ name: "" });
  const [addOnSaving, setAddOnSaving] = useState(false);

  const tabOrder = ["personal", "employment", "statutory", "bank", "documents"];
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDialogOpen) {
      setEmailDuplicateCheck({ checking: false, error: null });
      return;
    }

    const email = (formData.email || "").trim();
    if (!email || !isValidEmail(email)) {
      setEmailDuplicateCheck({ checking: false, error: null });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    let isCurrent = true;
    setEmailDuplicateCheck({ checking: true, error: null });

    const timeoutId = window.setTimeout(async () => {
      const result = await employeeApi.checkEmployeeDuplicate(
        "email",
        normalizedEmail,
        editingId,
      );

      if (!isCurrent) return;

      if (result.error) {
        setEmailDuplicateCheck({ checking: false, error: result.error });
        return;
      }

      setEmailDuplicateCheck({
        checking: false,
        error: result.exists ? result.message || "Email already exists" : null,
      });
    }, 500);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [formData.email, editingId, isDialogOpen]);

  // Load shifts from backend
  const loadShifts = async () => {
    setLoadingShifts(true);
    try {
      const { data, error } = await shiftApi.getShifts();
      if (error) {
        showToast.error(error);
      } else if (data) {
        // Transform the shift data to ensure consistent property names
        const transformedShifts = data.map((shift) => ({
          ...shift,
          id: shift.id.toString(), // Ensure ID is always a string
          startTime: shift.startTime || shift.start_time,
          endTime: shift.endTime || shift.end_time,
          gracePeriod: shift.gracePeriod || shift.grace_period,
          halfDayThreshold: shift.halfDayThreshold || shift.half_day_threshold,
          otEligible: shift.otEligible || shift.ot_eligible,
          createdAt: shift.createdAt || shift.created_at,
        }));
        setShifts(transformedShifts);
      }
    } catch (error) {
      console.error("Error loading shifts:", error);
      showToast.error("Failed to load shifts");
    } finally {
      setLoadingShifts(false);
    }
  };

  // Load departments, designations, and roles on component mount
  useEffect(() => {
    const loadSubscriptionSeatPools = async () => {
      try {
        const response = await ENDPOINTS.getCurrentSubscription();
        setSubscriptionSeatPools(response.data?.data?.seat_pools || []);
      } catch (error) {
        console.error("Error loading subscription packages:", error);
        setSubscriptionSeatPools([]);
      }
    };
    const loadDepartments = async () => {
      try {
        const result = await departmentApi.getdepartment();
        if (result.data) {
          setDepartments(result.data);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
      }
    };

    const loadDesignations = async () => {
      try {
        const result = await designationApi.getDesignations();
        if (result.data) {
          setDesignations(result.data);
        }
      } catch (error) {
        console.error("Error loading designations:", error);
      }
    };

    const loadBranches = async () => {
      try {
        const result = await branchApi.getBranches();
        if (result.data) {
          setBranches(result.data);
        }
      } catch (error) {
        console.error("Error loading branches:", error);
      }
    };

    const loadRoles = async () => {
      try {
        const result = await roleApi.getRoles();
        if (result.data) {
          setRoles(normalizeRoleOptions(result.data.map((role) => role.name)));
        }
      } catch (error) {
        console.error("Error loading roles:", error);
      }
    };

    loadDepartments();
    loadDesignations();
    loadBranches();
    loadRoles();
    loadShifts();
    loadSubscriptionSeatPools();
  }, []);

  // Add-on dialog handlers
  const handleOpenAddOnDialog = (
    type: "department" | "designation" | "role",
  ) => {
    setAddOnType(type);
    setAddOnFormData({ name: "" });
    setIsAddOnDialogOpen(true);
  };

  const handleCloseAddOnDialog = () => {
    setIsAddOnDialogOpen(false);
    setAddOnFormData({ name: "" });
  };

  const handleSaveAddOn = async () => {
    if (!addOnFormData.name.trim()) {
      showToast.error("Name is required");
      return;
    }

    setAddOnSaving(true);
    try {
      let result;
      if (addOnType === "department") {
        result = await departmentApi.createDepartment({
          name: addOnFormData.name,
          costCenter: addOnFormData.costCenter || "",
          headId: addOnFormData.headId,
        });
        if (result.data) {
          const deptResult = await departmentApi.getdepartment();
          if (deptResult.data) {
            setDepartments(deptResult.data);
          }
          showToast.success("Department created successfully");
        }
      } else if (addOnType === "designation") {
        result = await designationApi.createDesignation({
          name: addOnFormData.name,
        });
        if (result.data) {
          const desResult = await designationApi.getDesignations();
          if (desResult.data) {
            setDesignations(desResult.data);
          }
          showToast.success("Designation created successfully");
        }
      } else if (addOnType === "role") {
        result = await roleApi.createRole({
          name: addOnFormData.name,
          modules: {},
          approval_authority: "",
          data_visibility: "",
          description: "",
        });
        if (result.data) {
          const roleResult = await roleApi.getRoles();
          if (roleResult.data) {
            setRoles(
              normalizeRoleOptions(roleResult.data.map((role) => role.name)),
            );
          }
          showToast.success("Role created successfully");
        }
      }

      if (result.error) {
        showToast.error(result.error);
      }

      handleCloseAddOnDialog();
    } catch (error) {
      console.error("Error creating add-on:", error);
      showToast.error("Failed to create");
    } finally {
      setAddOnSaving(false);
    }
  };

  // Debug: Log shift-related data
  useEffect(() => {
    if (isDialogOpen && editingId) {
      // console.log("Current formData.shift:", formData.shift);
      // console.log("Available shifts:", shifts);
      const selectedShift = shifts.find(
        (s) => s.id.toString() === formData.shift,
      );
      // console.log("Selected shift:", selectedShift);
    }
  }, [formData.shift, shifts, isDialogOpen, editingId]);

  // Module action permissions
  const canCreateEmployee = canPerformModuleAction("employees", "create");
  const canEditEmployee = canPerformModuleAction("employees", "edit");
  const canDeleteEmployee = canEditEmployee;

  const filteredEmployees = useMemo(() => {
    // Apply only search and filter controls (removing role-based filtering)
    const finalFiltered = employees.filter((emp) => {
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        (emp.employeeId?.toLowerCase() || "").includes(searchLower) ||
        (emp.firstName?.toLowerCase() || "").includes(searchLower) ||
        (emp.lastName?.toLowerCase() || "").includes(searchLower) ||
        (emp.email?.toLowerCase() || "").includes(searchLower);

      const matchesDept =
        filterDept === "all" || emp.departmentId === filterDept;
      const matchesStatus =
        filterStatus === "all" || emp.status === filterStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });

    return finalFiltered;
  }, [employees, searchTerm, filterDept, filterStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / itemsPerPage),
  );
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept, filterStatus, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!formData.role || roles.length === 0) return;

    const canonicalRole = getCanonicalRoleValue(formData.role, roles);
    if (canonicalRole && canonicalRole !== formData.role) {
      setFormData((prev) => ({ ...prev, role: canonicalRole }));
    }
  }, [formData.role, roles]);

  const getShiftById = (shiftId?: string | number) =>
    shifts.find((shift) => String(shift.id) === String(shiftId || ""));

  const getShiftByName = (shiftName?: string) => {
    const normalizedName = String(shiftName || "").trim().toLowerCase();
    if (!normalizedName) return undefined;
    return shifts.find(
      (shift) => String(shift.name || "").trim().toLowerCase() === normalizedName,
    );
  };

  const getEmployeeShiftId = (employee: EmployeeListItem) => {
    const explicitShiftId = employee.shift_id?.toString();
    if (explicitShiftId) return explicitShiftId;

    const shiftValue = String(employee.shift || "").trim();
    if (isNumericLike(shiftValue)) return shiftValue;

    return getShiftByName(employee.shiftName || shiftValue)?.id?.toString() || "";
  };

  const getEmployeeShiftLabel = (employee: EmployeeListItem) => {
    const shiftId = getEmployeeShiftId(employee);
    const shiftById = getShiftById(shiftId);
    if (shiftById?.name) return shiftById.name;

    const shiftName = String(employee.shiftName || employee.shift || "").trim();
    if (shiftName && !isNumericLike(shiftName)) return shiftName;

    return "N/A";
  };

  const handleOpenViewDialog = (employee: EmployeeListItem) => {
    setViewingEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleOpenDialog = (employee?: EmployeeListItem) => {
    if (employee && !canEditEmployee) {
      showToast.error("You do not have permission to edit employees");
      return;
    }

    if (employee) {
      const employeePlanId = String((employee as any).subscription_plan_id || "");
      const employeeBillingCycle =
        (employee as any).subscription_billing_cycle === "yearly"
          ? "yearly"
          : "monthly";
      const currentPool = subscriptionSeatPools.find(
        (pool) =>
          String(pool.plan_id) === employeePlanId &&
          pool.billing_cycle === employeeBillingCycle,
      );
      const fallbackPool =
        currentPool ||
        subscriptionSeatPools.find((pool) => pool.available_users > 0) ||
        subscriptionSeatPools[0];

      // console.log("Opening dialog with employee:", employee);
      // console.log("Employee shift_id:", (employee as any).shift_id);
      // console.log("Employee shift:", employee.shift);
      setEditingId(employee.id.toString());
      setFormData({
        employeeId: employee.employeeId || "",
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        officePhone: (employee as any).officePhone || "",
        officeEmail: (employee as any).officeEmail || "",
        dateOfBirth: extractDatePart(employee.dateOfBirth),
        gender: employee.gender || "",
        bloodGroup: employee.bloodGroup || "",
        maritalStatus: employee.maritalStatus || "",
        emergencyContact: employee.emergencyContact || "",
        emergencyPhone: employee.emergencyPhone || "",
        departmentId: employee.departmentId || "",
        branchId:
          (employee as any).branchId?.toString() ||
          (employee as any).branch_id?.toString() ||
          "",
        // Handle shift from the API response
        shift: getEmployeeShiftId(employee),
        designationId: employee.designationId || "",
        department: employee.department || "",
        designation: employee.designation || "",
        dateOfJoining: employee.dateOfJoining || "",
        employmentType: employee.employmentType || "full-time",
        status: employee.status || "active",
        role: getCanonicalRoleValue(employee.role, roles),
        location: employee.location || "",
        salary: employee.salary || 0,
        salaryType: (employee as any).salary_type || "MONTHLY",
        monthlySalary: Number((employee as any).monthly_salary ?? employee.salary) || 0,
        hourlyRate: Number((employee as any).hourly_rate) || 0,
        overtimeHourlyRate: Number((employee as any).overtime_hourly_rate) || 0,
        subscriptionBillingCycle:
          fallbackPool?.billing_cycle || employeeBillingCycle,
        subscriptionPlanId: fallbackPool
          ? String(fallbackPool.plan_id)
          : employeePlanId,
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
        // Map location_tracking_enabled from the API to enableLiveTracking in the form
        // Handle number (1/0), string ("1"/login"0"), and boolean values safely
        enableLiveTracking: isLocationTrackingEnabled(
          employee.location_tracking_enabled,
        ),
      });

      // Log the form data for debugging
      // console.log("Edit dialog opened with employee data:", employee);
      // console.log("Form data after setting:", {
      //   firstName: employee.firstName,
      //   lastName: employee.lastName,
      //   department: employee.department,
      //   designation: employee.designation,
      //   status: employee.status,
      // });

      setUploadedFiles({
        photo: employee.photoUrl ? "Existing photo" : "",
        id_proof: employee.idProofUrl ? "Existing ID proof" : "",
        address_proof: employee.addressProofUrl ? "Existing address proof" : "",
        offer_letter: employee.offerLetterUrl ? "Existing offer letter" : "",
        certificates: employee.certificatesUrl ? "Existing certificates" : "",
        bank_proof: employee.bankProofUrl ? "Existing bank proof" : "",
      });
      setUploadedFileObjects({});
    } else {
      // create mode – reset to personal tab
      setEditingId(null);
      setActiveTab("personal");
      setNewEmployeeId(`EMP${String(employees.length + 1).padStart(3, "0")}`);
      setFormData({
        ...initialFormData,
      });
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
    setUploadedFileObjects({});
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneInputChange = (
    field: "phone" | "emergencyPhone" | "officePhone",
    value: string,
  ) => {
    const rawDigits = value.replace(/\D/g, "");
    const digitsOnly = sanitizePhoneInput(value);
    if (rawDigits.length > 10) {
      showToast.error("Phone number cannot exceed 10 digits");
    }
    if (digitsOnly.length > 0 && !/^[6-9]/.test(digitsOnly)) {
      showToast.error("Phone number must start with 6, 7, 8, or 9");
      return;
    }
    handleFormChange(field, digitsOnly.slice(0, 10));
  };

  const isOptionalTenDigitPhoneValid = (value?: string) => {
    if (!value || !value.trim()) return true;
    return /^[6-9]\d{9}$/.test(value.replace(/\D/g, ""));
  };

  const handleDigitsOnlyChange = (
    field: "aadhaar" | "uan" | "esic" | "accountNumber",
    value: string,
    maxLength: number,
  ) => {
    const digits = value.replace(/\D/g, "").slice(0, maxLength);
    handleFormChange(field, digits);
  };

  const handleUpperAlphaNumericChange = (
    field: "pan" | "ifscCode",
    value: string,
    maxLength: number,
  ) => {
    const sanitized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, maxLength);
    handleFormChange(field, sanitized);
  };

  const handleAlphabeticNameChange = (
    field: "bankAccountHolder",
    value: string,
  ) => {
    const sanitized = value
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^\s+/, "");
    handleFormChange(field, sanitized);
  };

  const handleBankNameChange = (value: string) => {
    const sanitized = value
      .replace(/[^A-Za-z\s.&'-]/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^\s+/, "");
    handleFormChange("bankName", sanitized);
  };

  const isValidAadhaar = (value?: string) =>
    !value || /^\d{12}$/.test(value.replace(/\D/g, ""));
  const isValidPan = (value?: string) =>
    !value ||
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(value).trim().toUpperCase());
  const isValidUan = (value?: string) =>
    !value || /^\d{12}$/.test(value.replace(/\D/g, ""));
  const isValidEsic = (value?: string) =>
    !value || /^\d{10}$/.test(value.replace(/\D/g, ""));
  const isValidIfsc = (value?: string) =>
    !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(value).trim().toUpperCase());
  const isValidAccountNumber = (value?: string) =>
    !value || /^\d{9,18}$/.test(value.replace(/\D/g, ""));

  const validateStatutoryAndBank = (): string | null => {
    if (!isValidAadhaar(formData.aadhaar)) {
      return "Aadhaar must be exactly 12 digits";
    }
    if (!isValidPan(formData.pan)) {
      return "PAN format is invalid (Example: ABCDE1234F)";
    }
    if (!isValidUan(formData.uan)) {
      return "UAN must be exactly 12 digits";
    }
    if (!isValidEsic(formData.esic)) {
      return "ESIC must be exactly 10 digits";
    }

    const bankFields = [
      formData.bankAccountHolder,
      formData.bankName,
      formData.accountNumber,
      formData.ifscCode,
    ];
    const isAnyBankFieldFilled = bankFields.some(
      (f) => String(f || "").trim() !== "",
    );

    if (isAnyBankFieldFilled) {
      if (!String(formData.bankAccountHolder || "").trim()) {
        return "Account Holder Name is required when bank details are entered";
      }
      if (
        !/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(
          String(formData.bankAccountHolder || "").trim(),
        )
      ) {
        return "Account Holder Name must contain only alphabets";
      }
      if (!String(formData.bankName || "").trim()) {
        return "Bank Name is required when bank details are entered";
      }
      if (
        !/^[A-Za-z][A-Za-z\s.&'-]*$/.test(
          String(formData.bankName || "").trim(),
        )
      ) {
        return "Bank Name must contain only alphabets";
      }
      if (!String(formData.accountNumber || "").trim()) {
        return "Account Number is required when bank details are entered";
      }
      if (!String(formData.ifscCode || "").trim()) {
        return "IFSC Code is required when bank details are entered";
      }
      if (!isValidAccountNumber(formData.accountNumber)) {
        return "Account Number must be 9 to 18 digits";
      }
      if (!isValidIfsc(formData.ifscCode)) {
        return "IFSC format is invalid (Example: HDFC0001234)";
      }
    }

    return null;
  };

  const handleFileUpload = (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
  //       formDataToSend.append("doj", formData.dateOfJoining);

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

  const handleSave = async (bypassLoginWarning = false) => {
    if (!formData.firstName?.trim()) {
      showToast.error("First Name is required!");
      return;
    }
    if (formData.email?.trim()) {
      if (!isValidEmail(formData.email)) {
        showToast.error("Please enter a valid personal email address");
        return;
      }
      if (emailDuplicateCheck.checking) {
        showToast.error("Please wait until email verification finishes");
        return;
      }
      if (emailDuplicateCheck.error) {
        showToast.error(emailDuplicateCheck.error);
        return;
      }
    }
    if (formData.officeEmail && !isValidEmail(formData.officeEmail)) {
      showToast.error("Please enter a valid office email address");
      return;
    }
    if (!isOptionalTenDigitPhoneValid(formData.phone)) {
      showToast.error(
        "Mobile number must be 10 digits and start with 6, 7, 8, or 9",
      );
      return;
    }
    if (!isOptionalTenDigitPhoneValid(formData.officePhone)) {
      showToast.error(
        "Office phone must be 10 digits and start with 6, 7, 8, or 9",
      );
      return;
    }
    if (!isOptionalTenDigitPhoneValid(formData.emergencyPhone)) {
      showToast.error(
        "Emergency contact phone must be 10 digits and start with 6, 7, 8, or 9",
      );
      return;
    }

    if (!editingId && !newEmployeeId.trim()) {
      showToast.error("Please enter an Employee ID (e.g., EMP002)");
      return;
    }

    const statutoryBankError = validateStatutoryAndBank();
    if (statutoryBankError) {
      showToast.error(statutoryBankError);
      return;
    }

    // If creating a new employee and email is not provided, show confirmation warning modal
    if (!editingId && !formData.email?.trim() && !bypassLoginWarning) {
      setShowNoLoginWarningDialog(true);
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
        formDataToSend.append(
          "employee_id",
          newEmployeeId.trim().toUpperCase(),
        );
      }

      // Basic fields
      formDataToSend.append("first_name", formData.firstName.trim());
      formDataToSend.append("last_name", (formData.lastName || "").trim());
      formDataToSend.append(
        "email",
        formData.email?.trim() ? normalizeEmail(formData.email) : "",
      );

      // Ensure dates are sent in YYYY-MM-DD format
      const dojToSend = formData.dateOfJoining
        ? extractDatePart(formData.dateOfJoining)
        : "";
      if (dojToSend) {
        formDataToSend.append("doj", dojToSend);
      }
      // console.log("Sending DOJ:", dojToSend); // Debug

      formDataToSend.append("employment_type", formData.employmentType);
      if (formData.subscriptionBillingCycle) {
        formDataToSend.append(
          "subscription_billing_cycle",
          formData.subscriptionBillingCycle,
        );
      }
      if (formData.subscriptionPlanId) {
        formDataToSend.append("subscription_plan_id", formData.subscriptionPlanId);
      }
      formDataToSend.append("status", formData.status);

      // Optional fields
      if (formData.phone)
        formDataToSend.append("mobile", formData.phone.trim());
      if (formData.officeEmail)
        formDataToSend.append(
          "office_email",
          normalizeEmail(formData.officeEmail),
        );
      if (formData.officePhone)
        formDataToSend.append("office_phone", formData.officePhone.trim());
      if (formData.dateOfBirth) {
        const dobToSend = extractDatePart(formData.dateOfBirth);
        // console.log("Sending DOB:", dobToSend); // Debug
        formDataToSend.append("dob", dobToSend);
      }
      if (formData.gender) formDataToSend.append("gender", formData.gender);
      if (formData.bloodGroup)
        formDataToSend.append("blood_group", formData.bloodGroup);
      if (formData.maritalStatus)
        formDataToSend.append("marital_status", formData.maritalStatus);
      if (formData.emergencyContact)
        formDataToSend.append(
          "emergency_contact_name",
          formData.emergencyContact,
        );
      if (formData.emergencyPhone)
        formDataToSend.append(
          "emergency_contact_phone",
          formData.emergencyPhone.trim(),
        );

      if (formData.departmentId)
        formDataToSend.append("department_id", formData.departmentId);
      if (formData.designationId)
        formDataToSend.append("designation_id", formData.designationId);
      if (formData.branchId)
        formDataToSend.append("branch_id", formData.branchId);
      if (formData.shift) {
        formDataToSend.append("shift_id", formData.shift.toString());
      }
      if (formData.location)
        formDataToSend.append("location_office", formData.location);
      if (formData.role) formDataToSend.append("role", formData.role);
      formDataToSend.append("salary_type", formData.salaryType || "MONTHLY");
      if (formData.salaryType === "HOURLY") {
        formDataToSend.append("hourly_rate", String(formData.hourlyRate || 0));
        if (formData.overtimeHourlyRate) formDataToSend.append("overtime_hourly_rate", String(formData.overtimeHourlyRate));
      } else {
        formDataToSend.append("monthly_salary", String(formData.monthlySalary ?? formData.salary ?? 0));
        formDataToSend.append("salary", String(formData.monthlySalary ?? formData.salary ?? 0));
      }

      // Statutory
      if (formData.aadhaar)
        formDataToSend.append("aadhaar", formData.aadhaar.replace(/\D/g, ""));
      if (formData.pan)
        formDataToSend.append("pan", formData.pan.trim().toUpperCase());
      if (formData.uan)
        formDataToSend.append("uan", formData.uan.replace(/\D/g, ""));
      if (formData.esic)
        formDataToSend.append("esic", formData.esic.replace(/\D/g, ""));

      // Bank
      if (formData.bankAccountHolder) {
        formDataToSend.append(
          "account_holder_name",
          formData.bankAccountHolder.trim(),
        );
      }
      if (formData.bankName)
        formDataToSend.append("bank_name", formData.bankName);
      if (formData.accountNumber)
        formDataToSend.append(
          "account_number",
          formData.accountNumber.replace(/\D/g, ""),
        );
      if (formData.ifscCode)
        formDataToSend.append(
          "ifsc_code",
          formData.ifscCode.trim().toUpperCase(),
        );

      // Live location tracking
      formDataToSend.append(
        "location_tracking_enabled",
        formData.enableLiveTracking ? "1" : "0",
      );

      Object.keys(uploadedFileObjects).forEach((field) => {
        const file = uploadedFileObjects[field];
        if (file instanceof File) {
          // console.log(`Uploading file: ${field} -> ${file.name}`); // debug
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
        showToast.success(
          editingId
            ? "Employee updated successfully!"
            : "New employee created successfully!",
        );
        handleCloseDialog();
      } else {
        showToast.error(result.error || "Failed to save employee");
        console.error("API Error:", result.error);
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast.error(
        "An unexpected error occurred. Check console for details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const validateCurrentTabBeforeNext = (): boolean => {
    if (activeTab === "personal") {
      if (!formData.firstName?.trim()) {
        showToast.error("First Name is required!");
        return false;
      }
      if (!formData.lastName?.trim()) {
        showToast.error("Last Name is required!");
        return false;
      }
      if (formData.email?.trim()) {
        if (!isValidEmail(formData.email)) {
          showToast.error("Please enter a valid personal email address");
          return false;
        }
        if (emailDuplicateCheck.checking) {
          showToast.error("Please wait until email verification finishes");
          return false;
        }
        if (emailDuplicateCheck.error) {
          showToast.error(emailDuplicateCheck.error);
          return false;
        }
      }
      if (!isOptionalTenDigitPhoneValid(formData.phone)) {
        showToast.error(
          "Mobile number must be 10 digits and start with 6, 7, 8, or 9",
        );
        return false;
      }
      if (!isOptionalTenDigitPhoneValid(formData.emergencyPhone)) {
        showToast.error(
          "Emergency contact phone must be 10 digits and start with 6, 7, 8, or 9",
        );
        return false;
      }
      if (!editingId && !newEmployeeId.trim()) {
        showToast.error("Please enter an Employee ID (e.g., EMP002)");
        return false;
      }
    }

    if (activeTab === "employment") {
      // if (!formData.shift) {
      //   showToast.error("Shift is required!");
      //   return false;
      // }
      if (formData.officeEmail && !isValidEmail(formData.officeEmail)) {
        showToast.error("Please enter a valid office email address");
        return false;
      }
      if (!isOptionalTenDigitPhoneValid(formData.officePhone)) {
        showToast.error(
          "Office phone must be 10 digits and start with 6, 7, 8, or 9",
        );
        return false;
      }
    }

    if (activeTab === "statutory" || activeTab === "bank") {
      const statutoryBankError = validateStatutoryAndBank();
      if (statutoryBankError) {
        showToast.error(statutoryBankError);
        return false;
      }
    }

    return true;
  };

  /* Duplicate incomplete helpers retained by an earlier merge.
  const handleTabChange = (nextTab: string) => {
    const currentIdx = tabOrder.indexOf(activeTab);
    const nextIdx = tabOrder.indexOf(nextTab);

    if (nextIdx <= currentIdx) {
      setActiveTab(nextTab);
      return;
    }

    if (validateCurrentTabBeforeNext()) {
      setActiveTab(nextTab);
    }
  };

  const buildImportedEmployeeFormData = (row: Record<string, unknown>) => {
    const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[normalizeExcelHeader(key)] = value;
        return acc;
      },
      {},
    );

    const get = (...keys: string[]) => {
      for (const key of keys) {
        const value = normalizedRow[normalizeExcelHeader(key)];
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
      return "";
    };

    const departmentName = String(
      get("department", "department_name", "dept", "departmentname"),
    ).trim();
    const designationName = String(
      get("designation", "designation_name", "designationname"),
    ).trim();
    const shiftName = String(get("shift", "shift_name", "shiftname")).trim();

    const matchedDepartment = departments.find(
      (dept) => dept.name.trim().toLowerCase() === departmentName.toLowerCase(),
    );
    const matchedDesignation = designations.find(
      (designation) =>
        designation.name.trim().toLowerCase() === designationName.toLowerCase(),
    );
    const matchedShift = shifts.find(
      (shift) =>
        String(shift.name || "")
          .trim()
          .toLowerCase() === shiftName.toLowerCase(),
    );

    return {
      employeeId: String(
        get("employee_id", "employeeid", "employee_code", "emp_id"),
      )
        .trim()
        .toUpperCase(),
      firstName: String(get("first_name", "firstname", "first name")).trim(),
      lastName: String(get("last_name", "lastname", "last name")).trim(),
      email: normalizeEmail(String(get("email", "personal_email")).trim()),
      phone: sanitizePhoneInput(
        String(
          get("mobile", "phone", "mobile_number", "personal_phone"),
        ).trim(),
      ).slice(0, 10),
      officePhone: sanitizePhoneInput(
        String(get("office_phone", "officephone")).trim(),
      ).slice(0, 10),
      officeEmail: String(get("office_email", "officeemail")).trim(),
      dateOfBirth: excelDateToISO(get("dob", "date_of_birth", "birth_date")),
      gender: String(get("gender")).trim(),
      bloodGroup: String(get("blood_group", "bloodgroup")).trim(),
      maritalStatus: String(get("marital_status", "maritalstatus")).trim(),
      emergencyContact: String(
        get(
          "emergency_contact_name",
          "emergency_contact",
          "emergency_contact_person",
        ),
      ).trim(),
      emergencyPhone: sanitizePhoneInput(
        String(get("emergency_contact_phone", "emergency_phone")).trim(),
      ).slice(0, 10),
      departmentId: matchedDepartment?.id || "",
      departmentName,
      designationId: matchedDesignation?.id || "",
      designationName,
      shiftId: matchedShift?.id?.toString() || "",
      shiftName,
      dateOfJoining: excelDateToISO(
        get("doj", "date_of_joining", "joining_date"),
      ),
      employmentType: normalizeImportedEmploymentType(
        get("employment_type", "employmenttype"),
      ),
      status: normalizeImportedStatus(get("status")),
      role: String(get("role")).trim().toLowerCase(),
      location: String(
        get("location", "location_office", "office_location"),
      ).trim(),
      salary: String(get("salary")).trim(),
      aadhaar: String(get("aadhaar")).replace(/\D/g, "").slice(0, 12),
      pan: String(get("pan")).trim().toUpperCase(),
      uan: String(get("uan")).replace(/\D/g, "").slice(0, 12),
      esic: String(get("esic")).replace(/\D/g, "").slice(0, 10),
      bankAccountHolder: String(
      // }
      if (formData.officeEmail && !isValidEmail(formData.officeEmail)) {
        showToast.error("Please enter a valid office email address");
        return false;
      }
      if (!isOptionalTenDigitPhoneValid(formData.officePhone)) {
        showToast.error(
          "Office phone must be 10 digits and start with 6, 7, 8, or 9",
        );
        return false;
      }
    }

    if (activeTab === "statutory" || activeTab === "bank") {
      const statutoryBankError = validateStatutoryAndBank();
      if (statutoryBankError) {
        showToast.error(statutoryBankError);
        return false;
      }
    }

    return true;
  };

  */
  const handleTabChange = (nextTab: string) => {
    const currentIdx = tabOrder.indexOf(activeTab);
    const nextIdx = tabOrder.indexOf(nextTab);

    if (nextIdx <= currentIdx) {
      setActiveTab(nextTab);
      return;
    }

    if (validateCurrentTabBeforeNext()) {
      setActiveTab(nextTab);
    }
  };

  const buildImportedEmployeeFormData = (row: Record<string, unknown>) => {
    const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[normalizeExcelHeader(key)] = value;
        return acc;
      },
      {},
    );

    const get = (...keys: string[]) => {
      for (const key of keys) {
        const value = normalizedRow[normalizeExcelHeader(key)];
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
      return "";
    };

    const departmentName = String(
      get("department", "department_name", "dept", "departmentname"),
    ).trim();
    const designationName = String(
      get("designation", "designation_name", "designationname"),
    ).trim();
    const shiftName = String(get("shift", "shift_name", "shiftname")).trim();

    const matchedDepartment = departments.find(
      (dept) => dept.name.trim().toLowerCase() === departmentName.toLowerCase(),
    );
    const matchedDesignation = designations.find(
      (designation) =>
        designation.name.trim().toLowerCase() === designationName.toLowerCase(),
    );
    const matchedShift = shifts.find(
      (shift) =>
        String(shift.name || "")
          .trim()
          .toLowerCase() === shiftName.toLowerCase(),
    );

    return {
      employeeId: String(
        get("employee_id", "employeeid", "employee_code", "emp_id"),
      )
        .trim()
        .toUpperCase(),
      firstName: String(get("first_name", "firstname", "first name")).trim(),
      lastName: String(get("last_name", "lastname", "last name")).trim(),
      email: normalizeEmail(String(get("email", "personal_email")).trim()),
      phone: sanitizePhoneInput(
        String(
          get("mobile", "phone", "mobile_number", "personal_phone"),
        ).trim(),
      ).slice(0, 10),
      officePhone: sanitizePhoneInput(
        String(get("office_phone", "officephone")).trim(),
      ).slice(0, 10),
      officeEmail: String(get("office_email", "officeemail")).trim(),
      dateOfBirth: excelDateToISO(get("dob", "date_of_birth", "birth_date")),
      gender: String(get("gender")).trim(),
      bloodGroup: String(get("blood_group", "bloodgroup")).trim(),
      maritalStatus: String(get("marital_status", "maritalstatus")).trim(),
      emergencyContact: String(
        get(
          "emergency_contact_name",
          "emergency_contact",
          "emergency_contact_person",
        ),
      ).trim(),
      emergencyPhone: sanitizePhoneInput(
        String(get("emergency_contact_phone", "emergency_phone")).trim(),
      ).slice(0, 10),
      departmentId: matchedDepartment?.id || "",
      departmentName,
      designationId: matchedDesignation?.id || "",
      designationName,
      shiftId: matchedShift?.id?.toString() || "",
      shiftName,
      dateOfJoining: excelDateToISO(
        get("doj", "date_of_joining", "joining_date"),
      ),
      employmentType: normalizeImportedEmploymentType(
        get("employment_type", "employmenttype"),
      ),
      status: normalizeImportedStatus(get("status")),
      role: String(get("role")).trim().toLowerCase(),
      location: String(
        get("location", "location_office", "office_location"),
      ).trim(),
      salary: String(get("salary")).trim(),
      aadhaar: String(get("aadhaar")).replace(/\D/g, "").slice(0, 12),
      pan: String(get("pan")).trim().toUpperCase(),
      uan: String(get("uan")).replace(/\D/g, "").slice(0, 12),
      esic: String(get("esic")).replace(/\D/g, "").slice(0, 10),
      bankAccountHolder: String(
        get("account_holder_name", "bank_account_holder", "bank_accountholder"),
      ).trim(),
      bankName: String(get("bank_name")).trim(),
      accountNumber: String(get("account_number")).replace(/\D/g, ""),
      ifscCode: String(get("ifsc_code", "ifsc")).trim().toUpperCase(),
      enableLiveTracking: ["1", "true", "yes", "enabled"].includes(
        String(get("enable_live_tracking", "location_tracking_enabled"))
          .trim()
          .toLowerCase(),
      ),
    };
  };

  const createEmployeePayloadFromImport = (
    employee: ReturnType<typeof buildImportedEmployeeFormData>,
  ) => {
    const payload = new globalThis.FormData();

    payload.append("employee_id", employee.employeeId);
    payload.append("first_name", employee.firstName);
    payload.append("last_name", employee.lastName);
    payload.append("email", employee.email ? normalizeEmail(employee.email) : "");
    if (employee.dateOfJoining) payload.append("doj", employee.dateOfJoining);
    payload.append("employment_type", employee.employmentType);
    payload.append("status", employee.status);
    payload.append("shift_id", employee.shiftId);
    payload.append(
      "location_tracking_enabled",
      employee.enableLiveTracking ? "1" : "0",
    );

    if (employee.phone) payload.append("mobile", employee.phone);
    if (employee.officePhone)
      payload.append("office_phone", employee.officePhone);
    if (employee.officeEmail)
      payload.append("office_email", normalizeEmail(employee.officeEmail));
    if (employee.dateOfBirth) payload.append("dob", employee.dateOfBirth);
    if (employee.gender) payload.append("gender", employee.gender);
    if (employee.bloodGroup) payload.append("blood_group", employee.bloodGroup);
    if (employee.maritalStatus)
      payload.append("marital_status", employee.maritalStatus);
    if (employee.emergencyContact)
      payload.append("emergency_contact_name", employee.emergencyContact);
    if (employee.emergencyPhone)
      payload.append("emergency_contact_phone", employee.emergencyPhone);
    if (employee.departmentId)
      payload.append("department_id", employee.departmentId);
    if (employee.designationId)
      payload.append("designation_id", employee.designationId);
    if (employee.location) payload.append("location_office", employee.location);
    if (employee.role) payload.append("role", employee.role);
    if (employee.salary) payload.append("salary", employee.salary);
    if (employee.aadhaar) payload.append("aadhaar", employee.aadhaar);
    if (employee.pan) payload.append("pan", employee.pan);
    if (employee.uan) payload.append("uan", employee.uan);
    if (employee.esic) payload.append("esic", employee.esic);
    if (employee.bankAccountHolder)
      payload.append("account_holder_name", employee.bankAccountHolder);
    if (employee.bankName) payload.append("bank_name", employee.bankName);
    if (employee.accountNumber)
      payload.append("account_number", employee.accountNumber);
    if (employee.ifscCode) payload.append("ifsc_code", employee.ifscCode);

    return payload;
  };

  const importEmployeesFromRows = async (
    rows: Record<string, unknown>[],
    fileName: string,
  ) => {
    setImportingExcel(true);
    setError(null);

    try {
      const failures: string[] = [];
      const importPayloads: {
        rowNumber: number;
        payload: globalThis.FormData;
      }[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const employee = buildImportedEmployeeFormData(row);

        if (!employee.employeeId || !employee.firstName) {
          failures.push(
            `Row ${rowNumber}: Employee ID and first name are required`,
          );
          return;
        }

        if (employee.email && !isValidEmail(employee.email)) {
          failures.push(`Row ${rowNumber}: Invalid email address`);
          return;
        }

        if (!isOptionalTenDigitPhoneValid(employee.phone)) {
          failures.push(`Row ${rowNumber}: Invalid mobile number`);
          return;
        }

        importPayloads.push({
          rowNumber,
          payload: createEmployeePayloadFromImport(employee),
        });
      });

      let successCount = 0;
      for (const { rowNumber, payload } of importPayloads) {
        const result = await employeeApi.createEmployee(payload);
        if (result.data) {
          successCount += 1;
        } else {
          failures.push(
            `Row ${rowNumber}: ${result.error || "Failed to create employee"}`,
          );
        }
      }

      if (successCount > 0) {
        await refreshEmployees();
      }

      if (successCount > 0 && failures.length === 0) {
        showToast.success(
          `${successCount} employee${successCount > 1 ? "s" : ""} imported successfully`,
        );
        return;
      }

      if (successCount > 0) {
        const summary = `${successCount} imported, ${failures.length} failed`;
        setError(`${summary}. ${failures.slice(0, 4).join(" | ")}`);
        showToast.success(summary);
        return;
      }

      const failureMessage =
        failures.slice(0, 4).join(" | ") ||
        "No valid employee rows found in Excel";
      setError(failureMessage);
      showToast.error(failureMessage);
    } finally {
      setImportingExcel(false);
    }
  };

  const handleEmployeeExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xls") && !lowerName.endsWith(".xlsx")) {
      showToast.error("Please upload a valid Excel file (.xls or .xlsx)");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error("No worksheet found in the uploaded Excel file");
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        { defval: "" },
      );
      const nonEmptyRows = rows.filter((row) =>
        Object.values(row).some((value) => String(value ?? "").trim() !== ""),
      );

      if (!nonEmptyRows.length) {
        throw new Error("Excel file is empty");
      }

      await importEmployeesFromRows(nonEmptyRows, file.name);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to import Excel file";
      setError(message);
      showToast.error(message);
    }
  };

  // Export all employees to Excel with all CSV fields
  const handleExportToExcel = () => {
    if (employees.length === 0) {
      showToast.error("No employees to export");
      return;
    }

    const exportData = employees.map((emp) => ({
      employee_id: emp.employeeId || "",
      first_name: emp.firstName || "",
      last_name: emp.lastName || "",
      email: emp.email || "",
      mobile: emp.phone || "",
      office_email: (emp as any).officeEmail || "",
      office_phone: (emp as any).officePhone || "",
      dob: emp.dateOfBirth || "",
      gender: emp.gender || "",
      blood_group: emp.bloodGroup || "",
      marital_status: emp.maritalStatus || "",
      emergency_contact_name: emp.emergencyContact || "",
      emergency_contact_phone: emp.emergencyPhone || "",
      department: emp.department || "",
      designation: emp.designation || "",
      shift: emp.shift || "",
      doj: emp.dateOfJoining || "",
      employment_type: emp.employmentType || "",
      status: emp.status || "",
      role: emp.role || "",
      location: emp.location || "",
      salary: String((emp as any).salary || ""),
      aadhaar: emp.aadhaar || "",
      pan: emp.pan || "",
      uan: emp.uan || "",
      esic: emp.esic || "",
      account_holder_name: emp.bankAccountHolder || "",
      bank_name: emp.bankName || "",
      account_number: emp.accountNumber || "",
      ifsc_code: emp.ifscCode || "",
      enable_live_tracking: String((emp as any).location_tracking_enabled || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(
      wb,
      `Employees_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    showToast.success(`Exported ${employees.length} employees to Excel`);
  };

  // Download empty template with all CSV fields
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        employee_id: "",
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        office_email: "",
        office_phone: "",
        dob: "YYYY-MM-DD",
        gender: "Male/Female",
        blood_group: "",
        marital_status: "Single/Married",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        department: "",
        designation: "",
        shift: "",
        doj: "YYYY-MM-DD",
        employment_type: "full-time/part-time/contract/intern",
        status: "active/inactive",
        role: "employee/hr/manager/admin",
        location: "",
        salary: "",
        aadhaar: "12 digits",
        pan: "ABCDE1234F",
        uan: "",
        esic: "",
        account_holder_name: "",
        bank_name: "",
        account_number: "",
        ifsc_code: "HDFC0001234",
        enable_live_tracking: "0 or 1",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Template");
    XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
    showToast.success("Template downloaded successfully");
  };

  // Import handler that uses the existing handleEmployeeExcelUpload
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleEmployeeExcelUpload(event);
  };

  const fetchAndTransformEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await employeeApi.getEmployees();

      // The API helper returns { data: employeesArray } directly
      const apiEmployees = result.data || [];

      if (Array.isArray(apiEmployees)) {
        const transformedEmployees = apiEmployees.map((emp: any) => {
          const shiftId = emp.shift_id?.toString() || "";
          const shiftName =
            emp.shift_name || emp.shiftName || emp.shift || emp.shift_type || "";
          const transformed: EmployeeListItem = {
            id: emp.id.toString(),
            employeeId: emp.employee_id || "",
            firstName: emp.first_name || "",
            lastName: emp.last_name || "",
            email: emp.email || "",
            phone: emp.mobile || "",
            officePhone: emp.office_phone || "",
            officeEmail: emp.office_email || "",
            dateOfBirth: (() => {
              if (emp.dob) {
                const dateOnly = extractDatePart(emp.dob);
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
            shift: shiftName || shiftId,
            shift_id: shiftId,
            shiftName,
            department: emp.department || emp.department_name || "Unknown",
            designation: emp.designation || emp.designation_name || "Unknown",
            dateOfJoining: (() => {
              if (emp.doj) {
                const dateOnly = extractDatePart(emp.doj);
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
              if (type.includes("probation")) return "probation";
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
            salary: Number(emp.salary) || 0,
            salary_type: emp.salary_type || "MONTHLY",
            monthly_salary: Number(emp.monthly_salary ?? emp.salary) || 0,
            hourly_rate: Number(emp.hourly_rate) || 0,
            overtime_hourly_rate: Number(emp.overtime_hourly_rate) || 0,
            subscription_plan_id: Number(emp.subscription_plan_id) || undefined,
            aadhaar: emp.aadhaar || "",
            pan: emp.pan || "",
            uan: emp.uan || "",
            esic: emp.esic || "",
            branchId: emp.branch_id?.toString() || "",
            branchName: emp.branch_name || emp.branch || "",
            // Bank
            bankAccountHolder: emp.bankDetails?.account_holder_name || "",
            bankName: emp.bankDetails?.bank_name || "",
            accountNumber: emp.bankDetails?.account_number || "",
            ifscCode: emp.bankDetails?.ifsc_code || "",
            // Documents
            photoUrl:
              getDocumentByField(emp.documents, "photo")?.file_path || "",
            idProofUrl:
              getDocumentByField(emp.documents, "id_proof")?.file_path || "",
            addressProofUrl:
              getDocumentByField(emp.documents, "address_proof")?.file_path ||
              "",
            offerLetterUrl:
              getDocumentByField(emp.documents, "offer_letter")?.file_path ||
              "",
            certificatesUrl: "",
            bankProofUrl: "",
            createdAt: emp.created_at || new Date().toISOString(),
            updatedAt: emp.updated_at || new Date().toISOString(),
            location_tracking_enabled: isLocationTrackingEnabled(
              emp.location_tracking_enabled,
            )
              ? 1
              : 0,
          };

          return transformed;
        });

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
    if (!canDeleteEmployee) {
      showToast.error("You do not have permission to delete employees");
      return;
    }

    setEmpToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDeleteEmployee) {
      showToast.error("You do not have permission to delete employees");
      setIsDeleteDialogOpen(false);
      setEmpToDelete(null);
      return;
    }

    if (empToDelete) {
      const result = await employeeApi.deleteEmployee(empToDelete);
      if (notifyDeletionPending(result)) { setIsDeleteDialogOpen(false); return; }

      if (result.success) {
        // Local state update
        setEmployees((prev) => prev.filter((emp) => emp.id !== empToDelete));
        showToast.success("Employee deleted successfully!");
      } else {
        showToast.error(result.error || "Failed to delete employee");
      }

      setIsDeleteDialogOpen(false);
      setEmpToDelete(null);
    }
  };

  // Fetch departments and designations on mount

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptResult, desigResult, roleResult] = await Promise.all([
          employeeApi.getDepartments(),
          employeeApi.getDesignations(),
          roleApi.getRoles(),
        ]);

        // Response is { success: true, departments: [...] }
        const deptData: any = deptResult.data;
        if (deptData?.departments && Array.isArray(deptData.departments)) {
          const formattedDepts = deptData.departments.map((dept: any) => ({
            id: dept.id.toString(), // number → string
            name: dept.name || "Unknown",
          }));
          setDepartments(formattedDepts);
        } else {
          setDepartments([]);
        }

        const desigData: any = desigResult.data;
        if (desigData?.designations && Array.isArray(desigData.designations)) {
          const formattedDesigs = desigData.designations.map((desig: any) => ({
            id: desig.id.toString(),
            name: desig.name || "Unknown",
          }));
          setDesignations(formattedDesigs);
        } else {
          setDesignations([]);
        }
        if (roleResult.data && Array.isArray(roleResult.data)) {
          setRoles(
            normalizeRoleOptions(roleResult.data.map((role) => role.name)),
          );
        } else {
          setRoles([]);
        }
      } catch (err) {
        console.error("Error fetching options:", err);
        setDepartments([]);
        setDesignations([]);
        setRoles([]);
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

  const renderDetailValue = (value?: string | number | null) => {
    const text = String(value ?? "").trim();
    return text || "N/A";
  };

  const viewDetailGroups = viewingEmployee
    ? [
        {
          title: "Personal",
          fields: [
            ["Employee ID", viewingEmployee.employeeId],
            ["Name", `${viewingEmployee.firstName} ${viewingEmployee.lastName}`],
            ["Email", viewingEmployee.email],
            ["Phone", viewingEmployee.phone],
            ["Date of Birth", formatDateForDisplay(viewingEmployee.dateOfBirth)],
            ["Gender", viewingEmployee.gender],
            ["Blood Group", viewingEmployee.bloodGroup],
            ["Marital Status", viewingEmployee.maritalStatus],
            ["Emergency Contact", viewingEmployee.emergencyContact],
            ["Emergency Phone", viewingEmployee.emergencyPhone],
          ],
        },
        {
          title: "Employment",
          fields: [
            ["Department", viewingEmployee.department],
            ["Designation", viewingEmployee.designation],
            ["Branch", viewingEmployee.branchName],
            ["Shift", getEmployeeShiftLabel(viewingEmployee)],
            ["Date of Joining", formatDateForDisplay(viewingEmployee.dateOfJoining)],
            ["Employment Type", getEmploymentTypeLabel(viewingEmployee.employmentType)],
            ["Status", getStatusLabel(viewingEmployee.status)],
            ["Role", viewingEmployee.role],
            ["Location/Office", viewingEmployee.location],
            [
              "Live Tracking",
              isLocationTrackingEnabled(viewingEmployee.location_tracking_enabled)
                ? "Enabled"
                : "Disabled",
            ],
            ["Office Email", viewingEmployee.officeEmail],
            ["Office Phone", viewingEmployee.officePhone],
            ["Salary", viewingEmployee.salary ? String(viewingEmployee.salary) : ""],
          ],
        },
        {
          title: "Statutory",
          fields: [
            ["Aadhaar", viewingEmployee.aadhaar],
            ["PAN", viewingEmployee.pan],
            ["UAN", viewingEmployee.uan],
            ["ESIC", viewingEmployee.esic],
          ],
        },
        {
          title: "Bank",
          fields: [
            ["Account Holder", viewingEmployee.bankAccountHolder],
            ["Bank Name", viewingEmployee.bankName],
            ["Account Number", viewingEmployee.accountNumber],
            ["IFSC Code", viewingEmployee.ifscCode],
          ],
        },
        {
          title: "Documents",
          fields: [
            ["Photo", viewingEmployee.photoUrl ? "Uploaded" : ""],
            ["ID Proof", viewingEmployee.idProofUrl ? "Uploaded" : ""],
            ["Address Proof", viewingEmployee.addressProofUrl ? "Uploaded" : ""],
            ["Offer Letter", viewingEmployee.offerLetterUrl ? "Uploaded" : ""],
            ["Certificates", viewingEmployee.certificatesUrl ? "Uploaded" : ""],
            ["Bank Proof", viewingEmployee.bankProofUrl ? "Uploaded" : ""],
          ],
        },
      ]
    : [];

  return (
    <Layout>
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17c491] to-[#17c491] rounded-xl p-4 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-bold">
              Employee Management
            </h1>
          </div>
          <p className="text-white text-xs sm:text-sm">
            Manage employee records and information
          </p>
          {excelFileName && (
            <p className="text-white/90 text-xs mt-2">
              Last imported file: {excelFileName}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Total
                </div>
                <div className="w-6 h-6 rounded-full bg-[#17c491]/10 flex items-center justify-center">
                  <Users className="w-3 h-3 text-[#17c491]" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#17c491]">
                {employees.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Active
                </div>
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {employees.filter((e) => e.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Departments
                </div>
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-purple-600 rounded"></div>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {new Set(employees.map((e) => e.department)).size}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Total Payroll
                </div>
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-orange-600"></div>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                ₹
                {(
                  employees.reduce((sum, e) => sum + (e.salary || 0), 0) /
                  100000
                ).toFixed(1)}
                L
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="col-span-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-3.5 w-3 h-3 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by employee ID, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 text-sm"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={filterDept}
                  onValueChange={(val: any) => setFilterDept(val)}
                >
                  <SelectTrigger id="department" className="mt-2">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments && departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-muted-foreground">
                        No departments available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(val: any) => setFilterStatus(val)}
                >
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

              <div className="col-span-1 flex items-end">
                {canCreateEmployee && (
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="w-full gap-2 text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add Employee
                  </Button>
                )}
              </div>
            </div>

            {/* Excel Actions Row - Below Search Filters */}
            {canCreateEmployee && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <Label
                  htmlFor="employee-excel-upload"
                  className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition ${
                    importingExcel
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "cursor-pointer border-[#17c491]/30 bg-white text-[#12956f] hover:bg-[#17c491]/5"
                  }`}
                >
                  {importingExcel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {importingExcel ? "Importing..." : "Upload Excel"}
                </Label>
                <input
                  id="employee-excel-upload"
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleEmployeeExcelUpload}
                  disabled={importingExcel}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  className="gap-2 text-sm"
                  disabled={employees.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2 text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 text-sm"
                >
                  <FileUp className="w-4 h-4" />
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Employees ({filteredEmployees.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Showing{" "}
              {filteredEmployees.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}{" "}
              to{" "}
              {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}{" "}
              of {filteredEmployees.length} filtered employees (
              {employees.length} total)
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
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          ID
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Name
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Email
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Department
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Designation
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Shift
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Tracking
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-left px-3 py-3 font-semibold text-xs whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {emp.employeeId || emp.id}
                          </td>
                          <td className="px-3 py-3 font-medium text-xs whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#17c491] flex items-center justify-center text-white text-xs font-bold">
                                {emp.firstName?.charAt(0)?.toUpperCase()}
                                {emp.lastName?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="font-semibold text-xs">
                                {emp.firstName} {emp.lastName}
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-3 py-3 text-xs truncate"
                            title={emp.email}
                          >
                            <InlineEdit value={emp.email} label="email" module="employees" submodule="list" type="email" required  disabled={!canEditEmployee} onSave={(value) => { const data = new FormData(); data.append("email", String(value).trim().toLowerCase()); return saveInline(employeeApi.updateEmployee(String(emp.id), data), refreshEmployees); }} />
                          </td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap">
                            {emp.department}
                          </td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap">
                            {emp.designation}
                          </td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap">
                            {getEmployeeShiftLabel(emp)}
                          </td>
                          <td className="px-3 py-3">
                            {isLocationTrackingEnabled(
                              emp.location_tracking_enabled,
                            ) ? (
                              <span className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 whitespace-nowrap bg-green-100 text-green-800 border-green-200 font-medium">
                                <MapPin className="w-3 h-3" />
                                Enabled
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 whitespace-nowrap bg-gray-100 text-gray-600 border-gray-200 font-medium">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${getStatusBadgeClass(emp.status)}`}
                            >
                              {getStatusLabel(emp.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenViewDialog(emp)}
                                className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                title="View"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              {(canEditEmployee || canDeleteEmployee) && (
                                <>
                                  {canEditEmployee && (
                                    <button
                                      onClick={() => handleOpenDialog(emp)}
                                      className="p-1 hover:bg-[#17c491]/10 text-[#17c491] rounded transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  )}
                                  {canDeleteEmployee && (
                                    <button
                                      onClick={() => handleDeleteClick(emp.id)}
                                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {paginatedEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="border border-border rounded-lg p-3 bg-card hover:shadow-md transition-all duration-200 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-[#17c491] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {emp.firstName?.charAt(0)?.toUpperCase()}
                              {emp.lastName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded flex-shrink-0">
                                  {emp.employeeId || emp.id}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm truncate">
                                {emp.firstName} {emp.lastName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                <InlineEdit value={emp.email} label="email" module="employees" submodule="list" type="email" required  disabled={!canEditEmployee} onSave={(value) => { const data = new FormData(); data.append("email", String(value).trim().toLowerCase()); return saveInline(employeeApi.updateEmployee(String(emp.id), data), refreshEmployees); }} />
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenViewDialog(emp)}
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {(canEditEmployee || canDeleteEmployee) && (
                            <>
                              {canEditEmployee && (
                                <button
                                  onClick={() => handleOpenDialog(emp)}
                                  className="p-1 hover:bg-[#17c491]/10 text-[#17c491] rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                              {canDeleteEmployee && (
                                <button
                                  onClick={() => handleDeleteClick(emp.id)}
                                  className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1">
                            Department
                          </label>
                          <p className="font-medium truncate">
                            {emp.department}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1">
                            Designation
                          </label>
                          <p className="font-medium truncate">
                            {emp.designation}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1">
                            Status
                          </label>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${getStatusBadgeClass(emp.status)}`}
                          >
                            {getStatusLabel(emp.status)}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1">
                            Shift
                          </label>
                          <p className="font-medium truncate">
                            {getEmployeeShiftLabel(emp)}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1">
                            Tracking
                          </label>
                          {isLocationTrackingEnabled(
                            emp.location_tracking_enabled,
                          ) ? (
                            <span className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 whitespace-nowrap bg-green-100 text-green-800 border-green-200 font-medium">
                              <MapPin className="w-3 h-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 whitespace-nowrap bg-gray-100 text-gray-600 border-gray-200 font-medium">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredEmployees.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-border pt-4 mt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredEmployees.length,
                      )}{" "}
                      of {filteredEmployees.length} employees
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium whitespace-nowrap">
                          Rows per page
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[80px] text-xs">
                            <SelectValue placeholder={itemsPerPage} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[5, 10, 20, 30, 50].map((pageSize) => (
                              <SelectItem
                                key={pageSize}
                                value={pageSize.toString()}
                              >
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="text-xs font-medium min-w-[70px] text-center">
                          Page {currentPage} / {totalPages}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setViewingEmployee(null);
        }}
      >
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Employee Details
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View complete employee information
            </DialogDescription>
          </DialogHeader>

          {viewingEmployee && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="w-10 h-10 rounded-full bg-[#17c491] flex items-center justify-center text-white text-sm font-bold">
                  {viewingEmployee.firstName?.charAt(0)?.toUpperCase()}
                  {viewingEmployee.lastName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {viewingEmployee.employeeId || viewingEmployee.id}
                  </p>
                </div>
              </div>

              {viewDetailGroups.map((group) => (
                <section key={group.title} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {group.fields.map(([label, value]) => (
                      <div
                        key={`${group.title}-${label}`}
                        className="rounded-md border border-border px-3 py-2"
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 break-words text-sm font-medium">
                          {renderDetailValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingId ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingId
                ? "Update employee information"
                : "Fill in all employee details"}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto gap-1 md:gap-0 bg-muted p-1">
              <TabsTrigger value="personal" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Personal</span>
                <span className="sm:hidden">Person</span>
              </TabsTrigger>
              <TabsTrigger
                value="employment"
                className="text-xs sm:text-sm py-2"
              >
                <span className="hidden sm:inline">Employment</span>
                <span className="sm:hidden">Employ</span>
              </TabsTrigger>
              <TabsTrigger
                value="statutory"
                className="text-xs sm:text-sm py-2"
              >
                <span className="hidden md:inline">Statutory</span>
                <span className="md:hidden">Stat</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="text-xs sm:text-sm py-2">
                Bank
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="text-xs sm:text-sm py-2"
              >
                <span className="hidden md:inline">Documents</span>
                <span className="md:hidden">Docs</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent
              value="personal"
              className="space-y-3 sm:space-y-4 mt-4"
            >
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
                      handleFormChange(
                        "employeeId",
                        e.target.value.toUpperCase(),
                      );
                    }
                  }}
                  // disabled={!!editingId}
                  // className={`mt-2 ${editingId ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
                />
                {!editingId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter Employee ID (e.g., EMP001, EMP002)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleFormChange("firstName", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleFormChange("lastName", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryType">Salary Type</Label>
                  <Select value={formData.salaryType || "MONTHLY"} onValueChange={(value: "MONTHLY" | "HOURLY") => handleFormChange("salaryType", value)}>
                    <SelectTrigger id="salaryType" className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="HOURLY">Hourly</SelectItem></SelectContent>
                  </Select>
                </div>
                {formData.salaryType === "HOURLY" ? (
                  <>
                    <div><Label htmlFor="hourlyRate">Hourly Rate *</Label><Input id="hourlyRate" type="number" min="0" step="0.01" value={formData.hourlyRate || ""} onChange={(e) => handleFormChange("hourlyRate", Number(e.target.value))} className="mt-2" /></div>
                    <div><Label htmlFor="overtimeHourlyRate">Overtime Hourly Rate (optional)</Label><Input id="overtimeHourlyRate" type="number" min="0" step="0.01" value={formData.overtimeHourlyRate || ""} onChange={(e) => handleFormChange("overtimeHourlyRate", Number(e.target.value))} className="mt-2" /></div>
                  </>
                ) : (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 mt-6">
                    <p className="text-sm font-medium text-slate-800">Monthly salary is managed in Salary Structure</p>
                    <p className="text-xs text-slate-500 mt-1">Set Gross Salary, Basic, allowances and deductions under Payroll → Salary Structure.</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(val) => handleFormChange("gender", val)}
                  >
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
                  <FastDateInput
                    id="dob"
                    value={formData.dateOfBirth || ""}
                    onChange={(value) => handleFormChange("dateOfBirth", value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select
                    value={formData.bloodGroup || ""}
                    onValueChange={(val) => handleFormChange("bloodGroup", val)}
                  >
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
                      onChange={(e) =>
                        handleFormChange("maritalStatus", e.target.value)
                      }
                      placeholder="e.g., Married, Single, Divorced"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email to enable employee login"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    aria-invalid={Boolean(emailDuplicateCheck.error)}
                    className={`mt-2 ${emailDuplicateCheck.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {emailDuplicateCheck.checking && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verifying email...
                    </p>
                  )}
                  {emailDuplicateCheck.error && (
                    <p className="mt-1 text-xs text-red-600">
                      {emailDuplicateCheck.error}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      handlePhoneInputChange("phone", e.target.value)
                    }
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
                      onChange={(e) =>
                        handleFormChange("emergencyContact", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.emergencyPhone || ""}
                      onChange={(e) =>
                        handlePhoneInputChange("emergencyPhone", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent
              value="employment"
              className="space-y-3 sm:space-y-4 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input
                    id="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) =>
                      handleFormChange("dateOfJoining", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(val) =>
                      handleFormChange("employmentType", val)
                    }
                  >
                    <SelectTrigger id="employmentType" className="mt-2">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subscriptionPlanId">
                    Employee Package
                  </Label>
                  <Select
                    value={
                      formData.subscriptionPlanId && formData.subscriptionBillingCycle
                        ? `${formData.subscriptionPlanId}:${formData.subscriptionBillingCycle}`
                        : ""
                    }
                    onValueChange={(value) => {
                      const [planId, billingCycle] = value.split(":");
                      const selectedPool = subscriptionSeatPools.find(
                        (pool) =>
                          String(pool.plan_id) === planId &&
                          pool.billing_cycle === billingCycle,
                      );
                      setFormData((previous) => ({
                        ...previous,
                        subscriptionPlanId: planId,
                        subscriptionBillingCycle:
                          selectedPool?.billing_cycle || previous.subscriptionBillingCycle,
                      }));
                    }}
                  >
                    <SelectTrigger id="subscriptionPlanId" className="mt-2">
                      <SelectValue placeholder="Select purchased package" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionSeatPools
                        .filter(
                          (pool) =>
                            !formData.subscriptionBillingCycle ||
                            pool.billing_cycle === formData.subscriptionBillingCycle,
                        )
                        .map((pool) => (
                          <SelectItem
                            key={`${pool.plan_id}-${pool.billing_cycle}`}
                            value={`${pool.plan_id}:${pool.billing_cycle}`}
                            disabled={
                              pool.available_users <= 0 &&
                              String(pool.plan_id) !== formData.subscriptionPlanId
                            }
                          >
                            {pool.plan_name} ({pool.assigned_users}/{pool.max_users} seats)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Features and one seat come from this package.
                  </p>
                </div>
                <div>
                  <Label htmlFor="subscriptionBillingCycle">
                    Subscription Billing Cycle
                  </Label>
                  <Select
                    value={formData.subscriptionBillingCycle}
                    onValueChange={(value: "monthly" | "yearly") => {
                      setFormData((previous) => ({
                        ...previous,
                        subscriptionBillingCycle: value,
                      }));
                    }}
                  >
                    <SelectTrigger
                      id="subscriptionBillingCycle"
                      className="mt-2"
                    >
                      <SelectValue placeholder="No billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Subscription</SelectItem>
                      <SelectItem value="yearly">Yearly Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This employee will use one seat from the selected billing
                    cycle.
                  </p>
                </div>
                <div>
                  <Label htmlFor="shift">Shift</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(val) => handleFormChange("shift", val)}
                    disabled={loadingShifts}
                  >
                    <SelectTrigger id="shift" className="mt-2">
                      <SelectValue
                        placeholder={
                          loadingShifts
                            ? "Loading shifts..."
                            : shifts.length === 0
                              ? "No shifts available"
                              : "Select a shift"
                        }
                      >
                        {formData.shift && shifts.length > 0 && (
                          <span>
                            {shifts.find(
                              (s) => s.id.toString() === formData.shift,
                            )?.name || `Shift ${formData.shift}`}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.length > 0 ? (
                        shifts.map((shift) => {
                          // Use the correct property names based on the Shift interface
                          const startTime =
                            shift.startTime || shift.start_time || "";
                          const endTime = shift.endTime || shift.end_time || "";

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
                  <div className="flex gap-2 mt-2">
                    <Select
                      value={formData.departmentId}
                      onValueChange={(val) =>
                        handleFormChange("departmentId", val)
                      }
                    >
                      <SelectTrigger id="department" className="flex-1">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments && departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddOnDialog("department")}
                      className="px-3"
                      title="Add New Department"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <div className="flex gap-2 mt-2">
                    <Select
                      value={formData.designationId}
                      onValueChange={(val) =>
                        handleFormChange("designationId", val)
                      }
                    >
                      <SelectTrigger id="designation" className="flex-1">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations && designations.length > 0 ? (
                          designations.map((des) => (
                            <SelectItem key={des.id} value={des.id}>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddOnDialog("designation")}
                      className="px-3"
                      title="Add New Designation"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={formData.branchId || ""}
                    onValueChange={(val) => handleFormChange("branchId", val)}
                  >
                    <SelectTrigger id="branch" className="mt-2">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-sm text-muted-foreground">
                          No branches available
                        </p>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <div className="flex gap-2 mt-2">
                    <Select
                      value={formData.role || ""}
                      onValueChange={(val) => handleFormChange("role", val)}
                    >
                      <SelectTrigger id="role" className="flex-1">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.role &&
                          !roles.some(
                            (roleName) =>
                              normalizeRoleKey(roleName) ===
                              normalizeRoleKey(formData.role),
                          ) && (
                            <SelectItem value={formData.role}>
                              {formData.role}
                            </SelectItem>
                          )}
                        {roles.length > 0 ? (
                          roles.map((roleName) => (
                            <SelectItem key={roleName} value={roleName}>
                              {roleName}
                            </SelectItem>
                          ))
                        ) : (
                          <p className="px-4 py-2 text-sm text-muted-foreground">
                            No roles available
                          </p>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddOnDialog("role")}
                      className="px-3"
                      title="Add New Role"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location/Office</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) =>
                      handleFormChange("location", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="officeEmail">Office Email</Label>
                  <Input
                    id="officeEmail"
                    type="email"
                    value={formData.officeEmail || ""}
                    onChange={(e) =>
                      handleFormChange("officeEmail", e.target.value)
                    }
                    placeholder="employee@company.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="officePhone">Office Phone</Label>
                  <Input
                    id="officePhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.officePhone || ""}
                    onChange={(e) =>
                      handlePhoneInputChange("officePhone", e.target.value)
                    }
                    placeholder="Office extension or direct line"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => handleFormChange("status", val)}
                >
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

              {/* Enable Live Location Tracking */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="enableLiveTracking"
                  checked={formData.enableLiveTracking || false}
                  onCheckedChange={(checked) =>
                    handleFormChange("enableLiveTracking", checked)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="enableLiveTracking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable Live Location Tracking
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, employee location will be captured during
                    attendance check-in/check-out
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Statutory Tab */}
            <TabsContent
              value="statutory"
              className="space-y-3 sm:space-y-4 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    value={formData.aadhaar || ""}
                    onChange={(e) =>
                      handleDigitsOnlyChange("aadhaar", e.target.value, 12)
                    }
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="XXXX-XXXX-XXXX"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="pan">PAN (Permanent Account Number)</Label>
                  <Input
                    id="pan"
                    value={formData.pan || ""}
                    onChange={(e) =>
                      handleUpperAlphaNumericChange("pan", e.target.value, 10)
                    }
                    maxLength={10}
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
                    onChange={(e) =>
                      handleDigitsOnlyChange("uan", e.target.value, 12)
                    }
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="XXXXXXXXXXXX"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="esic">ESIC Number</Label>
                  <Input
                    id="esic"
                    value={formData.esic || ""}
                    onChange={(e) =>
                      handleDigitsOnlyChange("esic", e.target.value, 10)
                    }
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="XXXXXXXXXX"
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
                    onChange={(e) =>
                      handleAlphabeticNameChange(
                        "bankAccountHolder",
                        e.target.value,
                      )
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName || ""}
                    onChange={(e) => handleBankNameChange(e.target.value)}
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
                    onChange={(e) =>
                      handleDigitsOnlyChange(
                        "accountNumber",
                        e.target.value,
                        18,
                      )
                    }
                    inputMode="numeric"
                    maxLength={18}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode || ""}
                    onChange={(e) =>
                      handleUpperAlphaNumericChange(
                        "ifscCode",
                        e.target.value,
                        11,
                      )
                    }
                    maxLength={11}
                    placeholder="XXXXX0000XXX"
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            {/* Documents Tab */}
            <TabsContent
              value="documents"
              className="space-y-4 sm:space-y-6 mt-4"
            >
              {[
                {
                  field: "photo",
                  label: "Photo",
                  description: "Employee profile photo (JPG/PNG)",
                },
                {
                  field: "id_proof",
                  label: "ID Proof",
                  description: "Aadhaar, PAN, Passport, etc.",
                },
                {
                  field: "address_proof",
                  label: "Address Proof",
                  description: "Utility bill, rental agreement, etc.",
                },
                {
                  field: "offer_letter",
                  label: "Offer Letter",
                  description: "Original joining offer letter",
                },
                {
                  field: "certificates",
                  label: "Educational Certificates",
                  description:
                    "Degree, diploma certificates (multiple allowed)",
                },
                {
                  field: "bank_proof",
                  label: "Bank Proof",
                  description: "Cancelled cheque or passbook front page",
                },
              ].map((doc) => (
                <div key={doc.field} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Label className="text-base font-semibold">
                        {doc.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {doc.description}
                      </p>
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
                        accept={
                          doc.field === "photo"
                            ? ".jpg,.jpeg,.png"
                            : ".jpg,.jpeg,.png,.pdf"
                        }
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
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            {activeTab !== "documents" ? (
              <Button
                onClick={() => {
                  const idx = tabOrder.indexOf(activeTab);
                  if (idx >= 0 && idx < tabOrder.length - 1) {
                    if (!validateCurrentTabBeforeNext()) return;
                    setActiveTab(tabOrder[idx + 1]);
                  }
                }}
                disabled={
                  activeTab === "personal" &&
                  (emailDuplicateCheck.checking ||
                    Boolean(emailDuplicateCheck.error))
                }
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => void handleSave()}
                disabled={
                  saving ||
                  emailDuplicateCheck.checking ||
                  Boolean(emailDuplicateCheck.error)
                }
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingId ? "Updating..." : "Adding..."}
                  </>
                ) : editingId ? (
                  "Update Employee"
                ) : (
                  "Add Employee"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* No-login employee confirmation */}
      <AlertDialog
        open={showNoLoginWarningDialog}
        onOpenChange={setShowNoLoginWarningDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create employee without login?</AlertDialogTitle>
            <AlertDialogDescription>
              Email and mobile number are optional. Since an email address was
              not provided, this employee will not receive login credentials
              and cannot log in to the HRMS. You can still create the employee
              record now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={saving}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={() => {
                setShowNoLoginWarningDialog(false);
                void handleSave(true);
              }}
            >
              Create Without Login
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This sends a deletion request to the CEO. The record stays active until approval and can be restored by Admin.
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

      {/* Add On Dialog */}
      <Dialog open={isAddOnDialogOpen} onOpenChange={setIsAddOnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New{" "}
              {addOnType === "department"
                ? "Department"
                : addOnType === "designation"
                  ? "Designation"
                  : "Role"}
            </DialogTitle>
            <DialogDescription>
              Create a new {addOnType} for the organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="addOnName">
                {addOnType === "department"
                  ? "Department"
                  : addOnType === "designation"
                    ? "Designation"
                    : "Role"}{" "}
                Name *
              </Label>
              <Input
                id="addOnName"
                value={addOnFormData.name}
                onChange={(e) =>
                  setAddOnFormData({ ...addOnFormData, name: e.target.value })
                }
                placeholder={`Enter ${addOnType} name`}
                className="mt-2"
              />
            </div>

            {addOnType === "department" && (
              <>
                <div>
                  <Label htmlFor="costCenter">Cost Center</Label>
                  <Input
                    id="costCenter"
                    value={addOnFormData.costCenter || ""}
                    onChange={(e) =>
                      setAddOnFormData({
                        ...addOnFormData,
                        costCenter: e.target.value,
                      })
                    }
                    placeholder="Enter cost center (optional)"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="headId">Department Head</Label>
                  <Select
                    value={addOnFormData.headId || ""}
                    onValueChange={(val) =>
                      setAddOnFormData({ ...addOnFormData, headId: val })
                    }
                  >
                    <SelectTrigger id="headId" className="mt-2">
                      <SelectValue placeholder="Select department head (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees && employees.length > 0 ? (
                        employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-sm text-muted-foreground">
                          No employees available
                        </p>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseAddOnDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddOn}
              disabled={addOnSaving || !addOnFormData.name.trim()}
            >
              {addOnSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${addOnType === "department" ? "Department" : addOnType === "designation" ? "Designation" : "Role"}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
