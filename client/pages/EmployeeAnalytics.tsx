import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/endpoint";
import {
  Users,
  Clock,
  TrendingUp,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

type Period = "1month" | "3months" | "6months" | "1year";

interface AnalyticsResponse {
  summary: {
    attendanceRate: number;
    performanceScore: number;
    workingHoursMonth: string;
    leaveAvailable: number;
    presentDays: number;
    lateDays: number;
    halfDays: number;
    absentDays: number;
  };
  charts: {
    monthlyAttendanceData: Array<{ month: string; present: number; absent: number; late: number; halfDay: number }>;
    performanceData: Array<{ month: string; score: number; target: number }>;
    leaveData: Array<{ name: string; value: number }>;
  };
  goals: Array<{ title: string; progress: number; current: string; target: string }>;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  description?: string;
  color?: string;
}> = ({ title, value, icon, trend, description, color = "primary" }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}/10 rounded-lg flex items-center justify-center text-${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function EmployeeAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("6months");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const fetchAnalytics = async (period: Period) => {
    setLoading(true);
    try {
      const response = await ENDPOINTS.getEmployeeAnalyticsData(period);
      setAnalytics(response.data as AnalyticsResponse);
    } catch (error: any) {
      console.error("Failed to fetch employee analytics:", error);
      toast.error(error?.response?.data?.message || "Failed to load analytics");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const leavePieData = useMemo(() => {
    const data = analytics?.charts?.leaveData || [];
    return data.map((item, idx) => ({ ...item, color: PIE_COLORS[idx % PIE_COLORS.length] }));
  }, [analytics]);

  const summary = analytics?.summary;
  const attendanceTrend = analytics?.charts?.monthlyAttendanceData || [];
  const performanceData = analytics?.charts?.performanceData || [];
  const goals = analytics?.goals || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            My Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Track your performance and attendance insights</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(["1month", "3months", "6months", "1year"] as Period[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {period === "1month" ? "1 Month" : period === "3months" ? "3 Months" : period === "6months" ? "6 Months" : "1 Year"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted p-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs md:text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs md:text-sm">Performance</TabsTrigger>
            <TabsTrigger value="goals" className="text-xs md:text-sm">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Attendance Rate"
                  value={`${summary?.attendanceRate ?? 0}%`}
                  icon={<Users className="w-6 h-6" />}
                  description="Current month"
                  color="green"
                />
                <StatCard
                  title="Performance Score"
                  value={`${summary?.performanceScore ?? 0}/100`}
                  icon={<Award className="w-6 h-6" />}
                  description="Derived from attendance"
                  color="blue"
                />
                <StatCard
                  title="Present Days"
                  value={summary?.presentDays ?? 0}
                  icon={<Target className="w-6 h-6" />}
                  description="Current month"
                  color="purple"
                />
                <StatCard
                  title="Working Hours"
                  value={summary?.workingHoursMonth ?? "0.0"}
                  icon={<Clock className="w-6 h-6" />}
                  description="Hours this month"
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Your monthly attendance pattern</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={attendanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="#10b981" />
                        <Area type="monotone" dataKey="late" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                        <Area type="monotone" dataKey="halfDay" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                        <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Score</CardTitle>
                    <CardDescription>Monthly score vs target</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Score" />
                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance</CardTitle>
                  <CardDescription>Your leave distribution this year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={leavePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {leavePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Attendance</CardTitle>
                    <CardDescription>Month-wise attendance breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={attendanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="present" fill="#10b981" name="Present" />
                        <Bar dataKey="late" fill="#f59e0b" name="Late" />
                        <Bar dataKey="halfDay" fill="#3b82f6" name="Half Day" />
                        <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Current month metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Present Days</span>
                        <span className="text-2xl font-bold text-green-600">{summary?.presentDays ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Late Arrivals</span>
                        <span className="text-2xl font-bold text-yellow-600">{summary?.lateDays ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Half Days</span>
                        <span className="text-2xl font-bold text-blue-600">{summary?.halfDays ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">Absent Days</span>
                        <span className="text-2xl font-bold text-red-600">{summary?.absentDays ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Attendance-based performance score over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} name="Score" />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" name="Target" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goals</CardTitle>
                  <CardDescription>Live progress from current analytics data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {goals.map((goal, idx) => (
                      <div key={`${goal.title}-${idx}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-sm text-muted-foreground">{goal.current} / {goal.target}</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {loading && <p className="text-sm text-muted-foreground">Loading analytics...</p>}
      </div>
    </Layout>
  );
}
