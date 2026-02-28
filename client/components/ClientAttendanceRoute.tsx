import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface ClientAttendanceRouteProps {
  children: React.ReactNode;
}

const ClientAttendanceRoute: React.FC<ClientAttendanceRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please login to continue</p>
        </div>
      </div>
    );
  }

  // Check if user is in Sales department
  const isSalesUser = user.roles?.some(role => role?.toLowerCase() === "sales") || 
                     user.department?.toLowerCase() === "sales";

  if (!isSalesUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Client Attendance is only available for Sales department users.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ClientAttendanceRoute;
