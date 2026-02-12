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
      const response = await ENDPOINTS.getActivities();
      console.log('Activities API response:', response);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      toast.error(error.response?.data?.message || "Failed to fetch activities");
      return [];
    }
  },

  // Log a new activity to API
  logActivity: async (action: string, location: string = "Bangalore, India") => {
    try {
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
      console.log('Activity logged:', response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error logging activity:", error);
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
