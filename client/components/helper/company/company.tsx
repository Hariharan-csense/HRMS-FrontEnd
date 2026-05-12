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
  payrollStartDay?: number;
  payrollEndDay?: number;
  timezone: string;
  logo?: string;
  logoFile?: File;
  signature?: string;
  signatureFile?: File;
  removeLogo?: boolean;
  removeSignature?: boolean;
  esslEnabled?: boolean;
  esslApiKey?: string;
  esslApiKeyConfigured?: boolean;
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
            payrollStartDay: Number(companyData.payroll_start_day) || 1,
            payrollEndDay: Number(companyData.payroll_end_day) || 31,
            timezone: companyData.timezone,
            logo: companyData.logo_url,
            signature: companyData.signature_url,
            esslEnabled: Boolean(companyData.essl_enabled),
            esslApiKeyConfigured: Boolean(companyData.essl_api_key_configured),
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
      const formData = new FormData();
      const payload: any = data || {};

      if (payload.name !== undefined) formData.append('name', payload.name);
      if (payload.legalName !== undefined) formData.append('legalName', payload.legalName);
      if (payload.gstin !== undefined) formData.append('gstin', payload.gstin);
      if (payload.industry !== undefined) formData.append('industry', payload.industry);
      if (payload.timezone !== undefined) formData.append('timezone', payload.timezone);
      if (payload.payrollCycle !== undefined) formData.append('payrollCycle', payload.payrollCycle);
      if (payload.payrollStartDay !== undefined) formData.append('payrollStartDay', String(payload.payrollStartDay));
      if (payload.payrollEndDay !== undefined) formData.append('payrollEndDay', String(payload.payrollEndDay));
      if (payload.address !== undefined) formData.append('address', payload.address);
      if (payload.esslApiKey !== undefined) formData.append('esslApiKey', payload.esslApiKey);
      if (payload.esslEnabled !== undefined) formData.append('esslEnabled', String(payload.esslEnabled));
      if (payload.removeLogo !== undefined) formData.append('removeLogo', String(payload.removeLogo));
      if (payload.removeSignature !== undefined) formData.append('removeSignature', String(payload.removeSignature));

      // Company logo must be uploaded as multipart file field: "logo"
      if (!payload.removeLogo && payload.logoFile instanceof File) {
        formData.append('logo', payload.logoFile);
      }

      if (!payload.removeSignature && payload.signatureFile instanceof File) {
        formData.append('signature', payload.signatureFile);
      }

      const response = await ENDPOINTS.updateCompany(id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
            payrollStartDay: Number(companyData.payroll_start_day) || 1,
            payrollEndDay: Number(companyData.payroll_end_day) || 31,
            timezone: companyData.timezone,
            logo: companyData.logo_url,
            signature: companyData.signature_url,
            esslEnabled: Boolean(companyData.essl_enabled),
            esslApiKeyConfigured: Boolean(companyData.essl_api_key_configured),
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
