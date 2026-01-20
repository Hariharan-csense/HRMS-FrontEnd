import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar } from "lucide-react";
import NotificationTriggerService from "@/services/notificationTriggerService";

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  attachment?: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerName?: string;
  createdAt: string;
}

const mockLeaveApplications: LeaveApplication[] = [
  {
    id: "LA001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    leaveType: "Casual Leave",
    fromDate: "2024-04-10",
    toDate: "2024-04-12",
    days: 3,
    reason: "Personal work",
    status: "applied",
    reportingManagerName: "Michael Manager",
    createdAt: "2024-04-01",
  },
  {
    id: "LA002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    leaveType: "Sick Leave",
    fromDate: "2024-04-15",
    toDate: "2024-04-15",
    days: 1,
    reason: "Medical appointment",
    status: "applied",
    reportingManagerName: "Michael Manager",
    createdAt: "2024-04-01",
  },
  {
    id: "LA003",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    leaveType: "Annual Leave",
    fromDate: "2024-05-01",
    toDate: "2024-05-05",
    days: 5,
    reason: "Vacation",
    status: "approved",
    reportingManagerName: "Emma HR",
    createdAt: "2024-04-01",
  },
];

export default function LeaveApprovals() {
  const { user } = useAuth();
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(mockLeaveApplications);

  // Only Manager and HR can approve leaves
  const canApprove = hasRole(user, "manager") || hasRole(user, "hr");

  const pendingApplications = useMemo(() => {
    let filtered = leaveApplications.filter((la) => la.status === "applied");

    // Managers see only their direct reports' applications
    if (hasRole(user, "manager") && !hasRole(user, "hr")) {
      filtered = filtered.filter((la) => la.reportingManagerName === user?.name);
    }
    // HR sees all applications

    return filtered;
  }, [leaveApplications, user]);

  const approvedApplications = useMemo(() => {
    let filtered = leaveApplications.filter((la) => la.status === "approved");

    // Managers see only their direct reports' applications
    if (hasRole(user, "manager") && !hasRole(user, "hr")) {
      filtered = filtered.filter((la) => la.reportingManagerName === user?.name);
    }
    // HR sees all applications

    return filtered;
  }, [leaveApplications, user]);

  const rejectedApplications = useMemo(() => {
    let filtered = leaveApplications.filter((la) => la.status === "rejected");

    // Managers see only their direct reports' applications
    if (hasRole(user, "manager") && !hasRole(user, "hr")) {
      filtered = filtered.filter((la) => la.reportingManagerName === user?.name);
    }
    // HR sees all applications

    return filtered;
  }, [leaveApplications, user]);

  const handleApproveReject = async (id: string, approved: boolean) => {
    const application = leaveApplications.find(la => la.id === id);
    
    // Update local state first for immediate UI feedback
    setLeaveApplications((prev) =>
      prev.map((la) => (la.id === id ? { ...la, status: approved ? "approved" : "rejected" } : la))
    );

    // Trigger notification if application found
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
  };

  if (!canApprove) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" />
              Leave Approvals
            </h1>
            <p className="text-muted-foreground mt-2">Manage leave approval requests</p>
          </div>

          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              You don't have permission to access this page. Only Manager and HR can approve leave requests.
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Leave Approvals
          </h1>
          <p className="text-muted-foreground mt-2">Manage and approve pending leave requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Pending</div>
              <div className="text-3xl font-bold mt-2 text-yellow-600">{pendingApplications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Approved</div>
              <div className="text-3xl font-bold mt-2 text-green-600">{approvedApplications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Rejected</div>
              <div className="text-3xl font-bold mt-2 text-red-600">{rejectedApplications.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Approvals ({pendingApplications.length})</h2>
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending leave applications
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((la) => (
                <Card key={la.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Employee</Label>
                          <p className="font-semibold text-lg">{la.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{la.employeeId}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Leave Type</Label>
                          <p className="font-semibold">{la.leaveType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">From Date</Label>
                          <p className="font-semibold">{la.fromDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">To Date</Label>
                          <p className="font-semibold">{la.toDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Number of Days</Label>
                          <p className="font-semibold text-lg text-primary">{la.days}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">Reason</Label>
                        <p className="text-sm">{la.reason}</p>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleApproveReject(la.id, true)}
                          className="gap-2 flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproveReject(la.id, false)}
                          variant="destructive"
                          className="gap-2 flex-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Approved Applications */}
        {approvedApplications.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Approved ({approvedApplications.length})</h2>
            <div className="space-y-3">
              {approvedApplications.map((la) => (
                <Card key={la.id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{la.employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {la.leaveType} • {la.fromDate} to {la.toDate} ({la.days} days)
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Applications */}
        {rejectedApplications.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Rejected ({rejectedApplications.length})</h2>
            <div className="space-y-3">
              {rejectedApplications.map((la) => (
                <Card key={la.id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{la.employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {la.leaveType} • {la.fromDate} to {la.toDate} ({la.days} days)
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
