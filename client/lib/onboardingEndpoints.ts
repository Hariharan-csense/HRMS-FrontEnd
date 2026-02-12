// Onboarding API endpoints and helper functions
import { api } from './endpoint';

// Types
export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignee?: string;
}

export interface OnboardingEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: OnboardingTask[];
  assignedHR: string;
  createdAt: string;
}

export interface OnboardingStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  assignedHR: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueDate: string;
  assignee?: string;
}

export interface CreateDocumentData {
  title: string;
  description: string;
  required: boolean;
  dueDate: string;
}

// Onboarding Employees API functions
export const onboardingAPI = {
  // Get all onboarding employees
  getEmployees: async (): Promise<OnboardingEmployee[]> => {
    const response = await api.get('/onboarding');
    return response.data;
  },

  // Get onboarding stats
  getStats: async (): Promise<OnboardingStats> => {
    const response = await api.get('/onboarding/stats');
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id: string): Promise<OnboardingEmployee> => {
    const response = await api.get(`/onboarding/${id}`);
    return response.data;
  },

  // Create new onboarding employee
  createEmployee: async (data: CreateEmployeeData): Promise<OnboardingEmployee> => {
    const response = await api.post('/onboarding', data);
    return response.data;
  },

  // Update onboarding employee
  updateEmployee: async (id: string, data: Partial<CreateEmployeeData>): Promise<OnboardingEmployee> => {
    const response = await api.put(`/onboarding/${id}`, data);
    return response.data;
  },

  // Delete onboarding employee
  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/onboarding/${id}`);
  },

  // Tasks
  createTask: async (employeeId: string, data: CreateTaskData): Promise<OnboardingTask> => {
    const response = await api.post(`/onboarding/${employeeId}/tasks`, data);
    return response.data;
  },

  toggleTaskCompletion: async (taskId: string): Promise<OnboardingTask> => {
    const response = await api.patch(`/onboarding/tasks/${taskId}/toggle`);
    return response.data;
  },

  // Documents
  createDocument: async (employeeId: string, data: CreateDocumentData): Promise<any> => {
    const response = await api.post(`/onboarding/${employeeId}/documents`, data);
    return response.data;
  },

  updateDocumentUpload: async (documentId: string, uploadData: any): Promise<any> => {
    const response = await api.patch(`/onboarding/documents/${documentId}/upload`, uploadData);
    return response.data;
  },
};

// Utility functions
export const onboardingUtils = {
  // Get status color for UI
  getStatusColor: (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  // Format date for display
  formatDate: (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  },

  // Calculate progress percentage
  calculateProgress: (tasks: OnboardingTask[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  // Filter employees by search term and status
  filterEmployees: (employees: OnboardingEmployee[] | any, searchTerm: string, statusFilter: string) => {
    // Handle case where employees might be wrapped in a response object
    const employeesArray = Array.isArray(employees) ? employees : (employees?.data || []);
    
    return employeesArray.filter((employee: OnboardingEmployee) => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  },

  // Get status count
  getStatusCount: (employees: OnboardingEmployee[] | any, status: string) => {
    // Handle case where employees might be wrapped in a response object
    const employeesArray = Array.isArray(employees) ? employees : (employees?.data || []);
    return employeesArray.filter((e: OnboardingEmployee) => e.status === status).length;
  },
};

export default onboardingAPI;
