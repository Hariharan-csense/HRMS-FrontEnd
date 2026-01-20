import { useState, useEffect, useCallback } from 'react';
import NotificationService, { Notification } from '@/services/notificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await notificationService.fetchNotifications();
      if (result.error) {
        setError(result.error);
      } else {
        setNotifications(result.data || []);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const result = await notificationService.markAsRead(id);
      if (result.error) {
        setError(result.error);
      } else {
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.error) {
        setError(result.error);
      } else {
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (err) {
      setError('Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const result = await notificationService.deleteNotification(id);
      if (result.error) {
        setError(result.error);
      } else {
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.filter(notif => notif.id !== id)
        );
      }
    } catch (err) {
      setError('Failed to delete notification');
    }
  }, []);

  useEffect(() => {
    // Subscribe to notification service updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setLoading(false);
      setError(null);
    });

    // Start real-time polling
    notificationService.startPolling();

    // Initial fetch
    refresh();

    // Cleanup on unmount
    return () => {
      unsubscribe();
      notificationService.stopPolling();
    };
  }, [refresh]);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
};

export default useNotifications;
