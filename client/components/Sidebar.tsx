import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  TrendingUp,
  ChevronsLeft,
  ChevronsRight,
  Bot,
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

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/dashboard",
    roles: [],
    moduleName: "dashboard",
  },
  // {
  //   label: "Quick Actions",
  //   icon: <Activity className="w-5 h-5" />,
  //   roles: [],
  //   moduleName: "quick_actions", // Give it a proper module name
  //   submenu: [
  //     {
  //       label: "Mark Attendance",
  //       path: "/attendance/capture",
  //       roles: [],
  //       icon: <div />,
  //       moduleName: "attendance",
  //     },
  //     {
  //       label: "Apply for Leave",
  //       path: "/leave/apply",
  //       roles: [],
  //       icon: <div />,
  //       moduleName: "leave",
  //     },
  //     {
  //       label: "View Payslip",
  //       path: "/payroll/payslips",
  //       roles: [],
  //       icon: <div />,
  //       moduleName: "payroll",
  //     },
  //     {
  //       label: "Submit Expense Claim",
  //       path: "/expenses/claims",
  //       roles: [],
  //       icon: <div />,
  //       moduleName: "expenses",
  //     },
  //   ],
  // },
  // {
  //   label: "Employee Management",
  //   icon: <Users className="w-5 h-5" />,
  //   roles: [],
  //   moduleName: "employees",
  //   submenu: [
  //     {
  //       label: "Employee List",
  //       path: "/employees",
  //       roles: [],
  //       icon: <div />,
  //       moduleName: "employees",
  //     },

  //   ],
  // },
  {
    label: "Organization Setup",
    icon: <Building2 className="w-5 h-5" />,
    roles: [], // Empty roles - access controlled by module permissions
    moduleName: "organization",
    submenu: [
      {
        label: "Company",
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
        label: "Company Policy",
        path: "/organization/policies",
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
    label: "Roles & Permissions",
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
    label: "Field Force",
    icon: <MapPin className="w-5 h-5" />,
    roles: [],
    submenu: [
      {
        label: "Field Attendance",
        path: "/client-attendance",
        roles: [],
        icon: <div />,
        moduleName: "client_attendance",
      },
      {
        label: "Field Attendance Admin",
        path: "/client-attendance-admin",
        roles: [],
        icon: <div />,
        moduleName: "client_attendance_admin",
      },
      {
        label: "Client Assignment",
        path: "/client-assignment",
        roles: [],
        icon: <div />,
        moduleName: "client_attendance_admin",
      },
      {
        label: "Geo-Fence",
        path: "/client-geo-fence",
        roles: [],
        icon: <div />,
        moduleName: "client_attendance_admin",
      },
    ],
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
        label: "Facial Recognition",
        path: "/attendance/facial-recognition",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
        subModuleName: "facial_recognition",
      },
      {
        label: "Attendance Log",
        path: "/attendance/log",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Monthly Report",
        path: "/attendance/monthly-report",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
        subModuleName: "monthly_report",
      },

      {
        label: "Override Management",
        path: "/attendance/override",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
      },
      {
        label: "Shift/Roster Planner",
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
      {
        label: "ESSL Setup",
        path: "/attendance/setup",
        roles: [],
        icon: <div />,
        moduleName: "attendance",
        subModuleName: "setup",
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
        label: "Leave Types",
        path: "/leave/types",
        roles: [],
        icon: <div />,
        moduleName: "leave",
        subModuleName: "leave_types",
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

      {
        label: "Loan Management",
        path: "/payroll/loans",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
        subModuleName: "loans",
      },
      {
        label: "Audit Trail",
        path: "/payroll/audit-trail",
        roles: [],
        icon: <div />,
        moduleName: "payroll",
        subModuleName: "audit_trail",
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
        label: "No Due Form",
        path: "/exit/no-due",
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
    label: "Employee Surveys",
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
        label: "Daily Log",
        path: "/pulse-surveys/daily-log",
        roles: [],
        icon: <div />,
        moduleName: "pulse_surveys",
        subModuleName: "results",
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
    label: "KPI Management",
    icon: <TrendingUp className="w-5 h-5" />,
    roles: [],
    moduleName: "kpi",
    submenu: [
      {
        label: "Dashboard",
        path: "/KPI/dashboard",
        roles: [],
        icon: <div />,
        moduleName: "kpi",
        subModuleName: "dashboard",
      },

      {
        label: "KPI Scorecard",
        path: "/KPI/scorecard",
        roles: [],
        icon: <div />,
        moduleName: "kpi",
        subModuleName: "scorecard",
      },
      {
        label: "KPI Review",
        path: "/KPI/review",
        roles: [],
        icon: <div />,
        moduleName: "kpi",
        subModuleName: "review",
      },
      {
        label: "Corrective Action Plans",
        path: "/KPI/corrective-actions",
        roles: [],
        icon: <div />,
        moduleName: "kpi",
        subModuleName: "corrective_actions",
      },

      {
        label: "Reports",
        path: "/KPI/reports",
        roles: [],
        icon: <div />,
        moduleName: "kpi",
        subModuleName: "reports",
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

  {
    label: "HR Helpdesk",
    icon: <HelpCircle className="w-5 h-5" />,
    roles: [],
    moduleName: "hr_helpdesk",
    path: "/hr/helpdesk",
  },

  {
    label: "AI Assistant",
    icon: <Bot className="w-5 h-5" />,
    roles: [],
    moduleName: "ai_assistant",
    path: "/ai-assistant",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const SIDEBAR_SCROLL_KEY = "hrms.sidebar.scrollTop";
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    canPerformModuleAction,
    hasModuleAccess,
    loading: roleLoading,
    userRoles,
    userRoleNames,
  } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    navigationItems
      .filter(
        (item) =>
          item.submenu &&
          item.submenu.some(
            (subitem) =>
              Boolean(subitem.path) &&
              location.pathname.startsWith(subitem.path!),
          ),
      )
      .map((item) => item.label),
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-expand menu items based on current route - only add new items, never remove to prevent flicker
  useEffect(() => {
    const activeItems: string[] = [];

    navigationItems.forEach((item) => {
      if (item.submenu && item.submenu.length > 0) {
        const hasActiveSubmenu = item.submenu.some(
          (subitem) =>
            subitem.path && location.pathname.startsWith(subitem.path),
        );
        if (hasActiveSubmenu) {
          activeItems.push(item.label);
        }
      }
    });

    // Only update state if there are new items to add (prevents unnecessary re-renders)
    setExpandedItems((prev) => {
      const newItems = activeItems.filter((item) => !prev.includes(item));
      if (newItems.length === 0) return prev; // No change needed
      return [...prev, ...newItems];
    });

    // Restore page scroll position after navigation
    const savedScrollPos = window.sessionStorage.getItem(
      "PAGE_SCROLL_POSITION",
    );
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        window.sessionStorage.removeItem("PAGE_SCROLL_POSITION");
      }, 50);
    }

    const savedSidebarScroll =
      window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);

    window.setTimeout(() => {
      const navElement = navRef.current;
      if (!navElement) return;

      if (savedSidebarScroll !== null) {
        navElement.scrollTop = parseInt(savedSidebarScroll, 10) || 0;
        return;
      }

      const activeElement = navElement.querySelector(
        ".sidebar-submenu-item.active, .sidebar-nav-item.active",
      );

      if (activeElement instanceof HTMLElement) {
        const navRect = navElement.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        const isOutsideView =
          activeRect.top < navRect.top || activeRect.bottom > navRect.bottom;

        if (isOutsideView) {
          activeElement.scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, 100);
  }, [location.pathname]);

  // Debounced scroll persistence to prevent excessive updates
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        window.sessionStorage.setItem(
          SIDEBAR_SCROLL_KEY,
          String(navElement.scrollTop),
        );
      }, 150); // Debounce scroll saves
    };

    navElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      navElement.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!user) return null;

  const toggleExpand = (label: string) => {
    const scrollTop = navRef.current?.scrollTop ?? 0;
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
    window.setTimeout(() => {
      if (navRef.current) {
        navRef.current.scrollTop = scrollTop;
      }
    }, 0);
  };

  const persistScrollAndHandleNav = () => {
    if (navRef.current) {
      window.sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(navRef.current.scrollTop),
      );
    }
    // Save main content scroll position
    const mainContent = document.querySelector("main") || window;
    const scrollPos = window.scrollY || window.pageYOffset || 0;
    window.sessionStorage.setItem("PAGE_SCROLL_POSITION", String(scrollPos));
    setIsMobileOpen(false);
  };

  const normalizedUserRoles = userRoleNames.length
    ? userRoleNames
    : String(user.type || "").toLowerCase() === "employee"
      ? [user.role || ""]
          .map((role) => String(role || "").toLowerCase())
          .filter(Boolean)
      : [
          ...(Array.isArray(user.roles) ? user.roles : []),
          user.role || "",
          user.type || "",
        ]
          .map((role) => String(role || "").toLowerCase())
          .filter(Boolean);
  const primaryUserRole = String(user.role || "")
    .trim()
    .toLowerCase();
  const accountType = String(user.type || "")
    .trim()
    .toLowerCase();
  const effectiveSidebarRoles =
    primaryUserRole &&
    !["employee", "admin", "ceo", "superadmin"].includes(primaryUserRole)
      ? [primaryUserRole]
      : normalizedUserRoles;
  // Only the account's primary role/type can grant authority. Assigned role
  // names must never turn a normal Employee account into an Admin/CEO, while
  // employee-table accounts whose actual primary role is Admin/CEO still work.
  const isSuperAdmin =
    primaryUserRole === "superadmin" || accountType === "superadmin";
  const isCeo = primaryUserRole === "ceo";
  const isAdmin = primaryUserRole === "admin" || accountType === "admin";
  const isEmployeeUser = effectiveSidebarRoles.includes("employee");
  const isInternalCompany = Boolean(subscription?.is_internal_company);

  const allowedModulesForPlan = useMemo(() => {
    if (isSuperAdmin) return null;
    return getAllowedModulesFromSubscription(
      subscription,
      subscriptionLoading,
      {
        trialEndingSoonDays: 2,
        currentEmployeeId:
          Number(user.employee_id || user.employeeId || user.id || 0) || null,
        addonAdminBypass: isAdmin || isCeo,
      },
    );
  }, [
    isSuperAdmin,
    subscription,
    subscriptionLoading,
    user.employee_id,
    user.employeeId,
    user.id,
    isAdmin,
    isCeo,
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
        if (path.includes("/organization/policies")) return "policies";
        if (path.includes("/organization/role-management"))
          return "role_management";
        return undefined;
      case "hr_management":
        if (path.includes("/hr/requirements")) return "requirements";
        if (path.includes("/hr/recruitment")) return "recruitment";
        if (path.includes("/hr/offer-letters")) return "offer_letters";
        if (path.includes("/hr/onboarding")) return "onboarding";
        return undefined;
      case "employees":
        if (path === "/employees" || path.endsWith("/employees")) return "list";
        if (path.includes("/employees/register")) return "list";
        if (path.includes("/employees/reports")) return "reports";
        if (path.includes("/profile")) return "profile";
        return undefined;
      case "attendance":
        if (path.includes("/attendance/capture")) return "capture";
        if (path.includes("/attendance/facial-recognition"))
          return "facial_recognition";
        if (path.includes("/attendance/log")) return "log";
        if (path.includes("/attendance/monthly-report"))
          return "monthly_report";
        if (path.includes("/attendance/override")) return "override";
        if (path.includes("/attendance/shift")) return "shift";
        if (path.includes("/attendance/roster")) return "roster";
        if (path.includes("/attendance/setup")) return "setup";
        return undefined;
      case "leave":
        if (path.includes("/leave/types")) return "leave_types";
        if (path.includes("/leave/apply")) return "apply";
        if (path.includes("/leave/balance")) return "balance";
        if (path.includes("/leave/approvals")) return "approvals";
        if (path.includes("/leave/config")) return "config";
        if (path.includes("/leave/permission")) return "permission";
        return undefined;
      case "payroll":
        if (path.includes("/payroll/structure")) return "salary_structure";
        if (path.includes("/payroll/process")) return "processing";
        if (path.includes("/payroll/payslips")) return "payslips";
        if (path.includes("/payroll/loans")) return "loans";
        if (path.includes("/payroll/audit-trail")) return "audit_trail";
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
        if (path.includes("/exit/no-due")) return "no_due";
        if (path.includes("/exit/settlement")) return "settlement";
        return undefined;
      case "pulse_surveys":
        if (path.includes("/pulse-surveys/dashboard")) return "dashboard";
        if (path.includes("/pulse-surveys/daily-log")) return "daily_log";
        if (path.includes("/pulse-surveys/results")) return "results";
        if (path.includes("/pulse-surveys/create")) return "create";
        if (path.includes("/pulse-surveys/templates")) return "templates";
        if (path.includes("/pulse-surveys/feedback-inbox"))
          return "feedback_inbox";
        if (path.includes("/pulse-surveys/my-surveys")) return "my_surveys";
        if (path.includes("/pulse-surveys/feedback")) return "feedback";
        if (path.includes("/pulse-surveys/respond")) return "respond";
        return undefined;
      case "kpi": {
        const normalizedPath = path.toLowerCase();
        if (normalizedPath.includes("/kpi/dashboard")) return "dashboard";
        if (normalizedPath.includes("/kpi/scorecard")) return "scorecard";
        if (normalizedPath.includes("/kpi/review")) return "review";
        if (normalizedPath.includes("/kpi/corrective-actions"))
          return "corrective_actions";
        if (normalizedPath.includes("/kpi/reports")) return "reports";
        return undefined;
      }
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
      const isPlatformSuperAdminItem = item.roles.some(
        (role) => String(role).toLowerCase() === "superadmin",
      );
      const roleSet = new Set(effectiveSidebarRoles);
      const allowed = item.roles.some((requiredRole) =>
        roleSet.has(requiredRole.toLowerCase()),
      );
      // Company modules are governed by saved RBAC. Keep hard-coded roles only
      // for platform-only entries that are not part of company role setup.
      if (isPlatformSuperAdminItem && !allowed) {
        return false;
      }
    }

    const hasConfiguredRoles = Array.isArray(userRoles) && userRoles.length > 0;

    // Subscription-based visibility (applies to non-superadmin users)
    // Run this before submenu recursion so plan-blocked parent modules like KPI
    // never appear in the sidebar even if a child would otherwise pass a fallback.
    if (!isSuperAdmin) {
      if (allowedModulesForPlan) {
        if (item.moduleName === undefined && !item.submenu?.length)
          return false;
        if (item.moduleName && !allowedModulesForPlan.has(item.moduleName)) {
          return false;
        }
      } else {
        if (item.moduleName === undefined && !item.submenu?.length) return true;
      }
    }

    // A parent is visible when its module is enabled and at least one child is
    // assigned. This supports roles configured at either module or submodule
    // granularity without displaying an empty menu.
    if (item.submenu && item.submenu.length > 0) {
      if (item.moduleName && !hasModuleAccess(item.moduleName)) {
        return false;
      }
      return item.submenu.some((subItem) => hasItemAccess(subItem as NavItem));
    }

    // While role permissions are loading, hide permission-bound items to avoid showing unauthorized modules.
    if (roleLoading) {
      return item.moduleName === undefined;
    }

    // Strict RBAC: if role records are missing or failed to load, do not show
    // permission-bound modules. Otherwise HR/other roles can see hardcoded menus.
    if (!hasConfiguredRoles) {
      return item.moduleName === undefined;
    }

    // Submodule-aware visibility: prefer submodule RBAC check when available.
    const inferredSubmodule = inferSubmoduleFromPath(item);
    if (item.moduleName && inferredSubmodule) {
      const hasAccess = canPerformModuleAction(
        item.moduleName,
        "view",
        inferredSubmodule,
      );
      if (
        process.env.NODE_ENV === "development" &&
        item.label === "ESSL Setup"
      ) {
        // console.log("ESSL Setup Permission Check:", {
        //   label: item.label,
        //   moduleName: item.moduleName,
        //   subModuleName: item.subModuleName,
        //   inferredSubmodule,
        //   hasAccess,
        //   path: item.path,
        // });
      }
      return hasAccess;
    }

    // If we get here and have a module name, check view permission
    if (item.moduleName) {
      return canPerformModuleAction(item.moduleName, "view");
    }

    return true;
  };

  // Debug: Log user roles and accessible modules (moved after function definition)
  if (process.env.NODE_ENV === "development") {
    // console.log("=== SIDEBAR DEBUG ===");
    // console.log("User Info:", {
    //   name: user.name,
    //   roles: user.roles,
    //   email: user.email,
    // });
    // console.log("All Navigation Items:");
    navigationItems.forEach((item) => {
      // console.log(
      //   `- ${item.label}: moduleName=${item.moduleName}, hasAccess=${hasItemAccess(item)}`,
      // );
    });
    // console.log("=== END SIDEBAR DEBUG ===");
  }

  const superAdminAllowedPaths = new Set([
    "/dashboard",
    "/subscription-plans",
    "/organizations",
    "/users",
  ]);

  const getVisibleSubmenu = (item: NavItem): NavItem[] => {
    if (!item.submenu?.length) return [];

    let visibleSubmenu = item.submenu.filter((subItem) =>
      hasItemAccess(subItem as NavItem),
    );

    if (
      item.label === "Employee Surveys" &&
      isEmployeeUser &&
      !isInternalCompany
    ) {
      visibleSubmenu = visibleSubmenu.filter(
        (subitem) =>
          subitem.path === "/pulse-surveys/my-surveys" ||
          subitem.path === "/pulse-surveys/feedback",
      );
    }

    return visibleSubmenu;
  };

  const filteredItems = isSuperAdmin
    ? navigationItems.filter(
        (item) => item.path && superAdminAllowedPaths.has(item.path),
      )
    : navigationItems.filter((item) => {
        if (item.submenu?.length) {
          return hasItemAccess(item) && getVisibleSubmenu(item).length > 0;
        }

        return hasItemAccess(item);
      });

  // Debug: Log filtered items
  if (process.env.NODE_ENV === "development") {
    // console.log("Sidebar Debug - Filtered Items:", {
    //   totalItems: navigationItems.length,
    //   filteredCount: filteredItems.length,
    //   filteredItems: filteredItems.map((item) => ({
    //     label: item.label,
    //     moduleName: item.moduleName,
    //     hasAccess: hasItemAccess(item),
    //   })),
    //   userRoles: user.roles,
    //   userDepartment: user.department,
    //   roleLoading,
    //   userRoleData: userRoles,
    // });
  }

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({
    item,
    level = 0,
  }) => {
    const isExpanded = expandedItems.includes(item.label);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const filteredSubmenu = getVisibleSubmenu(item);

    const isPathActive = (path?: string) => {
      if (!path) return false;
      if (location.pathname === path) return true;
      return path === "/pulse-surveys/results"
        ? location.pathname.startsWith("/pulse-surveys/results/")
        : false;
    };

    const isItemActive = isPathActive(item.path);

    const isAnySubmenuActive = Boolean(
      hasSubmenu &&
      filteredSubmenu.some((subitem) => isPathActive(subitem.path)),
    );

    const isActive = isItemActive || isAnySubmenuActive;

    if (hasSubmenu && filteredSubmenu.length === 0) {
      return null;
    }

    if (hasSubmenu) {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={() => {
              if (isCollapsed) {
                onToggleCollapse?.();
                setExpandedItems((prev) =>
                  prev.includes(item.label) ? prev : [...prev, item.label],
                );
                return;
              }
              toggleExpand(item.label);
            }}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "sidebar-nav-item w-full flex items-center gap-3 px-4 py-3 text-sm font-medium",
              isCollapsed && "justify-center gap-0 px-0",
              isActive
                ? "active text-primary-foreground"
                : isExpanded
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:text-primary",
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <span className="flex-1 text-left">{item.label}</span>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300 flex-shrink-0",
                isCollapsed && "hidden",
                isExpanded && "rotate-180",
              )}
            />
          </button>
          {!isCollapsed && isExpanded && filteredSubmenu.length > 0 && (
            <div className="ml-2 pl-3 border-l-2 border-primary/30 space-y-1 animate-in fade-in duration-200">
              {filteredSubmenu.map((subitem) => (
                <Link
                  key={subitem.label}
                  to={subitem.path!}
                  onClick={persistScrollAndHandleNav}
                  className={cn(
                    "sidebar-submenu-item flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-all",
                    isPathActive(subitem.path)
                      ? "active text-primary-foreground bg-primary/20 font-medium"
                      : "text-sidebar-foreground hover:text-primary",
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
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "sidebar-nav-item flex items-center gap-3 px-4 py-3 text-sm font-medium",
          isCollapsed && "justify-center gap-0 px-0",
          isActive
            ? "active text-primary-foreground"
            : "text-sidebar-foreground hover:text-primary",
        )}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!isCollapsed && <span>{item.label}</span>}
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
          "h-screen bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg",
          "transition-[width,transform] duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          "lg:translate-x-0 lg:relative lg:z-0", // Desktop-ல எப்போதும் visible, relative positioning
          "fixed top-0 left-0 z-30", // Mobile-ல fixed
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-24 p-2 flex items-center justify-center border-b border-sidebar-border/50 transition-colors relative",
            isCollapsed && "h-20",
          )}
        >
          <Link
            to="/dashboard"
            className="flex items-center justify-center group"
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <div
              className={cn(
                "w-28 h-28 flex items-center justify-center overflow-hidden transition-all duration-300",
                isCollapsed && "w-14 h-14",
              )}
            >
              <img
                src={logo}
                alt="HRMS Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          {onToggleCollapse && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background shadow-md"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          ref={navRef}
          className={cn(
            "flex-1 overflow-y-auto p-3 space-y-2",
            isCollapsed && "px-2",
          )}
        >
          {filteredItems.map((item) => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div
          className={cn(
            "sidebar-user-section p-4 border-t border-sidebar-border/50 space-y-2",
            isCollapsed && "px-2",
          )}
        >
          <button
            onClick={async () => {
              await logout();
            }}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "sidebar-logout-btn w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive rounded-lg font-medium",
              isCollapsed && "justify-center gap-0 px-0",
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
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
