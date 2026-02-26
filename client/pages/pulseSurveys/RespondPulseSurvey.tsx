import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import ENDPOINTS from "@/lib/endpoint";
import { ArrowLeft, MessageSquare, Send, User, CheckCircle, Star } from "lucide-react";

type ApiSurvey = {
  id: number;
  title: string;
  message: string;
  allowAnonymous: boolean;
  myResponse?: {
    score: number;
    label: string;
    comment: string;
    isAnonymous: boolean;
    respondedAt: string;
  } | null;
};

const clamp = (value: number) => Math.max(0, Math.min(10, value));

const options = [
  { label: "Very Unhappy", score: 2, emoji: "😞" },
  { label: "Unhappy", score: 4, emoji: "😟" },
  { label: "Neutral", score: 6, emoji: "😐" },
  { label: "Happy", score: 8, emoji: "🙂" },
  { label: "Very Happy", score: 10, emoji: "😄" },
];

const RespondPulseSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<ApiSurvey | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedScore, setSelectedScore] = useState<number | null>(
    null,
  );
  const [selectedLabel, setSelectedLabel] = useState<string>(
    "",
  );
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!surveyId) return;

    (async () => {
      try {
        const res = await ENDPOINTS.getPulseSurvey(surveyId);
        if (cancelled) return;
        const data = res.data as ApiSurvey;
        setSurvey(data);
        setSelectedScore(data?.myResponse?.score ?? null);
        setSelectedLabel(data?.myResponse?.label ?? "");
        setComment(data?.myResponse?.comment ?? "");
        setIsAnonymous(Boolean(data?.myResponse?.isAnonymous));
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: "Failed",
          description:
            e?.response?.data?.message || e?.message || "Failed to load survey",
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

  const selected = useMemo(() => {
    if (selectedScore === null) return null;
    return options.find((o) => o.score === selectedScore) || null;
  }, [selectedScore]);

  const onPick = (label: string, score: number) => {
    setSelectedLabel(label);
    setSelectedScore(score);
  };

  const onSubmit = async () => {
    if (!surveyId) return;

    if (selectedScore === null) {
      toast({
        title: "Select a rating",
        description: "Please choose your happiness rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      toast({
        title: "Submitting...",
      });

      await ENDPOINTS.respondPulseSurvey(surveyId, {
        score: clamp(selectedScore),
        label: selectedLabel || (selected?.label ?? ""),
        comment: comment.trim(),
        isAnonymous,
      });

      toast({
        title: "Saved",
        description: "Your response has been recorded.",
      });

      navigate("/pulse-surveys/my-surveys");
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.message || e?.message || "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Loading Survey</h2>
              <p className="text-gray-500">Please wait while we fetch the survey details...</p>
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
              onClick={() => navigate("/pulse-surveys/my-surveys")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Surveys
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
                Rate Your Happiness
              </h1>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{survey.title}</h2>
              <p className="text-gray-600 leading-relaxed">{survey.message}</p>
            </div>
          </div>

          {/* Main Response Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              {/* Happiness Rating Options */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center text-gray-900">How are you feeling today?</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {options.map((o) => {
                    const active = selectedScore === o.score;
                    return (
                      <button
                        key={o.score}
                        type="button"
                        onClick={() => onPick(o.label, o.score)}
                        className={cn(
                          "group relative rounded-xl border-2 p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg",
                          active 
                            ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg scale-105" 
                            : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                        )}
                      >
                        <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
                          {o.emoji}
                        </div>
                        <div className="font-semibold text-sm text-gray-900 mb-2">{o.label}</div>
                        <div className={cn(
                          "text-lg font-bold",
                          active ? "text-emerald-600" : "text-gray-500"
                        )}>
                          {o.score}/10
                        </div>
                        {active && (
                          <div className="absolute -top-2 -right-2">
                            <div className="bg-emerald-500 text-white rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Rating Display */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-200">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {selected?.emoji ?? "🙂"}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {selected?.label ?? "Select a rating"}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-emerald-600" />
                    <span className="text-lg font-semibold text-emerald-600">
                      Score: {selectedScore ?? 0}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Share your thoughts (optional)
                </h3>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about how you're feeling... What could make your day better? Any suggestions or concerns?"
                  className="min-h-[140px] border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 text-gray-700"
                />
              </div>

              {/* Anonymous Option */}
              {survey.allowAnonymous && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-5 w-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-900">Submit response anonymously</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">
                    Your identity will be hidden when viewing results
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/pulse-surveys/my-surveys")}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={onSubmit} 
                  disabled={submitting || selectedScore === null}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RespondPulseSurvey;
