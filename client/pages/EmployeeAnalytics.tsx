import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from "recharts";

const monthlyAttendanceData = [
  { month: "Jan", present: 22, absent: 1, late: 2, halfDay: 1 },
  { month: "Feb", present: 20, absent: 2, late: 1, halfDay: 2 },
  { month: "Mar", present: 23, absent: 0, late: 1, halfDay: 0 },
  { month: "Apr", present: 21, absent: 1, late: 2, halfDay: 1 },
  { month: "May", present: 22, absent: 1, late: 1, halfDay: 0 },
  { month: "Jun", present: 20, absent: 2, late: 2, halfDay: 1 },
];

const performanceData = [
  { month: "Jan", score: 85, target: 90 },
  { month: "Feb", score: 88, target: 90 },
  { month: "Mar", score: 92, target: 90 },
  { month: "Apr", score: 87, target: 90 },
  { month: "May", score: 91, target: 90 },
  { month: "Jun", score: 94, target: 90 },
];

const leaveData = [
  { name: "Annual Leave", value: 12, color: "#3b82f6" },
  { name: "Sick Leave", value: 5, color: "#10b981" },
  { name: "Personal Leave", value: 3, color: "#f59e0b" },
  { name: "Used", value: 8, color: "#ef4444" },
];

const taskCompletionData = [
  { week: "Week 1", completed: 12, pending: 3 },
  { week: "Week 2", completed: 15, pending: 2 },
  { week: "Week 3", completed: 18, pending: 1 },
  { week: "Week 4", completed: 14, pending: 4 },
];

const skillRadarData = [
  { skill: "Communication", level: 85 },
  { skill: "Technical", level: 92 },
  { skill: "Teamwork", level: 88 },
  { skill: "Leadership", level: 76 },
  { skill: "Problem Solving", level: 90 },
  { skill: "Time Management", level: 82 },
];

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
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
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
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            My Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Track your performance and attendance insights</p>
        </div>

        {/* Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {["1month", "3months", "6months", "1year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {period === "1month" ? "1 Month" : 
                     period === "3months" ? "3 Months" : 
                     period === "6months" ? "6 Months" : "1 Year"}
                  </button>
                ))}
              </div>
              <button className="text-sm text-primary hover:underline">
                Export Report
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted p-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs md:text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs md:text-sm">Performance</TabsTrigger>
            <TabsTrigger value="goals" className="text-xs md:text-sm">Goals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Attendance Rate"
                  value="94.2%"
                  icon={<Users className="w-6 h-6" />}
                  trend="+2.1% from last month"
                  description="This month"
                  color="green"
                />
                <StatCard
                  title="Performance Score"
                  value="91/100"
                  icon={<Award className="w-6 h-6" />}
                  trend="+3 points"
                  description="Current rating"
                  color="blue"
                />
                <StatCard
                  title="Tasks Completed"
                  value="59"
                  icon={<Target className="w-6 h-6" />}
                  trend="+12% from last month"
                  description="This month"
                  color="purple"
                />
                <StatCard
                  title="Working Hours"
                  value="168.5"
                  icon={<Clock className="w-6 h-6" />}
                  description="Hours this month"
                  color="orange"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Your monthly attendance pattern</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyAttendanceData}>
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
                    <CardDescription>Monthly performance vs target</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Your Score" />
                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance</CardTitle>
                  <CardDescription>Your remaining leave for this year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
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

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Attendance</CardTitle>
                    <CardDescription>Day-by-day attendance breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyAttendanceData}>
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
                    <CardDescription>Key attendance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Present Days</span>
                        <span className="text-2xl font-bold text-green-600">128</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium">Late Arrivals</span>
                        <span className="text-2xl font-bold text-yellow-600">9</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Half Days</span>
                        <span className="text-2xl font-bold text-blue-600">5</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">Absent Days</span>
                        <span className="text-2xl font-bold text-red-600">7</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Completion</CardTitle>
                    <CardDescription>Weekly task completion rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={taskCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" />
                        <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Assessment</CardTitle>
                    <CardDescription>Your skill ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {skillRadarData.map((skill, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{skill.skill}</span>
                            <span className="text-sm font-bold text-primary">{skill.level}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goals</CardTitle>
                  <CardDescription>Track your progress towards objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Complete 20 client meetings</span>
                        <span className="text-sm text-muted-foreground">18/20</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: "90%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Achieve 95% attendance</span>
                        <span className="text-sm text-muted-foreground">94.2%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "94.2%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Complete training modules</span>
                        <span className="text-sm text-muted-foreground">3/5</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "60%" }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Submit all reports on time</span>
                        <span className="text-sm text-muted-foreground">8/8</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
