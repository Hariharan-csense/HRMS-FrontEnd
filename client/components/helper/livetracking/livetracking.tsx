import ENDPOINTS from "@/lib/endpoint";
import { AttendanceLog, AttendanceLogFilters } from "../attendance/attendance";

type AttendanceLocation = {
  employeeId: string | number;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  address?: string | null;
  timestamp?: string | null;
  deviceInfo?: string | null;
  trackingStatus?: string | null;
  minutesSinceUpdate?: number | null;
};

const normalizeEmployeeId = (value: unknown) => String(value ?? "").trim();

const normalizeTrackingStatus = (
  status?: string | null,
  minutesSinceUpdate?: number | null,
) => {
  const normalized = String(status || "").trim().toLowerCase();

  if (["active", "online", "live", "tracking"].includes(normalized)) {
    return "active";
  }

  if (["idle", "inactive", "stale"].includes(normalized)) {
    return "idle";
  }

  if (typeof minutesSinceUpdate === "number" && Number.isFinite(minutesSinceUpdate)) {
    return minutesSinceUpdate <= 5 ? "active" : "idle";
  }

  return "active";
};

const hasOpenAttendanceSession = (attendance: any) => {
  if (!attendance) return false;
  const checkIn = attendance.check_in || attendance.checkIn;
  const checkOut = attendance.check_out || attendance.checkOut;
  return Boolean(checkIn) && !checkOut;
};

const parseCheckInLocation = (raw?: any): AttendanceLocation | null => {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const lat = Number(parsed.latitude);
  const lng = Number(parsed.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    employeeId: parsed.employee_id || parsed.employeeId,
    latitude: lat,
    longitude: lng,
    accuracy: Number(parsed.accuracy) || null,
    address: parsed.address || null,
    timestamp: parsed.timestamp || null,
    deviceInfo: parsed.device_info || null,
  };
};

