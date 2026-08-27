import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Download } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "sonner";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const amount = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function AttendanceMonthlyReport() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [loading, setLoading] = useState(false);
  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await ENDPOINTS.getAttendanceMonthlyReport(month);
      setRows(Array.isArray(response.data?.rows) ? response.data.rows : []);
    } catch (error: any) {
      setRows([]);
      toast.error(error.response?.data?.message || "Unable to load monthly report");
    } finally { setLoading(false); }
  };
  useEffect(() => { void loadReport(); }, [month]);
  const filteredRows = useMemo(() => selectedEmployee === "all" ? rows : rows.filter((row) => row.employeeId === selectedEmployee), [rows, selectedEmployee]);
  const summary = useMemo(() => ({
    employees: filteredRows.length,
    present: filteredRows.reduce((sum, row) => sum + Number(row.presentDays || 0), 0),
    leave: filteredRows.reduce((sum, row) => sum + Number(row.leaveTaken || 0), 0),
    lop: filteredRows.reduce((sum, row) => sum + Number(row.lopDays || 0), 0),
  }), [filteredRows]);

  const exportExcel = async () => {
    if (!filteredRows.length) return toast.error("No monthly attendance data to export");
    const data = filteredRows.map((row) => ({
      "Employee ID": row.employeeId, Employee: row.employeeName, Department: row.department,
      Designation: row.designation, DOJ: row.dateOfJoining ? new Date(row.dateOfJoining) : "",
      "Salary Type": row.salaryType, "Total Days": row.totalDays, "Working Days": row.workingDays,
      Holidays: row.holidayDays, "Present Days": row.presentDays, "Absent Days": row.absentDays,
      "LOP Days": row.lopDays, "Late Days": row.lateDays, "Leave Taken": row.leaveTaken,
      "Leave Balance": row.leaveBalance, "Payable Days": row.payableDays, "LOP Amount": row.lopAmount,
      "Monthly Salary / Hourly Gross": row.monthlySalary, Deductions: row.deductions,
      "Net Pay": row.netPay, "Payroll Status": row.payrollProcessed ? "Processed" : "Not Processed",
    }));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HRMS Attendance";
    const sheet = workbook.addWorksheet("Monthly Attendance Report", { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
    const headers = Object.keys(data[0]);
    sheet.addRow(headers);
    data.forEach((item) => sheet.addRow(headers.map((header) => (item as any)[header] ?? "")));
    sheet.getRow(1).height = 38;
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F9F7A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    const statusColumn = headers.indexOf("Payroll Status") + 1;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 24;
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.border = { top: { style: "thin", color: { argb: "FFD7E3E0" } }, left: { style: "thin", color: { argb: "FFD7E3E0" } }, bottom: { style: "thin", color: { argb: "FFD7E3E0" } }, right: { style: "thin", color: { argb: "FFD7E3E0" } } };
        cell.alignment = { vertical: "middle", wrapText: true };
        if (rowNumber % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1FBF8" } };
        if (["LOP Amount", "Monthly Salary / Hourly Gross", "Deductions", "Net Pay"].includes(headers[columnNumber - 1])) cell.numFmt = '₹#,##0.00';
      });
      const statusCell = row.getCell(statusColumn);
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: String(statusCell.value) === "Processed" ? "FFC6EFCE" : "FFFFEB9C" } };
      statusCell.font = { bold: true };
    });
    headers.forEach((header, index) => {
      const longest = data.reduce(
        (max, item) => Math.max(max, String((item as any)[header] ?? "").length),
        header.length,
      );
      sheet.getColumn(index + 1).width = Math.min(Math.max(longest + 2, 12), 28);
    });
    sheet.getColumn(headers.indexOf("DOJ") + 1).numFmt = "dd-mm-yyyy";
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: headers.length } };
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url; link.download = `Attendance_Monthly_Report_${month}.xlsx`; link.click(); URL.revokeObjectURL(url);
  };

  return <Layout><div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Monthly Attendance Report</h1><p className="text-sm text-muted-foreground">Attendance, leave, LOP and payroll summary by employee.</p></div><Button onClick={() => void exportExcel()} disabled={!filteredRows.length}><Download className="mr-2 h-4 w-4" />Export Excel</Button></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">Report Filters</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 md:flex-row"><Input className="max-w-xs" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><Select value={selectedEmployee} onValueChange={setSelectedEmployee}><SelectTrigger className="max-w-sm"><SelectValue placeholder="All employees" /></SelectTrigger><SelectContent><SelectItem value="all">All Employees</SelectItem>{rows.map((row) => <SelectItem key={row.employeeId} value={row.employeeId}>{row.employeeName} ({row.employeeId})</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => void loadReport()}>Refresh</Button></CardContent></Card>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Employees", summary.employees], ["Present Days", summary.present], ["Leave Days", summary.leave], ["LOP Days", summary.lop]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold text-emerald-700">{value}</p></CardContent></Card>)}</div>
    <Card><CardContent className="p-0"><Table className="w-max min-w-full"><TableHeader><TableRow className="bg-emerald-50"><TableHead className="min-w-[230px] whitespace-nowrap">Employee</TableHead><TableHead className="min-w-[160px] whitespace-nowrap">Department</TableHead><TableHead className="min-w-[110px] whitespace-nowrap">Working</TableHead><TableHead className="min-w-[110px] whitespace-nowrap">Present</TableHead><TableHead className="min-w-[100px] whitespace-nowrap">Leave</TableHead><TableHead className="min-w-[100px] whitespace-nowrap">Absent</TableHead><TableHead className="min-w-[90px] whitespace-nowrap">LOP</TableHead><TableHead className="min-w-[110px] whitespace-nowrap">Payable</TableHead><TableHead className="min-w-[140px] whitespace-nowrap">LOP Amount</TableHead><TableHead className="min-w-[120px] whitespace-nowrap">Net Pay</TableHead><TableHead className="min-w-[140px] whitespace-nowrap">Payroll</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={11} className="text-center">Loading...</TableCell></TableRow> : filteredRows.length ? filteredRows.map((row) => <TableRow key={row.employeeId}><TableCell className="whitespace-nowrap"><div className="font-medium">{row.employeeName}</div><div className="text-xs text-muted-foreground">{row.employeeId} · {row.designation || row.salaryType}</div></TableCell><TableCell className="whitespace-nowrap">{row.department || "-"}</TableCell><TableCell>{row.workingDays}</TableCell><TableCell className="bg-emerald-50 font-medium">{row.presentDays}</TableCell><TableCell className="bg-blue-50">{row.leaveTaken}</TableCell><TableCell>{row.absentDays}</TableCell><TableCell className="bg-red-50">{row.lopDays}</TableCell><TableCell>{row.payableDays}</TableCell><TableCell className="whitespace-nowrap">{amount(row.lopAmount)}</TableCell><TableCell className="whitespace-nowrap font-semibold">{amount(row.netPay)}</TableCell><TableCell className="whitespace-nowrap">{row.payrollProcessed ? "Processed" : "Not Processed"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={11} className="text-center">No monthly attendance records found</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
  </div></Layout>;
}
