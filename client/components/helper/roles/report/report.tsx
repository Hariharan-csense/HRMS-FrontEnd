import ENDPOINTS from "@/lib/endpoint";

export const reportService = {
  // Get attendance report
  getReportFilters: async () => {
    try {
      const response = await ENDPOINTS.getReportFilters();
      return response;
    } catch (error) {
      console.error("Error fetching report filters:", error);
      throw error;
    }
  },

  getAttendanceReport: async (params?: any) => {
    try {
      const response = await ENDPOINTS.getAttendanceReport(params);
      return response;
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      throw error;
    }
  },

  // Get payroll report
  getPayrollReport: async (params?: any) => {
    try {
      const response = await ENDPOINTS.getpayrollReport(params);
      return response;
    } catch (error) {
      console.error("Error fetching payroll report:", error);
      throw error;
    }
  },

  // Get expense report
  getExpenseReport: async (params?: any) => {
    try {
      const response = await ENDPOINTS.getexpenseReport(params);
      return response;
    } catch (error) {
      console.error("Error fetching expense report:", error);
      throw error;
    }
  },

  // Get leave report
  getLeaveReport: async (params?: any) => {
    try {
      const response = await ENDPOINTS.getleaveReport(params);
      return response;
    } catch (error) {
      console.error("Error fetching leave report:", error);
      throw error;
    }
  }
};

export default reportService;
