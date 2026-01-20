import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { useRole } from "@/context/RoleContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BASE_URL } from "@/lib/endpoint";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, DollarSign, FileText, Download } from "lucide-react";
import { mockEmployees } from "@/lib/employees";
import { calculatePayableDays, getDefaultPayableDays } from "@/lib/payrollUtils";
import ENDPOINTS from "@/lib/endpoint";
import { toast } from "sonner";
import employeeApi from "@/components/helper/employee/employee";
import payrollApi, { SalaryStructure } from "@/components/helper/payroll/payroll";
import axios from "axios";

// Types
interface PayrollProcessing {
  id: string;
  employeeId: string;
  employeeName: string;
  reportingManager?: string;
  month: string;
  payableDays: number;
  lopAmount: number;
  gross: number;
  deductions: number;
  net: number;
  status: "draft" | "final" | "paid" | "processed";
  createdAt: string;
}

interface Payslip {
  id: string;
  number?: string;
  employeeId: string;
  employeeName: string;
  reportingManager?: string;
  month: string;
  payableDays?: number;
  lopAmount?: number;
  gross: number;
  deductions: number;
  net: number;
  status: "draft" | "final" | "paid" | "processed";
  pdfUrl?: string;
  generatedOn?: string;
  createdAt: string;
}

