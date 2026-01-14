    // components/helper/department/department.ts

import ENDPOINTS from "@/lib/endpoint";

export interface Department {
  id: string;
  name: string;
  costCenter: string;
  head: string;         // employee name or ID
   createdAt?: string;
  // backend-la extra fields irundha add pannikalam
}

export const departmentApi = {
  getdepartment: async (): Promise<{ data?: Department[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getdepartment();

      // Common response patterns
      if (response.data?.success && Array.isArray(response.data.departments)) {
        const mapped: Department[] = response.data.departments.map((d: any) => ({
          id: d.id?.toString() || d._id?.toString() || "",
          name: d.name || d.department_name || "",
          costCenter: d.cost_center || d.costCenter || "",
          head: d.head || d.department_head || "",
          createdAt: d.created_at || d.createdAt,
        }));
        return { data: mapped };
      }

      // Direct array response
      if (Array.isArray(response.data)) {
        const mapped: Department[] = response.data.map((d: any) => ({
          id: d.id?.toString() || d._id?.toString() || "",
          name: d.name || "",
          costCenter: d.cost_center || d.costCenter || "",
          head: d.head || "",
          createdAt: d.created_at,
        }));
        return { data: mapped };
      }

      return { error: "No departments found" };
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load departments",
      };
    }
  },


createDepartment: async (
    deptData: {
      name: string;
      costCenter: string;
      head?: string;
    }
  ): Promise<{ data?: Department; error?: string }> => {
    try {
      const response = await ENDPOINTS.createDepartment(deptData);

      // Common success patterns
      if (response.data?.success && response.data?.department) {
        const d = response.data.department;
        return {
          data: {
            id: d.id?.toString() || d._id?.toString() || "",
            name: d.name,
            costCenter: d.cost_center || d.costCenter,
            head: d.head || d.department_head,
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      // Some APIs return the created object directly
      if (response.data?.id || response.data?.name) {
        const d = response.data;
        return {
          data: {
            id: d.id?.toString() || d._id?.toString() || "",
            name: d.name,
            costCenter: d.cost_center || d.costCenter,
            head: d.head,
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      return { error: "Failed to create department – unexpected response" };
    } catch (error: any) {
      console.error("Error creating department:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create department",
      };
    }
  },


  updateDepartment: async (
    id: string,
    deptData: {
      name: string;
      costCenter?: string;  // optional – auto generated so usually not changed
      head?: string;
    }
  ): Promise<{ data?: Department; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateDepartment(id, deptData);

      if (response.data?.success && response.data?.department) {
        const d = response.data.department;
        return {
          data: {
            id: d.id?.toString() || id,
            name: d.name,
            costCenter: d.cost_center || d.costCenter,
            head: d.head || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      // Direct updated object
      if (response.data?.id || response.data?.name) {
        const d = response.data;
        return {
          data: {
            id: d.id?.toString() || id,
            name: d.name,
            costCenter: d.cost_center || d.costCenter,
            head: d.head || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      return { error: "Failed to update department – unexpected response" };
    } catch (error: any) {
      console.error("Error updating department:", error);
      return {
        error: error.response?.data?.message || "Update failed",
      };
    }
  },

  deleteDepartment: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteDepartment(id);

      // Success if 200, 204, or backend returns { success: true }
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        return { success: true };
      }

      return { error: "Unexpected response from server" };
    } catch (error: any) {
      console.error("Error deleting department:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete department",
      };
    }
  },


};

export default departmentApi;