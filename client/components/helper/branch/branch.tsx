import ENDPOINTS from "@/lib/endpoint";

  // companyId?: string;
// companyApi.ts

export interface Branch {
  id: string;               // backend-la varadhu (usually number or string)
  branchId?: string;        // optional branch code if any
  name: string;
  address: string;
  coordinates: string;      // "13.082680,80.270718"
  radius: number;           // 150 or any number
  // You can add more later if needed
  // createdAt?: string;
  // updatedAt?: string;
  // companyId?: string;
}


export interface Branch {
  id: string;
  branchId?: string;
  name: string;
  address: string;
  coordinates: string;   // "13.082680,80.270718"
  radius: number;        // 150
}

export const branchApi = {
  // ... your getCompany function remains the same

  createBranch: async (
    branchData: {
      name: string;
      address: string;
      coordinates: string;
      radius: number;
    }
  ): Promise<{ data?: Branch; error?: string }> => {
    try {
      const response = await ENDPOINTS.createBranch(branchData);

      // Backend success response la branch object irundha
      if (response.data?.success && response.data?.branch) {
        const apiBranch = response.data.branch;

        const mappedBranch: Branch = {
          id: apiBranch.id?.toString() || apiBranch._id?.toString(), // number/string safe
          branchId: apiBranch.branch_id || apiBranch.branchId,
          name: apiBranch.name,
          address: apiBranch.address,
          coordinates: apiBranch.coordinates,
          radius: apiBranch.radius,
          // createdAt: apiBranch.created_at || apiBranch.createdAt,
        };

        return { data: mappedBranch };
      }

      // Some APIs return the created branch directly without "success" wrapper
      if (response.data?.id || response.data?.name) {
        const apiBranch = response.data;

        const mappedBranch: Branch = {
          id: apiBranch.id?.toString() || apiBranch._id?.toString(),
          branchId: apiBranch.branch_id || apiBranch.branchId,
          name: apiBranch.name,
          address: apiBranch.address,
          coordinates: apiBranch.coordinates,
          radius: apiBranch.radius,
        };

        return { data: mappedBranch };
      }

      return { error: "Branch created but response format not recognized" };
    } catch (error: any) {
      console.error("Error creating branch:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create branch. Please try again.",
      };
    }
  },


  // @/components/helper/company/company.ts

// Existing interfaces


// Inside companyApi object-la idha add pannu
getBranches: async (): Promise<{ data?: Branch[]; error?: string }> => {
  try {
    const response = await ENDPOINTS.getBranches(); // GET /branch or /branches

    // Most common backend response patterns
    if (response.data?.success && response.data?.branches) {
      const apiBranches = response.data.branches;

      const mapped: Branch[] = apiBranches.map((b: any) => ({
        id: b.id?.toString() || b._id?.toString() || "",
        branchId: b.branch_id || b.branchId,
        name: b.name || b.branch_name || "",
        address: b.address || "",
        coordinates: b.coordinates || "",
        radius: Number(b.radius) || 0,
      }));

      return { data: mapped };
    }

    // If API returns array directly: { branches: [...] } illama [...] mattum
    if (Array.isArray(response.data)) {
      const mapped: Branch[] = response.data.map((b: any) => ({
        id: b.id?.toString() || b._id?.toString() || "",
        branchId: b.branch_id || b.branchId,
        name: b.name || "",
        address: b.address || "",
        coordinates: b.coordinates || "",
        radius: Number(b.radius) || 0,
      }));

      return { data: mapped };
    }

    return { error: "No branches found in response" };
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    return {
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to load branches",
    };
  }
},

  
updateBranch: async (
    id: string,
    branchData: Partial<{
      name: string;
      address: string;
      coordinates: string;
      radius: number;
    }>
  ): Promise<{ data?: Branch; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateBranch(id, branchData);

      if (response.data?.success && response.data?.branch) {
        const b = response.data.branch;
        return {
          data: {
            id: b.id?.toString() || b._id?.toString() || id,
            branchId: b.branch_id || b.branchId,
            name: b.name,
            address: b.address,
            coordinates: b.coordinates,
            radius: Number(b.radius),
          },
        };
      }

      // Fallback: direct updated object
      if (response.data?.id || response.data?.name) {
        const b = response.data;
        return {
          data: {
            id: b.id?.toString() || b._id?.toString() || id,
            branchId: b.branch_id || b.branchId,
            name: b.name,
            address: b.address,
            coordinates: b.coordinates,
            radius: Number(b.radius),
          },
        };
      }

      return { error: "Failed to update branch – unexpected response" };
    } catch (error: any) {
      console.error("Error updating branch:", error);
      return {
        error: error.response?.data?.message || "Failed to update branch",
      };
    }
  },

deleteBranch: async (id: string): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteBranch(id);

      // Most backends return { success: true } or 204 No Content
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        return { success: true };
      }

      return { error: "Unexpected response from server" };
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete branch",
      };
    }
  },


};
 



export default branchApi;