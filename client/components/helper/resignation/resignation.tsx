// src/lib/resignationApi.ts
import ENDPOINTS from "@/lib/endpoint";
import { Employee } from "../employee/employee";

/**
 * Resignation interface
 */
export interface Resignation {
  id: string;
  employeeId: string;
  employeeName?: string;
  resignationDate: string;        // YYYY-MM-DD format preferred
  lastWorkingDate?: string;       // YYYY-MM-DD format preferred
  reason?: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  noticePeriod?: number;          // in days
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to extract just the date part (YYYY-MM-DD) from ISO string
const extractDateOnly = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;
  return dateStr.split("T")[0]; // Removes timestamp if present
};

/**
 * Resignation API helper
 */
export const resignationApi = {
  // ✅ Get all resignations
 getResignations: async (): Promise<{ data?: Resignation[]; error?: string }> => {
  try {
    // Fixed: Use plural endpoint (assuming it's /resignations)
    const response = await ENDPOINTS.getResignation();

    // Helper to extract only date part from ISO string
    const extractDateOnly = (dateStr?: string): string | undefined => {
      if (!dateStr) return undefined;
      return dateStr.split("T")[0]; // "2025-02-28T18:30:00.000Z" → "2025-02-28"
    };

    let rawData: any[] = [];

    // Case 1: Wrapped response { success: true, resignations: [...] }
    if (response.data?.success && Array.isArray(response.data?.resignations)) {
      rawData = response.data.resignations;
    }
    // Case 2: Direct array response
    else if (Array.isArray(response.data)) {
      rawData = response.data;
    }
    // No valid data
    else {
      return { error: "No resignations found in response" };
    }

    // Unified mapping for both cases
    const mapped: Resignation[] = rawData.map((r: any) => ({
      id: r.id?.toString() || r._id?.toString() || "",
      employeeId: r.employee_id || r.employeeId || "",
      employeeName: r.employee_name || r.employeeName || "",
      resignationDate: extractDateOnly(r.resignation_date) || "",
      // Critical Fix: Exact field name from your API response
      lastWorkingDate: extractDateOnly(r.last_working_day),
      reason: r.reason || "",
      // Your API uses approval_status, not status
      status: r.approval_status || "pending",
      noticePeriod: Number(r.notice_period || 0),
      isActive: r.is_active ?? true,
      createdAt: r.created_at || r.createdAt,
      updatedAt: r.updated_at || r.updatedAt,
    }));

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching resignations:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load resignations",
    };
  }
},

  // ✅ Create resignation
// resignationApi.ts la update pannu
createResignation: async (
  data: {
    employeeName?: string;                  // employeeId remove pannita
    resignationDate: string;
    lastWorkingDate?: string;
    reason?: string;
    noticePeriod?: number;
  }
): Promise<{ data?: Resignation; error?: string }> => {
  try {
    // Send exact fields backend expects
    const payload = {
      employee_name: data.employeeName,
      resignation_date: data.resignationDate,
      last_working_day: data.lastWorkingDate,
      reason: data.reason,
      // notice_period if needed
    };

    const response = await ENDPOINTS.createResignation(payload);

    const r = response.data?.resignation || response.data;

    if (r) {
      return {
        data: {
          id: r.id?.toString() || r._id?.toString(),
          employeeId: r.employee_id || "",       // backend-la irundha use pannu, illana empty
          employeeName: r.employee_name || data.employeeName,
          resignationDate: extractDateOnly(r.resignation_date) || data.resignationDate,
          lastWorkingDate: extractDateOnly(r.last_working_day) || data.lastWorkingDate,
          reason: r.reason || data.reason,
          status: r.approval_status || "pending",
          noticePeriod: Number(r.notice_period || 0),
          isActive: r.is_active ?? true,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        },
      };
    }

    return { error: "Resignation created but response format not recognized" };
  } catch (error: any) {
    console.error("Error creating resignation:", error);
    return {
      error: error.response?.data?.message || error.message || "Failed to create resignation",
    };
  }
},

  // ✅ Update resignation
  updateResignation: async (
    id: string,
    data: Partial<Pick<Resignation, "resignationDate" | "lastWorkingDate" | "reason" | "status" | "noticePeriod" | "isActive">>
  ): Promise<{ data?: Resignation; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateResignation(id, data);
      const r = response.data?.resignation || response.data;

      if (r) {
        return {
          data: {
            id: r.id?.toString() || r._id?.toString() || id,
            employeeId: r.employee_id || r.employeeId,
            employeeName: r.employee_name || r.employeeName,
            resignationDate: extractDateOnly(r.resignation_date || r.resignationDate) || data.resignationDate,
            lastWorkingDate: extractDateOnly(r.last_working_date || r.lastWorkingDate) || data.lastWorkingDate,
            reason: r.reason || data.reason,
            status: r.status || data.status || "pending",
            noticePeriod: Number(r.notice_period || r.noticePeriod || data.noticePeriod || 0),
            isActive: r.is_active ?? r.isActive ?? data.isActive,
            createdAt: r.created_at || r.createdAt,
            updatedAt: r.updated_at || r.updatedAt,
          },
        };
      }

      return { error: "Failed to update resignation – unexpected response" };
    } catch (error: any) {
      console.error("Error updating resignation:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update resignation",
      };
    }
  },

getEmployees: async (): Promise<{ data?: Employee[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getEmployee(); // Adjust endpoint if needed: getAllEmployees(), etc.

      let rawData: any[] = [];

      // Case 1: Wrapped response e.g., { success: true, employees: [...] }
      if (response.data?.success && Array.isArray(response.data?.employees)) {
        rawData = response.data.employees;
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        rawData = response.data;
      }
      // No valid data
      else {
        console.warn("Unexpected employees response format:", response.data);
        return { error: "No employees found in response" };
      }

      // Map API fields to our Employee interface
      const mapped: Employee[] = rawData.map((e: any) => ({
        id: e.id?.toString() || e._id?.toString() || "",
        // Combine first_name and last_name into full name
        name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Unknown Employee",
        employeeId: e.employee_id || e.employeeId || undefined,
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load employees",
      };
    }
  },
  
  // ✅ Delete resignation
 
};


export default resignationApi;