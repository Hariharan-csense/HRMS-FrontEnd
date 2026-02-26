import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Building2, TrendingUp, Users, Star, BarChart3, User, UserCheck } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";

type TrendPoint = { label: string; score: number };

const clampScore = (value: number) => Math.max(0, Math.min(10, value));

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0/10";
  if (Number.isNaN(value)) return "0/10";
  return `${clampScore(value).toFixed(0)}/10`;
};

const defaultDayTrend: TrendPoint[] = [
  { label: "Mon", score: 0 },
  { label: "Tue", score: 0 },
  { label: "Wed", score: 0 },
  { label: "Thu", score: 0 },
  { label: "Fri", score: 0 },
  { label: "Sat", score: 0 },
  { label: "Sun", score: 0 },
];

const defaultWeekTrend: TrendPoint[] = [
  { label: "W1", score: 0 },
  { label: "W2", score: 0 },
  { label: "W3", score: 0 },
  { label: "W4", score: 0 },
];

const defaultMonthTrend: TrendPoint[] = [
  { label: "Aug", score: 0 },
  { label: "Sep", score: 0 },
  { label: "Oct", score: 0 },
  { label: "Nov", score: 0 },
  { label: "Dec", score: 0 },
  { label: "Jan", score: 0 },
];

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = "emerald" }) => (
  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </div>
        </div>
        <div className={`h-12 w-12 rounded-xl bg-${color}-100 text-${color}-600 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PulseSurveysOverview: React.FC = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);

  const [avgHappiness, setAvgHappiness] = useState(0);
  const [avgScoreTrend, setAvgScoreTrend] = useState(0);
  const [dayTrend, setDayTrend] = useState<TrendPoint[]>(defaultDayTrend);
  const [weekTrend, setWeekTrend] = useState<TrendPoint[]>(defaultWeekTrend);
  const [monthTrend, setMonthTrend] = useState<TrendPoint[]>(defaultMonthTrend);
  const [genderStats, setGenderStats] = useState<{
    male: { employees: number; score: number };
    female: { employees: number; score: number };
  }>({
    male: { employees: 0, score: 0 },
    female: { employees: 0, score: 0 },
  });
  const [departmentDetails, setDepartmentDetails] = useState<
    Array<{ name: string; employees: number; score: number }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await ENDPOINTS.getPulseAdminOverview();
        if (cancelled) return;

        const data = res.data || {};
        setTotalEmployees(Number(data?.kpis?.totalEmployees || 0));
        setAvgHappiness(Number(data?.kpis?.avgHappiness || 0));
        setDepartmentCount(Number(data?.kpis?.departments || 0));
        setAvgScoreTrend(Number(data?.kpis?.avgScoreTrend || 0));

        setDayTrend(Array.isArray(data?.trend?.day) && data.trend.day.length ? data.trend.day : defaultDayTrend);
        setWeekTrend(Array.isArray(data?.trend?.week) && data.trend.week.length ? data.trend.week : defaultWeekTrend);
        setMonthTrend(Array.isArray(data?.trend?.month) && data.trend.month.length ? data.trend.month : defaultMonthTrend);

        setGenderStats({
          male: {
            employees: Number(data?.gender?.male?.employees || 0),
            score: Number(data?.gender?.male?.score || 0),
          },
          female: {
            employees: Number(data?.gender?.female?.employees || 0),
            score: Number(data?.gender?.female?.score || 0),
          },
        });

        setDepartmentDetails(Array.isArray(data?.departmentsDetails) ? data.departmentsDetails : []);
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: "Failed",
          description:
            e?.response?.data?.message || e?.message || "Failed to load overview",
          variant: "destructive",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const chartConfig = useMemo(
    () => ({
      score: { label: "Happiness Score", color: "#10b981" },
    }),
    [],
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Pulse Surveys Dashboard
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive overview of employee happiness, engagement, and satisfaction metrics
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Employees"
              value={totalEmployees}
              icon={<Users className="h-6 w-6" />}
              color="emerald"
            />
            <StatCard
              title="Avg Happiness"
              value={formatScore(avgHappiness)}
              icon={<Star className="h-6 w-6" />}
              color="teal"
            />
            <StatCard
              title="Departments"
              value={departmentCount}
              icon={<Building2 className="h-6 w-6" />}
              color="cyan"
            />
            <StatCard
              title="Score Trend"
              value={avgScoreTrend > 0 ? `+${avgScoreTrend}%` : `${avgScoreTrend}%`}
              icon={<TrendingUp className="h-6 w-6" />}
              color={avgScoreTrend > 0 ? "emerald" : "amber"}
            />
          </div>

          {/* Happiness Trend Chart */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5" />
                Happiness Trend Analysis
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Employee happiness score progression over different time periods
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="week" className="w-full">
                <TabsList className="mb-6 bg-emerald-50 border border-emerald-200">
                  <TabsTrigger value="day" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Day</TabsTrigger>
                  <TabsTrigger value="week" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Week</TabsTrigger>
                  <TabsTrigger value="month" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Month</TabsTrigger>
                </TabsList>

                {[
                  { key: "day", data: dayTrend },
                  { key: "week", data: weekTrend },
                  { key: "month", data: monthTrend },
                ].map(({ key, data }) => (
                  <TabsContent value={key} key={key}>
                    <ChartContainer config={chartConfig} className="h-[340px] w-full">
                      <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#6b7280" />
                        <YAxis domain={[0, 10]} tickLine={false} axisLine={false} stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Gender and Department Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Gender Analysis */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserCheck className="h-5 w-5" />
                  Gender Analysis
                </CardTitle>
                <CardDescription className="text-teal-100">
                  Happiness scores by gender distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {[
                  {
                    label: "Male",
                    employees: genderStats.male.employees,
                    score: genderStats.male.score,
                    icon: <User className="h-4 w-4" />,
                    color: "emerald"
                  },
                  {
                    label: "Female",
                    employees: genderStats.female.employees,
                    score: genderStats.female.score,
                    icon: <User className="h-4 w-4" />,
                    color: "pink"
                  },
                ].map((row) => (
                  <div key={row.label} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 bg-${row.color}-100 rounded text-${row.color}-600`}>
                          {row.icon}
                        </div>
                        <span className="font-semibold text-gray-900">{row.label}</span>
                      </div>
                      <div className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatScore(row.score)}
                      </div>
                    </div>
                    <Progress 
                      value={(clampScore(row.score) / 10) * 100} 
                      className="h-3 bg-gray-200"
                    />
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {row.employees} employee{row.employees === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Department Details */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="h-5 w-5" />
                  Department Performance
                </CardTitle>
                <CardDescription className="text-cyan-100">
                  Happiness scores by department breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentDetails.map((dept, index) => (
                    <Card 
                      key={dept.name} 
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                        index % 2 === 0 
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50' 
                          : 'bg-gradient-to-r from-teal-50 to-cyan-50'
                      }`}
                    >
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-gray-900 truncate">{dept.name}</div>
                          <div className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {formatScore(dept.score)}
                          </div>
                        </div>
                        <Progress 
                          value={(clampScore(dept.score) / 10) * 100} 
                          className="h-2 bg-gray-200"
                        />
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {dept.employees} employee{dept.employees === 1 ? "" : "s"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PulseSurveysOverview;
