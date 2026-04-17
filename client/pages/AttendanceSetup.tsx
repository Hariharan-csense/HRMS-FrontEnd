import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Settings, Shield } from "lucide-react";
import { showToast } from "@/utils/toast";
import { companyApi, Company } from "@/components/helper/company/company";

export default function AttendanceSetup() {
  const { user } = useAuth();
  const { hasModuleAccess, canPerformModuleAction } = useRole();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESSL Configuration State
  const [esslEnabled, setEsslEnabled] = useState(false);
  const [esslApiKey, setEsslApiKey] = useState("");
  const [esslApiKeyConfigured, setEsslApiKeyConfigured] = useState(false);

  // RBAC Checks
  const canViewAttendanceSetup = hasModuleAccess("attendance");
  const canEditAttendanceSetup = canPerformModuleAction("attendance", "edit", "setup");

  useEffect(() => {
    if (canViewAttendanceSetup) {
      fetchCompany();
    }
  }, [canViewAttendanceSetup]);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await companyApi.getCompany();
      if (result.data) {
        setCompany(result.data);
        setEsslEnabled(result.data.esslEnabled || false);
        setEsslApiKeyConfigured(result.data.esslApiKeyConfigured || false);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch company data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id || !canEditAttendanceSetup) {
      if (!canEditAttendanceSetup) {
        showToast.error("You don't have permission to edit attendance setup");
      }
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        esslEnabled,
        esslApiKey: esslApiKey || undefined, // Only send API key if provided
      };

      const result = await companyApi.updateCompany(company.id, updateData);
      if (result.data) {
        setCompany(result.data);
        setEsslApiKeyConfigured(result.data.esslApiKeyConfigured || false);
        showToast.success("ESSL configuration updated successfully");
        await fetchCompany();
      } else if (result.error) {
        showToast.error(result.error);
      }
    } catch (err) {
      showToast.error("Failed to update ESSL configuration");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewAttendanceSetup) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You don't have permission to view attendance setup
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-6 md:w-8 h-6 md:h-8 text-primary flex-shrink-0" />
            Attendance Setup
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
            Configure attendance system settings and integrations
          </p>
        </div>

        {/* RBAC Warning */}
        {!canEditAttendanceSetup && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Read-Only Access</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You have view-only access to attendance setup. Contact your administrator to make changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading settings...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* ESSL Integration Card */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#17c491] rounded-full"></div>
                  ESSL Biometric Integration
                </CardTitle>
                <CardDescription>
                  Configure biometric attendance device integration for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Enable ESSL Integration</Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle this on to accept biometric punch data for this company.
                      </p>
                    </div>
                    <Switch
                      checked={esslEnabled}
                      onCheckedChange={canEditAttendanceSetup ? setEsslEnabled : undefined}
                      disabled={!canEditAttendanceSetup}
                    />
                  </div>

                  {esslEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>ESSL API Key</Label>
                        <Input
                          value={esslApiKey}
                          onChange={(e) => setEsslApiKey(e.target.value)}
                          className="mt-2"
                          placeholder="Enter company-specific ESSL secret"
                          disabled={!canEditAttendanceSetup}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Vendor software will send this key with each punch request.
                        </p>
                      </div>
                      <div>
                        <Label>Company Code</Label>
                        <Input
                          value={company?.companyId || ""}
                          className="mt-2"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use this value as `company_code` in machine or middleware config.
                        </p>
                      </div>
                    </div>
                  )}

                  {esslApiKeyConfigured && !esslApiKey && (
                    <p className="text-xs text-emerald-700">
                      ESSL API key already configured for this company. Leave blank to keep the existing key.
                    </p>
                  )}
                </div>

                {canEditAttendanceSetup && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#17c491] hover:bg-[#17c491]/90 text-white"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            {esslEnabled && (
              <Card className="bg-gradient-to-r from-[#17c491]/10 to-emerald-50 border-[#17c491]/20 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#17c491] rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">ESSL Integration Active</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Biometric attendance data will be accepted from configured devices
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
