// src/components/utils/api.ts
import axios from "axios";

// //Export the base URL for use in other components
export const BASE_URL = "http://192.168.1.11:3000";
// export const BASE_URL="https://hrms.procease.co/backend";
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
});

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("rememberMe");
};

// Attach token dynamically on EVERY request
api.interceptors.request.use(
  async (config) => {
    const requestUrl = typeof config.url === "string" ? config.url : "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");

    // Avoid self-wait deadlock for refresh endpoint
    if (isRefreshRequest) {
      return config;
    }

    // Check and refresh token if needed before making the request
    await checkAndRefreshTokenIfNeeded();
    
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Global response handler
let refreshPromise: Promise<string> | null = null;

// ✅ Token refresh utility
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // Use plain axios (no interceptors) to prevent recursive refresh deadlocks
    const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken }, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    const newAccessToken = response.data?.accessToken || response.data?.token;
    
    if (!newAccessToken) {
      throw new Error('No access token returned from refresh');
    }
    
    localStorage.setItem('accessToken', newAccessToken);
    console.log('Access token refreshed successfully');
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// ✅ Check if token is expired or will expire soon (within 5 minutes)
const isTokenExpiredOrExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes buffer
    
    return expirationTime <= fiveMinutesFromNow;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't parse
  }
};

// ✅ Proactive token refresh check
const checkAndRefreshTokenIfNeeded = async (): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!token || !refreshToken) {
    return;
  }
  
  if (isTokenExpiredOrExpiringSoon(token)) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    
    try {
      await refreshPromise;
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // Don't clear storage here, let the 401 handler handle it
    }
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (
        refreshToken &&
        typeof originalRequest.url === "string" &&
        !originalRequest.url.includes("/auth/refresh-token")
      ) {
        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }

          const newAccessToken = await refreshPromise;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed during 401 handling:', refreshError);
          clearAuthStorage();
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or refresh token request failed
        clearAuthStorage();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Export token refresh utilities for use in other components
export { refreshAccessToken, checkAndRefreshTokenIfNeeded, isTokenExpiredOrExpiringSoon };

