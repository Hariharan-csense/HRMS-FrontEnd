import { InlineEdit, saveInline } from "@/components/InlineEdit";
import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { canUserCreateItem } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { showToast } from "@/utils/toast";
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
  AlertCircle,
  Boxes,
  CheckCircle2,
  Download,
  Edit,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  Asset,
  AssetStatus,
  AssetType,
  getAssetTypeLabel,
  getStatusLabel,
} from "@/lib/assets";
import assetApi from "@/components/helper/asset/asste";
import employeeApi from "@/components/helper/employee/employee";
import { Employee } from "@/lib/employees";
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

const statusBadgeClass = (status: AssetStatus) => {
  const statusClasses: Record<AssetStatus, string> = {
    active: "bg-[#e9fbf5] text-[#11966f] border-[#17c491]/30",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
    maintenance: "bg-amber-50 text-amber-700 border-amber-200",
    damaged: "bg-red-50 text-red-700 border-red-200",
    disposed: "bg-red-50 text-red-700 border-red-200",
  };
  return statusClasses[status] || statusClasses.inactive;
};

const assetIdOf = (asset: Asset) => String((asset as any).assetId || "-");
const assignedNameOf = (asset: Asset) => String((asset as any).assignedEmployeeName || "");

export default function AssetList() {
  const { user } = useAuth();
  const canCreateAsset = canUserCreateItem(user, "assets");

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
  const [isSaving, setIsSaving] = useState(false);

  const getAssignedEmployeeLabel = (asset: Asset) => {
    const mappedName = assignedNameOf(asset);
    if (mappedName) return mappedName;
    if (!asset.assignedEmployee) return "-";

    const employee = employees.find(
      (emp: any) => String(emp.id || emp._id || "") === String(asset.assignedEmployee),
    ) as any;

    if (!employee) return "Unknown Employee";

    const fullName = `${employee.first_name || employee.firstName || employee.name || ""} ${employee.last_name || employee.lastName || ""}`.trim();
    const department = employee.department || employee.dept || employee.department_name || "";

    return `${fullName || "Employee"}${department ? ` (${department})` : ""}`;
  };

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.serial.toLowerCase().includes(normalizedSearch) ||
        getAssignedEmployeeLabel(asset).toLowerCase().includes(normalizedSearch);

      const matchesStatus = filterStatus === "all" || asset.status === filterStatus;
      const matchesType = filterType === "all" || asset.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assets, searchTerm, filterStatus, filterType, employees]);

  const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);

      const result = await assetApi.getAssets();

      if (result.data) {
        setAssets(result.data as unknown as Asset[]);
      } else {
        setError(result.error || "Failed to load assets");
        setAssets([]);
      }

      setLoading(false);
    };

    fetchAssets();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      const result = await employeeApi.getEmployees();

      if (result.data && Array.isArray(result.data)) {
        setEmployees(result.data as Employee[]);
      } else {
        setEmployees([]);
      }

      setLoadingEmployees(false);
    };

    fetchEmployees();
  }, []);

  const handleOpenDialog = (asset?: Asset) => {
    if (asset) {
      if (loadingEmployees || employees.length === 0) {
        showToast.error("Employees are still loading. Please try again in a moment.");
        return;
      }

      setEditingId(asset.id);
      setFormData({
        name: asset.name || "",
        type: ((asset.type || "laptop").toLowerCase() as AssetType),
        serial: asset.serial || "",
        assignedEmployee: asset.assignedEmployee || "",
        issueDate: asset.issueDate || "",
        status: ((asset.status || "active").toLowerCase() as AssetStatus),
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
      showToast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type.toUpperCase(),
        serial_number: formData.serial,
        status: formData.status.toUpperCase(),
        location: formData.location || null,
        value: formData.value || null,
        description: formData.description || null,
        issue_date: formData.issueDate || null,
        assigned_employee_id: formData.assignedEmployee ? formData.assignedEmployee : null,
      };

      const result = editingId
        ? await assetApi.updateAsset(editingId, payload)
        : await assetApi.createAsset(payload);

      if (result.data || result.success) {
        const fetchResult = await assetApi.getAssets();
        if (fetchResult.data) setAssets(fetchResult.data as unknown as Asset[]);
        handleCloseDialog();
        showToast.success(editingId ? "Asset updated successfully!" : "Asset created successfully!");
      } else {
        showToast.error(result.error || "Save failed");
      }
    } catch (saveError) {
      console.error("Error saving asset:", saveError);
      showToast.error("Failed to save asset");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setAssetToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    setDeleting(true);
    try {
      const result = await assetApi.deleteAsset(assetToDelete);

      if (result.success) {
        const fetchResult = await assetApi.getAssets();
        if (fetchResult.data) {
          setAssets(fetchResult.data as unknown as Asset[]);
        } else {
          setAssets((prev) => prev.filter((asset) => asset.id !== assetToDelete));
        }

        showToast.success("Asset deleted successfully!");
        setAssetToDelete(null);
        setIsDeleteDialogOpen(false);
      } else {
        showToast.error(result.error || "Failed to delete asset");
      }
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
      showToast.error("Failed to delete asset. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    if (exporting) return;
    if (filteredAssets.length === 0) {
      showToast.error("No assets available to export");
      return;
    }

    setExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Assets", {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      const headers = [
        "Asset ID",
        "Asset Name",
        "Type",
        "Serial Number",
        "Assigned To",
        "Status",
        "Location",
        "Issue Date",
        "Value",
        "Description",
      ];

      const rows = filteredAssets.map((asset) => [
        assetIdOf(asset),
        asset.name || "-",
        getAssetTypeLabel(asset.type),
        asset.serial || "-",
        getAssignedEmployeeLabel(asset),
        getStatusLabel(asset.status),
        asset.location || "-",
        asset.issueDate && /^\d{4}-\d{2}-\d{2}/.test(asset.issueDate)
          ? new Date(`${asset.issueDate.slice(0, 10)}T00:00:00Z`)
          : asset.issueDate || "-",
        asset.value ?? "",
        asset.description || "",
      ]);

      sheet.addRow(headers);
      sheet.addRows(rows);
      const widths = [16, 28, 18, 25, 30, 18, 26, 18, 18, 50];
      sheet.columns.forEach((column, index) => { column.width = widths[index]; });
      sheet.autoFilter = "A1:J1";
      sheet.getColumn(8).numFmt = "dd-mm-yyyy";
      sheet.getColumn(9).numFmt = "#,##0.00";
      sheet.eachRow((row, rowNumber) => {
        row.height = rowNumber === 1 ? 30 : 36;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { name: "Calibri", size: 11, bold: rowNumber === 1,
            color: { argb: rowNumber === 1 ? "FFFFFFFF" : "FF1E293B" } };
          cell.fill = { type: "pattern", pattern: "solid",
            fgColor: { argb: rowNumber === 1 ? "FF11966F" : rowNumber % 2 === 0 ? "FFE9FBF5" : "FFFFFFFF" } };
          cell.alignment = { vertical: "middle", wrapText: true };
          cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
        });
        if (rowNumber > 1) {
          const status = filteredAssets[rowNumber - 2].status;
          const colors = status === "active" ? ["FFD1FAE5", "FF047857"]
            : status === "maintenance" ? ["FFFEF3C7", "FF92400E"]
            : status === "damaged" || status === "disposed" ? ["FFFEE2E2", "FFB91C1C"]
            : ["FFF1F5F9", "FF475569"];
          const cell = row.getCell(6);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors[0] } };
          cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: colors[1] } };
        }
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute("download", `assets-${dateStamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success("Assets exported as Excel");
    } catch (error) {
      console.error("Asset export failed", error);
      showToast.error("Unable to export assets. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={`${assetShellClass} flex items-center justify-center`}>
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#17c491]" />
            <p className="mt-3 text-sm text-slate-500">Loading assets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`${assetShellClass} flex items-center justify-center px-4`}>
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={assetShellClass}>
        <div className={`${assetContainerClass} space-y-4`}>
          <AssetPageHeader
            icon={<Package className="h-5 w-5" />}
            title="Asset Management"
            description="Manage company assets, assignments, maintenance status, and inventory value."
            action={
              canCreateAsset ? (
                <Button onClick={() => handleOpenDialog()} className={`gap-2 ${assetPrimaryButtonClass}`}>
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              ) : null
            }
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <AssetStatCard label="Total Assets" value={assets.length} icon={<Boxes className="h-5 w-5" />} />
            <AssetStatCard label="Active" value={assets.filter((asset) => asset.status === "active").length} icon={<CheckCircle2 className="h-5 w-5" />} />
            <AssetStatCard label="Maintenance" value={assets.filter((asset) => asset.status === "maintenance").length} icon={<Wrench className="h-5 w-5" />} tone="amber" />
            <AssetStatCard label="Total Value" value={`Rs. ${totalValue.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
          </div>

          <Card className={assetCardClass}>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
                  <Label htmlFor="status" className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger id="status" className={`mt-1.5 ${assetInputClass}`}>
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
                  <Label htmlFor="type" className="text-xs">Asset Type</Label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger id="type" className={`mt-1.5 ${assetInputClass}`}>
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
                  <Button type="button" variant="outline" onClick={handleExportExcel} disabled={exporting} className={`w-full gap-2 ${assetOutlineButtonClass}`}>
                    <Download className="h-4 w-4" />
                    {exporting ? "Exporting..." : "Export Excel"}
                  </Button>
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
                  <div className="space-y-3 p-4 md:hidden">
                    {filteredAssets.map((asset) => (
                      <div key={asset.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-slate-500">{assetIdOf(asset)}</p>
                            <h3 className="mt-1 truncate text-base font-semibold text-slate-950"><InlineEdit value={asset.name} label="name" module="assets" submodule="list" type="text" required   onSave={(value) => saveInline(assetApi.updateAsset(asset.id, { ...{ name: asset.name, type: asset.type.toUpperCase(), serial_number: asset.serial, status: asset.status.toUpperCase(), location: asset.location || null, value: asset.value || null, description: asset.description || null, issue_date: asset.issueDate || null, assigned_employee_id: asset.assignedEmployee || null }, name: String(value) }), async () => { const result = await assetApi.getAssets(); if (result.error) throw new Error(result.error); if (result.data) setAssets(result.data as unknown as Asset[]); })} /></h3>
                            <p className="mt-1 font-mono text-xs text-slate-500"><InlineEdit value={asset.serial} label="serial" module="assets" submodule="list" type="text" required   onSave={(value) => saveInline(assetApi.updateAsset(asset.id, { ...{ name: asset.name, type: asset.type.toUpperCase(), serial_number: asset.serial, status: asset.status.toUpperCase(), location: asset.location || null, value: asset.value || null, description: asset.description || null, issue_date: asset.issueDate || null, assigned_employee_id: asset.assignedEmployee || null }, serial_number: String(value) }), async () => { const result = await assetApi.getAssets(); if (result.error) throw new Error(result.error); if (result.data) setAssets(result.data as unknown as Asset[]); })} /></p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleOpenDialog(asset)} className="rounded-lg p-2 text-[#11966f] hover:bg-[#e9fbf5]" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(asset.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Type</p>
                            <p className="mt-1 font-medium text-slate-950">{getAssetTypeLabel(asset.type)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Assigned To</p>
                            <p className="mt-1 truncate font-medium text-slate-950">{getAssignedEmployeeLabel(asset)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Status</p>
                            <span className={`mt-1 inline-block rounded border px-2 py-1 text-xs ${statusBadgeClass(asset.status)}`}>
                              {getStatusLabel(asset.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Value</p>
                            <p className="mt-1 font-semibold text-slate-950">
                              {asset.value > 0 ? `Rs. ${asset.value.toLocaleString()}` : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <th className="w-24 px-4 py-3 text-left font-semibold">ID</th>
                          <th className="min-w-48 px-4 py-3 text-left font-semibold">Asset Name</th>
                          <th className="w-28 px-4 py-3 text-left font-semibold">Type</th>
                          <th className="min-w-36 px-4 py-3 text-left font-semibold">Serial</th>
                          <th className="min-w-48 px-4 py-3 text-left font-semibold">Assigned To</th>
                          <th className="w-32 px-4 py-3 text-center font-semibold">Status</th>
                          <th className="w-36 px-4 py-3 text-right font-semibold">Value</th>
                          <th className="w-24 px-4 py-3 text-center font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.map((asset) => (
                          <tr key={asset.id} className="border-b border-slate-100 transition-colors hover:bg-[#e9fbf5]/60">
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{assetIdOf(asset)}</td>
                            <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-950"><InlineEdit value={asset.name} label="name" module="assets" submodule="list" type="text" required   onSave={(value) => saveInline(assetApi.updateAsset(asset.id, { ...{ name: asset.name, type: asset.type.toUpperCase(), serial_number: asset.serial, status: asset.status.toUpperCase(), location: asset.location || null, value: asset.value || null, description: asset.description || null, issue_date: asset.issueDate || null, assigned_employee_id: asset.assignedEmployee || null }, name: String(value) }), async () => { const result = await assetApi.getAssets(); if (result.error) throw new Error(result.error); if (result.data) setAssets(result.data as unknown as Asset[]); })} /></td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="inline-block rounded border border-[#17c491]/20 bg-[#e9fbf5] px-2 py-1 text-xs font-medium text-[#11966f]">
                                {getAssetTypeLabel(asset.type)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600"><InlineEdit value={asset.serial} label="serial" module="assets" submodule="list" type="text" required   onSave={(value) => saveInline(assetApi.updateAsset(asset.id, { ...{ name: asset.name, type: asset.type.toUpperCase(), serial_number: asset.serial, status: asset.status.toUpperCase(), location: asset.location || null, value: asset.value || null, description: asset.description || null, issue_date: asset.issueDate || null, assigned_employee_id: asset.assignedEmployee || null }, serial_number: String(value) }), async () => { const result = await assetApi.getAssets(); if (result.error) throw new Error(result.error); if (result.data) setAssets(result.data as unknown as Asset[]); })} /></td>
                            <td className="max-w-xs truncate px-4 py-3 text-slate-700">{getAssignedEmployeeLabel(asset)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-center">
                              <span className={`inline-block rounded border px-2 py-1 text-xs ${statusBadgeClass(asset.status)}`}>
                                {getStatusLabel(asset.status)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
                              {asset.value > 0 ? `Rs. ${asset.value.toLocaleString()}` : "-"}
                            </td>
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update asset details" : "Add a new asset to your inventory"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 gap-4 pr-2 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  placeholder="e.g., Dell XPS 13"
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>

              <div>
                <Label htmlFor="asset-type">Asset Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleFormChange("type", value)}>
                  <SelectTrigger id="asset-type" className={`mt-1 ${assetInputClass}`}>
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
                  onChange={(event) => handleFormChange("serial", event.target.value)}
                  placeholder="e.g., SN-123456"
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>

              <div>
                <Label htmlFor="assignedEmployee">Assigned Employee</Label>
                <Select
                  value={formData.assignedEmployee || "none"}
                  onValueChange={(value) => handleFormChange("assignedEmployee", value === "none" ? "" : value)}
                  disabled={loadingEmployees}
                >
                  <SelectTrigger id="assignedEmployee" className={`mt-1 ${assetInputClass}`}>
                    <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(employees || []).map((employee: any) => {
                      const fullName = `${employee.first_name || employee.firstName || employee.name || ""} ${employee.last_name || employee.lastName || ""}`.trim();
                      const department = employee.department || employee.dept || employee.department_name || "";
                      return (
                        <SelectItem key={employee.id || employee._id} value={String(employee.id || employee._id || "")}>
                          {fullName || "Employee"} {department ? `(${department})` : ""}
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
                  onChange={(event) => handleFormChange("issueDate", event.target.value)}
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleFormChange("status", value)}>
                  <SelectTrigger id="asset-status" className={`mt-1 ${assetInputClass}`}>
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
                  onChange={(event) => handleFormChange("location", event.target.value)}
                  placeholder="e.g., Office - Desk 1"
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>

              <div>
                <Label htmlFor="value">Value (Rs.)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(event) => handleFormChange("value", parseFloat(event.target.value) || 0)}
                  placeholder="0"
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                  placeholder="Add any notes about this asset..."
                  rows={5}
                  className={`mt-1 ${assetInputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleCloseDialog} className={assetOutlineButtonClass}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className={assetPrimaryButtonClass}>
              {isSaving ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
