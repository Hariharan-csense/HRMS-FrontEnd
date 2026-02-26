import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import ENDPOINTS from "@/lib/endpoint";
import { useAuth } from "@/context/AuthContext";
import { MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

const EmployeeFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("general");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canUse = useMemo(() => user?.type?.toLowerCase() === "employee", [user?.type]);

  const onSubmit = async () => {
    const text = feedback.trim();
    if (!text) {
      toast({
        title: "Feedback required",
        description: "Please type your feedback.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await ENDPOINTS.submitEmployeeFeedback({
        feedback: text,
        category,
        isAnonymous,
      });

      toast({
        title: "Submitted",
        description: isAnonymous
          ? "Your anonymous feedback has been submitted."
          : "Your feedback has been submitted.",
      });
      setFeedback("");
      setIsAnonymous(true);
      setCategory("general");
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canUse) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-5">
              <div className="text-lg font-semibold">Not authorized</div>
              <div className="text-xs opacity-90 mt-1">
                This page is available for employee logins.
              </div>
            </div>
            <CardContent className="text-sm text-muted-foreground p-6">
              Please login as an employee to send feedback.
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        <div className="mx-auto max-w-5xl">
          <Card className="border-0 shadow-lg overflow-hidden rounded-2xl">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold leading-tight">Send Feedback</div>
                  <div className="text-sm opacity-90 mt-1">
                    Help us improve your workplace experience.
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-5">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="workplace">Workplace</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="benefits">Benefits</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Your feedback</Label>
                      <div className="text-xs text-muted-foreground">
                        {feedback.trim().length}/1000
                      </div>
                    </div>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="What’s working well? What should change? Any suggestions?"
                      className="min-h-[240px] rounded-2xl resize-none"
                      maxLength={1000}
                    />
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-4 w-4 mt-0.5" />
                      <span>
                        Tip: Mention the situation, impact, and your suggestion.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-cyan-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">Privacy</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Toggle anonymous to hide your identity from admins.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border bg-white/60 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold">Anonymous</div>
                        <div className="text-xs text-muted-foreground">
                          Admin sees “Anonymous”
                        </div>
                      </div>
                      <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background p-5">
                    <div className="text-sm font-semibold">Before you send</div>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc pl-4">
                      <li>Keep it specific and respectful.</li>
                      <li>Avoid sharing sensitive personal data.</li>
                      <li>Include what outcome you want.</li>
                    </ul>
                  </div>

                  <Button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeFeedback;
