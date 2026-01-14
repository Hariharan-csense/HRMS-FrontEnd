import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { getAccessibleModules, canAccessModule, debugRoleAccessAuto } from "@/lib/roleTestUtils";
import { mockUsers } from "@/lib/auth";

export default function RoleAccessDebug() {
  const { user: currentUser } = useAuth();
  const { roles } = useRole();

  React.useEffect(() => {
    debugRoleAccessAuto();
  }, []);

  if (!currentUser) {
    return (
      <Layout>
        <div className="text-center text-muted-foreground">Please login to see role access information</div>
      </Layout>
    );
  }

  const accessibleModules = getAccessibleModules(currentUser);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔐 Role & Module Access Debug</h1>
          <p className="text-muted-foreground mt-2">Current user: {currentUser.name}</p>
        </div>

        {/* Current User's Access */}
        <Card>
          <CardHeader>
            <CardTitle>Your Module Access</CardTitle>
            <CardDescription>Modules assigned to your roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">Your Roles:</p>
              <div className="flex flex-wrap gap-2">
                {currentUser.roles.map((role) => (
                  <span
                    key={role}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Accessible Modules:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {accessibleModules.map((module) => (
                  <div
                    key={module}
                    className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium text-center"
                  >
                    ✓ {module}
                  </div>
                ))}
              </div>
              {accessibleModules.length === 0 && (
                <p className="text-muted-foreground text-sm">No modules accessible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Roles and Their Access */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Roles & Module Permissions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <CardDescription>
                    Approval Authority: {role.approvalAuthority}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">DATA VISIBILITY</p>
                    <p className="text-sm">{role.dataVisibility}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">MODULE ACCESS</p>
                    <div className="space-y-2">
                      {Object.entries(role.modules).map(([moduleName, permissions]) => {
                        const hasAnyPermission = Object.values(permissions).some((p) => p);
                        if (!hasAnyPermission) return null;

                        return (
                          <div key={moduleName} className="text-xs border rounded p-2 bg-muted/50">
                            <p className="font-medium capitalize mb-1">{moduleName}</p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.entries(permissions).map(([perm, allowed]) => (
                                <span
                                  key={perm}
                                  className={`text-center text-xs px-1 py-0.5 rounded ${
                                    allowed
                                      ? "bg-green-200 text-green-800"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {perm.charAt(0).toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Test Users */}
        <Card>
          <CardHeader>
            <CardTitle>Test Users Available</CardTitle>
            <CardDescription>Login with these credentials to test different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(mockUsers).map(([email, { password, user }]) => (
                <div key={email} className="border rounded p-3 bg-muted/50">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Email: {email}</p>
                  <p className="text-xs text-muted-foreground">Password: {password}</p>
                  <p className="text-xs text-muted-foreground">
                    Roles: {user.roles.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
