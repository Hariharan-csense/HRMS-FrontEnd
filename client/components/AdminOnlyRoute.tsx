import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { canPerformModuleAction, loading: roleLoading } = useRole();
  const location = useLocation();

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please login to continue</p>
        </div>
      </div>
    );
  }

  const moduleForPath = (() => {
    if (location.pathname.startsWith("/tickets")) return "tickets";
    if (location.pathname.startsWith("/client-attendance-admin")) return "client_attendance_admin";
    if (location.pathname.startsWith("/sales-attendance-report")) return "client_attendance_admin";
    if (location.pathname.startsWith("/client-geo-fence")) return "client_attendance_admin";
    if (location.pathname.startsWith("/client-assignment")) return "client_attendance";
    if (location.pathname.startsWith("/subscription")) return "role_access";
    return null;
  })();

  const hasAccess = moduleForPath
    ? canPerformModuleAction(moduleForPath, "view")
    : false;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminOnlyRoute;
