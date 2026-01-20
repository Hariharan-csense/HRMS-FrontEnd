  // src/components/utils/api.ts
import axios from "axios";

// Export the base URL for use in other components
export const BASE_URL = "http://192.168.1.9:3000";

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

  // checkIn: (data: FormData) =>
  //     api.post("/attendance/check-in", data),

  //   checkOut: (data: FormData) =>
  //     api.post("/attendance/check-out", data),

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

  getExpense: () => api.get("/expense"),
  createExpense: (data: any) => api.post("/expense/add", data),
  updateExpense: (id: string, data: any) => api.put(`/expense/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expense/${id}`),

  //resignation

  getResignation: () => api.get("/resignations"),
  createResignation: (data: any) => api.post("/resignations/create", data),
  updateResignation: (id: string, data: any) => api.put(`/resignations/${id}`, data),

  //checklist

  getChecklist: () => api.get("/checklists"),
  //createChecklist: (data: any) => api.post("/checklist/add", data),
  updateChecklist: (id: string, data: any) => api.put(`/checklists/${id}`, data),
  //deleteChecklist: (id: string) => api.delete(`/checklist/${id}`),

  //leave
  getLeave: () => api.get("/leave/types"),
  createLeave: (data: any) => api.post("/leavetype/leave-types", data),
  updateLeave: (id: string, data: any) => api.put(`/leavetype/leave-types/${id}`, data),
  deleteLeave: (id: string) => api.delete(`/leavetype/leave-types/${id}`),

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


  //payroll
  
  createSalaryStructure: (data: any) => api.post("/payroll/salary-structure", data),
  getSalaryStructure: () => api.get("/payroll/salary-structure"),

  updateSalaryStructure: (id: string, data: any) => api.put(`/payroll/structure/${id}`, data),
  deleteSalaryStructure: (id: string) => api.delete(`/payroll/structure/${id}`),

  getpayslip:()=>api.get("/payroll"),
  
  getEmployeePayslips: ()=>api.get("/payroll/employee/payslips"),

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

//notifications
getNotifications: () => api.get("/notifications"),
createNotification: (data: any) => api.post("/notifications", data),
markNotificationAsRead: (notificationId: string) => api.put(`/notifications/${notificationId}/read`),
markAllNotificationsAsRead: () => api.put("/notifications/read-all"),
deleteNotification: (notificationId: string) => api.delete(`/notifications/${notificationId}`),

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


  };

  export default ENDPOINTS;