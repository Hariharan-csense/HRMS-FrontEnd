# Role-Based Module Permissions Implementation

## Overview

The HRMS now implements a **dynamic role-based module permission system** that ensures users only see and access modules assigned to their role. This replaces the previous hardcoded role-based navigation.

## Key Components

### 1. RoleContext (`client/context/RoleContext.tsx`)

A React Context that manages all role configurations and module permissions across the app.

**Features:**
- Stores role definitions with module-level permissions
- Provides utilities to check module access
- Syncs with OrganizationSetup changes
- Default mock roles included

**Functions:**
```typescript
useRole() // Hook to access role context
hasModuleAccess(roleName, moduleName) // Check if a role can access a module
getModulePermissions(roleName, moduleName) // Get detailed permissions
getUserRoleConfig(roleName) // Get full role configuration
```

### 2. Sidebar Navigation (`client/components/Sidebar.tsx`)

Updated to filter navigation items based on actual module permissions.

**Changes:**
- Each navigation item now has a `moduleName` property that maps to the RoleConfig
- Filtering logic now checks both:
  1. User's assigned roles (from AuthContext)
  2. Module permissions for those roles (from RoleContext)
- Submenu items are also filtered dynamically

**How it works:**
```typescript
const hasItemAccess = (item: NavItem): boolean => {
  // Dashboard is always accessible
  if (item.moduleName === undefined) return true;
  
  // Check if user has the required role AND module access
  for (const role of user.roles) {
    if (hasModuleAccess(role, item.moduleName)) {
      return true;
    }
  }
  return false;
};
```

### 3. Module Configuration

Modules are defined in `RoleContext` with permissions for each action:
- **view**: Can view the module
- **create**: Can create new items
- **edit**: Can edit existing items
- **approve**: Can approve requests

## Role Definitions

### Admin
- **Access**: All modules with full permissions
- **Visibility**: All Employees
- **Authority**: Full Authority

### HR Manager
- **Access**: Employees (create/edit), Leave (approve), Assets, Payroll/Attendance (view-only)
- **Visibility**: Department Employees
- **Authority**: Leave Requests

### Manager
- **Access**: Team Employees (view), Leave (approve), Reports (view)
- **Visibility**: Team Members
- **Authority**: Leave Requests

### Finance
- **Access**: Payroll (full), Expenses (approve), Employees (view), Reports (view)
- **Visibility**: All Employees
- **Authority**: Expense Claims

### Employee
- **Access**: Own Leave, Attendance, Expenses, Assets, Payslips (view)
- **Visibility**: Self Only
- **Authority**: No Authority

## Testing Role Access

### Using the Debug Page

Navigate to `/debug/roles` when logged in to see:
- Your assigned roles
- All modules you can access
- Detailed permissions for each module
- All roles and their module assignments

### Test Users

Use these credentials to test different roles:

| Name | Email | Password | Role |
|------|-------|----------|------|
| John Administrator | admin@company.com | admin123 | Admin |
| Sarah Employee | employee@company.com | emp123 | Employee |
| Michael Manager | manager@company.com | mgr123 | Manager, Employee |
| Emma HR | hr@company.com | hr123 | HR Manager, Employee |
| David Finance | finance@company.com | fin123 | Finance, Employee |

## How to Modify Role Permissions

### In Organization Setup

1. Navigate to **Organization Setup** → **Roles & Permissions**
2. Select a role to edit
3. Configure module access for that role:
   - Check/uncheck modules the role can access
   - For each module, configure view/create/edit/approve permissions
4. Save changes

### Changes Automatically Sync

When you save role changes in OrganizationSetup:
1. Changes sync to RoleContext via `setRolesInContext()`
2. Sidebar automatically updates to show/hide modules
3. No page reload needed

## Navigation Items to Module Mapping

| Navigation Item | Module Name |
|-----------------|------------|
| Organization Setup | organization |
| Employee Management | employees |
| Attendance Management | attendance |
| Leave Management | leave |
| Payroll | payroll |
| Expenses | expenses |
| Assets | assets |
| Exit & Offboarding | exit |
| Reports | reports |
| Dashboard | (always visible) |

## Adding New Modules

To add a new module to the role permission system:

1. **Add to RoleContext** (`client/context/RoleContext.tsx`):
   ```typescript
   mockRoles: {
     modules: {
       newmodule: { view: true, create: true, edit: true, approve: false }
     }
   }
   ```

2. **Add to Sidebar** (`client/components/Sidebar.tsx`):
   ```typescript
   {
     label: "New Module",
     icon: <IconComponent />,
     path: "/new-module",
     moduleName: "newmodule",
     roles: ["admin"] // Fallback roles
   }
   ```

3. **Update OrganizationSetup** if needed to allow configuration of the new module

## Security Notes

- The system filters navigation items client-side only
- Backend API endpoints should also implement role-based access control
- Module permissions in RoleContext are the source of truth
- OrganizationSetup allows admins to configure permissions dynamically

## Implementation Details

### Data Flow

```
User Login (AuthContext)
    ↓
User has roles: ["hr", "employee"]
    ↓
RoleContext provides module permissions for these roles
    ↓
Sidebar filters navigationItems based on user's module access
    ↓
Only accessible modules are displayed
```

### Permission Hierarchy

1. **User Roles** (from AuthContext) - What role the user has
2. **Module Access** (from RoleContext) - What modules the role can access
3. **Action Permissions** (from RoleContext) - What actions (view/create/edit/approve) are allowed
4. **Navigation Display** (in Sidebar) - Show/hide menu items based on above

## Future Enhancements

- Backend API integration to load roles from database
- Row-level security based on data visibility scope
- Time-based role assignments
- Temporary role escalation
- Role-based page access control at page level
