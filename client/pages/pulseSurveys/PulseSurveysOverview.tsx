import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, MapPin, TrendingUp, Users, Star, BarChart3, User, UserCheck } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";

const clampScore = (value: number) => Math.max(0, Math.min(10, value));

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0/10";
  if (Number.isNaN(value)) return "0/10";
  return `${clampScore(value).toFixed(0)}/10`;
};

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
  const [branchDetails, setBranchDetails] = useState<
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
        setBranchDetails(Array.isArray(data?.branchesDetails) ? data.branchesDetails : []);
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

  return (
    <Layout>
      <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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

          {/* Gender and Department Analysis */}
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl bg-white/80 shadow-xl backdrop-blur-sm">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <UserCheck className="h-5 w-5" />
                  Gender Analysis
                </h2>
                <p className="mt-2 text-sm text-teal-100">
                  Happiness scores by gender distribution
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Male",
                      employees: genderStats.male.employees,
                      score: genderStats.male.score,
                      icon: <User className="h-4 w-4" />,
                      iconClass: "bg-emerald-100 text-emerald-600",
                    },
                    {
                      label: "Female",
                      employees: genderStats.female.employees,
                      score: genderStats.female.score,
                      icon: <User className="h-4 w-4" />,
                      iconClass: "bg-pink-100 text-pink-600",
                    },
                  ].map((row) => (
                    <Card
                      key={row.label}
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                        row.label === "Male"
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50"
                          : "bg-gradient-to-r from-pink-50 to-rose-50"
                      }`}
                    >
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${row.iconClass}`}>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-white/80 shadow-xl backdrop-blur-sm">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Building2 className="h-5 w-5" />
                  Department Performance
                </h2>
                <p className="mt-2 text-sm text-cyan-100">
                  Happiness scores by department breakdown
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {departmentDetails.length ? (
                    departmentDetails.map((dept, index) => (
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
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No department scores to show.</div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-sky-500 to-emerald-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5" />
                Branch Performance
              </CardTitle>
              <CardDescription className="text-sky-100">
                Happiness scores by branch breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {branchDetails.length ? (
                  branchDetails.map((branch, index) => (
                    <Card
                      key={branch.name}
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                        index % 2 === 0
                          ? 'bg-gradient-to-r from-sky-50 to-emerald-50'
                          : 'bg-gradient-to-r from-emerald-50 to-teal-50'
                      }`}
                    >
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-gray-900 truncate">{branch.name}</div>
                          <div className="font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            {formatScore(branch.score)}
                          </div>
                        </div>
                        <Progress
                          value={(clampScore(branch.score) / 10) * 100}
                          className="h-2 bg-gray-200"
                        />
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {branch.employees} employee{branch.employees === 1 ? "" : "s"}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No branch scores to show.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PulseSurveysOverview;
