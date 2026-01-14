import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { roleApi, Role, ModulePermission } from "@/components/helper/roles/roles";
import { Shield, Plus, Edit2, Save, X, RefreshCw, Settings, Users, CheckCircle, AlertCircle } from "lucide-react";

export default function RoleAccessDebug() {
  const { user: currentUser } = useAuth();
  const { userRoles, hasModuleAccess, canPerformModuleAction, loading } = useRole();
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Role>>({});
  const [addingNewRole, setAddingNewRole] = useState(false);
  const [newRoleData, setNewRoleData] = useState<Partial<Role>>({
    name: '',
    approvalAuthority: '',
    dataVisibility: '',
    modules: {}
  });

  // Fetch all roles from API
  const fetchAllRoles = async () => {
    setRolesLoading(true);
    try {
      console.log('Fetching roles from API...');
      const result = await roleApi.getRoles();
      console.log('API Response:', result);
      if (result.data) {
        console.log('Roles found:', result.data);
        setAllRoles(result.data);
      } else {
        console.error('Failed to fetch roles:', result.error);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  // Create default admin role
  const createDefaultAdminRole = async () => {
    setCreatingDefault(true);
    try {
      console.log('Creating default admin role...');
      const modules: { [key: string]: ModulePermission } = {};
      const defaultModules = ['employees', 'attendance', 'leave', 'payroll', 'expenses', 'assets', 'exit', 'reports', 'organization', 'admin', 'role_access'];
      
      defaultModules.forEach(module => {
        modules[module] = { view: true, create: true, edit: true, approve: true };
      });

      console.log('Role data to create:', {
        name: 'admin',
        modules,
        approvalAuthority: 'Full Authority',
        dataVisibility: 'All Employees'
      });

      const result = await roleApi.createRole({
        name: 'admin',
        modules,
        approvalAuthority: 'Full Authority',
        dataVisibility: 'All Employees'
      });

      console.log('Create role response:', result);

      if (result.data) {
        console.log('Default admin role created successfully');
        await fetchAllRoles(); // Refresh roles list
      } else {
        console.error('Failed to create admin role:', result.error);
      }
    } catch (error) {
      console.error('Error creating admin role:', error);
    } finally {
      setCreatingDefault(false);
    }
  };

  // Start adding new role
  const startAddNewRole = () => {
    const defaultModules = ['employees', 'attendance', 'leave', 'payroll', 'expenses', 'assets', 'exit', 'reports', 'organization', 'admin'];
    const modules: { [key: string]: ModulePermission } = {};
    
    defaultModules.forEach(module => {
      modules[module] = { view: false, create: false, edit: false, approve: false };
    });

    setNewRoleData({
      name: '',
      approvalAuthority: '',
      dataVisibility: '',
      modules
    });
    setAddingNewRole(true);
  };

  // Cancel adding new role
  const cancelAddNewRole = () => {
    setAddingNewRole(false);
    setNewRoleData({
      name: '',
      approvalAuthority: '',
      dataVisibility: '',
      modules: {}
    });
  };

  // Save new role
  const saveNewRole = async () => {
    try {
      console.log('Creating new role:', newRoleData);
      const result = await roleApi.createRole(newRoleData as Omit<Role, 'id' | 'createdAt'>);
      
      if (result.data) {
        console.log('Role created successfully');
        await fetchAllRoles(); // Refresh roles list
        setAddingNewRole(false);
        setNewRoleData({
          name: '',
          approvalAuthority: '',
          dataVisibility: '',
          modules: {}
        });
      } else {
        console.error('Failed to create role:', result.error);
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  // Handle new role form field changes
  const handleNewRoleFormChange = (field: string, value: any) => {
    setNewRoleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new role module permission changes
  const handleNewRoleModulePermissionChange = (module: string, permission: string, value: boolean) => {
    setNewRoleData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules?.[module],
          [permission]: value
        }
      }
    }));
  };

  // Start editing role
  const startEditRole = (role: Role) => {
    setEditingRole(role.id);
    setEditFormData({
      name: role.name,
      approvalAuthority: role.approvalAuthority,
      dataVisibility: role.dataVisibility,
      modules: { ...role.modules }
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingRole(null);
    setEditFormData({});
  };

  // Save edited role
  const saveEditedRole = async (roleId: string) => {
    try {
      console.log('Saving edited role:', roleId, editFormData);
      const result = await roleApi.updateRole(roleId, editFormData);
      
      if (result.data) {
        console.log('Role updated successfully');
        await fetchAllRoles(); // Refresh roles list
        setEditingRole(null);
        setEditFormData({});
      } else {
        console.error('Failed to update role:', result.error);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Handle form field changes
  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle module permission changes
  const handleModulePermissionChange = (module: string, permission: string, value: boolean) => {
    setEditFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules?.[module],
          [permission]: value
        }
      }
    }));
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchAllRoles();
  }, []);

  if (!currentUser) {
    return (
      <Layout>
        <div className="text-center text-muted-foreground">Please login to see role access information</div>
      </Layout>
    );
  }

  const modules = allRoles.length > 0 && allRoles[0].modules ? 
    Object.keys(allRoles[0].modules) : 
    ['employees', 'attendance', 'leave', 'payroll', 'expenses', 'assets', 'exit', 'reports', 'organization', 'admin', 'role_access'];
  const actions = ['view', 'create', 'edit', 'approve'];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Role Management System
              </h1>
            </div>
            <p className="text-lg text-slate-600">Manage user roles and permissions efficiently</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>Current user: <span className="font-semibold text-slate-700">{currentUser.name}</span></span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Quick Actions</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={fetchAllRoles} 
                    disabled={rolesLoading}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${rolesLoading ? 'animate-spin' : ''}`} />
                    {rolesLoading ? 'Refreshing...' : 'Refresh Roles'}
                  </Button>
                  {allRoles.length === 0 && (
                    <Button 
                      onClick={createDefaultAdminRole} 
                      disabled={creatingDefault}
                      variant="default"
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Shield className="w-4 h-4" />
                      {creatingDefault ? 'Creating...' : 'Create Default Admin Role'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-slate-600">Role Status: <span className="font-medium">{loading ? 'Loading...' : 'Ready'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Total Roles: <span className="font-medium">{allRoles.length}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

      

        {/* All Roles in System */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    All Roles in System
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Manage and configure user roles • Total: <span className="font-semibold text-blue-600">{allRoles.length}</span> roles
                  </CardDescription>
                </div>
                <Button 
                  onClick={startAddNewRole} 
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add New Role
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
            {allRoles.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Roles Found</h3>
                <p className="text-slate-500 mb-6">Get started by creating your first role</p>
                <Button 
                  onClick={createDefaultAdminRole} 
                  disabled={creatingDefault}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Shield className="w-4 h-4" />
                  {creatingDefault ? 'Creating...' : 'Create Default Admin Role'}
                </Button>
              </div>
            ) : addingNewRole ? (
              // New Role Form
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Create New Role</h3>
                    <p className="text-sm text-slate-600">Configure permissions for the new role</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Role Name</label>
                      <input
                        type="text"
                        value={newRoleData.name || ''}
                        onChange={(e) => handleNewRoleFormChange('name', e.target.value)}
                        placeholder="e.g., Manager, Developer, HR"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Approval Authority</label>
                      <input
                        type="text"
                        value={newRoleData.approvalAuthority || ''}
                        onChange={(e) => handleNewRoleFormChange('approvalAuthority', e.target.value)}
                        placeholder="e.g., Manager, Full Authority"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Data Visibility</label>
                      <input
                        type="text"
                        value={newRoleData.dataVisibility || ''}
                        onChange={(e) => handleNewRoleFormChange('dataVisibility', e.target.value)}
                        placeholder="e.g., All Employees, Self Only"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Module Permissions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(newRoleData.modules || {}).map(([moduleName, permissions]) => (
                        <div key={moduleName} className="border-2 border-slate-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
                          <h5 className="font-semibold text-slate-800 capitalize mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            {moduleName}
                          </h5>
                          <div className="space-y-3">
                            {Object.entries(permissions).map(([perm, allowed]) => (
                              <label key={perm} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                                <span className="text-sm font-medium text-slate-700 capitalize">{perm}</span>
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={allowed}
                                    onChange={(e) => handleNewRoleModulePermissionChange(moduleName, perm, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button 
                      onClick={saveNewRole} 
                      size="sm"
                      disabled={!newRoleData.name}
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Save className="w-4 h-4" />
                      Create Role
                    </Button>
                    <Button 
                      onClick={cancelAddNewRole} 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {allRoles.map((role) => (
                  <div key={role.id} className="border-2 border-slate-200 rounded-xl p-6 bg-white hover:border-blue-300 transition-all hover:shadow-lg">
                    {editingRole === role.id ? (
                      // Edit Form
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                            <Edit2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Edit Role</h3>
                            <p className="text-sm text-slate-600">Modify role permissions and settings</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Role Name</label>
                            <input
                              type="text"
                              value={editFormData.name || ''}
                              onChange={(e) => handleEditFormChange('name', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Approval Authority</label>
                            <input
                              type="text"
                              value={editFormData.approvalAuthority || ''}
                              onChange={(e) => handleEditFormChange('approvalAuthority', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Data Visibility</label>
                            <input
                              type="text"
                              value={editFormData.dataVisibility || ''}
                              onChange={(e) => handleEditFormChange('dataVisibility', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Module Permissions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(editFormData.modules || {}).map(([moduleName, permissions]) => (
                              <div key={moduleName} className="border-2 border-slate-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
                                <h5 className="font-semibold text-slate-800 capitalize mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-orange-600" />
                                  {moduleName}
                                </h5>
                                <div className="space-y-3">
                                  {Object.entries(permissions).map(([perm, allowed]) => (
                                    <label key={perm} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                                      <span className="text-sm font-medium text-slate-700 capitalize">{perm}</span>
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={allowed}
                                          onChange={(e) => handleModulePermissionChange(moduleName, perm, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                          <Button 
                            onClick={() => saveEditedRole(role.id)} 
                            size="sm"
                            className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </Button>
                          <Button 
                            onClick={cancelEdit} 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-800">{role.name}</h3>
                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">Authority:</span> {role.approvalAuthority} • 
                                  <span className="font-medium"> Visibility:</span> {role.dataVisibility}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => startEditRole(role)} 
                            variant="outline" 
                            size="sm"
                            className="gap-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Role
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Module Permissions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(role.modules).map(([moduleName, permissions]) => {
                              const hasAnyPermission = Object.values(permissions).some(p => p);
                              if (!hasAnyPermission) return null;

                              return (
                                <div key={moduleName} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                  <h5 className="font-semibold text-slate-800 capitalize mb-2 text-sm">{moduleName}</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(permissions).map(([perm, allowed]) => (
                                      <div
                                        key={perm}
                                        className={`text-center text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                                          allowed
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                        }`}
                                      >
                                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Admin Management Section */}
         
        </div>
      </div>
    </Layout>
  );
}
