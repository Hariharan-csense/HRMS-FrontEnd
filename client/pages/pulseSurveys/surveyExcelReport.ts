import * as XLSX from "xlsx";

type SurveyReportSurvey = {
  id?: number;
  title: string;
  message?: string;
  allowAnonymous?: boolean;
  createdAt?: string;
  totalSent?: number;
  responseCount?: number;
  avgScore?: number;
};

type SurveyReportResponse = {
  id?: number;
  employeeId?: number;
  score?: number;
  label?: string;
  comment?: string;
  isAnonymous?: boolean;
  respondedAt?: string;
  updatedAt?: string;
  department?: string | null;
  branch?: string | null;
  employee?: { name?: string; email?: string; gender?: string } | null;
};

type GroupScore = {
  label: string;
  score: number;
  responses: number;
};

type ExportSurveyReportInput = {
  survey: SurveyReportSurvey;
  responses: SurveyReportResponse[];
  departmentData?: GroupScore[];
  branchData?: GroupScore[];
};

const BRAND = "17C491";
const BRAND_DARK = "0F8F70";
const BRAND_DEEP = "053B2E";
const BRAND_LIGHT = "E9FBF5";
const BORDER = "BDF4DF";
const MUTED = "64748B";

const clamp = (value: number) => Math.max(0, Math.min(10, value));

const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.0/10";
  return `${clamp(Number(value)).toFixed(1)}/10`;
};

const safeText = (value: unknown) => String(value ?? "").trim();

const safeFilename = (value: string) =>
  safeText(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "pulse-survey-report";

const toDisplayDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const cleanGroupLabel = (value: string | null | undefined, fallback: string) =>
  safeText(value) || fallback;

const employeeLabel = (response: SurveyReportResponse, allowAnonymous?: boolean) => {
  const isAnonymous = Boolean(response.isAnonymous || allowAnonymous);
  if (isAnonymous) return "Anonymous Employee";
  return response.employee?.name || `Employee ${response.employeeId || ""}`.trim();
};

const cell = XLSX.utils.encode_cell;

const setCell = (
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number,
  style?: XLSX.CellObject["s"],
) => {
  const address = cell({ r, c });
  ws[address] = {
    t: typeof value === "number" ? "n" : "s",
    v: value,
    ...(style ? { s: style } : {}),
  };
};

const merge = (ws: XLSX.WorkSheet, s: XLSX.CellAddress, e: XLSX.CellAddress) => {
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s, e });
};

const titleStyle = {
  font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: BRAND } },
  alignment: { horizontal: "left", vertical: "center" },
};

const subtitleStyle = {
  font: { sz: 11, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: BRAND } },
  alignment: { horizontal: "left", vertical: "center" },
};

const sectionStyle = {
  font: { bold: true, sz: 12, color: { rgb: BRAND_DEEP } },
  fill: { fgColor: { rgb: BRAND_LIGHT } },
  alignment: { horizontal: "left", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: BORDER } },
    bottom: { style: "thin", color: { rgb: BORDER } },
  },
};

const labelStyle = {
  font: { bold: true, color: { rgb: BRAND_DARK } },
  fill: { fgColor: { rgb: "F3FDF9" } },
  alignment: { horizontal: "left", vertical: "center" },
};

const valueStyle = {
  font: { bold: true, sz: 14, color: { rgb: BRAND_DEEP } },
  fill: { fgColor: { rgb: "FFFFFF" } },
  alignment: { horizontal: "left", vertical: "center" },
};

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: BRAND_DARK } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: BRAND_DARK } },
    bottom: { style: "thin", color: { rgb: BRAND_DARK } },
  },
};

const bodyStyle = {
  alignment: { vertical: "top", wrapText: true },
  border: { bottom: { style: "thin", color: { rgb: "E2E8F0" } } },
};

const mutedStyle = {
  font: { color: { rgb: MUTED } },
  alignment: { vertical: "top", wrapText: true },
};

const buildResponseRows = (survey: SurveyReportSurvey, responses: SurveyReportResponse[]) =>
  responses
    .slice()
    .sort((a, b) => safeText(a.respondedAt).localeCompare(safeText(b.respondedAt)))
    .map((response, index) => ({
      "#": index + 1,
      "Employee Name": employeeLabel(response, survey.allowAnonymous),
      Email: response.isAnonymous || survey.allowAnonymous ? "" : response.employee?.email || "",
      Department: cleanGroupLabel(response.department, "Unassigned Department"),
      Branch: cleanGroupLabel(response.branch, "Unassigned Branch"),
      Score: clamp(Number(response.score || 0)),
      Rating: formatScore(response.score),
      Mood: response.label || "",
      Comment: response.comment || "",
      Anonymous: response.isAnonymous || survey.allowAnonymous ? "Yes" : "No",
      "Responded At": toDisplayDate(response.respondedAt),
      "Updated At": toDisplayDate(response.updatedAt),
    }));

const addJsonSheet = (
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: Record<string, string | number>[],
  columnWidths: Array<{ wch: number }>,
) => {
  const dataRows = rows.length ? rows : [{ Message: "No data available." }];
  const ws = XLSX.utils.json_to_sheet(dataRows, { skipHeader: false });
  ws["!cols"] = columnWidths;
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const address = cell({ r: 0, c });
    if (ws[address]) ws[address].s = headerStyle;
  }
  for (let r = 1; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const address = cell({ r, c });
      if (ws[address]) ws[address].s = bodyStyle;
    }
  }
  ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
};

