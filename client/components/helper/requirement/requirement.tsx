import ENDPOINTS from '@/lib/endpoint';

export interface JobRequirement {
  id?: string;
  title: string;
  department: string;
  location: string;
  experience: string;
  salary: string;
  description: string;
  status: 'active' | 'closed' | 'on-hold';
  positions: number;
  filledPositions: number;
  urgency: 'low' | 'medium' | 'high';
  closingDate?: string;
  requiredSkills?: string;
  preferredSkills?: string;
  qualifications?: string;
  responsibilities?: string;
  benefits?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JobRequirementsApiResponse {
  success: boolean;
  data: Array<{
    id: number;
    title: string;
    department: string;
    location: string;
    experience: string;
    salary: string;
    description: string;
    status: 'active' | 'closed' | 'on-hold';
    positions: number;
    filled_positions: number;
    urgency: 'low' | 'medium' | 'high';
    closing_date?: string | null;
    required_skills?: string | null;
    preferred_skills?: string | null;
    qualifications?: string | null;
    responsibilities?: string | null;
    benefits?: string | null;
    created_at: string;
    updated_at: string;
  }>;
  message?: string;
}

export const getJobRequirements = async (): Promise<JobRequirement[]> => {
  try {
    console.log('Fetching job requirements...');
    const response = await ENDPOINTS.getJobRequirements() as { data: JobRequirementsApiResponse };
    console.log('API Response:', response);
    
    if (!response.data.success || !Array.isArray(response.data.data)) {
      console.warn('Invalid API response format:', response.data);
      return [];
    }
    
    // Map the API response to the JobRequirement type
    return response.data.data.map(item => ({
      id: String(item.id),
      title: item.title || '',
      department: item.department || '',
      location: item.location || '',
      experience: item.experience || '',
      salary: item.salary || '',
      description: item.description || '',
      status: item.status || 'active',
      positions: Number(item.positions) || 0,
      filledPositions: Number(item.filled_positions) || 0,
      urgency: item.urgency || 'medium',
      closingDate: item.closing_date,
      requiredSkills: item.required_skills,
      preferredSkills: item.preferred_skills,
      qualifications: item.qualifications || '',
      responsibilities: item.responsibilities || '',
      benefits: item.benefits || '',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('Error fetching job requirements:', error);
    // Return empty array instead of throwing to prevent unhandled promise rejection
    return [];
  }
};

export const createJobRequirement = async (data: Omit<JobRequirement, 'id'>) => {
  try {
    // Create a new object with snake_case property names for the API
    const apiData: Record<string, any> = {};
    
    // Copy all properties, converting camelCase to snake_case
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'filledPositions') {
        apiData['filled_positions'] = value;
      } else if (key === 'closingDate') {
        apiData['closing_date'] = value;
      } else if (key === 'requiredSkills') {
        apiData['required_skills'] = value;
      } else if (key === 'preferredSkills') {
        apiData['preferred_skills'] = value;
      } else if (key === 'createdAt') {
        apiData['created_at'] = value;
      } else if (key === 'updatedAt') {
        apiData['updated_at'] = value;
      } else if (key === 'qualifications' || key === 'responsibilities' || key === 'benefits') {
        // These fields don't need conversion as they're already in the correct format
        apiData[key] = value;
      } else {
        apiData[key] = value;
      }
    });
    
    const response = await ENDPOINTS.createJobRequirement(apiData);
    return response.data;
  } catch (error) {
    console.error('Error creating job requirement:', error);
    throw error;
  }
};

export const updateJobRequirement = async (id: string, data: Partial<JobRequirement>) => {
  try {
    // Create a new object with snake_case property names for the API
    const apiData: Record<string, any> = {};
    
    // Copy all properties, converting camelCase to snake_case
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'filledPositions') {
        apiData['filled_positions'] = value;
      } else if (key === 'closingDate') {
        apiData['closing_date'] = value;
      } else if (key === 'requiredSkills') {
        apiData['required_skills'] = value;
      } else if (key === 'preferredSkills') {
        apiData['preferred_skills'] = value;
      } else if (key === 'createdAt') {
        apiData['created_at'] = value;
      } else if (key === 'updatedAt') {
        apiData['updated_at'] = value;
      } else if (key === 'qualifications' || key === 'responsibilities' || key === 'benefits') {
        // These fields don't need conversion as they're already in the correct format
        apiData[key] = value;
      } else {
        apiData[key] = value;
      }
    });
    
    const response = await ENDPOINTS.updateJobRequirement(id, apiData);
    return response.data;
  } catch (error) {
    console.error('Error updating job requirement:', error);
    throw error;
  }
};

export const deleteJobRequirement = async (id: string) => {
  try {
    const response = await ENDPOINTS.deleteJobRequirement(id);
    return response.data;
  } catch (error) {
    console.error('Error deleting job requirement:', error);
    throw error;
  }
};

export const getJobRequirementsStats = async () => {
  try {
    const response = await ENDPOINTS.getJobRequirementsStats();
    return response.data;
  } catch (error) {
    console.error('Error fetching job requirements stats:', error);
    throw error;
  }
};