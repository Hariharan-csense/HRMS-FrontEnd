import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Mail, Shield, ChevronDown, MoreHorizontal, Eye, Plus, Layout as LayoutIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS, BASE_URL } from '@/lib/endpoint';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string;
  email: string;
  organization?: string;
  company_name?: string;
  role: string;
  status: string;
  lastLogin?: string;
  last_login?: string;
  avatar?: string;
  company_id?: string;
};

export const Users: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock data for roles
  const roles = [
    { id: 'all', name: 'All Roles' },
    { id: 'admin', name: 'Administrator' },
    { id: 'hr', name: 'HR Manager' },
    { id: 'manager', name: 'Department Manager' },
    { id: 'employee', name: 'Employee' },
  ];

  // Extract unique organizations from users data
  const organizations = [
    { id: 'all', name: 'All Organizations' },
    ...Array.from(new Set(users.map(user => user.organization).filter(Boolean)))
      .map(orgName => ({ id: orgName, name: orgName }))
  ];

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await ENDPOINTS.fetchUsers();
        
        if (result.error) {
          console.error('Error fetching users:', result.error);
          toast.error('Failed to fetch users: ' + result.error);
          setUsers([]);
        } else if (result.data) {
          // Transform API data to match component interface
          const transformedUsers: User[] = result.data.map((user: any) => ({
            id: user.id?.toString() || '',
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
            email: user.email || '',
            organization: user.company_name || user.organization || 'Unknown',
            role: user.role || 'user',
            status: user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase() : 'Active',
            lastLogin: user.last_login || user.lastLogin || new Date().toISOString(),
            avatar: user.profile_photo ? `${BASE_URL}${user.profile_photo}` : user.avatar || '',
            company_id: user.company_id?.toString() || ''
          }));
          
          setUsers(transformedUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term, organization, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = organizationFilter === 'all' || user.organization === organizations.find(org => org.id === organizationFilter)?.name;
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesOrg && matchesRole && matchesStatus;
  });

  // Calculate counts for tabs
  const tabCounts = {
    all: users.length,
    active: users.filter(u => u.status?.toLowerCase() === 'active').length,
    inactive: users.filter(u => u.status?.toLowerCase() === 'inactive').length,
    suspended: users.filter(u => u.status?.toLowerCase() === 'suspended').length
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format last login date
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle view user details
  const handleViewUser = (userId: string) => {
    toast.info(`User details for ID: ${userId} - Feature coming soon!`);
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const result = await ENDPOINTS.updateUserRole(userId, newRole);
      
      if (result.error) {
        console.error('Error updating user role:', result.error);
        toast.error('Failed to update role: ' + result.error);
      } else {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('User role updated successfully');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  // Handle status change
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const result = await ENDPOINTS.updateUserStatus(userId, newStatus);
      
      if (result.error) {
        console.error('Error updating user status:', result.error);
        toast.error('Failed to update status: ' + result.error);
      } else {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        toast.success('User status updated successfully');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold">Users</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage all users in the system</p>
          </div>
          <Button 
            onClick={() => navigate('/users/new')} 
            size="sm" 
            className="w-full sm:w-auto h-9 text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add User</span>
          </Button>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-semibold">User Management</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage all users in the system</p>
              </div>
              
              {/* Tabs - Horizontal scroll on mobile */}
              <div className="overflow-x-auto pb-1 -mx-1 px-1">
                <Tabs 
                  value={statusFilter} 
                  className="w-full min-w-max"
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <TabsList className="w-full flex-nowrap sm:grid sm:grid-cols-4 h-auto p-1 bg-muted/20">
                    <TabsTrigger value="all" className="py-1.5 px-2 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
                      All <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{tabCounts.all}</span>
                    </TabsTrigger>
                    <TabsTrigger value="active" className="py-1.5 px-2 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
                      Active <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{tabCounts.active}</span>
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="py-1.5 px-2 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
                      Inactive <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{tabCounts.inactive}</span>
                    </TabsTrigger>
                    <TabsTrigger value="suspended" className="py-1.5 px-2 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
                      Suspended <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{tabCounts.suspended}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Search and Filter - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="relative col-span-1 sm:col-span-3 md:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 h-9 text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={organizationFilter}
                  onValueChange={(value) => {
                    setOrganizationFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="hr">HR Manager</SelectItem>
                    <SelectItem value="manager">Department Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="rounded-md border overflow-hidden">
              <div className="w-full overflow-x-auto -mx-1 px-1">
                <Table className="w-full min-w-[600px] md:min-w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[140px] sm:w-[180px] px-2 sm:px-3">User</TableHead>
                      <TableHead className="hidden sm:table-cell w-[180px] px-3">Email</TableHead>
                      <TableHead className="hidden md:table-cell w-[120px] px-3">Organization</TableHead>
                      <TableHead className="w-[120px] px-2 sm:px-3">Role</TableHead>
                      <TableHead className="w-[80px] sm:w-[100px] px-2 sm:px-3">Status</TableHead>
                      <TableHead className="hidden lg:table-cell w-[140px] px-3">Last Login</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px] px-2 sm:px-3 text-right sm:text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50 border-b">
                          <TableCell className="py-2 px-2 sm:px-3 align-middle">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center">
                                {user.avatar ? (
                                  <img
                                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover"
                                    src={user.avatar}
                                    alt={user.name}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">{user.name}</div>
                                <div className="hidden xs:block text-[10px] text-muted-foreground truncate">ID: {user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-2 px-3 align-middle">
                            <div className="flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs sm:text-sm truncate">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-2 px-3 align-middle">
                            <span className="text-xs sm:text-sm truncate">{user.organization}</span>
                          </TableCell>
                          <TableCell className="py-2 px-2 sm:px-3 align-middle">
                            <span className="text-xs sm:text-sm">
                              {user.role === 'superadmin' ? 'Super Admin' :
                               user.role === 'admin' ? 'Admin' :
                               user.role === 'hr' ? 'HR Manager' :
                               user.role === 'manager' ? 'Department Manager' :
                               user.role === 'employee' ? 'Employee' :
                               user.role === 'finance' ? 'Finance' :
                               user.role === 'department_head' ? 'Department Head' :
                               user.role === 'sales' ? 'Sales' :
                               user.role || 'Employee'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-2 sm:px-3 align-middle">
                            <Badge 
                              variant={
                                user.status === 'Active' ? 'default' :
                                user.status === 'Inactive' ? 'outline' :
                                user.status === 'Suspended' ? 'destructive' :
                                'default'
                              }
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 whitespace-nowrap w-full text-center"
                            >
                              {user.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell py-2 px-3 text-xs sm:text-sm align-middle">
                            <span className="whitespace-nowrap">{formatLastLogin(user.lastLogin)}</span>
                          </TableCell>
                          <TableCell className="py-2 px-2 sm:px-3 align-middle">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleViewUser(user.id)}
                              >
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Select
                                value={user.status?.toLowerCase() || 'active'}
                                onValueChange={(value) => 
                                  handleStatusChange(user.id, value)
                                }
                              >
                                <SelectTrigger className="w-[80px] sm:w-[100px] h-7 sm:h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="suspended">Suspend</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="flex flex-col sm:table-row">
                        <TableCell colSpan={7} className="h-24 text-center py-8">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> users
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
                    <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Rows per page</p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-xs sm:text-sm">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={pageSize.toString()} className="text-xs sm:text-sm">
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-1 w-full justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      size="sm"
                    >
                      <span className="sr-only">Previous</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        // Show first page, last page, current page, and pages around current page
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage === 1) {
                          pageNum = i + 1;
                        } else if (currentPage === totalPages) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs sm:text-sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <span className="px-2 text-sm">...</span>
                      )}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 text-xs sm:text-sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      size="sm"
                    >
                      <span className="sr-only">Next</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Users;
