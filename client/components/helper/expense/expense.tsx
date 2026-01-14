// src/api/expenseApi.ts

import ENDPOINTS from "@/lib/endpoint"; // Adjust if you use a different axios instance or ENDPOINTS

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
  createdAt?: string;
  updatedAt?: string;
  // Add other fields as per your backend response
}

const expenseApi = {
  /**
   * Get all expenses
   */
 getExpense: async (): Promise<{ data?: Expense[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getExpense();

    console.log("Raw Expense API Response:", response.data);

    // Normalize response payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || !payload.success) {
      return { error: "Invalid API response" };
    }

    if (!Array.isArray(payload.expenses)) {
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
        createdAt: e.created_at ?? undefined,
        updatedAt: e.updated_at ?? undefined,
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

 
};

export default expenseApi;