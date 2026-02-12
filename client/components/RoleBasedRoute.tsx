import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredModule?: string;
  requiredAction?: string;
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredModule,
  requiredAction,
  fallbackPath,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole, hasModuleAccess, canPerformModuleAction, loading: roleLoading } = useRole();

  // Show loading while checking authentication
  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check module-based access control
  if (requiredModule) {
    // If specific action is required, check for that action
    if (requiredAction) {
      if (!canPerformModuleAction(requiredModule, requiredAction)) {
        // If a fallback path is provided, navigate there; otherwise show a not-authorized message
        return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Not authorized</h2>
              <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
            </div>
          </div>
        );
      }
    } else {
      // Otherwise, just check for view access
      if (!hasModuleAccess(requiredModule)) {
        return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Not authorized</h2>
              <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
            </div>
          </div>
        );
      }
    }
  }

  // Check role-based access control (legacy support)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Not authorized</h2>
            <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Higher-order component for specific role checks
export const withRoleAccess = (
  Component: React.ComponentType<any>,
  options: {
    allowedRoles?: string[];
    requiredModule?: string;
    requiredAction?: string;
    fallbackPath?: string;
  }
) => {
  return (props: any) => (
    <RoleBasedRoute {...options}>
      <Component {...props} />
    </RoleBasedRoute>
  );
};

// Module-based protection components
export const withModuleAccess = (
  Component: React.ComponentType<any>,
  module: string,
  action?: string
) => {
  return withRoleAccess(Component, { requiredModule: module, requiredAction: action });
};
