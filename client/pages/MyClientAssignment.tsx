import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Building, Phone, Mail, Users, Calendar } from "lucide-react";
import { clientApi, Client } from "@/components/helper/client/client";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";

export default function MyClientAssignment() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { user } = useAuth();

  // Load data on component mount
  useEffect(() => {
    loadMyClients();
  }, []);

  const loadMyClients = async () => {
    setLoading(true);
    try {
      const result = await clientApi.getClients();
      
      if (result.data) {
        // Role-based filtering: Admin sees all clients, Employee sees only assigned clients
        let myClients: Client[];
        
        if (hasRole(user, "admin")) {
          // Admin can see all clients
          myClients = result.data;
        } else {
          // Employee can only see clients assigned to them
          myClients = result.data.filter(client => 
            client.assigned_to === user?.id
          );
        }
        
        setClients(myClients);
      }
    } catch (error) {
      console.error("Error loading my clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((client) => 
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailDialogOpen(true);
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
          <div className="text-lg">Loading your clients...</div>
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
            My Clients
          </h1>
          <p className="text-muted-foreground mt-2">Manage clients assigned to you</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clients.length}</p>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {clients.filter(c => c.status === 'active').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {clients.filter(c => c.contact_person).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Contact</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadMyClients} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetails(client)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      client.status === "active"
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
                      <span className="text-muted-foreground truncate">{client.email}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{client.phone}</span>
                    </div>
                  )}

                  {client.industry && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="text-sm font-medium">{client.industry}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No clients found" : "No clients assigned to you"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Your administrator will assign clients to you"
                }
              </p>
              {!searchTerm && (
                <Button onClick={loadMyClients} variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Check for Updates
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Client Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Complete information about your assigned client
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Client Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                  <p className="text-lg font-semibold">{selectedClient.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client ID</label>
                  <p className="text-lg">{selectedClient.client_id}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClient.contact_person && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {selectedClient.contact_person}
                      </p>
                    </div>
                  )}
                  
                  {selectedClient.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {selectedClient.email}
                      </p>
                    </div>
                  )}
                  
                  {selectedClient.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {selectedClient.phone}
                      </p>
                    </div>
                  )}
                  
                  {selectedClient.industry && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Industry</label>
                      <p>{selectedClient.industry}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {selectedClient.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">{selectedClient.address}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedClient.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Assignment Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {getEmployeeName(selectedClient)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
