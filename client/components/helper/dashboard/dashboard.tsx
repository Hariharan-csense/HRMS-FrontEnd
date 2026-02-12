import ENDPOINTS from "@/lib/endpoint";

export interface AdminDashboardData {
  kpis?: {
    totalEmployees: number;
    presentToday: number;
    presentTrend: string;
    onLeave: number;
    onLeaveTrend: string;
    pendingApprovals: number;
    pendingTrend: string;
  };
  charts?: {
    monthlyAttendance: Array<{ month: string; present: number; absent: number; half: number }>;
    departmentData: Array<{ dept: string; count: number }>;
    departmentAttendanceData: Array<{ dept: string; present: number; absent: number; half: number; total: number }>;
    leaveData: Array<{ name: string; value: number; fill: string }>;
  };
  recentActivities?: Array<{ activity: string; time: string; icon: string }>;
  recentJoinings?: Array<{ name: string; role: string; dept: string; joinDate: string }>;
  upcomingBirthdays?: Array<{ name: string; date: string; emoji: string }>;
  upcomingHolidays?: Array<any>;
  teamHealth?: {
    overallScore: number;
    status: string;
    trend: string;
    lastUpdated: string;
    metrics: Array<{ label: string; value: number; color: string }>;
    strengths: string[];
    improvements: string[];
  };
}

export interface EmployeeDashboardData {
  todayStatus?: {
    status: string;
    checkInTime?: string;
    description: string;
  };
  leaveBalance?: {
    totalDays: number;
    description: string;
  };
  workingHours?: {
    hours: string | number;
    description: string;
  };
  monthlyAttendance?: {
    chartData: Array<{ date: number; present: number; absent: number; half: number }>;
    summary: {
      present: number;
      absent: number;
      half: number;
      total: number;
    };
  };
}

export interface ManagerDashboardData {
  teamStats?: {
    teamSize: number;
    presentToday: number;
    attendanceRate: string;
    onLeave: number;
    pendingApprovals: number;
  };
  pendingApprovals?: Array<{
    id: number;
    name: string;
    type: string;
    category: string;
    employeeId: number;
  }>;
  teamAttendance?: Array<{
    date: number;
    present: number;
    absent: number;
    half: number;
  }>;
}

export interface HRDashboardData {
  hrStats?: {
    totalEmployees: number;
    pendingExits: number;
    pendingLeaveApprovals: number;
    newJoiners: number;
  };
  departmentData?: Array<{
    dept: string;
    count: number;
  }>;
}

export interface FinanceDashboardData {
  financeStats?: {
    monthlyPayroll: string;
    pendingExpenses: string;
    payslipsGenerated: number;
    budgetUtilization: string;
  };
  payrollTrend?: Array<{
    month: string;
    present: number;
    total: number;
  }>;
}

export const getAdminDashboardData = async (): Promise<{
  data?: AdminDashboardData;
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getAdminDashboardData();

    console.log("Raw Admin Dashboard API Response:", response.data);

    // Normalize payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || response.data?.success === false) {
      return { error: "Invalid API response" };
    }

    // Map the API response to match the expected data structure
    const mapped: AdminDashboardData = {
      kpis: payload.kpis || {
        totalEmployees: 0,
        presentToday: 0,
        presentTrend: '',
        onLeave: 0,
        onLeaveTrend: '',
        pendingApprovals: 0,
        pendingTrend: ''
      },
      charts: {
        monthlyAttendance: payload.charts?.monthlyAttendance || [],
        departmentData: payload.charts?.departmentData || [],
        departmentAttendanceData: payload.charts?.departmentAttendanceData || [],
        leaveData: payload.charts?.leaveData || []
      },
      recentActivities: payload.recentActivities || [],
      recentJoinings: payload.recentJoinings || [],
      upcomingBirthdays: payload.upcomingBirthdays || [],
      upcomingHolidays: payload.upcomingHolidays || [],
      teamHealth: payload.teamHealth || {
        overallScore: 0,
        status: '',
        trend: '',
        lastUpdated: '',
        metrics: [],
        strengths: [],
        improvements: []
      }
    };

    console.log("Mapped Admin Dashboard Data:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);

    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load admin dashboard data",
    };
  }
};

