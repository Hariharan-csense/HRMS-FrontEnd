import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { canUserCreateItem } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Asset,
  AssetType,
  AssetStatus,
  getAssetTypeLabel,
  getStatusLabel,
  getStatusColor,
} from "@/lib/assets";

// Import the API helper
import assetApi from "@/components/helper/asset/asste";
import employeeApi from "@/components/helper/employee/employee"; // Adjust path as needed
import { Employee } from "@/lib/employees";

type FormData = Omit<Asset, "id" | "createdAt" | "updatedAt">;

const initialFormData: FormData = {
  name: "",
  type: "laptop",
  serial: "",
  assignedEmployee: "",
  issueDate: "",
  status: "active",
  location: "",
  value: 0,
  description: "",
};

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<AssetStatus | "all">("all");
  const [filterType, setFilterType] = useState<AssetType | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assignedEmployee?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesStatus = filterStatus === "all" || asset.status === filterStatus;
      const matchesType = filterType === "all" || asset.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assets, searchTerm, filterStatus, filterType]);

  const { user } = useAuth();
  const canCreateAsset = canUserCreateItem(user, "assets");

  // Fetch assets on mount
useEffect(() => {
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    const result = await assetApi.getAssets();

    if (result.data) {
      console.log("Assets from API (already mapped):", result.data); // Debug
      setAssets(result.data); // ← இவ்வளவுதான்! Manual mapping தேவையில்லை
    } else {
      setError(result.error || "Failed to load assets");
      setAssets([]);
    }

    setLoading(false);
  };

  fetchAssets();
}, []);




// Fetch Employees
useEffect(() => {
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    const result = await employeeApi.getEmployees();

    if (result.data && Array.isArray(result.data)) {
      setEmployees(result.data);
    } else {
      console.error("Employees load failed or invalid data:", result.error);
      setEmployees([]); // முக்கியம்: error வந்தாலும் empty array ஆக்கு
    }
    setLoadingEmployees(false);
  };

  fetchEmployees();
}, []);


