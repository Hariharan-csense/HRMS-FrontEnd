// Authentication types - dynamic roles
export type UserRole = string; // Changed from union to string for dynamic roles

export type User = {
  id: string;
  name: string;
  email: string;
  companyName: string;
  roles: string[]; // Changed from UserRole[] to string[] for dynamic roles
  role?: string;
  department?: string;
  type?: string; // "admin" | "employee" (based on token)
  avatar?: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
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
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
  const wanted = normalize(role);
  const assignedRoles = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    user.role,
  ]
    .map(normalize)
    .filter(Boolean);

  return assignedRoles.includes(wanted);
};

export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user || !roles?.length) return false;
  return roles.some((role) => hasRole(user, role));
};

// Helper to check permissions for specific actions - DEPRECATED
// Use useRole hook from RoleContext for dynamic permission checking
export const canView = (user: User | null, resource: string): boolean => {
  console.warn('canView from auth.ts is deprecated. Use useRole hook from RoleContext for dynamic permissions.');
  if (!user) return false;
  if (hasRole(user, "admin")) return true;

  // Legacy permissions for backward compatibility
  const permissions: Record<string, string[]> = {
    admin: ["*"],
    employee: ["profile", "attendance", "leave", "payslip", "expense"],
    hr: ["employee-records", "attendance", "leave", "exit", "payroll", "reports"],
  };

  const userRole = user.roles[0];
  return (
    permissions[userRole]?.includes("*") ||
    permissions[userRole]?.includes(resource) ||
    false
  );
};
