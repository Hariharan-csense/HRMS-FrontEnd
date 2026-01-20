import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { handleLogout } from "@/components/helper/login/login";

const sidebarStyles = `
  .sidebar-nav-item {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    border-radius: 0.75rem;
  }

  .sidebar-nav-item:hover {
    transform: translateX(4px);
  }

  .sidebar-nav-item.active {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
    box-shadow: 0 8px 20px hsl(var(--primary) / 0.3);
    color: hsl(var(--primary-foreground));
    transform: scale(1.02);
  }

  .sidebar-nav-item.active svg {
    color: hsl(var(--primary-foreground));
  }

  .sidebar-nav-item:not(.active) {
    color: hsl(var(--sidebar-foreground));
  }

  .sidebar-nav-item:not(.active) svg {
    color: hsl(var(--sidebar-foreground));
  }

  .sidebar-submenu-item {
    transition: all 0.2s ease-out;
    background: hsl(var(--primary) / 0.08);
    border-left: 2px solid hsl(var(--primary) / 0.3);
    margin-left: 0.5rem;
    border-radius: 0.5rem;
  }

  .sidebar-submenu-item:hover {
    transform: translateX(4px);
    background: hsl(var(--primary) / 0.15);
    border-left-color: hsl(var(--primary) / 0.6);
  }

  .sidebar-submenu-item.active {
    background: hsl(var(--primary) / 0.2);
    border-left: 2px solid hsl(var(--primary));
    border-left-color: hsl(var(--primary));
    padding-left: calc(1rem - 2px);
    font-weight: 600;
    color: hsl(var(--primary));
  }

  .sidebar-logo-section {
    background: linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.05) 100%);
  }

  .sidebar-logo-badge {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
    box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
  }

  .sidebar-user-section {
    background: linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.05) 100%);
  }

  .sidebar-logout-btn {
    transition: all 0.2s ease-out;
    border-radius: 0.75rem;
  }

  .sidebar-logout-btn:hover {
    background: hsl(var(--destructive) / 0.1);
    transform: translateX(4px);
  }

  .sidebar-menu-toggle {
    transition: all 0.2s ease-out;
  }

  .sidebar-menu-toggle:hover {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
    color: hsl(var(--primary-foreground));
  }

  .sidebar-nav-section {
    padding: 0.5rem;
    gap: 0.5rem;
  }
`;
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  LogOut,
  FileText,
  Building2,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: NavItem[];
  roles: string[];
  moduleName?: string; // Maps to module in RoleConfig
  subModuleName?: string; // Maps to sub-module in RoleConfig (e.g., "payslips" for Payroll)
};

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/dashboard",
    roles: [], // Empty roles - access controlled by moduleName being undefined
    moduleName: undefined, // Always accessible
  },
  {
    label: "Organization Setup",
    icon: <Building2 className="w-5 h-5" />,
    roles: [], // Empty roles - access controlled by module permissions
    moduleName: "organization",
    submenu: [
      {
        label: "Company Master",
        path: "/organization/company",
        roles: [],
        icon: <div />,
        moduleName: "organization",
      },
      {
        label: "Branches",
        path: "/organization/branches",
        roles: [],
        icon: <div />,
        moduleName: "organization",
      },
      {
        label: "Departments",
        path: "/organization/departments",
        roles: [],
        icon: <div />,
        moduleName: "organization",
      },
      {
        label: "Designations",
        path: "/organization/designations",
        roles: [],
        icon: <div />,
        moduleName: "organization",
      },
      {
        label: "Roles & Permissions",
        path: "/organization/roles",
        roles: [],
        icon: <div />,
        moduleName: "organization",
      },
    ],
  },
  {
    label: "Role & Module Access Debug",
    icon: <Settings className="w-5 h-5" />,
    path: "/debug/roles",
    roles: [],
    moduleName: "role_access",
  },
  {
    label: "Employee Management",
    icon: <Users className="w-5 h-5" />,
    roles: [],
    moduleName: "employees",
    submenu: [
      {
        label: "Employee List",
        path: "/employees",
        roles: [],
        icon: <div />,
        moduleName: "employees",
      },
    ],
  },
  {
    label: "Attendance Management",
    icon: <Clock className="w-5 h-5" />,
    roles: [],
    moduleName: "attendance",
    submenu: [
      {
        label: "Check-In/Out",
        path: "/attendance/capture",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Attendance Log",
        path: "/attendance/log",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Override Management",
        path: "/attendance/override",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Shift Management",
        path: "/attendance/shift",
        roles: [],
        icon: <div />,
        moduleName: "shift management",
      },
    ],
  },
  {
    label: "Leave Management",
    icon: <Calendar className="w-5 h-5" />,
    roles: [],
    moduleName: "leave",
    submenu: [
      {
        label: "Apply Leave",
        path: "/leave/apply",
        roles: [],
        icon: <div />,
        moduleName: "leave",
      },
      {
        label: "Leave Balance",
        path: "/leave/balance",
        roles: [],
        icon: <div />,
        moduleName: "leave",
      },
      {
        label: "Leave Approvals",
        path: "/leave/approvals",
        roles: [],
        icon: <div />,
        moduleName: "leave",
      },
      {
        label: "Leave Config",
        path: "/leave/config",
        roles: [],
        icon: <div />,
        moduleName: "leave",
      },
    ],
  },
  {
    label: "Payroll",
    icon: <DollarSign className="w-5 h-5" />,
    roles: [],
    moduleName: "payroll",
    submenu: [
      {
        label: "Salary Structure",
        path: "/payroll/structure",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
        subModuleName: "salary-structure",
      },
      {
        label: "Process Payroll",
        path: "/payroll/process",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
        subModuleName: "processing",
      },
      {
        label: "Payslips",
        path: "/payroll/payslips",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
        subModuleName: "payslips",
      },
    ],
  },
  {
    label: "Expenses",
    icon: <CreditCard className="w-5 h-5" />,
    roles: [],
    moduleName: "expenses",
    path: "/expenses/claims", // Default path - will redirect to first accessible submenu
    submenu: [
      {
        label: "Expense Claims",
        path: "/expenses/claims",
        roles: [],
        icon: <div />,
        moduleName: "expenses",
      },
      {
        label: "Approve Claims",
        path: "/expenses/approvals",
        roles: [],
        icon: <div />,
        moduleName: "expenses",
      },
    ],
  },
  {
    label: "Assets",
    icon: <Package className="w-5 h-5" />,
    roles: [],
    moduleName: "assets",
    path: "/assets/list", // Default path - will redirect to first accessible submenu
    submenu: [
      {
        label: "Asset List",
        path: "/assets/list",
        roles: [],
        icon: <div />,
        moduleName: "assets",
      },
    ],
  },
  {
    label: "Exit & Offboarding",
    icon: <LogOut className="w-5 h-5" />,
    roles: [],
    moduleName: "exit",
    path: "/exit/resignations", // Default path - will redirect to first accessible submenu
    submenu: [
      {
        label: "Resignations",
        path: "/exit/resignations",
        roles: [],
        icon: <div />,
        moduleName: "exit",
      },
      {
        label: "Exit Checklist",
        path: "/exit/checklist",
        roles: [],
        icon: <div />,
        moduleName: "exit",
      },
    ],
  },
  {
    label: "Reports",
    icon: <FileText className="w-5 h-5" />,
    roles: [],
    moduleName: "reports",
    submenu: [
      {
        label: "Attendance Reports",
        path: "/reports/attendance",
        roles: [],
        icon: <div />,
        moduleName: "reports",
      },
      {
        label: "Leave Reports",
        path: "/reports/leave",
        roles: [],
        icon: <div />,
        moduleName: "reports",
      },
      {
        label: "Payroll Reports",
        path: "/reports/payroll",
        roles: [],
        icon: <div />,
        moduleName: "reports",
      },
      {
        label: "Finance Reports",
        path: "/reports/finance",
        roles: [],
        icon: <div />,
        moduleName: "reports",
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasRole, hasAnyRole, hasModuleAccess, canPerformModuleAction, loading: roleLoading, userRoles } = useRole();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  // Debug: Log user roles and accessible modules
  if (process.env.NODE_ENV === "development") {
    console.log("Sidebar Debug - User Info:", {
      name: user.name,
      roles: user.roles,
      email: user.email,
    });
  }

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  // Check if user has access to a navigation item based on module permissions
 const hasItemAccess = (item: NavItem): boolean => {
  // Dashboard is always accessible
  if (item.moduleName === undefined) {
    return true;
  }

  // Don't show items while loading permissions
  if (roleLoading) {
    return false;
  }

  // For Role & Module Access Debug, check if user has the specific module
  if (item.moduleName === "role_access") {
    return hasModuleAccess("Role & Modules Access");
  }

  // Check module access - this will use the dynamic permissions from API
  if (item.moduleName && !hasModuleAccess(item.moduleName)) {
    return false;
  }

  // For sub-modules, check specific permissions
  if (item.subModuleName) {
    // Special handling for payroll sub-modules
    if (item.moduleName === "payroll") {
      switch (item.subModuleName) {
        case "payslips":
          // Anyone with payroll view access can see payslips
          return canPerformModuleAction("payroll", "view");
        case "salary-structure":
        case "processing":
          // These require higher permissions, but HR with view access should see them
          // The actual permissions will be enforced at the route/component level
          return canPerformModuleAction("payroll", "view");
        default:
          return true;
      }
    }
  }

  // For reports, ensure view permission
  if (item.moduleName === "reports") {
    return canPerformModuleAction("reports", "view");
  }

  // If we get here and have a module name, check view permission
  if (item.moduleName) {
    return canPerformModuleAction(item.moduleName, "view");
  }

  return true;
};

  const filteredItems = navigationItems.filter((item) => hasItemAccess(item));

  // Debug: Log filtered items
  if (process.env.NODE_ENV === "development") {
    console.log("Sidebar Debug - Filtered Items:", {
      totalItems: navigationItems.length,
      filteredCount: filteredItems.length,
      filteredItems: filteredItems.map(item => ({
        label: item.label,
        moduleName: item.moduleName,
        hasAccess: hasItemAccess(item)
      })),
      userRoles: user.roles,
      roleLoading,
      userRoleData: userRoles
    });
  }

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({
    item,
    level = 0,
  }) => {
    const isActive =
      item.path && location.pathname.startsWith(item.path);
    const isExpanded = expandedItems.includes(item.label);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const filteredSubmenu = hasSubmenu
      ? item.submenu.filter((sub) => hasItemAccess(sub as NavItem))
      : [];

    if (hasSubmenu && filteredSubmenu.length === 0) {
      return null;
    }

    if (hasSubmenu) {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              "sidebar-nav-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium",
              isExpanded || isActive
                ? "active text-primary-foreground"
                : "text-sidebar-foreground hover:text-primary"
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300 flex-shrink-0",
                isExpanded && "rotate-180"
              )}
            />
          </button>
          {isExpanded && filteredSubmenu.length > 0 && (
            <div className="ml-2 pl-3 border-l-2 border-primary/30 space-y-1 animate-in fade-in duration-200">
              {filteredSubmenu.map((subitem) => (
                <Link
                  key={subitem.label}
                  to={subitem.path!}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "sidebar-submenu-item flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-all",
                    location.pathname === subitem.path
                      ? "active text-primary-foreground bg-primary/20 font-medium"
                      : "text-sidebar-foreground hover:text-primary"
                  )}
                >
                  <span>{subitem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        to={item.path!}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          "sidebar-nav-item flex items-center gap-3 px-4 py-3 text-sm font-medium",
          isActive
            ? "active text-primary-foreground"
            : "text-sidebar-foreground hover:text-primary"
        )}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sidebar-menu-toggle"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
  <aside
  className={cn(
    "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-30 shadow-lg",
    "transition-transform duration-300",
    "md:translate-x-0", // Desktop-ல எப்போதும் visible
    isMobileOpen ? "translate-x-0" : "-translate-x-full"
  )}
>
        {/* Logo */}
        <div className="sidebar-logo-section h-20 px-4 flex items-center border-b border-sidebar-border/50 transition-colors">
          <Link to="/dashboard" className="flex items-center gap-3 font-bold text-lg text-primary group">
            <div className="sidebar-logo-badge w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
              HR
            </div>
            <span className="hidden sm:inline group-hover:text-primary transition-colors">HRMS</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.map((item) => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="sidebar-user-section p-4 border-t border-sidebar-border/50 space-y-2">
          <button
            onClick={async () => {
              const result = await handleLogout();
              if (result.success) {
                navigate("/login");
              }
            }}
            className="sidebar-logout-btn w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive rounded-lg font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};
