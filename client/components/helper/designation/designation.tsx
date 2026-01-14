// components/helper/designation/designation.ts

import ENDPOINTS from "@/lib/endpoint";

export interface Designation {
  id: string;
  name: string;
  level: string;         // frontend uses this (display & form)
  createdAt?: string;
}

export const designationApi = {
  // Get all designations
  getDesignations: async (): Promise<{ data?: Designation[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getDesignation();

      if (response.data?.success && Array.isArray(response.data.designations)) {
        const mapped: Designation[] = response.data.designations.map((d: any) => ({
          id: d.id?.toString() || d._id?.toString() || "",
          name: d.name || "",
          level: d.level_grade?.toString() || d.level?.toString() || "", // map level_grade → level
          createdAt: d.created_at || d.createdAt,
        }));
        return { data: mapped };
      }

      if (Array.isArray(response.data)) {
        const mapped: Designation[] = response.data.map((d: any) => ({
          id: d.id?.toString() || d._id?.toString() || "",
          name: d.name || "",
          level: d.level_grade?.toString() || d.level?.toString() || "",
          createdAt: d.created_at || d.createdAt,
        }));
        return { data: mapped };
      }

      return { error: "No designations found" };
    } catch (error: any) {
      console.error("Error fetching designations:", error);
      return {
        error: error.response?.data?.message || "Failed to load designations",
      };
    }
  },

  // Create designation – backend expects level_grade
  createDesignation: async (
    data: { name: string; level_grade: string }
  ): Promise<{ data?: Designation; error?: string }> => {
    try {
      const response = await ENDPOINTS.createDesignation(data);

      if (response.data?.success && response.data?.designation) {
        const d = response.data.designation;
        return {
          data: {
            id: d.id?.toString() || d._id?.toString() || "",
            name: d.name,
            level: d.level_grade?.toString() || d.level?.toString() || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      if (response.data?.id || response.data?.name) {
        const d = response.data;
        return {
          data: {
            id: d.id?.toString() || d._id?.toString() || "",
            name: d.name,
            level: d.level_grade?.toString() || d.level?.toString() || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      return { error: "Failed to create designation" };
    } catch (error: any) {
      console.error("Error creating designation:", error);
      return {
        error: error.response?.data?.message || "Create failed",
      };
    }
  },

  // Update designation – backend expects level_grade
  updateDesignation: async (
    id: string,
    data: { name: string; level_grade: string }
  ): Promise<{ data?: Designation; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateDesignation(id, data);

      if (response.data?.success && response.data?.designation) {
        const d = response.data.designation;
        return {
          data: {
            id: d.id?.toString() || id,
            name: d.name,
            level: d.level_grade?.toString() || d.level?.toString() || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      if (response.data?.id || response.data?.name) {
        const d = response.data;
        return {
          data: {
            id: d.id?.toString() || id,
            name: d.name,
            level: d.level_grade?.toString() || d.level?.toString() || "",
            createdAt: d.created_at || d.createdAt,
          },
        };
      }

      return { error: "Failed to update designation" };
    } catch (error: any) {
      console.error("Error updating designation:", error);
      return {
        error: error.response?.data?.message || "Update failed",
      };
    }
  },

  // Delete designation
  deleteDesignation: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteDesignation(id);

      if (response.status === 200 || response.status === 204 || response.data?.success) {
        return { success: true };
      }

      return { error: "Unexpected response" };
    } catch (error: any) {
      console.error("Error deleting designation:", error);
      return {
        error: error.response?.data?.message || "Delete failed",
      };
    }
  },
};

export default designationApi;