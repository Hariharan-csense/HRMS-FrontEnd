import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Send, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  Calendar,
  DollarSign,
  Building,
  UserCheck
} from 'lucide-react';
import { BASE_URL } from '@/lib/endpoint';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

// API service - using the configured base URL from endpoint.tsx
const api = {
  getOfferLetters: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/offer-letters?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  },

  getOfferLetterById: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  },

  createOfferLetter: async (data: any) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateOfferLetter: async (id: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteOfferLetter: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  },

  sendOfferLetter: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/${id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  },

  getOfferTemplates: async () => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/templates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  },

  createOfferTemplate: async (data: any) => {
    try {
      console.log('Creating template with data:', data);
      const response = await fetch(`${BASE_URL}/api/offer-letters/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  },

  updateOfferTemplate: async (id: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteOfferTemplate: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/offer-letters/templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.json();
  }
};

interface OfferLetter {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  salary: string;
  startDate: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  template: string;
  customTerms?: string;
  sentDate?: string;
  responseDate?: string;
  createdAt: string;
  lastUpdated: string;
}

interface OfferTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

const HROfferLetters: React.FC = () => {
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferLetter | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [activeTab, setActiveTab] = useState('offers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);

  // Helper function to transform snake_case API response to camelCase
  const transformOfferData = (apiData: any): OfferLetter => {
    return {
      id: apiData.id.toString(),
      candidateId: apiData.candidate_id || '',
      candidateName: apiData.candidate_name || '',
      candidateEmail: apiData.candidate_email || '',
      position: apiData.position || '',
      department: apiData.department || '',
      salary: apiData.salary || '',
      startDate: apiData.start_date ? new Date(apiData.start_date).toISOString().split('T')[0] : '',
      location: apiData.location || '',
      employmentType: apiData.employment_type || 'full-time',
      status: apiData.status || 'draft',
      template: apiData.template || '',
      customTerms: apiData.custom_terms || '',
      sentDate: apiData.sent_date ? new Date(apiData.sent_date).toISOString().split('T')[0] : undefined,
      responseDate: apiData.response_date ? new Date(apiData.response_date).toISOString().split('T')[0] : undefined,
      createdAt: apiData.created_at ? new Date(apiData.created_at).toISOString().split('T')[0] : '',
      lastUpdated: apiData.updated_at ? new Date(apiData.updated_at).toISOString().split('T')[0] : ''
    };
  };

  const [formData, setFormData] = useState<{
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    position: string;
    department: string;
    salary: string;
    startDate: string;
    location: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    template: string;
    customTerms: string;
  }>({
    candidateId: '',
    candidateName: '',
    candidateEmail: '',
    position: '',
    department: '',
    salary: '',
    startDate: '',
    location: '',
    employmentType: 'full-time',
    template: '',
    customTerms: '',
  });

  const [templateFormData, setTemplateFormData] = useState<{
    name: string;
    content: string;
    variables: string[];
    is_default: boolean;
  }>({
    name: '',
    content: '',
    variables: [],
    is_default: false,
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [offerLettersResponse, templatesResponse] = await Promise.all([
          api.getOfferLetters(),
          api.getOfferTemplates()
        ]);

        if (offerLettersResponse.success) {
          // Transform snake_case API response to camelCase for frontend
          const transformedOfferLetters = offerLettersResponse.data.map(transformOfferData);
          setOfferLetters(transformedOfferLetters);
        } else {
          console.error('Failed to fetch offer letters:', offerLettersResponse.message);
          setError('Failed to fetch offer letters');
        }

        if (templatesResponse.success) {
          // Parse variables from JSON string to array
          const processedTemplates = templatesResponse.data.map((template: any) => ({
            ...template,
            variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]')
          }));
          setTemplates(processedTemplates);
        } else {
          console.error('Failed to fetch templates:', templatesResponse.message);
          // Don't set error for templates, just log it
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        // Don't use mock data - show empty state if API fails
        setOfferLetters([]);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(formData.candidateEmail)) {
      setError('Please enter a valid candidate email address');
      return;
    }
    
    setIsSubmittingOffer(true);
    try {
      // Transform formData to match backend expected format (snake_case)
      const backendData = {
        candidate_id: formData.candidateId,
        candidate_name: formData.candidateName,
        candidate_email: normalizeEmail(formData.candidateEmail),
        position: formData.position,
        department: formData.department,
        salary: formData.salary,
        start_date: formData.startDate,
        location: formData.location,
        employment_type: formData.employmentType,
        template: formData.template,
        custom_terms: formData.customTerms
      };

      if (editingOffer) {
        // Update existing offer letter
        const response = await api.updateOfferLetter(editingOffer.id, backendData);
        if (response.success) {
          // Transform the response data to camelCase
          const updatedOffer = transformOfferData(response.data);
          setOfferLetters(prev => prev.map(offer => 
            offer.id === editingOffer.id 
              ? updatedOffer
              : offer
          ));
        } else {
          console.error('Error updating offer letter:', response.message);
          // Fallback to local update
          setOfferLetters(prev => prev.map(offer => 
            offer.id === editingOffer.id 
              ? { ...offer, ...formData, lastUpdated: new Date().toISOString().split('T')[0] }
              : offer
          ));
        }
      } else {
        // Create new offer letter
        const response = await api.createOfferLetter(backendData);
        if (response.success) {
          // Transform the response data to camelCase
          const newOffer = transformOfferData(response.data);
          setOfferLetters(prev => [...prev, newOffer]);
        } else {
          console.error('Error creating offer letter:', response.message);
          // Fallback to local creation
          const newOffer: OfferLetter = {
            id: Date.now().toString(),
            ...formData,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString().split('T')[0],
          };
          setOfferLetters(prev => [...prev, newOffer]);
        }
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Fallback to local update
      if (editingOffer) {
        setOfferLetters(prev => prev.map(offer => 
          offer.id === editingOffer.id 
            ? { ...offer, ...formData, lastUpdated: new Date().toISOString().split('T')[0] }
            : offer
        ));
      } else {
        const newOffer: OfferLetter = {
          id: Date.now().toString(),
          ...formData,
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        setOfferLetters(prev => [...prev, newOffer]);
      }

      resetForm();
      setIsDialogOpen(false);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const resetForm = () => {
    setFormData({
      candidateId: '',
      candidateName: '',
      candidateEmail: '',
      position: '',
      department: '',
      salary: '',
      startDate: '',
      location: '',
      employmentType: 'full-time',
      template: '',
      customTerms: '',
    });
    setEditingOffer(null);
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      content: '',
      variables: [],
      is_default: false,
    });
    setEditingTemplate(null);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmittingTemplate(true);
    try {
      // Extract variables from template content - support both {{variable}} and (variable) formats
      const curlyBraceMatches = templateFormData.content.match(/\{\{([^}]+)\}\}/g);
      const parenthesisMatches = templateFormData.content.match(/\(([^)]+)\)/g);
      
      const curlyVariables = curlyBraceMatches ? curlyBraceMatches.map(v => v.replace(/[{}]/g, '')) : [];
      const parenthesisVariables = parenthesisMatches ? parenthesisMatches.map(v => v.replace(/[()]/g, '')) : [];
      
      // Combine and deduplicate variables
      const allVariables = [...new Set([...curlyVariables, ...parenthesisVariables])];
      
      const templateData = {
        ...templateFormData,
        variables: JSON.stringify(allVariables)
      };

      console.log('Submitting template data:', templateData);

      if (editingTemplate) {
        // Update existing template
        const response = await api.updateOfferTemplate(editingTemplate.id, templateData);
        if (response.success) {
          setTemplates(prev => prev.map(template => 
            template.id === editingTemplate.id 
              ? { ...response.data, variables: Array.isArray(response.data.variables) ? response.data.variables : JSON.parse(response.data.variables || '[]') }
              : template
          ));
        } else {
          console.error('Error updating template:', response.message);
          alert(response.message || 'Failed to update template');
        }
      } else {
        // Create new template
        const response = await api.createOfferTemplate(templateData);
        if (response.success) {
          const newTemplate = {
            ...response.data,
            variables: Array.isArray(response.data.variables) ? response.data.variables : JSON.parse(response.data.variables || '[]')
          };
          setTemplates(prev => [...prev, newTemplate]);
        } else {
          console.error('Error creating template:', response.message);
          alert(response.message || 'Failed to create template');
        }
      }

      resetTemplateForm();
      setIsAddTemplateDialogOpen(false);
    } catch (error) {
      console.error('Error in template submit:', error);
      alert(`Failed to ${editingTemplate ? 'update' : 'create'} template: ${error.message}`);
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleEditTemplate = (template: OfferTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      content: template.content,
      variables: Array.isArray(template.variables) ? template.variables : JSON.parse(template.variables || '[]'),
      is_default: false, // We don't track this in frontend yet
    });
    setIsAddTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await api.deleteOfferTemplate(id);
        if (response.success) {
          setTemplates(prev => prev.filter(template => template.id !== id));
        } else {
          console.error('Error deleting template:', response.message);
          alert(response.message || 'Failed to delete template');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  const handleHireCandidate = async (offer: OfferLetter) => {
    if (!offer.candidateId || offer.candidateId === '') {
      alert('Cannot hire candidate: No candidate ID associated with this offer letter');
      return;
    }

    if (window.confirm(`Are you sure you want to mark this candidate as hired?`)) {
      try {
        // Use the recruitment API to update candidate status
        const response = await fetch(`${BASE_URL}/api/recruitment/candidates/${offer.candidateId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ status: 'hired' })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('Candidate successfully marked as hired!');
            // Update the specific offer letter in state with the updated data
            setOfferLetters(prev => prev.map(offer => 
              offer.candidateId === offer.candidateId 
                ? { ...offer, status: 'hired' } // Update status in frontend
                : offer
            ));
          } else {
            alert(result.message || 'Failed to update candidate status');
          }
        } else {
          alert('Failed to update candidate status');
        }
      } catch (error) {
        console.error('Error hiring candidate:', error);
        alert('Failed to hire candidate');
      }
    }
  };

  const handleEdit = (offer: OfferLetter) => {
    setEditingOffer(offer);
    setFormData({
      candidateId: offer.candidateId,
      candidateName: offer.candidateName,
      candidateEmail: offer.candidateEmail,
      position: offer.position,
      department: offer.department,
      salary: offer.salary,
      startDate: offer.startDate,
      location: offer.location,
      employmentType: offer.employmentType,
      template: offer.template,
      customTerms: offer.customTerms || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this offer letter?')) {
      try {
        const response = await api.deleteOfferLetter(id);
        if (response.success) {
          setOfferLetters(prev => prev.filter(offer => offer.id !== id));
        } else {
          console.error('Error deleting offer letter:', response.message);
          // Fallback to local deletion
          setOfferLetters(prev => prev.filter(offer => offer.id !== id));
        }
      } catch (error) {
        console.error('Error deleting offer letter:', error);
        // Fallback to local deletion
        setOfferLetters(prev => prev.filter(offer => offer.id !== id));
      }
    }
  };

  const sendOfferLetter = async (id: string) => {
    try {
      const response = await api.sendOfferLetter(id);
      if (response.success) {
        // Transform the response data to camelCase
        const updatedOffer = transformOfferData(response.data);
        setOfferLetters(prev => prev.map(offer => 
          offer.id === id 
            ? updatedOffer
            : offer
        ));
      } else {
        console.error('Error sending offer letter:', response.message);
        // Fallback to local update
        setOfferLetters(prev => prev.map(offer => 
          offer.id === id 
            ? { 
                ...offer, 
                status: 'sent' as const, 
                sentDate: new Date().toISOString().split('T')[0],
                lastUpdated: new Date().toISOString().split('T')[0]
              }
            : offer
        ));
      }
    } catch (error) {
      console.error('Error sending offer letter:', error);
      // Fallback to local update
      setOfferLetters(prev => prev.map(offer => 
        offer.id === id 
          ? { 
              ...offer, 
              status: 'sent' as const, 
              sentDate: new Date().toISOString().split('T')[0],
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : offer
      ));
    }
  };

  const filteredOfferLetters = offerLetters.filter(offer => {
    const matchesSearch = (offer.candidateName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (offer.candidateEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (offer.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return offerLetters.filter(o => o.status === status).length;
  };

  const generatePreview = (template: string, offerData: any) => {
    let preview = templates.find(t => t.name === template)?.content || '';
    
    // Handle both form data structure and offer data structure
    const data = {
      candidateName: offerData.candidateName || offerData.candidate_name || '',
      position: offerData.position || '',
      department: offerData.department || '',
      location: offerData.location || '',
      employmentType: offerData.employmentType || offerData.employment_type || '',
      startDate: offerData.startDate || offerData.start_date || '',
      salary: offerData.salary || '',
      companyName: 'Your Company',
      responseTime: '7',
    };
    
    // Replace variables with actual data
    const replacements: { [key: string]: string } = {
      '{{candidateName}}': data.candidateName,
      '{{position}}': data.position,
      '{{department}}': data.department,
      '{{location}}': data.location,
      '{{employmentType}}': data.employmentType,
      '{{startDate}}': data.startDate,
      '{{salary}}': data.salary,
      '{{companyName}}': data.companyName,
      '{{responseTime}}': data.responseTime,
    };

    Object.keys(replacements).forEach(key => {
      preview = preview.replace(new RegExp(key, 'g'), replacements[key]);
    });

    return preview;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Offer Letters</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Manage and send offer letters to candidates</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)} className="w-full sm:w-auto">
            <Edit className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            Create Offer Letter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Offers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{offerLetters.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{offerLetters.filter(o => o.status === 'draft').length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{offerLetters.filter(o => o.status === 'sent').length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{offerLetters.filter(o => o.status === 'accepted').length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Offers</Label>
              <Input
                id="search"
                placeholder="Search by candidate name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offer Letters Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Offer Letters</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading offer letters...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : offerLetters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No offer letters found</p>
              <Button onClick={() => setIsDialogOpen(true)}>Create First Offer Letter</Button>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="sm:hidden space-y-4">
            {offerLetters.map((offer) => (
              <Card key={offer.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{offer.candidateName}</h3>
                      <p className="text-sm text-gray-500">{offer.candidateEmail}</p>
                      <p className="text-sm text-gray-600 mt-1">{offer.position}</p>
                      <p className="text-xs text-gray-500">{offer.department}</p>
                    </div>
                    <Badge className={`${getStatusColor(offer.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                      {offer.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Salary</span>
                      <span className="text-sm text-gray-900 font-medium">{offer.salary}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Start Date</span>
                      <span className="text-sm text-gray-900">{offer.startDate}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {offer.employmentType}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOffer(offer)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(offer)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {offer.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendOfferLetter(offer.id)}
                          className="h-8 px-2 text-xs"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {offer.candidateId && offer.candidateId !== '' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHireCandidate(offer)}
                          className="h-8 px-2 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Hire
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</TableHead>
                  <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Position</TableHead>
                  <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Salary</TableHead>
                  <TableHead className="min-w-[80px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</TableHead>
                  <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Start Date</TableHead>
                  <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {offerLetters.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{offer.candidateName}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">{offer.candidateEmail}</div>
                        <div className="text-xs text-gray-600 mt-1 sm:hidden">{offer.position}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{offer.position}</div>
                        <div className="text-sm text-gray-500 mt-1">{offer.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                      <span className="text-sm text-gray-900 font-medium">{offer.salary}</span>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                      <Badge variant="outline" className="capitalize text-xs">
                        {offer.employmentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{offer.startDate}</span>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                      <Badge className={`${getStatusColor(offer.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOffer(offer)}
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(offer)}
                          className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        {offer.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendOfferLetter(offer.id)}
                            className="h-7 px-1 text-xs sm:h-8 sm:px-2"
                          >
                            <Send className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Send</span>
                          </Button>
                        )}
                        {offer.candidateId && offer.candidateId !== '' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHireCandidate(offer)}
                            className="h-7 px-1 text-xs sm:h-8 sm:px-2 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Hire</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Offer Letter Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? 'Edit Offer Letter' : 'Create Offer Letter'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="candidateName">Candidate Name</Label>
                <Input
                  id="candidateName"
                  value={formData.candidateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="candidateEmail">Candidate Email</Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="e.g., 15-20 LPA"
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, employmentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="template">Template</Label>
              <Select value={formData.template} onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.template && (
              <div>
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {generatePreview(formData.template, formData)}
                  </pre>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="customTerms">Custom Terms (Optional)</Label>
              <Textarea
                id="customTerms"
                value={formData.customTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, customTerms: e.target.value }))}
                rows={4}
                placeholder="Add any custom terms or conditions..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingOffer}>
                {isSubmittingOffer
                  ? editingOffer
                    ? 'Updating...'
                    : 'Creating...'
                  : `${editingOffer ? 'Update' : 'Create'} Offer Letter`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Management Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>Manage Offer Letter Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Available Templates</h3>
              <Button onClick={() => {
                resetTemplateForm();
                setIsAddTemplateDialogOpen(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Add New Template
              </Button>
            </div>
            
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Variables: {Array.isArray(template.variables) ? template.variables.join(', ') : JSON.parse(template.variables || '[]').join(', ')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Label className="text-sm font-medium">Template Preview</Label>
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto mt-2">
                        <pre className="whitespace-pre-wrap text-xs">
                          {template.content}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Template Dialog */}
      <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Offer, Senior Management Offer"
                required
              />
            </div>

            <div>
              <Label htmlFor="templateContent">Template Content</Label>
              <Textarea
                id="templateContent"
                value={templateFormData.content}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your template content. Use {{variableName}} for variables like {{candidateName}}, {{position}}, etc."
                rows={12}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use double curly braces {"{{variableName}}"} or parentheses {"(variableName)"} for variables like {"{{candidateName}}"}, {"(position)"}, {"{{department}}"}, etc.
              </p>
            </div>

            {templateFormData.content && (
              <div>
                <Label>Detected Variables</Label>
                <div className="border rounded-lg p-3 bg-gray-50 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Extract variables from template content - support both {{variable}} and (variable) formats
                      const curlyBraceMatches = templateFormData.content.match(/\{\{([^}]+)\}\}/g);
                      const parenthesisMatches = templateFormData.content.match(/\(([^)]+)\)/g);
                      
                      const curlyVariables = curlyBraceMatches ? curlyBraceMatches.map(v => v.replace(/[{}]/g, '')) : [];
                      const parenthesisVariables = parenthesisMatches ? parenthesisMatches.map(v => v.replace(/[()]/g, '')) : [];
                      
                      // Combine and deduplicate variables
                      const allVariables = [...new Set([...curlyVariables, ...parenthesisVariables])];
                      
                      return allVariables.length > 0 ? (
                        allVariables.map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No variables detected</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={templateFormData.is_default}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isDefault">Set as default template</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingTemplate}>
                {isSubmittingTemplate
                  ? editingTemplate
                    ? 'Updating...'
                    : 'Creating...'
                  : `${editingTemplate ? 'Update' : 'Create'} Template`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Offer Preview Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offer Letter Preview</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Candidate Name</Label>
                  <p className="font-medium">{selectedOffer.candidateName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedOffer.candidateEmail}</p>
                </div>
                <div>
                  <Label>Position</Label>
                  <p className="font-medium">{selectedOffer.position}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="font-medium">{selectedOffer.department}</p>
                </div>
                <div>
                  <Label>Salary</Label>
                  <p className="font-medium">{selectedOffer.salary}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="font-medium">{selectedOffer.startDate}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="font-medium">{selectedOffer.location}</p>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <p className="font-medium capitalize">{selectedOffer.employmentType}</p>
                </div>
              </div>

              <div>
                <Label>Offer Letter Content</Label>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto mt-2">
                  <pre className="whitespace-pre-wrap text-sm">
                    {generatePreview(selectedOffer.template, selectedOffer)}
                  </pre>
                </div>
              </div>

              {selectedOffer.customTerms && (
                <div>
                  <Label>Custom Terms</Label>
                  <p className="text-sm mt-1">{selectedOffer.customTerms}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                {selectedOffer.status === 'draft' && (
                  <Button onClick={() => sendOfferLetter(selectedOffer.id)}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Offer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};

export default HROfferLetters;



// import React from 'react';
// import { Layout } from '@/components/Layout';
// import { Card, CardContent } from '@/components/ui/card';
// import { Clock } from 'lucide-react';

// const HRRequirements: React.FC = () => {
//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 space-y-6">
//         <div className="flex flex-col items-center justify-center min-h-[60vh]">
//           <Card className="max-w-md w-full text-center p-8">
//             <CardContent className="space-y-4">
//               <div className="flex justify-center">
//                 <div className="bg-blue-100 p-4 rounded-full">
//                   <Clock className="w-12 h-12 text-blue-600" />
//                 </div>
//               </div>
//               <div>
//                 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
//                   Coming Soon
//                 </h1>
//                 <p className="text-gray-600 text-sm sm:text-base">
//                   We're working hard to bring you the HR Requirements feature. 
//                   This module will help you manage job postings and recruitment requirements efficiently.
//                 </p>
//                 <p className="text-gray-500 text-sm mt-2">
//                   Stay tuned for updates!
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default HRRequirements;
