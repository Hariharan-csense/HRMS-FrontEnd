import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  onboardingAPI, 
  onboardingUtils, 
  OnboardingEmployee, 
  OnboardingTask, 
  CreateEmployeeData,
  OnboardingStats 
} from '@/lib/onboardingEndpoints';

const HROnboarding: React.FC = () => {
  const [employees, setEmployees] = useState<OnboardingEmployee[]>([]);
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    startDate: '',
    assignedHR: '',
  });

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
  });

  // Fetch employees and stats on component mount
  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesResponse, statsResponse] = await Promise.all([
        onboardingAPI.getEmployees(),
        onboardingAPI.getStats()
      ]);
      
      // Handle API response format - extract data array if needed
      const employeesData = Array.isArray(employeesResponse) ? employeesResponse : employeesResponse;
      const statsData = statsResponse;
      
      setEmployees(employeesData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding data');
      console.error('Error fetching onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = onboardingUtils.getStatusColor;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employeeData: CreateEmployeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        startDate: formData.startDate,
        assignedHR: formData.assignedHR,
      };

      const newEmployee = await onboardingAPI.createEmployee(employeeData);
      setEmployees(prev => Array.isArray(prev) ? [...prev, newEmployee] : [newEmployee]);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        startDate: '',
        assignedHR: '',
      });
      setIsDialogOpen(false);
      
      // Refresh stats
      fetchOnboardingData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      console.error('Error creating employee:', err);
    }
  };

  const filteredEmployees = onboardingUtils.filterEmployees(employees, searchTerm, statusFilter);

  const getStatusCount = (status: string) => {
    return onboardingUtils.getStatusCount(employees, status);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
    try {
      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description,
        dueDate: taskFormData.dueDate,
        assignee: taskFormData.assignee,
      };

      const newTask = await onboardingAPI.createTask(selectedEmployee.id, taskData);
      
      // Update selected employee with new task
      setSelectedEmployee(prev => prev ? {
        ...prev,
        tasks: Array.isArray(prev.tasks) ? [...prev.tasks, newTask] : [newTask]
      } : null);
      
      // Update employees list
      setEmployees(prev => Array.isArray(prev) ? prev.map(emp => 
        emp.id === selectedEmployee.id 
          ? { ...emp, tasks: Array.isArray(emp.tasks) ? [...emp.tasks, newTask] : [newTask] }
          : emp
      ) : []);
      
      // Reset task form
      setTaskFormData({
        title: '',
        description: '',
        dueDate: '',
        assignee: '',
      });
      setTaskDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      const updatedTask = await onboardingAPI.toggleTaskCompletion(taskId);
      
      // Update selected employee tasks
      setSelectedEmployee(prev => {
        if (!prev || !Array.isArray(prev.tasks)) return prev;
        const updatedTasks = prev.tasks.map(task => 
          task.id === taskId ? updatedTask : task
        );
        return { ...prev, tasks: updatedTasks };
      });
      
      // Update employees list
      setEmployees(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(emp => {
          if (emp.id !== selectedEmployee?.id) return emp;
          if (!Array.isArray(emp.tasks)) return emp;
          const updatedTasks = emp.tasks.map(task => 
            task.id === taskId ? updatedTask : task
          );
          return { ...emp, tasks: updatedTasks };
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Employee Onboarding</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage new employee onboarding process</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add New Employee
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Onboarding</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total || employees.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.pending || getStatusCount('pending')}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.inProgress || getStatusCount('in_progress')}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.completed || getStatusCount('completed')}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Employees</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Onboarding Employees</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        <p className="text-sm text-gray-600 mt-1">{employee.position}</p>
                        <p className="text-xs text-gray-500">{employee.department}</p>
                      </div>
                      <Badge className={`${getStatusColor(employee.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                        {employee.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Start Date</span>
                        <span className="text-sm text-gray-900">{employee.startDate}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Progress</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${employee.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{employee.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">HR Assignee</span>
                        <span className="text-sm text-gray-900">{employee.assignedHR}</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployee(employee)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</TableHead>
                    <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Position</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Start Date</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Progress</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{employee.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">{employee.email}</div>
                          <div className="text-xs text-gray-600 mt-1 sm:hidden">{employee.position}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{employee.position}</div>
                          <div className="text-sm text-gray-500 mt-1">{employee.department}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{employee.startDate}</span>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${employee.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{employee.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <Badge className={`${getStatusColor(employee.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                          {employee.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Employee Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee for Onboarding</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assignedHR">Assigned HR</Label>
                <Input
                  id="assignedHR"
                  value={formData.assignedHR}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedHR: e.target.value }))}
                  placeholder="HR representative name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Employee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Employee Details Dialog */}
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Onboarding Details - {selectedEmployee?.name}</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Employee Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedEmployee.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedEmployee.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedEmployee.department}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Start: {selectedEmployee.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">HR: {selectedEmployee.assignedHR}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(selectedEmployee.status)}`}>
                          {selectedEmployee.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{selectedEmployee.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${selectedEmployee.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tasks */}
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle className="text-lg">Onboarding Tasks</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={() => setTaskDialogOpen(true)}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.tasks && selectedEmployee.tasks.length > 0 ? (
                        selectedEmployee.tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleTaskStatus(task.id)}
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                            </div>
                            <Badge className={`${getStatusColor(task.status || 'pending')} ml-4`}>
                              {(task.status || 'pending').replace('_', ' ')}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No tasks assigned yet</p>
                          <p className="text-sm">Click "Add Task" to create the first task</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Create Task Dialog */}
                <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                  <DialogContent className="max-w-md w-[95vw]">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                        <Label htmlFor="taskTitle">Task Title</Label>
                        <Input
                          id="taskTitle"
                          value={taskFormData.title}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="taskDescription">Description</Label>
                        <Textarea
                          id="taskDescription"
                          value={taskFormData.description}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taskDueDate">Due Date</Label>
                        <Input
                          id="taskDueDate"
                          type="date"
                          value={taskFormData.dueDate}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="taskAssignee">Assignee</Label>
                        <Input
                          id="taskAssignee"
                          value={taskFormData.assignee}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, assignee: e.target.value }))}
                          placeholder="Task assignee name"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Create Task
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default HROnboarding;