export const liveApi = {
  getEmployees: async (): Promise<{ data?: any[]; error?: string }> => {
    try {
      console.log("Fetching employees from backend...");

      const response = await ENDPOINTS.getEmployee();
      console.log("Employee API Raw Response:", response);

      const rawData = response?.data;
      let employees: any[] = [];

      if (Array.isArray(rawData)) {
        employees = rawData;
      } else if (rawData?.success && Array.isArray(rawData.data)) {
        employees = rawData.data;
      } else if (Array.isArray(rawData?.employees)) {
        employees = rawData.employees;
      }

      const trackedEmployees = employees.filter((emp) => emp.location_tracking_enabled === 1);
      console.log(`Total employees: ${employees.length}, Tracked employees: ${trackedEmployees.length}`);

      let latestAttendanceByEmployee = new Map<string, any>();
      try {
        const logsResponse = await ENDPOINTS.getAttendanceLogs({ limit: 1000 });
        const logs = logsResponse?.data?.logs || logsResponse?.data?.data || logsResponse?.data || [];

        latestAttendanceByEmployee = [...logs]
          .sort(
            (a: any, b: any) =>
              new Date(b.check_in || b.checkIn || 0).getTime() -
              new Date(a.check_in || a.checkIn || 0).getTime()
          )
          .reduce((map: Map<string, any>, log: any) => {
            const employeeId = String(log.employee_id || log.employeeId || "");
            if (employeeId && !map.has(employeeId)) {
              map.set(employeeId, log);
            }
            return map;
          }, new Map<string, any>());
      } catch (logsError) {
        console.warn("Failed to fetch attendance logs for live tracking status:", logsError);
      }

      const attachLocations = (attendanceLocations: AttendanceLocation[]) => {
        const employeesWithLocation = trackedEmployees.map((employee) => {
          const employeeKey = normalizeEmployeeId(employee.id ?? employee.employee_id ?? employee.employeeId);
          const latestAttendance = latestAttendanceByEmployee.get(employeeKey);
          const hasOpenSession = hasOpenAttendanceSession(latestAttendance);
          const attendanceRecord = attendanceLocations.find(
            (att) => normalizeEmployeeId(att.employeeId) === employeeKey
          );
          const liveLatitude = hasOpenSession ? attendanceRecord?.latitude ?? null : null;
          const liveLongitude = hasOpenSession ? attendanceRecord?.longitude ?? null : null;
          const liveTimestamp = hasOpenSession
            ? attendanceRecord?.timestamp || (attendanceRecord as any)?.location_timestamp || null
            : null;
          const normalizedTrackingStatus =
            hasOpenSession && attendanceRecord
              ? normalizeTrackingStatus(
                  attendanceRecord?.trackingStatus,
                  attendanceRecord?.minutesSinceUpdate ?? null,
                )
              : "offline";

          return {
            ...employee,
            latitude: liveLatitude,
            longitude: liveLongitude,
            accuracy: hasOpenSession ? attendanceRecord?.accuracy || null : null,
            address: hasOpenSession ? attendanceRecord?.address || null : null,
            locationTimestamp: liveTimestamp,
            isTracking: Boolean(hasOpenSession && attendanceRecord),
            trackingStatus: normalizedTrackingStatus,
            deviceInfo: attendanceRecord?.deviceInfo || (attendanceRecord as any)?.device_info || null,
            minutesSinceUpdate:
              hasOpenSession
                ? attendanceRecord?.minutesSinceUpdate || (attendanceRecord as any)?.minutes_since_update || null
                : null,
          };
        });
        console.log("Employees with location data:", employeesWithLocation.length);
        return employeesWithLocation;
      };

      if (trackedEmployees.length > 0) {
        // Primary: attendance/locations endpoint
        try {
          const attendanceResponse = await ENDPOINTS.getLiveLocations();
          if (attendanceResponse?.data) {
            const attendanceData = attendanceResponse.data;
            const attendanceLocations = attendanceData.locations || attendanceData.data || [];
            const mapped: AttendanceLocation[] = attendanceLocations.map((att: any) => ({
              employeeId: att.employee_id || att.employeeId,
              latitude: Number(att.latitude) || null,
              longitude: Number(att.longitude) || null,
              accuracy: Number(att.accuracy) || null,
              address: att.address || null,
              timestamp: att.timestamp || att.location_timestamp || null,
              deviceInfo: att.device_info || null,
              trackingStatus: att.tracking_status || null,
              minutesSinceUpdate: Number(att.minutes_since_update) || null,
            }));
            const withLoc = attachLocations(mapped);
            return { data: withLoc };
          }
        } catch (attendanceError) {
          console.warn("Failed to fetch attendance locations:", attendanceError);
        }

        // Fallback: derive from attendance logs (open check-ins)
        try {
          const openLogs = [...latestAttendanceByEmployee.values()].filter((log) => !log.check_out && !log.checkOut);
          const mapped: AttendanceLocation[] = openLogs
            .map((log) => {
              const loc = parseCheckInLocation(log.check_in_location);
              if (!loc) return null;
              return {
                employeeId: log.employee_id || log.employeeId,
                latitude: loc.latitude,
                longitude: loc.longitude,
                accuracy: loc.accuracy,
                address: loc.address,
                timestamp: log.check_in || log.created_at || loc.timestamp,
                deviceInfo: log.device_info || loc.deviceInfo,
              } as AttendanceLocation;
            })
            .filter(Boolean) as AttendanceLocation[];

          const withLoc = attachLocations(mapped);
          return { data: withLoc };
        } catch (logsError) {
          console.warn("Failed to fetch attendance logs for location fallback:", logsError);
        }
      }

      return { data: trackedEmployees };
    } catch (error: any) {
      console.error("Error fetching employees:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to load employees";

      return { error: errorMsg };
    }
  },

  getAttendanceLogs: async (
    filters?: AttendanceLogFilters
  ): Promise<{
    data?: AttendanceLog[];
    total?: number;
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.getAttendanceLogs(filters);
      return {
        data: response.data.logs || response.data.data || response.data,
        total: response.data.total || response.data.count,
      };
    } catch (error: any) {
      console.error("Error fetching attendance logs:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to fetch attendance logs",
      };
    }
  },

  getLiveLocationHistory: async (
    employeeId: string | number,
    params?: {
      startDate?: string;
      endDate?: string;
      sessionId?: string;
      limit?: number;
      stayRadiusMeters?: number;
      minimumStayMinutes?: number;
    }
  ): Promise<{
    data?: {
      employee?: any;
      points: any[];
      summary?: any;
    };
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.getLiveLocationHistory(String(employeeId), params);
      return {
        data: {
          employee: response.data?.employee,
          points: response.data?.points || [],
          summary: response.data?.summary || {},
        },
      };
    } catch (error: any) {
      console.error("Error fetching live location history:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to fetch live location history",
      };
    }
  },

  // Real-time tracking API methods
  sendLocation: async (
    employeeId: string | number,
    latitude: number,
    longitude: number,
    accuracy?: number,
    address?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.saveEmployeeLocation({
        employeeId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        address: address || null,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error sending location:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to send location",
      };
    }
  },

  getEmployeeLocations: async (): Promise<{
    data?: any[];
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.getEmployeeLocations();
      return {
        data: response.data?.data || response.data || [],
      };
    } catch (error: any) {
      console.error("Error fetching employee locations:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to fetch locations",
      };
    }
  },

  getLocationHistory: async (
    employeeId: string | number,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<{
    data?: any[];
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.getLocationHistory(String(employeeId), {
        startDate,
        endDate,
        limit: limit || 100,
      });
      return {
        data: response.data?.data || response.data || [],
      };
    } catch (error: any) {
      console.error("Error fetching location history:", error);
      return {
        error: error.response?.data?.message || error.message || "Failed to fetch location history",
      };
    }
  },

  stopTracking: async (employeeId: string | number): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await ENDPOINTS.stopTracking(String(employeeId));
      return { success: true };
    } catch (error: any) {
      console.error("Error stopping tracking:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to stop tracking",
      };
    }
  },
};
