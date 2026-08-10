import React, { useEffect, useState } from "react";
import { hasRole } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import AttendanceMap from "@/components/AttendanceMap";
import { useOfficeLocation } from "@/hooks/useOfficeLocation";
import {
  AdminDashboardData,
  getAdminDashboardData,
  EmployeeDashboardData,
  getEmployeeDashboardData,
  ManagerDashboardData,
  getManagerDashboardData,
  HRDashboardData,
  getHRDashboardData,
  FinanceDashboardData,
  getFinanceDashboardData,
} from "@/components/helper/dashboard/dashboard";
import { leaveTypeApi } from "@/components/helper/leave/leave";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getAllowedModulesFromSubscription } from "@/utils/subscriptionModules";
import { useRole } from "@/context/RoleContext";
import { api } from "@/lib/endpoint";

const dashboardStyles = `
  @keyframes dashboardEnter {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .dashboard-content-enter {
    animation: dashboardEnter 0.6s ease-out;
  }

  .stat-card-enter {
    animation: fadeInUp 0.5s ease-out;
    animation-fill-mode: both;
  }

  .stat-card-enter:nth-child(1) { animation-delay: 0.1s; }
  .stat-card-enter:nth-child(2) { animation-delay: 0.2s; }
  .stat-card-enter:nth-child(3) { animation-delay: 0.3s; }
  .stat-card-enter:nth-child(4) { animation-delay: 0.4s; }

  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .gradient-bg-blue {
    background: linear-gradient(135deg, #17c491 0%, #0fa372 100%);
  }

  .gradient-bg-green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .gradient-bg-orange {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .gradient-bg-purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }

  .gradient-bg-red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .hover-lift {
    transition: all 0.3s ease;
  }

  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .chart-container {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .metric-card {
    background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 16px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
  }

  .metric-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .dashboard-header {
    background: linear-gradient(135deg, #17c491 0%, #0fa372 100%);
    color: white;
    padding: 2rem;
    border-radius: 20px;
    margin-bottom: 2rem;
    box-shadow: 0 10px 25px -5px rgba(23, 196, 145, 0.4);
    position: relative;
    overflow: hidden;
  }

  .dashboard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 2s infinite;
  }

  .icon-gradient {
    background: linear-gradient(135deg, #17c491 0%, #0fa372 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .shimmer-bg {
    background: linear-gradient(90deg, #f0f0f0 25%, #f8fafc 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .modern-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .floating-icon {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(23, 196, 145, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(23, 196, 145, 0.6);
    }
  }

  .text-gradient {
    background: linear-gradient(135deg, #17c491, #0fa372);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hover-scale {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hover-scale:hover {
    transform: scale(1.05);
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-left: 8px;
  }

  .status-online { background: #10b981; }
  .status-offline { background: #ef4444; }
  .status-busy { background: #f59e0b; }

  .dark .dashboard-header {
    background: linear-gradient(135deg, #0f172a 0%, #0b1220 100%);
    box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.6);
  }

  .dark .dashboard-header::before {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  }

  .dark .modern-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  }

  .dark .metric-card {
    background: linear-gradient(145deg, #0f172a 0%, #111827 100%);
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .dark .chart-container {
    background: linear-gradient(145deg, #0b1220 0%, #0f172a 100%);
    box-shadow: 0 10px 25px -5px rgba(2, 6, 23, 0.6);
  }

  .dark .glass-effect {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .dark .shimmer-bg {
    background: linear-gradient(90deg, #0f172a 25%, #111827 50%, #0f172a 75%);
  }

  .dark .text-gradient {
    background: linear-gradient(135deg, #5eead4, #2dd4bf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dark .stat-value {
    background: linear-gradient(90deg, #f8fafc, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Building,
  MapPin,
  ArrowRight,
  Timer,
  Target,
} from "lucide-react";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  description?: string;
  colorClass?: string;
  onClick?: () => void;
}> = ({
  title,
  value,
  icon,
  trend,
  description,
  colorClass = "gradient-bg-blue",
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`modern-card hover-scale w-full p-6 text-left ${onClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#17c491] focus:ring-offset-2" : "cursor-default"}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center text-white shadow-lg floating-icon`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {title}
            </p>
            <p className="stat-value text-3xl font-bold mt-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-2 font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-2 mt-3">
            <div className="status-indicator status-online"></div>
            <p className="text-sm text-green-600 font-semibold">{trend}</p>
          </div>
        )}
      </div>
    </div>
  </button>
);

type MetricEmployee = {
  id?: number;
  employeeId?: string;
  name: string;
  email?: string;
  department?: string;
  status?: string;
  checkIn?: string | null;
  leaveType?: string;
  fromDate?: string | null;
  toDate?: string | null;
};

type PendingApprovalItem = {
  id?: number;
  name: string;
  type: string;
  category?: string;
};

const formatMetricTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMetricDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type DashboardModuleCard = {
  label: string;
  description: string;
  path: string;
  module: string;
  icon: React.ReactNode;
  colorClass: string;
};

