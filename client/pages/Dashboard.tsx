import React, { useEffect, useState } from "react";
import { hasRole } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const departmentData = [
  { dept: "Engineering", count: 45 },
  { dept: "Sales", count: 28 },
  { dept: "HR", count: 12 },
  { dept: "Finance", count: 15 },
  { dept: "Operations", count: 20 },
];

const employeeAttendanceData = [
  { month: "Jan", present: 22, absent: 2, half: 1 },
];

const payrollTrendData = [
  { month: "Jan", present: 120 },
  { month: "Feb", present: 118 },
  { month: "Mar", present: 122 },
  { month: "Apr", present: 125 },
  { month: "May", present: 123 },
  { month: "Jun", present: 128 },
];

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

const chartColors = {
  present: "#17c491",
  absent: "#0f8f6a",
  half: "#53d8b4",
  grid: "#d6f4eb",
  axis: "#2f6f5f",
};

const prettyMonth = (value?: string) => {
  if (!value) return "";
  return value.replace("-", " ");
};

const DashboardTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-slate-800">{prettyMonth(label)}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="text-sm font-medium" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    month: prettyMonth(item.month),
  }));
  const departmentAttendanceChart = departmentAttendanceData.map((item: any) => ({
    ...item,
    attendanceRate: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
  }));

  return (
    <div className="space-y-8">
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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-3xl font-bold text-gray-800">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-3xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="modern-card hover-scale cursor-pointer group" onClick={() => navigate('/client-assignment')}>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 gradient-bg-blue rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl group-hover:shadow-2xl transition-shadow duration-300 floating-icon">
                  <Building className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Client Assignment</h3>
                <p className="text-sm text-gray-600">Manage and assign clients to teams</p>
                <div className="mt-4 flex items-center gap-2 text-[#17c491] text-sm font-medium">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="modern-card hover-scale cursor-pointer group" onClick={() => navigate('/client-geo-fence')}>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 gradient-bg-green rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl group-hover:shadow-2xl transition-shadow duration-300 floating-icon">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Geo-Fence</h3>
                <p className="text-sm text-gray-600">Set location boundaries for tracking</p>
                <div className="mt-4 flex items-center gap-2 text-[#17c491] text-sm font-medium">
                  <span>Configure</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-3xl font-bold text-gray-800">Analytics & Insights</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="modern-card hover-scale overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-cyan-900 rounded-t-xl">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Attendance
              </CardTitle>
              <CardDescription className="text-slate-200">Present, absent and half-day trend</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyAttendanceChart} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={chartColors.grid} />
                  <XAxis dataKey="month" stroke={chartColors.axis} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartColors.axis} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line type="monotone" dataKey="present" name="Present" stroke={chartColors.present} strokeWidth={3} dot={{ fill: chartColors.present, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke={chartColors.absent} strokeWidth={2.5} dot={{ fill: chartColors.absent, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="half" name="Half Day" stroke={chartColors.half} strokeWidth={2.5} dot={{ fill: chartColors.half, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div className="modern-card hover-scale overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-t-xl">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <Building className="w-5 h-5" />
                Headcount by Department
              </CardTitle>
              <CardDescription className="text-emerald-100">Employee distribution across departments</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={departmentData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={chartColors.grid} />
                  <XAxis dataKey="dept" angle={-25} textAnchor="end" height={65} stroke={chartColors.axis} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartColors.axis} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<DashboardTooltip />} />
                  <Bar dataKey="count" name="Employees" fill="#14b8a6" radius={[10, 10, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </div>
      </div>

      {/* Department-wise Attendance */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-0.5 bg-gradient-to-r from-[#17c491] to-[#0fa372] rounded-full"></div>
          <h2 className="text-3xl font-bold text-[#0d5f49]">Department-wise Attendance Today</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="modern-card hover-scale overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec] rounded-t-xl">
              <CardTitle className="text-[#0d5f49] flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Attendance Mix by Department
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Present, absent and half-day counts</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={departmentAttendanceChart} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={chartColors.grid} />
                  <XAxis dataKey="dept" angle={-25} textAnchor="end" height={70} stroke={chartColors.axis} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartColors.axis} allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="present" fill={chartColors.present} radius={[8, 8, 0, 0]} name="Present" maxBarSize={38} />
                  <Bar dataKey="half" fill={chartColors.half} radius={[8, 8, 0, 0]} name="Half Day" maxBarSize={38} />
                  <Bar dataKey="absent" fill={chartColors.absent} radius={[8, 8, 0, 0]} name="Absent" maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div className="modern-card hover-scale overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec] rounded-t-xl">
              <CardTitle className="text-[#0d5f49] flex items-center gap-2">
                <div className="w-5 h-5 bg-[#17c491] rounded-full flex items-center justify-center text-white text-xs font-bold">%</div>
                Department Attendance Summary
              </CardTitle>
              <CardDescription className="text-[#2f6f5f]">Quick comparison with attendance rate</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {departmentAttendanceChart.length > 0 ? (
                  departmentAttendanceChart.map((dept, idx) => (
                    <div key={idx} className="rounded-xl border border-[#17c491]/20 bg-[#f3fcf9] p-4 hover:shadow-lg transition-shadow duration-300">
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
                        <div className="rounded-xl bg-[#e8f9f4] p-3 border border-[#17c491]/20">
                          <p className="text-2xl font-bold text-[#0fa97f]">{dept.present}</p>
                          <p className="text-xs text-[#0d5f49]">Present</p>
                        </div>
                        <div className="rounded-xl bg-[#def8ef] p-3 border border-[#17c491]/20">
                          <p className="text-2xl font-bold text-[#17c491]">{dept.half}</p>
                          <p className="text-xs text-[#0d5f49]">Half Day</p>
                        </div>
                        <div className="rounded-xl bg-[#d2f4e8] p-3 border border-[#17c491]/20">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Leave Utilization</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Leave balance across all employees</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0f8f6a' : '#17c491'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Recent Activities</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b border-[#17c491]/15 last:border-b-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-[#e8f9f4] flex items-center justify-center text-[#17c491] text-sm flex-shrink-0">
                    {item?.icon || '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0d5f49]">{item?.activity || 'No activity'}</p>
                    <p className="text-xs text-[#2f6f5f] mt-1">{item?.time || ''}</p>
                  </div>
                </div>
              ))}
              {(!recentActivities || recentActivities.length === 0) && (
                <p className="text-sm text-[#2f6f5f] text-center py-4">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Recent Joinings</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Recently onboarded employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJoinings.map((emp, idx) => {
                const initials = emp?.name?.split(" ").filter(Boolean).map(n => n[0]).join("") || '👤';
                return (
                  <div key={idx} className="flex gap-3 pb-4 border-b border-[#17c491]/15 last:border-b-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-[#17c491] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0d5f49]">{emp?.name || 'New Employee'}</p>
                      <p className="text-xs text-[#2f6f5f]">
                        {[emp?.role, emp?.dept].filter(Boolean).join(' • ') || 'Role not specified'}
                      </p>
                      {emp?.joinDate && (
                        <p className="text-xs text-[#2f6f5f] mt-1">Joined: {emp.joinDate}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!recentJoinings || recentJoinings.length === 0) && (
                <p className="text-sm text-[#2f6f5f] text-center py-4">No recent joinings</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Upcoming Birthdays</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Celebrate with your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBirthdays?.map((emp, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b border-[#17c491]/15 last:border-b-0 last:pb-0">
                  <div className="text-2xl flex-shrink-0">{emp.emoji || "🎂"}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0d5f49]">{emp.name}</p>
                    <p className="text-xs text-[#2f6f5f]">{emp.date}</p>
                  </div>
                </div>
              ))}
              {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                <p className="text-sm text-[#2f6f5f] text-center py-4">No upcoming birthdays</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Upcoming Holidays</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Public and company holidays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingHolidays?.map((holiday, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b border-[#17c491]/15 last:border-b-0 last:pb-0">
                  <div className="text-2xl flex-shrink-0">{holiday.icon || "🏖️"}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0d5f49]">{holiday.name}</p>
                    <p className="text-xs text-[#2f6f5f]">{holiday.date}</p>
                    <p className="text-xs text-[#17c491] font-medium mt-1">{holiday.type}</p>
                  </div>
                </div>
              ))}
              {(!upcomingHolidays || upcomingHolidays.length === 0) && (
                <p className="text-sm text-[#2f6f5f] text-center py-4">No upcoming holidays</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Health Score Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-[#0d5f49]">Team Health Score</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
            <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
              <CardTitle className="text-[#0d5f49]">Overall Health</CardTitle>
              <CardDescription className="text-[#2f6f5f]">Team performance metrics summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#e8f9f4] to-[#d7f5ec]">
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
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#17c491]/20">
                  <div>
                    <p className="text-xs text-[#2f6f5f]">Trend</p>
                    <p className="text-lg font-bold text-[#17c491]">
                      {teamHealth?.trend ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2f6f5f]">Last Updated</p>
                    <p className="text-sm font-medium text-[#0d5f49]">
                      {teamHealth?.lastUpdated ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
            <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
              <CardTitle className="text-[#0d5f49]">Health Metrics</CardTitle>
              <CardDescription className="text-[#2f6f5f]">Individual performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {(teamHealth?.metrics || []).map((metric, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-[#0d5f49]">{metric.label}</p>
                      <span className="text-sm font-bold text-[#17c491]">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#e8f9f4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#17c491] rounded-full transition-all duration-500"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border border-[#17c491]/25 shadow-xl shadow-[#17c491]/10">
          <CardHeader className="bg-gradient-to-r from-[#e8f9f4] to-[#d7f5ec]">
            <CardTitle className="text-[#0d5f49]">Health Insights</CardTitle>
            <CardDescription className="text-[#2f6f5f]">Areas requiring attention and strengths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-[#0d5f49] mb-3 flex items-center gap-2">
                  <span className="text-[#17c491]">✓</span> Strengths
                </h4>
                <ul className="space-y-2">
                  {(teamHealth?.strengths || []).map((strength, idx) => (
                    <li key={`strength-${idx}`} className="text-sm text-[#2f6f5f]">
                      - {strength}
                    </li>
                  ))}
                  {(!teamHealth?.strengths || teamHealth.strengths.length === 0) && (
                    <li className="text-sm text-[#2f6f5f]">No strengths data available</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#0d5f49] mb-3 flex items-center gap-2">
                  <span className="text-yellow-600">⚠</span> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {(teamHealth?.improvements || []).length > 0 ? (
                    (teamHealth?.improvements || []).map((improvement, idx) => (
                      <li key={`improve-${idx}`} className="text-sm text-[#2f6f5f]">
                        - {improvement}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[#2f6f5f]">No critical issues found</li>
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

  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const allowedModules = getAllowedModulesFromSubscription(subscription, subscriptionLoading, { trialEndingSoonDays: 2 });
  
  // Check if user has access to Client Attendance - Sales department only
  const hasClientAttendanceAccess = user.roles?.some(role => role?.toLowerCase() === "sales") || 
                                     user.department?.toLowerCase() === "sales";

  // Sales quick links - show for all Sales users
  const hasSalesQuickLinksAccess = hasClientAttendanceAccess;
  
  // Check if user has HR access
  const hasHRAccess = canPerformModuleAction("hr_management", "view") ||
    user?.roles?.some(role => 
      role?.toLowerCase() === "hr" || 
      role?.toLowerCase() === "human resources" ||
      role?.toLowerCase() === "hr manager"
    );
  
  type QuickLink = { label: string; path: string; module: string };

  const quickLinks: QuickLink[] = [
    { label: "Mark Attendance", path: "/attendance/capture", module: "attendance" },
    { label: "Apply for Leave", path: "/leave/apply", module: "leave" },
    { label: "View Payslip", path: "/payroll/payslips", module: "payroll" },
    { label: "Submit Expense Claim", path: "/expenses/claims", module: "expenses" },
    ...(hasClientAttendanceAccess ? [
      { label: "Client Attendance", path: "/client-attendance", module: "client_attendance" }
    ] : []),
    ...(hasSalesQuickLinksAccess ? [
      { label: "My Clients", path: "/my-clients", module: "client_attendance" },
      { label: "My Analytics", path: "/my-analytics", module: "client_attendance" },
    ] : []),
    ...(hasHRAccess ? [
      { label: "Job Requirements", path: "/hr/requirements", module: "hr_management" },
      { label: "Recruitment", path: "/hr/recruitment", module: "hr_management" },
      { label: "Offer Letters", path: "/hr/offer-letters", module: "hr_management" },
      { label: "Onboarding", path: "/hr/onboarding", module: "hr_management" },
    ] : []),
  ].filter((link) => !allowedModules || allowedModules.has(link.module));

  if (loading) {
    return <div>Loading employee dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Format attendance data for chart
  const attendanceChartData = dashboardData?.monthlyAttendance?.chartData?.map(day => ({
    month: day.date.toString(),
    present: day.present,
    absent: day.absent,
    half: day.half
  })) || [];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">Your Attendance This Month</CardTitle>
            <CardDescription className="text-gray-600">
              Present: {dashboardData?.monthlyAttendance?.summary?.present || 0}, 
              Absent: {dashboardData?.monthlyAttendance?.summary?.absent || 0}, 
              Half Day: {dashboardData?.monthlyAttendance?.summary?.half || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Present"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Absent"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="half"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Half Day"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">Quick Links</CardTitle>
            <CardDescription className="text-gray-600">Frequently accessed features</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {quickLinks.map((link, index) => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="w-full text-left px-6 py-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-lift stat-card-enter font-semibold text-gray-800"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <span>{link.label}</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { canPerformModuleAction } = useRole();
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

  // Format team attendance data for chart
  const teamAttendanceChartData = dashboardData?.teamAttendance?.map(day => ({
    date: day.date.toString(),
    present: day.present,
    absent: day.absent,
    half: day.half
  })) || [];

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
            <CardDescription className="text-gray-600">Monthly attendance pattern for your team</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamAttendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="present" fill="#10b981" radius={[12, 12, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[12, 12, 0, 0]} name="Absent" />
                <Bar dataKey="half" fill="#f59e0b" radius={[12, 12, 0, 0]} name="Half Day" />
              </BarChart>
            </ResponsiveContainer>
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

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">Quick Links</CardTitle>
          <CardDescription className="text-gray-600">Frequently accessed features</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {[
            { label: "Team Attendance", path: "/attendance/log", module: "attendance", permission: () => canPerformModuleAction("attendance", "view"), color: "gradient-bg-green" },
            { label: "Leave Approvals", path: "/leave/approvals", module: "leave", permission: () => canPerformModuleAction("leave", "approve"), color: "gradient-bg-blue" },
            { label: "View Payslips", path: "/payroll/payslips", module: "payroll", permission: () => canPerformModuleAction("payroll", "view"), color: "gradient-bg-purple" },
            { label: "Expense Approvals", path: "/expenses/approvals", module: "expenses", permission: () => canPerformModuleAction("expenses", "approve"), color: "gradient-bg-orange" },
          ]
          .filter(link => (!allowedModules || allowedModules.has(link.module)) && link.permission())
          .map((link, index) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className={`w-full text-left px-6 py-4 rounded-xl ${link.color} text-white font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-lift stat-card-enter`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <span>{link.label}</span>
                <span className="text-white/80">→</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">Headcount by Department</CardTitle>
          <CardDescription className="text-gray-600">Employee distribution across departments</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.departmentData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dept" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const FinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          value={dashboardData?.financeStats?.monthlyPayroll || "₹0K"}
          icon={<BarChart3 className="w-7 h-7" />}
          description="Total disbursed"
          colorClass="gradient-bg-green"
        />
        <StatCard
          title="Expense Claims"
          value={dashboardData?.financeStats?.pendingExpenses || "₹0K"}
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

      <Card className="chart-container border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
          <CardTitle className="text-gray-800 font-bold">Monthly Payroll Trend</CardTitle>
          <CardDescription className="text-gray-600">Employee count and payroll amounts over time</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.payrollTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="#10b981"
                strokeWidth={3}
                name="Employees Paid"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
    } else if (hasRole(user, "admin")) {
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
