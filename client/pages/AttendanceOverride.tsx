import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, AlertTriangle, Clock, User, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import attendanceApi from "@/components/helper/attendance/attendance"; // உங்க path correct ஆ இருக்கணும்

interface OverrideRecord {
  requested_by: ReactNode;
  updated_at: string | number | Date;
  created_at: string | number | Date;
  id: string;
  recordId: string; // attendance record ID
  employeeId: string;
  employeeName: string;
  originalStatus: "present" | "absent" | "half";
  overriddenStatus: "present" | "absent" | "half";
  reason: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  auditTrail: {
    action: string;
    timestamp: string;
    userId: string;
  }[];
}

export default function AttendanceOverride() {
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingOverride, setIsCreatingOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    recordId: "", // attendance record ID (from calendar modal)
    date: "",     // YYYY-MM-DD
    reason: "",
    requestedCheckIn: "",
    requestedCheckOut: "",
  });

  // Fetch override history from backend
const fetchOverrides = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await attendanceApi.getOverrides();

    if (result.data) {
      // Backend response-ல data array இருக்கு → அதை extract பண்ணுங்க
      const overrideList = Array.isArray(result.data) 
        ? result.data 
        : result.data.data || result.data.overrides || [];

      setOverrides(overrideList);
    } else {
      setOverrides([]);
      if (result.error) {
        toast.error(result.error);
      }
    }
  } catch (err) {
    console.error("Fetch overrides error:", err);
    setError("Failed to load override history");
    toast.error("Server error");
    setOverrides([]); // error-லயும் array ஆக set பண்ணுங்க
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchOverrides();
}, []);


