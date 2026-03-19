import { useEffect, useState } from "react";
import branchApi from "@/components/helper/branch/branch";

export type OfficeLocation = {
  coordinates: { lat: number; lng: number };
  name?: string;
  radius: number;
};

export function useOfficeLocation() {
  const [office, setOffice] = useState<OfficeLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await branchApi.getBranches();
        if (res.data && res.data.length > 0) {
          const primary = res.data[0];
          const [lat, lng] = (primary.coordinates || "")
            .split(",")
            .map((v: string) => Number(v.trim()));
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const radiusValue = Number(primary.radius) || 0;
            const radiusMeters =
              radiusValue > 1000
                ? radiusValue // already in meters
                : radiusValue * 1000; // treat small numbers as km -> meters
            setOffice({
              coordinates: { lat, lng },
              name: primary.name || "Office",
              radius: radiusMeters || 200,
            });
          } else {
            setError("Invalid coordinates in branch");
          }
        } else {
          setOffice(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load branch");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { office, loading, error };
}
