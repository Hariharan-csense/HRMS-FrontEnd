import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/endpoint";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Search,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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

type LeadIndicatorSignalItem = {
  status: "green" | "yellow" | "red" | "missing";
  employeeId?: number | null;
  parameterName: string;
  indicator: string;
  day: string;
  value: string;
  targetValue: string;
  minimumValue: string;
  type: "number" | "yesno";
};

type LeadIndicatorSignals = {
  green: number;
  yellow: number;
  red: number;
  missing: number;
  total: number;
  needsAttention: number;
  latestStatus: "green" | "yellow" | "red";
  items: LeadIndicatorSignalItem[];
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
  leadIndicatorSignals: LeadIndicatorSignals;
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
  leadIndicatorSignals: {
    green: 0,
    yellow: 0,
    red: 0,
    missing: 0,
    total: 0,
    needsAttention: 0,
    latestStatus: "green",
    items: [],
  },
};

const statusCards = [
  { key: "pending", label: "Pending", color: "#f59e0b", text: "text-amber-700" },
  { key: "inProgress", label: "In Progress", color: "#06b6d4", text: "text-cyan-700" },
  { key: "completed", label: "Completed", color: "#10b981", text: "text-emerald-700" },
] as const;

const MONTH_SCORE_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#f97316",
  "#ca8a04",
  "#059669",
  "#0891b2",
  "#4f46e5",
  "#be123c",
  "#65a30d",
  "#475569",
];

const dashboardFade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const dashboardStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

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
  leadIndicatorSignals: {
    ...emptyWidgets.leadIndicatorSignals,
    ...(payload?.data?.leadIndicatorSignals || payload?.leadIndicatorSignals || {}),
    items:
      payload?.data?.leadIndicatorSignals?.items ||
      payload?.leadIndicatorSignals?.items ||
      [],
  },
});

