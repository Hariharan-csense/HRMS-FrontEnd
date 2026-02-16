import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Shield, Trash2, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/lib/endpoint';
import { Layout } from '@/components/Layout';

type Organization = {
  id: string;
  name: string;
  email: string;
  owner: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial' | 'expired';
  plan: 'Starter' | 'Professional' | 'Enterprise' | 'Trial';
  users: number;
  storage: string;
  totalStorage: string;
  daysLeft: number;
  revenue: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
};

export const Organizations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock data for plans
  const plans = [
    { id: 'all', name: 'All Plans' },
    { id: 'Starter', name: 'Starter' },
    { id: 'Professional', name: 'Professional' },
    { id: 'Enterprise', name: 'Enterprise' },
    { id: 'Trial', name: 'Trial' }
  ];

  // Fetch organizations data
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await ENDPOINTS.fetchOrganizations();
        
        if (response.error) {
          console.error('Error fetching organizations:', response.error);
          // Fallback to mock data if API fails
          const mockData: Organization[] = [
            {
              id: '1',
              name: 'Csense',
              email: 's.pushpalatha.mca@gmail.com',
              owner: 'Pushpa',
              status: 'active',
              plan: 'Starter',
              users: 4,
              storage: '0GB',
              totalStorage: '2GB',
              daysLeft: 189,
              revenue: '₹6500.00',
              createdAt: '2023-01-15',
              updatedAt: '2023-11-20T14:30:00Z',
              lastLogin: '2023-11-20T14:30:00Z'
            },
            {
              id: '2',
              name: 'Elango associates',
              email: 'elango@elangoassociates.com',
              owner: 'Elango M',
              status: 'active',
              plan: 'Starter',
              users: 6,
              storage: '0GB',
              totalStorage: '10GB',
              daysLeft: 194,
              revenue: '₹0.00',
              createdAt: '2023-11-01',
              updatedAt: '2023-11-18T09:15:00Z',
              lastLogin: '2023-11-18T09:15:00Z'
            },
            {
              id: '3',
              name: 'woopme',
              email: 'siyadhsiya552@gmail.com',
              owner: 'muhammed siyad',
              status: 'expired',
              plan: 'Trial',
              users: 1,
              storage: '0GB',
              totalStorage: '2GB',
              daysLeft: -1,
              revenue: '₹0.00',
              createdAt: '2023-10-15',
              updatedAt: '2023-11-10T11:20:00Z',
              lastLogin: '2023-11-10T11:20:00Z'
            },
            {
              id: '4',
              name: 'MK SURYA POWER SOLUTIONS',
              email: 'mksuryapowersolution@gmail.com',
              owner: 'Jayakumar',
              status: 'active',
              plan: 'Starter',
              users: 2,
              storage: '0GB',
              totalStorage: '2GB',
              daysLeft: 194,
              revenue: '₹0.00',
              createdAt: '2023-11-05',
              updatedAt: '2023-11-15T16:45:00Z',
              lastLogin: '2023-11-15T16:45:00Z'
            },
            {
              id: '5',
              name: 'Champions Circle',
              email: 'arun@csensems.com',
              owner: 'Arunkumar',
              status: 'active',
              plan: 'Starter',
              users: 12,
              storage: '0GB',
              totalStorage: '2GB',
              daysLeft: 189,
              revenue: '₹5000.00',
              createdAt: '2023-02-10',
              updatedAt: '2023-11-19T10:30:00Z',
              lastLogin: '2023-11-19T10:30:00Z'
            }
          ];
          setOrganizations(mockData);
        } else {
          // Transform API data to match Organization type
          const transformedData = response.data.map((org: any) => ({
            id: org.id?.toString() || '',
            name: org.name || '',
            email: org.email || '',
            owner: org.owner || org.admin_name || '',
            status: org.status || 'active',
            plan: org.plan || org.subscription_type || 'Starter',
            users: org.user_count || org.users || 0,
            storage: org.used_storage || org.storage || '0GB',
            totalStorage: org.total_storage || org.storage_limit || '2GB',
            daysLeft: org.daysLeft || org.days_left || org.trial_days_left || 0, // Use daysLeft from backend
            revenue: org.revenue || '₹0.00',
            createdAt: org.created_at || '',
            updatedAt: org.updated_at || '',
            lastLogin: org.last_login
          }));
          setOrganizations(transformedData);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Filter organizations based on search term, status, and plan
  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = org.name.toLowerCase().includes(searchLower) ||
                         org.email.toLowerCase().includes(searchLower) ||
                         org.owner.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'expired' && org.daysLeft < 0) ||
                         (statusFilter === 'active' && org.status === 'active' && org.daysLeft >= 0) ||
                         (statusFilter === 'trial' && (org.status === 'trial' || org.plan === 'Trial'));
    
    const matchesPlan = planFilter === 'all' || org.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate counts for tabs
  const tabCounts = {
    all: organizations.length,
    trial: organizations.filter(org => org.status === 'trial' || org.plan === 'Trial').length,
    active: organizations.filter(org => org.status === 'active' && org.daysLeft >= 0).length,
    expired: organizations.filter(org => org.daysLeft < 0).length
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Calculate storage percentage
  const getStoragePercentage = (storage: string, totalStorage: string) => {
    const used = parseFloat(storage) || 0;
    const total = parseFloat(totalStorage) || 1;
    return Math.min(Math.round((used / total) * 100), 100);
  };

  // Format days left
  const formatDaysLeft = (days: number) => {
    console.log('formatDaysLeft called with:', days, typeof days);
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle view organization details
  const handleViewOrganization = (orgId: string) => {
    navigate(`/organizations/${orgId}`);
  };

  // Handle manage organization access
  const handleManageAccess = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/organizations/${orgId}/access`);
  };

  // Handle delete organization
  const handleDeleteOrganization = async (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        const response = await ENDPOINTS.removeOrganization(orgId);
        if (response.error) {
          alert(`Error deleting organization: ${response.error}`);
        } else {
          // Refresh the organizations list
          const fetchOrganizations = async () => {
            const response = await ENDPOINTS.fetchOrganizations();
            if (response.data) {
              const transformedData = response.data.map((org: any) => ({
                id: org.id?.toString() || '',
                name: org.name || '',
                email: org.email || '',
                owner: org.owner || org.admin_name || '',
                status: org.status || 'active',
                plan: org.plan || org.subscription_type || 'Starter',
                users: org.user_count || org.users || 0,
                storage: org.used_storage || org.storage || '0GB',
                totalStorage: org.total_storage || org.storage_limit || '2GB',
                daysLeft: org.days_left || org.trial_days_left || 0,
                revenue: org.revenue || '₹0.00',
                createdAt: org.created_at || '',
                updatedAt: org.updated_at || '',
                lastLogin: org.last_login
              }));
              setOrganizations(transformedData);
            }
          };
          fetchOrganizations();
          alert('Organization deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting organization:', error);
        alert('Failed to delete organization');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Organizations</h1>
            <p className="text-sm text-muted-foreground">Manage all organizations in the system</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => navigate('/superadmin/organizations/new')}>
            Add Organization
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <h2 className="text-lg font-semibold">Organizations Management</h2>
                <p className="text-sm text-muted-foreground">Manage all organizations in the system</p>
              </div>
              
              {/* Tabs */}
              <Tabs 
                value={statusFilter} 
                className="w-full"
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/20">
                  <TabsTrigger value="all" className="py-2">
                    All <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{tabCounts.all}</span>
                  </TabsTrigger>
                  <TabsTrigger value="trial" className="py-2">
                    Trial <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{tabCounts.trial}</span>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="py-2">
                    Active <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{tabCounts.active}</span>
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="py-2">
                    Expired <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{tabCounts.expired}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Search and Filter */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={planFilter}
                    onValueChange={(value) => {
                      setPlanFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {paginatedOrganizations.length > 0 ? (
                <div className="space-y-4 p-4">
                  {paginatedOrganizations.map((org) => {
                    const storagePercentage = getStoragePercentage(
                      org.storage.replace('GB', ''),
                      org.totalStorage.replace('GB', '')
                    );
                    
                    return (
                      <div key={org.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">{org.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-muted-foreground">Owner</span>
                            <p className="font-medium">{org.owner}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Status</span>
                            <div className="mt-1">
                              <Badge 
                                variant={
                                  org.status === 'active' ? 'default' :
                                  org.status === 'trial' ? 'outline' :
                                  org.status === 'expired' ? 'destructive' :
                                  'secondary'
                                }
                                className={`${
                                  org.status === 'expired' ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : ''
                                }`}
                              >
                                {org.status === 'expired' ? 'Expired' : org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Plan</span>
                            <div className="mt-1">
                              <Badge 
                                variant={org.plan === 'Trial' ? 'outline' : 'secondary'}
                                className={`${
                                  org.plan === 'Starter' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' :
                                  org.plan === 'Trial' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300' : ''
                                }`}
                              >
                                {org.plan}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Users</span>
                            <p className="font-medium">{org.users}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-muted-foreground">Storage</span>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{org.storage} / {org.totalStorage}</span>
                              <span className="text-muted-foreground">{storagePercentage}%</span>
                            </div>
                            <Progress value={storagePercentage} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-muted-foreground">Days Left</span>
                            <p className={`font-medium ${org.daysLeft < 0 ? 'text-destructive' : ''}`}>
                              {formatDaysLeft(org.daysLeft)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Revenue</span>
                            <p className="font-medium">{org.revenue}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrganization(org.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={(e) => handleDeleteOrganization(org.id, e)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No organizations found.</p>
                </div>
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="min-w-[220px]">Organization</TableHead>
                    <TableHead className="min-w-[180px]">Owner</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Plan</TableHead>
                    <TableHead className="min-w-[80px] text-right">Users</TableHead>
                    <TableHead className="min-w-[150px]">Storage</TableHead>
                    <TableHead className="min-w-[100px] text-right">Days Left</TableHead>
                    <TableHead className="min-w-[120px] text-right">Revenue</TableHead>
                    <TableHead className="min-w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrganizations.length > 0 ? (
                    paginatedOrganizations.map((org) => {
                      const storagePercentage = getStoragePercentage(
                        org.storage.replace('GB', ''),
                        org.totalStorage.replace('GB', '')
                      );
                      
                      return (
                        <TableRow 
                          key={org.id} 
                          className="hover:bg-muted/30"
                        >
                          <TableCell>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-muted-foreground">{org.email}</div>
                          </TableCell>
                          <TableCell className="font-medium">{org.owner}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                org.status === 'active' ? 'default' :
                                org.status === 'trial' ? 'outline' :
                                org.status === 'expired' ? 'destructive' :
                                'secondary'
                              }
                              className={`${
                                org.status === 'expired' ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : ''
                              }`}
                            >
                              {org.status === 'expired' ? 'Expired' : org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={org.plan === 'Trial' ? 'outline' : 'secondary'}
                              className={`${
                                org.plan === 'Starter' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' :
                                org.plan === 'Trial' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300' : ''
                              }`}
                            >
                              {org.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{org.users}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{org.storage} / {org.totalStorage}</span>
                                <span className="text-muted-foreground">{storagePercentage}%</span>
                              </div>
                              <Progress value={storagePercentage} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={org.daysLeft < 0 ? 'text-destructive' : ''}>
                              {formatDaysLeft(org.daysLeft)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {org.revenue}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrganization(org.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90"
                                onClick={(e) => handleDeleteOrganization(org.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No organizations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col space-y-4 px-4 sm:px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredOrganizations.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredOrganizations.length}</span> organizations
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={pageSize.toString()}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(pageNum)} 
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Go to next page</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
};

export default Organizations;