const handleOpenDialog = (asset?: Asset) => {
  if (asset) {
    // Employees இன்னும் load ஆகலனா wait பண்ணு
    if (loadingEmployees || employees.length === 0) {
      alert("Employees are still loading. Please try again in a moment.");
      return;
    }

    setEditingId(asset.id);
    setFormData({
      name: asset.name || "",
      type: (asset.type || "laptop").toLowerCase(),
      serial: asset.serial || "",
      assignedEmployee: asset.assignedEmployee || "",
      issueDate: asset.issueDate || "",
      status: (asset.status || "active").toLowerCase(),
      location: asset.location || "",
      value: asset.value || 0,
      description: asset.description || "",
    });
  } else {
    setEditingId(null);
    setFormData(initialFormData);
  }
  setIsDialogOpen(true);
};
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleSave = async () => {
  if (!formData.name || !formData.serial) {
    alert("Please fill in required fields");
    return;
  }

  const payload: any = {
    name: formData.name,
    type: formData.type.toUpperCase(), // backend "LAPTOP" expect பண்ணுது
    serial_number: formData.serial,
    status: formData.status.toUpperCase(),
    location: formData.location || null,
    value: formData.value || null,
    description: formData.description || null,
    issue_date: formData.issueDate || null,
    // மிக முக்கியம்: employee ID அனுப்பணும், null ஆகவும் அனுப்பலாம்
    assigned_employee_id: formData.assignedEmployee ? formData.assignedEmployee : null,
  };

  let result;

  if (editingId) {
    result = await assetApi.updateAsset(editingId, payload);
  } else {
    result = await assetApi.createAsset(payload);
  }

 if (result.data || result.success) {
  // Refetch assets
  const fetchResult = await assetApi.getAssets();
  if (fetchResult.data) {
    setAssets(fetchResult.data);
  } else {
    console.error("Refetch failed:", fetchResult.error);
    // Optional: show toast "Updated but failed to refresh list"
  }
  handleCloseDialog();
  alert("Asset updated successfully!");
} else {
  alert(result.error || "Update failed");
}
};



  const handleDeleteClick = (id: string) => {
    setAssetToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
  if (!assetToDelete) return;

  // Optional: loading indicator
  // setDeleting(true);

  try {
    const result = await assetApi.deleteAsset(assetToDelete);

    if (result.success) {
      // Success → refetch assets to get fresh data from backend
      const fetchResult = await assetApi.getAssets();

      if (fetchResult.data) {
        setAssets(fetchResult.data);
      } else {
        // Fallback: if refetch fails, do local delete
        setAssets((prev) => prev.filter((a) => a.id !== assetToDelete));
      }

      // Success message
      alert("Asset deleted successfully!");

      setAssetToDelete(null);
      setIsDeleteDialogOpen(false);
    } else {
      alert(result.error || "Failed to delete asset");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete asset. Please try again.");
  }

  // setDeleting(false);
};

  const getStatusBadgeClass = (status: AssetStatus) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
      damaged: "bg-red-100 text-red-800 border-red-200",
      disposed: "bg-red-100 text-red-800 border-red-200",
    };
    return statusClasses[status];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <Package className="w-8 h-8 text-primary" />
            Asset Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage company assets, allocations, and tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
              <div className="text-3xl font-bold mt-2">{assets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Active</div>
              <div className="text-3xl font-bold mt-2 text-green-600">
                {assets.filter((a) => a.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Maintenance</div>
              <div className="text-3xl font-bold mt-2 text-yellow-600">
                {assets.filter((a) => a.status === "maintenance").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Value</div>
              <div className="text-3xl font-bold mt-2">
                ₹{assets.reduce((sum, a) => sum + (a.value || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, serial, or employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Asset Type</Label>
                <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                  <SelectTrigger id="type" className="mt-2">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {canCreateAsset && (
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assets ({filteredAssets.length})</CardTitle>
            <CardDescription>
              Showing {filteredAssets.length} of {assets.length} assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
{/* Mobile Card View */}
<div className="md:hidden space-y-3">
  {filteredAssets.map((asset) => (
    <div key={asset.id} className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base">{asset.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
  Asset ID: {asset.assetId || "-"}
</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenDialog(asset)}
            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(asset.id)}
            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* இங்கதான் உங்க details இருக்கு – இப்போ asset சரியா define ஆகியிருக்கு */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
            {getAssetTypeLabel(asset.type)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Serial:</span>
          <span className="font-mono text-xs">{asset.serial || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Assigned To:</span>
          <span className="font-medium">{asset.assignedEmployeeName || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={`text-xs px-2 py-1 rounded border inline-block ${getStatusBadgeClass(asset.status)}`}>
            {getStatusLabel(asset.status)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-semibold">
            {asset.value > 0 ? `₹${asset.value.toLocaleString()}` : "-"}
          </span>
        </div>
      </div>
    </div>
  ))}
</div>
                {/* Desktop Table View */}
               {/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full text-sm border-collapse">
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap w-20">ID</th>
        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-40">Asset Name</th>
        <th className="text-center px-3 py-3 font-semibold whitespace-nowrap w-24">Type</th>
        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-32">Serial</th>
        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-32">Assigned To</th>
        <th className="text-center px-3 py-3 font-semibold whitespace-nowrap w-24">Status</th>
        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap w-32">Value</th>
        <th className="text-center px-3 py-3 font-semibold whitespace-nowrap w-20">Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredAssets.map((asset) => (
        <tr key={asset.id} className="border-b border-border hover:bg-muted/50 transition-colors h-12">
          <td className="px-3 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
  {asset.assetId || "-"}
</td>
          <td className="px-3 py-3 font-medium truncate max-w-xs whitespace-nowrap">{asset.name}</td>
          <td className="px-3 py-3 text-center align-middle whitespace-nowrap">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block whitespace-nowrap">
              {getAssetTypeLabel(asset.type)}
            </span>
          </td>
          <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{asset.serial || "-"}</td>
          <td className="px-3 py-3 truncate whitespace-nowrap">
  {asset.assignedEmployee
  ? (() => {
      const emp = employees.find(
        (e: any) => String(e.id || e._id || "") === asset.assignedEmployee
      );
      if (emp) {
        const name = `${emp.first_name || emp.name || ""} ${emp.last_name || ""}`.trim();
        const dept = emp.department || emp.dept || "";
        return name + (dept ? ` (${dept})` : "");
      }
      return "Unknown Employee";
    })()
  : "-"}
</td>
          <td className="px-3 py-3 text-center align-middle whitespace-nowrap">
            <span className={`text-xs px-2 py-1 rounded border inline-block whitespace-nowrap ${getStatusBadgeClass(asset.status)}`}>
              {getStatusLabel(asset.status)}
            </span>
          </td>
          <td className="px-3 py-3 font-medium text-right whitespace-nowrap">
            {asset.value > 0 ? `₹${asset.value.toLocaleString()}` : "-"}
          </td>
          <td className="px-3 py-3 text-center">
            <div className="flex gap-1 justify-center">
              <button onClick={() => handleOpenDialog(asset)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteClick(asset.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
    <DialogDescription>
      {editingId ? "Update asset details" : "Add a new asset to your inventory"}
    </DialogDescription>
  </DialogHeader>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pr-2">
    {/* Left Column */}
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Asset Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFormChange("name", e.target.value)}
          placeholder="e.g., Dell XPS 13"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="type">Asset Type *</Label>
        <Select value={formData.type} onValueChange={(val) => handleFormChange("type", val)}>
          <SelectTrigger id="type" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="laptop">Laptop</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="monitor">Monitor</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="serial">Serial Number *</Label>
        <Input
          id="serial"
          value={formData.serial}
          onChange={(e) => handleFormChange("serial", e.target.value)}
          placeholder="e.g., SN-123456"
          className="mt-1"
        />
      </div>
<div>
  <Label htmlFor="assignedEmployee">Assigned Employee</Label>
  <Select
    value={formData.assignedEmployee || "none"}
    onValueChange={(value) =>
      handleFormChange("assignedEmployee", value === "none" ? "" : value)
    }
    disabled={loadingEmployees}
  >
    <SelectTrigger id="assignedEmployee" className="mt-1">
      <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select an employee"}>
        {formData.assignedEmployee && employees.length > 0
          ? (() => {
              const selected = employees.find(
                (emp: any) => String(emp.id || emp._id) === formData.assignedEmployee
              );
              if (selected) {
                const fullName = `${selected.first_name || selected.firstName || selected.name || ""} ${selected.last_name || selected.lastName || ""}`.trim();
                const dept = selected.department || selected.dept || selected.department_name || "";
                return fullName + (dept ? ` (${dept})` : "");
              }
              return "Unknown Employee";
            })()
          : undefined}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Unassigned</SelectItem>
      {(employees || []).map((emp: any) => {
        const fullName = `${emp.first_name || emp.firstName || emp.name || ""} ${emp.last_name || emp.lastName || ""}`.trim();
        const dept = emp.department || emp.dept || emp.department_name || "";
        return (
          <SelectItem
            key={emp.id || emp._id}
            value={String(emp.id || emp._id || "")}
          >
            {fullName} {dept ? ` (${dept})` : ""}
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
</div>

      <div>
        <Label htmlFor="issueDate">Issue Date</Label>
        <Input
          id="issueDate"
          type="date"
          value={formData.issueDate}
          onChange={(e) => handleFormChange("issueDate", e.target.value)}
          className="mt-1"
        />
      </div>
    </div>

    {/* Right Column */}
    <div className="space-y-4">
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(val) => handleFormChange("status", val)}>
          <SelectTrigger id="status" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleFormChange("location", e.target.value)}
          placeholder="e.g., Office - Desk 1"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="value">Value (₹)</Label>
        <Input
          id="value"
          type="number"
          value={formData.value}
          onChange={(e) => handleFormChange("value", parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFormChange("description", e.target.value)}
          placeholder="Add any notes about this asset..."
          rows={5}
          className="mt-1"
        />
      </div>
    </div>
  </div>

  <div className="flex gap-3 justify-end mt-6">
    <Button variant="outline" onClick={handleCloseDialog}>
      Cancel
    </Button>
    <Button onClick={handleSave}>
      {editingId ? "Update Asset" : "Add Asset"}
    </Button>
  </div>
</DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
  onClick={handleConfirmDelete}
  disabled={deleting}
  className="bg-destructive text-destructive-foreground"
>
  {deleting ? "Deleting..." : "Delete"}
</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}