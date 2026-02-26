import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";
import { TrendingUp, BarChart3, MessageSquare, Calendar, Users, ArrowLeft, Star, User } from "lucide-react";

type ApiSurvey = {
  id: number;
  title: string;
  message: string;
  allowAnonymous: boolean;
  createdAt: string;
  responseCount: number;
  avgScore: number;
};

type ApiResponse = {
  id: number;
  surveyId: number;
  employeeId: number;
  score: number;
  label: string;
  comment: string;
  isAnonymous: boolean;
  respondedAt: string;
  updatedAt?: string;
  employee?: { name: string; email: string; gender?: string } | null;
};

const clamp = (value: number) => Math.max(0, Math.min(10, value));

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0/10";
  if (Number.isNaN(value)) return "0/10";
  return `${clamp(value).toFixed(1)}/10`;
};

const anonymizeUser = (employeeId: number) => `Employee • ${String(employeeId).padStart(4, "0")}`;

const groupByDay = (responses: ApiResponse[]) => {
  const map = new Map<string, { label: string; sum: number; count: number }>();
  for (const r of responses) {
    const d = new Date(r.respondedAt);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    const prev = map.get(key) || { label, sum: 0, count: 0 };
    map.set(key, { label: prev.label, sum: prev.sum + clamp(r.score || 0), count: prev.count + 1 });
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ label: v.label, score: v.count ? v.sum / v.count : 0 }));
};

const groupByWeek = (responses: ApiResponse[]) => {
  const map = new Map<string, { label: string; sum: number; count: number }>();
  for (const r of responses) {
    const d = new Date(r.respondedAt);
    const year = d.getFullYear();
    const first = new Date(Date.UTC(year, 0, 1));
    const days = Math.floor(
      (Date.UTC(year, d.getMonth(), d.getDate()) - first.getTime()) / 86400000,
    );
    const week = Math.floor(days / 7) + 1;
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    const label = `W${week}`;
    const prev = map.get(key) || { label, sum: 0, count: 0 };
    map.set(key, { label: prev.label, sum: prev.sum + clamp(r.score || 0), count: prev.count + 1 });
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ label: v.label, score: v.count ? v.sum / v.count : 0 }));
};

const groupByMonth = (responses: ApiResponse[]) => {
  const map = new Map<string, { label: string; sum: number; count: number }>();
  for (const r of responses) {
    const d = new Date(r.respondedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    const prev = map.get(key) || { label, sum: 0, count: 0 };
    map.set(key, { label: prev.label, sum: prev.sum + clamp(r.score || 0), count: prev.count + 1 });
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ label: v.label, score: v.count ? v.sum / v.count : 0 }));
};

const distribution = (responses: ApiResponse[]) => {
  const buckets = [
    { label: "2", score: 2, count: 0 },
    { label: "4", score: 4, count: 0 },
    { label: "6", score: 6, count: 0 },
    { label: "8", score: 8, count: 0 },
    { label: "10", score: 10, count: 0 },
  ];
  const index = new Map<number, number>(buckets.map((b, i) => [b.score, i]));
  for (const r of responses) {
    const i = index.get(clamp(r.score || 0));
    if (i !== undefined) buckets[i].count += 1;
  }
  return buckets.map((b) => ({ label: b.label, count: b.count }));
};

const PulseSurveyResultsDetail: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<ApiSurvey | null>(null);
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!surveyId) return;

    (async () => {
      try {
        const [surveyRes, respRes] = await Promise.all([
          ENDPOINTS.getPulseAdminSurvey(surveyId),
          ENDPOINTS.getPulseAdminSurveyResponses(surveyId),
        ]);
        if (cancelled) return;
        setSurvey(surveyRes.data || null);
        setResponses(Array.isArray(respRes.data) ? respRes.data : []);
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: "Failed",
          description:
            e?.response?.data?.message || e?.message || "Failed to load results",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  const avg = useMemo(() => {
    if (!responses.length) return 0;
    return responses.reduce((sum, r) => sum + clamp(r.score || 0), 0) / responses.length;
  }, [responses]);

  const chartConfig = useMemo(
    () => ({
      score: { label: "Avg Score", color: "#10b981" },
      count: { label: "Responses", color: "#14b8a6" },
    }),
    [],
  );

  const dayData = useMemo(() => groupByDay(responses), [responses]);
  const weekData = useMemo(() => groupByWeek(responses), [responses]);
  const monthData = useMemo(() => groupByMonth(responses), [responses]);
  const distData = useMemo(() => distribution(responses), [responses]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Loading Survey Results</h2>
              <p className="text-gray-500">Please wait while we fetch the data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!survey) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Survey Not Found</h2>
              <p className="text-gray-500">The survey you're looking for doesn't exist or has been removed.</p>
            </div>
            <Button 
              onClick={() => navigate("/pulse-surveys/results")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                    {survey.title}
                  </h1>
                </div>
                <p className="text-gray-600 text-lg mb-4 leading-relaxed">{survey.message}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{responses.length} responses</span>
                  </div>
                  {survey.allowAnonymous && (
                    <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">
                      Anonymous allowed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/pulse-surveys/results")}
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-500 font-medium">Average Score</span>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {formatScore(avg)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Happiness Index</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
                  <p className="text-sm text-gray-500">Total Responses</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatScore(avg)}</p>
                  <p className="text-sm text-gray-500">Average Score</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Star className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {responses.filter(r => r.score >= 7).length}
                  </p>
                  <p className="text-sm text-gray-500">Happy Responses</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {responses.filter(r => r.comment).length}
                  </p>
                  <p className="text-sm text-gray-500">With Comments</p>
                </div>
              </div>
            </div>
          </div>

        {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5" />
                  Score Trend
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Average score over time analysis
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
                    { key: "day", data: dayData },
                    { key: "week", data: weekData },
                    { key: "month", data: monthData },
                  ].map(({ key, data }) => (
                    <TabsContent value={key} key={key}>
                      <ChartContainer config={chartConfig} className="h-[320px] w-full">
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

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-5 w-5" />
                  Score Distribution
                </CardTitle>
                <CardDescription className="text-teal-100">
                  How many employees chose each score range
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart data={distData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#6b7280" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

        {/* Responses Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-5 w-5" />
                Individual Responses
              </CardTitle>
              <CardDescription className="text-emerald-100">
                {responses.length ? `Showing ${responses.length} responses (latest first)` : "No responses yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {responses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Responses Yet</h3>
                    <p className="text-gray-500">Employees haven't responded to this survey yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses
                    .slice()
                    .sort((a, b) => String(b.respondedAt).localeCompare(String(a.respondedAt)))
                    .map((r, index) => (
                      <Card 
                        key={r.id} 
                        className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          index % 2 === 0 ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gradient-to-r from-teal-50 to-cyan-50'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  <User className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-900 truncate">
                                    {r.isAnonymous || survey.allowAnonymous
                                      ? "Anonymous Employee"
                                      : r.employee?.name || anonymizeUser(r.employeeId)}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Responded {new Date(r.respondedAt).toLocaleString()}</span>
                                    {r.updatedAt && (
                                      <>
                                        <span>•</span>
                                        <span>Updated {new Date(r.updatedAt).toLocaleString()}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {r.comment ? (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-700">Comment</span>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {r.comment}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <p className="text-gray-500 italic">No comment provided</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-3 min-w-fit">
                              <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="h-4 w-4 text-emerald-600" />
                                  <span className="text-xs text-gray-500 font-medium">Score</span>
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  {clamp(r.score || 0)}/10
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {r.label || "Response recorded"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PulseSurveyResultsDetail;

