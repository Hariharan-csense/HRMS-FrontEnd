import ENDPOINTS from "@/lib/endpoint";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  role: string;
  department?: string;
}

export const registerUser = async (userData: RegisterData) => {
  try {
    // Normalize email (trim + lowercase) for consistency with backend storage
    const normalizedEmail = userData.email.trim().toLowerCase();
    
    const payload = {
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      role: userData.role,
      department: userData.department?.trim(),
      company_name: userData.companyName?.trim(),
    };

    const response = await ENDPOINTS.register(payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Registration failed. Please try again.'
    };
  }
};