const ENDPOINTS = {
  // Auth
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  refreshAccessToken: (refreshToken: string) =>
    api.post("/auth/refresh-token", { refreshToken }),
  register: (data: any) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  resetPassword: (email: string) =>
    api.post("/auth/reset-password", { email }),
  changePassword: (data: any) => api.post("/auth/reset-password", data),
  
  // Forgot Password
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  verifyOTP: (email: string, otp: string) =>
    api.post("/auth/verify-otp", { email, otp }),
  resetPasswordForgot: (email: string, newPassword: string, confirmPassword: string) =>
    api.post("/auth/reset-password-forgot", { email, newPassword, confirmPassword }),
 

  // Company
  getCompany: () => api.get("/company"),
  createCompany: (data: any) => api.post("/company", data),
  updateCompany: (id: string, data: any, config = {}) =>
    api.put(`/company/update`, data, config),
  deleteCompany: (id: string) => api.delete(`/company/${id}`),

  // Branch
  getBranches: () => api.get("/branch"),
  createBranch: (data: any) => api.post("/branch", data),
  updateBranch: (id: string, data: any) => api.put(`/branch/${id}`, data),
  deleteBranch: (id: string) => api.delete(`/branch/${id}`),

  //department

  getdepartment: () => api.get("/department"),
  createDepartment: (data: any) => api.post("/department/add", data),
  updateDepartment: (id: string, data: any) => api.put(`/department/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/department/${id}`),

  // designation 

  getDesignation: () => api.get("/designation"),
  createDesignation: (data: any) => api.post("/designation/add", data),
  updateDesignation: (id: string, data: any) => api.put(`/designation/${id}`, data),
  deleteDesignation: (id: string) => api.delete(`/designation/${id}`),

  // roles

  getRoles: () => api.get("/role"),
  getRoleCatalog: () => api.get("/role/catalog"),
  getRoleById: (id: string) => api.get(`/role/${id}`),
  createRole: (data: any) => api.post("/role/add", data),
  updateRole: (id: string, data: any) => api.put(`/role/${id}`, data),
  deleteRole: (id: string) => api.delete(`/role/${id}`),

  // role assignments
  assignRoleToEmployee: (data: any) => api.post("/role/assign", data),
  removeRoleFromEmployee: (assignmentId: string) => api.delete(`/role/assignments/${assignmentId}`),
  getRoleAssignments: () => api.get("/role/assignments"),
  getEmployeeRoles: (employee_id: string) => api.get(`/role/assignments/employee/${employee_id}`),

  //range

  getSequences: () => api.get("/autonumber"),

  createSequence: (data: any) => api.post("/autonumber/", data),
  updateSequence: (id: string, data: any) => api.put(`/autonumber/${id}`, data),
  deleteSequence: (id: string) => api.delete(`/autonumber/${id}`),

  // employee

  getEmployee: () => api.get("/employee"),
  createEmployee: (data: any, config = {}) =>
    api.post("/employee/add", data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config as any).headers,
      },
    }),
  // updateEmployee: (id: string, data: any, config = {}) => 
  //   api.put(`/employee/${id}`, data, config),
  updateEmployee: (id: string, data: any, config = {}) =>
    api.put(`/employee/${id}`, data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config as any).headers,
      },
    }),

  deleteEmployee: (id: string) => api.delete(`/employee/${id}`),

  // Pulse Surveys (New)
  createPulseSurvey: (data: any) => api.post("/pulse-surveys", data),
  getPulseAdminOverview: () => api.get("/pulse-surveys/admin/overview"),
  getPulseAdminSurveys: () => api.get("/pulse-surveys/admin"),
  getPulseAdminSurvey: (id: string | number) => api.get(`/pulse-surveys/admin/${id}`),
  getPulseAdminSurveyResponses: (id: string | number) =>
    api.get(`/pulse-surveys/admin/${id}/responses`),
  getMyPulseSurveys: () => api.get("/pulse-surveys/my"),
  getPulseSurvey: (id: string | number) => api.get(`/pulse-surveys/${id}`),
  respondPulseSurvey: (id: string | number, data: any) =>
    api.post(`/pulse-surveys/${id}/respond`, data),
  getPulseSurveyTemplates: (params?: any) => api.get("/pulse-surveys/templates", { params }),
  createPulseSurveyTemplate: (data: any) => api.post("/pulse-surveys/templates", data),
  updatePulseSurveyTemplate: (id: string | number, data: any) =>
    api.put(`/pulse-surveys/templates/${id}`, data),
  deletePulseSurveyTemplate: (id: string | number) =>
    api.delete(`/pulse-surveys/templates/${id}`),

  // Employee Feedback (Anonymous)
  submitEmployeeFeedback: (data: any) => api.post("/surveys/feedback", data),
  getEmployeeFeedbackAdmin: () => api.get("/surveys/feedback"),
  updateEmployeeFeedbackStatus: (id: string | number, status: string) =>
    api.put(`/surveys/feedback/${id}/status`, { status }),
  deleteEmployeeFeedback: (id: string | number) =>
    api.delete(`/surveys/feedback/${id}`),

  // attendance

  getAttendanceStatus: () => api.get("/attendance/status"),

  checkIn: (data: FormData) =>
    api.post("/attendance/check-in", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  checkOut: (data: FormData) =>
    api.post("/attendance/check-out", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),


  getAttendanceLogs: (params?: any) =>
    api.get("/attendance/logs", { params }),

  createOverride: (data: any) =>
    api.post("/attendance/overrides", data),

  processOverride: (overrideId: string, data: any) =>
    api.put(`/attendance/overrides/${overrideId}/process`, data),

  getEmployeeSummary: (employeeId: string, params?: any) =>
    api.get(`/attendance/summary/employee/${employeeId}`, { params }),

  getOverrides: (params?: any) => api.get("/attendance/overrides", { params }),

  //asset

  getAsset: () => api.get("/asset"),
  createAsset: (data: any) => api.post("/asset/add", data),
  updateAsset: (id: string, data: any) => api.put(`/asset/${id}`, data),
  deleteAsset: (id: string) => api.delete(`/asset/${id}`),

  //expense

  getExpense: () => api.get("/expenses"),
  getPendingExpenses: () => api.get("/expenses/pending"),
  createExpense: (data: any) => {
    const formData = new FormData();
    
    // Append receipt file if it exists
    if (data.receipt) {
      formData.append('receipt', data.receipt);
    }
    
    // Append other form fields
    if (data.category) formData.append('category', data.category);
    if (data.amount) formData.append('amount', data.amount);
    if (data.expense_date) formData.append('expense_date', data.expense_date);
    if (data.description) formData.append('description', data.description);
    
    return api.post("/expenses/submit", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateExpense: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
  scanReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post("/expenses/scan-receipt", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportExpenses: (exportData: {
    employeeIds: string[];
    format: 'csv' | 'json';
    statusFilter?: string;
    dateFilter?: {
      startDate?: string;
      endDate?: string;
    };
  }) => {
    return api.post("/expenses/export", exportData, {
      responseType: exportData.format === 'csv' ? 'blob' : 'json',
    });
  },

  //resignation

  getResignation: () => api.get("/resignations"),
  createResignation: (data: any) => api.post("/resignations/create", data),
  updateResignation: (id: string, data: any) => api.put(`/resignations/${id}`, data),

  //checklist

  getChecklists: () => api.get("/checklists"),
  //createChecklist: (data: any) => api.post("/checklist/add", data),
  updateChecklist: (id: string, data: any) => api.put(`/checklists/${id}`, data),
  //deleteChecklist: (id: string) => api.delete(`/checklist/${id}`),

  //leave
  applyleave: (data: any) => api.post("/leave/apply", data),
  getLeave: () => api.get("/leave/types"),
  createLeave: (data: any) => api.post("/leavetype/leave-types", data),
  updateLeave: (id: string, data: any) => api.put(`/leavetype/leave-types/${id}`, data),
  deleteLeave: (id: string) => api.delete(`/leavetype/leave-types/${id}`),
  updatestatusLeaveApplication: (id: string, data: any) => api.put(`/leave/${id}/status`, data),

  getLeaveBalance: () => api.get("/leave/balance"),
  getleaveapplications: () => api.get("/leave/applications"),

  getHolidays: () => api.get("/holidays"),
  createHoliday: (data: any) => api.post("/holidays", data),
  updateHoliday: (id: string, data: any) => api.put(`/holidays/${id}`, data),
  deleteHoliday: (id: string) => api.delete(`/holidays/${id}`),

  getFiscalYears: () => api.get("/fiscalyears"),
  createFiscalYear: (data: any) => api.post("/fiscalyears", data),
  updateFiscalYear: (id: string, data: any) => api.put(`/fiscalyears/${id}`, data),
  deleteFiscalYear: (id: string) => api.delete(`/fiscalyears/${id}`),

  getLeavePolicies: () => api.get("/leavepolicy"),
  createLeavePolicy: (data: any) => api.post("/leavepolicy", data),
  updateLeavePolicy: (id: string, data: any) => api.put(`/leavepolicy/${id}`, data),
  deleteLeavePolicy: (id: string) => api.delete(`/leavepolicy/${id}`),
  getleaveusers:() =>api.get("/leave/relevant-users"),

  //leave permission
  applyLeavePermission: (data: any, config = {}) =>
    api.post("/leave-permission/apply", data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config as any).headers,
      },
    }),
  getLeavePermissionApplications: () => api.get("/leave-permission/applications"),
  updateLeavePermissionStatus: (id: string, data: any) => api.put(`/leave-permission/${id}/status`, data),
  getLeavePermissionUsers: () => api.get("/leave-permission/relevant-users"),



  //payroll

  createSalaryStructure: (data: any) => api.post("/payroll/salary-structure", data),
  getSalaryStructure: () => api.get("/payroll/salary-structure"),

  updateSalaryStructure: (id: string, data: any) => api.put(`/payroll/structure/${id}`, data),
  deleteSalaryStructure: (id: string) => api.delete(`/payroll/structure/${id}`),

  getpayslip: () => api.get("/payroll"),

  getEmployeePayslips: () => api.get("/payroll/employee/payslips"),

  getPayslipPreview: (employeeId: string, month: string) => api.get(`/payroll/${employeeId}/${month}`),

  //reports

  getAttendanceReport: () => api.get("/reports/attendance"),
  getpayrollReport: () => api.get("/reports/payroll"),
  getexpenseReport: () => api.get("/reports/expenses"),
  getleaveReport: () => api.get("/reports/leaves"),

  //shifts

  getshifts: () => api.get("/shifts"),
  createShift: (data: any) => api.post("/shifts", data),
  updateShift: (id: string, data: any) => api.put(`/shifts/${id}`, data),
  deleteShift: (id: string) => api.delete(`/shifts/${id}`),

  //dashboard
  getAdminDashboardData: () => api.get("/dashboard/admin-dashboard"),
  getEmployeeDashboardData: () => api.get("/dashboard/employee-dashboard"),
  getManagerDashboardData: () => api.get("/dashboard/manager-dashboard"),
  getHRDashboardData: () => api.get("/dashboard/hr-dashboard"),
  getFinanceDashboardData: () => api.get("/dashboard/finance-dashboard"),

  //notifications
  getNotifications: () => api.get("/notifications"),
  createNotification: (data: any) => api.post("/notifications", data),
  markNotificationAsRead: (notificationId: string) => api.put(`/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.put("/notifications/read-all"),
  deleteNotification: (notificationId: string) => api.delete(`/notifications/${notificationId}`),

  //clients
  getClients: () => api.get("/clients"),
  createClient: (data: any) => api.post("/clients", data),
  updateClient: (id: string, data: any) => api.put(`/clients/${id}`, data),
  deleteClient: (id: string) => api.delete(`/clients/${id}`),
  getEmployeesForAssignment: () => api.get("/clients/employees"),

  // User Management
  getUsers: () => api.get("/users"),
  getUserById: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post("/users", data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // Organization Management
  getOrganizations: () => api.get("/organizations"),
  getOrganizationById: (id: string) => api.get(`/organizations/${id}`),
  createOrganization: (data: any) => api.post("/organizations", data),
  updateOrganization: (id: string, data: any) => api.put(`/organizations/${id}`, data),
  deleteOrganization: (id: string) => api.delete(`/organizations/${id}`),

  // Organization Helper Functions
  fetchOrganizations: async (): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getOrganizations();
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to fetch organizations' };
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch organizations'
      };
    }
  },

  fetchOrganizationById: async (id: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getOrganizationById(id);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Organization not found' };
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      return {
        error: error.response?.data?.message || 'Organization not found'
      };
    }
  },

  addOrganization: async (data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createOrganization(data);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to create organization' };
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return {
        error: error.response?.data?.message || 'Failed to create organization'
      };
    }
  },

  editOrganization: async (id: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateOrganization(id, data);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update organization' };
    } catch (error: any) {
      console.error('Error updating organization:', error);
      return {
        error: error.response?.data?.message || 'Failed to update organization'
      };
    }
  },

  removeOrganization: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteOrganization(id);
      if (response.data && response.data.success) {
        return { success: true };
      }
      return { error: 'Failed to delete organization' };
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      return {
        error: error.response?.data?.message || 'Failed to delete organization'
      };
    }
  },

  //clint attendance

  getallattendance: () => api.get("/client-attendance/all"),


  // Custom attendance and payslip functions
  getAttendance: async (employeeId: string, month: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await api.get(`/attendance/${employeeId}/${month}`);
      if (response.data && response.data.success) {
        return { data: response.data.attendance };
      }
      return { error: 'No attendance data available' };
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch attendance'
      };
    }
  },

  getPayslip: async (): Promise<{ data?: any; error?: string }> => {
    try {
      let response;
      // Permission-first endpoint fallback chain (no hardcoded role names)
      try {
        response = await api.get("/payroll/employee/payslips");
      } catch (error) {
        try {
          response = await api.get("/payroll/payslips");
        } catch (innerError) {
          response = await api.get("/payroll");
        }
      }

      console.log('Raw API response:', response.data);

      if (response.data && (response.data.payrolls || response.data)) {
        const payrollsData = response.data.payrolls || response.data;
        console.log('Found payrolls array:', payrollsData);
        // Transform API response to match the expected payslip interface
        const transformedData = payrollsData.map((item: any) => ({
          id: item.id.toString(),
          employeeId: (item.employee_id || item.employeeId || '').toString(),
          employeeName: item.employeeName || `${item.first_name || ''} ${item.last_name || ''}`.trim() || `Employee ${item.employee_id || item.employeeId}`,
          month: item.month,
          payableDays: item.payable_days || 0,
          lopAmount: parseFloat(item.lop_amount) || 0,
          gross: parseFloat(item.gross) || 0,
          deductions: parseFloat(item.deductions) || 0,
          net: parseFloat(item.net) || 0,
          status: item.status || 'draft',
          number: `PS/${item.month?.replace('-', '/')}/${item.id?.toString().padStart(3, '0') || '001'}`,
          generatedOn: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          createdAt: item.created_at || new Date().toISOString(),
        }));
        console.log('Transformed data:', transformedData);
        return { data: transformedData };
      } else if (response.data) {
        return { data: response.data };
      }
      return { error: 'No payslip data available' };
    } catch (error: any) {
      console.error('Error fetching payslips:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch payslips'
      };
    }
  },

  //profile
  getProfile: () => api.get(`/profile/me`),
  updateProfile: (data: FormData) =>
    api.put(`/profile/me`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  deleteMyAccount: (confirmation: string) =>
    api.delete(`/profile/me/account`, {
      data: { confirmation }
    }),

  //activities
  getActivities: () => api.get("/activities"),
  logActivity: (data: any) => api.post("/activities", data),

  //documents
  getDocuments: () => api.get("/documents"),
  downloadDocument: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  //tickets
  getTickets: () => api.get("/tickets"),
  createTicket: (data: any) => api.post("/tickets", data),
  updateTicket: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  deleteTicket: (id: string) => api.delete(`/tickets/${id}`),
  getTicketUsers: () => api.get("/tickets/users"),

  // Super Admin
  getSuperAdminStats: () => api.get("/superadmin/stats"),
  getSuperAdminCompanies: () => api.get("/superadmin/companies"),
  getSuperAdminTickets: (params?: any) => api.get("/superadmin/tickets", { params }),
  getOrganizationTickets: (orgId: string, params?: any) => api.get(`/superadmin/organizations/${orgId}/tickets`, { params }),
  getOrganizationStats: () => api.get("/superadmin/organization-stats"),

  // Subscription Management
  getSubscriptionPlans: () => api.get("/subscription/plans"),
  getAllSubscriptionPlans: () => api.get("/subscription/plans/all"),
  getCurrentSubscription: () => api.get("/subscription/current"),
  getSubscriptionPayments: () => api.get("/subscription/payments"),
  startSubscriptionTrial: (planId: number) => api.post("/subscription/start-trial", { plan_id: planId }),
  upgradeSubscription: (data: any) => api.post("/subscription/upgrade", data),
  createSubscriptionUpgradeOrder: (planId: number) => api.post("/subscription/upgrade/create-order", { plan_id: planId }),
  verifySubscriptionUpgradePayment: (data: any) => api.post("/subscription/upgrade/verify-payment", data),
  createSubscriptionPlan: (data: any) => api.post("/subscription/plans", data),
  updateSubscriptionPlan: (planId: number, data: any) => api.put(`/subscription/plans/${planId}`, data),
  deleteSubscriptionPlan: (planId: number) => api.delete(`/subscription/plans/${planId}`),
  patchSubscriptionPlan: (planId: number, data: any) => api.patch(`/subscription/plans/${planId}`, data),
  getAllSubscriptions: () => api.get("/subscription/all"),


//RMS

  getJobRequirements: () => api.get("/job-requirements"),
  createJobRequirement: (data: any) => api.post("/job-requirements", data),
  updateJobRequirement: (id: string, data: any) => api.put(`/job-requirements/${id}`, data),
  deleteJobRequirement: (id: string) => api.delete(`/job-requirements/${id}`),
  getJobRequirementsStats: () => api.get("/job-requirements/stats"),

  // Settlement
  getSettlements: (params?: any) => api.get("/settlement", { params }),
  getSettlementById: (id: number) => api.get(`/settlement/${id}`),
  createSettlement: (data: any) => api.post("/settlement", data),
  updateSettlement: (id: number, data: any) => api.put(`/settlement/${id}`, data),
  calculateSettlement: (id: number) => api.post(`/settlement/${id}/calculate`),
  approveSettlement: (id: number, data: any) => api.post(`/settlement/${id}/approve`, data),
  rejectSettlement: (id: number, data: any) => api.post(`/settlement/${id}/reject`, data),
  getEmployeesForSettlement: (params?: any) => api.get("/settlement/employees", { params }),
  downloadSettlementReport: (id: number) => api.get(`/settlement/${id}/download`, { responseType: 'blob' }),
  sendSettlementEmail: (data: any) => api.post("/settlement/send-email", data),

  // Recruitment
  getCandidates: (params?: any) => api.get("/recruitment/candidates", { params }),
  getCandidateById: (id: string) => api.get(`/recruitment/candidates/${id}`),
  createCandidate: (data: any) => api.post("/recruitment/candidates", data),
  updateCandidate: (id: string, data: any) => api.put(`/recruitment/candidates/${id}`, data),
  updateCandidateStatus: (id: string, status: string) => api.put(`/recruitment/candidates/${id}/status`, { status }),
  deleteCandidate: (id: string) => api.delete(`/recruitment/candidates/${id}`),
  createInterview: (candidateId: string, data: any) => api.post(`/recruitment/candidates/${candidateId}/interviews`, data),
  updateInterview: (interviewId: string, data: any) => api.put(`/recruitment/interviews/${interviewId}`, data),
  getRecruitmentStats: () => api.get("/recruitment/stats"),

  // Recruitment helper functions with error handling
  fetchCandidates: async (params?: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getCandidates(params);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to fetch candidates' };
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch candidates'
      };
    }
  },

  fetchCandidateById: async (id: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getCandidateById(id);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Candidate not found' };
    } catch (error: any) {
      console.error('Error fetching candidate:', error);
      return {
        error: error.response?.data?.message || 'Candidate not found'
      };
    }
  }, // <--- Added closing bracket here

  addCandidate: async (data: any): Promise<{ data?: any; error?: string }> => {
    try {
      // Convert camelCase to snake_case for backend
      const backendData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        experience: data.experience,
        current_company: data.currentCompany,
        expected_salary: data.expectedSalary,
        notice_period: data.noticePeriod,
        skills: data.skills,
        resume_url: data.resumeUrl,
        source: data.source,
        applied_date: data.appliedDate,
        status: data.status,
        notes: data.notes
      };
      
      const response = await ENDPOINTS.createCandidate(backendData);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to create candidate' };
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      return {
        error: error.response?.data?.message || 'Failed to create candidate'
      };
    }
  },

  editCandidate: async (id: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      // Convert camelCase to snake_case for backend
      const backendData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        experience: data.experience,
        current_company: data.currentCompany,
        expected_salary: data.expectedSalary,
        notice_period: data.noticePeriod,
        skills: data.skills,
        resume_url: data.resumeUrl,
        source: data.source,
        applied_date: data.appliedDate,
        status: data.status,
        notes: data.notes
      };
      
      const response = await ENDPOINTS.updateCandidate(id, backendData);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update candidate' };
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      return {
        error: error.response?.data?.message || 'Failed to update candidate'
      };
    }
  },

  changeCandidateStatus: async (id: string, status: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateCandidateStatus(id, status);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update candidate status' };
    } catch (error: any) {
      console.error('Error updating candidate status:', error);
      return {
        error: error.response?.data?.message || 'Failed to update candidate status'
      };
    }
  },

  removeCandidate: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteCandidate(id);
      if (response.data && response.data.success) {
        return { success: true };
      }
      return { error: 'Failed to delete candidate' };
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      return {
        error: error.response?.data?.message || 'Failed to delete candidate'
      };
    }
  },

  scheduleInterview: async (candidateId: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createInterview(candidateId, data);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to schedule interview' };
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      return {
        error: error.response?.data?.message || 'Failed to schedule interview'
      };
    }
  },

  fetchRecruitmentStats: async (): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getRecruitmentStats();
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to fetch recruitment statistics' };
    } catch (error: any) {
      console.error('Error fetching recruitment stats:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch recruitment statistics'
      };
    }
  },

  // User Management Helper Functions
  fetchUsers: async (): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getUsers();
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to fetch users' };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        error: error.response?.data?.message || 'Failed to fetch users'
      };
    }
  },

  fetchUserById: async (id: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getUserById(id);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'User not found' };
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return {
        error: error.response?.data?.message || 'User not found'
      };
    }
  },

  addUser: async (data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createUser(data);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to create user' };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        error: error.response?.data?.message || 'Failed to create user'
      };
    }
  },

  editUser: async (id: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateUser(id, data);
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update user' };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return {
        error: error.response?.data?.message || 'Failed to update user'
      };
    }
  },

  removeUser: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteUser(id);
      if (response.data && response.data.success) {
        return { success: true };
      }
      return { error: 'Failed to delete user' };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        error: error.response?.data?.message || 'Failed to delete user'
      };
    }
  },

  updateUserRole: async (id: string, role: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateUser(id, { role });
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update user role' };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      return {
        error: error.response?.data?.message || 'Failed to update user role'
      };
    }
  },

  updateUserStatus: async (id: string, status: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateUser(id, { status });
      if (response.data && response.data.success) {
        return { data: response.data.data };
      }
      return { error: 'Failed to update user status' };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      return {
        error: error.response?.data?.message || 'Failed to update user status'
      };
    }
  },

};

export default ENDPOINTS;
export { api, ENDPOINTS };
