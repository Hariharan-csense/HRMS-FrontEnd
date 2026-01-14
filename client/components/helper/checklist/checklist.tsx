// src/lib/checklistApi.ts
import ENDPOINTS from "@/lib/endpoint";

/**
 * Offboarding Checklist interface
 */
export interface OffboardingChecklist {
  id: string;
  employeeId: string;
  employeeName?: string;
  hrClearance: boolean;
  financeClearance: boolean;
  assetReturn: boolean;
  itClearance: boolean;
  finalSettlement: boolean;
  status: "in-progress" | "completed";
  completedDate?: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Checklist API helper
 */
export const checklistApi = {
  // ✅ Get all offboarding checklists
  getChecklists: async (): Promise<{ data?: OffboardingChecklist[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getChecklist();

      let rawData: any[] = [];

      // Case 1: Wrapped response { success: true, checklists: [...] }
      if (response.data?.success && Array.isArray(response.data?.checklists)) {
        rawData = response.data.checklists;
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        return { error: "No checklists found in response" };
      }

      const extractDateOnly = (dateStr?: string): string | undefined => {
        if (!dateStr) return undefined;
        return dateStr.split("T")[0];
      };

      const mapped: OffboardingChecklist[] = rawData.map((c: any) => ({
        id: c.id?.toString() || c._id?.toString() || "",
        employeeId: c.employee_id || c.employeeId || "",
        employeeName: c.employee_name || c.employeeName,
        hrClearance: !!c.hr_clearance || !!c.hrClearance || false,
        financeClearance: !!c.finance_clearance || !!c.financeClearance || false,
        assetReturn: !!c.asset_return || !!c.assetReturn || false,
        itClearance: !!c.it_clearance || !!c.itClearance || false,
        finalSettlement: !!c.final_settlement || !!c.finalSettlement || false,
        status: 
          (c.status === "completed" || 
          (c.hr_clearance && c.finance_clearance && c.asset_return && c.it_clearance && c.final_settlement))
            ? "completed"
            : "in-progress",
        completedDate: extractDateOnly(c.completed_date || c.completedDate),
        createdAt: c.created_at || c.createdAt,
        updatedAt: c.updated_at || c.updatedAt,
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching checklists:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load checklists",
      };
    }
  },

  // ✅ Update checklist (toggle items)
  // Inside checklistApi object

updateChecklist: async (
  id: string,
  data: { field: string }  // Only send { field: "xxx" }
): Promise<{ data?: OffboardingChecklist; error?: string }> => {
  try {
    const response = await ENDPOINTS.updateChecklist(id, data); // Send { field: "hr_clearance" }

    const c = response.data; // Backend returns the full updated row

    if (c) {
      const extractDateOnly = (dateStr?: string) => dateStr?.split("T")[0];

      return {
        data: {
          id: c.id?.toString() || "",
          employeeId: c.employee_id || "",
          employeeName: c.employee_name || "",
          hrClearance: !!c.hr_clearance,
          financeClearance: !!c.finance_clearance,
          assetReturn: !!c.asset_return,
          itClearance: !!c.it_clearance,
          finalSettlement: !!c.final_settlement,
          status: c.status || "in-progress",
          completedDate: extractDateOnly(c.completed_date),
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        },
      };
    }

    return { error: "No data returned after update" };
  } catch (error: any) {
    console.error("Error updating checklist:", error);
    return {
      error: error.response?.data?.error || "Failed to update",
    };
  }
},
};

export default checklistApi;