// src/api/employeeApi.ts
import ENDPOINTS from "@/lib/endpoint";

export interface Employee {  // ← EXPORT keyword add pannu
  id: string;
  name: string;
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



 
  getEmployees: async (): Promise<{ data?: any[]; error?: string }> => {
    try {
      console.log("Fetching employees from backend..."); // Debug

      const response = await ENDPOINTS.getEmployee();

      console.log("Employee API Raw Response:", response); // என்ன வந்துச்சுனு பார்க்க

      // response structure check பண்ணி safe-ஆ data எடு
      const rawData = response?.data;

      if (Array.isArray(rawData)) {
        console.log("Employees loaded successfully:", rawData.length);
        return { data: rawData };
      }

      // சில API { success: true, data: [...] } இப்படி தரும்
      if (rawData?.success && Array.isArray(rawData.data)) {
        console.log("Employees from wrapped data:", rawData.data.length);
        return { data: rawData.data };
      }

      // { employees: [...] } இப்படி இருந்தாலும்
      if (Array.isArray(rawData?.employees)) {
        return { data: rawData.employees };
      }

      console.warn("Unexpected employee data format:", rawData);
      return { data: [] }; // error இல்லாம empty array தரு

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
