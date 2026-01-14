import ENDPOINTS from '../../../lib/endpoint'; // Your Axios endpoints

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
    const res = await ENDPOINTS.login(email, password);

    // Save token if returned
    if (res.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
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
    localStorage.removeItem('userRole');
    // Clear any other auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('auth_') || key.startsWith('user_')) {
        localStorage.removeItem(key);
      }
    });
  };

  try {
    // Try to call the logout endpoint with credentials
    await fetch('http://localhost:3000/api/auth/logout', {
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
