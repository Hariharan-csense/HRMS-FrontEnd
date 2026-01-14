import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Settings, Calendar, Zap } from "lucide-react";
import { holidayApi, fiscalYearApi, leavePolicyApi, Holiday, FiscalYearConfig, LeavePolicy } from "@/components/helper/leave/leave";


export default function LeaveConfiguration() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fiscalYear, setFiscalYear] = useState<FiscalYearConfig | null>(null);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("holidays");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [holidaysResult, fiscalYearsResult, policiesResult] = await Promise.all([
        holidayApi.getHolidays(),
        fiscalYearApi.getFiscalYears(),
        leavePolicyApi.getLeavePolicies()
      ]);

      if (holidaysResult.data) {
        setHolidays(holidaysResult.data);
      }
      
      if (fiscalYearsResult.data && fiscalYearsResult.data.length > 0) {
        setFiscalYear(fiscalYearsResult.data[0]); // Get the first/active fiscal year
      }
      
      if (policiesResult.data) {
        setLeavePolicies(policiesResult.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredHolidays = useMemo(
    () => holidays.filter((h) => h.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [holidays, searchTerm]
  );

  const filteredPolicies = useMemo(
    () => leavePolicies.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [leavePolicies, searchTerm]
  );

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name && activeTab !== "fiscal") {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (activeTab === "holidays") {
        let result;
        if (editingId) {
          result = await holidayApi.updateHoliday(editingId, formData);
        } else {
          result = await holidayApi.createHoliday(formData);
        }
        
        if (result.data || result.success) {
          await holidayApi.getHolidays().then(res => {
            if (res.data) setHolidays(res.data);
          });
        } else if (result.error) {
          alert(result.error);
        }
      } else if (activeTab === "fiscal") {
        let result;
        if (fiscalYear?.id) {
          result = await fiscalYearApi.updateFiscalYear(fiscalYear.id, formData);
        } else {
          result = await fiscalYearApi.createFiscalYear(formData);
        }
        
        if (result.data || result.success) {
          await fiscalYearApi.getFiscalYears().then(res => {
            if (res.data && res.data.length > 0) {
              setFiscalYear(res.data[0]);
            }
          });
        } else if (result.error) {
          alert(result.error);
        }
      } else if (activeTab === "policies") {
        let result;
        if (editingId) {
          result = await leavePolicyApi.updateLeavePolicy(editingId, formData);
        } else {
          result = await leavePolicyApi.createLeavePolicy(formData);
        }
        
        if (result.data || result.success) {
          await leavePolicyApi.getLeavePolicies().then(res => {
            if (res.data) setLeavePolicies(res.data);
          });
        } else if (result.error) {
          alert(result.error);
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      let result;
      
      if (activeTab === "holidays") {
        result = await holidayApi.deleteHoliday(deleteId!);
        if (result.success) {
          await holidayApi.getHolidays().then(res => {
            if (res.data) setHolidays(res.data);
          });
        }
      } else if (activeTab === "policies") {
        result = await leavePolicyApi.deleteLeavePolicy(deleteId!);
        if (result.success) {
          await leavePolicyApi.getLeavePolicies().then(res => {
            if (res.data) setLeavePolicies(res.data);
          });
        }
      }
      
      if (result?.error) {
        alert(result.error);
      }
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            Leave Configuration
          </h1>
          <p className="text-muted-foreground mt-2">Manage holiday calendar, fiscal year settings, and leave policies</p>
        </div>

        {/* Search Card */}
        {activeTab !== "fiscal" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {(activeTab === "holidays" || activeTab === "policies") && (
                  <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted p-1">
            <TabsTrigger value="holidays" className="text-xs md:text-sm">Holidays ({holidays.length})</TabsTrigger>
            <TabsTrigger value="fiscal" className="text-xs md:text-sm">Fiscal Year</TabsTrigger>
            <TabsTrigger value="policies" className="text-xs md:text-sm">Leave Policies ({leavePolicies.length})</TabsTrigger>
          </TabsList>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-2 py-2 font-semibold">Holiday Name</th>
                        <th className="text-left px-2 py-2 font-semibold">Date</th>
                        <th className="text-left px-2 py-2 font-semibold">Type</th>
                        <th className="text-left px-2 py-2 font-semibold">Description</th>
                        <th className="text-left px-2 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHolidays.map((holiday) => (
                        <tr key={holiday.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-2 py-2 font-medium">{holiday.name}</td>
                          <td className="px-2 py-2 text-xs">{holiday.date}</td>
                          <td className="px-2 py-2">
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                holiday.type === "national"
                                  ? "bg-red-100 text-red-800"
                                  : holiday.type === "regional"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs">{holiday.description || "-"}</td>
                          <td className="px-2 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDialog(holiday)}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(holiday.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fiscal Year Tab */}
          <TabsContent value="fiscal">
            <Card>
              <CardHeader>
                <CardTitle>Fiscal Year Configuration</CardTitle>
                <CardDescription>Set up financial and leave cycle dates</CardDescription>
              </CardHeader>
              <CardContent>
                {fiscalYear ? (
                  <div className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Financial Year</Label>
                        <p className="text-sm text-muted-foreground mt-1">{fiscalYear.year}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Active</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Active</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Fiscal Year Start</Label>
                        <p className="text-sm text-muted-foreground mt-1">{fiscalYear.startDate}</p>
                      </div>
                      <div>
                        <Label className="font-semibold">Fiscal Year End</Label>
                        <p className="text-sm text-muted-foreground mt-1">{fiscalYear.endDate}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Leave Cycle Start Date</Label>
                      <p className="text-sm text-muted-foreground mt-1">{fiscalYear.leaveCycleStart}</p>
                    </div>

                    <div className="border-t pt-6">
                      <Button onClick={() => handleOpenDialog(fiscalYear)} className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Fiscal Year
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No fiscal year configuration found</p>
                    <Button onClick={() => handleOpenDialog()} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Fiscal Year
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredPolicies.map((policy) => (
                    <div key={policy.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            policy.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleOpenDialog(policy)}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add New"} {activeTab === "holidays" ? "Holiday" : activeTab === "fiscal" ? "Fiscal Year" : "Leave Policy"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "holidays" && (
              <>
                <div>
                  <Label>Holiday Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    type="date"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Holiday Type *</Label>
                  <Select value={formData.type || ""} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {activeTab === "fiscal" && (
              <>
                <div>
                  <Label>Financial Year *</Label>
                  <Input
                    value={formData.year || ""}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      value={formData.startDate || ""}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      type="date"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input
                      value={formData.endDate || ""}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      type="date"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Leave Cycle Start Date *</Label>
                  <Input
                    value={formData.leaveCycleStart || ""}
                    onChange={(e) => setFormData({ ...formData, leaveCycleStart: e.target.value })}
                    type="date"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {activeTab === "policies" && (
              <>
                <div>
                  <Label>Policy Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Input
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={formData.status || ""} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
