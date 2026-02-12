import { toast } from "@/hooks/use-toast";

/**
 * Toast utility functions to replace alert() calls throughout the application
 */

export const showToast = {
  /**
   * Show a success toast (green)
   */
  success: (message: string, description?: string) => {
    toast({
      title: "Success",
      description: description || message,
      variant: "default",
    });
  },

  /**
   * Show an error toast (red)
   */
  error: (message: string, description?: string) => {
    toast({
      title: "Error",
      description: description || message,
      variant: "destructive",
    });
  },

  /**
   * Show an info toast (default/blue)
   */
  info: (message: string, description?: string) => {
    toast({
      title: "Info",
      description: description || message,
      variant: "default",
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, description?: string) => {
    toast({
      title: "Warning",
      description: description || message,
      variant: "default",
    });
  },

  /**
   * Simple toast - just shows the message as description
   */
  simple: (message: string) => {
    toast({
      description: message,
      variant: "default",
    });
  },
};

/**
 * Direct replacement for alert() - shows as error toast
 */
export const alert = (message: string) => {
  showToast.error(message);
};

/**
 * Replacement for confirm() - shows as info toast and returns false
 * Note: This doesn't actually confirm like browser confirm, just shows the message
 * For actual confirmations, you'll need to implement a dialog component
 */
export const confirm = (message: string): boolean => {
  showToast.info(message);
  return false;
};
