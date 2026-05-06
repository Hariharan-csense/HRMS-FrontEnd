// src/api/employeeApi.ts
import ENDPOINTS from "@/lib/endpoint";

export interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
}


export const employeeApi = {
  // Get all employees
  // getEmployees: async (): Promise<{ data?: any[]; error?: string }> => {
  //   try {
  //     const response = await ENDPOINTS.getEmployee();
  //     return { data: response.data || [] };
  //   } catch (error: any) {
  //     console.error("Error fetching employees:", error);
  //     return { error: error.response?.data?.message || error.message || "Failed to load employees" };
  //   }
  // },



 
  getEmployees: async (
    options?: { includeAttendanceLocations?: boolean },
  ): Promise<{ data?: any[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getEmployee();
      /*
      console.log("Employee API Raw Response:", response); // என்ன வந்துச்சுனு பார்க்க

      // response structure check பண்ணி safe-ஆ data எடு
      */
      const rawData = response?.data;
      let employees: any[] = [];

      if (Array.isArray(rawData)) {
        employees = rawData;
      } else if (rawData?.success && Array.isArray(rawData.data)) {
        employees = rawData.data;
      } else if (Array.isArray(rawData?.employees)) {
        employees = rawData.employees;
      }

      // Map employees to ensure proper name field
      const mappedEmployees = employees.map(emp => ({
        ...emp,
        name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
        firstName: emp.first_name,
        lastName: emp.last_name,
        employeeId: emp.employee_id
      }));

      if (options?.includeAttendanceLocations) {
        // Live tracking fetches locations separately; keep employee load fast by default.
        const employeesWithoutLocation = mappedEmployees.map(employee => ({
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

      return { data: mappedEmployees };

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


  // Create an employee
// Create an employee - FIXED
createEmployee: async (employeeData: any): Promise<{ data?: any; error?: string }> => {
  try {
    const isFormData = employeeData instanceof FormData;

    const config = isFormData
      ? {}  // ← Header set பண்ண வேண்டாம்!
      : {};

    const response = await ENDPOINTS.createEmployee(employeeData, config);

    return { data: response.data };
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return {
      error: error.response?.data?.message || error.message || "Failed to create employee",
    };
  }
},
checkEmployeeDuplicate: async (
  field: string,
  value: string,
  excludeEmployeeId?: string | null
): Promise<{ exists?: boolean; message?: string | null; error?: string }> => {
  try {
    const response = await ENDPOINTS.checkEmployeeDuplicate({
      field,
      value,
      excludeEmployeeId: excludeEmployeeId || undefined,
    });

    return {
      exists: Boolean(response.data?.exists),
      message: response.data?.message || null,
    };
  } catch (error: any) {
    console.error("Error checking employee duplicate:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to check duplicate employee data",
    };
  }
},
  // Update an employee
 // Update an employee
updateEmployee: async (id: string, employeeData: any): Promise<{ data?: any; error?: string }> => {
  try {
    // Detect if employeeData is FormData (for file uploads)
    const isFormData = employeeData instanceof FormData;

    const config = isFormData
      ? {}  // ← மிக முக்கியம்! Header set பண்ணக் கூடாது!
      : {};

    const response = await ENDPOINTS.updateEmployee(id, employeeData, config);

    return { data: response.data };
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return { 
      error: error.response?.data?.message || "Failed to update employee" 
    };
  }
},

  // Delete an employee
  deleteEmployee: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteEmployee(id);
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        return { success: true };
      }
      return { error: "Unexpected response from server" };
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      return { error: error.response?.data?.message || error.message || "Failed to delete employee" };
    }
  },

   // Assume ENDPOINTS has getDepartments and getDesignations methods
getDepartments: async (): Promise<{ data?: { id: string; name: string }[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getdepartment();
    return { data: response.data || [] };
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return { error: error.response?.data?.message || error.message || "Failed to load departments" };
  }
},

getDesignations: async (): Promise<{ data?: { id: string; name: string }[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getDesignation();
    return { data: response.data || [] };
  } catch (error: any) {
    console.error("Error fetching designations:", error);
    return { error: error.response?.data?.message || error.message || "Failed to load designations" };
  }
},

};

export default employeeApi;
