import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/endpoint";
import { employeeApi } from "@/components/helper/employee/employee";
import { useRole } from "@/context/RoleContext";
import { toast } from "sonner";

type ReviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
type OptionalColumns = {
  definition: boolean;
  measurement: boolean;
  dataSource: boolean;
  leadIndicators: boolean;
};

type ReviewRow = {
  id: number;
  templateId?: number;
  targetDate?: string | null;
  whatWentWrong?: string | null;
  lessonLearned?: string | null;
  correctiveActions?: string | null;
  feedback?: string | null;
  status?: ReviewStatus | null;
  updatedAt?: string | null;
  submittedAt?: string | null;
  kpiTemplate?: {
    createdAt?: string | null;
    ownerUser?: { id: number; fullName: string } | null;
  } | null;
  kpiParameter?: {
    name?: string | null;
    uom?: string | null;
    reference?: number | null;
    commitment?: number | null;
    weightage?: number | null;
    achievement?: number | null;
    kpiScore?: number | null;
    definition?: string | null;
    measurement?: string | null;
    dataSource?: string | null;
    leadIndicators?: string | null;
  } | null;
};

type UserOption = { id: string; label: string };

type ReviewDraft = {
  whatWentWrong: string;
  lessonLearned: string;
  correctiveActions: string;
  targetDate: string;
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

const getKpiScoreState = (row: ReviewRow) => {
  const score = Number(row.kpiParameter?.kpiScore ?? 0);
  const weightage = Number(row.kpiParameter?.weightage ?? 0);
  const reference = Number(row.kpiParameter?.reference ?? 0);
  const commitment = Number(row.kpiParameter?.commitment ?? 0);
  const achievement = Number(row.kpiParameter?.achievement ?? 0);

  if (weightage > 0) return score >= weightage ? "good" : "low";
  if (commitment > 0) return achievement >= commitment ? "good" : "low";
  if (reference > 0) return achievement >= reference ? "good" : "low";
  return score > 0 ? "good" : "low";
};

const scoreTone = (row: ReviewRow) => {
  const isGood = getKpiScoreState(row) === "good";
  return {
    isGood,
    actionButton: isGood
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      : "bg-rose-100 text-rose-700 hover:bg-rose-200",
    panel: isGood
      ? "border-emerald-200 bg-emerald-50"
      : "border-rose-200 bg-rose-50",
    focus: isGood ? "focus:border-emerald-500" : "focus:border-rose-500",
    outlineButton: isGood
      ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      : "border-rose-300 text-rose-700 hover:bg-rose-50",
    saveButton: isGood
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-rose-600 hover:bg-rose-700",
  };
};

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

function hasLegacyKpiReviewUpdatePermission() {
  const user = getCurrentUser();
  const role = normalizeRole(user?.role);
  if (["CEO", "PDHEAD", "PILLARS", "ADMIN"].includes(role)) return true;
  if (role === "MANAGER") return true;
  if (user?.permissions && Object.keys(user.permissions).length) {
    return Boolean(
      user.permissions["kpiReview.approve"] ||
        user.permissions["kpiReview.reject"] ||
        user.permissions["kpiReview.update"] ||
        user.permissions["kpiReviews.approve"] ||
        user.permissions["kpiReviews.reject"],
    );
  }
  return false;
}

const KPIReviewPage: React.FC = () => {
  const { canPerformModuleAction, hasAnyRole } = useRole();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<UserOption[]>([]);
  const [optionalColumns, setOptionalColumns] = useState<OptionalColumns>({
    definition: false,
    measurement: false,
    dataSource: false,
    leadIndicators: false,
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingReviewId, setSavingReviewId] = useState<number | null>(null);
  const [submittingTemplateId, setSubmittingTemplateId] = useState<number | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});

  const toggleExpanded = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const canUpdateReview =
    canPerformModuleAction("kpi", "update", "review") ||
    hasLegacyKpiReviewUpdatePermission() ||
    hasAnyRole(["admin", "manager", "pdhead", "ceo", "hr", "pillars"]);

  const buildReviewDraft = (row: ReviewRow): ReviewDraft => ({
    whatWentWrong: row.whatWentWrong || "",
    lessonLearned: row.lessonLearned || "",
    correctiveActions: row.correctiveActions || row.feedback || "",
    targetDate: row.targetDate || "",
  });

  const saveReview = async (row: ReviewRow, changes: ReviewDraft) => {
    if (!row.id) return;
    if (!canUpdateReview) return;
    if (row.submittedAt) return;
    setSavingReviewId(row.id);
    setError(null);
    setRows((current) =>
      current.map((item) =>
        item.id === row.id
          ? {
              ...item,
              whatWentWrong: changes.whatWentWrong,
              lessonLearned: changes.lessonLearned,
              correctiveActions: changes.correctiveActions,
              feedback: changes.correctiveActions,
              targetDate: changes.targetDate,
            }
          : item,
      ),
    );
    try {
      await api.patch(`/kpi/parameter-reviews/${row.id}`, {
        whatWentWrong: changes.whatWentWrong,
        lessonLearned: changes.lessonLearned,
        correctiveActions: changes.correctiveActions,
        feedback: changes.correctiveActions,
        targetDate: changes.targetDate || null,
      });
      toast.success("KPI review saved successfully.");
    } catch (saveError: any) {
      const message =
        saveError?.response?.data?.message || "Unable to save KPI review.";
      setError(message);
      toast.error(message);
      await loadRows();
    } finally {
      setSavingReviewId(null);
    }
  };

  const getLastMonthReview = (current: ReviewRow) => {
    const createdAt = current.kpiTemplate?.createdAt;
    const ownerId = String(current.kpiTemplate?.ownerUser?.id || "");
    const paramName = String(current.kpiParameter?.name || "");
    if (!createdAt || !ownerId || !paramName) return null;

    const currentDate = new Date(createdAt);
    if (Number.isNaN(currentDate.getTime())) return null;

    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(currentDate.getMonth() - 1);

    return (
      rows.find((r) => {
        const d = r.kpiTemplate?.createdAt ? new Date(r.kpiTemplate.createdAt) : null;
        if (!d || Number.isNaN(d.getTime())) return false;

        const sameOwner = String(r.kpiTemplate?.ownerUser?.id || "") === ownerId;
        const sameParam = String(r.kpiParameter?.name || "") === paramName;
        const sameMonth =
          d.getFullYear() === lastMonth.getFullYear() &&
          d.getMonth() === lastMonth.getMonth();
        return (
          sameOwner &&
          sameParam &&
          sameMonth &&
          Boolean(
            String(
              r.whatWentWrong ||
                r.lessonLearned ||
                r.correctiveActions ||
                r.feedback ||
                "",
            ).trim() || r.targetDate,
          )
        );
      }) || null
    );
  };

  const loadLastMonthReview = (row: ReviewRow) => {
    const lastMonthReview = getLastMonthReview(row);
    if (!lastMonthReview) {
      const message = "No last month review found for this parameter.";
      setError(message);
      toast.error(message);
      return;
    }

    const loaded = buildReviewDraft(lastMonthReview);

    setError(null);
    setReviewDrafts((current) => ({
      ...current,
      [row.id]: loaded,
    }));
    setRows((current) =>
      current.map((item) =>
        item.id === row.id
          ? {
              ...item,
              whatWentWrong: loaded.whatWentWrong,
              lessonLearned: loaded.lessonLearned,
              correctiveActions: loaded.correctiveActions,
              feedback: loaded.correctiveActions,
              targetDate: loaded.targetDate,
        }
          : item,
      ),
    );
    toast.success("Last month review copied successfully.");
  };

  const isGroupSubmitted = (groupRows: ReviewRow[]) =>
    groupRows.length > 0 && groupRows.every((row) => Boolean(row.submittedAt));

  const submitGroup = async (groupRows: ReviewRow[]) => {
    const templateId = Number(groupRows[0]?.templateId || 0);
    if (!templateId) return;
    if (!canUpdateReview) return;
    setSubmittingTemplateId(templateId);
    setError(null);
    try {
      await api.post(`/kpi/parameter-reviews/${templateId}/submit`);
      setRows((current) =>
        current.map((row) =>
          Number(row.templateId || 0) === templateId
            ? {
                ...row,
                submittedAt: new Date().toISOString(),
              }
            : row,
        ),
      );
      toast.success("KPI reviews submitted successfully.");
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.message || "Unable to submit KPI reviews.";
      setError(message);
      toast.error(message);
      await loadRows();
    } finally {
      setSubmittingTemplateId(null);
    }
  };

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/kpi/parameter-reviews");
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setRows(payload as ReviewRow[]);
    } catch {
      setError("Unable to load KPI reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await employeeApi.getEmployees();
        if (cancelled) return;
        const options = (result.data || []).map((emp: any) => {
          const first = emp.first_name || emp.firstName || emp.name || "";
          const last = emp.last_name || emp.lastName || "";
          const name = `${String(first).trim()} ${String(last).trim()}`.trim() || "Employee";
          const code = emp.employee_id || emp.employeeId || emp.employee_code;
          return {
            id: String(emp.id || emp.employee_id || ""),
            label: code ? `${name} (${code})` : name,
          };
        });
        setEmployees(options);
      } catch {
        setEmployees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    rows.forEach((row) => {
      const date = row.kpiTemplate?.createdAt ? new Date(row.kpiTemplate.createdAt) : null;
      if (date && !Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const date = row.kpiTemplate?.createdAt ? new Date(row.kpiTemplate.createdAt) : null;
      const year = date && !Number.isNaN(date.getTime()) ? date.getFullYear() : null;
      const month = date && !Number.isNaN(date.getTime()) ? date.getMonth() + 1 : null;
      const byUser =
        !selectedUserId ||
        String(row.kpiTemplate?.ownerUser?.id || "") === selectedUserId;
      const byYear = !selectedYear || String(year || "") === selectedYear;
      const byMonth = !selectedMonth || String(month || "") === selectedMonth;
      return byUser && byYear && byMonth;
    });
  }, [rows, selectedMonth, selectedUserId, selectedYear]);

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; title: string; rows: ReviewRow[] }>();
    filtered.forEach((row) => {
      const date = row.kpiTemplate?.createdAt ? new Date(row.kpiTemplate.createdAt) : new Date();
      const monthYear = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
      const owner = row.kpiTemplate?.ownerUser?.fullName || "Unassigned";
      const key = `${row.templateId || 0}-${owner}-${monthYear}`;
      if (!map.has(key)) {
        map.set(key, { key, title: `${owner} - ${monthYear}`, rows: [] });
      }
      map.get(key)!.rows.push(row);
    });
    return Array.from(map.values());
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">KPI Review</h1>
              <p className="mt-1 text-sm text-slate-600">
                Review scorecards with the same view used in KPI Scorecard.
              </p>
            </div>
            <button
              onClick={() => void loadRows()}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,1.6fr)_220px_220px]">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Scorecard User
              </span>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
              >
                <option value="">All users</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Year
              </span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
              >
                <option value="">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Month
              </span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value || "all"} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading KPI review scorecards...
          </section>
        ) : grouped.length ? (
          grouped.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{group.title}</p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500">{group.rows.length} parameters</p>
                  <button
                    type="button"
                    onClick={() => void submitGroup(group.rows)}
                    disabled={
                      !canUpdateReview ||
                      isGroupSubmitted(group.rows) ||
                      submittingTemplateId === Number(group.rows[0]?.templateId || 0)
                    }
                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGroupSubmitted(group.rows)
                      ? "Submitted"
                      : submittingTemplateId === Number(group.rows[0]?.templateId || 0)
                        ? "Submitting..."
                        : "Submit"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200">
                <div className="bg-gradient-to-r from-cyan-50 via-emerald-50 to-amber-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600">
                      Select Columns
                    </p>
                    <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600">
                      {
                        Object.values(optionalColumns).filter(Boolean).length
                      }{" "}
                      selected
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ["definition", "What is this KPI?"],
                      ["measurement", "How it is measured?"],
                      ["dataSource", "What is the data source?"],
                      ["leadIndicators", "Lead Indicators"],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={optionalColumns[key as keyof OptionalColumns]}
                          onChange={(event) =>
                            setOptionalColumns((current) => ({
                              ...current,
                              [key]: event.target.checked,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800">
                        {[
                          "#",
                          "Parameter",
                          "UoM",
                          "Reference",
                          "Commitment",
                          "Weightage",
                          "Achievement",
                          "KPI Score",
                          optionalColumns.definition && "What is this KPI?",
                          optionalColumns.measurement && "How it is measured?",
                          optionalColumns.dataSource && "What is the data source?",
                          optionalColumns.leadIndicators && "Lead Indicators",
                          "Action",
                        ]
                          .filter(Boolean)
                          .map((header) => (
                            <th
                              key={String(header)}
                              className="border border-slate-200 px-3 py-3 text-center text-sm font-semibold"
                            >
                              {header}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, index) => (
                        <React.Fragment key={row.id}>
                        <tr className="align-top">
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-slate-200 px-3 py-3">
                            {row.kpiParameter?.name || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {row.kpiParameter?.uom || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {row.kpiParameter?.reference ?? "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {row.kpiParameter?.commitment ?? "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {row.kpiParameter?.weightage ?? "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {row.kpiParameter?.achievement ?? "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-center font-semibold">
                            {row.kpiParameter?.kpiScore ?? 0}
                          </td>
                          {optionalColumns.definition ? (
                            <td className="border border-slate-200 px-3 py-3 text-left">
                              {row.kpiParameter?.definition || "-"}
                            </td>
                          ) : null}
                          {optionalColumns.measurement ? (
                            <td className="border border-slate-200 px-3 py-3 text-left">
                              {row.kpiParameter?.measurement || "-"}
                            </td>
                          ) : null}
                          {optionalColumns.dataSource ? (
                            <td className="border border-slate-200 px-3 py-3 text-left">
                              {row.kpiParameter?.dataSource || "-"}
                            </td>
                          ) : null}
                          {optionalColumns.leadIndicators ? (
                            <td className="border border-slate-200 px-3 py-3 text-left">
                              {row.kpiParameter?.leadIndicators || "-"}
                            </td>
                          ) : null}
                          <td className="border border-slate-200 px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(row.id)}
                              className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-semibold transition ${scoreTone(row).actionButton}`}
                            >
                              {expandedId === row.id ? "Hide" : "Review"}
                            </button>
                          </td>
                        </tr>
                        {expandedId === row.id ? (
                          <tr>
                            <td colSpan={12} className="border border-slate-200 bg-slate-50 px-0 py-0">
                              <div
                                className={`m-3 rounded-2xl border px-4 py-4 text-sm ${
                                  scoreTone(row).panel
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {row.kpiParameter?.name || "Parameter"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-600">
                                      {getKpiScoreState(row) === "low"
                                        ? "Corrective action needed because this KPI score is below the expected target."
                                        : "Great result. Capture what went right and save a success note."}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs font-semibold text-slate-700">
                                    Score:{" "}
                                    <span className="text-slate-900">
                                      {row.kpiParameter?.kpiScore ?? 0} /{" "}
                                      {row.kpiParameter?.weightage ?? 0}
                                    </span>
                                  </div>
                                </div>
                                {(() => {
                                  const tone = scoreTone(row);
                                  const isGreen = tone.isGood;
                                  const draft =
                                    reviewDrafts[row.id] || buildReviewDraft(row);
                                  const updateDraft = (changes: Partial<ReviewDraft>) => {
                                    setReviewDrafts((current) => ({
                                      ...current,
                                      [row.id]: {
                                        ...(current[row.id] || draft),
                                        ...changes,
                                      },
                                    }));
                                  };

                                  return (
                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-600">
                                          {isGreen
                                            ? "What went right"
                                            : "What went wrong"}
                                        </label>
                                        <textarea
                                          value={draft.whatWentWrong}
                                          disabled={
                                            !canUpdateReview ||
                                            Boolean(row.submittedAt)
                                          }
                                          onChange={(event) =>
                                            updateDraft({
                                              whatWentWrong: event.target.value,
                                            })
                                          }
                                          placeholder={
                                            isGreen
                                              ? "Type what went right"
                                              : "Type what went wrong"
                                          }
                                          className={`min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-100 ${tone.focus}`}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-600">
                                          {isGreen
                                            ? "Key strengths"
                                            : "Lesson learned"}
                                        </label>
                                        <textarea
                                          value={draft.lessonLearned}
                                          disabled={
                                            !canUpdateReview ||
                                            Boolean(row.submittedAt)
                                          }
                                          onChange={(event) =>
                                            updateDraft({
                                              lessonLearned: event.target.value,
                                            })
                                          }
                                          placeholder={
                                            isGreen
                                              ? "Type key strengths"
                                              : "Type lesson learned"
                                          }
                                          className={`min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-100 ${tone.focus}`}
                                        />
                                      </div>

                                      <div className="space-y-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600">
                                          Corrective Actions
                                        </label>
                                        <textarea
                                          value={draft.correctiveActions}
                                          disabled={
                                            !canUpdateReview ||
                                            Boolean(row.submittedAt)
                                          }
                                          onChange={(event) =>
                                            updateDraft({
                                              correctiveActions: event.target.value,
                                            })
                                          }
                                          placeholder="Type corrective actions"
                                          className={`min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-100 ${tone.focus}`}
                                        />
                                      </div>

                                      <div className="space-y-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-600">
                                          Target Date
                                        </label>
                                        <input
                                          type="date"
                                          value={draft.targetDate}
                                          disabled={
                                            !canUpdateReview ||
                                            Boolean(row.submittedAt)
                                          }
                                          onChange={(event) =>
                                            updateDraft({
                                              targetDate: event.target.value,
                                            })
                                          }
                                          className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-100 ${tone.focus}`}
                                        />
                                        {row.updatedAt ? (
                                          <p className="mt-2 text-[11px] text-slate-500">
                                            Saved:{" "}
                                            {new Date(row.updatedAt).toLocaleString()}
                                          </p>
                                        ) : null}
                                      </div>

                                      <div className="md:col-span-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                                        <button
                                          type="button"
                                          onClick={() => loadLastMonthReview(row)}
                                          disabled={
                                            !canUpdateReview || Boolean(row.submittedAt)
                                          }
                                          className={`rounded-xl border bg-white px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${tone.outlineButton}`}
                                        >
                                          Last Month Review
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void saveReview(row, draft)
                                          }
                                          disabled={
                                            !canUpdateReview ||
                                            Boolean(row.submittedAt) ||
                                            savingReviewId === row.id
                                          }
                                          className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${tone.saveButton}`}
                                        >
                                          {savingReviewId === row.id
                                            ? "Saving..."
                                            : "Save Review"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No KPI reviews found.
          </section>
        )}
      </div>
    </Layout>
  );
};

export default KPIReviewPage;
