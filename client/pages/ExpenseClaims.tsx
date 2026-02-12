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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, CreditCard, Upload, X, Camera, Loader2, Download, FileSpreadsheet } from "lucide-react";
import expenseApi from "@/components/helper/expense/expense";
import NotificationTriggerService from "@/services/notificationTriggerService";
import { showToast } from "@/utils/toast";

interface BillFile {
  name: string;
  type: string;
  size: number;
  base64?: string;
  file?: File;
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
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState<any>(null);

  // Export related states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAllEmployees, setSelectAllEmployees] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('all');
  const [exportDateFilter, setExportDateFilter] = useState<{ startDate?: string; endDate?: string }>({});
  const [exporting, setExporting] = useState(false);

  // Fetch expenses from API
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await expenseApi.getExpense();
        console.log("Expense API Response:", response);
        console.log("Response data type:", typeof response.data);
        console.log("Response data:", response.data);
        console.log("Is response.data an array?", Array.isArray(response.data));

        if (response.error) {
          throw new Error(response.error);
        }

        // The expenseApi already processes the response and returns data in the correct format
        if (!response.data || !Array.isArray(response.data)) {
          console.error("Invalid data format from API:", response);
          throw new Error("No expense data received or invalid format");
        }

        // If no data is returned, set empty array and return
        if (response.data.length === 0) {
          console.log("No expenses found in the API response");
          setExpenses([]);
          return;
        }

        // Log the first expense to debug the structure
        console.log("First expense from API:", response.data[0]);

        // Map the processed data to our component's state
        const formattedExpenses = response.data.map((expense: any) => {
          // Ensure we have a valid ID
          const expenseId = expense.id?.toString() || expense.expense_id?.toString() || Math.random().toString(36).substr(2, 9);
          
          return {
            id: expenseId,
            employeeId: expense.employee_id?.toString() || expense.employeeId?.toString() || "",
            employeeName: expense.employee_name || expense.employeeName || "Unknown Employee",
            category: expense.category || "",
            amount: parseFloat(expense.amount) || 0,
            date: expense.expense_date || expense.date || new Date().toISOString().split('T')[0],
            description: expense.description || "",
            status: (expense.status?.toLowerCase() as "pending" | "approved" | "rejected" | "reimbursed") || "pending",
            createdAt: expense.created_at || expense.createdAt || new Date().toISOString(),
          };
        });

        console.log("Formatted expenses:", formattedExpenses);
        setExpenses(formattedExpenses);
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
    console.log("Filtering expenses. Current expenses:", expenses);
    console.log("Search term:", searchTerm, "Filter status:", filterStatus);
    
    let filtered = [...expenses]; // Create a copy of the expenses array

