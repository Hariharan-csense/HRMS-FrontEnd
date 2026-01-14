import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { UserRole } from "@/lib/auth";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/dashboard",
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole } = useRole();

  // Show loading while checking authentication
  if (isLoading) {
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

  // Check if user has any of the required roles
  const hasAccess = hasAnyRole(allowedRoles);

  // Redirect to fallback path if user doesn't have access
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Render children if user has access
  return <>{children}</>;
};

// Higher-order component for specific role checks
export const withRoleAccess = (
  Component: React.ComponentType<any>,
  allowedRoles: UserRole[]
) => {
  return (props: any) => (
    <RoleBasedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </RoleBasedRoute>
  );
};
