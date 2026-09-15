import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import ENDPOINTS from "@/lib/endpoint";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Calculator,
  CalendarClock,
  CheckCircle2,
  FileText,
  IndianRupee,
  Send,
  UserRound,
} from "lucide-react";
import { showToast } from "@/utils/toast";

type LoanFormState = {
  requestType: "loan" | "advance";
  employeeName: string;
  employeeId: string;
  department: string;
  loanAmount: string;
  tenureMonths: string;
  recoveryStartMonth: string;
  purpose: string;
};

type LoanRequest = LoanFormState & {
  id: string;
  emiAmount: number;
  totalAmount: number;
  submittedAt: string;
  status: string;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const getDefaultEmployeeId = (user: any) => {
  const employeeId =
    user?.employee_id || user?.employeeId || user?.employee_code;
  if (employeeId) return String(employeeId);

  const id = Number(user?.id || 0);
  return id ? `EMP${String(id).padStart(3, "0")}` : "";
};

const getNextMonthValue = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const toTitleCase = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const mapLoanResponse = (loan: any): LoanRequest => ({
  requestType:
    (loan.requestType || loan.request_type) === "advance" ? "advance" : "loan",
  employeeName: loan.employeeName || loan.employee_name || "",
  employeeId:
    loan.employeeCode || loan.employee_code || String(loan.employeeId || ""),
  department: loan.departmentName || loan.department_name || "",
  loanAmount: String(loan.amount || 0),
  tenureMonths: String(loan.tenureMonths || loan.tenure_months || 0),
  recoveryStartMonth:
    loan.recoveryStartMonth || loan.recovery_start_month || "",
  purpose: loan.purpose || "",
  id: loan.requestNo || loan.request_no || String(loan.id),
  emiAmount: Number(loan.emiAmount || loan.emi_amount || 0),
  totalAmount: Number(loan.amount || 0),
  submittedAt:
    loan.createdAt ||
    loan.created_at ||
    loan.requestDate ||
    loan.request_date ||
    "",
  status: toTitleCase(String(loan.status || "pending")),
});

const LoanRequestForm = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LoanFormState>({
    requestType: "loan",
    employeeName: user?.name || "",
    employeeId: getDefaultEmployeeId(user),
    department: user?.department || "",
    loanAmount: "",
    tenureMonths: "12",
    recoveryStartMonth: getNextMonthValue(),
    purpose: "",
  });

  const loanAmount = Number(formData.loanAmount || 0);
  const tenureMonths = Number(formData.tenureMonths || 0);
  const isLoanRequest = formData.requestType === "loan";
  const emiAmount = useMemo(() => {
    if (!loanAmount || !tenureMonths) return 0;
    return Math.ceil(loanAmount / tenureMonths);
  }, [loanAmount, tenureMonths]);

  const updateField = (field: keyof LoanFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let isMounted = true;

    ENDPOINTS.getLoanRequests()
      .then((response) => {
        if (!isMounted) return;
        const loans = response.data?.loans || [];
        setRequests(loans.map(mapLoanResponse));
      })
      .catch((error) => {
        console.error("Load loan requests error:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.employeeName.trim()) {
      showToast.error("Employee name is required");
      return;
    }
    if (!formData.employeeId.trim()) {
      showToast.error("Employee ID is required");
      return;
    }
    if (!formData.department.trim()) {
      showToast.error("Department is required");
      return;
    }
    if (!loanAmount || loanAmount <= 0) {
      showToast.error(
        `Enter a valid ${isLoanRequest ? "loan" : "advance"} amount`,
      );
      return;
    }
    if (isLoanRequest && (!tenureMonths || tenureMonths <= 0)) {
      showToast.error("Enter a valid tenure");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await ENDPOINTS.createLoanRequest({
        request_type: formData.requestType,
        employee_code: formData.employeeId,
        amount: loanAmount,
        purpose: formData.purpose,
        ...(isLoanRequest
          ? {
              tenure_months: tenureMonths,
              recovery_start_month: formData.recoveryStartMonth,
            }
          : {}),
      });
      const savedLoan = response.data?.loan;

      if (savedLoan) {
        setRequests((prev) => [mapLoanResponse(savedLoan), ...prev]);
      }
      setFormData((prev) => ({
        ...prev,
        loanAmount: "",
        tenureMonths: "12",
        purpose: "",
      }));
      showToast.success(response.data?.message || "Loan request submitted");
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Failed to submit loan request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-950">
                    Loan & Advance Apply
                  </h1>
                  <p className="text-sm text-slate-500">
                    Submit employee loan or salary advance requests with EMI
                    calculation.
                  </p>
                </div>
              </div>
            </div>
            <Badge className="w-fit bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-100">
              Approval Pending Flow
            </Badge>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-lg border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  Application Details
                </CardTitle>
                <CardDescription>
                  Fill employee details and repayment information.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="requestType">Request Type</Label>
                      <Select
                        value={formData.requestType}
                        onValueChange={(value: "loan" | "advance") =>
                          updateField("requestType", value)
                        }
                      >
                        <SelectTrigger id="requestType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="advance">
                            Salary Advance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeName">Employee Name</Label>
                      <Input
                        id="employeeName"
                        value={formData.employeeName}
                        onChange={(event) =>
                          updateField("employeeName", event.target.value)
                        }
                        placeholder="Enter employee name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(event) =>
                          updateField("employeeId", event.target.value)
                        }
                        placeholder="EMP001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(event) =>
                          updateField("department", event.target.value)
                        }
                        placeholder="Finance, HR, Sales..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loanAmount">
                        {isLoanRequest ? "Loan Amount" : "Advance Amount"}
                      </Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="loanAmount"
                          type="number"
                          min="0"
                          value={formData.loanAmount}
                          onChange={(event) =>
                            updateField("loanAmount", event.target.value)
                          }
                          className="pl-9"
                          placeholder="50000"
                        />
                      </div>
                    </div>

                    {isLoanRequest && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="tenureMonths">Tenure</Label>
                          <div className="relative">
                            <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              id="tenureMonths"
                              type="number"
                              min="1"
                              max="60"
                              value={formData.tenureMonths}
                              onChange={(event) =>
                                updateField(
                                  "tenureMonths",
                                  event.target.value,
                                )
                              }
                              className="pl-9"
                              placeholder="12"
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            Enter tenure in months.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recoveryStartMonth">
                            Recovery Start Month
                          </Label>
                          <Input
                            id="recoveryStartMonth"
                            type="month"
                            value={formData.recoveryStartMonth}
                            onChange={(event) =>
                              updateField(
                                "recoveryStartMonth",
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Calculated EMI</Label>
                          <div className="flex h-10 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800">
                            {formatCurrency(emiAmount)} / month
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose / Remarks</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(event) =>
                        updateField("purpose", event.target.value)
                      }
                      placeholder="Reason for loan or advance request"
                      className="min-h-24"
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          loanAmount: "",
                          tenureMonths: "12",
                          purpose: "",
                        }))
                      }
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {isLoanRequest && (
                <Card className="rounded-lg border-slate-200 shadow-sm">
                  <CardHeader className="border-b bg-white">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calculator className="h-5 w-5 text-emerald-700" />
                      EMI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Request Amount
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-950">
                        {formatCurrency(loanAmount)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Tenure
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {tenureMonths || 0} Months
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-medium uppercase text-emerald-700">
                          EMI
                        </p>
                        <p className="mt-1 text-lg font-semibold text-emerald-800">
                          {formatCurrency(emiAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 p-4 text-white">
                      <p className="text-xs font-medium uppercase text-slate-300">
                        Repayment Preview
                      </p>
                      <p className="mt-2 text-sm">
                        {loanAmount && tenureMonths
                          ? `${formatCurrency(emiAmount)} will be deducted every month for ${tenureMonths} month(s).`
                          : "Enter amount and tenure to preview monthly deduction."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-lg border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-white">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserRound className="h-5 w-5 text-emerald-700" />
                    Employee Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-950">
                      {formData.employeeName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Employee ID</span>
                    <span className="font-medium text-slate-950">
                      {formData.employeeId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Department</span>
                    <span className="font-medium text-slate-950">
                      {formData.department || "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                Recent Applications
              </CardTitle>
              <CardDescription>
                Submitted requests from this screen appear here.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No loan or advance applications submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Request ID</th>
                        <th className="px-5 py-3 font-medium">Employee</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Tenure</th>
                        <th className="px-5 py-3 font-medium">EMI</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {requests.map((request) => (
                        <tr key={request.id} className="bg-white">
                          <td className="px-5 py-4 font-medium text-slate-950">
                            {request.id}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-950">
                              {request.employeeName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {request.employeeId} - {request.department}
                            </div>
                          </td>
                          <td className="px-5 py-4 capitalize">
                            {request.requestType}
                          </td>
                          <td className="px-5 py-4">
                            {formatCurrency(request.totalAmount)}
                          </td>
                          <td className="px-5 py-4">
                            {request.requestType === "loan"
                              ? `${request.tenureMonths} months`
                              : "-"}
                          </td>
                          <td className="px-5 py-4 font-medium text-emerald-700">
                            {request.requestType === "loan"
                              ? formatCurrency(request.emiAmount)
                              : "-"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              {request.status}
                            </Badge>
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

export default LoanRequestForm;
