import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, LogOut } from "lucide-react";
import { resignationApi, Resignation } from "@/components/helper/resignation/resignation"; // Adjust path as needed
import { Loader2 } from "lucide-react";
import { checklistApi } from "@/components/helper/checklist/checklist";
//import { employeeApi,type Employee   } from "@/components/helper/employee/employee";

interface OffboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
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
  const [resignations, setResignations] = useState<Resignation[]>([]);
  //const [checklists] = useState<OffboardingChecklist[]>(mockChecklists);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"resignations" | "checklist">("resignations");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Resignation>>({});
  //const [resignations, setResignations] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<OffboardingChecklist[]>([]);

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
    
    console.log("Employees API Result:", result);  // ← Idhu paaru!

    if (result.data) {
      setEmployees(result.data);
      console.log("Employees set:", result.data);  // ← Idhu array-la data irukka paaru
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
       console.log("Fetched Resignations:", result);
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
      setFormData(resignation);
    } else {
      setEditingId(null);
      setFormData({ approvalStatus: "pending" });
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
    alert("Employee Name is required");
    return;
  }
  if (!formData.resignationDate) {
    alert("Resignation Date is required");
    return;
  }
  if (!formData.lastWorkingDate) {
    alert("Last Working Day is required");
    return;
  }

  const payload = {
    employeeName: formData.employeeName.trim(),
    resignationDate: formData.resignationDate,
    lastWorkingDate: formData.lastWorkingDate,
    reason: formData.reason?.trim() || "",
    noticePeriod: formData.noticePeriod,
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
        setResignations(prev => prev.map(r => r.id === editingId ? result.data! : r));
      } else {
        setResignations(prev => [...prev, result.data!]);
      }

      setIsDialogOpen(false);
      setFormData({});
      setEditingId(null);
    } else {
      alert(result.error || "Failed to save resignation");
    }
  } catch (err) {
    console.error(err);
    alert("An error occurred. Please try again.");
  }
};

 // Toggle individual clearance item and update backend
const toggleChecklistItem = async (
  checklistId: string,
  field: "hrClearance" | "financeClearance" | "assetReturn" | "itClearance" | "finalSettlement"
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
    prev.map((c) => (c.id === checklistId ? tempUpdated : c))
  );

  try {
    // Send ONLY { field: "hr_clearance" } as backend expects
    const result = await checklistApi.updateChecklist(checklistId, {
      field: backendField,
    });

    if (result.error) {
      // Rollback on error
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? checklist : c))
      );
      alert(result.error);
      return;
    }

    // Success: update with fresh data from server
    if (result.data) {
      setChecklists((prev) =>
        prev.map((c) => (c.id === checklistId ? result.data! : c))
      );
    }
  } catch (err) {
    // Rollback
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? checklist : c))
    );
    alert("Failed to save changes");
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
          <p className="text-muted-foreground mt-2">Manage employee resignations and offboarding</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab("resignations")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "resignations"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Resignations
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "checklist"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Offboarding Checklist
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
          <div className="text-red-600 text-center py-4">
            {error}
          </div>
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
                <p className="text-center text-muted-foreground py-8">No resignations found</p>
              ) : (
                resignations.map((res) => (
                  <div key={res.id} className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-base">{res.employeeName}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(res.status || "pending")}`}>
                        {res.status || "pending"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resignation Date:</span>
                       <span className="font-medium">{formatDate(res.resignationDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LWD:</span>
                       <span className="font-medium">{formatDate(res.lastWorkingDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reason:</span>
                        <span className="text-xs text-right">{res.reason || "-"}</span>
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold">Resignation Date</th>
                    <th className="text-left px-4 py-3 font-semibold">LWD</th>
                    <th className="text-left px-4 py-3 font-semibold">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resignations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No resignations found
                      </td>
                    </tr>
                  ) : (
                    resignations.map((res) => (
                      <tr key={res.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{res.employeeName}</td>
                        <td className="px-4 py-3">{formatDate(res.resignationDate)}</td>
      <td className="px-4 py-3">{formatDate(res.lastWorkingDate)}</td>
                        <td className="px-4 py-3 text-xs">{res.reason || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(res.status || "pending")}`}>
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
      <div className="text-red-600 text-center py-6">{checklistError}</div>
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
                <CardTitle>{checklist.employeeName || "Employee"}</CardTitle>
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
                    checked={checklist[item.key as keyof OffboardingChecklist] as boolean}
                    onCheckedChange={() =>
                      toggleChecklistItem(
                        checklist.id,
                        item.key as keyof Pick<
                          OffboardingChecklist,
                          "hrClearance" | "financeClearance" | "assetReturn" | "itClearance" | "finalSettlement"
                        >
                      )
                    }
                  />
                  <Label className="cursor-pointer flex-1">{item.label}</Label>
                  {checklist[item.key as keyof OffboardingChecklist] && (
                    <span className="text-xs text-green-600 font-medium">✓ Done</span>
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

        {/* Dialog for Add/Edit Resignation */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Resignation" : "Record Resignation"}</DialogTitle>
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
        const selectedEmployee = employees.find(emp => emp.name === selectedName);
        setFormData({
          ...formData,
          employeeName: selectedName,
          employeeId: selectedEmployee?.id || "",
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
                    onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Last Working Day *</Label>
                  <Input
                    type="date"
                    value={formData.lastWorkingDate || formData.lastWorkingDay || ""}
                    onChange={(e) => setFormData({ ...formData, lastWorkingDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <Input
                  value={formData.reason || ""}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-2"
                  placeholder="Career growth, relocation, etc."
                />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  value={formData.status || formData.approvalStatus || "pending"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
