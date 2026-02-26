import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../lib/endpoint';
import { ENDPOINTS } from '../lib/endpoint';

interface ModulePermission {
  view: number;
  create: number;
  edit: number;
  approve: number;
}

interface RoleData {
  id: string;
  role_id: string;
  name: string;
  approval_authority: string;
  data_visibility: string;
  modules: Record<string, ModulePermission>;
  description?: string;
}

type RoleContextType = {
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasSubModuleAccess: (role: string, module: string, subModule: string) => boolean;
  canPerformAction: (role: string, module: string, action: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  canPerformModuleAction: (module: string, action: string) => boolean;
  userRoles: RoleData[];
  loading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

type RoleProviderProps = {
  children: ReactNode;
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      try {
        const response = await ENDPOINTS.getRoles();
        const data = response.data;
        console.log('Role API response:', data);
        setUserRoles(data.roles || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Fallback to mock role data for development
        const mockRoles = [
          {
            id: "4",
            role_id: "ROLE001",
            name: "admin",
            approval_authority: "Full Authority",
            data_visibility: "All Employees",
            modules: {
              "employees": { view: 1, create: 1, edit: 1, approve: 1 },
              "payroll": { view: 1, create: 1, edit: 1, approve: 1 },
              "attendance": { view: 1, create: 1, edit: 1, approve: 1 },
              "live_tracking": { view: 1, create: 1, edit: 1, approve: 1 },
              "leave": { view: 1, create: 1, edit: 1, approve: 1 },
              "expenses": { view: 1, create: 0, edit: 0, approve: 1 },
              "assets": { view: 1, create: 1, edit: 1, approve: 1 },
              "exit": { view: 1, create: 1, edit: 1, approve: 1 },
              "reports": { view: 1, create: 0, edit: 0, approve: 0 },
              "organization": { view: 1, create: 1, edit: 1, approve: 1 },
              "role_access": { view: 1, create: 1, edit: 1, approve: 1 },
              "shift management": { view: 1, create: 1, edit: 1, approve: 1 }
            },
            description: null,
            created_at: "2025-12-31T04:24:38.000Z",
            updated_at: "2026-01-13T07:13:16.000Z"
          },
          {
            id: "6",
            role_id: "ROLE02",
            name: "employee",
            approval_authority: "No Authority",
            data_visibility: "Self Only",
            modules: {
              "employees": { view: 1, create: 0, edit: 0, approve: 0 },
              "payroll": { view: 1, create: 0, edit: 0, approve: 0 },
              "attendance": { view: 1, create: 0, edit: 1, approve: 0 },
              "live_tracking": { view: 0, create: 0, edit: 0, approve: 0 },
              "leave": { view: 1, create: 1, edit: 0, approve: 0 },
              "expenses": { view: 0, create: 0, edit: 0, approve: 0 },
              "assets": { view: 0, create: 0, edit: 0, approve: 0 },
              "role_access": { view: 1, create: 0, edit: 0, approve: 0 }
            },
            description: null,
            created_at: "2026-01-06T06:15:42.000Z",
            updated_at: "2026-01-06T06:22:14.000Z"
          },
          {
            id: "5",
            role_id: "ROLE01",
            name: "hr",
            approval_authority: "Full Authority",
            data_visibility: "Department Employees",
            modules: {
              "employees": { view: 1, create: 0, edit: 0, approve: 0 },
              "payroll": { view: 1, create: 0, edit: 0, approve: 0 },
              "attendance": { view: 1, create: 1, edit: 0, approve: 0 },
              "live_tracking": { view: 0, create: 0, edit: 0, approve: 0 },
              "shift management": { view: 1, create: 0, edit: 0, approve: 0 },
              "leave": { view: 1, create: 1, edit: 0, approve: 1 },
              "expenses": { view: 1, create: 0, edit: 0, approve: 0 },
              "assets": { view: 0, create: 0, edit: 0, approve: 0 },
              "exit": { view: 1, create: 0, edit: 0, approve: 0 },
              "reports": { view: 1, create: 0, edit: 0, approve: 0 }
            },
            description: null,
            created_at: "2025-12-31T05:24:37.000Z",
            updated_at: "2026-01-13T12:03:53.000Z"
          }
        ];
        setUserRoles(mockRoles);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user?.id]);

  const hasRole = (role: string): boolean => {
    if (!user?.roles) return false;
    const wanted = role.toLowerCase();
    return user.roles.some((r) => r?.toLowerCase() === wanted);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    const wanted = new Set(roles.map((r) => r.toLowerCase()));
    return user.roles.some((r) => wanted.has(r?.toLowerCase()));
  };

  const getModulePermission = (modules: Record<string, ModulePermission>, module: string) => {
    // Try exact and lowercase keys first
    const direct = modules[module] || modules[module.toLowerCase()];
    if (direct) return direct;

    // Normalize separators to handle keys like shift_management / shift management / shift-management
    const normalize = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");
    const target = normalize(module);
    const matchedKey = Object.keys(modules).find((key) => normalize(key) === target);
    return matchedKey ? modules[matchedKey] : undefined;
  };

  // Check if user has access to a specific module based on their role permissions
  const hasModuleAccess = (module: string): boolean => {
    if (!user?.roles || userRoles.length === 0) return false;
    
    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("hasModuleAccess Debug:", {
        userRoles: user.roles,
        availableRoles: userRoles.map(r => r.name),
        module,
        userRolesData: userRoles
      });
    }
    
    // Check if any of the user's roles has access to this module
    return userRoles.some(role => {
      // Check if user has this role assigned (case-insensitive match)
      const userHasRole = user.roles.some(userRole => 
        userRole.toLowerCase() === role.name.toLowerCase()
      );
      
      if (!userHasRole) {
        return false;
      }
      
      const modulePermission = getModulePermission(role.modules, module);
      
      const hasAccess = modulePermission && modulePermission.view === 1;
      
      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log(`Role ${role.name} access to ${module}:`, {
          userHasRole,
          modulePermission,
          hasAccess,
          availableModules: Object.keys(role.modules)
        });
      }
      
      return hasAccess;
    });
  };

  // Check if user can perform a specific action on a module
  const canPerformModuleAction = (module: string, action: string): boolean => {
    if (!user?.roles || userRoles.length === 0) return false;
    
    // Check if any of the user's roles has permission for this action
    return userRoles.some(role => {
      // Check if user has this role assigned (case-insensitive match)
      const userHasRole = user.roles.some(userRole => 
        userRole.toLowerCase() === role.name.toLowerCase()
      );
      
      if (!userHasRole) {
        return false;
      }
      
      const modulePermission = getModulePermission(role.modules, module);
      
      if (!modulePermission) return false;
      
      switch (action) {
        case 'view':
          return modulePermission.view === 1;
        case 'create':
          return modulePermission.create === 1;
        case 'edit':
          return modulePermission.edit === 1;
        case 'approve':
          return modulePermission.approve === 1;
        default:
          return false;
      }
    });
  };

  // Legacy functions for backward compatibility
  const hasSubModuleAccess = (role: string, module: string, subModule: string): boolean => {
    // For now, delegate to module access check
    return hasModuleAccess(module);
  };

  const canPerformAction = (role: string, module: string, action: string): boolean => {
    // For now, delegate to module action check
    return canPerformModuleAction(module, action);
  };

  return (
    <RoleContext.Provider value={{ 
      hasRole, 
      hasAnyRole, 
      hasSubModuleAccess, 
      canPerformAction,
      hasModuleAccess,
      canPerformModuleAction,
      userRoles,
      loading
    }}>
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
