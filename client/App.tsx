import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate,HashRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import { AutoLoginHandler } from "@/components/AutoLoginHandler";


// Pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundCancellation from "./pages/RefundCancellation";
import AssetList from "./pages/AssetList";
import MyAssets from "./pages/MyAssets";
import EmployeeList from "./pages/EmployeeList";
import AttendanceLog from "./pages/AttendanceLog";
import AttendanceCapture from "./pages/AttendanceCapture";
import AttendanceOverride from "./pages/AttendanceOverride";
//import LiveLocationDashboard from "./pages/LiveLocationDashboard";
import LeaveManagement from "./pages/LeaveManagementNew";
import LeaveApprovals from "./pages/LeaveApprovals";
import LeaveConfiguration from "./pages/LeaveConfiguration";
import LeavePermission from "./pages/LeavePermission";
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
import LiveTracking from "./pages/LiveTracking";
import ClientAssignment from "./pages/ClientAssignment";
import MyClientAssignment from "./pages/MyClientAssignment";
import EmployeeAnalytics from "./pages/EmployeeAnalytics";
import EmployeeReports from "./pages/EmployeeReports";
import ClientAttendance from "./pages/ClientAttendance";
import ClientAttendanceAdmin from "./pages/ClientAttendanceAdmin";
import SalesAttendanceReport from "./pages/SalesAttendanceReport";
import ClientGeoFence from "./pages/ClientGeoFence";
import TicketManagement from "./pages/TicketManagement";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import SubscriptionPlansManagement from "./pages/SubscriptionPlansManagement";
import HRRequirements from "./pages/HRRequirements";
import HRRecruitment from "./pages/HRRecruitment";
import HROfferLetters from "./pages/HROfferLetters";
import HROnboarding from "./pages/HROnboarding";
import HRSettlement from "./pages/HRSettlement";
import ExportData from "./pages/ExportData";
import RoleManagement from "./pages/RoleManagement";
import AdminOnlyRoute from "./components/AdminOnlyRoute";
import SuperAdminOnlyRoute from "./components/SuperAdminOnlyRoute";
import SalesOnlyRoute from "./components/SalesOnlyRoute";
import HROnlyRoute from "./components/HROnlyRoute";
import ClientAttendanceRoute from "./components/ClientAttendanceRoute";
import Organizations from "./pages/superadmin/Organizations";
import { Users } from "./pages/superadmin/Users";
import PulseSurveysOverview from "./pages/pulseSurveys/PulseSurveysOverview";
import CreatePulseSurvey from "./pages/pulseSurveys/CreatePulseSurvey";
import MyPulseSurveys from "./pages/pulseSurveys/MyPulseSurveys";
import RespondPulseSurvey from "./pages/pulseSurveys/RespondPulseSurvey";
import PulseSurveyResultsList from "./pages/pulseSurveys/PulseSurveyResultsList";
import PulseSurveyResultsDetail from "./pages/pulseSurveys/PulseSurveyResultsDetail";
import EmployeeFeedback from "./pages/pulseSurveys/EmployeeFeedback";
import AdminFeedbackInbox from "./pages/pulseSurveys/AdminFeedbackInbox";
import PulseSurveyTemplates from "./pages/pulseSurveys/PulseSurveyTemplates";

import { Hash } from "lucide-react";
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

// Root Route Handler
const RootRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

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
    // Redirect superadmin users directly to SuperAdminDashboard
    if (
      user?.roles?.some((role) => role?.toLowerCase() === "superadmin") ||
      user?.role?.toLowerCase() === "superadmin"
    ) {
      return <Navigate to="/superadmin-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
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

  // Don't redirect authenticated users from public routes - let them access if needed
  return <>{element}</>;
};

const PulseSurveysRoot = () => {
  const { canPerformModuleAction } = useRole();
  const canManagePulseSurveys =
    canPerformModuleAction("pulse_surveys", "view", "dashboard") ||
    canPerformModuleAction("pulse_surveys", "create");
  return canManagePulseSurveys ? (
    <Navigate to="/pulse-surveys/dashboard" replace />
  ) : (
    <Navigate to="/pulse-surveys/my-surveys" replace />
  );
};

