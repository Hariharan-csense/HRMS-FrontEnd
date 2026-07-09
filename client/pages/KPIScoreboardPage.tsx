import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { api, resolveFileUrl } from "@/lib/endpoint";
import { employeeApi } from "@/components/helper/employee/employee";
import { Check, ChevronDown, Edit3, Eye, FilePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type ScorecardUser = {
  id: string;
  name: string;
  label: string;
  role: string;
  department: string;
  designation: string;
};

type KpiRow = {
  id: string;
  parameter: string;
  uom: string;
  reference: string;
  commitment: string;
  weightage: string;
  achievement: string;
  dailyAchievements?: Record<string, string>;
  definition: string;
  measurement: string;
  dataSource: string;
  leadIndicators: string;
  attachmentPath?: string;
  attachmentName?: string;
  attachmentUploadedByName?: string;
  attachmentUploadedAt?: string;
};

type Scorecard = {
  id: string;
  userId: string;
  userName: string;
  year: number;
  month: number;
  frequency: string;
  rows: KpiRow[];
  totalScore: number;
};

type OptionalColumns = {
  definition: boolean;
  measurement: boolean;
  dataSource: boolean;
  leadIndicators: boolean;
};

type DailyAchievementDraft = Record<string, Record<string, string>>;

type EditingParameterState = {
  scorecardId: string;
  draft: KpiRow;
};

const MIN_ROWS = 1;
const MAX_ROWS = 7;
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

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyRow = (): KpiRow => ({
  id: createId(),
  parameter: "",
  uom: "",
  reference: "",
  commitment: "",
  weightage: "",
  achievement: "",
  dailyAchievements: {},
  definition: "",
  measurement: "",
  dataSource: "",
  leadIndicators: "",
});

const parseNumber = (value: string | number | null | undefined) => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const hasDailyAchievementData = (row: Pick<KpiRow, "dailyAchievements">) => {
  const daily = row.dailyAchievements || {};
  return Object.values(daily).some((entry) => {
    if (entry && typeof entry === "object") {
      return Object.values(entry as Record<string, string>).some(
        (value) => String(value ?? "").trim() !== "",
      );
    }
    return String(entry ?? "").trim() !== "";
  });
};

const hasAchievementInput = (row: KpiRow) => {
  const raw = String(row.achievement ?? "").trim();
  if (!raw) return false;
  if (hasDailyAchievementData(row)) return true;
  return Number(raw) !== 0;
};

const calculateKpiScore = (row: KpiRow) => {
  if (!hasAchievementInput(row)) return 0;

  const reference = parseNumber(row.reference);
  const commitment = parseNumber(row.commitment);
  const weightage = parseNumber(row.weightage);
  const achievement = parseNumber(row.achievement);

  if (
    reference === undefined ||
    commitment === undefined ||
    weightage === undefined ||
    achievement === undefined
  ) {
    return 0;
  }

  const denominator = commitment - reference;
  if (denominator === 0) return 0;

  const rawScore = (weightage / denominator) * (achievement - reference);
  return Number(Math.max(0, Math.min(weightage * 2, rawScore)).toFixed(2));
};

const formatNumber = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const formatDisplayValue = (value: string | number | null | undefined) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(Math.trunc(parsed)) : String(parsed);
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const parseCsvRows = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map(parseCsvLine)
    .slice(0, MAX_ROWS);

const formatAttachmentUploadedAt = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const isImageAttachment = (name: string, path: string) =>
  /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(name) ||
  /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(path);

const isPdfAttachment = (name: string, path: string) =>
  /\.pdf$/i.test(name) || /\.pdf$/i.test(path);

const leadIndicatorLines = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return [];

  // Support comma/newline/semicolon and already-numbered text like "1.1 foo 1.2 bar".
  const normalized = raw
    .replace(/(\d+\.\d+)\s+/g, "\n$1 ")
    .replace(/[;|]+/g, ",");

  return normalized
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^\d+\.\d+\s*/, "").trim())
    .filter(Boolean);
};

const formatLeadIndicators = (value: string | null | undefined, rowNumber: number) => {
  const lines = leadIndicatorLines(value);
  if (!lines.length) return "-";
  return lines.map((line, index) => `${rowNumber}.${index + 1} ${line}`).join("\n");
};

const getPeriodDate = (scorecard: Pick<Scorecard, "year" | "month">) =>
  new Date(scorecard.year, scorecard.month - 1, 1);

const getPeriodDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, index) => ({
    key: String(index + 1),
    label: String(index + 1).padStart(2, "0"),
  }));
};

