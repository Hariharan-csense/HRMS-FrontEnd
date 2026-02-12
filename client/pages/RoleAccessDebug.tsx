import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { roleApi, Role, ModulePermission } from "@/components/helper/roles/roles";
import { 
  Shield, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  RefreshCw, 
  Settings, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Unlock,
  Key,
  Crown,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Download,
  Upload
} from "lucide-react";

interface RoleDebugInfo {
  id: string;
  name: string;
  modules: { [key: string]: ModulePermission };
  approval_authority: string;
  data_visibility: string;
  description?: string;
  created_at?: string;
}

export default function RoleAccessDebug() {
  const { user: currentUser } = useAuth();
  const { userRoles, hasModuleAccess, canPerformModuleAction, loading } = useRole();
  const [allRoles, setAllRoles] = useState<RoleDebugInfo[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<RoleDebugInfo>>({});
  const [addingNewRole, setAddingNewRole] = useState(false);
  const [newRoleData, setNewRoleData] = useState<Partial<RoleDebugInfo>>({
    name: '',
    approval_authority: '',
    data_visibility: '',
    description: '',
    modules: {}
  });

  // All available modules in the system
  const availableModules = [
    'dashboard',
    'organization',
    'employees',
    'hr_management',
    'client_attendance',
    'client_attendance_admin',
    'attendance',
    'shift_management',
    'live_tracking',
    'leave',
    'payroll',
    'expenses',
    'assets',
    'exit',
    'reports',
    'tickets',
    'pulse_surveys',
    'role_access'
  ];

  // Module actions
  const moduleActions = ['create', 'edit', 'view', 'approve', 'reject'];

  // Initialize module permissions with 0/1 values
  const initializeModulePermissions = () => {
    const modules: { [key: string]: ModulePermission } = {};
    availableModules.forEach(module => {
      modules[module] = {
        create: 0,
        edit: 0,
        view: 0,
        approve: 0,
        reject: 0
      };
    });
    return modules;
  };

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
    try {
      console.log('Creating default admin role...');
      const modules = initializeModulePermissions();
      
      // Give all permissions to admin
      Object.keys(modules).forEach(module => {
        Object.keys(modules[module]).forEach(action => {
          modules[module][action as keyof ModulePermission] = 1;
        });
      });

      const result = await roleApi.createRole({
        name: 'Super Admin',
        approval_authority: 'Full Authority',
        data_visibility: 'All Data',
        description: 'System administrator with full access to all modules',
        modules
      });

      console.log('Create role response:', result);

      if (result.data) {
        console.log('Default admin role created successfully');
        await fetchAllRoles();
      } else {
        console.error('Failed to create admin role:', result.error);
      }
    } catch (error) {
      console.error('Error creating admin role:', error);
    }
  };

  // Start adding new role
  const startAddNewRole = () => {
    setNewRoleData({
      name: '',
      approval_authority: '',
      data_visibility: '',
      description: '',
      modules: initializeModulePermissions()
    });
    setAddingNewRole(true);
  };

  // Cancel adding new role
  const cancelAddNewRole = () => {
    setAddingNewRole(false);
    setNewRoleData({
      name: '',
      approval_authority: '',
      data_visibility: '',
      description: '',
      modules: {}
    });
  };

  // Save new role
  const saveNewRole = async () => {
    if (!newRoleData.name?.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      console.log('Creating new role:', newRoleData);
      const result = await roleApi.createRole(newRoleData as Omit<Role, 'id' | 'created_at' | 'updated_at' | 'role_id'>);
      
      if (result.data) {
        console.log('Role created successfully');
        await fetchAllRoles();
        setAddingNewRole(false);
        setNewRoleData({
          name: '',
          approval_authority: '',
          data_visibility: '',
          description: '',
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
          [permission]: value ? 1 : 0
        }
      }
    }));
  };

  // Start editing role
  const startEditRole = (role: RoleDebugInfo) => {
    setEditingRole(role.id);
    setEditFormData({
      name: role.name,
      approval_authority: role.approval_authority,
      data_visibility: role.data_visibility,
      description: role.description,
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
    if (!editFormData.name?.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      console.log('Saving edited role:', roleId, editFormData);
      const result = await roleApi.updateRole(roleId, editFormData);
      
      if (result.data) {
        console.log('Role updated successfully');
        await fetchAllRoles();
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
          [permission]: value ? 1 : 0
        }
      }
    }));
  };

  // Delete role
  const deleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const result = await roleApi.deleteRole(roleId);
      
      if (result.success) {
        console.log('Role deleted successfully');
        await fetchAllRoles();
      } else {
        console.error('Failed to delete role:', result.error);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  // Copy role permissions
  const copyRole = (role: RoleDebugInfo) => {
    const roleData = {
      name: `${role.name} (Copy)`,
      approval_authority: role.approval_authority,
      data_visibility: role.data_visibility,
      description: role.description,
      modules: { ...role.modules }
    };
    
    setNewRoleData(roleData);
    setAddingNewRole(true);
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchAllRoles();
  }, []);

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please login to see role access information</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Role Access Debug
              </h1>
            </div>
            <p className="text-lg text-gray-600">Debug and manage user roles and permissions</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>Current user: <span className="font-semibold text-gray-700">{currentUser.name || currentUser.email}</span></span>
              <Badge variant="outline">
                {userRoles?.length || 0} Roles
              </Badge>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Quick Actions</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                      variant="default"
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <Crown className="w-4 h-4" />
                      Create Admin Role
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-gray-600">Status: <span className="font-medium">{loading ? 'Loading...' : 'Ready'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Total Roles: <span className="font-medium">{allRoles.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-gray-600">Modules: <span className="font-medium">{availableModules.length}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current User Role Access */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                Current User Role Access
              </CardTitle>
              <CardDescription>View your current role permissions across all modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModules.map(module => (
                  <div key={module} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 capitalize">{module.replace('_', ' ')}</h4>
                      <div className="flex items-center gap-2">
                        {hasModuleAccess(module) ? (
                          <Unlock className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-red-600" />
                        )}
                        <Badge variant={hasModuleAccess(module) ? "default" : "secondary"}>
                          {hasModuleAccess(module) ? "Accessible" : "Restricted"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {moduleActions.map(action => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="capitalize text-gray-600">{action}</span>
                          {canPerformModuleAction(module, action) ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Roles Management */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    All Roles Management
                  </CardTitle>
                  <CardDescription>
                    Manage system roles and permissions • Total: <span className="font-semibold text-blue-600">{allRoles.length}</span> roles
                  </CardDescription>
                </div>
                <Button 
                  onClick={startAddNewRole} 
                  size="sm"
                  className="gap-2 bg-[#17c491] hover:bg-[#14b389] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  Add New Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allRoles.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Roles Found</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first role</p>
                  <Button 
                    onClick={createDefaultAdminRole} 
                    className="gap-2 bg-[#17c491] hover:bg-[#14b389] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Crown className="w-4 h-4" />
                    Create Admin Role
                  </Button>
                </div>
              ) : addingNewRole ? (
                /* New Role Form */
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Create New Role</h3>
                      <p className="text-sm text-gray-600">Configure permissions for the new role</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                          id="role-name"
                          value={newRoleData.name || ''}
                          onChange={(e) => handleNewRoleFormChange('name', e.target.value)}
                          placeholder="e.g., Manager, Developer, HR"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="approval">Approval Authority</Label>
                        <Input
                          id="approval"
                          value={newRoleData.approval_authority || ''}
                          onChange={(e) => handleNewRoleFormChange('approval_authority', e.target.value)}
                          placeholder="e.g., Manager, Full Authority"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visibility">Data Visibility</Label>
                        <Input
                          id="visibility"
                          value={newRoleData.data_visibility || ''}
                          onChange={(e) => handleNewRoleFormChange('data_visibility', e.target.value)}
                          placeholder="e.g., All Employees, Self Only"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newRoleData.description || ''}
                          onChange={(e) => handleNewRoleFormChange('description', e.target.value)}
                          placeholder="Role description..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Module Permissions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {availableModules.map(module => (
                          <div key={module} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <h5 className="font-semibold text-gray-800 capitalize mb-3 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-blue-600" />
                              {module.replace('_', ' ')}
                            </h5>
                            <div className="space-y-2">
                              {moduleActions.map(action => (
                                <div key={action} className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-700 capitalize">{action}</Label>
                                  <Switch
                                    checked={newRoleData.modules?.[module]?.[action as keyof ModulePermission] === 1}
                                    onCheckedChange={(checked) => handleNewRoleModulePermissionChange(module, action, checked)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={saveNewRole} 
                        disabled={!newRoleData.name}
                        className="gap-2 bg-[#17c491] hover:bg-[#14b389] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <Save className="w-4 h-4" />
                        Create Role
                      </Button>
                      <Button 
                        onClick={cancelAddNewRole} 
                        variant="outline" 
                        className="gap-2 hover:bg-gray-50"
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
                    <div key={role.id} className="border border-gray-200 rounded-xl p-6 bg-white">
                      {editingRole === role.id ? (
                        /* Edit Form */
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                              <Edit2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">Edit Role</h3>
                              <p className="text-sm text-gray-600">Modify role permissions and settings</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-name-${role.id}`}>Role Name</Label>
                              <Input
                                id={`edit-name-${role.id}`}
                                value={editFormData.name || ''}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-approval-${role.id}`}>Approval Authority</Label>
                              <Input
                                id={`edit-approval-${role.id}`}
                                value={editFormData.approval_authority || ''}
                                onChange={(e) => handleEditFormChange('approval_authority', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-visibility-${role.id}`}>Data Visibility</Label>
                              <Input
                                id={`edit-visibility-${role.id}`}
                                value={editFormData.data_visibility || ''}
                                onChange={(e) => handleEditFormChange('data_visibility', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-description-${role.id}`}>Description</Label>
                              <Textarea
                                id={`edit-description-${role.id}`}
                                value={editFormData.description || ''}
                                onChange={(e) => handleEditFormChange('description', e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Module Permissions
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                              {availableModules.map(module => (
                                <div key={module} className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h5 className="font-semibold text-gray-800 capitalize mb-3 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-orange-600" />
                                    {module.replace('_', ' ')}
                                  </h5>
                                  <div className="space-y-2">
                                    {moduleActions.map(action => (
                                      <div key={action} className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700 capitalize">{action}</Label>
                                        <Switch
                                          checked={editFormData.modules?.[module]?.[action as keyof ModulePermission] === 1}
                                          onCheckedChange={(checked) => handleModulePermissionChange(module, action, checked)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <Button 
                              onClick={() => saveEditedRole(role.id)} 
                              disabled={!editFormData.name}
                              className="gap-2 bg-[#17c491] hover:bg-[#14b389] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                              <Save className="w-4 h-4" />
                              Save Changes
                            </Button>
                            <Button 
                              onClick={cancelEdit} 
                              variant="outline" 
                              className="gap-2 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <>
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                  <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-800">{role.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Authority:</span> {role.approval_authority} • 
                                    <span className="font-medium"> Visibility:</span> {role.data_visibility}
                                  </p>
                                  {role.description && (
                                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => copyRole(role)} 
                                variant="outline" 
                                size="sm"
                                className="gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Copy
                              </Button>
                              <Button 
                                onClick={() => startEditRole(role)} 
                                variant="outline" 
                                size="sm"
                                className="gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button 
                                onClick={() => deleteRole(role.id)} 
                                variant="outline" 
                                size="sm"
                                className="gap-2 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Module Permissions
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {availableModules.map(module => {
                                const modulePerms = role.modules?.[module];
                                if (!modulePerms) return null;

                                const hasAnyPermission = Object.values(modulePerms).some(p => p === 1);

                                return (
                                  <div key={module} className={`border rounded-lg p-4 ${hasAnyPermission ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <h5 className="font-semibold text-gray-800 capitalize mb-3 flex items-center gap-2">
                                      {hasAnyPermission ? (
                                        <Unlock className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Lock className="w-4 h-4 text-gray-400" />
                                      )}
                                      {module.replace('_', ' ')}
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      {moduleActions.map(action => (
                                        <div key={action} className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-gray-600 capitalize">{action}</span>
                                          <div className={`w-2 h-2 rounded-full ${
                                            modulePerms[action as keyof ModulePermission] === 1
                                              ? "bg-green-500"
                                              : "bg-gray-300"
                                          }`} />
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
        </div>
      </div>
    </Layout>
  );
}