const handleCreateOverride = async () => {
  if (!overrideForm.recordId.trim() || !overrideForm.reason.trim()) {
    toast.error("Attendance Record ID and Reason are required");
    return;
  }

  try {
    const result = await attendanceApi.createOverride({
      attendanceId: overrideForm.recordId,
      reason: overrideForm.reason,
      requestedCheckIn: overrideForm.requestedCheckIn || undefined,
      requestedCheckOut: overrideForm.requestedCheckOut || undefined,
      date: overrideForm.date || undefined,
      // optional fields
      originalStatus: "absent",      // or fetch from current record
      overriddenStatus: "present",
    });

    if (result.success || result.data) {
      toast.success("Override request created successfully!");
      setIsCreatingOverride(false);
      setOverrideForm({
        recordId: "",
        date: "",
        requestedCheckIn: "",
        requestedCheckOut: "",
        reason: "",
      });
    } else {
      toast.error(result.error || "Failed to create override");
    }
  } catch (err) {
    toast.error("Network error. Please try again.");
  }
};
 const filteredOverrides = useMemo(() => {
  // Safety first
  if (!overrides || !Array.isArray(overrides)) {
    return [];
  }

  if (!searchTerm.trim()) {
    return overrides;
  }

  const lowerSearch = searchTerm.toLowerCase().trim();

  return overrides.filter((override) => {
    if (!override) return false;

    return (
      (override.employeeName || "").toLowerCase().includes(lowerSearch) ||
      (override.employeeId || "").toLowerCase().includes(lowerSearch) ||
      (override.recordId || "").toLowerCase().includes(lowerSearch) ||
      (override.reason || "").toLowerCase().includes(lowerSearch)
    );
  });
}, [overrides, searchTerm]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Attendance Override
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Manage attendance adjustments with audit trail
          </p>
        </div>

        {/* Hard Rule Alert */}
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 p-3 sm:p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <AlertDescription className="text-amber-900 dark:text-amber-200 text-xs sm:text-sm ml-2">
            <strong>Hard Rule:</strong> All attendance changes must go through the override process with reason and approval.
          </AlertDescription>
        </Alert>

        {/* Create Override Button */}
        <div className="flex justify-end">
          <Dialog open={isCreatingOverride} onOpenChange={setIsCreatingOverride}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Clock className="w-4 h-4" />
                New Override Request
              </Button>
            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create Attendance Override</DialogTitle>
                  <DialogDescription>
                    All overrides are logged with audit trail
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                  {/* Attendance Record ID - Required */}
                  <div className="space-y-2">
                    <Label htmlFor="attendanceId">
                      Attendance Record ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="attendanceId"
                      placeholder="e.g., ATT003"
                      value={overrideForm.attendanceId}
                      onChange={(e) =>
                        setOverrideForm((prev) => ({
                          ...prev,
                          attendanceId: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Employee ID - Optional (but good to have) */}
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      placeholder="e.g., EMP003"
                      value={overrideForm.employeeId}
                      onChange={(e) =>
                        setOverrideForm((prev) => ({
                          ...prev,
                          employeeId: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* From Status & To Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Status</Label>
                      <Select
                        value={overrideForm.originalStatus}
                        onValueChange={(value) =>
                          setOverrideForm((prev) => ({
                            ...prev,
                            originalStatus: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="half">Half Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>To Status</Label>
                      <Select
                        value={overrideForm.overriddenStatus}
                        onValueChange={(value) =>
                          setOverrideForm((prev) => ({
                            ...prev,
                            overriddenStatus: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="half">Half Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Reason - Required */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Reason for Override <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide detailed reason for this override"
                      className="min-h-32"
                      value={overrideForm.reason}
                      onChange={(e) =>
                        setOverrideForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: Doctor appointment with verified medical certificate
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingOverride(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOverride}>
                      Create & Submit
                    </Button>
                  </div>
                </div>
              </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading override history...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchOverrides} variant="outline" className="mt-4">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOverrides.length === 0 && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No override records found</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Override History Table */}
        {!loading && !error && filteredOverrides.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Override History</CardTitle>
                  <CardDescription>
                    All attendance override requests ({filteredOverrides.length})
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search overrides..."
                    className="pl-10 w-full sm:w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status Change</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
<TableBody>
  {filteredOverrides.length === 0 ? (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
        No override records found
      </TableCell>
    </TableRow>
  ) : (
    filteredOverrides.map((override) => (
      <TableRow key={override.id}>
        {/* ID */}
        <TableCell className="font-mono text-sm">
          OVR{String(override.id).padStart(3, "0")}
        </TableCell>

        {/* Employee */}
        <TableCell>
          <div>
            {/* <p className="font-medium">Unknown Employee</p> employee_name இல்லை → backend-ல join பண்ணி அனுப்புங்க அல்லது fallback */}
            <p className="text-xs text-muted-foreground">
              {String(override.employee_id).padStart(3, "0")}
            </p>
          </div>
        </TableCell>

        {/* Date */}
        <TableCell>
          {override.created_at 
            ? new Date(override.created_at).toLocaleDateString("en-IN")
            : "-"}
        </TableCell>

        {/* Status Change */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {override.original_status.toUpperCase()}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="default">
              {override.overridden_status.toUpperCase()}
            </Badge>
          </div>
        </TableCell>

        {/* Reason */}
        <TableCell className="max-w-xs">
          <p className="truncate">{override.reason || "-"}</p>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge 
            variant={
              override.status === "approved" ? "default" :
              override.status === "rejected" ? "destructive" :
              "secondary"
            }
          >
            {override.status.toUpperCase()}
          </Badge>
        </TableCell>

        {/* Submitted */}
        <TableCell className="text-sm">
          {override.created_at 
            ? new Date(override.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </TableCell>

        {/* Actions - Audit Trail */}
        <TableCell className="text-right">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <FileText className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Audit Trail - OVR{String(override.id).padStart(3, "0")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{String(override.employee_id).padStart(3, "0")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance ID</p>
                    <p className="font-medium">{override.attendance_id}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Reason</p>
                  <p className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {override.reason}
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-4">Audit Trail</p>
                  <div className="space-y-3">
                    <div className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">Override Created</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Requested by User ID: {override.requested_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(override.created_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {override.approvedBy && (
                      <div className="flex gap-4 p-4 border rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-green-600">Approved</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Approved by User ID: {override.approvedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(override.updated_at).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}