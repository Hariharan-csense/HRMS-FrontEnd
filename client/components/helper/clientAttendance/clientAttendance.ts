import { api } from '@/lib/endpoint';

export interface ClientAttendance {
  id: number;
  employee_id: number;
  client_id: number;
  date: string;
  check_in_time: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_in_location?: string;
  check_in_notes?: string;
  check_out_time?: string;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_out_location?: string;
  check_out_notes?: string;
  work_completed?: string;
  duration_minutes?: number;
  client_name?: string;
  client_code?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckInData {
  clientId: number;
  latitude: number;
  longitude: number;
  location: string;
  notes?: string;
}

export interface CheckOutData {
  attendanceId: number;
  latitude: number;
  longitude: number;
  location: string;
  notes?: string;
  workCompleted?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  location?: string;
}

// Get current location
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Get address from coordinates using reverse geocoding (placeholder)
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Using Nominatim (OpenStreetMap) for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return data.display_name || `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${latitude}, ${longitude}`;
  }
};

export const clientAttendanceApi = {
  // Get today's client attendance
  getTodayAttendance: async () => {
    try {
      const response = await api.get("/client-attendance/today");
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
      throw error;
    }
  },

  // Get active check-in
  getActiveCheckIn: async () => {
    try {
      const response = await api.get("/client-attendance/active");
      return response.data;
    } catch (error) {
      console.error('Error fetching active check-in:', error);
      throw error;
    }
  },

  // Check in to client
  checkIn: async (checkInData: CheckInData) => {
    try {
      const response = await api.post("/client-attendance/checkin", checkInData);
      return response.data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  },

  // Check out from client
  checkOut: async (attendanceId: number, checkOutData: CheckOutData) => {
    try {
      const response = await api.post(`/client-attendance/checkout/${attendanceId}`, checkOutData);
      return response.data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  },

  // Check geo-fence status
  checkGeoFence: async (clientId: number, latitude: number, longitude: number) => {
    try {
      const response = await api.post("/geo-fence/check", {
        clientId,
        employeeLatitude: latitude,
        employeeLongitude: longitude
      });
      return response.data;
    } catch (error) {
      console.error('Error checking geo-fence:', error);
      throw error;
    }
  },

  // Get attendance history
  getHistory: async (params?: { startDate?: string; endDate?: string; clientId?: number }) => {
    try {
      const response = await api.get("/client-attendance/history", {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      throw error;
    }
  }
};