const ModuleCardsSection = ({
  cards,
  navigate,
  title = "Module Cards",
}: {
  cards: DashboardModuleCard[];
  navigate: ReturnType<typeof useNavigate>;
  title?: string;
}) => {
  if (!cards.length) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            className={`modern-card text-left p-4 border bg-gradient-to-br ${card.colorClass} hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover-lift stat-card-enter`}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 gradient-bg-blue rounded-lg flex items-center justify-center text-white shadow-md">
                {card.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
            </div>
            <p className="text-lg font-bold mt-2 text-gray-900">{card.label}</p>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              {card.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

const getCommonDashboardModuleCards = (): DashboardModuleCard[] => [
  {
    label: "Check-In / Check-Out",
    description: "Mark your attendance for today",
    path: "/attendance/capture",
    module: "attendance",
    icon: <CheckCircle className="w-5 h-5" />,
    colorClass: "from-emerald-50 to-teal-50 border-emerald-200",
  },
  {
    label: "Apply Leave",
    description: "Submit leave and permission requests",
    path: "/leave/apply",
    module: "leave",
    icon: <Calendar className="w-5 h-5" />,
    colorClass: "from-blue-50 to-cyan-50 border-blue-200",
  },
  {
    label: "Expense Claim",
    description: "Create and track your expense claims",
    path: "/expenses/claims",
    module: "expenses",
    icon: <AlertCircle className="w-5 h-5" />,
    colorClass: "from-amber-50 to-orange-50 border-amber-200",
  },
  {
    label: "Payslip",
    description: "View and download monthly payslips",
    path: "/payroll/payslips",
    module: "payroll",
    icon: <BarChart3 className="w-5 h-5" />,
    colorClass: "from-violet-50 to-purple-50 border-violet-200",
  },
];

const filterDashboardModuleCards = (
  cards: DashboardModuleCard[],
  allowedModules: Set<string> | null,
  canPerformModuleAction: (
    module: string,
    action: string,
    subModule?: string,
  ) => boolean,
): DashboardModuleCard[] =>
  cards.filter(
    (card) =>
      (!allowedModules || allowedModules.has(card.module)) &&
      canPerformModuleAction(card.module, "view"),
  );

const isDashboardAccessIssue = (message?: string | null) => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("access denied") ||
    normalized.includes("not authorized") ||
    normalized.includes("permission") ||
    normalized.includes("unauthorized")
  );
};

const DashboardAccessPlaceholder = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mx-auto max-w-5xl space-y-6">
    <div className="dashboard-header">
      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-white/90 text-lg">{description}</p>
      </div>
    </div>

    <Card className="modern-card border-0 shadow-xl">
      <CardContent className="p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard access not configured yet
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If the role is not created or dashboard view permission is not
              assigned, the data will not be displayed here. Once you create a
              role in Roles & Permissions and grant access to the
              dashboard/module, the overview will load normally.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leadIndicatorSignals, setLeadIndicatorSignals] = useState<any>(null);
  const [metricDialog, setMetricDialog] = useState<{
    title: string;
    description: string;
    type: "present" | "leave" | "pending";
    employees?: MetricEmployee[];
    pendingItems?: PendingApprovalItem[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { canPerformModuleAction, userRoles, loading: roleLoading } = useRole();
  const allowedModules = getAllowedModulesFromSubscription(
    subscription,
    subscriptionLoading,
    { trialEndingSoonDays: 2 },
  );
  const hasConfiguredRoles = userRoles.length > 0;

  useEffect(() => {
    if (roleLoading) {
      return;
    }

    if (!hasConfiguredRoles) {
      setDashboardData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [result, leadSignalsResult] = await Promise.all([
          getAdminDashboardData(),
          api.get("/dashboard/widgets").catch(() => null),
        ]);

        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
        setLeadIndicatorSignals(
          leadSignalsResult?.data?.leadIndicatorSignals || null,
        );
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [hasConfiguredRoles, roleLoading]);

  if (loading || roleLoading) {
    return <div>Loading dashboard data...</div>;
  }

  if (!hasConfiguredRoles) {
    return (
      <DashboardAccessPlaceholder
        title="Admin Dashboard"
        description="Dashboard widgets will appear once a role and permissions are configured."
      />
    );
  }

  if (error) {
    if (isDashboardAccessIssue(error)) {
      return (
        <DashboardAccessPlaceholder
          title="Admin Dashboard"
          description="This account does not have dashboard access yet."
        />
      );
    }

    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  // console.log("Dashboard Data:", dashboardData); // Debug log

  // Destructure the data with defaults
  const kpis = dashboardData?.kpis || {};
  const charts = dashboardData?.charts || {};
  const recentActivities = dashboardData?.recentActivities || [];
  const recentJoinings = dashboardData?.recentJoinings || [];
  const upcomingBirthdays = dashboardData?.upcomingBirthdays || [];
  const upcomingHolidays = dashboardData?.upcomingHolidays || [];

  // Ensure charts data is properly initialized
  const monthlyAttendance = charts?.monthlyAttendance || [];
  const departmentData = charts?.departmentData || [];
  const departmentAttendanceData = charts?.departmentAttendanceData || [];
  const leaveData = charts?.leaveData || [];
  const monthlyAttendanceChart = monthlyAttendance.map((item: any) => ({
    ...item,
    month: item.month,
  }));
  const monthlyTrendData = monthlyAttendanceChart.map(
    (item: any, index: number) => ({
      label: item.day ?? item.date ?? item.month ?? `Day ${index + 1}`,
      present: Number(item.present || 0),
      absent: Number(item.absent || 0),
    }),
  );
  const departmentAttendanceChart = departmentAttendanceData.map(
    (item: any) => ({
      ...item,
      attendanceRate:
        item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
    }),
  );

  const adminQuickActionCards: DashboardModuleCard[] = [
    {
      label: "Client Assignment",
      description: "Manage and assign clients to teams",
      path: "/client-assignment",
      module: "client_attendance_admin",
      icon: <Building className="w-5 h-5" />,
      colorClass: "from-emerald-50 to-teal-50 border-emerald-200",
    },
    {
      label: "Geo-Fence",
      description: "Set location boundaries for tracking",
      path: "/client-geo-fence",
      module: "client_attendance_admin",
      icon: <MapPin className="w-5 h-5" />,
      colorClass: "from-blue-50 to-cyan-50 border-blue-200",
    },
  ];

  const adminModuleCards: DashboardModuleCard[] = [
    ...getCommonDashboardModuleCards(),
    ...adminQuickActionCards,
  ];
  const visibleAdminModuleCards = filterDashboardModuleCards(
    adminModuleCards,
    allowedModules,
    canPerformModuleAction,
  );

  const isTrialSubscription = subscription?.status === "trial";
  const isTrialExpired = isTrialSubscription && !subscription?.is_trial_active;
  const isTrialEndingSoon =
    isTrialSubscription &&
    !!subscription?.is_trial_active &&
    Number(subscription?.trial_days_remaining || 0) <= 7;
  const shouldShowTrialBanner = isTrialExpired || isTrialEndingSoon;
  const trialBannerText = isTrialExpired
    ? "Trial ended. Subscribe now."
    : `Trial ends in ${subscription?.trial_days_remaining || 0} days. Subscribe now.`;
  const presentTodayEmployees = dashboardData?.presentTodayEmployees || [];
  const onLeaveEmployees = dashboardData?.onLeaveEmployees || [];
  const leadNeedsAttention = Number(leadIndicatorSignals?.needsAttention || 0);
  const leadRedCount =
    Number(leadIndicatorSignals?.red || 0) +
    Number(leadIndicatorSignals?.missing || 0);
  const leadYellowCount = Number(leadIndicatorSignals?.yellow || 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-bg-blue rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-white/90 text-lg">
                Welcome back! Here's your organization overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {shouldShowTrialBanner && (
        <div className="dashboard-content-enter rounded-2xl bg-white px-5 py-4 shadow-sm dark:bg-slate-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-black dark:text-white">
                  {trialBannerText}
                </p>
                <p className="text-sm text-black dark:text-slate-200">
                  Continue without interruption by choosing a plan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/subscription")}
              className="inline-flex items-center justify-center rounded-xl bg-[#17c491] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0fa372]"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {leadNeedsAttention > 0 ? (
        <button
          type="button"
          onClick={() => navigate("/KPI/dashboard")}
          className="dashboard-content-enter w-full rounded-2xl border border-amber-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  KPI Dashboard Alert
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {leadNeedsAttention} lead checklist item(s) need attention.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                Red {leadRedCount}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Yellow {leadYellowCount}
              </span>
              <span className="text-sm font-semibold text-[#17c491]">
                Open KPI Dashboard
              </span>
            </div>
          </div>
        </button>
      ) : null}

      {/* KPI Cards */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={kpis.totalEmployees?.toString() || "0"}
            icon={<Users className="w-7 h-7" />}
            description="Active employees"
            colorClass="gradient-bg-blue"
          />
          <StatCard
            title="Present Today"
            value={kpis.presentToday?.toString() || "0"}
            icon={<CheckCircle className="w-7 h-7" />}
            trend={kpis.presentTrend || ""}
            description="Current attendance"
            colorClass="gradient-bg-green"
            onClick={() =>
              setMetricDialog({
                title: "Present Today",
                description: "Employees who have checked in today",
                type: "present",
                employees: presentTodayEmployees,
              })
            }
          />
          <StatCard
            title="On Leave"
            value={kpis.onLeave?.toString() || "0"}
            icon={<Calendar className="w-7 h-7" />}
            trend={kpis.onLeaveTrend || ""}
            description="Approved leaves"
            colorClass="gradient-bg-orange"
            onClick={() =>
              setMetricDialog({
                title: "On Leave Today",
                description: "Employees with approved leave today",
                type: "leave",
                employees: onLeaveEmployees,
              })
            }
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.pendingApprovals?.toString() || "0"}
            icon={<AlertCircle className="w-7 h-7" />}
            trend={kpis.pendingTrend || ""}
            description="Awaiting action"
            colorClass="gradient-bg-red"
            onClick={() =>
              setMetricDialog({
                title: "Pending Approvals",
                description: "Leave and expense requests waiting for action",
                type: "pending",
                pendingItems: dashboardData?.pendingApprovals?.length
                  ? dashboardData.pendingApprovals
                  : (kpis.pendingApprovals || 0) > 0
                    ? [
                        {
                          name: `${kpis.pendingApprovals} pending request(s)`,
                          type: "Pending approvals are available. Please open approvals module to review.",
                          category: "pending",
                        },
                      ]
                    : [],
              })
            }
          />
        </div>
      </div>

      <ModuleCardsSection cards={visibleAdminModuleCards} navigate={navigate} />

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            className="modern-card hover-scale cursor-pointer group h-full"
            onClick={() => navigate("/client-assignment")}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-blue rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">
                Client Assignment
              </h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">
                Manage and assign clients to teams
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Get Started</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="modern-card hover-scale cursor-pointer group h-full"
            onClick={() => navigate("/client-geo-fence")}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-green rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">
                Geo-Fence
              </h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">
                Set location boundaries for tracking
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Configure</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="modern-card hover-scale cursor-pointer group h-full"
            onClick={() => navigate("/reports/attendance")}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-purple rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">
                Attendance Reports
              </h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">
                View detailed attendance analytics
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>View Reports</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="modern-card hover-scale cursor-pointer group h-full"
            onClick={() => navigate("/employees")}
          >
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-orange rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">
                Employee Management
              </h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">
                Manage employee records and profiles
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Manage</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance & Department Numbers */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-[#17c491]"></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Attendance & Department Numbers
            </h2>
            <p className="text-sm text-gray-500">
              Department strength, attendance, leave, events, and trends
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm xl:col-span-1">
            <CardHeader className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#17c491] shadow-sm">
                  <Building className="h-5 w-5" />
                </span>
                Headcount by Department
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">
                Department-wise employee count
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {(departmentData || [])
                  .slice(0, 6)
                  .map((d: any, idx: number) => (
                    <div
                      key={`${d.dept}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="truncate text-sm font-semibold text-slate-700">
                        {d.dept}
                      </span>
                      <span className="ml-3 rounded-lg bg-emerald-50 px-3 py-1 text-sm font-bold text-[#0d8f6b]">
                        {Number(d.count || 0)}
                      </span>
                    </div>
                  ))}
                {(!departmentData || departmentData.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No department data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#17c491]">
                  %
                </span>
                Department-wise Attendance Today
              </CardTitle>
              <CardDescription className="text-slate-500">
                Quick comparison with attendance rate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {departmentAttendanceChart.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {departmentAttendanceChart.map((dept, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-emerald-100 bg-[#fbfffd] p-4 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-[#0d5f49]">
                            {dept.dept}
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            Total: {dept.total} employees
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                          <p className="text-xl font-black text-[#17c491]">
                            {dept.attendanceRate}%
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">
                            Rate
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["Present", dept.present],
                          ["Half Day", dept.half],
                          ["Absent", dept.absent],
                        ].map(([label, value]) => (
                          <div
                            key={String(label)}
                            className="rounded-xl bg-white p-3 text-center shadow-sm"
                          >
                            <p className="text-lg font-black text-[#0d5f49]">
                              {Number(value || 0)}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#17c491] shadow-sm">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-[#0d5f49]">
                      No attendance data available for today
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <TrendingUp className="h-5 w-5 text-[#17c491]" />
                Leave Utilization
              </CardTitle>
              <CardDescription>
                Leave balance across all employees
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {(leaveData || []).map((entry: any, index: number) => (
                  <div
                    key={`${entry.name}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.name}
                    </span>
                    <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                      {Number(entry.value || 0)}
                    </span>
                  </div>
                ))}
                {(!leaveData || leaveData.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No leave balance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <Clock className="h-5 w-5 text-[#17c491]" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest system activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {recentActivities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#17c491] shadow-sm">
                      {item?.icon || "N"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item?.activity || "No activity"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item?.time || ""}
                      </p>
                    </div>
                  </div>
                ))}
                {(!recentActivities || recentActivities.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No recent activities
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <Users className="h-5 w-5 text-[#17c491]" />
                Recent Joinings
              </CardTitle>
              <CardDescription>Recently onboarded employees</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {recentJoinings.map((emp, idx) => {
                  const initials =
                    emp?.name
                      ?.split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U";
                  return (
                    <div
                      key={idx}
                      className="flex gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17c491] text-sm font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {emp?.name || "New Employee"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[emp?.role, emp?.dept].filter(Boolean).join(" | ") ||
                            "Role not specified"}
                        </p>
                        {emp?.joinDate && (
                          <p className="mt-1 text-xs font-medium text-[#0d8f6b]">
                            Joined: {emp.joinDate}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!recentJoinings || recentJoinings.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No recent joinings
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <Calendar className="h-5 w-5 text-[#17c491]" />
                Upcoming Birthdays
              </CardTitle>
              <CardDescription>Celebrate with your team</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {upcomingBirthdays?.map((emp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#17c491] shadow-sm">
                      BD
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-500">{emp.date}</p>
                    </div>
                  </div>
                ))}
                {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No upcoming birthdays
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <Calendar className="h-5 w-5 text-[#17c491]" />
                Upcoming Holidays
              </CardTitle>
              <CardDescription>Public and company holidays</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {upcomingHolidays?.map((holiday, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#17c491] shadow-sm">
                      HD
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {holiday.name}
                      </p>
                      <p className="text-xs text-slate-500">{holiday.date}</p>
                      <p className="mt-1 text-xs font-semibold text-[#0d8f6b]">
                        {holiday.type}
                      </p>
                    </div>
                  </div>
                ))}
                {(!upcomingHolidays || upcomingHolidays.length === 0) && (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#2f6f5f]">
                    No upcoming holidays
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm md:col-span-2 xl:col-span-3">
            <CardHeader className="border-b border-emerald-100 bg-white px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5f49]">
                <BarChart3 className="h-5 w-5 text-[#17c491]" />
                Monthly Attendance Trends
              </CardTitle>
              <CardDescription>
                Monthly present and absent counts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3">
                    <p className="font-bold text-slate-800">Monthly Present</p>
                    <p className="text-xs text-slate-500">
                      Daily present counts this month
                    </p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyTrendData}
                        margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="presentGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#17c491"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor="#17c491"
                              stopOpacity={0.06}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 6"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ stroke: "#a7f3d0", strokeWidth: 1 }}
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid hsl(var(--border))",
                            fontSize: 12,
                            background: "hsl(var(--popover))",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [value, "Present"]}
                          labelFormatter={(label: any) => `${label}`}
                        />
                        <Bar
                          dataKey="present"
                          fill="url(#presentGradient)"
                          stroke="#0fa372"
                          strokeWidth={1.5}
                          radius={[10, 10, 4, 4]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3">
                    <p className="font-bold text-slate-800">Monthly Absent</p>
                    <p className="text-xs text-slate-500">
                      Daily absent counts this month
                    </p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyTrendData}
                        margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="absentGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#64748b"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="100%"
                              stopColor="#64748b"
                              stopOpacity={0.06}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 6"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid hsl(var(--border))",
                            fontSize: 12,
                            background: "hsl(var(--popover))",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [value, "Absent"]}
                          labelFormatter={(label: any) => `${label}`}
                        />
                        <Bar
                          dataKey="absent"
                          fill="url(#absentGradient)"
                          stroke="#475569"
                          strokeWidth={1.5}
                          radius={[10, 10, 4, 4]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!metricDialog}
        onOpenChange={(open) => !open && setMetricDialog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{metricDialog?.title}</DialogTitle>
            <DialogDescription>{metricDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {metricDialog?.type === "pending" ? (
              metricDialog?.pendingItems?.length ? (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {metricDialog.pendingItems.map((item, index) => (
                    <div
                      key={`${item.id || item.name}-${index}`}
                      className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-500">{item.type}</p>
                      </div>
                      <div className="text-left text-sm sm:text-right">
                        <span className="rounded-md bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                          {item.category || "pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No pending approvals found.
                </div>
              )
            ) : metricDialog?.employees?.length ? (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {metricDialog.employees.map((employee, index) => (
                  <div
                    key={`${employee.id || employee.employeeId || employee.name}-${index}`}
                    className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employee.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {employee.employeeId || "No ID"} ·{" "}
                        {employee.department || "Unassigned"}
                      </p>
                      {employee.email && (
                        <p className="text-sm text-slate-500">
                          {employee.email}
                        </p>
                      )}
                    </div>
                    <div className="text-left text-sm text-slate-600 sm:text-right">
                      {metricDialog.type === "present" ? (
                        <>
                          <p className="font-medium capitalize text-emerald-700">
                            {employee.status || "present"}
                          </p>
                          <p>Check-in: {formatMetricTime(employee.checkIn)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-amber-700">
                            {employee.leaveType || "Leave"}
                          </p>
                          <p>
                            {formatMetricDate(employee.fromDate)} -{" "}
                            {formatMetricDate(employee.toDate)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No employees found for this metric today.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type AssignedLeadIndicator = NonNullable<
  EmployeeDashboardData["assignedLeadIndicators"]
>[number];

type AssignedLeadIndicatorGroup = {
  key: string;
  parameterId: string;
  scorecardId: string;
  parameterName: string;
  scorecardOwner: string;
  uom: string;
  periodDate: string;
  items: AssignedLeadIndicator[];
};

const getLeadValueKey = (
  item: Pick<AssignedLeadIndicator, "parameterId" | "indicatorIndex">,
  dayKey: string,
) => `${item.parameterId}-${item.indicatorIndex}-${dayKey}`;

const getDashboardPeriodDays = (periodDate?: string) => {
  const date = periodDate ? new Date(periodDate) : new Date();
  const year = Number.isNaN(date.getTime())
    ? new Date().getFullYear()
    : date.getFullYear();
  const month = Number.isNaN(date.getTime())
    ? new Date().getMonth()
    : date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, index) => ({
    key: String(index + 1),
    label: String(index + 1).padStart(2, "0"),
  }));
};

const getDashboardPeriodLabel = (periodDate?: string) => {
  const date = periodDate ? new Date(periodDate) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

const groupAssignedLeadIndicators = (
  items: AssignedLeadIndicator[] = [],
): AssignedLeadIndicatorGroup[] => {
  const groups = new Map<string, AssignedLeadIndicatorGroup>();
  items.forEach((item) => {
    const key = `${item.scorecardId}-${item.parameterId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        parameterId: item.parameterId,
        scorecardId: item.scorecardId,
        parameterName: item.parameterName,
        scorecardOwner: item.scorecardOwner,
        uom: item.uom,
        periodDate: item.periodDate,
        items: [],
      });
    }
    groups.get(key)?.items.push(item);
  });
  return [...groups.values()];
};

const EmployeeDashboard = ({
  navigate,
  userName,
}: {
  navigate: ReturnType<typeof useNavigate>;
  userName?: string;
}) => {
  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();
  const isAdmin = hasRole(user, "admin") || hasRole(user, "superadmin");
  const {
    office,
    loading: officeLoading,
    error: officeError,
  } = useOfficeLocation();
  const [dashboardData, setDashboardData] =
    useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [leadIndicatorValues, setLeadIndicatorValues] = useState<
    Record<string, string>
  >({});
  const [savingLeadIndicatorKey, setSavingLeadIndicatorKey] = useState<
    string | null
  >(null);
  const [activeLeadIndicatorGroupKey, setActiveLeadIndicatorGroupKey] =
    useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          dashboardResult,
          leaveBalanceResult,
          assignedLeadIndicatorResult,
        ] = await Promise.all([
          getEmployeeDashboardData(),
          leaveTypeApi.getLeaveBalances(),
          api
            .get("/kpi/scorecards/assigned-lead-indicators")
            .catch(() => null),
        ]);

        if (dashboardResult.error) {
          setError(dashboardResult.error);
        } else {
          const totalLeaveBalance = leaveBalanceResult.data?.reduce(
            (sum, balance) => sum + (Number(balance.available) || 0),
            0,
          );

          setDashboardData({
            ...dashboardResult.data,
            assignedLeadIndicators: Array.isArray(
              assignedLeadIndicatorResult?.data,
            )
              ? assignedLeadIndicatorResult.data
              : [],
            leaveBalance: {
              totalDays:
                leaveBalanceResult.error || totalLeaveBalance === undefined
                  ? dashboardResult.data?.leaveBalance?.totalDays || 0
                  : totalLeaveBalance,
              description:
                dashboardResult.data?.leaveBalance?.description ||
                "Days remaining this year",
            },
          });
          const nextLeadValues: Record<string, string> = {};
          if (Array.isArray(assignedLeadIndicatorResult?.data)) {
            assignedLeadIndicatorResult.data.forEach((item: any) => {
              Object.entries(item.values || {}).forEach(([dayKey, value]) => {
                nextLeadValues[
                  `${item.parameterId}-${item.indicatorIndex}-${dayKey}`
                ] = String(value || "");
              });
              if (item.todayKey) {
                nextLeadValues[
                  `${item.parameterId}-${item.indicatorIndex}-${item.todayKey}`
                ] = String(item.todayValue || nextLeadValues[
                  `${item.parameterId}-${item.indicatorIndex}-${item.todayKey}`
                ] || "");
              }
            });
          }
          setLeadIndicatorValues(nextLeadValues);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const saveAssignedLeadIndicatorGroup = async (
    group: AssignedLeadIndicatorGroup,
  ) => {
    setSavingLeadIndicatorKey(group.key);
    try {
      const periodDays = getDashboardPeriodDays(group.periodDate);
      const results = await Promise.all(
        group.items.map((item) =>
          api.patch(
            `/kpi/scorecards/assigned-lead-indicators/${item.parameterId}/${item.indicatorIndex}`,
            {
              dayKey: item.todayKey,
              values: Object.fromEntries(
                periodDays.map((day) => [
                  day.key,
                  leadIndicatorValues[getLeadValueKey(item, day.key)] || "",
                ]),
              ),
            },
          ),
        ),
      );

      setDashboardData((current) =>
        current
          ? {
              ...current,
              assignedLeadIndicators: (
                current.assignedLeadIndicators || []
              ).map((entry) => {
                const result = results.find(
                  (response) =>
                    String(response.data?.parameterId) ===
                      String(entry.parameterId) &&
                    Number(response.data?.indicatorIndex) ===
                      Number(entry.indicatorIndex),
                );
                return result
                  ? {
                      ...entry,
                      todayValue: String(
                        result.data?.values?.[entry.todayKey] || "",
                      ),
                      values: result.data?.values || entry.values,
                    }
                  : entry;
              }),
            }
          : current,
      );
      setActiveLeadIndicatorGroupKey(null);
    } finally {
      setSavingLeadIndicatorKey(null);
    }
  };

  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(
    subscription,
    subscriptionLoading,
    { trialEndingSoonDays: 2 },
  );
  const moduleCards: DashboardModuleCard[] = filterDashboardModuleCards(
    getCommonDashboardModuleCards(),
    allowedModules,
    canPerformModuleAction,
  );

  if (loading) {
    return <div>Loading employee dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {userName || "Employee"}
        </h1>
        <p className="text-white/80">Here's your personal dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Today's Status"
          value={dashboardData?.todayStatus?.status || "Not Marked"}
          icon={<CheckCircle className="w-7 h-7" />}
          description={
            dashboardData?.todayStatus?.description || "Attendance not marked"
          }
          colorClass="gradient-bg-green"
        />
        <StatCard
          title="Leave Balance"
          value={dashboardData?.leaveBalance?.totalDays.toString() || "0"}
          icon={<Calendar className="w-7 h-7" />}
          description={
            dashboardData?.leaveBalance?.description ||
            "Days remaining this year"
          }
          colorClass="gradient-bg-blue"
        />
        <StatCard
          title="Permission Balance"
          value={dashboardData?.permissionBalance?.remaining ?? 0}
          icon={<Timer className="w-7 h-7" />}
          description={
            dashboardData?.permissionBalance?.description ||
            "Permission units remaining this month"
          }
          colorClass="gradient-bg-orange"
        />
        <StatCard
          title="Working Hours"
          value={dashboardData?.workingHours?.hours.toString() || "0"}
          icon={<Clock className="w-7 h-7" />}
          description={
            dashboardData?.workingHours?.description || "Hours logged today"
          }
          colorClass="gradient-bg-purple"
        />
      </div>

      {isAdmin && (
        <>
          <AttendanceMap
            officeLocation={office?.coordinates}
            officeName={office?.name}
            radiusMeters={office?.radius}
            enableAutoCheck
          />
          {officeLoading && (
            <p className="text-sm text-gray-500">Loading office geofence…</p>
          )}
          {officeError && (
            <p className="text-sm text-red-500">
              Office geofence error: {officeError}
            </p>
          )}
        </>
      )}

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Module Cards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((card, index) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className={`modern-card text-left p-4 border bg-gradient-to-br ${card.colorClass} hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover-lift stat-card-enter`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 gradient-bg-blue rounded-lg flex items-center justify-center text-white shadow-md">
                  {card.icon}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
              </div>
              <p className="text-lg font-bold mt-2 text-gray-900">
                {card.label}
              </p>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {groupAssignedLeadIndicators(
        dashboardData?.assignedLeadIndicators || [],
      ).length > 0 && (
        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
              <Target className="h-5 w-5 text-emerald-600" />
              Assigned KPI Lead Indicators
            </CardTitle>
            <CardDescription className="text-gray-600">
              Open your assigned daily indicator checklist
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groupAssignedLeadIndicators(
                dashboardData?.assignedLeadIndicators || [],
              ).map((group) => {
                return (
                  <div
                    key={group.key}
                    className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {getDashboardPeriodLabel(group.periodDate)} -{" "}
                          {group.uom || "UoM"}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900">
                          {group.parameterName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {group.items.length} assigned lead indicator(s)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveLeadIndicatorGroupKey(group.key)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Fill Indicators
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(() => {
        const activeGroup = groupAssignedLeadIndicators(
          dashboardData?.assignedLeadIndicators || [],
        ).find((group) => group.key === activeLeadIndicatorGroupKey);
        if (!activeGroup) return null;
        const periodDays = getDashboardPeriodDays(activeGroup.periodDate);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-2 sm:p-4">
            <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl">
              <div className="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Daily Achievement
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                    {activeGroup.parameterName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {getDashboardPeriodLabel(activeGroup.periodDate)} -{" "}
                    {activeGroup.uom || "UoM not set"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">0</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {getDashboardPeriodLabel(activeGroup.periodDate)} -{" "}
                    {activeGroup.uom || "UoM"}
                  </p>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <Target className="h-4 w-4" />
                    Assigned Lead Indicators
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        4-Daily Indicators Checklist
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Only indicators assigned to you are editable here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveLeadIndicatorGroupKey(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-[2460px] table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="bg-white text-slate-700">
                          <th className="w-14 whitespace-nowrap border border-slate-200 px-2 py-2 text-center text-xs font-semibold">
                            S.No
                          </th>
                          <th className="w-44 whitespace-nowrap border border-slate-200 px-3 py-2 text-left text-xs font-semibold">
                            Daily Indicator
                          </th>
                          <th className="w-24 whitespace-nowrap border border-slate-200 px-2 py-2 text-center text-xs font-semibold">
                            Type
                          </th>
                          {periodDays.map((day) => (
                            <th
                              key={`assigned-li-head-${day.key}`}
                              className="w-[70px] whitespace-nowrap border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold"
                            >
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeGroup.items.map((item, itemIndex) => (
                          <tr key={`${item.parameterId}-${item.indicatorIndex}`}>
                            <td className="whitespace-nowrap border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-600">
                              1.{itemIndex + 1}
                            </td>
                            <td className="w-44 border border-slate-200 bg-white px-3 py-2 align-top text-sm font-medium leading-5 text-slate-900 whitespace-normal">
                              {item.indicatorLabel}
                              {item.type === "number" ? (
                                <span className="mt-1 block text-[11px] font-normal text-slate-500">
                                  Target {item.targetValue || "-"} / Min{" "}
                                  {item.minimumValue || "-"}
                                </span>
                              ) : null}
                            </td>
                            <td className="w-24 whitespace-nowrap border border-slate-200 bg-white px-2 py-2 text-center text-[11px] font-semibold uppercase text-slate-600">
                              {item.type === "yesno" ? "Yes/No" : "Number"}
                            </td>
                            {periodDays.map((day) => {
                              const key = getLeadValueKey(item, day.key);
                              const value = leadIndicatorValues[key] || "";
                              return (
                                <td
                                  key={`${key}-cell`}
                                  className="border border-slate-200 bg-white px-1 py-1 text-center align-middle"
                                >
                                  {item.type === "yesno" ? (
                                    <select
                                      value={value}
                                      onChange={(event) =>
                                        setLeadIndicatorValues((current) => ({
                                          ...current,
                                          [key]: event.target.value,
                                        }))
                                      }
                                      className="h-11 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-teal-500"
                                    >
                                      <option value=""></option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  ) : (
                                    <input
                                      value={value}
                                      onChange={(event) =>
                                        setLeadIndicatorValues((current) => ({
                                          ...current,
                                          [key]: event.target.value,
                                        }))
                                      }
                                      className="h-11 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-teal-500"
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:space-x-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setActiveLeadIndicatorGroupKey(null)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveAssignedLeadIndicatorGroup(activeGroup)}
                  disabled={savingLeadIndicatorKey === activeGroup.key}
                  className="w-full rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {savingLeadIndicatorKey === activeGroup.key
                    ? "Saving..."
                    : "Save Lead Indicators"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">
            Your Attendance This Month
          </CardTitle>
          <CardDescription className="text-gray-600">
            Numbers-only summary
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Present
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {dashboardData?.monthlyAttendance?.summary?.present || 0}
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Absent
              </p>
              <p className="mt-2 text-3xl font-bold text-red-700">
                {dashboardData?.monthlyAttendance?.summary?.absent || 0}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Half Day
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                {dashboardData?.monthlyAttendance?.summary?.half || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ManagerDashboard = ({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const [dashboardData, setDashboardData] =
    useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { canPerformModuleAction } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(
    subscription,
    subscriptionLoading,
    { trialEndingSoonDays: 2 },
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await getManagerDashboardData();

        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleReview = (category: string) => {
    if (category === "leave") {
      navigate("/leave/approvals");
    } else if (category === "expense") {
      navigate("/expenses/approvals");
    }
  };

  if (loading) {
    return <div>Loading manager dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const teamPresentTotal = (dashboardData?.teamAttendance || []).reduce(
    (sum, day) => sum + Number(day.present || 0),
    0,
  );
  const teamAbsentTotal = (dashboardData?.teamAttendance || []).reduce(
    (sum, day) => sum + Number(day.absent || 0),
    0,
  );
  const teamHalfTotal = (dashboardData?.teamAttendance || []).reduce(
    (sum, day) => sum + Number(day.half || 0),
    0,
  );

  const managerModuleCards: DashboardModuleCard[] = filterDashboardModuleCards(
    getCommonDashboardModuleCards(),
    allowedModules,
    canPerformModuleAction,
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-white/80">Team overview and pending approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Size"
          value={dashboardData?.teamStats?.teamSize.toString() || "0"}
          icon={<Users className="w-7 h-7" />}
          description="Direct reportees"
          colorClass="gradient-bg-blue"
        />
        <StatCard
          title="Present Today"
          value={dashboardData?.teamStats?.presentToday.toString() || "0"}
          icon={<CheckCircle className="w-7 h-7" />}
          description={
            dashboardData?.teamStats?.attendanceRate || "0% attendance"
          }
          colorClass="gradient-bg-green"
        />
        <StatCard
          title="On Leave"
          value={dashboardData?.teamStats?.onLeave.toString() || "0"}
          icon={<Calendar className="w-7 h-7" />}
          description="Approved leaves"
          colorClass="gradient-bg-orange"
        />
        <StatCard
          title="Pending Approvals"
          value={dashboardData?.teamStats?.pendingApprovals.toString() || "0"}
          icon={<AlertCircle className="w-7 h-7" />}
          description="Awaiting your action"
          colorClass="gradient-bg-red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">
              Team Attendance
            </CardTitle>
            <CardDescription className="text-gray-600">
              Numbers-only summary for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Present Total
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {teamPresentTotal}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Absent Total
                </p>
                <p className="mt-2 text-3xl font-bold text-red-700">
                  {teamAbsentTotal}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Half Day Total
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-700">
                  {teamHalfTotal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">
              Pending Approvals
            </CardTitle>
            <CardDescription className="text-gray-600">
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {dashboardData?.pendingApprovals?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors hover-lift"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.type}</p>
                  </div>
                  <button
                    onClick={() => handleReview(item.category)}
                    className="px-4 py-2 text-xs font-semibold text-white gradient-bg-blue rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Review
                  </button>
                </div>
              ))}
              {(!dashboardData?.pendingApprovals ||
                dashboardData.pendingApprovals.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8 font-medium">
                  No pending approvals
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ModuleCardsSection cards={managerModuleCards} navigate={navigate} />
    </div>
  );
};

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { canPerformModuleAction } = useRole();
  const allowedModules = getAllowedModulesFromSubscription(
    subscription,
    subscriptionLoading,
    { trialEndingSoonDays: 2 },
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await getHRDashboardData();

        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading HR dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const hrModuleCards: DashboardModuleCard[] = filterDashboardModuleCards(
    getCommonDashboardModuleCards(),
    allowedModules,
    canPerformModuleAction,
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
        <p className="text-white/80">Human resources overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={dashboardData?.hrStats?.totalEmployees.toString() || "0"}
          icon={<Users className="w-7 h-7" />}
          description="Department scope"
          colorClass="gradient-bg-blue"
        />
        <StatCard
          title="Pending Exits"
          value={dashboardData?.hrStats?.pendingExits.toString() || "0"}
          icon={<AlertCircle className="w-7 h-7" />}
          description="Awaiting processing"
          colorClass="gradient-bg-red"
        />
        <StatCard
          title="Leave Approvals"
          value={
            dashboardData?.hrStats?.pendingLeaveApprovals.toString() || "0"
          }
          icon={<Calendar className="w-7 h-7" />}
          description="Pending review"
          colorClass="gradient-bg-orange"
        />
        <StatCard
          title="New Joiners"
          value={dashboardData?.hrStats?.newJoiners.toString() || "0"}
          icon={<CheckCircle className="w-7 h-7" />}
          description="This month"
          colorClass="gradient-bg-green"
        />
      </div>

      <ModuleCardsSection cards={hrModuleCards} navigate={navigate} />

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">
            Headcount by Department
          </CardTitle>
          <CardDescription className="text-gray-600">
            Numbers-only employee distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {(dashboardData?.departmentData || []).map((row, idx) => (
              <div
                key={`${row.dept}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50 px-4 py-3"
              >
                <span className="font-medium text-gray-700">{row.dept}</span>
                <span className="text-xl font-bold text-purple-700">
                  {Number(row.count || 0)}
                </span>
              </div>
            ))}
            {(!dashboardData?.departmentData ||
              dashboardData.departmentData.length === 0) && (
              <p className="text-sm text-gray-500">
                No department data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] =
    useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { canPerformModuleAction } = useRole();
  const allowedModules = getAllowedModulesFromSubscription(
    subscription,
    subscriptionLoading,
    { trialEndingSoonDays: 2 },
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await getFinanceDashboardData();

        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading finance dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const financeModuleCards: DashboardModuleCard[] = filterDashboardModuleCards(
    getCommonDashboardModuleCards(),
    allowedModules,
    canPerformModuleAction,
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold mb-2">Finance Dashboard</h1>
        <p className="text-white/80">Financial overview and reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Payroll"
          value={dashboardData?.financeStats?.monthlyPayroll || "Rs 0K"}
          icon={<BarChart3 className="w-7 h-7" />}
          description="Total disbursed"
          colorClass="gradient-bg-green"
        />
        <StatCard
          title="Expense Claims"
          value={dashboardData?.financeStats?.pendingExpenses || "Rs 0K"}
          icon={<AlertCircle className="w-7 h-7" />}
          description="Pending approval"
          colorClass="gradient-bg-orange"
        />
        <StatCard
          title="Payslips Generated"
          value={
            dashboardData?.financeStats?.payslipsGenerated.toString() || "0"
          }
          icon={<CheckCircle className="w-7 h-7" />}
          description="This month"
          colorClass="gradient-bg-blue"
        />
        <StatCard
          title="Budget Utilization"
          value={dashboardData?.financeStats?.budgetUtilization || "0%"}
          icon={<TrendingUp className="w-7 h-7" />}
          description="Year to date"
          colorClass="gradient-bg-purple"
        />
      </div>

      <ModuleCardsSection cards={financeModuleCards} navigate={navigate} />

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">
            Monthly Payroll Trend
          </CardTitle>
          <CardDescription className="text-gray-600">
            Numbers-only monthly summary
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Months Tracked
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {(dashboardData?.payrollTrend || []).length}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Employees Paid (Total)
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {(dashboardData?.payrollTrend || []).reduce(
                  (sum, row) => sum + Number(row.present || 0),
                  0,
                )}
              </p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                Average / Month
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {(() => {
                  const rows = dashboardData?.payrollTrend || [];
                  if (!rows.length) return 0;
                  const total = rows.reduce(
                    (sum, row) => sum + Number(row.present || 0),
                    0,
                  );
                  return Math.round(total / rows.length);
                })()}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {(dashboardData?.payrollTrend || []).map((row, idx) => (
              <div
                key={`${row.month}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <span className="font-medium text-gray-700">{row.month}</span>
                <span className="text-lg font-bold text-gray-900">
                  {Number(row.present || 0)}
                </span>
              </div>
            ))}
            {(!dashboardData?.payrollTrend ||
              dashboardData.payrollTrend.length === 0) && (
              <p className="text-sm text-gray-500">
                No payroll trend data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const isSuperAdmin = hasRole(user, "superadmin");

  useEffect(() => {
    if (isSuperAdmin) {
      navigate("/superadmin-dashboard", { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  const getDashboard = () => {
    if (isSuperAdmin) {
      return null;
    } else if (hasRole(user, "admin") || hasRole(user, "ceo")) {
      return <AdminDashboard />;
    } else if (hasRole(user, "manager")) {
      return <ManagerDashboard navigate={navigate} />;
    } else if (hasRole(user, "hr")) {
      return <HRDashboard />;
    } else if (hasRole(user, "finance")) {
      return <FinanceDashboard />;
    } else {
      return <EmployeeDashboard navigate={navigate} userName={user?.name} />;
    }
  };

  return (
    <>
      <style>{dashboardStyles}</style>
      <Layout>
        <div className="dashboard-content-enter">{getDashboard()}</div>
      </Layout>
    </>
  );
}
