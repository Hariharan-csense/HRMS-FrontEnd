import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/endpoint";

type Status = "Excellent" | "Good" | "Needs Improvement";
type ActionStatus = "Pending" | "In Progress" | "Completed" | "Overdue";

type KpiRow = {
  templateId?: number;
  templateTitle?: string;
  employee: string;
  employeeDepartment?: string;
  department: string;
  role: string;
  parameter: string;
  reference: string;
  commitment: number;
  achievement: number;
  score: number;
  scorecardScore?: number;
  status: Status;
  year: number;
  month: string;
  periodDate?: string;
  growth: number;
  initialCompetency: number;
  currentCompetency: number;
  actionsRaised: number;
  actionsClosed: number;
};

type PerformerRow = {
  templateId?: number;
  templateTitle?: string;
  employee: string;
  employeeDepartment?: string;
  department: string;
  role: string;
  year: number;
  month: string;
  periodDate?: string;
  score: number;
  achievement: number;
  growth: number;
  parameters: string[];
  actionsRaised: number;
  actionsClosed: number;
};

type CorrectiveAction = {
  employee: string;
  department: string;
  role?: string;
  parameter: string;
  action: string;
  createdDate: string;
  targetDate: string;
  status: ActionStatus;
  year?: number;
  month?: string;
};

type ReportsPayload = {
  kpiRows?: KpiRow[];
  correctiveActions?: CorrectiveAction[];
  monthlyTrend?: { label: string; score: number }[];
  filters?: {
    employees?: string[];
    departments?: string[];
    roles?: string[];
    parameters?: string[];
    years?: string[];
    months?: string[];
  };
};

const reportTabs = [
  "KPI Performance",
  "Employee KPI",
  "Department Performance",
  "Corrective Action",
  "KPI Trend Analysis",
  "Competency Growth",
  "Management Summary",
] as const;

type ReportTab = (typeof reportTabs)[number];

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function formatDisplayValue(value: string | number | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(Math.trunc(parsed)) : String(parsed);
}

