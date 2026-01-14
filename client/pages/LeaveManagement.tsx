import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Calendar } from "lucide-react";

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "casual" | "sick" | "earned" | "maternity" | "unpaid";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
  approvedBy?: string;
}

const mockLeaves: LeaveApplication[] = [
  {
    id: "LEAVE001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    leaveType: "casual",
    fromDate: "2024-03-20",
    toDate: "2024-03-22",
    days: 3,
    reason: "Personal work",
    status: "approved",
    appliedOn: "2024-03-10",
    approvedBy: "Sarah Smith",
  },
  {
    id: "LEAVE002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    leaveType: "sick",
    fromDate: "2024-03-18",
    toDate: "2024-03-18",
    days: 1,
    reason: "Medical appointment",
    status: "pending",
    appliedOn: "2024-03-15",
  },
];

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>(mockLeaves);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LeaveApplication>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debug: Track dialog state changes
  console.log("isDialogOpen:", isDialogOpen);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch = leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || leave.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, filterStatus]);

  const handleOpenDialog = (leave?: LeaveApplication) => {
    console.log("handleOpenDialog called", leave);
    if (leave) {
      setEditingId(leave.id);
      setFormData(leave);
    } else {
      setEditingId(null);
      setFormData({ status: "pending", leaveType: "casual" });
    }
    console.log("Setting isDialogOpen to true");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setLeaves((prev) =>
        prev.map((l) => (l.id === editingId ? { ...l, ...formData } : l))
      );
    } else {
      const newLeave = {
        id: `LEAVE${String(leaves.length + 1).padStart(3, "0")}`,
        ...formData,
        appliedOn: new Date().toISOString().split("T")[0],
      } as LeaveApplication;
      setLeaves((prev) => [newLeave, ...prev]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setLeaves((prev) => prev.filter((l) => l.id !== deleteId));
      setIsDeleteDialogOpen(false);
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
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary flex-shrink-0" />
            <span className="hidden sm:inline">Leave Management</span>
            <span className="sm:hidden">Leave Mgmt</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Apply and manage employee leaves</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Total</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">{leaves.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                {leaves.filter((l) => l.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-yellow-600">
                {leaves.filter((l) => l.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Rejected</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-red-600">
                {leaves.filter((l) => l.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
                <div className="relative mt-1.5 sm:mt-2">
                  <Search className="absolute left-2 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search..."
                    className="pl-8 h-8 sm:h-10 text-xs sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status" className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={() => handleOpenDialog()} className="w-full gap-2 h-8 sm:h-10 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Apply Leave</span>
                  <span className="sm:hidden">Apply</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Applications ({filteredLeaves.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-2 sm:space-y-3">
              {filteredLeaves.map((leave) => (
                <div key={leave.id} className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                    <h3 className="font-semibold text-sm sm:text-base break-words flex-1">{leave.employeeName}</h3>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenDialog(leave)}
                        className="p-1 sm:p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(leave.id)}
                        className="p-1 sm:p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Type:</span>
                      <span className="font-medium capitalize text-right">{leave.leaveType}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">From:</span>
                      <span className="font-medium text-right">{leave.fromDate}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">To:</span>
                      <span className="font-medium text-right">{leave.toDate}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Days:</span>
                      <span className="font-medium text-right">{leave.days}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Status:</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">From</th>
                    <th className="text-left px-4 py-3 font-semibold">To</th>
                    <th className="text-left px-4 py-3 font-semibold">Days</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{leave.employeeName}</td>
                      <td className="px-4 py-3 capitalize">{leave.leaveType}</td>
                      <td className="px-4 py-3">{leave.fromDate}</td>
                      <td className="px-4 py-3">{leave.toDate}</td>
                      <td className="px-4 py-3">{leave.days}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDialog(leave)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(leave.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingId ? "Edit Leave" : "Apply for Leave"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Employee Name</Label>
              <Input
                value={formData.employeeName || ""}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Leave Type</Label>
              <Select value={formData.leaveType || "casual"} onValueChange={(val: any) => setFormData({ ...formData, leaveType: val })}>
                <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm">From Date</Label>
                <Input
                  type="date"
                  value={formData.fromDate || ""}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">To Date</Label>
                <Input
                  type="date"
                  value={formData.toDate || ""}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Number of Days</Label>
              <Input
                type="number"
                value={formData.days || 1}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Reason</Label>
              <Textarea
                value={formData.reason || ""}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1.5 sm:mt-2 text-xs sm:text-sm min-h-20 sm:min-h-24"
              />
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Status</Label>
              <Select value={formData.status || "pending"} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="mt-1.5 sm:mt-2 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6 border-t pt-3 sm:pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto text-xs sm:text-sm">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete Leave Application</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
