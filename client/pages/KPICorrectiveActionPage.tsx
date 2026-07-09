import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/endpoint";
import { KpiParameterReviewMobileList } from "@/components/kpi/KpiParameterReviewMobileList";
import { useRole } from "@/context/RoleContext";
import { toast } from "sonner";

type ReviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

type KpiParameterReview = {
  id: number;
  feedback?: string | null;
  targetDate?: string | null;
  status?: ReviewStatus | null;
  updatedAt?: string | null;
  kpiTemplate?: {
    title?: string | null;
    createdAt?: string | null;
    ownerUser?: { id: number; fullName: string } | null;
  } | null;
  kpiParameter?: { name?: string | null } | null;
};

const MONTH_OPTIONS = [
  { value: "", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const STATUS_OPTIONS: Array<{ value: ReviewStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_FILTER_OPTIONS: Array<{
  value: "" | ReviewStatus;
  label: string;
}> = [{ value: "", label: "All statuses" }, ...STATUS_OPTIONS];

const STATUS_STYLES: Record<
  ReviewStatus,
  { color: string; bg: string; text: string }
> = {
  PENDING: { color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700" },
  IN_PROGRESS: { color: "#0ea5e9", bg: "bg-sky-50", text: "text-sky-700" },
  COMPLETED: {
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

function displayDate(value?: string | null) {
  if (!value) return "-";
  const dateOnlyMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function filterDate(row: KpiParameterReview) {
  const value = row.targetDate ?? row.kpiTemplate?.createdAt ?? row.updatedAt;
  if (!value) return null;
  const dateOnlyMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ownerName(row: KpiParameterReview) {
  return (
    row.kpiTemplate?.ownerUser?.fullName ??
    row.kpiTemplate?.title ??
    "Unassigned"
  );
}

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .replace(/[\s_]/g, "")
    .toUpperCase();
}

function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user") || "null") as {
      role?: string;
      permissions?: Record<string, boolean>;
    } | null;
  } catch {
    return null;
  }
}

const ROLE_PERMISSION_FALLBACKS: Record<string, string[]> = {
  ADMIN: ["*"],
  CEO: ["*"],
  PDHEAD: ["*"],
  PILLARS: ["*"],
  MANAGER: [
    "correctiveActionPlan.view",
    "correctiveActionPlan.editStatus",
    "correctiveActionPlan.nameFilter",
  ],
  INCHARGE: ["correctiveActionPlan.view"],
  EXECUTIVE: ["correctiveActionPlan.view"],
  PDPERSON: ["correctiveActionPlan.view"],
  TRAINER: ["correctiveActionPlan.view"],
  HOUSEKEEPING: ["correctiveActionPlan.view"],
  SECURITY: ["correctiveActionPlan.view"],
};

function hasPermission(key: string) {
  const user = getCurrentUser();
  const role = normalizeRole(user?.role);
  if (["CEO", "PDHEAD", "PILLARS"].includes(role)) return true;
  if (user?.permissions && Object.keys(user.permissions).length) {
    if (user.permissions[key]) return true;
    if (key === "correctiveActionPlan.nameFilter") {
      return Boolean(user.permissions["correctiveActionPlan.viewAllNames"]);
    }
    return false;
  }
  const fallback = ROLE_PERMISSION_FALLBACKS[role] ?? [];
  return fallback.includes("*") || fallback.includes(key);
}

const KPICorrectiveActionPage: React.FC = () => {
  const { canPerformModuleAction, hasAnyRole } = useRole();
  const [rows, setRows] = useState<KpiParameterReview[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | ReviewStatus>("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const legacyCanEditStatus =
    hydrated && hasPermission("correctiveActionPlan.editStatus");
  const canEditStatus =
    canPerformModuleAction("kpi", "update", "corrective_actions") ||
    legacyCanEditStatus ||
    hasAnyRole(["admin", "manager", "pdhead", "ceo", "hr", "pillars"]);
  const canUseNameFilter =
    hydrated && hasPermission("correctiveActionPlan.nameFilter");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/kpi/parameter-reviews");
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setRows(payload as KpiParameterReview[]);
    } catch {
      setError("Unable to load corrective actions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHydrated(true);
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const nameOptions = useMemo(() => {
    return Array.from(new Set(rows.map(ownerName))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [rows]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>([currentYear]);
    rows.forEach((row) => {
      const date = filterDate(row);
      if (date) years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const date = filterDate(row);
      const byName = !selectedName || ownerName(row) === selectedName;
      const byYear =
        !selectedYear || (date && String(date.getFullYear()) === selectedYear);
      const byMonth =
        !selectedMonth ||
        (date && String(date.getMonth() + 1) === selectedMonth);
      const byStatus =
        !selectedStatus || (row.status ?? "PENDING") === selectedStatus;
      return byName && byYear && byMonth && byStatus;
    });
  }, [rows, selectedMonth, selectedName, selectedStatus, selectedYear]);

  const statusSummary = useMemo(() => {
    const counts = STATUS_OPTIONS.reduce<Record<ReviewStatus, number>>(
      (acc, status) => ({ ...acc, [status.value]: 0 }),
      { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 },
    );
    filteredRows.forEach((row) => {
      counts[row.status ?? "PENDING"] += 1;
    });
    const total = filteredRows.length;
    return STATUS_OPTIONS.map((status) => ({
      ...status,
      count: counts[status.value],
      percent: total ? Math.round((counts[status.value] / total) * 100) : 0,
    }));
  }, [filteredRows]);

  const statusTotal = filteredRows.length;
  const pieGradient = useMemo(() => {
    if (!statusTotal) return "#e2e8f0";
    let cursor = 0;
    const segments = statusSummary
      .filter((status) => status.count > 0)
      .map((status) => {
        const start = cursor;
        const end = cursor + (status.count / statusTotal) * 360;
        cursor = end;
        return `${STATUS_STYLES[status.value].color} ${start}deg ${end}deg`;
      });
    return `conic-gradient(${segments.join(", ")})`;
  }, [statusSummary, statusTotal]);

  const updateStatus = async (id: number, status: ReviewStatus) => {
    setSavingId(id);
    setError(null);
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status } : row)),
    );
    try {
      await api.patch(`/kpi/parameter-reviews/${id}/status`, { status });
      toast.success("Corrective action status updated successfully.");
    } catch (statusError: any) {
      const message =
        statusError?.response?.data?.message ||
        "Unable to update corrective action status.";
      setError(message);
      toast.error(message);
      await load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 px-1 sm:space-y-6 sm:px-0">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Corrective Action Plan
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                View KPI parameter review corrective actions by year, month,
                name, and status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 sm:w-auto sm:py-1.5"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Year
                </span>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-cyan-400"
                >
                  <option value="">All years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Month
                </span>
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-cyan-400"
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value || "all"} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
              {canUseNameFilter ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Name
                  </span>
                  <select
                    value={selectedName}
                    onChange={(event) => setSelectedName(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-cyan-400"
                  >
                    <option value="">All names</option>
                    {nameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </span>
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as "" | ReviewStatus)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-cyan-400"
                >
                  {STATUS_FILTER_OPTIONS.map((status) => (
                    <option key={status.value || "all"} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status chart
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Counts based on filters.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Total: {statusTotal}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:flex-wrap xl:flex-nowrap">
                <div
                  className="relative h-40 w-40 shrink-0 rounded-full"
                  style={{ background: pieGradient }}
                >
                  <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </span>
                    <span className="text-2xl font-semibold text-slate-900">
                      {statusTotal}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  {statusSummary.map((status) => {
                    const styles = STATUS_STYLES[status.value];
                    return (
                      <div
                        key={status.value}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: styles.color }}
                          />
                          <span
                            className={`truncate text-sm font-semibold ${styles.text}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {status.count}
                          </p>
                          <p className="text-xs text-slate-500">
                            {status.percent}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          <KpiParameterReviewMobileList
            rows={filteredRows}
            ownerName={ownerName}
            displayDate={displayDate}
            feedbackLabel="Corrective Actions"
            statusOptions={STATUS_OPTIONS}
            canEditStatus={canEditStatus}
            savingId={savingId}
            onStatusChange={(id, status) => void updateStatus(id, status)}
            loading={loading}
            emptyMessage="No corrective actions found."
          />
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Parameter</th>
                  <th className="px-4 py-3">Corrective Actions</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Loading corrective actions...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row, index) => (
                    <tr key={row.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {ownerName(row)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.kpiParameter?.name ?? "-"}
                      </td>
                      <td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-slate-700">
                        {row.feedback || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {displayDate(row.targetDate)}
                      </td>
                      <td className="relative z-10 px-4 py-3">
                        <select
                          value={row.status ?? "PENDING"}
                          disabled={!canEditStatus || savingId === row.id}
                          onChange={(event) =>
                            void updateStatus(
                              row.id,
                              event.target.value as ReviewStatus,
                            )
                          }
                          className="relative z-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No corrective actions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default KPICorrectiveActionPage;
