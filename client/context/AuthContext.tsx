import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import ENDPOINTS from "../lib/endpoint";

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

  /* =======================
     LOGIN (REPLACED LOGIC)
     ======================= */
const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
  setIsLoading(true);
  try {
    // Make sure to handle the case where the API call fails
    const response = await ENDPOINTS.login(email, password).catch(error => {
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
    if (responseData.token) {
      localStorage.setItem("accessToken", responseData.token);
      
      // Extract user data from response
      const userData = {
        id: responseData.user?.id || responseData.id,
        name: responseData.user?.name || responseData.name || email.split('@')[0],
        email: responseData.user?.email || email,
        roles: Array.isArray(responseData.user?.roles) 
          ? responseData.user.roles 
          : [responseData.user?.role || responseData.role || 'employee'],
        companyName: responseData.user?.companyName || responseData.company_name || 'Company',
        department: responseData.user?.department || responseData.department || null,
        avatar: responseData.user?.avatar || responseData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      
      // Save user data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      // Set the first role as the user's role
      if (userData.roles && userData.roles.length > 0) {
        localStorage.setItem("userRole", userData.roles[0]);
      } else {
        localStorage.setItem("userRole", 'employee');
      }
      
      return { success: true };
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
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("auth_") || key.startsWith("user_")) {
          localStorage.removeItem(key);
        }
      });
    };

    try {
      await fetch("http://localhost:3000/api/auth/logout", {
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
