import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/context/RoleContext";
import { roleApi, Role, ModulePermission } from "@/components/helper/roles/roles";
import { 
  Plus, 
  Edit, 
  Trash2
} from "lucide-react";

const RoleManagement: React.FC = () => {
  const { canPerformModuleAction } = useRole();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    modules: {} as { [key: string]: ModulePermission }
  });

  // Available modules - All modules from the system
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
  const canCreateRole = canPerformModuleAction("role_access", "create");
  const canEditRole = canPerformModuleAction("role_access", "edit");
  const canDeleteRole = canEditRole;

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const result = await roleApi.getRoles();
      if (result.data) {
        setRoles(result.data);
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateRole = async () => {
    if (!canCreateRole) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to create roles",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRole(true);
    try {
      const roleData = {
        name: formData.name,
        modules: formData.modules
      };

      const result = await roleApi.createRole(roleData);
      if (result.data) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchRoles();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!canEditRole) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit roles",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole) return;

    setIsUpdatingRole(true);
    try {
      const roleData = {
        name: formData.name,
        modules: formData.modules
      };

      const result = await roleApi.updateRole(selectedRole.id, roleData);
      if (result.data) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        setIsEditDialogOpen(false);
        resetForm();
        fetchRoles();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!canDeleteRole) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to delete roles",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const result = await roleApi.deleteRole(roleId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        fetchRoles();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (role: Role) => {
    if (!canEditRole) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit roles",
        variant: "destructive",
      });
      return;
    }

    setSelectedRole(role);
    setFormData({
      name: role.name,
      modules: role.modules
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      modules: initializeModulePermissions()
    });
    setSelectedRole(null);
  };

  const handleModulePermissionChange = (module: string, action: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module],
          [action]: value ? 1 : 0
        }
      }
    }));
  };

  const toggleAllPermissions = (enabled: boolean) => {
    setFormData((prev) => {
      const updatedModules = { ...prev.modules };

      availableModules.forEach((module) => {
        updatedModules[module] = {
          create: enabled ? 1 : 0,
          edit: enabled ? 1 : 0,
          view: enabled ? 1 : 0,
          approve: enabled ? 1 : 0,
          reject: enabled ? 1 : 0,
        };
      });

      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };

  const isAllPermissionsEnabled = useMemo(() => {
    if (availableModules.length === 0) return false;

    return availableModules.every((module) => {
      const permissions = formData.modules[module];
      if (!permissions) return false;

      return moduleActions.every((action) => Number(permissions[action as keyof ModulePermission]) === 1);
    });
  }, [availableModules, formData.modules]);

  const getEnabledModulesCount = (modules: Record<string, ModulePermission>) => {
    const normalizeModuleKey = (key: string) =>
      key.toLowerCase().replace(/[\s_-]+/g, "");

    const validModuleByNormalizedKey = new Map(
      availableModules.map((module) => [normalizeModuleKey(module), module])
    );

    const enabledValidModules = new Set<string>();

    Object.entries(modules || {}).forEach(([moduleKey, permission]) => {
      const canonicalModule = validModuleByNormalizedKey.get(
        normalizeModuleKey(moduleKey)
      );
      if (!canonicalModule) return;

      const hasAnyPermissionEnabled = Object.values(permission || {}).some(
        (value) => Number(value) === 1
      );

      if (hasAnyPermissionEnabled) {
        enabledValidModules.add(canonicalModule);
      }
    });

    return enabledValidModules.size;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-1">Manage roles and permissions</p>
          </div>
          <div className="flex gap-3">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (open && !canCreateRole) return;
                setIsCreateDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2" disabled={!canCreateRole}>
                  <Plus className="h-4 w-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., HR Manager"
                    />
                  </div>
                  <div>
                    <Label>Module Permissions</Label>
                    <div className="flex items-center justify-between rounded-md border p-3 my-3">
                      <div>
                        <p className="text-sm font-medium">Overall Permissions</p>
                        <p className="text-xs text-muted-foreground">
                          Enable/disable all permissions for all modules in one click
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{isAllPermissionsEnabled ? "All Enabled" : "Enable All"}</Label>
                        <Switch
                          checked={isAllPermissionsEnabled}
                          onCheckedChange={toggleAllPermissions}
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {availableModules.map(module => (
                        <div key={module} className="mb-4 pb-4 border-b last:border-b-0">
                          <h4 className="font-medium mb-2 capitalize">{module.replace('_', ' ')}</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {moduleActions.map(action => (
                              <div key={action} className="flex items-center space-x-2">
                                <Switch
                                  checked={formData.modules[module]?.[action] === 1}
                                  onCheckedChange={(checked) => handleModulePermissionChange(module, action, checked)}
                                />
                                <Label className="text-xs capitalize">{action}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={isCreatingRole || !canCreateRole || !formData.name.trim()}>
                    {isCreatingRole ? "Creating..." : "Create Role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">System Roles</CardTitle>
            <CardDescription>Manage system roles and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[120px] font-semibold text-gray-700">Role ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="w-[120px] font-semibold text-gray-700">Modules</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium">{role.role_id}</TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                            {getEnabledModulesCount(role.modules)} modules
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {canEditRole && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(role)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteRole && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Module Permissions</Label>
                <div className="flex items-center justify-between rounded-md border p-3 my-3">
                  <div>
                    <p className="text-sm font-medium">Overall Permissions</p>
                    <p className="text-xs text-muted-foreground">
                      Enable/disable all permissions for all modules in one click
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">{isAllPermissionsEnabled ? "All Enabled" : "Enable All"}</Label>
                    <Switch
                      checked={isAllPermissionsEnabled}
                      onCheckedChange={toggleAllPermissions}
                    />
                  </div>
                </div>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {availableModules.map(module => (
                    <div key={module} className="mb-4 pb-4 border-b last:border-b-0">
                      <h4 className="font-medium mb-2 capitalize">{module.replace('_', ' ')}</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {moduleActions.map(action => (
                          <div key={action} className="flex items-center space-x-2">
                            <Switch
                              checked={formData.modules[module]?.[action] === 1}
                              onCheckedChange={(checked) => handleModulePermissionChange(module, action, checked)}
                            />
                            <Label className="text-xs capitalize">{action}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={isUpdatingRole || !formData.name.trim()}>
                {isUpdatingRole ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RoleManagement;
