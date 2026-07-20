import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/endpoint";
import { useAuth } from "@/context/AuthContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DepartmentOption = {
  id: number;
  name: string;
};

type EmployeeOption = {
  id: number;
  name: string;
  departmentName: string;
};

type MonthlyTopPerformerGroup = {
  month: string;
  monthLabel: string;
  performers: {
    id: number;
    name: string;
    score: number;
  }[];
};

type KpiPerformanceTrendPoint = {
  month: string;
  monthLabel: string;
  averageScore: number;
  scorecardCount: number;
  lowKpiCount: number;
  topPerformerCount: number;
};

type DepartmentKpiPerformancePoint = {
  departmentId: number | string | null;
  departmentName: string;
  averageScore: number;
  scorecardCount: number;
  lowKpiCount: number;
  topPerformerCount: number;
};

type DashboardWidgets = {
  totalEmployees: number;
  averageKpiScore: number;
  pendingReviews: number;
  topPerformerCount?: number;
  lowKpiAlerts: number;
  competencyGrowthPct: number;
  monthlyTopPerformers: MonthlyTopPerformerGroup[];
  availableDepartments: DepartmentOption[];
  availableEmployees: EmployeeOption[];
  correctiveActionStatus: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  correctiveActionTotal: number;
  kpiPerformanceTrend: KpiPerformanceTrendPoint[];
  departmentKpiPerformance: DepartmentKpiPerformancePoint[];
};

const emptyWidgets: DashboardWidgets = {
  totalEmployees: 0,
  averageKpiScore: 0,
  pendingReviews: 0,
  topPerformerCount: 0,
  lowKpiAlerts: 0,
  competencyGrowthPct: 0,
  monthlyTopPerformers: [],
  availableDepartments: [],
  availableEmployees: [],
  correctiveActionStatus: {
    pending: 0,
    inProgress: 0,
    completed: 0,
  },
  correctiveActionTotal: 0,
  kpiPerformanceTrend: [],
  departmentKpiPerformance: [],
};

