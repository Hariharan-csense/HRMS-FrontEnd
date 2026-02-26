import ENDPOINTS from "@/lib/endpoint";
import { isOptionalPhoneValid, isValidEmail, normalizeEmail } from "@/lib/validation";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  role: string;
  department?: string;
  phone?: string;
}

export const registerUser = async (userData: RegisterData) => {
  try {
    if (!isValidEmail(userData.email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    if (!isOptionalPhoneValid(userData.phone)) {
      return {
        success: false,
        error: "Phone number must be 10 digits and start with 6, 7, 8, or 9",
      };
    }

    // Normalize email (trim + lowercase) for consistency with backend storage
    const normalizedEmail = normalizeEmail(userData.email);
    
    const payload = {
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      role: userData.role,
      department: userData.department?.trim(),
      company_name: userData.companyName?.trim(),
      phone: userData.phone?.trim(),
    };

    const response = await ENDPOINTS.register(payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    const rawMessage = String(error?.response?.data?.message || '').toLowerCase();
    const isDuplicateEmailError =
      (rawMessage.includes('already') && rawMessage.includes('email')) ||
      rawMessage.includes('duplicate entry') ||
      rawMessage.includes('er_dup_entry');

    return {
      success: false,
      error: isDuplicateEmailError
        ? 'Email already exists'
        : (error.response?.data?.message || 'Registration failed. Please try again.')
    };
  }
};
