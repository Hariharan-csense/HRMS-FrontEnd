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

  // Get single role by ID
  getRoleById: async (id: string): Promise<{ data?: Role; error?: string }> => {
    try {
      const response = await ENDPOINTS.getRoleById(id);
      
      if (response.data?.success) {
        const role: Role = {
          id: response.data.role.id?.toString() || response.data.role._id?.toString() || "",
          name: response.data.role.name || "",
          modules: response.data.role.modules || {},
          approvalAuthority: response.data.role.approval_authority || response.data.role.approvalAuthority || "",
          dataVisibility: response.data.role.data_visibility || response.data.role.dataVisibility || "",
          createdAt: response.data.role.created_at || response.data.role.createdAt,
        };
        return { data: role };
      }
      
      return { error: "Role not found" };
    } catch (error: any) {
      console.error("Error fetching role:", error);
      return {
        error: error.response?.data?.message || "Failed to load role",
      };
    }
  },

  // Create new role
  createRole: async (roleData: Omit<Role, 'id' | 'createdAt'>): Promise<{ data?: Role; error?: string }> => {
    try {
      const payload = {
        role_id: `ROLE${Date.now()}`, // Generate unique role ID
        name: roleData.name,
        approval_authority: roleData.approvalAuthority,
        data_visibility: roleData.dataVisibility,
        modules: roleData.modules,
      };

      const response = await ENDPOINTS.createRole(payload);
      
      if (response.data?.success) {
        const newRole: Role = {
          id: response.data.role.id?.toString() || response.data.role._id?.toString() || "",
          name: response.data.role.name || roleData.name,
          modules: response.data.role.modules || roleData.modules,
          approvalAuthority: response.data.role.approval_authority || response.data.role.approvalAuthority || roleData.approvalAuthority,
          dataVisibility: response.data.role.data_visibility || response.data.role.dataVisibility || roleData.dataVisibility,
          createdAt: response.data.role.created_at || response.data.role.createdAt || new Date().toISOString(),
        };
        return { data: newRole };
      }
      
      return { error: "Failed to create role" };
    } catch (error: any) {
      console.error("Error creating role:", error);
      return {
        error: error.response?.data?.message || "Failed to create role",
      };
    }
  },

  // Update existing role
  updateRole: async (id: string, roleData: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<{ data?: Role; error?: string }> => {
    try {
      const payload = {
        name: roleData.name,
        approval_authority: roleData.approvalAuthority,
        data_visibility: roleData.dataVisibility,
        modules: roleData.modules,
      };

      const response = await ENDPOINTS.updateRole(id, payload);
      
      if (response.data?.success) {
        const updatedRole: Role = {
          id: response.data.role.id?.toString() || response.data.role._id?.toString() || id,
          name: response.data.role.name || roleData.name || "",
          modules: response.data.role.modules || roleData.modules || {},
          approvalAuthority: response.data.role.approval_authority || response.data.role.approvalAuthority || roleData.approvalAuthority || "",
          dataVisibility: response.data.role.data_visibility || response.data.role.dataVisibility || roleData.dataVisibility || "",
          createdAt: response.data.role.created_at || response.data.role.createdAt,
        };
        return { data: updatedRole };
      }
      
      return { error: "Failed to update role" };
    } catch (error: any) {
      console.error("Error updating role:", error);
      return {
        error: error.response?.data?.message || "Failed to update role",
      };
    }
  },

  // Delete role
  deleteRole: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteRole(id);
      
      if (response.data?.success) {
        return { success: true };
      }
      
      return { error: "Failed to delete role" };
    } catch (error: any) {
      console.error("Error deleting role:", error);
      return {
        error: error.response?.data?.message || "Failed to delete role",
      };
    }
  },
};

export default roleApi;