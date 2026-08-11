import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, RefreshCw } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "sonner";

const PayrollAuditTrail: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    action: "all",
  });

  const loadAudit = async () => {
    setLoading(true);
    try {
      const response = await ENDPOINTS.getPayrollAuditTrail({
        month: filters.month || undefined,
        action: filters.action === "all" ? undefined : filters.action,
      });
      setRows(response.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load payroll audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Payroll Audit Trail
            </h1>
            <p className="text-muted-foreground mt-2">
              Track payroll processing, status changes, and deleted payslips.
            </p>
          </div>
          <Button onClick={loadAudit} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Month</Label>
              <Input
                type="month"
                value={filters.month}
                onChange={(event) =>
                  setFilters({ ...filters, month: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Action</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={filters.action}
                onChange={(event) =>
                  setFilters({ ...filters, action: event.target.value })
                }
              >
                <option value="all">All actions</option>
                <option value="payroll_processed">Payroll Processed</option>
                <option value="payroll_reprocessed">Payroll Reprocessed</option>
                <option value="payroll_status_updated">Status Updated</option>
                <option value="payslip_deleted">Payslip Deleted</option>
                <option value="payroll_processing_deleted">Processing Deleted</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={loadAudit}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Action</th>
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3 text-left">Month</th>
                    <th className="p-3 text-left">Changed By</th>
                    <th className="p-3 text-left">Net Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No audit events found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const beforeNet = Number(row.beforeData?.net || 0);
                      const afterNet = Number(row.afterData?.net || 0);
                      return (
                        <tr key={row.id} className="border-t">
                          <td className="p-3">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-3 font-medium">{row.action}</td>
                          <td className="p-3">
                            {row.employeeName || row.employeeCode || "-"}
                            <div className="text-xs text-muted-foreground">
                              {row.employeeCode || ""}
                            </div>
                          </td>
                          <td className="p-3">{row.month || "-"}</td>
                          <td className="p-3">{row.changed_by_name || "-"}</td>
                          <td className="p-3">
                            {beforeNet || afterNet
                              ? `₹${beforeNet.toLocaleString()} -> ₹${afterNet.toLocaleString()}`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PayrollAuditTrail;
