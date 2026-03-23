// src/api/expenseApi.ts

import ENDPOINTS from "@/lib/endpoint"; // Adjust if you use a different axios instance or ENDPOINTS
import { BASE_URL } from "@/lib/endpoint"; // Import BASE_URL for constructing full URLs

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  status: string; // e.g., "pending", "approved", "rejected"
  description?: string;
  employeeId?: string;
  employeeName?: string;
  clientId?: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
  receipt_url?: string;
  receipt_path?: string;
  // Add other fields as per your backend response
}

export interface AssignedClient {
  id: number;
  client_id: string;
  client_name: string;
}

export interface ExpenseDraft {
  id: number;
  client_id: number | null;
  expenses: Array<{
    category: string;
    amount: string | number;
    expense_date: string;
    description?: string;
    receipt_path?: string | null;
    receipt_url?: string | null;
    client_id?: number | null;
  }>;
  created_at?: string;
  updated_at?: string;
}

const resolveFileUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/uploads/")) {
    try {
      return `${new URL(BASE_URL).origin}${normalizedPath}`;
    } catch {
      const normalizedBaseUrl = BASE_URL.replace(/\/backend\/?$/, "").replace(/\/+$/, "");
      return `${normalizedBaseUrl}${normalizedPath}`;
    }
  }

  try {
    return new URL(path, BASE_URL).toString();
  } catch {
    const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
};

