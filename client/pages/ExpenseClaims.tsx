import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, CreditCard, Upload, X } from "lucide-react";
import expenseApi from "@/components/helper/expense/expense";
import NotificationTriggerService from "@/services/notificationTriggerService";

interface BillFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
}

interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  approvedBy?: string;
  createdAt: string;
  billFile?: BillFile;
}

export default function ExpenseClaims() {
  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExpenseClaim>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [actionExpenseId, setActionExpenseId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [billFile, setBillFile] = useState<BillFile | null>(null);
  const [billFileType, setBillFileType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch expenses from API
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

        // Transform API data to match ExpenseClaim interface
        setExpenses(
          result.data.map((e) => ({
            id: e.id,
            employeeId: e.employeeId || "",
            employeeName: e.employeeName || "Unknown Employee",
            category: e.category || "",
            amount: e.amount || 0,
            date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
            description: e.description || "",
            status: (e.status as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
            createdAt: e.createdAt || new Date().toISOString(),
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

  // Helper function to map user ID to employee ID (e.g., "2" -> "EMP002")
  const getEmployeeIdForUser = (userId: string) => {
    return `EMP${String(parseInt(userId)).padStart(3, "0")}`;
  };

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // If user is an employee, show only their data
    if (hasRole(user, "employee")) {
      const employeeId = getEmployeeIdForUser(user?.id || "");
      filtered = filtered.filter((exp) => exp.employeeId === employeeId);
    } else if (hasRole(user, "finance") || hasRole(user, "admin")) {
      // For finance and admin, apply search filter to see all expenses
      filtered = filtered.filter((exp) => {
        const matchesSearch = exp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || exp.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
    }

    return filtered;
  }, [expenses, searchTerm, filterStatus, user]);

  const handleOpenDialog = (expense?: ExpenseClaim) => {
    if (expense) {
      setEditingId(expense.id);
      setFormData(expense);
      setBillFile(expense.billFile || null);
      setBillFileType("");
    } else {
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
      setBillFile(null);
      setBillFileType("");
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setBillFile({
          name: file.name,
          type: billFileType || file.type,
          size: file.size,
          base64: base64,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setBillFile(null);
    setBillFileType("");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const expenseData = {
        ...formData,
        amount: Number(formData.amount) || 0,
        date: formData.date || new Date().toISOString().split('T')[0],
      };

      if (editingId) {
        // Update existing expense
        const result = await expenseApi.updateExpense(editingId, expenseData);
        if (result.error) {
          throw new Error(result.error);
        }
        
        // Refetch expenses to get updated data
        const fetchResult = await expenseApi.getExpense();
        if (fetchResult.data && !fetchResult.error) {
          setExpenses(
            fetchResult.data.map((e) => ({
              id: e.id,
              employeeId: e.employeeId || "",
              employeeName: e.employeeName || "Unknown Employee",
              category: e.category || "",
              amount: e.amount || 0,
              date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
              description: e.description || "",
              status: (e.status as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
              createdAt: e.createdAt || new Date().toISOString(),
            }))
          );
        }
      } else {
        // Create new expense
        const result = await expenseApi.createExpense(expenseData);
        if (result.error) {
          throw new Error(result.error);
        }

        // Trigger notification for expense application
        const notificationService = NotificationTriggerService.getInstance();
        await notificationService.triggerExpenseApplied({
          employeeId: user?.id || "",
          employeeName: user?.name || "Unknown Employee",
          amount: formData.amount || 0,
          expenseType: formData.category || "",
          description: formData.description || "",
          managerId: "", // Will be populated by backend
          hrId: "", // Will be populated by backend
        });
        
        // Refetch expenses to get updated data
        const fetchResult = await expenseApi.getExpense();
        if (fetchResult.data && !fetchResult.error) {
          setExpenses(
            fetchResult.data.map((e) => ({
              id: e.id,
              employeeId: e.employeeId || "",
              employeeName: e.employeeName || "Unknown Employee",
              category: e.category || "",
              amount: e.amount || 0,
              date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
              description: e.description || "",
              status: (e.status as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
              createdAt: e.createdAt || new Date().toISOString(),
            }))
          );
        }
      }
      
      setIsDialogOpen(false);
      setFormData({});
      setBillFile(null);
      setBillFileType("");
    } catch (error) {
      console.error("Error saving expense:", error);
      alert(error instanceof Error ? error.message : "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        setLoading(true);
        
        // Call delete API
        const result = await expenseApi.deleteExpense(deleteId);
        if (result.error) {
          throw new Error(result.error);
        }
        
        // Refetch expenses to get updated data
        const fetchResult = await expenseApi.getExpense();
        if (fetchResult.data && !fetchResult.error) {
          setExpenses(
            fetchResult.data.map((e) => ({
              id: e.id,
              employeeId: e.employeeId || "",
              employeeName: e.employeeName || "Unknown Employee",
              category: e.category || "",
              amount: e.amount || 0,
              date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
              description: e.description || "",
              status: (e.status as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
              createdAt: e.createdAt || new Date().toISOString(),
            }))
          );
        }
        
        setIsDeleteDialogOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(error instanceof Error ? error.message : "Failed to delete expense");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApprovalAction = (expenseId: string, action: "approve" | "reject") => {
    setActionExpenseId(expenseId);
    setApprovalAction(action);
    setApprovalNotes("");
    setActionDialogOpen(true);
  };

  const confirmApprovalAction = async () => {
    if (actionExpenseId && approvalAction) {
      try {
        setLoading(true);
        
        const newStatus = approvalAction === "approve" ? "approved" : "rejected";
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
        const fetchResult = await expenseApi.getExpense();
        if (fetchResult.data && !fetchResult.error) {
          setExpenses(
            fetchResult.data.map((e) => ({
              id: e.id,
              employeeId: e.employeeId || "",
              employeeName: e.employeeName || "Unknown Employee",
              category: e.category || "",
              amount: e.amount || 0,
              date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
              description: e.description || "",
              status: (e.status as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
              createdAt: e.createdAt || new Date().toISOString(),
            }))
          );
        }

        setActionDialogOpen(false);
        setApprovalAction(null);
        setActionExpenseId(null);
        setApprovalNotes("");
      } catch (error) {
        console.error("Error updating expense status:", error);
        alert(error instanceof Error ? error.message : "Failed to update expense status");
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[status] || colors.pending;
  };






  
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <CreditCard className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">Expense Management</span>
            <span className="sm:hidden">Expenses</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Manage and track employee expense claims</p>
        </div>

        {(hasRole(user, "finance") || hasRole(user, "admin")) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total Claims</div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">{filteredExpenses.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                  ₹{filteredExpenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-yellow-600">
                  ₹{filteredExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Reimbursed</div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-teal-600">
                  ₹{filteredExpenses.filter((e) => e.status === "reimbursed").reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(hasRole(user, "finance") || hasRole(user, "admin")) ? (
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
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
                  <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status" className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            {canPerformModuleAction("expenses", "create") && (
              <Button onClick={() => handleOpenDialog()} className="gap-2 w-full md:w-auto h-8 sm:h-10 text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Submit Claim
              </Button>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Claims ({filteredExpenses.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Total: ₹{totalAmount.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">Loading expenses...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 sm:space-y-3">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                    <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{expense.employeeName}</h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-2 sm:mb-4">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Category:</span>
                      <span className="font-medium text-right">{expense.category}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Amount:</span>
                      <span className="font-semibold text-right">₹{(expense.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Date:</span>
                      <span className="font-medium text-right">{expense.date}</span>
                    </div>
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-border">
                    {hasRole(user, "finance") ? (
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        {expense.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprovalAction(expense.id, "approve")}
                              className="flex-1 p-1 sm:p-2 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium"
                              title="Approve"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprovalAction(expense.id, "reject")}
                              className="flex-1 p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium"
                              title="Reject"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(expense.status === "approved" || expense.status === "rejected") && (
                          <span className="text-xs text-muted-foreground flex-1">
                            {expense.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </div>
                    ) : !hasRole(user, "employee") && canPerformModuleAction("expenses", "edit") ? (
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleOpenDialog(expense)}
                          className="flex-1 p-1 sm:p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {canPerformModuleAction("expenses", "edit") && (
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="flex-1 p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
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
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{expense.employeeName}</td>
                      <td className="px-4 py-3">{expense.category}</td>
                      <td className="px-4 py-3 font-medium">₹{(expense.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{expense.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {hasRole(user, "finance") ? (
                          <div className="flex gap-2">
                            {expense.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprovalAction(expense.id, "approve")}
                                  className="p-2 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium"
                                  title="Approve"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApprovalAction(expense.id, "reject")}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium"
                                  title="Reject"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(expense.status === "approved" || expense.status === "rejected") && (
                              <span className="text-xs text-muted-foreground">
                                {expense.status === "approved" ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </div>
                        ) : !hasRole(user, "employee") && canPerformModuleAction("expenses", "edit") ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDialog(expense)}
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {canPerformModuleAction("expenses", "edit") && (
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingId ? "Edit Claim" : "Submit Expense Claim"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Employee Name</Label>
              <Input
                value={formData.employeeName || ""}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                disabled={hasRole(user, "employee") && !editingId}
                className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Category</Label>
              <Input
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Travel, Meals, Supplies"
                className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Travel, Meals, Supplies, or Other
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm">Amount</Label>
                <Input
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Date</Label>
                <Input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
              />
            </div>

            <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
              <Label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm">Bill / Receipt</Label>

              {!billFile ? (
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
                          <span className="text-xs sm:text-sm text-muted-foreground text-center">Click to upload</span>
                          <span className="text-xs text-muted-foreground">PDF, PNG, JPG, DOC up to 10MB</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
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
              )}
            </div>

            {hasRole(user, "finance") && (
              <div>
                <Label className="text-xs sm:text-sm">Status</Label>
                <Select value={formData.status || "pending"} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
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
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto text-xs sm:text-sm">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete Claim</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
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
              {approvalAction === "approve" ? "Approve Expense Claim" : "Reject Expense Claim"}
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
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
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
    </Layout>
  );
}
