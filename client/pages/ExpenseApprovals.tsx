import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Eye,
  Download,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import expenseApi from "@/components/helper/expense/expense";
import { useAuth } from "@/context/AuthContext";
import NotificationTriggerService from "@/services/notificationTriggerService";
import { showToast } from "@/utils/toast";

// Base URL for static files (without /api)

// Helper function to construct file URLs

interface ExpenseApproval {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "Pending"
    | "Approved"
    | "Rejected";
  receipt_url?: string;
  clientName?: string;
  approvedBy?: string | null;
  approvalNote?: string;
  createdAt: string;
  receipt_path?: string;
  expense_id?: string;
  company_id?: number;
  first_name?: string;
  last_name?: string;
  updated_at?: string;
  approved_at?: string | null;
}

interface PendingExpenseGroup {
  id: string;
  employeeId: string;
  employeeName: string;
  clientName: string;
  date: string;
  submittedAt: string;
  expenses: ExpenseApproval[];
  categories: string[];
  totalAmount: number;
  count: number;
  primaryExpense: ExpenseApproval;
}

interface ReceiptGalleryState {
  open: boolean;
  urls: string[];
  index: number;
}

export default function ExpenseApprovals() {
  const MIN_DECISION_LOADING_MS = 700;
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseApproval[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [receiptGallery, setReceiptGallery] = useState<ReceiptGalleryState>({
    open: false,
    urls: [],
    index: 0,
  });
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseApproval | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [approvalNote, setApprovalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [decisionExpenseIds, setDecisionExpenseIds] = useState<string[]>([]);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [processingExpenseIds, setProcessingExpenseIds] = useState<string[]>(
    [],
  );
  const [processingDecision, setProcessingDecision] = useState<
    "approved" | "rejected" | null
  >(null);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("all");

  const formatSubmitTimestamp = (value?: string | null) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.status === "pending"),
    [expenses],
  );
  const normalizeFilterText = (value?: string | null) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const toDateInputValue = (value?: string | null) => {
    if (!value || value === "N/A") return "";

    const slashParts = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashParts) {
      const [, day, month, year] = slashParts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const clientOptions = useMemo(
    () =>
      Array.from(
        new Set(
          pendingExpenses
            .map((expense) => expense.clientName || "No client")
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [pendingExpenses],
  );
  const filteredPendingExpenses = useMemo(() => {
    const employeeSearch = normalizeFilterText(employeeFilter);

    return pendingExpenses.filter((expense) => {
      const matchesEmployee =
        !employeeSearch ||
        normalizeFilterText(expense.employeeName).includes(employeeSearch) ||
        normalizeFilterText(expense.employeeId).includes(employeeSearch);
      const expenseDate = toDateInputValue(expense.date);
      const matchesFromDate =
        !fromDateFilter || (expenseDate && expenseDate >= fromDateFilter);
      const matchesToDate =
        !toDateFilter || (expenseDate && expenseDate <= toDateFilter);
      const expenseClient = expense.clientName || "No client";
      const matchesClient =
        clientFilter === "all" || expenseClient === clientFilter;

      return matchesEmployee && matchesFromDate && matchesToDate && matchesClient;
    });
  }, [pendingExpenses, employeeFilter, fromDateFilter, toDateFilter, clientFilter]);
  const hasActiveFilters =
    employeeFilter.trim() !== "" ||
    fromDateFilter !== "" ||
    toDateFilter !== "" ||
    clientFilter !== "all";
  const selectedPendingExpenses = useMemo(
    () =>
      pendingExpenses.filter((expense) =>
        selectedExpenses.includes(expense.id),
      ),
    [pendingExpenses, selectedExpenses],
  );
  const selectedPendingTotal = useMemo(
    () =>
      selectedPendingExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [selectedPendingExpenses],
  );
  const groupedPending = useMemo(() => {
    const byClientDate = new Map<string, PendingExpenseGroup>();

    filteredPendingExpenses.forEach((expense) => {
      const employeeKey =
        expense.employeeId || expense.employeeName || expense.id;
      const clientName = expense.clientName || "No client";
      const date = expense.date || "N/A";
      const key = `${employeeKey}__${clientName}__${date}`;
      const existing = byClientDate.get(key);

      if (existing) {
        existing.expenses.push(expense);
      } else {
        byClientDate.set(key, {
          id: key,
          employeeId: expense.employeeId,
          employeeName: expense.employeeName || "Unknown Employee",
          clientName,
          date,
          submittedAt: formatSubmitTimestamp(expense.createdAt),
          expenses: [expense],
          categories: [],
          totalAmount: 0,
          count: 1,
          primaryExpense: expense,
        });
      }
    });

    return Array.from(byClientDate.values()).map((group) => {
      const orderedExpenses = [...group.expenses].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.date).getTime();
        const bTime = new Date(b.createdAt || b.date).getTime();
        return bTime - aTime;
      });

      return {
        ...group,
        expenses: orderedExpenses,
        categories: Array.from(
          new Set(orderedExpenses.map((e) => e.category).filter(Boolean)),
        ),
        totalAmount: orderedExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: orderedExpenses.length,
        primaryExpense: orderedExpenses[0],
        submittedAt: formatSubmitTimestamp(orderedExpenses[0]?.createdAt),
      };
    });
  }, [filteredPendingExpenses]);
  const selectedGroup = useMemo(
    () =>
      selectedExpense
        ? groupedPending.find((group) =>
            group.expenses.some((expense) => expense.id === selectedExpense.id),
          ) || null
        : null,
    [groupedPending, selectedExpense],
  );
  const employeePendingExpenses = useMemo(
    () => selectedGroup?.expenses || [],
    [selectedGroup],
  );
  const employeeTotal = useMemo(
    () => employeePendingExpenses.reduce((sum, e) => sum + e.amount, 0),
    [employeePendingExpenses],
  );
  const previewUrls = receiptGallery.urls;
  const currentPreviewUrl = previewUrls[receiptGallery.index] || null;
  const isPreviewPdf = currentPreviewUrl?.toLowerCase().includes(".pdf");
  const receiptPreviewItems = useMemo(
    () =>
      employeePendingExpenses.reduce<Array<{ url: string; category: string }>>(
        (items, expense) => {
          if (
            !expense.receipt_url ||
            items.some((item) => item.url === expense.receipt_url)
          ) {
            return items;
          }

          items.push({
            url: expense.receipt_url,
            category: expense.category || "Uncategorized",
          });
          return items;
        },
        [],
      ),
    [employeePendingExpenses],
  );
  const currentPreviewItem =
    receiptPreviewItems.find((item) => item.url === currentPreviewUrl) || null;
  const groupReceiptUrls = useMemo(
    () =>
      Array.from(
        new Set(
          employeePendingExpenses
            .map((expense) => expense.receipt_url)
            .filter(Boolean),
        ),
      ) as string[],
    [employeePendingExpenses],
  );
  const activeDecisionExpenseIds = useMemo(() => {
    if (processingExpenseIds.length > 0) {
      return processingExpenseIds;
    }

    if (decisionExpenseIds.length > 0) {
      return decisionExpenseIds;
    }

    if (selectedGroup?.expenses?.length) {
      return selectedGroup.expenses.map((expense) => expense.id);
    }

    if (selectedExpense?.id) {
      return [selectedExpense.id];
    }

    return [];
  }, [
    decisionExpenseIds,
    processingExpenseIds,
    selectedExpense,
    selectedGroup,
  ]);
  const isGroupProcessing = (group: PendingExpenseGroup) =>
    isSubmittingDecision &&
    group.expenses.some((expense) =>
      activeDecisionExpenseIds.includes(expense.id),
    );
  const currentDecision = processingDecision || decision;
  const activeDecisionLabel =
    currentDecision === "approved"
      ? "Approving expense..."
      : "Rejecting expense...";

  const openReceiptGallery = (urls: string[], index = 0) => {
    if (!urls.length) return;
    setReceiptGallery({
      open: true,
      urls,
      index: Math.max(0, Math.min(index, urls.length - 1)),
    });
  };

  const handleViewDetails = (expense: ExpenseApproval) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const resolveTargetExpenses = (expense: ExpenseApproval) => {
    const matchedGroup =
      groupedPending.find((group) =>
        group.expenses.some((item) => item.id === expense.id),
      ) || null;
    return matchedGroup?.expenses?.length ? matchedGroup.expenses : [expense];
  };

  const handleBulkDecisionClick = (nextDecision: "approved" | "rejected") => {
    if (selectedPendingExpenses.length === 0) {
      showToast.error("Please select at least one expense");
      return;
    }

    setSelectedExpense(null);
    setDecisionExpenseIds(selectedPendingExpenses.map((expense) => expense.id));
    setDecision(nextDecision);
    setIsDecisionOpen(true);
  };

  const handleExportSingle = async (expense: ExpenseApproval) => {
    try {
      exportExpensesToExcel(
        [expense],
        `expense-${expense.employeeName}-${expense.id}.xlsx`,
      );
    } catch (error) {
      showToast.error("Failed to export expense Excel");
    }
  };

  const handleExportSelected = async () => {
    const expensesToExport = filteredPendingExpenses.filter((e) =>
      selectedExpenses.includes(e.id),
    );
    if (expensesToExport.length === 0) {
      showToast.error("Please select at least one expense to export");
      return;
    }

    try {
      exportExpensesToExcel(
        expensesToExport,
        `pending-expenses-selected-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      showToast.error("Failed to export selected expenses Excel");
    }
  };

  const handleExportAll = async () => {
    if (filteredPendingExpenses.length === 0) {
      showToast.error("No pending expenses to export");
      return;
    }

    try {
      exportExpensesToExcel(
        filteredPendingExpenses,
        `pending-expenses-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      showToast.error("Failed to export all expenses Excel");
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId],
    );
  };

  const isGroupSelected = (ids: string[]) => {
    if (ids.length === 0) return false;
    return ids.every((id) => selectedExpenses.includes(id));
  };

  const toggleGroupSelection = (ids: string[]) => {
    setSelectedExpenses((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const handleSelectAll = () => {
    const filteredIds = filteredPendingExpenses.map((e) => e.id);
    const allFilteredSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedExpenses.includes(id));

    if (allFilteredSelected) {
      setSelectedExpenses((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    } else {
      setSelectedExpenses((prev) =>
        Array.from(new Set([...prev, ...filteredIds])),
      );
    }
  };

  const normalizeExpenses = (items: any[]): ExpenseApproval[] =>
    items.map((e: any) => ({
      ...e,
      date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : "N/A",
      createdAt: e.createdAt || e.created_at || e.createdAt,
      employeeName: e.employeeName || "Unknown Employee",
    }));

  const submitDecision = async (
    targetExpenses: ExpenseApproval[],
    nextDecision: "approved" | "rejected",
    note?: string | null,
  ) => {
    if (targetExpenses.length === 0) {
      showToast.error("No expenses selected for this action");
      return;
    }

    const payload = {
      status: nextDecision === "approved" ? "Approved" : "Rejected",
      approval_note: note || null,
      approved_by: user?.name || "Finance User", // optional
    };

    const startedAt = Date.now();
    setIsSubmittingDecision(true);
    setProcessingExpenseIds(targetExpenses.map((expense) => expense.id));
    setProcessingDecision(nextDecision);

    try {
      const results = await Promise.all(
        targetExpenses.map((expense) =>
          expenseApi.updateExpense(expense.id, payload),
        ),
      );
      const failedResult = results.find((result) => !result.data);

      if (!failedResult) {
        const updatedStatus =
          nextDecision === "approved" ? "approved" : "rejected";
        const targetExpenseIds = targetExpenses.map((expense) => expense.id);
        const approvedBy = user?.name || "Finance User";

        setExpenses((prev) =>
          prev.map((expense) =>
            targetExpenseIds.includes(expense.id)
              ? {
                  ...expense,
                  status: updatedStatus,
                  approvedBy,
                  approvalNote: note || expense.approvalNote,
                  approved_at: new Date().toISOString(),
                }
              : expense,
          ),
        );
        setSelectedExpenses((prev) =>
          prev.filter((expenseId) => !targetExpenseIds.includes(expenseId)),
        );

        const notificationService = NotificationTriggerService.getInstance();
        const totalGroupedAmount = targetExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
        const categorySummary =
          decisionExpenseIds.length > 0
            ? Array.from(
                new Set(
                  targetExpenses
                    .map((expense) => expense.category)
                    .filter(Boolean),
                ),
              ).join(", ")
            : selectedGroup?.categories?.length
              ? selectedGroup.categories.join(", ")
              : selectedExpense?.category || "Expense";
        const descriptionSummary =
          decisionExpenseIds.length > 0
            ? `${targetExpenses.length} selected expense claims`
            : targetExpenses.length > 1
              ? `${targetExpenses[0]?.clientName || "No client"} on ${targetExpenses[0]?.date || "N/A"}`
              : targetExpenses[0]?.description || "Expense claim";

        try {
          if (nextDecision === "approved") {
            await notificationService.triggerExpenseApproved({
              employeeId: targetExpenses[0]?.employeeId,
              employeeName:
                targetExpenses[0]?.employeeName ||
                `Multiple employees (${targetExpenses.length})`,
              amount: totalGroupedAmount,
              expenseType: categorySummary,
              description: descriptionSummary,
            });
          } else {
            await notificationService.triggerExpenseRejected({
              employeeId: targetExpenses[0]?.employeeId,
              employeeName:
                targetExpenses[0]?.employeeName ||
                `Multiple employees (${targetExpenses.length})`,
              amount: totalGroupedAmount,
              expenseType: categorySummary,
              description: descriptionSummary,
            });
          }
        } catch (notificationError) {
          console.error("Expense notification failed:", notificationError);
        }

        expenseApi
          .getExpense()
          .then((fetchResult) => {
            if (fetchResult.data) {
              setExpenses(
                normalizeExpenses(fetchResult.data as ExpenseApproval[]),
              );
            }
          })
          .catch((refreshError) => {
            console.error(
              "Failed to refresh expense approvals after update:",
              refreshError,
            );
          });

        showToast.success(
          targetExpenses.length > 1
            ? `Expenses ${nextDecision} successfully!`
            : `Expense ${nextDecision} successfully!`,
        );

        setIsDecisionOpen(false);
        setApprovalNote("");
        setSelectedExpense(null);
        setDecisionExpenseIds([]);
        setDecision(null);
      } else {
        showToast.error(
          failedResult.error || "Failed to update expense status",
        );
      }
    } catch (err) {
      console.error(err);
      showToast.error("Something went wrong while updating expense.");
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_DECISION_LOADING_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DECISION_LOADING_MS - elapsed),
        );
      }
      setProcessingExpenseIds([]);
      setProcessingDecision(null);
      setIsSubmittingDecision(false);
    }
  };

  const handleApproveClick = async (expense: ExpenseApproval) => {
    if (isSubmittingDecision) return;
    const targetExpenses = resolveTargetExpenses(expense);
    await submitDecision(targetExpenses, "approved", null);
  };

  const handleRejectClick = async (expense: ExpenseApproval) => {
    if (isSubmittingDecision) return;
    const targetExpenses = resolveTargetExpenses(expense);
    await submitDecision(targetExpenses, "rejected", null);
  };

  const confirmDecision = async () => {
    if (!decision || isSubmittingDecision) return;

    const targetExpenses =
      decisionExpenseIds.length > 0
        ? pendingExpenses.filter((expense) =>
            decisionExpenseIds.includes(expense.id),
          )
        : selectedGroup?.expenses?.length
          ? selectedGroup.expenses
          : selectedExpense
            ? [selectedExpense]
            : [];

    await submitDecision(targetExpenses, decision, approvalNote || null);
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await expenseApi.getExpense();

        // console.log("Final pending expenses from API helper:", result);

        if (result.error) {
          throw new Error(result.error);
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Expenses data is invalid");
        }

        setExpenses(normalizeExpenses(result.data));
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load expenses",
        );
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  useEffect(() => {
    const filteredIds = new Set(
      filteredPendingExpenses.map((expense) => expense.id),
    );
    setSelectedExpenses((prev) => {
      const next = prev.filter((id) => filteredIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredPendingExpenses]);

  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {isSubmittingDecision && (
          <div className="sticky top-4 z-40 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{activeDecisionLabel} Please wait.</span>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Expense Approvals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Review and approve pending expense claims
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pending Approvals
              </div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-amber-600">
                {pendingExpenses.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Amount
              </div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-blue-600">
                ₹{totalPending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Approved This Month
              </div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                ₹
                {expenses
                  .filter((e) => e.status === "approved")
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Expenses Table */}
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-[#17c491]/10 via-white to-white pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Pending Expense Claims
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Claims awaiting approval from Finance team • Showing{" "}
                  {filteredPendingExpenses.length} of {pendingExpenses.length} •
                  Total ₹{totalPending.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkDecisionClick("approved")}
                  disabled={
                    selectedExpenses.length === 0 || isSubmittingDecision
                  }
                  className="text-xs bg-green-600 hover:bg-green-700"
                >
                  {isSubmittingDecision && currentDecision === "approved" ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  {isSubmittingDecision && currentDecision === "approved"
                    ? "Approving..."
                    : `Approve Selected (${selectedExpenses.length})`}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkDecisionClick("rejected")}
                  disabled={
                    selectedExpenses.length === 0 || isSubmittingDecision
                  }
                  className="text-xs"
                >
                  {isSubmittingDecision && currentDecision === "rejected" ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-1" />
                  )}
                  {isSubmittingDecision && currentDecision === "rejected"
                    ? "Rejecting..."
                    : `Reject Selected (${selectedExpenses.length})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  disabled={filteredPendingExpenses.length === 0}
                  className="text-xs"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Export All (Excel)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={selectedExpenses.length === 0}
                  className="text-xs"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export Selected (Excel) ({selectedExpenses.length})
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Employee
                </Label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={employeeFilter}
                    onChange={(event) => setEmployeeFilter(event.target.value)}
                    placeholder="Search employee"
                    className="h-9 pl-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={fromDateFilter}
                  max={toDateFilter || undefined}
                  onChange={(event) => setFromDateFilter(event.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={toDateFilter}
                  min={fromDateFilter || undefined}
                  onChange={(event) => setToDateFilter(event.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Client
                </Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clientOptions.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmployeeFilter("");
                    setFromDateFilter("");
                    setToDateFilter("");
                    setClientFilter("all");
                  }}
                  disabled={!hasActiveFilters}
                  className="h-9 w-full text-xs lg:w-auto"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingExpenses.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No pending expenses to review
                </p>
              </div>
            ) : filteredPendingExpenses.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No pending expenses match the selected filters
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="space-y-3 p-3 md:hidden">
                  {groupedPending.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <Checkbox
                          checked={isGroupSelected(
                            group.expenses.map((e) => e.id),
                          )}
                          onCheckedChange={() =>
                            toggleGroupSelection(
                              group.expenses.map((e) => e.id),
                            )
                          }
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-slate-950">
                            {group.employeeName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {group.clientName}
                          </p>
                          <p className="text-xs text-slate-500">{group.date}</p>
                          <p className="text-xs text-slate-500">
                            Submitted {group.submittedAt}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-sm font-bold text-blue-600">
                          ₹{group.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Claims
                          </span>
                          <span className="mt-1 block font-bold text-slate-950">
                            {group.count}
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Categories
                          </span>
                          <span className="mt-1 block font-semibold text-slate-900">
                            {group.categories.length === 1
                              ? group.categories[0]
                              : `${group.categories.length} categories`}
                          </span>
                        </div>
                        <div className="col-span-2 rounded-lg bg-[#17c491]/5 px-3 py-2">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#0b6f53]">
                            Description
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-slate-900">
                            {group.primaryExpense?.description || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <button
                          onClick={() =>
                            handleViewDetails(group.primaryExpense)
                          }
                          disabled={isSubmittingDecision}
                          className="flex-1 rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() =>
                            handleApproveClick(group.primaryExpense)
                          }
                          disabled={isSubmittingDecision}
                          className="flex-1 rounded-lg border border-emerald-100 p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Approve"
                        >
                          {isGroupProcessing(group) &&
                          currentDecision === "approved" ? (
                            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mx-auto" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleRejectClick(group.primaryExpense)
                          }
                          disabled={isSubmittingDecision}
                          className="flex-1 rounded-lg border border-red-100 p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Reject"
                        >
                          {isGroupProcessing(group) &&
                          currentDecision === "rejected" ? (
                            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mx-auto" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleExportSingle(group.primaryExpense)
                          }
                          disabled={isSubmittingDecision}
                          className="flex-1 rounded-lg border border-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full min-w-[760px] table-fixed text-sm">
                    <colgroup>
                      <col className="w-[4%]" />
                      <col className="w-[17%]" />
                      <col className="w-[18%]" />
                      <col className="w-[17%]" />
                      <col className="w-[9%]" />
                      <col className="w-[9%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-3 text-left font-bold">
                          <Checkbox
                            checked={
                              filteredPendingExpenses.length > 0 &&
                              filteredPendingExpenses.every((expense) =>
                                selectedExpenses.includes(expense.id),
                              )
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-3 py-3 text-left font-bold">
                          Employee
                        </th>
                        <th className="px-3 py-3 text-left font-bold">
                          Assigned Client
                        </th>
                        <th className="px-3 py-3 text-left font-bold">
                          Date / Categories
                        </th>
                        <th className="px-3 py-3 text-right font-bold">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-left font-bold">
                          Claims
                        </th>
                        <th className="px-3 py-3 text-left font-bold">
                          Description
                        </th>
                        <th className="border-l border-slate-200 px-3 py-3 text-center font-bold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedPending.map((group) => (
                        <tr key={group.id} className="bg-white">
                          <td className="px-3 py-4 align-middle">
                            <Checkbox
                              checked={isGroupSelected(
                                group.expenses.map((e) => e.id),
                              )}
                              onCheckedChange={() =>
                                toggleGroupSelection(
                                  group.expenses.map((e) => e.id),
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#17c491]/10 text-sm font-bold text-[#0b6f53]">
                                {group.employeeName
                                  ?.split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase() || "EX"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="whitespace-normal break-words font-bold leading-snug text-slate-950">
                                  {group.employeeName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {group.count} pending claims
                                </p>
                                <p className="text-xs text-slate-500">
                                  Submitted {group.submittedAt}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <p className="whitespace-normal break-words font-semibold leading-snug text-slate-900">
                              {group.clientName || "No client"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {group.clientName &&
                              group.clientName !== "No client"
                                ? "Assigned client"
                                : "General expense"}
                            </p>
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <p className="font-semibold text-slate-900">
                              {group.date}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                              Submitted {group.submittedAt}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {group.categories.map((category) => (
                                <span
                                  key={category}
                                  className="whitespace-nowrap rounded-full border border-[#17c491]/20 bg-[#17c491]/10 px-2 py-1 text-xs font-semibold text-[#0b6f53]"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right align-middle">
                            <p className="whitespace-nowrap text-base font-bold text-blue-600">
                              ₹{group.totalAmount.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <span className="inline-flex min-w-[76px] items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                              {group.count} claims
                            </span>
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <p className="line-clamp-2 max-w-[160px] whitespace-normal break-words text-[11px] leading-relaxed text-slate-700">
                              {group.primaryExpense?.description || "-"}
                            </p>
                          </td>
                          <td className="border-l border-slate-100 bg-white px-3 py-4 align-middle">
                            <div className="flex justify-center gap-1 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  handleViewDetails(group.primaryExpense)
                                }
                                disabled={isSubmittingDecision}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-700 transition-colors hover:bg-slate-50"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveClick(group.primaryExpense)
                                }
                                disabled={isSubmittingDecision}
                                className="rounded-lg border border-emerald-100 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                                title="Approve"
                              >
                                {isGroupProcessing(group) &&
                                currentDecision === "approved" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectClick(group.primaryExpense)
                                }
                                disabled={isSubmittingDecision}
                                className="rounded-lg border border-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                title="Reject"
                              >
                                {isGroupProcessing(group) &&
                                currentDecision === "rejected" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleExportSingle(group.primaryExpense)
                                }
                                disabled={isSubmittingDecision}
                                className="rounded-lg border border-blue-100 p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Export PDF"
                              >
                                <Download className="h-4 w-4" />
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

        {/* Recent Actions */}
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
            <CardTitle className="text-lg font-bold text-slate-950">
              Approval History
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Latest approved and rejected expense decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {expenses.filter((e) => e.status !== "pending").length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No approval history yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Approved and rejected claims will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses
                  .filter((e) => e.status !== "pending")
                  .slice(0, 5)
                  .map((expense) => {
                    const isApproved =
                      String(expense.status).toLowerCase() === "approved";
                    return (
                      <div
                        key={expense.id}
                        className="flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-[#17c491]/5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {isApproved ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-slate-950">
                              {expense.employeeName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ₹{Number(expense.amount || 0).toLocaleString()} •{" "}
                              {expense.category || "Expense"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span
                            className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {expense.status}
                          </span>
                          {expense.approvedBy && (
                            <span className="text-xs font-medium text-slate-500">
                              by {expense.approvedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader>
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#17c491]/10 via-white to-white px-6 py-5">
              <DialogTitle className="text-xl font-bold text-slate-950">
                Expense Details
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-600">
                Review grouped claims, bills and pending amount before approval
              </p>
            </div>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-5 px-6 pb-6 pt-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-slate-950">
                    {selectedExpense.employeeName || "Unknown Employee"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-slate-950">
                    {selectedGroup?.clientName ||
                      selectedExpense.clientName ||
                      "No client"}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    Amount
                  </p>
                  <p className="mt-1 whitespace-nowrap text-lg font-bold text-blue-700">
                    ₹{employeeTotal.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {selectedGroup?.date || selectedExpense.date}
                  </p>
                </div>
                <div className="rounded-lg border border-[#17c491]/20 bg-[#17c491]/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0b6f53]">
                    Submitted Time
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {selectedGroup?.submittedAt ||
                      formatSubmitTimestamp(selectedExpense.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[#17c491]/20 bg-[#17c491]/5 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0b6f53]">
                      Pending total for this client and date
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {employeePendingExpenses.length} pending claims in this
                      client/date group
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xl font-bold text-[#0b6f53]">
                    ₹{employeeTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      Pending claims for this client and date
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Bill preview and grouped claim summary
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        exportExpensesToExcel(
                          employeePendingExpenses,
                          `employee-expenses-${selectedExpense?.employeeName || "employee"}-${new Date().toISOString().split("T")[0]}.xlsx`,
                        );
                      } catch {
                        showToast.error(
                          "Failed to export employee expenses Excel",
                        );
                      }
                    }}
                    disabled={employeePendingExpenses.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export All (Excel)
                  </Button>
                </div>
                {employeePendingExpenses.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    No pending claims found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold text-slate-950">
                          {selectedGroup?.clientName ||
                            selectedExpense.clientName ||
                            "No client"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedGroup?.date || selectedExpense.date}
                          {selectedGroup?.categories?.length
                            ? ` • ${selectedGroup.categories.join(", ")}`
                            : ""}
                          {employeePendingExpenses.length > 1
                            ? ` • ${employeePendingExpenses.length} expenses`
                            : ` • ${employeePendingExpenses.length} expense`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        {groupReceiptUrls.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              openReceiptGallery(groupReceiptUrls, 0)
                            }
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100"
                            title="Preview Bills"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <p className="whitespace-nowrap text-base font-bold text-blue-600">
                          ₹{employeeTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={receiptGallery.open}
        onOpenChange={(open) => {
          if (!open) {
            setReceiptGallery({ open: false, urls: [], index: 0 });
          }
        }}
      >
        <DialogContent className="w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] flex flex-col p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Bill Preview
            </DialogTitle>
          </DialogHeader>

          {currentPreviewUrl && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden min-h-0">
              <div className="flex flex-col gap-3 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {receiptGallery.index + 1} of {previewUrls.length}
                  </p>
                  <p className="text-sm font-medium">
                    Category: {currentPreviewItem?.category || "Uncategorized"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReceiptGallery((prev) => ({
                        ...prev,
                        index:
                          prev.index > 0
                            ? prev.index - 1
                            : prev.urls.length - 1,
                      }))
                    }
                    disabled={previewUrls.length <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReceiptGallery((prev) => ({
                        ...prev,
                        index:
                          prev.index < prev.urls.length - 1
                            ? prev.index + 1
                            : 0,
                      }))
                    }
                    disabled={previewUrls.length <= 1}
                  >
                    Next
                  </Button>
                  {currentPreviewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = currentPreviewUrl;
                        link.download = `receipt-${receiptGallery.index + 1}${isPreviewPdf ? ".pdf" : ".jpg"}`;
                        link.target = "_blank";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg border bg-slate-100 min-h-0">
                  {isPreviewPdf ? (
                    <iframe
                      src={currentPreviewUrl}
                      title="Expense Receipt Preview"
                      className="h-full w-full border-0"
                    />
                  ) : (
                    <img
                      src={currentPreviewUrl}
                      alt="Expense Receipt Preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                        target.alt = "Document preview not available";
                      }}
                    />
                  )}
                </div>
                {previewUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-shrink-0 mt-3">
                    {previewUrls.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() =>
                          setReceiptGallery((prev) => ({ ...prev, index }))
                        }
                        className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-md border ${
                          index === receiptGallery.index
                            ? "border-blue-500 ring-1 ring-blue-500"
                            : "border-border"
                        }`}
                      >
                        {url.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                          <img
                            src={url}
                            alt={`Receipt ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-muted-foreground">
                            PDF {index + 1}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() =>
                setReceiptGallery({ open: false, urls: [], index: 0 })
              }
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Decision Dialog */}
      <AlertDialog
        open={isDecisionOpen}
        onOpenChange={(open) => {
          if (isSubmittingDecision) {
            return;
          }
          setIsDecisionOpen(open);
          if (!open) {
            setDecision(null);
            setDecisionExpenseIds([]);
            setApprovalNote("");
            setSelectedExpense(null);
          }
        }}
      >
        <AlertDialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              {decision === "approved" ? "Approve Expense" : "Reject Expense"}
            </AlertDialogTitle>
            {decisionExpenseIds.length > 0 ? (
              <AlertDialogDescription className="text-xs sm:text-sm">
                {selectedPendingExpenses.length} selected expenses • ₹
                {selectedPendingTotal.toLocaleString()}
              </AlertDialogDescription>
            ) : selectedExpense ? (
              <AlertDialogDescription className="text-xs sm:text-sm">
                {selectedExpense.employeeName} - ₹
                {employeeTotal.toLocaleString()}
                {selectedGroup
                  ? ` • ${selectedGroup.clientName} • ${selectedGroup.date}`
                  : ""}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {isSubmittingDecision && (
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs sm:text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                {decision === "approved"
                  ? "Approval in progress. Please wait..."
                  : "Rejection in progress. Please wait..."}
              </div>
            )}
            <div>
              <Label className="text-xs sm:text-sm">
                Approval Note (Optional)
              </Label>
              <Textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add any notes for the employee..."
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
                disabled={isSubmittingDecision}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <AlertDialogCancel
              className="w-full sm:w-auto text-xs sm:text-sm"
              disabled={isSubmittingDecision}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDecision}
              disabled={isSubmittingDecision}
              className={`w-full sm:w-auto text-xs sm:text-sm ${
                decision === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmittingDecision ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {decision === "approved" ? "Approving..." : "Rejecting..."}
                </>
              ) : decision === "approved" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
const exportExpensesToExcel = (items: ExpenseApproval[], fileName: string) => {
  const rows = items.map((expense) => ({
    Employee: expense.employeeName,
    "Assigned Client": expense.clientName || "",
    Category: expense.category,
    Amount: expense.amount,
    Date: expense.date,
    Description: expense.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
  XLSX.writeFile(workbook, fileName);
};
