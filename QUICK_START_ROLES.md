# Role Permissions - Quick Start Guide

## What Was Fixed

**Problem:** Only the modules you assign to a role should be visible in the sidebar. Previously, navigation was hardcoded.

**Solution:** Implemented a dynamic role-based module permission system that automatically filters sidebar navigation based on the role's assigned modules.

## How It Works (Simple Explanation)

### Before
```
Sidebar Navigation → Hardcoded Role Checks
└─ If user.role === "admin" → Show everything
└─ If user.role === "hr" → Show only HR modules
(Static, no flexibility)
```

### After
```
User Logs In (AuthContext)
    ↓
Check User's Roles
    ↓
Look up Modules for Those Roles (RoleContext)
    ↓
Filter Sidebar Based on Module Assignment
    ↓
Only Show Allowed Modules
(Dynamic, can be changed in Organization Setup)
```

## Testing It (Simple Steps)

### 1. See Your Current Access
- Login as any user
- Look at the sidebar
- The modules shown are based on your role's permissions

### 2. View All Role Permissions
- Go to **Organization Setup** → **Roles & Permissions**
- See which modules each role can access

### 3. Change a Role's Modules (Admin Only)
- Go to **Organization Setup** → **Roles & Permissions**
- Click Edit on any role
- Check/uncheck modules in the "Module Access" section
- Save
- Sidebar automatically updates for users with that role

### 4. Debug Page (For Developers)
- Login to the app
- Navigate to `/debug/roles` (type in URL bar)
- See your roles and all accessible modules
- See all roles and their permissions

## Test Users Quick Reference

| User | Email | Password | Main Role |
|------|-------|----------|-----------|
| Admin | admin@company.com | admin123 | Admin (sees everything) |
| HR | hr@company.com | hr123 | HR Manager (sees HR modules) |
| Finance | finance@company.com | fin123 | Finance (sees payroll, expenses) |
| Manager | manager@company.com | mgr123 | Manager (sees team modules) |
| Employee | employee@company.com | emp123 | Employee (sees personal modules) |

## Key Concepts

### Role
A set of permissions assigned to a user. Examples: Admin, HR, Finance, Employee

### Module
A feature area in the system. Examples: Employees, Attendance, Payroll, Leave

### Permission
An action you can perform on a module:
- **View** - Can see the module
- **Create** - Can add new items
- **Edit** - Can modify items
- **Approve** - Can approve requests

### Module Assignment
Choosing which modules a role can access.

## Module to Navigation Mapping

When you configure modules for a role in Organization Setup, these navigation items appear in the sidebar:

| Module Name | Shows Up As |
|------------|-----------|
| employees | Employee Management |
| attendance | Attendance Management |
| leave | Leave Management |
| payroll | Payroll |
| expenses | Expenses |
| assets | Assets |
| exit | Exit & Offboarding |
| reports | Reports |
| organization | Organization Setup |

## Common Tasks

### Task: Give Finance Team Access to Expenses
1. Go to Organization Setup → Roles & Permissions
2. Edit the "Finance" role
3. In Module Access section, find "Expenses"
4. Enable the module (check "view", "approve", etc.)
5. Save
6. Finance users will now see Expenses in their sidebar

### Task: Remove Payroll Access from HR
1. Go to Organization Setup → Roles & Permissions
2. Edit the "HR Manager" role
3. In Module Access section, find "Payroll"
4. Uncheck the module or all its permissions
5. Save
6. HR users will no longer see Payroll in their sidebar

### Task: Let Managers See Reports
1. Go to Organization Setup → Roles & Permissions
2. Edit the "Manager" role
3. In Module Access section, find "Reports"
4. Check "view" permission
5. Save
6. Managers will see Reports in their sidebar

## Important Notes

✅ **Changes are instant** - When you update a role, sidebar changes immediately for logged-in users

✅ **Multiple roles work together** - If a user has 2 roles, they can access modules from both roles

✅ **Sidebar filters dynamically** - The sidebar shows only modules the user's role(s) can access

✅ **Always available** - Dashboard is always visible to all users

⚠️ **Backend needed** - For production, you'll need backend API validation

## Troubleshooting

**Q: I edited a role but the sidebar didn't change**
A: Make sure you saved the changes. If you're already logged in, try logging out and back in.

**Q: A user isn't seeing a module I enabled**
A: Check 2 things:
1. The role has the module enabled (Organization Setup)
2. The user is assigned that role (Employee records)

**Q: How do I see what modules a specific role has?**
A: Go to Organization Setup → Roles & Permissions, click Edit on the role

## Files You Need to Know

| File | Purpose |
|------|---------|
| `client/context/RoleContext.tsx` | Manages role permissions |
| `client/components/Sidebar.tsx` | Filters navigation based on roles |
| `client/pages/OrganizationSetup.tsx` | Where admins configure roles |
| `client/pages/RoleAccessDebug.tsx` | Debug page to see permissions |

## Next: What's Available in Each Role?

### Admin Role
- Sees: Everything
- Can: Do anything
- Perfect for: System administrators

### HR Manager Role
- Sees: Employees, Leave, Assets, Attendance, Payroll (view only), Reports
- Can: Manage employees, approve leave
- Perfect for: HR team members

### Manager Role
- Sees: Team Employees (view), Attendance, Leave, Reports
- Can: Approve team leave, view reports
- Perfect for: Department managers

### Finance Role
- Sees: Payroll, Expenses, Employees (view), Reports
- Can: Process payroll, approve expenses
- Perfect for: Finance team members

### Employee Role
- Sees: Leave, Attendance, Expenses, Assets, Payslips (view)
- Can: Apply leave, mark attendance, file expenses
- Perfect for: Regular employees

---

**Need more details?** Check out `ROLE_PERMISSIONS_GUIDE.md` for the complete technical documentation.
