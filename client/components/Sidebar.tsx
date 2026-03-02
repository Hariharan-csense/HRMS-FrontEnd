import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { handleLogout } from "@/components/helper/login/login";
import logo from "../assets/logo.png";

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
    background: linear-gradient(135deg, #17c491 0%, #0fa372 100%);
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

  /* Mobile-specific improvements */
  @media (max-width: 1023px) {
    .sidebar-nav-item:hover {
      transform: none;
    }
    
    .sidebar-submenu-item:hover {
      transform: none;
    }
    
    .sidebar-logout-btn:hover {
      transform: none;
    }
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
  Waves,
  Settings,
  MapPin,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Activity,
 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getAllowedModulesFromSubscription } from "@/utils/subscriptionModules";
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
    label: "Quick Actions",
    icon: <Activity className="w-5 h-5" />,
    roles: [],
    moduleName: "quick_actions", // Give it a proper module name
    submenu: [
      {
        label: "Mark Attendance",
        path: "/attendance/capture",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Apply for Leave",
        path: "/leave/apply",
        roles: [],
        icon: <div />,
        moduleName: "leave",
      },
      {
        label: "View Payslip",
        path: "/payroll/payslips",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
      },
      {
        label: "Submit Expense Claim",
        path: "/expenses/claims",
        roles: [],
        icon: <div />,
        moduleName: "expenses",
      },
    ],
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
      // {
      //   label: "Roles & Permissions",
      //   path: "/organization/roles",
      //   roles: [],
      //   icon: <div />,
      //   moduleName: "organization",
      // },
    ],
  },
  {
    label: "Role & Module Access Debug",
    icon: <Settings className="w-5 h-5" />,
    path: "/debug/roles",
    roles: ["admin", "ceo"],
    moduleName: "role_access",
  },
  
  {
    label: "RMS & Recruitment",
    icon: <Users className="w-5 h-5" />,
    roles: [],
    moduleName: "hr_management",
    submenu: [
      {
        label: "Requirements",
        path: "/hr/requirements",
        roles: [],
        icon: <div />,
        moduleName: "hr_management",
      },
      {
        label: "Recruitment",
        path: "/hr/recruitment",
        roles: [],
        icon: <div />,
        moduleName: "hr_management",
      },
      {
        label: "Offer Letters",
        path: "/hr/offer-letters",
        roles: [],
        icon: <div />,
        moduleName: "hr_management",
      },
      {
        label: "Onboarding",
        path: "/hr/onboarding",
        roles: [],
        icon: <div />,
        moduleName: "hr_management",
      },
    
    ],
  },
  {
    label: "Client Attendance",
    icon: <MapPin className="w-5 h-5" />,
    roles: [],
    moduleName: "client_attendance",
    path: "/client-attendance",
  },
  {
    label: "My Clients",
    icon: <Building2 className="w-5 h-5" />,
    roles: [],
    moduleName: "my_clients",
    path: "/my-clients",
  },
  {
    label: "My Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    roles: [],
    moduleName: "my_analytics",
    path: "/my-analytics",
  },
  {
    label: "Client Attendance Admin",
    icon: <MessageSquare className="w-5 h-5" />,
    roles: [],
    moduleName: "client_attendance_admin",
    path: "/client-attendance-admin",
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
        moduleName: "attendance",
        subModuleName: "shift",
      },
      {
        label: "Live Tracking",
        path: "/attendance/live-tracking",
        roles: [],
        icon: <div />,
        moduleName: "live_tracking",
      },
    ],
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
      {
        label: "Permission Module",
        path: "/leave/permission",
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
        {
        label: "F&F Settlement",
        path: "/exit/settlement",
        roles: [],
        icon: <div />,
        moduleName: "exit",
      },
    ],
  },
  {
    label: "Pulse Surveys",
    icon: <Activity className="w-5 h-5" />,
    roles: [],
    moduleName: "pulse_surveys",  
    submenu: [
      {
        label: "Overview",
        path: "/pulse-surveys/dashboard",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "Results",
        path: "/pulse-surveys/results",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "Create Survey",
        path: "/pulse-surveys/create",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "Templates",
        path: "/pulse-surveys/templates",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "Feedback Inbox",
        path: "/pulse-surveys/feedback-inbox",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "My Surveys",
        path: "/pulse-surveys/my-surveys",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
      {
        label: "Send Feedback",
        path: "/pulse-surveys/feedback",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
      },
    ],
  },
 
  // {
  //   label: "Subscription",
  //   icon: <CreditCard className="w-5 h-5" />,
  //   roles: [],
  //   moduleName: "subscription",
  //   path: "/subscription",
  // },
  {
    label: "Subscription Plans",
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ["superadmin"],
    moduleName: "subscription_plans",
    path: "/subscription-plans",
  },
  // {
  //   label: "Super Admin Dashboard",
  //   icon: <BarChart3 className="w-5 h-5" />,
  //   roles: [],
  //   moduleName: undefined, // Accessible for development
  //   path: "/superadmin-dashboard",
  // },
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
      {
        label: "Export Data",
        path: "/export/data",
        roles: ["admin", "hr"],
        icon: <div />,
        moduleName: "reports",
      },
         {
        label: "Employee Reports",
        path: "/employees/reports",
        roles: ["admin", "hr"],
        icon: <div />,
        moduleName: "reports",
      },
    ],
  },
 

      
  {
    label: "Subscription",
    icon: <CreditCard className="w-5 h-5" />,
    roles: ["admin", "ceo"],
    moduleName: "subscription",
    path: "/subscription",
  },
  {
    label: "Organizations",
    icon: <Building2 className="w-5 h-5" />,
    roles: ["superadmin"],
    moduleName: "organizations",
    path: "/organizations",
  },
  {
    label: "Users",
    icon: <Users className="w-5 h-5" />,
    roles: ["superadmin"],
    moduleName: "users",
    path: "/users",
  },
  {
    label: "Ticket Management",
    icon: <HelpCircle className="w-5 h-5" />,
    roles: [],
    moduleName: "tickets",
    path: "/tickets",
  },


];

