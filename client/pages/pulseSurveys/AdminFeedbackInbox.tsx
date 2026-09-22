import { notifyDeletionPending } from "@/lib/deletionDrafts";
import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { MessageCircle, User, Users, Calendar, Trash2, CheckCircle, Clock, AlertCircle, XCircle, Loader2, Building2, Download } from "lucide-react";
import { exportEmployeeFeedbackExcelReport } from "./feedbackExcelReport";

type GroupStat = {
  name: string;
  count: number;
};

type FeedbackRow = {
  id: number;
  feedback: string;
  category: string;
  employeeId: number | null;
  employeeName: string | null;
  department: string | null;
  branch: string | null;
  isAnonymous: number | boolean;
  companyId: number;
  status: "submitted" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt?: string | null;
};

const statusColor = (status: FeedbackRow["status"]) => {
  switch (status) {
    case "submitted":
      return "bg-white text-gray-900 border-gray-300 font-medium";
    case "reviewed":
      return "bg-white text-gray-900 border-gray-300 font-medium";
    case "resolved":
      return "bg-white text-gray-900 border-gray-300 font-medium";
    case "dismissed":
      return "bg-white text-gray-900 border-gray-300 font-medium";
    default:
      return "";
  }
};

const getStatusIcon = (status: FeedbackRow["status"]) => {
  switch (status) {
    case "submitted":
      return <MessageCircle className="w-3 h-3" />;
    case "reviewed":
      return <Clock className="w-3 h-3" />;
    case "resolved":
      return <CheckCircle className="w-3 h-3" />;
    case "dismissed":
      return <XCircle className="w-3 h-3" />;
    default:
      return null;
  }
};

const getCategoryColor = (category: string) => {
  const colors = {
    general: "bg-white text-gray-900 border-gray-300",
    hr: "bg-white text-gray-900 border-gray-300",
    it: "bg-white text-gray-900 border-gray-300",
    finance: "bg-white text-gray-900 border-gray-300",
    operations: "bg-white text-gray-900 border-gray-300",
    management: "bg-white text-gray-900 border-gray-300",
  };
  return colors[category?.toLowerCase() as keyof typeof colors] || "bg-white text-gray-900 border-gray-300";
};

