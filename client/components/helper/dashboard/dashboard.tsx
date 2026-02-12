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
