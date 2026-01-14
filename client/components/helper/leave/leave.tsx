// src/lib/leaveTypeApi.ts (or src/api/leaveTypeApi.ts)
import ENDPOINTS from "@/lib/endpoint";

/**
 * Leave Type interface
 */
export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  opening: number;
  availed: number;
  available: number;
  createdAt: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  attachment?: string;
  status: "applied" | "approved" | "rejected";
  reportingManagerId?: string;
  reportingManagerName?: string;
  reportingManagerEmail?: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  name: string;                    // e.g., "Annual Leave", "Sick Leave"
  code?: string;                   // e.g., "AL", "SL"
  description?: string;
  maxDays: number;                 // Maximum allowed days per year
  isPaid: boolean;                 // Paid or unpaid
  isActive?: boolean;
  carryForward?: boolean;          // Can unused days be carried forward?
  carryForwardLimit?: number;      // Max days that can be carried forward
  encashable?: boolean;            // Can leave be encashed
  requiresApproval?: boolean;      // Needs manager/HR approval
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Leave Type API helper
 */
export const leaveTypeApi = {
  // Get all leave types
  // ✅ Get all leave types
  getLeaveTypes: async (): Promise<{ data?: LeaveType[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getLeave(); // /leave/types

      let rawData: any[] = [];

      // Case 1: Wrapped response { success: true, leaveTypes: [...] }
      if (response.data?.success && Array.isArray(response.data?.leaveTypes)) {
        rawData = response.data.leaveTypes;
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        rawData = response.data;
      }
      // No valid data
      else {
        return { error: "No leave types found in response" };
      }

      const mapped: LeaveType[] = rawData.map((lt: any) => {
        const maxDays = Number(lt.annual_limit || lt.max_days || lt.maximum_days || lt.allowed_days || 0);
        const carryForwardLimit = Number(lt.carry_forward || lt.carry_forward_limit || lt.max_carry_forward || 0);
        const isPaid = lt.is_paid === 1 || lt.is_paid === true || lt.paid === true;
        const encashable = lt.encashable === 1 || lt.encashable === true;

        console.log("Raw Leave Type Item:", lt);
        console.log("Mapped maxDays:", maxDays);
        console.log("Mapped carryForwardLimit:", carryForwardLimit);
        console.log("Mapped isPaid:", isPaid);
        console.log("Mapped encashable:", encashable);

        return {
          id: lt.id?.toString() || lt._id?.toString() || "",
          name: lt.name || lt.leave_type_name || lt.type_name || "Unnamed Leave",
          code: lt.code || lt.leave_code || lt.leave_type_id || lt.short_code,
          description: lt.description || lt.leave_description,
          maxDays: maxDays,
          isPaid: isPaid,
          isActive: (lt.status === "active") || (lt.is_active ?? lt.active ?? true),
          carryForward: lt.carry_forward > 0 || lt.allow_carry_forward === true || lt.carry_forward === true,
          carryForwardLimit: carryForwardLimit,
          encashable: encashable,
          requiresApproval: lt.requires_approval ?? lt.needs_approval ?? true,
          createdAt: lt.created_at || lt.createdAt,
          updatedAt: lt.updated_at || lt.updatedAt,
        };
      });

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching leave types:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load leave types",
      };
    }
  },

  // ✅ Create new leave type
  createLeaveType: async (data: any): Promise<{ data?: LeaveType; error?: string }> => {
    try {
      const response = await ENDPOINTS.createLeave(data);
      
      console.log("Create Leave Type Response:", response);
      
      // Handle different response formats
      if (response.data?.message || response.data?.leave_type_id) {
        // Success case: API returns message and ID
        return { 
          data: {
            id: response.data.leave_type_id || response.data.id || "",
            name: data.name,
            code: response.data.leave_type_id || "",
            description: data.description || "",
            maxDays: data.annual_limit || 0,
            isPaid: data.is_paid === 1,
            isActive: true,
            carryForward: data.carry_forward > 0,
            carryForwardLimit: data.carry_forward || 0,
            encashable: data.encashable === 1,
            requiresApproval: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else if (response.data?.success) {
        return { data: response.data };
      } else {
        return { error: response.data?.message || "Failed to create leave type" };
      }
    } catch (error: any) {
      console.error("Error creating leave type:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create leave type",
      };
    }
  },

  // ✅ Update leave type
  updateLeaveType: async (id: string, data: any): Promise<{ data?: LeaveType; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateLeave(id, data);
      
      console.log("Update Leave Type Response:", response);
      
      // Handle different response formats
      if (response.data?.message || response.data?.success) {
        // Success case: API returns message or success flag
        return { 
          data: {
            id: id,
            name: data.name,
            code: data.code || "",
            description: data.description || "",
            maxDays: data.annual_limit || 0,
            isPaid: data.is_paid === 1,
            isActive: true,
            carryForward: data.carry_forward > 0,
            carryForwardLimit: data.carry_forward || 0,
            encashable: data.encashable === 1,
            requiresApproval: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else if (response.data?.success) {
        return { data: response.data };
      } else {
        return { error: response.data?.message || "Failed to update leave type" };
      }
    } catch (error: any) {
      console.error("Error updating leave type:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update leave type",
      };
    }
  },

  // ✅ Delete leave type
  deleteLeaveType: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteLeave(id);
      
      console.log("Delete Leave Type Response:", response);
      
      // Handle different response formats
      if (response.data?.message || response.data?.success) {
        // Success case: API returns message or success flag
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to delete leave type" };
      }
    } catch (error: any) {
      console.error("Error deleting leave type:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete leave type",
      };
    }
  },

  // ✅ Get leave balances
  getLeaveBalances: async (): Promise<{ data?: LeaveBalance[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getLeaveBalance(); // /leave/balance
      
      console.log("Leave Balance Response:", response);
      
      let rawData: any[] = [];

      // Case 1: Wrapped response { success: true, leaveBalances: [...] }
      if (response.data?.success && Array.isArray(response.data?.leaveBalances)) {
        rawData = response.data.leaveBalances;
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        rawData = response.data;
      }
      // Case 3: Wrapped response with balances field
      else if (response.data?.balances && Array.isArray(response.data.balances)) {
        rawData = response.data.balances;
      }
      // No valid data
      else {
        return { error: "No leave balances found in response" };
      }

      const mapped: LeaveBalance[] = rawData.map((lb: any) => ({
        id: lb.id?.toString() || lb._id?.toString() || "",
        employeeId: lb.employee_id?.toString() || lb.employeeId?.toString() || "",
        employeeName: lb.employee_name || lb.employeeName || "Unknown Employee",
        leaveType: lb.leave_type || lb.leaveType || "Unknown Leave Type",
        opening: Number(lb.opening || lb.opening_balance || 0),
        availed: Number(lb.availed || lb.used || lb.taken || 0),
        available: Number(lb.available || lb.remaining || lb.balance || 0),
        createdAt: lb.created_at || lb.createdAt || new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching leave balances:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load leave balances",
      };
    }
  },

  // ✅ Get leave applications
  getLeaveApplications: async (): Promise<{ data?: LeaveApplication[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getleaveapplications(); // /leave/applications
      
      console.log("Leave Applications Response:", response);
      
      let rawData: any[] = [];

      // Case 1: Wrapped response { success: true, applications: [...] }
      if (response.data?.success && Array.isArray(response.data?.applications)) {
        rawData = response.data.applications;
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        rawData = response.data;
      }
      // Case 3: Wrapped response with leaveApplications field
      else if (response.data?.leaveApplications && Array.isArray(response.data.leaveApplications)) {
        rawData = response.data.leaveApplications;
      }
      // No valid data
      else {
        return { error: "No leave applications found in response" };
      }

      const mapped: LeaveApplication[] = rawData.map((la: any) => ({
        id: la.id?.toString() || la._id?.toString() || "",
        employeeId: la.employee_id?.toString() || la.employeeId?.toString() || "",
        employeeName: la.employee_name || la.employeeName || "Unknown Employee",
        leaveType: la.leave_type || la.leaveType || "Unknown Leave Type",
        fromDate: la.from_date || la.fromDate || "",
        toDate: la.to_date || la.toDate || "",
        days: Number(la.days || la.number_of_days || 0),
        reason: la.reason || "No reason provided",
        attachment: la.attachment || la.document || "",
        status: la.status || "applied",
        reportingManagerId: la.reporting_manager_id?.toString() || la.reportingManagerId?.toString(),
        reportingManagerName: la.reporting_manager_name || la.reportingManagerName,
        reportingManagerEmail: la.reporting_manager_email || la.reportingManagerEmail,
        createdAt: la.created_at || la.createdAt || new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching leave applications:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load leave applications",
      };
    }
  },
};

export default leaveTypeApi;

// Holiday interface
export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "national" | "regional" | "optional";
  description?: string;
  createdAt: string;
}

// Fiscal Year interface
export interface FiscalYearConfig {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  leaveCycleStart: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Leave Policy interface
export interface LeavePolicy {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

/**
 * Holiday API helper
 */
export const holidayApi = {
  // Get all holidays
  getHolidays: async (): Promise<{ data?: Holiday[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getHolidays();
      
      let rawData: any[] = [];
      
      if (response.data?.success && Array.isArray(response.data?.holidays)) {
        rawData = response.data.holidays;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        return { error: "No holidays found in response" };
      }

      const mapped: Holiday[] = rawData.map((holiday: any) => ({
        id: holiday.id?.toString() || holiday._id?.toString() || "",
        name: holiday.name || "Unnamed Holiday",
        date: holiday.date ? new Date(holiday.date).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : (holiday.holiday_date ? new Date(holiday.holiday_date).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ""),
        type: holiday.type || holiday.holiday_type || "national",
        description: holiday.description || holiday.holiday_description || "",
        createdAt: holiday.created_at || holiday.createdAt || new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching holidays:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load holidays",
      };
    }
  },

  // Create new holiday
  createHoliday: async (data: any): Promise<{ data?: Holiday; error?: string }> => {
    try {
      const response = await ENDPOINTS.createHoliday(data);
      
      if (response.data?.message || response.data?.id) {
        return { 
          data: {
            id: response.data.id || "",
            name: data.name,
            date: data.date,
            type: data.type || "national",
            description: data.description || "",
            createdAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || "Failed to create holiday" };
      }
    } catch (error: any) {
      console.error("Error creating holiday:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create holiday",
      };
    }
  },

  // Update holiday
  updateHoliday: async (id: string, data: any): Promise<{ data?: Holiday; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateHoliday(id, data);
      
      if (response.data?.message || response.data?.success) {
        return { 
          data: {
            id: id,
            name: data.name,
            date: data.date,
            type: data.type || "national",
            description: data.description || "",
            createdAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || "Failed to update holiday" };
      }
    } catch (error: any) {
      console.error("Error updating holiday:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update holiday",
      };
    }
  },

  // Delete holiday
  deleteHoliday: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteHoliday(id);
      
      if (response.data?.message || response.data?.success) {
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to delete holiday" };
      }
    } catch (error: any) {
      console.error("Error deleting holiday:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete holiday",
      };
    }
  },
};

/**
 * Fiscal Year API helper
 */
export const fiscalYearApi = {
  // Get all fiscal years
  getFiscalYears: async (): Promise<{ data?: FiscalYearConfig[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getFiscalYears();
      
      let rawData: any[] = [];
      
      if (response.data?.success && Array.isArray(response.data?.fiscalYears)) {
        rawData = response.data.fiscalYears;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        return { error: "No fiscal years found in response" };
      }

      const mapped: FiscalYearConfig[] = rawData.map((fy: any) => ({
        id: fy.id?.toString() || fy._id?.toString() || "",
        year: fy.year || fy.fiscal_year || "",
        startDate: fy.startDate || fy.start_date || fy.fiscal_year_start ? new Date(fy.startDate || fy.start_date || fy.fiscal_year_start).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "",
        endDate: fy.endDate || fy.end_date || fy.fiscal_year_end ? new Date(fy.endDate || fy.end_date || fy.fiscal_year_end).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "",
        leaveCycleStart: fy.leaveCycleStart || fy.leave_cycle_start ? new Date(fy.leaveCycleStart || fy.leave_cycle_start).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "",
        isActive: fy.isActive ?? fy.is_active ?? fy.active ?? true,
        createdAt: fy.created_at || fy.createdAt || new Date().toISOString(),
        updatedAt: fy.updated_at || fy.updatedAt || new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching fiscal years:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load fiscal years",
      };
    }
  },

  // Create new fiscal year
  createFiscalYear: async (data: any): Promise<{ data?: FiscalYearConfig; error?: string }> => {
    try {
      // Map frontend field names to backend field names
      const backendData = {
        year: data.year,
        start_date: data.startDate,
        end_date: data.endDate,
        leave_cycle_start: data.leaveCycleStart,
        is_active: data.isActive ? 1 : 0
      };
      
      const response = await ENDPOINTS.createFiscalYear(backendData);
      
      if (response.data?.message || response.data?.id) {
        return { 
          data: {
            id: response.data.id || "",
            year: data.year,
            startDate: data.startDate,
            endDate: data.endDate,
            leaveCycleStart: data.leaveCycleStart,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || "Failed to create fiscal year" };
      }
    } catch (error: any) {
      console.error("Error creating fiscal year:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create fiscal year",
      };
    }
  },

  // Update fiscal year
  updateFiscalYear: async (id: string, data: any): Promise<{ data?: FiscalYearConfig; error?: string }> => {
    try {
      // Map frontend field names to backend field names
      const backendData = {
        year: data.year,
        start_date: data.startDate,
        end_date: data.endDate,
        leave_cycle_start: data.leaveCycleStart,
        is_active: data.isActive ? 1 : 0
      };
      
      const response = await ENDPOINTS.updateFiscalYear(id, backendData);
      
      if (response.data?.message || response.data?.success) {
        return { 
          data: {
            id: id,
            year: data.year,
            startDate: data.startDate,
            endDate: data.endDate,
            leaveCycleStart: data.leaveCycleStart,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || "Failed to update fiscal year" };
      }
    } catch (error: any) {
      console.error("Error updating fiscal year:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update fiscal year",
      };
    }
  },

  // Delete fiscal year
  deleteFiscalYear: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteFiscalYear(id);
      
      if (response.data?.message || response.data?.success) {
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to delete fiscal year" };
      }
    } catch (error: any) {
      console.error("Error deleting fiscal year:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete fiscal year",
      };
    }
  },
};

/**
 * Leave Policy API helper
 */
export const leavePolicyApi = {
  // Get all leave policies
  getLeavePolicies: async (): Promise<{ data?: LeavePolicy[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getLeavePolicies();
      
      let rawData: any[] = [];
      
      if (response.data?.success && Array.isArray(response.data?.leavePolicies)) {
        rawData = response.data.leavePolicies;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        return { error: "No leave policies found in response" };
      }

      const mapped: LeavePolicy[] = rawData.map((policy: any) => ({
        id: policy.id?.toString() || policy._id?.toString() || "",
        name: policy.name || policy.policy_name || "Unnamed Policy",
        description: policy.description || policy.policy_description || "",
        status: policy.status || "active",
        createdAt: policy.created_at || policy.createdAt || new Date().toISOString(),
        updatedAt: policy.updated_at || policy.updatedAt || new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (error: any) {
      console.error("Error fetching leave policies:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load leave policies",
      };
    }
  },

  // Create new leave policy
  createLeavePolicy: async (data: any): Promise<{ data?: LeavePolicy; error?: string }> => {
    try {
      // Map frontend field names to backend field names
      const backendData = {
        name: data.name,
        description: data.description,
        status: data.status || "active"
      };
      
      const response = await ENDPOINTS.createLeavePolicy(backendData);
      
      if (response.data?.message || response.data?.id) {
        return { 
          data: {
            id: response.data.id || "",
            name: data.name,
            description: data.description,
            status: data.status || "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || "Failed to create leave policy" };
      }
    } catch (error: any) {
      console.error("Error creating leave policy:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create leave policy",
      };
    }
  },

  // Update leave policy
  updateLeavePolicy: async (id: string, data: any): Promise<{ data?: LeavePolicy; error?: string }> => {
    try {
      // Map frontend field names to backend field names
      const backendData = {
        name: data.name,
        description: data.description,
        status: data.status || "active"
      };
      
      const response = await ENDPOINTS.updateLeavePolicy(id, backendData);
      
      // Check if response contains data (successful update) or has an error
      if (response.data && !response.data.error) {
        return { 
          data: {
            id: id,
            name: data.name,
            description: data.description,
            status: data.status || "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return { error: response.data?.message || response.data?.error || "Failed to update leave policy" };
      }
    } catch (error: any) {
      console.error("Error updating leave policy:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update leave policy",
      };
    }
  },

  // Delete leave policy
  deleteLeavePolicy: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteLeavePolicy(id);
      
      if (response.data?.message || response.data?.success) {
        return { success: true };
      } else {
        return { error: response.data?.message || "Failed to delete leave policy" };
      }
    } catch (error: any) {
      console.error("Error deleting leave policy:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete leave policy",
      };
    }
  },
};