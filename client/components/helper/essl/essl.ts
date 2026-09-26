import { api } from "@/lib/endpoint";

export interface EsslDevice {
  id: number; device_name: string; device_model: string | null;
  device_serial_number: string | null; device_ip: string | null;
  device_port: number | null; connection_type: string | null;
  integration_type: string | null; api_url: string | null; is_active: boolean | number;
  last_sync_at: string | null; last_sync_status: string | null; last_sync_error: string | null;
}
export interface EsslEmployee { id: number; employee_id: string; first_name: string; last_name: string }
export interface EsslMapping {
  id: number; device_id: number; employee_id: number; essl_user_id: string;
  is_active: boolean | number; device_name: string; first_name: string; last_name: string; employee_code: string;
}
export interface EsslLog {
  id: number; employee_id: number | null; essl_user_id: string | null; device_name: string;
  first_name: string | null; last_name: string | null; employee_code: string | null;
  punch_time: string | null; punch_type: string | null; processed: boolean | number;
  processing_error: string | null; created_at: string;
}
export interface EsslSync {
  id: number; device_id: number; sync_batch_id: string; started_at: string; completed_at: string | null;
  status: string; fetched_count: number; inserted_count: number; duplicate_count: number;
  processed_count: number; failed_count: number; error_message: string | null;
}
const root = "/essl";
export const esslApi = {
  devices: async (): Promise<EsslDevice[]> => (await api.get(root + "/devices")).data.data,
  saveDevice: (id: number | null, data: unknown) => id ? api.put(root + "/devices/" + id, data) : api.post(root + "/devices", data),
  disableDevice: (id: number) => api.delete(root + "/devices/" + id),
  action: (id: number, action: "test-connection" | "sync") => api.post(root + "/devices/" + id + "/" + action),
  mappings: async (): Promise<EsslMapping[]> => (await api.get(root + "/mappings")).data.data,
  saveMapping: (id: number | null, data: unknown) => id ? api.put(root + "/mappings/" + id, data) : api.post(root + "/mappings", data),
  disableMapping: (id: number) => api.delete(root + "/mappings/" + id),
  employees: async (search = ""): Promise<EsslEmployee[]> => (await api.get(root + "/employees", { params: { search } })).data.data,
  logs: async (params: Record<string, string | number>): Promise<EsslLog[]> => (await api.get(root + "/logs", { params })).data.data,
  syncLogs: async (page = 1): Promise<EsslSync[]> => (await api.get(root + "/sync-logs", { params: { page, limit: 50 } })).data.data,
};

