import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationsModule from "@/components/OrganizationsModule";
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Edit,
  Search,
  Building,
  BarChart3,
  Ticket,
  CreditCard,
  TrendingDown,
  DollarSign
} from "lucide-react";
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
  organization?: {
    id: string;
    name: string;
    userCount: number;
  };
}

interface Organization {
  id: string;
  name: string;
  userCount: number;
  ticketCount: number;
  resolutionRate: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  
  // Dialog states
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
  
  // Form states
  const [updateFormData, setUpdateFormData] = useState({
    status: "open" as "open" | "in_progress" | "resolved" | "closed",
    remarks: ""
  });

  // Statistics
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    resolvedTickets: 0,
    resolutionRate: 0
  });

  // Subscription Statistics
  const [subscriptionStats, setSubscriptionStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchTickets();
    fetchOrganizations();
    fetchSubscriptionStats();
  }, []);

  const fetchSubscriptionStats = async () => {
    try {
      // Fetch subscription plans
      const plansResponse = await ENDPOINTS.getAllSubscriptionPlans();
      
      // Fetch all subscriptions
      const subscriptionsResponse = await ENDPOINTS.getAllSubscriptions();

      const plans = plansResponse.data?.data || [];
      const subscriptions = subscriptionsResponse.data?.data || [];

      const activePlans = plans.filter(plan => plan.is_active).length;
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
      const trialSubscriptions = subscriptions.filter(sub => sub.status === 'trial').length;
      const expiredSubscriptions = subscriptions.filter(sub => sub.status === 'expired').length;
      
      // Calculate revenue (simplified - you might need payment data)
      const totalRevenue = subscriptions
        .filter(sub => sub.paid_amount)
        .reduce((sum: number, sub: any) => sum + parseFloat(sub.paid_amount), 0);

      setSubscriptionStats({
        totalPlans: plans.length,
        activePlans,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        monthlyRevenue: totalRevenue // Simplified
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    }
  };

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

    if (selectedOrg !== "all") {
      filtered = filtered.filter(ticket => ticket.organization?.id === selectedOrg);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, selectedOrg]);

  const fetchTickets = async () => {
    try {
      const response = await ENDPOINTS.getSuperAdminTickets();
      
      if (response.data && response.data.success) {
        const ticketsData = response.data.data || [];
        setTickets(ticketsData);
        
        // Calculate statistics
        const totalTickets = ticketsData.length;
        const resolvedTickets = ticketsData.filter(t => t.status === 'resolved').length;
        const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
        
        setStats(prev => ({
          ...prev,
          totalTickets,
          resolvedTickets,
          resolutionRate
        }));
      } else {
        console.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await ENDPOINTS.getSuperAdminStats();
      
      if (response.data && response.data.success) {
        const statsData = response.data.data;
        const orgsData = statsData.organizations || [];
        
        setOrganizations(orgsData.map(org => ({
          id: org.id,
          name: org.name,
          userCount: org.userCount,
          ticketCount: org.ticketCount,
          resolutionRate: org.resolutionRate
        })));
        
        setStats(prev => ({
          ...prev,
          totalOrganizations: statsData.totalOrganizations,
          activeOrganizations: statsData.activeOrganizations,
          totalUsers: statsData.totalUsers,
          activeUsers: statsData.activeUsers
        }));
      } else {
        console.error('Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    setIsUpdatingTicket(true);
    try {
      const response = await ENDPOINTS.updateTicket(selectedTicket.id, {
        status: updateFormData.status,
        remarks: updateFormData.remarks
      });

      if (response.data) {
        setIsUpdateDialogOpen(false);
        setSelectedTicket(null);
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

  const openUpdateDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setUpdateFormData({
      status: ticket.status,
      remarks: ticket.remarks || ""
    });
    setIsUpdateDialogOpen(true);
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
      case 'open': return { className: 'border-2', style: { backgroundColor: '#17c491', color: 'white' } };
      case 'in_progress': return { className: 'bg-purple-100 text-purple-800 border-purple-200', style: {} };
      case 'resolved': return { className: 'bg-green-100 text-green-800 border-green-200', style: {} };
      case 'closed': return { className: 'bg-gray-100 text-gray-800 border-gray-200', style: {} };
      default: return { className: 'bg-gray-100 text-gray-800 border-gray-200', style: {} };
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

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    description?: string;
    colorClass?: string;
  }> = ({ title, value, icon, trend, description, colorClass = "" }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 truncate">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">{description}</p>
            )}
            {trend && (
              <p className="text-xs text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {trend}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0 ml-2`} style={{ backgroundColor: colorClass || '#17c491' }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="text-white p-4 sm:p-6 rounded-xl shadow-lg" style={{ backgroundColor: '#10af7f' }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-white/80 text-sm sm:text-base">Manage tickets across all organizations</p>
        </div>

        {/* Overview Statistics */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Organizations"
              value={stats.totalOrganizations}
              icon={<Building className="w-6 h-6" />}
              description={`${stats.activeOrganizations} active`}
              trend="8% growth"
              colorClass=""
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="w-6 h-6" />}
              description={`${stats.activeUsers} active`}
              trend="12% growth"
              colorClass="bg-green-500"
            />
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets}
              icon={<Ticket className="w-6 h-6" />}
              description={`${stats.resolvedTickets} resolved`}
              trend="5% growth"
              colorClass="bg-orange-500"
            />
            <StatCard
              title="Resolution Rate"
              value={`${stats.resolutionRate}%`}
              icon={<BarChart3 className="w-6 h-6" />}
              description="Average across all orgs"
              trend="3% improvement"
              colorClass="bg-purple-500"
            />
          </div>
        </div>

        {/* Subscription Module */}
        {/* <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Subscription Module</h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = '/subscription-plans'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Plans
              </Button>
              <Button 
                onClick={() => window.location.href = '/subscription'}
                variant="outline"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                View Subscriptions
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Plans"
              value={subscriptionStats.totalPlans}
              icon={<CreditCard className="w-6 h-6" />}
              description={`${subscriptionStats.activePlans} active`}
              trend="Configured"
              colorClass="bg-blue-500"
            />
            <StatCard
              title="Active Subscriptions"
              value={subscriptionStats.activeSubscriptions}
              icon={<CheckCircle className="w-6 h-6" />}
              description={`${subscriptionStats.trialSubscriptions} trials`}
              trend="Currently active"
              colorClass="bg-green-500"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${subscriptionStats.totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="w-6 h-6" />}
              description="All time earnings"
              trend="Monthly tracking"
              colorClass="bg-purple-500"
            />
            <StatCard
              title="Expired Subscriptions"
              value={subscriptionStats.expiredSubscriptions}
              icon={<TrendingDown className="w-6 h-6" />}
              description="Need renewal"
              trend="Follow up required"
              colorClass="bg-red-500"
            />
          </div>
        </div> */}

        <Tabs defaultValue="tickets" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1">
            <TabsTrigger value="tickets" className="py-2 text-xs sm:text-sm">Ticket Management</TabsTrigger>
            <TabsTrigger value="organizations" className="py-2 text-xs sm:text-sm">Organizations</TabsTrigger>
            <TabsTrigger value="organization-stats" className="py-2 text-xs sm:text-sm">Organization Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Ticket Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: '#17c491' }}>
                    {tickets.filter(t => t.status === 'in_progress').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Closed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">
                    {tickets.filter(t => t.status === 'closed').length}
                  </div>
                </CardContent>
              </Card>
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
                        className="pl-10"
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
                    <Label htmlFor="organization">Organization</Label>
                    <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets ({filteredTickets.length})</CardTitle>
                <CardDescription>Manage and track all support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || selectedOrg !== "all"
                        ? "Try adjusting your filters"
                        : "No tickets available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                        <div className="space-y-3">
                          {/* Header with ticket number and badges */}
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-sm">{ticket.ticketNumber}</span>
                              <div className="flex flex-wrap gap-1">
                                <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                                  {ticket.priority}
                                </Badge>
                                <Badge className={`${getStatusColor(ticket.status).className} text-xs`} style={getStatusColor(ticket.status).style}>
                                  {getStatusIcon(ticket.status)}
                                  <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Title */}
                          <h3 className="font-semibold text-base sm:text-lg break-words">{ticket.title}</h3>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-3 sm:line-clamp-none">{ticket.description}</p>
                          
                          {/* Remarks */}
                          {ticket.remarks && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm font-medium text-blue-800 mb-1">Remarks:</p>
                              <p className="text-sm text-blue-700 line-clamp-2">{ticket.remarks}</p>
                            </div>
                          )}
                          
                          {/* Meta information and action button */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t">
                            <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
                              <span>Created by {ticket.createdBy.name}</span>
                              {ticket.organization && (
                                <span>{ticket.organization.name}</span>
                              )}
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openUpdateDialog(ticket)} 
                              className="w-full sm:w-auto min-w-[80px]"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>View ticket statistics by organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="border rounded-lg p-4 sm:p-6">
                      <div className="space-y-4">
                        {/* Organization Name */}
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg truncate">{org.name}</h3>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-blue-600">{org.userCount}</div>
                            <div className="text-xs text-muted-foreground">Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-orange-600">{org.ticketCount}</div>
                            <div className="text-xs text-muted-foreground">Tickets</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-green-600">{org.resolutionRate}%</div>
                            <div className="text-xs text-muted-foreground">Resolution</div>
                          </div>
                        </div>
                        
                        {/* Bottom Resolution Rate Display */}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Overall Resolution Rate</span>
                            <div className="text-right">
                              <div className="text-xl sm:text-2xl font-bold text-green-600">{org.resolutionRate}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization-stats" className="space-y-6">
            <OrganizationsModule />
          </TabsContent>
        </Tabs>

        {/* Update Ticket Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Ticket</DialogTitle>
              <DialogDescription>
                Update ticket status and priority for "{selectedTicket?.ticketNumber}"
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="update-status">Status</Label>
                <Select value={updateFormData.status} onValueChange={(value: any) => setUpdateFormData({ ...updateFormData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-remarks">Remarks</Label>
                <Textarea
                  id="update-remarks"
                  value={updateFormData.remarks}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, remarks: e.target.value })}
                  placeholder="Add your reply or remarks here..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTicket}
                disabled={isUpdatingTicket}
                style={{ backgroundColor: '#17c491' }}
                className="text-white hover:opacity-90"
              >
                {isUpdatingTicket ? "Updating..." : "Update Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
