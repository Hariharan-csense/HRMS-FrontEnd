import { notifyDeletionPending } from "@/lib/deletionDrafts";
import { InlineEdit, saveInline } from "@/components/InlineEdit";
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import shiftApi, { Shift } from "@/components/helper/shifts/shifts"; // Adjust path if needed
import ENDPOINTS from "@/lib/endpoint";

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Shift>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [rosterRows, setRosterRows] = useState<any[]>([]);
  const [rosterSummary, setRosterSummary] = useState<any>({});
  const [rosterForm, setRosterForm] = useState({
    employeeId: "",
    shiftId: "",
    rosterDate: new Date().toISOString().slice(0, 10),
    status: "scheduled",
    notes: "",
  });

  // Centralized function to load shifts
  const loadShifts = async () => {
    setIsLoading(true);
    const { data, error } = await shiftApi.getShifts();

    if (error) {
      toast.error(error || "Failed to load shifts");
    } else {
      setShifts(data || []);
    }
    setIsLoading(false);
  };

  const loadRoster = async () => {
    const { data, summary, error } = await shiftApi.getRoster({
      startDate: rosterForm.rosterDate,
      endDate: rosterForm.rosterDate,
    });
    if (error) {
      toast.error(error);
    } else {
      setRosterRows(data || []);
      setRosterSummary(summary || {});
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await ENDPOINTS.getReportFilters();
      setEmployees(response.data?.data?.employees || []);
    } catch (error) {
      console.error("Failed to load employees for roster", error);
    }
  };

  // Load on mount
  useEffect(() => {
    loadShifts();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadRoster();
  }, [rosterForm.rosterDate]);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Shift name is required';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }
    
    if (formData.startTime && formData.endTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      
      if (endTotal <= startTotal) {
        errors.endTime = 'End time must be after start time';
      }

      if (formData.halfDayThreshold !== undefined && formData.halfDayThreshold !== null) {
        const thresholdHours = Number(formData.halfDayThreshold);
        if (!Number.isFinite(thresholdHours) || thresholdHours <= 0) {
          errors.halfDayThreshold = 'Half day threshold must be greater than 0';
        } else {
          const shiftDurationHours = (endTotal - startTotal) / 60;
          if (thresholdHours >= shiftDurationHours) {
            errors.halfDayThreshold = 'Half day threshold must be less than total shift hours';
          }
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Calculate shift duration in hours
  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return '0 hours';
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  const getHalfDayCutoffTime = (start?: string, thresholdHours?: number): string | null => {
    if (!start || !Number.isFinite(Number(thresholdHours)) || Number(thresholdHours) <= 0) return null;
    const [h, m] = start.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    const baseMinutes = h * 60 + m;
    const thresholdMinutes = Math.round(Number(thresholdHours) * 60);
    const total = baseMinutes + thresholdMinutes;
    const outH = Math.floor((total % (24 * 60)) / 60);
    const outM = total % 60;
    return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
  };

  // Open dialog
  const handleOpenDialog = (shift?: Shift) => {
    setFormErrors({});
    if (shift) {
      setEditingId(shift.id);
      setFormData(shift);
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        startTime: "09:00",
        endTime: "17:00",
        gracePeriod: 15,
        halfDayThreshold: 4,
        otEligible: true,
      });
    }
    setIsDialogOpen(true);
  };

  // Submit (create or update) + refetch after success
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name,
      startTime: formData.startTime,
      endTime: formData.endTime,
      gracePeriod: formData.gracePeriod ?? 0,
      halfDayThreshold: formData.halfDayThreshold ?? 0,
      otEligible: formData.otEligible ?? false,
    };

    setIsSubmitting(true);

    try {
      if (editingId) {
        const { error } = await shiftApi.updateShift(editingId, payload);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Shift updated successfully");
        }
      } else {
        const { error } = await shiftApi.createShift(payload);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Shift created successfully");
        }
      }

      // Refetch fresh data from server (this fixes the "no auto-update" issue)
      await loadShifts();

      // Only close dialog on success
      setIsDialogOpen(false);
      setFormData({});
      setEditingId(null);
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete shift (optimistic local update + refetch for safety)
  const handleDeleteShift = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    // Optimistic UI update
    setShifts((prev) => prev.filter((s) => s.id !== id));

    const deletionResult = await shiftApi.deleteShift(id);
    if (notifyDeletionPending(deletionResult)) return;
      const { error } = deletionResult;
    if (error) {
      toast.error(error);
      // Revert on error
      await loadShifts();
    } else {
      toast.success("Shift deleted successfully");
    }
  };

  const handleSaveRoster = async () => {
    if (!rosterForm.employeeId || !rosterForm.shiftId || !rosterForm.rosterDate) {
      toast.error("Employee, shift and date are required");
      return;
    }

    const { error } = await shiftApi.saveRoster({
      employeeId: rosterForm.employeeId,
      shiftId: rosterForm.shiftId,
      rosterDate: rosterForm.rosterDate,
      status: rosterForm.status,
      notes: rosterForm.notes,
    });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Roster assignment saved");
    setRosterForm((prev) => ({ ...prev, employeeId: "", shiftId: "", notes: "" }));
    await loadRoster();
  };

  const handleDeleteRoster = async (id: string) => {
    const deletionResult = await shiftApi.deleteRoster(id);
    if (notifyDeletionPending(deletionResult)) return;
      const { error } = deletionResult;
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Roster assignment removed");
    await loadRoster();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            Shift Management
          </h1>
          <p className="text-muted-foreground mt-2">Configure work shifts and schedules</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Shift
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No shifts configured yet</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Shift
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg"><InlineEdit value={shift.name} label="name" module="attendance" submodule="shift" type="text" required   onSave={(value) => saveInline(shiftApi.updateShift(String(shift.id), { ...shift, name: String(value) }), () => setShifts((rows) => rows.map((row) => row.id === shift.id ? { ...row, name: String(value) } : row)))} /></CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDialog(shift)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Time</Label>
                      <div className="text-lg font-bold">{shift.startTime}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Time</Label>
                      <div className="text-lg font-bold">{shift.endTime}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Grace Period</Label>
                      <div className="font-medium"><InlineEdit value={shift.gracePeriod} label="grace Period" module="attendance" submodule="shift" type="number"  min={0}  onSave={(value) => saveInline(shiftApi.updateShift(String(shift.id), { ...shift, gracePeriod: Number(value) }), () => setShifts((rows) => rows.map((row) => row.id === shift.id ? { ...row, gracePeriod: Number(value) } : row)))} /> mins</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Half Day Threshold</Label>
                      <div className="font-medium">{shift.halfDayThreshold ?? 0} hours</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">OT Eligible</Label>
                    <div className="font-medium">
                      {shift.otEligible ? (
                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">
                          No
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Shift/Roster Planner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={rosterForm.rosterDate}
                  onChange={(e) =>
                    setRosterForm({ ...rosterForm, rosterDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Employee</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={rosterForm.employeeId}
                  onChange={(e) =>
                    setRosterForm({ ...rosterForm, employeeId: e.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees
                    .filter((employee: any) => employee.id !== "all")
                    .map((employee: any) => (
                      <option key={employee.pkId || employee.id} value={employee.pkId || employee.id}>
                        {employee.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Shift</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={rosterForm.shiftId}
                  onChange={(e) =>
                    setRosterForm({ ...rosterForm, shiftId: e.target.value })
                  }
                >
                  <option value="">Select shift</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={rosterForm.status}
                  onChange={(e) =>
                    setRosterForm({ ...rosterForm, status: e.target.value })
                  }
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="week_off">Week Off</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleSaveRoster}>
                  Save Roster
                </Button>
              </div>
            </div>
            <Input
              placeholder="Notes"
              value={rosterForm.notes}
              onChange={(e) =>
                setRosterForm({ ...rosterForm, notes: e.target.value })
              }
            />

            <div className="grid grid-cols-3 gap-3">
              {[
                ["Total Rows", rosterSummary.total || 0],
                ["Assigned", rosterSummary.assigned || 0],
                ["Unassigned", rosterSummary.unassigned || 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xl font-bold">{value}</div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3 text-left">Department</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Shift</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterRows.length === 0 ? (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                        No roster assignments for this date
                      </td>
                    </tr>
                  ) : (
                    rosterRows.map((row: any) => (
                      <tr key={`${row.employeeId}-${row.rosterId || row.rosterDate}`} className="border-t">
                        <td className="p-3">
                          {row.employeeName || row.employeeCode}
                          <div className="text-xs text-muted-foreground">{row.employeeCode}</div>
                        </td>
                        <td className="p-3">{row.department || "-"}</td>
                        <td className="p-3">{row.rosterDate || rosterForm.rosterDate}</td>
                        <td className="p-3">{row.shiftName || row.defaultShiftName || "Unassigned"}</td>
                        <td className="p-3">{row.status || "default"}</td>
                        <td className="p-3">
                          {row.rosterId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRoster(String(row.rosterId))}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Shift" : "Add New Shift"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Shift Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Shift"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center">
                  <Label>Start Time</Label>
                  {formErrors.startTime && (
                    <span className="text-xs text-red-500">{formErrors.startTime}</span>
                  )}
                </div>
                <Input
                  type="time"
                  value={formData.startTime || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    setFormErrors((prev) => ({ ...prev, startTime: '' }));
                  }}
                  className={formErrors.startTime ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <Label>End Time</Label>
                  {formErrors.endTime && (
                    <span className="text-xs text-red-500">{formErrors.endTime}</span>
                  )}
                </div>
                <Input
                  type="time"
                  value={formData.endTime || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    setFormErrors((prev) => ({ ...prev, endTime: '' }));
                  }}
                  className={formErrors.endTime ? 'border-red-500' : ''}
                />
              </div>
              {formData.startTime && formData.endTime && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Duration: <span className="font-medium">{calculateDuration(formData.startTime, formData.endTime)}</span>
                  {formData.gracePeriod && formData.gracePeriod > 0 && (
                    <span className="ml-4">
                      (Grace: {formData.gracePeriod} min)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grace Period (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.gracePeriod ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Math.min(60, Math.max(0, Number(e.target.value))) : 0;
                    setFormData({
                      ...formData,
                      gracePeriod: value,
                    });
                  }}
                  onBlur={(e) => {
                    if (e.target.value && Number(e.target.value) > 60) {
                      toast.warning("Grace period should not exceed 60 minutes");
                    }
                  }}
                  placeholder="0-60 minutes"
                />
              </div>
              <div>
                <Label>Half Day Threshold (hours)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={formData.halfDayThreshold ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      halfDayThreshold: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className={formErrors.halfDayThreshold ? 'border-red-500' : ''}
                />
                {formErrors.halfDayThreshold ? (
                  <p className="text-xs text-red-500 mt-1">{formErrors.halfDayThreshold}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Employee is marked half day only when check-in is after this threshold from shift start.
                  </p>
                )}
                {getHalfDayCutoffTime(formData.startTime, formData.halfDayThreshold) && (
                  <p className="text-xs text-blue-600 mt-1">
                    Half-day cutoff time: {getHalfDayCutoffTime(formData.startTime, formData.halfDayThreshold)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.otEligible ?? false}
                onChange={(e) => setFormData({ ...formData, otEligible: e.target.checked })}
                className="w-4 h-4"
              />
              <Label className="cursor-pointer">OT Eligible</Label>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
