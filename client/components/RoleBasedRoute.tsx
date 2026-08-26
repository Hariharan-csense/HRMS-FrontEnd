import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  getAllowedModulesFromSubscription,
} from "@/utils/subscriptionModules";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredModule?: string;
  requiredAction?: string;
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredModule,
  requiredAction,
  fallbackPath,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const {
    hasAnyRole,
    hasModuleAccess,
    canPerformModuleAction,
    loading: roleLoading,
    userRoleNames,
  } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const inferSubmoduleFromPath = (moduleName?: string, pathname?: string): string | undefined => {
    const normalizedModule = String(moduleName || "").toLowerCase();
    const path = String(pathname || "").toLowerCase();

    switch (normalizedModule) {
      case "organization":
        if (path.includes("/organization/company")) return "company";
        if (path.includes("/organization/branches")) return "branches";
        if (path.includes("/organization/departments")) return "departments";
        if (path.includes("/organization/designations")) return "designations";
        if (path.includes("/organization/policies")) return "policies";
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
        if (path.includes("/attendance/facial-recognition")) return "facial_recognition";
        if (path.includes("/attendance/log")) return "log";
        if (path.includes("/attendance/monthly-report")) return "monthly_report";
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
      case "employees":
        if (path === "/employees" || path.endsWith("/employees")) return "list";
        if (path.includes("/employees/register")) return "list";
        if (path.includes("/employees/reports")) return "reports";
        if (path.includes("/profile")) return "profile";
        return undefined;
      case "reports":
        if (path.includes("/reports/attendance")) return "attendance";
        if (path.includes("/reports/leave")) return "leave";
        if (path.includes("/reports/payroll")) return "payroll";
        if (path.includes("/reports/finance")) return "finance";
        if (path.includes("/export/data")) return "export_data";
        if (path.includes("/employees/reports")) return "employee_reports";
        return undefined;
      case "pulse_surveys":
        if (path.includes("/pulse-surveys/dashboard")) return "dashboard";
        if (path.includes("/pulse-surveys/daily-log")) return "daily_log";
        if (path.includes("/pulse-surveys/results")) return "results";
        if (path.includes("/pulse-surveys/create")) return "create";
        if (path.includes("/pulse-surveys/templates")) return "templates";
        if (path.includes("/pulse-surveys/feedback-inbox")) return "feedback_inbox";
        if (path.includes("/pulse-surveys/my-surveys")) return "my_surveys";
        if (path.includes("/pulse-surveys/feedback")) return "feedback";
        if (path.includes("/pulse-surveys/respond")) return "respond";
        return undefined;
      case "kpi":
        if (path.includes("/kpi/dashboard")) return "dashboard";
        if (path.includes("/kpi/scorecard")) return "scorecard";
        if (path.includes("/kpi/review")) return "review";
        if (path.includes("/kpi/corrective-actions")) return "corrective_actions";
        if (path.includes("/kpi/reports")) return "reports";
        return undefined;
      default:
        return undefined;
    }
  };

  // Show loading while checking authentication
  if (isLoading || roleLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check module-based access control
  if (requiredModule) {
    const inferredSubmodule = inferSubmoduleFromPath(requiredModule, location.pathname);
    const currentEmployeeId = Number(user.employee_id || user.employeeId || user.id || 0) || null;
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
    const primaryUserRole = String(user.role || "").trim().toLowerCase();
    const accountType = String(user.type || "").trim().toLowerCase();
    const effectiveRouteRoles =
      primaryUserRole &&
      !["employee", "admin", "ceo", "superadmin"].includes(primaryUserRole)
        ? [primaryUserRole]
        : normalizedUserRoles;
    const isSuperAdmin =
      primaryUserRole === "superadmin" || accountType === "superadmin";
    const isAdmin =
      primaryUserRole === "admin" || accountType === "admin";
    const isAdminOrCeo =
      isAdmin || primaryUserRole === "ceo";
    const allowedModulesForPlan = isSuperAdmin
      ? null
      : getAllowedModulesFromSubscription(subscription, subscriptionLoading, {
          trialEndingSoonDays: 2,
          currentEmployeeId,
          addonAdminBypass: isAdminOrCeo,
        });
    const blockedByPlan =
      !isSuperAdmin &&
      allowedModulesForPlan !== null &&
      !allowedModulesForPlan.has(requiredModule);

    if (blockedByPlan) {
      return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Subscription required</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your current plan does not include this module.
            </p>
          </div>
        </div>
      );
    }

    // If specific action is required, check for that action
    if (requiredAction) {
      const hasRequiredAccess =
        (inferredSubmodule
          ? canPerformModuleAction(requiredModule, requiredAction, inferredSubmodule)
          : canPerformModuleAction(requiredModule, requiredAction));

      if (!hasRequiredAccess) {
        // If a fallback path is provided, navigate there; otherwise show a not-authorized message
        return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Not authorized</h2>
              <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
            </div>
          </div>
        );
      }
    } else {
      // Otherwise, just check for view access
      const hasViewAccess =
        (inferredSubmodule
          ? canPerformModuleAction(requiredModule, "view", inferredSubmodule)
          : hasModuleAccess(requiredModule));

      if (!hasViewAccess) {
        return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Not authorized</h2>
              <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
            </div>
          </div>
        );
      }
    }
  }

  // Check role-based access control (legacy support)
  if (!requiredModule && allowedRoles && allowedRoles.length > 0) {
    if (!hasAnyRole(allowedRoles)) {
      return fallbackPath ? <Navigate to={fallbackPath} replace /> : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Not authorized</h2>
            <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Higher-order component for specific role checks
export const withRoleAccess = (
  Component: React.ComponentType<any>,
  options: {
    allowedRoles?: string[];
    requiredModule?: string;
    requiredAction?: string;
    fallbackPath?: string;
  }
) => {
  return (props: any) => (
    <RoleBasedRoute {...options}>
      <Component {...props} />
    </RoleBasedRoute>
  );
};

// Module-based protection components
export const withModuleAccess = (
  Component: React.ComponentType<any>,
  module: string,
  action?: string
) => {
  return withRoleAccess(Component, { requiredModule: module, requiredAction: action });
};
