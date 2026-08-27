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
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";
import { TrendingUp, MessageSquare, Calendar, Users, ArrowLeft, Star, User, UserCheck, UserX, Download, Search } from "lucide-react";
import { exportPulseSurveyExcelReport } from "./surveyExcelReport";

type ApiSurvey = {
  id: number;
  title: string;
  message: string;
  allowAnonymous: boolean;
  createdAt: string;
  totalSent: number;
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
  department?: string | null;
  branch?: string | null;
  employee?: { name: string; email: string; gender?: string } | null;
};

type GroupFilter = {
  type: "department" | "branch";
  label: string;
};

const clamp = (value: number) => Math.max(0, Math.min(10, value));

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0/10";
  if (Number.isNaN(value)) return "0/10";
  return `${clamp(value).toFixed(1)}/10`;
};

const anonymizeUser = (employeeId: number) => `Employee #${String(employeeId).padStart(4, "0")}`;

const pulseMoodOptions = [
  { label: "Very Unhappy", score: 1, emoji: "??" },
  { label: "Unhappy", score: 2, emoji: "??" },
  { label: "Low", score: 3, emoji: "??" },
  { label: "Below Neutral", score: 4, emoji: "??" },
  { label: "Slightly Down", score: 5, emoji: "??" },
  { label: "Neutral", score: 6, emoji: "??" },
  { label: "Slightly Up", score: 7, emoji: "??" },
  { label: "Happy", score: 8, emoji: "??" },
  { label: "Very Happy", score: 9, emoji: "??" },
  { label: "Extremely Happy", score: 10, emoji: "??" },
];

const getPulseMood = (response: ApiResponse) =>
  pulseMoodOptions.find(
    (option) =>
      option.label.toLowerCase() === String(response.label || "").toLowerCase() ||
      option.score === Math.round(clamp(Number(response.score || 0))),
  ) || {
    label: response.label || "Response recorded",
    score: clamp(Number(response.score || 0)),
    emoji: "??",
  };

const cleanGroupLabel = (value: string | null | undefined, fallback: string) => {
  const label = String(value || "").trim();
  return label || fallback;
};

