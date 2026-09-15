import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { hasRole } from "@/lib/auth";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CreditCard,
  Upload,
  X,
  Camera,
  Loader2,
  Download,
  FileSpreadsheet,
  Eye,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import expenseApi, {
  AssignedClient,
  ExpenseDraft,
} from "@/components/helper/expense/expense";
import NotificationTriggerService from "@/services/notificationTriggerService";
import { showToast } from "@/utils/toast";
import { BASE_URL } from "@/lib/endpoint";

interface BillFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  file?: File;
}

type ExpenseCategory = "travel" | "food" | "accommodation" | "others";

interface ExpenseRow {
  category: ExpenseCategory | "";
  amount: string;
  description: string;
  receiptFile?: File | null;
  receiptPath?: string | null;
  isScanning?: boolean;
  scanData?: {
    amount?: string;
    date?: string;
    vendor?: string;
    category?: string;
  } | null;
}

interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId?: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: "draft" | "pending" | "approved" | "rejected" | "reimbursed";
  approvedBy?: string;
  createdAt: string;
  billFile?: BillFile;
  clientName?: string;
  receiptPath?: string | null;
  receiptUrl?: string;
  draftReceiptPaths?: string[];
  isDraft?: boolean;
  draftId?: number;
  draftRows?: ExpenseDraft["expenses"];
  draftClientId?: string;
}

interface ExistingReceipt {
  path?: string | null;
  url?: string;
}

interface GroupedExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId?: string;
  clientName?: string;
  categories: string[];
  totalAmount: number;
  date: string;
  description: string;
  status: "draft" | "pending" | "approved" | "rejected" | "reimbursed";
  approvedBy?: string;
  createdAt: string;
  claims: ExpenseClaim[];
  isDraft?: boolean;
  draftReceiptPaths?: string[];
  draftId?: number;
  draftRows?: ExpenseDraft["expenses"];
  draftClientId?: string;
}

const ALLOWED_EXPENSE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_EXPENSE_FILE_TYPES = [
  ...ALLOWED_EXPENSE_IMAGE_TYPES,
  "application/pdf",
];

const isValidExpenseFile = (file: File) => {
  const fileName = String(file.name || "").toLowerCase();
  const mimeType = String(file.type || "").toLowerCase();

  return (
    ALLOWED_EXPENSE_FILE_TYPES.includes(mimeType) ||
    /\.(jpg|jpeg|png|webp|svg|pdf)$/i.test(fileName)
  );
};

