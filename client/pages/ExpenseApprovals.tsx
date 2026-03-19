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



export default function ExpenseApprovals() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseApproval[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApproval | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const pendingExpenses = expenses.filter((e) => e.status === "pending");
  const groupedPending = useMemo(() => {
    const byEmployee = new Map<
      string,
      { employeeId: string; employeeName: string; expenses: ExpenseApproval[] }
    >();

    pendingExpenses.forEach((expense) => {
      const key = expense.employeeId || expense.employeeName || expense.id;
      const existing = byEmployee.get(key);
      if (existing) {
        existing.expenses.push(expense);
      } else {
        byEmployee.set(key, {
          employeeId: expense.employeeId,
          employeeName: expense.employeeName || "Unknown Employee",
          expenses: [expense],
        });
      }
    });

    return Array.from(byEmployee.values()).map((group) => {
      const totalAmount = group.expenses.reduce((sum, e) => sum + e.amount, 0);
      const categories = Array.from(
        new Set(group.expenses.map((e) => e.category).filter(Boolean))
      );
      const clients = Array.from(
        new Set(group.expenses.map((e) => e.clientName).filter(Boolean))
      );
      return {
        ...group,
        totalAmount,
        categories,
        clients,
        count: group.expenses.length,
        primaryExpense: group.expenses[0],
      };
    });
  }, [pendingExpenses]);
  const employeeExpenses = useMemo(() => {
    if (!selectedExpense?.employeeId) return [];
    return expenses.filter((e) => e.employeeId === selectedExpense.employeeId);
  }, [expenses, selectedExpense]);
  const employeeTotal = useMemo(
    () => employeeExpenses.reduce((sum, e) => sum + e.amount, 0),
    [employeeExpenses]
  );
  const isPreviewPdf = receiptPreviewUrl?.toLowerCase().includes(".pdf");

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

    const payload = {
      status: decision === "approved" ? "Approved" : "Rejected",
      approval_note: approvalNote || null,
      approved_by: user?.name || "Finance User", // optional
    };
    console.log(selectedExpense)
    try {
      const result = await expenseApi.updateExpense(selectedExpense.id, payload); // â† use ID, not expense_id

      if (result.data) {
        // Trigger notification for expense approval/rejection
        const notificationService = NotificationTriggerService.getInstance();

        if (decision === "approved") {
          await notificationService.triggerExpenseApproved({
            employeeId: selectedExpense.employeeId,
            employeeName: selectedExpense.employeeName,
            amount: selectedExpense.amount,
            expenseType: selectedExpense.category,
            description: selectedExpense.description,
          });
        } else {
          await notificationService.triggerExpenseRejected({
            employeeId: selectedExpense.employeeId,
            employeeName: selectedExpense.employeeName,
            amount: selectedExpense.amount,
            expenseType: selectedExpense.category,
            description: selectedExpense.description,
          });
        }

        // Refetch updated expenses (full list so pending + history stay in sync)
        const fetchResult = await expenseApi.getExpense();
        console.log("Refetched expenses after update:", fetchResult);
        if (fetchResult.data) {
          setExpenses(normalizeExpenses(fetchResult.data));
          setSelectedExpenses([]);
        }

        showToast.success(`Expense ${decision} successfully!`);

        // Reset dialog
        setIsDecisionOpen(false);
        setApprovalNote("");
        setSelectedExpense(null);
        setDecision(null);
      } else {
        showToast.error(result.error || "Failed to update expense status");
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
                    <div key={group.employeeId || group.employeeName} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start gap-2 mb-2 sm:mb-3">
                        <Checkbox
                          checked={isGroupSelected(group.expenses.map((e) => e.id))}
                          onCheckedChange={() => toggleGroupSelection(group.expenses.map((e) => e.id))}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">{group.employeeName}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {group.categories.length === 1
                              ? group.categories[0]
                              : `${group.categories.length} categories`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.clients.length === 1
                              ? group.clients[0]
                              : group.clients.length > 1
                                ? `${group.clients.length} clients`
                                : "No client"}
                          </p>
                        </div>
                        <span className="text-sm sm:text-base font-bold text-blue-600 flex-shrink-0">₹{group.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Claims:</span>
                          <span className="text-right">{group.count}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Latest:</span>
                          <span className="text-right flex-1">{group.primaryExpense?.description || "-"}</span>
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
                        <th className="text-left px-4 py-3 font-semibold">Category</th>
                        <th className="text-left px-4 py-3 font-semibold">Amount</th>
                        <th className="text-left px-4 py-3 font-semibold">Claims</th>
                        <th className="text-left px-4 py-3 font-semibold">Description</th>
                        <th className="text-left px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPending.map((group) => (
                        <tr key={group.employeeId || group.employeeName} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isGroupSelected(group.expenses.map((e) => e.id))}
                              onCheckedChange={() => toggleGroupSelection(group.expenses.map((e) => e.id))}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{group.employeeName}</td>
                          <td className="px-4 py-3">
                            {group.clients.length === 1
                              ? group.clients[0]
                              : group.clients.length > 1
                                ? `${group.clients.length} clients`
                                : "No client"}
                          </td>
                          <td className="px-4 py-3">
                            {group.categories.length === 1
                              ? group.categories[0]
                              : `${group.categories.length} categories`}
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
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedExpense.category}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-blue-600">₹{employeeTotal.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedExpense.date}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedExpense.description}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Employee Total Expenses</p>
                    <p className="font-semibold text-blue-700">₹{employeeTotal.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {employeeExpenses.length} claims by this employee
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">All Employee Claims</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          exportExpensesToExcel(
                            employeeExpenses,
                            `employee-expenses-${selectedExpense?.employeeName || "employee"}-${new Date().toISOString().split("T")[0]}.xlsx`
                          );
                        } catch {
                          showToast.error('Failed to export employee expenses Excel');
                        }
                      }}
                      disabled={employeeExpenses.length === 0}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export All (Excel)
                    </Button>
                  </div>
                  {employeeExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No other claims found.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {employeeExpenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{expense.category}</p>
                            <p className="text-xs text-muted-foreground">{expense.date} • {expense.status}</p>
                          </div>
                          <p className="font-semibold text-blue-600">₹{expense.amount}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bill / Receipt</p>

                  {employeeExpenses.some((e) => e.receipt_url) ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {employeeExpenses
                          .filter((e) => e.receipt_url)
                          .map((expense) => (
                            <div key={expense.id} className="border rounded-md p-3 bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Expense</p>
                                  <p className="text-sm font-medium">{expense.category}</p>
                                </div>
                                <p className="text-sm font-semibold text-blue-600">₹{expense.amount}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReceiptPreviewUrl(expense.receipt_url || null)}
                                className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md"
                              >
                                View Document
                              </button>
                              {expense.receipt_url?.match(/\.(png|jpg|jpeg|webp)$/i) && (
                                <div className="mt-2 border rounded-md overflow-hidden">
                                  <img
                                    src={expense.receipt_url}
                                    alt="Expense Receipt"
                                    className="w-full h-auto max-h-40 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/placeholder.svg";
                                      target.alt = "Document preview not available";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No document attached</p>
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
        open={Boolean(receiptPreviewUrl)}
        onOpenChange={(open) => {
          if (!open) {
            setReceiptPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Bill Preview</DialogTitle>
          </DialogHeader>

          {receiptPreviewUrl && (
            <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-lg border bg-slate-100">
              {isPreviewPdf ? (
                <iframe
                  src={receiptPreviewUrl}
                  title="Expense Receipt Preview"
                  className="h-full w-full border-0"
                />
              ) : (
                <img
                  src={receiptPreviewUrl}
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
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setReceiptPreviewUrl(null)}>
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
                {selectedExpense.employeeName} - ₹{selectedExpense.amount}
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
