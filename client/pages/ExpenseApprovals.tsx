import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye } from "lucide-react";
import expenseApi from "@/components/helper/expense/expense";
import { useAuth } from "@/context/AuthContext";
import NotificationTriggerService from "@/services/notificationTriggerService";

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
  billUrl?: string;
  receipt_url?: string;
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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApproval | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pendingExpenses = expenses.filter((e) => e.status === "pending");

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

const confirmDecision = async () => {
  if (!selectedExpense || !decision) return;

  const payload = {
    status: decision === "approved" ? "Approved" : "Rejected",
    approval_note: approvalNote || null,
    approved_by: user?.name || "Finance User", // optional
  };
 console.log(selectedExpense)
  try {
    const result = await expenseApi.updateExpense(selectedExpense.id, payload); // ← use ID, not expense_id
    
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

      // Refetch updated expenses
      const fetchResult = await expenseApi.getExpense();
      console.log("Refetched expenses after update:", fetchResult);
      if (fetchResult.data) setExpenses(fetchResult.data);

      alert(`Expense ${decision} successfully!`);

      // Reset dialog
      setIsDecisionOpen(false);
      setApprovalNote("");
      setSelectedExpense(null);
      setDecision(null);
    } else {
      alert(result.error || "Failed to update expense status");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while updating expense.");
  }
};


useEffect(() => {
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await expenseApi.getExpense();

      console.log("Final expenses from API helper:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Expenses data is invalid");
      }

      // 🔥 DATA IS ALREADY CLEAN & MAPPED
      setExpenses(
        result.data.map((e) => ({
          ...e,
          date: e.date
            ? new Date(e.date).toLocaleDateString("en-IN")
            : "N/A",
          employeeName: e.employeeName || "Unknown Employee",
        }))
      );
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
            <CardTitle className="text-lg sm:text-xl">Pending Expense Claims</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Claims awaiting approval from Finance team</CardDescription>
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
                  {pendingExpenses.map((expense) => (
                    <div key={expense.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">{expense.employeeName}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                        <span className="text-sm sm:text-base font-bold text-blue-600 flex-shrink-0">₹{expense.amount}</span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Date:</span>
                          <span className="text-right">{expense.date}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground flex-shrink-0">Description:</span>
                          <span className="text-right flex-1">{expense.description}</span>
                        </div>
                      </div>
                      <div className="pt-2 sm:pt-3 border-t border-border flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(expense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleApproveClick(expense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleRejectClick(expense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4 mx-auto" />
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
                        <th className="text-left px-4 py-3 font-semibold">Employee</th>
                        <th className="text-left px-4 py-3 font-semibold">Category</th>
                        <th className="text-left px-4 py-3 font-semibold">Amount</th>
                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Description</th>
                        <th className="text-left px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{expense.employeeName}</td>
                          <td className="px-4 py-3">{expense.category}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">₹{expense.amount}</td>
                          <td className="px-4 py-3 text-xs">{expense.date}</td>
                          <td className="px-4 py-3 text-xs">{expense.description}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(expense)}
                                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproveClick(expense)}
                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(expense)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
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
                        className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium whitespace-nowrap ${
                          expense.status === "approved"
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
        <DialogContent className="max-w-md">
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
                    <p className="font-bold text-blue-600">₹{selectedExpense.amount}</p>
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

               <div>
  <p className="text-sm text-muted-foreground mb-2">Bill / Receipt</p>

  {selectedExpense.billUrl ? (
    <div className="space-y-2">
      {/* View Document Button */}
      <a
        href={selectedExpense.billUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md"
      >
        View Document
      </a>

      {/* Image Preview (only if image) */}
      {selectedExpense.billUrl.match(/\.(png|jpg|jpeg|webp)$/i) && (
        <div className="mt-2 border rounded-md overflow-hidden">
          <img
            src={selectedExpense.billUrl}
            alt="Expense Receipt"
            className="w-full h-auto max-h-64 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
              target.alt = "Document preview not available";
            }}
          />
        </div>
      )}
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
              className={`w-full sm:w-auto text-xs sm:text-sm ${
                decision === "approved"
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

