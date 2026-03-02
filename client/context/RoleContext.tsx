import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../lib/endpoint';
import { ENDPOINTS } from '../lib/endpoint';

interface ModulePermission {
  view: number;
  create: number;
  update: number;
  delete: number;
  approve: number;
  reject: number;
  edit?: number;
}

interface ModulePermissionNode {
  permissions: ModulePermission;
  submodules?: Record<string, { permissions: ModulePermission }>;
}

interface RoleData {
  id: string;
  role_id: string;
  name: string;
  approval_authority: string;
  data_visibility: string;
  modules: Record<string, ModulePermission | ModulePermissionNode>;
  description?: string;
}

type RoleContextType = {
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasSubModuleAccess: (role: string, module: string, subModule: string) => boolean;
  canPerformAction: (role: string, module: string, action: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  canPerformModuleAction: (module: string, action: string, subModule?: string) => boolean;
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

  const hasAnyUserRole = (...wantedRoles: string[]) => {
    const wanted = new Set(wantedRoles.map((r) => r.toLowerCase()));
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const primaryRole = user?.role ? [user.role] : [];
    const allRoles = [...roles, ...primaryRole].map((r) => String(r || "").toLowerCase());
    return allRoles.some((r) => wanted.has(r));
  };

  // Fetch user roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      // Superadmin does not belong to a single company; skip company-scoped roles API.
      const isSuperAdmin = hasAnyUserRole("superadmin") || user.type?.toLowerCase() === "superadmin";
      if (isSuperAdmin) {
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
        // Strict RBAC behavior: never grant fallback permissions when API fails.
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user?.id]);

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const wanted = String(role || "").trim().toLowerCase();
    const allRoles = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      user.role,
    ]
      .map((r) => String(r || "").trim().toLowerCase())
      .filter(Boolean);
    return allRoles.includes(wanted);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !roles?.length) return false;
    const wanted = new Set(roles.map((r) => String(r || "").trim().toLowerCase()));
    const allRoles = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      user.role,
    ]
      .map((r) => String(r || "").trim().toLowerCase())
      .filter(Boolean);
    return allRoles.some((r) => wanted.has(r));
  };

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, "");

  const normalizeAction = (action: string) => {
    const normalized = action.toLowerCase();
    return normalized === "edit" ? "update" : normalized;
  };

  const normalizePermission = (rawPermission: any): ModulePermission => {
    const updateValue =
      rawPermission?.update !== undefined ? rawPermission.update : rawPermission?.edit;

    return {
      view: rawPermission?.view ? 1 : 0,
      create: rawPermission?.create ? 1 : 0,
      update: updateValue ? 1 : 0,
      delete: rawPermission?.delete ? 1 : 0,
      approve: rawPermission?.approve ? 1 : 0,
      reject: rawPermission?.reject ? 1 : 0,
      edit: updateValue ? 1 : 0,
    };
  };

  const getMatchingKey = (obj: Record<string, any>, wanted: string) => {
    if (!obj) return undefined;
    if (obj[wanted]) return wanted;
    if (obj[wanted.toLowerCase()]) return wanted.toLowerCase();

    const wantedNormalized = normalizeKey(wanted);
    return Object.keys(obj).find((key) => normalizeKey(key) === wantedNormalized);
  };

  const resolveModulePermission = (
    modules: Record<string, ModulePermission | ModulePermissionNode>,
    module: string,
    subModule?: string
  ) => {
    const moduleKey = getMatchingKey(modules as Record<string, any>, module);
    if (!moduleKey) return undefined;

    const moduleEntry: any = modules[moduleKey];
    if (!moduleEntry || typeof moduleEntry !== "object") return undefined;

    // New shape: { permissions, submodules }
    if (moduleEntry.permissions && typeof moduleEntry.permissions === "object") {
      if (subModule && moduleEntry.submodules && typeof moduleEntry.submodules === "object") {
        const subKey = getMatchingKey(moduleEntry.submodules, subModule);
        if (subKey && moduleEntry.submodules[subKey]?.permissions) {
          return normalizePermission(moduleEntry.submodules[subKey].permissions);
        }
      }

      return normalizePermission(moduleEntry.permissions);
    }

    // Legacy shape: module directly contains action flags
    return normalizePermission(moduleEntry);
  };

  // Check if user has access to a specific module based on their role permissions
  const hasModuleAccess = (module: string): boolean => {
    if (hasAnyUserRole("superadmin") || user?.type?.toLowerCase() === "superadmin") {
      return true;
    }

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
      
      const modulePermission = resolveModulePermission(role.modules, module);
      
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
  const canPerformModuleAction = (module: string, action: string, subModule?: string): boolean => {
    if (hasAnyUserRole("superadmin") || user?.type?.toLowerCase() === "superadmin") {
      return true;
    }

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
      
      const modulePermission = resolveModulePermission(role.modules, module, subModule);
      
      if (!modulePermission) return false;
      
      switch (normalizeAction(action)) {
        case 'view':
          return modulePermission.view === 1;
        case 'create':
          return modulePermission.create === 1;
        case 'update':
          return modulePermission.update === 1 || modulePermission.edit === 1;
        case 'delete':
          return modulePermission.delete === 1;
        case 'approve':
          return modulePermission.approve === 1;
        case 'reject':
          return modulePermission.reject === 1;
        default:
          return false;
      }
    });
  };

  // Legacy functions for backward compatibility
  const hasSubModuleAccess = (role: string, module: string, subModule: string): boolean => {
    return canPerformModuleAction(module, "view", subModule);
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