const buildGroupStats = (
  rows: FeedbackRow[],
  getValue: (row: FeedbackRow) => string | null | undefined,
  fallback: string,
) => {
  const groups = rows.reduce<Record<string, GroupStat>>((acc, row) => {
    const name = String(getValue(row) || "").trim() || fallback;
    const key = name.toLowerCase();

    if (!acc[key]) {
      acc[key] = { name, count: 0 };
    }

    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(groups).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

const AdminFeedbackInbox: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    const allRoles = [
      ...(Array.isArray(user?.roles) ? user.roles : []),
      user?.role || "",
    ]
      .map((r) => String(r || "").toLowerCase())
      .filter(Boolean);
    return allRoles.includes("admin") || allRoles.includes("ceo");
  },
    [user?.roles, user?.role],
  );

  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showBranchAndDepartment, setShowBranchAndDepartment] = useState(false);
  const departmentStats = useMemo(
    () => buildGroupStats(rows, (row) => row.department, "Unassigned department"),
    [rows],
  );
  const branchStats = useMemo(
    () => buildGroupStats(rows, (row) => row.branch, "Unassigned branch"),
    [rows],
  );

  const fetchRows = async () => {
    const res = await ENDPOINTS.getEmployeeFeedbackAdmin();
    const data = res.data?.feedback;
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchRows();
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Failed",
            description:
              e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to load feedback",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChangeStatus = async (id: number, status: FeedbackRow["status"]) => {
    setUpdatingId(id);
    try {
      await ENDPOINTS.updateEmployeeFeedbackStatus(id, status);
      await fetchRows();
      toast({ title: "Updated", description: "Feedback status updated." });
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const onDelete = async (id: number) => {
    setUpdatingId(id);
    try {
      const deletionResult = await ENDPOINTS.deleteEmployeeFeedback(id);
      if (notifyDeletionPending(deletionResult)) return;
      await fetchRows();
      toast({ title: "Deleted", description: "Feedback removed." });
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to delete feedback",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const exportFeedbackExcel = () => {
    exportEmployeeFeedbackExcelReport({
      rows,
      departmentStats,
      branchStats,
    });
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-red-600">
                This page is available only for admin users.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Feedback Inbox
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage and respond to anonymous employee feedback
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={exportFeedbackExcel}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel Report
                </Button>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">{rows.length}</div>
                  <div className="text-xs text-gray-500">Total Feedback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Submitted", count: rows.filter(r => r.status === "submitted").length, color: "from-emerald-500 to-teal-600", icon: MessageCircle },
              { label: "Reviewed", count: rows.filter(r => r.status === "reviewed").length, color: "from-amber-500 to-yellow-600", icon: Clock },
              { label: "Resolved", count: rows.filter(r => r.status === "resolved").length, color: "from-green-500 to-emerald-600", icon: CheckCircle },
              { label: "Dismissed", count: rows.filter(r => r.status === "dismissed").length, color: "from-slate-500 to-gray-600", icon: XCircle },
            ].map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
                    </div>
                    <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {[
              { label: "Dept Wise", count: departmentStats.length, groups: departmentStats, color: "from-cyan-500 to-teal-600", icon: Users },
              { label: "Branch Wise", count: branchStats.length, groups: branchStats, color: "from-indigo-500 to-cyan-600", icon: Building2 },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
                      <div className="mt-2 space-y-1">
                        {(stat.groups.length ? stat.groups.slice(0, 2) : [{ name: "No feedback", count: 0 }]).map((group) => (
                          <div key={group.name} className="flex items-center justify-between gap-2 text-xs">
                            <span className="min-w-0 truncate text-gray-500">{group.name}</span>
                            <span className="font-semibold text-gray-700">{group.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">All Feedback</CardTitle>
                  <CardDescription className="text-emerald-100 mt-1">
                    {loading ? "Loading feedback..." : `${rows.length} feedback items`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/15 px-3 py-2">
                  <div className="text-right">
                    <div className="text-sm font-semibold leading-none">Show Branch & Dept</div>
                    <div className="mt-1 text-xs text-emerald-100">
                      {showBranchAndDepartment ? "Visible" : "Hidden"}
                    </div>
                  </div>
                  <Switch
                    checked={showBranchAndDepartment}
                    onCheckedChange={setShowBranchAndDepartment}
                    aria-label="Show branch and department"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <p className="text-sm text-gray-500 mt-3">Loading feedback...</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback yet</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    When employees submit feedback, it will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rows.map((r, index) => {
                    const anonymous = Boolean(r.isAnonymous) || !r.employeeName;
                    const branch = r.branch || "Unassigned branch";
                    const department = r.department || "Unassigned department";
                    return (
                      <Card 
                        key={r.id} 
                        className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden"
                      >
                        <CardContent className="p-6 space-y-4">
                          {/* Header */}
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge 
                                  variant="outline" 
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(r.category || "general")}`}
                                >
                                  {r.category || "General"}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColor(r.status)}`}
                                >
                                  {getStatusIcon(r.status)}
                                  {r.status}
                                </Badge>
                                {anonymous && (
                                  <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-gray-900 border-gray-300">
                                    <Users className="w-3 h-3 mr-1 text-gray-700" />
                                    Anonymous
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-900">
                                  {anonymous ? (
                                    <>
                                      <div className="p-1 bg-gray-100 rounded-full">
                                        <Users className="w-3 h-3 text-gray-800" />
                                      </div>
                                      <span className="font-medium">Anonymous Employee</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="p-1 bg-gray-100 rounded-full">
                                        <User className="w-3 h-3 text-gray-800" />
                                      </div>
                                      <span className="font-medium">{r.employeeName}</span>
                                      {showBranchAndDepartment && (
                                        <>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-gray-800">{branch}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-gray-800">{department}</span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              {anonymous && showBranchAndDepartment && (
                                <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 border border-gray-300">
                                  <Building2 className="w-3 h-3 shrink-0 text-gray-700" />
                                  <span>{branch}</span>
                                  <span className="text-gray-400">/</span>
                                  <span>{department}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Select
                                value={r.status}
                                onValueChange={(v) =>
                                  onChangeStatus(r.id, v as FeedbackRow["status"])
                                }
                                disabled={updatingId === r.id}
                              >
                                <SelectTrigger className="w-[140px] h-9 text-sm border-gray-300 text-gray-900 focus:border-gray-500 focus:ring-gray-500">
                                  {updatingId === r.id ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Updating...</span>
                                    </div>
                                  ) : (
                                    <SelectValue placeholder="Status" />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="submitted" className="text-sm">submitted</SelectItem>
                                  <SelectItem value="reviewed" className="text-sm">reviewed</SelectItem>
                                  <SelectItem value="resolved" className="text-sm">resolved</SelectItem>
                                  <SelectItem value="dismissed" className="text-sm">dismissed</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(r.id)}
                                disabled={updatingId === r.id}
                                className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                              >
                                {updatingId === r.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Feedback Content */}
                          <div className="rounded-lg p-4 border border-gray-300 bg-gray-50">
                            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                              {r.feedback}
                            </p>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(r.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                              {r.updatedAt && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-gray-700 font-medium">Updated {new Date(r.updatedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: #{r.id}
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

export default AdminFeedbackInbox;
