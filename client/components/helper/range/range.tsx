import ENDPOINTS from "@/lib/endpoint";

/**
 * Sequence (Autonumber) interface
 */
export interface Sequence {
  id: number;
  company_id: number;
  module: string;
  prefix: string;
  start_number: number;
  current_number: number;
  number_length: number;
  created_at: string;
  updated_at: string;
}

/**
 * Sequence API helper
 */
export const sequenceApi = {
  // ✅ Get all sequences
  getSequences: async (): Promise<{ data?: Sequence[]; error?: string }> => {
    try {
      const response = await ENDPOINTS.getSequences();

      // Case 1: { success: true, sequences: [...] }
      if (response.data?.success && response.data?.sequences) {
        const mapped: Sequence[] = response.data.sequences.map((s: any) => ({
          id: s.id?.toString() || s._id?.toString(),
          module: s.module,
          prefix: s.prefix,
          currentNumber: Number(s.current_number || s.currentNumber || 0),
          suffix: s.suffix,
          isActive: s.is_active ?? s.isActive,
        }));

        return { data: mapped };
      }

      // Case 2: API returns array directly in data field
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const mapped: Sequence[] = response.data.data.map((s: any) => ({
          id: s.id,
          company_id: s.company_id,
          module: s.module,
          prefix: s.prefix,
          start_number: s.start_number,
          current_number: s.current_number,
          number_length: s.number_length,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));

        return { data: mapped };
      }

      // Case 3: API returns array directly
      if (Array.isArray(response.data)) {
        const mapped: Sequence[] = response.data.map((s: any) => ({
          id: s.id,
          company_id: s.company_id,
          module: s.module,
          prefix: s.prefix,
          start_number: s.start_number,
          current_number: s.current_number,
          number_length: s.number_length,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));

        return { data: mapped };
      }

      return { error: "No sequences found in response" };
    } catch (error: any) {
      console.error("Error fetching sequences:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to load sequences",
      };
    }
  },

  // ✅ Create sequence
  createSequence: async (
    data: {
      module: string;
      prefix: string;
      start_number?: number;
      current_number?: number;
      number_length?: number;
    }
  ): Promise<{ data?: Sequence; error?: string }> => {
    try {
      const response = await ENDPOINTS.createSequence(data);

      const s = response.data?.sequence || response.data;

      if (s) {
        return {
          data: {
            id: s.id,
            company_id: s.company_id,
            module: s.module,
            prefix: s.prefix,
            start_number: s.start_number,
            current_number: s.current_number,
            number_length: s.number_length,
            created_at: s.created_at,
            updated_at: s.updated_at,
          },
        };
      }

      return { error: "Sequence created but response format not recognized" };
    } catch (error: any) {
      console.error("Error creating sequence:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create sequence",
      };
    }
  },

  // ✅ Update sequence
  updateSequence: async (
    id: string,
    data: Partial<{
      prefix: string;
      start_number: number;
      current_number: number;
      number_length: number;
    }>
  ): Promise<{ data?: Sequence; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateSequence(id, data);
      const s = response.data?.sequence || response.data;

      if (s) {
        return {
          data: {
            id: s.id,
            company_id: s.company_id,
            module: s.module,
            prefix: s.prefix,
            start_number: s.start_number,
            current_number: s.current_number,
            number_length: s.number_length,
            created_at: s.created_at,
            updated_at: s.updated_at,
          },
        };
      }

      return { error: "Failed to update sequence – unexpected response" };
    } catch (error: any) {
      console.error("Error updating sequence:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to update sequence",
      };
    }
  },

  // ✅ Delete sequence
  deleteSequence: async (
    id: string
  ): Promise<{ success?: boolean; error?: string }> => {
    try {
      const response = await ENDPOINTS.deleteSequence(id);

      if (
        response.status === 200 ||
        response.status === 204 ||
        response.data?.success
      ) {
        return { success: true };
      }

      return { error: "Unexpected response from server" };
    } catch (error: any) {
      console.error("Error deleting sequence:", error);
      return {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete sequence",
      };
    }
  },
};

export default sequenceApi;