function daysOverdue(targetDate: string, status: ActionStatus) {
  if (status === "Completed" || !targetDate) return 0;
  const today = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  return Math.max(
    0,
    Math.ceil((today.getTime() - target.getTime()) / 86400000),
  );
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) =>
    headers
      .map((header) => {
        const value = String(row[header] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  return [headers.join(","), ...body].join("\n");
}

function rowDepartment(row: {
  employeeDepartment?: string;
  department: string;
}) {
  return row.employeeDepartment || row.department;
}

function escapeHtml(value: string | number) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printPdfReport({
  title,
  filename,
  rows,
  filters,
}: {
  title: string;
  filename: string;
  rows: Record<string, string | number>[];
  filters: Record<string, string>;
}) {
  const headers = rows.length ? Object.keys(rows[0]) : ["Message"];
  const printableRows = rows.length
    ? rows
    : [{ Message: "No data available for the selected filters." }];
  const filterText = Object.entries(filters)
    .filter(([, value]) => value && value !== "All")
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.35; }
    .header { border-bottom: 2px solid #0f766e; margin-bottom: 12px; padding-bottom: 8px; }
    h1 { margin: 0; font-size: 20px; letter-spacing: 0; }
    .meta { margin-top: 5px; color: #475569; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
    th { background: #ecfdf5; color: #064e3b; font-size: 9px; text-transform: uppercase; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
    <div class="meta">${escapeHtml(filterText || "Filters: All")}</div>
  </div>
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${printableRows
        .map(
          (row) =>
            `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <script>
    document.title = ${JSON.stringify(filename)};
    window.addEventListener("load", function () {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;

  const printFrame = document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const frameWindow = printFrame.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    document.body.removeChild(printFrame);
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  setTimeout(() => {
    document.body.removeChild(printFrame);
  }, 2000);
}

function StatusPill({ status }: { status: Status | ActionStatus }) {
  const tone =
    status === "Excellent" || status === "Completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Good" || status === "In Progress"
        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
        : status === "Pending"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

function Card({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function BarChart({
  data,
  label,
}: {
  data: { label: string; value: number }[];
  label: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_3rem] items-center gap-2 text-sm sm:grid-cols-[8rem_1fr_3rem] sm:gap-3"
        >
          <span className="truncate font-medium text-slate-700">
            {item.label}
          </span>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-semibold text-slate-900">
            {Math.round(item.value)}
          </span>
        </div>
      ))}
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function LineChart({ data }: { data: { label: string; score: number }[] }) {
  const points = data
    .map((item, index) => {
      const x = 20 + index * (260 / Math.max(data.length - 1, 1));
      const y = 130 - item.score;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 310 150"
      className="h-52 w-full"
      role="img"
      aria-label="KPI score trend line chart"
    >
      <path d="M20 20V130H295" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <polyline
        points={points}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((item, index) => {
        const x = 20 + index * (260 / Math.max(data.length - 1, 1));
        const y = 130 - item.score;
        return (
          <g key={item.label}>
            <circle cx={x} cy={y} r="4" fill="#0891b2" />
            <text
              x={x}
              y="144"
              textAnchor="middle"
              className="fill-slate-500 text-[8px] font-semibold"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({
  values,
}: {
  values: { label: string; value: number; color: string }[];
}) {
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  const segments = values.map((item, index) => {
    const previous = values
      .slice(0, index)
      .reduce((sum, segment) => sum + segment.value, 0);
    const dash = (item.value / total) * 100;
    const offset = 25 - (previous / total) * 100;
    return { ...item, dash, offset };
  });
  return (
    <div className="flex flex-col flex-wrap items-center justify-center gap-4 sm:flex-row sm:gap-5">
      <svg
        viewBox="0 0 120 120"
        className="h-36 w-36 shrink-0 -rotate-90 sm:h-44 sm:w-44"
        role="img"
        aria-label="KPI distribution chart"
      >
        {segments.map((item) => (
          <circle
            key={item.label}
            cx="60"
            cy="60"
            r="38"
            fill="none"
            stroke={item.color}
            strokeWidth="18"
            pathLength="100"
            strokeDasharray={`${item.dash} ${100 - item.dash}`}
            strokeDashoffset={item.offset}
          />
        ))}
      </svg>
      <div className="space-y-2">
        {values.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 [-webkit-overflow-scrolling:touch]">
      <table className="min-w-[640px] w-full divide-y divide-slate-200 text-xs sm:min-w-full sm:text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top hover:bg-slate-50/70">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const KPIReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] =
    useState<ReportTab>("KPI Performance");
  const [kpiRows, setKpiRows] = useState<KpiRow[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<
    CorrectiveAction[]
  >([]);
  const [monthlyTrend, setMonthlyTrend] = useState<
    { label: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("All");
  const [month, setMonth] = useState("All");
  const [department, setDepartment] = useState("All");
  const [employee, setEmployee] = useState("All");
  const [role, setRole] = useState("All");
  const [parameter, setParameter] = useState("All");
  const [actionStatus, setActionStatus] = useState("All");
  const [reportFilters, setReportFilters] = useState<
    NonNullable<ReportsPayload["filters"]>
  >({});

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ReportsPayload>("/kpi/reports/summary");
      setKpiRows(Array.isArray(res.data.kpiRows) ? res.data.kpiRows : []);
      setCorrectiveActions(
        Array.isArray(res.data.correctiveActions)
          ? res.data.correctiveActions
          : [],
      );
      setMonthlyTrend(
        Array.isArray(res.data.monthlyTrend) ? res.data.monthlyTrend : [],
      );
      setReportFilters(res.data.filters || {});
    } catch {
      setKpiRows([]);
      setCorrectiveActions([]);
      setMonthlyTrend([]);
      setReportFilters({});
      setError("Unable to load dynamic reports. Please login again and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void loadReports(), 0);
    return () => clearTimeout(timer);
  }, []);

  const mergeFilterOptions = (...groups: string[][]) =>
    [
      "All",
      ...Array.from(
        new Set(
          groups
            .flat()
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    ];

  const departments = useMemo(
    () =>
      mergeFilterOptions(
        reportFilters.departments || [],
        kpiRows.map(rowDepartment),
        correctiveActions.map((action) => action.department),
      ),
    [correctiveActions, kpiRows, reportFilters.departments],
  );
  const employees = useMemo(() => {
    const kpiSourceRows =
      department === "All"
        ? kpiRows
        : kpiRows.filter((row) => rowDepartment(row) === department);
    const actionSourceRows =
      department === "All"
        ? correctiveActions
        : correctiveActions.filter(
            (action) => action.department === department,
          );
    return mergeFilterOptions(
      reportFilters.employees || [],
      kpiSourceRows.map((row) => row.employee),
      actionSourceRows.map((action) => action.employee),
    );
  }, [
    correctiveActions,
    department,
    kpiRows,
    reportFilters.employees,
  ]);
  const roles = useMemo(
    () =>
      mergeFilterOptions(
        reportFilters.roles || [],
        kpiRows.map((row) => row.role),
        correctiveActions
          .map((action) => action.role)
          .filter(Boolean) as string[],
      ),
    [correctiveActions, kpiRows, reportFilters.roles],
  );
  const parameters = useMemo(
    () =>
      mergeFilterOptions(
        reportFilters.parameters || [],
        kpiRows.map((row) => row.parameter),
        correctiveActions.map((action) => action.parameter),
      ),
    [correctiveActions, kpiRows, reportFilters.parameters],
  );
  const months = useMemo(
    () =>
      mergeFilterOptions(
        reportFilters.months || [],
        kpiRows.map((row) => row.month),
        correctiveActions
          .map((action) => action.month)
          .filter(Boolean) as string[],
      ),
    [correctiveActions, kpiRows, reportFilters.months],
  );
  const years = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set([
            ...(reportFilters.years || []),
            ...kpiRows.map((row) => String(row.year)),
            ...correctiveActions
              .map((action) => (action.year ? String(action.year) : ""))
              .filter(Boolean),
          ]),
        ),
      ].sort((a, b) => {
        if (a === "All") return -1;
        if (b === "All") return 1;
        return b.localeCompare(a);
      }),
    [correctiveActions, kpiRows, reportFilters.years],
  );

  const quarterlyTrend = useMemo(() => {
    const monthIndex = new Map([
      ["January", 0],
      ["February", 1],
      ["March", 2],
      ["April", 3],
      ["May", 4],
      ["June", 5],
      ["July", 6],
      ["August", 7],
      ["September", 8],
      ["October", 9],
      ["November", 10],
      ["December", 11],
    ]);
    const groups = new Map<string, number[]>();
    for (const row of kpiRows) {
      const quarter = Math.floor((monthIndex.get(row.month) ?? 0) / 3) + 1;
      const key = `${row.year} Q${quarter}`;
      groups.set(key, [...(groups.get(key) ?? []), row.score]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, scores]) => ({ label, score: average(scores) }));
  }, [kpiRows]);

  const yearlyTrend = useMemo(() => {
    const groups = new Map<number, number[]>();
    for (const row of kpiRows) {
      groups.set(row.year, [...(groups.get(row.year) ?? []), row.score]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([label, scores]) => ({
        label: String(label),
        score: average(scores),
      }));
  }, [kpiRows]);

  const resetFilters = () => {
    setYear("All");
    setMonth("All");
    setDepartment("All");
    setEmployee("All");
    setRole("All");
    setParameter("All");
    setActionStatus("All");
  };

  const selectReport = (tab: ReportTab) => {
    setActiveReport(tab);
    resetFilters();
  };

  useEffect(() => {
    if (employee !== "All" && !employees.includes(employee)) {
      setEmployee("All");
    }
  }, [employee, employees]);

  const filteredRows = useMemo(() => {
    return kpiRows.filter((row) => {
      return (
        (year === "All" || String(row.year) === year) &&
        (month === "All" || row.month === month) &&
        (department === "All" || rowDepartment(row) === department) &&
        (employee === "All" || row.employee === employee) &&
        (role === "All" || row.role === role) &&
        (parameter === "All" || row.parameter === parameter)
      );
    });
  }, [department, employee, kpiRows, month, parameter, role, year]);

  const filteredActions = useMemo(() => {
    return correctiveActions.filter((action) => {
      return (
        (year === "All" || String(action.year ?? "") === year) &&
        (month === "All" || action.month === month) &&
        (actionStatus === "All" || action.status === actionStatus) &&
        (department === "All" || action.department === department) &&
        (employee === "All" || action.employee === employee) &&
        (role === "All" || action.role === role) &&
        (parameter === "All" || action.parameter === parameter)
      );
    });
  }, [
    actionStatus,
    correctiveActions,
    department,
    employee,
    month,
    parameter,
    role,
    year,
  ]);

  const performerRows = useMemo<PerformerRow[]>(() => {
    const groups = new Map<
      string,
      {
        templateId?: number;
        templateTitle?: string;
        employee: string;
        employeeDepartment?: string;
        department: string;
        role: string;
        year: number;
        month: string;
        periodDate?: string;
        score: number;
        achievementTotal: number;
        growthTotal: number;
        count: number;
        parameters: Set<string>;
        actionsRaised: number;
        actionsClosed: number;
      }
    >();

    for (const row of filteredRows) {
      const key = row.templateId
        ? `template__${row.templateId}`
        : `${row.employee}__${row.department}__${row.year}__${row.month}`;
      const existing = groups.get(key);
      if (existing) {
        existing.score = row.scorecardScore ?? existing.score;
        existing.achievementTotal += row.achievement;
        existing.growthTotal += row.growth;
        existing.count += 1;
        existing.parameters.add(row.parameter);
        existing.actionsRaised += row.actionsRaised;
        existing.actionsClosed += row.actionsClosed;
      } else {
        groups.set(key, {
          templateId: row.templateId,
          templateTitle: row.templateTitle,
          employee: row.employee,
          employeeDepartment: row.employeeDepartment,
          department: row.department,
          role: row.role,
          year: row.year,
          month: row.month,
          periodDate: row.periodDate,
          score: row.scorecardScore ?? row.score,
          achievementTotal: row.achievement,
          growthTotal: row.growth,
          count: 1,
          parameters: new Set([row.parameter]),
          actionsRaised: row.actionsRaised,
          actionsClosed: row.actionsClosed,
        });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      templateId: group.templateId,
      templateTitle: group.templateTitle,
      employee: group.employee,
      employeeDepartment: group.employeeDepartment,
      department: group.department,
      role: group.role,
      year: group.year,
      month: group.month,
      periodDate: group.periodDate,
      score: Number(group.score.toFixed(2)),
      achievement: Number((group.achievementTotal / group.count).toFixed(2)),
      growth: Number((group.growthTotal / group.count).toFixed(2)),
      parameters: Array.from(group.parameters),
      actionsRaised: group.actionsRaised,
      actionsClosed: group.actionsClosed,
    }));
  }, [filteredRows]);
  const sortedPerformers = useMemo(
    () =>
      [...performerRows].sort(
        (a, b) => b.score - a.score || a.employee.localeCompare(b.employee),
      ),
    [performerRows],
  );
  const lowPerformers = useMemo(
    () => performerRows.filter((row) => row.score < 60),
    [performerRows],
  );
  const departmentStats = useMemo(() => {
    return departments
      .filter((item) => item !== "All")
      .map((name) => {
        const rows = filteredRows.filter((row) => rowDepartment(row) === name);
        const sorted = performerRows
          .filter((row) => rowDepartment(row) === name)
          .sort((a, b) => b.score - a.score);
        return {
          department: name,
          avg: average(rows.map((row) => row.score)),
          employees: sorted.length,
          top: sorted[0]?.employee ?? "-",
          lowest: sorted[sorted.length - 1]?.employee ?? "-",
          openActions: correctiveActions.filter(
            (action) =>
              action.department === name && action.status !== "Completed",
          ).length,
          completedActions: correctiveActions.filter(
            (action) =>
              action.department === name && action.status === "Completed",
          ).length,
        };
      })
      .filter((item) => item.employees > 0);
  }, [correctiveActions, departments, filteredRows, performerRows]);
  const selectedEmployeeRows =
    employee === "All"
      ? filteredRows.slice(0, 1)
      : filteredRows.filter((row) => row.employee === employee);
  const employeeProfile = selectedEmployeeRows[0] ?? filteredRows[0];
  const avgScore = average(performerRows.map((row) => row.score));
  const avgGrowth = average(filteredRows.map((row) => row.growth));
  const excellentCount = filteredRows.filter(
    (row) => row.status === "Excellent",
  ).length;
  const goodCount = filteredRows.filter((row) => row.status === "Good").length;
  const needsCount = filteredRows.filter(
    (row) => row.status === "Needs Improvement",
  ).length;
  const topDepartment = [...departmentStats].sort((a, b) => b.avg - a.avg)[0];

  const exportRows = useMemo<Record<string, string | number>[]>(() => {
    if (activeReport === "Corrective Action") {
      return filteredActions.map((action) => ({
        Employee: action.employee,
        Department: action.department,
        "KPI Parameter": action.parameter,
        "Corrective Action": action.action,
        "Created Date": action.createdDate,
        "Target Date": action.targetDate,
        Status: action.status,
        "Days Overdue": daysOverdue(action.targetDate, action.status),
      }));
    }
    return filteredRows.map((row) => ({
      Employee: row.employee,
      Department: row.department,
      Role: row.role,
      "KPI Parameter": row.parameter,
      Reference: formatDisplayValue(row.reference),
      Commitment: row.commitment,
      Achievement: row.achievement,
      "KPI Score": row.score,
      "Scorecard Total": row.scorecardScore ?? row.score,
      "Performance Status": row.status,
      "Growth %": row.growth,
    }));
  }, [activeReport, filteredActions, filteredRows]);

  const exportReport = (type: "csv" | "excel" | "pdf") => {
    const filename = activeReport.toLowerCase().replace(/\s+/g, "-");
    if (type === "pdf") {
      printPdfReport({
        title: activeReport,
        filename,
        rows: exportRows,
        filters: {
          Year: year,
          Month: month,
          Department: department,
          Employee: employee,
          Role: role,
          "KPI Parameter": parameter,
          Status: actionStatus,
        },
      });
      return;
    }
    if (type === "csv") {
      download(`${filename}.csv`, toCsv(exportRows), "text/csv;charset=utf-8");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const renderKpiPerformanceCards = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <Card label="Average KPI Score" value={pct(avgScore)} />
      <Card
        label="Department-wise KPI Score"
        value={departmentStats.length}
        detail="Departments included"
      />
    </div>
  );

  const renderReport = () => {
    if (activeReport === "Employee KPI" && employeeProfile) {
      const radarData = selectedEmployeeRows
        .slice(0, 5)
        .map((row) => ({
          label: row.parameter.split(" ")[0],
          value: row.score,
        }));
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Card
              label="Employee"
              value={employeeProfile.employee}
              detail={employeeProfile.department}
            />
            <Card label="KPI Score" value={pct(employeeProfile.score)} />
            <Card
              label="Corrective Actions Raised"
              value={employeeProfile.actionsRaised}
            />
            <Card
              label="Corrective Actions Closed"
              value={employeeProfile.actionsClosed}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="KPI Score Trend">
              <LineChart data={monthlyTrend.slice(0, 6)} />
            </Section>
            <Section title="Parameter Comparison">
              <div className="flex justify-center">
                <svg
                  viewBox="0 0 180 180"
                  className="h-64 w-full"
                  role="img"
                  aria-label="Radar chart for KPI parameters"
                >
                  {[0.25, 0.5, 0.75, 1].map((level) => (
                    <circle
                      key={level}
                      cx="90"
                      cy="90"
                      r={64 * level}
                      fill="none"
                      stroke="#e2e8f0"
                    />
                  ))}
                  {radarData.length
                    ? radarData.map((item, index) => {
                        const angle =
                          (Math.PI * 2 * index) / radarData.length -
                          Math.PI / 2;
                        const x = 90 + Math.cos(angle) * (64 + 18);
                        const y = 90 + Math.sin(angle) * (64 + 18);
                        return (
                          <text
                            key={item.label}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            className="fill-slate-600 text-[8px] font-semibold"
                          >
                            {item.label}
                          </text>
                        );
                      })
                    : null}
                  <polygon
                    points={radarData
                      .map((item, index) => {
                        const angle =
                          (Math.PI * 2 * index) /
                            Math.max(radarData.length, 1) -
                          Math.PI / 2;
                        const radius = 64 * (item.value / 100);
                        return `${90 + Math.cos(angle) * radius},${90 + Math.sin(angle) * radius}`;
                      })
                      .join(" ")}
                    fill="#14b8a655"
                    stroke="#0f766e"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </Section>
          </div>
          <Section title="KPI Parameters">
            <DataTable
              headers={[
                "Parameter",
                "Achievement %",
                "KPI Score",
                "Competency Growth %",
                "Status",
              ]}
              rows={selectedEmployeeRows.map((row) => [
                row.parameter,
                pct(row.achievement),
                pct(row.score),
                pct(row.growth),
                <StatusPill key={row.employee} status={row.status} />,
              ])}
            />
          </Section>
        </div>
      );
    }

    if (activeReport === "Department Performance") {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              label="Department KPI Score"
              value={pct(average(departmentStats.map((item) => item.avg)))}
            />
            <Card
              label="Number of Employees"
              value={departmentStats.reduce(
                (sum, item) => sum + item.employees,
                0,
              )}
            />
            <Card
              label="Open Corrective Actions"
              value={departmentStats.reduce(
                (sum, item) => sum + item.openActions,
                0,
              )}
            />
          </div>
          <Section title="Department Ranking Bar Chart">
            <BarChart
              data={departmentStats.map((item) => ({
                label: item.department,
                value: item.avg,
              }))}
              label="Average KPI score by department"
            />
          </Section>
          <Section title="Department Metrics">
            <DataTable
              headers={[
                "Department",
                "KPI Score",
                "Employees",
                "Top Performer",
                "Lowest Performer",
                "Open Actions",
                "Completed Actions",
              ]}
              rows={departmentStats.map((item) => [
                item.department,
                pct(item.avg),
                item.employees,
                item.top,
                item.lowest,
                item.openActions,
                item.completedActions,
              ])}
            />
          </Section>
        </div>
      );
    }

    if (activeReport === "Corrective Action") {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-5">
            <Card label="Total Actions" value={filteredActions.length} />
            <Card
              label="Pending"
              value={
                filteredActions.filter((action) => action.status === "Pending")
                  .length
              }
            />
            <Card
              label="In Progress"
              value={
                filteredActions.filter(
                  (action) => action.status === "In Progress",
                ).length
              }
            />
            <Card
              label="Completed"
              value={
                filteredActions.filter(
                  (action) => action.status === "Completed",
                ).length
              }
            />
            <Card
              label="Overdue"
              value={
                filteredActions.filter(
                  (action) =>
                    action.status === "Overdue" ||
                    daysOverdue(action.targetDate, action.status) > 0,
                ).length
              }
            />
          </div>
          <Section title="Corrective Action Report">
            <DataTable
              headers={[
                "Employee",
                "KPI Parameter",
                "Corrective Action",
                "Created Date",
                "Target Date",
                "Status",
                "Days Overdue",
              ]}
              rows={filteredActions.map((action) => [
                action.employee,
                action.parameter,
                action.action,
                action.createdDate,
                action.targetDate,
                <StatusPill key={action.action} status={action.status} />,
                daysOverdue(action.targetDate, action.status),
              ])}
            />
          </Section>
        </div>
      );
    }

    if (activeReport === "KPI Trend Analysis") {
      const trendRows = monthlyTrend.length
        ? monthlyTrend
        : [{ label: "-", score: 0 }];
      const highest = trendRows.reduce(
        (best, item) => (item.score > best.score ? item : best),
        trendRows[0],
      );
      const lowest = trendRows.reduce(
        (best, item) => (item.score < best.score ? item : best),
        trendRows[0],
      );
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Card
              label="Highest Month"
              value={highest.label}
              detail={pct(highest.score)}
            />
            <Card
              label="Lowest Month"
              value={lowest.label}
              detail={pct(lowest.score)}
            />
            <Card
              label="Growth %"
              value={pct(
                trendRows[trendRows.length - 1].score - trendRows[0].score,
              )}
            />
            <Card
              label="Decline %"
              value={pct(Math.max(0, lowest.score - highest.score))}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Section title="Monthly KPI Trend">
              <LineChart data={trendRows} />
            </Section>
            <Section title="Quarterly KPI Trend">
              <BarChart
                data={quarterlyTrend.map((item) => ({
                  label: item.label,
                  value: item.score,
                }))}
                label="Quarterly score"
              />
            </Section>
            <Section title="Yearly KPI Trend">
              <BarChart
                data={yearlyTrend.map((item) => ({
                  label: item.label,
                  value: item.score,
                }))}
                label="Yearly score"
              />
            </Section>
          </div>
        </div>
      );
    }

    if (activeReport === "Competency Growth") {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Card label="Average Growth %" value={pct(avgGrowth)} />
            <Card
              label="Department Average"
              value={pct(average(departmentStats.map((item) => item.avg)))}
            />
            <Card
              label="Initial Score"
              value={pct(
                average(filteredRows.map((row) => row.initialCompetency)),
              )}
            />
            <Card
              label="Current Score"
              value={pct(
                average(filteredRows.map((row) => row.currentCompetency)),
              )}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Growth Trend">
              <LineChart
                data={monthlyTrend.map((item, index) => ({
                  label: item.label,
                  score: Math.min(95, item.score - 8 + index),
                }))}
              />
            </Section>
            <Section title="Competency Heatmap">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredRows.slice(0, 9).map((row) => (
                  <div
                    key={`${row.employee}-${row.parameter}`}
                    className="rounded-xl border border-slate-200 p-3"
                    style={{
                      backgroundColor: `rgba(16, 185, 129, ${Math.max(0.12, row.currentCompetency / 130)})`,
                    }}
                  >
                    <p className="font-semibold text-slate-900">
                      {row.employee}
                    </p>
                    <p className="text-xs text-slate-600">
                      {pct(row.currentCompetency)} current
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
          <Section title="Competency Growth Report">
            <DataTable
              headers={[
                "Employee",
                "Initial Score",
                "Current Score",
                "Growth %",
                "Department Average",
              ]}
              rows={filteredRows.map((row) => [
                row.employee,
                pct(row.initialCompetency),
                pct(row.currentCompetency),
                pct(row.growth),
                pct(
                  departmentStats.find(
                    (item) => item.department === row.department,
                  )?.avg ?? 0,
                ),
              ])}
            />
          </Section>
        </div>
      );
    }

    if (activeReport === "Management Summary") {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Card
              label="Total Employees"
              value={new Set(filteredRows.map((row) => row.employee)).size}
            />
            <Card label="Average KPI Score" value={pct(avgScore)} />
            <Card label="Top Performers" value={excellentCount} />
            <Card label="Low Performers" value={lowPerformers.length} />
            <Card
              label="Pending Reviews"
              value={
                filteredRows.filter((row) => row.status !== "Excellent").length
              }
            />
            <Card
              label="Open Corrective Actions"
              value={
                correctiveActions.filter(
                  (action) => action.status !== "Completed",
                ).length
              }
            />
            <Card label="Competency Growth %" value={pct(avgGrowth)} />
            <Card
              label="Top Department"
              value={topDepartment?.department ?? "-"}
            />
          </div>
          <Section title="Department Summary Table">
            <DataTable
              headers={[
                "Department",
                "Avg KPI",
                "Top Performer",
                "Pending Actions",
              ]}
              rows={departmentStats.map((item) => [
                item.department,
                pct(item.avg),
                item.top,
                item.openActions,
              ])}
            />
          </Section>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Department-wise KPI Score">
            <BarChart
              data={departmentStats.map((item) => ({
                label: item.department,
                value: item.avg,
              }))}
              label="Average KPI by department"
            />
          </Section>
          <Section title="KPI Distribution Chart">
            <DonutChart
              values={[
                { label: "Excellent", value: excellentCount, color: "#10b981" },
                { label: "Good", value: goodCount, color: "#06b6d4" },
                {
                  label: "Needs Improvement",
                  value: needsCount,
                  color: "#f43f5e",
                },
              ]}
            />
          </Section>
        </div>
        <Section title="KPI Performance Report">
          <DataTable
            headers={[
              "Employee Name",
              "Department",
              "KPI Parameter",
              "Reference",
              "Commitment",
              "Achievement",
              "KPI Score",
              "Scorecard Total",
              "Performance Status",
            ]}
            rows={filteredRows.map((row) => [
              row.employee,
              row.department,
              row.parameter,
              formatDisplayValue(row.reference) || "-",
              pct(row.commitment),
              pct(row.achievement),
              pct(row.score),
              pct(row.scorecardScore ?? row.score),
              <StatusPill
                key={`${row.employee}-${row.parameter}`}
                status={row.status}
              />,
            ])}
          />
        </Section>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-4 px-1 sm:space-y-5 sm:px-0">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">Reports</h1>
              <p className="mt-1 text-sm text-slate-600">
                KPI performance, employee history, department comparisons,
                corrective actions, trends, and CEO summary.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <button
                onClick={() => void loadReports()}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => exportReport("pdf")}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                PDF
              </button>
              <button
                onClick={() => exportReport("excel")}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Excel
              </button>
              <button
                onClick={() => exportReport("csv")}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                CSV
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm [-webkit-overflow-scrolling:touch]">
            {reportTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => selectReport(tab)}
                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  activeReport === tab
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeReport === "KPI Performance" ? (
            <div className="mt-5">{renderKpiPerformanceCards()}</div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
            {[
              ["Year", year, setYear, years],
              ["Month", month, setMonth, months],
              ["Department", department, setDepartment, departments],
              ["Employee", employee, setEmployee, employees],
              ["Role", role, setRole, roles],
              ["KPI Parameter", parameter, setParameter, parameters],
              [
                "Status",
                actionStatus,
                setActionStatus,
                ["All", "Pending", "In Progress", "Completed", "Overdue"],
              ],
            ].map(([label, value, setter, options]) => (
              <label key={label as string} className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label as string}
                </span>
                <select
                  value={value as string}
                  onChange={(event) =>
                    (setter as (next: string) => void)(event.target.value)
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none transition ${
                    value !== "All"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-100 focus:border-emerald-700"
                      : "border-slate-300 bg-white text-slate-800 focus:border-emerald-400"
                  }`}
                >
                  {(options as string[]).map((option) => (
                    <option
                      key={option}
                      value={option}
                      className={
                        option === value && value !== "All"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-800"
                      }
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Loading dynamic reports...
          </div>
        ) : (
          renderReport()
        )}
      </div>
    </Layout>
  );
};

export default KPIReportsPage;
