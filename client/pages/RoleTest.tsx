import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

const RoleTest: React.FC = () => {
  const { user } = useAuth();
  const { userRoles, loading, hasModuleAccess, canPerformModuleAction } = useRole();

  if (loading) {
    return <div>Loading roles...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Role Debug Information</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">User Information:</h3>
          <pre className="text-sm bg-white p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Fetched Roles:</h3>
          <pre className="text-sm bg-white p-2 rounded">
            {JSON.stringify(userRoles, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Module Access Tests:</h3>
          <div className="space-y-2">
            {['employees', 'payroll', 'attendance', 'leave', 'expenses', 'assets', 'exit', 'reports', 'organization', 'shift management'].map(module => (
              <div key={module} className="flex justify-between items-center bg-white p-2 rounded">
                <span className="font-medium">{module}:</span>
                <span className={`px-2 py-1 rounded text-xs ${hasModuleAccess(module) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {hasModuleAccess(module) ? 'Accessible' : 'Not Accessible'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTest;
