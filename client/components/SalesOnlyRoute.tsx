import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface SalesOnlyRouteProps {
  children: React.ReactNode;
}

const SalesOnlyRoute: React.FC<SalesOnlyRouteProps> = ({ children }) => {
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

  const isSalesDept = user.department?.toLowerCase() === "sales";
  const hasSalesRole = user.roles?.some(role => role?.toLowerCase() === "sales");

  if (!isSalesDept || !hasSalesRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">This page is restricted to Sales department users only.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SalesOnlyRoute;
