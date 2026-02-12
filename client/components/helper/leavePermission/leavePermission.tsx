// src/components/helper/leavePermission/leavePermission.tsx
import ENDPOINTS from "@/lib/endpoint";

export interface LeavePermission {
  id: string;
  permission_id: string;
  employee_id: string;
  employee_name: string;
  permission_date: string;
  permission_time_from: string;
  permission_time_to: string;
  reason: string;
  attachment_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  approved_by_name?: string;
  attachment_url?: string;
}

export interface LeavePermissionFormData {
  permission_date: string;
  permission_time_from: string;
  permission_time_to: string;
  reason: string;
  employee_id?: string;
  employee_name?: string;
  reporting_manager_id?: string;
  reporting_manager_name?: string;
}

export const leavePermissionApi = {
  // Apply for leave permission
  applyLeavePermission: async (data: LeavePermissionFormData, file?: File): Promise<{ data?: any; error?: string }> => {
    try {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (data[key as keyof LeavePermissionFormData] !== undefined) {
          formData.append(key, data[key as keyof LeavePermissionFormData] as string);
        }
      });

      // Add file if provided
      if (file) {
        formData.append('attachment', file);
      }

      const response = await ENDPOINTS.applyLeavePermission(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        return { data: response.data };
      } else {
        return { error: response.data?.message || 'Failed to submit leave permission request' };
      }
    } catch (error: any) {
      console.error('Leave Permission API Error:', error);
      return {
        error: error.response?.data?.message || error.message || 'Failed to connect to server'
      };
    }
  },

  // Get leave permission applications
  getLeavePermissionApplications: async (): Promise<{ data?: LeavePermission[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getLeavePermissionApplications();
      
      if (response.data && response.data.success) {
        return { data: response.data.applications || [] };
      } else {
        return { error: response.data?.message || 'Failed to fetch leave permission applications' };
      }
    } catch (error: any) {
      console.error('Leave Permission Applications API Error:', error);
      return {
        error: error.response?.data?.message || error.message || 'Failed to connect to server'
      };
    }
  },

  // Update leave permission status (approve/reject)
  updateLeavePermissionStatus: async (id: string, status: 'approved' | 'rejected', remarks?: string): Promise<{ data?: any; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateLeavePermissionStatus(id, { status, remarks });
      
      if (response.data && response.data.success) {
        return { data: response.data };
      } else {
        return { error: response.data?.message || 'Failed to update leave permission status' };
      }
    } catch (error: any) {
      console.error('Update Leave Permission Status API Error:', error);
      return {
        error: error.response?.data?.message || error.message || 'Failed to connect to server'
      };
    }
  },

  // Get relevant users for notifications
  getLeavePermissionUsers: async (): Promise<{ data?: any[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getLeavePermissionUsers();
      
      if (response.data && response.data.success) {
        return { data: response.data.data || [] };
      } else {
        return { error: response.data?.message || 'Failed to fetch relevant users' };
      }
    } catch (error: any) {
      console.error('Leave Permission Users API Error:', error);
      return {
        error: error.response?.data?.message || error.message || 'Failed to connect to server'
      };
    }
  }
};
