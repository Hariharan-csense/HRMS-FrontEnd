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
import { ENDPOINTS } from '@/lib/endpoint';
import { Layout } from '@/components/Layout';

type User = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  avatar?: string;
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

  // Mock data for organizations and roles
  const organizations = [
    { id: 'all', name: 'All Organizations' },
    { id: '1', name: 'Acme Corp' },
    { id: '2', name: 'Tech Solutions' },
    { id: '3', name: 'Global Systems' },
  ];

  const roles = [
    { id: 'all', name: 'All Roles' },
    { id: 'admin', name: 'Administrator' },
    { id: 'hr', name: 'HR Manager' },
    { id: 'manager', name: 'Department Manager' },
    { id: 'employee', name: 'Employee' },
  ];

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await ENDPOINTS.getUsers();
        // setUsers(response.data);
        
        // Mock data for now
        const mockData: User[] = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@acme.com',
            organization: 'Acme Corp',
            role: 'Administrator',
            status: 'active',
            lastLogin: '2023-11-20T14:30:00Z',
            avatar: '',
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@techsolutions.com',
            organization: 'Tech Solutions',
            role: 'HR Manager',
            status: 'active',
            lastLogin: '2023-11-19T09:15:00Z',
            avatar: '',
          },
          {
            id: '3',
            name: 'Robert Johnson',
            email: 'robert.j@techsolutions.com',
            organization: 'Tech Solutions',
            role: 'Employee',
            status: 'inactive',
            lastLogin: '2023-11-15T16:45:00Z',
            avatar: '',
          },
          {
            id: '4',
            name: 'Emily Davis',
            email: 'emily.d@acme.com',
            organization: 'Acme Corp',
            role: 'Department Manager',
            status: 'active',
            lastLogin: '2023-11-20T08:30:00Z',
            avatar: '',
          },
          {
            id: '5',
            name: 'Michael Brown',
            email: 'michael.b@globalsystems.com',
            organization: 'Global Systems',
            role: 'Administrator',
            status: 'suspended',
            lastLogin: '2023-10-28T11:20:00Z',
            avatar: '',
          },
        ];
        
        setUsers(mockData);
      } catch (error) {
        console.error('Error fetching users:', error);
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
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesOrg && matchesRole && matchesStatus;
  });

  // Calculate counts for tabs
  const tabCounts = {
    all: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length
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
    navigate(`/users/${userId}`);
  };

  // Handle role change
  const handleRoleChange = (userId: string, newRole: string) => {
    // Implement role update logic here
    console.log(`Updating user ${userId} role to ${newRole}`);
    // Update local state for demo purposes
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  // Handle status change
  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    // Implement status update logic here
    console.log(`Updating user ${userId} status to ${newStatus}`);
    // Update local state for demo purposes
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
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
      <div className="container mx-auto p-2 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold">Users</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage all users in the system</p>
          </div>
          <Button 
            className="w-full sm:w-auto h-9 text-sm sm:text-base" 
            onClick={() => navigate('/users/new')} 
            size="sm"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Add User
          </Button>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-semibold">User Management</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage all users in the system</p>
              </div>
              
              {/* Tabs */}
              <Tabs 
                value={statusFilter} 
                className="w-full overflow-x-auto"
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <TabsList className="w-full flex-nowrap sm:grid sm:grid-cols-4 h-auto p-1 bg-muted/20">
                  <TabsTrigger value="all" className="py-1.5 sm:py-2 text-xs sm:text-sm">
                    All <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">{tabCounts.all}</span>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="py-1.5 sm:py-2 text-xs sm:text-sm">
                    Active <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">{tabCounts.active}</span>
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="py-1.5 sm:py-2 text-xs sm:text-sm">
                    Inactive <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">{tabCounts.inactive}</span>
                  </TabsTrigger>
                  <TabsTrigger value="suspended" className="py-1.5 sm:py-2 text-xs sm:text-sm">
                    Suspended <span className="ml-1 sm:ml-2 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">{tabCounts.suspended}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Search and Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Select
                    value={organizationFilter}
                    onValueChange={(value) => {
                      setOrganizationFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full h-9 sm:h-10 text-sm sm:text-base">
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    <SelectItem value="1">Acme Corp</SelectItem>
                    <SelectItem value="2">Tech Solutions</SelectItem>
                    <SelectItem value="3">Global Systems</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1">
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-9 sm:h-10 text-sm sm:text-base">
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
          </div>
        </CardHeader>
        
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/50 hidden sm:table-header-group">
                  <TableRow>
                    <TableHead className="min-w-[160px] sm:min-w-[180px]">User</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="min-w-[120px] sm:min-w-[150px]">Organization</TableHead>
                    <TableHead className="min-w-[120px] sm:min-w-[150px]">Role</TableHead>
                    <TableHead className="min-w-[100px] sm:min-w-[120px]">Status</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Last Login</TableHead>
                    <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50 flex flex-col sm:table-row border-b">
                        <TableCell className="py-3 px-4 sm:py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {user.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.avatar}
                                  alt={user.name}
                                />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-base truncate">{user.name}</div>
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
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Button>
        
        <div className="flex items-center justify-center rounded-md border bg-background px-3 py-1 text-xs sm:text-sm font-medium">
          {currentPage}
        </div>
        
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
)}
                              }
                              className="text-xs sm:text-sm whitespace-nowrap"
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-2 px-4 text-sm">
                            {formatLastLogin(user.lastLogin)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 sm:flex hidden"
                                onClick={() => handleViewUser(user.id)}
                                title="View user"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 flex sm:hidden"
                                onClick={() => handleViewUser(user.id)}
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                View
                              </Button>
                              <Select
                                value={user.status}
                                onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                                  handleStatusChange(user.id, value)
                                }
                              >
                                <SelectTrigger className="w-[100px] h-8 text-xs sm:text-sm">
                                  <SelectValue placeholder="Status" />
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
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-2 px-4">
                            <div className="flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground hidden sm:block" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-2 px-4">
                            {user.organization}
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <div className="flex items-center justify-between sm:block">
                              <span className="sm:hidden text-sm font-medium text-muted-foreground">Role:</span>
                              <Select
                                value={user.role.toLowerCase()}
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-full sm:w-[140px] h-8 text-sm">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="administrator">Administrator</SelectItem>
                                  <SelectItem value="hr manager">HR Manager</SelectItem>
                                  <SelectItem value="department manager">Dept. Manager</SelectItem>
                                  <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell py-2 px-4">
                            <Badge 
                              variant={
                                user.status === 'active' ? 'default' :
                                user.status === 'inactive' ? 'outline' :
                                'destructive'
                              }
                              className="text-xs sm:text-sm whitespace-nowrap"
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-2 px-4 text-sm">
                            {formatLastLogin(user.lastLogin)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 sm:flex hidden"
                                onClick={() => handleViewUser(user.id)}
                                title="View user"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 flex sm:hidden"
                                onClick={() => handleViewUser(user.id)}
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                View
                              </Button>
                              <Select
                                value={user.status}
                                onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                                  handleStatusChange(user.id, value)
                                }
                              >
                                <SelectTrigger className="w-[100px] h-8 text-xs sm:text-sm">
                                  <SelectValue placeholder="Status" />
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
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto mb-2 sm:mb-0">
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