export const Sidebar: React.FC = () => {
  const SIDEBAR_SCROLL_KEY = "hrms.sidebar.scrollTop";
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canPerformModuleAction, loading: roleLoading, userRoles } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    navigationItems
      .filter(
        (item) =>
          item.submenu &&
          item.submenu.some(
            (subitem) =>
              Boolean(subitem.path) && location.pathname.startsWith(subitem.path!)
          )
      )
      .map((item) => item.label)
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-expand menu items based on current route.
  useEffect(() => {
    const activeItems: string[] = [];
    
    navigationItems.forEach((item) => {
      if (item.submenu && item.submenu.length > 0) {
        const hasActiveSubmenu = item.submenu.some((subitem) =>
          subitem.path && location.pathname.startsWith(subitem.path)
        );
        if (hasActiveSubmenu) {
          activeItems.push(item.label);
        }
      }
    });
    
    setExpandedItems(prev => [...new Set([...prev, ...activeItems])]);
  }, [location.pathname]);

  // Wire scroll persistence listener once per mount.
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      window.sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(navElement.scrollTop)
      );
    };

    navElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => navElement.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll after route/expansion updates so it doesn't jump to top.
  useLayoutEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (savedScrollTop === null) return;

    const nextScrollTop = Number(savedScrollTop);
    if (Number.isNaN(nextScrollTop)) return;

    navElement.scrollTop = nextScrollTop;
  }, [location.pathname, expandedItems]);

  if (!user) return null;

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const persistScrollAndHandleNav = () => {
    if (navRef.current) {
      window.sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(navRef.current.scrollTop)
      );
    }
    setIsMobileOpen(false);
  };

  const normalizedUserRoles = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    user.role || "",
  ]
    .map((role) => String(role || "").toLowerCase())
    .filter(Boolean);
  const isSuperAdmin = normalizedUserRoles.includes("superadmin");
  const isEmployeeUser = normalizedUserRoles.includes("employee");

  const allowedModulesForPlan = useMemo(() => {
    if (isSuperAdmin) return null;
    return getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });
  }, [
    isSuperAdmin,
    subscription,
    subscriptionLoading,
  ]);

  const normalizeSubmoduleKey = (value: string) =>
    value.toLowerCase().replace(/[\s-]+/g, "_");

  const inferSubmoduleFromPath = (item: NavItem): string | undefined => {
    if (item.subModuleName) return normalizeSubmoduleKey(item.subModuleName);
    if (!item.moduleName || !item.path) return undefined;

    const path = item.path;
    switch (item.moduleName) {
      case "organization":
        if (path.includes("/organization/company")) return "company";
        if (path.includes("/organization/branches")) return "branches";
        if (path.includes("/organization/departments")) return "departments";
        if (path.includes("/organization/designations")) return "designations";
        if (path.includes("/organization/role-management")) return "role_management";
        return undefined;
      case "hr_management":
        if (path.includes("/hr/requirements")) return "requirements";
        if (path.includes("/hr/recruitment")) return "recruitment";
        if (path.includes("/hr/offer-letters")) return "offer_letters";
        if (path.includes("/hr/onboarding")) return "onboarding";
        return undefined;
      case "attendance":
        if (path.includes("/attendance/capture")) return "capture";
        if (path.includes("/attendance/log")) return "log";
        if (path.includes("/attendance/override")) return "override";
        return undefined;
      case "leave":
        if (path.includes("/leave/apply")) return "apply";
        if (path.includes("/leave/balance")) return "balance";
        if (path.includes("/leave/approvals")) return "approvals";
        if (path.includes("/leave/config")) return "config";
        if (path.includes("/leave/permission")) return "permission";
        return undefined;
      case "expenses":
        if (path.includes("/expenses/claims")) return "claims";
        if (path.includes("/expenses/approvals")) return "approvals";
        return undefined;
      case "assets":
        if (path.includes("/assets/list")) return "list";
        return undefined;
      case "exit":
        if (path.includes("/exit/resignations")) return "resignations";
        if (path.includes("/exit/checklist")) return "checklist";
        if (path.includes("/exit/settlement")) return "settlement";
        return undefined;
      case "pulse_surveys":
        if (path.includes("/pulse-surveys/dashboard")) return "dashboard";
        if (path.includes("/pulse-surveys/results")) return "results";
        if (path.includes("/pulse-surveys/create")) return "create";
        if (path.includes("/pulse-surveys/templates")) return "templates";
        if (path.includes("/pulse-surveys/feedback-inbox")) return "feedback_inbox";
        if (path.includes("/pulse-surveys/my-surveys")) return "my_surveys";
        if (path.includes("/pulse-surveys/feedback")) return "feedback";
        if (path.includes("/pulse-surveys/respond")) return "respond";
        return undefined;
      case "reports":
        if (path.includes("/reports/attendance")) return "attendance";
        if (path.includes("/reports/leave")) return "leave";
        if (path.includes("/reports/payroll")) return "payroll";
        if (path.includes("/reports/finance")) return "finance";
        if (path.includes("/export/data")) return "export_data";
        if (path.includes("/employees/reports")) return "employee_reports";
        return undefined;
      default:
        return undefined;
    }
  };

  // Check if user has access to a navigation item based on module permissions
  const hasItemAccess = (item: NavItem): boolean => {
    // Enforce explicit role restrictions when provided.
    if (item.roles && item.roles.length > 0) {
      const roleSet = new Set(
        [...(Array.isArray(user.roles) ? user.roles : []), user.role || ""]
          .map((r) => String(r || "").toLowerCase())
          .filter(Boolean)
      );
      const allowed = item.roles.some((requiredRole) => roleSet.has(requiredRole.toLowerCase()));
      if (!allowed) {
        return false;
      }
    }

    // Subscription-based visibility (applies to non-superadmin users)
    if (!isSuperAdmin) {
      // Dashboard is always accessible
      if (item.label === "Dashboard") return true;

      // If subscription-based restriction is active, enforce it.
      // If it's null (trial full access), don't restrict sidebar by subscription.
      if (allowedModulesForPlan) {
        // If moduleName is undefined (non-dashboard), hide it (prevents showing items not tied to the plan)
        if (item.moduleName === undefined) return false;

        // Hide anything not included in the subscribed plan
        if (!allowedModulesForPlan.has(item.moduleName)) return false;
      } else {
        // Trial full access: treat "always accessible" items as visible
        if (item.moduleName === undefined) return true;
      }
    }

    // While role permissions are loading, hide permission-bound items to avoid showing unauthorized modules.
    if (roleLoading) {
      return item.moduleName === undefined;
    }

    // Parent items with submenu should be shown when at least one submenu is accessible.
    if (item.submenu && item.submenu.length > 0) {
      return item.submenu.some((subItem) => hasItemAccess(subItem as NavItem));
    }

    // Submodule-aware visibility: prefer submodule RBAC check when available.
    const inferredSubmodule = inferSubmoduleFromPath(item);
    if (item.moduleName && inferredSubmodule) {
      return canPerformModuleAction(item.moduleName, "view", inferredSubmodule);
    }

    // If we get here and have a module name, check view permission
    if (item.moduleName) {
      return canPerformModuleAction(item.moduleName, "view");
    }

    return true;
  };

  // Debug: Log user roles and accessible modules (moved after function definition)
  if (process.env.NODE_ENV === "development") {
    console.log("=== SIDEBAR DEBUG ===");
    console.log("User Info:", {
      name: user.name,
      roles: user.roles,
      email: user.email
    });
    console.log("All Navigation Items:");
    navigationItems.forEach(item => {
      console.log(`- ${item.label}: moduleName=${item.moduleName}, hasAccess=${hasItemAccess(item)}`);
    });
    console.log("=== END SIDEBAR DEBUG ===");
  }

  const superAdminAllowedPaths = new Set([
    "/dashboard",
    "/subscription-plans",
    "/organizations",
    "/users",
  ]);

  const filteredItems = isSuperAdmin
    ? navigationItems.filter((item) => item.path && superAdminAllowedPaths.has(item.path))
    : navigationItems.filter((item) => hasItemAccess(item));

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
      userDepartment: user.department,
      roleLoading,
      userRoleData: userRoles
    });
  }

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({
    item,
    level = 0,
  }) => {
    const isExpanded = expandedItems.includes(item.label);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    let filteredSubmenu = hasSubmenu
      ? item.submenu.filter((sub) => hasItemAccess(sub as NavItem))
      : [];

    if (item.label === "Pulse Surveys" && isEmployeeUser) {
      filteredSubmenu = filteredSubmenu.filter(
        (subitem) =>
          subitem.path === "/pulse-surveys/my-surveys" ||
          subitem.path === "/pulse-surveys/feedback"
      );
    }

    const isItemActive = Boolean(
      item.path && location.pathname.startsWith(item.path)
    );

    const isAnySubmenuActive = Boolean(
      hasSubmenu &&
        filteredSubmenu.some((subitem) =>
          Boolean(subitem.path && location.pathname.startsWith(subitem.path))
        )
    );

    const isActive = isItemActive || isAnySubmenuActive;

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
                  onClick={persistScrollAndHandleNav}
                  className={cn(
                    "sidebar-submenu-item flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-all",
                    subitem.path && location.pathname.startsWith(subitem.path)
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
        onClick={persistScrollAndHandleNav}
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
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sidebar-menu-toggle shadow-md bg-background/80 backdrop-blur-sm"
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
          "h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:relative lg:z-0", // Desktop-ல எப்போதும் visible, relative positioning
          "fixed top-0 left-0 z-30", // Mobile-ல fixed
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-24 p-2 flex items-center justify-center border-b border-sidebar-border/50 transition-colors">
          <Link to="/dashboard" className="flex items-center justify-center group">
            <div className="w-28 h-28 flex items-center justify-center overflow-hidden transition-all duration-300 ">
              <img
                src={logo}
                alt="HRMS Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav ref={navRef} className="flex-1 overflow-y-auto p-3 space-y-2">
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
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};
