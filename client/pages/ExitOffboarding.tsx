import { InlineEdit, saveInline } from "@/components/InlineEdit";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  LogOut,
  FileDown,
  FileText,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  resignationApi,
  Resignation,
} from "@/components/helper/resignation/resignation"; // Adjust path as needed
import { Loader2 } from "lucide-react";
import { checklistApi } from "@/components/helper/checklist/checklist";
import { showToast } from "@/utils/toast";
import type { Employee } from "@/components/helper/employee/employee";

interface OffboardingChecklist {
  id: string;
  employeeId: string;
  employeeName?: string;
  hrClearance: boolean;
  financeClearance: boolean;
  assetReturn: boolean;
  itClearance: boolean;
  finalSettlement: boolean;
  status: "in-progress" | "completed";
  completedDate?: string;
}

// Mock checklist for now (you can create checklistApi later)
const mockChecklists: OffboardingChecklist[] = [
  {
    id: "CHK001",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    hrClearance: true,
    financeClearance: true,
    assetReturn: true,
    itClearance: false,
    finalSettlement: false,
    status: "in-progress",
  },
];

export default function ExitOffboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const [resignations, setResignations] = useState<Resignation[]>([]);
  //const [checklists] = useState<OffboardingChecklist[]>(mockChecklists);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "resignations" | "checklist" | "no-due"
  >("resignations");
  const [selectedEmployeeForNoDue, setSelectedEmployeeForNoDue] =
    useState<OffboardingChecklist | null>(null);
  const [isNoDueDialogOpen, setIsNoDueDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Resignation>>({});
  //const [resignations, setResignations] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<OffboardingChecklist[]>([]);

  useEffect(() => {
    if (location.pathname.startsWith("/exit/checklist")) {
      setActiveTab("checklist");
      return;
    }
    if (location.pathname.startsWith("/exit/no-due")) {
      setActiveTab("no-due");
      return;
    }

    setActiveTab("resignations");
  }, [location.pathname]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return dateString.split("T")[0];
  };

  const fetchChecklists = async () => {
    try {
      setChecklistLoading(true);
      setChecklistError(null);

      const result = await checklistApi.getChecklists();

      if (result.data) {
        setChecklists(result.data);
      } else {
        setChecklistError(result.error || "Failed to load checklists");
      }
    } catch (err: any) {
      console.error("Fetch checklists error:", err);
      setChecklistError("An error occurred while loading checklists");
    } finally {
      setChecklistLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchChecklists();
    // You can also fetch resignations here if needed
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      const result = await resignationApi.getEmployees();

      // console.log("Employees API Result:", result);
      // console.log("Employees array:", result.data);

      if (result.data) {
        setEmployees(result.data);
        // console.log("Employees set:", result.data);
      } else {
        console.error("Employee fetch error:", result.error);
      }
      setEmployeeLoading(false);
    };

    fetchEmployees();
  }, []);

  // Fetch resignations on mount
  useEffect(() => {
    const fetchResignations = async () => {
      setLoading(true);
      setError(null);

      const result = await resignationApi.getResignations();
      // console.log("Fetched Resignations:", result);
      if (result.data) {
        setResignations(result.data);
      } else {
        setError(result.error || "Failed to load resignations");
      }

      setLoading(false);
    };

    fetchResignations();
  }, []);

  const handleOpenDialog = (resignation?: Resignation) => {
    if (resignation) {
      setEditingId(resignation.id);
      setFormData({
        ...resignation,
        status: resignation.status || "pending",
      });
    } else {
      setEditingId(null);
      setFormData({ status: "pending" });
    }
    setIsDialogOpen(true);
  };

  // const handleSave = async () => {
  //   if (!formData.employeeName || !formData.resignationDate || !formData.lastWorkingDay) {
  //     alert("Please fill all required fields");
  //     return;
  //   }

  //   if (editingId) {
  //     // Update existing
  //     const result = await resignationApi.updateResignation(editingId, {
  //       ...formData,
  //       approvalStatus: formData.approvalStatus,
  //     });

  //     if (result.data) {
  //       setResignations((prev) =>
  //         prev.map((r) => (r.id === editingId ? result.data! : r))
  //       );
  //     }
  //   } else {
  //     // Create new
  //     const result = await resignationApi.createResignation({
  //       employeeId: formData.employeeId || "",
  //       employeeName: formData.employeeName,
  //       resignationDate: formData.resignationDate,
  //       lastWorkingDay: formData.lastWorkingDay,
  //       reason: formData.reason,
  //       noticePeriod: formData.noticePeriod,
  //     });

  //     if (result.data) {
  //       setResignations((prev) => [...prev, result.data!]);
  //     }
  //   }

  //   setIsDialogOpen(false);
  //   setFormData({});
  //   setEditingId(null);
  // };

  const handleSave = async () => {
    if (!formData.employeeName?.trim()) {
      showToast.error("Employee Name is required");
      return;
    }
    if (!formData.resignationDate) {
      showToast.error("Resignation Date is required");
      return;
    }
    if (!formData.lastWorkingDate) {
      showToast.error("Last Working Day is required");
      return;
    }

    const payload = {
      employeeId: formData.employeeId,
      employeeName: formData.employeeName.trim(),
      resignationDate: formData.resignationDate,
      lastWorkingDate: formData.lastWorkingDate,
      reason: formData.reason?.trim() || "",
      noticePeriod: formData.noticePeriod,
      status: formData.status || "pending",
    };

    try {
      let result;

      if (editingId) {
        // Update (send only updatable fields)
        result = await resignationApi.updateResignation(editingId, payload);
      } else {
        // Create - send backend expected snake_case fields
        result = await resignationApi.createResignation(payload);
      }

      if (result.data) {
        if (editingId) {
          setResignations((prev) =>
            prev.map((r) => (r.id === editingId ? result.data! : r)),
          );
        } else {
          setResignations((prev) => [...prev, result.data!]);
        }

        setIsDialogOpen(false);
        setFormData({});
        setEditingId(null);

        if (result.data.status === "approved") {
          await fetchChecklists();
          navigate("/exit/checklist");
        }
      } else {
        showToast.error(result.error || "Failed to save resignation");
      }
    } catch (err) {
      console.error(err);
      showToast.error("An error occurred. Please try again.");
    }
  };

  // Toggle individual clearance item and update backend
  const toggleChecklistItem = async (
    checklistId: string,
    field:
      | "hrClearance"
      | "financeClearance"
      | "assetReturn"
      | "itClearance"
      | "finalSettlement",
  ) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    // Map frontend camelCase to backend snake_case
    const fieldMap: Record<typeof field, string> = {
      hrClearance: "hr_clearance",
      financeClearance: "finance_clearance",
      assetReturn: "asset_return",
      itClearance: "it_clearance",
      finalSettlement: "final_settlement",
    };

    const backendField = fieldMap[field];

    // Optimistic UI update
    const newValue = !checklist[field];
    const tempUpdated = {
      ...checklist,
      [field]: newValue,
    };

    const allCompleted =
      tempUpdated.hrClearance &&
      tempUpdated.financeClearance &&
      tempUpdated.assetReturn &&
      tempUpdated.itClearance &&
      tempUpdated.finalSettlement;

    tempUpdated.status = allCompleted ? "completed" : "in-progress";

    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? tempUpdated : c)),
    );

    try {
      // Send ONLY { field: "hr_clearance" } as backend expects
      const result = await checklistApi.updateChecklist(checklistId, {
        field: backendField,
      });

      if (result.error) {
        // Rollback on error
        setChecklists((prev) =>
          prev.map((c) => (c.id === checklistId ? checklist : c)),
        );
        showToast.error(result.error);
        return;
      }

      // Success: update with fresh data from server
      if (result.data) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === checklistId ? result.data! : c)),
        );
      }
    } catch (err) {
      // Rollback
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? checklist : c)),
      );
      showToast.error("Failed to save changes");
    }
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <LogOut className="w-8 h-8 text-primary" />
            Exit & Offboarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage employee resignations and offboarding
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => navigate("/exit/resignations")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "resignations"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Resignations
          </button>
          <button
            onClick={() => navigate("/exit/checklist")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "checklist"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Offboarding Checklist
          </button>
          <button
            onClick={() => navigate("/exit/no-due")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "no-due"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            No Due Form
          </button>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3">Loading resignations...</span>
          </div>
        )}

        {error && !loading && (
          <div className="text-red-600 text-center py-4">{error}</div>
        )}

        {/* Resignations Tab */}
        {activeTab === "resignations" && !loading && !error && (
          <div className="space-y-4">
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Record Resignation
            </Button>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {resignations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No resignations found
                </p>
              ) : (
                resignations.map((res) => (
                  <div
                    key={res.id}
                    className="border border-border rounded-lg p-4 bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-base">
                        {res.employeeName}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getStatusColor(res.status || "pending")}`}
                      >
                        {res.status || "pending"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Resignation Date:
                        </span>
                        <span className="font-medium">
                          {formatDate(res.resignationDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LWD:</span>
                        <span className="font-medium">
                          {formatDate(res.lastWorkingDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reason:</span>
                        <span className="text-xs text-right">
                          <InlineEdit value={res.reason} label="reason" module="exit" submodule="resignations" type="text"    onSave={(value) => saveInline(resignationApi.updateResignation(res.id, { ...res, reason: String(value) }), () => setResignations((rows) => rows.map((row) => row.id === res.id ? { ...row, reason: String(value) } : row)))} />
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <button
                        onClick={() => handleOpenDialog(res)}
                        className="w-full text-teal-600 hover:underline text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[840px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Resignation Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">LWD</th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Reason
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resignations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No resignations found
                      </td>
                    </tr>
                  ) : (
                    resignations.map((res) => (
                      <tr
                        key={res.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {res.employeeName}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(res.resignationDate)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(res.lastWorkingDate)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <InlineEdit value={res.reason} label="reason" module="exit" submodule="resignations" type="text"    onSave={(value) => saveInline(resignationApi.updateResignation(res.id, { ...res, reason: String(value) }), () => setResignations((rows) => rows.map((row) => row.id === res.id ? { ...row, reason: String(value) } : row)))} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getStatusColor(res.status || "pending")}`}
                          >
                            {res.status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenDialog(res)}
                            className="text-teal-600 hover:underline text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Offboarding Checklist Tab */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            {checklistLoading ? (
              <div className="text-center py-10">Loading checklists...</div>
            ) : checklistError ? (
              <div className="text-red-600 text-center py-6">
                {checklistError}
              </div>
            ) : checklists.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No offboarding checklists found
              </div>
            ) : (
              checklists.map((checklist) => (
                <Card key={checklist.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {checklist.employeeName || "Employee"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Checklist ID: {checklist.id}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded font-medium ${
                          checklist.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {checklist.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { key: "hrClearance", label: "HR Clearance" },
                        { key: "financeClearance", label: "Finance Clearance" },
                        { key: "assetReturn", label: "Asset Return" },
                        { key: "itClearance", label: "IT Clearance" },
                        { key: "finalSettlement", label: "Final Settlement" },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted"
                        >
                          <Checkbox
                            checked={
                              checklist[
                                item.key as keyof OffboardingChecklist
                              ] as boolean
                            }
                            onCheckedChange={() =>
                              toggleChecklistItem(
                                checklist.id,
                                item.key as keyof Pick<
                                  OffboardingChecklist,
                                  | "hrClearance"
                                  | "financeClearance"
                                  | "assetReturn"
                                  | "itClearance"
                                  | "finalSettlement"
                                >,
                              )
                            }
                          />
                          <Label className="cursor-pointer flex-1">
                            {item.label}
                          </Label>
                          {checklist[
                            item.key as keyof OffboardingChecklist
                          ] && (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* No Due Form Tab */}
        {activeTab === "no-due" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                No Due Certificate
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Generate and download No Due forms for employees who have
                completed all exit formalities.
              </p>
            </div>

            {checklistLoading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">
                  Loading employee data...
                </p>
              </div>
            ) : checklistError ? (
              <div className="text-red-600 text-center py-6">
                {checklistError}
              </div>
            ) : checklists.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No employee data available for No Due forms
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {checklists.map((checklist) => {
                  const allClearancesCompleted =
                    checklist.hrClearance &&
                    checklist.financeClearance &&
                    checklist.assetReturn &&
                    checklist.itClearance &&
                    checklist.finalSettlement;

                  return (
                    <Card
                      key={checklist.id}
                      className={
                        allClearancesCompleted
                          ? "border-green-300"
                          : "border-yellow-300"
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {checklist.employeeName || "Employee"}
                            </CardTitle>
                          </div>
                          {allClearancesCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              HR Clearance:
                            </span>
                            <span
                              className={
                                checklist.hrClearance
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {checklist.hrClearance
                                ? "✓ Cleared"
                                : "✗ Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Finance:
                            </span>
                            <span
                              className={
                                checklist.financeClearance
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {checklist.financeClearance
                                ? "✓ Cleared"
                                : "✗ Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Assets:
                            </span>
                            <span
                              className={
                                checklist.assetReturn
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {checklist.assetReturn
                                ? "✓ Returned"
                                : "✗ Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              IT Clearance:
                            </span>
                            <span
                              className={
                                checklist.itClearance
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {checklist.itClearance
                                ? "✓ Cleared"
                                : "✗ Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Settlement:
                            </span>
                            <span
                              className={
                                checklist.finalSettlement
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {checklist.finalSettlement
                                ? "✓ Completed"
                                : "✗ Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t">
                          <Button
                            variant={
                              allClearancesCompleted ? "default" : "outline"
                            }
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => {
                              setSelectedEmployeeForNoDue(checklist);
                              setIsNoDueDialogOpen(true);
                            }}
                          >
                            <FileDown className="w-4 h-4" />
                            {allClearancesCompleted
                              ? "Download No Due Form"
                              : "View Status"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No Due Form Dialog */}
        <Dialog open={isNoDueDialogOpen} onOpenChange={setIsNoDueDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                No Due Certificate
              </DialogTitle>
            </DialogHeader>

            {selectedEmployeeForNoDue && (
              <div className="space-y-6">
                {/* No Due Form Preview */}
                <div
                  id="no-due-form"
                  className="border rounded-lg p-6 bg-white"
                >
                  <div className="text-center border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      NO DUE CERTIFICATE
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Exit Clearance Form
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Employee Name
                      </p>
                      <p className="font-semibold text-lg">
                        {selectedEmployeeForNoDue.employeeName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Clearance Status
                      </p>
                      <div className="max-w-full overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Department</th>
                            <th className="text-center py-2">Status</th>
                            <th className="text-right py-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">HR Department</td>
                            <td className="text-center py-2">
                              {selectedEmployeeForNoDue.hrClearance ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Cleared
                                </span>
                              ) : (
                                <span className="text-red-500">✗ Pending</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-muted-foreground">
                              -
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Finance Department</td>
                            <td className="text-center py-2">
                              {selectedEmployeeForNoDue.financeClearance ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Cleared
                                </span>
                              ) : (
                                <span className="text-red-500">✗ Pending</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-muted-foreground">
                              -
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">IT Department</td>
                            <td className="text-center py-2">
                              {selectedEmployeeForNoDue.itClearance ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Cleared
                                </span>
                              ) : (
                                <span className="text-red-500">✗ Pending</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-muted-foreground">
                              -
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Asset Return</td>
                            <td className="text-center py-2">
                              {selectedEmployeeForNoDue.assetReturn ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Returned
                                </span>
                              ) : (
                                <span className="text-red-500">✗ Pending</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-muted-foreground">
                              -
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Final Settlement</td>
                            <td className="text-center py-2">
                              {selectedEmployeeForNoDue.finalSettlement ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Completed
                                </span>
                              ) : (
                                <span className="text-red-500">✗ Pending</span>
                              )}
                            </td>
                            <td className="text-right py-2 text-muted-foreground">
                              -
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm leading-relaxed">
                        This is to certify that{" "}
                        <strong>{selectedEmployeeForNoDue.employeeName}</strong>{" "}
                        has
                        {selectedEmployeeForNoDue.hrClearance &&
                        selectedEmployeeForNoDue.financeClearance &&
                        selectedEmployeeForNoDue.itClearance &&
                        selectedEmployeeForNoDue.assetReturn &&
                        selectedEmployeeForNoDue.finalSettlement
                          ? " cleared all dues and formalities with the organization."
                          : " NOT completed all exit formalities."}
                      </p>

                      {selectedEmployeeForNoDue.hrClearance &&
                        selectedEmployeeForNoDue.financeClearance &&
                        selectedEmployeeForNoDue.itClearance &&
                        selectedEmployeeForNoDue.assetReturn &&
                        selectedEmployeeForNoDue.finalSettlement && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-green-800 font-medium text-center">
                              ✓ NO DUES PENDING - CLEARANCE GRANTED
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-8 pt-8">
                      <div className="text-center">
                        <div className="border-t border-slate-400 pt-2">
                          <p className="text-sm font-medium">HR Manager</p>
                          <p className="text-xs text-muted-foreground">
                            Signature & Date
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t border-slate-400 pt-2">
                          <p className="text-sm font-medium">Finance Head</p>
                          <p className="text-xs text-muted-foreground">
                            Signature & Date
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsNoDueDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      // Generate and download the No Due Form as HTML/PDF
                      const formContent =
                        document.getElementById("no-due-form");
                      if (formContent) {
                        const printWindow = window.open("", "_blank");
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>No Due Certificate - ${selectedEmployeeForNoDue.employeeName}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                  h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                  th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
                                  th { background-color: #f5f5f5; }
                                  .center { text-align: center; }
                                  .green { color: #10b981; }
                                  .red { color: #ef4444; }
                                  .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
                                  .signature-box { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 10px; }
                                  @media print { body { padding: 20px; } }
                                </style>
                              </head>
                              <body>
                                ${formContent.innerHTML}
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                          showToast.success(
                            "No Due Form downloaded successfully!",
                          );
                        }
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download / Print
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog for Add/Edit Resignation */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Resignation" : "Record Resignation"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Employee Name *</Label>
                {employeeLoading ? (
                  <div className="mt-2 px-3 py-2 border border-input rounded-md text-sm text-muted-foreground animate-pulse">
                    Loading employees...
                  </div>
                ) : employees.length === 0 ? (
                  <div className="mt-2 px-3 py-2 border border-input rounded-md text-sm text-red-600 bg-red-50">
                    ⚠️ No employees found. Check API or database.
                  </div>
                ) : (
                  <select
                    value={formData.employeeName || ""}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      // console.log("Selected employee name:", selectedName);
                      const selectedEmployee = employees.find(
                        (emp) => emp.name === selectedName,
                      );
                      // console.log("Found employee:", selectedEmployee);
                      setFormData((prevFormData) => {
                        const newFormData = {
                          ...prevFormData,
                          employeeName: selectedName,
                          employeeId: selectedEmployee?.id || "",
                        };
                        // console.log("Updated formData:", newFormData); // Log the updated formData
                        return newFormData;
                      });
                    }}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Resignation Date *</Label>
                  <Input
                    type="date"
                    value={formData.resignationDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resignationDate: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Last Working Day *</Label>
                  <Input
                    type="date"
                    value={formData.lastWorkingDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastWorkingDate: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <Input
                  value={formData.reason || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Career growth, relocation, etc."
                />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={formData.status || "pending"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function setChecklistLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
