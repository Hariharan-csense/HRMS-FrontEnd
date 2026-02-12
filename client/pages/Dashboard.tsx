import React, { useEffect, useState } from "react";
import { hasRole } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AdminDashboardData, getAdminDashboardData } from "@/components/helper/dashboard/dashboard";

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

  .dashboard-content-enter {
    animation: dashboardEnter 0.6s ease-out;
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
}> = ({ title, value, icon, trend, description }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
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
  const leaveData = charts?.leaveData || [];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={kpis.totalEmployees?.toString() || '0'}
            icon={<Users className="w-6 h-6" />}
            description="Active employees"
          />
          <StatCard
            title="Present Today"
            value={kpis.presentToday?.toString() || '0'}
            icon={<CheckCircle className="w-6 h-6" />}
            trend={kpis.presentTrend || ''}
            description="Current attendance"
          />
          <StatCard
            title="On Leave"
            value={kpis.onLeave?.toString() || '0'}
            icon={<Calendar className="w-6 h-6" />}
            trend={kpis.onLeaveTrend || ''}
            description="Approved leaves"
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.pendingApprovals?.toString() || '0'}
            icon={<AlertCircle className="w-6 h-6" />}
            trend={kpis.pendingTrend || ''}
            description="Awaiting action"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance</CardTitle>
            <CardDescription>Attendance trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" />
                <Line type="monotone" dataKey="half" name="Half Day" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount by Department</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
  const quickLinks = [
    { label: "Mark Attendance", path: "/attendance/capture" },
    { label: "Apply for Leave", path: "/leave/apply" },
    { label: "View Payslip", path: "/payroll/payslips" },
    { label: "Submit Expense Claim", path: "/expenses/claims" },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Welcome, {userName || "Employee"}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Today's Status"
          value="Present"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          description="Checked in at 09:15 AM"
        />
        <StatCard
          title="Leave Balance"
          value="12"
          icon={<Calendar className="w-6 h-6" />}
          description="Days remaining this year"
        />
        <StatCard
          title="Working Hours"
          value="8.5"
          icon={<Clock className="w-6 h-6" />}
          description="Hours logged today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Attendance This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={employeeAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="w-full text-left px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {link.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const pendingItems = [
    { id: 1, name: "Leave Request - Alice Smith", type: "5 days", category: "leave" },
    { id: 2, name: "Expense Claim - Bob Johnson", type: "₹500", category: "expense" },
    { id: 3, name: "Leave Request - Carol White", type: "2 days", category: "leave" },
  ];

  const handleReview = (category: string) => {
    if (category === "leave") {
      navigate("/leave/approvals");
    } else if (category === "expense") {
      navigate("/expenses/approvals");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Manager Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Size"
          value="12"
          icon={<Users className="w-6 h-6" />}
          description="Direct reportees"
        />
        <StatCard
          title="Present Today"
          value="11"
          icon={<CheckCircle className="w-6 h-6" />}
          description="91.7% attendance"
        />
        <StatCard
          title="On Leave"
          value="1"
          icon={<Calendar className="w-6 h-6" />}
          description="Approved leaves"
        />
        <StatCard
          title="Pending Approvals"
          value="3"
          icon={<AlertCircle className="w-6 h-6" />}
          description="Awaiting your action"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData.slice(0, 3)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <button
                    onClick={() => handleReview(item.category)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Team Attendance", path: "/attendance/log" },
            { label: "Leave Approvals", path: "/leave/approvals" },
            { label: "View Payslips", path: "/payroll/payslips" },
            { label: "Expense Approvals", path: "/expenses/approvals" },
          ].map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className="w-full text-left px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              {link.label}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const HRDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">HR Dashboard</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Employees"
        value="120"
        icon={<Users className="w-6 h-6" />}
        description="Department scope"
      />
      <StatCard
        title="Pending Exits"
        value="2"
        icon={<AlertCircle className="w-6 h-6" />}
        description="Awaiting processing"
      />
      <StatCard
        title="Leave Approvals"
        value="5"
        icon={<Calendar className="w-6 h-6" />}
        description="Pending review"
      />
      <StatCard
        title="New Joiners"
        value="3"
        icon={<CheckCircle className="w-6 h-6" />}
        description="This month"
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Headcount by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dept" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

const FinanceDashboard = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold">Finance Dashboard</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Monthly Payroll"
        value="₹450K"
        icon={<BarChart3 className="w-6 h-6" />}
        description="Total disbursed"
      />
      <StatCard
        title="Expense Claims"
        value="₹12K"
        icon={<AlertCircle className="w-6 h-6" />}
        description="Pending approval"
      />
      <StatCard
        title="Payslips Generated"
        value="120"
        icon={<CheckCircle className="w-6 h-6" />}
        description="This month"
      />
      <StatCard
        title="Budget Utilization"
        value="78%"
        icon={<TrendingUp className="w-6 h-6" />}
        description="Year to date"
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Monthly Payroll Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={payrollTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="present"
              stroke="#10b981"
              name="Employees Paid"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const getDashboard = () => {
    if (hasRole(user, "admin")) {
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
