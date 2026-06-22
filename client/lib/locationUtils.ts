// Office locations with coordinates
import { api } from "@/lib/endpoint";

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export const PREDEFINED_OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    id: "office-1",
    name: "Chennai - Office Building A",
    latitude: 13.0827,
    longitude: -80.2707,
    address: "Tidel Park, Taramani, Chennai",
    city: "Chennai",
    country: "India",
  },
  {
    id: "office-2",
    name: "Bangalore - Tech Park",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Whitefield, Bangalore",
    city: "Bangalore",
    country: "India",
  },
  {
    id: "office-3",
    name: "Mumbai - HQ",
    latitude: 19.0760,
    longitude: 72.8777,
    address: "Lower Parel, Mumbai",
    city: "Mumbai",
    country: "India",
  },
  {
    id: "office-4",
    name: "Delhi - North Office",
    latitude: 28.5355,
    longitude: 77.3910,
    address: "Gurgaon, Delhi NCR",
    city: "Delhi",
    country: "India",
  },
];

// Reverse geocoding through the backend so provider keys stay server-side.
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    // Backend proxy keeps Google/Mappls provider tokens off the client.
    const response = await api.get("/geocode/reverse", {
      params: { lat: latitude, lng: longitude, fallback: 1 },
    });

    if (response.data?.success && response.data?.address) {
      return String(response.data.address);
    }

    return null;
  } catch (error) {
    console.error("Backend reverse geocoding failed:", error);
    return null;
  }
};

// Find closest office location based on coordinates
export const findClosestOffice = (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): OfficeLocation | null => {
  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let closestOffice: OfficeLocation | null = null;
  let minDistance = radiusKm;

  PREDEFINED_OFFICE_LOCATIONS.forEach((office) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      office.latitude,
      office.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestOffice = office;
    }
  });

  return closestOffice;
};

// Get all office locations
export const getAllOfficeLocations = (): OfficeLocation[] => {
  return PREDEFINED_OFFICE_LOCATIONS;
};

// Get office location by ID
export const getOfficeLocationById = (id: string): OfficeLocation | undefined => {
  return PREDEFINED_OFFICE_LOCATIONS.find((office) => office.id === id);
};
