import ENDPOINTS from "@/lib/endpoint";

export const reportService = {
  // Get attendance report
  getAttendanceReport: async () => {
    try {
      const response = await ENDPOINTS.getAttendanceReport();
      return response;
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      throw error;
    }
  },

  // Get payroll report
  getPayrollReport: async () => {
    try {
      const response = await ENDPOINTS.getpayrollReport();
      return response;
    } catch (error) {
      console.error("Error fetching payroll report:", error);
      throw error;
    }
  },

  // Get expense report
  getExpenseReport: async () => {
    try {
      const response = await ENDPOINTS.getexpenseReport();
      return response;
    } catch (error) {
      console.error("Error fetching expense report:", error);
      throw error;
    }
  },

  // Get leave report
  getLeaveReport: async () => {
    try {
      const response = await ENDPOINTS.getleaveReport();
      return response;
    } catch (error) {
      console.error("Error fetching leave report:", error);
      throw error;
    }
  }
};

export default reportService;