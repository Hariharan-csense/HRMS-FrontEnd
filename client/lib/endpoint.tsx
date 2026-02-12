// src/components/utils/api.ts
import axios from "axios";

// Export the base URL for use in other components
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

// Attach token dynamically on EVERY request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Global response handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const ENDPOINTS = {
  // Auth
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
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
  updateCompany: (id: string, data: any) => api.put(`/company/update`, { id, ...data }),
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
    api.post("/overrides", data),

  processOverride: (overrideId: string, data: any) =>
    api.put(`/overrides/${overrideId}/process`, data),

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

      // Check if user is employee and use employee-specific endpoint
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isEmployee = user.roles && user.roles.includes("employee") && !user.roles.includes("admin") && !user.roles.includes("hr") && !user.roles.includes("finance");

      if (isEmployee) {
        console.log('Employee user, trying /payroll/employee/payslips endpoint');
        try {
          response = await api.get("/payroll/employee/payslips");
        } catch (error) {
          console.log('Employee payslips endpoint failed, trying general payslips endpoint');
          response = await api.get("/payroll/payslips");
        }
      } else {
        console.log('Admin/HR/Finance user, trying /payroll/payslips endpoint');
        try {
          response = await api.get("/payroll/payslips");
        } catch (error) {
          console.log('/payroll/payslips failed, trying /payroll');
          // Fallback to the general payroll endpoint
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

};

export default ENDPOINTS;
export { api, ENDPOINTS };