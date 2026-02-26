import React, { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";
import { BarChart3, MessageSquare, Calendar, Users, TrendingUp, Eye, Star } from "lucide-react";

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0/10";
  if (Number.isNaN(value)) return "0/10";
  return `${Math.max(0, Math.min(10, value)).toFixed(1)}/10`;
};

const PulseSurveyResultsList: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<
    Array<{
      id: number;
      title: string;
      message: string;
      allowAnonymous: boolean;
      createdAt: string;
      responseCount: number;
      avgScore: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await ENDPOINTS.getPulseAdminSurveys();
        if (cancelled) return;
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: "Failed",
          description:
            e?.response?.data?.message || e?.message || "Failed to load surveys",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
                Survey Results Dashboard
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive analytics and insights from employee pulse surveys
            </p>
          </div>

          {/* Stats Cards */}
          {!loading && rows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
                    <p className="text-sm text-gray-500">Total Surveys</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {rows.reduce((sum, row) => sum + row.responseCount, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Responses</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatScore(
                        rows.reduce((sum, row) => sum + row.avgScore, 0) / rows.length
                      )}
                    </p>
                    <p className="text-sm text-gray-500">Overall Average</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {rows.filter(row => row.avgScore >= 7).length}
                    </p>
                    <p className="text-sm text-gray-500">Happy Surveys</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-5 w-5" />
                All Surveys Analytics
              </CardTitle>
              <CardDescription className="text-emerald-100">
                {loading
                  ? "Loading survey data..."
                  : rows.length
                    ? `Showing ${rows.length} survey(s) - Click to view detailed analytics`
                    : "No surveys available yet"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  <p className="text-gray-500">Loading survey analytics...</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Surveys Available</h3>
                    <p className="text-gray-500">Create and publish surveys to see analytics here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {rows.map((row, index) => (
                    <Card 
                      key={row.id} 
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                        index % 2 === 0 
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50' 
                          : 'bg-gradient-to-r from-teal-50 to-cyan-50'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          {/* Survey Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <MessageSquare className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 truncate">{row.title}</h3>
                                <p className="text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                                  {row.message}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{row.responseCount} responses</span>
                              </div>
                              {row.allowAnonymous && (
                                <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">
                                  Anonymous allowed
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Score & Action */}
                          <div className="flex flex-col items-end gap-4 min-w-fit">
                            <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs text-gray-500 font-medium">Avg Score</span>
                              </div>
                              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {formatScore(row.avgScore)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Happiness Index</div>
                            </div>

                            <Button
                              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                              onClick={() => navigate(`/pulse-surveys/results/${row.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Analytics
                            </Button>
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

export default PulseSurveyResultsList;