const statusCards = [
  { key: "pending", label: "Pending", color: "#f59e0b", text: "text-amber-700" },
  { key: "inProgress", label: "In Progress", color: "#06b6d4", text: "text-cyan-700" },
  { key: "completed", label: "Completed", color: "#10b981", text: "text-emerald-700" },
] as const;

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildPiePath(startPercent: number, endPercent: number) {
  const startAngle = startPercent * 360 - 90;
  const endAngle = endPercent * 360 - 90;
  const radius = 42;
  const center = 50;
  const startX = center + radius * Math.cos((Math.PI * startAngle) / 180);
  const startY = center + radius * Math.sin((Math.PI * startAngle) / 180);
  const endX = center + radius * Math.cos((Math.PI * endAngle) / 180);
  const endY = center + radius * Math.sin((Math.PI * endAngle) / 180);
  const largeArc = endPercent - startPercent > 0.5 ? 1 : 0;
  return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function svgNumber(value: number) {
  return Number(value.toFixed(6));
}

function ScoreGauge({ value, loading }: { value: number; loading: boolean }) {
  const score = clampScore(value);
  const angle = (score / 100) * 180 - 90;
  const scoreColor = score < 40 ? "#dc2626" : "#16a34a";
  const centerX = 210;
  const centerY = 188;
  const needleTip = polarToCartesian(centerX, centerY, 104, angle);
  const tickValues = Array.from({ length: 11 }, (_, index) => index * 10);

  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-2">
        <p className="text-sm text-slate-500">Average KPI Score</p>
      </div>

      <div className="mx-auto w-full max-w-[34rem]">
        <svg
          viewBox="0 0 420 250"
          className="block h-auto w-full"
          role="img"
          aria-label="Average KPI score gauge"
        >
          {tickValues.map((valueLabel) => {
            const tickAngle = (valueLabel / 100) * 180 - 90;
            const outer = polarToCartesian(centerX, centerY, 147, tickAngle);
            const inner = polarToCartesian(centerX, centerY, 135, tickAngle);
            const labelPoint = polarToCartesian(centerX, centerY, 164, tickAngle);
            const isEdgeTick = valueLabel === 0 || valueLabel === 100;
            return (
              <g key={valueLabel}>
                <line
                  x1={svgNumber(inner.x)}
                  y1={svgNumber(inner.y)}
                  x2={svgNumber(outer.x)}
                  y2={svgNumber(outer.y)}
                  stroke="#94a3b8"
                  strokeWidth={
                    isEdgeTick ? "0" : valueLabel % 20 === 0 ? "1.8" : "1.2"
                  }
                  strokeLinecap="round"
                />
                <text
                  x={svgNumber(labelPoint.x)}
                  y={svgNumber(labelPoint.y)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-600"
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {valueLabel}
                </text>
              </g>
            );
          })}

          <line
            x1={centerX}
            y1={centerY}
            x2={svgNumber(needleTip.x)}
            y2={svgNumber(needleTip.y)}
            stroke={scoreColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={centerX} cy={centerY} r="8" fill={scoreColor} />
          <circle cx={centerX} cy={centerY} r="4.2" fill="#ffffff" />

          <text
            x={centerX}
            y="238"
            textAnchor="middle"
            className="text-[14px] font-bold"
            fill={scoreColor}
          >
            {loading ? "..." : `${Math.round(score)}%`}
          </text>
        </svg>
      </div>
    </div>
  );
}

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .replace(/[\s_]/g, "")
    .toUpperCase();
}

const normalizeWidgets = (payload: any): DashboardWidgets => ({
  ...emptyWidgets,
  ...(payload?.data || payload || {}),
  correctiveActionStatus: {
    ...emptyWidgets.correctiveActionStatus,
    ...(payload?.data?.correctiveActionStatus || payload?.correctiveActionStatus || {}),
  },
  monthlyTopPerformers:
    payload?.data?.monthlyTopPerformers || payload?.monthlyTopPerformers || [],
  availableDepartments:
    payload?.data?.availableDepartments || payload?.availableDepartments || [],
  availableEmployees:
    payload?.data?.availableEmployees || payload?.availableEmployees || [],
  kpiPerformanceTrend:
    payload?.data?.kpiPerformanceTrend ||
    payload?.kpiPerformanceTrend ||
    payload?.data?.kpiTrend ||
    payload?.kpiTrend ||
    [],
  departmentKpiPerformance:
    payload?.data?.departmentKpiPerformance ||
    payload?.departmentKpiPerformance ||
    [],
});

const KPIDashboard: React.FC = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidgets>(emptyWidgets);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedTopPerformerYear, setSelectedTopPerformerYear] = useState("");
  const [selectedTopPerformerMonth, setSelectedTopPerformerMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentRole = useMemo(
    () => normalizeRole(user?.role || (Array.isArray(user?.roles) ? user?.roles[0] : "")),
    [user?.role, user?.roles],
  );
  const showDepartmentFilter = ["CEO", "PDHEAD"].includes(currentRole);
  const showEmployeeFilter = showDepartmentFilter || currentRole === "MANAGER";

  useEffect(() => {
    let mounted = true;

    const loadWidgets = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          ...(showDepartmentFilter && selectedDepartmentId
            ? { departmentId: selectedDepartmentId }
            : {}),
          ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
        };
        const widgetsRes = await api.get("/dashboard/widgets", { params });

        if (mounted) {
          setWidgets(normalizeWidgets(widgetsRes.data));
        }
      } catch {
        if (mounted) {
          setWidgets(emptyWidgets);
          setError("Unable to load KPI dashboard counts.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadWidgets();

    return () => {
      mounted = false;
    };
  }, [selectedDepartmentId, selectedEmployeeId, showDepartmentFilter]);

  const canViewPeopleCards = useMemo(() => {
    return ["CEO", "PDHEAD", "PILLARS", "MANAGER"].includes(currentRole);
  }, [currentRole]);

  const cards = useMemo(() => {
    const coreCards = [
      { label: "Average KPI Score", value: widgets.averageKpiScore },
      { label: "Pending Reviews", value: widgets.pendingReviews },
      { label: "Low KPI Alerts", value: widgets.lowKpiAlerts },
    ];
    if (!canViewPeopleCards) return coreCards;
    return [
      { label: "Total Employees", value: widgets.totalEmployees },
      ...coreCards,
      { label: "Competency Growth %", value: widgets.competencyGrowthPct },
    ];
  }, [canViewPeopleCards, widgets]);

  const topPerformerYearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    for (let offset = -2; offset <= 2; offset += 1) {
      years.add(String(currentYear + offset));
    }
    widgets.monthlyTopPerformers.forEach((group) => {
      const [year] = group.month.split("-");
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [widgets.monthlyTopPerformers]);

  const topPerformerMonthOptions = useMemo(() => {
    return MONTH_LABELS.map((label, index) => ({
      value: String(index + 1).padStart(2, "0"),
      label,
    }));
  }, []);

  const effectiveTopPerformerYear = useMemo(() => {
    if (
      selectedTopPerformerYear &&
      topPerformerYearOptions.includes(selectedTopPerformerYear)
    ) {
      return selectedTopPerformerYear;
    }
    return topPerformerYearOptions[0] ?? String(new Date().getFullYear());
  }, [selectedTopPerformerYear, topPerformerYearOptions]);

  const effectiveTopPerformerMonth = useMemo(() => {
    if (
      selectedTopPerformerMonth &&
      topPerformerMonthOptions.some(
        (option) => option.value === selectedTopPerformerMonth,
      )
    ) {
      return selectedTopPerformerMonth;
    }
    return String(new Date().getMonth() + 1).padStart(2, "0");
  }, [selectedTopPerformerMonth, topPerformerMonthOptions]);

  const selectedMonthlyTopPerformers = useMemo(
    () =>
      widgets.monthlyTopPerformers.find(
        (group) =>
          group.month ===
          `${effectiveTopPerformerYear}-${effectiveTopPerformerMonth}`,
      ) ?? null,
    [
      effectiveTopPerformerMonth,
      effectiveTopPerformerYear,
      widgets.monthlyTopPerformers,
    ],
  );

  const allMonthlyTopPerformers = useMemo(
    () =>
      widgets.monthlyTopPerformers
        .filter((group) => group.month.startsWith(`${effectiveTopPerformerYear}-`))
        .sort((a, b) => b.month.localeCompare(a.month)),
    [effectiveTopPerformerYear, widgets.monthlyTopPerformers],
  );

  const selectedPeriodLabel = useMemo(() => {
    const monthLabel =
      MONTH_LABELS[Number(effectiveTopPerformerMonth) - 1] ?? "Selected month";
    return effectiveTopPerformerYear
      ? `${monthLabel} ${effectiveTopPerformerYear}`
      : monthLabel;
  }, [effectiveTopPerformerMonth, effectiveTopPerformerYear]);

  const correctiveSegments = useMemo(() => {
    const total = widgets.correctiveActionTotal;
    return statusCards.map((item) => {
      const count = widgets.correctiveActionStatus[item.key];
      const previousCount = statusCards
        .slice(0, statusCards.findIndex((segment) => segment.key === item.key))
        .reduce(
          (sum, segment) => sum + widgets.correctiveActionStatus[segment.key],
          0,
        );
      const start = total ? previousCount / total : 0;
      const end = total ? (previousCount + count) / total : 0;
      return {
        ...item,
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
        path: count ? buildPiePath(start, end) : "",
      };
    });
  }, [widgets.correctiveActionStatus, widgets.correctiveActionTotal]);

  const performanceTrend = useMemo(
    () =>
      widgets.kpiPerformanceTrend.map((point) => ({
        ...point,
        averageScore: Number(point.averageScore || 0),
        scorecardCount: Number(point.scorecardCount || 0),
        lowKpiCount: Number(point.lowKpiCount || 0),
        topPerformerCount: Number(point.topPerformerCount || 0),
      })),
    [widgets.kpiPerformanceTrend],
  );

  const latestPerformancePoint = performanceTrend[performanceTrend.length - 1];

  const departmentPerformance = useMemo(
    () =>
      widgets.departmentKpiPerformance.map((point) => ({
        ...point,
        departmentName: point.departmentName || "Unassigned",
        averageScore: Number(point.averageScore || 0),
        scorecardCount: Number(point.scorecardCount || 0),
        lowKpiCount: Number(point.lowKpiCount || 0),
        topPerformerCount: Number(point.topPerformerCount || 0),
      })),
    [widgets.departmentKpiPerformance],
  );

  const departmentPerformanceChart = departmentPerformance.slice(0, 8);

  return (
    <Layout>
      <div className="space-y-4 px-1 sm:px-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            KPI Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            KPI scores, review status, corrective actions, and performer trends.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {loading ? "..." : card.value}
              </p>
            </div>
          ))}
        </div>

        {showDepartmentFilter || currentRole === "MANAGER" ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
            {showDepartmentFilter ? (
              <label className="w-full sm:min-w-60 sm:flex-1 lg:flex-none">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department Filter
                </span>
                <select
                  value={selectedDepartmentId}
                  onChange={(event) => {
                    setSelectedDepartmentId(event.target.value);
                    setSelectedEmployeeId("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="">All Departments</option>
                  {widgets.availableDepartments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {showEmployeeFilter ? (
              <label className="w-full sm:min-w-72 sm:flex-1 lg:flex-none">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee Filter
                </span>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="">All Employees</option>
                  {widgets.availableEmployees.map((employee) => (
                    <option key={employee.id} value={String(employee.id)}>
                      {employee.name}
                      {employee.departmentName ? ` - ${employee.departmentName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  KPI Performance Trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly average KPI score with scorecard volume.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-72">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Latest Avg
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {loading ? "..." : `${latestPerformancePoint?.averageScore ?? 0}%`}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Scorecards
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {loading ? "..." : latestPerformancePoint?.scorecardCount ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="h-72 min-w-0">
                {performanceTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceTrend}
                      margin={{ top: 8, right: 16, bottom: 0, left: -10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "averageScore" ? `${value}%` : value,
                          name === "averageScore" ? "Average Score" : name,
                        ]}
                        labelClassName="font-semibold text-slate-900"
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#e2e8f0",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#0f766e"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#0f766e", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                    {loading ? "Loading KPI performance..." : "No KPI performance data available."}
                  </div>
                )}
              </div>

              <div className="h-72 min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3">
                {performanceTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceTrend}
                      margin={{ top: 8, right: 6, bottom: 0, left: -18 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value,
                          name === "scorecardCount"
                            ? "Scorecards"
                            : name === "lowKpiCount"
                              ? "Low KPI"
                              : "Top Performers",
                        ]}
                        labelClassName="font-semibold text-slate-900"
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="scorecardCount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lowKpiCount" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    {loading ? "Loading volume..." : "No scorecard volume to show."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Department-wise KPI Performance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Average KPI score grouped by department.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700">
                Score %
              </span>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]">
              <div className="h-80 min-w-0">
                {departmentPerformanceChart.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentPerformanceChart}
                      layout="vertical"
                      margin={{ top: 8, right: 24, bottom: 0, left: 12 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="departmentName"
                        width={128}
                        tick={{ fill: "#475569", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "averageScore" ? `${value}%` : value,
                          name === "averageScore" ? "Average Score" : name,
                        ]}
                        labelClassName="font-semibold text-slate-900"
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#e2e8f0",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Bar dataKey="averageScore" fill="#0f766e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                    {loading
                      ? "Loading department performance..."
                      : "No department KPI performance data available."}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5rem_4rem] border-b border-slate-100 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  <span>Department</span>
                  <span className="text-right">Avg</span>
                  <span className="text-right">Cards</span>
                  <span className="text-right">Low</span>
                </div>
                {departmentPerformance.length ? (
                  departmentPerformance.map((department) => (
                    <div
                      key={`${department.departmentId ?? "none"}-${department.departmentName}`}
                      className="grid grid-cols-[minmax(0,1fr)_4.5rem_5rem_4rem] items-center border-b border-slate-100 px-3 py-3 last:border-b-0"
                    >
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {department.departmentName}
                      </p>
                      <p className="text-right text-sm font-bold text-slate-900">
                        {department.averageScore.toFixed(2)}%
                      </p>
                      <p className="text-right text-sm text-slate-600">
                        {department.scorecardCount}
                      </p>
                      <p className="text-right text-sm font-semibold text-rose-600">
                        {department.lowKpiCount}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    {loading
                      ? "Loading departments..."
                      : "No department scores to show."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Corrective Actions Status Overview
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700">
                Pie Chart
              </span>
            </div>
            <div className="mt-6 flex items-center justify-center sm:mt-8">
              <svg
                viewBox="0 0 100 100"
                className="h-44 w-44 sm:h-60 sm:w-60"
                role="img"
                aria-label="Corrective action status pie chart"
              >
                {widgets.correctiveActionTotal ? (
                  correctiveSegments.map((segment) =>
                    segment.path ? (
                      <path key={segment.key} d={segment.path} fill={segment.color} />
                    ) : null,
                  )
                ) : (
                  <circle cx="50" cy="50" r="42" fill="#e2e8f0" />
                )}
                <circle cx="50" cy="50" r="24" fill="white" />
                <text
                  x="50"
                  y="48"
                  textAnchor="middle"
                  className="fill-slate-900 text-[12px] font-bold"
                >
                  {loading ? "" : widgets.correctiveActionTotal}
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  className="fill-slate-500 text-[5px] font-semibold uppercase"
                >
                  Total
                </text>
              </svg>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {correctiveSegments.map((segment) => (
                <div
                  key={segment.key}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <p className="text-sm font-semibold text-slate-700">
                      {segment.label}
                    </p>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-bold text-slate-950">
                      {loading ? "..." : segment.count}
                    </p>
                    <p className={`text-sm font-semibold ${segment.text}`}>
                      {loading ? "" : `${segment.percent}%`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-2">
            <ScoreGauge value={widgets.averageKpiScore} loading={loading} />
          </div>

          {/* <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Top Performers
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  All months overview with selected-month top 5 performers.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-72">
                <label>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Year
                  </span>
                  <select
                    value={effectiveTopPerformerYear}
                    onChange={(event) =>
                      setSelectedTopPerformerYear(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                  >
                    {topPerformerYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Month
                  </span>
                  <select
                    value={effectiveTopPerformerMonth}
                    onChange={(event) =>
                      setSelectedTopPerformerMonth(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                  >
                    {topPerformerMonthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    All Months Overview
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Stacked by month
                  </p>
                </div>
                <div className="space-y-3">
                  {allMonthlyTopPerformers.length ? (
                    allMonthlyTopPerformers.map((group) => (
                      <div
                        key={group.month}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {group.monthLabel}
                            </p>
                            <p className="text-xs text-slate-500">
                              {group.performers.length} top performers
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.performers.slice(0, 5).map((performer, index) => (
                              <span
                                key={`${group.month}-${performer.id}`}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-[10px] font-semibold text-white">
                                  {index + 1}
                                </span>
                                <span className="max-w-[11rem] truncate">
                                  {performer.name}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                      {loading
                        ? "Loading performers..."
                        : `No top performer data available for ${
                            selectedTopPerformerYear || "this year"
                          }.`}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] border-b border-slate-100 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[3rem_1fr_5rem] sm:px-4">
                  <span>#</span>
                  <span>Name</span>
                  <span className="text-right">Score</span>
                </div>
                {selectedMonthlyTopPerformers?.performers?.length ? (
                  selectedMonthlyTopPerformers.performers.map((performer, index) => (
                    <div
                      key={`${selectedMonthlyTopPerformers.month}-${performer.id}`}
                      className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center border-b border-slate-100 px-3 py-3 last:border-b-0 sm:grid-cols-[3rem_1fr_5rem] sm:px-4 sm:py-4"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {performer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedMonthlyTopPerformers.monthLabel}
                        </p>
                      </div>
                      <p className="text-right text-sm font-bold text-slate-900">
                        {performer.score.toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    {loading
                      ? "Loading performers..."
                      : `No top performer data for ${selectedPeriodLabel}.`}
                  </div>
                )}
              </div>
            </div>
          </div> */}
        </section>
      </div>
    </Layout>
  );
};

export default KPIDashboard;
