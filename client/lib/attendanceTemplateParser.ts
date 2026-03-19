import * as XLSX from "xlsx";

export type AttendanceWorkbookInput = ArrayBuffer | Uint8Array | File | Blob;

export type RawAttendanceRow = Record<string, any>;

export type NormalizedAttendanceRow = {
  employeeCode?: string | number;
  employeeName?: string;
  department?: string;
  date?: string; // ISO string yyyy-mm-dd
  status?: string;
  shift?: string;
  inTime?: string; // HH:mm
  outTime?: string; // HH:mm
  workedHours?: string; // HH:mm or decimal hours
  overtime?: string;
  lateBy?: string;
  earlyBy?: string;
  remarks?: string;
};

export type ParsedAttendanceWorkbook = {
  sheetName: string;
  headers: string[];
  rows: RawAttendanceRow[];
  normalizedRows: NormalizedAttendanceRow[];
  headerMap: Partial<Record<keyof NormalizedAttendanceRow, string>>;
};

const headerAliases: Record<keyof NormalizedAttendanceRow, string[]> = {
  employeeCode: ["employee id", "emp id", "id", "code", "employee code"],
  employeeName: ["employee name", "emp name", "name", "employee"],
  department: ["department", "dept"],
  date: ["date", "day", "attendance date"],
  status: ["status", "attendance status", "present/absent", "p/a"],
  shift: ["shift", "shift name"],
  inTime: ["in time", "in", "check in", "punch in", "clock in"],
  outTime: ["out time", "out", "check out", "punch out", "clock out"],
  workedHours: ["total hours", "working hours", "worked hours", "duration"],
  overtime: ["overtime", "ot hours", "ot"],
  lateBy: ["late by", "late"],
  earlyBy: ["early by", "early"],
  remarks: ["remarks", "note", "comment"],
};

const normalizeHeader = (value: string | undefined | null) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const toArrayBuffer = async (
  source: AttendanceWorkbookInput
): Promise<ArrayBuffer | Uint8Array> => {
  if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    return source;
  }

  if (typeof (source as File | Blob).arrayBuffer === "function") {
    return await (source as File | Blob).arrayBuffer();
  }

  throw new Error("Unsupported workbook input; provide File/Blob/ArrayBuffer.");
};

const buildHeaderMap = (
  headers: string[]
): Partial<Record<keyof NormalizedAttendanceRow, string>> => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const map: Partial<Record<keyof NormalizedAttendanceRow, string>> = {};

  (Object.keys(headerAliases) as Array<keyof NormalizedAttendanceRow>).forEach(
    (targetKey) => {
      const aliases = headerAliases[targetKey];
      const matchIndex = normalizedHeaders.findIndex((h) =>
        aliases.includes(h)
      );
      if (matchIndex !== -1) {
        map[targetKey] = headers[matchIndex];
      }
    }
  );

  return map;
};

const excelDateToISO = (value: any): string | undefined => {
  // Excel serial number or date-like string
  if (typeof value === "number") {
    // Excel epoch starts Jan 0 1900
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return undefined;
};

const cleanTime = (value: any): string | undefined => {
  const str = String(value ?? "").trim();
  if (!str) return undefined;

  // If it's a number like 9.5 -> convert to HH:mm
  if (!isNaN(Number(str)) && str.includes(".")) {
    const hours = Math.floor(Number(str));
    const minutes = Math.round((Number(str) - hours) * 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  // Already HH:mm or HH:mm:ss
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (timeMatch) {
    const h = timeMatch[1].padStart(2, "0");
    const m = timeMatch[2];
    return `${h}:${m}`;
  }

  return str;
};

const normalizeRow = (
  row: RawAttendanceRow,
  map: Partial<Record<keyof NormalizedAttendanceRow, string>>
): NormalizedAttendanceRow => {
  const get = (key: keyof NormalizedAttendanceRow) => {
    const sourceKey = map[key];
    return sourceKey ? row[sourceKey] : undefined;
  };

  return {
    employeeCode: get("employeeCode"),
    employeeName: get("employeeName"),
    department: get("department"),
    date: excelDateToISO(get("date")),
    status: get("status"),
    shift: get("shift"),
    inTime: cleanTime(get("inTime")),
    outTime: cleanTime(get("outTime")),
    workedHours: cleanTime(get("workedHours")),
    overtime: cleanTime(get("overtime")),
    lateBy: cleanTime(get("lateBy")),
    earlyBy: cleanTime(get("earlyBy")),
    remarks: get("remarks"),
  };
};

/**
 * Parse an attendance workbook (SalaryBox-style or similar) and return both raw and normalized data.
 *
 * Usage (browser):
 * const file = event.target.files[0];
 * const parsed = await parseAttendanceWorkbook(file);
 */
export const parseAttendanceWorkbook = async (
  source: AttendanceWorkbookInput,
  sheetIndex = 0
): Promise<ParsedAttendanceWorkbook> => {
  const buffer = await toArrayBuffer(source);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[sheetIndex];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet index ${sheetIndex} not found`);
  }

  const rows: RawAttendanceRow[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  }) as RawAttendanceRow[];
  const headers =
    (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      blankrows: false,
    })[0] as string[]) || [];

  const headerMap = buildHeaderMap(headers);
  const normalizedRows = rows.map((r) => normalizeRow(r, headerMap));

  return {
    sheetName,
    headers,
    rows,
    normalizedRows,
    headerMap,
  };
};

/**
 * Quick heuristic: returns true if workbook headers resemble the SalaryBox export format.
 */
export const looksLikeSalaryBoxAttendance = (
  headers: string[]
): boolean => {
  const normalized = headers.map(normalizeHeader);
  return (
    normalized.includes("employee name") &&
    normalized.includes("date") &&
    (normalized.includes("in time") || normalized.includes("check in"))
  );
};
