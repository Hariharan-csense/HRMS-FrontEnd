  // src/components/utils/api.ts
  import axios from "axios";

  const api = axios.create({
    baseURL: "http://192.168.1.8:3000/api",
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

  getpayslip:()=>api.get("/payroll/payslips"),
  
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

  //attendance 

  



  };

  export default ENDPOINTS;