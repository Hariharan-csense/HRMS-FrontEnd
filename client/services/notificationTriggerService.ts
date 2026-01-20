import ENDPOINTS from '@/lib/endpoint';
import { Notification } from './notificationService';

export interface NotificationTrigger {
  type: 'leave_applied' | 'leave_approved' | 'leave_rejected' | 'payslip_generated' | 'expense_applied' | 'expense_approved' | 'expense_rejected';
  data: {
    employeeId?: string;
    employeeName?: string;
    managerId?: string;
    managerName?: string;
    hrId?: string;
    leaveType?: string;
    fromDate?: string;
    toDate?: string;
    days?: number;
    reason?: string;
    month?: string;
    amount?: number;
    expenseType?: string;
    description?: string;
  };
}

export interface NotificationTemplate {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
  recipients: string[]; // User IDs who should receive this notification
  actionUrl?: string;
}

class NotificationTriggerService {
  private static instance: NotificationTriggerService;

  private constructor() {}

  static getInstance(): NotificationTriggerService {
    if (!NotificationTriggerService.instance) {
      NotificationTriggerService.instance = new NotificationTriggerService();
    }
    return NotificationTriggerService.instance;
  }

  // Create notification based on trigger type and data
  async triggerNotification(trigger: NotificationTrigger): Promise<{ success?: boolean; error?: string }> {
    try {
      const template = this.getNotificationTemplate(trigger);
      if (!template) {
        return { error: 'Invalid notification trigger type' };
      }

      // Create notifications for each recipient
      const notifications = template.recipients.map(recipientId => ({
        id: `${trigger.type}_${Date.now()}_${recipientId}`,
        type: template.type,
        title: template.title,
        description: template.description,
        timestamp: new Date().toISOString(),
        read: false,
        moduleId: trigger.type,
        actionUrl: template.actionUrl,
        userId: recipientId,
      }));

      // Send notifications to backend
      const results = await Promise.all(
        notifications.map(notification => this.sendNotificationToBackend(notification))
      );

      // Check if all notifications were sent successfully
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        return { error: 'Some notifications failed to send' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error triggering notification:', error);
      return {
        error: error.message || 'Failed to trigger notification'
      };
    }
  }

  private getNotificationTemplate(trigger: NotificationTrigger): NotificationTemplate | null {
    const { type, data } = trigger;

    switch (type) {
      case 'leave_applied':
        return {
          title: `Leave Application from ${data.employeeName}`,
          description: `${data.employeeName} has applied for ${data.days} days leave (${data.fromDate} to ${data.toDate}) - ${data.leaveType}`,
          type: 'info',
          recipients: [data.managerId!, data.hrId!].filter(Boolean), // Manager and HR
          actionUrl: '/leave-approvals'
        };

      case 'leave_approved':
        return {
          title: 'Leave Application Approved',
          description: `Your leave application for ${data.days} days (${data.fromDate} to ${data.toDate}) has been approved by ${data.managerName}`,
          type: 'success',
          recipients: [data.employeeId!],
          actionUrl: '/leave-management'
        };

      case 'leave_rejected':
        return {
          title: 'Leave Application Rejected',
          description: `Your leave application for ${data.days} days (${data.fromDate} to ${data.toDate}) has been rejected by ${data.managerName}`,
          type: 'warning',
          recipients: [data.employeeId!],
          actionUrl: '/leave-management'
        };

      case 'payslip_generated':
        return {
          title: 'Payslip Generated',
          description: `Your payslip for ${data.month} is now available for download`,
          type: 'success',
          recipients: [data.employeeId!],
          actionUrl: '/payslips'
        };

      case 'expense_applied':
        return {
          title: `Expense Claim from ${data.employeeName}`,
          description: `${data.employeeName} has submitted an expense claim of ₹${data.amount} for ${data.expenseType}`,
          type: 'info',
          recipients: [data.managerId!, data.hrId!].filter(Boolean), // Manager and HR/Finance
          actionUrl: '/expense-management'
        };

      case 'expense_approved':
        return {
          title: 'Expense Claim Approved',
          description: `Your expense claim of ₹${data.amount} for ${data.expenseType} has been approved`,
          type: 'success',
          recipients: [data.employeeId!],
          actionUrl: '/expense-management'
        };

      case 'expense_rejected':
        return {
          title: 'Expense Claim Rejected',
          description: `Your expense claim of ₹${data.amount} for ${data.expenseType} has been rejected`,
          type: 'warning',
          recipients: [data.employeeId!],
          actionUrl: '/expense-management'
        };

      default:
        return null;
    }
  }

  private async sendNotificationToBackend(notification: Partial<Notification>): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await ENDPOINTS.createNotification(notification);
      
      if (response.data?.success) {
        return { success: true };
      } else {
        return { error: response.data?.message || 'Failed to create notification' };
      }
    } catch (error: any) {
      console.error('Error sending notification to backend:', error);
      return {
        error: error.response?.data?.message || error.message || 'Failed to send notification'
      };
    }
  }

  // Convenience methods for common triggers
  async triggerLeaveApplied(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'leave_applied',
      data
    });
  }

  async triggerLeaveApproved(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'leave_approved',
      data
    });
  }

  async triggerLeaveRejected(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'leave_rejected',
      data
    });
  }

  async triggerPayslipGenerated(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'payslip_generated',
      data
    });
  }

  async triggerExpenseApplied(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'expense_applied',
      data
    });
  }

  async triggerExpenseApproved(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'expense_approved',
      data
    });
  }

  async triggerExpenseRejected(data: NotificationTrigger['data']) {
    return this.triggerNotification({
      type: 'expense_rejected',
      data
    });
  }
}

export default NotificationTriggerService;
