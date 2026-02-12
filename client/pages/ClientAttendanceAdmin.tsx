import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/endpoint";
import {
  Building,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Users,
  Search,
  Filter,
  Eye,
  LogIn,
  LogOut,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ClientAttendanceRecord {
  id: number;
  employee_id: number;
  client_id: number;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  duration_minutes?: number;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_in_location?: string;
  check_in_notes?: string;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_out_location?: string;
  check_out_notes?: string;
  work_completed?: string;
  geo_fence_verified?: boolean;
  geo_fence_verified_checkout?: boolean;
  distance_from_client?: string;
  distance_from_client_checkout?: string;
  client_name: string;
  client_code: string;
  first_name: string;
  last_name: string;
  emp_code: string;
  department_name?: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface Client {
  id: number;
  client_name: string;
  client_id: string;
}

export default function ClientAttendanceAdmin() {
  const [attendanceData, setAttendanceData] = useState<ClientAttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ClientAttendanceRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedEmployee, selectedClient]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedEmployee && selectedEmployee !== "all") params.append('employeeId', selectedEmployee);
      if (selectedClient && selectedClient !== "all") params.append('clientId', selectedClient);

      // Use the new API function with query parameters
      const response = await api.get(`/client-attendance/all?${params.toString()}`);

      if (response.data && response.data.success) {
        setAttendanceData(response.data.data);
        
        // Extract unique employees and clients for filters
        const uniqueEmployees = Array.from(
          new Map(response.data.data.map((record: ClientAttendanceRecord) => 
            [record.employee_id, {
              id: record.employee_id,
              first_name: record.first_name,
              last_name: record.last_name,
              employee_id: record.emp_code
            }]
          )).values()
        );
        
        const uniqueClients = Array.from(
          new Map(response.data.data.map((record: ClientAttendanceRecord) => 
            [record.client_id, {
              id: record.client_id,
              client_name: record.client_name,
              client_id: record.client_code
            }]
          )).values()
        );
        
        setEmployees(uniqueEmployees);
        setClients(uniqueClients);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentExpansion = (recordId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedComments(newExpanded);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredData = attendanceData.filter(record => {
    const matchesSearch = !searchTerm || 
      record.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.work_completed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.check_in_notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.check_out_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading client attendance data...</div>
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
            <MessageSquare className="w-8 h-8 text-primary" />
            Client Attendance Admin
          </h1>
          <p className="text-muted-foreground mt-2">View all client attendance records with employee comments</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.first_name} {employee.last_name} ({employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.client_name} ({client.client_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search comments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatDuration(filteredData.reduce((total, record) => total + (record.duration_minutes || 0), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredData.filter(r => r.work_completed).length}</p>
                  <p className="text-sm text-muted-foreground">With Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Set(filteredData.map(r => r.employee_id)).size}</p>
                  <p className="text-sm text-muted-foreground">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Attendance Records</CardTitle>
            <CardDescription>Click on any record to view detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold">Client</th>
                    <th className="text-left px-4 py-3 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 font-semibold">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold">Comments</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDate(record.date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{record.first_name} {record.last_name}</p>
                          <p className="text-xs text-muted-foreground">{record.emp_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{record.client_name}</p>
                            <p className="text-xs text-muted-foreground">{record.client_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-green-600" />
                            <span className="text-xs">{formatTime(record.check_in_time)}</span>
                          </div>
                          {record.check_out_time && (
                            <div className="flex items-center gap-1">
                              <LogOut className="w-3 h-3 text-red-600" />
                              <span className="text-xs">{formatTime(record.check_out_time)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{formatDuration(record.duration_minutes)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.work_completed ? (
                          <div className="max-w-xs">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs">
                                  {expandedComments.has(record.id) 
                                    ? record.work_completed 
                                    : truncateText(record.work_completed, 80)
                                  }
                                </p>
                                {record.work_completed.length > 80 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                    onClick={() => toggleCommentExpansion(record.id)}
                                  >
                                    {expandedComments.has(record.id) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        Show less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        Show more
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No comments</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={record.check_out_time ? "default" : "secondary"}
                          className={record.check_out_time ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                        >
                          {record.check_out_time ? "Completed" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredData.map((record) => (
                <Card key={record.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Header with Date and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{formatDate(record.date)}</span>
                      </div>
                      <Badge 
                        variant={record.check_out_time ? "default" : "secondary"}
                        className={record.check_out_time ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {record.check_out_time ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    {/* Employee Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">{record.first_name} {record.last_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{record.emp_code}</p>
                    </div>

                    {/* Client Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm">{record.client_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{record.client_code}</p>
                    </div>

                    {/* Time Info */}
                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-green-600" />
                          <span className="text-xs">{formatTime(record.check_in_time)}</span>
                        </div>
                        {record.check_out_time && (
                          <div className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-red-600" />
                            <span className="text-xs">{formatTime(record.check_out_time)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span className="text-xs">{formatDuration(record.duration_minutes)}</span>
                      </div>
                    </div>

                    {/* Comments */}
                    {record.work_completed && (
                      <div className="mb-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs">
                              {expandedComments.has(record.id) 
                                ? record.work_completed 
                                : truncateText(record.work_completed, 100)
                              }
                            </p>
                            {record.work_completed.length > 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                onClick={() => toggleCommentExpansion(record.id)}
                              >
                                {expandedComments.has(record.id) ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show more
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
            <DialogDescription>
              Complete information for this client attendance record
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Employee Information</span>
                    </div>
                    <p className="text-sm"><strong>Name:</strong> {selectedRecord.first_name} {selectedRecord.last_name}</p>
                    <p className="text-sm"><strong>ID:</strong> {selectedRecord.emp_code}</p>
                    <p className="text-sm"><strong>Department:</strong> {selectedRecord.department_name}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Client Information</span>
                    </div>
                    <p className="text-sm"><strong>Name:</strong> {selectedRecord.client_name}</p>
                    <p className="text-sm"><strong>ID:</strong> {selectedRecord.client_code}</p>
                    <p className="text-sm"><strong>Date:</strong> {formatDate(selectedRecord.date)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Time Information */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Time Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-medium">{formatTime(selectedRecord.check_in_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check Out</p>
                      <p className="font-medium">
                        {selectedRecord.check_out_time ? formatTime(selectedRecord.check_out_time) : 'Not checked out'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(selectedRecord.duration_minutes)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Location Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in Location</p>
                      <p className="text-sm">{selectedRecord.check_in_location || 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out Location</p>
                      <p className="text-sm">{selectedRecord.check_out_location || 'Not recorded'}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant={selectedRecord.geo_fence_verified ? "default" : "secondary"}>
                      {selectedRecord.geo_fence_verified ? "Geo-fence verified" : "Geo-fence not verified"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Comments & Notes</span>
                  </div>
                  <div className="space-y-4">
                    {selectedRecord.check_in_notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Check-in Notes:</p>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                          {selectedRecord.check_in_notes}
                        </div>
                      </div>
                    )}
                    {selectedRecord.check_out_notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Check-out Notes:</p>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                          {selectedRecord.check_out_notes}
                        </div>
                      </div>
                    )}
                    {selectedRecord.work_completed && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Work Completed (Admin Comments):</p>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          {selectedRecord.work_completed}
                        </div>
                      </div>
                    )}
                    {!selectedRecord.check_in_notes && !selectedRecord.check_out_notes && !selectedRecord.work_completed && (
                      <p className="text-muted-foreground text-sm">No comments or notes provided</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