const expenseApi = {
  /**
   * Get all expenses
   */
  getExpense: async (): Promise<{ data?: Expense[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getExpense();

      console.log("Raw Expense API Response:", response.data);

      // The response structure is: { success: true, count: 3, expenses: [...] }
      const payload = response.data;

      if (!payload || !payload.success) {
        return { error: "Invalid API response" };
      }

      if (!Array.isArray(payload.expenses)) {
        console.error("Expected expenses array but got:", payload.expenses);
        return { error: "Expenses data is not an array" };
      }

      const mapped: Expense[] = payload.expenses.map((e: any) => {
        // Build employee name safely
        const fullName =
          (typeof e.employee_name === "string" && e.employee_name.trim()) ||
          `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
          e.assigned_employee_name ||
          undefined;

        // Normalize date
        const expenseDate =
          e.expense_date ||
          e.date ||
          undefined;

        return {
          id: e.expense_id?.toString() || e.id?.toString(),
          name: e.name ?? undefined,
          amount: Number(e.amount ?? 0),
          category: e.category ?? undefined,
          date: expenseDate,
          status: e.status?.toLowerCase() ?? "pending",
          description: e.description ?? undefined,
          employeeId:
            e.employee_id?.toString() ||
            e.assigned_employee_id?.toString() ||
            undefined,
          employeeName: fullName,
          clientId: e.client_id?.toString() || undefined,
          clientName: e.client_name ?? undefined,
          createdAt: e.created_at ?? undefined,
          updatedAt: e.updated_at ?? undefined,
          receipt_url: resolveFileUrl(e.receipt_url),
          receipt_path: e.receipt_path ?? undefined,
        };
      });

      console.log("Mapped Expenses:", mapped);

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load expenses",
      };
    }
  },

  /**
   * Get pending expenses for manager approval
   */
  getPendingExpenses: async (): Promise<{ data?: Expense[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getPendingExpenses();

      console.log("Raw Pending Expenses API Response:", response.data);

      // The response structure should be: { success: true, expenses: [...] }
      const payload = response.data;

      if (!payload || !payload.success) {
        return { error: "Invalid API response" };
      }

      if (!Array.isArray(payload.expenses)) {
        console.error("Expected expenses array but got:", payload.expenses);
        return { error: "Expenses data is not an array" };
      }

      const mapped: Expense[] = payload.expenses.map((e: any) => {
        // Build employee name safely
        const fullName =
          (typeof e.employee_name === "string" && e.employee_name.trim()) ||
          `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
          e.assigned_employee_name ||
          undefined;

        // Normalize date
        const expenseDate =
          e.expense_date ||
          e.date ||
          e.created_at ||
          undefined;

        return {
          id: e.expense_id?.toString() || e.id?.toString(),
          name: e.name ?? undefined,
          amount: Number(e.amount ?? 0),
          category: e.category ?? undefined,
          date: expenseDate,
          status: e.status?.toLowerCase() ?? "pending",
          description: e.description ?? undefined,
          employeeId:
            e.employee_id?.toString() ||
            e.assigned_employee_id?.toString() ||
            undefined,
          employeeName: fullName,
          clientId: e.client_id?.toString() || undefined,
          clientName: e.client_name ?? undefined,
          createdAt: e.created_at ?? undefined,
          updatedAt: e.updated_at ?? undefined,
          receipt_url: resolveFileUrl(e.receipt_url),
          receipt_path: e.receipt_path ?? undefined,
        };
      });

      console.log("Mapped Pending Expenses:", mapped);

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching pending expenses:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load pending expenses",
      };
    }
  },

  createExpense: async (data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createExpense(data);
      return { data: response.data };
    } catch (error: any) {
      console.error("Error creating expense:", error);
      return {
        error: error.response?.data?.message || "Failed to create expense",
      };
    }
  },

  getAssignedClients: async (): Promise<{ data?: AssignedClient[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getExpenseAssignedClients();
      const payload = response.data;

      if (!payload?.success || !Array.isArray(payload.clients)) {
        return { error: 'Invalid API response' };
      }

      return { data: payload.clients };
    } catch (error: any) {
      console.error('Error fetching assigned clients:', error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to load assigned clients',
      };
    }
  },

  getDraft: async (): Promise<{ data?: ExpenseDraft[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getExpenseDraft();
      const payload = response.data;

      if (!payload?.success) {
        return { error: 'Invalid API response' };
      }

      return { data: Array.isArray(payload.drafts) ? payload.drafts : [] };
    } catch (error: any) {
      console.error('Error fetching expense draft:', error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to load draft',
      };
    }
  },

  saveDraft: async (data: FormData): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.saveExpenseDraft(data);
      return { data: response.data };
    } catch (error: any) {
      console.error('Error saving expense draft:', error);
      return {
        error: error.response?.data?.message || 'Failed to save draft',
      };
    }
  },

  clearDraft: async (draftId?: string | number): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteExpenseDraft(draftId);
      return { data: response.data };
    } catch (error: any) {
      console.error('Error clearing expense draft:', error);
      return {
        error: error.response?.data?.message || 'Failed to clear draft',
      };
    }
  },

  createExpensesBulk: async (formData: FormData): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createExpensesBulk(formData);
      return { data: response.data };
    } catch (error: any) {
      console.error('Error creating bulk expenses:', error);
      return {
        error: error.response?.data?.message || 'Failed to submit expenses',
      };
    }
  },

  updateExpense: async (id: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      // Make sure you're hitting the correct endpoint, e.g., `/expenses/:id`
      const response = await ENDPOINTS.updateExpense(id, data); 
      return { data: response.data };
    } catch (error: any) {
      console.error("Error updating expense:", error);
      return {
        error: error.response?.data?.message || "Failed to update expense status",
      };
    }
  },

  deleteExpense: async (id: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteExpense(id);
      return { data: response.data };
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      return {
        error: error.response?.data?.message || "Failed to delete expense",
      };
    }
  },

  scanReceipt: async (file: File): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.scanReceipt(file);
      return { data: response.data };
    } catch (error: any) {
      console.error("Error scanning receipt:", error);
      return {
        error: error.response?.data?.message || "Failed to scan receipt",
      };
    }
  },

  exportExpenses: async (exportData: {
    employeeIds: string[];
    format: 'csv' | 'json';
    statusFilter?: string;
    dateFilter?: {
      startDate?: string;
      endDate?: string;
    };
  }): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.exportExpenses(exportData);
      return { data: response.data };
    } catch (error: any) {
      console.error("Error exporting expenses:", error);
      return {
        error: error.response?.data?.message || "Failed to export expenses",
      };
    }
  },
};

export default expenseApi;
