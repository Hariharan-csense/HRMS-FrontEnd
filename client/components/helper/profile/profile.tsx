import { toast } from "sonner";
import ENDPOINTS from "@/lib/endpoint";

export interface ProfileData {
  first_name?: string;
  last_name?: string;
  mobile?: string;
  department_id?: string;
  designation_id?: string;
  profile_photo?: File;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileHelper = {
  // Get user profile
  getProfile: async () => {
    try {
      console.log('PROFILE HELPER - Fetching profile...');
      const response = await ENDPOINTS.getProfile();
      console.log('PROFILE HELPER - Profile response:', response);
      
      if (response.data && response.data.success) {
        console.log('PROFILE HELPER - Profile loaded successfully:', {
          employeeId: response.data.data?.id,
          name: response.data.data?.first_name,
          email: response.data.data?.email
        });
        return response.data;
      } else {
        console.error('PROFILE HELPER - Profile fetch failed:', response.data);
        throw new Error(response.data?.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error("PROFILE HELPER - Error fetching profile:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 404) {
        toast.error("Profile not found. You may not have access to this organization's data.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to access this profile.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch profile");
      }
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data: ProfileData) => {
    try {
      console.log('PROFILE HELPER - Updating profile with data:', data);
      const formData = new FormData();
      
      // Append text fields
      if (data.first_name) formData.append("first_name", data.first_name);
      if (data.last_name) formData.append("last_name", data.last_name);
      if (data.mobile) formData.append("mobile", data.mobile);
      if (data.department_id) formData.append("department_id", data.department_id);
      if (data.designation_id) formData.append("designation_id", data.designation_id);
      
      // Append profile photo if provided
      if (data.profile_photo) {
        formData.append("profile_photo", data.profile_photo);
      }

      const response = await ENDPOINTS.updateProfile(formData);
      console.log('PROFILE HELPER - Profile update response:', response);
      
      if (response.data && response.data.success) {
        console.log('PROFILE HELPER - Profile updated successfully:', {
          employeeId: response.data.data?.id,
          name: response.data.data?.first_name
        });
        toast.success("Profile updated successfully");
        return response.data;
      } else {
        console.error('PROFILE HELPER - Profile update failed:', response.data);
        toast.error(response.data?.message || "Failed to update profile");
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error("PROFILE HELPER - Error updating profile:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 404) {
        toast.error("Profile not found. You may not have access to this organization's data.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to update this profile.");
      } else {
        toast.error(error.response?.data?.message || "Failed to update profile");
      }
      throw error;
    }
  },

  // Update avatar specifically
  updateAvatar: async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const formData = new FormData();
      formData.append("profile_photo", file);

      const response = await ENDPOINTS.updateProfile(formData);
      toast.success("Profile picture updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("Error updating avatar:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update profile picture");
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData: PasswordData) => {
    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate password strength
      if (passwordData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const formData = new FormData();
      formData.append("currentPassword", passwordData.currentPassword);
      formData.append("newPassword", passwordData.newPassword);

      const response = await ENDPOINTS.updateProfile(formData);
      toast.success("Password changed successfully");
      return response.data;
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to change password");
      throw error;
    }
  },

  // Delete admin account and entire organization data
  deleteMyAccount: async (confirmation: string) => {
    try {
      const response = await ENDPOINTS.deleteMyAccount(confirmation);
      if (response.data?.success) {
        toast.success(response.data?.message || "Account deleted successfully");
        return response.data;
      }
      throw new Error(response.data?.message || "Failed to delete account");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete account");
      throw error;
    }
  }
};
