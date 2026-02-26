import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import ENDPOINTS, { BASE_URL, checkAndRefreshTokenIfNeeded } from "../lib/endpoint";
import { profileManager } from "@/lib/profileManager";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to initialize auth state", error);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist user changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  // Periodic token refresh check (every 4 minutes)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await checkAndRefreshTokenIfNeeded();
      } catch (error) {
        console.error('Periodic token refresh failed:', error);
        // Don't logout here, let the API interceptors handle it
      }
    }, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Check token on visibility change (when user returns to the tab)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await checkAndRefreshTokenIfNeeded();
        } catch (error) {
          console.error('Visibility change token refresh failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  /* =======================
     LOGIN (REPLACED LOGIC)
     ======================= */
const login = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; message?: string }> => {
  setIsLoading(true);
  try {
    if (!isValidEmail(email)) {
      return { success: false, message: "Please enter a valid email address." };
    }

    const normalizedEmail = normalizeEmail(email);

    // Make sure to handle the case where the API call fails
    const response = await ENDPOINTS.login(normalizedEmail, password).catch(error => {
      // Handle API call failure (network error, server down, etc.)
      console.error('API call failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to connect to the server');
    });
    
    // Make sure we have a response and data
    if (!response) {
      throw new Error('No response from server');
    }
    
    const responseData = response.data || {};
    
    // Check if we have an error message in the response
    if (responseData.message && !responseData.success) {
      throw new Error(responseData.message);
    }
    
    // Handle successful login
    const accessToken = responseData.accessToken || responseData.token;
    const refreshToken = responseData.refreshToken;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);

      // Persist refresh token only when "Remember me" is enabled
      if (rememberMe && refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("rememberMe");
      }
      
      // Extract user data from response
      const userData = {
        id: responseData.user?.id || responseData.id,
        name: responseData.user?.name || responseData.name || normalizedEmail.split('@')[0],
        email: responseData.user?.email || normalizedEmail,
        roles: Array.isArray(responseData.user?.roles) 
          ? responseData.user.roles 
          : [responseData.user?.role || responseData.role || 'employee'],
        companyName: responseData.user?.companyName || responseData.company_name || 'Company',
        department: responseData.user?.department || responseData.department || null,
        type: responseData.user?.type || responseData.type || undefined,
        avatar: responseData.user?.avatar || responseData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`
      };
      
      // Save user data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      // Load profile image after successful login
      try {
        const profileResponse = await ENDPOINTS.getProfile();
        const profileData = profileResponse.data?.data || profileResponse.data;
        
        if (profileData?.profile_photo) {
          const profileImageUrl = `${BASE_URL}${profileData.profile_photo}`;
          const updatedUserData = {
            ...userData,
            avatar: profileImageUrl
          };
          
          // Update user context and localStorage with profile image
          setUser(updatedUserData);
          localStorage.setItem("user", JSON.stringify(updatedUserData));
          
          // Also update the userData variable for subsequent operations
          userData.avatar = profileImageUrl;
        }
      } catch (error) {
        // Don't fail login if profile image loading fails
        console.log('Profile image loading skipped during login');
      }
      
      // Save profile for remember me functionality
      if (rememberMe) {
        profileManager.saveProfile(userData, true);
        console.log('Profile saved for remember me:', userData.email);
      }
      
      // Set the first role as the user's role
      if (userData.roles && userData.roles.length > 0) {
        localStorage.setItem("userRole", userData.roles[0]);
      } else {
        localStorage.setItem("userRole", 'employee');
      }
      
      // Return success without temporary password check
      return { 
        success: true
      };
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected response format:', response);
    throw new Error('Invalid server response');
  } catch (error: any) {
    console.error("Login error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Login failed. Please check your credentials.";
    return { success: false, message: errorMessage };
  } finally {
    setIsLoading(false);
  }
};


  /* =======================
     LOGOUT (REPLACED LOGIC)
     ======================= */
  const logout = async () => {
    const clearAuthData = () => {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("rememberMe");
      
      // Clear saved profiles and credentials
      profileManager.clearAll();
      
      // Clear any auth-related keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("auth_") || key.startsWith("user_")) {
          localStorage.removeItem(key);
        }
      });
    };

    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
    } catch (error) {
      console.warn(
        "Logout API call failed, but proceeding with local cleanup",
        error
      );
    } finally {
      clearAuthData();
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        isLoading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
