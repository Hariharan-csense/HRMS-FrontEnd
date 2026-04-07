import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Eye, Download, FileText } from "lucide-react";
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
  status: "pending" | "approved" | "rejected" | "Pending" | "Approved" | "Rejected";
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
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseApproval[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [receiptGallery, setReceiptGallery] = useState<ReceiptGalleryState>({
    open: false,
    urls: [],
    index: 0,
  });
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApproval | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  const groupedPending = useMemo(() => {
    const byClientDate = new Map<string, PendingExpenseGroup>();

    pendingExpenses.forEach((expense) => {
      const employeeKey = expense.employeeId || expense.employeeName || expense.id;
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
        categories: Array.from(new Set(orderedExpenses.map((e) => e.category).filter(Boolean))),
        totalAmount: orderedExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: orderedExpenses.length,
        primaryExpense: orderedExpenses[0],
      };
    });
  }, [pendingExpenses]);
  const selectedGroup = useMemo(
    () =>
      selectedExpense
        ? groupedPending.find((group) => group.expenses.some((expense) => expense.id === selectedExpense.id)) || null
        : null,
    [groupedPending, selectedExpense]
  );
  const employeePendingExpenses = useMemo(() => selectedGroup?.expenses || [], [selectedGroup]);
  const employeeTotal = useMemo(
    () => employeePendingExpenses.reduce((sum, e) => sum + e.amount, 0),
    [employeePendingExpenses]
  );
  const previewUrls = receiptGallery.urls;
  const currentPreviewUrl = previewUrls[receiptGallery.index] || null;
  const isPreviewPdf = currentPreviewUrl?.toLowerCase().includes(".pdf");
  const receiptPreviewItems = useMemo(
    () =>
      employeePendingExpenses.reduce<Array<{ url: string; category: string }>>((items, expense) => {
        if (!expense.receipt_url || items.some((item) => item.url === expense.receipt_url)) {
          return items;
        }

        items.push({
          url: expense.receipt_url,
          category: expense.category || "Uncategorized",
        });
        return items;
      }, []),
    [employeePendingExpenses]
  );
  const currentPreviewItem =
    receiptPreviewItems.find((item) => item.url === currentPreviewUrl) || null;
  const groupReceiptUrls = useMemo(
    () => Array.from(new Set(employeePendingExpenses.map((expense) => expense.receipt_url).filter(Boolean))) as string[],
    [employeePendingExpenses]
  );

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

  const handleApproveClick = (expense: ExpenseApproval) => {
    setSelectedExpense(expense);
    setDecision("approved");
    setIsDecisionOpen(true);
  };

  const handleRejectClick = (expense: ExpenseApproval) => {
    setSelectedExpense(expense);
    setDecision("rejected");
    setIsDecisionOpen(true);
  };

  const handleExportSingle = async (expense: ExpenseApproval) => {
    try {
      exportExpensesToExcel([expense], `expense-${expense.employeeName}-${expense.id}.xlsx`);
    } catch (error) {
      showToast.error('Failed to export expense Excel');
    }
  };

  const handleExportSelected = async () => {
    const expensesToExport = pendingExpenses.filter(e => selectedExpenses.includes(e.id));
    if (expensesToExport.length === 0) {
      showToast.error('Please select at least one expense to export');
      return;
    }
    
    try {
      exportExpensesToExcel(
        expensesToExport,
        `pending-expenses-selected-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      showToast.error('Failed to export selected expenses Excel');
    }
  };

  const handleExportAll = async () => {
    if (pendingExpenses.length === 0) {
      showToast.error('No pending expenses to export');
      return;
    }
    
    try {
      exportExpensesToExcel(
        pendingExpenses,
        `pending-expenses-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      showToast.error('Failed to export all expenses Excel');
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
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
    if (selectedExpenses.length === pendingExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(pendingExpenses.map(e => e.id));
    }
  };

  const normalizeExpenses = (items: ExpenseApproval[]) =>
    items.map((e) => ({
      ...e,
      date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : "N/A",
      employeeName: e.employeeName || "Unknown Employee",
    }));

  const confirmDecision = async () => {
    if (!selectedExpense || !decision) return;

    const targetExpenses =
      selectedGroup?.expenses?.length
        ? selectedGroup.expenses
        : [selectedExpense];

    const payload = {
      status: decision === "approved" ? "Approved" : "Rejected",
      approval_note: approvalNote || null,
      approved_by: user?.name || "Finance User", // optional
    };

    try {
      const results = await Promise.all(
        targetExpenses.map((expense) => expenseApi.updateExpense(expense.id, payload))
      );
      const failedResult = results.find((result) => !result.data);

      if (!failedResult) {
        // Trigger notification for expense approval/rejection
        const notificationService = NotificationTriggerService.getInstance();
        const totalGroupedAmount = targetExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const categorySummary = selectedGroup?.categories?.length
          ? selectedGroup.categories.join(", ")
          : selectedExpense.category;
        const descriptionSummary = selectedGroup
          ? `${selectedGroup.clientName} on ${selectedGroup.date}`
          : selectedExpense.description;

        if (decision === "approved") {
          await notificationService.triggerExpenseApproved({
            employeeId: selectedExpense.employeeId,
            employeeName: selectedExpense.employeeName,
            amount: totalGroupedAmount,
            expenseType: categorySummary,
            description: descriptionSummary,
          });
        } else {
          await notificationService.triggerExpenseRejected({
            employeeId: selectedExpense.employeeId,
            employeeName: selectedExpense.employeeName,
            amount: totalGroupedAmount,
            expenseType: categorySummary,
            description: descriptionSummary,
          });
        }

        // Refetch updated expenses (full list so pending + history stay in sync)
        const fetchResult = await expenseApi.getExpense();
        console.log("Refetched expenses after update:", fetchResult);
        if (fetchResult.data) {
          setExpenses(normalizeExpenses(fetchResult.data));
          setSelectedExpenses([]);
        }

        showToast.success(
          targetExpenses.length > 1
            ? `Expenses ${decision} successfully!`
            : `Expense ${decision} successfully!`
        );

        // Reset dialog
        setIsDecisionOpen(false);
        setApprovalNote("");
        setSelectedExpense(null);
        setDecision(null);
      } else {
        showToast.error(failedResult.error || "Failed to update expense status");
      }
    } catch (err) {
      console.error(err);
      showToast.error("Something went wrong while updating expense.");
    }
  };


  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await expenseApi.getExpense();

        console.log("Final pending expenses from API helper:", result);

        if (result.error) {
          throw new Error(result.error);
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Expenses data is invalid");
        }

        setExpenses(normalizeExpenses(result.data));
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setError(error instanceof Error ? error.message : "Failed to load expenses");
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);


  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Expense Approvals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Review and approve pending expense claims</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Approvals</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-amber-600">{pendingExpenses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Amount</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-blue-600">₹{totalPending.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Approved This Month</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                ₹{expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Expenses Table */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Pending Expense Claims</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Claims awaiting approval from Finance team • Total ₹{totalPending.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  disabled={pendingExpenses.length === 0}
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
          </CardHeader>
          <CardContent>
            {pendingExpenses.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">No pending expenses to review</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
                  {groupedPending.map((group) => (
                    <div key={group.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start gap-2 mb-2 sm:mb-3">
                        <Checkbox
                          checked={isGroupSelected(group.expenses.map((e) => e.id))}
                          onCheckedChange={() => toggleGroupSelection(group.expenses.map((e) => e.id))}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">{group.employeeName}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{group.clientName}</p>
                          <p className="text-xs text-muted-foreground">{group.date}</p>
                        </div>
                        <span className="text-sm sm:text-base font-bold text-blue-600 flex-shrink-0">₹{group.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Claims:</span>
                          <span className="text-right">{group.count}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Categories:</span>
                          <span className="text-right flex-1">
                            {group.categories.length === 1
                              ? group.categories[0]
                              : `${group.categories.length} categories`}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 sm:pt-3 border-t border-border flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(group.primaryExpense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleApproveClick(group.primaryExpense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleRejectClick(group.primaryExpense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleExportSingle(group.primaryExpense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold">
                          <Checkbox
                            checked={selectedExpenses.length === pendingExpenses.length && pendingExpenses.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">Employee</th>
                        <th className="text-left px-4 py-3 font-semibold">Assigned Client</th>
                        <th className="text-left px-4 py-3 font-semibold">Date / Categories</th>
                        <th className="text-left px-4 py-3 font-semibold">Amount</th>
                        <th className="text-left px-4 py-3 font-semibold">Claims</th>
                        <th className="text-left px-4 py-3 font-semibold">Description</th>
                        <th className="text-left px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPending.map((group) => (
                        <tr key={group.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isGroupSelected(group.expenses.map((e) => e.id))}
                              onCheckedChange={() => toggleGroupSelection(group.expenses.map((e) => e.id))}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{group.employeeName}</td>
                          <td className="px-4 py-3">{group.clientName}</td>
                          <td className="px-4 py-3">
                            <div>{group.date}</div>
                            <div className="text-xs text-muted-foreground">
                              {group.categories.length === 1
                                ? group.categories[0]
                                : `${group.categories.length} categories`}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600">₹{group.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs">{group.count} claims</td>
                          <td className="px-4 py-3 text-xs">{group.primaryExpense?.description || "-"}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(group.primaryExpense)}
                                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproveClick(group.primaryExpense)}
                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(group.primaryExpense)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportSingle(group.primaryExpense)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                title="Export PDF"
                              >
                                <Download className="w-4 h-4" />
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
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {expenses
                .filter((e) => e.status !== "pending")
                .slice(0, 5)
                .map((expense) => (
                  <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-xs sm:text-sm">{expense.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{expense.amount} - {expense.category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium whitespace-nowrap ${expense.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {expense.status}
                      </span>
                      {expense.approvedBy && (
                        <p className="text-xs text-muted-foreground text-right">{expense.approvedBy}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Expense Details</DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6 py-2">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee</p>
                    <p className="font-medium">{selectedExpense.employeeName || "Unknown Employee"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedGroup?.clientName || selectedExpense.clientName || "No client"}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-blue-600">₹{employeeTotal.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedGroup?.date || selectedExpense.date}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                  <p className="text-sm font-medium">
                    {selectedGroup?.clientName || selectedExpense.clientName || "No client"}
                  </p>
                </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Pending Total For Client On Date</p>
                    <p className="font-semibold text-blue-700">₹{employeeTotal.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {employeePendingExpenses.length} pending claims in this client/date group
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Pending Claims For This Client And Date</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          exportExpensesToExcel(
                            employeePendingExpenses,
                            `employee-expenses-${selectedExpense?.employeeName || "employee"}-${new Date().toISOString().split("T")[0]}.xlsx`
                          );
                        } catch {
                          showToast.error('Failed to export employee expenses Excel');
                        }
                      }}
                      disabled={employeePendingExpenses.length === 0}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export All (Excel)
                    </Button>
                  </div>
                  {employeePendingExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending claims found.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{selectedGroup?.clientName || selectedExpense.clientName || "No client"}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedGroup?.date || selectedExpense.date}
                            {selectedGroup?.categories?.length
                              ? ` • ${selectedGroup.categories.join(", ")}`
                              : ""}
                            {employeePendingExpenses.length > 1
                              ? ` • ${employeePendingExpenses.length} expenses`
                              : ` • ${employeePendingExpenses.length} expense`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {groupReceiptUrls.length > 0 && (
                            <button
                              type="button"
                              onClick={() => openReceiptGallery(groupReceiptUrls, 0)}
                              className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              title="Preview Bills"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <p className="font-semibold text-blue-600">₹{employeeTotal.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
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
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Bill Preview</DialogTitle>
          </DialogHeader>

          {currentPreviewUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {receiptGallery.index + 1} of {previewUrls.length}
                  </p>
                  <p className="text-sm font-medium">
                    Category: {currentPreviewItem?.category || "Uncategorized"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReceiptGallery((prev) => ({
                        ...prev,
                        index: prev.index > 0 ? prev.index - 1 : prev.urls.length - 1,
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
                        index: prev.index < prev.urls.length - 1 ? prev.index + 1 : 0,
                      }))
                    }
                    disabled={previewUrls.length <= 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-lg border bg-slate-100">
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
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewUrls.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setReceiptGallery((prev) => ({ ...prev, index }))}
                      className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-md border ${
                        index === receiptGallery.index ? "border-blue-500 ring-1 ring-blue-500" : "border-border"
                      }`}
                    >
                      {url.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                        <img src={url} alt={`Receipt ${index + 1}`} className="h-full w-full object-cover" />
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
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setReceiptGallery({ open: false, urls: [], index: 0 })}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Approval Decision Dialog */}
      <AlertDialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <AlertDialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              {decision === "approved" ? "Approve Expense" : "Reject Expense"}
            </AlertDialogTitle>
            {selectedExpense && (
              <AlertDialogDescription className="text-xs sm:text-sm">
                {selectedExpense.employeeName} - ₹{employeeTotal.toLocaleString()}
                {selectedGroup ? ` • ${selectedGroup.clientName} • ${selectedGroup.date}` : ""}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Approval Note (Optional)</Label>
              <Textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add any notes for the employee..."
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDecision}
              className={`w-full sm:w-auto text-xs sm:text-sm ${decision === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {decision === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
  const exportExpensesToExcel = (items: ExpenseApproval[], fileName: string) => {
    const rows = items.map((expense) => ({
      "Employee": expense.employeeName,
      "Assigned Client": expense.clientName || "",
      "Category": expense.category,
      "Amount": expense.amount,
      "Date": expense.date,
      "Description": expense.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, fileName);
  };
