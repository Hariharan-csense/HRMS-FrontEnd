/**
 * Permission utilities for role-based access control
 * Used to check if a user has permission to perform actions on modules
 */

import { User } from "./auth";

export type Permission = "view" | "create" | "edit" | "approve";

export type ModulePermissions = {
  [key: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
  };
};

// Role permissions mapping - must be kept in sync with RoleContext.tsx
export const rolePermissions: Record<string, ModulePermissions> = {
  Admin: {
    employees: { view: true, create: true, edit: true, approve: true },
    payroll: { view: true, create: true, edit: true, approve: true },
    attendance: { view: true, create: true, edit: true, approve: true },
    leave: { view: true, create: true, edit: true, approve: true },
    expenses: { view: true, create: true, edit: true, approve: true },
    assets: { view: true, create: true, edit: true, approve: true },
    exit: { view: true, create: true, edit: true, approve: true },
    reports: { view: true, create: true, edit: true, approve: true },
    organization: { view: true, create: true, edit: true, approve: true },
  },
  "HR Manager": {
    employees: { view: true, create: true, edit: true, approve: false },
    payroll: { view: true, create: false, edit: false, approve: false },
    attendance: { view: true, create: false, edit: false, approve: false },
    leave: { view: true, create: false, edit: false, approve: true },
    expenses: { view: true, create: false, edit: false, approve: false },
    assets: { view: true, create: true, edit: true, approve: false },
    exit: { view: true, create: false, edit: false, approve: false },
    reports: { view: true, create: false, edit: false, approve: false },
    organization: { view: false, create: false, edit: false, approve: false },
  },
  Manager: {
    employees: { view: true, create: false, edit: false, approve: false },
    payroll: { view: true, create: false, edit: false, approve: false },
    attendance: { view: true, create: false, edit: false, approve: false },
    leave: { view: true, create: false, edit: false, approve: true },
    expenses: { view: false, create: false, edit: false, approve: false },
    assets: { view: false, create: false, edit: false, approve: false },
    exit: { view: false, create: false, edit: false, approve: false },
    reports: { view: true, create: false, edit: false, approve: false },
    organization: { view: false, create: false, edit: false, approve: false },
  },
  Finance: {
    employees: { view: true, create: false, edit: false, approve: false },
    payroll: { view: true, create: true, edit: true, approve: true },
    attendance: { view: false, create: false, edit: false, approve: false },
    leave: { view: false, create: false, edit: false, approve: false },
    expenses: { view: true, create: false, edit: false, approve: true },
    assets: { view: false, create: false, edit: false, approve: false },
    exit: { view: false, create: false, edit: false, approve: false },
    reports: { view: true, create: false, edit: false, approve: false },
    organization: { view: false, create: false, edit: false, approve: false },
  },
  Employee: {
    employees: { view: false, create: false, edit: false, approve: false },
    payroll: { view: true, create: false, edit: false, approve: false },
    attendance: { view: true, create: true, edit: false, approve: false },
    leave: { view: true, create: true, edit: false, approve: false },
    expenses: { view: true, create: true, edit: true, approve: false },
    assets: { view: true, create: false, edit: false, approve: false },
    exit: { view: false, create: false, edit: false, approve: false },
    reports: { view: false, create: false, edit: false, approve: false },
    organization: { view: false, create: false, edit: false, approve: false },
  },
};

/**
 * Check if user can perform an action on a module
 * @param user The user object
 * @param module The module name (e.g., 'employees', 'leave', 'expenses')
 * @param action The action to check (view, create, edit, approve)
 * @returns true if user has permission, false otherwise
 */
export const canUserPerformAction = (
  user: User | null,
  module: string,
  action: Permission
): boolean => {
  if (!user) return false;

  // Get user's primary role
  const userRole = user.roles[0];
  if (!userRole) return false;

  // Capitalize role name for lookup
  const roleName =
    userRole.charAt(0).toUpperCase() + userRole.slice(1).replace("-", " ");

  const rolePerms = rolePermissions[roleName];
  if (!rolePerms) return false;

  const modulePerms = rolePerms[module.toLowerCase()];
  if (!modulePerms) return false;

  return modulePerms[action] || false;
};

/**
 * Check if user has view access to a module
 */
export const canUserViewModule = (user: User | null, module: string): boolean => {
  return canUserPerformAction(user, module, "view");
};

/**
 * Check if user can create items in a module
 */
export const canUserCreateItem = (user: User | null, module: string): boolean => {
  return canUserPerformAction(user, module, "create");
};

/**
 * Check if user can edit items in a module
 */
export const canUserEditItem = (user: User | null, module: string): boolean => {
  return canUserPerformAction(user, module, "edit");
};

/**
 * Check if user can approve items in a module
 */
export const canUserApproveItem = (user: User | null, module: string): boolean => {
  return canUserPerformAction(user, module, "approve");
};
