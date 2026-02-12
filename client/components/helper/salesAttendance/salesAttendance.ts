import { api } from '@/lib/endpoint';

export interface SalesEmployeeComparison {
  employee_id: string;
  employee_name: string;
  email: string;
  department: string;
  total_working_days: number;
  regular_attendance_days: number;
  client_attendance_days: number;
  both_attendance_days: number;
  client_only_days: number;
  regular_only_days: number;
  total_client_hours: number;
  unique_clients_visited: number;
  attendance_pattern: string;
  client_attendance_percentage: number;
}

export interface DepartmentSummary {
  total_sales_employees: number;
  employees_with_client_attendance: number;
  employees_with_regular_attendance: number;
  total_client_visits: number;
  total_regular_days: number;
  total_client_hours: number;
  average_client_attendance_percentage: number;
}

export interface SalesAttendanceData {
  department_summary: DepartmentSummary;
  employee_comparison: SalesEmployeeComparison[];
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface ClientAttendanceDetail {
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  work_completed?: string;
  check_out_location?: string;
  check_out_notes?: string;
  geo_fence_verified?: boolean;
  geo_fence_verified_checkout?: boolean;
  distance_from_client?: number;
  distance_from_client_checkout?: number;
}

export interface DailyAttendanceRecord {
  date: string;
  regular_check_in?: string;
  regular_check_out?: string;
  client_first_check_in?: string;
  client_last_check_out?: string;
  client_visits?: number;
  total_minutes?: number;
  attendance_pattern: 'Both' | 'Regular Only' | 'Client Only' | 'No Attendance';
  client_attendance_details?: ClientAttendanceDetail[];
}

export interface SalesEmployeeDetail {
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    department_name: string;
  };
  daily_comparison: DailyAttendanceRecord[];
  period: {
    start_date: string;
    end_date: string;
  };
}

export const salesAttendanceApi = {
  // Get sales department attendance comparison
  getComparison: async (params?: { startDate?: string; endDate?: string }) => {
    try {
      const response = await api.get("/sales-attendance/comparison", {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales attendance comparison:', error);
      throw error;
    }
  },

  // Get detailed attendance for specific sales employee
  getEmployeeDetail: async (employeeId: string, params?: { startDate?: string; endDate?: string }) => {
    try {
      const response = await api.get(`/sales-attendance/employee/${employeeId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee detail:', error);
      throw error;
    }
  }
};
