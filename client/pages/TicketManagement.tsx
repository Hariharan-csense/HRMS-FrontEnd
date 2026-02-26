import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Calendar, User, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: "technical" | "hr" | "finance" | "operations" | "general";
  status: "open" | "in_progress" | "resolved" | "closed";
  remarks?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TicketManagement: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "general" as "technical" | "hr" | "finance" | "operations" | "general",
    assignedTo: "procease.co",
    status: "open" as "open" | "in_progress" | "resolved" | "closed",
    remarks: ""
  });

  // Fetch tickets and users
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      const response = await ENDPOINTS.getTickets();
      
      if (response.data) {
        setTickets(response.data.data || []);
      } else {
        console.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await ENDPOINTS.getTicketUsers();
      
      if (response.data) {
        setUsers(response.data.data || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTicket = async () => {
    setIsCreatingTicket(true);
    try {
      const response = await ENDPOINTS.createTicket({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        assigned_to: formData.assignedTo || null
      });

      if (response.data) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchTickets();
      } else {
        console.error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    setIsUpdatingTicket(true);
    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        assigned_to: formData.assignedTo || null
      };
      
      // Only include remarks if it has content
      if (formData.remarks && formData.remarks.trim() !== '') {
        updateData.remarks = formData.remarks.trim();
      }
      
      console.log('Sending update data:', updateData);
      
      const response = await ENDPOINTS.updateTicket(selectedTicket.id, updateData);

      if (response.data) {
        console.log('Received response:', response.data);
        
        // Update local state immediately with the updated ticket data
        if (response.data.data) {
          setTickets(prevTickets => 
            prevTickets.map(ticket => 
              ticket.id === selectedTicket.id 
                ? { ...ticket, ...response.data.data }
                : ticket
            )
          );
        }
        
        setIsEditDialogOpen(false);
        resetForm();
        // Still fetch tickets to ensure we have the latest data from server
        fetchTickets();
      } else {
        console.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await ENDPOINTS.deleteTicket(selectedTicket.id);

      if (response.data) {
        setIsDeleteDialogOpen(false);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        console.error('Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      category: "general",
      assignedTo: "procease.co",
      status: "open",
      remarks: ""
    });
    setSelectedTicket(null);
  };

  const openEditDialog = (ticket: Ticket) => {
    console.log('Opening edit dialog with ticket:', ticket);
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo?.id || "procease.co",
      status: ticket.status,
      remarks: ticket.remarks || ""
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDeleteDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tickets...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ticket Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage and track support tickets</p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#17c491] hover:bg-[#17c491]/90 text-white w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 focus:border-[#17c491] focus:ring-[#17c491]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            <CardDescription>Manage and track all support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first ticket to get started"}
                </p>
                {!searchTerm && statusFilter === "all" && priorityFilter === "all" && categoryFilter === "all" && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-[#17c491] hover:bg-[#17c491]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{ticket.ticketNumber}</span>
                          <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-base sm:text-lg">{ticket.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{ticket.description}</p>
                        {ticket.remarks && (
                          <div className="mt-2 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Remarks:</p>
                            <p className="text-xs sm:text-sm text-blue-700 line-clamp-2">{ticket.remarks}</p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">Created by {ticket.createdBy.name}</span>
                          </div>
                          {ticket.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">Assigned to {ticket.assignedTo.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(ticket)} className="flex-1 sm:flex-initial">
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Edit</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(ticket)} className="flex-1 sm:flex-initial">
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] mx-4">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket to track issues and requests.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ticket title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue or request in detail"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select value="procease.co" onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procease.co">
                    procease.co
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket} 
              disabled={!formData.title || !formData.description || isCreatingTicket}
              className="bg-[#17c491] hover:bg-[#17c491]/90 text-white disabled:opacity-50"
            >
              {isCreatingTicket ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] mx-4">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update the ticket details and status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ticket title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue or request in detail"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-assignedTo">Assign To</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user to assign (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTicket} 
              disabled={!formData.title || !formData.description || isUpdatingTicket}
              className="bg-[#17c491] hover:bg-[#17c491]/90 text-white disabled:opacity-50"
            >
              {isUpdatingTicket ? "Updating..." : "Update Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket "{selectedTicket?.title}" and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700">
              Delete Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default TicketManagement;
