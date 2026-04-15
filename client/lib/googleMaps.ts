export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export const GOOGLE_MAPS_LOADER_OPTIONS = {
  id: "script-loader",
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  libraries: ["maps"] as const,
  language: "en",
  region: "US",
};
