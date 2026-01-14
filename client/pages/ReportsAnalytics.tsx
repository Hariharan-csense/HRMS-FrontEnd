import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import reportService from "@/components/helper/roles/report/report";

export default function ReportsAnalytics() {
  const location = useLocation();

  // State for report data
  const [attendanceData, setAttendanceData] = useState([

  ]);
  const [leaveData, setLeaveData] = useState([

  ]);
  const [payrollData, setPayrollData] = useState([

  ]);
  const [expenseData, setExpenseData] = useState([

  ]);

  // Define types for summary data
  interface PayrollSummary {
    totalEmployees?: number;
    avgSalary?: string;
    totalPayroll?: string;
    ytdAmount?: string;
  }

  // State for summary data
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({});
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);

  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine report type from URL - synchronous, no state needed
  const getReportType = (pathname: string): "attendance" | "leave" | "payroll" | "finance" | "analytics" => {
    if (pathname.startsWith("/reports/finance")) return "finance";
    if (pathname.startsWith("/reports/payroll")) return "payroll";
    if (pathname.startsWith("/reports/leave")) return "leave";
    if (pathname.startsWith("/reports/attendance")) return "attendance";
    return "analytics";
  };

  const reportType = getReportType(location.pathname);

  // Fetch report data based on report type
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (reportType === "attendance" || reportType === "finance") {
          const response = await reportService.getAttendanceReport();
          const attendanceResult = response?.data.data;
          setAttendanceData(attendanceResult.trend || []);
          setAttendanceSummary(attendanceResult.summary || {});
        }

        if (reportType === "leave" || reportType === "finance") {
          const response = await reportService.getLeaveReport();

          const leaveResult = response?.data.data;
          const normalizedLeaves = leaveResult.distribution.map((l) => ({
            name: l.type,
            value: l.count,
            fill: l.color || "#f43f5e",
          }));

          setLeaveData(normalizedLeaves);
          setLeaveSummary(leaveResult.stats);
        }

        if (reportType === "payroll" || reportType === "finance") {
          const response = await reportService.getPayrollReport();
          console.log("Payroll API Response:", response);
          console.log("Payroll data:", response?.data);
          // const payrollResult = response?.data || response;
          const payrollResult = response?.data?.data ?? response.data;
          if (payrollResult?.trend) {
            console.log("Setting payroll trend data:", payrollResult.trend);
            setPayrollData(payrollResult.trend);
          } else if (Array.isArray(payrollResult)) {
            console.log("Setting payroll data as array:", payrollResult);
            setPayrollData(payrollResult);
          }
          if (payrollResult?.summary) {
            console.log("Setting payroll summary:", payrollResult.summary);
            setPayrollSummary({
              totalEmployees: payrollResult.summary.totalEmployees,
              avgSalary: payrollResult.summary.avgSalary,
              totalPayroll: payrollResult.summary.totalPayroll,
              ytdAmount: payrollResult.summary.ytdAmount
            });
          }
        }

        if (reportType === "finance") {
          const response = await reportService.getExpenseReport();

          const expenseResult = response?.data?.data;
          setExpenseData(expenseResult.summary || []);
          setExpenseStats(expenseResult.stats || {});
        }
      } catch (err) {
        setError(err.message || "Failed to fetch report data");
        console.error("Report data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportType]);

  const getPageTitle = (): string => {
    switch (reportType) {
      case "attendance":
        return "Attendance Reports";
      case "leave":
        return "Leave Reports";
      case "payroll":
        return "Payroll Reports";
      case "finance":
        return "Finance Reports";
      default:
        return "Reports & Analytics";
    }
  };

  const getPageDescription = (): string => {
    switch (reportType) {
      case "attendance":
        return "Employee attendance and punctuality tracking";
      case "leave":
        return "Leave utilization and approval analytics";
      case "payroll":
        return "Payroll processing and salary analysis";
      case "finance":
        return "Financial analysis and expense tracking";
      default:
        return "Comprehensive HR insights and analytics";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground mt-2">{getPageDescription()}</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading report data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 font-medium">Error:</div>
              <div className="ml-2 text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Report Content - Only show when not loading */}
        {!loading && !error && (
          <>
            {/* Attendance Reports */}
            {reportType === "attendance" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Attendance Trend</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Monthly attendance metrics and patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={attendanceData} margin={{ top: 15, right: 40, left: 0, bottom: 10 }}>
                        <defs>
                          <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #0ea5e9",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                          formatter={(value) => [`${value}`, ""]}
                        />
                        <Line
                          type="natural"
                          dataKey="present"
                          stroke="#06b6d4"
                          strokeWidth={4}
                          dot={{ fill: "#06b6d4", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Present"
                          isAnimationActive
                        />
                        <Line
                          type="natural"
                          dataKey="absent"
                          stroke="#f43f5e"
                          strokeWidth={4}
                          dot={{ fill: "#f43f5e", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Absent"
                          isAnimationActive
                        />
                        <Line
                          type="natural"
                          dataKey="half"
                          stroke="#eab308"
                          strokeWidth={4}
                          dot={{ fill: "#eab308", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Half Day"
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Employees", value: attendanceSummary?.totalEmployees ?? 0, gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Avg Attendance", value: attendanceSummary?.avgAttendance ?? "0%", gradient: "from-green-500 via-green-600 to-green-700", icon: "✅" },
                        { label: "Present Today", value: attendanceSummary?.presentToday ?? 0, gradient: "from-indigo-500 via-indigo-600 to-indigo-700", icon: "📍" },
                        { label: "On Leave", value: attendanceSummary?.onLeave ?? 0, gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "🏖️" },
                      ].map((item) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">{item.label}</div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Leave Reports */}
            {reportType === "leave" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-rose-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent">Leave Distribution</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Leave utilization analysis by leave type</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart margin={{ top: 15, right: 30, left: 0, bottom: 15 }}>
                        <Pie
                          data={Array.isArray(leaveData) ? leaveData : []}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={110}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive
                        >
                          {Array.isArray(leaveData) && leaveData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={2} stroke="#fff" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #f43f5e",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Leave Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Employees", value: leaveSummary?.totalEmployees ?? 0, gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Approved Leaves", value: leaveSummary?.approvedLeaves ?? 0, gradient: "from-green-500 via-green-600 to-green-700", icon: "✅" },
                        { label: "Pending Requests", value: leaveSummary?.pendingRequests ?? 0, gradient: "from-orange-500 via-orange-600 to-orange-700", icon: "⏳" },
                        { label: "Avg Days Used", value: leaveSummary?.avgDaysUsed ?? 0, gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "📅" },
                      ].map((item) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">{item.label}</div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payroll Reports */}
            {reportType === "payroll" && (
              <div className="space-y-6">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-teal-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">Payroll Trend</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Monthly payroll disbursement trends and patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart data={payrollData} margin={{ top: 15, right: 40, left: 0, bottom: 10 }}>
                        <defs>
                          <linearGradient id="payrollGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "2px solid #14b8a6",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                          }}
                          labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                          formatter={(value) => [`₹${value}K`, ""]}
                        />
                        <Line
                          type="natural"
                          dataKey="amount"
                          stroke="#0d9488"
                          strokeWidth={4}
                          dot={{ fill: "#0d9488", r: 6, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 8 }}
                          name="Payroll Amount"
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Payroll Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Employees", value: payrollSummary.totalEmployees?.toString() || "0", gradient: "from-purple-500 via-purple-600 to-purple-700", icon: "👥" },
                        { label: "Avg Salary", value: payrollSummary.avgSalary || "₹0", gradient: "from-indigo-500 via-indigo-600 to-indigo-700", icon: "💰" },
                        { label: "Total Payroll", value: payrollSummary.totalPayroll || "₹0", gradient: "from-green-500 via-green-600 to-green-700", icon: "📊" },
                        { label: "YTD Amount", value: payrollSummary.ytdAmount || "₹0", gradient: "from-cyan-500 via-cyan-600 to-cyan-700", icon: "📈" },
                      ].map((item) => (
                        <Card key={item.label} className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}>
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">{item.label}</div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">{item.value}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Finance Reports - Tabbed View */}
            {reportType === "finance" && (
              <div className="space-y-6">

                {/* Expense Summary by Category */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-white to-slate-50 hover:shadow-3xl transition-shadow">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      Expense Summary by Category
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">
                      Breakdown of expenses across different categories
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {expenseData?.length === 0 ? (
                      <div className="text-center text-muted-foreground py-20">
                        No expense data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart
                          data={expenseData}
                          margin={{ top: 15, right: 40, left: 0, bottom: 40 }}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="category"
                            stroke="#94a3b8"
                            fontSize={12}
                            fontWeight={500}
                            angle={-15}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} />

                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.95)",
                              border: "2px solid #a855f7",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                              padding: "12px 16px",
                            }}
                            labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                          />

                          <Bar
                            dataKey="amount"
                            fill="url(#barGradient)"
                            radius={[12, 12, 4, 4]}
                            isAnimationActive
                            animationDuration={600}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Expense Statistics */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardHeader className="pb-4 border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      Expense Statistics
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Total Claims",
                          value: expenseStats?.totalClaims ?? 0,
                          gradient: "from-blue-500 via-blue-600 to-blue-700",
                          icon: "📋",
                        },
                        {
                          label: "Total Amount",
                          value: expenseStats?.totalAmount ?? "₹0",
                          gradient: "from-orange-500 via-orange-600 to-orange-700",
                          icon: "💵",
                        },
                        {
                          label: "Pending Approval",
                          value: expenseStats?.pendingApproval ?? "₹0",
                          gradient: "from-pink-500 via-pink-600 to-pink-700",
                          icon: "⏳",
                        },
                      ].map((item) => (
                        <Card
                          key={item.label}
                          className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${item.gradient}`}
                        >
                          <CardContent className="pt-6">
                            <div className="text-3xl mb-2">{item.icon}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">
                              {item.label}
                            </div>
                            <div className="text-3xl font-bold mt-3 text-white drop-shadow-lg">
                              {item.value}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

          </>
        )}
      </div>
    </Layout>
  );
}
