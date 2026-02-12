import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  LogOut, 
  LogIn, 
  Building, 
  Calendar,
  Timer,
  FileText,
  Loader2
} from "lucide-react";
import { clientApi, Client } from "@/components/helper/client/client";
import { clientAttendanceApi, type ClientAttendance, CheckInData, CheckOutData, getCurrentLocation, getAddressFromCoordinates } from "@/components/helper/clientAttendance/clientAttendance";
import { showToast } from "@/utils/toast";

export default function ClientAttendance() {
  const [clients, setClients] = useState<Client[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<ClientAttendance[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<ClientAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsResult, attendanceResult, activeResult] = await Promise.all([
        clientApi.getClients(),
        clientAttendanceApi.getTodayAttendance(),
        clientAttendanceApi.getActiveCheckIn()
      ]);

      if (clientsResult.data) {
        // Filter clients assigned to current user
        const myClients = clientsResult.data.filter(client => 
          client.assigned_to && client.assigned_to !== null
        );
        setClients(myClients);
      }
      
      if (attendanceResult.data) {
        setTodayAttendance(attendanceResult.data);
      }
      
      if (activeResult.data) {
        setActiveCheckIn(activeResult.data);
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
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedClient || !currentLocation) {
      showToast.error("Please select a client and enable location");
      return;
    }

    try {
      // Check geo-fence first
      const geoFenceResult = await clientAttendanceApi.checkGeoFence(
        selectedClient.id,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (!geoFenceResult.success) {
        showToast.error("Error checking geo-fence: " + geoFenceResult.error);
        return;
      }

      if (!geoFenceResult.withinFence) {
        showToast.error(geoFenceResult.message || "You are outside the client's geo-fence area");
        return;
      }

      const checkInData: CheckInData = {
        clientId: selectedClient.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location: currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`,
        notes: checkInNotes
      };

      const result = await clientAttendanceApi.checkIn(checkInData);
      
      if (result.success) {
        await loadData();
        setIsCheckInDialogOpen(false);
        setSelectedClient(null);
        setCheckInNotes("");
        setCurrentLocation(null);
        showToast.success("Checked in successfully!");
      } else if (result.error) {
        showToast.error(result.error);
      }
    } catch (error: any) {
      console.error("Error checking in:", error);
      if (error.response?.data?.error) {
        showToast.error(error.response.data.error);
      } else {
        showToast.error("Failed to check in. Please try again.");
      }
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckIn || !currentLocation) {
      showToast.error("Location is required for check out");
      return;
    }

    try {
      // Check geo-fence first
      const geoFenceResult = await clientAttendanceApi.checkGeoFence(
        activeCheckIn.client_id,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (!geoFenceResult.success) {
        showToast.error("Error checking geo-fence: " + geoFenceResult.error);
        return;
      }

      if (!geoFenceResult.withinFence) {
        showToast.error(geoFenceResult.message || "You are outside the client's geo-fence area");
        return;
      }

      const checkOutData: CheckOutData = {
        attendanceId: activeCheckIn.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location: currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`,
        notes: checkOutNotes,
        workCompleted: workCompleted
      };

      const result = await clientAttendanceApi.checkOut(activeCheckIn.id, checkOutData);
      
      if (result.success) {
        await loadData();
        setIsCheckOutDialogOpen(false);
        setCheckOutNotes("");
        setWorkCompleted("");
        setCurrentLocation(null);
        showToast.success("Checked out successfully!");
      } else if (result.error) {
        showToast.error(result.error);
      }
    } catch (error: any) {
      console.error("Error checking out:", error);
      if (error.response?.data?.error) {
        showToast.error(error.response.data.error);
      } else {
        showToast.error("Failed to check out. Please try again.");
      }
    }
  };

  const openCheckInDialog = async () => {
    try {
      await getCurrentPosition();
      setIsCheckInDialogOpen(true);
    } catch (error) {
      showToast.error("Unable to get your location. Please enable location services.");
    }
  };

  const openCheckOutDialog = async () => {
    try {
      await getCurrentPosition();
      setIsCheckOutDialogOpen(true);
    } catch (error) {
      showToast.error("Unable to get your location. Please enable location services.");
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading client attendance...</div>
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
            Client Attendance
          </h1>
          <p className="text-muted-foreground mt-2">Check in and out from client locations with geo-tagging</p>
        </div>

        {/* Active Check-in Status */}
        {activeCheckIn && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Timer className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Currently Checked In</h3>
                    <p className="text-green-600">{activeCheckIn.client_name}</p>
                    <p className="text-sm text-green-500">
                      Since {formatTime(activeCheckIn.check_in_time)}
                    </p>
                  </div>
                </div>
                <Button onClick={openCheckOutDialog} className="bg-red-600 hover:bg-red-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Check In</h3>
                    <p className="text-sm text-muted-foreground">Start work at client location</p>
                  </div>
                </div>
                <Button 
                  onClick={openCheckInDialog} 
                  disabled={!!activeCheckIn}
                  className="bg-primary hover:bg-primary/90"
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  Check In
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Check Out</h3>
                    <p className="text-sm text-muted-foreground">Complete work at client location</p>
                  </div>
                </div>
                <Button 
                  onClick={openCheckOutDialog} 
                  disabled={!activeCheckIn}
                  variant="outline"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Your client visits for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAttendance.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance records today</h3>
                <p className="text-muted-foreground">Check in to a client to start tracking your time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAttendance.map((attendance) => (
                  <div key={attendance.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{attendance.client_name}</h4>
                          <Badge variant={attendance.check_out_time ? "default" : "secondary"}>
                            {attendance.check_out_time ? "Completed" : "Active"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <LogIn className="w-4 h-4 text-green-600" />
                            <span>Check In: {formatTime(attendance.check_in_time)}</span>
                          </div>
                          
                          {attendance.check_out_time && (
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4 text-red-600" />
                              <span>Check Out: {formatTime(attendance.check_out_time)}</span>
                            </div>
                          )}
                          
                          {attendance.duration_minutes && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>Duration: {formatDuration(attendance.duration_minutes)}</span>
                            </div>
                          )}
                        </div>

                        {attendance.check_in_location && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>Location: {attendance.check_in_location}</span>
                          </div>
                        )}

                        {attendance.work_completed && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-sm text-blue-800">Comments for Admin:</span>
                            </div>
                            <p className="text-sm text-gray-700">{attendance.work_completed}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check In Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check In to Client</DialogTitle>
            <DialogDescription>
              Select a client and add notes for your check-in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Client *</Label>
              <Select value={selectedClient?.id?.toString() || ""} onValueChange={(val) => {
                const client = clients.find(c => c.id === parseInt(val));
                setSelectedClient(client || null);
              }}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentLocation && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">Current Location:</span>
                </div>
                <p className="text-sm">{currentLocation.address}</p>
              </div>
            )}

            <div>
              <Label>Check-in Notes</Label>
              <Textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                placeholder="Add any notes about your visit..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={!selectedClient || !currentLocation}>
              Check In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check Out from Client</DialogTitle>
            <DialogDescription>
              Complete your work and add notes for check-out
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {activeCheckIn && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{activeCheckIn.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  Checked in at {formatTime(activeCheckIn.check_in_time)}
                </p>
              </div>
            )}

            {currentLocation && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">Current Location:</span>
                </div>
                <p className="text-sm">{currentLocation.address}</p>
              </div>
            )}

            <div>
              <Label>Check-out Notes</Label>
              <Textarea
                value={checkOutNotes}
                onChange={(e) => setCheckOutNotes(e.target.value)}
                placeholder="Add any notes about your departure..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label>Comments for Admin *</Label>
              <Textarea
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                placeholder="Please provide detailed comments about the work completed, client feedback, next steps, or any issues encountered..."
                className="mt-2 border-2 border-blue-200 focus:border-blue-400"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These comments will be visible to administrators for review and follow-up
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCheckOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckOut} disabled={!currentLocation || !workCompleted.trim()}>
              Check Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
