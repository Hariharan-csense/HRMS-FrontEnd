import React, { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Settings, Calendar, Zap, MapPin, Navigation, Building, Users, Mail, Phone } from "lucide-react";
import { clientApi, Client, Employee } from "@/components/helper/client/client";
import { getCurrentLocation, getAddressFromCoordinates } from "@/components/helper/clientAttendance/clientAttendance";
import { showToast } from "@/utils/toast";

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
      setFormData({
        ...formData,
        geo_latitude: location.latitude,
        geo_longitude: location.longitude
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
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData({ geo_radius: 50 }); // Default radius for new clients
    }
    setCurrentLocation(null); // Reset location
    setLocationLoading(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.client_name) {
      showToast.error("Client name is required");
      return;
    }

    try {
      let result;
      if (editingId) {
        result = await clientApi.updateClient(editingId, formData);
      } else {
        result = await clientApi.createClient(formData);
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
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
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
    }
  };

  const getEmployeeName = (client: Client) => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    return "Unassigned";
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
                          {getEmployeeName(client)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDialog(client)}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                <Button onClick={() => handleOpenDialog()} className="gap-2">
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
                <Label>Contact Person</Label>
                <Input
                  value={formData.contact_person || ""}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Input
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
              <Label>Assign to Employee</Label>
              <Select
                value={formData.assigned_to?.toString() || "unassigned"}
                onValueChange={(val) => setFormData({ ...formData, assigned_to: val === "unassigned" ? null : parseInt(val) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.geo_latitude || ""}
                        onChange={(e) => setFormData({ ...formData, geo_latitude: parseFloat(e.target.value) || undefined })}
                        placeholder="e.g., 13.0827"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.geo_longitude || ""}
                        onChange={(e) => setFormData({ ...formData, geo_longitude: parseFloat(e.target.value) || undefined })}
                        placeholder="e.g., 80.2707"
                        className="mt-2"
                      />
                    </div>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"} Client
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
