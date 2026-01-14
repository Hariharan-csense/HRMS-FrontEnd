// components/helper/role/role.ts

import ENDPOINTS from "@/lib/endpoint";

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
}

export interface Role {
  id: string;
  name: string;
  modules: {
    [key: string]: ModulePermission;
  };
  approvalAuthority: string;
  dataVisibility: string;
  createdAt?: string;
}

export const roleApi = {
  // Get all roles
  getRoles: async (): Promise<{ data?: Role[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getRoles();

      if (response.data?.success && Array.isArray(response.data.roles)) {
        const mapped: Role[] = response.data.roles.map((r: any) => ({
          id: r.id?.toString() || r._id?.toString() || "",
          name: r.name || "",
          modules: r.modules || {},
          approvalAuthority: r.approval_authority || r.approvalAuthority || "",
          dataVisibility: r.data_visibility || r.dataVisibility || "",
          createdAt: r.created_at || r.createdAt,
        }));
        return { data: mapped };
      }

      if (Array.isArray(response.data)) {
        const mapped: Role[] = response.data.map((r: any) => ({
          id: r.id?.toString() || r._id?.toString() || "",
          name: r.name || "",
          modules: r.modules || {},
          approvalAuthority: r.approval_authority || r.approvalAuthority || "",
          dataVisibility: r.data_visibility || r.dataVisibility || "",
          createdAt: r.created_at || r.createdAt,
        }));
        return { data: mapped };
      }

      return { error: "No roles found" };
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      return {
        error: error.response?.data?.message || "Failed to load roles",
      };
    }
  },

  // Create role
  createRole: async (
    roleData: {
      name: string;
      modules: { [key: string]: ModulePermission };
      approvalAuthority: string;
      dataVisibility: string;
    }
  ): Promise<{ data?: Role; error?: string }> => {
    try {
      const response = await ENDPOINTS.createRole(roleData);

      if (response.data?.success && response.data?.role) {
        const r = response.data.role;
        return {
          data: {
            id: r.id?.toString() || r._id?.toString() || "",
            name: r.name,
            modules: r.modules || {},
            approvalAuthority: r.approval_authority || r.approvalAuthority,
            dataVisibility: r.data_visibility || r.dataVisibility,
            createdAt: r.created_at || r.createdAt,
          },
        };
      }

      if (response.data?.id || response.data?.name) {
        const r = response.data;
        return {
          data: {
            id: r.id?.toString() || r._id?.toString() || "",
            name: r.name,
            modules: r.modules || {},
            approvalAuthority: r.approval_authority || r.approvalAuthority,
            dataVisibility: r.data_visibility || r.dataVisibility,
            createdAt: r.created_at || r.createdAt,
          },
        };
      }

      return { error: "Failed to create role" };
    } catch (error: any) {
      console.error("Error creating role:", error);
      return {
        error: error.response?.data?.message || "Create failed",
      };
    }
  },

  // Update role
  updateRole: async (
    id: string,
    roleData: {
      name: string;
      modules: { [key: string]: ModulePermission };
      approvalAuthority: string;
      dataVisibility: string;
    }
  ): Promise<{ data?: Role; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateRole(id, roleData);

      if (response.data?.success && response.data?.role) {
        const r = response.data.role;
        return {
          data: {
            id: r.id?.toString() || id,
            name: r.name,
            modules: r.modules || {},
            approvalAuthority: r.approval_authority || r.approvalAuthority,
            dataVisibility: r.data_visibility || r.dataVisibility,
            createdAt: r.created_at || r.createdAt,
          },
        };
      }

      if (response.data?.id || response.data?.name) {
        const r = response.data;
        return {
          data: {
            id: r.id?.toString() || id,
            name: r.name,
            modules: r.modules || {},
            approvalAuthority: r.approval_authority || r.approvalAuthority,
            dataVisibility: r.data_visibility || r.dataVisibility,
            createdAt: r.created_at || r.createdAt,
          },
        };
      }

      return { error: "Failed to update role" };
    } catch (error: any) {
      console.error("Error updating role:", error);
      return {
        error: error.response?.data?.message || "Update failed",
      };
    }
  },

  // Delete role
  deleteRole: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteRole(id);

      if (response.status === 200 || response.status === 204 || response.data?.success) {
        return { success: true };
      }

      return { error: "Unexpected response" };
    } catch (error: any) {
      console.error("Error deleting role:", error);
      return {
        error: error.response?.data?.message || "Delete failed",
      };
    }
  },
};

export default roleApi;