export const getEmployeeDashboardData = async (): Promise<{
  data?: EmployeeDashboardData;
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getEmployeeDashboardData();

    console.log("Raw Employee Dashboard API Response:", response.data);

    // Normalize payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || response.data?.success === false) {
      return { error: "Invalid API response" };
    }

    // Map the API response to match the expected data structure
    const mapped: EmployeeDashboardData = {
      todayStatus: payload.todayStatus || {
        status: 'Not Marked',
        description: 'Attendance not marked'
      },
      leaveBalance: payload.leaveBalance || {
        totalDays: 0,
        description: 'Days remaining this year'
      },
      workingHours: payload.workingHours || {
        hours: '0',
        description: 'Hours logged today'
      },
      monthlyAttendance: payload.monthlyAttendance || {
        chartData: [],
        summary: {
          present: 0,
          absent: 0,
          half: 0,
          total: 0
        }
      }
    };

    console.log("Mapped Employee Dashboard Data:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching employee dashboard data:", error);

    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load employee dashboard data",
    };
  }
};

export const getManagerDashboardData = async (): Promise<{
  data?: ManagerDashboardData;
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getManagerDashboardData();

    console.log("Raw Manager Dashboard API Response:", response.data);

    // Normalize payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || response.data?.success === false) {
      return { error: "Invalid API response" };
    }

    // Map the API response to match the expected data structure
    const mapped: ManagerDashboardData = {
      teamStats: {
        teamSize: payload.managerStats?.totalEmployees || 0,
        presentToday: payload.managerStats?.presentToday || 0,
        attendanceRate: payload.managerStats?.presentToday && payload.managerStats?.totalEmployees 
          ? `${Math.round((payload.managerStats.presentToday / payload.managerStats.totalEmployees) * 100)}% attendance`
          : '0% attendance',
        onLeave: payload.managerStats?.onLeaveToday || 0,
        pendingApprovals: (payload.managerStats?.pendingLeaves || 0) + (payload.managerStats?.pendingExpenses || 0)
      },
      pendingApprovals: [
        ...(payload.leaves?.map(leave => ({
          id: leave.id,
          name: `${leave.first_name} ${leave.last_name}`,
          type: 'Leave Application',
          category: 'leave',
          employeeId: leave.employee_id
        })) || []),
        ...(payload.expenses?.map(expense => ({
          id: expense.id,
          name: `${expense.first_name} ${expense.last_name}`,
          type: `Expense Claim - ₹${expense.amount}`,
          category: 'expense',
          employeeId: expense.employee_id
        })) || [])
      ],
      teamAttendance: payload.monthlyAttendance ? [{
        date: 1,
        present: payload.monthlyAttendance.present || 0,
        absent: payload.monthlyAttendance.absent || 0,
        half: 0
      }] : []
    };

    console.log("Mapped Manager Dashboard Data:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching manager dashboard data:", error);

    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load manager dashboard data",
    };
  }
};

export const getHRDashboardData = async (): Promise<{
  data?: HRDashboardData;
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getHRDashboardData();

    console.log("Raw HR Dashboard API Response:", response.data);

    // Normalize payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || response.data?.success === false) {
      return { error: "Invalid API response" };
    }

    // Map the API response to match the expected data structure
    const mapped: HRDashboardData = {
      hrStats: payload.hrStats || {
        totalEmployees: 0,
        pendingExits: 0,
        pendingLeaveApprovals: 0,
        newJoiners: 0
      },
      departmentData: payload.departmentData || []
    };

    console.log("Mapped HR Dashboard Data:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching HR dashboard data:", error);

    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load HR dashboard data",
    };
  }
};

export const getFinanceDashboardData = async (): Promise<{
  data?: FinanceDashboardData;
  error?: string;
}> => {
  try {
    const response = await ENDPOINTS.getFinanceDashboardData();

    console.log("Raw Finance Dashboard API Response:", response.data);

    // Normalize payload
    const payload =
      response.data?.data ??
      response.data;

    if (!payload || response.data?.success === false) {
      return { error: "Invalid API response" };
    }

    // Map the API response to match the expected data structure
    const mapped: FinanceDashboardData = {
      financeStats: payload.financeStats || {
        monthlyPayroll: '₹0K',
        pendingExpenses: '₹0K',
        payslipsGenerated: 0,
        budgetUtilization: '0%'
      },
      payrollTrend: payload.payrollTrend || []
    };

    console.log("Mapped Finance Dashboard Data:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching finance dashboard data:", error);

    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load finance dashboard data",
    };
  }
};
