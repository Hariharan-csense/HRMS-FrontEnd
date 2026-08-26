import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { BASE_URL } from "../lib/endpoint";
import { ENDPOINTS } from "../lib/endpoint";

type PermissionValue = number | boolean | string | null | undefined;

interface ModulePermission {
  view: PermissionValue;
  create: PermissionValue;
  update: PermissionValue;
  delete: PermissionValue;
  approve: PermissionValue;
  reject: PermissionValue;
  edit?: PermissionValue;
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
  hasSubModuleAccess: (
    role: string,
    module: string,
    subModule: string,
  ) => boolean;
  canPerformAction: (role: string, module: string, action: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  canPerformModuleAction: (
    module: string,
    action: string,
    subModule?: string,
  ) => boolean;
  userRoles: RoleData[];
  userRoleNames: string[];
  loading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

type RoleProviderProps = {
  children: ReactNode;
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<RoleData[]>([]);
  const [effectiveRoleNames, setEffectiveRoleNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const normalizeRoleIdentifier = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  // Role data has historically been stored as MySQL 0/1 values, JSON
  // booleans, and occasionally string values. Treat all enabled forms alike.
  const isPermissionEnabled = (value: PermissionValue): boolean =>
    value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";

  const hasAnyUserRole = (...wantedRoles: string[]) => {
    const wanted = new Set(wantedRoles.map((r) => normalizeRoleIdentifier(r)));
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const primaryRole = user?.role ? [user.role] : [];
    const userType = user?.type ? [user.type] : [];
    const allRoles = [...roles, ...primaryRole, ...userType].map((r) =>
      normalizeRoleIdentifier(r),
    );
    return allRoles.some((r) => wanted.has(r));
  };

  const shouldShowRoleAccessDebug =
    process.env.NODE_ENV === "development" && hasAnyUserRole("admin", "ceo");

  const getNormalizedUserRoleNames = (): string[] => {
    const roleSet = new Set<string>();
    const primaryRole = normalizeRoleIdentifier(user?.role);
    const sourceRoles = effectiveRoleNames.length
      ? effectiveRoleNames
      : String(user?.type || "").toLowerCase() === "employee"
        ? [user?.role]
        : [
            ...(Array.isArray(user?.roles) ? user.roles : []),
            user?.role,
            user?.type,
          ];

    sourceRoles.forEach((roleName) => {
        const normalized = normalizeRoleIdentifier(roleName);
        if (normalized) roleSet.add(normalized);
    });

    const systemRoles = new Set(["employee", "admin", "ceo", "superadmin"]);
    const roles = [...roleSet];
    const customRoles = roles.filter((role) => !systemRoles.has(role));
    if (customRoles.length > 0) {
      // An assigned custom role is authoritative. Do not retain a system-role
      // identity (employee/admin/CEO) alongside it, otherwise UI permission
      // checks can accidentally inherit unrestricted system-role access.
      return customRoles;
    }

    return roles;
  };

  const isTopAuthority = () => {
    const roles = getNormalizedUserRoleNames();
    return roles.includes("superadmin");
  };

  const hasDefaultAdminModuleAccess = (
    module: string,
    subModule?: string,
  ): boolean => {
    // Saved role permissions are authoritative for company users, including
    // Admin and CEO. Only the platform Superadmin bypasses company RBAC.
    return false;
  };

  const fetchRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setEffectiveRoleNames([]);
        setLoading(false);
        return;
      }

      // Superadmin does not belong to a single company; skip company-scoped roles API.
      const isSuperAdmin =
        hasAnyUserRole("superadmin") ||
        user.type?.toLowerCase() === "superadmin";
      if (isSuperAdmin) {
        setUserRoles([]);
        setEffectiveRoleNames([]);
        setLoading(false);
        return;
      }

      try {
        const response = await ENDPOINTS.getRoles();
        const data = response.data;
        if (shouldShowRoleAccessDebug) {
          // console.log('Role API response:', data);
        }
        setUserRoles(data.roles || []);
        setEffectiveRoleNames(
          Array.isArray(data.currentUserRoles) ? data.currentUserRoles : [],
        );
      } catch (error) {
        console.error("Error fetching roles:", error);
        // Strict RBAC behavior: never grant fallback permissions when API fails.
        setUserRoles([]);
        setEffectiveRoleNames([]);
      } finally {
        setLoading(false);
      }
  };

  // Fetch user roles from backend, and refresh on RBAC updates
  useEffect(() => {
    void fetchRoles();

    const onRolesUpdated = () => {
      void fetchRoles();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("rbac:roles-updated", onRolesUpdated as any);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("rbac:roles-updated", onRolesUpdated as any);
      }
    };
  }, [user?.id]);

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const wanted = normalizeRoleIdentifier(role);
    const allRoles = getNormalizedUserRoleNames();
    return allRoles.includes(wanted);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !roles?.length) return false;
    const wanted = new Set(roles.map((r) => normalizeRoleIdentifier(r)));
    const allRoles = getNormalizedUserRoleNames();
    return allRoles.some((r) => wanted.has(r));
  };

  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/[\s_-]+/g, "");

  const normalizeAction = (action: string) => {
    const normalized = action.toLowerCase();
    return normalized === "edit" ? "update" : normalized;
  };

  const normalizePermission = (rawPermission: any): ModulePermission => {
    const updateValue =
      rawPermission?.update !== undefined
        ? rawPermission.update
        : rawPermission?.edit;

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
    return Object.keys(obj).find(
      (key) => normalizeKey(key) === wantedNormalized,
    );
  };

  const resolveModulePermission = (
    modules: Record<string, ModulePermission | ModulePermissionNode>,
    module: string,
    subModule?: string,
  ) => {
    const moduleKey = getMatchingKey(modules as Record<string, any>, module);
    if (!moduleKey) return undefined;

    const moduleEntry: any = modules[moduleKey];
    if (!moduleEntry || typeof moduleEntry !== "object") return undefined;

    // New shape: { permissions, submodules }
    if (
      moduleEntry.permissions &&
      typeof moduleEntry.permissions === "object"
    ) {
      // If submodule is requested, only check that exact submodule permission.
      // Falling back to module-level permissions makes every child visible when
      // only the parent module view is enabled.
      if (subModule) {
        if (
          !moduleEntry.submodules ||
          typeof moduleEntry.submodules !== "object"
        ) {
          return undefined;
        }
        const subKey = getMatchingKey(moduleEntry.submodules, subModule);
        if (subKey && moduleEntry.submodules[subKey]?.permissions) {
          return normalizePermission(
            moduleEntry.submodules[subKey].permissions,
          );
        }
        return undefined;
      }

      return normalizePermission(moduleEntry.permissions);
    }

    if (subModule) return undefined;

    // Legacy shape: module directly contains action flags
    return normalizePermission(moduleEntry);
  };

  // Check if user has access to a specific module based on their role permissions
  const hasModuleAccess = (module: string): boolean => {
    if (isTopAuthority()) {
      return true;
    }

    if (hasDefaultAdminModuleAccess(module)) {
      return true;
    }

    if (userRoles.length === 0) return false;

    const normalizedUserRoleNames = getNormalizedUserRoleNames();

    // Debug logging
    if (shouldShowRoleAccessDebug) {
      // console.log("hasModuleAccess Debug:", {
      //   userRoles: user.roles,
      //   availableRoles: userRoles.map(r => r.name),
      //   module,
      //   userRolesData: userRoles
      // });
    }

    // Check if any of the user's roles has access to this module
    return userRoles.some((role) => {
      // Check if user has this role assigned (case-insensitive match)
      const userHasRole = normalizedUserRoleNames.some(
        (userRole) => userRole === normalizeRoleIdentifier(role.name),
      );

      if (!userHasRole) {
        return false;
      }

      const modulePermission = resolveModulePermission(role.modules, module);

      const hasAccess = Boolean(
        modulePermission && isPermissionEnabled(modulePermission.view),
      );

      // Debug logging
      if (shouldShowRoleAccessDebug) {
        // console.log(`Role ${role.name} access to ${module}:`, {
        //   userHasRole,
        //   modulePermission,
        //   hasAccess,
        //   availableModules: Object.keys(role.modules)
        // });
      }

      return hasAccess;
    });
  };

  // Check if user can perform a specific action on a module
  const canPerformModuleAction = (
    module: string,
    action: string,
    subModule?: string,
  ): boolean => {
    if (isTopAuthority()) {
      return true;
    }

    if (hasDefaultAdminModuleAccess(module, subModule)) {
      return true;
    }

    if (userRoles.length === 0) return false;

    const normalizedUserRoleNames = getNormalizedUserRoleNames();
    const normalizedModule = String(module || "").toLowerCase();
    const normalizedSubModule = String(subModule || "").toLowerCase();

    // Debug logging for ESSL Setup
    if (
      shouldShowRoleAccessDebug &&
      normalizedModule === "attendance" &&
      normalizedSubModule === "setup"
    ) {
      // console.log("canPerformModuleAction Debug for ESSL Setup:", {
      //   module,
      //   action,
      //   subModule,
      //   normalizedModule,
      //   normalizedSubModule,
      //   userRoles: userRoles.map(r => ({ name: r.name, modules: r.modules })),
      //   normalizedUserRoleNames
      // });
    }

    // Check if any of the user's roles has permission for this action
    return userRoles.some((role) => {
      // Check if user has this role assigned (case-insensitive match)
      const userHasRole = normalizedUserRoleNames.some(
        (userRole) => userRole === normalizeRoleIdentifier(role.name),
      );

      if (!userHasRole) {
        return false;
      }

      const modulePermission = resolveModulePermission(
        role.modules,
        module,
        subModule,
      );

      // Debug logging for ESSL Setup
      if (
        shouldShowRoleAccessDebug &&
        normalizedModule === "attendance" &&
        normalizedSubModule === "setup"
      ) {
        // console.log("ESSL Setup Permission Check for role:", role.name, {
        //   userHasRole,
        //   modulePermission,
        //   hasAccess: modulePermission?.view === 1
        // });
      }

      if (!modulePermission) return false;

      switch (normalizeAction(action)) {
        case "view":
          return isPermissionEnabled(modulePermission.view);
        case "create":
          return isPermissionEnabled(modulePermission.create);
        case "update":
          return (
            isPermissionEnabled(modulePermission.update) ||
            isPermissionEnabled(modulePermission.edit)
          );
        case "delete":
          return isPermissionEnabled(modulePermission.delete);
        case "approve":
          return isPermissionEnabled(modulePermission.approve);
        case "reject":
          return isPermissionEnabled(modulePermission.reject);
        default:
          return false;
      }
    });
  };

  // Legacy functions for backward compatibility
  const hasSubModuleAccess = (
    role: string,
    module: string,
    subModule: string,
  ): boolean => {
    return canPerformModuleAction(module, "view", subModule);
  };

  const canPerformAction = (
    role: string,
    module: string,
    action: string,
  ): boolean => {
    // For now, delegate to module action check
    return canPerformModuleAction(module, action);
  };

  return (
    <RoleContext.Provider
      value={{
        hasRole,
        hasAnyRole,
        hasSubModuleAccess,
        canPerformAction,
        hasModuleAccess,
        canPerformModuleAction,
        userRoles,
        userRoleNames: getNormalizedUserRoleNames(),
        loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
