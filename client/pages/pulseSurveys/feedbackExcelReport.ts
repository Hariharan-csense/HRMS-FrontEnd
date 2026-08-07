import * as XLSX from "xlsx";

type FeedbackRow = {
  id: number;
  feedback: string;
  category: string;
  employeeId: number | null;
  employeeName: string | null;
  department: string | null;
  branch: string | null;
  isAnonymous: number | boolean;
  status: "submitted" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt?: string | null;
};

type GroupStat = {
  name: string;
  count: number;
};

type FeedbackExportInput = {
  rows: FeedbackRow[];
  departmentStats: GroupStat[];
  branchStats: GroupStat[];
};

const BRAND = "17C491";
const BRAND_DARK = "0F8F70";
const BRAND_DEEP = "053B2E";
const BRAND_LIGHT = "E9FBF5";
const BORDER = "BDF4DF";
const MUTED = "64748B";

const cell = XLSX.utils.encode_cell;

const safeText = (value: unknown) => String(value ?? "").trim();

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const isAnonymous = (row: FeedbackRow) => Boolean(row.isAnonymous) || !row.employeeName;

const statusLabel = (status: FeedbackRow["status"]) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

const addJsonSheet = (
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: Record<string, string | number>[],
  columnWidths: Array<{ wch: number }>,
) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: "No data available." }]);
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
  rows,
  departmentStats,
  branchStats,
}: FeedbackExportInput) => {
  const ws: XLSX.WorkSheet = {};
  const statusCounts = {
    submitted: rows.filter((row) => row.status === "submitted").length,
    reviewed: rows.filter((row) => row.status === "reviewed").length,
    resolved: rows.filter((row) => row.status === "resolved").length,
    dismissed: rows.filter((row) => row.status === "dismissed").length,
  };
  const anonymousCount = rows.filter(isAnonymous).length;
  const identifiedCount = rows.length - anonymousCount;

  setCell(ws, 0, 0, "Employee Feedback Report", titleStyle);
  merge(ws, { r: 0, c: 0 }, { r: 0, c: 7 });
  setCell(ws, 1, 0, `Generated ${new Date().toLocaleString()}`, subtitleStyle);
  merge(ws, { r: 1, c: 0 }, { r: 1, c: 7 });

  setCell(ws, 3, 0, "Executive Summary", sectionStyle);
  merge(ws, { r: 3, c: 0 }, { r: 3, c: 7 });

  const cards = [
    ["Total Feedback", rows.length],
    ["Submitted", statusCounts.submitted],
    ["Reviewed", statusCounts.reviewed],
    ["Resolved", statusCounts.resolved],
    ["Dismissed", statusCounts.dismissed],
    ["Anonymous", anonymousCount],
    ["Identified", identifiedCount],
    ["Departments", departmentStats.length],
    ["Branches", branchStats.length],
  ];

  cards.forEach(([label, value], index) => {
    const row = 5 + Math.floor(index / 3) * 3;
    const col = (index % 3) * 3;
    setCell(ws, row, col, String(label), labelStyle);
    merge(ws, { r: row, c: col }, { r: row, c: col + 1 });
    setCell(ws, row + 1, col, value as string | number, valueStyle);
    merge(ws, { r: row + 1, c: col }, { r: row + 1, c: col + 1 });
  });

  setCell(ws, 16, 0, "Top Department / Branch Feedback", sectionStyle);
  merge(ws, { r: 16, c: 0 }, { r: 16, c: 7 });
  ["Type", "Name", "Feedback Count"].forEach((header, index) =>
    setCell(ws, 18, index, header, headerStyle),
  );
  const groupRows = [
    ...departmentStats.slice(0, 5).map((group) => ["Department", group.name, group.count]),
    ...branchStats.slice(0, 5).map((group) => ["Branch", group.name, group.count]),
  ];
  (groupRows.length ? groupRows : [["-", "No group data available", 0]]).forEach(
    (row, rowIndex) => row.forEach((value, colIndex) => setCell(ws, 19 + rowIndex, colIndex, value, bodyStyle)),
  );

  setCell(ws, 31, 0, "Notes", sectionStyle);
  merge(ws, { r: 31, c: 0 }, { r: 31, c: 7 });
  setCell(
    ws,
    33,
    0,
    "Anonymous feedback does not expose employee identity in this report.",
    mutedStyle,
  );
  merge(ws, { r: 33, c: 0 }, { r: 33, c: 7 });

  ws["!ref"] = "A1:H36";
  ws["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  ws["!rows"] = [{ hpt: 30 }, { hpt: 24 }, {}, { hpt: 24 }];
  return ws;
};

export const exportEmployeeFeedbackExcelReport = (input: FeedbackExportInput) => {
  const { rows, departmentStats, branchStats } = input;
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    buildExecutiveSummarySheet(input),
    "Executive Summary",
  );

  addJsonSheet(
    workbook,
    "Feedback Register",
    rows.map((row, index) => ({
      "#": index + 1,
      "Feedback ID": row.id,
      "Employee Name": isAnonymous(row) ? "Anonymous Employee" : row.employeeName || "",
      Department: row.department || "Unassigned department",
      Branch: row.branch || "Unassigned branch",
      Category: row.category || "general",
      Status: statusLabel(row.status),
      Feedback: row.feedback || "",
      Anonymous: isAnonymous(row) ? "Yes" : "No",
      "Created At": formatDate(row.createdAt),
      "Updated At": formatDate(row.updatedAt),
    })),
    [
      { wch: 6 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 56 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
    ],
  );

  addJsonSheet(
    workbook,
    "Group Analytics",
    [
      ...departmentStats.map((group) => ({
        Type: "Department",
        Name: group.name,
        "Feedback Count": group.count,
      })),
      ...branchStats.map((group) => ({
        Type: "Branch",
        Name: group.name,
        "Feedback Count": group.count,
      })),
    ],
    [{ wch: 16 }, { wch: 32 }, { wch: 18 }],
  );

  XLSX.writeFile(workbook, `employee-feedback-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
