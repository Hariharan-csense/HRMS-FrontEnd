import { InlineEdit, saveInline } from "@/components/InlineEdit";
import React, { useMemo, useState } from "react";
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
import { showToast } from "@/utils/toast";
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
  AlertCircle,
  Archive,
  Boxes,
  CheckCircle2,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  AssetPageHeader,
  AssetStatCard,
  assetCardClass,
  assetContainerClass,
  assetInputClass,
  assetOutlineButtonClass,
  assetPrimaryButtonClass,
  assetShellClass,
} from "./AssetUI";

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

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    laptop: "Laptop",
    mobile: "Mobile Phone",
    furniture: "Furniture",
    equipment: "Equipment",
    other: "Other",
  };
  return labels[category] || category;
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
    active: "bg-[#e9fbf5] text-[#11966f] border-[#17c491]/30",
    returned: "bg-slate-100 text-slate-700 border-slate-200",
    damaged: "bg-amber-50 text-amber-700 border-amber-200",
    lost: "bg-red-50 text-red-700 border-red-200",
  };
  return classes[status] || "bg-slate-100 text-slate-700 border-slate-200";
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

  const isAdmin = Boolean(user?.roles?.includes("admin"));

  const filteredAssets = useMemo(() => {
    let visibleAssets = assets;

    if (user) {
      if (user.roles.includes("manager")) {
        visibleAssets = assets.filter(
          (asset) => asset.assignedTo === user.name || asset.manager === user.name,
        );
      } else if (user.roles.includes("employee") && !user.roles.includes("admin")) {
        visibleAssets = assets.filter((asset) => asset.assignedTo === user.name);
      }
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return visibleAssets.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.serialNumber.toLowerCase().includes(normalizedSearch) ||
        asset.assignedTo.toLowerCase().includes(normalizedSearch);

      const matchesCategory = filterCategory === "all" || asset.category === filterCategory;
      const matchesStatus = filterStatus === "all" || asset.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchTerm, filterCategory, filterStatus, user]);

  const stats = {
    total: filteredAssets.length,
    active: filteredAssets.filter((asset) => asset.status === "active").length,
    returned: filteredAssets.filter((asset) => asset.status === "returned").length,
    totalValue: filteredAssets.reduce((sum, asset) => sum + asset.value, 0),
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
      showToast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      setAssets((prev) =>
        prev.map((asset) => (asset.id === editingId ? { ...asset, ...formData } as Asset : asset)),
      );
    } else {
      const newAsset: Asset = {
        id: `AST${String(assets.length + 1).padStart(3, "0")}`,
        ...(formData as Asset),
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
      <div className={assetShellClass}>
        <div className={`${assetContainerClass} space-y-4`}>
          <AssetPageHeader
            icon={<Package className="h-5 w-5" />}
            title="My Assets"
            description="Track assigned assets, return status, current location, and asset value."
            action={
              isAdmin ? (
                <Button onClick={() => handleOpenDialog()} className={`gap-2 ${assetPrimaryButtonClass}`}>
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              ) : null
            }
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <AssetStatCard label="Total Assets" value={stats.total} icon={<Boxes className="h-5 w-5" />} />
            <AssetStatCard label="Active" value={stats.active} icon={<CheckCircle2 className="h-5 w-5" />} />
            <AssetStatCard label="Returned" value={stats.returned} icon={<Archive className="h-5 w-5" />} tone="slate" />
            <AssetStatCard label="Total Value" value={`Rs. ${stats.totalValue.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
          </div>

          <Card className={assetCardClass}>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="search" className="text-xs">Search</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, serial, or employee..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className={`pl-10 ${assetInputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger id="category" className={`mt-1.5 ${assetInputClass}`}>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status" className={`mt-1.5 ${assetInputClass}`}>
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
              </div>
            </CardContent>
          </Card>

          <Card className={assetCardClass}>
            <CardHeader className="border-b border-slate-100 px-4 py-3">
              <CardTitle className="text-base text-slate-950">Assets ({filteredAssets.length})</CardTitle>
              <CardDescription className="text-sm">Showing {filteredAssets.length} of {assets.length} assets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <AlertCircle className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">No assets found</p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <th className="w-24 px-4 py-3 text-left font-semibold">ID</th>
                          <th className="min-w-48 px-4 py-3 text-left font-semibold">Asset Name</th>
                          <th className="w-36 px-4 py-3 text-left font-semibold">Category</th>
                          <th className="min-w-40 px-4 py-3 text-left font-semibold">Serial</th>
                          <th className="min-w-40 px-4 py-3 text-left font-semibold">Assigned To</th>
                          <th className="w-32 px-4 py-3 text-center font-semibold">Status</th>
                          <th className="w-36 px-4 py-3 text-right font-semibold">Value</th>
                          {isAdmin && <th className="w-24 px-4 py-3 text-center font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.map((asset) => (
                          <tr key={asset.id} className="border-b border-slate-100 transition-colors hover:bg-[#e9fbf5]/60">
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{asset.id}</td>
                            <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-950"><InlineEdit value={asset.name} label="name" module="assets" submodule="list" type="text" required   onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, name: String(value) } : row)); }} /></td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="inline-block rounded border border-[#17c491]/20 bg-[#e9fbf5] px-2 py-1 text-xs font-medium text-[#11966f]">
                                {getCategoryLabel(asset.category)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600"><InlineEdit value={asset.serialNumber} label="serial Number" module="assets" submodule="list" type="text"    onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, serialNumber: String(value) } : row)); }} /></td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{asset.assignedTo}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-center">
                              <span className={`inline-block rounded border px-2 py-1 text-xs ${getStatusBadgeClass(asset.status)}`}>
                                {getStatusLabel(asset.status)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
                              Rs. <InlineEdit value={asset.value} label="value" module="assets" submodule="list" type="number"  min={0}  onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, value: Number(value) } : row)); }} />
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <button onClick={() => handleOpenDialog(asset)} className="rounded-lg p-2 text-[#11966f] hover:bg-[#e9fbf5]" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDeleteClick(asset.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 p-4 md:hidden">
                    {filteredAssets.map((asset) => (
                      <div key={asset.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-slate-500">{asset.id}</p>
                            <h3 className="mt-1 truncate text-base font-semibold text-slate-950"><InlineEdit value={asset.name} label="name" module="assets" submodule="list" type="text" required   onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, name: String(value) } : row)); }} /></h3>
                            <p className="mt-1 font-mono text-xs text-slate-500"><InlineEdit value={asset.serialNumber} label="serial Number" module="assets" submodule="list" type="text"    onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, serialNumber: String(value) } : row)); }} /></p>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <button onClick={() => handleOpenDialog(asset)} className="rounded-lg p-2 text-[#11966f] hover:bg-[#e9fbf5]" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteClick(asset.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Category</p>
                            <p className="mt-1 font-medium text-slate-950">{getCategoryLabel(asset.category)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Assigned To</p>
                            <p className="mt-1 truncate font-medium text-slate-950">{asset.assignedTo}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Status</p>
                            <span className={`mt-1 inline-block rounded border px-2 py-1 text-xs ${getStatusBadgeClass(asset.status)}`}>
                              {getStatusLabel(asset.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Value</p>
                            <p className="mt-1 font-semibold text-slate-950">Rs. <InlineEdit value={asset.value} label="value" module="assets" submodule="list" type="number"  min={0}  onSave={async (value) => { setAssets((rows) => rows.map((row) => row.id === asset.id ? { ...row, value: Number(value) } : row)); }} /></p>
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update asset information" : "Add a new asset to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category || "laptop"} onValueChange={(value: any) => handleFormChange("category", value)}>
                  <SelectTrigger id="category" className={`mt-2 ${assetInputClass}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="serial">Serial Number *</Label>
                <Input
                  id="serial"
                  value={formData.serialNumber || ""}
                  onChange={(event) => handleFormChange("serialNumber", event.target.value)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ""}
                  onChange={(event) => handleFormChange("assignedTo", event.target.value)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="assignedDate">Assigned Date</Label>
                <Input
                  id="assignedDate"
                  type="date"
                  value={formData.assignedDate || ""}
                  onChange={(event) => handleFormChange("assignedDate", event.target.value)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || "active"} onValueChange={(value: any) => handleFormChange("status", value)}>
                  <SelectTrigger id="status" className={`mt-2 ${assetInputClass}`}>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(event) => handleFormChange("location", event.target.value)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
              <div>
                <Label htmlFor="value">Value (Rs.)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value || 0}
                  onChange={(event) => handleFormChange("value", parseFloat(event.target.value) || 0)}
                  className={`mt-2 ${assetInputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleCloseDialog} className={assetOutlineButtonClass}>
              Cancel
            </Button>
            <Button onClick={handleSave} className={assetPrimaryButtonClass}>
              {editingId ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
