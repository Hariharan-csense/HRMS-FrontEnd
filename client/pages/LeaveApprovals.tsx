import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar } from "lucide-react";
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
  reason: string;
  attachment?: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerName?: string;
  createdAt: string;
}

const getLeaveApplications = async (): Promise<{ data?: LeaveApplication[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getleaveapplications(); // /leave/applications
    
    console.log("Leave Applications Response:", response);
    
    let rawData: any[] = [];

    // Case 1: Wrapped response { success: true, applications: [...] }
    if (response.data?.success && Array.isArray(response.data?.applications)) {
      rawData = response.data.applications;
    }
    // Case 2: Direct array response
    else if (Array.isArray(response.data)) {
      rawData = response.data;
    }
    // Case 3: Wrapped response with leaveApplications field
    else if (response.data?.leaveApplications && Array.isArray(response.data.leaveApplications)) {
      rawData = response.data.leaveApplications;
    }
    // No valid data
    else {
      return { error: "No leave applications found in response" };
    }

    const mapped: LeaveApplication[] = rawData.map((la: any) => {
      // Format date to show only YYYY-MM-DD
      const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
          return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
          return dateString;
        }
      };

      return {
        id: la.id?.toString() || la._id?.toString() || "",
        employeeId: la.employee_id?.toString() || la.employeeId?.toString() || "",
        employeeName: la.employee_name || la.employeeName || "Unknown Employee",
        leaveType: la.leave_type_name || la.leave_type || la.leaveType || "Unknown Leave Type",
        fromDate: formatDate(la.from_date || la.fromDate),
        toDate: formatDate(la.to_date || la.toDate),
        days: Number(la.days || la.number_of_days || 0),
        reason: la.reason || "No reason provided",
        attachment: la.attachment || la.document || "",
        status: la.status === "pending" ? "applied" : la.status || "applied",
        reportingManagerId: la.reporting_manager_id?.toString() || la.reportingManagerId?.toString(),
        reportingManagerName: la.reporting_manager_name || la.reportingManagerName,
        reportingManagerEmail: la.reporting_manager_email || la.reportingManagerEmail,
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

// Helper function to update leave application status
const updateLeaveApplicationStatus = async (id: string, status: "approved" | "rejected", comments?: string): Promise<{ success?: boolean; error?: string }> => {
  try {
    const response = await ENDPOINTS.updatestatusLeaveApplication(id, { status, comments });
    
    console.log("Update Leave Status Response:", response);
    
    // Handle different response formats
    if (response.data?.message || response.data?.success) {
      return { success: true };
    } else {
      return { error: response.data?.message || "Failed to update leave application status" };
    }
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
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Update status in backend
    const status = approved ? "approved" : "rejected";
    const result = await updateLeaveApplicationStatus(id, status);
    
    if (result.error) {
      console.error("Failed to update leave application status:", result.error);
      // Revert local state if backend update fails
      setLeaveApplications((prev) =>
        prev.map((la) => (la.id === id ? { ...la, status: "applied" } : la))
      );
      return;
    }

    // Trigger notification if application found and backend update succeeded
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

  if (loading) {
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
