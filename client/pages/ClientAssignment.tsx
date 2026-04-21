import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Trash2, Search, Settings, Calendar, Zap, MapPin, Navigation, Building, Users, Mail, Phone, Loader2, ChevronDown, Download, FileSpreadsheet, FileUp } from "lucide-react";
import { clientApi, Client, Employee } from "@/components/helper/client/client";
import { getCurrentLocation, getAddressFromCoordinates } from "@/components/helper/clientAttendance/clientAttendance";
import { showToast } from "@/utils/toast";
import { isOptionalPhoneValid, isValidEmail, normalizeEmail } from "@/lib/validation";

export default function ClientAssignment() {
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);
  const [coordinatesInput, setCoordinatesInput] = useState("");
  const [excelData, setExcelData] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsResult, employeesResult] = await Promise.all([
        clientApi.getClients(),
        clientApi.getEmployeesForAssignment()
      ]);

      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      if (employeesResult.data) {
        setEmployees(employeesResult.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      const address = await getAddressFromCoordinates(location.latitude, location.longitude);
      setCurrentLocation({
        ...location,
        address
      });
      setCoordinatesInput(`${location.latitude}, ${location.longitude}`);
      setFormData({
        ...formData,
        geo_latitude: location.latitude,
        geo_longitude: location.longitude,
        address: address || formData.address
      });
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  // Filter clients
  const filteredClients = useMemo(
    () => clients.filter((client) =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [clients, searchTerm]
  );

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        ...item,
        assigned_employee_ids:
          Array.isArray(item.assigned_employee_ids) && item.assigned_employee_ids.length
            ? item.assigned_employee_ids
            : item.assigned_to
              ? [item.assigned_to]
              : [],
      });
      setCoordinatesInput(
        item.geo_latitude && item.geo_longitude
          ? `${item.geo_latitude}, ${item.geo_longitude}`
          : ""
      );
    } else {
      setEditingId(null);
      setFormData({ geo_radius: 50, assigned_employee_ids: [] }); // Default radius for new clients
      setCoordinatesInput("");
    }
    setIsEmployeePickerOpen(false);
    setCurrentLocation(null); // Reset location
    setLocationLoading(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_name) {
      showToast.error("Client name is required");
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      showToast.error("Please enter a valid email address");
      return;
    }
    if (!isOptionalPhoneValid(formData.phone)) {
      showToast.error("Phone number must be 10 digits and start with 6, 7, 8, or 9");
      return;
    }

    setSaving(true);
    try {
      let result;
      const normalizedAssignedEmployeeIds = Array.isArray(formData.assigned_employee_ids)
        ? formData.assigned_employee_ids
        : [];

      const payload = {
        ...formData,
        email: formData.email ? normalizeEmail(formData.email) : "",
        phone: formData.phone ? formData.phone.trim() : "",
        assigned_to: normalizedAssignedEmployeeIds[0] ?? null,
        assigned_employee_ids: normalizedAssignedEmployeeIds,
      };
      if (editingId) {
        result = await clientApi.updateClient(editingId, payload);
      } else {
        result = await clientApi.createClient(payload);
      }

      if (result.data || result.success) {
        await clientApi.getClients().then(res => {
          if (res.data) setClients(res.data);
        });
      } else if (result.error) {
        showToast.error(result.error);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      showToast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await clientApi.deleteClient(deleteId!);
      if (result.success) {
        await clientApi.getClients().then(res => {
          if (res.data) setClients(res.data);
        });
      }

      if (result.error) {
        showToast.error(result.error);
      }

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting:", error);
      showToast.error("Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getAssignedEmployeeNames = (client: Client) => {
    if (Array.isArray(client.assigned_employees) && client.assigned_employees.length) {
      return client.assigned_employees
        .map((employee) => `${employee.first_name} ${employee.last_name}`)
        .join(", ");
    }

    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    return "Unassigned";
  };

  const toggleAssignedEmployee = (employeeId: number, checked: boolean) => {
    const currentIds = Array.isArray(formData.assigned_employee_ids)
      ? formData.assigned_employee_ids
      : [];

    setFormData({
      ...formData,
      assigned_employee_ids: checked
        ? [...new Set([...currentIds, employeeId])]
        : currentIds.filter((id: number) => id !== employeeId),
    });
  };

  const handleCoordinatesChange = (value: string) => {
    setCoordinatesInput(value);

    const [latitudeRaw, longitudeRaw] = value.split(",").map((item) => item.trim());
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    setFormData({
      ...formData,
      geo_latitude: value && Number.isFinite(latitude) ? latitude : undefined,
      geo_longitude: value && Number.isFinite(longitude) ? longitude : undefined,
    });
  };

  const selectedEmployeeIds = Array.isArray(formData.assigned_employee_ids)
    ? formData.assigned_employee_ids
    : [];

  const selectedEmployees = employees.filter((employee) =>
    selectedEmployeeIds.includes(employee.id)
  );

  const selectedEmployeesSummary = selectedEmployees.length
    ? selectedEmployees.map((employee) => employee.first_name).join(", ")
    : "No employees selected";

  // Export all clients to Excel
  const handleExportToExcel = () => {
    if (clients.length === 0) {
      showToast.error('No clients to export');
      return;
    }

    const exportData = clients.map(client => ({
      'Client ID': client.client_id || '',
      'Client Name': client.client_name || '',
      'Contact Person': client.contact_person || '',
      'Email': client.email || '',
      'Phone': client.phone || '',
      'Address': client.address || '',
      'Status': client.status || '',
      'Assigned Employees': getAssignedEmployeeNames(client)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `Clients_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast.success(`Exported ${clients.length} clients to Excel`);
  };

  // Download empty template with headers only
  const handleDownloadTemplate = () => {
    const templateData = [{
      'Client ID': '',
      'Client Name': '',
      'Contact Person': '',
      'Email': '',
      'Phone': '',
      'Address': '',
      'Status': 'active',
      'Assigned Employees': ''
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Template');
    XLSX.writeFile(wb, 'Client_Import_Template.xlsx');
    showToast.success('Template downloaded successfully');
  };

  // Import clients from Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xls") && !lowerName.endsWith(".xlsx")) {
      showToast.error("Please upload a valid Excel file (.xls or .xlsx)");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error("No worksheet found in the uploaded Excel file");
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
      const nonEmptyRows = rows.filter((row) =>
        Object.values(row).some((value) => String(value ?? "").trim() !== "")
      );

      if (!nonEmptyRows.length) {
        throw new Error("Excel file is empty");
      }

      // Process each row and create clients
      let successCount = 0;
      const failures: string[] = [];

      for (let i = 0; i < nonEmptyRows.length; i++) {
        const row = nonEmptyRows[i];
        const rowNumber = i + 2;

        const clientName = String(row['Client Name'] || '').trim();
        if (!clientName) {
          failures.push(`Row ${rowNumber}: Client Name is required`);
          continue;
        }

        const statusValue = String(row['Status'] || 'active').toLowerCase().trim();
        const payload = {
          client_name: clientName,
          client_id: String(row['Client ID'] || '').trim() || undefined,
          contact_person: String(row['Contact Person'] || '').trim() || undefined,
          email: String(row['Email'] || '').trim() || undefined,
          phone: String(row['Phone'] || '').trim() || undefined,
          address: String(row['Address'] || '').trim() || undefined,
          status: (statusValue === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
          geo_radius: 50,
          assigned_employee_ids: []
        };

        try {
          const result = await clientApi.createClient(payload);
          if (result.data || result.success) {
            successCount++;
          } else {
            failures.push(`Row ${rowNumber}: ${result.error || 'Failed to create client'}`);
          }
        } catch (err) {
          failures.push(`Row ${rowNumber}: Failed to create client`);
        }
      }

      // Refresh clients list
      const clientsResult = await clientApi.getClients();
      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      if (successCount > 0 && failures.length === 0) {
        showToast.success(`${successCount} client(s) imported successfully`);
      } else if (successCount > 0) {
        showToast.success(`${successCount} imported, ${failures.length} failed`);
        console.error('Import failures:', failures);
      } else {
        showToast.error(failures.slice(0, 3).join(' | ') || 'Failed to import clients');
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to import Excel file";
      showToast.error(message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading clients...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Client Assignment
          </h1>
          <p className="text-muted-foreground mt-2">Manage clients and assign them to employees</p>
        </div>

        {/* Search and Add Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>

              {/* Excel Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  className="gap-2"
                  disabled={clients.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${client.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>
                <CardDescription>Client ID: {client.client_id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{client.contact_person}</span>
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.email}</span>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.phone}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Assigned to</p>
                        <p className="text-sm font-medium">
                          {getAssignedEmployeeNames(client)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDialog(client)}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                          disabled={saving || deleting}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                          disabled={saving || deleting}
                        >
                          {deleting && deleteId === client.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={saving || deleting}>
                  <Plus className="w-4 h-4" />
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Client" : "Add New Client"}
            </DialogTitle>
            <DialogDescription>
              {editingId ? "Update client information" : "Enter client details to add a new client"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input
                  value={formData.client_name || ""}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || "active"} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Assign Employees</Label>
              <Collapsible
                open={isEmployeePickerOpen}
                onOpenChange={setIsEmployeePickerOpen}
                className="mt-2 rounded-lg border bg-background"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {selectedEmployees.length} employee{selectedEmployees.length === 1 ? "" : "s"} selected
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {selectedEmployeesSummary}
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isEmployeePickerOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t px-3 py-3">
                  <div className="mb-3 flex items-center justify-between">
                    {/* <p className="text-sm text-muted-foreground">
                      Client-ku multiple employees assign pannalaam
                    </p> */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, assigned_employee_ids: [] })}
                    >
                      Clear
                    </Button>
                  </div>

                  {selectedEmployees.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedEmployees.map((employee) => (
                        <span
                          key={employee.id}
                          className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          {employee.first_name} {employee.last_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {employees.map((employee) => {
                      const checked = selectedEmployeeIds.includes(employee.id);

                      return (
                        <label
                          key={employee.id}
                          className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => toggleAssignedEmployee(employee.id, Boolean(value))}
                          />
                          <div className="text-sm">
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-muted-foreground">
                              {employee.employee_id}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Geo-Fence Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Geo-Fence Settings</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Client Location (GPS)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentPosition}
                      disabled={locationLoading}
                      className="flex items-center gap-2"
                    >
                      {locationLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      Get Current Location
                    </Button>
                  </div>

                  {currentLocation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Current GPS Location:</div>
                      <div className="text-sm">
                        <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                        <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
                        <div className="text-muted-foreground">{currentLocation.address}</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2">
                    <Label>Coordinates</Label>
                    <Input
                      value={coordinatesInput}
                      onChange={(e) => handleCoordinatesChange(e.target.value)}
                      placeholder="e.g., 13.0827, 80.2707"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: latitude, longitude
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Geo-Fence Radius (meters)</Label>
                  <Input
                    type="number"
                    value={formData.geo_radius || 50}
                    onChange={(e) => setFormData({ ...formData, geo_radius: parseInt(e.target.value) || 50 })}
                    min="10"
                    max="500"
                    placeholder="50"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Employees can check-in within this radius from client location (default: 50m)
                  </p>
                </div>

                {(formData.geo_latitude && formData.geo_longitude) && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Geo-Fence Active</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Client attendance will be restricted to {formData.geo_radius || 50}m radius
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingId ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingId ? "Update" : "Create"} Client</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
