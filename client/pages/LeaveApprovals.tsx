import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { useRole } from "@/context/RoleContext";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  Clock,
  UserCheck,
} from "lucide-react";
import NotificationTriggerService from "@/services/notificationTriggerService";
import ENDPOINTS from "@/lib/endpoint";

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  halfDaySession?: "first_half" | "second_half" | null;
  reason: string;
  attachment?: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerName?: string;
  createdAt: string;
}

const getLeaveDurationLabel = (days: number, halfDaySession?: string | null) => {
  if (Number(days) === 0.5) {
    return halfDaySession === "second_half"
      ? "0.5 (Second Half)"
      : "0.5 (First Half)";
  }
  return `${days}`;
};

const getLeaveApplications = async (): Promise<{
  data?: LeaveApplication[];
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getleaveapplications();

    console.log("Leave Applications Response:", response);

    let rawData: any[] = [];
    if (response.data?.success && Array.isArray(response.data?.applications)) {
      rawData = response.data.applications;
    } else if (Array.isArray(response.data)) {
      rawData = response.data;
    } else if (
      response.data?.leaveApplications &&
      Array.isArray(response.data.leaveApplications)
    ) {
      rawData = response.data.leaveApplications;
    } else {
      return { error: "No leave applications found in response" };
    }

    const mapped: LeaveApplication[] = rawData.map((la: any) => {
      const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch {
          return dateString;
        }
      };

      return {
        id: la.id?.toString() || la._id?.toString() || "",
        employeeId:
          la.employee_id?.toString() || la.employeeId?.toString() || "",
        employeeName: la.employee_name || la.employeeName || "Unknown Employee",
        leaveType:
          la.leave_type_name ||
          la.leave_type ||
          la.leaveType ||
          "Unknown Leave Type",
        fromDate: formatDate(la.from_date || la.fromDate),
        toDate: formatDate(la.to_date || la.toDate),
        days: Number(la.days || la.number_of_days || 0),
        halfDaySession: la.half_day_session || la.halfDaySession || null,
        reason: la.reason || "No reason provided",
        attachment: la.attachment || la.document || "",
        status: la.status === "pending" ? "applied" : la.status || "applied",
        reportingManagerName:
          la.reporting_manager_name || la.reportingManagerName,
        createdAt: la.created_at || la.createdAt || new Date().toISOString(),
      };
    });

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching leave applications:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load leave applications",
    };
  }
};

const updateLeaveApplicationStatus = async (
  id: string,
  status: "approved" | "rejected",
  comments?: string,
): Promise<{ success?: boolean; error?: string }> => {
  try {
    const response = await ENDPOINTS.updatestatusLeaveApplication(id, {
      status,
      comments,
    });

    console.log("Update Leave Status Response:", response);

    if (response.data?.message || response.data?.success) {
      return { success: true };
    }
    return {
      error: response.data?.message || "Failed to update leave application status",
    };
  } catch (error: any) {
    console.error("Error updating leave application status:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to update leave application status",
    };
  }
};