function AppRoutes() {
  return (
    <AutoLoginHandler>
      <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={<PublicRoute element={<LandingPage />} />}
      />
      <Route
        path="/landing"
        element={<PublicRoute element={<LandingPage />} />}
      />
      <Route
        path="/features"
        element={<PublicRoute element={<FeaturesPage />} />}
      />
      <Route
        path="/about"
        element={<PublicRoute element={<AboutPage />} />}
      />
      <Route
        path="/contact"
        element={<PublicRoute element={<ContactPage />} />}
      />
      <Route
        path="/pricing"
        element={<PublicRoute element={<PricingPage />} />}
      />
      <Route
        path="/privacy-policy"
        element={<PublicRoute element={<PrivacyPolicy />} />}
      />
      <Route
        path="/terms-conditions"
        element={<PublicRoute element={<TermsConditions />} />}
      />
      <Route
        path="/refund-cancellation"
        element={<PublicRoute element={<RefundCancellation />} />}
      />
      <Route
        path="/login"
        element={<PublicRoute element={<Login />} />}
      />
      <Route
        path="/forgot-password"
        element={<PublicRoute element={<ForgotPassword />} />}
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

      {/* Organization Setup - Module-based access */}
      <Route
        path="/organization/company"
        element={
          <RoleBasedRoute requiredModule="organization" requiredAction="view">
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/branches"
        element={
          <RoleBasedRoute requiredModule="organization" requiredAction="view">
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/departments"
        element={
          <RoleBasedRoute requiredModule="organization" requiredAction="view">
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/designations"
        element={
          <RoleBasedRoute requiredModule="organization" requiredAction="view">
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/roles"
        element={
          <RoleBasedRoute requiredModule="role_access" requiredAction="view">
            <OrganizationSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/organization/role-management"
        element={
          <RoleBasedRoute requiredModule="role_access" requiredAction="view">
            <RoleManagement />
          </RoleBasedRoute>
        }
      />

      {/* Employee Management - Module-based access */}
      <Route
        path="/employees"
        element={
          <RoleBasedRoute requiredModule="employees" requiredAction="view">
            <EmployeeList />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employees/register"
        element={
          <RoleBasedRoute requiredModule="employees" requiredAction="create">
            <RegisterUser />
          </RoleBasedRoute>
        }
      />

      {/* Employee Reports - Module-based access */}
      <Route
        path="/employees/reports"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <EmployeeReports />
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

      <Route
        path="/attendance/live-tracking"
        element={
          <RoleBasedRoute requiredModule="live_tracking" requiredAction="view">
            <LiveTracking />
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
      <Route
        path="/leave/permission"
        element={
          <RoleBasedRoute requiredModule="leave" requiredAction="view">
            <LeavePermission />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/export/data"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ExportData />
          </RoleBasedRoute>
        }
      />

      {/* Payroll - Module-based access */}
      <Route
        path="/payroll/structure"
        element={
          <RoleBasedRoute requiredModule="payroll" requiredAction="view">
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/payroll/process"
        element={
          <RoleBasedRoute requiredModule="payroll" requiredAction="view">
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/payroll/payslips"
        element={
          <RoleBasedRoute requiredModule="payroll" requiredAction="view">
            <PayrollSetup />
          </RoleBasedRoute>
        }
      />

      {/* Expenses - Module-based access */}
      <Route
        path="/expenses/claims"
        element={
          <RoleBasedRoute requiredModule="expenses" requiredAction="view">
            <ExpenseClaims />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/expenses/approvals"
        element={
          <RoleBasedRoute requiredModule="expenses" requiredAction="approve">
            <ExpenseApprovals />
          </RoleBasedRoute>
        }
      />

      {/* Assets - Module-based access */}
      <Route
        path="/assets/list"
        element={
          <RoleBasedRoute requiredModule="assets" requiredAction="view">
            <AssetList />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/assets/my-assets"
        element={
          <RoleBasedRoute requiredModule="assets" requiredAction="view">
            <MyAssets />
          </RoleBasedRoute>
        }
      />

      {/* Exit & Offboarding - Module-based access */}
      <Route
        path="/exit/resignations"
        element={
          <RoleBasedRoute requiredModule="exit" requiredAction="view">
            <ExitOffboarding />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/exit/checklist"
        element={
          <RoleBasedRoute requiredModule="exit" requiredAction="view">
            <ExitOffboarding />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/exit/settlement"
        element={
          <HROnlyRoute>
            <HRSettlement />
          </HROnlyRoute>
        }
      />
      {/* Reports - Module-based access */}
      <Route
        path="/reports/attendance"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/leave"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/payroll"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/finance"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/reports/analytics"
        element={
          <RoleBasedRoute requiredModule="reports" requiredAction="view">
            <ReportsAnalytics />
          </RoleBasedRoute>
        }
      />

      {/* User Profile */}
      <Route
        path="/profile"
        element={<ProtectedRoute element={<UserProfile />} />}
      />

      {/* Client Assignment - Admin only */}
      <Route
        path="/client-assignment"
        element={
          <AdminOnlyRoute>
            <ClientAssignment />
          </AdminOnlyRoute>
        }
      />

      {/* My Client Assignment - Employees */}
      <Route
        path="/my-clients"
        element={<ProtectedRoute element={<MyClientAssignment />} />}
      />

      {/* Employee Analytics */}
      <Route
        path="/my-analytics"
        element={<ProtectedRoute element={<EmployeeAnalytics />} />}
      />

      {/* HR Management - HR only */}
      <Route
        path="/hr/requirements"
        element={
          <HROnlyRoute>
            <HRRequirements />
          </HROnlyRoute>
        }
      />
      <Route
        path="/hr/recruitment"
        element={
          <HROnlyRoute>
            <HRRecruitment />
          </HROnlyRoute>
        }
      />
      <Route
        path="/hr/offer-letters"
        element={
          <HROnlyRoute>
            <HROfferLetters />
          </HROnlyRoute>
        }
      />
      <Route
        path="/hr/onboarding"
        element={
          <HROnlyRoute>
            <HROnboarding />
          </HROnlyRoute>
        }
      />


      {/* Client Attendance - Module-based access for Sales with fallback */}
      <Route
        path="/client-attendance"
        element={
          <ClientAttendanceRoute>
            <ClientAttendance />
          </ClientAttendanceRoute>
        }
      />

      {/* Client Attendance Admin - Admin only */}
      <Route
        path="/client-attendance-admin"
        element={
          <AdminOnlyRoute>
            <ClientAttendanceAdmin />
          </AdminOnlyRoute>
        }
      />

      {/* Sales Attendance Report - Admin only */}
      <Route
        path="/sales-attendance-report"
        element={
          <AdminOnlyRoute>
            <SalesAttendanceReport />
          </AdminOnlyRoute>
        }
      />

      {/* Client Geo-Fence - Admin only */}
      <Route
        path="/client-geo-fence"
        element={
          <AdminOnlyRoute>
            <ClientGeoFence />
          </AdminOnlyRoute>
        }
      />

      {/* Ticket Management - Admin only */}
      <Route
        path="/tickets"
        element={
          <AdminOnlyRoute>
            <TicketManagement />
          </AdminOnlyRoute>
        }
      />

      {/* Subscription Management - Admin only */}
      <Route
        path="/subscription"
        element={
          <AdminOnlyRoute>
            <SubscriptionManagement />
          </AdminOnlyRoute>
        }
      />

      {/* Subscription Plans Management - SuperAdmin only */}
      <Route
        path="/subscription-plans"
        element={
          <SuperAdminOnlyRoute>
            <SubscriptionPlansManagement />
          </SuperAdminOnlyRoute>
        }
      />

      {/* Organizations Management - SuperAdmin only */}
      <Route
        path="/organizations"
        element={
          <SuperAdminOnlyRoute>
            <Organizations />
          </SuperAdminOnlyRoute>
        }
      />
      <Route
        path="/organizations/:id"
        element={
          <SuperAdminOnlyRoute>
            <Organizations />
          </SuperAdminOnlyRoute>
        }
      />

      {/* Users Management - SuperAdmin only */}
      <Route
        path="/users"
        element={
          <SuperAdminOnlyRoute>
            <Users />
          </SuperAdminOnlyRoute>
        }
      />

      {/* Super Admin Dashboard - Development access */}
      <Route
        path="/superadmin-dashboard"
        element={<ProtectedRoute element={<SuperAdminDashboard />} />}
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

      {/* Pulse Survey Module */}
      <Route
        path="/pulse-surveys"
        element={<ProtectedRoute element={<PulseSurveysRoot />} />}
      />
      <Route
        path="/pulse-surveys/dashboard"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <PulseSurveysOverview />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/create"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="create"
              >
                <CreatePulseSurvey />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/results"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <PulseSurveyResultsList />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/results/:surveyId"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <PulseSurveyResultsDetail />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/my-surveys"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <MyPulseSurveys />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/respond/:surveyId"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <RespondPulseSurvey />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/feedback"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute requiredModule="pulse_surveys" requiredAction="view">
                <EmployeeFeedback />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/feedback-inbox"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <AdminFeedbackInbox />
              </RoleBasedRoute>
            }
          />
        }
      />
      <Route
        path="/pulse-surveys/templates"
        element={
          <ProtectedRoute
            element={
              <RoleBasedRoute
                requiredModule="pulse_surveys"
                requiredAction="view"
              >
                <PulseSurveyTemplates />
              </RoleBasedRoute>
            }
          />
        }
      />

        
      {/* Root redirect - removed since we now have landing page at root */}

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </AutoLoginHandler>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>          {/* ✅ Auth FIRST */}
          <RoleProvider>        {/* ✅ Role AFTER Auth */}
            <SubscriptionProvider> {/* ✅ Subscription AFTER Role */}
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </TooltipProvider>
            </SubscriptionProvider>
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
