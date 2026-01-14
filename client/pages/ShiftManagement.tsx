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

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Shift>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Load on mount
  useEffect(() => {
    loadShifts();
  }, []);

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

    const { error } = await shiftApi.deleteShift(id);
    if (error) {
      toast.error(error);
      // Revert on error
      await loadShifts();
    } else {
      toast.success("Shift deleted successfully");
    }
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
                    <CardTitle className="text-lg">{shift.name}</CardTitle>
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
                      <div className="font-medium">{shift.gracePeriod ?? 0} mins</div>
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
                  value={formData.halfDayThreshold ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      halfDayThreshold: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
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