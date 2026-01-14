import ENDPOINTS from "@/lib/endpoint";
import axios from "axios";

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  reportingManager?: string;
  basic: number;
  hra: number;
  allowances: number;
  incentives: number;
  gross: number;
  pf: number;
  esi: number;
  pt: number;
  tds: number;
  otherDeductions: number;
  createdAt: string;
}

export const payrollApi = {
  getSalaryStructures: async (): Promise<{ data?: SalaryStructure[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getSalaryStructure();
      if (response.data) {
        // Transform the API response to match the SalaryStructure interface
        const transformedData = response.data.map((item: any) => ({
          id: item.id.toString(),
          employeeId: item.employee_id.toString(),
          employeeName: item.employee_name || `Employee ${item.employee_id}`,
          basic: parseFloat(item.basic) || 0,
          hra: parseFloat(item.hra) || 0,
          allowances: parseFloat(item.allowances) || 0,
          incentives: parseFloat(item.incentives) || 0,
          gross: parseFloat(item.gross) || 0,
          pf: parseFloat(item.pf) || 0,
          esi: parseFloat(item.esi) || 0,
          pt: parseFloat(item.pt) || 0,
          tds: parseFloat(item.tds) || 0,
          otherDeductions: parseFloat(item.other_deductions) || 0,
          createdAt: item.created_at || new Date().toISOString(),
        }));
        return { data: transformedData };
      }
      return { error: 'No salary structure data available' };
    } catch (error: any) {
      console.error('Error fetching salary structures:', error);
      return { 
        error: error.response?.data?.message || 'Failed to fetch salary structures' 
      };
    }
  },

  createSalaryStructure: async (data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.createSalaryStructure(data);
      if (response.data?.success) {
        return { data: response.data };
      }
      return { error: 'Failed to create salary structure' };
    } catch (error: any) {
      console.error('Error creating salary structure:', error);
      return { 
        error: error.response?.data?.message || 'Failed to create salary structure' 
      };
    }
  },

  updateSalaryStructure: async (id: string, data: any): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateSalaryStructure(id, data);
      if (response.data?.success) {
        return { data: response.data };
      }
      return { error: 'Failed to update salary structure' };
    } catch (error: any) {
      console.error('Error updating salary structure:', error);
      return { 
        error: error.response?.data?.message || 'Failed to update salary structure' 
      };
    }
  },

  deleteSalaryStructure: async (id: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteSalaryStructure(id);
      if (response.data?.success) {
        return { data: response.data };
      }
      return { error: 'Failed to delete salary structure' };
    } catch (error: any) {
      console.error('Error deleting salary structure:', error);
      return { 
        error: error.response?.data?.message || 'Failed to delete salary structure' 
      };
    }
  },

  getPayslip: async (): Promise<{ data?: any; error?: string }> => {
    try {
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

  getPayslipPreview: async (employeeId: string, month: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.getPayslipPreview(employeeId, month);
      if (response.data) {
        return { data: response.data };
      }
      return { error: 'No payslip preview data available' };
    } catch (error: any) {
      console.error('Error fetching payslip preview:', error);
      return { 
        error: error.response?.data?.message || 'Failed to fetch payslip preview' 
      };
    }
  },

  getAttendance: async (employeeId: string, month: string): Promise<{ data?: any; error?: string }> => {
    try {
      const api = axios.create({
        baseURL: "http://localhost:3000/api",
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      // Attach token dynamically
      api.interceptors.request.use((config) => {
        const token = localStorage.getItem("accessToken"); 
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

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
};

export default payrollApi;