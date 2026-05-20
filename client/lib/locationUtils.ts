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

// Reverse geocoding using OpenStreetMap Nominatim API (free, no API key needed)
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  if (googleKey) {
    try {
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleKey}`
      );
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        const formatted = googleData?.results?.[0]?.formatted_address;
        if (formatted) return String(formatted);
      }
    } catch (googleError) {
      console.error("Google reverse geocoding failed:", googleError);
    }
  }

  try {
    // Prefer backend proxy (Mappls / MapmyIndia). Keeps API tokens off the client.
    const response = await api.get("/geocode/reverse", {
      params: { lat: latitude, lng: longitude, fallback: 1 },
    });

    if (response.data?.success && response.data?.address) {
      return String(response.data.address);
    }

    return null;
  } catch (error) {
    // Fallback: Nominatim (only if backend geocoder is unavailable)
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      if (!nominatimResponse.ok) {
        console.error("Reverse geocoding failed:", nominatimResponse.status);
        return null;
      }

      const data = await nominatimResponse.json();
      const address = data.address;
      if (address) {
        const sanitizePart = (value: unknown) => {
          const raw = String(value || "").trim();
          if (!raw) return "";
          return raw
            .replace(/^zone\s*\d+\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
        };

        const parts = [
          sanitizePart(address.amenity || address.building || address.shop || ""),
          sanitizePart(address.house_number || ""),
          sanitizePart(address.road || address.pedestrian || address.footway || ""),
          sanitizePart(address.neighbourhood || address.quarter || address.suburb || address.city_district || ""),
          sanitizePart(address.city || address.town || address.village || ""),
          sanitizePart(address.state || ""),
          sanitizePart(address.postcode || ""),
        ].filter((part) => Boolean(String(part || "").trim()));

        const combined = parts.join(", ");
        if (combined) return combined;

        const display = sanitizePart(data.display_name) || String(data.display_name || "").trim();
        return display || null;
      }

      return data.display_name || null;
    } catch (fallbackError) {
      console.error("Error during reverse geocoding:", error);
      console.error("Fallback reverse geocoding failed:", fallbackError);
      return null;
    }
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
