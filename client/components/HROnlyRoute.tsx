import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

interface HROnlyRouteProps {
  children: React.ReactNode;
}

const HROnlyRoute: React.FC<HROnlyRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has HR role or HR module access
  const hasHRRole = user?.roles?.some(role => 
    role?.toLowerCase() === 'hr' || 
    role?.toLowerCase() === 'human resources' ||
    role?.toLowerCase() === 'hr manager'
  );

  const hasHRModuleAccess = canPerformModuleAction("hr_management", "view");

  // Grant access if user has HR role or HR module access
  if (hasHRRole || hasHRModuleAccess) {
    return <>{children}</>;
  }

  // Redirect to dashboard if not authorized
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access HR modules.</p>
        <p className="text-sm text-gray-500 mb-4">This area is restricted to HR personnel only.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default HROnlyRoute;
