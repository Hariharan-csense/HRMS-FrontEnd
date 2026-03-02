import React, { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { roleApi, Role, RbacModuleCatalog } from "@/components/helper/roles/roles";
import { Plus, Save, X, RefreshCw, Copy, Trash2, ShieldCheck, Layers3, Crown, Key, Lock, Unlock, Settings, Users, Grid3x3, Sparkles, Zap, CheckSquare, Square } from "lucide-react";

type RbacAction = "view" | "create" | "update" | "delete" | "approve" | "reject";

type PermissionSet = Record<RbacAction, number> & { edit?: number };

type EditableSubmodule = {
  permissions: PermissionSet;
};

type EditableModule = {
  permissions: PermissionSet;
  submodules: Record<string, EditableSubmodule>;
};

type EditableModules = Record<string, EditableModule>;

interface RoleDebugInfo {
  id: string;
  role_id?: string;
  name: string;
  modules: EditableModules;
}

const DEFAULT_ACTIONS: RbacAction[] = ["view", "create", "update", "delete", "approve", "reject"];
const ACTION_SHORT_LABEL: Record<RbacAction, string> = {
  view: "V",
  create: "C",
  update: "U",
  delete: "D",
  approve: "A",
  reject: "R",
};

const FALLBACK_CATALOG: RbacModuleCatalog[] = [
  { key: "dashboard", label: "Dashboard", submodules: [] },
  { key: "quick_actions", label: "Quick Actions", submodules: [] },
  { key: "organization", label: "Organization", submodules: [{ key: "company", label: "Company" }, { key: "branches", label: "Branches" }, { key: "departments", label: "Departments" }, { key: "designations", label: "Designations" }, { key: "role_management", label: "Role Management" }] },
  { key: "employees", label: "Employees", submodules: [{ key: "list", label: "Employee List" }, { key: "profile", label: "Profile" }, { key: "reports", label: "Employee Reports" }] },
  { key: "hr_management", label: "HR Management", submodules: [{ key: "requirements", label: "Requirements" }, { key: "recruitment", label: "Recruitment" }, { key: "offer_letters", label: "Offer Letters" }, { key: "onboarding", label: "Onboarding" }] },
  { key: "client_attendance", label: "Client Attendance", submodules: [] },
  { key: "client_attendance_admin", label: "Client Attendance Admin", submodules: [] },
  { key: "my_clients", label: "My Clients", submodules: [] },
  { key: "my_analytics", label: "My Analytics", submodules: [] },
  { key: "attendance", label: "Attendance", submodules: [{ key: "capture", label: "Check-In/Out" }, { key: "log", label: "Attendance Log" }, { key: "override", label: "Override" }, { key: "shift", label: "Shift Management" }] },
  { key: "shift_management", label: "Shift Management", submodules: [] },
  { key: "live_tracking", label: "Live Tracking", submodules: [] },
  { key: "leave", label: "Leave", submodules: [{ key: "apply", label: "Apply Leave" }, { key: "balance", label: "Leave Balance" }, { key: "approvals", label: "Leave Approvals" }, { key: "config", label: "Leave Config" }, { key: "applications", label: "Applications" }, { key: "permission", label: "Permission" }, { key: "configuration", label: "Configuration" }] },
  { key: "payroll", label: "Payroll", submodules: [{ key: "salary_structure", label: "Salary Structure" }, { key: "processing", label: "Processing" }, { key: "payslips", label: "Payslips" }] },
  { key: "expenses", label: "Expenses", submodules: [{ key: "claims", label: "Claims" }, { key: "approvals", label: "Approvals" }, { key: "export", label: "Export" }] },
  { key: "assets", label: "Assets", submodules: [{ key: "list", label: "Asset List" }] },
  { key: "exit", label: "Exit", submodules: [{ key: "resignations", label: "Resignations" }, { key: "checklist", label: "Exit Checklist" }, { key: "settlement", label: "F&F Settlement" }] },
  { key: "reports", label: "Reports", submodules: [{ key: "attendance", label: "Attendance Reports" }, { key: "leave", label: "Leave Reports" }, { key: "payroll", label: "Payroll Reports" }, { key: "finance", label: "Finance Reports" }, { key: "export_data", label: "Export Data" }, { key: "employee_reports", label: "Employee Reports" }] },
  { key: "tickets", label: "Tickets", submodules: [] },
  { key: "pulse_surveys", label: "Pulse Surveys", submodules: [{ key: "dashboard", label: "Overview" }, { key: "results", label: "Results" }, { key: "create", label: "Create Survey" }, { key: "templates", label: "Templates" }, { key: "feedback_inbox", label: "Feedback Inbox" }, { key: "my_surveys", label: "My Surveys" }, { key: "feedback", label: "Send Feedback" }, { key: "respond", label: "Respond Survey" }] },
  { key: "subscription", label: "Subscription", submodules: [] },
  { key: "subscription_plans", label: "Subscription Plans", submodules: [] },
  { key: "organizations", label: "Organizations", submodules: [] },
  { key: "users", label: "Users", submodules: [] },
  { key: "role_access", label: "Role Access", submodules: [] },
];

const emptyPermissionSet = (): PermissionSet => ({
  view: 0,
  create: 0,
  update: 0,
  delete: 0,
  approve: 0,
  reject: 0,
  edit: 0,
});

const normalizePermissionSet = (raw: any): PermissionSet => {
  const updateValue = raw?.update ?? raw?.edit ?? 0;
  return {
    view: raw?.view ? 1 : 0,
    create: raw?.create ? 1 : 0,
    update: updateValue ? 1 : 0,
    delete: raw?.delete ? 1 : 0,
    approve: raw?.approve ? 1 : 0,
    reject: raw?.reject ? 1 : 0,
    edit: updateValue ? 1 : 0,
  };
};

const initializeModulesFromCatalog = (catalog: RbacModuleCatalog[]): EditableModules => {
  const modules: EditableModules = {};
  catalog.forEach((module) => {
    modules[module.key] = {
      permissions: emptyPermissionSet(),
      submodules: {},
    };
    module.submodules.forEach((submodule) => {
      modules[module.key].submodules[submodule.key] = {
        permissions: emptyPermissionSet(),
      };
    });
  });
  return modules;
};

const normalizeRoleModules = (rawModules: any, catalog: RbacModuleCatalog[]): EditableModules => {
  const base = initializeModulesFromCatalog(catalog);
  const modules = rawModules || {};

  Object.keys(modules).forEach((moduleKey) => {
    const moduleRaw = modules[moduleKey];
    if (!base[moduleKey]) {
      base[moduleKey] = { permissions: emptyPermissionSet(), submodules: {} };
    }

    if (moduleRaw?.permissions) {
      base[moduleKey].permissions = normalizePermissionSet(moduleRaw.permissions);
      const rawSubmodules = moduleRaw.submodules || {};
      Object.keys(rawSubmodules).forEach((subKey) => {
        if (!base[moduleKey].submodules[subKey]) {
          base[moduleKey].submodules[subKey] = { permissions: emptyPermissionSet() };
        }
        base[moduleKey].submodules[subKey].permissions = normalizePermissionSet(
          rawSubmodules[subKey]?.permissions || rawSubmodules[subKey]
        );
      });
    } else {
      base[moduleKey].permissions = normalizePermissionSet(moduleRaw);
    }
  });

  return base;
};

const serializeModulesForSave = (modules: EditableModules) => {
  const payload: any = {};
  Object.keys(modules).forEach((moduleKey) => {
    const moduleEntry = modules[moduleKey];
    payload[moduleKey] = {
      permissions: normalizePermissionSet(moduleEntry.permissions),
      submodules: {},
    };
    Object.keys(moduleEntry.submodules || {}).forEach((subKey) => {
      payload[moduleKey].submodules[subKey] = {
        permissions: normalizePermissionSet(moduleEntry.submodules[subKey].permissions),
      };
    });
  });
  return payload;
};

export default function RoleAccessDebug() {
  const { user: currentUser } = useAuth();
  const { canPerformModuleAction } = useRole();
  const [catalog, setCatalog] = useState<RbacModuleCatalog[]>(FALLBACK_CATALOG);
  const [actions, setActions] = useState<RbacAction[]>(DEFAULT_ACTIONS);
  const [allRoles, setAllRoles] = useState<RoleDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formModules, setFormModules] = useState<EditableModules>({});
  const [addingNewRole, setAddingNewRole] = useState(false);
  const editorCardRef = useRef<HTMLDivElement | null>(null);

  const canManageRoles = canPerformModuleAction("role_access", "update") || canPerformModuleAction("role_access", "edit");

  const bootstrap = async () => {
    setLoading(true);
    try {
      const [catalogResult, rolesResult] = await Promise.all([roleApi.getRoleCatalog(), roleApi.getRoles()]);

      const effectiveCatalog = catalogResult.data?.modules?.length
        ? catalogResult.data.modules
        : FALLBACK_CATALOG;
      setCatalog(effectiveCatalog);

      if (catalogResult.data?.actions?.length) {
        const normalized = catalogResult.data.actions
          .map((a) => (a === "edit" ? "update" : a))
          .filter((a): a is RbacAction => DEFAULT_ACTIONS.includes(a as RbacAction));
        setActions(normalized.length ? normalized : DEFAULT_ACTIONS);
      }

      const mappedRoles =
        rolesResult.data?.map((role: Role) => ({
          id: role.id || role.role_id,
          role_id: role.role_id,
          name: role.name,
          modules: normalizeRoleModules(role.modules, effectiveCatalog),
        })) || [];

      setAllRoles(mappedRoles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const scrollToEditor = () => {
    requestAnimationFrame(() => {
      editorCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const beginCreate = () => {
    setIsEditorOpen(true);
    setAddingNewRole(true);
    setEditingRoleId(null);
    setFormName("");
    setFormModules(initializeModulesFromCatalog(catalog));
    scrollToEditor();
  };

  const beginEdit = (role: RoleDebugInfo) => {
    setIsEditorOpen(true);
    setAddingNewRole(false);
    setEditingRoleId(role.id || role.role_id || "");
    setFormName(role.name);
    setFormModules(normalizeRoleModules(role.modules, catalog));
    scrollToEditor();
  };

  const cancelForm = () => {
    setIsEditorOpen(false);
    setAddingNewRole(false);
    setEditingRoleId(null);
    setFormName("");
    setFormModules({});
  };

  const saveForm = async () => {
    if (!formName.trim()) return;
    const payload = {
      name: formName.trim(),
      modules: serializeModulesForSave(formModules),
    };

    if (addingNewRole) {
      await roleApi.createRole(payload as any);
    } else if (editingRoleId !== null && editingRoleId !== "") {
      await roleApi.updateRole(editingRoleId, payload as any);
    }

    cancelForm();
    await bootstrap();
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm("Delete this role?")) return;
    await roleApi.deleteRole(roleId);
    await bootstrap();
  };

  const copyRole = (role: RoleDebugInfo) => {
    setIsEditorOpen(true);
    setAddingNewRole(true);
    setEditingRoleId(null);
    setFormName(`${role.name} Copy`);
    setFormModules(normalizeRoleModules(role.modules, catalog));
    scrollToEditor();
  };

  const togglePermission = (
    moduleKey: string,
    action: RbacAction,
    value: boolean,
    submoduleKey?: string
  ) => {
    setFormModules((prev) => {
      const next = { ...prev };
      const moduleEntry = next[moduleKey] || { permissions: emptyPermissionSet(), submodules: {} };
      next[moduleKey] = moduleEntry;

      if (submoduleKey) {
        moduleEntry.submodules[submoduleKey] = moduleEntry.submodules[submoduleKey] || {
          permissions: emptyPermissionSet(),
        };
        moduleEntry.submodules[submoduleKey].permissions[action] = value ? 1 : 0;
        if (action === "update") moduleEntry.submodules[submoduleKey].permissions.edit = value ? 1 : 0;
      } else {
        moduleEntry.permissions[action] = value ? 1 : 0;
        if (action === "update") moduleEntry.permissions.edit = value ? 1 : 0;
      }

      return next;
    });
  };

  const toggleAllModules = (value: boolean) => {
    setFormModules((prev) => {
      const next = { ...prev };
      catalog.forEach((module) => {
        const moduleEntry = next[module.key] || { permissions: emptyPermissionSet(), submodules: {} };
        
        // Toggle all actions for the module
        actions.forEach((action) => {
          moduleEntry.permissions[action] = value ? 1 : 0;
          if (action === "update") moduleEntry.permissions.edit = value ? 1 : 0;
        });
        
        // Toggle all actions for all submodules
        module.submodules.forEach((submodule) => {
          moduleEntry.submodules[submodule.key] = moduleEntry.submodules[submodule.key] || {
            permissions: emptyPermissionSet(),
          };
          actions.forEach((action) => {
            moduleEntry.submodules[submodule.key].permissions[action] = value ? 1 : 0;
            if (action === "update") moduleEntry.submodules[submodule.key].permissions.edit = value ? 1 : 0;
          });
        });
        
        next[module.key] = moduleEntry;
      });
      return next;
    });
  };

  const isAllSelected = () => {
    return catalog.every((module) => {
      const moduleEntry = formModules[module.key];
      if (!moduleEntry) return false;
      
      // Check if all actions are selected for the module
      const allModuleActionsSelected = actions.every((action) => moduleEntry.permissions[action] === 1);
      
      // Check if all actions are selected for all submodules
      const allSubmoduleActionsSelected = module.submodules.every((submodule) => {
        const submoduleEntry = moduleEntry.submodules[submodule.key];
        return submoduleEntry && actions.every((action) => submoduleEntry.permissions[action] === 1);
      });
      
      return allModuleActionsSelected && allSubmoduleActionsSelected;
    });
  };

  const enabledMatrixCount = useMemo(() => {
    return allRoles.reduce((sum, role) => {
      const moduleCount = Object.values(role.modules).reduce((inner, moduleEntry) => {
        const hasModulePermission = actions.some((action) => moduleEntry.permissions[action] === 1);
        const hasSubmodulePermission = Object.values(moduleEntry.submodules || {}).some((sub) =>
          actions.some((action) => sub.permissions[action] === 1)
        );
        return inner + (hasModulePermission || hasSubmodulePermission ? 1 : 0);
      }, 0);
      return sum + moduleCount;
    }, 0);
  }, [allRoles, actions]);

  if (!currentUser) {
    return <Layout><div className="p-6">Login required.</div></Layout>;
  }

  const renderMatrixEditor = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="role_name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          Role Name
        </Label>
        <Input 
          id="role_name" 
          className="h-12 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl shadow-sm transition-all duration-200" 
          value={formName} 
          onChange={(e) => setFormName(e.target.value)} 
          placeholder="e.g. HR Manager" 
        />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Module Permissions</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllModules(true)}
            className="border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 text-sm"
          >
            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Select All</span>
            <span className="xs:hidden">All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllModules(false)}
            className="border-2 border-slate-300 hover:bg-slate-50 font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 text-sm"
          >
            <Square className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Deselect All</span>
            <span className="xs:hidden">None</span>
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/50 overflow-auto max-h-[60vh] sm:max-h-[70vh] shadow-lg">
        <table className="w-full text-xs sm:text-sm">
          <thead className="sticky top-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
            <tr>
              <th className="text-left p-2 sm:p-4 min-w-[200px] sm:min-w-[280px] font-bold text-xs sm:text-sm">Module / Submodule</th>
              {actions.map((action) => (
                <th key={action} className="text-center p-2 sm:p-4">
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <div className="font-black text-sm sm:text-lg tracking-wider">{ACTION_SHORT_LABEL[action]}</div>
                    <div className="text-[10px] sm:text-xs uppercase opacity-90 font-medium">{action}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.map((module, moduleIndex) => (
              <React.Fragment key={module.key}>
                <tr className={`border-t border-slate-200 ${moduleIndex % 2 === 0 ? 'bg-gradient-to-r from-emerald-50/50 to-transparent' : 'bg-gradient-to-r from-teal-50/50 to-transparent'} hover:from-emerald-100/50 hover:to-teal-100/50 transition-all duration-200`}>
                  <td className="p-2 sm:p-4 font-bold text-slate-800 flex items-center gap-1 sm:gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <span className="text-xs sm:text-sm truncate">{module.label}</span>
                  </td>
                  {actions.map((action) => (
                    <td key={action} className="p-2 sm:p-4 text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={formModules[module.key]?.permissions?.[action] === 1} 
                          onCheckedChange={(checked) => togglePermission(module.key, action, checked)}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500 scale-75 sm:scale-100"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                {module.submodules.map((submodule, subIndex) => (
                  <tr 
                    key={`${module.key}-${submodule.key}`} 
                    className={`border-t border-slate-100 ${subIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200`}
                  >
                    <td className="p-2 sm:p-4 pl-6 sm:pl-12 text-slate-600 flex items-center gap-1 sm:gap-2">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"></div>
                      <span className="text-xs sm:text-sm truncate">{submodule.label}</span>
                    </td>
                    {actions.map((action) => (
                      <td key={action} className="p-2 sm:p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={formModules[module.key]?.submodules?.[submodule.key]?.permissions?.[action] === 1}
                            onCheckedChange={(checked) => togglePermission(module.key, action, checked, submodule.key)}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-400 data-[state=checked]:to-teal-400 scale-75 sm:scale-100"
                            size="sm"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
        <Button 
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base w-full sm:w-auto" 
          onClick={saveForm} 
          disabled={!formName.trim()}
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Save Role
        </Button>
        <Button 
          variant="outline" 
          onClick={cancelForm}
          className="border-2 border-slate-300 hover:bg-slate-50 font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-xl transition-all duration-200 w-full sm:w-auto"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 min-h-screen">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-3xl"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-wrap items-center justify-between gap-4 lg:gap-6">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3">
                    <div className="p-2 lg:p-3 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/30">
                      <ShieldCheck className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight text-white flex items-center justify-center lg:justify-start gap-2 lg:gap-3">
                        Role Access Debug
                        <Sparkles className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-300 animate-pulse" />
                      </h1>
                      <p className="text-white/90 text-xs sm:text-sm lg:text-base mt-1 lg:mt-2 font-medium text-center lg:text-left">Configure module and submodule permissions with advanced matrix controls</p>
                    </div>
                  </div>
                </div>
              <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2 lg:px-4 lg:py-2">
                  <div className="flex items-center gap-1 lg:gap-2 text-white">
                    <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="font-bold text-sm lg:text-base">{allRoles.length}</span>
                    <span className="text-xs lg:text-sm text-white/80">Roles</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2 lg:px-4 lg:py-2">
                  <div className="flex items-center gap-1 lg:gap-2 text-white">
                    <Grid3x3 className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="font-bold text-sm lg:text-base">{catalog.length}</span>
                    <span className="text-xs lg:text-sm text-white/80">Modules</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2 lg:px-4 lg:py-2">
                  <div className="flex items-center gap-1 lg:gap-2 text-white">
                    <Zap className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="font-bold text-sm lg:text-base">{enabledMatrixCount}</span>
                    <span className="text-xs lg:text-sm text-white/80">Cells</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 lg:gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
              <div className="p-1.5 lg:p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg lg:rounded-xl">
                <Settings className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="truncate">RBAC Control Panel</span>
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">Manage role-based access control with {actions.join(", ")} actions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-wrap gap-2 lg:gap-3 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={bootstrap} 
              disabled={loading}
              className="border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 font-medium px-3 py-2 lg:px-6 lg:py-3 rounded-xl transition-all duration-200 text-sm lg:text-base"
            >
              <RefreshCw className={`w-3 h-3 lg:w-5 lg:h-5 mr-1 lg:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            {canManageRoles && (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 px-3 py-2 lg:px-6 lg:py-3 rounded-xl text-sm lg:text-base" 
                onClick={beginCreate}
              >
                <Plus className="w-3 h-3 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Create New Role</span>
                <span className="sm:hidden">New Role</span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Matrix Editor */}
        {isEditorOpen && canManageRoles && (
          <Card ref={editorCardRef} className="rounded-2xl sm:rounded-3xl border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 lg:gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <Key className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
                {addingNewRole ? "Create New Role" : "Edit Role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {renderMatrixEditor()}
            </CardContent>
          </Card>
        )}

        {/* Existing Roles */}
        <Card className="rounded-2xl sm:rounded-3xl border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 lg:gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
              <div className="p-1.5 lg:p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg lg:rounded-xl">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
              </div>
              Existing Roles
            </CardTitle>
            <CardDescription className="text-slate-600 font-medium">Manage roles, modules, submodules and their assigned privileges.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {allRoles.map((role, roleIndex) => (
              <div key={role.id} className="border-2 border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-br from-white to-slate-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-lg sm:text-xl text-slate-900 truncate max-w-[200px] sm:max-w-none">{role.name}</div>
                      {role.role_id && <Badge className="bg-slate-100 text-slate-700 border border-slate-300 font-medium mt-1 text-xs sm:text-sm">{role.role_id}</Badge>}
                    </div>
                  </div>
                  {canManageRoles && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyRole(role)}
                        className="border-2 border-slate-300 hover:bg-slate-50 font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Copy</span>
                        <span className="xs:hidden">📋</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => beginEdit(role)}
                        className="border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Edit</span>
                        <span className="xs:hidden">✏️</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-red-300 hover:bg-red-50 text-red-600 font-medium px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 text-xs sm:text-sm" 
                        onClick={() => deleteRole(role.id)}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Delete</span>
                        <span className="xs:hidden">🗑️</span>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="rounded-xl sm:rounded-2xl border-2 border-slate-200 overflow-auto shadow-inner bg-gradient-to-br from-white to-slate-50/50">
                  <table className="w-full text-[10px] sm:text-xs">
                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <tr>
                        <th className="text-left p-2 sm:p-4 min-w-[150px] sm:min-w-[280px] font-black text-xs sm:text-sm text-white">Module / Submodule</th>
                        {actions.map((action) => (
                          <th key={action} className="text-center p-2 sm:p-4">
                            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                              <div className="font-black text-sm sm:text-lg">{ACTION_SHORT_LABEL[action]}</div>
                              <div className="text-[9px] sm:text-xs uppercase opacity-90">{action}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((module, moduleIndex) => (
                        <React.Fragment key={`${role.id}-${module.key}`}>
                          <tr className={`border-t border-slate-200 ${moduleIndex % 2 === 0 ? 'bg-gradient-to-r from-emerald-50/50 to-transparent' : 'bg-gradient-to-r from-teal-50/50 to-transparent'} hover:from-emerald-100/50 hover:to-teal-100/50 transition-all duration-200`}>
                            <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                              {module.label}
                            </td>
                            {actions.map((action) => (
                              <td key={action} className="text-center p-4">
                                {role.modules[module.key]?.permissions?.[action] === 1 ? (
                                  <div className="flex justify-center">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg">
                                      <Unlock className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 border-2 border-slate-300">
                                      <Lock className="w-3 h-3 text-slate-500" />
                                    </div>
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                          {module.submodules.map((submodule, subIndex) => (
                            <tr 
                              key={`${role.id}-${module.key}-${submodule.key}`} 
                              className={`border-t border-slate-100 ${subIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200`}
                            >
                              <td className="p-4 pl-12 text-slate-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                {submodule.label}
                              </td>
                              {actions.map((action) => (
                                <td key={action} className="text-center p-4">
                                  {role.modules[module.key]?.submodules?.[submodule.key]?.permissions?.[action] === 1 ? (
                                    <div className="flex justify-center">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 shadow-md">
                                        <Unlock className="w-3 h-3 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border border-slate-300">
                                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                                      </div>
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