// Mock Attendance Data for payable days calculation
const mockAttendanceRecords = [
  // EMP001 - April 2024
  { id: "ATT001", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-01", status: "present" as const, hoursWorked: 9 },
  { id: "ATT002", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-02", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT003", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-03", status: "half" as const, hoursWorked: 4 },
  { id: "ATT004", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-04", status: "present" as const, hoursWorked: 9 },
  { id: "ATT005", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-05", status: "present" as const, hoursWorked: 8 },
  { id: "ATT006", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-08", status: "present" as const, hoursWorked: 9 },
  { id: "ATT007", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-09", status: "present" as const, hoursWorked: 9 },
  { id: "ATT008", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-10", status: "absent" as const, hoursWorked: 0 },
  { id: "ATT009", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-11", status: "present" as const, hoursWorked: 8 },
  { id: "ATT010", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-12", status: "present" as const, hoursWorked: 9 },
  { id: "ATT011", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-15", status: "present" as const, hoursWorked: 9 },
  { id: "ATT012", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-16", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT013", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-17", status: "present" as const, hoursWorked: 9 },
  { id: "ATT014", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-18", status: "half" as const, hoursWorked: 4 },
  { id: "ATT015", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-19", status: "present" as const, hoursWorked: 9 },
  { id: "ATT016", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-22", status: "present" as const, hoursWorked: 8 },
  { id: "ATT017", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-23", status: "present" as const, hoursWorked: 9 },
  { id: "ATT018", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-24", status: "present" as const, hoursWorked: 9 },
  { id: "ATT019", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-25", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT020", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-26", status: "present" as const, hoursWorked: 9 },
  { id: "ATT021", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-29", status: "present" as const, hoursWorked: 9 },
  { id: "ATT022", employeeId: "EMP001", employeeName: "John Doe", date: "2024-04-30", status: "present" as const, hoursWorked: 8 },

  // EMP002 - April 2024
  { id: "ATT023", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-01", status: "present" as const, hoursWorked: 9 },
  { id: "ATT024", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-02", status: "present" as const, hoursWorked: 9 },
  { id: "ATT025", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-03", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT026", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-04", status: "present" as const, hoursWorked: 9 },
  { id: "ATT027", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-05", status: "present" as const, hoursWorked: 9 },
  { id: "ATT028", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-08", status: "present" as const, hoursWorked: 9 },
  { id: "ATT029", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-09", status: "present" as const, hoursWorked: 8 },
  { id: "ATT030", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-10", status: "present" as const, hoursWorked: 9 },
  { id: "ATT031", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-11", status: "half" as const, hoursWorked: 4 },
  { id: "ATT032", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-12", status: "present" as const, hoursWorked: 9 },
  { id: "ATT033", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-15", status: "present" as const, hoursWorked: 9 },
  { id: "ATT034", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-16", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT035", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-17", status: "present" as const, hoursWorked: 9 },
  { id: "ATT036", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-18", status: "present" as const, hoursWorked: 9 },
  { id: "ATT037", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-19", status: "present" as const, hoursWorked: 8.5 },
  { id: "ATT038", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-22", status: "present" as const, hoursWorked: 9 },
  { id: "ATT039", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-23", status: "present" as const, hoursWorked: 9 },
  { id: "ATT040", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-24", status: "present" as const, hoursWorked: 9 },
  { id: "ATT041", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-25", status: "present" as const, hoursWorked: 8 },
  { id: "ATT042", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-26", status: "present" as const, hoursWorked: 9 },
  { id: "ATT043", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-29", status: "present" as const, hoursWorked: 9 },
  { id: "ATT044", employeeId: "EMP002", employeeName: "Sarah Smith", date: "2024-04-30", status: "present" as const, hoursWorked: 9 },
];

// Mock Data
const mockSalaryStructures: SalaryStructure[] = [
  {
    id: "SS001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    basic: 50000,
    hra: 10000,
    allowances: 5000,
    incentives: 3000,
    gross: 68000,
    pf: 5400,
    esi: 0,
    pt: 200,
    tds: 5000,
    otherDeductions: 500,
    createdAt: "2024-01-01",
  },
  {
    id: "SS002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    basic: 60000,
    hra: 12000,
    allowances: 6000,
    incentives: 4000,
    gross: 82000,
    pf: 6480,
    esi: 0,
    pt: 200,
    tds: 6500,
    otherDeductions: 600,
    createdAt: "2024-01-01",
  },
];

const mockPayrollProcessing: PayrollProcessing[] = [
  {
    id: "PP001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-04",
    payableDays: 30,
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "paid",
    createdAt: "2024-04-01",
  },
  {
    id: "PP002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-04",
    payableDays: 30,
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "final",
    createdAt: "2024-04-01",
  },
  {
    id: "PP003",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-05",
    payableDays: 30,
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "paid",
    createdAt: "2024-05-01",
  },
  {
    id: "PP004",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-05",
    payableDays: 30,
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "paid",
    createdAt: "2024-05-01",
  },
  {
    id: "PP005",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-06",
    payableDays: 30,
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "final",
    createdAt: "2024-06-01",
  },
  {
    id: "PP006",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-06",
    payableDays: 30,
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "final",
    createdAt: "2024-06-01",
  },
  {
    id: "PP007",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-07",
    payableDays: 30,
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "draft",
    createdAt: "2024-07-01",
  },
  {
    id: "PP008",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-07",
    payableDays: 30,
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "draft",
    createdAt: "2024-07-01",
  },
];

const mockPayslips: Payslip[] = [
  {
    id: "PS001",
    number: "PS/2024-04/001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-04",
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "paid" as const,
    pdfUrl: "/payslips/PS-2024-04-001.pdf",
    generatedOn: "2024-04-01",
    createdAt: "2024-04-01",
  },
  {
    id: "PS002",
    number: "PS/2024-04/002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-04",
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "paid" as const,
    pdfUrl: "/payslips/PS-2024-04-002.pdf",
    generatedOn: "2024-04-01",
    createdAt: "2024-04-01",
  },
  {
    id: "PS003",
    number: "PS/2024-05/001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-05",
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "paid" as const,
    pdfUrl: "/payslips/PS-2024-05-001.pdf",
    generatedOn: "2024-05-01",
    createdAt: "2024-05-01",
  },
  {
    id: "PS004",
    number: "PS/2024-05/002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-05",
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "paid" as const,
    pdfUrl: "/payslips/PS-2024-05-002.pdf",
    generatedOn: "2024-05-01",
    createdAt: "2024-05-01",
  },
  {
    id: "PS005",
    number: "PS/2024-06/001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-06",
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "final" as const,
    pdfUrl: "/payslips/PS-2024-06-001.pdf",
    generatedOn: "2024-06-01",
    createdAt: "2024-06-01",
  },
  {
    id: "PS006",
    number: "PS/2024-06/002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-06",
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "final" as const,
    pdfUrl: "/payslips/PS-2024-06-002.pdf",
    generatedOn: "2024-06-01",
    createdAt: "2024-06-01",
  },
  {
    id: "PS007",
    number: "PS/2024-07/001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    reportingManager: "Michael Manager",
    month: "2024-07",
    gross: 68000,
    deductions: 11100,
    net: 56900,
    status: "draft" as const,
    pdfUrl: "/payslips/PS-2024-07-001.pdf",
    generatedOn: "2024-07-01",
    createdAt: "2024-07-01",
  },
  {
    id: "PS008",
    number: "PS/2024-07/002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    reportingManager: "Michael Manager",
    month: "2024-07",
    gross: 82000,
    deductions: 13380,
    net: 68620,
    status: "draft" as const,
    pdfUrl: "/payslips/PS-2024-07-002.pdf",
    generatedOn: "2024-07-01",
    createdAt: "2024-07-01",
  },
];

export default function PayrollSetup() {
  const location = useLocation();
  const { user } = useAuth();
  const { hasSubModuleAccess } = useRole();
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [payrollProcessing, setPayrollProcessing] = useState<PayrollProcessing[]>(mockPayrollProcessing);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewPayslipOpen, setIsViewPayslipOpen] = useState(false);
  const [payslipPreviewHtml, setPayslipPreviewHtml] = useState<string | null>(null);

  const payslipStyles = `
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        padding: 20px;
        min-height: 100vh;
      }
      
      .payslip-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      .payslip-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        position: relative;
      }
      
      .payslip-header::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .payslip-header h1 {
        margin: 0;
        font-size: 2.5em;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      
      .payslip-header .subtitle {
        font-size: 1.2em;
        opacity: 0.9;
        margin-top: 10px;
      }
      
      .payslip-content {
        padding: 40px;
      }
      
      .section {
        margin-bottom: 40px;
        padding: 25px;
        border-radius: 15px;
        background: #f8f9ff;
        border-left: 5px solid #667eea;
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
        transition: transform 0.3s ease;
      }
      
      .section:hover {
        transform: translateY(-5px);
      }
      
      .section-title {
        color: #667eea;
        font-size: 1.4em;
        font-weight: 600;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
      }
      
      .section-title::before {
        content: '';
        width: 30px;
        height: 3px;
        background: #667eea;
        margin-right: 15px;
        border-radius: 2px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .info-item {
        background: white;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }
      
      .info-item:hover {
        border-color: #667eea;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      }
      
      .info-label {
        font-size: 0.9em;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-value {
        font-size: 1.1em;
        color: #1e293b;
        font-weight: 600;
      }
      
      .salary-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 25px;
      }
      
      .earnings, .deductions {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
      }
      
      .earnings {
        border-top: 4px solid #10b981;
      }
      
      .deductions {
        border-top: 4px solid #ef4444;
      }
      
      .salary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.3s ease;
      }
      
      .salary-item:hover {
        background: #f8fafc;
      }
      
      .salary-item:last-child {
        border-bottom: none;
      }
      
      .salary-label {
        color: #64748b;
        font-weight: 500;
      }
      
      .salary-value {
        font-weight: 700;
        font-size: 1.1em;
      }
      
      .earnings .salary-value {
        color: #10b981;
      }
      
      .deductions .salary-value {
        color: #ef4444;
      }
      
      .total-section {
        margin-top: 30px;
        padding: 25px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 12px 24px rgba(0,0,0,0.1);
      }
      
      .gross-total {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      
      .net-total {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }
      
      .total-label {
        font-size: 1.2em;
        margin-bottom: 10px;
        opacity: 0.9;
      }
      
      .total-amount {
        font-size: 2.2em;
        font-weight: 800;
        margin: 0;
      }
      
      .attendance-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .attendance-item {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        transition: all 0.3s ease;
      }
      
      .attendance-item:hover {
        border-color: #667eea;
        transform: scale(1.05);
      }
      
      .attendance-number {
        font-size: 2em;
        font-weight: 700;
        color: #667eea;
        display: block;
        margin-bottom: 8px;
      }
      
      .attendance-label {
        color: #64748b;
        font-size: 0.9em;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        .payslip-content {
          padding: 20px;
        }
        
        .info-grid {
          grid-template-columns: 1fr;
        }
        
        .salary-breakdown {
          grid-template-columns: 1fr;
        }
        
        .attendance-summary {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `;
  const [activeTab, setActiveTab] = useState("structure");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPayslipId, setViewingPayslipId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Updated to include name field for display
  const [employees, setEmployees] = useState<Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
  }>>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  

  // Fetch attendance data when employee and month are selected
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!formData.employeeId || !formData.month) return;
      
      try {
        const result = await payrollApi.getAttendance(formData.employeeId, formData.month);
        if (result.data) {
          setAttendanceData(result.data);
          // Calculate payable days from real attendance
          const presentDays = result.data.filter((record: any) => 
            record.status === 'present'
          ).length;
          
          const halfDays = result.data.filter((record: any) => 
            record.status === 'half'
          ).length * 0.5;
          
          const payableDays = presentDays + halfDays;
          setFormData(prev => ({ ...prev, payableDays }));
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    fetchAttendanceData();
  }, [formData.employeeId, formData.month]);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const response = await employeeApi.getEmployees();
        console.log('Raw employee data:', response); // Debug log
        
        // The employeeApi returns { data: employeesArray } format
        const employeesData = response.data || [];
        
        console.log('Employees data from API:', employeesData);
        
        // Transform the employee data to match the expected format
        const formattedEmployees = employeesData.map(emp => {
          console.log('Processing employee:', emp);
          
          // Use employee_id from the API response
          const employeeId = emp.employee_id || emp.id || '';
          
          // Handle first_name and last_name from the API response
          const firstName = emp.first_name || '';
          const lastName = emp.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim() || `Employee ${employeeId}`;
          
          return {
            id: employeeId,
            name: fullName,
            firstName: firstName,
            lastName: lastName
          };
        });
        
        console.log('Formatted employees:', formattedEmployees);
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  // Check which payroll sub-modules user has access to
  const canViewSalaryStructure = user && user.roles.some((role) =>
    !hasRole(user, "employee") // Only non-employees can view salary structure
  );

  const canViewProcessPayroll = user && user.roles.some((role) =>
    hasRole(user, "admin") || hasRole(user, "finance") // Only admin and finance can process payroll
  );

  const canViewPayslips = user && user.roles.some((role) =>
    hasSubModuleAccess(role, "payroll", "payslips")
  );






  // Fetch salary structures on component mount
  useEffect(() => {
    const fetchSalaryStructures = async () => {
      if (!canViewSalaryStructure) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await payrollApi.getSalaryStructures();
        if (result.data) {
          setSalaryStructures(result.data);
        } else if (result.error) {
          setError(result.error);
          // Fallback to mock data in case of error
          setSalaryStructures(mockSalaryStructures);
        }
      } catch (err) {
        console.error('Error fetching salary structures:', err);
        setError('Failed to fetch salary structures. Using mock data instead.');
        // Fallback to mock data in case of error
        setSalaryStructures(mockSalaryStructures);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryStructures();
  }, [canViewSalaryStructure]);

  // Detect route and set active tab
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.includes("/payslips") && canViewPayslips) {
      setActiveTab("payslips");
    } else if (pathname.includes("/process") && canViewProcessPayroll) {
      setActiveTab("processing");
    } else if (pathname.includes("/structure") && canViewSalaryStructure) {
      setActiveTab("structure");
    } else {
      // Set to first available tab
      if (canViewSalaryStructure) {
        setActiveTab("structure");
      } else if (canViewProcessPayroll) {
        setActiveTab("processing");
      } else if (canViewPayslips) {
        setActiveTab("payslips");
      }
    }
  }, [location.pathname, canViewSalaryStructure, canViewProcessPayroll, canViewPayslips]);

  // Fetch payslips when payslips tab is active
  useEffect(() => {
    const fetchPayslips = async () => {
      if (activeTab !== "payslips") return;
      
      console.log('Fetching payslips for payslips tab...');
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await payrollApi.getPayslip();
        console.log('API result:', result);
        
        if (result.data) {
          console.log('Setting payslips with API data:', result.data);
          setPayslips(result.data);
        } else if (result.error) {
          console.log('API error:', result.error);
          setError(result.error);
          // Fallback to mock data in case of error
          setPayslips(mockPayslips);
        }
      } catch (err) {
        console.error('Error fetching payslips:', err);
        setError('Failed to fetch payslips. Using mock data instead.');
        // Fallback to mock data in case of error
        setPayslips(mockPayslips);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
  }, [activeTab, canViewPayslips]);

  // Additional effect to fetch payslips specifically for payslips tab
  useEffect(() => {
    if (activeTab === "payslips" && canViewPayslips) {
      const fetchPayslipsData = async () => {
        console.log('Fetching payslips data for employee...');
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await payrollApi.getPayslip();
          console.log('Payslips API result:', result);
          
          if (result.data) {
            console.log('Setting payslips with API data:', result.data);
            setPayslips(result.data);
          } else if (result.error) {
            console.log('API error:', result.error);
            setError(result.error);
            // Fallback to mock data in case of error
            setPayslips(mockPayslips);
          }
        } catch (err) {
          console.error('Error fetching payslips:', err);
          setError('Failed to fetch payslips. Using mock data instead.');
          // Fallback to mock data in case of error
          setPayslips(mockPayslips);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPayslipsData();
    }
  }, [activeTab, canViewPayslips]);

  // Fetch payroll processing data when processing tab is active
  useEffect(() => {
    const fetchPayrollProcessing = async () => {
      if (activeTab !== "processing") return;
      
      console.log('Fetching payroll processing for processing tab...');
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await payrollApi.getPayrollProcessing();
        console.log('Payroll processing API result:', result);
        
        if (result.data) {
          console.log('Setting payroll processing with API data:', result.data);
          setPayrollProcessing(result.data);
        } else if (result.error) {
          console.log('API error:', result.error);
          setError(result.error);
          // Fallback to mock data in case of error
          setPayrollProcessing(mockPayrollProcessing);
        }
      } catch (err) {
        console.error('Error fetching payroll processing:', err);
        setError('Failed to fetch payroll processing. Using mock data instead.');
        // Fallback to mock data in case of error
        setPayrollProcessing(mockPayrollProcessing);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayrollProcessing();
  }, [activeTab, canViewProcessPayroll]);

  // Filter functions
  const filteredStructures = useMemo(() => {
    let filtered = salaryStructures;

    // Apply role-based filtering
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      // Employees see only their own salary structure
      filtered = filtered.filter((s) => s.employeeId === user?.id);
    } else if (hasRole(user, "manager")) {
      // Managers see their own and their team's salary structures
      // Note: This assumes user.id is available and matches employeeId
      filtered = filtered.filter(
        (s) =>
          s.employeeId === user?.id || // Own salary
          s.reportingManager === user?.id // Team salary
      );
    }
    // Admins and HR see all

    // Apply search filter
    return filtered.filter((s) => {
      if (!searchTerm) return true;
      return s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.month.includes(searchTerm);
    });
  }, [salaryStructures, searchTerm, user]);

  const filteredPayslips = useMemo(() => {
    let filtered = payslips;
    
    console.log('Original payslips:', payslips);
    console.log('User object:', user);
    console.log('User ID type and value:', typeof user?.id, user?.id);
    
    // Apply role-based filtering
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      // Employees see only their own payslips - compare by employeeId instead of name
      console.log('Comparing payslip employeeId with user ID:');
      payslips.forEach(p => {
        console.log(`Payslip employeeId: ${p.employeeId} (type: ${typeof p.employeeId}), User ID: ${user?.id} (type: ${typeof user?.id}), Match: ${p.employeeId === user?.id?.toString()}`);
      });
      
      filtered = filtered.filter((p) => p.employeeId === user?.id?.toString());
      console.log('After employee filtering:', filtered);
    } else if (hasRole(user, "manager")) {
      // Managers see their own and their team's payslips
      filtered = filtered.filter(
        (p) =>
          p.employeeId === user?.id?.toString() || // Own payslips
          p.reportingManager === user?.name // Team payslips
      );
      console.log('After manager filtering:', filtered);
    }
    // Admins and HR see all

    // Apply search filter
    const finalFiltered = filtered.filter((p) => 
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.month.includes(searchTerm)
    );
    console.log('After search filtering:', finalFiltered);
    
    return finalFiltered;
  }, [payslips, searchTerm, user]);

  const filteredProcessing = useMemo(() => {
    let filtered = payrollProcessing;
    
    // Apply role-based filtering
    if (hasRole(user, "employee") && !hasRole(user, "manager")) {
      // Employees see only their own payroll processing
      filtered = filtered.filter((p) => p.employeeId === user?.id);
    } else if (hasRole(user, "manager")) {
      // Managers see their own and their team's payroll processing
      filtered = filtered.filter(
        (p) =>
          p.employeeId === user?.id || // Own payroll
          p.reportingManager === user?.id // Team payroll
      );
    }
    // Admins and HR see all

    // Apply search filter
    return filtered.filter((p) => {
      if (!searchTerm) return true;
      return p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             p.month.includes(searchTerm);
    });
  }, [payrollProcessing, searchTerm, user]);

  // Check if payroll already exists for selected employee and month
  const isPayrollProcessed = (employeeId: string, month: string) => {
    return payslips.some(payroll => 
      payroll.employeeId === employeeId && payroll.month === month
    );
  };

  // Process payroll function
  const handleProcessPayroll = async () => {
    if (!formData.employeeId || !formData.month) {
      toast.error("Please select employee and month");
      return;
    }

    setLoading(true); // Set loading immediately
    try {
      const api = axios.create({
        baseURL: `${BASE_URL}/api`,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      // Attach token dynamically
      api.interceptors.request.use((config) => {
        const token = localStorage.getItem("accessToken"); 
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      const requestData = {
        employee_id: formData.employeeId,
        month: formData.month
      };

      console.log('Sending request data:', requestData);

      const response = await api.post("/payroll/process", requestData);

      if (response.data.success) {
        toast.success("Payroll processed successfully");
        // Refresh the payslips data
        const result = await payrollApi.getPayslip();
        if (result.data) {
          setPayslips(result.data);
        }
        // Reset form
        setFormData({ employeeId: "", month: "" });
      } else {
        toast.error(response.data.message || "Failed to process payroll");
      }
    } catch (error: any) {
      console.error('Error processing payroll:', error);
      toast.error(error.response?.data?.message || "Failed to process payroll");
    } finally {
      setLoading(false); // Set loading to false when complete
    }
  };

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    console.log('Current employees state:', employees); // Debug log
    console.log('Opening dialog for item:', item);
    
    if (item) {
      setEditingId(item.id);
      console.log('Editing item:', item);
      console.log('Item employeeId:', item.employeeId);
      console.log('Item employeeName:', item.employeeName);
      
      // Find the employee in the employees list to get full details
      const employee = employees.find(emp => emp.id === item.employeeId);
      console.log('Found employee:', employee);
      
      // Use the employeeName from the item directly, or construct it from employees list
      const employeeName = item.employeeName || 
                         (employee ? `${employee.firstName} ${employee.lastName}`.trim() : '') ||
                         `Employee ${item.employeeId}`;
      
      console.log('Final employeeName:', employeeName);
      
      setFormData({ 
        ...item,
        // Ensure employeeId is set for the select component
        employeeId: item.employeeId || '',
        // Set the employee name for display
        employeeName: employeeName
      });
    } else {
      setEditingId(null);
      // Initialize with empty values for new entry
      setFormData({
        employeeId: "",
        employeeName: "",
        basic: "",
        hra: "",
        allowances: "",
        incentives: "",
        gross: "",
        pf: "",
        esi: "",
        pt: "",
        tds: "",
        otherDeductions: "",
        reportingManager: ""
      });
    }
    setIsDialogOpen(true);
  };

  const calculateGross = (basic: number, hra: number, allowances: number, incentives: number) => {
    return basic + hra + allowances + incentives;
  };

  const calculateTotalDeductions = (pf: number, esi: number, pt: number, tds: number, other: number) => {
    return pf + esi + pt + tds + other;
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('formData:', formData);
    console.log('formData.employeeId:', formData.employeeId);
    console.log('formData.employeeName:', formData.employeeName);
    
    if (!formData.employeeId || !formData.employeeName) {
      toast.error("Please select an employee");
      return;
    }

    if (activeTab === "structure") {
      const gross = calculateGross(
        formData.basic || 0,
        formData.hra || 0,
        formData.allowances || 0,
        formData.incentives || 0
      );
      
      const salaryData = {
        ...formData,
        gross,
        // Transform frontend field names to backend field names
        employee_id: formData.employeeId,
        other_deductions: formData.otherDeductions,
      };

      try {
        if (editingId) {
          // Update existing salary structure
          const result = await payrollApi.updateSalaryStructure(editingId, salaryData);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Salary structure updated successfully");
          setSalaryStructures((prev) =>
            prev.map((s) => (s.id === editingId ? { ...formData, gross } : s))
          );
        } else {
          // Create new salary structure
          const result = await payrollApi.createSalaryStructure(salaryData);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Salary structure created successfully");
          setSalaryStructures((prev) => [
            ...prev,
            {
              id: result.data?.id || `SS${String(prev.length + 1).padStart(3, "0")}`,
              ...formData,
              gross,
              createdAt: new Date().toISOString().split("T")[0],
            },
          ]);
        }
      } catch (error) {
        console.error('Error saving salary structure:', error);
        toast.error("Failed to save salary structure");
        // Fallback to local state update
        if (editingId) {
          setSalaryStructures((prev) =>
            prev.map((s) => (s.id === editingId ? { ...formData, gross } : s))
          );
        } else {
          setSalaryStructures((prev) => [
            ...prev,
            {
              id: `SS${String(prev.length + 1).padStart(3, "0")}`,
              ...formData,
              gross,
              createdAt: new Date().toISOString().split("T")[0],
            },
          ]);
        }
      }
    } else if (activeTab === "processing") {
      const deductions = calculateTotalDeductions(
        formData.pf || 0,
        formData.esi || 0,
        formData.pt || 0,
        formData.tds || 0,
        formData.otherDeductions || 0
      );
      const net = (formData.gross || 0) - deductions;
      if (editingId) {
        setPayrollProcessing((prev) =>
          prev.map((p) => (p.id === editingId ? { ...formData, deductions, net } : p))
        );
      } else {
        setPayrollProcessing((prev) => [
          ...prev,
          {
            id: `PP${String(prev.length + 1).padStart(3, "0")}`,
            ...formData,
            deductions,
            net,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
      }
    } else if (activeTab === "payslips") {
      const number = `PS/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(payslips.length + 1).padStart(3, "0")}`;
      if (editingId) {
        setPayslips((prev) =>
          prev.map((p) => (p.id === editingId ? { ...formData, number } : p))
        );
      } else {
        setPayslips((prev) => [
          ...prev,
          {
            id: `PS${String(prev.length + 1).padStart(3, "0")}`,
            ...formData,
            number,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (activeTab === "structure") {
      try {
        if (deleteId) {
          const result = await payrollApi.deleteSalaryStructure(deleteId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Salary structure deleted successfully");
        }
        setSalaryStructures((prev) => prev.filter((s) => s.id !== deleteId));
      } catch (error) {
        console.error('Error deleting salary structure:', error);
        toast.error("Failed to delete salary structure");
        // Still remove from local state even if API fails
        setSalaryStructures((prev) => prev.filter((s) => s.id !== deleteId));
      }
    } else if (activeTab === "processing") {
      setPayrollProcessing((prev) => prev.filter((p) => p.id !== deleteId));
    } else if (activeTab === "payslips") {
      setPayslips((prev) => prev.filter((p) => p.id !== deleteId));
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-1 md:gap-2">
            <DollarSign className="w-6 md:w-8 h-6 md:h-8 text-primary flex-shrink-0" />
            <span>Payroll Management</span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Manage salary structures, process payroll, and generate payslips</p>
        </div>

        {/* Search Card - Removed for responsiveness */}
        {/* <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-xs md:text-sm h-9 md:h-10"
                  />
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2 h-9 md:h-10 text-xs md:text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </CardContent>
          </Card> */}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full gap-2 bg-muted p-1 ${
            canViewSalaryStructure && canViewProcessPayroll && canViewPayslips ? 'grid-cols-3' :
            (canViewSalaryStructure || canViewProcessPayroll || canViewPayslips) &&
            ((canViewSalaryStructure && canViewProcessPayroll) ||
             (canViewSalaryStructure && canViewPayslips) ||
             (canViewProcessPayroll && canViewPayslips)) ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            {canViewSalaryStructure && <TabsTrigger value="structure" className="text-xs md:text-sm">Salary Structure</TabsTrigger>}
            {canViewProcessPayroll && <TabsTrigger value="processing" className="text-xs md:text-sm">Processing</TabsTrigger>}
            {canViewPayslips && <TabsTrigger value="payslips" className="text-xs md:text-sm">Payslips</TabsTrigger>}
          </TabsList>

          {/* Salary Structure Tab */}
          {canViewSalaryStructure && (
          <TabsContent value="structure">
            <Card>
              <CardContent className="pt-4 md:pt-6 px-0 md:px-6">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Salary Structures</h2>
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#17c491] hover:bg-[#15b381] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Salary Structure
                  </Button>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredStructures.map((struct) => {
                    const totalDeductions = struct.pf + struct.esi + struct.pt + struct.tds + struct.otherDeductions;
                    return (
                      <div key={struct.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-bold text-base text-slate-900">{struct.employeeName}</p>
                            <p className="text-xs text-slate-600 mt-1">ID: {struct.employeeId}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDialog(struct)}
                              className="p-2 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(struct.id)}
                              className="p-2 hover:bg-red-200 text-red-700 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Basic:</span>
                            <span className="font-semibold text-slate-900">₹{struct.basic.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">HRA:</span>
                            <span className="font-semibold text-slate-900">₹{struct.hra.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Allowances:</span>
                            <span className="font-semibold text-slate-900">₹{struct.allowances.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Incentives:</span>
                            <span className="font-semibold text-slate-900">₹{struct.incentives.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between bg-blue-50 -mx-4 px-4 py-2">
                            <span className="font-bold text-slate-900">Gross:</span>
                            <span className="font-bold text-slate-900">₹{struct.gross.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Deductions:</span>
                            <span className="font-semibold text-slate-900">₹{totalDeductions.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block w-full overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100">
                        <th className="text-left px-6 py-4 font-bold text-slate-900">Employee</th>
                        <th className="text-right px-4 py-4 font-bold text-slate-900">Basic</th>
                        <th className="text-right px-4 py-4 font-bold text-slate-900">HRA</th>
                        <th className="hidden lg:table-cell text-right px-4 py-4 font-bold text-slate-900">Allowances</th>
                        <th className="hidden lg:table-cell text-right px-4 py-4 font-bold text-slate-900">Incentives</th>
                        <th className="text-right px-4 py-4 font-bold text-slate-900">Gross</th>
                        <th className="text-right px-4 py-4 font-bold text-slate-900">Deductions</th>
                        <th className="text-center px-4 py-4 font-bold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStructures.map((struct) => {
                        const totalDeductions = struct.pf + struct.esi + struct.pt + struct.tds + struct.otherDeductions;
                        return (
                          <tr key={struct.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{struct.employeeName}</td>
                            <td className="px-4 py-4 text-slate-700 text-right">₹{struct.basic.toLocaleString()}</td>
                            <td className="px-4 py-4 text-slate-700 text-right">₹{struct.hra.toLocaleString()}</td>
                            <td className="hidden lg:table-cell px-4 py-4 text-slate-700 text-right">₹{struct.allowances.toLocaleString()}</td>
                            <td className="hidden lg:table-cell px-4 py-4 text-slate-700 text-right">₹{struct.incentives.toLocaleString()}</td>
                            <td className="px-4 py-4 text-slate-900 text-right font-bold bg-blue-100">₹{struct.gross.toLocaleString()}</td>
                            <td className="px-4 py-4 text-slate-900 text-right font-bold bg-orange-100">₹{totalDeductions.toLocaleString()}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleOpenDialog(struct)}
                                  className="p-2 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(struct.id)}
                                  className="p-2 hover:bg-red-200 text-red-700 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Processing Tab */}
          {canViewProcessPayroll && (
          <TabsContent value="processing">
            <Card>
              <CardContent className="pt-4 md:pt-6 px-0 md:px-6">
                {/* Process Payroll Form */}
                <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900">Process Payroll</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employee-select">Employee *</Label>
                      <Select
                        value={formData.employeeId || ""}
                        onValueChange={(employeeId) => {
                          console.log('Employee selected:', employeeId);
                          setFormData({ ...formData, employeeId });
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month-input">Month *</Label>
                      <Input
                        id="month-input"
                        type="month"
                        value={formData.month || ""}
                        onChange={(e) => {
                          console.log('Month selected:', e.target.value);
                          setFormData({ ...formData, month: e.target.value });
                        }}
                        className="mt-2"
                        placeholder="YYYY-MM"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleProcessPayroll}
                        className="w-full gap-2 h-10"
                        disabled={!formData.employeeId || !formData.month || isPayrollProcessed(formData.employeeId, formData.month) || loading}
                      >
                        <Plus className="w-4 h-4" />
                        {loading ? "Sending..." : "Process Payroll"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredProcessing.map((process) => {
                    return (
                      <div key={process.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-bold text-base text-slate-900">{process.employeeName}</p>
                            <p className="text-xs text-slate-600 mt-1">{process.month}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDialog(process)}
                              className="p-2 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(process.id)}
                              className="p-2 hover:bg-red-200 text-red-700 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Payable Days:</span>
                            <span className="font-semibold text-slate-900">{process.payableDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">LOP Amount:</span>
                            <span className={`font-semibold ${process.lopAmount > 0 ? "text-red-600" : "text-green-600"}`}>₹{process.lopAmount?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Gross:</span>
                            <span className="font-semibold text-slate-900">₹{process.gross.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Deductions:</span>
                            <span className="font-semibold text-slate-900">₹{process.deductions.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between bg-green-50 -mx-4 px-4 py-2">
                            <span className="font-bold text-slate-900">Net:</span>
                            <span className="font-bold text-slate-900">₹{process.net.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                process.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : process.status === "final"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block w-full overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100">
                        <th className="text-left px-6 py-4 font-bold text-slate-900">Employee</th>
                        <th className="text-center px-4 py-4 font-bold text-slate-900">Month</th>
                        <th className="text-center px-4 py-4 font-bold text-slate-900">Days</th>
                        <th className="text-right px-6 py-4 font-bold text-slate-900">LOP Amt</th>
                        <th className="text-right px-6 py-4 font-bold text-slate-900">Gross</th>
                        <th className="text-right px-6 py-4 font-bold text-slate-900">Deductions</th>
                        <th className="text-right px-6 py-4 font-bold text-slate-900">Net</th>
                        <th className="text-center px-4 py-4 font-bold text-slate-900">Status</th>
                        <th className="text-center px-4 py-4 font-bold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcessing.map((process) => {
                        return (
                          <tr key={process.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{process.employeeName}</td>
                            <td className="px-4 py-4 text-slate-700 text-center">{process.month}</td>
                            <td className="px-4 py-4 text-slate-700 text-center font-medium">{process.payableDays}</td>
                            <td className={`px-6 py-4 text-right font-semibold ${process.lopAmount > 0 ? "text-red-600" : "text-green-600"}`}>₹{process.lopAmount?.toLocaleString() || 0}</td>
                            <td className="px-6 py-4 text-slate-700 text-right">₹{process.gross.toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-700 text-right">₹{process.deductions.toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-900 text-right font-bold bg-green-100">₹{process.net.toLocaleString()}</td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  process.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : process.status === "final"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleDelete(process.id)}
                                  className="p-2 hover:bg-red-200 text-red-700 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Payslips Tab */}
          {canViewPayslips && (
          <TabsContent value="payslips">
            <Card>
              <CardContent className="pt-6">
                {filteredPayslips.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payslips Found</h3>
                    <p className="text-gray-500">
                      {payslips.length === 0 
                        ? "No payslips have been generated yet. Process payroll to create payslips."
                        : "No payslips match your current filters or search criteria."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPayslips.map((payslip) => (
                    <div key={payslip.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-slate-900">{payslip.employeeName}</p>
                          <p className="text-sm text-slate-600 mt-1">Payslip #{payslip.number}</p>
                        </div>
                        <span className="text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md whitespace-nowrap">
                          {payslip.month}
                        </span>
                      </div>
                      <div className="space-y-3 mb-4 pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Generated On:</p>
                          <p className="text-sm font-medium text-slate-900">{payslip.generatedOn}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Employee ID:</p>
                          <p className="text-sm font-medium text-slate-900">{payslip.employeeId}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            try {
                              const result = await payrollApi.getPayslipPreview(payslip.employeeId, payslip.month);
                              if (result.data) {
                                setPayslipPreviewHtml(result.data);
                                setIsViewPayslipOpen(true);
                              } else if (result.error) {
                                toast.error(result.error);
                              }
                            } catch (error) {
                              console.error('Error fetching payslip preview:', error);
                              toast.error('Failed to load payslip preview');
                            }
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          View Payslip
                        </button>
                        {payslip.pdfUrl && (
                          <a
                            href={payslip.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add New"} {activeTab === "structure" ? "Salary Structure" : activeTab === "processing" ? "Payroll Processing" : "Payslip"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "structure" && (
              <>
              
<div>
                  <Label>Employee *</Label>
                  {editingId ? (
                    // Show as read-only input when editing
                    <div className="mt-2">
                      <Input
                        value={formData.employeeName || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                      <input type="hidden" name="employeeId" value={formData.employeeId} />
                    </div>
                  ) : (
                    // Show as dropdown when adding new
                    <Select
                      value={formData.employeeId || ""}
                      onValueChange={(employeeId) => {
                        console.log('Select onValueChange called with:', employeeId);
                        const employee = employees.find(emp => emp.id === employeeId);
                        console.log('Found employee for selection:', employee);
                        if (employee) {
                          setFormData({
                            ...formData,
                            employeeId: employeeId,
                            employeeName: employee.name
                          });
                        }
                      }}
                      disabled={employeesLoading}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Select employee..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {employeesLoading ? (
                          <SelectItem value="LOADING_EMPLOYEES" disabled>
                            Loading employees...
                          </SelectItem>
                        ) : employees.length === 0 ? (
                          <SelectItem value="NO_EMPLOYEES" disabled>
                            No employees found
                          </SelectItem>
                        ) : (
                          employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.id})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {employees.length === 0 && !employeesLoading && !editingId && (
                    <p className="text-xs text-red-500 mt-1">
                      No employees available. Please add employees first.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Basic Salary *</Label>
                    <Input
                      value={formData.basic || ""}
                      onChange={(e) => setFormData({ ...formData, basic: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>HRA *</Label>
                    <Input
                      value={formData.hra || ""}
                      onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Allowances</Label>
                    <Input
                      value={formData.allowances || ""}
                      onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Incentives</Label>
                    <Input
                      value={formData.incentives || ""}
                      onChange={(e) => setFormData({ ...formData, incentives: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3">Deductions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>PF</Label>
                      <Input
                        value={formData.pf || ""}
                        onChange={(e) => setFormData({ ...formData, pf: parseFloat(e.target.value) || 0 })}
                        type="number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>ESI</Label>
                      <Input
                        value={formData.esi || ""}
                        onChange={(e) => setFormData({ ...formData, esi: parseFloat(e.target.value) || 0 })}
                        type="number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>PT</Label>
                      <Input
                        value={formData.pt || ""}
                        onChange={(e) => setFormData({ ...formData, pt: parseFloat(e.target.value) || 0 })}
                        type="number"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>TDS</Label>
                      <Input
                        value={formData.tds || ""}
                        onChange={(e) => setFormData({ ...formData, tds: parseFloat(e.target.value) || 0 })}
                        type="number"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Other Deductions</Label>
                    <Input
                      value={formData.otherDeductions || ""}
                      onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "processing" && (
              <>
                <div>
                  <Label>Employee *</Label>
                  <Select
                    value={formData.employeeId || ""}
                    onValueChange={(employeeId) => {
                      const salaryStructure = salaryStructures.find(s => s.employeeId === employeeId);
                      if (salaryStructure) {
                        // Calculate payable days if month is already selected
                        let calculatedDays = formData.payableDays || 26; // Use real-time calculated days
                        if (formData.month) {
                          // Days are already calculated from real attendance data
                          calculatedDays = formData.payableDays;
                        }

                        setFormData({
                          ...formData,
                          employeeId: salaryStructure.employeeId,
                          employeeName: salaryStructure.employeeName,
                          gross: salaryStructure.gross,
                          reportingManager: salaryStructure.reportingManager || "",
                          payableDays: calculatedDays
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salaryStructures.map((s) => (
                        <SelectItem key={s.id} value={s.employeeId}>
                          {s.employeeName} ({s.employeeId}) - Gross: ₹{s.gross.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month *</Label>
                    <Input
                      value={formData.month || ""}
                      onChange={(e) => {
                        const month = e.target.value;

                        // Auto-calculate payable days when month changes
                        let payableDays = formData.payableDays || 26;
                        if (formData.employeeId && month) {
                          const result = calculatePayableDays(formData.employeeId, month, mockAttendanceRecords);
                          payableDays = result.payableDays;
                        }

                        setFormData({ ...formData, month, payableDays });
                      }}
                      type="month"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gross Salary * (Auto-filled from Salary Structure)</Label>
                      <Input
                        value={formData.gross || ""}
                        onChange={(e) => setFormData({ ...formData, gross: parseFloat(e.target.value) || 0 })}
                        type="number"
                        className="mt-2 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select value={formData.status || ""} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Label>Gross Salary * (Auto-filled from Salary Structure)</Label>
                    <Input
                      value={formData.gross || ""}
                      onChange={(e) => setFormData({ ...formData, gross: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="mt-2 bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label>Status *</Label>
                    <Select value={formData.status || ""} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "payslips" && (
              <>
                                <div>
                  <Label>Employee</Label>
                  <div className="mt-2 p-2 border rounded-md bg-gray-50">
                    {formData.employeeName ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {formData.employeeName}
                        </span>
                        <input type="hidden" name="employeeId" value={formData.employeeId} />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No employee selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Month *</Label>
                  <Input
                    value={formData.month || ""}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    type="month"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>PDF URL (Optional)</Label>
                  <Input
                    value={formData.pdfUrl || ""}
                    onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                    className="mt-2"
                    placeholder="/payslips/PS-XXXX-XX-XXX.pdf"
                  />
                </div>
                <div>
                  <Label>Generated On *</Label>
                  <Input
                    value={formData.generatedOn || ""}
                    onChange={(e) => setFormData({ ...formData, generatedOn: e.target.value })}
                    type="date"
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Payslip Dialog */}
      <Dialog open={isViewPayslipOpen} onOpenChange={setIsViewPayslipOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
            <DialogTitle className="text-xl font-bold">Payslip Preview</DialogTitle>
            <Button variant="outline" onClick={() => setIsViewPayslipOpen(false)}>
              Close
            </Button>
          </div>
          <div className="p-6">
            {payslipPreviewHtml && (
              <div 
                dangerouslySetInnerHTML={{ __html: `${payslipStyles}${payslipPreviewHtml}` }}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
