import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showToast } from "@/utils/toast";
import { esslApi, EsslDevice, EsslEmployee, EsslMapping, EsslLog, EsslSync } from "@/components/helper/essl/essl";

const emptyDevice = { device_name: "", device_model: "", device_serial_number: "", device_ip: "", device_port: "", connection_type: "UNKNOWN", integration_type: "", api_url: "", is_active: true };
const emptyMapping = { device_id: "", employee_id: "", essl_user_id: "", is_active: true };
const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
const employeeLabel = (e: EsslEmployee) => [e.first_name, e.last_name, "–", e.employee_id].filter(Boolean).join(" ");
const errorMessage = (error: any) => error.response?.data?.message || "Unable to complete eSSL request";

export default function AttendanceSetup() {
  const { canPerformModuleAction } = useRole();
  const canView = canPerformModuleAction("attendance", "view", "setup");
  const canCreate = canPerformModuleAction("attendance", "create", "setup");
  const canEdit = canPerformModuleAction("attendance", "edit", "setup");
  const canDelete = canPerformModuleAction("attendance", "delete", "setup");
  const [tab, setTab] = useState("devices");
  const [devices, setDevices] = useState<EsslDevice[]>([]);
  const [employees, setEmployees] = useState<EsslEmployee[]>([]);
  const [mappings, setMappings] = useState<EsslMapping[]>([]);
  const [logs, setLogs] = useState<EsslLog[]>([]);
  const [syncs, setSyncs] = useState<EsslSync[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [deviceForm, setDeviceForm] = useState(emptyDevice);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingId, setMappingId] = useState<number | null>(null);
  const [mappingForm, setMappingForm] = useState(emptyMapping);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [filters, setFilters] = useState({ device_id: "", employee_id: "", from: "", to: "", processed: "" });
  const [logPage, setLogPage] = useState(1);
  const [syncPage, setSyncPage] = useState(1);

  const load = async () => {
    const [d, m, e] = await Promise.all([esslApi.devices(), esslApi.mappings(), esslApi.employees()]);
    setDevices(d); setMappings(m); setEmployees(e);
  };
  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    load().catch((e) => { if (!cancelled) setError(errorMessage(e)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [canView]);
  useEffect(() => {
    if (!canView || tab !== "logs") return;
    let cancelled = false;
    const params: Record<string, string | number> = { page: logPage, limit: 50 };
    for (const [key, value] of Object.entries(filters)) if (value) {
      // Date filters are IST calendar days, matching HRMS reporting.
      params[key] = key === "from" ? value + "T00:00:00+05:30" : key === "to" ? value + "T23:59:59.999+05:30" : value;
    }
    setError("");
    esslApi.logs(params).then((data) => { if (!cancelled) setLogs(data); }).catch((e) => { if (!cancelled) { setLogs([]); setError(errorMessage(e)); } });
    return () => { cancelled = true; };
  }, [canView, tab, filters, logPage]);
  useEffect(() => {
    if (!canView || tab !== "history") return;
    let cancelled = false;
    setError("");
    esslApi.syncLogs(syncPage).then((data) => { if (!cancelled) setSyncs(data); }).catch((e) => { if (!cancelled) { setSyncs([]); setError(errorMessage(e)); } });
    return () => { cancelled = true; };
  }, [canView, tab, syncPage]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError("");
    try { await action(); showToast.success(success); }
    catch (e) { const message = errorMessage(e); setError(message); showToast.error(message); }
    finally {
      try { await load(); } catch (e) { setError(errorMessage(e)); }
      setBusy(false);
    }
  };
  const editDevice = (device?: EsslDevice) => {
    setDeviceId(device?.id || null);
    setDeviceForm(device ? {
      device_name: device.device_name, device_model: device.device_model || "",
      device_serial_number: device.device_serial_number || "", device_ip: device.device_ip || "",
      device_port: device.device_port?.toString() || "", connection_type: device.connection_type || "UNKNOWN",
      integration_type: device.integration_type || "", api_url: device.api_url || "", is_active: Boolean(device.is_active),
    } : emptyDevice);
    setDeviceOpen(true);
  };
  const editMapping = (mapping?: EsslMapping) => {
    setMappingId(mapping?.id || null);
    setMappingForm(mapping ? { device_id: String(mapping.device_id), employee_id: String(mapping.employee_id), essl_user_id: mapping.essl_user_id, is_active: Boolean(mapping.is_active) } : emptyMapping);
    if (mapping && !employees.some((e) => e.id === mapping.employee_id)) setEmployees((prev) => [...prev, { id: mapping.employee_id, employee_id: mapping.employee_code, first_name: mapping.first_name, last_name: mapping.last_name }]);
    setMappingOpen(true);
  };
  const changeFilter = (key: keyof typeof filters, value: string) => { setFilters((prev) => ({ ...prev, [key]: value })); setLogPage(1); };

  if (!canView) return <Layout><p>You do not have permission to view attendance setup.</p></Layout>;
  return <Layout><div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Attendance Setup</h1><p className="text-muted-foreground mt-2">Biometric / eSSL devices and employee mappings</p></div>
    <Card><CardHeader><CardTitle>Device connection pending</CardTitle><CardDescription>Configure devices and mappings now. Actual connectivity needs the device model and confirmed API / SDK. Test Connection and Sync Now will report that communication is not configured.</CardDescription></CardHeader></Card>
    {error && <p role="alert" className="rounded border border-destructive p-3 text-destructive">{error}</p>}
    {loading ? <p>Loading biometric settings…</p> : <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="flex flex-wrap h-auto justify-start">
        <TabsTrigger value="devices">Devices</TabsTrigger><TabsTrigger value="mappings">Employee Mapping</TabsTrigger>
        <TabsTrigger value="logs">Biometric Logs</TabsTrigger><TabsTrigger value="history">Sync History</TabsTrigger>
      </TabsList>
      <TabsContent value="devices"><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>eSSL Devices</CardTitle>{canCreate && <Button disabled={busy} onClick={() => editDevice()}>Add Device</Button>}</CardHeader><CardContent className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left border-b">{["Device", "Model", "Serial Number", "IP / Port", "Status", "Last Sync (IST)", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
          {devices.map((d) => <tr key={d.id} className="border-b">
            <td className="p-3">{d.device_name}</td><td className="p-3">{d.device_model || "Unknown"}</td><td className="p-3">{d.device_serial_number || "—"}</td>
            <td className="p-3">{d.device_ip || "—"}{d.device_port ? ":" + d.device_port : ""}</td>
            <td className="p-3">{d.is_active ? "Enabled · connection pending" : "Disabled"}</td>
            <td className="p-3">{dateLabel(d.last_sync_at)}<p>{d.last_sync_status}</p>{d.last_sync_error && <p className="text-destructive max-w-xs">{d.last_sync_error}</p>}</td>
            <td className="p-3"><div className="flex flex-wrap gap-2">
              {canEdit && <><Button size="sm" variant="outline" disabled={busy || !d.is_active} onClick={() => run(() => esslApi.action(d.id, "test-connection"), "Connection tested")}>Test Connection</Button>
                <Button size="sm" variant="outline" disabled={busy || !d.is_active} onClick={() => run(async () => {
                  const result = await esslApi.action(d.id, "sync");
                  if (result.data.data.status !== "SUCCESS") throw { response: { data: { message: "Sync completed with errors. Review Sync History and Biometric Logs." } } };
                }, "Synchronization completed")}>Sync Now</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => editDevice(d)}>Edit</Button></>}
              {canDelete && !!d.is_active && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => esslApi.disableDevice(d.id), "Device disabled")}>Disable</Button>}
              <Button size="sm" variant="outline" onClick={() => { changeFilter("device_id", String(d.id)); setTab("logs"); }}>View Logs</Button>
            </div></td>
          </tr>)}
        </tbody></table>{!devices.length && <p className="py-6 text-muted-foreground">No devices configured.</p>}
      </CardContent></Card></TabsContent>
      <TabsContent value="mappings"><Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Biometric Employee Mapping</CardTitle>{canCreate && <Button disabled={busy} onClick={() => editMapping()}>Add Mapping</Button>}</CardHeader><CardContent className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left border-b">{["HRMS Employee", "Device", "eSSL User ID", "Status", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
          {mappings.map((m) => <tr key={m.id} className="border-b"><td className="p-3">{m.first_name} {m.last_name} – {m.employee_code}</td><td className="p-3">{m.device_name}</td><td className="p-3">{m.essl_user_id}</td><td className="p-3">{m.is_active ? "Active" : "Disabled"}</td>
            <td className="p-3 space-x-2">{canEdit && <Button size="sm" variant="outline" disabled={busy} onClick={() => editMapping(m)}>Edit</Button>}{canDelete && !!m.is_active && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => esslApi.disableMapping(m.id), "Mapping disabled")}>Disable</Button>}</td></tr>)}
        </tbody></table>{!mappings.length && <p className="py-6 text-muted-foreground">No employee mappings configured.</p>}
      </CardContent></Card></TabsContent>
      <TabsContent value="logs"><Card><CardHeader><CardTitle>Raw Biometric Logs</CardTitle><CardDescription>Punch times are shown in IST. Failed punches remain available for review.</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="grid md:grid-cols-5 gap-3">
          <div><Label htmlFor="filter-device">Device</Label><select id="filter-device" className={selectClass} value={filters.device_id} onChange={(e) => changeFilter("device_id", e.target.value)}><option value="">All devices</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.device_name}</option>)}</select></div>
          <div><Label htmlFor="filter-employee">Employee</Label><select id="filter-employee" className={selectClass} value={filters.employee_id} onChange={(e) => changeFilter("employee_id", e.target.value)}><option value="">All employees</option>{employees.map((e) => <option key={e.id} value={e.id}>{employeeLabel(e)}</option>)}</select></div>
          <div><Label htmlFor="filter-from">From (IST)</Label><Input id="filter-from" type="date" value={filters.from} onChange={(e) => changeFilter("from", e.target.value)} /></div>
          <div><Label htmlFor="filter-to">To (IST)</Label><Input id="filter-to" type="date" value={filters.to} min={filters.from} onChange={(e) => changeFilter("to", e.target.value)} /></div>
          <div><Label htmlFor="filter-status">Processing status</Label><select id="filter-status" className={selectClass} value={filters.processed} onChange={(e) => changeFilter("processed", e.target.value)}><option value="">All statuses</option><option value="true">Processed</option><option value="false">Unprocessed / Failed</option></select></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b">{["Employee", "eSSL User ID", "Device", "Punch Time (IST)", "Direction", "Processed", "Processing Error", "Created (IST)"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
          {logs.map((l) => <tr key={l.id} className="border-b"><td className="p-3">{l.employee_id ? [l.first_name, l.last_name, l.employee_code].join(" ") : "Unmapped"}</td><td className="p-3">{l.essl_user_id || "—"}</td><td className="p-3">{l.device_name}</td><td className="p-3">{dateLabel(l.punch_time)}</td><td className="p-3">{l.punch_type || "—"}</td><td className="p-3">{l.processed ? "Yes" : "No"}</td><td className="p-3 text-destructive">{l.processing_error || "—"}</td><td className="p-3">{dateLabel(l.created_at)}</td></tr>)}
        </tbody></table></div>{!logs.length && <p>No biometric logs match these filters.</p>}
        <div className="flex items-center gap-3"><Button variant="outline" disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>Previous</Button><span>Page {logPage}</span><Button variant="outline" disabled={logs.length < 50} onClick={() => setLogPage((p) => p + 1)}>Next</Button></div>
      </CardContent></Card></TabsContent>
      <TabsContent value="history"><Card><CardHeader><CardTitle>Sync History</CardTitle></CardHeader><CardContent className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left border-b">{["Device", "Started (IST)", "Status", "Fetched", "Inserted", "Duplicates", "Processed", "Failed", "Error"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
          {syncs.map((s) => <tr key={s.id} className="border-b"><td className="p-3">{devices.find((d) => d.id === s.device_id)?.device_name || "—"}</td><td className="p-3">{dateLabel(s.started_at)}</td><td className="p-3">{s.status}</td>{[s.fetched_count, s.inserted_count, s.duplicate_count, s.processed_count, s.failed_count].map((n, i) => <td key={i} className="p-3">{n}</td>)}<td className="p-3 text-destructive">{s.error_message || "—"}</td></tr>)}
        </tbody></table>{!syncs.length && <p className="py-6">No synchronization attempts yet.</p>}
        <div className="flex items-center gap-3 pt-4"><Button variant="outline" disabled={syncPage === 1} onClick={() => setSyncPage((p) => p - 1)}>Previous</Button><span>Page {syncPage}</span><Button variant="outline" disabled={syncs.length < 50} onClick={() => setSyncPage((p) => p + 1)}>Next</Button></div>
      </CardContent></Card></TabsContent>
    </Tabs>}
    <Dialog open={deviceOpen} onOpenChange={(open) => { if (!busy) setDeviceOpen(open); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{deviceId ? "Edit Device" : "Add Device"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!(deviceId ? canEdit : canCreate)) return; void run(async () => {
        await esslApi.saveDevice(deviceId, { ...deviceForm, device_port: deviceForm.device_port ? Number(deviceForm.device_port) : null }); setDeviceOpen(false);
      }, "Device saved"); }}>
        {([["device_name", "Device Name"], ["device_model", "Device Model"], ["device_serial_number", "Serial Number"], ["device_ip", "IP Address"], ["integration_type", "Integration Type (if known)"], ["api_url", "API URL (if applicable)"]] as const).map(([key, label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} value={deviceForm[key]} required={key === "device_name"} maxLength={key === "api_url" ? 2048 : 191} type={key === "api_url" ? "url" : "text"} onChange={(e) => setDeviceForm((prev) => ({ ...prev, [key]: e.target.value }))} /></div>)}
        <div><Label htmlFor="device_port">Port</Label><Input id="device_port" type="number" min={1} max={65535} value={deviceForm.device_port} onChange={(e) => setDeviceForm((prev) => ({ ...prev, device_port: e.target.value }))} /></div>
        <div><Label htmlFor="connection_type">Connection Type</Label><select id="connection_type" className={selectClass} value={deviceForm.connection_type} onChange={(e) => setDeviceForm((prev) => ({ ...prev, connection_type: e.target.value }))}>{["UNKNOWN", "LAN", "WAN", "CLOUD"].map((v) => <option key={v}>{v}</option>)}</select></div>
        <label className="flex gap-2 items-center"><input type="checkbox" checked={deviceForm.is_active} onChange={(e) => setDeviceForm((prev) => ({ ...prev, is_active: e.target.checked }))} />Device enabled</label>
        <p className="text-sm text-muted-foreground">Leave unknown details blank. Credentials will be configured after the communication method is confirmed.</p>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Device"}</Button>
      </form>
    </DialogContent></Dialog>
    <Dialog open={mappingOpen} onOpenChange={(open) => { if (!busy) setMappingOpen(open); }}><DialogContent><DialogHeader><DialogTitle>{mappingId ? "Edit Mapping" : "Add Mapping"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!(mappingId ? canEdit : canCreate)) return; void run(async () => {
        await esslApi.saveMapping(mappingId, { ...mappingForm, device_id: Number(mappingForm.device_id), employee_id: Number(mappingForm.employee_id) }); setMappingOpen(false);
      }, "Employee mapping saved"); }}>
        <div><Label htmlFor="employee-search">Find employee by name / code</Label><div className="flex gap-2"><Input id="employee-search" value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} /><Button type="button" variant="outline" disabled={busy} onClick={async () => {
          try { setEmployees(await esslApi.employees(employeeSearch)); } catch (e) { showToast.error(errorMessage(e)); }
        }}>Search</Button></div></div>
        <div><Label htmlFor="mapping-employee">HRMS Employee</Label><select id="mapping-employee" className={selectClass} required value={mappingForm.employee_id} onChange={(e) => setMappingForm((prev) => ({ ...prev, employee_id: e.target.value }))}><option value="">Select employee</option>{employees.map((e) => <option key={e.id} value={e.id}>{employeeLabel(e)}</option>)}</select></div>
        <div><Label htmlFor="mapping-device">Device</Label><select id="mapping-device" className={selectClass} required value={mappingForm.device_id} onChange={(e) => setMappingForm((prev) => ({ ...prev, device_id: e.target.value }))}><option value="">Select device</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.device_name}{!d.is_active ? " (disabled)" : ""}</option>)}</select></div>
        <div><Label htmlFor="mapping-user">eSSL User ID</Label><Input id="mapping-user" required maxLength={191} value={mappingForm.essl_user_id} onChange={(e) => setMappingForm((prev) => ({ ...prev, essl_user_id: e.target.value }))} /></div>
        <label className="flex gap-2 items-center"><input type="checkbox" checked={mappingForm.is_active} onChange={(e) => setMappingForm((prev) => ({ ...prev, is_active: e.target.checked }))} />Mapping active</label>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Mapping"}</Button>
      </form>
    </DialogContent></Dialog>
  </div></Layout>;
}

