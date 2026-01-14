import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/lib/auth";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredModule?: string;
  requiredAction?: string;
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredModule,
  requiredAction,
  fallbackPath = "/dashboard",
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

  // Check role-based access if roles are specified
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check module-based access if module is specified
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check action-based access if both module and action are specified
  if (requiredModule && requiredAction && !canPerformModuleAction(requiredModule, requiredAction)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Render children if user has access
  return <>{children}</>;
};

// Higher-order component for specific role checks
export const withRoleAccess = (
  Component: React.ComponentType<any>,
  options: {
    allowedRoles?: UserRole[];
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
