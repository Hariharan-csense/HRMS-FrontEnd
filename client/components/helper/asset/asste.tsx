// assetApi.ts

import ENDPOINTS  from '@/lib/endpoint'; // Adjust if your endpoints are imported differently
import { en } from 'zod/v4/locales';

// OR if you use a direct api instance:
// import api from '@/api';

// Define the Asset interface
export interface Asset {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  purchaseDate?: string;
  cost?: number;
  isActive?: boolean;
  // Add other fields as per your backend response
  [key: string]: any;
}


export interface Asset {
  id: string;
  assetId?: string; // optional if you use asset_id from backend
  name: string;
  type: string;
  serial: string;
  assignedEmployee?: string;
  assignedEmployeeName?: string;
  issueDate?: string;
  status: string;
  location?: string;
  value?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssetData {
  name: string;
  type: string;
  serial: string;
  assigned_employee_id?: string | null;
  issue_date?: string;
  status: string;
  location?: string;
  value?: number | string;
  description?: string;
}

export interface UpdateAssetData {
  name?: string;
  type?: string;
  serial?: string;
  assigned_employee_id?: string | null;
  issue_date?: string;
  status?: string;
  location?: string;
  value?: number | string;
  description?: string;
}

const assetApi = {
 
getAssets: async (): Promise<{ data?: Asset[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getAsset();
    // அல்லது api.get("/asset") இருந்தா அத use பண்ணலாம்

    console.log("Raw Asset API Response:", response.data); // Debug purpose

    let rawArray: any[] = [];

    // Primary case: { success: true, assets: [...] }
    if (response.data?.success && Array.isArray(response.data.assets)) {
      rawArray = response.data.assets;
    }
    // Fallback: direct array
    else if (Array.isArray(response.data)) {
      rawArray = response.data;
    }
    // Fallback: { data: [...] } format (rare case)
    else if (Array.isArray(response.data?.data)) {
      rawArray = response.data.data;
    }
    else {
      console.warn("Unexpected asset response format:", response.data);
      return { error: "Invalid response format: expected 'assets' array" };
    }

    const mapped: Asset[] = rawArray.map((a: any) => ({
      id: a.id?.toString() || '',
      assetId: a.asset_id || '',                        // ← AST0001
      name: a.name || '',
      type: (a.type || 'other').toLowerCase(),          // ← "LAPTOP" → "laptop" for dropdown
      serial: a.serial_number || '',
      assignedEmployee: a.assigned_employee_id?.toString() || '',
      assignedEmployeeName: a.assigned_employee_name || null,
      issueDate: a.issue_date
        ? new Date(a.issue_date).toISOString().split("T")[0]
        : '',
      status: (a.status || 'active').toLowerCase(),     // ← "Active" → "active"
      location: a.location || '',
      value: parseFloat(a.value || "0") || 0,
      description: a.description || '',
      createdAt: a.created_at || '',
      updatedAt: a.updated_at || '',
    }));

    console.log("Mapped Assets for UI:", mapped);

    return { data: mapped };
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load assets",
    };
  }
},

createAsset: async (data: CreateAssetData): Promise<{ data?: Asset; error?: string }> => {
    try {
      const response = await ENDPOINTS.createAsset(data);

      // Adjust based on your backend response
      if (response.data?.success && response.data.asset) {
        return { data: response.data.asset as Asset };
      }

      if (response.data) {
        return { data: response.data as Asset };
      }

      return { error: "Invalid response: no asset data" };
    } catch (error: any) {
      console.error("Error creating asset:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create asset";
      return { error: errorMessage };
    }
  },

  /**
   * Update an existing asset
   */
  updateAsset: async (id: string, data: UpdateAssetData): Promise<{ data?: Asset; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateAsset(id, data);

      if (response.data?.success && response.data.asset) {
        return { data: response.data.asset as Asset };
      }

      if (response.data) {
        return { data: response.data as Asset };
      }

      return { error: "Invalid response: no updated asset data" };
    } catch (error: any) {
      console.error("Error updating asset:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update asset";
      return { error: errorMessage };
    }
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteAsset(id);

      if (response.data?.success || response.status === 200 || response.status === 204) {
        return { success: true };
      }

      return { error: "Delete failed: invalid response" };
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete asset";
      return { error: errorMessage };
    }
  },

};

export default assetApi;