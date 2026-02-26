import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase, 
  Users, 
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import ENDPOINTS from '@/lib/endpoint';

interface JobRequirement {
  id: string;
  title: string;
  department: string;
  location: string;
  experience: string;
  salary: string;
  description: string;
  status: 'active' | 'closed' | 'on-hold' | 'draft';
  positions: number;
  filled_positions: number;
  urgency: 'low' | 'medium' | 'high';
  closing_date?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  qualifications?: string;
  responsibilities?: string;
  benefits?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

const HRRequirements: React.FC = () => {
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<JobRequirement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    experience: '',
    salary: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    qualifications: '',
    responsibilities: '',
    benefits: '',
    positions: 1,
    urgency: 'medium' as 'low' | 'medium' | 'high',
    closing_date: '',
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<JobRequirement | null>(null);
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false);
  const [isUpdatingRequirement, setIsUpdatingRequirement] = useState(false);
  const [isUpdatingRequirementStatus, setIsUpdatingRequirementStatus] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    status: 'active' as 'active' | 'closed' | 'on-hold' | 'draft'
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    department: '',
    location: '',
    experience: '',
    salary: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    qualifications: '',
    responsibilities: '',
    benefits: '',
    positions: 1,
    urgency: 'medium' as 'low' | 'medium' | 'high',
    closing_date: '',
    status: 'active' as 'active' | 'closed' | 'on-hold' | 'draft'
  });

  useEffect(() => {
    fetchJobRequirements();
  }, []);

  const fetchJobRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ENDPOINTS.getJobRequirements();
      
      if (response.data.success) {
        // Parse JSON fields for each requirement
        const processedData = response.data.data.map((req: any) => ({
          ...req,
          required_skills: req.required_skills ? JSON.parse(req.required_skills) : [],
          preferred_skills: req.preferred_skills ? JSON.parse(req.preferred_skills) : [],
        }));
        setRequirements(processedData);
      } else {
        setError('Failed to fetch job requirements');
      }
    } catch (err) {
      console.error('Error fetching job requirements:', err);
      setError('Failed to fetch job requirements');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (requirement: JobRequirement) => {
    setEditingRequirement(requirement);
    setStatusFormData({ status: requirement.status });
    setStatusDialogOpen(true);
  };

  const handleEdit = (requirement: JobRequirement) => {
    setEditingRequirement(requirement);
    setEditFormData({
      title: requirement.title,
      department: requirement.department,
      location: requirement.location,
      experience: requirement.experience,
      salary: requirement.salary,
      description: requirement.description,
      required_skills: requirement.required_skills ? requirement.required_skills.join(', ') : '',
      preferred_skills: requirement.preferred_skills ? requirement.preferred_skills.join(', ') : '',
      qualifications: requirement.qualifications || '',
      responsibilities: requirement.responsibilities || '',
      benefits: requirement.benefits || '',
      positions: requirement.positions,
      urgency: requirement.urgency,
      closing_date: requirement.closing_date || '',
      status: requirement.status
    });
    setEditDialogOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequirement) return;

    setIsUpdatingRequirement(true);
    try {
      const submitData = {
        ...editFormData,
        required_skills: editFormData.required_skills ? editFormData.required_skills.split(',').map(req => req.trim()).filter(req => req) : [],
        preferred_skills: editFormData.preferred_skills ? editFormData.preferred_skills.split(',').map(req => req.trim()).filter(req => req) : [],
      };

      const response = await ENDPOINTS.updateJobRequirement(editingRequirement.id, submitData);

      if (response.data.success) {
        setEditDialogOpen(false);
        setEditingRequirement(null);
        fetchJobRequirements(); // Refresh the list
      } else {
        setError('Failed to update job requirement');
      }
    } catch (err) {
      console.error('Error updating job requirement:', err);
      setError('Failed to update job requirement');
    } finally {
      setIsUpdatingRequirement(false);
    }
  };

  const submitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequirement) return;

    setIsUpdatingRequirementStatus(true);
    try {
      const response = await ENDPOINTS.updateJobRequirement(editingRequirement.id, {
        status: statusFormData.status
      });

      if (response.data.success) {
        setStatusDialogOpen(false);
        setEditingRequirement(null);
        fetchJobRequirements(); // Refresh the list
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setIsUpdatingRequirementStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreatingRequirement(true);
    try {
      const submitData = {
        ...formData,
        required_skills: formData.required_skills ? formData.required_skills.split(',').map(req => req.trim()).filter(req => req) : [],
        preferred_skills: formData.preferred_skills ? formData.preferred_skills.split(',').map(req => req.trim()).filter(req => req) : [],
      };

      const response = await ENDPOINTS.createJobRequirement(submitData);
      
      if (response.data.success) {
        // Reset form and refresh data
        setFormData({
          title: '',
          department: '',
          location: '',
          experience: '',
          salary: '',
          description: '',
          required_skills: '',
          preferred_skills: '',
          qualifications: '',
          responsibilities: '',
          benefits: '',
          positions: 1,
          urgency: 'medium',
          closing_date: '',
        });
        setIsDialogOpen(false);
        fetchJobRequirements(); // Refresh the list
      } else {
        setError('Failed to create job requirement');
      }
    } catch (err) {
      console.error('Error creating job requirement:', err);
      setError('Failed to create job requirement');
    } finally {
      setIsCreatingRequirement(false);
    }
  };

  const filteredRequirements = requirements.filter(requirement => {
    const matchesSearch = requirement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         requirement.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         requirement.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || requirement.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return requirements.filter(r => r.status === status).length;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Job Requirements</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage job postings and requirements</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Job Requirement
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setError(null);
                        fetchJobRequirements();
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading job requirements...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Positions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{requirements.reduce((sum, r) => sum + r.positions, 0)}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{getStatusCount('active')}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Filled Positions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{requirements.reduce((sum, r) => sum + r.filled_positions, 0)}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Draft</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{getStatusCount('draft')}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-purple-600" />
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
                <Label htmlFor="search">Search Requirements</Label>
                <Input
                  id="search"
                  placeholder="Search by title, department, or location..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Job Requirements</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-4">
              {filteredRequirements.map((requirement) => (
                <Card key={requirement.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{requirement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{requirement.department}</p>
                        <p className="text-xs text-gray-500 mt-1">{requirement.urgency}</p>
                      </div>
                      <Badge className={`${getStatusColor(requirement.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                        {requirement.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Location</span>
                        <span className="text-sm text-gray-900">{requirement.location}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Experience</span>
                        <span className="text-sm text-gray-900">{requirement.experience}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Positions</span>
                        <span className="text-sm text-gray-900">{requirement.filled_positions}/{requirement.positions}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Posted</span>
                        <span className="text-sm text-gray-900">{new Date(requirement.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequirement(requirement)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(requirement)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                    <TableHead className="min-w-[200px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</TableHead>
                    <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Department</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Positions</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {filteredRequirements.map((requirement) => (
                    <TableRow key={requirement.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{requirement.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{requirement.urgency}</div>
                          <div className="text-xs text-gray-600 mt-1 sm:hidden">{requirement.department}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden sm:table-cell">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{requirement.department}</div>
                          <div className="text-sm text-gray-500 mt-1">{requirement.experience}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-600">{requirement.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{requirement.filled_positions}/{requirement.positions}</span>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <Badge className={`${getStatusColor(requirement.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                          {requirement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequirement(requirement)}
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(requirement)}
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Requirement Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Job Requirement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Experience Required</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 2-3 years"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g.,  - "
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="positions">Number of Positions</Label>
                  <Input
                    id="positions"
                    type="number"
                    min="1"
                    value={formData.positions}
                    onChange={(e) => setFormData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
                <Input
                  id="required_skills"
                  value={formData.required_skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, required_skills: e.target.value }))}
                  placeholder="e.g., React, TypeScript, 3+ years experience"
                />
              </div>

              <div>
                <Label htmlFor="preferred_skills">Preferred Skills (comma-separated)</Label>
                <Input
                  id="preferred_skills"
                  value={formData.preferred_skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_skills: e.target.value }))}
                  placeholder="e.g., Node.js, MongoDB, Agile"
                />
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <textarea
                  id="qualifications"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  placeholder="e.g., Bachelor's degree in Computer Science or related field"
                />
              </div>

              <div>
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <textarea
                  id="responsibilities"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                  placeholder="e.g., Develop and maintain web applications"
                />
              </div>

              <div>
                <Label htmlFor="benefits">Benefits</Label>
                <textarea
                  id="benefits"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.benefits}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="e.g., Health insurance, 401k, paid time off"
                />
              </div>

              <div>
                <Label htmlFor="closing_date">Closing Date (Optional)</Label>
                <Input
                  id="closing_date"
                  type="date"
                  value={formData.closing_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, closing_date: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingRequirement}>
                  {isCreatingRequirement ? "Creating..." : "Add Requirement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Requirement Details Dialog */}
        <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Job Details - {selectedRequirement?.title}</DialogTitle>
            </DialogHeader>
            {selectedRequirement && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <p className="text-sm">{selectedRequirement.department}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm">{selectedRequirement.location}</p>
                  </div>
                  <div>
                    <Label>Urgency</Label>
                    <p className="text-sm capitalize">{selectedRequirement.urgency}</p>
                  </div>
                  <div>
                    <Label>Experience</Label>
                    <p className="text-sm">{selectedRequirement.experience}</p>
                  </div>
                  <div>
                    <Label>Salary</Label>
                    <p className="text-sm">{selectedRequirement.salary}</p>
                  </div>
                  <div>
                    <Label>Positions</Label>
                    <p className="text-sm">{selectedRequirement.filled_positions}/{selectedRequirement.positions}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={`${getStatusColor(selectedRequirement.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                      {selectedRequirement.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Posted Date</Label>
                    <p className="text-sm">{new Date(selectedRequirement.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedRequirement.description}</p>
                </div>
                {selectedRequirement.required_skills && selectedRequirement.required_skills.length > 0 && (
                  <div>
                    <Label>Required Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequirement.required_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequirement.preferred_skills && selectedRequirement.preferred_skills.length > 0 && (
                  <div>
                    <Label>Preferred Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequirement.preferred_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequirement.qualifications && (
                  <div>
                    <Label>Qualifications</Label>
                    <p className="text-sm">{selectedRequirement.qualifications}</p>
                  </div>
                )}
                {selectedRequirement.responsibilities && (
                  <div>
                    <Label>Responsibilities</Label>
                    <p className="text-sm">{selectedRequirement.responsibilities}</p>
                  </div>
                )}
                {selectedRequirement.benefits && (
                  <div>
                    <Label>Benefits</Label>
                    <p className="text-sm">{selectedRequirement.benefits}</p>
                  </div>
                )}
                {selectedRequirement.closing_date && (
                  <div>
                    <Label>Closing Date</Label>
                    <p className="text-sm">{new Date(selectedRequirement.closing_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Requirement Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Job Requirement - {editingRequirement?.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Job Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select value={editFormData.department} onValueChange={(value) => setEditFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-urgency">Urgency</Label>
                  <Select value={editFormData.urgency} onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-experience">Experience Required</Label>
                  <Input
                    id="edit-experience"
                    value={editFormData.experience}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 2-3 years"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-salary">Salary Range</Label>
                  <Input
                    id="edit-salary"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g.,  - "
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-positions">Number of Positions</Label>
                  <Input
                    id="edit-positions"
                    type="number"
                    min="1"
                    value={editFormData.positions}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-closing_date">Closing Date (Optional)</Label>
                  <Input
                    id="edit-closing_date"
                    type="date"
                    value={editFormData.closing_date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, closing_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Job Description</Label>
                <textarea
                  id="edit-description"
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-required_skills">Required Skills (comma-separated)</Label>
                <Input
                  id="edit-required_skills"
                  value={editFormData.required_skills}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, required_skills: e.target.value }))}
                  placeholder="e.g., React, TypeScript, 3+ years experience"
                />
              </div>

              <div>
                <Label htmlFor="edit-preferred_skills">Preferred Skills (comma-separated)</Label>
                <Input
                  id="edit-preferred_skills"
                  value={editFormData.preferred_skills}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, preferred_skills: e.target.value }))}
                  placeholder="e.g., Node.js, MongoDB, Agile"
                />
              </div>

              <div>
                <Label htmlFor="edit-qualifications">Qualifications</Label>
                <textarea
                  id="edit-qualifications"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editFormData.qualifications}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  placeholder="e.g., Bachelor's degree in Computer Science or related field"
                />
              </div>

              <div>
                <Label htmlFor="edit-responsibilities">Responsibilities</Label>
                <textarea
                  id="edit-responsibilities"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editFormData.responsibilities}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                  placeholder="e.g., Develop and maintain web applications"
                />
              </div>

              <div>
                <Label htmlFor="edit-benefits">Benefits</Label>
                <textarea
                  id="edit-benefits"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editFormData.benefits}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="e.g., Health insurance, 401k, paid time off"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingRequirement}>
                  {isUpdatingRequirement ? "Updating..." : "Update Requirement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] mx-auto">
            <DialogHeader>
              <DialogTitle>Update Status - {editingRequirement?.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitStatusUpdate} className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={statusFormData.status} 
                  onValueChange={(value: any) => setStatusFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingRequirementStatus}>
                  {isUpdatingRequirementStatus ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>
    </Layout>
  );
};

export default HRRequirements;