export default function LeaveApprovals() {
  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    "approved" | "rejected" | null
  >(null);

  useEffect(() => {
    const fetchLeaveApplications = async () => {
      try {
        setLoading(true);
        const result = await getLeaveApplications();
        if (result.data) {
          setLeaveApplications(result.data);
        } else if (result.error) {
          console.error("Error loading leave applications:", result.error);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveApplications();
  }, []);

  const canApprove =
    canPerformModuleAction("leave", "approve", "approvals") ||
    canPerformModuleAction("leave", "reject", "approvals") ||
    canPerformModuleAction("leave", "update", "approvals");

  const filterByViewer = (applications: LeaveApplication[]) => {
    if (hasRole(user, "manager") && !hasRole(user, "hr")) {
      return applications.filter((la) => la.reportingManagerName === user?.name);
    }
    return applications;
  };

  const pendingApplications = useMemo(
    () => filterByViewer(leaveApplications.filter((la) => la.status === "applied")),
    [leaveApplications, user],
  );

  const approvedApplications = useMemo(
    () =>
      filterByViewer(leaveApplications.filter((la) => la.status === "approved")),
    [leaveApplications, user],
  );

  const rejectedApplications = useMemo(
    () =>
      filterByViewer(leaveApplications.filter((la) => la.status === "rejected")),
    [leaveApplications, user],
  );

  const handleApproveReject = async (id: string, approved: boolean) => {
    setProcessingId(id);
    setProcessingAction(approved ? "approved" : "rejected");
    const application = leaveApplications.find((la) => la.id === id);

    setLeaveApplications((prev) =>
      prev.map((la) =>
        la.id === id ? { ...la, status: approved ? "approved" : "rejected" } : la,
      ),
    );

    const status = approved ? "approved" : "rejected";
    const result = await updateLeaveApplicationStatus(id, status);

    if (result.error) {
      console.error("Failed to update leave application status:", result.error);
      setLeaveApplications((prev) =>
        prev.map((la) => (la.id === id ? { ...la, status: "applied" } : la)),
      );
      setProcessingId(null);
      setProcessingAction(null);
      return;
    }

    if (application) {
      const notificationService = NotificationTriggerService.getInstance();
      if (approved) {
        await notificationService.triggerLeaveApproved({
          employeeId: application.employeeId,
          employeeName: application.employeeName,
          managerId: user?.id,
          managerName: user?.name,
          leaveType: application.leaveType,
          fromDate: application.fromDate,
          toDate: application.toDate,
          days: application.days,
          reason: application.reason,
        });
      } else {
        await notificationService.triggerLeaveRejected({
          employeeId: application.employeeId,
          employeeName: application.employeeName,
          managerId: user?.id,
          managerName: user?.name,
          leaveType: application.leaveType,
          fromDate: application.fromDate,
          toDate: application.toDate,
          days: application.days,
          reason: application.reason,
        });
      }
    }

    setProcessingId(null);
    setProcessingAction(null);
  };

  const summaryCards = [
    {
      label: "Pending",
      value: pendingApplications.length,
      icon: <Clock className="h-5 w-5" />,
      cardClass: "border-amber-100 bg-amber-50/60",
      iconClass: "bg-amber-100 text-amber-700",
      valueClass: "text-amber-700",
    },
    {
      label: "Approved",
      value: approvedApplications.length,
      icon: <CheckCircle className="h-5 w-5" />,
      cardClass: "border-emerald-100 bg-emerald-50/60",
      iconClass: "bg-emerald-100 text-emerald-700",
      valueClass: "text-emerald-700",
    },
    {
      label: "Rejected",
      value: rejectedApplications.length,
      icon: <XCircle className="h-5 w-5" />,
      cardClass: "border-red-100 bg-red-50/60",
      iconClass: "bg-red-100 text-red-700",
      valueClass: "text-red-700",
    },
  ];

  const renderHistoryCard = (
    la: LeaveApplication,
    status: "approved" | "rejected",
  ) => {
    const isApproved = status === "approved";
    return (
      <Card
        key={la.id}
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
          isApproved ? "border-emerald-100" : "border-red-100"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isApproved
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {isApproved ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">
                  {la.employeeName}
                </p>
                <p className="text-sm text-slate-500">
                  {la.leaveType} | {la.fromDate} to {la.toDate}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {getLeaveDurationLabel(la.days, la.halfDaySession)} day(s)
                </p>
              </div>
            </div>
            <Badge
              className={
                isApproved
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }
            >
              {isApproved ? "Approved" : "Rejected"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-[1200px] space-y-6">
          <PageHeader />
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              Loading leave applications...
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!canApprove) {
    return (
      <Layout>
        <div className="mx-auto max-w-[1200px] space-y-6">
          <PageHeader />
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              You don't have permission to access this page based on current role permissions.
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <PageHeader />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className={`overflow-hidden rounded-2xl shadow-sm ${card.cardClass}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {card.label}
                    </p>
                    <p className={`mt-2 text-4xl font-black ${card.valueClass}`}>
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClass}`}
                  >
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <CardHeader className="border-b border-amber-100 bg-amber-50/70 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Clock className="h-5 w-5 text-amber-700" />
              Pending Approvals ({pendingApplications.length})
            </CardTitle>
            <CardDescription>Requests waiting for approval or rejection</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {pendingApplications.length === 0 ? (
              <EmptyState tone="amber" text="No pending leave applications" />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {pendingApplications.map((la) => (
                  <Card
                    key={la.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#17c491]">
                              <UserCheck className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <Label className="text-xs font-semibold text-slate-500">
                                Employee
                              </Label>
                              <p className="truncate text-lg font-bold text-slate-900">
                                {la.employeeName}
                              </p>
                              {la.reportingManagerName && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Manager: {la.reportingManagerName}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className="w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Pending
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <InfoTile label="Leave Type" value={la.leaveType} />
                          <InfoTile label="From Date" value={la.fromDate} />
                          <InfoTile label="To Date" value={la.toDate} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr]">
                          <div className="rounded-xl bg-emerald-50 p-3">
                            <Label className="text-xs font-semibold text-emerald-700">
                              Number of Days
                            </Label>
                            <p className="mt-1 text-xl font-black text-[#0d8f6b]">
                              {getLeaveDurationLabel(la.days, la.halfDaySession)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <Label className="text-xs font-semibold text-slate-500">
                              Reason
                            </Label>
                            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">
                              {la.reason}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                          <Button
                            onClick={() => handleApproveReject(la.id, true)}
                            className="h-11 gap-2 rounded-xl bg-green-600 font-bold hover:bg-green-700"
                            disabled={processingId === la.id}
                          >
                            {processingId === la.id &&
                            processingAction === "approved" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleApproveReject(la.id, false)}
                            variant="destructive"
                            className="h-11 gap-2 rounded-xl font-bold"
                            disabled={processingId === la.id}
                          >
                            {processingId === la.id &&
                            processingAction === "rejected" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Reject
                              </>
                            )}
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <CardHeader className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <CheckCircle className="h-5 w-5 text-emerald-700" />
                Approved ({approvedApplications.length})
              </CardTitle>
              <CardDescription>Approved leave requests</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {approvedApplications.length > 0 ? (
                <div className="space-y-3">
                  {approvedApplications.map((la) =>
                    renderHistoryCard(la, "approved"),
                  )}
                </div>
              ) : (
                <EmptyState tone="emerald" text="No approved applications" />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
            <CardHeader className="border-b border-red-100 bg-red-50/70 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <XCircle className="h-5 w-5 text-red-700" />
                Rejected ({rejectedApplications.length})
              </CardTitle>
              <CardDescription>Rejected leave requests</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {rejectedApplications.length > 0 ? (
                <div className="space-y-3">
                  {rejectedApplications.map((la) =>
                    renderHistoryCard(la, "rejected"),
                  )}
                </div>
              ) : (
                <EmptyState tone="red" text="No rejected applications" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

const PageHeader = () => (
  <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#17c491] to-[#0f9f78] p-6 text-white shadow-lg">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
        <Calendar className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">Leave Approvals</h1>
        <p className="mt-1 text-sm text-white/85">
          Review pending requests and track approved or rejected leaves
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ tone, text }: { tone: string; text: string }) => (
  <div
    className={`rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500 ${
      tone === "red"
        ? "border-red-200 bg-red-50/40"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-amber-200 bg-amber-50/40"
    }`}
  >
    {text}
  </div>
);

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <Label className="text-xs font-semibold text-slate-500">{label}</Label>
    <p className="mt-1 font-bold text-slate-900">{value}</p>
  </div>
);
