import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Package, Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react";

export interface Asset {
  id: string;
  name: string;
  category: "laptop" | "mobile" | "furniture" | "equipment" | "other";
  serialNumber: string;
  assignedTo: string;
  assignedDate: string;
  status: "active" | "returned" | "damaged" | "lost";
  location: string;
  value: number;
  department: string;
  manager?: string;
}

const mockAssets: Asset[] = [
  {
    id: "AST001",
    name: "Dell Laptop XPS 15",
    category: "laptop",
    serialNumber: "DELL123456",
    assignedTo: "John Doe",
    assignedDate: "2023-06-15",
    status: "active",
    location: "Office",
    value: 150000,
    department: "Engineering",
    manager: "Alice Smith",
  },
  {
    id: "AST002",
    name: "Apple MacBook Pro",
    category: "laptop",
    serialNumber: "MAC789012",
    assignedTo: "Jane Smith",
    assignedDate: "2023-07-20",
    status: "active",
    location: "Office",
    value: 180000,
    department: "Engineering",
    manager: "Alice Smith",
  },
  {
    id: "AST003",
    name: "iPhone 14 Pro",
    category: "mobile",
    serialNumber: "IPHONE345",
    assignedTo: "John Doe",
    assignedDate: "2023-08-10",
    status: "active",
    location: "Mobile",
    value: 100000,
    department: "Engineering",
    manager: "Alice Smith",
  },
  {
    id: "AST004",
    name: "Office Chair",
    category: "furniture",
    serialNumber: "CHAIR567",
    assignedTo: "Jane Smith",
    assignedDate: "2023-09-05",
    status: "active",
    location: "Office",
    value: 20000,
    department: "Engineering",
    manager: "Alice Smith",
  },
  {
    id: "AST005",
    name: "Samsung Galaxy S23",
    category: "mobile",
    serialNumber: "SAMSUNG890",
    assignedTo: "Mike Johnson",
    assignedDate: "2023-10-01",
    status: "returned",
    location: "Storage",
    value: 80000,
    department: "Sales",
  },
];

const categories = ["laptop", "mobile", "furniture", "equipment", "other"];
const statuses = ["active", "returned", "damaged", "lost"];

const getCategoryLabel = (cat: string) => {
  const labels: Record<string, string> = {
    laptop: "Laptop",
    mobile: "Mobile Phone",
    furniture: "Furniture",
    equipment: "Equipment",
    other: "Other",
  };
  return labels[cat] || cat;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: "Active",
    returned: "Returned",
    damaged: "Damaged",
    lost: "Lost",
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    returned: "bg-gray-100 text-gray-800 border-gray-300",
    damaged: "bg-orange-100 text-orange-800 border-orange-300",
    lost: "bg-red-100 text-red-800 border-red-300",
  };
  return classes[status] || "bg-gray-100 text-gray-800 border-gray-300";
};

