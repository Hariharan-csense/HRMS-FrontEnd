import React, { useEffect, useState } from "react";
import { hasRole } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import { AdminDashboardData, getAdminDashboardData, EmployeeDashboardData, getEmployeeDashboardData, ManagerDashboardData, getManagerDashboardData, HRDashboardData, getHRDashboardData, FinanceDashboardData, getFinanceDashboardData } from "@/components/helper/dashboard/dashboard";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getAllowedModulesFromSubscription } from "@/utils/subscriptionModules";

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
`;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  description?: string;
  colorClass?: string;
}> = ({ title, value, icon, trend, description, colorClass = "gradient-bg-blue" }) => (
  <div className="modern-card hover-scale p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center text-white shadow-lg floating-icon`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-2 font-medium">{description}</p>
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
  </div>
);

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
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{card.description}</p>
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

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await getAdminDashboardData();
        
        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }
  
  console.log('Dashboard Data:', dashboardData); // Debug log

  // Destructure the data with defaults
  const kpis = dashboardData?.kpis || {};
  const charts = dashboardData?.charts || {};
  const recentActivities = dashboardData?.recentActivities || [];
  const recentJoinings = dashboardData?.recentJoinings || [];
  const upcomingBirthdays = dashboardData?.upcomingBirthdays || [];
  const upcomingHolidays = dashboardData?.upcomingHolidays || [];
  const teamHealth = dashboardData?.teamHealth || {};

  // Ensure charts data is properly initialized
  const monthlyAttendance = charts?.monthlyAttendance || [];
  const departmentData = charts?.departmentData || [];
  const departmentAttendanceData = charts?.departmentAttendanceData || [];
  const leaveData = charts?.leaveData || [];
  const monthlyAttendanceChart = monthlyAttendance.map((item: any) => ({
    ...item,
    month: item.month,
  }));
  const departmentAttendanceChart = departmentAttendanceData.map((item: any) => ({
    ...item,
    attendanceRate: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
  }));

  const adminModuleCards: DashboardModuleCard[] = getCommonDashboardModuleCards().filter(
    (card) => !allowedModules || allowedModules.has(card.module)
  );

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
              <p className="text-white/90 text-lg">Welcome back! Here's your organization overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={kpis.totalEmployees?.toString() || '0'}
            icon={<Users className="w-7 h-7" />}
            description="Active employees"
            colorClass="gradient-bg-blue"
          />
          <StatCard
            title="Present Today"
            value={kpis.presentToday?.toString() || '0'}
            icon={<CheckCircle className="w-7 h-7" />}
            trend={kpis.presentTrend || ''}
            description="Current attendance"
            colorClass="gradient-bg-green"
          />
          <StatCard
            title="On Leave"
            value={kpis.onLeave?.toString() || '0'}
            icon={<Calendar className="w-7 h-7" />}
            trend={kpis.onLeaveTrend || ''}
            description="Approved leaves"
            colorClass="gradient-bg-orange"
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.pendingApprovals?.toString() || '0'}
            icon={<AlertCircle className="w-7 h-7" />}
            trend={kpis.pendingTrend || ''}
            description="Awaiting action"
            colorClass="gradient-bg-red"
          />
        </div>
      </div>

      <ModuleCardsSection cards={adminModuleCards} navigate={navigate} />

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="modern-card hover-scale cursor-pointer group h-full" onClick={() => navigate('/client-assignment')}>
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-blue rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">Client Assignment</h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">Manage and assign clients to teams</p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Get Started</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="modern-card hover-scale cursor-pointer group h-full" onClick={() => navigate('/client-geo-fence')}>
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-green rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">Geo-Fence</h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">Set location boundaries for tracking</p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Configure</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="modern-card hover-scale cursor-pointer group h-full" onClick={() => navigate('/reports/attendance')}>
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-purple rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">Attendance Reports</h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">View detailed attendance analytics</p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>View Reports</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="modern-card hover-scale cursor-pointer group h-full" onClick={() => navigate('/employees')}>
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 h-12 w-12 gradient-bg-orange rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-800">Employee Management</h3>
              <p className="mb-4 flex-grow text-sm text-gray-600">Manage employee records and profiles</p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#17c491]">
                <span>Manage</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Numeric Insights */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance & Department Numbers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <div className="modern-card hover-scale overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-cyan-900 rounded-t-xl p-4">
              <CardTitle className="text-white font-bold flex items-center gap-2 text-xl">
                <BarChart3 className="w-5 h-5" />
                Monthly Present
              </CardTitle>
              <CardDescription className="text-slate-200 text-xs">Total present count this month</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-[#17c491] leading-none">
                {monthlyAttendanceChart.reduce((sum: number, row: any) => sum + Number(row.present || 0), 0)}
              </p>
            </CardContent>
          </div>

          <div className="modern-card hover-scale overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-t-xl p-4">
              <CardTitle className="text-white font-bold flex items-center gap-2 text-xl">
                <Building className="w-5 h-5" />
                Monthly Absent
              </CardTitle>
              <CardDescription className="text-emerald-100 text-xs">Total absent count this month</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-[#ef4444] leading-none">
                {monthlyAttendanceChart.reduce((sum: number, row: any) => sum + Number(row.absent || 0), 0)}
              </p>
            </CardContent>
          </div>

          <div className="modern-card hover-scale overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-t-xl p-4">
              <CardTitle className="text-white font-bold flex items-center gap-2 text-xl">
                <Building className="w-5 h-5" />
                Headcount by Department
              </CardTitle>
              <CardDescription className="text-purple-100 text-xs">Department-wise employee count</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {(departmentData || []).slice(0, 6).map((d: any, idx: number) => (
                <div key={`${d.dept}-${idx}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                  <span className="font-medium text-gray-700 text-sm">{d.dept}</span>
                  <span className="font-bold text-[#17c491] text-sm">{Number(d.count || 0)}</span>
                </div>
              ))}
              {(!departmentData || departmentData.length === 0) && (
                <p className="text-sm text-gray-500">No department data available</p>
              )}
            </CardContent>
          </div>
        </div>
      </div>

      {/* Department-wise Attendance */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-[#0d5f49]">Department-wise Attendance Today</h2>
        </div>
        <div className="grid grid-cols-1 gap-5">
          <div className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm">
            <CardHeader className="border-b border-[#e8f4f0] bg-[#f7fcfa] px-6 py-5">
              <CardTitle className="text-[#0d5f49] flex items-center gap-2">
                <div className="w-5 h-5 bg-[#17c491] rounded-full flex items-center justify-center text-white text-xs font-bold">%</div>
                Department Attendance Summary
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Quick comparison with attendance rate</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {departmentAttendanceChart.length > 0 ? (
                  departmentAttendanceChart.map((dept, idx) => (
                    <div key={idx} className="rounded-xl border border-[#d7ede6] bg-[#fbfffd] p-4 transition-shadow duration-300 hover:shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#0d5f49] text-lg">{dept.dept}</p>
                          <p className="text-sm text-[#2f6f5f]">Total: {dept.total} employees</p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <p className="text-2xl font-bold text-[#17c491]">{dept.attendanceRate}%</p>
                            <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                          </div>
                          <p className="text-xs text-[#2f6f5f]">Attendance Rate</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-[#f1fbf7] p-3 border border-[#d7ede6]">
                          <p className="text-2xl font-bold text-[#0fa97f]">{dept.present}</p>
                          <p className="text-xs text-[#0d5f49]">Present</p>
                        </div>
                        <div className="rounded-xl bg-[#f1fbf7] p-3 border border-[#d7ede6]">
                          <p className="text-2xl font-bold text-[#17c491]">{dept.half}</p>
                          <p className="text-xs text-[#0d5f49]">Half Day</p>
                        </div>
                        <div className="rounded-xl bg-[#f1fbf7] p-3 border border-[#d7ede6]">
                          <p className="text-2xl font-bold text-[#0f8f6a]">{dept.absent}</p>
                          <p className="text-xs text-[#0d5f49]">Absent</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#17c491]/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#17c491]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0v6m0 6h6m-6 0v6" />
                        </svg>
                      </div>
                      <p className="text-[#2f6f5f] text-sm">No attendance data available for today</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="flex items-center gap-2 text-[#0d5f49]">
                <TrendingUp className="h-5 w-5 text-[#17c491]" />
                Leave Utilization
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Leave balance across all employees</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {(leaveData || []).map((entry: any, index: number) => (
                  <div key={`${entry.name}-${index}`} className="flex items-center justify-between rounded-xl border border-[#d7ede6] bg-[#f9fdfb] px-4 py-3">
                    <span className="font-medium text-slate-700">{entry.name}</span>
                    <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700">
                      {Number(entry.value || 0)}
                    </span>
                  </div>
                ))}
                {(!leaveData || leaveData.length === 0) && (
                  <p className="py-4 text-center text-sm text-[#2f6f5f]">No leave utilization data</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="flex items-center gap-2 text-[#0d5f49]">
                <Clock className="h-5 w-5 text-[#17c491]" />
                Recent Activities
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {recentActivities.map((item, idx) => (
                  <div key={idx} className="flex gap-3 rounded-xl border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {item?.icon || "N"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0d5f49]">{item?.activity || "No activity"}</p>
                      <p className="mt-1 text-xs text-[#2f6f5f]">{item?.time || ""}</p>
                    </div>
                  </div>
                ))}
                {(!recentActivities || recentActivities.length === 0) && (
                  <p className="py-4 text-center text-sm text-[#2f6f5f]">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="flex items-center gap-2 text-[#0d5f49]">
                <Users className="h-5 w-5 text-[#17c491]" />
                Recent Joinings
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Recently onboarded employees</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {recentJoinings.map((emp, idx) => {
                  const initials = emp?.name?.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2) || "U";
                  return (
                    <div key={idx} className="flex gap-3 rounded-xl border border-[#e8f4f0] bg-[#fbfffd] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17c491] text-sm font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0d5f49]">{emp?.name || "New Employee"}</p>
                        <p className="text-xs text-[#2f6f5f]">{[emp?.role, emp?.dept].filter(Boolean).join(" | ") || "Role not specified"}</p>
                        {emp?.joinDate && <p className="mt-1 text-xs text-[#2f6f5f]">Joined: {emp.joinDate}</p>}
                      </div>
                    </div>
                  );
                })}
                {(!recentJoinings || recentJoinings.length === 0) && (
                  <p className="py-4 text-center text-sm text-[#2f6f5f]">No recent joinings</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="flex items-center gap-2 text-[#0d5f49]">
                <Calendar className="h-5 w-5 text-[#17c491]" />
                Upcoming Birthdays
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Celebrate with your team</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {upcomingBirthdays?.map((emp, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">BD</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0d5f49]">{emp.name}</p>
                      <p className="text-xs text-[#2f6f5f]">{emp.date}</p>
                    </div>
                  </div>
                ))}
                {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                  <p className="py-4 text-center text-sm text-[#2f6f5f]">No upcoming birthdays</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="flex items-center gap-2 text-[#0d5f49]">
                <Calendar className="h-5 w-5 text-[#17c491]" />
                Upcoming Holidays
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Public and company holidays</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {upcomingHolidays?.map((holiday, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">HD</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0d5f49]">{holiday.name}</p>
                      <p className="text-xs text-[#2f6f5f]">{holiday.date}</p>
                      <p className="mt-1 text-xs font-medium text-[#17c491]">{holiday.type}</p>
                    </div>
                  </div>
                ))}
                {(!upcomingHolidays || upcomingHolidays.length === 0) && (
                  <p className="py-4 text-center text-sm text-[#2f6f5f]">No upcoming holidays</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Health Score Section */}
      <div className="space-y-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Team Health Score</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="text-[#0d5f49]">Overall Health</CardTitle>
              <CardDescription className="text-[#2f6f5f]">Team performance metrics summary</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#d7ede6] bg-gradient-to-br from-[#ecfaf5] to-[#dff4ec] shadow-sm">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#17c491]">
                        {teamHealth?.overallScore ?? 'N/A'}
                      </div>
                      <div className="text-xs text-[#2f6f5f] mt-1">out of 100</div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#0d5f49] mt-4">
                    {teamHealth?.status ?? 'Loading...'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-[#e8f4f0] pt-4">
                  <div className="rounded-lg border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <p className="text-xs text-[#2f6f5f]">Trend</p>
                    <p className="text-lg font-bold text-[#17c491]">
                      {teamHealth?.trend ?? 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <p className="text-xs text-[#2f6f5f]">Last Updated</p>
                    <p className="text-sm font-medium text-[#0d5f49]">
                      {teamHealth?.lastUpdated ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#eefaf5]">
              <CardTitle className="text-[#0d5f49]">Health Metrics</CardTitle>
              <CardDescription className="text-[#2f6f5f]">Individual performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                {(teamHealth?.metrics || []).map((metric, idx) => (
                  <div key={idx} className="rounded-lg border border-[#e8f4f0] bg-[#fbfffd] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-[#0d5f49]">{metric.label}</p>
                      <span className="text-sm font-bold text-[#17c491]">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8f9f4]">
                      <div
                        className="h-full rounded-full bg-[#17c491] transition-all duration-500"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-[#d7ede6] bg-white shadow-sm">
          <CardHeader className="border-b border-[#e8f4f0] bg-gradient-to-r from-[#f7fcfa] to-[#f3fbf8] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[#0d5f49]">Health Insights</CardTitle>
                <CardDescription className="text-[#2f6f5f]">
                  Clear view of strengths and areas requiring attention
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Strengths: {(teamHealth?.strengths || []).length}
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Improve: {(teamHealth?.improvements || []).length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-4">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-3">
                  {(teamHealth?.strengths || []).map((strength, idx) => (
                    <li
                      key={`strength-${idx}`}
                      className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {strength}
                    </li>
                  ))}
                  {(!teamHealth?.strengths || teamHealth.strengths.length === 0) && (
                    <li className="rounded-lg border border-dashed border-emerald-200 bg-white px-3 py-2 text-sm text-slate-500">
                      No strengths data available
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-100 bg-gradient-to-b from-amber-50 to-white p-4">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  Areas to Improve
                </h4>
                <ul className="space-y-3">
                  {(teamHealth?.improvements || []).length > 0 ? (
                    (teamHealth?.improvements || []).map((improvement, idx) => (
                      <li
                        key={`improve-${idx}`}
                        className="rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {improvement}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-lg border border-dashed border-amber-200 bg-white px-3 py-2 text-sm text-slate-500">
                      No critical issues found
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const EmployeeDashboard = ({ navigate, userName }: { navigate: ReturnType<typeof useNavigate>; userName?: string }) => {
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await getEmployeeDashboardData();
        
        if (result.error) {
          setError(result.error);
        } else {
          setDashboardData(result.data);
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });
  const moduleCards: DashboardModuleCard[] = getCommonDashboardModuleCards().filter(
    (card) => !allowedModules || allowedModules.has(card.module)
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
        <h1 className="text-3xl font-bold mb-2">Welcome, {userName || "Employee"}</h1>
        <p className="text-white/80">Here's your personal dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Today's Status"
          value={dashboardData?.todayStatus?.status || "Not Marked"}
          icon={<CheckCircle className="w-7 h-7" />}
          description={dashboardData?.todayStatus?.description || "Attendance not marked"}
          colorClass="gradient-bg-green"
        />
        <StatCard
          title="Leave Balance"
          value={dashboardData?.leaveBalance?.totalDays.toString() || "0"}
          icon={<Calendar className="w-7 h-7" />}
          description={dashboardData?.leaveBalance?.description || "Days remaining this year"}
          colorClass="gradient-bg-blue"
        />
        <StatCard
          title="Working Hours"
          value={dashboardData?.workingHours?.hours.toString() || "0"}
          icon={<Clock className="w-7 h-7" />}
          description={dashboardData?.workingHours?.description || "Hours logged today"}
          colorClass="gradient-bg-purple"
        />
      </div>

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
              <p className="text-lg font-bold mt-2 text-gray-900">{card.label}</p>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">Your Attendance This Month</CardTitle>
          <CardDescription className="text-gray-600">Numbers-only summary</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Present</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{dashboardData?.monthlyAttendance?.summary?.present || 0}</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Absent</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{dashboardData?.monthlyAttendance?.summary?.absent || 0}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Half Day</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{dashboardData?.monthlyAttendance?.summary?.half || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ManagerDashboard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });

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
        setError('Failed to fetch dashboard data');
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

  const teamPresentTotal = (dashboardData?.teamAttendance || []).reduce((sum, day) => sum + Number(day.present || 0), 0);
  const teamAbsentTotal = (dashboardData?.teamAttendance || []).reduce((sum, day) => sum + Number(day.absent || 0), 0);
  const teamHalfTotal = (dashboardData?.teamAttendance || []).reduce((sum, day) => sum + Number(day.half || 0), 0);

  const managerModuleCards: DashboardModuleCard[] = getCommonDashboardModuleCards().filter(
    (card) => !allowedModules || allowedModules.has(card.module)
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
          description={dashboardData?.teamStats?.attendanceRate || "0% attendance"}
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
            <CardTitle className="text-gray-800 font-bold">Team Attendance</CardTitle>
            <CardDescription className="text-gray-600">Numbers-only summary for your team</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Present Total</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">{teamPresentTotal}</p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Absent Total</p>
                <p className="mt-2 text-3xl font-bold text-red-700">{teamAbsentTotal}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Half Day Total</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">{teamHalfTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">Pending Approvals</CardTitle>
            <CardDescription className="text-gray-600">Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {dashboardData?.pendingApprovals?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors hover-lift"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
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
              {(!dashboardData?.pendingApprovals || dashboardData.pendingApprovals.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8 font-medium">No pending approvals</p>
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
  const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });

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
        setError('Failed to fetch dashboard data');
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

  const hrModuleCards: DashboardModuleCard[] = getCommonDashboardModuleCards().filter(
    (card) => !allowedModules || allowedModules.has(card.module)
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
          value={dashboardData?.hrStats?.pendingLeaveApprovals.toString() || "0"}
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
          <CardTitle className="text-gray-800 font-bold">Headcount by Department</CardTitle>
          <CardDescription className="text-gray-600">Numbers-only employee distribution</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {(dashboardData?.departmentData || []).map((row, idx) => (
              <div key={`${row.dept}-${idx}`} className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
                <span className="font-medium text-gray-700">{row.dept}</span>
                <span className="text-xl font-bold text-purple-700">{Number(row.count || 0)}</span>
              </div>
            ))}
            {(!dashboardData?.departmentData || dashboardData.departmentData.length === 0) && (
              <p className="text-sm text-gray-500">No department data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });

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
        setError('Failed to fetch dashboard data');
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

  const financeModuleCards: DashboardModuleCard[] = getCommonDashboardModuleCards().filter(
    (card) => !allowedModules || allowedModules.has(card.module)
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
          value={dashboardData?.financeStats?.payslipsGenerated.toString() || "0"}
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
          <CardTitle className="text-gray-800 font-bold">Monthly Payroll Trend</CardTitle>
          <CardDescription className="text-gray-600">Numbers-only monthly summary</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Months Tracked</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{(dashboardData?.payrollTrend || []).length}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Employees Paid (Total)</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {(dashboardData?.payrollTrend || []).reduce((sum, row) => sum + Number(row.present || 0), 0)}
              </p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Average / Month</p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {(() => {
                  const rows = dashboardData?.payrollTrend || [];
                  if (!rows.length) return 0;
                  const total = rows.reduce((sum, row) => sum + Number(row.present || 0), 0);
                  return Math.round(total / rows.length);
                })()}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {(dashboardData?.payrollTrend || []).map((row, idx) => (
              <div key={`${row.month}-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="font-medium text-gray-700">{row.month}</span>
                <span className="text-lg font-bold text-gray-900">{Number(row.present || 0)}</span>
              </div>
            ))}
            {(!dashboardData?.payrollTrend || dashboardData.payrollTrend.length === 0) && (
              <p className="text-sm text-gray-500">No payroll trend data available</p>
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
        <div className="dashboard-content-enter">
          {getDashboard()}
        </div>
      </Layout>
    </>
  );
}

