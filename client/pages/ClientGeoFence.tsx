import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Navigation
} from "lucide-react";
import { clientApi, Client } from "@/components/helper/client/client";
import { getCurrentLocation, getAddressFromCoordinates } from "@/components/helper/clientAttendance/clientAttendance";
import { showToast } from "@/utils/toast";

export default function ClientGeoFence() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [geoRadius, setGeoRadius] = useState(50);

  // Load data on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await clientApi.getClients();
      
      if (result.data) {
        setClients(result.data);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
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
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSetGeoFence = async () => {
    if (!selectedClient || !currentLocation) {
      showToast.error("Please select a client and enable location");
      return;
    }

    try {
      const response = await fetch(`/api/geo-fence/client/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: geoRadius
        })
      });

      const result = await response.json();

      if (result.success) {
        await loadClients();
        setIsDialogOpen(false);
        setSelectedClient(null);
        setCurrentLocation(null);
        setGeoRadius(50);
        showToast.success("Geo-fence set successfully!");
      } else {
        showToast.error(result.error || "Failed to set geo-fence");
      }
    } catch (error) {
      console.error("Error setting geo-fence:", error);
      showToast.error("Failed to set geo-fence. Please try again.");
    }
  };

  const handleOpenDialog = async (client: Client) => {
    setSelectedClient(client);
    try {
      await getCurrentPosition();
      setIsDialogOpen(true);
    } catch (error) {
      showToast.error("Unable to get your location. Please enable location services.");
    }
  };

  const getGeoFenceStatus = (client: Client) => {
    if (!client.geo_latitude || !client.geo_longitude) {
      return { status: 'disabled', color: 'gray', icon: XCircle, text: 'No Geo-Fence' };
    }
    return { status: 'enabled', color: 'green', icon: CheckCircle, text: 'Geo-Fence Active' };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading client geo-fences...</div>
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
            <MapPin className="w-8 h-8 text-primary" />
            Client Geo-Fence Management
          </h1>
          <p className="text-muted-foreground mt-2">Set up geo-fence boundaries for client locations (50m default radius)</p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">Geo-Fence Information</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Employees can only check-in/check-out within the specified radius (default: 50 meters) 
                  from the client location. This ensures attendance is marked only when employees are 
                  actually at the client site.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => {
            const fenceStatus = getGeoFenceStatus(client);
            const StatusIcon = fenceStatus.icon;
            
            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.client_name}</CardTitle>
                      <CardDescription>Client ID: {client.client_id}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 border-${fenceStatus.color}-200 text-${fenceStatus.color}-700`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {fenceStatus.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.contact_person && (
                      <div className="text-sm">
                        <span className="font-medium">Contact:</span> {client.contact_person}
                      </div>
                    )}
                    
                    {client.geo_latitude && client.geo_longitude && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Geo-Fence Location</div>
                        <div className="text-sm">
                          <div>Lat: {Number(client.geo_latitude).toFixed(6)}</div>
                          <div>Lng: {Number(client.geo_longitude).toFixed(6)}</div>
                          <div>Radius: {client.geo_radius || 50}m</div>
                        </div>
                      </div>
                    )}

                    {client.assigned_to && (
                      <div className="text-sm">
                        <span className="font-medium">Assigned to:</span> {client.first_name && client.last_name ? `${client.first_name} ${client.last_name}` : `Employee ID: ${client.assigned_to}`}
                      </div>
                    )}

                    <Button
                      onClick={() => handleOpenDialog(client)}
                      className="w-full"
                      variant={client.geo_latitude ? "outline" : "default"}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {client.geo_latitude ? "Update Geo-Fence" : "Set Geo-Fence"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {clients.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground">Add clients first to set up geo-fences</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Geo-Fence Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Geo-Fence for Client</DialogTitle>
            <DialogDescription>
              Configure the geo-fence boundary for {selectedClient?.client_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client</label>
              <div className="p-3 bg-muted rounded-lg mt-2">
                <p className="font-medium">{selectedClient?.client_name}</p>
                <p className="text-sm text-muted-foreground">{selectedClient?.client_id}</p>
              </div>
            </div>

            {currentLocation && (
              <div>
                <label className="text-sm font-medium">Current Location</label>
                <div className="p-3 bg-muted rounded-lg mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm font-medium">Your GPS Location:</span>
                  </div>
                  <p className="text-sm">{currentLocation.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Geo-Fence Radius (meters)</label>
              <Input
                type="number"
                value={geoRadius}
                onChange={(e) => setGeoRadius(parseInt(e.target.value) || 50)}
                min="10"
                max="500"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Employees can check-in within {geoRadius} meters of this location
              </p>
            </div>

            {selectedClient?.geo_latitude && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Existing Geo-Fence</span>
                </div>
                <p className="text-sm text-yellow-700">
                  This client already has a geo-fence set. This action will update it.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSetGeoFence} 
              disabled={!currentLocation || locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Set Geo-Fence
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
