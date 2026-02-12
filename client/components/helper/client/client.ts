import ENDPOINTS from '../../../lib/endpoint';

export interface Client {
  id: number;
  client_id: string;
  client_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  industry?: string;
  address?: string;
  status: 'active' | 'inactive';
  company_id: number;
  assigned_to?: number;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
  // Geo-fence properties
  geo_latitude?: number;
  geo_longitude?: number;
  geo_radius?: number;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  email: string;
}

export const clientApi = {
  // Get all clients
  getClients: async () => {
    try {
      const response = await ENDPOINTS.getClients();
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  // Create new client
  createClient: async (clientData: Partial<Client>) => {
    try {
      const response = await ENDPOINTS.createClient(clientData);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Update client
  updateClient: async (id: number, clientData: Partial<Client>) => {
    try {
      const response = await ENDPOINTS.updateClient(id.toString(), clientData);
      return response.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Delete client
  deleteClient: async (id: number) => {
    try {
      const response = await ENDPOINTS.deleteClient(id.toString());
      return response.data;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Get employees for assignment
  getEmployeesForAssignment: async () => {
    try {
      const response = await ENDPOINTS.getEmployee();
      // Handle the response format where employees are nested under response.data.employees
      if (response.data && response.data.employees) {
        return { data: response.data.employees };
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }
};
