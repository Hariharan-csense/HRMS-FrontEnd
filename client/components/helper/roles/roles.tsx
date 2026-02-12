// components/helper/role/role.ts

import ENDPOINTS from "@/lib/endpoint";

export interface ModulePermission {
  create: number;
  edit: number;
  view: number;
  approve: number;
  reject: number;
}

export interface Role {
  id: string;
  role_id: string;
  name: string;
  modules: {
    [key: string]: ModulePermission;
  };
  approval_authority: string;
  data_visibility: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoleAssignment {
  id: string;
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  role_code: string;
  role_name: string;
  status: 'Active' | 'Inactive';
  assigned_date: string;
  removed_date?: string;
  remarks?: string;
  employee_name?: string;
}

export interface EmployeeRoleAssignment {
  id: string;
  status: 'Active' | 'Inactive';
  assigned_date: string;
  removed_date?: string;
  remarks?: string;
  role_id: string;
  role_code: string;
  role_name: string;
  approval_authority: string;
  data_visibility: string;
  modules: {
    [key: string]: ModulePermission;
  };
  description?: string;
}

export const roleApi = {
  // Get all roles
  getRoles: async (): Promise<{ data?: Role[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getRoles();

      if (response.data?.success && Array.isArray(response.data.roles)) {
        const mapped: Role[] = response.data.roles.map((r: any) => ({
          id: r.id?.toString() || "",
          role_id: r.role_id || "",
          name: r.name || "",
          modules: r.modules || {},
          approval_authority: r.approval_authority || "",
          data_visibility: r.data_visibility || "",
          description: r.description || "",
          created_at: r.created_at,
          updated_at: r.updated_at,
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
          id: response.data.role.id?.toString() || "",
          role_id: response.data.role.role_id || "",
          name: response.data.role.name || "",
          modules: response.data.role.modules || {},
          approval_authority: response.data.role.approval_authority || "",
          data_visibility: response.data.role.data_visibility || "",
          description: response.data.role.description || "",
          created_at: response.data.role.created_at,
          updated_at: response.data.role.updated_at,
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
  createRole: async (roleData: Omit<Role, 'id' | 'role_id' | 'created_at' | 'updated_at'>): Promise<{ data?: Role; error?: string }> => {
    try {
      const payload = {
        name: roleData.name,
        approval_authority: roleData.approval_authority,
        data_visibility: roleData.data_visibility,
        modules: roleData.modules,
        description: roleData.description,
      };

      const response = await ENDPOINTS.createRole(payload);
      
      if (response.data?.success) {
        const newRole: Role = {
          id: response.data.role.id?.toString() || "",
          role_id: response.data.role.role_id || "",
          name: response.data.role.name || roleData.name,
          modules: response.data.role.modules || roleData.modules,
          approval_authority: response.data.role.approval_authority || roleData.approval_authority,
          data_visibility: response.data.role.data_visibility || roleData.data_visibility,
          description: response.data.role.description || roleData.description,
          created_at: response.data.role.created_at || new Date().toISOString(),
          updated_at: response.data.role.updated_at,
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
  updateRole: async (id: string, roleData: Partial<Omit<Role, 'id' | 'role_id' | 'created_at' | 'updated_at'>>): Promise<{ data?: Role; error?: string }> => {
    try {
      const payload = {
        name: roleData.name,
        approval_authority: roleData.approval_authority,
        data_visibility: roleData.data_visibility,
        modules: roleData.modules,
        description: roleData.description,
      };

      const response = await ENDPOINTS.updateRole(id, payload);
      
      if (response.data?.success) {
        const updatedRole: Role = {
          id: response.data.role.id?.toString() || id,
          role_id: response.data.role.role_id || "",
          name: response.data.role.name || roleData.name || "",
          modules: response.data.role.modules || roleData.modules || {},
          approval_authority: response.data.role.approval_authority || roleData.approval_authority || "",
          data_visibility: response.data.role.data_visibility || roleData.data_visibility || "",
          description: response.data.role.description || roleData.description || "",
          created_at: response.data.role.created_at,
          updated_at: response.data.role.updated_at,
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

  // Role Assignment APIs
  // Assign role to employee
  assignRoleToEmployee: async (employee_id: string, role_id: string, remarks?: string): Promise<{ data?: RoleAssignment; error?: string }> => {
    try {
      const payload = { employee_id, role_id, remarks };
      const response = await ENDPOINTS.assignRoleToEmployee(payload);
      
      if (response.data?.success) {
        return { data: response.data.assignment };
      }
      
      return { error: "Failed to assign role" };
    } catch (error: any) {
      console.error("Error assigning role:", error);
      return {
        error: error.response?.data?.message || "Failed to assign role",
      };
    }
  },

  // Remove role from employee
  removeRoleFromEmployee: async (assignmentId: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.removeRoleFromEmployee(assignmentId);
      
      if (response.data?.success) {
        return { success: true };
      }
      
      return { error: "Failed to remove role" };
    } catch (error: any) {
      console.error("Error removing role:", error);
      return {
        error: error.response?.data?.message || "Failed to remove role",
      };
    }
  },

  // Get all role assignments
  getRoleAssignments: async (): Promise<{ data?: RoleAssignment[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getRoleAssignments();
      
      if (response.data?.success && Array.isArray(response.data.assignments)) {
        return { data: response.data.assignments };
      }
      
      return { error: "No assignments found" };
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      return {
        error: error.response?.data?.message || "Failed to load assignments",
      };
    }
  },

  // Get employee roles
  getEmployeeRoles: async (employee_id: string): Promise<{ data?: EmployeeRoleAssignment[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getEmployeeRoles(employee_id);
      
      if (response.data?.success && Array.isArray(response.data.assignments)) {
        return { data: response.data.assignments };
      }
      
      return { error: "No employee roles found" };
    } catch (error: any) {
      console.error("Error fetching employee roles:", error);
      return {
        error: error.response?.data?.message || "Failed to load employee roles",
      };
    }
  },
};

export default roleApi;