const parseAchievementValue = (value: string) => {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapEmployeeToUser = (emp: Record<string, unknown>): ScorecardUser => {
  const name =
    String(emp.name || "").trim() ||
    `${String(emp.first_name || emp.firstName || "").trim()} ${String(emp.last_name || emp.lastName || "").trim()}`.trim() ||
    "Employee";
  const designation =
    String(
      emp.designation ||
        emp.designation_name ||
        emp.designationName ||
        "",
    ).trim() || "Not assigned";
  const department =
    String(
      emp.department ||
        emp.department_name ||
        emp.departmentName ||
        "",
    ).trim() || "Not assigned";
  const role =
    String(emp.role || emp.role_name || "").trim() || "Not assigned";
  const label =
    designation && designation !== "Not assigned"
      ? `${name} (${designation})`
      : name;

  return {
    id: String(emp.id || emp.employee_id || emp.employeeId || createId()),
    name,
    label,
    role,
    department,
    designation,
  };
};

const KPIScoreboardPage: React.FC = () => {
  const { user } = useAuth();
  const { canPerformModuleAction } = useRole();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentTargetRef = useRef<string | null>(null);
  const achievementInputRef = useRef<HTMLInputElement | null>(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentUser = user as
    | (typeof user & {
        fullName?: string;
        department?: string;
        designation?: string;
      })
    | null;
  const currentUserName =
    currentUser?.name || currentUser?.fullName || currentUser?.email || "Current User";

  const fallbackUser = useMemo<ScorecardUser>(
    () => ({
      id: String(user?.employee_id || user?.employeeId || user?.id || ""),
      name: currentUserName,
      label: currentUserName,
      role: user?.role || "Not assigned",
      department: currentUser?.department || "Not assigned",
      designation: currentUser?.designation || "Not assigned",
    }),
    [
      currentUserName,
      currentUser?.department,
      currentUser?.designation,
      user?.employeeId,
      user?.employee_id,
      user?.id,
      user?.role,
    ],
  );

  const [users, setUsers] = useState<ScorecardUser[]>([fallbackUser]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(fallbackUser.id);
  const [formUserId, setFormUserId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [totalWeight, setTotalWeight] = useState("100");
  const [rows, setRows] = useState<KpiRow[]>(() => [emptyRow()]);
  const [listOptionalColumns, setListOptionalColumns] = useState<OptionalColumns>({
    definition: false,
    measurement: false,
    dataSource: false,
    leadIndicators: false,
  });
  const [optionalColumns, setOptionalColumns] = useState<OptionalColumns>({
    definition: false,
    measurement: false,
    dataSource: false,
    leadIndicators: false,
  });
  const [editingParameter, setEditingParameter] =
    useState<EditingParameterState | null>(null);
  const [savingParameterId, setSavingParameterId] = useState<string | null>(null);
  const [directAchievementEntryIds, setDirectAchievementEntryIds] = useState<
    Set<string>
  >(() => new Set());
  const [pendingAchievementFocusRowId, setPendingAchievementFocusRowId] =
    useState<string | null>(null);
  const [dailyAchievementModal, setDailyAchievementModal] = useState<{
    rowId: string;
    rowNumber: number;
    parameterName: string;
    uom: string;
    periodDate: Date;
    mode: "create" | "edit";
  } | null>(null);
  const [dailyAchievementDraft, setDailyAchievementDraft] = useState<DailyAchievementDraft>({});
  const [showDailyLeadIndicators, setShowDailyLeadIndicators] = useState(false);
  const [visibleDailyLeadIndicatorCount, setVisibleDailyLeadIndicatorCount] =
    useState(0);
  const [loadingScorecards, setLoadingScorecards] = useState(false);
  const [savingScorecard, setSavingScorecard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAttachmentId, setUploadingAttachmentId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{
    parameterId: string;
    parameterName: string;
    attachmentPath: string;
    attachmentName: string;
    attachmentUploadedByName?: string;
    attachmentUploadedAt?: string;
  } | null>(null);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const canCreateScorecard = canPerformModuleAction(
    "kpi",
    "create",
    "scorecard",
  );
  const canUpdateScorecard = canPerformModuleAction(
    "kpi",
    "update",
    "scorecard",
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await employeeApi.getEmployees();
        if (cancelled) return;

        const mapped = (result.data || []).map((emp) =>
          mapEmployeeToUser(emp as Record<string, unknown>),
        );
        if (!mapped.length) return;

        setUsers(mapped);

        const currentId = String(
          user?.id || user?.employee_id || user?.employeeId || "",
        );
        const match = mapped.find(
          (item) =>
            item.id === currentId ||
            item.name.toLowerCase() === currentUserName.toLowerCase(),
        );
        setSelectedUserId(match?.id || mapped[0].id);
      } catch {
        // Keep fallback user when API is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserName, user?.employeeId, user?.employee_id, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadScorecards = async () => {
      setLoadingScorecards(true);
      setError(null);
      try {
        const res = await api.get("/kpi/scorecards", {
          params: {
            userId: selectedUserId || undefined,
            year: selectedYear || undefined,
            month: selectedMonth || undefined,
          },
        });
        const payload = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        if (!cancelled) setScorecards(payload as Scorecard[]);
      } catch {
        if (!cancelled) {
          setScorecards([]);
          setError("Unable to load KPI scorecards.");
        }
      } finally {
        if (!cancelled) setLoadingScorecards(false);
      }
    };

    if (selectedUserId) {
      void loadScorecards();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedUserId, selectedYear]);

  useEffect(() => {
    if (!pendingAchievementFocusRowId || dailyAchievementModal) return;
    const frameId = requestAnimationFrame(() => {
      achievementInputRef.current?.focus();
      setPendingAchievementFocusRowId(null);
    });
    return () => cancelAnimationFrame(frameId);
  }, [pendingAchievementFocusRowId, dailyAchievementModal]);

  const selectedUser =
    users.find((item) => item.id === selectedUserId) || users[0];
  const formUser = users.find((item) => item.id === formUserId);
  const selectedOptionalCount =
    Object.values(optionalColumns).filter(Boolean).length;
  const selectedListOptionalCount =
    Object.values(listOptionalColumns).filter(Boolean).length;
  const totalScore = rows.reduce(
    (sum, row) => sum + calculateKpiScore(row),
    0,
  );
  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear]);
    scorecards.forEach((scorecard) => years.add(scorecard.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, scorecards]);

  const filteredScorecards = scorecards;

  const updateRows = (nextRows: KpiRow[]) => {
    setRows(nextRows.slice(0, MAX_ROWS));
  };

  const updateRow = (rowId: string, field: keyof KpiRow, value: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const updateEditingParameter = (field: keyof KpiRow, value: string) => {
    setEditingParameter((current) =>
      current
        ? { ...current, draft: { ...current.draft, [field]: value } }
        : current,
    );
  };

  const cancelDailyAchievement = () => {
    const rowId = dailyAchievementModal?.rowId;
    setDailyAchievementModal(null);
    setDailyAchievementDraft({});
    setShowDailyLeadIndicators(false);
    setVisibleDailyLeadIndicatorCount(0);
    if (rowId) {
      setDirectAchievementEntryIds((current) => {
        const next = new Set(current);
        next.add(rowId);
        return next;
      });
      setPendingAchievementFocusRowId(rowId);
    }
  };

  const handleAchievementFocus = (
    row: KpiRow,
    rowNumber: number,
    periodDate: Date,
    mode: "create" | "edit",
  ) => {
    if (directAchievementEntryIds.has(row.id)) return;
    if (dailyAchievementModal?.rowId === row.id) return;
    openDailyAchievementModal(row, rowNumber, periodDate, mode);
  };

  const openDailyAchievementModal = (
    row: KpiRow,
    rowNumber: number,
    periodDate: Date,
    mode: "create" | "edit",
  ) => {
    const currentDailyAchievement = row.dailyAchievements as
      | Record<string, unknown>
      | undefined;
    const normalizedDraft: DailyAchievementDraft =
      currentDailyAchievement &&
      Object.keys(currentDailyAchievement).some(
        (key) =>
          typeof currentDailyAchievement[key] === "object" &&
          currentDailyAchievement[key] !== null,
      )
        ? (currentDailyAchievement as DailyAchievementDraft)
        : ({
            main: (currentDailyAchievement || {}) as Record<string, string>,
          } as DailyAchievementDraft);

    setDailyAchievementModal({
      rowId: row.id,
      rowNumber,
      parameterName: row.parameter || "KPI Parameter",
      uom: row.uom,
      periodDate,
      mode,
    });
    setDailyAchievementDraft(normalizedDraft);
    setShowDailyLeadIndicators(false);
    setVisibleDailyLeadIndicatorCount(0);
  };

  const activeDailyRow = useMemo(() => {
    if (!dailyAchievementModal) return null;
    if (dailyAchievementModal.mode === "edit") {
      if (
        editingParameter &&
        editingParameter.draft.id === dailyAchievementModal.rowId
      ) {
        return editingParameter.draft;
      }
      return (
        scorecards
          .flatMap((scorecard) => scorecard.rows)
          .find((row) => row.id === dailyAchievementModal.rowId) || null
      );
    }
    return rows.find((row) => row.id === dailyAchievementModal.rowId) || null;
  }, [dailyAchievementModal, editingParameter, rows, scorecards]);

  const dailyLeadIndicatorLines = useMemo(
    () => leadIndicatorLines(activeDailyRow?.leadIndicators),
    [activeDailyRow],
  );

  const dailyDraftRows = useMemo(() => {
    if (!dailyAchievementModal || !activeDailyRow) return [];
    const base = [
      {
        key: "main",
        serial: String(dailyAchievementModal.rowNumber),
        label: activeDailyRow.parameter || dailyAchievementModal.parameterName,
        uom: activeDailyRow.uom || dailyAchievementModal.uom,
      },
    ];
    if (!showDailyLeadIndicators) return base;
    return [
      ...base,
      ...dailyLeadIndicatorLines.slice(0, visibleDailyLeadIndicatorCount).map((line, index) => ({
        key: `li-${index}`,
        serial: `${dailyAchievementModal.rowNumber}.${index + 1}`,
        label: line,
        uom: activeDailyRow.uom || dailyAchievementModal.uom,
      })),
    ];
  }, [
    activeDailyRow,
    dailyAchievementModal,
    dailyLeadIndicatorLines,
    showDailyLeadIndicators,
    visibleDailyLeadIndicatorCount,
  ]);

  const dailyAchievementTotal = useMemo(
    () =>
      Object.values(dailyAchievementDraft).reduce((sum, rowDraft) => {
        return (
          sum +
          Object.values(rowDraft || {}).reduce(
            (innerSum, value) => innerSum + parseAchievementValue(value || ""),
            0,
          )
        );
      }, 0),
    [dailyAchievementDraft],
  );

  const applyDailyAchievement = () => {
    if (!dailyAchievementModal) return;

    const hasDailyEntries = Object.values(dailyAchievementDraft).some((rowDraft) =>
      Object.values(rowDraft || {}).some(
        (value) => String(value ?? "").trim() !== "",
      ),
    );
    const total = hasDailyEntries ? formatNumber(dailyAchievementTotal) : "";
    const update = (row: KpiRow) =>
      row.id === dailyAchievementModal.rowId
        ? {
            ...row,
            achievement: total,
            dailyAchievements: hasDailyEntries
              ? { ...dailyAchievementDraft }
              : {},
          }
        : row;

    if (dailyAchievementModal.mode === "edit" && editingParameter) {
      setEditingParameter({
        ...editingParameter,
        draft: update(editingParameter.draft),
      });
    } else if (dailyAchievementModal.mode === "edit") {
      setScorecards((current) =>
        current.map((scorecard) => ({
          ...scorecard,
          rows: scorecard.rows.map(update),
        })),
      );
    } else {
      setRows((current) => current.map(update));
    }
    setDailyAchievementModal(null);
    setDailyAchievementDraft({});
    if (dailyAchievementModal?.rowId) {
      setDirectAchievementEntryIds((current) => {
        const next = new Set(current);
        next.delete(dailyAchievementModal.rowId);
        return next;
      });
    }
  };

  const startEditParameter = (
    scorecard: Scorecard,
    row: KpiRow,
    rowIndex: number,
  ) => {
    setError(null);
    const draft: KpiRow = {
      ...row,
      reference: formatDisplayValue(row.reference),
      commitment: formatDisplayValue(row.commitment),
      weightage: formatDisplayValue(row.weightage),
      achievement: hasAchievementInput(row)
        ? formatDisplayValue(row.achievement)
        : "",
    };
    setEditingParameter({
      scorecardId: scorecard.id,
      draft,
    });
    setDirectAchievementEntryIds((current) => {
      const next = new Set(current);
      next.delete(row.id);
      return next;
    });
    setListOptionalColumns({
      definition: scorecard.rows.some((item) => item.definition.trim()),
      measurement: scorecard.rows.some((item) => item.measurement.trim()),
      dataSource: scorecard.rows.some((item) => item.dataSource.trim()),
      leadIndicators: scorecard.rows.some((item) => item.leadIndicators.trim()),
    });
    openDailyAchievementModal(
      draft,
      rowIndex + 1,
      getPeriodDate(scorecard),
      "edit",
    );
  };

  const cancelEditParameter = () => {
    setEditingParameter(null);
  };

  const saveEditParameter = async (scorecard: Scorecard) => {
    if (!editingParameter || editingParameter.scorecardId !== scorecard.id) {
      return;
    }

    setSavingParameterId(editingParameter.draft.id);
    setError(null);
    try {
      const updatedRows = scorecard.rows.map((row) =>
        row.id === editingParameter.draft.id ? editingParameter.draft : row,
      );
      const res = await api.patch(`/kpi/scorecards/${scorecard.id}`, {
        userId: Number(scorecard.userId),
        frequency: scorecard.frequency,
        totalWeight,
        rows: updatedRows.map((row) => ({
          id: row.id,
          parameter: row.parameter,
          uom: row.uom,
          reference: row.reference,
          commitment: row.commitment,
          weightage: row.weightage,
          achievement: row.achievement,
          dailyAchievements: row.dailyAchievements || {},
          definition: row.definition,
          measurement: row.measurement,
          dataSource: row.dataSource,
          leadIndicators: row.leadIndicators,
        })),
      });
      const updated =
        res.data && typeof res.data === "object" ? (res.data as Scorecard) : null;
      if (updated) {
        setScorecards((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
      cancelEditParameter();
      toast.success("KPI parameter updated successfully.");
    } catch (editError: any) {
      const message =
        editError?.response?.data?.message || "Unable to update KPI scorecard.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingParameterId(null);
    }
  };

  const resetForm = () => {
    setFormUserId("");
    setFrequency("MONTHLY");
    setTotalWeight("100");
    setRows([emptyRow()]);
    setOptionalColumns({
      definition: false,
      measurement: false,
      dataSource: false,
      leadIndicators: false,
    });
    setShowImportModal(false);
  };

  const openCreateModal = () => {
    if (!canCreateScorecard) return;
    resetForm();
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addRow = () => {
    setRows((current) =>
      current.length >= MAX_ROWS ? current : [...current, emptyRow()],
    );
  };

  const removeRow = (rowId: string) => {
    setRows((current) =>
      current.length <= MIN_ROWS
        ? current
        : current.filter((row) => row.id !== rowId),
    );
  };

  const handleCreateScorecard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formUser) return;
    setSavingScorecard(true);
    setError(null);
    try {
      const res = await api.post("/kpi/scorecards", {
        userId: Number(formUser.id),
        frequency,
        totalWeight,
        year: currentYear,
        month: currentMonth,
        rows: rows.map((row) => ({
          parameter: row.parameter,
          uom: row.uom,
          reference: row.reference,
          commitment: row.commitment,
          weightage: row.weightage,
          achievement: row.achievement,
          dailyAchievements: row.dailyAchievements || {},
          definition: row.definition,
          measurement: row.measurement,
          dataSource: row.dataSource,
          leadIndicators: row.leadIndicators,
        })),
      });

      const created =
        res.data && typeof res.data === "object" ? (res.data as Scorecard) : null;
      if (created) {
        const matchesCurrentFilter =
          created.userId === selectedUserId &&
          (!selectedYear || String(created.year) === selectedYear) &&
          (!selectedMonth || String(created.month) === selectedMonth);
        if (matchesCurrentFilter) {
          setScorecards((current) => [created, ...current]);
        } else if (String(created.userId) !== String(selectedUserId)) {
          setSelectedUserId(String(created.userId));
        }
      }

      setShowModal(false);
      resetForm();
      toast.success("KPI scorecard created successfully.");
    } catch (createError: any) {
      const message =
        createError?.response?.data?.message || "Unable to create KPI scorecard.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingScorecard(false);
    }
  };

  const triggerAttachmentUpload = (parameterId: string) => {
    if (!canUpdateScorecard) return;
    attachmentTargetRef.current = parameterId;
    attachmentInputRef.current?.click();
  };

  const openAttachmentViewer = (row: KpiRow) => {
    if (!row.attachmentPath) {
      toast.error("No attachment found for this parameter.");
      return;
    }
    setViewingAttachment({
      parameterId: row.id,
      parameterName: row.parameter || "KPI Parameter",
      attachmentPath: row.attachmentPath,
      attachmentName: row.attachmentName || "Attachment",
      attachmentUploadedByName: row.attachmentUploadedByName,
      attachmentUploadedAt: row.attachmentUploadedAt,
    });
    setAttachmentPreviewOpen(false);
  };

  const clearAttachmentFromState = (parameterId: string) => {
    setScorecards((current) =>
      current.map((scorecard) => ({
        ...scorecard,
        rows: scorecard.rows.map((row) =>
          row.id === parameterId
            ? {
                ...row,
                attachmentPath: "",
                attachmentName: "",
                attachmentUploadedByName: "",
                attachmentUploadedAt: "",
              }
            : row,
        ),
      })),
    );
  };

  const handleAttachmentView = () => {
    if (!viewingAttachment) return;
    const attachmentUrl = resolveFileUrl(viewingAttachment.attachmentPath);
    if (!attachmentUrl) {
      toast.error("Attachment file is not available.");
      return;
    }
    setAttachmentPreviewOpen(true);
    toast.success("Attachment preview opened.");
  };

  const closeAttachmentDialogs = () => {
    setAttachmentPreviewOpen(false);
    setViewingAttachment(null);
  };

  const handleAttachmentDownload = async () => {
    if (!viewingAttachment) return;
    const attachmentUrl = resolveFileUrl(viewingAttachment.attachmentPath);
    if (!attachmentUrl) {
      toast.error("Attachment file is not available.");
      return;
    }
    try {
      const response = await api.get(attachmentUrl, { responseType: "blob" });
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = viewingAttachment.attachmentName || "kpi-attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Attachment download started.");
    } catch {
      toast.error("Unable to download attachment.");
    }
  };

  const handleAttachmentRemove = async () => {
    if (!viewingAttachment || !canUpdateScorecard) return;
    setRemovingAttachmentId(viewingAttachment.parameterId);
    try {
      await api.delete(
        `/kpi/scorecards/parameters/${viewingAttachment.parameterId}/attachment`,
      );
      clearAttachmentFromState(viewingAttachment.parameterId);
      setAttachmentPreviewOpen(false);
      setViewingAttachment(null);
      toast.success("Attachment removed successfully.");
    } catch {
      toast.error("Unable to remove attachment.");
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleAttachmentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const parameterId = attachmentTargetRef.current;
    if (!file || !parameterId) return;

    void (async () => {
      setUploadingAttachmentId(parameterId);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("attachment", file);
        const res = await api.post(
          `/kpi/scorecards/parameters/${parameterId}/attachment`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        const data =
          res.data && typeof res.data === "object"
            ? (res.data as {
                attachmentPath?: string;
                attachmentName?: string;
                attachmentUploadedByName?: string;
                attachmentUploadedAt?: string;
              })
            : null;

        if (data?.attachmentPath) {
          setScorecards((current) =>
            current.map((scorecard) => ({
              ...scorecard,
              rows: scorecard.rows.map((row) =>
                row.id === parameterId
                  ? {
                      ...row,
                      attachmentPath: data.attachmentPath,
                      attachmentName:
                        data.attachmentName || file.name || row.attachmentName,
                      attachmentUploadedByName:
                        data.attachmentUploadedByName || row.attachmentUploadedByName,
                      attachmentUploadedAt:
                        data.attachmentUploadedAt || row.attachmentUploadedAt,
                    }
                  : row,
              ),
            })),
          );
          toast.success(`Attachment "${data.attachmentName || file.name}" uploaded successfully.`);
        }
      } catch (uploadError: any) {
        toast.error(
          uploadError?.response?.data?.message ||
            "Unable to upload KPI attachment.",
        );
      } finally {
        setUploadingAttachmentId(null);
        attachmentTargetRef.current = null;
      }
    })();
  };

  const downloadScorecardTemplate = () => {
    const link = document.createElement("a");
    link.href = "/kpi-scorecard-template.csv";
    link.download = "kpi-scorecard-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("KPI scorecard template download started.");
  };

  const importRowsFromCsv = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const importedRows = parseCsvRows(String(reader.result || "")).map(
        ([
          ,
          parameter = "",
          uom = "",
          reference = "",
          commitment = "",
          weightage = "",
          achievement = "",
          ,
          definition = "",
          measurement = "",
          dataSource = "",
          leadIndicators = "",
        ]) => ({
          ...emptyRow(),
          parameter,
          uom,
          reference: formatDisplayValue(reference),
          commitment: formatDisplayValue(commitment),
          weightage: formatDisplayValue(weightage),
          achievement: formatDisplayValue(achievement),
          definition,
          measurement,
          dataSource,
          leadIndicators,
        }),
      );

      if (!importedRows.length) {
        toast.error("No KPI rows found in the selected file.");
        return;
      }

      setOptionalColumns({
        definition: importedRows.some((row) => row.definition.trim()),
        measurement: importedRows.some((row) => row.measurement.trim()),
        dataSource: importedRows.some((row) => row.dataSource.trim()),
        leadIndicators: importedRows.some((row) => row.leadIndicators.trim()),
      });
      updateRows(importedRows);
      setShowImportModal(false);
      toast.success("KPI scorecard rows imported successfully.");
    };
    reader.onerror = () => {
      toast.error("Unable to read KPI scorecard import file.");
    };
    reader.readAsText(file);
  };

  return (
    <Layout>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
              KPI Scorecard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Default view shows your own scorecard.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!canCreateScorecard}
            className="w-full rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            New Scorecard
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(280px,525px)_200px_225px] lg:gap-5">
          <SelectField
            label="Scorecard User"
            value={selectedUserId}
            onChange={setSelectedUserId}
          >
            {users.map((scorecardUser) => (
              <option key={scorecardUser.id} value={scorecardUser.id}>
                {scorecardUser.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Year"
            value={selectedYear}
            onChange={setSelectedYear}
          >
            <option value="">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Month"
            value={selectedMonth}
            onChange={setSelectedMonth}
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value || "all"} value={month.value}>
                {month.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="mt-8">
          {loadingScorecards ? (
            <p className="text-sm text-slate-500">Loading KPI scorecards...</p>
          ) : filteredScorecards.length ? (
            <div className="grid gap-5">
              {filteredScorecards.map((scorecard) => (
                <div
                  key={scorecard.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {scorecard.userName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {
                          MONTH_OPTIONS.find(
                            (item) =>
                              item.value === String(scorecard.month),
                          )?.label
                        }{" "}
                        {scorecard.year} - {scorecard.frequency.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Total KPI Score
                      </p>
                      <p className="text-2xl font-semibold text-slate-950">
                        {formatNumber(scorecard.totalScore)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-cyan-50 via-emerald-50 to-amber-50 px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 sm:text-[11px] sm:tracking-[0.35em]">
                        Select Columns
                      </p>
                      <span className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500">
                        {selectedListOptionalCount} selected
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                      <ColumnToggle
                        label="What is this KPI?"
                        checked={listOptionalColumns.definition}
                        onChange={(checked) =>
                          setListOptionalColumns((state) => ({
                            ...state,
                            definition: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="How it is measured?"
                        checked={listOptionalColumns.measurement}
                        onChange={(checked) =>
                          setListOptionalColumns((state) => ({
                            ...state,
                            measurement: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="What is the data source?"
                        checked={listOptionalColumns.dataSource}
                        onChange={(checked) =>
                          setListOptionalColumns((state) => ({
                            ...state,
                            dataSource: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="Lead Indicators"
                        checked={listOptionalColumns.leadIndicators}
                        onChange={(checked) =>
                          setListOptionalColumns((state) => ({
                            ...state,
                            leadIndicators: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800">
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="w-64">Parameter</TableHead>
                          <TableHead className="w-28">UoM</TableHead>
                          <TableHead className="w-36">Reference</TableHead>
                          <TableHead className="w-36">Commitment</TableHead>
                          <TableHead className="w-36">Weightage</TableHead>
                          <TableHead className="w-36">Achievement</TableHead>
                          <TableHead className="w-36">KPI Score</TableHead>
                          {listOptionalColumns.definition ? (
                            <TableHead className="w-56">What is this KPI?</TableHead>
                          ) : null}
                          {listOptionalColumns.measurement ? (
                            <TableHead className="w-56">How it is measured?</TableHead>
                          ) : null}
                          {listOptionalColumns.dataSource ? (
                            <TableHead className="w-56">What is the data source?</TableHead>
                          ) : null}
                          {listOptionalColumns.leadIndicators ? (
                            <TableHead className="w-64">Lead Indicators</TableHead>
                          ) : null}
                          <TableHead className="w-44">Actions</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {scorecard.rows.map((row, index) => {
                          const isEditing =
                            editingParameter?.scorecardId === scorecard.id &&
                            editingParameter.draft.id === row.id;
                          const displayRow = isEditing ? editingParameter.draft : row;

                          return (
                            <tr key={row.id} className="align-top">
                              <TableCell className="text-center text-slate-600">
                                {index + 1}
                              </TableCell>
                              {isEditing ? (
                                <>
                                  <TableCellInput
                                    value={displayRow.parameter}
                                    onChange={(value) =>
                                      updateEditingParameter("parameter", value)
                                    }
                                  />
                                  <TableCellInput
                                    value={displayRow.uom}
                                    onChange={(value) =>
                                      updateEditingParameter("uom", value)
                                    }
                                  />
                                  <TableCellInput
                                    value={displayRow.reference}
                                    onChange={(value) =>
                                      updateEditingParameter("reference", value)
                                    }
                                  />
                                  <TableCellInput
                                    value={displayRow.commitment}
                                    onChange={(value) =>
                                      updateEditingParameter("commitment", value)
                                    }
                                  />
                                  <TableCellInput
                                    value={displayRow.weightage}
                                    onChange={(value) =>
                                      updateEditingParameter("weightage", value)
                                    }
                                  />
                                  <TableCellInput
                                    value={displayRow.achievement}
                                    onChange={(value) =>
                                      updateEditingParameter("achievement", value)
                                    }
                                    inputRef={achievementInputRef}
                                    onFocus={() =>
                                      handleAchievementFocus(
                                        displayRow,
                                        index + 1,
                                        getPeriodDate(scorecard),
                                        "edit",
                                      )
                                    }
                                  />
                                  <TableCell className="bg-slate-50 text-center font-medium text-slate-700">
                                    {formatNumber(calculateKpiScore(displayRow))}
                                  </TableCell>
                                  {listOptionalColumns.definition ? (
                                    <TableCellArea
                                      value={displayRow.definition}
                                      onChange={(value) =>
                                        updateEditingParameter("definition", value)
                                      }
                                    />
                                  ) : null}
                                  {listOptionalColumns.measurement ? (
                                    <TableCellArea
                                      value={displayRow.measurement}
                                      onChange={(value) =>
                                        updateEditingParameter("measurement", value)
                                      }
                                    />
                                  ) : null}
                                  {listOptionalColumns.dataSource ? (
                                    <TableCellArea
                                      value={displayRow.dataSource}
                                      onChange={(value) =>
                                        updateEditingParameter("dataSource", value)
                                      }
                                    />
                                  ) : null}
                                  {listOptionalColumns.leadIndicators ? (
                                    <TableCellArea
                                      value={displayRow.leadIndicators}
                                      onChange={(value) =>
                                        updateEditingParameter("leadIndicators", value)
                                      }
                                    />
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <TableCell>{row.parameter || "-"}</TableCell>
                                  <TableCell>{row.uom || "-"}</TableCell>
                                  <TableCell className="text-center">
                                    {formatDisplayValue(row.reference) || "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {formatDisplayValue(row.commitment) || "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {formatDisplayValue(row.weightage) || "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {hasAchievementInput(row)
                                      ? formatDisplayValue(row.achievement)
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-center font-medium">
                                    {formatNumber(calculateKpiScore(row))}
                                  </TableCell>
                                  {listOptionalColumns.definition ? (
                                    <TableCell className="whitespace-pre-wrap">
                                      {row.definition || "-"}
                                    </TableCell>
                                  ) : null}
                                  {listOptionalColumns.measurement ? (
                                    <TableCell className="whitespace-pre-wrap">
                                      {row.measurement || "-"}
                                    </TableCell>
                                  ) : null}
                                  {listOptionalColumns.dataSource ? (
                                    <TableCell className="whitespace-pre-wrap">
                                      {row.dataSource || "-"}
                                    </TableCell>
                                  ) : null}
                                  {listOptionalColumns.leadIndicators ? (
                                    <TableCell className="whitespace-pre-wrap">
                                      {formatLeadIndicators(row.leadIndicators, index + 1)}
                                    </TableCell>
                                  ) : null}
                                </>
                              )}
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void saveEditParameter(scorecard)}
                                      disabled={savingParameterId === row.id}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                                      aria-label="Save parameter"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditParameter}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                      aria-label="Cancel edit"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerAttachmentUpload(row.id)}
                                      disabled={
                                        !canUpdateScorecard ||
                                        uploadingAttachmentId === row.id
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Upload attachment"
                                      title="Upload attachment"
                                    >
                                      <FilePlus className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openAttachmentViewer(row)}
                                      disabled={!row.attachmentPath}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="View attachment"
                                      title={
                                        row.attachmentPath
                                          ? "View attachment"
                                          : "No attachment uploaded"
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditParameter(scorecard, row, index)
                                      }
                                      disabled={
                                        !canUpdateScorecard ||
                                        Boolean(editingParameter)
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label="Edit parameter"
                                      title="Edit parameter"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </TableCell>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No scorecards found for selected user.
            </p>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-3 sm:p-6">
          <div className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:max-w-[calc(100vw-3rem)] sm:rounded-[28px]">
            <form
              onSubmit={handleCreateScorecard}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  Create Scorecard
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_220px_220px_220px] xl:gap-5">
                  <SelectField
                    label="Person Name"
                    value={formUserId}
                    onChange={setFormUserId}
                    placeholder="Select User"
                  >
                    {users.map((scorecardUser) => (
                      <option key={scorecardUser.id} value={scorecardUser.id}>
                        {scorecardUser.label}
                      </option>
                    ))}
                  </SelectField>
                  <MetaCard
                    title="Role"
                    value={formUser?.role || "Not assigned"}
                    icon="R"
                    tone="emerald"
                  />
                  <MetaCard
                    title="Department"
                    value={formUser?.department || "Not assigned"}
                    icon="D"
                    tone="blue"
                  />
                  <MetaCard
                    title="Designation"
                    value={formUser?.designation || "Not assigned"}
                    icon="G"
                    tone="amber"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
                  <SelectField
                    label="Frequency"
                    value={frequency}
                    onChange={setFrequency}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </SelectField>
                  <label>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Total Weight
                    </span>
                    <input
                      value={totalWeight}
                      onChange={(event) => setTotalWeight(event.target.value)}
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition focus:border-teal-400"
                    />
                  </label>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 sm:rounded-[24px]">
                  <div className="bg-gradient-to-r from-cyan-50 via-emerald-50 to-amber-50 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 sm:text-[11px] sm:tracking-[0.35em]">
                        Select Columns
                      </p>
                      <span className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500">
                        {selectedOptionalCount} selected
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                      <ColumnToggle
                        label="What is this KPI?"
                        checked={optionalColumns.definition}
                        onChange={(checked) =>
                          setOptionalColumns((state) => ({
                            ...state,
                            definition: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="How it is measured?"
                        checked={optionalColumns.measurement}
                        onChange={(checked) =>
                          setOptionalColumns((state) => ({
                            ...state,
                            measurement: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="What is the data source?"
                        checked={optionalColumns.dataSource}
                        onChange={(checked) =>
                          setOptionalColumns((state) => ({
                            ...state,
                            dataSource: checked,
                          }))
                        }
                      />
                      <ColumnToggle
                        label="Lead Indicators"
                        checked={optionalColumns.leadIndicators}
                        onChange={(checked) =>
                          setOptionalColumns((state) => ({
                            ...state,
                            leadIndicators: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[720px] table-fixed border-collapse text-sm sm:min-w-[1180px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800">
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="w-64">Parameter</TableHead>
                          <TableHead className="w-28">UoM</TableHead>
                          <TableHead className="w-36">Reference</TableHead>
                          <TableHead className="w-36">Commitment</TableHead>
                          <TableHead className="w-36">Weightage</TableHead>
                          <TableHead className="w-36">Achievement</TableHead>
                          <TableHead className="w-36">KPI Score</TableHead>
                          {optionalColumns.definition ? (
                            <TableHead className="w-56">
                              What is this KPI?
                            </TableHead>
                          ) : null}
                          {optionalColumns.measurement ? (
                            <TableHead className="w-56">
                              How it is measured?
                            </TableHead>
                          ) : null}
                          {optionalColumns.dataSource ? (
                            <TableHead className="w-56">Data Source</TableHead>
                          ) : null}
                          {optionalColumns.leadIndicators ? (
                            <TableHead className="w-56">
                              Lead Indicators
                            </TableHead>
                          ) : null}
                          <TableHead className="w-28">Action</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.id}>
                            <TableCell className="text-center text-slate-600">
                              {index + 1}
                            </TableCell>
                            <TableCellInput
                              value={row.parameter}
                              onChange={(value) =>
                                updateRow(row.id, "parameter", value)
                              }
                            />
                            <TableCellInput
                              value={row.uom}
                              onChange={(value) =>
                                updateRow(row.id, "uom", value)
                              }
                            />
                            <TableCellInput
                              value={row.reference}
                              onChange={(value) =>
                                updateRow(row.id, "reference", value)
                              }
                            />
                            <TableCellInput
                              value={row.commitment}
                              onChange={(value) =>
                                updateRow(row.id, "commitment", value)
                              }
                            />
                            <TableCellInput
                              value={row.weightage}
                              onChange={(value) =>
                                updateRow(row.id, "weightage", value)
                              }
                            />
                            <TableCellInput
                              value={row.achievement}
                              onChange={(value) =>
                                updateRow(row.id, "achievement", value)
                              }
                              inputRef={achievementInputRef}
                              onFocus={() =>
                                handleAchievementFocus(
                                  row,
                                  index + 1,
                                  new Date(currentYear, currentMonth - 1, 1),
                                  "create",
                                )
                              }
                            />
                            <TableCell className="bg-slate-50 text-center font-medium text-slate-700">
                              {formatNumber(calculateKpiScore(row))}
                            </TableCell>
                            {optionalColumns.definition ? (
                              <TableCellInput
                                value={row.definition}
                                onChange={(value) =>
                                  updateRow(row.id, "definition", value)
                                }
                              />
                            ) : null}
                            {optionalColumns.measurement ? (
                              <TableCellInput
                                value={row.measurement}
                                onChange={(value) =>
                                  updateRow(row.id, "measurement", value)
                                }
                              />
                            ) : null}
                            {optionalColumns.dataSource ? (
                              <TableCellInput
                                value={row.dataSource}
                                onChange={(value) =>
                                  updateRow(row.id, "dataSource", value)
                                }
                              />
                            ) : null}
                            {optionalColumns.leadIndicators ? (
                              <TableCellArea
                                value={row.leadIndicators}
                                onChange={(value) =>
                                  updateRow(row.id, "leadIndicators", value)
                                }
                              />
                            ) : null}
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                disabled={rows.length <= MIN_ROWS}
                                className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-400 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Remove row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-right text-sm">
                    <span className="font-semibold text-slate-500">
                      Total KPI Score:
                    </span>{" "}
                    <span className="font-bold text-slate-900">
                      {formatNumber(totalScore)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6 md:px-8">
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={addRow}
                    disabled={rows.length >= MAX_ROWS}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Import CSV
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    {rows.length}/{MAX_ROWS} rows
                  </span>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formUser || savingScorecard}
                    className="w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {savingScorecard ? "Creating..." : "Create Scorecard"}
                  </button>
                </div>
              </div>
            </form>

            {showImportModal ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/25 px-4">
                <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close import dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <h3 className="text-lg font-bold text-slate-900">Import CSV</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Download the template or choose a completed file.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={downloadScorecardTemplate}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Download Template
                    </button>
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      className="flex-1 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      Choose File
                    </button>
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importRowsFromCsv}
                    className="hidden"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {dailyAchievementModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-2 py-4 sm:px-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Daily Achievement
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                  {dailyAchievementModal.parameterName || "KPI Parameter"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {dailyAchievementModal.periodDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  - {dailyAchievementModal.uom || "UoM not set"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatNumber(dailyAchievementTotal)}
                </p>
              </div>
            </div>

            <div className="px-3 py-4 sm:px-5 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  {dailyAchievementModal.periodDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  - {dailyAchievementModal.uom || "UoM"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!showDailyLeadIndicators) {
                      setShowDailyLeadIndicators(true);
                      setVisibleDailyLeadIndicatorCount(
                        dailyLeadIndicatorLines.length ? 1 : 0,
                      );
                      return;
                    }

                    setVisibleDailyLeadIndicatorCount((current) =>
                      Math.min(current + 1, dailyLeadIndicatorLines.length),
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                  Lead Indicators
                </button>
              </div>

              <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
                <table className="min-w-[1400px] table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700">
                      <th className="w-16 whitespace-nowrap border border-slate-200 px-3 py-2 text-center text-xs font-semibold">
                        S.No
                      </th>
                      <th className="w-64 whitespace-nowrap border border-slate-200 px-3 py-2 text-left text-xs font-semibold">
                        KPI
                      </th>
                      <th className="w-24 whitespace-nowrap border border-slate-200 px-3 py-2 text-center text-xs font-semibold">
                        UoM
                      </th>
                      {getPeriodDays(dailyAchievementModal.periodDate).map((day) => (
                        <th
                          key={day.key}
                          className="min-w-[78px] whitespace-nowrap border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyDraftRows.map((row) => (
                      <tr key={row.key}>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2 text-center text-sm text-slate-600">
                          {row.serial}
                        </td>
                        <td className="w-64 border border-slate-200 px-3 py-2 align-top text-sm font-medium leading-5 text-slate-900 whitespace-normal break-normal">
                          {row.label || "-"}
                        </td>
                        <td className="w-24 whitespace-nowrap border border-slate-200 px-3 py-2 text-center text-sm text-slate-700">
                          {row.uom || "-"}
                        </td>
                        {getPeriodDays(dailyAchievementModal.periodDate).map((day) => (
                          <td
                            key={`${row.key}-${day.key}`}
                            className="border border-slate-200 px-1 py-1 text-center align-middle"
                          >
                            <input
                              value={dailyAchievementDraft[row.key]?.[day.key] || ""}
                              onChange={(event) =>
                                setDailyAchievementDraft((current) => ({
                                  ...current,
                                  [row.key]: {
                                    ...(current[row.key] || {}),
                                    [day.key]: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 min-w-[68px] w-full rounded-md border border-slate-200 px-2 text-xs text-slate-900 outline-none focus:border-teal-500"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-slate-500">
                  Enter day-wise achievement. The total will update the main Achievement field.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:space-x-3 sm:px-5">
              <button
                type="button"
                onClick={cancelDailyAchievement}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyDailyAchievement}
                className="w-full rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
              >
                Apply Total
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={attachmentInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,image/*,application/pdf"
        onChange={handleAttachmentUpload}
        className="hidden"
      />

      {viewingAttachment ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Attachments
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {viewingAttachment.parameterName}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAttachmentDialogs}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close attachment dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  {viewingAttachment.attachmentName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {viewingAttachment.attachmentUploadedByName
                    ? `Uploaded by ${viewingAttachment.attachmentUploadedByName}`
                    : "Uploaded by Unknown"}
                  {viewingAttachment.attachmentUploadedAt
                    ? ` - ${formatAttachmentUploadedAt(viewingAttachment.attachmentUploadedAt)}`
                    : ""}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleAttachmentView}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={handleAttachmentDownload}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAttachmentRemove()}
                    disabled={
                      !canUpdateScorecard ||
                      removingAttachmentId === viewingAttachment.parameterId
                    }
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingAttachmentId === viewingAttachment.parameterId
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewingAttachment && attachmentPreviewOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Attachment Preview
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {viewingAttachment.attachmentName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {viewingAttachment.parameterName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentPreviewOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close attachment preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
              {(() => {
                const attachmentUrl = resolveFileUrl(viewingAttachment.attachmentPath);
                if (!attachmentUrl) {
                  return (
                    <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                      Attachment file is not available.
                    </p>
                  );
                }

                if (
                  isImageAttachment(
                    viewingAttachment.attachmentName,
                    viewingAttachment.attachmentPath,
                  )
                ) {
                  return (
                    <img
                      src={attachmentUrl}
                      alt={viewingAttachment.attachmentName}
                      className="mx-auto max-h-[70vh] w-full rounded-xl border border-slate-200 bg-white object-contain"
                    />
                  );
                }

                if (
                  isPdfAttachment(
                    viewingAttachment.attachmentName,
                    viewingAttachment.attachmentPath,
                  )
                ) {
                  return (
                    <iframe
                      title={viewingAttachment.attachmentName}
                      src={attachmentUrl}
                      className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white"
                    />
                  );
                }

                return (
                  <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
                    <p className="text-sm text-slate-600">
                      Inline preview is not available for this file type.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Use Download to save the file.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-5 pr-11 text-sm text-slate-900 outline-none transition focus:border-teal-400"
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function MetaCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: "emerald" | "blue" | "amber";
  icon: string;
}) {
  const styles = {
    emerald: "bg-emerald-500",
    blue: "bg-sky-500",
    amber: "bg-orange-500",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles} text-sm font-bold text-white`}
        >
          {icon}
        </span>
        <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ColumnToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex w-full cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:w-auto sm:gap-3 sm:px-5 sm:py-2.5 sm:text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      {label}
    </label>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border border-slate-200 px-3 py-3 text-center text-sm font-semibold ${className}`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`h-[58px] border border-slate-200 px-3 align-middle ${className}`}
    >
      {children}
    </td>
  );
}

function TableCellInput({
  value,
  onChange,
  onFocus,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <td className="h-[58px] border border-slate-200 p-0 align-middle">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        className="h-full w-full border-0 bg-transparent px-3 text-sm text-slate-900 outline-none transition focus:bg-teal-50"
      />
    </td>
  );
}

function TableCellArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <td className="h-[58px] border border-slate-200 p-0 align-top">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        className="min-h-[58px] w-full resize-y border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-teal-50"
      />
    </td>
  );
}

export default KPIScoreboardPage;