const buildExecutiveSummarySheet = ({
  survey,
  responses,
  departmentData = [],
  branchData = [],
}: ExportSurveyReportInput) => {
  const ws: XLSX.WorkSheet = {};
  const sentCount = Number(survey.totalSent || 0);
  const responseCount = Number(survey.responseCount ?? responses.length);
  const pendingCount = Math.max(sentCount - responseCount, 0);
  const responseRate = sentCount ? `${Math.round((responseCount / sentCount) * 100)}%` : "0%";
  const avgScore =
    responses.length
      ? responses.reduce((sum, r) => sum + clamp(Number(r.score || 0)), 0) / responses.length
      : Number(survey.avgScore || 0);

  setCell(ws, 0, 0, "Employee Pulse Survey Report", titleStyle);
  merge(ws, { r: 0, c: 0 }, { r: 0, c: 7 });
  setCell(ws, 1, 0, survey.title || "Untitled Survey", subtitleStyle);
  merge(ws, { r: 1, c: 0 }, { r: 1, c: 7 });

  setCell(ws, 3, 0, "Executive Summary", sectionStyle);
  merge(ws, { r: 3, c: 0 }, { r: 3, c: 7 });

  const summaryCards = [
    ["Total Sent", sentCount],
    ["Responses", responseCount],
    ["Not Responded", pendingCount],
    ["Response Rate", responseRate],
    ["Average Score", formatScore(avgScore)],
    ["Anonymous", survey.allowAnonymous ? "Allowed" : "Disabled"],
  ];

  summaryCards.forEach(([label, value], index) => {
    const row = 5 + Math.floor(index / 3) * 3;
    const col = (index % 3) * 3;
    setCell(ws, row, col, String(label), labelStyle);
    merge(ws, { r: row, c: col }, { r: row, c: col + 1 });
    setCell(ws, row + 1, col, value as string | number, valueStyle);
    merge(ws, { r: row + 1, c: col }, { r: row + 1, c: col + 1 });
  });

  setCell(ws, 12, 0, "Survey Information", sectionStyle);
  merge(ws, { r: 12, c: 0 }, { r: 12, c: 7 });
  const infoRows = [
    ["Survey Title", survey.title || "-"],
    ["Message", survey.message || "-"],
    ["Created Date", toDisplayDate(survey.createdAt) || "-"],
    ["Generated At", new Date().toLocaleString()],
  ];
  infoRows.forEach(([label, value], index) => {
    const row = 14 + index;
    setCell(ws, row, 0, label, labelStyle);
    setCell(ws, row, 1, value, mutedStyle);
    merge(ws, { r: row, c: 1 }, { r: row, c: 7 });
  });

  setCell(ws, 20, 0, "Top Group Scores", sectionStyle);
  merge(ws, { r: 20, c: 0 }, { r: 20, c: 7 });
  const groupRows = [
    ...departmentData.slice(0, 5).map((g) => ["Department", g.label, g.responses, formatScore(g.score)]),
    ...branchData.slice(0, 5).map((g) => ["Branch", g.label, g.responses, formatScore(g.score)]),
  ];
  ["Type", "Name", "Responses", "Average Score"].forEach((header, index) =>
    setCell(ws, 22, index, header, headerStyle),
  );
  (groupRows.length ? groupRows : [["-", "No group data available", 0, "-"]]).forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => setCell(ws, 23 + rowIndex, colIndex, value, bodyStyle));
  });

  ws["!ref"] = "A1:H35";
  ws["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  ws["!rows"] = [{ hpt: 30 }, { hpt: 24 }, {}, { hpt: 24 }];
  return ws;
};

export const exportPulseSurveyExcelReport = (input: ExportSurveyReportInput) => {
  const workbook = XLSX.utils.book_new();
  const { survey, responses, departmentData = [], branchData = [] } = input;

  XLSX.utils.book_append_sheet(
    workbook,
    buildExecutiveSummarySheet(input),
    "Executive Summary",
  );

  addJsonSheet(
    workbook,
    "Response Register",
    buildResponseRows(survey, responses),
    [
      { wch: 6 },
      { wch: 24 },
      { wch: 28 },
      { wch: 24 },
      { wch: 24 },
      { wch: 10 },
      { wch: 12 },
      { wch: 18 },
      { wch: 48 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
    ],
  );

  const groupRows = [
    ...departmentData.map((group) => ({
      Type: "Department",
      Name: group.label,
      Responses: group.responses,
      "Average Score": formatScore(group.score),
    })),
    ...branchData.map((group) => ({
      Type: "Branch",
      Name: group.label,
      Responses: group.responses,
      "Average Score": formatScore(group.score),
    })),
  ];

  addJsonSheet(
    workbook,
    "Group Analytics",
    groupRows,
    [{ wch: 16 }, { wch: 32 }, { wch: 14 }, { wch: 16 }],
  );

  XLSX.writeFile(workbook, `${safeFilename(survey.title)}-survey-report.xlsx`);
};
