// src/api/attendanceApi.ts

import ENDPOINTS from "@/lib/endpoint"; // உங்க ENDPOINTS path correct ஆ மாத்திக்கோங்க

export interface AttendanceLogFilters {
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD
  employeeId?: string;
  status?: "present" | "absent" | "late" | "half-day" | "holiday" | "override";
  page?: number;
  limit?: number;
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  late_by?: string;
  early_by?: string;
  worked_hours?: string;
  image_in?: string;
  image_out?: string;
  // extra fields if needed
}

export const attendanceApi = {
  // Get attendance logs with filters
  getAttendanceLogs: async (filters?: AttendanceLogFilters): Promise<{
    data?: AttendanceLog[];
    total?: number;
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.getAttendanceLogs(filters);
      return {
        data: response.data.logs || response.data.data || response.data,
        total: response.data.total || response.data.count,
      };
    } catch (error: any) {
      console.error("Error fetching attendance logs:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch attendance logs",
      };
    }
  },

  // Check-in
  checkIn: async (formData: FormData) => {
    try {
      const response = await ENDPOINTS.checkIn(formData);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Check-in failed" };
    }
  },

  // Check-out
  checkOut: async (formData: FormData) => {
    try {
      const response = await ENDPOINTS.checkOut(formData);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Check-out failed" };
    }
  },

  // Create override request
  createOverride: async (data: {
    
    date: string;
    reason: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
  }) => {
    try {
      const response = await ENDPOINTS.createOverride(data);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Failed to create override request" };
    }
  },

  // Process override (approve/reject)
  processOverride: async (
    overrideId: string,
    action: { status: "approved" | "rejected"; remarks?: string }
  ) => {
    try {
      const response = await ENDPOINTS.processOverride(overrideId, action);
      return { data: response.data, success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Failed to process override" };
    }
  },

  // Get employee monthly summary
  getEmployeeSummary: async (
    employeeId: string,
    monthYear?: string // format: "2026-01"
  ) => {
    try {
      const response = await ENDPOINTS.getEmployeeSummary(employeeId, {
        month: monthYear,
      });
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Failed to fetch summary" };
    }
  },

 // src/api/attendanceApi.ts

getOverrides: async (filters?: {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<{ data?: OverrideRecord[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getOverrides(filters);
    
    // Backend response structure பொறுத்து adjust பண்ணுங்க
    // Example: { success: true, data: [...] }
    const overrideList = response.data?.data || response.data || [];

    return { data: overrideList };
  } catch (error: any) {
    console.error("Error fetching overrides:", error);
    return {
      error: error.response?.data?.message || "Failed to fetch override history",
    };
  }
},


};

export default attendanceApi;