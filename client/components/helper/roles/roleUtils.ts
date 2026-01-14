// Role CRUD utility functions
import { roleApi, Role, ModulePermission } from './roles';

/**
 * Create a new role with the given data
 */
export const createNewRole = async (roleData: Omit<Role, 'id' | 'createdAt'>) => {
  const result = await roleApi.createRole(roleData);
  if (result.data) {
    console.log("Role created successfully:", result.data);
    return result.data;
  } else {
    console.error("Error creating role:", result.error);
    throw new Error(result.error || "Failed to create role");
  }
};

/**
 * Fetch all roles from the API
 */
export const fetchAllRoles = async (): Promise<Role[]> => {
  const result = await roleApi.getRoles();
  if (result.data) {
    console.log("All roles:", result.data);
    return result.data;
  } else {
    console.error("Error fetching roles:", result.error);
    throw new Error(result.error || "Failed to fetch roles");
  }
};

/**
 * Fetch a single role by ID
 */
export const fetchRoleById = async (roleId: string): Promise<Role> => {
  const result = await roleApi.getRoleById(roleId);
  if (result.data) {
    console.log("Role details:", result.data);
    return result.data;
  } else {
    console.error("Error fetching role:", result.error);
    throw new Error(result.error || "Failed to fetch role");
  }
};

/**
 * Update an existing role
 */
export const updateExistingRole = async (roleId: string, updateData: Partial<Omit<Role, 'id' | 'createdAt'>>) => {
  const result = await roleApi.updateRole(roleId, updateData);
  if (result.data) {
    console.log("Role updated successfully:", result.data);
    return result.data;
  } else {
    console.error("Error updating role:", result.error);
    throw new Error(result.error || "Failed to update role");
  }
};

/**
 * Delete a role by ID
 */
export const deleteRole = async (roleId: string): Promise<boolean> => {
  const result = await roleApi.deleteRole(roleId);
  if (result.success) {
    console.log("Role deleted successfully");
    return true;
  } else {
    console.error("Error deleting role:", result.error);
    throw new Error(result.error || "Failed to delete role");
  }
};

/**
 * Complete CRUD workflow example
 */
export const roleManagementExample = async () => {
  try {
    // 1. Create a new role
    const createResult = await createNewRole({
      name: "HR Admin",
      approvalAuthority: "Full Authority",
      dataVisibility: "All Employees",
      modules: {
        employees: { view: true, create: true, edit: true, approve: true },
        attendance: { view: true, create: false, edit: false, approve: true },
        payroll: { view: true, create: false, edit: false, approve: false }
      }
    });

    const newRoleId = createResult.id;
    console.log("Created role with ID:", newRoleId);

    // 2. Fetch the created role
    const fetchedRole = await fetchRoleById(newRoleId);
    console.log("Fetched role:", fetchedRole);

    // 3. Update the role
    const updatedRole = await updateExistingRole(newRoleId, {
      name: "Senior HR Admin",
      approvalAuthority: "Full Authority"
    });
    console.log("Updated role:", updatedRole);

    // 4. Fetch all roles to verify
    const allRoles = await fetchAllRoles();
    console.log("All roles after update:", allRoles);

    // 5. Delete the role (optional - uncomment if needed)
    // await deleteRole(newRoleId);

    return { created: createResult, updated: updatedRole, all: allRoles };

  } catch (error) {
    console.error("Role management error:", error);
    throw error;
  }
};

/**
 * Helper function to create role data matching your JSON structure
 */
export const createRoleData = (
  name: string,
  approvalAuthority: string,
  dataVisibility: string,
  modules: { [key: string]: ModulePermission }
): Omit<Role, 'id' | 'createdAt'> => {
  return {
    name,
    approvalAuthority,
    dataVisibility,
    modules
  };
};

// Example role data templates
export const ROLE_TEMPLATES = {
  admin: createRoleData(
    "admin",
    "Full Authority",
    "All Employees",
    {
      employees: { view: true, create: true, edit: true, approve: true }
    }
  ),
  manager: createRoleData(
    "Manager",
    "Department Level",
    "Department Employees",
    {
      employees: { view: true, create: true, edit: true, approve: false },
      attendance: { view: true, create: false, edit: false, approve: true }
    }
  ),
  employee: createRoleData(
    "Employee",
    "Self Only",
    "Self Only",
    {
      employees: { view: true, create: false, edit: false, approve: false },
      attendance: { view: true, create: false, edit: false, approve: false }
    }
  )
};
