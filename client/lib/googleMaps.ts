import type { Libraries } from "@react-google-maps/api";

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const GOOGLE_MAPS_LIBRARIES: Libraries = ["maps"];

export const GOOGLE_MAPS_LOADER_OPTIONS = {
  id: "script-loader",
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  libraries: GOOGLE_MAPS_LIBRARIES,
  language: "en",
  region: "US",
} as any;