    // If user is an employee, show only their data
    if (hasRole(user, "employee")) {
      const userId = user?.id || "";
      const formattedEmployeeId = getEmployeeIdForUser(userId);
      console.log("Filtering for user ID:", userId, "Formatted employee ID:", formattedEmployeeId);
      console.log("Available employee IDs in expenses:", expenses.map(e => e.employeeId));
      
      filtered = filtered.filter((exp) => {
        // Check both formats: numeric ID (37) and formatted ID (EMP037)
        return exp.employeeId === userId || 
               exp.employeeId === formattedEmployeeId ||
               exp.employeeId === parseInt(userId)?.toString();
      });
    } else if (hasRole(user, "finance") || hasRole(user, "admin")) {
      // For finance and admin, apply search filter to see all expenses
      filtered = filtered.filter((exp) => {
        const matchesSearch = exp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || exp.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
    } else {
      // For other roles, apply search filter but don't restrict by role
      filtered = filtered.filter((exp) => {
        const matchesSearch = exp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || exp.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
    }

    console.log("Filtered expenses result:", filtered);
    return filtered;
  }, [expenses, searchTerm, filterStatus, user]);

  const handleOpenDialog = (expense?: ExpenseClaim) => {
    setError(null); // Clear any previous errors
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
      setScanData(null);
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // First scan the receipt for OCR data
      setScanning(true);
      setError(null);
      
      try {
        const scanResult = await expenseApi.scanReceipt(file);
        
        if (scanResult.data && scanResult.data.success) {
          const ocrData = scanResult.data.data;
          setScanData(ocrData);
          
          // Auto-fill form with scanned data
          setFormData(prev => ({
            ...prev,
            amount: ocrData.amount || prev.amount,
            date: ocrData.date || prev.date || new Date().toISOString().split('T')[0], // Use today's date if no OCR date
            category: ocrData.category || prev.category,
            description: ocrData.vendor || prev.description
          }));
          
          console.log('OCR Data:', ocrData);
        } else {
          setError(scanResult.error || 'Failed to scan receipt');
        }
      } catch (scanError) {
        console.error('Scanning error:', scanError);
        setError('Failed to scan receipt. You can still upload manually.');
      } finally {
        setScanning(false);
      }
      
      // Then proceed with file upload for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
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

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.category || formData.category.trim() === '') {
        setError('Category is required');
        setLoading(false);
        return;
      }
      
      if (!formData.amount || Number(formData.amount) <= 0) {
        setError('Amount is required and must be greater than 0');
        setLoading(false);
        return;
      }
      
      if (!formData.date || formData.date.trim() === '') {
        setError('Date is required');
        setLoading(false);
        return;
      }
      
      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
        expense_date: formData.date,
        category: formData.category.trim(),
        description: formData.description?.trim() || '',
        receipt: billFile?.file, // Include the actual File object
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
      
      setError(null); // Clear any previous errors on success
      setIsDialogOpen(false);
      setFormData({});
      setBillFile(null);
      setBillFileType("");
      setScanData(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      setError(error instanceof Error ? error.message : "Failed to save expense");
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
        showToast.error(error instanceof Error ? error.message : "Failed to delete expense");
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
        showToast.error(error instanceof Error ? error.message : "Failed to update expense status");
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

  // Get unique employees for export selection
  const uniqueEmployees = useMemo(() => {
    const employees = new Map<string, string>();
    expenses.forEach(exp => {
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
      setSelectedEmployees(uniqueEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Handle individual employee selection
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const exportData = {
        employeeIds: selectAllEmployees ? ['all'] : selectedEmployees,
        format: exportFormat,
        statusFilter: exportStatusFilter,
        dateFilter: exportDateFilter.startDate || exportDateFilter.endDate ? exportDateFilter : undefined
      };

      const response = await expenseApi.exportExpenses(exportData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Handle file download for CSV
      if (exportFormat === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON, create and download file
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setIsExportDialogOpen(false);
      // Reset export selections
      setSelectedEmployees([]);
      setSelectAllEmployees(false);
      setExportStatusFilter('all');
      setExportDateFilter({});
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export expenses');
    } finally {
      setExporting(false);
    }
  };

  // Open export dialog
  const openExportDialog = () => {
    setIsExportDialogOpen(true);
    setError(null);
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
              <CardTitle className="text-lg sm:text-xl">Filters & Export</CardTitle>
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

                <div>
                  <Label className="text-xs sm:text-sm">Export</Label>
                  <div className="mt-1.5 sm:mt-2">
                    <Button 
                      onClick={openExportDialog}
                      className="w-full h-8 sm:h-10 text-xs sm:text-sm gap-2"
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

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm">Amount</Label>
                <Input
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: parseFloat(e.target.value) });
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
              />
            </div>

            <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
              <Label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm">Bill / Receipt</Label>

              {/* Scanning Status */}
              {scanning && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-800">Scanning receipt with AI...</span>
                  </div>
                </div>
              )}

              {/* Scan Results */}
              {scanData && !scanning && (
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
              )}

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

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Expense Data
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select employees and filters to export expense data in CSV or JSON format.
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
              <Label className="text-xs sm:text-sm font-medium">Export Format</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant={exportFormat === 'json' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('json')}
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
                <Label className="text-xs sm:text-sm font-medium">Select Employees</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAllEmployees}
                    onCheckedChange={handleSelectAllEmployees}
                  />
                  <Label htmlFor="select-all" className="text-xs sm:text-sm cursor-pointer">
                    Select All ({uniqueEmployees.length})
                  </Label>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {uniqueEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No employees found</p>
                ) : (
                  <div className="space-y-2">
                    {uniqueEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id) || selectAllEmployees}
                          onCheckedChange={(checked) => handleEmployeeSelection(employee.id, checked as boolean)}
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
              <Label className="text-xs sm:text-sm font-medium">Status Filter</Label>
              <Select value={exportStatusFilter} onValueChange={setExportStatusFilter}>
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

            {/* Date Filter */}
            <div>
              <Label className="text-xs sm:text-sm font-medium">Date Range (Optional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={exportDateFilter.startDate || ''}
                    onChange={(e) => setExportDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    value={exportDateFilter.endDate || ''}
                    onChange={(e) => setExportDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
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
              disabled={exporting || (selectedEmployees.length === 0 && !selectAllEmployees)}
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