export default function ExpenseClaims() {
  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();

  const canClaimExpenses =
    canPerformModuleAction("expenses", "create", "claims") ||
    canPerformModuleAction("expenses", "create") ||
    hasRole(user, "admin") ||
    String(user?.type || "").toLowerCase() === "admin";
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExpenseClaim>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [actionExpenseId, setActionExpenseId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [billFile, setBillFile] = useState<BillFile | null>(null);
  const [billFileType, setBillFileType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveErrorDialog, setSaveErrorDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [assignedClients, setAssignedClients] = useState<
    Array<{ id: number; client_id: string; client_name: string }>
  >([]);
  const [assignedClientId, setAssignedClientId] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([
    {
      category: "",
      amount: "",
      description: "",
      receiptFile: null,
      receiptPath: null,
      isScanning: false,
      scanData: null,
    },
  ]);
  const [isGroupedEdit, setIsGroupedEdit] = useState(false);
  const [groupedEditingClaims, setGroupedEditingClaims] = useState<
    ExpenseClaim[]
  >([]);
  const [preview, setPreview] = useState<{
    open: boolean;
    url: string;
    name: string;
    type: string;
  }>({
    open: false,
    url: "",
    name: "",
    type: "",
  });
  const [draftReceiptGallery, setDraftReceiptGallery] = useState<{
    open: boolean;
    urls: string[];
  }>({
    open: false,
    urls: [],
  });
  const [draftReceiptZoom, setDraftReceiptZoom] = useState(1);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftClearing, setDraftClearing] = useState(false);
  const [editReceipt, setEditReceipt] = useState<ExistingReceipt | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [receiptPickerMode, setReceiptPickerMode] = useState<
    Record<number, "upload" | "scan">
  >({});

  const makeEmptyRow = (): ExpenseRow => ({
    category: "",
    amount: "",
    description: "",
    receiptFile: null,
    receiptPath: null,
    isScanning: false,
    scanData: null,
  });

  const formatCategoryLabel = (value?: string | null) => {
    if (!value) return "";
    return value
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDateValue = (value?: string | null) => {
    if (!value) return new Date().toISOString().split("T")[0];
    return String(value).substring(0, 10);
  };

  const isDraftDeleteId = (value?: string | null) =>
    Boolean(value && value.startsWith("draft-record-"));
  const parseDraftDeleteId = (value?: string | null) => {
    if (!isDraftDeleteId(value)) return null;
    const numericId = Number(String(value).replace("draft-record-", ""));
    return Number.isFinite(numericId) ? numericId : null;
  };

  const getDraftClientLabel = (
    draft: ExpenseDraft | null | undefined,
    clients: AssignedClient[],
  ) => {
    if (!draft) return "";

    const candidateIds = [
      draft.client_id,
      ...(draft.expenses || []).map((row) => row.client_id ?? null),
    ]
      .filter((value): value is number => value !== null && value !== undefined)
      .map((value) => String(value));

    const matchedClient = clients.find((client) =>
      candidateIds.includes(String(client.id)),
    );
    return matchedClient?.client_name || "";
  };

  const mapApiExpenseToClaim = (expense: any): ExpenseClaim => ({
    id:
      expense.id?.toString() ||
      expense.expense_id?.toString() ||
      Math.random().toString(36).slice(2, 11),
    employeeId:
      expense.employee_id?.toString() || expense.employeeId?.toString() || "",
    employeeName:
      expense.employee_name ||
      expense.employeeName ||
      user?.name ||
      "Unknown Employee",
    clientId:
      expense.client_id?.toString() || expense.clientId?.toString() || "",
    clientName: expense.client_name || expense.clientName || "",
    category: formatCategoryLabel(expense.category || ""),
    amount: Number(expense.amount) || 0,
    date: formatDateValue(expense.expense_date || expense.date),
    description: expense.description || "",
    status:
      (String(
        expense.status || "pending",
      ).toLowerCase() as ExpenseClaim["status"]) || "pending",
    createdAt:
      expense.created_at || expense.createdAt || new Date().toISOString(),
    receiptPath: expense.receipt_path || null,
    receiptUrl: expense.receipt_url || undefined,
  });

  const dedupeExpenseClaims = (items: ExpenseClaim[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const identityKey = [
        item.employeeId,
        item.date,
        item.category,
        item.amount,
        item.description,
        item.status,
      ].join("|");
      const key = item.id ? `${item.id}|${identityKey}` : identityKey;
      const fallbackKey = identityKey;

      if (seen.has(key) || seen.has(fallbackKey)) {
        return false;
      }

      seen.add(key);
      seen.add(fallbackKey);
      return true;
    });
  };

  const dedupeGroupedExpenses = (items: GroupedExpenseClaim[]) => {
    const groups = new Map<string, GroupedExpenseClaim>();

    items.forEach((item) => {
      const key = [
        item.employeeId,
        item.date,
        item.status,
        item.totalAmount,
        item.categories.join(","),
        item.clientName || "",
      ].join("|");

      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, item);
        return;
      }

      const mergedClaims = dedupeExpenseClaims([
        ...existing.claims,
        ...item.claims,
      ]);
      const mergedCategories = Array.from(
        new Set(mergedClaims.map((claim) => claim.category).filter(Boolean)),
      );
      const mergedClientNames = Array.from(
        new Set(mergedClaims.map((claim) => claim.clientName).filter(Boolean)),
      );
      const mergedClientIds = Array.from(
        new Set(mergedClaims.map((claim) => claim.clientId).filter(Boolean)),
      );
      const mergedTotalAmount = mergedClaims.reduce(
        (sum, claim) => sum + (Number(claim.amount) || 0),
        0,
      );
      const existingReceiptCount = existing.claims.filter(
        (claim) => claim.receiptPath || claim.receiptUrl,
      ).length;
      const nextReceiptCount = item.claims.filter(
        (claim) => claim.receiptPath || claim.receiptUrl,
      ).length;
      const preferredGroup =
        nextReceiptCount > existingReceiptCount ? item : existing;

      groups.set(key, {
        ...preferredGroup,
        claims: mergedClaims,
        totalAmount: mergedTotalAmount,
        categories: mergedCategories,
        clientId: mergedClientIds.length === 1 ? mergedClientIds[0] : "",
        clientName:
          mergedClientNames.length > 1
            ? `${mergedClientNames[0]} +${mergedClientNames.length - 1}`
            : mergedClientNames[0] || "-",
        description:
          mergedClaims.length > 1
            ? `${mergedClaims.length} expense(s) - ${mergedCategories.join(", ")}`
            : mergedClaims[0]?.description || preferredGroup.description,
      });
    });

    return Array.from(groups.values());
  };

  const buildDraftClaim = (
    draft: ExpenseDraft,
    clients: AssignedClient[],
  ): ExpenseClaim | null => {
    const rows = Array.isArray(draft.expenses) ? draft.expenses : [];
    if (!rows.length) return null;

    const totalAmount = rows.reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0,
    );
    const categories = Array.from(
      new Set(
        rows.map((row) => formatCategoryLabel(row.category)).filter(Boolean),
      ),
    );
    const dates = Array.from(
      new Set(
        rows.map((row) => formatDateValue(row.expense_date)).filter(Boolean),
      ),
    );
    const draftReceiptPaths = Array.from(
      new Set(
        rows
          .map((row) => row.receipt_path)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const firstReceiptPath = draftReceiptPaths[0] || null;
    const draftClientId =
      draft.client_id !== null && draft.client_id !== undefined
        ? String(draft.client_id)
        : (() => {
            const rowClient = rows.find(
              (row) => row.client_id !== null && row.client_id !== undefined,
            );
            return rowClient?.client_id !== undefined &&
              rowClient?.client_id !== null
              ? String(rowClient.client_id)
              : "";
          })();

    return {
      id: `draft-${draft.id}`,
      employeeId: getEmployeeIdForUser(user?.id || ""),
      employeeName: user?.name || "Unknown Employee",
      clientName: getDraftClientLabel(draft, clients) || "-",
      category:
        categories.length > 1
          ? `${categories[0]} +${categories.length - 1} more`
          : categories[0] || "Draft",
      amount: totalAmount,
      date: dates.length === 1 ? dates[0] : formatDateValue(draft.updated_at),
      description: `${rows.length} expense item(s) saved as draft`,
      status: "draft",
      createdAt:
        draft.updated_at || draft.created_at || new Date().toISOString(),
      receiptPath: firstReceiptPath,
      receiptUrl: firstReceiptPath
        ? resolveReceiptUrl(firstReceiptPath)
        : undefined,
      draftReceiptPaths,
      isDraft: true,
      draftId: draft.id,
      draftRows: rows,
      draftClientId,
    };
  };

  const refreshExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const shouldLoadDraft =
        Boolean(user) && canClaimExpenses && !hasRole(user, "finance");
      const [expenseResult, draftResult, clientsResult] = await Promise.all([
        expenseApi.getExpense(),
        shouldLoadDraft
          ? expenseApi.getDraft()
          : Promise.resolve<{ data?: ExpenseDraft[]; error?: string }>({
              data: [],
            }),
        shouldLoadDraft
          ? expenseApi.getAssignedClients()
          : Promise.resolve<{ data?: AssignedClient[]; error?: string }>({
              data: [],
            }),
      ]);

      if (expenseResult.error) {
        throw new Error(expenseResult.error);
      }

      const normalizedExpenses = Array.isArray(expenseResult.data)
        ? dedupeExpenseClaims(expenseResult.data.map(mapApiExpenseToClaim))
        : [];

      if (draftResult.error) {
        console.warn("Draft fetch failed:", draftResult.error);
      }

      if (clientsResult.error) {
        console.warn("Assigned clients fetch failed:", clientsResult.error);
      }

      const draftClaims = Array.isArray(draftResult.data)
        ? draftResult.data
            .map((draft) => buildDraftClaim(draft, clientsResult.data || []))
            .filter((draft): draft is ExpenseClaim => Boolean(draft))
        : [];

      setExpenses([...draftClaims, ...normalizedExpenses]);
    } catch (fetchError) {
      console.error("Error fetching expenses:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load expenses",
      );
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Export related states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAllEmployees, setSelectAllEmployees] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportStatusFilter, setExportStatusFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    refreshExpenses();
  }, [user]);

  // Fetch assigned clients for the logged-in employee when opening the submit dialog
  useEffect(() => {
    const fetchDialogData = async () => {
      if (!isDialogOpen) return;

      const clientsResult = await expenseApi.getAssignedClients();

      if (clientsResult.error) {
        setError(clientsResult.error);
        setAssignedClients([]);
      } else {
        setAssignedClients(clientsResult.data || []);
      }
    };

    fetchDialogData();
  }, [isDialogOpen, editingId]);

  // Helper function to map user ID to employee ID (e.g., "2" -> "EMP002")
  const getEmployeeIdForUser = (userId: string) => {
    return `EMP${String(parseInt(userId)).padStart(3, "0")}`;
  };

  // Group expenses by employee and date
  const groupExpenses = (expenses: ExpenseClaim[]): GroupedExpenseClaim[] => {
    const grouped = new Map<string, ExpenseClaim[]>();

    expenses.forEach((expense) => {
      // Skip drafts from grouping - they should remain separate
      if (expense.isDraft) {
        const key = expense.id;
        grouped.set(key, [expense]);
        return;
      }

      // Group by employee, expense date, and submission batch timestamp.
      // This keeps separate submissions on the same day from collapsing into one edit group.
      const submissionKey = expense.createdAt || expense.id;
      const key = `${expense.employeeId}-${expense.date}-${submissionKey}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(expense);
    });

    const groupedItems = Array.from(grouped.entries()).map(([key, claims]) => {
      const firstClaim = claims[0];
      const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
      const categories = Array.from(new Set(claims.map((c) => c.category)));
      const clientNames = Array.from(
        new Set(claims.map((c) => c.clientName).filter(Boolean)),
      );
      const clientIds = Array.from(
        new Set(claims.map((c) => c.clientId).filter(Boolean)),
      );

      // Determine status - if any claim is pending, show as pending, otherwise use first claim's status
      let status: ExpenseClaim["status"] = firstClaim.status;
      if (claims.some((c) => c.status === "pending")) {
        status = "pending";
      } else if (claims.some((c) => c.status === "approved")) {
        status = "approved";
      } else if (claims.some((c) => c.status === "rejected")) {
        status = "rejected";
      }

      return {
        id: key,
        employeeId: firstClaim.employeeId,
        employeeName: firstClaim.employeeName,
        clientId: clientIds.length === 1 ? clientIds[0] : "",
        clientName:
          clientNames.length > 1
            ? `${clientNames[0]} +${clientNames.length - 1}`
            : clientNames[0] || "-",
        categories,
        totalAmount,
        date: firstClaim.date,
        description:
          claims.length > 1
            ? `${claims.length} expense(s) - ${categories.join(", ")}`
            : firstClaim.description,
        status,
        approvedBy: firstClaim.approvedBy,
        createdAt: firstClaim.createdAt,
        claims,
        isDraft: firstClaim.isDraft,
        draftReceiptPaths: firstClaim.draftReceiptPaths,
        draftId: firstClaim.draftId,
        draftRows: firstClaim.draftRows,
        draftClientId: firstClaim.draftClientId,
      };
    });

    return dedupeGroupedExpenses(groupedItems).sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return bTime - aTime;
    });
  };

  const filteredExpenses = useMemo(() => {
    // console.log("Filtering expenses. Current expenses:", expenses);
    // console.log(
    //   "Search term:",
    //   searchTerm,
    //   "Filter status:",
    //   filterStatus,
    //   "Filter month:",
    //   filterMonth,
    //   "From:",
    //   filterFromDate,
    //   "To:",
    //   filterToDate,
    // );

    let filtered = [...expenses]; // Create a copy of the expenses array

    // First scope records by role.
    if (hasRole(user, "employee")) {
      const userId = user?.id || "";
      const formattedEmployeeId = getEmployeeIdForUser(userId);
      // console.log(
      //   "Filtering for user ID:",
      //   userId,
      //   "Formatted employee ID:",
      //   formattedEmployeeId,
      // );
      // console.log(
      //   "Available employee IDs in expenses:",
      //   expenses.map((e) => e.employeeId),
      // );

      filtered = filtered.filter((exp) => {
        // Check both formats: numeric ID (37) and formatted ID (EMP037)
        return (
          exp.employeeId === userId ||
          exp.employeeId === formattedEmployeeId ||
          exp.employeeId === parseInt(userId)?.toString()
        );
      });
    }

    // Then apply the same search and status filters for all roles.
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    filtered = filtered.filter((exp) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        exp.employeeName?.toLowerCase().includes(normalizedSearchTerm) ||
        exp.category?.toLowerCase().includes(normalizedSearchTerm) ||
        exp.description?.toLowerCase().includes(normalizedSearchTerm) ||
        exp.clientName?.toLowerCase().includes(normalizedSearchTerm);
      const matchesStatus =
        filterStatus === "all" || exp.status === filterStatus;
      return Boolean(matchesSearch) && matchesStatus;
    });

    filtered = filtered.filter((exp) => {
      const normalizedDate = formatDateValue(exp.date);
      const matchesMonth =
        !filterMonth || normalizedDate.startsWith(filterMonth);
      const matchesFromDate =
        !filterFromDate || normalizedDate >= filterFromDate;
      const matchesToDate = !filterToDate || normalizedDate <= filterToDate;
      return matchesMonth && matchesFromDate && matchesToDate;
    });

    // console.log("Filtered expenses result:", filtered);

    // Group the filtered expenses
    return groupExpenses(filtered);
  }, [
    expenses,
    searchTerm,
    filterStatus,
    filterMonth,
    filterFromDate,
    filterToDate,
    user,
  ]);

  const handleOpenDialog = (expense?: ExpenseClaim | GroupedExpenseClaim) => {
    setError(null); // Clear any previous errors

    // Check if it's a grouped expense
    const isGrouped = expense && "claims" in expense;
    const targetExpense = isGrouped ? expense.claims[0] : expense;

    if (
      expense &&
      !("claims" in expense
        ? canEditClaim(expense)
        : !["approved", "reimbursed"].includes(
            String(expense.status).toLowerCase(),
          ))
    ) {
      showToast.error("Approved expenses cannot be edited");
      return;
    }

    if (targetExpense?.isDraft) {
      setIsGroupedEdit(false);
      setGroupedEditingClaims([]);
      setEditingDraftId(targetExpense.draftId || null);
      setEditingId(null);
      setFormData({
        status: "draft",
        employeeName: user?.name || "",
        employeeId: getEmployeeIdForUser(user?.id || ""),
      });
      setAssignedClientId(targetExpense.draftClientId || "");
      setExpenseDate(
        targetExpense.draftRows?.[0]?.expense_date
          ? formatDateValue(targetExpense.draftRows[0].expense_date)
          : new Date().toISOString().split("T")[0],
      );
      setExpenseRows(
        targetExpense.draftRows?.length
          ? targetExpense.draftRows.map((row) => ({
              category: (row.category as ExpenseCategory) || "",
              amount: row.amount?.toString?.() ?? String(row.amount ?? ""),
              description: row.description || "",
              receiptFile: null,
              receiptPath: row.receipt_path || null,
              isScanning: false,
              scanData: null,
            }))
          : [makeEmptyRow()],
      );
      setBillFile(null);
      setBillFileType("");
      setScanData(null);
      setEditReceipt(null);
      if (targetExpense.draftRows?.length) {
        const hasReceipts = targetExpense.draftRows.some(
          (row) => row.receipt_path || row.receipt_url,
        );
        showToast.info(
          hasReceipts
            ? "Draft loaded with saved receipts."
            : "Draft loaded. Please re-upload files before submitting.",
        );
      }
    } else if (targetExpense) {
      setEditingDraftId(null);

      // If it's a grouped expense, set up all claims for editing
      if (isGrouped && expense.claims.length > 1) {
        setIsGroupedEdit(true);
        setGroupedEditingClaims(expense.claims);
        // For grouped expenses, convert all claims to expense rows
        const groupedExpenseRows: ExpenseRow[] = expense.claims.map(
          (claim, index) => {
            const originalCategory = claim.category as string;
            const normalizedCategory = originalCategory?.toLowerCase().trim();
            const validCategory = [
              "travel",
              "food",
              "accommodation",
              "others",
            ].includes(normalizedCategory)
              ? (normalizedCategory as ExpenseCategory)
              : "";

            // console.log(`Claim ${index + 1}:`, {
            //   originalCategory,
            //   normalizedCategory,
            //   validCategory,
            //   claim: claim,
            // });

            return {
              category: validCategory,
              amount: claim.amount?.toString() || "",
              description: claim.description || "",
              receiptFile: null,
              receiptPath: claim.receiptPath || null,
              isScanning: false,
              scanData: null,
            };
          },
        );

        setExpenseRows(groupedExpenseRows);
        setExpenseDate(targetExpense.date);
        const groupedClientIds = Array.from(
          new Set(
            expense.claims.map((claim) => claim.clientId).filter(Boolean),
          ),
        );
        setAssignedClientId(
          groupedClientIds.length === 1 ? groupedClientIds[0] || "" : "",
        );
        setEditingId(null); // Set to null to indicate multi-claim editing
        setFormData({
          status: targetExpense.status,
          employeeName: targetExpense.employeeName,
          employeeId: targetExpense.employeeId,
        });
        setBillFile(null);
        setBillFileType("");
        setEditReceipt(null);
      } else {
        setIsGroupedEdit(false);
        setGroupedEditingClaims([]);
        // Single claim editing
        setEditingId(targetExpense.id);
        setFormData(targetExpense);
        setAssignedClientId(targetExpense.clientId || "");
        setBillFile((targetExpense as ExpenseClaim).billFile || null);
        setBillFileType("");
        setEditReceipt({
          path: (targetExpense as ExpenseClaim).receiptPath || null,
          url:
            (targetExpense as ExpenseClaim).receiptUrl ||
            resolveReceiptUrl((targetExpense as ExpenseClaim).receiptPath),
        });
      }
    } else {
      setIsGroupedEdit(false);
      setGroupedEditingClaims([]);
      setEditingDraftId(null);
      setEditingId(null);
      setFormData({
        status: "pending",
        employeeName: user?.name || "",
        employeeId: getEmployeeIdForUser(user?.id || ""),
        amount: 0,
        date: "",
        category: "",
        description: "",
      });
      setAssignedClientId("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseRows([
        {
          category: "",
          amount: "",
          description: "",
          receiptFile: null,
          receiptPath: null,
          isScanning: false,
          scanData: null,
        },
      ]);
      setBillFile(null);
      setBillFileType("");
      setScanData(null);
      setEditReceipt(null);
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidExpenseFile(file)) {
        const message =
          "Only image files (PNG, JPG, JPEG, WebP, SVG) and PDF files are allowed.";
        setError(message);
        showToast.error(message);
        e.target.value = "";
        return;
      }

      // First scan the receipt for OCR data
      setScanning(true);
      setError(null);

      try {
        const scanResult = await expenseApi.scanReceipt(file);

        if (scanResult.data && scanResult.data.success) {
          const ocrData = scanResult.data.data;
          setScanData(ocrData);

          // Auto-fill form with scanned data
          setFormData((prev) => ({
            ...prev,
            amount: ocrData.amount || prev.amount,
            date:
              ocrData.date ||
              prev.date ||
              new Date().toISOString().split("T")[0], // Use today's date if no OCR date
            category: ocrData.category || prev.category,
            description: ocrData.vendor || prev.description,
          }));

          // console.log("OCR Data:", ocrData);
        } else {
          setError(scanResult.error || "Failed to scan receipt");
        }
      } catch (scanError) {
        console.error("Scanning error:", scanError);
        setError("Failed to scan receipt. You can still upload manually.");
      } finally {
        setScanning(false);
      }

      // Then proceed with file upload for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEditReceipt(null);
        setBillFile({
          name: file.name,
          type: billFileType || file.type,
          size: file.size,
          base64: base64,
          file: file, // Store the actual File object
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setBillFile(null);
    setBillFileType("");
    setScanData(null);
  };

  const handleRemoveExistingReceipt = () => {
    setEditReceipt(null);
    setBillFile(null);
    setBillFileType("");
    setScanData(null);
  };

  const updateRow = (index: number, patch: Partial<ExpenseRow>) => {
    setExpenseRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    setError(null);
  };

  const normalizeScannedCategory = (
    category?: string | null,
  ): ExpenseCategory | "" => {
    const normalized = String(category || "")
      .trim()
      .toLowerCase();
    if (normalized.includes("travel")) return "travel";
    if (normalized.includes("food")) return "food";
    if (
      normalized.includes("accommodation") ||
      normalized.includes("accomodation")
    )
      return "accommodation";
    if (normalized.includes("other")) return "others";
    return "";
  };

  const handleRowReceiptSelection = (index: number, file: File | null) => {
    if (file && !isValidExpenseFile(file)) {
      const message =
        "Only image files (PNG, JPG, JPEG, WebP, SVG) and PDF files are allowed.";
      setError(message);
      showToast.error(message);
      return false;
    }

    updateRow(index, {
      receiptFile: file,
      receiptPath: null,
      scanData: null,
      isScanning: false,
    });
    return true;
  };

  const handleRowReceiptScan = async (
    index: number,
    overrideFile?: File | null,
  ) => {
    const row = expenseRows[index];
    const file = overrideFile || row?.receiptFile;

    if (!file) {
      const message =
        "First upload a receipt for this expense row, then use Auto Scan.";
      setError(message);
      showToast.error(message);
      return;
    }

    updateRow(index, { isScanning: true });

    try {
      const scanResult = await expenseApi.scanReceipt(file);

      if (!(scanResult.data && scanResult.data.success)) {
        throw new Error(scanResult.error || "Failed to scan receipt");
      }

      const ocrData = scanResult.data.data || {};
      const normalizedCategory = normalizeScannedCategory(ocrData.category);

      setExpenseRows((prev) =>
        prev.map((currentRow, currentIndex) => {
          if (currentIndex !== index) return currentRow;

          return {
            ...currentRow,
            amount: ocrData.amount ? String(ocrData.amount) : currentRow.amount,
            description: ocrData.vendor || currentRow.description,
            category: normalizedCategory || currentRow.category,
            scanData: ocrData,
            isScanning: false,
          };
        }),
      );

      if (ocrData.date) {
        setExpenseDate((prev) => prev || String(ocrData.date).substring(0, 10));
      }

      showToast.success(`Expense ${index + 1} receipt scanned successfully`);
    } catch (scanError) {
      console.error("Row receipt scan error:", scanError);
      const message =
        scanError instanceof Error
          ? scanError.message
          : "Failed to scan receipt. You can still fill details manually.";
      setError(message);
      showToast.error(message);
      updateRow(index, { isScanning: false });
    }
  };

  const processRowReceiptFile = async (
    index: number,
    file: File | null,
    mode: "upload" | "scan" = "upload",
  ) => {
    const success = handleRowReceiptSelection(index, file);
    if (!success || !file) {
      return false;
    }

    if (mode === "scan") {
      await handleRowReceiptScan(index, file);
    }

    return true;
  };

  const addRow = () => {
    setExpenseRows((prev) => [...prev, makeEmptyRow()]);
    setError(null);
  };

  const removeRow = (index: number) => {
    setExpenseRows((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview.url]);

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview({ open: true, url, name: file.name, type: file.type });
  };

  const openPreviewFromUrl = (url: string, name: string) => {
    const lowerUrl = url.toLowerCase();
    const type = lowerUrl.endsWith(".pdf")
      ? "application/pdf"
      : lowerUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i)
        ? "image/*"
        : "";
    setPreview({ open: true, url, name, type });
  };

  const adjustDraftReceiptZoom = (delta: number) => {
    setDraftReceiptZoom((current) =>
      Math.min(3, Math.max(0.5, Number((current + delta).toFixed(2)))),
    );
  };

  const resolveReceiptUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (normalizedPath.startsWith("/uploads/")) {
      try {
        return `${new URL(BASE_URL).origin}${normalizedPath}`;
      } catch {
        const normalizedBaseUrl = BASE_URL.replace(/\/backend\/?$/, "").replace(
          /\/+$/,
          "",
        );
        return `${normalizedBaseUrl}${normalizedPath}`;
      }
    }

    const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
    return `${normalizedBaseUrl}${normalizedPath}`;
  };

  const closePreview = () => {
    setPreview((prev) => ({
      ...prev,
      open: false,
      url: "",
      name: "",
      type: "",
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setDraftSaving(true);
      setError(null);

      const draftRows = expenseRows.map((row) => ({
        category: row.category || "",
        amount: row.amount || "",
        expense_date: expenseDate || "",
        description: row.description || "",
        receipt_path: row.receiptPath || "",
        client_id: assignedClientId ? Number(assignedClientId) : null,
      }));

      const formData = new FormData();
      formData.append("expenses", JSON.stringify(draftRows));
      if (editingDraftId) {
        formData.append("draft_id", String(editingDraftId));
      }
      expenseRows.forEach((row, index) => {
        if (row.receiptFile) {
          formData.append(`receipt_${index}`, row.receiptFile);
        }
      });

      formData.append("client_id", assignedClientId || "");

      const result = await expenseApi.saveDraft(formData);

      if (result.error) throw new Error(result.error);
      setEditingDraftId(
        result.data?.draft_id ? Number(result.data.draft_id) : editingDraftId,
      );
      showToast.success("Draft saved");
      await refreshExpenses();
      setIsDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save draft";
      setError(msg);
      showToast.error(msg);
    } finally {
      setDraftSaving(false);
    }
  };

  const handleClearDraft = async () => {
    try {
      setDraftClearing(true);
      setError(null);

      if (!editingDraftId) {
        setAssignedClientId("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        setExpenseRows([makeEmptyRow()]);
        showToast.success("Draft form cleared");
        return;
      }

      const result = await expenseApi.clearDraft(editingDraftId || undefined);
      if (result.error) throw new Error(result.error);

      setEditingDraftId(null);
      setAssignedClientId("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseRows([makeEmptyRow()]);
      showToast.success("Draft cleared");
      await refreshExpenses();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to clear draft";
      setError(msg);
      showToast.error(msg);
    } finally {
      setDraftClearing(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (isGroupedEdit) {
        if (
          !groupedEditingClaims.length ||
          groupedEditingClaims.length !== expenseRows.length
        ) {
          setError("Unable to match grouped expense rows for update");
          setLoading(false);
          return;
        }

        if (!expenseDate) {
          setError("Date is required");
          setLoading(false);
          return;
        }

        for (let i = 0; i < expenseRows.length; i++) {
          const row = expenseRows[i];
          if (!row.category) {
            setError(`Category is required (row ${i + 1})`);
            setLoading(false);
            return;
          }
          if (!row.amount || Number(row.amount) <= 0) {
            setError(`Amount is required and must be > 0 (row ${i + 1})`);
            setLoading(false);
            return;
          }
        }

        for (let i = 0; i < groupedEditingClaims.length; i++) {
          const claim = groupedEditingClaims[i];
          const row = expenseRows[i];
          const updateResult = await expenseApi.updateExpense(claim.id, {
            category: row.category.trim(),
            amount: Number(row.amount),
            expense_date: expenseDate,
            description: row.description?.trim() || "",
            client_id: assignedClientId ? Number(assignedClientId) : null,
            receipt: row.receiptFile || undefined,
            remove_receipt: !row.receiptFile && !row.receiptPath,
          });

          if (updateResult.error) {
            throw new Error(`Row ${i + 1}: ${updateResult.error}`);
          }
        }

        await refreshExpenses();

        setError(null);
        setIsDialogOpen(false);
        setFormData({});
        setAssignedClientId("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        setExpenseRows([makeEmptyRow()]);
        setGroupedEditingClaims([]);
        setIsGroupedEdit(false);
        return;
      }

      // Create mode: submit all rows in one request
      if (!editingId) {
        // if (!assignedClientId) {
        //   setError("Assigned client is required");
        //   setLoading(false);
        //   return;
        // }

        if (!expenseRows.length) {
          setError("Add at least one expense row");
          setLoading(false);
          return;
        }

        for (let i = 0; i < expenseRows.length; i++) {
          const row = expenseRows[i];
          if (!row.category) {
            setError(`Category is required (row ${i + 1})`);
            setLoading(false);
            return;
          }
          if (!row.amount || Number(row.amount) <= 0) {
            setError(`Amount is required and must be > 0 (row ${i + 1})`);
            setLoading(false);
            return;
          }
        }

        if (!expenseDate) {
          setError("Date is required");
          setLoading(false);
          return;
        }

        const payloadRows = expenseRows.map((row) => ({
          category: row.category,
          amount: Number(row.amount),
          expense_date: expenseDate,
          description: row.description?.trim() || "",
          receipt_path: row.receiptPath || null,
          client_id: assignedClientId ? Number(assignedClientId) : null,
        }));

        const bulkFormData = new FormData();
        bulkFormData.append("expenses", JSON.stringify(payloadRows));
        expenseRows.forEach((row, index) => {
          if (row.receiptFile) {
            bulkFormData.append(`receipt_${index}`, row.receiptFile);
          }
        });

        const result = await expenseApi.createExpensesBulk(bulkFormData);
        if (result.error) {
          throw new Error(result.error);
        }

        // Best-effort: clear draft after successful submit
        if (editingDraftId) {
          try {
            await expenseApi.clearDraft(editingDraftId);
          } catch {}
        }

        // Trigger a single notification (summary)
        const totalAmount = payloadRows.reduce(
          (sum, r) => sum + (Number(r.amount) || 0),
          0,
        );
        const notificationService = NotificationTriggerService.getInstance();
        await notificationService.triggerExpenseApplied({
          employeeId: user?.id || "",
          employeeName: user?.name || "Unknown Employee",
          amount: totalAmount,
          expenseType: `${payloadRows.length} item(s)`,
          description: `Submitted ${payloadRows.length} expense(s)`,
          managerId: "",
          hrId: "",
        });

        await refreshExpenses();

        setError(null);
        setIsDialogOpen(false);
        setFormData({});
        setAssignedClientId("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        setExpenseRows([makeEmptyRow()]);
        return;
      }

      // Edit mode: update a single expense
      if (!formData.category || formData.category.trim() === "") {
        setError("Category is required");
        setLoading(false);
        return;
      }

      if (!formData.amount || Number(formData.amount) <= 0) {
        setError("Amount is required and must be greater than 0");
        setLoading(false);
        return;
      }

      if (!formData.date || formData.date.trim() === "") {
        setError("Date is required");
        setLoading(false);
        return;
      }

      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
        expense_date: formData.date,
        category: formData.category.trim(),
        description: formData.description?.trim() || "",
        client_id: assignedClientId ? Number(assignedClientId) : null,
        receipt: billFile?.file,
        remove_receipt: !billFile?.file && !editReceipt?.path,
      };

      const updateResult = await expenseApi.updateExpense(
        editingId,
        expenseData,
      );
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      await refreshExpenses();

      setError(null); // Clear any previous errors on success
      setIsDialogOpen(false);
      setFormData({});
      setBillFile(null);
      setBillFileType("");
      setScanData(null);
      setEditReceipt(null);
      setGroupedEditingClaims([]);
      setIsGroupedEdit(false);
      setEditingDraftId(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save expense";
      setError(message);
      setSaveErrorDialog({
        title: "Unable to Save Expense",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (expenseOrId: string | GroupedExpenseClaim) => {
    const targetExpense =
      typeof expenseOrId === "string"
        ? filteredExpenses.find((expense) => expense.id === expenseOrId)
        : expenseOrId;

    if (targetExpense && !canDeleteClaim(targetExpense)) {
      showToast.error("Approved expenses cannot be deleted");
      return;
    }

    const resolvedDeleteId =
      targetExpense?.isDraft && targetExpense.draftId
        ? `draft-record-${targetExpense.draftId}`
        : targetExpense?.claims?.[0]?.id ||
          (typeof expenseOrId === "string" ? expenseOrId : targetExpense?.id);

    if (!resolvedDeleteId) {
      showToast.error("Unable to identify the expense to delete");
      return;
    }

    setDeleteId(resolvedDeleteId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        setLoading(true);

        if (isDraftDeleteId(deleteId)) {
          const draftId = parseDraftDeleteId(deleteId);
          if (!draftId) {
            throw new Error("Unable to identify the draft to delete");
          }
          const result = await expenseApi.clearDraft(draftId || undefined);
          if (result.error) {
            throw new Error(result.error);
          }
          if (draftId && editingDraftId === draftId) {
            setEditingDraftId(null);
          }
        } else {
          const result = await expenseApi.deleteExpense(deleteId);
          if (result.error) {
            throw new Error(result.error);
          }
        }

        await refreshExpenses();
        setIsDeleteDialogOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting expense:", error);
        showToast.error(
          error instanceof Error ? error.message : "Failed to delete expense",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApprovalAction = (
    expenseId: string,
    action: "approve" | "reject",
  ) => {
    setActionExpenseId(expenseId);
    setApprovalAction(action);
    setApprovalNotes("");
    setActionDialogOpen(true);
  };

  const confirmApprovalAction = async () => {
    if (actionExpenseId && approvalAction) {
      try {
        setLoading(true);

        const newStatus =
          approvalAction === "approve" ? "approved" : "rejected";
        const payload = {
          status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
          approval_note: approvalNotes || null,
          approved_by: user?.name || "Finance User",
        };

        // Call update API
        const result = await expenseApi.updateExpense(actionExpenseId, payload);
        if (result.error) {
          throw new Error(result.error);
        }

        // Refetch expenses to get updated data
        await refreshExpenses();

        setActionDialogOpen(false);
        setApprovalAction(null);
        setActionExpenseId(null);
        setApprovalNotes("");
      } catch (error) {
        console.error("Error updating expense status:", error);
        showToast.error(
          error instanceof Error
            ? error.message
            : "Failed to update expense status",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[status] || colors.pending;
  };

  const handleViewReceipt = (expense: ExpenseClaim | GroupedExpenseClaim) => {
    if ("claims" in expense) {
      const groupedUrls = Array.from(
        new Set(
          expense.claims
            .flatMap((claim) => {
              const urls: string[] = [];
              if (claim.receiptUrl) {
                urls.push(claim.receiptUrl);
              }
              if (claim.receiptPath) {
                const resolved = resolveReceiptUrl(claim.receiptPath);
                if (resolved) {
                  urls.push(resolved);
                }
              }
              return urls;
            })
            .filter(Boolean),
        ),
      );

      if (
        expense.isDraft &&
        expense.draftReceiptPaths &&
        expense.draftReceiptPaths.length > 1
      ) {
        setDraftReceiptZoom(1);
        setDraftReceiptGallery({
          open: true,
          urls: expense.draftReceiptPaths
            .map((path) => resolveReceiptUrl(path))
            .filter(Boolean),
        });
        return;
      }

      if (groupedUrls.length > 1) {
        setDraftReceiptZoom(1);
        setDraftReceiptGallery({
          open: true,
          urls: groupedUrls,
        });
        return;
      }

      const firstUrl = groupedUrls[0];
      if (!firstUrl) {
        showToast.error(
          expense.isDraft
            ? "No draft attachment found"
            : "No bill attached for this claim",
        );
        return;
      }

      openPreviewFromUrl(firstUrl, expense.categories[0] || "Receipt");
      return;
    }

    if (
      expense.isDraft &&
      expense.draftReceiptPaths &&
      expense.draftReceiptPaths.length > 1
    ) {
      setDraftReceiptZoom(1);
      setDraftReceiptGallery({
        open: true,
        urls: expense.draftReceiptPaths
          .map((path) => resolveReceiptUrl(path))
          .filter(Boolean),
      });
      return;
    }

    const url = expense.receiptUrl || resolveReceiptUrl(expense.receiptPath);
    if (!url) {
      showToast.error(
        expense.isDraft
          ? "No draft attachment found"
          : "No bill attached for this claim",
      );
      return;
    }

    openPreviewFromUrl(
      url,
      expense.receiptPath?.split("/").pop() || expense.category || "Receipt",
    );
  };

  const canEditClaim = (expense: GroupedExpenseClaim) => {
    if (expense.isDraft) {
      return (
        canClaimExpenses || canPerformModuleAction("expenses", "edit", "claims")
      );
    }

    if (["approved", "reimbursed"].includes(expense.status)) {
      return false;
    }

    return (
      canClaimExpenses || canPerformModuleAction("expenses", "edit", "claims")
    );
  };

  const canDeleteClaim = (expense: GroupedExpenseClaim) => {
    if (expense.isDraft) {
      return canClaimExpenses;
    }

    if (["approved", "reimbursed"].includes(expense.status)) {
      return false;
    }

    return (
      canClaimExpenses || canPerformModuleAction("expenses", "edit", "claims")
    );
  };

  const getReceiptPreviewType = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (/\.(png|jpg|jpeg|webp|svg|gif)(\?|$)/.test(lower)) return "image";
    return "other";
  };

  // Get unique employees for export selection
  const uniqueEmployees = useMemo(() => {
    const employees = new Map<string, string>();
    expenses.forEach((exp) => {
      if (exp.employeeId && exp.employeeName) {
        employees.set(exp.employeeId, exp.employeeName);
      }
    });
    return Array.from(employees.entries()).map(([id, name]) => ({ id, name }));
  }, [expenses]);

  // Handle select all employees
  const handleSelectAllEmployees = (checked: boolean) => {
    setSelectAllEmployees(checked);
    if (checked) {
      setSelectedEmployees(uniqueEmployees.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Handle individual employee selection
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  const getActiveExportDateFilter = () => {
    if (filterFromDate || filterToDate) {
      return {
        ...(filterFromDate ? { startDate: filterFromDate } : {}),
        ...(filterToDate ? { endDate: filterToDate } : {}),
      };
    }

    if (filterMonth) {
      const [year, month] = filterMonth.split("-").map(Number);
      if (Number.isFinite(year) && Number.isFinite(month)) {
        const lastDay = String(new Date(year, month, 0).getDate()).padStart(
          2,
          "0",
        );
        return {
          startDate: `${filterMonth}-01`,
          endDate: `${filterMonth}-${lastDay}`,
        };
      }
    }

    return undefined;
  };

  // Handle export
  const handleExport = async () => {
    try {
      setExporting(true);

      const exportData = {
        employeeIds: selectAllEmployees ? ["all"] : selectedEmployees,
        expenseIds: filteredExpenses.flatMap((expense) =>
          expense.claims.map((claim) => claim.id).filter(Boolean),
        ),
        format: exportFormat,
        statusFilter:
          exportStatusFilter !== "all" ? exportStatusFilter : filterStatus,
        dateFilter: getActiveExportDateFilter(),
      };

      const response = await expenseApi.exportExpenses(exportData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle file download for CSV
      if (exportFormat === "csv") {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expense_claim_model_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON, create and download file
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setIsExportDialogOpen(false);
      // Reset export selections
      setSelectedEmployees([]);
      setSelectAllEmployees(false);
      setExportStatusFilter("all");
    } catch (error) {
      console.error("Export error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to export expenses",
      );
    } finally {
      setExporting(false);
    }
  };

  // Open export dialog
  const openExportDialog = () => {
    setIsExportDialogOpen(true);
    setError(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterMonth("");
    setFilterFromDate("");
    setFilterToDate("");
  };

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + e.totalAmount,
    0,
  );
  const pendingClaims = filteredExpenses.filter(
    (expense) => expense.status === "pending",
  );
  const approvedClaims = filteredExpenses.filter(
    (expense) => expense.status === "approved",
  );
  const reimbursedClaims = filteredExpenses.filter(
    (expense) => expense.status === "reimbursed",
  );
  const formatClaimAmount = (amount: number) =>
    `₹${(Number(amount) || 0).toLocaleString()}`;

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <CreditCard className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">Expense Management</span>
            <span className="sm:hidden">Expenses</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Manage and track employee expense claims
          </p>
        </div>

        {(hasRole(user, "finance") || hasRole(user, "admin")) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Claims
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">
                  {filteredExpenses.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Approved
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                  ₹
                  {filteredExpenses
                    .filter((e) => e.status === "approved")
                    .reduce((sum, e) => sum + e.totalAmount, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Pending
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-yellow-600">
                  ₹
                  {filteredExpenses
                    .filter((e) => e.status === "pending")
                    .reduce((sum, e) => sum + e.totalAmount, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Reimbursed
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-teal-600">
                  ₹
                  {filteredExpenses
                    .filter((e) => e.status === "reimbursed")
                    .reduce((sum, e) => sum + e.totalAmount, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(hasRole(user, "finance") || hasRole(user, "admin")) &&
          canClaimExpenses && (
            <Button
              onClick={() => handleOpenDialog()}
              className="gap-2 w-full md:w-auto h-8 sm:h-10 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Submit Claim
            </Button>
          )}

        {hasRole(user, "finance") || hasRole(user, "admin") ? (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Filters & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="search" className="text-xs sm:text-sm">
                    Search
                  </Label>
                  <div className="relative mt-1.5 sm:mt-2">
                    <Search className="absolute left-2 sm:left-3 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-xs sm:text-sm">
                    Status
                  </Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger
                      id="status"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="month" className="text-xs sm:text-sm">
                    Month
                  </Label>
                  <Input
                    id="month"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="from-date" className="text-xs sm:text-sm">
                    From Date
                  </Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="to-date" className="text-xs sm:text-sm">
                    To Date
                  </Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs sm:text-sm">Export</Label>
                  <div className="mt-1.5 sm:mt-2 flex gap-2">
                    <Button
                      onClick={clearFilters}
                      className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                      variant="outline"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={openExportDialog}
                      className="flex-1 h-8 sm:h-10 text-xs sm:text-sm gap-2"
                      variant="outline"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {canClaimExpenses && (
              <Button
                onClick={() => handleOpenDialog()}
                className="gap-2 w-full md:w-auto h-8 sm:h-10 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Submit Claim
              </Button>
            )}

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="employee-status"
                      className="text-xs sm:text-sm"
                    >
                      Status
                    </Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger
                        id="employee-status"
                        className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="reimbursed">Reimbursed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="employee-month"
                      className="text-xs sm:text-sm"
                    >
                      Month
                    </Label>
                    <Input
                      id="employee-month"
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="employee-from-date"
                      className="text-xs sm:text-sm"
                    >
                      From Date
                    </Label>
                    <Input
                      id="employee-from-date"
                      type="date"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="employee-to-date"
                      className="text-xs sm:text-sm"
                    >
                      To Date
                    </Label>
                    <Input
                      id="employee-to-date"
                      type="date"
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Actions</Label>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="mt-1.5 sm:mt-2 w-full h-8 sm:h-10 text-xs sm:text-sm"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-[#17c491]/10 via-white to-white pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">
                  Claims ({filteredExpenses.length})
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600">
                  Employee-wise expense claims with date, client and approval
                  status
                </CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-white/80 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="text-sm font-bold text-slate-950">
                    {formatClaimAmount(totalAmount)}
                  </p>
                </div>
                <div className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-700">
                    Pending
                  </p>
                  <p className="text-sm font-bold text-yellow-900">
                    {pendingClaims.length}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Approved
                  </p>
                  <p className="text-sm font-bold text-emerald-900">
                    {approvedClaims.length}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    Reimbursed
                  </p>
                  <p className="text-sm font-bold text-blue-900">
                    {reimbursedClaims.length}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Loading expenses...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {filteredExpenses.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No expense claims found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try changing the filters or date range.
                    </p>
                  </div>
                )}
                {/* Mobile Card View */}
                {filteredExpenses.length > 0 && (
                  <div className="space-y-3 p-3 md:hidden">
                    {filteredExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-bold text-slate-950">
                              {expense.employeeName}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {expense.date}{" "}
                              {expense.clientName
                                ? `- ${expense.clientName}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-semibold capitalize whitespace-nowrap ${getStatusColor(expense.status)}`}
                          >
                            {expense.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Client
                            </span>
                            <span className="mt-1 block truncate font-semibold text-slate-900">
                              {expense.clientName || "-"}
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Amount
                            </span>
                            <span className="mt-1 block font-bold text-slate-950">
                              {formatClaimAmount(expense.totalAmount || 0)}
                            </span>
                          </div>
                          <div className="col-span-2 rounded-lg bg-[#17c491]/5 px-3 py-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#0b6f53]">
                              Category
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-slate-900">
                              {expense.categories.join(", ")}
                            </span>
                          </div>
                          {expense.claims.length > 1 && (
                            <div className="col-span-2 flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                              <span className="text-xs font-semibold text-slate-500">
                                Items
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {expense.claims.length} expenses
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          {hasRole(user, "finance") ? (
                            <div className="flex flex-wrap gap-2">
                              {expense.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprovalAction(
                                        expense.id,
                                        "approve",
                                      )
                                    }
                                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                    title="Approve"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleApprovalAction(expense.id, "reject")
                                    }
                                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                                    title="Reject"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(expense.status === "approved" ||
                                expense.status === "rejected") && (
                                <span className="text-xs text-muted-foreground flex-1">
                                  {expense.status === "approved"
                                    ? "Approved"
                                    : "Rejected"}
                                </span>
                              )}
                            </div>
                          ) : expense.claims.some(
                              (claim) => claim.receiptUrl || claim.receiptPath,
                            ) ||
                            canEditClaim(expense) ||
                            canDeleteClaim(expense) ? (
                            <div className="flex gap-2">
                              {expense.claims.some(
                                (claim) =>
                                  claim.receiptUrl || claim.receiptPath,
                              ) && (
                                <button
                                  onClick={() => handleViewReceipt(expense)}
                                  className="flex-1 rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
                                  title="View Bill"
                                >
                                  <Eye className="mx-auto h-4 w-4" />
                                </button>
                              )}
                              {canEditClaim(expense) && (
                                <button
                                  onClick={() => handleOpenDialog(expense)}
                                  className="flex-1 rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <Edit className="mx-auto h-4 w-4" />
                                </button>
                              )}
                              {canDeleteClaim(expense) && (
                                <button
                                  onClick={() => handleDelete(expense)}
                                  className="flex-1 rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                                  title={
                                    expense.isDraft ? "Delete Draft" : "Delete"
                                  }
                                >
                                  <Trash2 className="mx-auto h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Desktop Table View */}
                {filteredExpenses.length > 0 && (
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1120px] table-fixed text-sm">
                      <colgroup>
                        <col className="w-[230px]" />
                        <col className="w-[150px]" />
                        <col className="w-[260px]" />
                        <col className="w-[300px]" />
                        <col className="w-[130px]" />
                        <col className="w-[140px]" />
                        <col className="w-[120px]" />
                      </colgroup>
                      <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-3 text-left font-bold">
                            Employee
                          </th>
                          <th className="px-5 py-3 text-left font-bold">
                            Claim Date
                          </th>
                          <th className="px-5 py-3 text-left font-bold">
                            Client
                          </th>
                          <th className="px-5 py-3 text-left font-bold">
                            Category
                          </th>
                          <th className="px-5 py-3 text-right font-bold">
                            Amount
                          </th>
                          <th className="px-5 py-3 text-left font-bold">
                            Status
                          </th>
                          <th className="px-5 py-3 text-center font-bold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map((expense) => (
                          <tr
                            key={expense.id}
                            className="bg-white transition-colors hover:bg-[#17c491]/5"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#17c491]/10 text-sm font-bold text-[#0b6f53]">
                                  {expense.employeeName
                                    ?.split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")
                                    .toUpperCase() || "EX"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="whitespace-normal break-words font-bold leading-snug text-slate-950">
                                    {expense.employeeName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {expense.claims.length > 1
                                      ? `${expense.claims.length} expense items`
                                      : "1 expense item"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <p className="font-semibold text-slate-900">
                                {expense.date}
                              </p>
                              <p className="text-xs text-slate-500">
                                Submitted claim
                              </p>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <p className="whitespace-normal break-words font-semibold leading-snug text-slate-900">
                                {expense.clientName || "-"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {expense.clientName
                                  ? "Client visit"
                                  : "General expense"}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div className="flex flex-wrap gap-1.5">
                                {expense.categories.map((category) => (
                                  <span
                                    key={category}
                                    className="whitespace-nowrap rounded-full border border-[#17c491]/20 bg-[#17c491]/10 px-2 py-1 text-xs font-semibold text-[#0b6f53]"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right align-middle">
                              <p className="whitespace-nowrap text-base font-bold text-slate-950">
                                {formatClaimAmount(expense.totalAmount || 0)}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span
                                className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold capitalize leading-none ${getStatusColor(expense.status)}`}
                              >
                                {expense.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              {hasRole(user, "finance") ? (
                                <div className="flex justify-center gap-2">
                                  {expense.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleApprovalAction(
                                            expense.id,
                                            "approve",
                                          )
                                        }
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                        title="Approve"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleApprovalAction(
                                            expense.id,
                                            "reject",
                                          )
                                        }
                                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                                        title="Reject"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {(expense.status === "approved" ||
                                    expense.status === "rejected") && (
                                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                                      {expense.status === "approved"
                                        ? "Approved"
                                        : "Rejected"}
                                    </span>
                                  )}
                                </div>
                              ) : expense.claims.some(
                                  (claim) =>
                                    claim.receiptUrl || claim.receiptPath,
                                ) ||
                                canEditClaim(expense) ||
                                canDeleteClaim(expense) ? (
                                <div className="flex justify-center gap-1.5">
                                  {expense.claims.some(
                                    (claim) =>
                                      claim.receiptUrl || claim.receiptPath,
                                  ) && (
                                    <button
                                      onClick={() => handleViewReceipt(expense)}
                                      className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
                                      title="View Bill"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canEditClaim(expense) && (
                                    <button
                                      onClick={() => handleOpenDialog(expense)}
                                      className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDeleteClaim(expense) && (
                                    <button
                                      onClick={() => handleDelete(expense)}
                                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                                      title={
                                        expense.isDraft
                                          ? "Delete Draft"
                                          : "Delete"
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="block text-center text-xs text-muted-foreground">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isGroupedEdit
                ? `Edit ${expenseRows.length} Expense Claims`
                : editingId
                  ? "Edit Claim"
                  : formData.status === "draft"
                    ? "Edit Draft Expense Claims"
                    : "Submit Expense Claims"}
            </DialogTitle>
          </DialogHeader>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div
              className={`grid grid-cols-1 ${editingId && expenseRows.length <= 1 ? "sm:grid-cols-1" : "sm:grid-cols-3"} gap-2 sm:gap-4`}
            >
              <div>
                <Label className="text-xs sm:text-sm">Employee Name</Label>
                <Input
                  value={formData.employeeName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeName: e.target.value })
                  }
                  disabled={hasRole(user, "employee") && !editingId}
                  className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              {!editingId ||
              isGroupedEdit ||
              assignedClientId ||
              assignedClients.length > 0 ? (
                <>
                  <div>
                    <Label className="text-xs sm:text-sm">
                      Assigned Client
                    </Label>
                    <Select
                      value={assignedClientId}
                      onValueChange={(val) => {
                        setAssignedClientId(val);
                        setError(null);
                      }}
                    >
                      <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select assigned client" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedClients.length ? (
                          assignedClients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.client_name} ({c.client_id})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__none" disabled>
                            No assigned clients
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {!editingId || isGroupedEdit ? (
                    <div>
                      <Label className="text-xs sm:text-sm">Date</Label>
                      <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => {
                          setExpenseDate(e.target.value);
                          setError(null);
                        }}
                        className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            {editingId && expenseRows.length <= 1 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Category</Label>
                    <Input
                      value={formData.category || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value });
                        setError(null); // Clear error when user starts typing
                      }}
                      placeholder="e.g., Travel, Meals, Supplies"
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      Travel, Meals, Supplies, or Other
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Amount</Label>
                    <Input
                      type="number"
                      value={formData.amount || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value),
                        });
                        setError(null); // Clear error when user starts typing
                      }}
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Date</Label>
                    <Input
                      type="date"
                      value={formData.date || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value });
                        setError(null); // Clear error when user starts typing
                      }}
                      className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm">Description</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
                  />
                </div>

                {/* <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
              <Label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm">Bill / Receipt</Label> */}

                {/* Scanning Status */}
                {/* {scanning && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-800">Scanning receipt with AI...</span>
                  </div>
                </div>
              )} */}

                {/* Scan Results */}
                {/* {scanData && !scanning && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Receipt Scanned Successfully!</span>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    {scanData.amount && <div>• Amount: ₹{scanData.amount}</div>}
                    {scanData.date && <div>• Date: {scanData.date}</div>}
                    {scanData.vendor && <div>• Vendor: {scanData.vendor}</div>}
                    {scanData.category && <div>• Category: {scanData.category}</div>}
                  </div>
                </div>
              )} */}

                {/* {!billFile ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="fileType" className="text-xs sm:text-sm">File Type / Category</Label>
                    <Select value={billFileType} onValueChange={setBillFileType}>
                      <SelectTrigger id="fileType" className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Receipt">Receipt</SelectItem>
                        <SelectItem value="Bill">Bill</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="relative">
                      <div className="flex items-center justify-center w-full px-2 py-3 sm:px-4 sm:py-6 border-2 border-dashed border-border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                          <span className="text-xs sm:text-sm text-muted-foreground text-center">
                            {scanning ? "Scanning..." : "Click to upload & scan"}
                          </span>
                          <span className="text-xs text-muted-foreground">PDF, PNG, JPG, DOC up to 10MB</span>
                          <span className="text-xs text-blue-600 font-medium">🔍 AI will auto-fill details</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        disabled={scanning}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{billFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {billFile.type} • {(billFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )} */}
                {/* </div> */}

                <div className="border-t pt-3 mt-2">
                  <Label className="block mb-2 text-xs sm:text-sm">
                    Bill / Receipt
                  </Label>

                  {scanning && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-800">
                          Scanning receipt...
                        </span>
                      </div>
                    </div>
                  )}

                  {scanData && !scanning && billFile && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Receipt scanned successfully
                        </span>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        {scanData.amount && (
                          <div>Amount: Rs.{scanData.amount}</div>
                        )}
                        {scanData.date && <div>Date: {scanData.date}</div>}
                        {scanData.vendor && (
                          <div>Vendor: {scanData.vendor}</div>
                        )}
                        {scanData.category && (
                          <div>Category: {scanData.category}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {!billFile && editReceipt?.path && (
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Current attachment
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {editReceipt.path.split("/").pop()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() =>
                            openPreviewFromUrl(
                              editReceipt.url ||
                                resolveReceiptUrl(editReceipt.path),
                              editReceipt.path?.split("/").pop() || "Receipt",
                            )
                          }
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-destructive"
                          onClick={handleRemoveExistingReceipt}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {!billFile ? (
                    <div className="space-y-2">
                      <div>
                        <Label
                          htmlFor="fileType"
                          className="text-xs sm:text-sm"
                        >
                          File Type / Category
                        </Label>
                        <Select
                          value={billFileType}
                          onValueChange={setBillFileType}
                        >
                          <SelectTrigger
                            id="fileType"
                            className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                          >
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Invoice">Invoice</SelectItem>
                            <SelectItem value="Receipt">Receipt</SelectItem>
                            <SelectItem value="Bill">Bill</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <label className="relative block">
                        <div className="flex items-center justify-center w-full px-2 py-3 sm:px-4 sm:py-6 border-2 border-dashed border-border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                            <span className="text-xs sm:text-sm text-muted-foreground text-center">
                              {scanning
                                ? "Scanning..."
                                : editReceipt?.path
                                  ? "Replace receipt"
                                  : "Click to upload & scan"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PNG, JPG, JPEG, WebP, SVG, PDF up to 10MB
                            </span>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,image/*,application/pdf"
                          disabled={scanning}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Upload className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {billFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {billFile.type || "Attachment"} •{" "}
                            {(billFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() =>
                            billFile.file && openPreview(billFile.file)
                          }
                        >
                          Preview
                        </Button>
                        <button
                          onClick={handleRemoveFile}
                          className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors flex-shrink-0 ml-2"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {hasRole(user, "finance") && (
                  <div>
                    <Label className="text-xs sm:text-sm">Status</Label>
                    <Select
                      value={formData.status || "pending"}
                      onValueChange={(val: any) =>
                        setFormData({ ...formData, status: val })
                      }
                    >
                      <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="reimbursed">Reimbursed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-3">
                  {expenseRows.map((row, index) => (
                    <Card key={index} className="border border-border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            Expense {index + 1}
                          </CardTitle>
                          {expenseRows.length > 1 && !isGroupedEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(index)}
                              className="h-8 px-2 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                          <div>
                            <Label className="text-xs sm:text-sm">
                              Category
                            </Label>
                            <Select
                              value={row.category}
                              onValueChange={(val: any) =>
                                updateRow(index, { category: val })
                              }
                            >
                              <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="accommodation">
                                  Accommodation
                                </SelectItem>
                                <SelectItem value="others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm">Amount</Label>
                            <Input
                              type="number"
                              value={row.amount}
                              onChange={(e) =>
                                updateRow(index, { amount: e.target.value })
                              }
                              className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-xs sm:text-sm">
                              Description
                            </Label>
                            <Textarea
                              value={row.description}
                              onChange={(e) =>
                                updateRow(index, {
                                  description: e.target.value,
                                })
                              }
                              className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-10 h-10 resize-none"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs sm:text-sm">
                            Upload File
                          </Label>
                          <div className="mt-1.5 sm:mt-2">
                            <input
                              id={`receipt-${index}`}
                              type="file"
                              accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0] || null;
                                const mode =
                                  receiptPickerMode[index] || "upload";
                                const success = await processRowReceiptFile(
                                  index,
                                  file,
                                  mode,
                                );
                                setReceiptPickerMode((prev) => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                                if (!success) {
                                  e.target.value = "";
                                }
                                e.target.value = "";
                              }}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 px-3 text-xs sm:text-sm"
                                onClick={() => {
                                  setReceiptPickerMode((prev) => ({
                                    ...prev,
                                    [index]: "upload",
                                  }));
                                  const input = document.getElementById(
                                    `receipt-${index}`,
                                  ) as HTMLInputElement | null;
                                  input?.click();
                                }}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload File
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-10 px-3 text-xs sm:text-sm"
                                disabled={row.isScanning}
                                onClick={() => {
                                  if (row.receiptFile) {
                                    void handleRowReceiptScan(index);
                                    return;
                                  }

                                  setReceiptPickerMode((prev) => ({
                                    ...prev,
                                    [index]: "scan",
                                  }));
                                  const input = document.getElementById(
                                    `receipt-${index}`,
                                  ) as HTMLInputElement | null;
                                  input?.click();
                                }}
                              >
                                {row.isScanning ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Camera className="w-4 h-4 mr-2" />
                                )}
                                {row.isScanning ? "Scanning..." : "Auto Scan"}
                              </Button>
                            </div>
                          </div>
                          {row.scanData && (
                            <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                              <div className="mb-1 flex items-center gap-2">
                                <Camera className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-green-800">
                                  Scan Result
                                </span>
                              </div>
                              <div className="space-y-1 text-xs text-green-700">
                                {row.scanData.amount && (
                                  <div>Amount: Rs.{row.scanData.amount}</div>
                                )}
                                {row.scanData.date && (
                                  <div>Date: {row.scanData.date}</div>
                                )}
                                {row.scanData.vendor && (
                                  <div>Vendor: {row.scanData.vendor}</div>
                                )}
                                {row.scanData.category && (
                                  <div>Category: {row.scanData.category}</div>
                                )}
                              </div>
                            </div>
                          )}
                          {row.receiptFile && (
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {row.receiptFile.name}
                              </p>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() =>
                                    openPreview(row.receiptFile as File)
                                  }
                                >
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-destructive"
                                  onClick={() =>
                                    updateRow(index, {
                                      receiptFile: null,
                                      receiptPath: null,
                                      scanData: null,
                                      isScanning: false,
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )}
                          {!row.receiptFile && row.receiptPath && (
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                Saved attachment
                              </p>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() =>
                                    openPreviewFromUrl(
                                      resolveReceiptUrl(row.receiptPath),
                                      row.receiptPath?.split("/").pop() ||
                                        "Receipt",
                                    )
                                  }
                                >
                                  View
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-destructive"
                                  onClick={() =>
                                    updateRow(index, {
                                      receiptPath: null,
                                      scanData: null,
                                      isScanning: false,
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {!isGroupedEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRow}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Expense
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            {!editingId && !isGroupedEdit && (
              <>
                {editingDraftId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearDraft}
                    disabled={draftClearing || draftSaving || loading}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {draftClearing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Clearing...
                      </>
                    ) : (
                      "Clear Draft"
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={draftSaving || draftClearing || loading}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {draftSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
                      Draft...
                    </>
                  ) : (
                    "Save Draft"
                  )}
                </Button>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editingId || isGroupedEdit ? (
                "Update"
              ) : (
                `Submit ${expenseRows.length || 0} Expense(s)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={preview.open}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
      >
        <DialogContent closeOnEscape className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Preview</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm truncate">
              {preview.name}
            </DialogDescription>
          </DialogHeader>

          {preview.url ? (
            preview.type?.startsWith("image/") ? (
              <div className="w-full">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-h-[70vh] w-auto mx-auto rounded border"
                />
              </div>
            ) : preview.type === "application/pdf" ? (
              <iframe
                title="PDF Preview"
                src={preview.url}
                className="w-full h-[70vh] rounded border"
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type.
                </p>
                <a
                  href={preview.url}
                  download={preview.name}
                  className="text-sm text-primary underline"
                >
                  Download
                </a>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={draftReceiptGallery.open}
        onOpenChange={(open) => {
          if (!open) {
            setDraftReceiptGallery({ open: false, urls: [] });
            setDraftReceiptZoom(1);
          }
        }}
      >
        <DialogContent closeOnEscape className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Draft Attachments
            </DialogTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DialogDescription className="text-xs sm:text-sm">
                {draftReceiptGallery.urls.length} saved bill(s) in this draft
              </DialogDescription>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustDraftReceiptZoom(-0.25)}
                  disabled={draftReceiptZoom <= 0.5}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-14 text-center text-xs font-medium tabular-nums">
                  {Math.round(draftReceiptZoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustDraftReceiptZoom(0.25)}
                  disabled={draftReceiptZoom >= 3}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setDraftReceiptZoom(1)}
                  disabled={draftReceiptZoom === 1}
                >
                  Reset
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {draftReceiptGallery.urls.map((url, index) => {
              const previewType = getReceiptPreviewType(url);
              return (
                <div
                  key={`${url}-${index}`}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Bill {index + 1}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() =>
                        openPreviewFromUrl(url, `Draft bill ${index + 1}`)
                      }
                    >
                      Open
                    </Button>
                  </div>

                  {previewType === "image" ? (
                    <div className="max-h-[65vh] overflow-auto rounded border bg-slate-50 p-2">
                      <img
                        src={url}
                        alt={`Draft bill ${index + 1}`}
                        className="mx-auto h-auto max-w-none rounded"
                        style={{ width: `${draftReceiptZoom * 100}%` }}
                      />
                    </div>
                  ) : previewType === "pdf" ? (
                    <div className="max-h-[65vh] overflow-auto rounded border bg-slate-50">
                      <iframe
                        title={`Draft bill ${index + 1}`}
                        src={url}
                        className="rounded border-0"
                        style={{
                          width: `${draftReceiptZoom * 100}%`,
                          height: `${60 * draftReceiptZoom}vh`,
                          minHeight: "60vh",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Preview not available for this file type.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          openPreviewFromUrl(url, `Draft bill ${index + 1}`)
                        }
                        className="text-sm text-primary underline"
                      >
                        Open attachment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(saveErrorDialog)}
        onOpenChange={(open) => {
          if (!open) setSaveErrorDialog(null);
        }}
      >
        <DialogContent
          className="w-[92vw] max-w-md rounded-lg border-red-100 p-0 shadow-xl"
          closeOnEscape
          closeOnInteractOutside
        >
          <div className="border-b border-red-100 bg-red-50 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-red-700">
                {saveErrorDialog?.title || "Unable to Save"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Expense save error
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm leading-6 text-slate-700">
              {saveErrorDialog?.message}
            </p>
          </div>
          <div className="flex justify-end border-t bg-slate-50 px-5 py-3">
            <Button
              type="button"
              onClick={() => setSaveErrorDialog(null)}
              className="bg-red-600 hover:bg-red-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="w-full max-w-sm p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {isDraftDeleteId(deleteId) ? "Delete Draft" : "Delete Claim"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {isDraftDeleteId(deleteId)
                ? "Are you sure you want to remove this saved draft?"
                : "Are you sure? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {approvalAction === "approve"
                ? "Approve Expense Claim"
                : "Reject Expense Claim"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {approvalAction === "approve"
                ? "Are you sure you want to approve this expense claim?"
                : "Are you sure you want to reject this expense claim?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Notes (Optional)</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes..."
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprovalAction}
              className={`w-full sm:w-auto text-xs sm:text-sm ${
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Expense Data
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select employees and filters to export expense data in CSV or JSON
              format.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Export Format */}
            <div>
              <Label className="text-xs sm:text-sm font-medium">
                Export Format
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={exportFormat === "csv" ? "default" : "outline"}
                  onClick={() => setExportFormat("csv")}
                  className="text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant={exportFormat === "json" ? "default" : "outline"}
                  onClick={() => setExportFormat("json")}
                  className="text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs sm:text-sm font-medium">
                  Select Employees
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAllEmployees}
                    onCheckedChange={handleSelectAllEmployees}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-xs sm:text-sm cursor-pointer"
                  >
                    Select All ({uniqueEmployees.length})
                  </Label>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {uniqueEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No employees found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {uniqueEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={
                            selectedEmployees.includes(employee.id) ||
                            selectAllEmployees
                          }
                          onCheckedChange={(checked) =>
                            handleEmployeeSelection(
                              employee.id,
                              checked as boolean,
                            )
                          }
                        />
                        <Label
                          htmlFor={`employee-${employee.id}`}
                          className="text-xs sm:text-sm cursor-pointer flex-1"
                        >
                          {employee.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-xs sm:text-sm font-medium">
                Status Filter
              </Label>
              <Select
                value={exportStatusFilter}
                onValueChange={setExportStatusFilter}
              >
                <SelectTrigger className="mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="reimbursed">Reimbursed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-[#17c491]/20 bg-[#17c491]/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0b6f53]">
                Applied Date Filter
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {filterFromDate || filterToDate
                  ? `${filterFromDate || "Start"} to ${filterToDate || "End"}`
                  : filterMonth
                    ? filterMonth
                    : "All dates"}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="w-full sm:w-auto text-xs sm:text-sm"
              disabled={
                exporting ||
                (selectedEmployees.length === 0 && !selectAllEmployees)
              }
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
