// src/api/shiftApi.ts

import ENDPOINTS from "@/lib/endpoint"; // Adjust the path if your ENDPOINTS file is elsewhere (e.g., "@/components/utils/api")

export interface Shift {
  id: string | number;
  name: string;
  startTime: string;        // e.g., "09:00:00" or "09:00"
  endTime: string;          // e.g., "17:00:00" or "17:00"
  gracePeriod?: number;     // in minutes
  halfDayThreshold?: number; // in hours
  otEligible?: number | boolean;
  createdAt?: string;
  // Backward compatibility
  start_time?: string;
  end_time?: string;
  grace_period?: number;
  half_day_threshold?: number;
  ot_eligible?: number | boolean;
  created_at?: string;
}

export interface ShiftFilters {
  page?: number;
  limit?: number;
  search?: string;           // optional search by name
  is_active?: boolean;
}

export const shiftApi = {
  // Get all shifts (with optional filters/pagination if backend supports)
  getShifts: async (filters?: ShiftFilters): Promise<{
    data?: Shift[];
    total?: number;
    error?: string;
  }> => {
    try {
      // Note: Your current ENDPOINTS.getshifts() has no params. 
      // If backend supports query params, update ENDPOINTS to accept them.
      const response = await ENDPOINTS.getshifts();
      
      // Adjust based on actual backend response structure
      const shiftList = response.data?.data || response.data?.shifts || response.data || [];
      const total = response.data?.total || response.data?.count;

      return { data: shiftList, total };
    } catch (error: any) {
      console.error("Error fetching shifts:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch shifts",
      };
    }
  },

  // Get single shift by ID (added since it's commonly needed for edit forms)
  // If you add this endpoint to ENDPOINTS, replace the direct call
  

  // Create new shift
  createShift: async (data: Partial<Shift>): Promise<{
    data?: Shift;
    success?: boolean;
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.createShift(data);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || "Failed to create shift",
      };
    }
  },

  // Update existing shift
  updateShift: async (id: string, data: Partial<Shift>): Promise<{
    data?: Shift;
    success?: boolean;
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.updateShift(id, data);
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || "Failed to update shift",
      };
    }
  },

  // Delete shift
  deleteShift: async (id: string): Promise<{
    success?: boolean;
    error?: string;
  }> => {
    try {
      await ENDPOINTS.deleteShift(id);
      return { success: true };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || "Failed to delete shift",
      };
    }
  },
};

export default shiftApi;