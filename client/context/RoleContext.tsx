import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/lib/auth';

type RoleContextType = {
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasSubModuleAccess: (role: UserRole, module: string, subModule: string) => boolean;
  canPerformAction: (role: UserRole, module: string, action: string) => boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

type RoleProviderProps = {
  children: ReactNode;
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role));
  };

  const hasSubModuleAccess = (role: UserRole, module: string, subModule: string): boolean => {
    // Define sub-module permissions for each role
    const subModulePermissions: Record<UserRole, Record<string, string[]>> = {
      admin: { "*": ["*"] }, // Admin has access to all sub-modules
      employee: {
        payroll: ["payslips"], // Employees can only view their payslips
      },
      manager: {
        payroll: ["payslips"], // Managers can view payslips
      },
      hr: {
        payroll: ["payslips"], // HR can view payslips
      },
      finance: {
        payroll: ["*"], // Finance has access to all payroll sub-modules
      },
      "admin-delegate": {
        payroll: ["payslips"], // Admin delegates have limited access
      },
    };

    const rolePermissions = subModulePermissions[role];
    if (!rolePermissions) return false;

    // Check if role has access to all modules
    if (rolePermissions["*"] && rolePermissions["*"].includes("*")) return true;

    // Check if role has access to all sub-modules in the specified module
    const modulePermissions = rolePermissions[module];
    if (modulePermissions && modulePermissions.includes("*")) return true;

    // Check if role has access to the specific sub-module
    return modulePermissions ? modulePermissions.includes(subModule) : false;
  };

  const canPerformAction = (role: UserRole, module: string, action: string): boolean => {
    // Define action permissions for each role and module
    const actionPermissions: Record<UserRole, Record<string, string[]>> = {
      admin: { "*": ["*"] }, // Admin can perform all actions
      employee: {
        employees: ["view"], // Employees can only view their own profile
        attendance: ["view", "create"], // Can view and mark attendance
        leave: ["view", "create"], // Can view and apply for leave
        payroll: ["view"], // Can view their own payslips
        expenses: ["view", "create"], // Can view and create expense claims
        assets: ["view"], // Can view their assigned assets
      },
      manager: {
        employees: ["view"], // Can view team members
        attendance: ["view", "override"], // Can view and override attendance
        leave: ["view", "approve"], // Can view and approve leave
        payroll: ["view"], // Can view team payslips
        reports: ["view"], // Can view reports
      },
      hr: {
        employees: ["view", "create", "update", "delete"], // Full employee management
        attendance: ["view", "override"], // Can view and override attendance
        leave: ["view", "approve", "config"], // Full leave management
        payroll: ["view"], // Can view payslips
        assets: ["view", "create", "update"], // Asset management
        exit: ["view", "create", "update"], // Exit management
        reports: ["view"], // Can view reports
      },
      finance: {
        payroll: ["view", "create", "update"], // Full payroll management
        expenses: ["view", "approve"], // Can approve expense claims
        reports: ["view"], // Can view financial reports
      },
      "admin-delegate": {
        employees: ["view", "update"], // Limited employee management
        attendance: ["view"], // Can view attendance
        reports: ["view"], // Limited reports
      },
    };

    const roleActionPermissions = actionPermissions[role];
    if (!roleActionPermissions) return false;

    // Check if role has access to all modules and actions
    if (roleActionPermissions["*"] && roleActionPermissions["*"].includes("*")) return true;

    // Check if role has access to all actions in the specified module
    const moduleActions = roleActionPermissions[module];
    if (moduleActions && moduleActions.includes("*")) return true;

    // Check if role has access to the specific action
    return moduleActions ? moduleActions.includes(action) : false;
  };

  return (
    <RoleContext.Provider value={{ hasRole, hasAnyRole, hasSubModuleAccess, canPerformAction }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};