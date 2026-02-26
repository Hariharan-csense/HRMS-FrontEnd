import ENDPOINTS, { BASE_URL } from '../../../lib/endpoint'; // Your Axios endpoints
import { isValidEmail, normalizeEmail } from "@/lib/validation";

type LoginParams = {
  email: string;
  password: string;
};

type LoginResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function handleLogin({ email, password }: LoginParams): Promise<LoginResult> {
  try {
    if (!isValidEmail(email)) {
      return {
        success: false,
        message: "Please enter a valid email address",
      };
    }

    const normalizedEmail = normalizeEmail(email);
    const res = await ENDPOINTS.login(normalizedEmail, password);

    // Save token if returned
    if (res.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('rememberMe', 'true');
    }

    return {
      success: true,
      message: `Login successful! Welcome ${res.data.user?.name || ''}`,
      data: res.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
}

export async function handleLogout(): Promise<{ success: boolean; message: string }> {
  // Clear all auth-related data from localStorage first
  const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rememberMe');
    // Clear any other auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('auth_') || key.startsWith('user_')) {
        localStorage.removeItem(key);
      }
    });
  };

  try {
    // Try to call the logout endpoint with credentials
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Important for sending cookies
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    
    // Clear local data
    clearAuthData();
    
    // Redirect to login page
    window.location.href = '/login';
    
    return {
      success: true,
      message: 'Successfully logged out',
    };
  } catch (error) {
    // Even if the API call fails, we should still clear local storage
    console.warn('Logout API call failed, but proceeding with local cleanup', error);
    clearAuthData();
    window.location.href = '/login';
    
    return {
      success: true,
      message: 'Successfully logged out (local data cleared)',
    };
  }
}

type ChangePasswordParams = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function handleChangePassword({ currentPassword, newPassword, confirmPassword }: ChangePasswordParams): Promise<ChangePasswordResult> {
  try {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match',
      };
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long',
      };
    }

    const response = await ENDPOINTS.changePassword({
      currentPassword,
      newPassword,
    });

    return {
      success: true,
      message: 'Password changed successfully',
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to change password',
    };
  }
}
