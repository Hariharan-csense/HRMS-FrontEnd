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
  IN_PROGRESS: { color: "#17c491", bg: "bg-emerald-50", text: "text-emerald-700" },
  COMPLETED: {
    color: "#0fa372",
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
      <div className="-m-4 min-h-full space-y-5 bg-[#e9fbf5] px-4 py-5 text-[#053b2e] sm:-m-6 sm:px-6 lg:-m-6 lg:p-7">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#bdf4df] bg-white/75 shadow-[0_18px_50px_rgba(23,196,145,0.16)] backdrop-blur sm:rounded-[2rem]">
          <div className="border-b border-[#bdf4df] px-4 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0f8f70]">
                KPI / Corrective Actions
              </p>
              <h1 className="mt-6 text-2xl font-semibold tracking-normal text-[#053b2e] sm:text-3xl">
                Corrective Action Plan
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#0f8f70]">
                View KPI parameter review corrective actions by year, month,
                name, and status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="w-full rounded-xl bg-[#17c491] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,196,145,0.24)] transition hover:bg-[#0fa372] sm:w-auto"
            >
              Refresh
            </button>
          </div>
          </div>

          <div className="grid gap-6 px-4 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#0f8f70]">
                  Year
                </span>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-[#053b2e] shadow-[0_8px_24px_rgba(23,196,145,0.10)] outline-none transition focus:border-[#17c491]"
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
                <span className="mb-1.5 block text-xs font-semibold text-[#0f8f70]">
                  Month
                </span>
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-[#053b2e] shadow-[0_8px_24px_rgba(23,196,145,0.10)] outline-none transition focus:border-[#17c491]"
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
                  <span className="mb-1.5 block text-xs font-semibold text-[#0f8f70]">
                    Name
                  </span>
                  <select
                    value={selectedName}
                    onChange={(event) => setSelectedName(event.target.value)}
                    className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-[#053b2e] shadow-[0_8px_24px_rgba(23,196,145,0.10)] outline-none transition focus:border-[#17c491]"
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
                <span className="mb-1.5 block text-xs font-semibold text-[#0f8f70]">
                  Status
                </span>
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as "" | ReviewStatus)
                  }
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-[#053b2e] shadow-[0_8px_24px_rgba(23,196,145,0.10)] outline-none transition focus:border-[#17c491]"
                >
                  {STATUS_FILTER_OPTIONS.map((status) => (
                    <option key={status.value || "all"} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-[0_14px_35px_rgba(23,196,145,0.12)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#0f8f70]">
                    Status Summary
                  </p>
                  <p className="mt-1 text-sm text-[#0f8f70]">
                    Counts based on filters.
                  </p>
                </div>
                <div className="rounded-xl bg-[#e9fbf5] px-4 py-2 text-sm font-semibold text-[#053b2e]">
                  Total: {statusTotal}
                </div>
              </div>
              <div className="grid gap-3">
                  {statusSummary.map((status) => {
                    const styles = STATUS_STYLES[status.value];
                    return (
                      <div
                        key={status.value}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#bdf4df] bg-[#f3fdf9] px-4 py-3"
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
                          <p className="text-sm font-semibold text-[#053b2e]">
                            {status.count}
                          </p>
                          <p className="text-xs text-[#0f8f70]">
                            {status.percent}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[1.75rem] border border-[#bdf4df] bg-white shadow-[0_18px_50px_rgba(23,196,145,0.14)] sm:rounded-[2rem]">
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
            <table className="min-w-full divide-y divide-[#d6f7eb] text-sm">
              <thead className="bg-white text-left text-xs font-semibold text-[#0f8f70]">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Parameter</th>
                  <th className="px-6 py-4">Corrective Actions</th>
                  <th className="px-6 py-4">Target Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3faf2]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-[#0f8f70]"
                    >
                      Loading corrective actions...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row, index) => (
                    <tr key={row.id} className="align-top text-[#053b2e] hover:bg-[#f3fdf9]">
                      <td className="px-6 py-4 text-[#0f8f70]">{index + 1}</td>
                      <td className="px-6 py-4 font-semibold text-[#053b2e]">
                        {ownerName(row)}
                      </td>
                      <td className="px-6 py-4 text-[#053b2e]">
                        {row.kpiParameter?.name ?? "-"}
                      </td>
                      <td className="max-w-xl whitespace-pre-wrap px-6 py-4 text-[#053b2e]">
                        {row.feedback || "-"}
                      </td>
                      <td className="px-6 py-4 text-[#053b2e]">
                        {displayDate(row.targetDate)}
                      </td>
                      <td className="relative z-10 px-6 py-4">
                        <select
                          value={row.status ?? "PENDING"}
                          disabled={!canEditStatus || savingId === row.id}
                          onChange={(event) =>
                            void updateStatus(
                              row.id,
                              event.target.value as ReviewStatus,
                            )
                          }
                          className="relative z-10 rounded-xl border border-transparent bg-[#e9fbf5] px-3 py-2 text-sm font-semibold text-[#053b2e] outline-none transition focus:border-[#17c491] disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="px-6 py-8 text-center text-[#0f8f70]"
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
