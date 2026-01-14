import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";
import AssetList from "./pages/AssetList";
import MyAssets from "./pages/MyAssets";
import EmployeeList from "./pages/EmployeeList";
import AttendanceLog from "./pages/AttendanceLog";
import AttendanceCapture from "./pages/AttendanceCapture";
import AttendanceOverride from "./pages/AttendanceOverride";
import LeaveManagement from "./pages/LeaveManagementNew";
import LeaveApprovals from "./pages/LeaveApprovals";
import LeaveConfiguration from "./pages/LeaveConfiguration";
import PayrollSetup from "./pages/PayrollSetup";
import PayrollManagement from "./pages/PayrollManagement";
import ExpenseClaims from "./pages/ExpenseClaims";
import OrganizationSetup from "./pages/OrganizationSetup";
import ShiftManagement from "./pages/ShiftManagement";
import ExitOffboarding from "./pages/ExitOffboarding";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import ExpenseApprovals from "./pages/ExpenseApprovals";
import UserProfile from "./pages/UserProfile";
import RegisterUser from "./pages/RegisterUser";
import Signup from "./pages/Signup";
import RoleAccessDebug from "./pages/RoleAccessDebug";
import RoleTest from "./pages/RoleTest";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
};

// Public Routes Handler
const PublicRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{element}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={<PublicRoute element={<Login />} />}
      />
      <Route
        path="/signup"
        element={<PublicRoute element={<Signup />} />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={<Dashboard />} />}
      />

      {/* Organization Setup - Admin Only */}
      <Route
        path="/organization/company"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/branches"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/departments"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/designations"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/roles"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />

      {/* Employee Management - Admin, HR */}
      <Route
        path="/employees"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <EmployeeList />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employees/register"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <RegisterUser />
          </RoleBasedRoute>
        }
      />

      {/* Attendance - Module-based access */}
      <Route
        path="/attendance/capture"
        element={
          <RoleBasedRoute requiredModule="attendance" requiredAction="create">
            <AttendanceCapture />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/attendance/log"
        element={
          <RoleBasedRoute requiredModule="attendance" requiredAction="view">
            <AttendanceLog />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/attendance/override"
        element={
          <RoleBasedRoute requiredModule="attendance" requiredAction="edit">
            <AttendanceOverride />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/attendance/shift"
        element={
          <RoleBasedRoute requiredModule="attendance" requiredAction="edit">
            <ShiftManagement />
          </RoleBasedRoute>
        }
      />

      {/* Leave Management - Module-based access */}
      <Route
        path="/leave/apply"
        element={
          <RoleBasedRoute requiredModule="leave" requiredAction="create">
            <LeaveManagement />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/leave/balance"
        element={
          <RoleBasedRoute requiredModule="leave" requiredAction="view">
            <LeaveManagement />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/leave/approvals"
        element={
          <RoleBasedRoute requiredModule="leave" requiredAction="approve">
            <LeaveApprovals />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/leave/config"
        element={
          <RoleBasedRoute requiredModule="leave" requiredAction="edit">
            <LeaveConfiguration />
          </RoleBasedRoute>
        }
      />

      {/* Payroll - Role-based access */}
      <Route
        path="/payroll/structure"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/payroll/process"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/payroll/payslips"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR", "employee"]}>
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />

      {/* Expenses - Role-based access */}
      <Route
        path="/expenses/claims"
        element={
          <RoleBasedRoute allowedRoles={["employee"]}>
            <ExpenseClaims />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/expenses/approvals"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <ExpenseApprovals />
          </RoleBasedRoute>
        }
      />

      {/* Assets - Role-based access */}
      <Route
        path="/assets/list"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <AssetList />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/assets/my-assets"
        element={
          <RoleBasedRoute allowedRoles={["employee"]}>
            <MyAssets />
          </RoleBasedRoute>
        }
      />

      {/* Exit & Offboarding - Role-based access */}
      <Route
        path="/exit/resignations"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <ExitOffboarding />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/exit/checklist"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <ExitOffboarding />
          </RoleBasedRoute>
        }
      />

      {/* Reports - Role-based access */}
      <Route
        path="/reports/attendance"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/leave"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/payroll"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/finance"
        element={
          <RoleBasedRoute allowedRoles={["admin"]}>
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/analytics"
        element={
          <RoleBasedRoute allowedRoles={["admin", "HR"]}>
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />

      {/* User Profile */}
      <Route
        path="/profile"
        element={<ProtectedRoute element={<UserProfile />} />}
      />

      {/* Debug: Role Access */}
      <Route
        path="/debug/roles"
        element={<ProtectedRoute element={<RoleAccessDebug />} />}
      />
      <Route
        path="/debug/role-test"
        element={<ProtectedRoute element={<RoleTest />} />}
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>          {/* ✅ Auth FIRST */}
          <RoleProvider>        {/* ✅ Role AFTER Auth */}
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};


// Store root globally to prevent recreating during HMR
declare global {
  var __REACT_ROOT__: ReturnType<typeof createRoot> | undefined;
}

const rootElement = document.getElementById("root");
if (rootElement && !globalThis.__REACT_ROOT__) {
  globalThis.__REACT_ROOT__ = createRoot(rootElement);
}

if (globalThis.__REACT_ROOT__) {
  globalThis.__REACT_ROOT__.render(<App />);
}
