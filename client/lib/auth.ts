// Mock authentication types and context
export type UserRole = "admin" | "employee" | "manager" | "hr" | "finance" | "admin-delegate";

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
      roles: ["employee"],
      department: "Engineering",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=employee",
    },
  },
  "manager@company.com": {
    password: "mgr123",
    user: {
      id: "3",
      name: "Michael Manager",
      email: "manager@company.com",
      roles: ["manager", "employee"],
      department: "Engineering",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
    },
  },
  "hr@company.com": {
    password: "hr123",
    user: {
      id: "4",
      name: "Emma HR",
      email: "hr@company.com",
      roles: ["hr", "employee"],
      department: "Human Resources",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hr",
    },
  },
  "finance@company.com": {
    password: "fin123",
    user: {
      id: "5",
      name: "David Finance",
      email: "finance@company.com",
      roles: ["finance", "employee"],
      department: "Finance",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=finance",
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
    manager: ["team-attendance", "team-leave", "team-reports"],
    hr: ["employee-records", "attendance", "leave", "exit"],
    finance: ["payroll", "expense", "reports"],
    "admin-delegate": ["limited-admin"],
  };

  return (
    permissions[user.roles[0]]?.includes("*") ||
    permissions[user.roles[0]]?.includes(resource) ||
    false
  );
};
