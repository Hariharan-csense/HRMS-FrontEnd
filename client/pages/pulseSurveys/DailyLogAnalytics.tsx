import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar,
  Download,
  Filter,
  MessageSquare,
  Search,
  Star,
  User,
} from "lucide-react";

type SurveyRow = {
  id: number;
  title: string;
  createdAt: string;
  category?: "daily_log" | "survey";
};

type ResponseRow = {
  id: number;
  surveyId: number;
  employeeId: number;
  score: number;
  label: string;
  comment: string;
  respondedAt: string;
  employee?: {
    name?: string;
    email?: string;
  } | null;
};

type DailyLogRow = ResponseRow & {
  surveyTitle: string;
  dateKey: string;
  employeeName: string;
  employeeEmail: string;
};

const getDailyLogDate = (title: string, createdAt: string) => {
  const match = title.match(/daily log\s*-\s*(\d{4}-\d{2}-\d{2})/i);
  if (match?.[1]) return match[1];
  return new Date(createdAt).toISOString().slice(0, 10);
};

const formatScore = (value: number | null | undefined) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.0";
  return Math.max(0, Math.min(10, n)).toFixed(1);
};

const downloadExcel = async (rows: DailyLogRow[]) => {
  const headers = ["S.No", "Date", "Survey", "Employee ID", "Employee", "Email", "Score", "Mood", "Comment", "Submitted At"];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HRMS Employee Survey";
  const sheet = workbook.addWorksheet("Daily Log Report", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 2 }],
  });
  sheet.addRow(headers);
  rows.forEach((row, index) => sheet.addRow([
    index + 1, row.dateKey ? new Date(`${row.dateKey}T00:00:00`) : "", row.surveyTitle, row.employeeId, row.employeeName,
    row.employeeEmail, Number(row.score || 0), row.label || "-", row.comment || "-",
    row.respondedAt ? new Date(row.respondedAt) : "",
  ]));

  const headerRow = sheet.getRow(1);
  headerRow.height = 38;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F9F7A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  sheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    excelRow.height = 28;
    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD7E3E0" } },
        left: { style: "thin", color: { argb: "FFD7E3E0" } },
        bottom: { style: "thin", color: { argb: "FFD7E3E0" } },
        right: { style: "thin", color: { argb: "FFD7E3E0" } },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (rowNumber % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1FBF8" } };
    });
    const scoreCell = excelRow.getCell(7);
    const score = Number(scoreCell.value || 0);
    const scoreColor = score >= 8 ? "FFC6EFCE" : score >= 6 ? "FFFFF2CC" : score >= 4 ? "FFFFE0B2" : "FFFFC7CE";
    scoreCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: scoreColor } };
    scoreCell.font = { bold: true };
    scoreCell.numFmt = '0.0"/10"';
    excelRow.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: scoreColor } };
  });
  [8, 14, 24, 14, 24, 30, 12, 20, 48, 22].forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.getColumn(2).numFmt = "dd-mm-yyyy";
  sheet.getColumn(10).numFmt = "dd-mm-yyyy hh:mm AM/PM";
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: headers.length } };
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `Daily_Log_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

const DailyLogAnalytics: React.FC = () => {
  const [rows, setRows] = useState<DailyLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const surveyRes = await ENDPOINTS.getPulseAdminSurveys();
        const surveys: SurveyRow[] = Array.isArray(surveyRes.data)
          ? surveyRes.data
          : [];
        const dailySurveys = surveys.filter(
          (survey) =>
            survey.category === "daily_log" ||
            String(survey.title || "").toLowerCase().startsWith("daily log -"),
        );

        const responseGroups = await Promise.all(
          dailySurveys.map(async (survey) => {
            const res = await ENDPOINTS.getPulseAdminSurveyResponses(survey.id);
            const responses: ResponseRow[] = Array.isArray(res.data)
              ? res.data
              : [];
            const dateKey = getDailyLogDate(survey.title, survey.createdAt);
            return responses.map((response) => ({
              ...response,
              surveyTitle: survey.title,
              dateKey,
              employeeName:
                response.employee?.name?.trim() ||
                `Employee ${response.employeeId}`,
              employeeEmail: response.employee?.email || "",
            }));
          }),
        );

        if (!cancelled) {
          setRows(
            responseGroups
              .flat()
              .sort((a, b) =>
                String(b.respondedAt || "").localeCompare(
                  String(a.respondedAt || ""),
                ),
              ),
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Failed",
            description:
              e?.response?.data?.message ||
              e?.message ||
              "Failed to load daily logs",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const employees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    rows.forEach((row) => {
      map.set(String(row.employeeId), {
        id: String(row.employeeId),
        name: row.employeeName,
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (employeeFilter !== "all" && String(row.employeeId) !== employeeFilter) {
        return false;
      }
      if (fromDate && row.dateKey < fromDate) return false;
      if (toDate && row.dateKey > toDate) return false;
      if (!query) return true;
      return [
        row.employeeName,
        row.employeeEmail,
        row.label,
        row.comment,
        row.dateKey,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [employeeFilter, fromDate, rows, search, toDate]);

  const averageScore = filteredRows.length
    ? filteredRows.reduce((sum, row) => sum + Number(row.score || 0), 0) /
      filteredRows.length
    : 0;

  return (
    <Layout>
      <div className="pulse-theme min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Daily Log
                  </h1>
                  <p className="text-gray-600">
                    Employee-wise daily log responses
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              disabled={!filteredRows.length}
              onClick={() => void downloadExcel(filteredRows)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-100">
              <CardContent className="p-5 flex items-center gap-3">
                <User className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{employees.length}</p>
                  <p className="text-sm text-gray-500">Employees</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-100">
              <CardContent className="p-5 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-2xl font-bold">{filteredRows.length}</p>
                  <p className="text-sm text-gray-500">Filtered Logs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-100">
              <CardContent className="p-5 flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatScore(averageScore)}/10
                  </p>
                  <p className="text-sm text-gray-500">Average Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-xl bg-white/90">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Employee
                  </span>
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    From
                  </span>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">To</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name, email, comment"
                      className="pl-9"
                    />
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
                  <p className="text-gray-500">Loading daily logs...</p>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <MessageSquare className="h-12 w-12 text-gray-300" />
                  <h3 className="font-semibold text-gray-900">
                    No daily logs found
                  </h3>
                  <p className="text-sm text-gray-500">
                    Change the employee or date filter to view logs.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-max min-w-full text-sm">
                    <thead className="bg-emerald-50 text-gray-700">
                      <tr>
                        <th className="min-w-[130px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Date
                        </th>
                        <th className="min-w-[240px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Employee
                        </th>
                        <th className="min-w-[100px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Score
                        </th>
                        <th className="min-w-[150px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Mood
                        </th>
                        <th className="min-w-[320px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Comment
                        </th>
                        <th className="min-w-[210px] whitespace-nowrap px-5 py-3 text-left font-semibold">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRows.map((row) => (
                        <tr key={`${row.surveyId}-${row.id}`}>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-emerald-600" />
                              {row.dateKey}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">
                              {row.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {row.employeeEmail || "No email"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-emerald-700">
                              {formatScore(row.score)}/10
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {row.label ? (
                              <Badge className="bg-amber-100 text-amber-700 border-0">
                                {row.label}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4 max-w-md">
                            <p className="line-clamp-2 text-gray-700">
                              {row.comment || "-"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                            {row.respondedAt
                              ? new Date(row.respondedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DailyLogAnalytics;
