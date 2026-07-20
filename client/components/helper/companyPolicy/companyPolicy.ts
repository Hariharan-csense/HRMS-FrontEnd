import ENDPOINTS from "@/lib/endpoint";

export interface CompanyPolicy {
  leave: {
    casualLeaveEnabled: boolean;
    casualLeaveNames: string[];
    casualLeavePerMonth: number;
    casualLeaveAccrual: "monthly_start" | "after_full_month";
    includePendingLeaveInUsage: boolean;
  };
  permission: {
    enabled: boolean;
    maxPerMonth: number;
    hoursPerPermission: number;
    includePendingInUsage: boolean;
  };
  attendance: {
    gracePolicyEnabled: boolean;
    workStartTime: string;
    workEndTime: string;
    gracePeriodMinutes: number;
    graceDaysPerMonth: number;
    halfDayThresholdHours: number;
  };
  expense: {
    enabled: boolean;
    monthlyOverallLimit: number;
    categories: Record<
      string,
      {
        perClaimLimit: number;
        monthlyLimit: number;
      }
    >;
  };
}

export const defaultCompanyPolicy: CompanyPolicy = {
  leave: {
    casualLeaveEnabled: true,
    casualLeaveNames: ["casual leave", "cl", "casual"],
    casualLeavePerMonth: 1,
    casualLeaveAccrual: "monthly_start",
    includePendingLeaveInUsage: true,
  },
  permission: {
    enabled: true,
    maxPerMonth: 2,
    hoursPerPermission: 1,
    includePendingInUsage: true,
  },
  attendance: {
    gracePolicyEnabled: true,
    workStartTime: "09:30",
    workEndTime: "18:00",
    gracePeriodMinutes: 5,
    graceDaysPerMonth: 0,
    halfDayThresholdHours: 4,
  },
  expense: {
    enabled: true,
    monthlyOverallLimit: 0,
    categories: {
      food: { perClaimLimit: 0, monthlyLimit: 0 },
      travel: { perClaimLimit: 0, monthlyLimit: 0 },
      accommodation: { perClaimLimit: 0, monthlyLimit: 0 },
      miscellaneous: { perClaimLimit: 0, monthlyLimit: 0 },
    },
  },
};

const mergePolicy = (policy?: Partial<CompanyPolicy>): CompanyPolicy => ({
  leave: { ...defaultCompanyPolicy.leave, ...(policy?.leave || {}) },
  permission: {
    ...defaultCompanyPolicy.permission,
    ...(policy?.permission || {}),
  },
  attendance: {
    ...defaultCompanyPolicy.attendance,
    ...(policy?.attendance || {}),
  },
  expense: {
    ...defaultCompanyPolicy.expense,
    ...(policy?.expense || {}),
    categories: {
      ...defaultCompanyPolicy.expense.categories,
      ...(policy?.expense?.categories || {}),
    },
  },
});

export const companyPolicyApi = {
  getPolicy: async (): Promise<{ data?: CompanyPolicy; error?: string }> => {
    try {
      const response = await ENDPOINTS.getCompanyPolicy();
      return { data: mergePolicy(response.data?.policy || response.data) };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load company policy",
      };
    }
  },

  updatePolicy: async (
    policy: CompanyPolicy,
  ): Promise<{ data?: CompanyPolicy; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateCompanyPolicy(policy);
      return { data: mergePolicy(response.data?.policy || response.data) };
    } catch (error: any) {
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to save company policy",
      };
    }
  },
};
