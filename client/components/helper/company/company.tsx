import ENDPOINTS from "@/lib/endpoint";

export interface Company {
  id: string;
  companyId: string;
  name: string;
  legalName: string;
  gstin: string;
  industry: string;
  address: string;
  payrollCycle: string;
  timezone: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
}

export const companyApi = {
  getCompany: async (): Promise<{ data?: Company; error?: string }> => {
    try {
      const response = await ENDPOINTS.getCompany();
      // The API returns { success: true, company: {...} }
      if (response.data?.success && response.data.company) {
        // Map the API response to our Company interface
        const companyData = response.data.company;
        return {
          data: {
            id: companyData.id.toString(),
            companyId: companyData.company_id || '',
            name: companyData.company_name,
            legalName: companyData.legal_name,
            gstin: companyData.gstin_pan,
            industry: companyData.industry,
            address: companyData.address,
            payrollCycle: companyData.payroll_cycle,
            timezone: companyData.timezone,
            logo: companyData.logo_url,
            createdAt: companyData.created_at,
            updatedAt: companyData.updated_at
          }
        };
      }
      return { error: 'No company data available' };
    } catch (error: any) {
      console.error('Error fetching company:', error);
      return { 
        error: error.response?.data?.message || 'Failed to fetch company data' 
      };
    }
  },

  updateCompany: async (id: string, data: Partial<Company>): Promise<{ data?: Company; error?: string }> => {
    try {
      const response = await ENDPOINTS.updateCompany(id, data);
      if (response.data?.success && response.data.company) {
        const companyData = response.data.company;
        return {
          data: {
            id: companyData.id.toString(),
            companyId: companyData.company_id || '',
            name: companyData.company_name,
            legalName: companyData.legal_name,
            gstin: companyData.gstin_pan,
            industry: companyData.industry,
            address: companyData.address,
            payrollCycle: companyData.payroll_cycle,
            timezone: companyData.timezone,
            logo: companyData.logo_url,
            createdAt: companyData.created_at,
            updatedAt: companyData.updated_at
          }
        };
      }
      return { error: 'Failed to update company' };
    } catch (error: any) {
      console.error('Error updating company:', error);
      return {
        error: error.response?.data?.message || 'Failed to update company'
      };
    }
  },
  
  // You can add more company-related API functions here
  // createCompany, deleteCompany, etc.
};

export default companyApi;