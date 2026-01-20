import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/lib/auth';

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
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasSubModuleAccess: (role: UserRole, module: string, subModule: string) => boolean;
  canPerformAction: (role: UserRole, module: string, action: string) => boolean;
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
        const response = await fetch('/api/role', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch roles:', response.status, response.statusText);
          setUserRoles([]);
          setLoading(false);
          return;
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Role API returned non-JSON response:', contentType);
          const text = await response.text();
          console.error('Response text:', text.substring(0, 200));
          setUserRoles([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
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
              "shift management": { view: 1, create: 0, edit: 0, approve: 0 },
              "leave": { view: 1, create: 1, edit: 0, approve: 0 },
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
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role));
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
      
      // Try exact match first
      let modulePermission = role.modules[module];
      
      // If not found, try lowercase version
      if (!modulePermission) {
        modulePermission = role.modules[module.toLowerCase()];
      }
      
      // If still not found, try some common variations
      if (!modulePermission) {
        const variations = {
          'shiftmanagement': 'shift management',
          'shift': 'shift management',
          'organization': 'organization',
          'organisation': 'organization',
        };
        const variationKey = variations[module.toLowerCase()];
        if (variationKey) {
          modulePermission = role.modules[variationKey];
        }
      }
      
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
      
      // Try exact match first
      let modulePermission = role.modules[module];
      
      // If not found, try lowercase version
      if (!modulePermission) {
        modulePermission = role.modules[module.toLowerCase()];
      }
      
      // If still not found, try some common variations
      if (!modulePermission) {
        const variations = {
          'shiftmanagement': 'shift management',
          'shift': 'shift management',
          'organization': 'organization',
          'organisation': 'organization',
        };
        const variationKey = variations[module.toLowerCase()];
        if (variationKey) {
          modulePermission = role.modules[variationKey];
        }
      }
      
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
  const hasSubModuleAccess = (role: UserRole, module: string, subModule: string): boolean => {
    // For now, delegate to module access check
    return hasModuleAccess(module);
  };

  const canPerformAction = (role: UserRole, module: string, action: string): boolean => {
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