const KPIDashboard: React.FC = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidgets>(emptyWidgets);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDashboardYear, setSelectedDashboardYear] = useState("");
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState("");
  const [selectedTopPerformerYear, setSelectedTopPerformerYear] = useState("");
  const [selectedTopPerformerMonth, setSelectedTopPerformerMonth] = useState("");
  const [employeeFilterOpen, setEmployeeFilterOpen] = useState(false);
  const [employeeFilterSearch, setEmployeeFilterSearch] = useState("");
  const [leadSignalExpanded, setLeadSignalExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentRole = useMemo(
    () => normalizeRole(user?.role || (Array.isArray(user?.roles) ? user?.roles[0] : "")),
    [user?.role, user?.roles],
  );
  const showDepartmentFilter = ["ADMIN", "CEO", "PDHEAD"].includes(currentRole);
  const showEmployeeFilter = showDepartmentFilter || currentRole === "MANAGER";
  const showTrafficMonthFilter = !showEmployeeFilter;

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
          ...(selectedDashboardYear ? { year: selectedDashboardYear } : {}),
          ...(selectedDashboardMonth ? { month: selectedDashboardMonth } : {}),
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
  }, [
    selectedDashboardMonth,
    selectedDashboardYear,
    selectedDepartmentId,
    selectedEmployeeId,
    showDepartmentFilter,
  ]);

  const canViewPeopleCards = useMemo(() => {
    return ["ADMIN", "CEO", "PDHEAD", "PILLARS", "MANAGER"].includes(currentRole);
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
  const dashboardYearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    for (let offset = -2; offset <= 2; offset += 1) {
      years.add(String(currentYear + offset));
    }
    widgets.kpiPerformanceTrend.forEach((point) => {
      const [year] = String(point.month || "").split("-");
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [widgets.kpiPerformanceTrend]);

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
    () => {
      const selectedYear =
        selectedDashboardYear || String(new Date().getFullYear());
      const pointsByMonth = new Map(
        widgets.kpiPerformanceTrend.map((point) => [String(point.month), point]),
      );

      return MONTH_LABELS.map((label, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
        const point = pointsByMonth.get(month);

        return {
          month,
          monthLabel: `${label.slice(0, 3)} ${selectedYear}`,
          averageScore: Number(point?.averageScore || 0),
          scorecardCount: Number(point?.scorecardCount || 0),
          lowKpiCount: Number(point?.lowKpiCount || 0),
          topPerformerCount: Number(point?.topPerformerCount || 0),
        };
      });
    },
    [selectedDashboardYear, widgets.kpiPerformanceTrend],
  );

  const latestPerformancePoint =
    [...performanceTrend]
      .reverse()
      .find((point) => Number(point.scorecardCount || 0) > 0) ||
    performanceTrend[performanceTrend.length - 1];
  const selectedMonthlyScorePoint = useMemo(() => {
    if (!selectedDashboardMonth) return null;
    const monthKey = String(selectedDashboardMonth).padStart(2, "0");
    return (
      performanceTrend.find((point) => point.month.endsWith(`-${monthKey}`)) ||
      null
    );
  }, [performanceTrend, selectedDashboardMonth]);
  const monthlyScorePieData = useMemo(() => {
    if (selectedMonthlyScorePoint) {
      const score = Math.max(
        0,
        Math.min(100, Number(selectedMonthlyScorePoint.averageScore || 0)),
      );
      return [
        {
          name: selectedMonthlyScorePoint.monthLabel,
          value: score,
          color: score < 40 ? "#e11d48" : score < 70 ? "#f59e0b" : "#10b981",
        },
        {
          name: "Remaining",
          value: Math.max(0, 100 - score),
          color: "#e2e8f0",
        },
      ];
    }

    return performanceTrend
      .filter((point) => Number(point.scorecardCount || 0) > 0)
      .map((point, index) => ({
        name: point.monthLabel,
        value: Math.max(0.01, Number(point.averageScore || 0)),
        score: Number(point.averageScore || 0),
        scorecardCount: Number(point.scorecardCount || 0),
        color: MONTH_SCORE_COLORS[index % MONTH_SCORE_COLORS.length],
      }));
  }, [performanceTrend, selectedMonthlyScorePoint]);
  const overallPieScore = selectedMonthlyScorePoint
    ? Number(selectedMonthlyScorePoint.averageScore || 0)
    : performanceTrend.length
      ? Math.round(
          (performanceTrend
            .filter((point) => Number(point.scorecardCount || 0) > 0)
            .reduce(
            (sum, point) => sum + Number(point.averageScore || 0),
            0,
          ) /
            Math.max(
              1,
              performanceTrend.filter((point) => Number(point.scorecardCount || 0) > 0)
                .length,
            )) *
            100,
        ) / 100
      : 0;

  const leadSignals = widgets.leadIndicatorSignals;
  const selectedEmployee = useMemo(
    () =>
      widgets.availableEmployees.find(
        (employee) => String(employee.id) === selectedEmployeeId,
      ) || null,
    [selectedEmployeeId, widgets.availableEmployees],
  );
  const filteredEmployeeOptions = useMemo(() => {
    const search = employeeFilterSearch.trim().toLowerCase();
    if (!search) return widgets.availableEmployees;
    return widgets.availableEmployees.filter((employee) =>
      `${employee.name} ${employee.departmentName}`.toLowerCase().includes(search),
    );
  }, [employeeFilterSearch, widgets.availableEmployees]);
  const selectedDepartment = useMemo(
    () =>
      widgets.availableDepartments.find(
        (department) => String(department.id) === selectedDepartmentId,
      ) || null,
    [selectedDepartmentId, widgets.availableDepartments],
  );
  const trafficScopeLabel = selectedEmployee
    ? selectedEmployee.name
    : selectedDepartment
      ? selectedDepartment.name
      : showEmployeeFilter
        ? "All employees"
        : "My indicators";
  const trafficMonthLabel = selectedDashboardMonth
    ? `${MONTH_LABELS[Number(selectedDashboardMonth) - 1]} ${
        selectedDashboardYear || new Date().getFullYear()
      }`
    : selectedDashboardYear
      ? selectedDashboardYear
      : "All months";
  const leadAttentionItems = leadSignals.items.filter(
    (item) => item.status !== "green",
  );
  const signalCards = [
    {
      key: "red",
      label: "Red",
      value: leadSignals.red + leadSignals.missing,
      description: "Below minimum or missing",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    },
    {
      key: "yellow",
      label: "Yellow",
      value: leadSignals.yellow,
      description: "Below target",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-400",
    },
    {
      key: "green",
      label: "Green",
      value: leadSignals.green,
      description: "On target",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
  ];
  const getLeadStatusTone = (status: LeadIndicatorSignalItem["status"]) => {
    if (status === "green") {
      return {
        label: "Green",
        icon: CheckCircle2,
        badge: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
        iconWrap: "bg-emerald-100 text-emerald-700",
      };
    }
    if (status === "yellow") {
      return {
        label: "Yellow",
        icon: CircleGauge,
        badge: "bg-amber-100 text-amber-700",
        border: "border-amber-200",
        iconWrap: "bg-amber-100 text-amber-700",
      };
    }
    return {
      label: "Red",
      icon: AlertTriangle,
      badge: "bg-rose-100 text-rose-700",
      border: "border-rose-200",
      iconWrap: "bg-rose-100 text-rose-700",
    };
  };

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

        <motion.div
          variants={dashboardStagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          {cards.map((card) => (
            <motion.div
              key={card.label}
              variants={dashboardFade}
              transition={{ duration: 0.28, ease: "easeOut" }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {loading ? "..." : card.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.section
          variants={dashboardFade}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.32, ease: "easeOut", delay: 0.08 }}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setLeadSignalExpanded((current) => !current)}
            className="flex w-full flex-col gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Lead Indicator Traffic Signal
                </h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      leadSignals.latestStatus === "red"
                        ? "bg-rose-500"
                        : leadSignals.latestStatus === "yellow"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-xs font-semibold uppercase text-slate-600">
                    {loading ? "Loading" : leadSignals.latestStatus}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {trafficScopeLabel} daily checklist against target and minimum values.
                {showTrafficMonthFilter ? ` ${trafficMonthLabel}.` : ""}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                  Red {loading ? "..." : leadSignals.red + leadSignals.missing}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  Yellow {loading ? "..." : leadSignals.yellow}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Green {loading ? "..." : leadSignals.green}
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-500 transition ${
                  leadSignalExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {leadSignalExpanded ? (
            <div className="border-t border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              {showDepartmentFilter || showEmployeeFilter || showTrafficMonthFilter ? (
                <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                  {showDepartmentFilter ? (
                    <label>
                      <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                        Department
                      </span>
                      <select
                        value={selectedDepartmentId}
                        onChange={(event) => {
                          setSelectedDepartmentId(event.target.value);
                          setSelectedEmployeeId("");
                        }}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
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
                    <div
                      className="relative"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setEmployeeFilterOpen(false);
                        }
                      }}
                    >
                      <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                        Employee
                      </span>
                      <button
                        type="button"
                        onClick={() => setEmployeeFilterOpen((current) => !current)}
                        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                      >
                        <span className="truncate">
                          {selectedEmployee
                            ? `${selectedEmployee.name}${
                                selectedEmployee.departmentName
                                  ? ` - ${selectedEmployee.departmentName}`
                                  : ""
                              }`
                            : "All Employees"}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition ${
                            employeeFilterOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {employeeFilterOpen ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                              value={employeeFilterSearch}
                              onChange={(event) =>
                                setEmployeeFilterSearch(event.target.value)
                              }
                              placeholder="Search employee"
                              className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeId("");
                                setEmployeeFilterSearch("");
                                setEmployeeFilterOpen(false);
                              }}
                              className={`block w-full px-3 py-2 text-left text-sm font-medium transition hover:bg-cyan-50 ${
                                selectedEmployeeId
                                  ? "text-slate-700"
                                  : "bg-cyan-50 text-cyan-700"
                              }`}
                            >
                              All Employees
                            </button>
                            {filteredEmployeeOptions.length ? (
                              filteredEmployeeOptions.map((employee) => (
                                <button
                                  type="button"
                                  key={employee.id}
                                  onClick={() => {
                                    setSelectedEmployeeId(String(employee.id));
                                    setEmployeeFilterSearch("");
                                    setEmployeeFilterOpen(false);
                                  }}
                                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-cyan-50 ${
                                    String(employee.id) === selectedEmployeeId
                                      ? "bg-cyan-50 font-semibold text-cyan-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  <span className="block truncate">{employee.name}</span>
                                  {employee.departmentName ? (
                                    <span className="block truncate text-xs text-slate-500">
                                      {employee.departmentName}
                                    </span>
                                  ) : null}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-center text-sm text-slate-500">
                                No employees found.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {showTrafficMonthFilter ? (
                    <>
                      <label>
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                          Month
                        </span>
                        <select
                          value={selectedDashboardMonth}
                          onChange={(event) => {
                            setSelectedDashboardMonth(event.target.value);
                            if (event.target.value && !selectedDashboardYear) {
                              setSelectedDashboardYear(String(new Date().getFullYear()));
                            }
                          }}
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                        >
                          <option value="">All Months</option>
                          {topPerformerMonthOptions.map((month) => (
                            <option key={month.value} value={String(Number(month.value))}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                          Year
                        </span>
                        <select
                          value={selectedDashboardYear}
                          onChange={(event) => setSelectedDashboardYear(event.target.value)}
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                        >
                          <option value="">All Years</option>
                          {dashboardYearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                {signalCards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-lg border px-4 py-4 ${card.className}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${card.dot}`} />
                      <p className="text-sm font-semibold">{card.label}</p>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {loading ? "..." : card.value}
                    </p>
                    <p className="mt-1 text-xs font-medium">{card.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Needs Attention
                    </h3>
                    <p className="text-xs text-slate-500">
                      Missing, red, and yellow lead indicator entries.
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    {loading ? "Loading" : `${leadAttentionItems.length} alerts`}
                  </span>
                </div>

                {leadAttentionItems.length ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {leadAttentionItems.map((item, index) => {
                      const tone = getLeadStatusTone(item.status);
                      const Icon = tone.icon;
                      const employeeName =
                        widgets.availableEmployees.find(
                          (employee) => employee.id === item.employeeId,
                        )?.name || "";

                      return (
                        <motion.div
                          key={`${item.parameterName}-${item.indicator}-${item.day}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.24, delay: index * 0.03 }}
                          whileHover={{ y: -2 }}
                          className={`rounded-lg border bg-white p-4 shadow-sm ${tone.border}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${tone.badge}`}
                                >
                                  {item.status === "missing" ? "Red" : tone.label}
                                </span>
                                <span className="text-xs font-semibold uppercase text-slate-400">
                                  Day {item.day || "Today"}
                                </span>
                              </div>
                              <h4 className="mt-2 text-sm font-semibold text-slate-950">
                                {item.indicator}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.parameterName}
                                {employeeName ? ` - ${employeeName}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Value
                              </p>
                              <p className="mt-1 font-bold text-slate-950">
                                {item.value || "Missing"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Target
                              </p>
                              <p className="mt-1 font-bold text-slate-950">
                                {item.targetValue || "-"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Minimum
                              </p>
                              <p className="mt-1 font-bold text-slate-950">
                                {item.minimumValue || "-"}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-8 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                      {loading
                        ? "Loading lead indicators..."
                        : "All lead indicators are on track."}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {trafficScopeLabel}
                    </p>
                  </div>
                )}

                {leadSignals.green ? (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Healthy Indicators
                        </h3>
                        <p className="text-xs text-slate-500">
                          Entries that met the configured target.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {leadSignals.green} green
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </motion.section>

        <motion.section
          variants={dashboardFade}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.32, ease: "easeOut", delay: 0.14 }}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Overall Monthly KPI Score
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pie view of KPI score by year and month.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:min-w-[42rem]">
              <label>
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  Department
                </span>
                <select
                  value={selectedDepartmentId}
                  onChange={(event) => {
                    setSelectedDepartmentId(event.target.value);
                    setSelectedEmployeeId("");
                  }}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="">All Departments</option>
                  {widgets.availableDepartments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  Year
                </span>
                <select
                  value={selectedDashboardYear}
                  onChange={(event) => setSelectedDashboardYear(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="">Last 12 months</option>
                  {dashboardYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                  Month
                </span>
                <select
                  value={selectedDashboardMonth}
                  onChange={(event) => {
                    setSelectedDashboardMonth(event.target.value);
                    if (event.target.value && !selectedDashboardYear) {
                      setSelectedDashboardYear(String(new Date().getFullYear()));
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400"
                >
                  <option value="">All Months</option>
                  {topPerformerMonthOptions.map((month) => (
                    <option key={month.value} value={String(Number(month.value))}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
              className="relative h-80 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              {monthlyScorePieData.length ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          selectedMonthlyScorePoint
                            ? `${Number(value).toFixed(2)}%`
                            : `${Number(props?.payload?.score ?? value).toFixed(2)}%`,
                          name,
                        ]}
                        contentStyle={{
                          borderRadius: 8,
                          borderColor: "#e2e8f0",
                        }}
                      />
                      <Pie
                        data={monthlyScorePieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={78}
                        outerRadius={118}
                        paddingAngle={2}
                      >
                        {monthlyScorePieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        KPI Score
                      </p>
                      <p className="mt-1 text-3xl font-bold text-slate-950">
                        {loading ? "..." : `${overallPieScore}%`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedMonthlyScorePoint?.monthLabel || trafficScopeLabel}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-center text-sm text-slate-500">
                  {loading ? "Loading KPI score..." : "No KPI score data available."}
                </div>
              )}
            </motion.div>

            <motion.div
              variants={dashboardFade}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.08 }}
              className="rounded-lg border border-slate-100 bg-white p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Score Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedDashboardMonth ? "Selected month score" : "Months with score"}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {trafficScopeLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {monthlyScorePieData.length ? (
                  monthlyScorePieData
                    .filter((item) => item.name !== "Remaining")
                    .map((item) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22 }}
                        whileHover={{ x: 3 }}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-sm font-medium text-slate-700">
                            {item.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-slate-950">
                          {Number("score" in item ? item.score : item.value).toFixed(2)}%
                        </span>
                      </motion.div>
                    ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2">
                    {loading ? "Loading breakdown..." : "No monthly score to show."}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          variants={dashboardFade}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.32, ease: "easeOut", delay: 0.2 }}
          className="grid gap-4 xl:grid-cols-4"
        >
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-7 xl:col-span-4"
          >
            {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
            </div> */}
{/* 
            <div className="mt-6">
              {performanceTrend.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {performanceTrend.map((point, index) => {
                    const score = Number(point.averageScore || 0);
                    const scoreTone =
                      score >= 70
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : score >= 40
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : score > 0
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-50 text-slate-500";

                    return (
                      <motion.div
                        key={point.month}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: index * 0.03 }}
                        whileHover={{ y: -3 }}
                        className={`rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${scoreTone}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              {point.monthLabel}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              KPI month summary
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm">
                            {score}%
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full ${
                              score >= 70
                                ? "bg-emerald-500"
                                : score >= 40
                                  ? "bg-amber-500"
                                  : score > 0
                                    ? "bg-rose-500"
                                    : "bg-slate-300"
                            }`}
                            style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-white/80 px-2 py-2">
                            <p className="text-base font-bold text-slate-950">
                              {point.scorecardCount}
                            </p>
                            <p className="text-[11px] font-semibold uppercase text-slate-500">
                              Cards
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/80 px-2 py-2">
                            <p className="text-base font-bold text-rose-600">
                              {point.lowKpiCount}
                            </p>
                            <p className="text-[11px] font-semibold uppercase text-slate-500">
                              Low
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/80 px-2 py-2">
                            <p className="text-base font-bold text-emerald-600">
                              {point.topPerformerCount}
                            </p>
                            <p className="text-[11px] font-semibold uppercase text-slate-500">
                              Top
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  {loading ? "Loading KPI performance..." : "No KPI performance data available."}
                </div>
              )}
            </div> */}
          </motion.div>

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
        </motion.section>
      </div>
    </Layout>
  );
};

export default KPIDashboard;
