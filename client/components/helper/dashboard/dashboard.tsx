import ENDPOINTS from "@/lib/endpoint";

export interface AdminDashboardData {
  payroll?: any;
  attendance?: any;
  leaves?: any;
  expenses?: any;
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

    const mapped: AdminDashboardData = {
      payroll: payload.payroll ?? null,
      attendance: payload.attendance ?? null,
      leaves: payload.leaves ?? null,
      expenses: payload.expenses ?? null,
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
