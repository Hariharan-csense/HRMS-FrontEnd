import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

interface ClientAttendanceRouteProps {
  children: React.ReactNode;
}

const ClientAttendanceRoute: React.FC<ClientAttendanceRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { canPerformModuleAction, loading: roleLoading } = useRole();

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

  const hasAccess = canPerformModuleAction("client_attendance", "view");

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

export default ClientAttendanceRoute;
