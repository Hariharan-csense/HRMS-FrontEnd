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
      transform: translateY(20px);
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
  }

  .icon-gradient {
    background: linear-gradient(135deg, #17c491 0%, #0fa372 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
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
  <Card className={`metric-card hover-lift stat-card-enter border-0 shadow-lg`}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-2 font-medium">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 ${colorClass} rounded-xl flex items-center justify-center text-white shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

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

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/80">Welcome back! Here's your organization overview</p>
      </div>

      {/* KPI Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Key Metrics</h2>
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
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Card className="hover-lift cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100" onClick={() => navigate('/client-assignment')}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 gradient-bg-blue rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <Building className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-800">Client Assignment</h3>
                <p className="text-sm text-gray-600 mt-1">Manage clients</p>
              </div>
            </CardContent>
          </Card>
          {/* <Card className="hover-lift cursor-pointer border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100" onClick={() => navigate('/sales-attendance-report')}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 gradient-bg-orange rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-800">Sales Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">View reports</p>
              </div>
            </CardContent>
          </Card> */}
          <Card className="hover-lift cursor-pointer border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100" onClick={() => navigate('/client-geo-fence')}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 gradient-bg-green rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-800">Geo-Fence</h3>
                <p className="text-sm text-gray-600 mt-1">Set boundaries</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">Monthly Attendance</CardTitle>
            <CardDescription className="text-gray-600">Attendance trends over time</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
                <Line type="monotone" dataKey="half" name="Half Day" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="chart-container border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
            <CardTitle className="text-gray-800 font-bold">Headcount by Department</CardTitle>
            <CardDescription className="text-gray-600">Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
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

      {/* Department-wise Attendance */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Department-wise Attendance Today</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Present by Department</CardTitle>
              <CardDescription>Number of employees present in each department today</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dept" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" radius={[8, 8, 0, 0]} name="Present" />
                  <Bar dataKey="half" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Half Day" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Attendance Summary</CardTitle>
              <CardDescription>Detailed attendance breakdown by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentAttendanceData.length > 0 ? (
                  departmentAttendanceData.map((dept, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{dept.dept}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {dept.total} employees
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-green-600">{dept.present}</p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-yellow-600">{dept.half}</p>
                          <p className="text-xs text-muted-foreground">Half</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-red-600">{dept.absent}</p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-blue-600">
                            {dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Rate</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No attendance data available for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Utilization</CardTitle>
            <CardDescription>Leave balance across all employees</CardDescription>
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
                    <Cell key={`cell-${index}`} fill={entry?.fill || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm flex-shrink-0">
                    {item?.icon || '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item?.activity || 'No activity'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item?.time || ''}</p>
                  </div>
                </div>
              ))}
              {(!recentActivities || recentActivities.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Joinings</CardTitle>
            <CardDescription>Recently onboarded employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJoinings.map((emp, idx) => {
                const initials = emp?.name?.split(" ").filter(Boolean).map(n => n[0]).join("") || '👤';
                return (
                  <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{emp?.name || 'New Employee'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[emp?.role, emp?.dept].filter(Boolean).join(' • ') || 'Role not specified'}
                      </p>
                      {emp?.joinDate && (
                        <p className="text-xs text-muted-foreground mt-1">Joined: {emp.joinDate}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!recentJoinings || recentJoinings.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent joinings</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Birthdays</CardTitle>
            <CardDescription>Celebrate with your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBirthdays?.map((emp, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="text-2xl flex-shrink-0">{emp.emoji || "🎂"}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.date}</p>
                  </div>
                </div>
              ))}
              {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming birthdays</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
            <CardDescription>Public and company holidays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingHolidays?.map((holiday, idx) => (
                <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="text-2xl flex-shrink-0">{holiday.icon || "🏖️"}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{holiday.name}</p>
                    <p className="text-xs text-muted-foreground">{holiday.date}</p>
                    <p className="text-xs text-primary/70 font-medium mt-1">{holiday.type}</p>
                  </div>
                </div>
              ))}
              {(!upcomingHolidays || upcomingHolidays.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming holidays</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Health Score Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Team Health Score</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Health</CardTitle>
              <CardDescription>Team performance metrics summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {teamHealth?.overallScore ?? 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">out of 100</div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-4">
                    {teamHealth?.status ?? 'Loading...'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <p className="text-lg font-bold text-green-600">
                      {teamHealth?.trend ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">
                      {teamHealth?.lastUpdated ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Metrics</CardTitle>
              <CardDescription>Individual performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {(teamHealth?.metrics || []).map((metric, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-foreground">{metric.label}</p>
                      <span className="text-sm font-bold text-primary">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Health Insights</CardTitle>
            <CardDescription>Areas requiring attention and strengths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Strengths
                </h4>
                <ul className="space-y-2">
                  {(teamHealth?.strengths || []).map((strength, idx) => (
                    <li key={`strength-${idx}`} className="text-sm text-muted-foreground">
                      - {strength}
                    </li>
                  ))}
                  {(!teamHealth?.strengths || teamHealth.strengths.length === 0) && (
                    <li className="text-sm text-muted-foreground">No strengths data available</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-yellow-600">⚠</span> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {(teamHealth?.improvements || []).length > 0 ? (
                    (teamHealth?.improvements || []).map((improvement, idx) => (
                      <li key={`improve-${idx}`} className="text-sm text-muted-foreground">
                        - {improvement}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No critical issues found</li>
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
  
  // Check if user has access to Client Attendance
  const hasClientAttendanceAccess = canPerformModuleAction("client_attendance", "view") || 
    user?.roles?.some(role => role?.toLowerCase() === "sales");
  
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
    ...(user?.roles?.some(role => role?.toLowerCase() === "sales") ? [
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

  const getDashboard = () => {
    if (hasRole(user, "superadmin")) {
      // Redirect superadmin to SuperAdminDashboard
      navigate("/superadmin-dashboard");
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