export default function MyAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: "",
    category: "laptop",
    serialNumber: "",
    assignedTo: "",
    assignedDate: new Date().toISOString().split("T")[0],
    status: "active",
    location: "",
    value: 0,
  });

  const filteredAssets = useMemo(() => {
    let visibleAssets = assets;

    // Role-based filtering
    if (user) {
      if (user.roles.includes("manager")) {
        // Managers see their team's assets
        visibleAssets = assets.filter(
          (asset) =>
            asset.assignedTo === user.name || asset.manager === user.name
        );
      } else if (user.roles.includes("employee") && !user.roles.includes("admin")) {
        // Employees see only their own assets
        visibleAssets = assets.filter((asset) => asset.assignedTo === user.name);
      }
      // Admins see all assets (no filtering)
    }

    // Apply search and filters
    return visibleAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || asset.category === filterCategory;
      const matchesStatus = filterStatus === "all" || asset.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchTerm, filterCategory, filterStatus, user]);

  const stats = {
    total: filteredAssets.length,
    active: filteredAssets.filter((a) => a.status === "active").length,
    returned: filteredAssets.filter((a) => a.status === "returned").length,
    totalValue: filteredAssets.reduce((sum, a) => sum + a.value, 0),
  };

  const handleOpenDialog = (asset?: Asset) => {
    if (asset) {
      setEditingId(asset.id);
      setFormData(asset);
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category: "laptop",
        serialNumber: "",
        assignedTo: "",
        assignedDate: new Date().toISOString().split("T")[0],
        status: "active",
        location: "",
        value: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (field: keyof Asset, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.serialNumber || !formData.assignedTo) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingId) {
      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === editingId ? { ...asset, ...formData } : asset
        )
      );
    } else {
      const newAsset: Asset = {
        id: `AST${String(assets.length + 1).padStart(3, "0")}`,
        ...formData as Asset,
      };
      setAssets((prev) => [newAsset, ...prev]);
    }

    handleCloseDialog();
  };

  const handleDeleteClick = (id: string) => {
    setAssetToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (assetToDelete) {
      setAssets((prev) => prev.filter((asset) => asset.id !== assetToDelete));
      setAssetToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
            <Package className="w-8 h-8 text-primary" />
            My Assets
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track assigned assets and equipment
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Total Assets
              </div>
              <div className="text-3xl font-bold mt-2">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Active
              </div>
              <div className="text-3xl font-bold mt-2 text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Returned
              </div>
              <div className="text-3xl font-bold mt-2 text-gray-600">
                {stats.returned}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Total Value
              </div>
              <div className="text-3xl font-bold mt-2">
                ₹{stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                    placeholder="Search by name or serial number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {user?.roles.includes("admin") && (
                  <Button onClick={() => handleOpenDialog()} className="w-full gap-2">
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
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[65px]">
                          ID
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[120px]">
                          Asset Name
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[100px]">
                          Category
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[120px]">
                          Serial Number
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[100px]">
                          Assigned To
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[80px]">
                          Status
                        </th>
                        <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[85px]">
                          Value
                        </th>
                        {user?.roles.includes("admin") && (
                          <th className="text-left px-2 py-2.5 font-semibold whitespace-nowrap min-w-[55px]">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {asset.id}
                          </td>
                          <td className="px-2 py-2.5 font-medium whitespace-nowrap">
                            {asset.name}
                          </td>
                          <td className="px-2 py-2.5 text-xs whitespace-nowrap">
                            {getCategoryLabel(asset.category)}
                          </td>
                          <td className="px-2 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {asset.serialNumber}
                          </td>
                          <td className="px-2 py-2.5 text-xs whitespace-nowrap">
                            {asset.assignedTo}
                          </td>
                          <td className="px-2 py-2.5">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded border inline-block ${getStatusBadgeClass(
                                asset.status
                              )}`}
                            >
                              {getStatusLabel(asset.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 font-medium text-xs whitespace-nowrap">
                            ₹{asset.value.toLocaleString()}
                          </td>
                          {user?.roles.includes("admin") && (
                            <td className="px-2 py-2.5">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleOpenDialog(asset)}
                                  className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(asset.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {asset.id}
                            </span>
                            <h3 className="font-bold text-base">{asset.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            SN: {asset.serialNumber}
                          </p>
                        </div>
                        {user?.roles.includes("admin") && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenDialog(asset)}
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(asset.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">
                            Category
                          </label>
                          <p className="font-medium">
                            {getCategoryLabel(asset.category)}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">
                            Assigned To
                          </label>
                          <p className="font-medium">{asset.assignedTo}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">
                            Status
                          </label>
                          <span
                            className={`text-xs px-2 py-1 rounded border inline-block ${getStatusBadgeClass(
                              asset.status
                            )}`}
                          >
                            {getStatusLabel(asset.status)}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">
                            Value
                          </label>
                          <p className="font-medium">
                            ₹{asset.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update asset information"
                : "Add a new asset to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || "laptop"}
                  onValueChange={(val: any) =>
                    handleFormChange("category", val)
                  }
                >
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serial">Serial Number *</Label>
                <Input
                  id="serial"
                  value={formData.serialNumber || ""}
                  onChange={(e) =>
                    handleFormChange("serialNumber", e.target.value)
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ""}
                  onChange={(e) => handleFormChange("assignedTo", e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedDate">Assigned Date</Label>
                <Input
                  id="assignedDate"
                  type="date"
                  value={formData.assignedDate || ""}
                  onChange={(e) =>
                    handleFormChange("assignedDate", e.target.value)
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(val: any) => handleFormChange("status", val)}
                >
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="value">Value (₹)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value || 0}
                  onChange={(e) =>
                    handleFormChange("value", parseFloat(e.target.value) || 0)
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
