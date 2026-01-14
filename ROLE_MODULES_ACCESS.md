# Role-Based Module Access Control

This document describes which roles have access to which modules in the HRMS application.

## Role Hierarchy & Access Matrix

### 1. **ADMIN** (John Administrator - admin@company.com)
- **Password**: admin123
- **Access**: Full system access to all modules
- **Modules with View Permission**:
  - ✅ Organization (view, create, edit, approve)
  - ✅ Employee Management (view, create, edit, approve)
  - ✅ Attendance Management (view, create, edit, approve)
  - ✅ Leave Management (view, create, edit, approve)
  - ✅ Payroll (view, create, edit, approve)
  - ✅ Expenses (view, create, edit, approve)
  - ✅ Assets (view, create, edit, approve)
  - ✅ Exit Management (view, create, edit, approve)
  - ✅ **Reports** (view, create, edit, approve)
    - ✅ Attendance Reports
    - ✅ Leave Reports
    - ✅ Payroll Reports
    - ✅ Finance Reports

---

### 2. **HR MANAGER** (Emma HR - hr@company.com)
- **Password**: hr123
- **Access**: HR and administrative operations
- **Modules with View Permission**:
  - ❌ Organization (no access)
  - ✅ Employee Management (view, create, edit)
  - ✅ Attendance Management (view only)
  - ✅ Leave Management (view, approve)
  - ✅ Payroll (view only)
  - ✅ Expenses (view only)
  - ✅ Assets (view, create, edit)
  - ✅ Exit Management (view)
  - ✅ **Reports** (view only)
    - ✅ Attendance Reports
    - ✅ Leave Reports
    - ❌ Payroll Reports (finance only)
    - ❌ Finance Reports (finance only)

---

### 3. **MANAGER** (Michael Manager - manager@company.com)
- **Password**: mgr123
- **Access**: Team management and oversight
- **Modules with View Permission**:
  - ❌ Organization (no access)
  - ✅ Employee Management (view only)
  - ✅ Attendance Management (view only)
  - ✅ Leave Management (view, approve team requests)
  - ✅ Payroll (view only)
  - ❌ Expenses (no access)
  - ❌ Assets (no access)
  - ❌ Exit Management (no access)
  - ✅ **Reports** (view only)
    - ✅ Attendance Reports
    - ❌ Leave Reports (HR only)
    - ❌ Payroll Reports (finance only)
    - ❌ Finance Reports (finance only)

---

### 4. **FINANCE** (David Finance - finance@company.com)
- **Password**: fin123
- **Access**: Financial and payroll operations
- **Modules with View Permission**:
  - ❌ Organization (no access)
  - ✅ Employee Management (view only)
  - ❌ Attendance Management (no access)
  - ❌ Leave Management (no access)
  - ✅ Payroll (view, create, edit, approve)
  - ✅ Expenses (view, approve)
  - ❌ Assets (no access)
  - ❌ Exit Management (no access)
  - ✅ **Reports** (view only)
    - ❌ Attendance Reports (manager/hr only)
    - ❌ Leave Reports (HR only)
    - ✅ Payroll Reports
    - ✅ Finance Reports

---

### 5. **EMPLOYEE** (Sarah Employee - employee@company.com)
- **Password**: emp123
- **Access**: Personal/self-service operations
- **Modules with View Permission**:
  - ❌ Organization (no access)
  - ❌ Employee Management (no access)
  - ✅ Attendance Management (view, create - self check-in/out)
  - ✅ Leave Management (view, apply for leave)
  - ✅ Payroll (view - payslips only)
  - ✅ Expenses (view, create, edit - own claims)
  - ✅ Assets (view - own assets)
  - ❌ Exit Management (no access)
  - ❌ **Reports** (no access)

---

## Module Details by Role

### **Reports Module** (Special Focus)
This module shows different reports based on role:

| Report Type | Admin | HR Manager | Manager | Finance | Employee |
|------------|-------|-----------|---------|---------|----------|
| Attendance Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Leave Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payroll Reports | ✅ | ❌ | ❌ | ✅ | ❌ |
| Finance Reports | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## Access Control Implementation

### Configuration Files:
1. **Sidebar Navigation** (`client/components/Sidebar.tsx`):
   - Each menu item has a `roles` array specifying which roles can see it
   - Each menu item has a `moduleName` (and optional `subModuleName`)

2. **Role Configuration** (`client/context/RoleContext.tsx`):
   - `mockRoles` array contains detailed permissions for each role
   - Each role defines module-level permissions (view, create, edit, approve)

3. **Auth Helpers** (`client/lib/auth.ts`):
   - `hasRole()`: Check if user has a specific role
   - `hasAnyRole()`: Check if user has any of multiple roles
   - `canView()`: Check if user can perform specific actions

### Access Check Flow:
```
User tries to access menu item
    ↓
1. Check if user has required role(s) [hasAnyRole()]
    ↓ (If yes)
2. Check module permissions in RoleConfig [hasModuleAccess()]
    ↓ (If yes)
3. Grant access to module
```

---

## Notes for Admin Users

✅ **CONFIRMED**: Admin users (admin@company.com) should see ALL modules including Reports with all sub-reports:
- Attendance Reports
- Leave Reports
- Payroll Reports
- Finance Reports

If Admin is not seeing these modules:
1. Clear browser localStorage and reload
2. Log out and log back in
3. Check browser console for access control logs
4. Verify role configuration in `client/context/RoleContext.tsx`

---

## Adding New Roles

To add a new role:

1. Add role to `UserRole` type in `client/lib/auth.ts`
2. Add mock user to `mockUsers` in `client/lib/auth.ts`
3. Add role configuration to `mockRoles` in `client/context/RoleContext.tsx`
4. Update navigation items in `client/components/Sidebar.tsx` with role restriction
5. Update this documentation

---

## Adding New Modules

To add a new module:

1. Define module in `moduleName` field in Sidebar navigation item
2. Add module permissions to all applicable roles in `RoleContext.tsx`
3. Create module component/page
4. Add access checks using `hasRole()` or `hasModuleAccess()`
5. Update this documentation

