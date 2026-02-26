import { toast } from "sonner";
import ENDPOINTS from "@/lib/endpoint";

export interface ActivityData {
  action: string;
  date: string;
  location: string;
  timestamp?: string;
}

export const activityHelper = {
  // Get user activities from API
  getActivities: async (): Promise<ActivityData[]> => {
    try {
      console.log('ACTIVITY HELPER - Fetching activities...');
      const response = await ENDPOINTS.getActivities();
      console.log('ACTIVITY HELPER - Activities response:', response);
      
      if (response.data && response.data.success) {
        console.log('ACTIVITY HELPER - Activities loaded successfully:', {
          count: response.data.data?.length || 0,
          activities: response.data.data
        });
        return response.data.data || [];
      } else {
        console.error('ACTIVITY HELPER - Activities fetch failed:', response.data);
        toast.error(response.data?.message || "Failed to fetch activities");
        return [];
      }
    } catch (error: any) {
      console.error("ACTIVITY HELPER - Error fetching activities:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to access these activities.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch activities");
      }
      return [];
    }
  },

  // Log a new activity to API
  logActivity: async (action: string, location: string = "Bangalore, India") => {
    try {
      console.log('ACTIVITY HELPER - Logging activity:', { action, location });
      const now = new Date();
      const activityData = {
        action,
        location,
        timestamp: now.toISOString(),
        date: now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };

      const response = await ENDPOINTS.logActivity(activityData);
      console.log('ACTIVITY HELPER - Activity logged successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error("ACTIVITY HELPER - Error logging activity:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 403) {
        console.error('ACTIVITY HELPER - Access denied for activity logging');
      } else if (error.response?.status === 404) {
        console.error('ACTIVITY HELPER - Employee not found for activity logging');
      }
      
      // Don't show toast for activity logging errors to avoid annoying users
      return null;
    }
  },

  // Format date for display
  formatDate: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};
