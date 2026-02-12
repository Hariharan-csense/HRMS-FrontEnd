import ENDPOINTS from "@/lib/endpoint";
import { AttendanceLog, AttendanceLogFilters } from "../attendance/attendance";



export const liveApi = {
    

  getEmployees: async (): Promise<{ data?: any[]; error?: string }> => {
    try {
      console.log("Fetching employees from backend..."); 

      const response = await ENDPOINTS.getEmployee();

      console.log("Employee API Raw Response:", response); 

      
      const rawData = response?.data;
      let employees: any[] = [];

      if (Array.isArray(rawData)) {
        employees = rawData;
      } else if (rawData?.success && Array.isArray(rawData.data)) {
        employees = rawData.data;
      } else if (Array.isArray(rawData?.employees)) {
        employees = rawData.employees;
      }

      
      const trackedEmployees = employees.filter(emp => emp.location_tracking_enabled === 1);
      
      console.log(`Total employees: ${employees.length}, Tracked employees: ${trackedEmployees.length}`);

      
      if (trackedEmployees.length > 0) {
        try {
          const attendanceResponse = await fetch('/api/attendance/locations', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            const attendanceLocations = attendanceData.locations || attendanceData.data || [];
            
            console.log('Attendance locations fetched:', attendanceLocations.length);

            
            const employeesWithLocation = trackedEmployees.map(employee => {
              const attendanceRecord = attendanceLocations.find(
                att => att.employee_id === employee.id || att.employeeId === employee.id
              );

              return {
                ...employee,
                
                latitude: attendanceRecord?.latitude || null,
                longitude: attendanceRecord?.longitude || null,
                accuracy: attendanceRecord?.accuracy || null,
                address: attendanceRecord?.address || null,
                locationTimestamp: attendanceRecord?.timestamp || attendanceRecord?.location_timestamp || null,
                isTracking: attendanceRecord ? true : false,
                trackingStatus: attendanceRecord ? 'active' : 'offline',
                deviceInfo: attendanceRecord?.device_info || null
              };
            });

            console.log('Employees with location data:', employeesWithLocation.length);
            return { data: employeesWithLocation };
          }
        } catch (attendanceError) {
          console.warn('Failed to fetch attendance locations:', attendanceError);
          // Return tracked employees without location data
          const employeesWithoutLocation = trackedEmployees.map(employee => ({
            ...employee,
            latitude: null,
            longitude: null,
            accuracy: null,
            address: null,
            locationTimestamp: null,
            isTracking: false,
            trackingStatus: 'offline',
            deviceInfo: null
          }));
          return { data: employeesWithoutLocation };
        }
      }

      return { data: trackedEmployees };

    } catch (error: any) {
      console.error("Error fetching employees:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to load employees";

      return { error: errorMsg };
    }
  },

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


}