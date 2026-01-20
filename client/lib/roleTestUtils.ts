// Test utility to verify role-based module permissions
import { User } from "@/lib/auth";

interface RoleModulePermissions {
  [roleName: string]: {
    modules: string[];
    moduleDetails: {
      [moduleName: string]: {
        view: boolean;
        create: boolean;
        edit: boolean;
        approve: boolean;
      };
    };
  };
}

const roleModulePermissions: RoleModulePermissions = {
  Admin: {
    modules: [
      "employees",
      "payroll",
      "attendance",
      "leave",
      "expenses",
      "assets",
      "exit",
      "reports",
      "organization",
    ],
    moduleDetails: {
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
  },
  HR: {
    modules: [
      "employees",
      "payroll",
      "attendance",
      "leave",
      "expenses",
      "assets",
      "exit",
      "reports",
    ],
    moduleDetails: {
      employees: { view: true, create: true, edit: true, approve: false },
      payroll: { view: true, create: false, edit: false, approve: false },
      attendance: { view: true, create: false, edit: false, approve: false },
      leave: { view: true, create: false, edit: false, approve: true },
      expenses: { view: true, create: false, edit: false, approve: false },
      assets: { view: true, create: true, edit: true, approve: false },
      exit: { view: true, create: false, edit: false, approve: false },
      reports: { view: true, create: false, edit: false, approve: false },
    },
  },
  Manager: {
    modules: ["employees", "payroll", "attendance", "leave", "reports"],
    moduleDetails: {
      employees: { view: true, create: false, edit: false, approve: false },
      payroll: { view: true, create: false, edit: false, approve: false },
      attendance: { view: true, create: false, edit: false, approve: false },
      leave: { view: true, create: false, edit: false, approve: true },
      reports: { view: true, create: false, edit: false, approve: false },
    },
  },
  Finance: {
    modules: [
      "employees",
      "payroll",
      "expenses",
      "reports",
    ],
    moduleDetails: {
      employees: { view: true, create: false, edit: false, approve: false },
      payroll: { view: true, create: true, edit: true, approve: true },
      expenses: { view: true, create: false, edit: false, approve: true },
      reports: { view: true, create: false, edit: false, approve: false },
    },
  },
  Employee: {
    modules: [
      "attendance",
      "leave",
      "expenses",
      "assets",
    ],
    moduleDetails: {
      attendance: { view: true, create: true, edit: false, approve: false },
      leave: { view: true, create: true, edit: false, approve: false },
      expenses: { view: true, create: true, edit: true, approve: false },
      assets: { view: true, create: false, edit: false, approve: false },
    },
  },
};

/**
 * Get all modules accessible by a user based on their roles
 */
export const getAccessibleModules = (user: User): string[] => {
  const modules = new Set<string>();

  for (const role of user.roles) {
    const roleConfig = roleModulePermissions[capitalize(role)];
    if (roleConfig) {
      roleConfig.modules.forEach((module) => modules.add(module));
    }
  }

  return Array.from(modules).sort();
};

/**
 * Check if a user can access a specific module
 */
export const canAccessModule = (user: User, moduleName: string): boolean => {
  const accessibleModules = getAccessibleModules(user);
  return accessibleModules.includes(moduleName.toLowerCase());
};

/**
 * Get detailed module permissions for a user's role
 */
export const getRoleModuleDetails = (roleName: string) => {
  const normalized = capitalize(roleName);
  return roleModulePermissions[normalized] || null;
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debug function - log all roles and their module access
 */
export const debugRoleModuleAccess = () => {
  console.group("🔐 Role Module Access Summary");
  Object.entries(roleModulePermissions).forEach(([role, config]) => {
    console.group(`👤 ${role}`);
    console.log("Accessible Modules:", config.modules.length, config.modules);
    console.table(config.moduleDetails);
    console.groupEnd();
  });
  console.groupEnd();
};

/**
 * Auto-debug function that runs on component mount
 */
export const debugRoleAccessAuto = () => {
  if (typeof window !== "undefined" && (window as any).__DEBUG_ROLES__) {
    debugRoleModuleAccess();
  }
};
