import ENDPOINTS from "@/lib/endpoint";

export interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  moduleId?: string;
  actionUrl?: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

class NotificationService {
  private static instance: NotificationService;
  private subscribers: ((notifications: Notification[]) => void)[] = [];
  private notifications: Notification[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: Notification[]) => void) {
    this.subscribers.push(callback);
    callback(this.notifications);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  // Fetch notifications from API
  async fetchNotifications(): Promise<{ data?: Notification[]; error?: string }> {
    try {
      const response = await ENDPOINTS.getNotifications();
      
      if (response.data?.success && Array.isArray(response.data.notifications)) {
        this.notifications = response.data.notifications;
        this.notifySubscribers();
        return { data: this.notifications };
      } else if (Array.isArray(response.data)) {
        this.notifications = response.data;
        this.notifySubscribers();
        return { data: this.notifications };
      } else {
        return { error: "No notifications found" };
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to fetch notifications"
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await ENDPOINTS.markNotificationAsRead(notificationId);
      
      if (response.data?.success) {
        // Update local state
        this.notifications = this.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        this.notifySubscribers();
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to mark notification as read" };
      }
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to mark notification as read"
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await ENDPOINTS.markAllNotificationsAsRead();
      
      if (response.data?.success) {
        // Update local state
        this.notifications = this.notifications.map(notif => ({ ...notif, read: true }));
        this.notifySubscribers();
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to mark all notifications as read" };
      }
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to mark all notifications as read"
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await ENDPOINTS.deleteNotification(notificationId);
      
      if (response.data?.success) {
        // Update local state
        this.notifications = this.notifications.filter(notif => notif.id !== notificationId);
        this.notifySubscribers();
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to delete notification" };
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to delete notification"
      };
    }
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(notif => !notif.read).length;
  }

  // Start real-time polling
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Initial fetch
    this.fetchNotifications();
    
    // Set up polling
    this.pollingInterval = setInterval(() => {
      this.fetchNotifications();
    }, this.POLLING_INTERVAL);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Get current notifications
  getCurrentNotifications(): Notification[] {
    return this.notifications;
  }

  // Add new notification (for local updates)
  addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    this.notifySubscribers();
  }

  // Clear all notifications
  clearNotifications() {
    this.notifications = [];
    this.notifySubscribers();
  }
}

export default NotificationService;
