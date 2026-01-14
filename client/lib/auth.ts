// Mock authentication types and context
export type UserRole = "admin" | "employee" | "HR";

export type User = {
  id: string;
  name: string;
  email: string;
  companyName: string;
  roles: UserRole[];
  department?: string;
  avatar?: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
};

// Mock users for demo
export const mockUsers: Record<string, { password: string; user: User }> = {
  "admin@company.com": {
    password: "admin123",
    user: {
      id: "1",
      name: "John Administrator",
      email: "admin@company.com",
      companyName: "Company",
      roles: ["admin"],
      department: "Management",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  },
  "employee@company.com": {
    password: "emp123",
    user: {
      id: "2",
      name: "Sarah Employee",
      email: "employee@company.com",
      companyName: "Company",
      roles: ["employee"],
      department: "Engineering",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=employee",
    },
  },
  "hr@company.com": {
    password: "hr123",
    user: {
      id: "3",
      name: "Emma HR",
      email: "hr@company.com",
      companyName: "Company",
      roles: ["HR"],
      department: "Human Resources",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hr",
    },
  },
};

// Helper to check if user has permission
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
};

// Helper to check permissions for specific actions
export const canView = (user: User | null, resource: string): boolean => {
  if (!user) return false;
  if (hasRole(user, "admin")) return true;

  const permissions: Record<UserRole, string[]> = {
    admin: ["*"],
    employee: ["profile", "attendance", "leave", "payslip", "expense"],
    HR: ["employee-records", "attendance", "leave", "exit", "payroll", "reports"],
  };

  return (
    permissions[user.roles[0]]?.includes("*") ||
    permissions[user.roles[0]]?.includes(resource) ||
    false
  );
};
