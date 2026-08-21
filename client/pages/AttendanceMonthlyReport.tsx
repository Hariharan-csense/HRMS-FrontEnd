import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
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
      setRows(response.data?.rows || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to load monthly report");
    } finally { setLoading(false); }
  };
  useEffect(() => { loadReport(); }, [month]);
  const filteredRows = selectedEmployee === "all" ? rows : rows.filter((row) => row.employeeId === selectedEmployee);
  const exportExcel = () => {
    const data = filteredRows.map((row) => ({
      "Employee ID": row.employeeId, Employee: row.employeeName, "Salary Type": row.salaryType,
      "Present Days": row.presentDays, "Absent Days": row.absentDays, "LOP Days": row.lopDays,
      "LOP Amount": row.lopAmount, "Leave Taken": row.leaveTaken,
      "Monthly Salary / Hourly Gross": row.monthlySalary, Deductions: row.deductions, "Net Pay": row.netPay,
      "Payroll Status": row.payrollProcessed ? "Processed" : "Not Processed",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance Report");
    XLSX.writeFile(workbook, `Attendance_Monthly_Report_${month}.xlsx`);
  };
  return <Layout><div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Monthly Attendance Report</h1><p className="text-sm text-muted-foreground">Attendance, leave, LOP and payroll summary by employee.</p></div><Button onClick={exportExcel} disabled={!rows.length}><Download className="mr-2 h-4 w-4" />Export Excel</Button></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">Report Filters</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 md:flex-row"><Input className="max-w-xs" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><Select value={selectedEmployee} onValueChange={setSelectedEmployee}><SelectTrigger className="max-w-sm"><SelectValue placeholder="All employees" /></SelectTrigger><SelectContent><SelectItem value="all">All Employees</SelectItem>{rows.map((row) => <SelectItem key={row.employeeId} value={row.employeeId}>{row.employeeName} ({row.employeeId})</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={loadReport}>Refresh</Button></CardContent></Card>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>LOP Days</TableHead><TableHead>LOP Amount</TableHead><TableHead>Leave Taken</TableHead><TableHead>Monthly Salary / Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={9} className="text-center">Loading...</TableCell></TableRow> : filteredRows.length ? filteredRows.map((row) => <TableRow key={row.employeeId}><TableCell><div className="font-medium">{row.employeeName}</div><div className="text-xs text-muted-foreground">{row.employeeId} · {row.salaryType}</div></TableCell><TableCell>{row.presentDays}</TableCell><TableCell>{row.absentDays}</TableCell><TableCell>{row.lopDays}</TableCell><TableCell>{amount(row.lopAmount)}</TableCell><TableCell>{row.leaveTaken}</TableCell><TableCell>{amount(row.monthlySalary)}</TableCell><TableCell>{amount(row.deductions)}</TableCell><TableCell className="font-semibold">{amount(row.netPay)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={9} className="text-center">No matching employee found</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
  </div></Layout>;
}
