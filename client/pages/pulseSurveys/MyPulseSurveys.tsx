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
import { CheckCircle2, Clock, MessageSquare, TrendingUp, Calendar, User } from "lucide-react";

type StoredSurvey = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  allowAnonymous?: boolean;
  myResponse?: {
    score: number;
    label: string;
    comment: string;
    isAnonymous: boolean;
    respondedAt: string;
  } | null;
};

const MyPulseSurveys: React.FC = () => {
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState<StoredSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await ENDPOINTS.getMyPulseSurveys();
        if (cancelled) return;
        setSurveys(Array.isArray(res.data) ? res.data : []);
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
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Your Surveys
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {surveys.length === 0 && !loading 
                ? "No surveys available at the moment. Check back later!" 
                : loading 
                ? "Loading your surveys..." 
                : `You have ${surveys.filter(s => !s.myResponse).length} pending survey(s) to complete`}
            </p>
          </div>

          {/* Stats Cards */}
          {!loading && surveys.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
                    <p className="text-sm text-gray-500">Total Surveys</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {surveys.filter(s => s.myResponse).length}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {surveys.filter(s => !s.myResponse).length}
                    </p>
                    <p className="text-sm text-gray-500">Pending</p>
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
                Survey Responses
              </CardTitle>
              <CardDescription className="text-emerald-100">
                {loading ? "Loading your surveys..." : surveys.length ? "Manage your survey responses" : "No surveys available"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  <p className="text-gray-500">Loading your surveys...</p>
                </div>
              ) : surveys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Surveys Available</h3>
                    <p className="text-gray-500">Check back later for new surveys to complete</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveys.map((s, index) => {
                    const response = s.myResponse || null;
                    const completed = Boolean(response?.respondedAt);

                    return (
                      <Card 
                        key={s.id} 
                        className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          completed ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gradient-to-r from-emerald-50 to-cyan-50'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Survey Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${
                                  completed ? 'bg-emerald-200' : 'bg-teal-200'
                                }`}>
                                  {completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-teal-700" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-900 truncate">{s.title}</h3>
                                  <Badge
                                    variant={completed ? "secondary" : "outline"}
                                    className={`mt-2 ${
                                      completed
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                                        : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0"
                                    }`}
                                  >
                                    {completed ? "✓ Completed" : "⏳ Pending"}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                {s.message}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                                </div>
                                {response && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>Responded: {new Date(response.respondedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {s.allowAnonymous && (
                                  <Badge variant="outline" className="text-xs">
                                    Anonymous
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Response Info & Action */}
                            <div className="flex flex-col items-end gap-4 min-w-fit">
                              {response && (
                                <div className="text-center bg-white rounded-xl p-4 shadow-sm border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs text-gray-500 font-medium">Your Score</span>
                                  </div>
                                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    {response.score}/10
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {response.label || "Response recorded"}
                                  </div>
                                </div>
                              )}

                              <Button
                                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                                  completed
                                    ? "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                } text-white border-0`}
                                onClick={() =>
                                  navigate(`/pulse-surveys/respond/${s.id}`)
                                }
                              >
                                {response ? "✏️ Edit Response" : "📝 Respond Now"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MyPulseSurveys;