const groupByField = (
  responses: ApiResponse[],
  getLabel: (response: ApiResponse) => string,
) => {
  const map = new Map<string, { label: string; sum: number; count: number }>();
  for (const r of responses) {
    const label = getLabel(r);
    const prev = map.get(label) || { label, sum: 0, count: 0 };
    map.set(label, {
      label: prev.label,
      sum: prev.sum + clamp(r.score || 0),
      count: prev.count + 1,
    });
  }
  return [...map.values()]
    .map((v) => ({
      label: v.label,
      score: v.count ? v.sum / v.count : 0,
      responses: v.count,
    }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
};

const groupByDepartment = (responses: ApiResponse[]) =>
  groupByField(responses, (r) => cleanGroupLabel(r.department, "Unassigned Department"));

const groupByBranch = (responses: ApiResponse[]) =>
  groupByField(responses, (r) => cleanGroupLabel(r.branch, "Unassigned Branch"));

const PulseSurveyResultsDetail: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<ApiSurvey | null>(null);
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState<GroupFilter | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState("");

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

  const departmentData = useMemo(() => groupByDepartment(responses), [responses]);
  const branchData = useMemo(() => groupByBranch(responses), [responses]);
  const filteredResponses = useMemo(() => {
    const search = employeeFilter.trim().toLowerCase();

    return responses.filter((r) => {
      if (groupFilter) {
      const label =
        groupFilter.type === "department"
          ? cleanGroupLabel(r.department, "Unassigned Department")
          : cleanGroupLabel(r.branch, "Unassigned Branch");

        if (label !== groupFilter.label) return false;
      }

      if (!search) return true;

      const visibleName =
        r.isAnonymous || survey?.allowAnonymous
          ? anonymizeUser(r.employeeId)
          : r.employee?.name || anonymizeUser(r.employeeId);
      const haystack = [
        visibleName,
        r.employee?.email,
        r.employeeId,
        r.label,
        r.department,
        r.branch,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return haystack.includes(search);
    });
  }, [employeeFilter, groupFilter, responses, survey?.allowAnonymous]);
  const sentCount = Number(survey?.totalSent || 0);
  const responseCount = survey?.responseCount ?? responses.length;
  const pendingCount = Math.max(sentCount - Number(responseCount || 0), 0);

  const exportSurveyExcel = () => {
    if (!survey) return;
    exportPulseSurveyExcelReport({
      survey: { ...survey, avgScore: avg },
      responses,
      departmentData,
      branchData,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
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
        <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
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
      <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header Section */}
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="mb-4 flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-3 shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="min-w-0 truncate bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                    {survey.title}
                  </h1>
                </div>
                <p className="mb-4 break-words text-base leading-relaxed text-gray-600 sm:text-lg">{survey.message}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{sentCount} sent</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <UserCheck className="h-4 w-4" />
                    <span>{Number(responseCount || 0)} responded</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-600">
                    <UserX className="h-4 w-4" />
                    <span>{pendingCount} not responded</span>
                  </div>
                  {survey.allowAnonymous && (
                    <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">
                      Anonymous allowed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid w-full min-w-0 grid-cols-2 gap-3 lg:flex lg:w-auto lg:items-center lg:gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/pulse-surveys/results")}
                  className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 lg:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={exportSurveyExcel}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 lg:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel Report
                </Button>
                <div className="col-span-2 min-w-0 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-center sm:p-6 lg:col-auto">
                  <div className="mb-2 flex items-center justify-center gap-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
                  <p className="text-sm text-gray-500">Total Sent</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Number(responseCount || 0)}</p>
                  <p className="text-sm text-gray-500">Responded</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <UserX className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-sm text-gray-500">Not Responded</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatScore(avg)}</p>
                  <p className="text-sm text-gray-500">Average Score</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-emerald-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span aria-hidden="true">🏢</span>
                Department Score
              </CardTitle>
              <CardDescription className="text-violet-100">
                Click a department card to see anonymous responses from that department
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {departmentData.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {departmentData.map((department, index) => {
                    const active =
                      groupFilter?.type === "department" &&
                      groupFilter.label === department.label;

                    return (
                      <button
                        key={department.label}
                        type="button"
                        onClick={() =>
                          setGroupFilter(active ? null : { type: "department", label: department.label })
                        }
                        className={`text-left rounded-xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                          active
                            ? "border-violet-400 bg-gradient-to-r from-violet-100 to-emerald-100 ring-2 ring-violet-200"
                            : index % 2 === 0
                              ? "border-violet-100 bg-gradient-to-r from-violet-50 to-emerald-50"
                              : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-bold text-gray-900">
                              <span aria-hidden="true">🏢</span>
                              <span className="truncate">{department.label}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {department.responses} response{department.responses === 1 ? "" : "s"}
                            </div>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-violet-700 shadow-sm">
                            {formatScore(department.score)}
                          </div>
                        </div>
                        <Progress
                          value={(clamp(department.score) / 10) * 100}
                          className="mt-4 h-2 bg-white"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No department scores to show.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-sky-500 to-emerald-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span aria-hidden="true">📍</span>
                Branch Score
              </CardTitle>
              <CardDescription className="text-sky-100">
                Click a branch card to see anonymous responses from that branch
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {branchData.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {branchData.map((branch, index) => {
                    const active =
                      groupFilter?.type === "branch" && groupFilter.label === branch.label;

                    return (
                    <button
                      key={branch.label}
                      type="button"
                      onClick={() =>
                        setGroupFilter(active ? null : { type: "branch", label: branch.label })
                      }
                      className={`text-left rounded-xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        active
                          ? "border-sky-400 bg-gradient-to-r from-sky-100 to-emerald-100 ring-2 ring-sky-200"
                          : index % 2 === 0
                            ? "border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50"
                            : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2 font-bold text-gray-900">
                            <span aria-hidden="true">📍</span>
                            <span className="truncate">{branch.label}</span>
                          </div>
                          <div className="font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            {formatScore(branch.score)}
                          </div>
                        </div>
                        <Progress
                          value={(clamp(branch.score) / 10) * 100}
                          className="h-2 bg-gray-200"
                        />
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {branch.responses} response{branch.responses === 1 ? "" : "s"}
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No branch scores to show.</div>
              )}
            </CardContent>
          </Card>

        {/* Responses Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="h-5 w-5" />
                    Individual Responses
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    {filteredResponses.length
                      ? `Showing ${filteredResponses.length} of ${responses.length} responses (latest first)`
                      : responses.length
                        ? "No responses match this filter"
                        : "No responses yet"}
                  </CardDescription>
                  {groupFilter && (
                    <button
                      type="button"
                      onClick={() => setGroupFilter(null)}
                      className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white"
                    >
                      <span aria-hidden="true">
                        {groupFilter.type === "department" ? "??" : "??"}
                      </span>
                      {groupFilter.label}
                      <span aria-hidden="true">�</span>
                    </button>
                  )}
                </div>
                <div className="relative w-full lg:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                  <input
                    type="search"
                    value={employeeFilter}
                    onChange={(event) => setEmployeeFilter(event.target.value)}
                    placeholder="Filter employee..."
                    className="h-10 w-full rounded-lg border border-white/40 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/40"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {responses.length ? "No Responses In This Group" : "No Responses Yet"}
                    </h3>
                    <p className="text-gray-500">
                      {responses.length
                        ? "Choose another department or branch to view its responses."
                        : "Employees haven't responded to this survey yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResponses
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
                                  <h3 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                                    <span className="mr-2 align-middle text-2xl">
                                      {getPulseMood(r).emoji}
                                    </span>
                                    {r.isAnonymous || survey.allowAnonymous
                                      ? "👤 Anonymous Employee"
                                      : r.employee?.name || anonymizeUser(r.employeeId)}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Responded {new Date(r.respondedAt).toLocaleString()}</span>
                                    {r.updatedAt && (
                                      <>
                                        <span>•</span>
                                        <span>Updated {new Date(r.updatedAt).toLocaleString()}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-violet-700 shadow-sm border border-violet-100">
                                      <span aria-hidden="true">🏢</span>
                                      <span>
                                        <span className="text-gray-500">Department:</span>{" "}
                                        {cleanGroupLabel(r.department, "Unassigned Department")}
                                      </span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-sky-700 shadow-sm border border-sky-100">
                                      <span aria-hidden="true">📍</span>
                                      <span>
                                        <span className="text-gray-500">Branch:</span>{" "}
                                        {cleanGroupLabel(r.branch, "Unassigned Branch")}
                                      </span>
                                    </div>
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

                            <div className="flex min-w-0 flex-col items-start gap-3 sm:items-end lg:min-w-fit">
                              <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                                <div className="mb-2 text-5xl leading-none">
                                  {getPulseMood(r).emoji}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="h-4 w-4 text-emerald-600" />
                                  <span className="text-xs text-gray-500 font-medium">Score</span>
                                </div>
                                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  {clamp(r.score || 0)}/10
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

